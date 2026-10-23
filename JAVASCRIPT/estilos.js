/* =====================================================
   CINE JAVI - general.js   (UN SOLO archivo para TODAS las páginas)
   Guárdalo en JAVASCRIPT/general.js y enlázalo en cada página:
   <script src="JAVASCRIPT/general.js"></script>

   TODO ES DE CINE:
   - Intro: cuenta atrás de película (3, 2, 1) y barras de cine que se abren
   - Escena 3D real (Three.js): cámara de cine con bobinas que giran,
     claqueta que "clapea" al hacer clic, bobinas de película, cintas de
     película que vuelan, haces de focos y polvo en la luz.
     La escena viaja al hacer scroll y la cámara te sigue con el ratón.
   - Ratón: visor de cámara con enfoque + timecode, estela de luz y
     destello de lente anamórfico (como en una película de Hollywood)
   - Pantalla: HUD de cámara (REC, timecode, ISO) y grano de película
   - Fotos, tablas y reseñas con inclinación 3D
   Three.js se carga solo desde internet (cdnjs). Sin internet, el resto
   de efectos sigue funcionando.
   ===================================================== */
(function () {
  "use strict";

  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  function iniciar() {
    var fino = window.matchMedia("(pointer: fine)").matches;
    var TEAL = [25, 227, 208];
    var NARANJA = [255, 122, 61];
    var W = window.innerWidth, H = window.innerHeight;
    var mx = W / 2, my = H / 2, sx = mx, sy = my;
    var movido = 0, vel = 0, clapT = -10000;
    var t0 = performance.now();

    /* ---------- Estilos de todos los efectos ---------- */
    var st = document.createElement("style");
    st.textContent = [
      "#cj-fondo{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:0;transition:opacity 1.6s}",
      "#cj-fondo.cj-listo{opacity:1}",
      "#cj-fx{position:fixed;inset:0;width:100%;height:100%;z-index:9990;pointer-events:none}",
      "#cj-grano{position:fixed;inset:-50px;z-index:9991;pointer-events:none;opacity:.07}",
      "#cj-flash{position:fixed;inset:0;background:#fff;opacity:0;z-index:9992;pointer-events:none}",
      "#cj-flash.cj-on{animation:cjFlash .45s ease-out}",
      "@keyframes cjFlash{0%{opacity:.55}100%{opacity:0}}",
      "#cj-barra{position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;",
      "background:linear-gradient(90deg,#19e3d0,#ff7a3d)}",
      /* visor */
      "body.cj-fino,body.cj-fino a,body.cj-fino label,body.cj-fino button{cursor:none!important}",
      ".cj-visor{position:fixed;top:0;left:0;width:54px;height:54px;margin:-27px 0 0 -27px;z-index:9999;",
      "pointer-events:none;color:#fff;will-change:transform;transition:width .25s,height .25s,margin .25s,color .25s;",
      "background:linear-gradient(currentColor,currentColor) 0 0/14px 2px,linear-gradient(currentColor,currentColor) 0 0/2px 14px,",
      "linear-gradient(currentColor,currentColor) 100% 0/14px 2px,linear-gradient(currentColor,currentColor) 100% 0/2px 14px,",
      "linear-gradient(currentColor,currentColor) 0 100%/14px 2px,linear-gradient(currentColor,currentColor) 0 100%/2px 14px,",
      "linear-gradient(currentColor,currentColor) 100% 100%/14px 2px,linear-gradient(currentColor,currentColor) 100% 100%/2px 14px;",
      "background-repeat:no-repeat}",
      ".cj-visor.cj-foco{width:34px;height:34px;margin:-17px 0 0 -17px;color:#19e3d0}",
      ".cj-visor.cj-click{width:42px;height:42px;margin:-21px 0 0 -21px;color:#ff7a3d}",
      ".cj-visor i{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:currentColor}",
      ".cj-visor em{position:absolute;left:62px;top:-2px;font:600 10px/1.2 ui-monospace,Consolas,monospace;",
      "font-style:normal;letter-spacing:.08em;white-space:nowrap;color:#fff;opacity:.85}",
      /* HUD */
      ".cj-hud{position:fixed;z-index:9000;pointer-events:none;font:600 11px/1 ui-monospace,Consolas,monospace;",
      "letter-spacing:.1em;color:rgba(255,255,255,.85)}",
      ".cj-hud-a{left:18px;bottom:16px}.cj-hud-b{right:18px;bottom:16px}.cj-hud-c{right:18px;top:14px}",
      ".cj-hud b{display:inline-block;width:9px;height:9px;margin-right:8px;border-radius:50%;background:#ff2a3a;",
      "animation:cjRec 1.1s steps(2,start) infinite}",
      "@keyframes cjRec{to{visibility:hidden}}",
      /* intro */
      "#cj-intro{position:fixed;inset:0;z-index:100000;background:#0a0a0a;display:flex;align-items:center;justify-content:center;",
      "transition:opacity .35s}",
      "#cj-intro.cj-fuera{opacity:0}",
      ".cj-lider{position:relative;width:min(62vmin,420px);height:min(62vmin,420px);border:3px solid #d8d8d8;border-radius:50%}",
      ".cj-lider::before,.cj-lider::after{content:'';position:absolute;background:#d8d8d8}",
      ".cj-lider::before{left:50%;top:-14%;width:2px;height:128%;margin-left:-1px}",
      ".cj-lider::after{top:50%;left:-14%;height:2px;width:128%;margin-top:-1px}",
      ".cj-barrido{position:absolute;inset:0;border-radius:50%;animation:cjGiro .48s linear infinite;",
      "background:conic-gradient(from 0deg,rgba(255,255,255,.3) 0 90deg,transparent 90deg)}",
      "@keyframes cjGiro{to{transform:rotate(360deg)}}",
      ".cj-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;z-index:2;",
      "font:800 min(34vmin,230px)/1 Syne,Impact,sans-serif;animation:cjPop .48s ease-out infinite}",
      "@keyframes cjPop{0%{transform:scale(1.25);opacity:.2}30%{opacity:1}100%{transform:scale(1)}}",
      ".cj-bar{position:fixed;left:0;width:100%;height:50vh;background:#000;z-index:99999;",
      "transition:height 1.2s cubic-bezier(.77,0,.18,1)}",
      ".cj-bar.cj-sup{top:0}.cj-bar.cj-inf{bottom:0}.cj-bar.cj-abrir{height:0}",
      /* aparición y 3D */
      ".cj-oculto{opacity:0;translate:0 44px}",
      ".cj-visible{opacity:1;translate:0 0;transition:opacity .8s ease,translate .9s cubic-bezier(.16,1,.3,1)}",
      ".cj-3d{position:relative;transform-style:preserve-3d;will-change:transform}",
      ".cj-3d::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;",
      "transition:opacity .3s;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.22),transparent 55%)}",
      ".cj-3d:hover::after{opacity:1}",
      ".bloque-comentario .avatar-comentario{transform:translateZ(46px)}",
      "@media(max-width:640px){.cj-hud-c{display:none}}"
    ].join("");
    document.head.appendChild(st);
    if (fino) document.body.classList.add("cj-fino");

    /* =====================================================
       INTRO: barras de cine (+ cuenta atrás la primera vez)
       ===================================================== */
    var sup = document.createElement("div"); sup.className = "cj-bar cj-sup";
    var inf = document.createElement("div"); inf.className = "cj-bar cj-inf";
    document.body.appendChild(sup); document.body.appendChild(inf);

    function abrirBarras() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          sup.classList.add("cj-abrir"); inf.classList.add("cj-abrir");
        });
      });
      setTimeout(function () { sup.remove(); inf.remove(); }, 1500);
    }

    function intro(cuando) {
      var visto = false;
      try { visto = sessionStorage.getItem("cj-intro"); } catch (e) {}
      if (visto) { abrirBarras(); cuando(); return; }
      try { sessionStorage.setItem("cj-intro", "1"); } catch (e) {}
      var d = document.createElement("div");
      d.id = "cj-intro";
      d.innerHTML = '<div class="cj-lider"><div class="cj-barrido"></div><div class="cj-num">3</div></div>';
      document.body.appendChild(d);
      var num = d.querySelector(".cj-num"), n = 3;
      var iv = setInterval(function () {
        n--;
        if (n > 0) { num.textContent = n; return; }
        clearInterval(iv);
        d.classList.add("cj-fuera");
        flash();
        abrirBarras();
        cuando();
        setTimeout(function () { d.remove(); }, 450);
      }, 480);
    }

    var flashEl = document.createElement("div");
    flashEl.id = "cj-flash";
    document.body.appendChild(flashEl);
    function flash() {
      flashEl.classList.remove("cj-on"); void flashEl.offsetWidth; flashEl.classList.add("cj-on");
    }

    /* =====================================================
       EFECTOS 2D: estela de luz, destello de lente, ondas, chispas
       ===================================================== */
    var fx = document.createElement("canvas");
    fx.id = "cj-fx";
    document.body.appendChild(fx);
    var cx = fx.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function ajustarFx() {
      W = window.innerWidth; H = window.innerHeight;
      fx.width = W * dpr; fx.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ajustarFx();

    var puntos = [], ondas = [], chispas = [];
    var VIDA = 520;

    function mezcla(k) {
      return [Math.round(TEAL[0] + (NARANJA[0] - TEAL[0]) * k),
              Math.round(TEAL[1] + (NARANJA[1] - TEAL[1]) * k),
              Math.round(TEAL[2] + (NARANJA[2] - TEAL[2]) * k)];
    }
    function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

    function destello() {
      if (!fino) return;
      var inten = 0.16 + vel * 0.7;
      var x = sx, y = sy;
      var g = cx.createLinearGradient(x - 380, y, x + 380, y);
      g.addColorStop(0, "rgba(25,227,208,0)");
      g.addColorStop(0.5, "rgba(170,255,246," + inten + ")");
      g.addColorStop(1, "rgba(25,227,208,0)");
      cx.fillStyle = g;
      cx.fillRect(x - 380, y - 1.3, 760, 2.6);
      var r = cx.createRadialGradient(x, y, 0, x, y, 40);
      r.addColorStop(0, "rgba(255,255,255," + (0.35 * inten + 0.12) + ")");
      r.addColorStop(1, "rgba(255,150,80,0)");
      cx.fillStyle = r;
      cx.beginPath(); cx.arc(x, y, 40, 0, Math.PI * 2); cx.fill();
      var ox = W / 2 - x, oy = H / 2 - y;
      var fantasmas = [[0.35, 20, TEAL], [0.7, 38, NARANJA], [1.05, 14, TEAL], [1.45, 56, NARANJA]];
      for (var i = 0; i < fantasmas.length; i++) {
        var f = fantasmas[i], gx = x + ox * f[0], gy = y + oy * f[0];
        cx.strokeStyle = rgba(f[2], 0.1 + vel * 0.35);
        cx.fillStyle = rgba(f[2], 0.035 + vel * 0.08);
        cx.lineWidth = 1.5;
        cx.beginPath(); cx.arc(gx, gy, f[1], 0, Math.PI * 2); cx.fill(); cx.stroke();
      }
    }

    function dibujarFx(ahora) {
      cx.clearRect(0, 0, W, H);
      cx.globalCompositeOperation = "lighter";
      cx.lineCap = "round";
      while (puntos.length && ahora - puntos[0].t > VIDA) puntos.shift();
      var n = puntos.length;
      for (var i = 1; i < n; i++) {
        var a = puntos[i - 1], b = puntos[i], k = i / n;
        var vida = Math.max(0, 1 - (ahora - b.t) / VIDA), c = mezcla(k);
        cx.strokeStyle = rgba(c, 0.2 * vida); cx.lineWidth = 6 + k * 22 * vida;
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
        cx.strokeStyle = "rgba(255,255,255," + 0.9 * vida + ")"; cx.lineWidth = 0.8 + k * 3 * vida;
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      }
      for (var o = ondas.length - 1; o >= 0; o--) {
        var w = ondas[o], e = (ahora - w.t) / 900;
        if (e < 0) continue;
        if (e >= 1) { ondas.splice(o, 1); continue; }
        cx.strokeStyle = rgba(mezcla(w.d), 1 - e);
        cx.lineWidth = 3 * (1 - e) + 0.5;
        cx.beginPath(); cx.arc(w.x, w.y, 10 + e * 170 * (1 + w.d), 0, Math.PI * 2); cx.stroke();
      }
      for (var s = chispas.length - 1; s >= 0; s--) {
        var p = chispas[s];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.vida -= 0.025;
        if (p.vida <= 0) { chispas.splice(s, 1); continue; }
        cx.strokeStyle = rgba(mezcla(p.k), p.vida); cx.lineWidth = 2.2 * p.vida;
        cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); cx.stroke();
      }
      destello();
      cx.globalCompositeOperation = "source-over";
    }

    window.addEventListener("mousemove", function (e) {
      var dx = e.clientX - mx, dy = e.clientY - my;
      movido += Math.sqrt(dx * dx + dy * dy);
      mx = e.clientX; my = e.clientY;
      puntos.push({ x: mx, y: my, t: performance.now() });
    });
    window.addEventListener("mousedown", function (e) {
      var ahora = performance.now();
      clapT = ahora;
      ondas.push({ x: e.clientX, y: e.clientY, t: ahora, d: 0 });
      ondas.push({ x: e.clientX, y: e.clientY, t: ahora + 90, d: 1 });
      for (var i = 0; i < 22; i++) {
        var ang = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
        chispas.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, vida: 1, k: Math.random() });
      }
      flash();
      if (visor) visor.classList.add("cj-click");
    });
    window.addEventListener("mouseup", function () { if (visor) visor.classList.remove("cj-click"); });

    /* =====================================================
       VISOR DE CÁMARA (cursor) + HUD + GRANO
       ===================================================== */
    function timecode(ms) {
      var f = Math.floor(ms / (1000 / 24)) % 24, s = Math.floor(ms / 1000);
      function d(v) { return (v < 10 ? "0" : "") + v; }
      return d(Math.floor(s / 3600)) + ":" + d(Math.floor(s / 60) % 60) + ":" + d(s % 60) + ":" + d(f);
    }

    var visor = null, etiqueta = null, vx = mx, vy = my;
    if (fino) {
      visor = document.createElement("div");
      visor.className = "cj-visor";
      visor.innerHTML = "<i></i><em>AF</em>";
      document.body.appendChild(visor);
      etiqueta = visor.querySelector("em");
      var INTER = "a, button, label, input, textarea, select";
      document.addEventListener("mouseover", function (e) {
        if (e.target.closest(INTER)) { visor.classList.add("cj-foco"); etiqueta.textContent = "FOCO"; }
      });
      document.addEventListener("mouseout", function (e) {
        if (e.target.closest(INTER)) { visor.classList.remove("cj-foco"); etiqueta.textContent = "AF"; }
      });
    }

    var hudA = document.createElement("div"); hudA.className = "cj-hud cj-hud-a";
    hudA.innerHTML = "<b></b><span>REC 00:00:00:00</span>";
    var hudB = document.createElement("div"); hudB.className = "cj-hud cj-hud-b";
    hudB.textContent = "24 FPS  ·  1/48  ·  F2.8";
    var hudC = document.createElement("div"); hudC.className = "cj-hud cj-hud-c";
    hudC.textContent = "ISO 800  ·  5600K  ·  4K RAW";
    document.body.appendChild(hudA); document.body.appendChild(hudB); document.body.appendChild(hudC);
    var tcEl = hudA.querySelector("span");

    var ruido = document.createElement("canvas");
    ruido.width = ruido.height = 128;
    var rc = ruido.getContext("2d"), img = rc.createImageData(128, 128);
    for (var q = 0; q < img.data.length; q += 4) {
      var v = Math.random() * 255;
      img.data[q] = img.data[q + 1] = img.data[q + 2] = v; img.data[q + 3] = Math.random() * 160;
    }
    rc.putImageData(img, 0, 0);
    var grano = document.createElement("div");
    grano.id = "cj-grano";
    grano.style.backgroundImage = "url(" + ruido.toDataURL() + ")";
    document.body.appendChild(grano);
    setInterval(function () {
      grano.style.backgroundPosition = (Math.random() * 128) + "px " + (Math.random() * 128) + "px";
    }, 90);

    /* =====================================================
       INCLINACIÓN 3D + BOTONES MAGNÉTICOS
       ===================================================== */
    var items = [];
    function permitido(el) {
      return !el.closest("header") &&
        !el.matches('[alt="Logotipo"], [src$="Logo.png"], [src$="licencia.png"], .avatar-comentario');
    }
    function crearTilt(el) {
      var it = { el: el, rx: 0, ry: 0, trx: 0, trY: 0, s: 1, ts: 1, activo: false, tipo: "tilt" };
      var max = el.tagName === "TABLE" ? 8 : 11;
      if (el.tagName !== "IMG") el.classList.add("cj-3d");
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        it.trY = (px - 0.5) * max * 2; it.trx = (0.5 - py) * max * 2; it.ts = 1.035; it.activo = true;
        el.style.setProperty("--mx", px * 100 + "%"); el.style.setProperty("--my", py * 100 + "%");
      });
      el.addEventListener("mouseleave", function () { it.trx = 0; it.trY = 0; it.ts = 1; });
      items.push(it);
    }
    function crearIman(el) {
      var it = { el: el, x: 0, y: 0, tx: 0, ty: 0, activo: false, tipo: "iman" };
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        it.tx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        it.ty = (e.clientY - (r.top + r.height / 2)) * 0.45;
        it.activo = true;
      });
      el.addEventListener("mouseleave", function () { it.tx = 0; it.ty = 0; });
      items.push(it);
    }
    if (fino) {
      Array.prototype.forEach.call(
        document.querySelectorAll(".bloque-comentario, .formulario-contacto, table, center > img, body > img"),
        function (el) { if (permitido(el)) crearTilt(el); });
      Array.prototype.forEach.call(document.querySelectorAll("center > a"), crearIman);
    }
    function actualizarItems() {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.activo) continue;
        if (it.tipo === "tilt") {
          it.rx += (it.trx - it.rx) * 0.12; it.ry += (it.trY - it.ry) * 0.12; it.s += (it.ts - it.s) * 0.12;
          if (Math.abs(it.rx) < 0.01 && Math.abs(it.ry) < 0.01 && it.ts === 1 && Math.abs(it.s - 1) < 0.0005) {
            it.el.style.transform = ""; it.activo = false; it.rx = it.ry = 0; it.s = 1; continue;
          }
          it.el.style.transform = "perspective(1000px) rotateX(" + it.rx.toFixed(2) + "deg) rotateY(" +
            it.ry.toFixed(2) + "deg) scale(" + it.s.toFixed(4) + ")";
        } else {
          it.x += (it.tx - it.x) * 0.15; it.y += (it.ty - it.y) * 0.15;
          if (Math.abs(it.x) < 0.05 && Math.abs(it.y) < 0.05 && it.tx === 0 && it.ty === 0) {
            it.el.style.transform = ""; it.activo = false; it.x = it.y = 0; continue;
          }
          it.el.style.transform = "translate(" + it.x.toFixed(2) + "px," + it.y.toFixed(2) + "px)";
        }
      }
    }

    /* =====================================================
       BARRA DE PROGRESO + APARICIÓN AL HACER SCROLL
       ===================================================== */
    var barra = document.createElement("div");
    barra.id = "cj-barra";
    document.body.appendChild(barra);
    function progreso() {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    }
    window.addEventListener("scroll", function () { barra.style.width = progreso() * 100 + "%"; }, { passive: true });

    function activarAparicion() {
      if (!("IntersectionObserver" in window)) return;
      var obs = new IntersectionObserver(function (entradas) {
        var idx = 0;
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          el.style.transitionDelay = (idx++ * 90) + "ms";
          el.classList.remove("cj-oculto"); el.classList.add("cj-visible");
          obs.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ""; }, 1500);
        });
      }, { threshold: 0.12 });
      document.querySelectorAll("h1, blockquote, p, hr, table, center > img, body > img, .bloque-comentario, .formulario-contacto")
        .forEach(function (el) {
          if (el.closest("header") || el.matches('[alt="Logotipo"], [src$="Logo.png"]')) return;
          el.classList.add("cj-oculto"); obs.observe(el);
        });
    }

    /* =====================================================
       ESCENA 3D DE CINE (Three.js)
       ===================================================== */
    var escena = null;

    function crearEscena(THREE) {
      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      } catch (e) { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(W, H);
      renderer.setClearColor(0x05070d, 1);
      var lienzo = renderer.domElement;
      lienzo.id = "cj-fondo";
      document.body.appendChild(lienzo);

      var scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05070d, 0.026);
      var cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 120);
      cam.position.set(0, 0, 13);
      scene.add(cam);

      /* luces pegadas a la cámara: siempre iluminan lo que se ve */
      cam.add(new THREE.AmbientLight(0x56607a, 1.1));
      var l1 = new THREE.PointLight(0x19e3d0, 2.6, 60); l1.position.set(-8, 4, 4); cam.add(l1);
      var l2 = new THREE.PointLight(0xff7a3d, 2.6, 60); l2.position.set(8, -3, 4); cam.add(l2);
      var l3 = new THREE.PointLight(0xffffff, 1.3, 60); l3.position.set(0, 7, 6); cam.add(l3);

      function mat(color, met, rug, emi) {
        return new THREE.MeshStandardMaterial({ color: color, metalness: met, roughness: rug, emissive: emi || 0x000000 });
      }
      function caja(w, h, d, m, x, y, z) {
        var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); return o;
      }
      function cil(r1, r2, h, m, x, y, z, eje) {
        var g = new THREE.CylinderGeometry(r1, r2, h, 36);
        if (eje === "z") g.rotateX(Math.PI / 2);
        if (eje === "x") g.rotateZ(Math.PI / 2);
        var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o;
      }

      /* ---------- CÁMARA DE CINE ---------- */
      var camara = new THREE.Group();
      var gris = mat(0x1d222c, 0.75, 0.32), negro = mat(0x0b0d12, 0.5, 0.5);
      var cromo = mat(0xc9d2de, 1, 0.18), acento = mat(0x19e3d0, 0.6, 0.3, 0x0a6b63);
      camara.add(caja(1.6, 1.5, 2.8, gris));                       // cuerpo
      camara.add(caja(1.7, 0.1, 2.9, negro, 0, -0.8, 0));          // base
      camara.add(cil(0.55, 0.55, 0.9, negro, 0, 0, 1.85, "z"));    // tubo del objetivo
      camara.add(cil(0.72, 0.72, 0.55, gris, 0, 0, 2.45, "z"));    // anillo de enfoque
      camara.add(cil(0.745, 0.745, 0.08, acento, 0, 0, 2.2, "z")); // aro de color
      camara.add(cil(0.745, 0.745, 0.08, acento, 0, 0, 2.7, "z"));
      camara.add(cil(0.6, 0.6, 0.06, mat(0x082c4d, 1, 0.04, 0x0b4f86), 0, 0, 2.76, "z")); // cristal
      camara.add(cil(0.3, 0.3, 0.07, mat(0x1b7fd1, 1, 0.02, 0x1566a8), 0, 0, 2.8, "z"));  // reflejo
      camara.add(caja(2.2, 0.07, 1.0, negro, 0, 1.05, 3.45));      // parasol superior
      camara.add(caja(0.07, 1.6, 1.0, negro, -1.1, 0, 3.45));      // parasol izq.
      camara.add(caja(0.07, 1.6, 1.0, negro, 1.1, 0, 3.45));       // parasol der.
      camara.add(caja(0.5, 0.5, 1.0, negro, -0.95, 0.4, -0.5));    // visor
      camara.add(cil(0.28, 0.28, 0.25, cromo, -0.95, 0.4, -1.1, "z"));
      camara.add(caja(1.7, 0.1, 0.14, cromo, 0, 0.8, 0.9));        // asa
      camara.add(caja(0.09, 0.4, 0.14, cromo, -0.8, 0.62, 0.9));
      camara.add(caja(0.09, 0.4, 0.14, cromo, 0.8, 0.62, 0.9));
      camara.add(caja(0.08, 0.95, 1.3, negro, 1.2, 0.1, 0.4));     // monitor
      camara.add(caja(0.02, 0.8, 1.15, mat(0x0a3f57, 0.2, 0.2, 0x13a8b8), 1.255, 0.1, 0.4));

      var tally = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), mat(0xff2a3a, 0, 0.4, 0xff2a3a));
      tally.position.set(0, 0.55, 1.45); camara.add(tally);

      var tapas = [];                                              // bobinas encima
      [-0.6, 1.05].forEach(function (z) {
        var g = new THREE.Group(); g.position.set(0, 1.9, z);
        g.add(cil(0.8, 0.8, 0.34, mat(0x232a36, 0.8, 0.3), 0, 0, 0, "x"));
        g.add(cil(0.14, 0.14, 0.4, cromo, 0, 0, 0, "x"));
        [0, 1, 2].forEach(function (i) {
          var r = caja(0.37, 1.2, 0.17, mat(0xff7a3d, 0.4, 0.4, 0x7a2a0a));
          r.rotation.x = i * Math.PI / 3; g.add(r);
        });
        camara.add(g); tapas.push(g);
      });

      var trip = new THREE.Group();                                // trípode
      trip.add(cil(0.35, 0.35, 0.5, negro, 0, -1.15, 0));
      [0, 1, 2].forEach(function (i) {
        var pata = cil(0.07, 0.05, 3.2, negro, 0, 0, 0);
        var piv = new THREE.Group(); piv.position.set(0, -1.4, 0);
        pata.position.y = -1.6; piv.add(pata);
        piv.rotation.order = "YXZ"; piv.rotation.y = i * Math.PI * 2 / 3; piv.rotation.x = 0.38;
        trip.add(piv);
      });
      camara.add(trip);
      scene.add(camara);

      /* ---------- CLAQUETA ---------- */
      function texClaqueta() {
        var c = document.createElement("canvas"); c.width = 512; c.height = 360;
        var g = c.getContext("2d");
        g.fillStyle = "#101319"; g.fillRect(0, 0, 512, 360);
        g.strokeStyle = "#e8eef5"; g.lineWidth = 3;
        g.fillStyle = "#e8eef5"; g.font = "700 26px Arial";
        var filas = [["PRODUCCIÓN", "CINE JAVI"], ["DIRECTOR", "TÚ"], ["CÁMARA", "A"]];
        for (var i = 0; i < 3; i++) {
          g.strokeRect(14, 14 + i * 74, 484, 66);
          g.font = "600 17px Arial"; g.fillText(filas[i][0], 26, 40 + i * 74);
          g.font = "800 30px Arial"; g.fillText(filas[i][1], 26, 70 + i * 74);
        }
        g.strokeRect(14, 238, 150, 108); g.strokeRect(164, 238, 150, 108); g.strokeRect(314, 238, 184, 108);
        g.font = "600 17px Arial";
        g.fillText("ESCENA", 26, 264); g.fillText("TOMA", 176, 264); g.fillText("FECHA", 326, 264);
        g.font = "800 44px Arial";
        g.fillText("1", 26, 322); g.fillText("1", 176, 322);
        var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
      }
      function texRayas() {
        var c = document.createElement("canvas"); c.width = 512; c.height = 64;
        var g = c.getContext("2d");
        g.fillStyle = "#f4f6f9"; g.fillRect(0, 0, 512, 64);
        g.fillStyle = "#0e1016";
        for (var x = -64; x < 560; x += 96) {
          g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 48, 64); g.lineTo(x + 80, 0); g.lineTo(x + 32, 0); g.closePath(); g.fill();
        }
        return new THREE.CanvasTexture(c);
      }
      var claqueta = new THREE.Group();
      var cara = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.1), new THREE.MeshStandardMaterial({ map: texClaqueta(), roughness: 0.6, metalness: 0.1 }));
      cara.position.set(0, 0, 0.07); claqueta.add(cara);
      claqueta.add(caja(3.08, 2.18, 0.12, mat(0x101319, 0.3, 0.6)));
      var rayasMat = new THREE.MeshStandardMaterial({ map: texRayas(), roughness: 0.5, metalness: 0.1 });
      var fija = caja(3.08, 0.38, 0.16, rayasMat, 0, 1.28, 0); claqueta.add(fija);
      var bisagra = new THREE.Group(); bisagra.position.set(-1.54, 1.5, 0);
      var tapa = caja(3.08, 0.38, 0.16, rayasMat, 1.54, 0.22, 0.02); bisagra.add(tapa);
      claqueta.add(bisagra);
      scene.add(claqueta);

      /* ---------- BOBINAS DE PELÍCULA ---------- */
      function crearBobina(color) {
        var ext = new THREE.Group(), den = new THREE.Group();
        den.rotation.x = Math.PI / 2; ext.add(den);
        den.add(cil(1.5, 1.5, 0.3, mat(0x1b202a, 0.8, 0.3)));
        den.add(cil(1.52, 1.52, 0.06, mat(color, 0.7, 0.3, 0x1a1a1a)));
        den.add(cil(0.9, 0.9, 0.32, mat(0x2a1a10, 0.1, 0.9)));            // película enrollada
        den.add(cil(0.28, 0.28, 0.4, cromo));
        for (var i = 0; i < 6; i++) {
          var a = i * Math.PI / 3, h = cil(0.24, 0.24, 0.34, mat(0x04050a, 0.2, 0.8));
          h.position.set(Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12);
          den.add(h);
        }
        return ext;
      }
      var bob1 = crearBobina(0x19e3d0), bob2 = crearBobina(0xff7a3d);
      scene.add(bob1); scene.add(bob2);

      /* ---------- CINTAS DE PELÍCULA ---------- */
      function texCinta() {
        var c = document.createElement("canvas"); c.width = 512; c.height = 128;
        var g = c.getContext("2d");
        g.fillStyle = "#0c0d10"; g.fillRect(0, 0, 512, 128);
        g.fillStyle = "#d4dbe4";
        for (var x = 10; x < 512; x += 32) { g.fillRect(x, 8, 14, 12); g.fillRect(x, 108, 14, 12); }
        var cols = [["#19e3d0", "#0a3d66"], ["#ff7a3d", "#4a1038"], ["#e61f73", "#1c1245"], ["#ffd21f", "#7a2a10"]];
        for (var i = 0; i < 4; i++) {
          var fx0 = i * 128 + 8, gr = g.createLinearGradient(fx0, 28, fx0 + 112, 100);
          gr.addColorStop(0, cols[i][0]); gr.addColorStop(1, cols[i][1]);
          g.fillStyle = gr; g.fillRect(fx0, 28, 112, 72);
        }
        var t = new THREE.CanvasTexture(c);
        t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
      }
      function crearCinta(pts, ancho, rep) {
        var curva = new THREE.CatmullRomCurve3(pts), N = 280;
        var fr = curva.computeFrenetFrames(N, false);
        var pos = [], uv = [], idx = [];
        for (var i = 0; i <= N; i++) {
          var p = curva.getPoint(i / N), b = fr.binormals[i], h = ancho / 2;
          pos.push(p.x - b.x * h, p.y - b.y * h, p.z - b.z * h, p.x + b.x * h, p.y + b.y * h, p.z + b.z * h);
          uv.push(i / N * rep, 0, i / N * rep, 1);
          if (i < N) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        var tx = texCinta();
        var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide, color: 0xc0cad6 }));
        m.userData.tx = tx; return m;
      }
      var TOUR = 30;
      var ptsA = [], ptsB = [];
      for (var i = 0; i <= 14; i++) {
        ptsA.push(new THREE.Vector3(Math.sin(i * 0.85) * 8, 4 - i * 2.4, Math.cos(i * 0.6) * 3 - 3));
        ptsB.push(new THREE.Vector3(Math.cos(i * 0.7 + 1) * 9, 2 - i * 2.4, Math.sin(i * 0.8) * 3 - 5));
      }
      var cintaA = crearCinta(ptsA, 1.5, 48), cintaB = crearCinta(ptsB, 1.2, 40);
      scene.add(cintaA); scene.add(cintaB);

      /* ---------- HACES DE FOCOS ---------- */
      var matHaz = function (col) {
        return new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
          uniforms: { c: { value: new THREE.Color(col) } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
          fragmentShader: "varying vec2 vUv; uniform vec3 c; void main(){ float a = pow(vUv.y, 1.6) * 0.2; gl_FragColor = vec4(c * a, a); }"
        });
      };
      var haces = [];
      [[-6, 0x19e3d0], [1, 0xff7a3d], [7, 0xcfe8ff]].forEach(function (d) {
        var piv = new THREE.Group(); piv.position.set(d[0], 9, -14);
        var cono = new THREE.Mesh(new THREE.ConeGeometry(4.2, 26, 40, 1, true), matHaz(d[1]));
        cono.position.y = -13; piv.add(cono); cam.add(piv); haces.push(piv);
      });

      /* ---------- POLVO EN LA LUZ ---------- */
      function texPunto() {
        var c = document.createElement("canvas"); c.width = c.height = 64;
        var g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = r; g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      }
      var nPolvo = fino ? 500 : 200, arr = new Float32Array(nPolvo * 3);
      for (var k = 0; k < nPolvo; k++) {
        arr[k * 3] = (Math.random() - 0.5) * 34;
        arr[k * 3 + 1] = Math.random() * -(TOUR + 14) + 6;
        arr[k * 3 + 2] = (Math.random() - 0.5) * 14 - 1;
      }
      var gp = new THREE.BufferGeometry();
      gp.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      var polvo = new THREE.Points(gp, new THREE.PointsMaterial({
        size: 0.14, map: texPunto(), transparent: true, opacity: 0.65, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xffe6c8
      }));
      scene.add(polvo);

      /* ---------- Recorrido y animación ---------- */
      var camY = 0, ultimo = performance.now();

      function colocar() {
        var asp = W / H, k = Math.min(1, asp / 1.6);
        camara.position.set(6.2 * k + (k < 0.6 ? 0.5 : 0), -0.4, 0);
        camara.scale.setScalar(0.5 + 0.5 * k);
        claqueta.position.set(-5.8 * k, -10.5, 0);
        claqueta.scale.setScalar(0.6 + 0.5 * k);
        bob1.position.set(6 * k, -19, 0); bob1.scale.setScalar(0.6 + 0.4 * k);
        bob2.position.set(-4.8 * k, -25, -2); bob2.scale.setScalar(0.6 + 0.4 * k);
      }
      colocar();

      escena = {
        redimensionar: function () {
          renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); colocar();
        },
        dibujar: function (ahora) {
          var dt = Math.min((ahora - ultimo) / 1000, 0.05); ultimo = ahora;
          var t = (ahora - t0) / 1000;
          var mxn = (sx / W - 0.5) * 2, myn = (sy / H - 0.5) * 2;
          var clap = (ahora - clapT) / 1000;

          camY += (-progreso() * TOUR - camY) * 0.06;
          cam.position.x += (mxn * 0.9 - cam.position.x) * 0.04;
          cam.position.y += (camY - myn * 0.6 - cam.position.y) * 0.08;

          var boost = clap < 1.2 ? (1.2 - clap) * 6 : 0;
          camara.position.y = -0.4 + Math.sin(t * 0.8) * 0.25;
          camara.rotation.y = -0.65 + mxn * 0.55 + Math.sin(t * 0.3) * 0.12;
          camara.rotation.x = myn * 0.18;
          tapas.forEach(function (g, i) { g.rotation.x += dt * (1.6 + boost) * (i ? -1 : 1); });
          tally.material.emissiveIntensity = Math.sin(t * 5) > 0 ? 1 : 0.08;

          /* la claqueta clapea al hacer clic */
          var ang = 0.5 + Math.sin(t * 0.9) * 0.18;
          if (clap < 0.8) {
            var e = clap / 0.8;
            ang = e < 0.22 ? 0.65 * (1 - e / 0.22) : 0.65 * Math.pow((e - 0.22) / 0.78, 1.6) + 0.02;
          }
          bisagra.rotation.z = ang;
          claqueta.position.y = -10.5 + Math.sin(t * 0.7) * 0.2;
          claqueta.rotation.y = 0.5 + mxn * 0.4 + Math.sin(t * 0.4) * 0.12;
          claqueta.rotation.x = -myn * 0.15;
          claqueta.rotation.z = -0.1 + Math.sin(t * 0.5) * 0.05;

          bob1.rotation.z += dt * (0.7 + boost * 0.4); bob1.rotation.y = -0.5 + mxn * 0.4; bob1.rotation.x = -myn * 0.2;
          bob2.rotation.z -= dt * (0.5 + boost * 0.4); bob2.rotation.y = 0.5 + mxn * 0.4; bob2.rotation.x = -myn * 0.2;

          cintaA.userData.tx.offset.x -= dt * 0.05;
          cintaB.userData.tx.offset.x += dt * 0.04;
          haces.forEach(function (h, i) { h.rotation.z = Math.sin(t * 0.45 + i * 2) * 0.28 + mxn * 0.12; });
          polvo.rotation.y = t * 0.012;
          polvo.position.y = Math.sin(t * 0.2) * 0.4;

          renderer.render(scene, cam);
        }
      };
      requestAnimationFrame(function () { lienzo.classList.add("cj-listo"); });
    }

    function cargarThree(cb) {
      if (window.THREE) { cb(window.THREE); return; }
      var s = document.createElement("script");
      s.src = THREE_URL;
      s.onload = function () { if (window.THREE) cb(window.THREE); };
      s.onerror = function () { /* sin internet: quedan el resto de efectos */ };
      document.head.appendChild(s);
    }
    cargarThree(function (THREE) { try { crearEscena(THREE); } catch (e) { escena = null; } });

    window.addEventListener("resize", function () {
      ajustarFx();
      if (escena) escena.redimensionar();
    });

    /* ---------- Arranque ---------- */
    intro(function () { activarAparicion(); });

    /* =====================================================
       BUCLE PRINCIPAL
       ===================================================== */
    function bucle(ahora) {
      sx += (mx - sx) * 0.12; sy += (my - sy) * 0.12;
      vel += (Math.min(movido / 50, 1) - vel) * 0.12;
      movido = 0;

      if (escena) escena.dibujar(ahora);
      dibujarFx(ahora);
      actualizarItems();

      if (visor) {
        vx += (mx - vx) * 0.22; vy += (my - vy) * 0.22;
        visor.style.transform = "translate(" + vx.toFixed(1) + "px," + vy.toFixed(1) + "px)";
      }
      tcEl.textContent = "REC " + timecode(ahora - t0);
      requestAnimationFrame(bucle);
    }
    requestAnimationFrame(bucle);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();