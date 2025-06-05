import { describe, it, expect } from "bun:test";
import { MessageMesh } from "./message-mesh.js";
import { MessageMeshError } from "./types.js";

describe("MessageMesh", () => {
  it("should create instance with default config", () => {
    const mesh = new MessageMesh();
    expect(mesh).toBeDefined();
    expect(mesh.whatsapp).toBeDefined();
    expect(mesh.messenger).toBeDefined();
    expect(mesh.instagram).toBeDefined();
  });

  it("should create instance with custom config", () => {
    const config = { timeout: 60000, retryAttempts: 5 };
    const mesh = new MessageMesh(config);
    expect(mesh.getConfig()).toEqual(config);
  });

  it("should return version", () => {
    const mesh = new MessageMesh();
    expect(mesh.getVersion()).toBe("0.1.0");
  });
});

describe("MessageMeshError", () => {
  it("should create error with required fields", () => {
    const error = new MessageMeshError("TEST_CODE", "whatsapp", "Test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.platform).toBe("whatsapp");
    expect(error.message).toBe("Test message");
    expect(error.name).toBe("MessageMeshError");
  });

  it("should create error with original error", () => {
    const originalError = new Error("Original error");
    const error = new MessageMeshError("TEST_CODE", "whatsapp", "Test message", originalError);
    expect(error.originalError).toBe(originalError);
  });
});