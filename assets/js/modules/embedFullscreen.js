export function setupEmbedFullscreen(selector = ".js-gee-fs") {
  document.querySelectorAll(selector).forEach((btn) => {
    const wrap = btn.closest(".gee-embed");
    const iframe = wrap?.querySelector(".gee-iframe");
    if (!wrap || !iframe) return;

    btn.addEventListener("click", () => {
      // crear overlay + modal
      const backdrop = document.createElement("div");
      backdrop.className = "embed-fs-backdrop";
      const modal = document.createElement("div");
      modal.className = "embed-fs-modal";
      modal.innerHTML = `<button class="embed-fs-close" aria-label="Cerrar">Cerrar ✕</button>`;

      // clonar iframe (no “robamos” el del layout)
      const clone = document.createElement("iframe");
      clone.src = iframe.src;
      clone.title = (iframe.title || "Explorador") + " (pantalla completa)";
      clone.setAttribute("allowfullscreen", "");
      clone.setAttribute("loading", "eager");
      modal.appendChild(clone);

      // agregar al DOM
      document.body.append(backdrop, modal);

      // BLOQUEO de scroll (robusto en desktop + iOS)
      document.documentElement.classList.add("embed-fs-show", "modal-open");
      document.body.classList.add("modal-open");
      document.documentElement.style.overflow = "hidden";

      const onKeydown = (e) => { if (e.key === "Escape") close(); };

      function close() {
        // 1) Quitar locks de scroll INMEDIATO
        document.documentElement.classList.remove("embed-fs-show", "modal-open");
        document.body.classList.remove("modal-open");
        document.documentElement.style.overflow = "";

        // 2) limpiar listeners
        document.removeEventListener("keydown", onKeydown);

        // 3) animar salida breve y remover nodos
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
