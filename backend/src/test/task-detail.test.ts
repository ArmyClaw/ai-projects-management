import test from "node:test";
import assert from "node:assert/strict";
import { canViewTask, encodeTaskDetail, parseTaskDetail } from "../services/task-detail.js";

test("task detail encode and parse keeps publish flags", () => {
  const encoded = encodeTaskDetail({
    summary: "s",
    background: "b",
    objective: "o",
    plan: "p",
    conditions: "c",
    targetPath: "d:/work",
    startedAt: "",
    retreatedAt: "",
    isPublished: false,
    deletedAt: "",
    progressReports: [],
  });
  const parsed = parseTaskDetail(encoded);
  assert.equal(parsed.summary, "s");
  assert.equal(parsed.isPublished, false);
});

test("task visibility follows publish/delete + owner rules", () => {
  const hidden = parseTaskDetail(
    encodeTaskDetail({
      summary: "s",
      background: "",
      objective: "",
      plan: "",
      conditions: "",
      targetPath: "",
      startedAt: "",
      retreatedAt: "",
      isPublished: false,
      deletedAt: "",
      progressReports: [],
    }),
  );
  assert.equal(canViewTask(hidden, "u-1", "u-1"), true);
  assert.equal(canViewTask(hidden, "u-1", "u-2"), false);

  const deleted = parseTaskDetail(
    encodeTaskDetail({
      ...hidden,
      deletedAt: "2026-03-06T00:00:00.000Z",
    }),
  );
  assert.equal(canViewTask(deleted, "u-1", "u-1"), true);
  assert.equal(canViewTask(deleted, "u-1", "u-2"), false);
});
