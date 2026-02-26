import { Marked } from "marked";

/**
 * Render a markdown string to HTML for use in annotation notes.
 * Links open in new tabs. Output is synchronous.
 */

const annotationMarked = new Marked({
  renderer: {
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${text}</a>`;
    },
    image({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<img src="${href}" alt="${text}"${titleAttr} class="rounded mt-2 mb-2 max-w-full" />`;
    },
  },
});

export function renderAnnotationMarkdown(markdown: string): string {
  return annotationMarked.parse(markdown, { async: false }) as string;
}
