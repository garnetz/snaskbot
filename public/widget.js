/* SNASKBOT website widget.
   Add this one line to any page, just before </body>:
   <script src="https://YOUR-BOT-SERVER/widget.js" defer></script>
   It adds a pink chat bubble in the corner. The chat itself runs in an iframe
   served by the bot server, so the site's CSS can't break it and the API key
   never touches the browser. */
(function () {
  if (window.__snaskbot) return;
  window.__snaskbot = true;

  var me = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var origin = new URL(me.src, location.href).origin;
  var PINK = "#ff3d8b", INK = "#000000";

  var css = document.createElement("style");
  css.textContent =
    "#snaskbot-btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:68px;height:68px;border-radius:50%;" +
    "background:" + PINK + ";border:3px solid " + INK + ";box-shadow:4px 4px 0 " + INK + ";cursor:pointer;" +
    "font:900 13px/1 'Arial Black',Impact,sans-serif;color:" + INK + ";letter-spacing:.02em;transform:rotate(-8deg);transition:transform .15s}" +
    "#snaskbot-btn:hover{transform:rotate(4deg) scale(1.06)}" +
    "#snaskbot-btn:focus-visible{outline:3px solid " + INK + ";outline-offset:3px}" +
    "#snaskbot-panel{position:fixed;right:20px;bottom:100px;z-index:2147483000;width:400px;height:620px;max-height:calc(100vh - 120px);" +
    "border:3px solid " + INK + ";border-radius:22px;box-shadow:8px 8px 0 " + PINK + ";overflow:hidden;background:#ffcddb;display:none}" +
    "#snaskbot-panel.open{display:block}" +
    "#snaskbot-panel iframe{width:100%;height:100%;border:0;display:block}" +
    "@media (max-width:520px){#snaskbot-panel{right:8px;left:8px;bottom:92px;width:auto;height:calc(100vh - 110px);max-height:none}}" +
    "@media (prefers-reduced-motion:reduce){#snaskbot-btn{transition:none}}";
  document.head.appendChild(css);

  var panel = document.createElement("div");
  panel.id = "snaskbot-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with SNASKBOT");

  var btn = document.createElement("button");
  btn.id = "snaskbot-btn";
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "snaskbot-panel");
  btn.textContent = "TALK!";

  btn.onclick = function () {
    var open = !panel.classList.contains("open");
    if (open && !panel.firstChild) {
      var f = document.createElement("iframe");
      f.src = origin + "/chat?embed=1";
      f.title = "SNASKBOT chat";
      panel.appendChild(f);
    }
    panel.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "BYE!" : "TALK!";
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) btn.click();
  });

  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();
