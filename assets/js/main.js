// assets/js/main.js
import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";
import { initSarExplainer } from "./modules/sarExplainer.js";
import { setupScrollSpy } from "./modules/scrollspy.js";   // <— minúsculas
import { setupProgressBar } from "./modules/progress.js";
import { setupCTAPopup } from "./modules/ctapopup.js";    // <— camelCase

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();     // carga sections/*n
  setupLazyBackgrounds();      // fondos perezosos
  setupReveal();               // animación suave
  initBeforeAfter();           // sliders
  initSarExplainer();          // explainer SAR
  setupScrollSpy();            // nav activo
  setupProgressBar();          // barra de lectura
  setupCTAPopup({ url: "/productores.html", delayMs: 4000 }); // popup CTA
});
