import { describe, it, expect } from "vitest";
import { generateSlug } from "../../src/lib/article-fetcher";

describe("generateSlug", () => {
  it("converts a title to a URL-safe slug", () => {
    expect(generateSlug("Do Things That Don't Scale")).toBe(
      "do-things-that-dont-scale",
    );
  });

  it("handles special characters", () => {
    expect(generateSlug("Hello, World! (2026)")).toBe("hello-world-2026");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---test---")).toBe("test");
  });

  it("returns 'untitled' for empty string", () => {
    expect(generateSlug("")).toBe("untitled");
  });
});
