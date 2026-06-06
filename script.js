const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
const contactLinks = document.querySelectorAll('[data-contact-link]');
const mailtoSignupForms = document.querySelectorAll('[data-mailto-signup]');

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
}

const decodeEmailPart = (codes) => codes.map((code) => String.fromCharCode(code)).join('');
const contactEmail = [
  decodeEmailPart([99, 104, 105, 99, 107, 101, 110, 99, 111, 111, 112, 103, 97, 109, 101, 115, 116, 117, 100, 105, 111]),
  decodeEmailPart([103, 109, 97, 105, 108, 46, 99, 111, 109])
].join('@');

contactLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const subject = link.dataset.subject ? `?subject=${encodeURIComponent(link.dataset.subject)}` : '';
    window.location.href = `mailto:${contactEmail}${subject}`;
  });
});

mailtoSignupForms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailInput = form.querySelector('input[type="email"]');
    const status = form.querySelector('[data-form-status]');

    if (!emailInput || !emailInput.reportValidity()) return;

    const email = emailInput.value.trim();
    const subject = 'Interested in the Chicken Coop creator network';
    const body = [
      'Hi Chicken Coop Games,',
      '',
      'I am interested in the future creator network.',
      '',
      `My email is: ${email}`,
      '',
      'Thanks!'
    ].join('\n');

    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (status) {
      status.textContent = 'Your email app should open with a draft to send us.';
    }
  });
});
