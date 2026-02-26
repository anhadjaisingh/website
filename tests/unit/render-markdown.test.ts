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

  it("renders links with target=_blank", () => {
    const result = renderAnnotationMarkdown("[YC](https://ycombinator.com)");
    expect(result).toContain('href="https://ycombinator.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain("YC");
  });

  it("blocks javascript: URIs in links", () => {
    const result = renderAnnotationMarkdown("[click](javascript:alert(1))");
    expect(result).not.toContain("href");
    expect(result).toContain("click");
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
