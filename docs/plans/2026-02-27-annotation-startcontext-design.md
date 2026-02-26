# Auto-capture startContext for Annotations

## Problem

When a user selects text to annotate, only the selected text (`anchor`) is saved. If the same text appears multiple times in the article, the annotation always matches the first occurrence. The `startContext` field exists in the data model for disambiguation but is never auto-populated — users must hand-edit YAML.

## Design

Always capture `startContext` when creating a new annotation via the UI.

### How it works

1. When the user selects text in edit mode, the `handleMouseUp` handler already has access to the `Range` object from `window.getSelection()`
2. Walk up from the range's start container to find the paragraph-level `<div>` (rendered by `AnnotatedParagraph`)
3. Extract the paragraph's full text content, take the substring from the start of the paragraph up to where the selection begins
4. Use the last ~30 characters of that preceding text as `startContext`
5. If the selection starts at the beginning of the paragraph (no preceding text), omit `startContext`

### What changes

- **`AnnotatedArticle.tsx`**: Capture preceding paragraph text alongside `selectedText` in the selection handler. Include it as `startContext` in `handleNewAnnotation`.

### What doesn't change

- `findAnchorPosition()` — already handles `startContext`
- `Annotation` interface — `startContext` is already optional
- YAML format — no schema change
- Existing annotations — continue to work with or without `startContext`
- Edit flow — editing preserves existing `startContext`

## Implementation

1. Add `selectedContext` state alongside `selectedText`
2. In `handleMouseUp`, compute the preceding text from the paragraph container
3. In `handleNewAnnotation`, include `startContext: selectedContext` when non-empty
4. Add unit test for the context extraction logic
5. Verify with Playwright that annotations still render correctly
