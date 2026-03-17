/* =============================================
   DON HUMANHOOD — MAIN JS (Vite + Convex)
   ============================================= */

import { ConvexClient } from "convex/browser";

// ─── Convex Client init ────────────────────────
// CONVEX_URL sa nastaví automaticky po `npx convex dev`
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
let convex = null;
let api    = null;

async function initConvex() {
  if (!CONVEX_URL) {
    console.warn("⚠ VITE_CONVEX_URL nie je nastavená. Formulár bude ukladať lokálne.");
    return;
  }
  convex = new ConvexClient(CONVEX_URL);
  try {
    const mod = await import("./convex/_generated/api.js");
    api = mod.api;
  } catch {
    console.warn("Convex API modul nie je vygenerovaný. Spusti: npx convex dev");
  }
}

// Spustí sa asynchrónne — NEBLOKUJE zvyšok modulu
initConvex();

// ─── Loader ───────────────────────────────────
const loader         = document.getElementById('loader');
const loaderProgress = document.getElementById('loaderProgress');
let progress = 0;

const loaderInterval = setInterval(() => {
  progress += Math.random() * 18 + 4;
  if (progress >= 100) {
    progress = 100;
    clearInterval(loaderInterval);
    loaderProgress.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
      initAnimations();
    }, 500);
  }
  loaderProgress.style.width = progress + '%';
}, 80);

document.body.style.overflow = 'hidden';

// ─── Custom Cursor ─────────────────────────────
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

function animateFollower() {
  followerX += (mouseX - followerX) * 0.1;
  followerY += (mouseY - followerY) * 0.1;
  follower.style.left = followerX + 'px';
  follower.style.top  = followerY + 'px';
  requestAnimationFrame(animateFollower);
}
animateFollower();

const hoverEls = document.querySelectorAll('a, button, .service-card, .team-card, .strip-item');
hoverEls.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ─── Navigation ────────────────────────────────
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ─── Scroll Reveal ─────────────────────────────
function initAnimations() {
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0');
        setTimeout(() => el.classList.add('visible'), delay * 1000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

if (!loader || loader.classList.contains('hidden')) {
  initAnimations();
}

// ─── Parallax ──────────────────────────────────
const heroBg       = document.getElementById('heroBg');
const fullBleedBg  = document.getElementById('fullBleedBg');
const parallaxImgs = document.querySelectorAll('.parallax-img');
const heroPhotoInner = document.querySelector('.hero-photo-inner');

function onScroll() {
  const scrollY = window.scrollY;

  if (heroBg) heroBg.style.transform = `translateY(${scrollY * 0.35}px)`;

  if (heroPhotoInner) {
    heroPhotoInner.style.transform = `translateY(${scrollY * 0.12}px)`;
  }

  if (fullBleedBg) {
    const rect = fullBleedBg.closest('.full-bleed').getBoundingClientRect();
    const relY = (window.innerHeight / 2 - rect.top - rect.height / 2);
    fullBleedBg.style.transform = `translateY(${relY * 0.2}px)`;
  }

  parallaxImgs.forEach(el => {
    const speed = parseFloat(el.dataset.speed || '0.1');
    const rect  = el.getBoundingClientRect();
    const relY  = (window.innerHeight / 2 - rect.top - rect.height / 2);
    const img   = el.querySelector('img');
    if (img) img.style.transform = `translateY(${relY * speed}px)`;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });

// ─── Counter Animation ─────────────────────────
const statNums = document.querySelectorAll('.stat-num[data-count]');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const dur    = 1800;
      const step   = dur / target;
      let current  = 0;
      const timer  = setInterval(() => {
        current++;
        el.textContent = current;
        if (current >= target) {
          clearInterval(timer);
          el.textContent = target + '+';
        }
      }, step);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(el => counterObserver.observe(el));

// ─── Booking Form → Convex ─────────────────────
const bookingForm    = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn     = bookingForm.querySelector('.form-submit');
    const btnSpan = btn.querySelector('span');
    btnSpan.textContent = 'Odosielam…';
    btn.disabled = true;

    const data = {
      firstName: document.getElementById('fname').value.trim(),
      lastName:  document.getElementById('lname').value.trim(),
      email:     document.getElementById('email').value.trim(),
      phone:     document.getElementById('phone').value.trim() || undefined,
      service:   document.getElementById('service').value,
      date:      document.getElementById('date').value,
      notes:     document.getElementById('notes').value.trim() || undefined,
    };

    try {
      if (convex) {
        await convex.mutation(api.bookings.createBooking, data);
      } else {
        // Fallback — localStorage (keď Convex nie je nakonfigurovaný)
        const existing = JSON.parse(localStorage.getItem('donBookings') || '[]');
        existing.push({ ...data, status: 'pending', _creationTime: Date.now() });
        localStorage.setItem('donBookings', JSON.stringify(existing));
        await new Promise(r => setTimeout(r, 800));
      }

      // Úspech
      bookingForm.style.opacity    = '0';
      bookingForm.style.transform  = 'translateY(20px)';
      bookingForm.style.transition = 'opacity 0.4s, transform 0.4s';
      setTimeout(() => {
        bookingForm.style.display = 'none';
        bookingSuccess.classList.add('visible');
      }, 400);

    } catch (err) {
      console.error('Chyba pri odosielaní:', err);
      btnSpan.textContent = 'Chyba — skús znova';
      btn.disabled = false;
    }
  });
}

// ─── Smooth anchor scrolling ───────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth'
    });
  });
});

// ─── Service cards stagger ─────────────────────
const serviceCards = document.querySelectorAll('.service-card');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = parseInt(entry.target.dataset.index || '1');
      setTimeout(() => entry.target.classList.add('visible'), (idx - 1) * 120);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

serviceCards.forEach(card => cardObserver.observe(card));

// ─── Marquee pause on hover ────────────────────
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => { marqueeTrack.style.animationPlayState = 'paused'; });
  marqueeTrack.addEventListener('mouseleave', () => { marqueeTrack.style.animationPlayState = 'running'; });
}

// ─── Image hover tilt ─────────────────────────
document.querySelectorAll('.about-image, .space-image-left, .shop-img-main').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    el.style.transform  = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
  });
  el.addEventListener('mouseenter', () => { el.style.transition = 'transform 0.1s'; });
});

// ─── Nav active link on scroll ─────────────────
const sections   = document.querySelectorAll('section[id], div[id="contact"]');
const navLinkEls = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));
