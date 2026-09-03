/* =========================================================
   Design Inspo — interactions (vanilla JS, no libraries)
   1. Scroll-reveal   2. Tilt-on-hover (Millls-style)   3. Marquee loop
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- 1. Scroll reveal: fade/slide elements in as they enter view ---- */
(() => {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  // Reveal anything already in or above the viewport on load (covers reloads that
  // restore scroll past an element, which the observer would otherwise skip).
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
    else io.observe(el);
  });

  const revealInView = () => items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
  });

  // Safety net: nothing should ever stay invisible if JS/observer hiccups.
  window.addEventListener("load", () => setTimeout(revealInView, 400));

  // Layout can shift across breakpoints (resize / orientation) — re-check then.
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(revealInView, 150); });
})();

/* ---- 1b. Nav auto-hide: only show the sticky nav at the very top ---- */
(() => {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const THRESHOLD = 8;
  const update = () => nav.classList.toggle("nav--hidden", window.scrollY > THRESHOLD);
  update();
  window.addEventListener("scroll", update, { passive: true });
})();

/* ---- 2. Tilt on hover: image leans toward the cursor ---- */
(() => {
  if (reduceMotion) return;
  const MAX = 8;            // max degrees of tilt
  const targets = document.querySelectorAll("[data-tilt]");

  targets.forEach((el) => {
    let raf = null;

    const onMove = (ev) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      const py = (ev.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform =
          `perspective(900px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) scale(1.02)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
    };

    el.style.transition = "transform .25s cubic-bezier(0.22,1,0.36,1)";
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
  });
})();

/* ---- 3b. Masonry: balance .collage--masonry tiles into the shortest column ---- */
(() => {
  const grids = document.querySelectorAll(".collage--masonry");
  if (!grids.length) return;

  grids.forEach((grid) => {
    const tiles = Array.from(grid.querySelectorAll(".tile"));
    if (!tiles.length) return;
    const colCount = () => (grid.clientWidth < 520 ? 1 : grid.clientWidth < 900 ? 2 : 3);
    let currentN = 0;

    const build = () => {
      const n = colCount();
      const frag = document.createDocumentFragment();
      const cols = [];
      for (let i = 0; i < n; i++) {
        const c = document.createElement("div");
        c.className = "collage__col";
        frag.appendChild(c);
        cols.push({ el: c, h: 0 });
      }
      // Drop each photo into the currently shortest column. Predicted height is
      // 1/aspect-ratio (all columns share a width), so no measuring pass is needed.
      // Longest-first (LPT): place the tallest photos first, each into the shortest
      // column. Predicted height is 1/aspect-ratio since every column shares a width.
      tiles
        .map((t) => {
          const img = t.querySelector("img");
          const ar = img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
          return { t, ph: 1 / ar };
        })
        .sort((a, b) => b.ph - a.ph)
        .forEach(({ t, ph }) => {
          let short = cols[0];
          for (const c of cols) if (c.h < short.h) short = c;
          short.el.appendChild(t);
          short.h += ph;
        });
      grid.replaceChildren(frag);
      currentN = n;
    };

    build();
    window.addEventListener("load", build); // re-balance once images report real sizes
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (colCount() !== currentN) build(); }, 150);
    });
  });
})();

/* ---- 3. Marquee: duplicate the track so the loop is seamless ---- */
(() => {
  const track = document.querySelector(".marquee__track");
  if (!track) return;
  track.innerHTML += track.innerHTML;   // clone content once for the -50% loop
})();

/* ---- 4. Pick images: click the photo to open that pick's shop link ---- */
(() => {
  const picks = document.querySelectorAll(".pick");
  if (!picks.length) return;

  picks.forEach((pick) => {
    const frame = pick.querySelector(".pick__frame");
    // Product cards use .pick__link; DIY cards use the "Shop supplies" pill.
    const link = pick.querySelector(".pick__link, .pick__pill--shop");
    if (!frame || !link || !link.href) return;

    frame.classList.add("is-clickable");
    frame.addEventListener("click", () => {
      window.open(link.href, link.target || "_blank", "noopener");
    });
  });
})();
