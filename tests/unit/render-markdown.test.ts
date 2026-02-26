import { describe, it, expect } from "vitest";
import { renderAnnotationMarkdown } from "../../src/lib/render-markdown";

describe("renderAnnotationMarkdown", () => {
  it("renders plain text as-is (wrapped in <p>)", () => {
    const result = renderAnnotationMarkdown("Hello world");
    expect(result).toContain("Hello world");
  });

  it("renders bold text", () => {
    const result = renderAnnotationMarkdown("This is **bold** text");
    expect(result).toContain("<strong>bold</strong>");
  });

  it("renders links", () => {
    const result = renderAnnotationMarkdown("[YC](https://ycombinator.com)");
    expect(result).toContain('href="https://ycombinator.com"');
    expect(result).toContain("YC");
  });

  it("renders images", () => {
    const result = renderAnnotationMarkdown(
      "![alt text](https://example.com/img.png)",
    );
    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/img.png"');
  });

  it("renders inline code", () => {
    const result = renderAnnotationMarkdown("Use `console.log` here");
    expect(result).toContain("<code>console.log</code>");
  });
});
