export function initBeforeAfter(root = document) {
  const blocks = root.querySelectorAll(".ba");
  blocks.forEach((wrap) => {
    const range = wrap.querySelector('input[type="range"]');
    const clip  = wrap.querySelector(".ba-clip");
    if (!range || !clip) return;

    const set = (val) => {
      const v = Math.max(0, Math.min(100, Number(val)));
      // seteamos la variable en ambos (clip y wrapper) para clip y la línea
      clip.style.setProperty("--pos", v + "%");
      wrap.style.setProperty("--pos", v + "%");
    };

    // init (por si el HTML trae otro valor)
    set(range.value || 50);
    range.addEventListener("input", (e) => set(e.target.value));
  });
}
