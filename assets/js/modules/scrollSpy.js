export function setupScrollSpy() {
  const links = Array.from(document.querySelectorAll('.links a[href^="#"]'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (!e.isIntersecting) return;
      const id = `#${e.target.id}`;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    });
  }, { threshold: 0.55 });

  sections.forEach(s => io.observe(s));
}
