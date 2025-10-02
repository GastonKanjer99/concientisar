export function initBeforeAfter(root = document) {
  const blocks = root.querySelectorAll(".ba");
  blocks.forEach((wrap) => {
    const range = wrap.querySelector('input[type="range"]');
    const clip  = wrap.querySelector(".ba-clip");
    if (range && clip) {
      range.addEventListener("input", (e) => {
        clip.style.width = e.target.value + "%";
      });
    }
  });
}
