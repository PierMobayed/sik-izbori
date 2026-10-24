const test = require("node:test");
const assert = require("node:assert/strict");
const sik = require("../logic.js");

test("quorum and two-thirds follow the table in the guidelines", function () {
  assert.deepEqual(
    { legal: sik.meeting(7, 4).legal, votesFor: sik.meeting(7, 4).votesFor, quorum: sik.meeting(7, 4).quorum },
    { legal: true, votesFor: 3, quorum: 4 }
  );
  assert.equal(sik.meeting(7, 3).legal, false);
  assert.equal(sik.meeting(7, 7).votesFor, 5);
  assert.equal(sik.meeting(6, 6).votesFor, 4);
  assert.equal(sik.meeting(6, 4).votesFor, 3);
  assert.equal(sik.meeting(5, 3).votesFor, 2);
  assert.equal(sik.meeting(5, 5).votesFor, 4);
  assert.equal(sik.meeting(5, 2).legal, false);
});

test("meeting rejects a composition outside 5, 6 or 7", function () {
  assert.equal(sik.meeting(4, 3).ok, false);
  assert.equal(sik.meeting(7, 8).ok, false);
});

test("scan file names use the last three digits", function () {
  var names = sik.scanNames("123456001", 1);
  assert.equal(names.prt, "001_PRT.pdf");
  assert.deepEqual(names.lst, ["001_LST.pdf"]);

  var parts = sik.scanNames("000000001", 3);
  assert.deepEqual(parts.lst, ["001_LST_1ot3.pdf", "001_LST_2ot3.pdf", "001_LST_3ot3.pdf"]);
  assert.equal(sik.scanNames("12", 1).ok, false);
});

test("messages keep the wording from the guidelines", function () {
  var prep = sik.prepMessage({
    section: "123456001",
    place: "Лондон",
    country: "Обединено кралство",
    present: "5"
  });
  assert.match(prep, /успешно завърши подготовката за работа в изборния ден/);
  assert.match(prep, /Присъстваха 5 членове на СИК/);
  assert.match(sik.openMessage({ section: "1", place: "Лондон", country: "ОК" }), /започна нормално/);
});

test("draft figures reconcile only the relations described in the text", function () {
  assert.equal(sik.reconcile({
    received: "100",
    t1: "40",
    t1a: "3",
    t1b: "37",
    t5: "60",
    t6: "2",
    t7: "58",
    t71: "50",
    t72: "8"
  }).ok, true);

  var broken = sik.reconcile({ t7: "10", t71: "6", t72: "3" });
  assert.equal(broken.ok, false);
  assert.equal(broken.checked, 1);
  assert.match(broken.issues[0], /7\.1/);
  assert.equal(sik.reconcile({}).checked, 0);
});
