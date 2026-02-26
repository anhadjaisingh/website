import { useState, useRef, useEffect } from "react";
import {
  buildAnnotatedSegments,
  type Annotation,
  type AnnotatedSegment,
} from "../lib/annotations";
import { renderAnnotationMarkdown } from "../lib/render-markdown";

function MarkdownNote({ content }: { content: string }) {
  const html = renderAnnotationMarkdown(content);
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
}: {
  segment: AnnotatedSegment & { type: "highlight" };
}) {
  const [showPopover, setShowPopover] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);

  if (!segment.annotation) return <>{segment.content}</>;

  return (
    <>
      <mark
        ref={anchorRef}
        className="bg-amber-100 dark:bg-amber-900/40 text-inherit cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors rounded-sm px-0.5 -mx-0.5 relative"
        onClick={() => setShowPopover(!showPopover)}
        role="button"
        tabIndex={0}
        aria-label={`Annotation: ${segment.annotation.note.slice(0, 50)}...`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowPopover(!showPopover);
        }}
      >
        {segment.content}
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
}: {
  paragraphHtml: string;
  annotations: Annotation[];
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
          />
        ),
      )}
    </div>
  );
}

export default function AnnotatedArticle({ sourceHtml, annotations }: Props) {
  // Split source into paragraphs (by double newlines)
  const paragraphs = sourceHtml
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="annotated-article relative">
      {paragraphs.map((para, i) => (
        <AnnotatedParagraph
          key={i}
          paragraphHtml={para}
          annotations={annotations}
        />
      ))}
    </div>
  );
}
