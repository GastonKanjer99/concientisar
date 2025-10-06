export async function includePartials() {
  const nodes = Array.from(document.querySelectorAll("[data-include]"));
  await Promise.all(
    nodes.map(async (el) => {
      const url = el.getAttribute("data-include");
      try {
        const html = await fetch(url).then((r) => r.text());
        el.outerHTML = html;
      } catch (e) {
        el.innerHTML = `<div class="container pad"><p class="text">Failed to load ${url}</p></div>`;
      }
    })
  );
}
