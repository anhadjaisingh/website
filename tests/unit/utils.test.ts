import { describe, it, expect } from "vitest";
import { formatDate, estimateReadingTime } from "../../src/lib/utils";

describe("formatDate", () => {
  it("formats a date in US English", () => {
    const date = new Date("2026-02-24");
    const result = formatDate(date);
    expect(result).toContain("2026");
    expect(result).toContain("February");
    expect(result).toContain("24");
  });
});

describe("estimateReadingTime", () => {
  it("estimates reading time based on 200 wpm", () => {
    const words = Array(400).fill("word").join(" ");
    expect(estimateReadingTime(words)).toBe(2);
  });

  it("rounds up partial minutes", () => {
    const words = Array(250).fill("word").join(" ");
    expect(estimateReadingTime(words)).toBe(2);
  });
});
