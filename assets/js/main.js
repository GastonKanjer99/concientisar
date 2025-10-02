import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";
import { initSarExplainer } from "./modules/sarExplainer.js";

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();     // carga sections/*
  setupLazyBackgrounds();      // fondos perezosos
  setupReveal();               // animación suave
  initBeforeAfter();           // sliders
  initSarExplainer();          // <<< NUEVO
});
