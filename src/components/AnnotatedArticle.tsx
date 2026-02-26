import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  buildAnnotatedSegments,
  type Annotation,
  type AnnotatedSegment,
} from "../lib/annotations";
import { renderAnnotationMarkdown } from "../lib/render-markdown";
import AnnotationForm from "./AnnotationForm";

function MarkdownNote({ content }: { content: string }) {
  const html = useMemo(() => renderAnnotationMarkdown(content), [content]);
  return (
    <span
      className="annotation-note-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface Props {
  /** The full source article text (plain text extracted from HTML) */
  sourceHtml: string;
  /** Array of annotations to overlay on the text */
  annotations: Annotation[];
  /** Whether the component is running in dev mode (enables authoring UI) */
  devMode?: boolean;
  /** The article slug (needed for API calls) */
  slug?: string;
}

function MarginNote({
  annotation,
  anchorRef,
}: {
  annotation: Annotation;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const containerRect = anchorRef.current
        .closest(".annotated-article")
        ?.getBoundingClientRect();
      if (containerRect) {
        setTop(rect.top - containerRect.top);
      }
    }
  }, [anchorRef]);

  return (
    <div
      className="absolute right-0 translate-x-[calc(100%+1.5rem)] w-48 text-sm text-stone-600 dark:text-stone-400 hidden xl:block"
      style={{ top: `${top}px` }}
    >
      <div className="border-l-2 border-accent/30 pl-3 py-1">
        <MarkdownNote content={annotation.note} />
      </div>
    </div>
  );
}

function MobilePopover({
  annotation,
  onClose,
}: {
  annotation: Annotation;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 mb-2 p-3 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-sm xl:hidden">
      <div className="flex justify-between items-start gap-2">
        <span className="text-stone-700 dark:text-stone-300">
          <MarkdownNote content={annotation.note} />
        </span>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0"
          aria-label="Close annotation"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function HighlightedText({
  segment,
  editMode,
  onEdit,
  onDelete,
}: {
  segment: AnnotatedSegment & { type: "highlight" };
  editMode?: boolean;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotation: Annotation) => void;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);

  if (!segment.annotation) return <>{segment.content}</>;

  const handleClick = () => {
    // In edit mode, clicking highlight should NOT toggle popover
    if (editMode) return;
    setShowPopover(!showPopover);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      if (editMode) return;
      setShowPopover(!showPopover);
    }
  };

  return (
    <>
      <mark
        ref={anchorRef}
        className="bg-amber-100 dark:bg-amber-900/40 text-inherit cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors rounded-sm px-0.5 -mx-0.5 relative"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Annotation: ${segment.annotation.note.slice(0, 50)}...`}
        onKeyDown={handleKeyDown}
      >
        {segment.content}
        {editMode && segment.annotation && (
          <span className="inline-flex gap-0.5 ml-1 align-middle">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(segment.annotation!);
              }}
              className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs leading-none"
              aria-label="Edit annotation"
              title="Edit annotation"
            >
              &#9998;
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(segment.annotation!);
              }}
              className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-500 hover:bg-red-600 text-white text-xs leading-none"
              aria-label="Delete annotation"
              title="Delete annotation"
            >
              &times;
            </button>
          </span>
        )}
      </mark>
      {segment.annotation.type === "margin" && (
        <MarginNote annotation={segment.annotation} anchorRef={anchorRef} />
      )}
      {showPopover && segment.annotation.type === "margin" && (
        <MobilePopover
          annotation={segment.annotation}
          onClose={() => setShowPopover(false)}
        />
      )}
      {showPopover && segment.annotation.type === "inline" && (
        <div className="block mt-3 mb-3 p-4 bg-stone-50 dark:bg-stone-800/50 border-l-4 border-accent/50 rounded-r-lg text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <MarkdownNote content={segment.annotation.note} />
        </div>
      )}
    </>
  );
}

function AnnotatedParagraph({
  paragraphHtml,
  annotations,
  editMode,
  onEdit,
  onDelete,
}: {
  paragraphHtml: string;
  annotations: Annotation[];
  editMode?: boolean;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotation: Annotation) => void;
}) {
  const segments = buildAnnotatedSegments(paragraphHtml, annotations);

  return (
    <div className="mb-4 relative leading-relaxed text-lg">
      {segments.map((segment, i) =>
        segment.type === "text" ? (
          <span key={i}>{segment.content}</span>
        ) : (
          <HighlightedText
            key={i}
            segment={segment as AnnotatedSegment & { type: "highlight" }}
            editMode={editMode}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      )}
    </div>
  );
}

export default function AnnotatedArticle({
  sourceHtml,
  annotations: initialAnnotations,
  devMode = false,
  slug,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selectedText, setSelectedText] = useState("");
  const [selectionAnchor, setSelectionAnchor] = useState("");
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  // Split source into paragraphs (by double newlines)
  const paragraphs = sourceHtml
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Text selection detection when in edit mode
  useEffect(() => {
    if (!editMode) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text) return;

      // Only capture selections within the article
      const range = selection.getRangeAt(0);
      if (articleRef.current && articleRef.current.contains(range.commonAncestorContainer)) {
        setSelectedText(text);
        setSelectionAnchor(text);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [editMode]);

  // Save annotations to the API
  const saveAnnotations = useCallback(
    async (updated: Annotation[]) => {
      if (!slug) return;
      try {
        await fetch("/api/annotations/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, annotations: updated }),
        });
      } catch (err) {
        console.error("Failed to save annotations:", err);
      }
    },
    [slug],
  );

  // Handle creating a new annotation
  const handleNewAnnotation = useCallback(
    (type: "margin" | "inline", note: string) => {
      const newAnnotation: Annotation = {
        id: `a${Date.now()}`,
        anchor: selectionAnchor,
        type,
        note,
      };
      const updated = [...annotations, newAnnotation];
      setAnnotations(updated);
      saveAnnotations(updated);
      setSelectedText("");
      setSelectionAnchor("");
    },
    [annotations, selectionAnchor, saveAnnotations],
  );

  // Handle editing an existing annotation
  const handleEditAnnotation = useCallback(
    (type: "margin" | "inline", note: string) => {
      if (!editingAnnotation) return;
      const updated = annotations.map((a) =>
        a.id === editingAnnotation.id ? { ...a, type, note } : a,
      );
      setAnnotations(updated);
      saveAnnotations(updated);
      setEditingAnnotation(null);
    },
    [annotations, editingAnnotation, saveAnnotations],
  );

  // Handle deleting an annotation
  const handleDeleteAnnotation = useCallback(
    async (annotation: Annotation) => {
      if (!confirm(`Delete this annotation?\n\n"${annotation.anchor}"`)) return;
      const updated = annotations.filter((a) => a.id !== annotation.id);
      setAnnotations(updated);
      if (slug) {
        try {
          await fetch("/api/annotations/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, id: annotation.id }),
          });
        } catch (err) {
          console.error("Failed to delete annotation:", err);
        }
      }
    },
    [annotations, slug],
  );

  return (
    <div className="annotated-article relative" ref={articleRef}>
      {/* Edit mode toggle — only shown in dev mode */}
      {devMode && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSelectedText("");
              setSelectionAnchor("");
              setEditingAnnotation(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              editMode
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
            }`}
          >
            {editMode ? "Exit Edit Mode" : "Edit Annotations"}
          </button>
          {editMode && (
            <span className="text-sm text-stone-500 dark:text-stone-400">
              Select text to add an annotation
            </span>
          )}
        </div>
      )}

      {paragraphs.map((para, i) => (
        <AnnotatedParagraph
          key={i}
          paragraphHtml={para}
          annotations={annotations}
          editMode={editMode}
          onEdit={(annotation) => setEditingAnnotation(annotation)}
          onDelete={handleDeleteAnnotation}
        />
      ))}

      {/* Annotation form for new annotations */}
      {editMode && selectedText && !editingAnnotation && (
        <AnnotationForm
          selectedText={selectedText}
          onSave={(type, note) => handleNewAnnotation(type, note)}
          onCancel={() => {
            setSelectedText("");
            setSelectionAnchor("");
          }}
        />
      )}

      {/* Annotation form for editing existing annotations */}
      {editMode && editingAnnotation && (
        <AnnotationForm
          selectedText={editingAnnotation.anchor}
          existingAnnotation={editingAnnotation}
          onSave={(type, note) => handleEditAnnotation(type, note)}
          onCancel={() => setEditingAnnotation(null)}
        />
      )}
    </div>
  );
}
