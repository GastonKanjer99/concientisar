import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Cargar partials
  await includePartials();

  // 2) Inicializar features una vez que el DOM tiene las secciones
  setupLazyBackgrounds();
  setupReveal();
  initBeforeAfter();
});
