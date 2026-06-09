const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
const contactLinks = document.querySelectorAll('[data-contact-link]');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const decodeEmailPart = (codes) => codes.map((code) => String.fromCharCode(code)).join('');
const contactEmail = [
  decodeEmailPart([104, 101, 108, 108, 111]),
  decodeEmailPart([99, 104, 105, 99, 107, 101, 110, 99, 111, 111, 112, 103, 97, 109, 101, 115, 46, 99, 97])
].join('@');

contactLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const subject = link.dataset.subject ? `?subject=${encodeURIComponent(link.dataset.subject)}` : '';
    window.location.href = `mailto:${contactEmail}${subject}`;
  });
});
