(function () {
  var STORAGE = "sik-izbori-2026-v1";
  var sik = window.Sik;

  var phaseButtons = Array.prototype.slice.call(document.querySelectorAll("[data-show]"));
  var phases = Array.prototype.slice.call(document.querySelectorAll(".phase"));
  var checks = Array.prototype.slice.call(document.querySelectorAll("[data-check]"));
  var fields = {
    section: document.querySelector("#section"),
    place: document.querySelector("#place"),
    country: document.querySelector("#country"),
    appointed: document.querySelector("#appointed"),
    present: document.querySelector("#present"),
    parts: document.querySelector("#parts")
  };
  var numberIds = ["received", "t1", "t1a", "t1b", "t5", "t6", "t7", "t71", "t72"];

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE)) || {};
    } catch (error) {
      return {};
    }
  }

  function write(state) {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  }

  function snapshot() {
    var state = {
      section: fields.section.value,
      place: fields.place.value,
      country: fields.country.value,
      appointed: fields.appointed.value,
      present: fields.present.value,
      parts: fields.parts.value,
      checks: {},
      numbers: {},
      phase: document.querySelector(".phase.active").id
    };
    checks.forEach(function (box) {
      state.checks[box.getAttribute("data-check")] = box.checked;
    });
    numberIds.forEach(function (id) {
      state.numbers[id] = document.querySelector("#" + id).value;
    });
    return state;
  }

  function save() {
    write(snapshot());
    renderTools();
  }

  function show(id) {
    phases.forEach(function (phase) {
      phase.classList.toggle("active", phase.id === id);
    });
    phaseButtons.forEach(function (button) {
      button.setAttribute("aria-current", button.getAttribute("data-show") === id ? "true" : "false");
    });
    save();
  }

  function identity() {
    return {
      section: fields.section.value,
      place: fields.place.value,
      country: fields.country.value,
      present: fields.present.value
    };
  }

  function renderTools() {
    var meet = sik.meeting(fields.appointed.value, fields.present.value);
    var quorum = document.querySelector("#quorum");
    if (!meet.ok) {
      quorum.textContent = meet.error;
      quorum.className = "warn";
    } else if (!meet.legal) {
      quorum.textContent = "Няма кворум. Нужни са " + meet.quorum + " от " + meet.appointed + " членове. Помещението не се разпечатва и заседание не се провежда.";
      quorum.className = "warn";
    } else {
      quorum.textContent = "Кворум има (" + meet.present + " от " + meet.appointed + ", минимум " + meet.quorum + "). Решение се приема при " + meet.votesFor + " гласа „ЗА“. Въздържал се не се допуска.";
      quorum.className = "ok";
    }

    var names = sik.scanNames(fields.section.value, fields.parts.value);
    var files = document.querySelector("#files");
    files.innerHTML = "";
    if (!names.ok) {
      files.textContent = names.error;
    } else {
      [names.prt].concat(names.lst).forEach(function (name) {
        var row = document.createElement("div");
        row.className = "file";
        row.textContent = name;
        files.appendChild(row);
      });
    }

    var numbers = {};
    numberIds.forEach(function (id) {
      numbers[id] = document.querySelector("#" + id).value;
    });
    var check = sik.reconcile(numbers);
    var box = document.querySelector("#reconcile");
    if (!check.ok) {
      box.textContent = check.issues.join(" ");
      box.className = "warn";
    } else if (!check.checked) {
      box.textContent = "Сборът се проверява, когато и трите числа в реда са попълнени. Официалните контроли са в протокола и в „Избори 360“.";
      box.className = "progress";
    } else {
      box.textContent = "Попълнените редове се връзват. Официалните контроли в самия протокол се проверяват в „Избори 360“.";
      box.className = "ok";
    }
    document.querySelector("#prep-preview").textContent = sik.prepMessage(identity());
    document.querySelector("#open-preview").textContent = sik.openMessage(identity());

    phases.forEach(function (phase) {
      var boxes = phase.querySelectorAll("[data-check]");
      var done = phase.querySelectorAll("[data-check]:checked").length;
      var button = document.querySelector('[data-show="' + phase.id + '"]');
      var count = button.querySelector(".count");
      if (count && boxes.length) count.textContent = done + "/" + boxes.length;
    });
  }

  function copyText(text, button) {
    function done() {
      var previous = button.textContent;
      button.textContent = "Копирано";
      setTimeout(function () { button.textContent = previous; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallback();
      });
      return;
    }
    fallback();
    function fallback() {
      var area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      done();
    }
  }

  var saved = read();
  ["section", "place", "country", "appointed", "present", "parts"].forEach(function (key) {
    if (saved[key]) fields[key].value = saved[key];
  });
  checks.forEach(function (box) {
    box.checked = Boolean(saved.checks && saved.checks[box.getAttribute("data-check")]);
    box.addEventListener("change", save);
  });
  numberIds.forEach(function (id) {
    var input = document.querySelector("#" + id);
    if (saved.numbers && saved.numbers[id]) input.value = saved.numbers[id];
    input.addEventListener("input", save);
  });
  Object.keys(fields).forEach(function (key) {
    fields[key].addEventListener("input", save);
    fields[key].addEventListener("change", save);
  });

  phaseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      show(button.getAttribute("data-show"));
    });
  });

  document.querySelector("#copy-prep").addEventListener("click", function () {
    copyText(sik.prepMessage(identity()), this);
  });
  document.querySelector("#copy-open").addEventListener("click", function () {
    copyText(sik.openMessage(identity()), this);
  });
  document.querySelector("#copy-files").addEventListener("click", function () {
    var names = sik.scanNames(fields.section.value, fields.parts.value);
    if (!names.ok) return;
    copyText([names.prt].concat(names.lst).join("\n"), this);
  });
  document.querySelector("#clear-checks").addEventListener("click", function () {
    if (!window.confirm("Отметките и числата в протокола се изчистват. Секцията, мястото и държавата остават.")) return;
    checks.forEach(function (box) { box.checked = false; });
    numberIds.forEach(function (id) { document.querySelector("#" + id).value = ""; });
    save();
  });

  show(saved.phase || "home");
  renderTools();
})();
