// MyBI site — minimal progressive enhancement (no dependencies).
(function () {
  "use strict";

  // Current year in the footer.
  document.querySelectorAll("#year").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // ---- Theme: Light / System / Dark (persisted; head snippet pre-applies) ----
  var THEME_KEY = "mybi-theme";
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function applyTheme(mode) {
    var resolved = mode === "system" ? (media && !media.matches ? "light" : "dark") : mode;
    document.documentElement.dataset.theme = resolved;
    document.querySelectorAll(".theme-seg button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.mode === mode);
    });
  }
  var themeMode = "system";
  try { themeMode = localStorage.getItem(THEME_KEY) || "system"; } catch (e) { /* private mode */ }
  applyTheme(themeMode);
  document.querySelectorAll(".theme-seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      themeMode = b.dataset.mode;
      try { localStorage.setItem(THEME_KEY, themeMode); } catch (e) { /* private mode */ }
      applyTheme(themeMode);
    });
  });
  if (media && media.addEventListener) {
    media.addEventListener("change", function () { if (themeMode === "system") applyTheme(themeMode); });
  }

  // Subtle shadow on the nav once the page is scrolled.
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.style.boxShadow = window.scrollY > 8 ? "0 8px 24px -16px rgba(0,0,0,.8)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Hero showcase: auto-cycle the rail down through the areas ----------
  var mock = document.getElementById("hero-mock");
  if (mock) {
    var slides = mock.querySelectorAll(".mock-slide");      // DOM order: data, canvas, semantic, plugins, palettes
    var icons = mock.querySelectorAll(".mr-ic");
    var dots = mock.querySelectorAll(".cap-dots i");
    var pill = document.getElementById("rail-pill");
    var prog = document.getElementById("mock-prog");
    var ttl = document.getElementById("mock-ttl");
    var cap = document.getElementById("mock-cap");
    var STEP = 38; // rail icon height (30) + gap (8)
    var INTERVAL = 2800;
    var titles = ["Data", "Canvas", "Model", "Plugins", "Palettes"];
    var caps = [
      ["Data", "clean &amp; transform"],
      ["Canvas", "build dashboards"],
      ["Model", "relate your tables"],
      ["Plugins", "extend MyBI"],
      ["Palettes", "theme everything"]
    ];

    function show(n) {
      slides.forEach(function (s, i) { s.classList.toggle("on", i === n); });
      icons.forEach(function (ic, i) { ic.classList.toggle("on", i === n); });
      dots.forEach(function (d, i) { d.classList.toggle("on", i === n); });
      if (pill) pill.style.transform = "translateY(" + (n * STEP) + "px)";
      if (ttl) ttl.textContent = "Q2-revenue.mybi — " + (titles[n] || "Canvas");
      if (cap) cap.innerHTML = "<b>" + caps[n][0] + "</b> — " + caps[n][1];
      if (prog && !reduce) {
        prog.style.transition = "none";
        prog.style.width = "0";
        // force reflow, then animate the bar across one interval
        void prog.offsetWidth;
        prog.style.transition = "width " + INTERVAL + "ms linear";
        prog.style.width = "100%";
      }
    }

    var idx = 1; // start on Canvas
    show(idx);
    if (!reduce && slides.length > 1) {
      setInterval(function () { idx = (idx + 1) % slides.length; show(idx); }, INTERVAL);
    }
  }

  // ---- Reveal-on-scroll for cards (respects reduced-motion) --------------
  var targets = document.querySelectorAll(".feature, .rm-item, .dl-card, .trust-lead");
  if (!reduce && "IntersectionObserver" in window && targets.length) {
    targets.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity .5s ease, transform .5s ease";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "none";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  // ---- Monochrome neural-network background (drifting nodes + proximity links) ----------
  if (!reduce) {
    var nc = document.createElement("canvas");
    nc.className = "neural-bg";
    nc.setAttribute("aria-hidden", "true");
    document.body.appendChild(nc);
    var ctx = nc.getContext("2d");
    var DPR = Math.min(2, window.devicePixelRatio || 1);
    var nodes = [], W = 0, H = 0, LINK = 0;
    function resize() {
      W = nc.width = window.innerWidth * DPR;
      H = nc.height = window.innerHeight * DPR;
      nc.style.width = window.innerWidth + "px";
      nc.style.height = window.innerHeight + "px";
      LINK = 150 * DPR;
      var count = Math.max(24, Math.min(72, Math.round(window.innerWidth * window.innerHeight / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.18 * DPR, vy: (Math.random() - 0.5) * 0.18 * DPR });
      }
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });
    function tick() {
      var ink = document.documentElement.dataset.theme === "light" ? "16,27,45" : "255,255,255";
      ctx.clearRect(0, 0, W, H);
      var i, a, b;
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      for (a = 0; a < nodes.length; a++) {
        for (b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(" + ink + "," + (0.11 * (1 - d / LINK)).toFixed(3) + ")";
            ctx.lineWidth = DPR;
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(" + ink + ",0.5)";
        ctx.beginPath(); ctx.arc(nodes[a].x, nodes[a].y, 1.4 * DPR, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ---- Brand disclaimer in every footer ---------------------------------------------
  document.querySelectorAll(".foot-bottom").forEach(function (fb) {
    if (fb.querySelector(".foot-disclaimer")) return;
    var d = document.createElement("span");
    d.className = "foot-disclaimer";
    d.innerHTML = "MyBI means “My Own Business Intelligence” — an independent project, not affiliated with MySQL or with the “MyBI” app on Google Play (MyBI Brazil).";
    fb.appendChild(d);
  });
})();
