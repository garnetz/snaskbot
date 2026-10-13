/* SNASKBOT website widget.
   Add this one line to any page, just before </body>:
   <script src="https://YOUR-BOT-SERVER/widget.js" defer></script>
   It adds a pink chat bubble in the corner. The chat opens in a small window that can be
   expanded to a full-screen overlay. The chat itself runs in an iframe served by the bot
   server, so the site's CSS can't break it and the API key never touches the browser. */
(function () {
  if (window.__snaskbot) return;
  window.__snaskbot = true;

  var me = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var origin = new URL(me.src, location.href).origin;
  var PINK = "#ff3d8b", INK = "#000000", BG = "#ffcddb";
  var EASE = "cubic-bezier(.34,1.56,.64,1)";

  var css = document.createElement("style");
  css.textContent =
    "#snaskbot-btn{position:fixed;right:20px;bottom:20px;z-index:2147483001;width:68px;height:68px;border-radius:50%;" +
    "background:" + PINK + ";border:3px solid " + INK + ";box-shadow:4px 4px 0 " + INK + ";cursor:pointer;" +
    "font:900 13px/1 'Arial Black',Impact,sans-serif;color:" + INK + ";letter-spacing:.02em;transform:rotate(-8deg);transition:transform .25s " + EASE + "}" +
    "#snaskbot-btn{display:grid;place-items:center;padding:0}#snaskbot-btn svg{width:36px;height:36px}" +
    "#snaskbot-btn.open svg{width:26px;height:26px}" +
    "#snaskbot-btn:not(.open){animation:snaskbot-bob 2.6s ease-in-out 1s infinite}" +
    "@keyframes snaskbot-bob{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(6deg) translateY(-3px)}}" +
    "#snaskbot-btn:hover{animation:none;transform:rotate(4deg) scale(1.08)}" +
    "#snaskbot-btn:active{transform:scale(.9)}" +
    "#snaskbot-btn:focus-visible,.snaskbot-tool:focus-visible{outline:3px solid " + INK + ";outline-offset:3px}" +
    "#snaskbot-panel{position:fixed;right:20px;bottom:100px;z-index:2147483000;width:400px;height:640px;max-height:calc(100vh - 120px);" +
    "border:3px solid " + INK + ";border-radius:22px;box-shadow:8px 8px 0 " + PINK + ";overflow:hidden;background:" + BG + ";display:none;" +
    "transform-origin:100% 100%;transition:inset .45s cubic-bezier(.22,1,.36,1),width .45s cubic-bezier(.22,1,.36,1),height .45s cubic-bezier(.22,1,.36,1),border-radius .45s,box-shadow .45s}" +
    "#snaskbot-panel.open{display:block;animation:snaskbot-in .45s " + EASE + "}" +
    "#snaskbot-panel.full{right:0;bottom:0;width:100vw;height:100vh;height:100dvh;max-height:none;border-radius:0;border-width:0;box-shadow:none}" +
    "#snaskbot-panel iframe{width:100%;height:100%;border:0;display:block}" +
    "@keyframes snaskbot-in{from{transform:scale(.5) translateY(30px);opacity:0}to{transform:none;opacity:1}}" +
    ".snaskbot-tools{position:absolute;top:4px;right:6px;display:flex;gap:6px;z-index:1}" +
    ".snaskbot-tool{width:24px;height:24px;border-radius:50%;border:0;background:" + PINK + ";color:" + INK + ";cursor:pointer;display:grid;place-items:center;padding:0;transition:transform .2s " + EASE + "}" +
    ".snaskbot-tool:hover{transform:scale(1.18) rotate(-8deg)}" +
    ".snaskbot-tool svg{width:13px;height:13px}" +
    "#snaskbot-panel.full .snaskbot-tools{top:max(8px,env(safe-area-inset-top));right:12px}" +
    "#snaskbot-panel.full .snaskbot-tool{width:32px;height:32px}" +
    "#snaskbot-panel.full .snaskbot-tool svg{width:16px;height:16px}" +
    "html.snaskbot-lock,html.snaskbot-lock body{overflow:hidden}" +
    "html.snaskbot-lock #snaskbot-btn{display:none}" +
    "@media (max-width:520px){#snaskbot-panel{right:8px;left:8px;bottom:92px;width:auto;height:calc(100vh - 110px);max-height:none}" +
    "#snaskbot-panel.full{left:0;right:0;bottom:0;height:100vh;height:100dvh}}" +
    "@media (prefers-reduced-motion:reduce){#snaskbot-btn,#snaskbot-panel,.snaskbot-tool{transition:none;animation:none}}";
  document.head.appendChild(css);

  var ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
  var ICON_SHRINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7"/></svg>';
  // Material Symbols "robot" (Apache 2.0)
  var ICON_ROBOT = '<svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var panel = document.createElement("div");
  panel.id = "snaskbot-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with SNASKBOT");

  var tools = document.createElement("div");
  tools.className = "snaskbot-tools";
  var sizeBtn = document.createElement("button");
  sizeBtn.type = "button";
  sizeBtn.className = "snaskbot-tool";
  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "snaskbot-tool";
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.innerHTML = ICON_CLOSE;
  tools.appendChild(sizeBtn);
  tools.appendChild(closeBtn);
  panel.appendChild(tools);

  var btn = document.createElement("button");
  btn.id = "snaskbot-btn";
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "snaskbot-panel");
  btn.innerHTML = ICON_ROBOT;
  btn.setAttribute("aria-label", "Chat with SNASKBOT");

  var frame = null;
  function tellFrame() {
    if (frame && frame.contentWindow) frame.contentWindow.postMessage({ snaskbot: "size", full: panel.classList.contains("full") }, origin);
  }
  function setFull(full) {
    panel.classList.toggle("full", full);
    document.documentElement.classList.toggle("snaskbot-lock", full);
    sizeBtn.innerHTML = full ? ICON_SHRINK : ICON_EXPAND;
    sizeBtn.setAttribute("aria-label", full ? "Shrink chat" : "Expand chat to full screen");
    tellFrame();
  }
  function setOpen(open) {
    if (open && !frame) {
      frame = document.createElement("iframe");
      frame.src = origin + "/chat?embed=1";
      frame.title = "SNASKBOT chat";
      frame.onload = tellFrame;
      panel.appendChild(frame);
    }
    panel.classList.toggle("open", open);
    if (!open) setFull(false);
    btn.setAttribute("aria-expanded", String(open));
    btn.innerHTML = open ? ICON_CLOSE : ICON_ROBOT;
    btn.classList.toggle("open", open);
    btn.setAttribute("aria-label", open ? "Close chat" : "Chat with SNASKBOT");
  }

  btn.onclick = function () { setOpen(!panel.classList.contains("open")); };
  closeBtn.onclick = function () { setOpen(false); btn.focus(); };
  sizeBtn.onclick = function () { setFull(!panel.classList.contains("full")); };
  function onEscape() {
    if (!panel.classList.contains("open")) return;
    if (panel.classList.contains("full")) setFull(false); else setOpen(false);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") onEscape(); });
  window.addEventListener("message", function (e) {
    if (e.origin === origin && e.data && e.data.snaskbot === "escape") onEscape();
  });
  setFull(false);

  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();
