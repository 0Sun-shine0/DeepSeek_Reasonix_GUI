// Tests for input validators — security boundary
import { describe, it, expect } from "vitest";
import {
  validateWorkspaceDir,
  validateNotepadName,
  validatePathAbsolute,
  validatePathWithinWorkspace,
  validateSearchQuery,
} from "../main/validators.js";

describe("validators", () => {
  describe("validateWorkspaceDir", () => {
    it("accepts absolute paths", () => {
      expect(validateWorkspaceDir("/home/user/project")).toBe(true);
    });

    it("rejects non-strings", () => {
      expect(validateWorkspaceDir(null)).toBe(false);
      expect(validateWorkspaceDir(123)).toBe(false);
      expect(validateWorkspaceDir(undefined)).toBe(false);
    });

    it("rejects empty strings", () => {
      expect(validateWorkspaceDir("")).toBe(false);
    });

    it("rejects path traversal attempts", () => {
      expect(validateWorkspaceDir("/home/user/../../../etc")).toBe(false);
    });

    it("rejects paths with null bytes", () => {
      expect(validateWorkspaceDir("/home/user\0hidden")).toBe(false);
    });
  });

  describe("validateNotepadName", () => {
    it("accepts valid names", () => {
      expect(validateNotepadName("my-notes")).toBe(true);
      expect(validateNotepadName("api_specs")).toBe(true);
      expect(validateNotepadName("notes.v2")).toBe(true);
    });

    it("rejects names with slashes", () => {
      expect(validateNotepadName("evil/path")).toBe(false);
      expect(validateNotepadName("..\\secret")).toBe(false);
    });

    it("rejects empty names", () => {
      expect(validateNotepadName("")).toBe(false);
      expect(validateNotepadName(null)).toBe(false);
    });
  });

  describe("validatePathAbsolute", () => {
    it("accepts absolute paths", () => {
      expect(validatePathAbsolute("/home/user/file.ts")).toBe(true);
    });

    it("rejects relative paths", () => {
      expect(validatePathAbsolute("./file.ts")).toBe(false);
      expect(validatePathAbsolute("../etc/passwd")).toBe(false);
    });

    it("rejects empty", () => {
      expect(validatePathAbsolute("")).toBe(false);
      expect(validatePathAbsolute(null)).toBe(false);
    });
  });

  describe("validatePathWithinWorkspace", () => {
    it("accepts files within workspace", () => {
      expect(validatePathWithinWorkspace("/ws/src/main.ts", "/ws")).toBe(true);
    });

    it("rejects files outside workspace", () => {
      expect(validatePathWithinWorkspace("/etc/passwd", "/ws")).toBe(false);
    });

    it("rejects path traversal", () => {
      expect(validatePathWithinWorkspace("/ws/../../etc/passwd", "/ws")).toBe(false);
    });
  });

  describe("validateSearchQuery", () => {
    it("accepts valid queries", () => {
      expect(validateSearchQuery("config")).toBe(true);
    });

    it("rejects very long queries", () => {
      expect(validateSearchQuery("a".repeat(501))).toBe(false);
    });

    it("rejects non-strings", () => {
      expect(validateSearchQuery(null)).toBe(false);
    });
  });
});
