export function initSarExplainer(root = document) {
  const section = root.querySelector("#sar-explainer");
  if (!section) return;

  const scene  = section.querySelector(".scene");
  const mapEl  = section.querySelector("#sar-map");
  const radios = section.querySelectorAll('input[name="mode"]');
  const polar  = section.querySelector("#polar");

  const IMAGES = {
    optical: "/assets/img/optico.jpg",
    vv:      "/assets/img/sar_vv.jpg",
    vh:      "/assets/img/sar_vh.jpg",
  };
  const USE_IMAGES = true;

  const useImage = (url) => {
    scene.style.backgroundImage = `url(${url})`;
    scene.classList.add("hasimg");
    if (mapEl) mapEl.style.display = "none";
  };
  const clearImage = () => {
    scene.style.removeProperty("background-image");
    scene.classList.remove("hasimg");
    if (mapEl) mapEl.style.display = "";
  };

function setMode() {
  const isSAR = ([...radios].find(r => r.checked)?.value || "visible") === "sar";
  scene.classList.toggle("mode-sar", isSAR);

  // Polar solo en SAR
  polar.disabled = !isSAR;

  // Overlay: 0 en ambos modos (o poné 0.1 si querés algo leve en óptico)
  scene.style.setProperty("--dim", isSAR ? "0" : "0");

  updateReturns();
  updateBackground();
}


  function updateBackground() {
    if (!USE_IMAGES) { clearImage(); return; }
    const isSAR = ([...radios].find(r => r.checked)?.value || "visible") === "sar";
    if (!isSAR) useImage(IMAGES.optical);
    else useImage(polar.value === "VH" ? IMAGES.vh : IMAGES.vv);
  }

  function updateReturns() {
    let water = 0.15, grass = 0.55, soil = 0.75;
    if (polar.value === "VH") grass += 0.12; // sólo efecto de polarización
    const clamp = v => Math.max(0.05, Math.min(1, v));
    scene.style.setProperty("--ret-water", clamp(water));
    scene.style.setProperty("--ret-grass", clamp(grass));
    scene.style.setProperty("--ret-soil",  clamp(soil));
  }

  radios.forEach(r => r.addEventListener("change", setMode));
  polar.addEventListener("change", () => { updateReturns(); updateBackground(); });

  setMode(); // init
}
