export async function includePartials() {
  const nodes = Array.from(document.querySelectorAll("[data-include]"));
  await Promise.all(
    nodes.map(async (el) => {
      const url = el.getAttribute("data-include");
      try {
        const html = await fetch(url).then((r) => r.text());
        el.outerHTML = html; // reemplaza el placeholder por el contenido
      } catch (e) {
        el.innerHTML = `<div class="container pad"><p class="text">No se pudo cargar ${url}</p></div>`;
      }
    })
  );
}
