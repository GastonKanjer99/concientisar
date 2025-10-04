export function initBeforeAfter(root = document) {
  const blocks = root.querySelectorAll(".ba");

  blocks.forEach((wrap) => {
    const clip  = wrap.querySelector(".ba-clip");
    const range = wrap.querySelector('input[type="range"]'); // opcional
    if (!clip) return;

    // Crear manija si no existe
    let handle = wrap.querySelector(".ba-handle");
    if (!handle) {
      handle = document.createElement("button");
      handle.type = "button";
      handle.className = "ba-handle";
      handle.setAttribute("aria-label", "Mover comparador");
      wrap.appendChild(handle);
    }

    let pos = Number(range?.value ?? 50); // 0..100

    const clamp = (v) => Math.max(0, Math.min(100, v));
    const set = (v, syncRange = true) => {
      pos = clamp(v);
      wrap.style.setProperty("--pos", pos + "%");
      clip.style.setProperty("--pos",  pos + "%");
      handle.style.left = `calc(${pos}% )`;
      if (range && syncRange) range.value = String(Math.round(pos));
    };

    // Conversión de coordenada X a % relativo al contenedor
    const xToPercent = (clientX) => {
      const rect = wrap.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };

    // Drag con pointer events
    const onPointerDown = (e) => {
      e.preventDefault();
      set(xToPercent(e.clientX));
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup",   onPointerUp, { once: true });
    };
    const onPointerMove = (e) => set(xToPercent(e.clientX));
    const onPointerUp   = () => window.removeEventListener("pointermove", onPointerMove);

    // Click en cualquier parte del before/after
    wrap.addEventListener("pointerdown", (e) => {
      // si clickeaste la manija, igual funciona
      onPointerDown(e);
    });

    // Teclado en la manija
    handle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { set(pos - 2); }
      if (e.key === "ArrowRight") { set(pos + 2); }
      if (e.key === "Home")       { set(0); }
      if (e.key === "End")        { set(100); }
      if (e.key === " ")          { set(50); e.preventDefault(); } // barra = centro
    });

    // Si mantenés el <input type="range">
    range?.addEventListener("input", (e) => set(Number(e.target.value), false));

    set(pos); // init
  });
}
