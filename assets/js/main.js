// assets/js/main.js
import { includePartials } from "./modules/includePartials.js";
import { setupLazyBackgrounds } from "./modules/lazyBg.js";
import { initBeforeAfter } from "./modules/beforeAfter.js";
import { setupReveal } from "./modules/reveal.js";
import { initSarExplainer } from "./modules/sarExplainer.js";
import { setupScrollSpy } from "./modules/scrollspy.js";
import { setupProgressBar } from "./modules/progress.js";
import { setupEmbedFullscreen } from "./modules/embedFullscreen.js";
import { setupCTAPopup } from "./modules/ctaPopup.js";
import { setupFaqAccordion } from "./modules/faqAccordion.js";

document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();

  // UI base
  setupLazyBackgrounds();
  setupReveal();
  initBeforeAfter();
  initSarExplainer();
  setupFaqAccordion();
  // extras
  setupScrollSpy();
  setupProgressBar();
  setupEmbedFullscreen();

  // === CTA: NO mostrar en productores.html ===
  const params = new URLSearchParams(location.search);
  const forceCTA = params.has("cta");
  const path = location.pathname.replace(/\/+$/, "");
  const isProductores = /(?:^|\/)productores\.html$/.test(path);
  const isFaqs = /(?:^|\/)faqs\.html$/.test(path);

  if (!isProductores && !isFaqs) {
    setupCTAPopup({ url: "productores.html", delayMs: 400, variant: "modal" });
  }

  let ctaCtrl = null;
  if (!isProductores) {
    ctaCtrl = setupCTAPopup({
      url: "productores.html",
      delayMs: 400,
      variant: "modal",
      storageKey: "cta_prod_v1",
      oncePerSession: true,
    });
  }

  // Forzar desde ?cta=1 (solo cuando NO estás en productores)
  if (forceCTA && ctaCtrl) {
    ctaCtrl.reset();
    ctaCtrl.open();
  }
});
