// MyBI site — minimal progressive enhancement (no dependencies).
(function () {
  "use strict";

  // Current year in the footer.
  document.querySelectorAll("#year").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

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
})();
