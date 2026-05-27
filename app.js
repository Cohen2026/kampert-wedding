/* =============================================================
   Cleodine & Paulus Kampert — Wedding Site · Interactions
   ============================================================= */

// ----- Nav: frosted glass on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 60);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile burger menu
const burger = document.getElementById('burger');
burger?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => nav.classList.remove('is-open'))
);


// ----- Countdown to 23 July 2026, 6:30 PM EDT
const TARGET = new Date('2026-07-23T19:00:00-04:00').getTime();
const cdEls = {
  d: document.querySelector('[data-cd="d"]'),
  h: document.querySelector('[data-cd="h"]'),
  m: document.querySelector('[data-cd="m"]'),
  s: document.querySelector('[data-cd="s"]'),
};

function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const diff = TARGET - Date.now();
  if (diff <= 0) {
    cdEls.d.textContent = '00'; cdEls.h.textContent = '00';
    cdEls.m.textContent = '00'; cdEls.s.textContent = '00';
    return;
  }
  cdEls.d.textContent = pad(Math.floor(diff / 86400000));
  cdEls.h.textContent = pad(Math.floor(diff % 86400000 / 3600000));
  cdEls.m.textContent = pad(Math.floor(diff % 3600000 / 60000));
  cdEls.s.textContent = pad(Math.floor(diff % 60000 / 1000));
}
tick();
setInterval(tick, 1000);


// ----- Gallery lightbox
const gframes = [...document.querySelectorAll('.gframe')];
const lb      = document.getElementById('lightbox');
const lbImg   = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
const lbPrev  = document.getElementById('lbPrev');
const lbNext  = document.getElementById('lbNext');
let lbIndex = 0;

function openLb(i) {
  lbIndex = (i + gframes.length) % gframes.length;
  lbImg.src = gframes[lbIndex].dataset.src;
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLb() {
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

gframes.forEach((g, i) => g.addEventListener('click', () => openLb(i)));
lbClose.addEventListener('click', closeLb);
lbPrev.addEventListener('click',  () => openLb(lbIndex - 1));
lbNext.addEventListener('click',  () => openLb(lbIndex + 1));
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape')     closeLb();
  if (e.key === 'ArrowLeft')  openLb(lbIndex - 1);
  if (e.key === 'ArrowRight') openLb(lbIndex + 1);
});


// ----- Dress card thumbnail → lightbox (no prev/next)
document.querySelectorAll('.detail-card__thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    lbImg.src = btn.dataset.src;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbPrev.style.visibility = 'hidden';
    lbNext.style.visibility = 'hidden';
  });
});
lb.addEventListener('click', () => {
  lbPrev.style.visibility = '';
  lbNext.style.visibility = '';
});
document.getElementById('lbClose').addEventListener('click', () => {
  lbPrev.style.visibility = '';
  lbNext.style.visibility = '';
});

// ----- RSVP multi-step form
const form    = document.getElementById('rsvpForm');
const steps   = [...form.querySelectorAll('.step')];
const stepNav = [...document.querySelectorAll('#steps li')];
let stepIdx = 0;

function showStep(i) {
  steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
  stepNav.forEach((s, idx) => {
    s.classList.toggle('is-active', idx === i);
    s.classList.toggle('is-done',   idx < i);
  });
  stepIdx = i;
  form.scrollIntoView({ behavior: 'auto', block: 'nearest' });
}

function validateStep(i) {
  const fs = steps[i];
  for (const f of fs.querySelectorAll('[required]')) {
    if (f.type === 'radio') {
      if (!fs.querySelector(`input[name="${f.name}"]:checked`)) {
        fs.classList.add('shake');
        setTimeout(() => fs.classList.remove('shake'), 500);
        return false;
      }
    } else if (!f.value || (f.type === 'email' && !/.+@.+\..+/.test(f.value))) {
      f.classList.add('shake');
      setTimeout(() => f.classList.remove('shake'), 500);
      return false;
    }
  }
  return true;
}

form.querySelectorAll('[data-next]').forEach(btn =>
  btn.addEventListener('click', () => { if (validateStep(stepIdx)) showStep(stepIdx + 1); })
);
form.querySelectorAll('[data-prev]').forEach(btn =>
  btn.addEventListener('click', () => showStep(stepIdx - 1))
);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(stepIdx)) return;

  const data      = Object.fromEntries(new FormData(form).entries());
  const firstName = (data.name || 'friend').trim().split(/\s+/)[0];
  const attending = data.attending === 'yes';

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

  const subjectEl = document.getElementById('rsvpSubject');
  if (subjectEl) {
    subjectEl.value = `RSVP (${attending ? 'YES' : 'No'}) — ${data.name || 'Guest'} — The Kamperts wedding`;
  }

  try {
    const res = await fetch('https://formsubmit.co/ajax/rsvp@meetthekamperts.com', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error('Network error');
  } catch {
    // Fallback: open mail client
    const subject = encodeURIComponent('RSVP — The Kamperts wedding');
    const body = encodeURIComponent([
      `Name: ${data.name || ''}`,
      `Email: ${data.email || ''}`,
      `Attending: ${data.attending || ''}`,
      `Dietary needs: ${data.diet || ''}`,
      `Song request: ${data.song || ''}`,
      '',
      `Note: ${data.note || ''}`,
    ].join('\n'));
    window.location.href = `mailto:rsvp@meetthekamperts.com?subject=${subject}&body=${body}`;
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send reply ✓'; }
  }

  document.getElementById('thanksName').textContent = firstName;
  document.getElementById('thanksMsg').textContent = attending
    ? `Your reply is on its way to us. We can't wait to see you in July${data.song ? ` — and to hear "${data.song}" on the dance floor.` : '.'}`
    : `We'll miss you, but thank you for the note. We'll raise a glass to you on the night.`;
  showStep(3);
});

document.getElementById('resetForm').addEventListener('click', () => {
  form.reset();
  showStep(0);
});


// ----- FAQ accordion
document.querySelectorAll('.qa__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const li   = btn.closest('.qa');
    const open = li.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });
});


// ----- Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section, .bleed, .countdown').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});
