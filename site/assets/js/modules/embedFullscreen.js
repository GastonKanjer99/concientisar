export function setupEmbedFullscreen(selector = ".js-gee-fs") {
  document.querySelectorAll(selector).forEach((btn) => {
    const wrap = btn.closest(".gee-embed");
    const iframe = wrap?.querySelector(".gee-iframe");
    if (!wrap || !iframe) return;

    btn.addEventListener("click", () => {
      const backdrop = document.createElement("div");
      backdrop.className = "embed-fs-backdrop";
      const modal = document.createElement("div");
      modal.className = "embed-fs-modal";
      modal.innerHTML = `<button class="embed-fs-close" aria-label="Close">Close ✕</button>`;

      const clone = document.createElement("iframe");
      clone.src = iframe.src;
      clone.title = (iframe.title || "Explorer") + " (fullscreen)";
      clone.setAttribute("allowfullscreen", "");
      clone.setAttribute("loading", "eager");
      modal.appendChild(clone);

      document.body.append(backdrop, modal);

      document.documentElement.classList.add("embed-fs-show", "modal-open");
      document.body.classList.add("modal-open");
      document.documentElement.style.overflow = "hidden";

      const onKeydown = (e) => { if (e.key === "Escape") close(); };

      function close() {
        document.documentElement.classList.remove("embed-fs-show", "modal-open");
        document.body.classList.remove("modal-open");
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", onKeydown);
        backdrop.style.opacity = "0";
        modal.style.opacity = "0";
        modal.style.transform = "scale(.98)";
        setTimeout(() => { modal.remove(); backdrop.remove(); }, 180);
      }

      modal.querySelector(".embed-fs-close").addEventListener("click", close);
      backdrop.addEventListener("click", close);
      document.addEventListener("keydown", onKeydown);
    });
  });
}
