export function initSarExplainer(root = document) {
  const section = root.querySelector("#sar-explainer");
  if (!section) return;

  const scene = section.querySelector(".scene");
  const mapEl = section.querySelector("#sar-map");
  const radios = section.querySelectorAll('input[name="mode"]');
  const polar  = section.querySelector("#polar");
  const freq   = section.querySelector("#freq");

  // Fondo opcional por data-bg (si no hay mapa)
  const bg = scene.getAttribute("data-bg");
  if (bg) {
    scene.style.setProperty("--scene-bg", `url(${bg})`);
    scene.classList.add("hasimg");
  }

  // === Mapa Leaflet (no interactivo por defecto) ===
  if (mapEl && window.L) {
    const map = L.map(mapEl, {
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, zoomControl: false,
      attributionControl: false, tap: false
    }).setView([-32.9, -60.64], 7); // Delta del Paraná aprox.

L.tileLayer(
 "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
 { attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, etc." }
).addTo(map);


    // Para hacerlo interactivo:
    // map.dragging.enable(); map.scrollWheelZoom.enable(); map.zoomControl.addTo(map);
  }

  // === Controles ===
  function setMode() {
    const val = [...radios].find(r => r.checked)?.value || "visible";
    const isSAR = val === "sar";
    scene.classList.toggle("mode-sar", isSAR);

    // Combos afectan sólo a SAR → se deshabilitan en modo óptico
    polar.disabled = !isSAR;
    freq.disabled  = !isSAR;

    updateReturns();
  }

  function updateReturns() {
    // valores base
    let water = 0.15, grass = 0.55, soil = 0.75;

    // Banda L penetra canopia → baja retorno aparente de vegetación
    if (freq.value === "L") grass -= 0.10;

    // VH resalta dispersión volumétrica → sube vegetación
    if (polar.value === "VH") grass += 0.12;

    const clamp = v => Math.max(0.05, Math.min(1, v));
    scene.style.setProperty("--ret-water", clamp(water));
    scene.style.setProperty("--ret-grass", clamp(grass));
    scene.style.setProperty("--ret-soil",  clamp(soil));
  }

  radios.forEach(r => r.addEventListener("change", setMode));
  [polar, freq].forEach(el => el.addEventListener("change", updateReturns));

  setMode(); // init (respeta el radio "checked" en el HTML)
}
