import { useState, useEffect } from "react";
import type { Annotation } from "../lib/annotations";

interface AnnotationFormProps {
  selectedText: string;
  existingAnnotation?: Annotation;
  onSave: (type: "margin" | "inline", note: string) => void;
  onCancel: () => void;
}

export default function AnnotationForm({
  selectedText,
  existingAnnotation,
  onSave,
  onCancel,
}: AnnotationFormProps) {
  const [type, setType] = useState<"margin" | "inline">(
    existingAnnotation?.type ?? "margin",
  );
  const [note, setNote] = useState(existingAnnotation?.note ?? "");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onSave(type, note.trim());
  };

  const truncated =
    selectedText.length > 80 ? selectedText.slice(0, 80) + "..." : selectedText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 p-6"
      >
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
          {existingAnnotation ? "Edit Annotation" : "New Annotation"}
        </h3>

        {/* Selected text preview */}
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
          <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
            Highlighted text
          </p>
          <p className="text-sm text-stone-700 dark:text-stone-300 italic">
            &ldquo;{truncated}&rdquo;
          </p>
        </div>

        {/* Type toggle */}
        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Annotation type
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="annotation-type"
                value="margin"
                checked={type === "margin"}
                onChange={() => setType("margin")}
                className="accent-amber-500"
              />
              <span className="text-sm text-stone-600 dark:text-stone-400">
                Margin note
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="annotation-type"
                value="inline"
                checked={type === "inline"}
                onChange={() => setType("inline")}
                className="accent-amber-500"
              />
              <span className="text-sm text-stone-600 dark:text-stone-400">
                Inline note
              </span>
            </label>
          </div>
        </fieldset>

        {/* Note textarea */}
        <div className="mb-4">
          <label
            htmlFor="annotation-note"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
          >
            Note (Markdown supported)
          </label>
          <textarea
            id="annotation-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your annotation note here... Markdown is supported."
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-y"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!note.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {existingAnnotation ? "Save Changes" : "Add Annotation"}
          </button>
        </div>
      </form>
    </div>
  );
}
