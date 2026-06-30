import { describe, expect, it } from "vitest";
import { formatMessage, getMessages, isLocale } from "./index";

describe("i18n", () => {
  it("formats message placeholders", () => {
    expect(formatMessage("Hello {name}, {count} online", { name: "Signal", count: 42 })).toBe("Hello Signal, 42 online");
  });

  it("validates locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("loads both catalogs", () => {
    expect(getMessages("en").meta.title).toBe("SIGNAL");
    expect(getMessages("ru").meta.title).toBeTruthy();
  });
});
