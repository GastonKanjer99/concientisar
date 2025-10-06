export function setupReveal(selector = ".reveal") {
  const rev = document.querySelectorAll(selector);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "-10% 0px" }
  );
  rev.forEach((el) => io.observe(el));
}
