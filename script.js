/* You shouldn't need to edit this file. Customize config.js instead. */
(function () {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  // ---------- Theme & basic text ----------
  const root = document.documentElement.style;
  Object.entries(SITE.theme || {}).forEach(([k, v]) => root.setProperty("--" + k, v));
  document.title = SITE.pageTitle || "Our Story";

  $("p1").textContent = SITE.partner1;
  $("p2").textContent = SITE.partner2;
  $("tagline").textContent = SITE.tagline;
  $("storyTitle").textContent = SITE.storyTitle;
  $("galleryTitle").textContent = SITE.galleryTitle;
  $("reasonsTitle").textContent = SITE.reasonsTitle;
  $("letterTitle").textContent = SITE.letterTitle;
  $("letterButton").textContent = SITE.letterButton;
  $("reasonBtn").textContent = SITE.reasonsButton;
  $("footerText").textContent = SITE.footer;

  // ---------- Photo helper (shows a placeholder if the image is missing) ----------
  function photo(src, alt) {
    const wrap = el("div", "photo");
    if (!src) { wrap.classList.add("empty"); return wrap; }
    const img = new Image();
    img.alt = alt || "";
    img.loading = "lazy";
    img.onerror = () => { img.remove(); wrap.classList.add("empty"); };
    img.src = src;
    wrap.appendChild(img);
    return wrap;
  }

  // ---------- Live counter ----------
  const start = new Date(SITE.startDate);
  const units = [["y", "years"], ["m", "months"], ["d", "days"], ["h", "hours"], ["mi", "minutes"], ["s", "seconds"]];
  const counter = $("counter");
  const nums = {};
  units.forEach(([key, label]) => {
    const box = el("div", "unit");
    nums[key] = el("b", "", "0");
    box.append(nums[key], el("span", "", label));
    counter.appendChild(box);
  });

  function diff(a, b) {
    let y = b.getFullYear() - a.getFullYear();
    let m = b.getMonth() - a.getMonth();
    let d = b.getDate() - a.getDate();
    let h = b.getHours() - a.getHours();
    let mi = b.getMinutes() - a.getMinutes();
    let s = b.getSeconds() - a.getSeconds();
    if (s < 0) { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0) { h += 24; d--; }
    if (d < 0) { d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); m--; }
    if (m < 0) { m += 12; y--; }
    return { y, m, d, h, mi, s };
  }
  function tick() {
    const now = new Date();
    const r = start <= now ? diff(start, now) : diff(now, start);
    units.forEach(([k]) => { nums[k].textContent = r[k]; });
  }
  tick();
  setInterval(tick, 1000);

  // ---------- Story ----------
  (SITE.story || []).forEach((s) => {
    const li = el("li", "tl-item");
    const text = el("div", "tl-text");
    const time = el("time", "", s.date);
    text.append(time, el("h3", "", s.title), el("p", "", s.text));
    li.append(text, photo(s.photo, s.title));
    $("timeline").appendChild(li);
  });

  // ---------- Gallery + lightbox ----------
  const box = $("lightbox");
  (SITE.gallery || []).forEach((g) => {
    const b = el("button", "shot");
    b.type = "button";
    b.append(photo(g.photo, g.caption), el("span", "", g.caption));
    b.addEventListener("click", () => {
      $("lightboxImg").src = g.photo;
      $("lightboxImg").alt = g.caption || "";
      $("lightboxCap").textContent = g.caption || "";
      box.showModal();
    });
    $("gallery").appendChild(b);
  });
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });

  // ---------- Reasons (shuffled, never repeats until all are seen) ----------
  const reasons = SITE.reasons || [];
  let queue = [], last = "";
  const reasonEl = $("reason");
  function nextReason() {
    if (!reasons.length) return;
    if (!queue.length) {
      queue = reasons.slice().sort(() => Math.random() - 0.5);
      if (queue.length > 1 && queue[queue.length - 1] === last) queue.reverse();
    }
    last = queue.pop();
    reasonEl.classList.add("fade");
    setTimeout(() => { reasonEl.textContent = last; reasonEl.classList.remove("fade"); }, 300);
  }
  reasonEl.textContent = reasons[0] || "";
  last = reasons[0] || "";
  $("reasonBtn").addEventListener("click", nextReason);

  // ---------- Letter ----------
  const L = SITE.letter || {};
  const paper = $("paper");
  paper.appendChild(el("p", "greeting", L.greeting));
  (L.paragraphs || []).forEach((t) => paper.appendChild(el("p", "", t)));
  paper.appendChild(el("p", "", L.closing));
  paper.appendChild(el("p", "sig", L.signature));
  $("envelope").addEventListener("click", function () {
    this.setAttribute("aria-expanded", "true");
    $("letterPaper").classList.add("open");
  });

  // ---------- Music ----------
  if (SITE.music) {
    const audio = $("audio"), btn = $("music");
    audio.src = SITE.music;
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const playing = btn.getAttribute("aria-pressed") === "true";
      if (playing) { audio.pause(); } else { audio.play().catch(() => {}); }
      btn.setAttribute("aria-pressed", String(!playing));
      btn.setAttribute("aria-label", playing ? "Play music" : "Pause music");
    });
  }

  // ---------- Falling petals ----------
  const canvas = $("petals");
  const ctx = canvas.getContext("2d");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, petals = [];
  const colors = () => [getComputedStyle(document.documentElement).getPropertyValue("--petal").trim() || "#f3b3c8",
                        getComputedStyle(document.documentElement).getPropertyValue("--rose").trim() || "#e0507f"];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function makePetal(fromTop) {
    const c = colors();
    return {
      x: Math.random() * W,
      y: fromTop ? -20 : Math.random() * H,
      r: 5 + Math.random() * 7,
      vy: 0.35 + Math.random() * 0.7,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.005 + Math.random() * 0.01,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      color: c[Math.random() < 0.7 ? 0 : 1],
      alpha: 0.25 + Math.random() * 0.45,
    };
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach((p, i) => {
      p.y += p.vy; p.sway += p.swaySpeed; p.rot += p.vr;
      p.x += Math.sin(p.sway) * 0.6;
      if (p.y > H + 20) petals[i] = makePetal(true);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener("resize", resize);
  if (!calm) {
    const count = window.innerWidth < 720 ? 18 : 32;
    for (let i = 0; i < count; i++) petals.push(makePetal(false));
    frame();
  }
})();
