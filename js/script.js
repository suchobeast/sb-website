const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  // Elements appear when scrolling down and disappear again when scrolling back up.
  // "Below the viewport" (top > 0) means the user scrolled up past the element.
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.intersectionRatio >= .14) entry.target.classList.add('is-visible');
    else if (entry.intersectionRatio === 0 && entry.boundingClientRect.top > 0) entry.target.classList.remove('is-visible');
  }), { threshold: [0, .14], rootMargin: '0px 0px -35px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const typeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const heading = entry.target;
    const chars = [...heading.querySelectorAll('.type-char')];
    if (entry.intersectionRatio >= .35) {
      // typing in: character by character
      chars.forEach((ch, i) => ch.style.transitionDelay = `${Math.min(i * 24, 850)}ms`);
      heading.classList.add('is-typed');
    } else if (entry.intersectionRatio === 0 && entry.boundingClientRect.top > 0) {
      // typing out: line by line, last line first
      const tops = [...new Set(chars.map(ch => Math.round(ch.getBoundingClientRect().top)))].sort((a, b) => a - b);
      chars.forEach(ch => {
        const line = tops.indexOf(Math.round(ch.getBoundingClientRect().top));
        ch.style.transitionDelay = `${(tops.length - 1 - line) * 140}ms`;
      });
      heading.classList.remove('is-typed');
    }
  }), { threshold: [0, .35] });

  document.querySelectorAll('.type-on-view').forEach(heading => {
    const split = (text, parent) => [...text].forEach(c => {
      const span = document.createElement('span');
      span.className = 'type-char';
      span.textContent = c;
      parent.appendChild(span);
    });
    const nodes = [...heading.childNodes];
    heading.textContent = '';
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) split(node.textContent, heading);
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrap = document.createElement(node.tagName.toLowerCase());
        wrap.className = node.className;
        split(node.textContent, wrap);
        heading.appendChild(wrap);
      }
    });
    typeObserver.observe(heading);
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  document.querySelectorAll('.type-on-view').forEach(el => el.classList.add('is-typed'));
}

/* ---------- Forms (contact + developer application) ----------
   Sent through FormSubmit (free, no backend needed). The very first message
   triggers an activation email to the address below: click "Activate" once. */
const CONTACT_EMAIL = 'suchobeast08@gmail.com';

document.querySelectorAll('form[data-ajax]').forEach(form => {
  const note = form.querySelector('.form-note');
  const setNote = (text, cls) => { if (!note) return; note.textContent = text; note.className = 'form-note' + (cls ? ' ' + cls : ''); };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = new FormData(form);
    if (data.get('_honey')) return; // spam bot
    data.delete('_honey');
    const fields = Object.fromEntries(data);
    const subject = `${form.dataset.subject} ${fields.name}`;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setNote('Sending…');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...fields, _subject: subject, _replyto: fields.email, _template: 'table' })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === 'false' || result.success === false) throw new Error(result.message || 'Send failed');
      form.reset();
      setNote(form.dataset.success || 'Message sent.', 'is-ok');
    } catch (error) {
      const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
      setNote('Could not send the message. Opening your email app instead, or write to ' + CONTACT_EMAIL + '.', 'is-error');
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      button.disabled = false;
    }
  });
});

/* ---------- Roblox stats (needs a backend endpoint; never put private credentials here) ---------- */
async function loadStudioStats() {
  const cards = document.querySelectorAll('[data-stat]');
  if (!cards.length) return;
  const statsNote = document.querySelector('#stats-note');
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Stats endpoint unavailable');
    const stats = await response.json();
    ['players', 'visits', 'members'].forEach(key => {
      const target = document.querySelector(`[data-stat="${key}"]`);
      if (target && stats[key] != null) target.textContent = Number(stats[key]).toLocaleString();
    });
    if (statsNote) statsNote.textContent = stats.updatedAt ? `Updated ${stats.updatedAt}` : 'Live Roblox statistics.';
  } catch {
    if (statsNote) statsNote.textContent = 'Live Roblox statistics appear once the site is deployed with the /api/stats function.';
  }
}
loadStudioStats();
