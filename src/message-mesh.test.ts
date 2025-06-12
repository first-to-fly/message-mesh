import { describe, it, expect } from "bun:test";
import { MessageMesh } from "./message-mesh.js";

describe("MessageMesh", () => {
  it("should create an instance", () => {
    const messageMesh = new MessageMesh();
    expect(messageMesh).toBeInstanceOf(MessageMesh);
  });

  it("should have whatsapp service", () => {
    const messageMesh = new MessageMesh();
    expect(messageMesh.whatsapp).toBeDefined();
  });

  it("should have messenger service", () => {
    const messageMesh = new MessageMesh();
    expect(messageMesh.messenger).toBeDefined();
  });

  it("should have instagram service", () => {
    const messageMesh = new MessageMesh();
    expect(messageMesh.instagram).toBeDefined();
  });
});