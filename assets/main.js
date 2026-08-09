// MyBI site, minimal progressive enhancement (no dependencies).
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

  // ---- Top bar fit: collapse by MEASUREMENT, not by guessed breakpoints -----------------------
  // The tab row's width depends on how many tabs a page has and how long their labels are, so a
  // fixed media query either collapses too early on some pages or lets the tabs run into the centred
  // mark on others (which is exactly what happened at ~1000px). Instead the natural widths are
  // measured once, then compared against the bar on every resize:
  //   1. tabs collide with the mark   -> tab row becomes a burger
  //   2. actions still collide        -> theme + Download fold behind one icon
  var navEl = document.querySelector(".nav");
  var navInner = navEl && navEl.querySelector(".nav-inner");
  if (navEl && navInner) {
    var tabsEl = navEl.querySelector(".nav-tabs");
    var brandEl = navEl.querySelector(".brand");
    var actionsEl = navEl.querySelector(".nav-actions");
    var burger = navEl.querySelector(".nav-burger");

    // The home page IS the download page: its hero carries the store badges a few hundred pixels
    // below the bar, so a bar button that only scrolls back to them is noise. Removed before the
    // widths are measured, or the bar would collapse against a button that is no longer there.
    var path = location.pathname.replace(/\/+$/, "/");
    if (/(^|\/)(index\.html)?$/.test(path)) {
      var homeDl = navEl.querySelector('.nav-actions a[href="#download"]');
      if (homeDl) homeDl.remove();
    }

    // When the actions no longer fit, the theme segment collapses to ONE button showing the current
    // mode; pressing it steps to the next one — system, light, dark, round again — rather than
    // opening the three as a dropdown. Three mutually exclusive states you can cycle do not need a
    // menu, least of all one hanging off the bar on a phone. Download stays visible as its own
    // glyph: a single "more" menu hid the one thing a visitor came for behind an extra tap.
    var THEME_ORDER = ["system", "light", "dark"];
    var THEME_NAME = { system: "System", light: "Light", dark: "Dark" };
    var THEME_ICON = {
      light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      system: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
      dark: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>'
    };
    var themeBtn = document.createElement("button");
    themeBtn.className = "theme-toggle";
    themeBtn.type = "button";
    function themeNow() {
      var mode = (document.querySelector(".theme-seg button.on") || {}).dataset;
      return (mode && mode.mode) || "system";
    }
    function paintThemeBtn() {
      var key = themeNow();
      var next = THEME_ORDER[(THEME_ORDER.indexOf(key) + 1) % THEME_ORDER.length];
      themeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        (THEME_ICON[key] || THEME_ICON.system) + '</svg>';
      // The label says where a press goes, since the icon already says where you are.
      themeBtn.title = THEME_NAME[key] + " theme — switch to " + THEME_NAME[next].toLowerCase();
      themeBtn.setAttribute("aria-label", themeBtn.title);
    }
    paintThemeBtn();
    if (actionsEl) {
      actionsEl.insertBefore(themeBtn, actionsEl.firstChild);
      actionsEl.querySelectorAll(".theme-seg button").forEach(function (b) {
        b.addEventListener("click", paintThemeBtn);
      });
    }

    // Natural widths, taken while nothing is collapsed. Cached: re-measuring mid-collapse would
    // read the COLLAPSED width and the bar would then oscillate between the two states.
    var nat = null;
    function measure() {
      navEl.classList.remove("nav-compact", "nav-actions-compact");
      nat = {
        tabs: tabsEl ? tabsEl.offsetWidth : 0,
        brand: brandEl ? brandEl.offsetWidth : 0,
        actions: actionsEl ? actionsEl.offsetWidth : 0,
        burger: 38, more: 38
      };
    }
    var GAP = 28;   // clearance each side of the mark, so "fits" never means "just touches"
    function fit() {
      if (!nat) measure();
      // The mark is ABSOLUTELY CENTRED, so the test is not "do the three zones sum to less than the
      // bar" — that stays true long after the tabs have already run into the mark. Each side zone
      // only gets the space between the bar edge and the mark's edge, so compare against THAT.
      var cs = getComputedStyle(navInner);
      var avail = navInner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var side = avail / 2 - nat.brand / 2 - GAP;
      navEl.classList.toggle("nav-compact", nat.tabs > side);
      navEl.classList.toggle("nav-actions-compact", nat.actions > side);
    }
    measure();
    fit();
    window.addEventListener("resize", fit, { passive: true });
    // Fonts land after first paint and change the measured widths, so re-measure once they do.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); fit(); });
    }

    // Drawer title. Built here rather than in nine HTML files, and it stays hidden until the tab
    // row becomes a drawer (the CSS decides), so the bar itself never grows a stray label.
    if (tabsEl && !tabsEl.querySelector(".nav-drawer-head")) {
      var head = document.createElement("span");
      head.className = "nav-drawer-head";
      head.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
        + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
        + '<path d="m15.4 8.6-2 4.8-4.8 2 2-4.8Z"/></svg><span>Navigation</span>';
      tabsEl.insertBefore(head, tabsEl.firstChild);
    }

    // The active tab follows the SECTION you are looking at, not just the page you loaded: on the
    // home page Features is an anchor to the same document, so without this, clicking it left Home
    // lit and the drawer said you were somewhere you had just left.
    var featTab = tabsEl && tabsEl.querySelector('a[href="#features"]');
    var homeTab = tabsEl && tabsEl.querySelector('a[href="index.html"]');
    var featSec = document.getElementById("features");
    if (featTab && homeTab && featSec && window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        var here = entries[0].isIntersecting;
        featTab.classList.toggle("on", here);
        homeTab.classList.toggle("on", !here);
      // "Where you are" is whatever crosses the middle of the screen, not whatever has one pixel
      // showing at the bottom of it.
      }, { rootMargin: "-45% 0px -45% 0px" }).observe(featSec);

      // ...and on this page Home points at the document you are already in, so following it is a
      // reload — which Safari lands back at the scroll position you left, inside Features, lighting
      // Features again the moment the page settles. Scroll to the top instead.
      homeTab.addEventListener("click", function (e) {
        e.preventDefault();
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      });
    }

    var scrim = document.createElement("div");
    scrim.className = "nav-scrim";
    document.body.appendChild(scrim);
    scrim.addEventListener("click", function () { setOpen(false); });
    var setOpen = function (open) {
      navEl.classList.toggle("nav-open", open);
      document.documentElement.classList.toggle("nav-drawer-open", open);
      if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    };
    if (burger) burger.addEventListener("click", function (e) {
      e.stopPropagation(); setOpen(!navEl.classList.contains("nav-open"));
    });
    // Step to the next mode by pressing the segment's own button for it: that path already applies
    // the theme, saves it and lights the right segment, so there is one place where a theme change
    // happens however it was asked for.
    themeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(false);
      var next = THEME_ORDER[(THEME_ORDER.indexOf(themeNow()) + 1) % THEME_ORDER.length];
      var seg = document.querySelector('.theme-seg button[data-mode="' + next + '"]');
      if (seg) seg.click();
    });
    document.addEventListener("click", function (e) {
      if (!navEl.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    navEl.querySelectorAll(".nav-tabs a, .nav-actions a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  // Subtle shadow on the nav once the page is scrolled.
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      // rgba(0,0,0.8) was a typo for rgba(0,0,0,.8): an invalid colour, so the shadow never drew.
      nav.style.boxShadow = window.scrollY > 8 ? "0 8px 24px -16px rgba(0,0,0,.8)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Store badges: the compliance tips ------------------------------------
  // One per store, same behaviour for both. A tip holds a link, so it cannot vanish the instant the
  // pointer leaves the badge — you would never reach it. Leaving starts a 1s grace period; entering
  // the tip itself cancels that and holds it open for as long as the pointer is on it; reaching for
  // any other control, or clicking anywhere outside, dismisses it at once — a grace period is for
  // crossing the gap to the tip, not for sitting over the button you actually went for.
  // Opening one closes the other: they sit side by side and their boxes are wider than the badges,
  // so two open at once would overlap.
  var tips = [];
  document.querySelectorAll(".tip-wrap").forEach(function (wrap) {
    var trigger = wrap.querySelector("a, .btn, button");
    var box = wrap.querySelector(".btn-tip");
    if (trigger && box) tips.push({ wrap: wrap, trigger: trigger, box: box, timer: null });
  });
  if (tips.length) {
    var GRACE = 1000;
    // The box is centred on its badge, which on a phone puts half of it past the left edge. Work
    // out where a centred box WOULD sit — from the badge's rect and the box's own layout width,
    // never from the box's transformed rect, which is a moving target while tip-in animates — and
    // hand the CSS the correction. The notch subtracts the same amount, so it stays on the badge.
    var TIP_EDGE = 12;
    var tipPlace = function (t) {
      var btn = t.trigger.getBoundingClientRect();
      var w = t.box.offsetWidth;
      var left = btn.left + btn.width / 2 - w / 2;
      // The LAYOUT viewport, not window.innerWidth. On a phone innerWidth grows to cover anything
      // sticking out past the side of the page — and the box, being absolutely positioned, is
      // exactly that. Measured against innerWidth the box widens the number it is being corrected
      // against, so the correction stops one box-overhang short and it settles half off the screen.
      // clientWidth is the page's own width and does not move when something overflows it.
      var vw = document.documentElement.clientWidth;
      var shift = 0;
      if (left < TIP_EDGE) shift = TIP_EDGE - left;
      else if (left + w > vw - TIP_EDGE) shift = vw - TIP_EDGE - left - w;
      // Never so far that the notch walks out of its own box.
      var limit = Math.max(0, w / 2 - 16);
      shift = Math.max(-limit, Math.min(limit, shift));
      t.box.style.setProperty("--tip-shift", Math.round(shift) + "px");
    };
    var tipHide = function (t) {
      clearTimeout(t.timer);
      t.box.setAttribute("hidden", "");
    };
    var tipHideAll = function (except) {
      tips.forEach(function (t) { if (t !== except) tipHide(t); });
    };
    var tipShow = function (t) {
      clearTimeout(t.timer);
      tipHideAll(t);
      t.box.removeAttribute("hidden");
      tipPlace(t);
    };
    var tipLinger = function (t) {
      clearTimeout(t.timer);
      t.timer = setTimeout(function () { tipHide(t); }, GRACE);
    };
    tips.forEach(function (t) {
      t.trigger.addEventListener("mouseenter", function () { tipShow(t); });
      t.trigger.addEventListener("mouseleave", function () { tipLinger(t); });
      t.trigger.addEventListener("focus", function () { tipShow(t); });
      t.box.addEventListener("mouseenter", function () { tipShow(t); });
      t.box.addEventListener("mouseleave", function () { tipLinger(t); });
    });
    // Any other control — the rest of the hero, the nav, anything below — takes them all down now.
    document.querySelectorAll(".btn, button, .nav-tabs a").forEach(function (el) {
      if (tips.some(function (t) { return t.wrap.contains(el); })) return;
      el.addEventListener("mouseenter", function () { tipHideAll(null); });
    });
    window.addEventListener("resize", function () {
      tips.forEach(function (t) { if (!t.box.hasAttribute("hidden")) tipPlace(t); });
    });
    document.addEventListener("click", function (e) {
      tips.forEach(function (t) { if (!t.wrap.contains(e.target)) tipHide(t); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") tipHideAll(null);
    });
  }

  // ---- Microsoft Store: the Store app on Windows, the web listing everywhere else --------------
  // Same product either way. ms-windows-store:// hands the listing straight to the Store app, which
  // is where the Install button actually is, so on Windows it saves a browser hop. Nowhere else can
  // resolve that scheme, so the markup ships the web URL and only Windows swaps it — which also
  // means the link still works with the script blocked.
  var msLink = document.getElementById("ms-store");
  if (msLink) {
    var uaPlat = navigator.userAgentData && navigator.userAgentData.platform;
    var onWindows = uaPlat ? uaPlat === "Windows" : /Windows|Win32|Win64|WOW64/i.test(navigator.userAgent);
    if (onWindows) {
      msLink.href = "ms-windows-store://pdp/?productid=9PC422FHPHLJ";
      // A protocol handoff has no document to land on: with target="_blank" the browser opens a tab,
      // fires the handler and leaves the empty tab sitting there.
      msLink.removeAttribute("target");
      msLink.removeAttribute("rel");
    }
  }

  // ---- Leaving the site: say so before it happens ---------------------------
  var extDlg = document.getElementById("ext-dlg");
  if (extDlg) {
    var extGo = document.getElementById("ext-dlg-go");
    var extHost = document.getElementById("ext-dlg-host");
    document.querySelectorAll("a[data-external]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        extGo.href = a.href;
        try { extHost.textContent = new URL(a.href).hostname; } catch (err) { /* keep the fallback */ }
        extDlg.showModal();
        extDlg.focus();
      });
    });
    extGo.addEventListener("click", function () { extDlg.close(); });
    extDlg.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", function () { extDlg.close(); });
    });
    // Same backdrop rule as the sample dialog: the press must have STARTED on the backdrop, or
    // selecting the dialog's text and releasing past its edge closes it.
    var extDown = false;
    extDlg.addEventListener("mousedown", function (e) { extDown = e.target === extDlg; });
    extDlg.addEventListener("click", function (e) {
      if (e.target === extDlg && extDown) extDlg.close();
      extDown = false;
    });
  }

  // ---- Support: reveal the embedded feedback form on request ---------------
  // The iframe's address lives in data-src until the button is pressed, so simply opening the
  // support page makes no request to Google and sets no cookie of theirs.
  var supBtn = document.getElementById("sup-form-btn");
  if (supBtn) {
    var supPanel = document.getElementById("sup-form");
    supBtn.addEventListener("click", function () {
      var opening = supPanel.hasAttribute("hidden");
      if (opening) {
        var frame = supPanel.querySelector("iframe");
        if (frame && !frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src);
        supPanel.removeAttribute("hidden");
      } else {
        supPanel.setAttribute("hidden", "");
      }
      supBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    });
  }

  // ---- Hero headline: cross-fade between the two lines ---------------------
  // The inactive line stays in the DOM (it is what gives the cell its height) so it is hidden from
  // assistive tech instead, or the h1 would be read as two run-on sentences.
  var rot = document.querySelector(".rot");
  if (rot) {
    var rotLines = rot.querySelectorAll(".rot-line");
    if (rotLines.length > 1 && !reduce) {
      var rotAt = 0;
      setInterval(function () {
        rotLines[rotAt].classList.remove("on");
        rotLines[rotAt].setAttribute("aria-hidden", "true");
        rotAt = (rotAt + 1) % rotLines.length;
        rotLines[rotAt].classList.add("on");
        rotLines[rotAt].removeAttribute("aria-hidden");
      }, 4600);
    }
  }

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
      if (ttl) ttl.textContent = "Q2-revenue.mybi, " + (titles[n] || "Canvas");
      if (cap) cap.innerHTML = "<b>" + caps[n][0] + "</b>, " + caps[n][1];
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

  // ---- Screenshot slider(s): crossfade carousel, auto-advance, reusable ----
  // Drop a <div class="shot-slider"> with .shot figures anywhere and this wires it.
  document.querySelectorAll(".shot-slider").forEach(function (root) {
    var shots = [].slice.call(root.querySelectorAll(".shot"));
    if (shots.length < 2) return;
    var dotsWrap = root.querySelector(".shot-dots");
    var dots = [];
    var cur = 0, timer = null, DELAY = 4200;

    function paint() {
      shots.forEach(function (s, i) { s.classList.toggle("on", i === cur); });
      dots.forEach(function (d, i) {
        d.classList.toggle("on", i === cur);
        d.setAttribute("aria-selected", i === cur ? "true" : "false");
      });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function play() { stop(); if (!reduce) timer = setInterval(function () { go(cur + 1); }, DELAY); }
    function go(n, user) { cur = (n + shots.length) % shots.length; paint(); if (user) play(); }

    if (dotsWrap) {
      shots.forEach(function (_, i) {
        var d = document.createElement("i");
        d.setAttribute("role", "tab");
        d.setAttribute("aria-label", "Screenshot " + (i + 1));
        d.addEventListener("click", function () { go(i, true); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }
    var prev = root.querySelector(".shot-nav.prev"), nxt = root.querySelector(".shot-nav.next");
    if (prev) prev.addEventListener("click", function () { go(cur - 1, true); });
    if (nxt) nxt.addEventListener("click", function () { go(cur + 1, true); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", play);
    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(cur - 1, true); e.preventDefault(); }
      else if (e.key === "ArrowRight") { go(cur + 1, true); e.preventDefault(); }
    });
    paint();
    play();
  });

  // ---- Reveal-on-scroll for cards (respects reduced-motion) --------------
  var targets = document.querySelectorAll(".feature .rm-item .dl-card .trust-lead");
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


  // ---- Unify every footer: ensure a "Policies" column with Privacy + Terms links -----
  // Matches on BOTH headings: pages authored before the rename still ship a hard-coded "Legal"
  // column and matching only the new name would append a duplicate to every one of them.
  document.querySelectorAll(".foot-cols").forEach(function (fc) {
    var has = [].some.call(fc.querySelectorAll("h4"), function (h) {
      var t = h.textContent.trim();
      if (t === "Legal") h.textContent = "Policies";   // rename in place
      return t === "Legal" || t === "Policies";
    });
    if (has) return;
    var col = document.createElement("div");
    col.className = "foot-col";
    col.innerHTML = '<h4>Policies</h4><a href="privacy-policy">Privacy Policy</a><a href="terms-of-service">Terms of Service</a>';
    fc.appendChild(col);
  });

  // ---- Footer: brand + note box on one row, link columns spread across the bottom -------------
  // Built here because every page shares this footer; editing nine files by hand is how they drift.
  var ICONS = {
    copy: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a4 4 0 1 0 0 5"/>',
    os: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    ram: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M9 7V4M15 7V4M9 20v-3M15 20v-3"/>',
    disk: '<ellipse cx="12" cy="6.5" rx="8" ry="3.2"/><path d="M4 6.5v11c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-11"/><path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2"/>',
    product: '<path d="M21 16V8l-9-5-9 5v8l9 5 9-5Z"/><path d="M3.3 7.5 12 12.5l8.7-5M12 12.5V21"/>',
    features: '<path d="M4 20V10M9.5 20V4M15 20v-7M20.5 20v-4"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    support: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M14.4 9.6 18 6M6 18l3.6-3.6M14.4 14.4 18 18M6 6l3.6 3.6"/>',
    faq: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.3"/><path d="M12 17v.01"/>',
    privacy: '<path d="M12 3 5 6v6c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6l-7-3Z"/><path d="M12 11v3"/><path d="M12 8.5v.6"/>',
    terms: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.3"/><path d="M12 17v.01"/>',
    policies: '<path d="M12 3 5 6v6c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6l-7-3Z"/><path d="m9.2 12 2 2 3.6-3.8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11.5v5"/><path d="M12 8v.01"/>'
  };
  function svg(d, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  // Platform marks for the OS line — each vendor's own logo, filled rather than stroked.
  var PLATFORM = {
    apple: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
    windows: 'M3 3h8.4v8.4H3zM12.6 3H21v8.4h-8.4zM3 12.6h8.4V21H3zM12.6 12.6H21V21h-8.4z',
    linux: 'M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z'
  };
  function plat(key, label) {
    return '<span class="os-item"><svg class="os-mark" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="' + PLATFORM[key] + '"/></svg>' + label + '</span>';
  }
  function noteRow(icon, html) {
    return '<div class="foot-note-row"><span class="foot-note-ic" aria-hidden="true">' +
      svg(ICONS[icon], "") + '</span><span class="foot-note-txt">' + html + '</span></div>';
  }
  // "Project" said nothing about what was under it (FAQ and Support). "Help" does.
  var COL_ICON = { "Product": "product", "Project": "help", "Help": "help", "Policies": "policies" };
  // Icon per destination, matched on the link's own text so it survives reordering.
  var LINK_ICON = {
    "Features": "features", "Download": "download", "Support": "support", "FAQ": "faq",
    "Privacy Policy": "privacy", "Terms of Service": "terms"
  };

  document.querySelectorAll("footer").forEach(function (foot) {
    if (foot.querySelector(".foot-note")) return;
    var brand = foot.querySelector(".foot-brand");
    var cols = foot.querySelector(".foot-cols");
    var fb = foot.querySelector(".foot-bottom");
    if (!brand) return;

    var blurbEl = brand.querySelector("p");
    if (blurbEl) blurbEl.remove();
    var year = (fb && fb.querySelector("#year") || {}).textContent || new Date().getFullYear();

    // System requirements live HERE rather than on one page, so they are visible wherever someone
    // lands. The long-form detail (scaling, recommended) is a collapsible on the FAQ page; this is
    // the at-a-glance version.
    var box = document.createElement("div");
    box.className = "foot-note";
    box.innerHTML =
      '<div class="foot-note-head">System requirements</div>' +
      noteRow("os", "<b>OS</b>" + plat("apple", "macOS 14+ (Apple silicon)") +
        plat("windows", "Windows 10/11 (64-bit)") + plat("linux", "Linux (coming soon)")) +
      noteRow("ram", "<b>RAM</b> 4 GB+ (16 GB+ for on-device AI)") +
      noteRow("disk", "<b>Storage</b> 500 MB + your data (SSD recommended)");
    // A copyright line stands in for the big mark: the mark is already in the top bar on every
    // page, and repeating it here bought nothing the sign-off line does not say better.
    // It sits ABOVE the grid, centred and full width, rather than inside the left column: stacked
    // over the requirements box it pushed that box down while the link box beside it started at the
    // top, so the two cards never lined up.
    var grid = brand.parentNode;
    var left = document.createElement("div");
    left.className = "foot-left";
    grid.insertBefore(left, brand);
    var sign = document.createElement("div");
    sign.className = "foot-sign";
    sign.innerHTML = "\u00a9 " + year + " MyBI. All rights reserved.";
    brand.remove();
    grid.parentNode.insertBefore(sign, grid);
    left.appendChild(box);

    if (cols) {
      // Dedupe: some pages listed Support under both Product and Help.
      var seen = {};
      cols.querySelectorAll(".foot-col a").forEach(function (a) {
        var label = a.textContent.trim();
        if (seen[label]) { a.remove(); return; }
        seen[label] = true;
        var key = LINK_ICON[label];
        if (key) a.innerHTML = svg(ICONS[key], "foot-link-ic") + "<span>" + label + "</span>";
      });
      cols.querySelectorAll("h4").forEach(function (h) {
        var name = h.textContent.trim();
        if (name === "Project") name = "Help";
        h.innerHTML = svg(ICONS[COL_ICON[name] || "product"], "foot-col-ic") + "<span>" + name + "</span>";
      });
      // Beside the left column, not beneath it.
      left.parentNode.appendChild(cols);
    }
    // Trademark attribution for the two store marks the site shows. It belongs wherever those marks
    // can appear, which is every page's chrome, so it is built here with the rest of the footer.
    var legal = document.createElement("div");
    legal.className = "foot-legal";
    // Icon and heading are one row so that narrow screens can rule a line under them and read the
    // small print as a titled block; wide screens hide the heading and keep the single line.
    legal.innerHTML = '<div class="foot-legal-h">' + svg(ICONS.info, "foot-legal-ic") +
      "<span>Trademarks</span></div>" +
      "<p>Apple, the Apple logo, Mac and Mac App Store are trademarks of Apple Inc. Microsoft, " +
      "the Microsoft logo, Windows and Microsoft Store are trademarks of the Microsoft group of " +
      "companies. MLX, Ollama, Claude, ChatGPT, Gemini, DeepSeek, Kimi and Perplexity are " +
      "trademarks of their respective owners. Every mark shown identifies only where MyBI can be " +
      "downloaded, which systems it runs on and which AI engines it can connect to. MyBI is an " +
      "independent product and is not affiliated with, endorsed by or sponsored by any of them. " +
      "The App Store and Microsoft Store download badges are each vendor's own artwork, shown " +
      "unaltered under their badge and marketing guidelines. Other logomarks from Simple Icons " +
      "(CC0 1.0).</p>";
    grid.parentNode.appendChild(legal);
    if (fb) fb.remove();
  });

  // ---- "Data → Dashboard → Share" draws itself once, the first time it is seen ----------------
  var flow = document.querySelector(".flowline");
  if (flow) {
    if (reduce || !window.IntersectionObserver) { flow.classList.add("go"); }
    else {
      var fio = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        flow.classList.add("go");
        fio.disconnect();                       // once per load, not once per scroll past
      }, { threshold: .6 });
      fio.observe(flow);
    }
  }

  // ---- Sample-project dialog -----------------------------------------------------------------
  var sampleBtn = document.getElementById("sample-open");
  var sampleDlg = document.getElementById("sample-dlg");
  if (sampleBtn && sampleDlg) {
    sampleBtn.addEventListener("click", function () {
      if (sampleDlg.showModal) sampleDlg.showModal(); else sampleDlg.setAttribute("open", "");
      // …otherwise showModal() parks focus on the close button and the dialog opens
      // with a ring around the one control you did not come here to press.
      sampleDlg.focus();
    });
    sampleDlg.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", function () { sampleDlg.close(); });
    });
    // Clicking the backdrop closes: the dialog element itself fills the whole viewport, so a click
    // landing ON it (rather than on its contents) is a backdrop click.
    // The press must have STARTED on the backdrop too. Selecting a line of the dialog's text and
    // releasing past its edge produces a click whose target is the dialog, so closing on the click
    // alone shut the dialog every time someone tried to select the text in it.
    var downOnBackdrop = false;
    sampleDlg.addEventListener("mousedown", function (e) { downOnBackdrop = e.target === sampleDlg; });
    sampleDlg.addEventListener("click", function (e) {
      if (e.target === sampleDlg && downOnBackdrop) sampleDlg.close();
      downOnBackdrop = false;
    });
  }
})();
