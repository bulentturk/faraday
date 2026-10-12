import { describe, expect, it } from "vitest";
import {
  GUILD_STORY,
  SECRET_LINES,
  remainingForNext,
  requiredArtifacts,
  secretLineFor,
  unlockedFragments,
} from "./index";

describe("lonca hikâyesi", () => {
  it("altı parçadan oluşur ve parçalar benzersizdir", () => {
    expect(GUILD_STORY.length).toBe(6);
    expect(new Set(GUILD_STORY.map((f) => f.id)).size).toBe(6);
  });

  it("eser sayısına göre parça açar", () => {
    expect(unlockedFragments(0).length).toBe(1);
    expect(unlockedFragments(2).length).toBe(2);
    expect(unlockedFragments(10).length).toBe(6);
    expect(requiredArtifacts(3)).toBe(6);
  });

  it("bir sonraki parçaya kalanı bildirir", () => {
    expect(remainingForNext(0)).toBe(2);
    expect(remainingForNext(3)).toBe(1);
    expect(remainingForNext(10)).toBe(0);
  });

  it("gizli satır deterministiktir ve listeden gelir", () => {
    expect(secretLineFor("MSRHNBA")).toBe(secretLineFor("MSRHNBA"));
    expect(SECRET_LINES).toContain(secretLineFor("MSRHNBA"));
  });
});
