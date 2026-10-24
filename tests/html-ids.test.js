const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");

test("checklist markup keeps unique ids", function () {
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const checks = [...html.matchAll(/data-check="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  const cdup = checks.filter((id, i) => checks.indexOf(id) !== i);
  const need = ["section", "place", "country", "appointed", "present", "parts", "quorum", "files", "reconcile", "received", "t1", "t1a", "t1b", "t5", "t6", "t7", "t71", "t72", "copy-prep", "copy-open", "copy-files", "clear-checks", "prep-preview", "open-preview", "home", "prep", "open", "vote", "close", "protocol", "cik", "bags"];
  const missing = need.filter((id) => !ids.includes(id));
  assert.deepEqual(dup, []);
  assert.deepEqual(cdup, []);
  assert.deepEqual(missing, []);
  assert.ok(checks.length > 50);
});
