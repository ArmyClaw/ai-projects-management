import test from "node:test";
import assert from "node:assert/strict";
import { buildCapabilityListWhere, canReadCapability } from "../services/access.js";

test("anonymous only reads ACTIVE capability list", () => {
  const where = buildCapabilityListWhere("system");
  assert.deepEqual(where, { status: "ACTIVE" });
});

test("logged user reads ACTIVE plus own capability list", () => {
  const where = buildCapabilityListWhere("u-1");
  assert.deepEqual(where, { OR: [{ status: "ACTIVE" }, { createdBy: "u-1" }] });
});

test("non-active capability readable only by owner", () => {
  assert.equal(canReadCapability("DRAFT", "u-1", "u-1"), true);
  assert.equal(canReadCapability("DRAFT", "u-1", "u-2"), false);
  assert.equal(canReadCapability("ACTIVE", "u-1", "u-2"), true);
});
