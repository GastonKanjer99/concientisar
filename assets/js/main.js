import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";
import { initSarExplainer } from "./modules/sarExplainer.js";
import { setupScrollSpy } from "./modules/scrollSpy.js";
import { setupProgressBar } from "./modules/progress.js";
// ...
setupProgressBar();  
// ...
await includePartials();
setupLazyBackgrounds();
setupReveal();
initBeforeAfter();
initSarExplainer();
setupScrollSpy();   

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();     // carga sections/*
  setupLazyBackgrounds();      // fondos perezosos
  setupReveal();               // animación suave
  initBeforeAfter();           // sliders
  initSarExplainer();          // <<< NUEVO
});

