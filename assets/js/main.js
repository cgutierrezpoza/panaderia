/* Cocina Básica · Recetario — interacciones */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Menú móvil */
  var toggle = $(".nav-toggle"), links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

  /* Aparición al hacer scroll */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  /* Botón volver arriba */
  var top = $(".to-top");
  if (top) {
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 700); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* Tarjetas que giran (táctil) */
  $$(".flip").forEach(function (f) { f.addEventListener("click", function () { f.classList.toggle("on"); }); });

  /* Filtros del recetario */
  var grid = $("#recipes");
  if (grid) {
    var cards = $$(".r-card", grid), tabs = $$(".tab"), q = $("#q"), empty = $(".empty"), area = "todas";
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var term = norm(q ? q.value.trim() : ""), shown = 0;
      cards.forEach(function (c) {
        var ok = (area === "todas" || c.dataset.area === area) && (!term || norm(c.dataset.search).indexOf(term) > -1);
        c.classList.toggle("hide", !ok);
        if (ok) { shown++; c.animate && c.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" }); }
      });
      if (empty) empty.classList.toggle("show", shown === 0);
    };
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        area = t.dataset.area;
        tabs.forEach(function (o) { o.setAttribute("aria-pressed", o === t); });
        apply();
      });
    });
    if (q) q.addEventListener("input", apply);
    var hash = location.hash.replace("#area-", "");
    if (hash) { var tb = $('.tab[data-area="' + hash + '"]'); if (tb) tb.click(); }
  }

  /* Receta al azar */
  var rnd = $("#random");
  if (rnd) {
    rnd.addEventListener("click", function () {
      var all = $$(".r-card");
      if (all.length) location.href = all[Math.floor(Math.random() * all.length)].getAttribute("href");
    });
  }

  /* Explorador de salsas madre */
  var exData = $("#explorer-data");
  if (exData) {
    var data = JSON.parse(exData.textContent), panel = $(".ex-panel"), btns = $$(".ex-btn");
    var show = function (i) {
      var d = data[i];
      btns.forEach(function (b, j) { b.setAttribute("aria-selected", i === j); });
      panel.style.setProperty("--area-bg", d.bg);
      var chips = d.deriv.map(function (x, k) {
        return '<div class="ex-chip" style="animation-delay:' + k * 45 + 'ms"><b>' + x[0] + '</b><span>' + x[1] + "</span></div>";
      }).join("");
      panel.innerHTML = '<span class="eyebrow" style="color:' + d.accent + '">' + d.area + "</span><h3>" + d.titulo +
        '</h3><p>' + d.desc + '</p><div class="ex-chips">' + chips + '</div><a class="btn btn-primary" href="' + d.href + '">Ver la receta →</a>';
    };
    btns.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
    show(0);
  }

  /* Escalador de porciones */
  var fmt = function (n) {
    var r = n < 1 ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10;
    return (r % 1 === 0 ? String(r) : String(r)).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  var scaler = $(".scaler");
  if (scaler) {
    var qtys = $$(".qty[data-min]"), yieldEl = $("#yield-val");
    $$("button", scaler).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = parseFloat(b.dataset.f);
        $$("button", scaler).forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
        qtys.forEach(function (el) {
          var mn = parseFloat(el.dataset.min) * f, mx = parseFloat(el.dataset.max) * f, u = el.dataset.u;
          el.textContent = (mn === mx ? fmt(mn) : fmt(mn) + "–" + fmt(mx)) + " " + u;
          el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
        });
        if (yieldEl) yieldEl.textContent = fmt(parseFloat(yieldEl.dataset.base) * f) + " " + yieldEl.dataset.u;
        var masa = $("#masa-val");
        if (masa) masa.textContent = fmt(parseFloat(masa.dataset.base) * f) + " g";
      });
    });
  }

  /* Porcentaje panadero */
  var bp = $(".bp-toggle");
  if (bp) {
    bp.addEventListener("click", function () {
      var panel = $(".ing-panel"), on = panel.classList.toggle("show-pct");
      bp.setAttribute("aria-pressed", on);
      bp.textContent = on ? "⚖️ Ver gramos" : "％ Ver porcentaje panadero";
    });
  }

  /* Pasos con progreso (se recuerdan en este navegador) */
  var steps = $$(".step");
  if (steps.length) {
    var key = "pan-pasos-" + (document.body.dataset.slug || "");
    var bar = $(".progress span"), label = $("#progress-txt");
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { saved = []; }
    var update = function () {
      var done = steps.filter(function (s) { return s.classList.contains("done"); }).length;
      if (bar) bar.style.width = (done / steps.length * 100) + "%";
      if (label) label.textContent = done === steps.length ? "¡Preparación lista! 🎉" : done + " de " + steps.length + " " + (label.dataset.u || "etapas");
      try { localStorage.setItem(key, JSON.stringify(steps.map(function (s) { return s.classList.contains("done"); }))); } catch (e) {}
    };
    steps.forEach(function (s, i) {
      if (saved[i]) s.classList.add("done");
      s.addEventListener("click", function () { s.classList.toggle("done"); s.setAttribute("aria-checked", s.classList.contains("done")); update(); });
      s.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); s.click(); } });
    });
    var reset = $(".reset");
    if (reset) reset.addEventListener("click", function () { steps.forEach(function (s) { s.classList.remove("done"); }); update(); });
    update();
  }

  /* Enlaces a los otros sitios (se configuran en assets/js/enlaces.js) */
  var toast = document.createElement("div");
  toast.className = "toast"; document.body.appendChild(toast);
  var avisar = function (t) { toast.textContent = t; toast.classList.add("show"); clearTimeout(avisar.t); avisar.t = setTimeout(function () { toast.classList.remove("show"); }, 2600); };
  var EN = window.ENLACES || {};
  $$("[data-enlace]").forEach(function (a) {
    var url = EN[a.dataset.enlace];
    if (url) { a.href = url; }
    else { a.addEventListener("click", function (e) { e.preventDefault(); avisar("¡Muy pronto! Esta sección está en preparación 🍳"); }); }
  });

  /* Explorador de puntos de cocción */
  var dnData = $("#doneness-data");
  if (dnData) {
    var dn = JSON.parse(dnData.textContent), dbtns = $$(".dn-btn"), dpanel = $(".dn-panel");
    var showDn = function (i) {
      var d = dn[i];
      dbtns.forEach(function (b, j) { b.setAttribute("aria-selected", i === j); });
      var stk = $(".steak", dpanel);
      stk.style.background = d.color;
      if (d.emoji) stk.textContent = d.emoji;
      $(".dn-info", dpanel).innerHTML = '<span class="temp">' + (d.ico || "🌡️") + " " + d.temp + '</span><h3>' + d.nombre + '</h3><p>' + d.texto + '</p>' + (d.tip ? '<span class="tip">💡 ' + d.tip + "</span>" : "");
    };
    dbtns.forEach(function (b, i) { b.addEventListener("click", function () { showDn(i); }); });
    showDn(parseInt(dnData.dataset.inicio || "1", 10));
  }

  /* Contador de visitas (servicio gratuito Abacus): cada navegador se cuenta una vez */
  var caja = $("#visitas");
  if (caja && window.fetch) {
    var API = "https://abacus.jasoncameron.dev", KEY = caja.dataset.contador, flag = "cb-visitado-" + KEY.replace(/\W/g, "");
    var ya = false;
    try { ya = localStorage.getItem(flag) === "1"; } catch (e) {}
    fetch(API + (ya ? "/get/" : "/hit/") + KEY).then(function (r) { return r.json(); }).then(function (d) {
      if (typeof d.value !== "number") return;
      try { localStorage.setItem(flag, "1"); } catch (e) {}
      var num = $("#visitas-num"), fin = d.value, t0 = null;
      caja.hidden = false;
      var paso = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1200, 1);
        num.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))).toLocaleString("es-CL");
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }).catch(function () {});
  }
})();
