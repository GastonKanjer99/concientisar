export function setupProgressBar(){
  const bar = document.createElement('div');
  bar.id = 'progress';
  document.body.appendChild(bar);
  const update = () => {
    const h = document.documentElement;
    const p = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
