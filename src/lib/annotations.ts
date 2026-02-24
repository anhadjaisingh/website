export interface Annotation {
  id: string;
  anchor: string;
  startContext?: string;
  type: "margin" | "inline";
  note: string;
}

export interface AnnotatedSegment {
  type: "text" | "highlight";
  content: string;
  annotation?: Annotation;
}

export interface AnchorPosition {
  start: number;
  end: number;
}

/**
 * Find the position of an anchor string in text.
 * If startContext is provided, finds the anchor occurrence that appears
 * after the startContext string.
 */
export function findAnchorPosition(
  text: string,
  anchor: string,
  startContext?: string,
): AnchorPosition | null {
  if (startContext) {
    const contextIndex = text.indexOf(startContext);
    if (contextIndex === -1) return null;
    const searchFrom = contextIndex + startContext.length;
    const anchorIndex = text.indexOf(anchor, searchFrom);
    if (anchorIndex === -1) return null;
    return { start: anchorIndex, end: anchorIndex + anchor.length };
  }

  const index = text.indexOf(anchor);
  if (index === -1) return null;
  return { start: index, end: index + anchor.length };
}

/**
 * Build an array of text and highlight segments from source text and annotations.
 * Annotations are matched in order and non-overlapping.
 */
export function buildAnnotatedSegments(
  text: string,
  annotations: Annotation[],
): AnnotatedSegment[] {
  // Find positions for all annotations
  const positioned: { annotation: Annotation; start: number; end: number }[] =
    [];

  for (const ann of annotations) {
    const pos = findAnchorPosition(text, ann.anchor, ann.startContext);
    if (pos) {
      positioned.push({ annotation: ann, start: pos.start, end: pos.end });
    }
  }

  // Sort by start position
  positioned.sort((a, b) => a.start - b.start);

  // Remove overlapping annotations (keep earlier one)
  const filtered: typeof positioned = [];
  let lastEnd = 0;
  for (const p of positioned) {
    if (p.start >= lastEnd) {
      filtered.push(p);
      lastEnd = p.end;
    }
  }

  // Build segments
  if (filtered.length === 0) {
    return [{ type: "text", content: text }];
  }

  const segments: AnnotatedSegment[] = [];
  let cursor = 0;

  for (const p of filtered) {
    if (p.start > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, p.start) });
    }
    segments.push({
      type: "highlight",
      content: text.slice(p.start, p.end),
      annotation: p.annotation,
    });
    cursor = p.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}
