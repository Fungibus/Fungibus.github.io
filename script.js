const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
toggle.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.signup-btn');
  btn.textContent = 'You\'re in! ✦';
  btn.disabled = true;
  form.querySelector('.signup-input').disabled = true;
}
