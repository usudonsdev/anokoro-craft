(() => {
  const S = window.SITE;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  /* ---------- 設定の反映 ---------- */
  $$("[data-site-name]").forEach(e => (e.textContent = S.name));
  $$("[data-site-sub]").forEach(e => (e.textContent = S.subtitle));

  const sv = S.server;
  const javaAddr = sv.javaPort === 25565 ? sv.javaHost : `${sv.javaHost}:${sv.javaPort}`;
  $$("[data-java-addr]").forEach(e => (e.textContent = sv.ready ? javaAddr : "公開前"));
  $$("[data-bedrock-host]").forEach(e => (e.textContent = sv.ready ? sv.bedrockHost : "公開前"));
  $$("[data-bedrock-port]").forEach(e => (e.textContent = sv.ready ? sv.bedrockPort : "—"));

  // 統合版のワンクリック追加（Windows・iOS・Android の統合版が対応）
  const bedrockLink = $("#bedrock-link");
  bedrockLink.href = `minecraft://?addExternalServer=${encodeURIComponent(S.name)}|${sv.bedrockHost}:${sv.bedrockPort}`;
  bedrockLink.addEventListener("click", e => {
    if (!sv.ready) { e.preventDefault(); toast(`サーバーは${sv.openDate}です`); }
  });

  const setLink = (id, url) => { const a = $(id); if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; } return !!url; };
  const hasX = setLink("#x-link", S.links.x);
  const hasD = setLink("#discord-link", S.links.discord);
  if (hasX || hasD) $("#links-pending").hidden = true;
  [["#x-link", hasX], ["#discord-link", hasD]].forEach(([id, ok]) => {
    if (!ok) $(id).addEventListener("click", e => { e.preventDefault(); toast("リンクは準備中です"); });
  });
  if (S.links.devlog) { const d = $("#devlog-link"); d.href = S.links.devlog; d.hidden = false; }

  /* ---------- スプラッシュ ---------- */
  $("#splash").textContent = S.splashes[Math.floor(Math.random() * S.splashes.length)];

  /* ---------- コピー ---------- */
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    if (!sv.ready) return toast(`サーバーは${sv.openDate}です`);
    const text = b.dataset.copy === "java" ? javaAddr : sv.bedrockHost;
    try { await navigator.clipboard.writeText(text); toast(`コピーしました：${text}`); }
    catch { toast(text); }
  }));

  /* ---------- トースト ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- 画面遷移（ハッシュで管理） ---------- */
  function show(id) {
    const target = document.getElementById(id) || $("#title");
    $$("[data-screen]").forEach(s => s.classList.toggle("active", s === target));
    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  $$("[data-go]").forEach(b => b.addEventListener("click", () => { location.hash = b.dataset.go; }));
  window.addEventListener("hashchange", () => show(location.hash.slice(1) || "title"));
  show(location.hash.slice(1) || "title");
  function back() { if (location.hash && location.hash !== "#title") { blip(330, 0.07); location.hash = "title"; } }

  /* ---------- タブ ---------- */
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.toggle("active", x === t));
    $$(".tab-body").forEach(b => b.classList.toggle("active", b.dataset.body === t.dataset.tab));
  }));
  // 端末に合わせて初期タブを選ぶ
  if (!/Android|iPhone|iPad|Windows/.test(navigator.userAgent) || /Macintosh/.test(navigator.userAgent)) {
    $('.tab[data-tab="java"]').click();
  }

  /* ---------- 効果音（その場で合成したオリジナル音） ---------- */
  let ctx;
  const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
  function blip(freq = 660, dur = 0.06) {
    const a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.05, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  }
  document.addEventListener("click", e => { if (e.target.closest(".mc-btn")) blip(520, 0.07); });

  /* ---------- BGM（ランダム生成のオリジナル。既存曲は使わない） ---------- */
  let bgmOn = false, bgmTimer;
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19]; // メジャー・ペンタトニック
  const roots = [57, 53, 60, 55];               // A F C G
  let bar = 0;
  function note(midi, t, dur, vol) {
    const a = audio(), o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    f.type = "lowpass"; f.frequency.value = 1400;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.1);
  }
  function playBar() {
    const a = audio(), t0 = a.currentTime + 0.05, root = roots[bar++ % roots.length];
    note(root - 12, t0, 4.5, 0.05);
    note(root - 5, t0 + 0.02, 4.5, 0.03);
    for (let i = 0; i < 8; i++) {
      if (Math.random() < 0.45) {
        note(root + 12 + scale[Math.floor(Math.random() * scale.length)] - 12, t0 + i * 0.5 + Math.random() * 0.04, 2.2, 0.035);
      }
    }
  }
  $("#bgm").addEventListener("click", e => {
    bgmOn = !bgmOn;
    e.currentTarget.setAttribute("aria-pressed", bgmOn);
    e.currentTarget.textContent = bgmOn ? "♪ ON" : "♪ OFF";
    clearInterval(bgmTimer);
    if (bgmOn) { audio().resume(); playBar(); bgmTimer = setInterval(playBar, 4000); }
  });

  /* ---------- キーボード・ゲームパッド操作 ---------- */
  function focusables() {
    const s = $(".screen.active");
    return $$(".mc-btn, a.mc-btn", s).filter(e => e.offsetParent !== null);
  }
  function move(dir) {
    const list = focusables(); if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    const next = list[(i + dir + list.length) % list.length];
    next.focus(); blip(880, 0.03);
  }
  document.addEventListener("keydown", e => {
    if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); move(1); }
    else if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); move(-1); }
    else if (e.key === "Escape" || e.key === "Backspace") { back(); }
  });

  const prev = {};
  function pollPad() {
    for (const pad of navigator.getGamepads ? navigator.getGamepads() : []) {
      if (!pad) continue;
      const p = prev[pad.index] ||= {};
      const press = (k, on) => { const was = p[k]; p[k] = on; return on && !was; };
      const ay = pad.axes[1] || 0;
      if (press("down", pad.buttons[13]?.pressed || ay > 0.6)) move(1);
      if (press("up", pad.buttons[12]?.pressed || ay < -0.6)) move(-1);
      if (press("right", pad.buttons[15]?.pressed)) move(1);
      if (press("left", pad.buttons[14]?.pressed)) move(-1);
      if (press("a", pad.buttons[0]?.pressed)) document.activeElement?.click();
      if (press("b", pad.buttons[1]?.pressed)) back();
    }
    requestAnimationFrame(pollPad);
  }
  window.addEventListener("gamepadconnected", () => { toast("コントローラーを接続しました"); });
  requestAnimationFrame(pollPad);

  /* ---------- サーバー状態 ---------- */
  async function status() {
    const chip = $("#status-chip"), motd = $("#server-motd"), players = $("#server-players"), bars = $(".bars");
    if (!sv.ready) { chip.textContent = `● サーバー準備中（${sv.openDate}）`; motd.textContent = `公開日：${sv.openDate}`; return; }
    try {
      const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(javaAddr)}`);
      const d = await r.json();
      if (d.online) {
        chip.classList.add("online");
        chip.textContent = `● オンライン ${d.players.online}/${d.players.max}人`;
        motd.textContent = (d.motd?.clean || []).join(" ") || "オンライン";
        players.textContent = `${d.players.online}/${d.players.max}`;
        bars.classList.replace("off", "on");
      } else {
        chip.textContent = "● メンテナンス中"; motd.textContent = "現在オフラインです";
      }
    } catch { chip.textContent = "● 状態を取得できませんでした"; }
  }
  status(); setInterval(status, 60000);

  /* ---------- 背景：オリジナルのブロック風パノラマ ---------- */
  const cv = $("#panorama"), g = cv.getContext("2d");
  const B = 24; // 1ブロックのピクセル数
  let W, H, off = 0;
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; g.imageSmoothingEnabled = false; }
  addEventListener("resize", resize); resize();
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const height = x => Math.floor(7 + 3 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.23 + 1.3) + 1.5 * Math.sin(x * 0.041 + 4));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#5f86c9"); sky.addColorStop(0.6, "#a9c6ee"); sky.addColorStop(1, "#d9e7f7");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // 雲
    g.fillStyle = "rgba(255,255,255,.85)";
    for (let i = 0; i < 9; i++) {
      const cw = (3 + Math.floor(hash(i) * 5)) * B * 1.4;
      const cx = ((hash(i + 10) * W * 2 - off * 0.25) % (W + cw * 2) + W + cw * 2) % (W + cw * 2) - cw;
      g.fillRect(Math.floor(cx), Math.floor(30 + hash(i + 20) * H * 0.3), cw, B * 1.2);
    }
    // 地形
    const cols = Math.ceil(W / B) + 2, start = Math.floor(off / B), shift = -(off % B);
    const groundTop = H - B * 6;
    for (let c = 0; c < cols; c++) {
      const wx = start + c, h = height(wx), x = c * B + shift;
      const topY = groundTop - h * B * 0.6;
      for (let y = Math.floor(topY / B) * B; y < H; y += B) {
        const depth = (y - topY) / B;
        let col;
        if (depth < 1) col = "#5aa63c";
        else if (depth < 4) col = hash(wx * 31 + y) > 0.5 ? "#866043" : "#7a573c";
        else col = hash(wx * 17 + y) > 0.85 ? "#5d5d5d" : hash(wx * 7 + y) > 0.5 ? "#7c7c7c" : "#727272";
        g.fillStyle = col; g.fillRect(x, y, B, B);
      }
      // 木
      if (hash(wx) > 0.92) {
        const ty = Math.floor(topY / B) * B;
        g.fillStyle = "#6b4e2e"; g.fillRect(x, ty - B * 3, B, B * 3);
        g.fillStyle = "#3f8a2b"; g.fillRect(x - B, ty - B * 5, B * 3, B * 2);
        g.fillRect(x, ty - B * 6, B, B);
      }
    }
    if (!reduce) off += 0.35;
    requestAnimationFrame(draw);
  }
  draw();
})();
