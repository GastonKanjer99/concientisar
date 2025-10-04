export function setupCTAPopup({
  url = "/productores.html",
  delayMs = 3500,
  storageKey = "cta_prod_v1",   // cambia para “resetear” la frecuencia
  oncePerSession = true
} = {}) {

  const seen = oncePerSession
    ? sessionStorage.getItem(storageKey)
    : localStorage.getItem(storageKey);
  if (seen) return;

  const el = document.createElement("div");
  el.className = "cta-pop";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `
    <button class="cta-close" aria-label="Cerrar">×</button>
    <h3>¿Sos productor/a?</h3>
    <p>Recibí asistencia gratuita para evaluar la regeneración con SAR.</p>
    <div class="cta-actions">
      <a class="btn btn-primary" href="${url}" target="_blank" rel="noopener">Quiero saber más</a>
      <a class="btn btn-secondary" href="${url}" target="_blank" rel="noopener">Abrir en nueva pestaña</a>
    </div>
  `;

  function show(){ document.body.appendChild(el); requestAnimationFrame(()=> el.classList.add("show")); }
  function hide(){
    el.classList.remove("show");
    setTimeout(()=> el.remove(), 180);
    const store = oncePerSession ? sessionStorage : localStorage;
    store.setItem(storageKey, "1"); // no volver a mostrar
  }

  el.querySelector(".cta-close").addEventListener("click", hide);
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") hide(); });

  // Mostrar después de un tiempo o cuando haya scroll (si pasó delay)
  setTimeout(show, delayMs);
}
