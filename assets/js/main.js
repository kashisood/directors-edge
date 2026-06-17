/* ===========================================================
   Director's Edge - app shell + behaviour (v5)
   Google-first nav, 3-way warm/light/dark theme, text-size,
   reading time, level badges + filter, scroll-spy, progress.
   Pure vanilla JS. No frameworks, no build step.
   =========================================================== */
(function () {
  "use strict";

  var NAV = [
    { group: "Google focus", items: [
      { file: "google.html", label: "Google Prep", ico: "&#11088;" }
    ]},
    { group: "Industry domains", items: [
      { file: "payments.html",    label: "Payments Tech", ico: "&#128179;" },
      { file: "travel-tech.html", label: "Travel Tech",   ico: "&#9992;" }
    ]},
    { group: "Start here", items: [
      { file: "index.html",       label: "Home",        ico: "&#8962;" },
      { file: "prep-path.html",   label: "Prep Path",   ico: "&#128099;" },
      { file: "cheat-sheet.html", label: "Cheat Sheet", ico: "&#128203;" }
    ]},
    { group: "Core pillars", items: [
      { file: "fundamentals.html",  label: "Fundamentals",            num: "1" },
      { file: "system-design.html", label: "System Design",           num: "2" },
      { file: "system-design-cases.html", label: "System Design II",   ico: "&#129513;" },
      { file: "tech-radar.html",    label: "Tech Radar",              num: "3" },
      { file: "leadership.html",    label: "Leadership &amp; Delivery", num: "4" },
      { file: "security.html",      label: "Security",                num: "5" },
      { file: "behavioral.html",    label: "Behavioral",              num: "6" },
      { file: "mobile-native.html", label: "Mobile Native",           num: "7" }
    ]},
    { group: "SD deep-dives", items: [
      { file: "sd-news-feed.html",     label: "News Feed",      ico: "&#128240;" },
      { file: "sd-chat.html",          label: "Chat System",    ico: "&#128172;" },
      { file: "sd-video.html",         label: "Video Streaming",ico: "&#127909;" },
      { file: "sd-rate-limiter.html",  label: "Rate Limiter",   ico: "&#128678;" },
      { file: "sd-message-queue.html", label: "Message Queue",  ico: "&#128238;" },
      { file: "sd-ride-hailing.html",  label: "Ride-Hailing",   ico: "&#128661;" },
      { file: "system-design-cases.html#flagship", label: "All 30 deep-dives", ico: "&#128269;" }
    ]},
    { group: "Live", items: [
      { file: "this-week.html", label: "This Week", ico: "&#128240;" }
    ]},
    { group: "Insights", items: [
      { file: "scaling-0-to-1m.html", label: "Scaling 0&rarr;1M", ico: "&#128200;" },
      { file: "cloud-native.html",    label: "Cloud &amp; AI-Native", ico: "&#9729;" },
      { file: "ai-insights.html",     label: "AI Insights",     ico: "&#129302;" },
      { file: "ai-tools.html",        label: "AI Tools &amp; Modes", ico: "&#129520;" }
    ]},
    { group: "More companies", items: [
      { file: "companies.html",  label: "Other Companies", ico: "&#127970;" }
    ]}
  ];
  var FLAT = NAV.reduce(function (a, g) { return a.concat(g.items); }, []);

  var root = document.documentElement;
  function current() {
    var f = (location.pathname.split("/").pop() || "index.html");
    return f === "" ? "index.html" : f;
  }

  /* ---- Theme: warm -> light -> dark ---- */
  var THEMES = ["warm", "light", "dark"];
  var THEME_ICON = { warm: "&#9749;", light: "&#9728;", dark: "&#9790;" };
  var THEME_NAME = { warm: "Warm", light: "Light", dark: "Dark" };
  function getTheme() {
    var t = root.getAttribute("data-theme");
    return THEMES.indexOf(t) !== -1 ? t : "warm";
  }
  try { var st = localStorage.getItem("de-theme"); root.setAttribute("data-theme", THEMES.indexOf(st) !== -1 ? st : "warm"); }
  catch (e) { root.setAttribute("data-theme", "warm"); }
  function cycleTheme() {
    var next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("de-theme", next); } catch (e) {}
    paintThemeBtn();
  }
  function paintThemeBtn() {
    var b = document.querySelector(".theme-toggle");
    if (!b) return;
    var cur = getTheme(), nxt = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    b.innerHTML = THEME_ICON[cur];
    b.title = "Theme: " + THEME_NAME[cur] + " — click for " + THEME_NAME[nxt];
  }

  /* ---- Text size: normal -> lg -> xl ---- */
  var SIZES = ["", "lg", "xl"];
  var SIZE_LABEL = { "": "A", "lg": "A+", "xl": "A++" };
  try { var ss = localStorage.getItem("de-size"); if (SIZES.indexOf(ss) > 0) root.setAttribute("data-size", ss); } catch (e) {}
  function cycleSize() {
    var cur = root.getAttribute("data-size") || "";
    var next = SIZES[(SIZES.indexOf(SIZES.indexOf(cur) !== -1 ? cur : "") + 1) % SIZES.length];
    if (next) root.setAttribute("data-size", next); else root.removeAttribute("data-size");
    try { localStorage.setItem("de-size", next); } catch (e) {}
    paintSizeBtn();
  }
  function paintSizeBtn() {
    var b = document.querySelector(".size-btn");
    if (!b) return;
    var cur = root.getAttribute("data-size") || "";
    b.innerHTML = SIZE_LABEL[cur] || "A";
    b.title = "Text size (" + (cur === "" ? "normal" : cur) + ") — click to enlarge";
  }

  function readingTime() {
    var c = document.querySelector(".content");
    if (!c) return 0;
    var words = (c.textContent || "").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  function buildShell() {
    var here = current();
    var meta = FLAT.filter(function (p) { return p.file === here; })[0];
    if (!meta) { var _t = (document.title || "").split("\u2014")[0].replace(/&amp;/g,"&").trim(); meta = { file: here, label: _t || here }; }
    var isHome = here === "index.html";

    var keep = [];
    Array.prototype.slice.call(document.body.childNodes).forEach(function (n) {
      if (n.nodeType === 1) {
        var tag = n.tagName.toLowerCase();
        if (tag === "script" || tag === "link" || tag === "style") return;
        if (n.matches && (n.matches("header.site") || n.matches("footer.site"))) { n.remove(); return; }
        keep.push(n);
      } else { keep.push(n); }
    });

    var navHtml = NAV.map(function (g) {
      var items = g.items.map(function (p) {
        var active = p.file === here ? " active" : "";
        var badge = p.num ? '<span class="num">' + p.num + "</span>" : '<span class="ico">' + (p.ico || "") + "</span>";
        return '<a href="' + p.file + '" class="' + active.trim() + '">' + badge + "<span>" + p.label + "</span></a>";
      }).join("");
      return '<div class="side-label">' + g.group + "</div><nav class=\"side-nav\">" + items + "</nav>";
    }).join("");

    var sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.innerHTML =
      '<a class="brand" href="index.html"><span class="logo">DE</span>' +
      '<span><b>Director&#8217;s Edge</b><small>Engineering Leadership Prep</small></span></a>' +
      navHtml +
      '<div class="side-foot">Read for the pattern, say it aloud, connect the topics.</div>';

    var topbar = document.createElement("header");
    topbar.className = "topbar";
    var crumb = isHome
      ? '<span class="crumb"><span>Overview</span></span>'
      : '<span class="crumb"><a class="home" href="index.html">Director&#8217;s Edge</a>' +
        '<span class="sep">&#8250;</span><span>' + meta.label + "</span></span>";
    topbar.innerHTML =
      '<button class="icon-btn menu-btn" aria-label="Menu">&#9776;</button>' + crumb +
      '<span class="spacer"></span>' +
      '<span class="read-time"></span>' +
      '<button class="icon-btn size-btn" aria-label="Text size">A</button>' +
      '<button class="icon-btn theme-toggle" aria-label="Toggle theme">&#9749;</button>';

    var shell = document.createElement("div"); shell.className = "app-shell";
    var main = document.createElement("div"); main.className = "app-main";
    var content = document.createElement("div"); content.className = "content";
    keep.forEach(function (n) { content.appendChild(n); });
    if (isHome) { var hsec = content.querySelector("section.hero"); if (hsec) hsec.classList.add("home-hero"); }

    main.appendChild(topbar); main.appendChild(content);
    shell.appendChild(sidebar); shell.appendChild(main);
    var scrim = document.createElement("div"); scrim.className = "scrim";
    var progress = document.createElement("div"); progress.id = "progress";
    document.body.appendChild(progress); document.body.appendChild(shell); document.body.appendChild(scrim);

    var rt = readingTime();
    var rtEl = topbar.querySelector(".read-time");
    if (rtEl && !isHome) rtEl.textContent = "~" + rt + " min read";

    topbar.querySelector(".theme-toggle").addEventListener("click", cycleTheme);
    topbar.querySelector(".size-btn").addEventListener("click", cycleSize);
    var mb = topbar.querySelector(".menu-btn");
    function closeNav() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }
    mb.addEventListener("click", function () { sidebar.classList.toggle("open"); scrim.classList.toggle("show"); });
    scrim.addEventListener("click", closeNav);
    sidebar.querySelectorAll(".side-nav a").forEach(function (a) { a.addEventListener("click", closeNav); });
    paintThemeBtn(); paintSizeBtn();
  }

  var LV = { "1": "L1", "2": "L2", "3": "L3" };
  function wireLevels() {
    var qs = Array.prototype.slice.call(document.querySelectorAll("details.qa[data-level]"));
    if (!qs.length) return;
    qs.forEach(function (d) {
      var lv = d.getAttribute("data-level"), sum = d.querySelector("summary");
      if (!sum || !LV[lv]) return;
      var b = document.createElement("span");
      b.className = "qa-badge lvl lvl" + lv; b.textContent = LV[lv];
      var topic = sum.querySelector(".qa-badge");
      if (topic) sum.insertBefore(b, topic); else sum.appendChild(b);
    });
    var input = document.querySelector("[data-search]");
    var empty = document.querySelector(".no-results");
    var level = "all";
    function apply() {
      var q = (input ? input.value.trim().toLowerCase() : ""), any = false;
      document.querySelectorAll("[data-searchable]").forEach(function (el) {
        var okText = el.textContent.toLowerCase().indexOf(q) !== -1;
        var okLvl = level === "all" || el.getAttribute("data-level") === level;
        var show = okText && okLvl;
        el.style.display = show ? "" : "none";
        if (show) any = true;
      });
      if (empty) empty.style.display = any ? "none" : "block";
    }
    var bar = document.createElement("div");
    bar.className = "level-filter";
    bar.innerHTML = '<span class="lf-label">Filter by level</span>' +
      '<button class="lvl-btn on" data-lv="all">All</button>' +
      '<button class="lvl-btn" data-lv="1">L1 &middot; Foundations</button>' +
      '<button class="lvl-btn" data-lv="2">L2 &middot; Core</button>' +
      '<button class="lvl-btn" data-lv="3">L3 &middot; Advanced</button>';
    var anchor = document.querySelector(".search") || document.querySelector("[data-search-group]");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor);
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".lvl-btn"); if (!btn) return;
      level = btn.getAttribute("data-lv");
      bar.querySelectorAll(".lvl-btn").forEach(function (x) { x.classList.remove("on"); });
      btn.classList.add("on"); apply();
    });
    if (input) input.addEventListener("input", apply);
    apply();
  }

  function wireSearch() {
    if (document.querySelector("details.qa[data-level]")) return;
    var input = document.querySelector("[data-search]");
    if (!input) return;
    var empty = document.querySelector(".no-results");
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase(), any = false;
      document.querySelectorAll("[data-searchable]").forEach(function (el) {
        var hit = el.textContent.toLowerCase().indexOf(q) !== -1;
        el.style.display = hit ? "" : "none";
        if (hit) any = true;
      });
      if (empty) empty.style.display = (any || !q) ? "none" : "block";
    });
  }

  function wireProgress() {
    var bar = document.getElementById("progress");
    if (!bar) return;
    function upd() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd); upd();
  }

  function wireScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length) return;
    var targets = links.map(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      return el ? { a: a, el: el } : null;
    }).filter(Boolean);
    function onScroll() {
      var pos = window.scrollY + 120, cur = targets[0];
      targets.forEach(function (t) { if (t.el.offsetTop <= pos) cur = t; });
      links.forEach(function (a) { a.classList.remove("active"); });
      if (cur) cur.a.classList.add("active");
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  function wireBulkToggle() {
    var o = document.querySelector("[data-open-all]"), c = document.querySelector("[data-close-all]");
    if (o) o.addEventListener("click", function () { document.querySelectorAll("details.qa").forEach(function (d) { d.open = true; }); });
    if (c) c.addEventListener("click", function () { document.querySelectorAll("details.qa").forEach(function (d) { d.open = false; }); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildShell(); wireProgress(); wireScrollSpy(); wireLevels(); wireSearch(); wireBulkToggle();
  });
})();
