// assets/js/main.js
import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";
import { initSarExplainer } from "./modules/sarExplainer.js";
import { setupScrollSpy } from "./modules/scrollspy.js";   // ojo el casing
import { setupProgressBar } from "./modules/progress.js";
import { setupCTAPopup } from "./modules/ctaPopup.js";     // ojo el casing
import { setupEmbedFullscreen } from "./modules/embedFullscreen.js";
// Opcional: solo si vas a usar la sección timelapse ahora
// import { initTimelapse } from "./modules/timelapse.js";

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();      // carga sections/* una sola vez

  // UI base
  setupLazyBackgrounds();
  setupReveal();
  initBeforeAfter();
  initSarExplainer();

  // extras
  setupScrollSpy();
  setupProgressBar();
  setupEmbedFullscreen();

  // CTA modal
  // antes: setupCTAPopup({...})
const params = new URLSearchParams(location.search);
const forceCTA = params.has("cta");

const cta = setupCTAPopup({
  url: "productores.html",
  delayMs: 400,
  variant: "modal",
  storageKey: "cta_prod_v1",
  oncePerSession: true
});

if (forceCTA) { cta.reset(); cta.open(); } // http://localhost:5500/?cta=1

});
