import { describe, it, expect } from "vitest";
import {
  findAnchorPosition,
  buildAnnotatedSegments,
  type Annotation,
} from "../../src/lib/annotations";

describe("findAnchorPosition", () => {
  it("finds a simple text match", () => {
    const text = "The quick brown fox jumps over the lazy dog.";
    const result = findAnchorPosition(text, "brown fox");
    expect(result).toEqual({ start: 10, end: 19 });
  });

  it("returns null for no match", () => {
    const text = "The quick brown fox.";
    const result = findAnchorPosition(text, "red cat");
    expect(result).toBeNull();
  });

  it("finds first occurrence by default", () => {
    const text = "foo bar foo bar foo";
    const result = findAnchorPosition(text, "foo");
    expect(result).toEqual({ start: 0, end: 3 });
  });

  it("uses startContext to disambiguate", () => {
    const text = "foo bar foo baz foo";
    const result = findAnchorPosition(text, "foo", "baz");
    expect(result).toEqual({ start: 16, end: 19 });
  });

  it("handles startContext that appears before anchor", () => {
    const text = "alpha beta gamma delta beta epsilon";
    const result = findAnchorPosition(text, "beta", "delta");
    expect(result).toEqual({ start: 23, end: 27 });
  });
});

describe("buildAnnotatedSegments", () => {
  it("returns full text as plain when no annotations", () => {
    const result = buildAnnotatedSegments("Hello world", []);
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });

  it("splits text around a single annotation", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "brown fox", type: "margin", note: "Nice!" },
    ];
    const result = buildAnnotatedSegments(
      "The quick brown fox jumps.",
      annotations,
    );
    expect(result).toEqual([
      { type: "text", content: "The quick " },
      {
        type: "highlight",
        content: "brown fox",
        annotation: annotations[0],
      },
      { type: "text", content: " jumps." },
    ]);
  });

  it("handles multiple non-overlapping annotations", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "quick", type: "margin", note: "Speed!" },
      { id: "a2", anchor: "lazy", type: "inline", note: "Slow!" },
    ];
    const result = buildAnnotatedSegments(
      "The quick brown fox jumps over the lazy dog.",
      annotations,
    );
    expect(result.length).toBe(5);
    expect(result[1]).toEqual({
      type: "highlight",
      content: "quick",
      annotation: annotations[0],
    });
    expect(result[3]).toEqual({
      type: "highlight",
      content: "lazy",
      annotation: annotations[1],
    });
  });

  it("skips annotations with no match in text", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "nonexistent", type: "margin", note: "Ghost" },
    ];
    const result = buildAnnotatedSegments("Hello world", annotations);
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });
});
