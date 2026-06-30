import { describe, expect, it } from "vitest";
import { moderateMessage } from "./moderation";

describe("moderateMessage", () => {
  it("allows neutral text", () => {
    expect(moderateMessage("hello there", "en").status).toBe("allow");
  });

  it("blocks sexual content in English", () => {
    const result = moderateMessage("send nudes", "en");
    expect(result.status).toBe("block");
    expect(result.category).toBe("sexual");
  });

  it("blocks harassment in Russian", () => {
    const result = moderateMessage("ты идиот", "ru");
    expect(result.status).toBe("block");
    expect(result.category).toBe("harassment");
  });

  it("warns on contact details with masked text", () => {
    const result = moderateMessage("write me at test@example.com", "en");
    expect(result.status).toBe("warn");
    expect(result.maskedText).not.toContain("test@example.com");
  });
});
