(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Sik = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var QUORUM = { 5: 3, 6: 4, 7: 4 };
  var VOTES_FOR = { 3: 2, 4: 3, 5: 4, 6: 4, 7: 5 };

  function meeting(appointed, present) {
    var size = Number(appointed);
    var here = Number(present);
    if (!QUORUM[size]) {
      return { ok: false, error: "Съставът на СИК е 5, 6 или 7 членове." };
    }
    if (!Number.isInteger(here) || here < 0 || here > size) {
      return { ok: false, error: "Присъстващите са цяло число от 0 до броя на състава." };
    }
    var quorum = QUORUM[size];
    var legal = here >= quorum;
    return {
      ok: true,
      appointed: size,
      present: here,
      quorum: quorum,
      legal: legal,
      votesFor: legal ? VOTES_FOR[here] : null
    };
  }

  function scanNames(sectionRaw, parts) {
    var digits = String(sectionRaw || "").replace(/\D/g, "");
    if (digits.length !== 9) {
      return { ok: false, error: "Номерът на секцията е 9 цифри." };
    }
    var n = Number(parts);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return { ok: false, error: "Частите на списъка са от 1 до 20." };
    }
    var tail = digits.slice(-3);
    var lst = [];
    if (n === 1) {
      lst.push(tail + "_LST.pdf");
    } else {
      for (var i = 1; i <= n; i += 1) {
        lst.push(tail + "_LST_" + i + "ot" + n + ".pdf");
      }
    }
    return { ok: true, tail: tail, prt: tail + "_PRT.pdf", lst: lst };
  }

  function blank(value, fallback) {
    var text = String(value || "").trim();
    return text || fallback;
  }

  function prepMessage(fields) {
    return (
      "СИК в секция № " + blank(fields.section, "…………") +
      ", в " + blank(fields.place, "…………") + " (място), " +
      blank(fields.country, "…………") + " (държава), успешно завърши подготовката за работа в изборния ден.\n" +
      "Присъстваха " + blank(fields.present, "……") + " членове на СИК."
    );
  }

  function openMessage(fields) {
    return (
      "Изборният ден в секция № " + blank(fields.section, "…………") +
      ", в " + blank(fields.place, "…………") + " (място), " +
      blank(fields.country, "…………") + " (държава) започна нормално."
    );
  }

  function integerOrNull(value) {
    if (value === null || value === undefined) return null;
    var text = String(value).trim();
    if (text === "") return null;
    if (!/^\d+$/.test(text)) return NaN;
    return Number(text);
  }

  function reconcile(input) {
    var fields = {
      received: integerOrNull(input.received),
      t1: integerOrNull(input.t1),
      t1a: integerOrNull(input.t1a),
      t1b: integerOrNull(input.t1b),
      t5: integerOrNull(input.t5),
      t6: integerOrNull(input.t6),
      t7: integerOrNull(input.t7),
      t71: integerOrNull(input.t71),
      t72: integerOrNull(input.t72)
    };
    var issues = [];
    Object.keys(fields).forEach(function (key) {
      if (Number.isNaN(fields[key])) issues.push("Полето не е цяло число.");
    });
    if (issues.length) return { ok: false, issues: issues, checked: 0 };

    var checked = 0;
    function row(ready, holds, message) {
      if (!ready) return;
      checked += 1;
      if (!holds) issues.push(message);
    }
    row(fields.t1 !== null && fields.t1a !== null && fields.t1b !== null, fields.t1 === fields.t1a + fields.t1b, "т. 1 не е сбор от т. 1а и т. 1б.");
    row(fields.received !== null && fields.t1 !== null && fields.t5 !== null, fields.received === fields.t1 + fields.t5, "Получените бюлетини (буква А, т. 3 от прил. 69) не са сбор от т. 1 и т. 5.");
    row(fields.t5 !== null && fields.t6 !== null && fields.t7 !== null, fields.t5 === fields.t6 + fields.t7, "т. 5 не е сбор от т. 6 и т. 7.");
    row(fields.t7 !== null && fields.t71 !== null && fields.t72 !== null, fields.t7 === fields.t71 + fields.t72, "т. 7 не е сбор от т. 7.1 и т. 7.2.");
    return { ok: issues.length === 0, issues: issues, checked: checked };
  }

  var REPLIES = {
    prep: "Съобщението за успешно приключване на подготовката е получено. ЦИК освобождава състава на СИК до началото на изборния ден.",
    received: "Съобщението е получено. Моля изчакайте!",
    forwarded: "Предадено на ЦИК за проверка. Моля изчакайте!",
    correction: "Приложено Ви изпращаме забележка от ЦИК. Моля, коригирайте и изпратете повторно!",
    release: "ЦИК освобождава състава на СИК"
  };

  return {
    meeting: meeting,
    scanNames: scanNames,
    prepMessage: prepMessage,
    openMessage: openMessage,
    reconcile: reconcile,
    REPLIES: REPLIES
  };
});
