export function setupFaqAccordion(rootSel = "#faqs") {
  const root = document.querySelector(rootSel);
  if (!root) return;
  root.addEventListener("toggle", (e) => {
    const t = e.target;
    if (t.tagName !== "DETAILS" || !t.open) return;
    root.querySelectorAll("details[open]").forEach(d => { if (d!==t) d.open=false; });
  });
}