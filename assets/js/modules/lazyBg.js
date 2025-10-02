export function setupLazyBackgrounds(selector = ".full[data-bg]") {
  const sections = document.querySelectorAll(selector);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const url = e.target.getAttribute("data-bg");
          if (url) {
            e.target.style.setProperty("--bg-url", `url(${url})`);
            e.target.classList.add("hasbg");
          }
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "200px" }
  );
  sections.forEach((s) => io.observe(s));
}
