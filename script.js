const root = document.documentElement;
const toggle = document.querySelector('[data-theme-toggle]');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
if (toggle) {
  toggle.textContent = prefersDark ? '☀' : '☾';
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    toggle.textContent = next === 'dark' ? '☀' : '☾';
  });
}
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form && note) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = 'Mensagem enviada! Em breve a equipe da Cyphus vai responder.';
    form.reset();
  });
}
