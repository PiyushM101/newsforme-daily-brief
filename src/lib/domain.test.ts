import { describe, expect, it } from "vitest";
import { ABOUT_TEMPLATE, MIN_ABOUT, aboutLength, cleanDomain, formatHour } from "./domain";

describe("cleanDomain", () => {
  it("strips protocol, www and path, and lowercases", () => {
    expect(cleanDomain("https://www.Reuters.com/world/us")).toBe("reuters.com");
  });
  it("keeps subdomains other than www", () => {
    expect(cleanDomain("news.ycombinator.com")).toBe("news.ycombinator.com");
  });
  it("rejects things that are not domains", () => {
    expect(cleanDomain("reuters")).toBeNull();
    expect(cleanDomain("hello world.com")).toBeNull();
  });
});

describe("formatHour", () => {
  it("shows 12-hour times", () => {
    expect(formatHour(0)).toBe("12:00 AM");
    expect(formatHour(8)).toBe("8:00 AM");
    expect(formatHour(12)).toBe("12:00 PM");
    expect(formatHour(19)).toBe("7:00 PM");
  });
});

describe("aboutLength", () => {
  it("counts what the person wrote", () => {
    expect(aboutLength("  I lead product at a payments startup.  ")).toBe(37);
  });
  it("ignores hints left inside brackets", () => {
    expect(aboutLength("Industry: [Fintech; E-commerce]")).toBe(9);
  });
  it("leaves the untouched template short of the minimum", () => {
    expect(aboutLength(ABOUT_TEMPLATE)).toBeLessThan(MIN_ABOUT);
  });
  it("accepts a filled in template", () => {
    const filled = ABOUT_TEMPLATE.replace(/\[[^\]]*\]/g, "a".repeat(70));
    expect(aboutLength(filled)).toBeGreaterThanOrEqual(MIN_ABOUT);
  });
});
