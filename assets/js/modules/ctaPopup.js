export function setupCTAPopup({
  url = "productores.html",
  delayMs = 3500,
  storageKey = "cta_prod_v1",
  oncePerSession = true,
  variant = "modal",
} = {}) {
  const store = oncePerSession ? sessionStorage : localStorage;
  if (store.getItem(storageKey)) return;

  const lockScroll = () => {
    document.documentElement.style.overflow = "hidden";
  };
  const unlockScroll = () => {
    document.documentElement.style.overflow = "";
  };
  let prevFocus = null;

  const openToast = () => {
    const el = document.createElement("div");
    el.className = "cta-pop center"; 
    el.innerHTML = `
      <button class="cta-close" aria-label="Close">×</button>
      <h3>Are you a producer?</h3>
      <p>Get free assistance to assess regeneration with SAR imagery.</p>
      <div class="cta-actions">
        <a class="btn btn-primary" href="${url}" target="_blank" rel="noopener">Learn more</a>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    const close = () => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 180);
      store.setItem(storageKey, "1");
    };
    el.querySelector(".cta-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close(), {
      once: true,
    });
  };

  const openModal = () => {
    const backdrop = document.createElement("div");
    backdrop.className = "cta-backdrop";
    const modal = document.createElement("div");
    modal.className = "cta-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    modal.innerHTML = `
      <div class="cta-card">
        <button class="cta-close" aria-label="Close">×</button>
        <h3>Are you a producer?</h3>
        <p>We help you measure post-fire regeneration using SAR images.</p>
        <div class="cta-actions">
          <a class="btn btn-primary" href="${url}" target="_blank" rel="noopener">Learn more</a>
        </div>
      </div>`;

    document.body.append(backdrop, modal);
    prevFocus = document.activeElement;
    lockScroll();
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      modal.classList.add("show");
    });
    const firstBtn = modal.querySelector(".btn");
    firstBtn?.focus();

    const close = () => {
      backdrop.classList.remove("show");
      modal.classList.remove("show");
      setTimeout(() => {
        backdrop.remove();
        modal.remove();
        unlockScroll();
        prevFocus?.focus();
      }, 200);
      store.setItem(storageKey, "1");
    };
    backdrop.addEventListener("click", close);
    modal.querySelector(".cta-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close(), {
      once: true,
    });
  };

  setTimeout(() => (variant === "modal" ? openModal() : openToast()), delayMs);
}
