import { describe, expect, it } from "vitest";
import { filterChannelTags, getChannelFrequency, getPopularChannelTags } from "@/lib/channels/tags";

describe("channel tags", () => {
  it("filters tags by localized query", () => {
    const results = filterChannelTags("кино", "ru");
    expect(results.some((tag) => tag.id === "cinema")).toBe(true);
  });

  it("returns curated top topics", () => {
    const popular = getPopularChannelTags(10);
    expect(popular).toHaveLength(10);
    expect(popular[0]?.id).toBe("relationships");
    expect(popular.some((tag) => tag.id === "music")).toBe(true);
    expect(popular.some((tag) => tag.id === "construction")).toBe(false);
  });

  it("sorts popular topics by live stats", () => {
    const popular = getPopularChannelTags(10, { music: 12, relationships: 3, cinema: 20 });
    expect(popular[0]?.id).toBe("cinema");
  });

  it("builds a channel frequency", () => {
    const frequency = getChannelFrequency("music", "en");
    expect(frequency?.kind).toBe("channel");
    expect(frequency?.channelLabel).toBe("Music");
    expect(frequency?.meshNode).toBe("soft");
  });
});
