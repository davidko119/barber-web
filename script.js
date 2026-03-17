/* =============================================
   DON HUMANHOOD — JAVASCRIPT INTERACTIONS
   ============================================= */

'use strict';

// ─── Loader ───────────────────────────────────
const loader        = document.getElementById('loader');
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
let rafId;

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
  rafId = requestAnimationFrame(animateFollower);
}
animateFollower();

// Hover state on interactive elements
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
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

// Close nav on link click (mobile)
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
        const el = entry.target;
        const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0');
        setTimeout(() => {
          el.classList.add('visible');
        }, delay * 1000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

// Run immediately in case loader already finished (first paint)
if (!loader || loader.classList.contains('hidden')) {
  initAnimations();
}

// ─── Parallax ──────────────────────────────────
const heroBg      = document.getElementById('heroBg');
const fullBleedBg = document.getElementById('fullBleedBg');
const parallaxImgs = document.querySelectorAll('.parallax-img');

function onScroll() {
  const scrollY = window.scrollY;

  // Hero parallax
  if (heroBg) {
    heroBg.style.transform = `translateY(${scrollY * 0.35}px)`;
  }

  // Full bleed parallax
  if (fullBleedBg) {
    const rect = fullBleedBg.closest('.full-bleed').getBoundingClientRect();
    const relY = (window.innerHeight / 2 - rect.top - rect.height / 2);
    fullBleedBg.style.transform = `translateY(${relY * 0.2}px)`;
  }

  // Strip parallax
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

// ─── Booking Form ──────────────────────────────
const bookingForm    = document.getElementById('bookingForm');
const bookingSuccess = document.getElementById('bookingSuccess');

if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = bookingForm.querySelector('.form-submit span');
    btn.textContent = 'Sending…';

    setTimeout(() => {
      bookingForm.style.opacity = '0';
      bookingForm.style.transform = 'translateY(20px)';
      bookingForm.style.transition = 'opacity 0.4s, transform 0.4s';

      setTimeout(() => {
        bookingForm.style.display = 'none';
        bookingSuccess.classList.add('visible');
      }, 400);
    }, 1200);
  });
}

// ─── Smooth anchor scrolling ───────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  });
});

// ─── Service cards stagger ─────────────────────
const serviceCards = document.querySelectorAll('.service-card');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = parseInt(entry.target.dataset.index || '1');
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, (idx - 1) * 120);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

serviceCards.forEach(card => cardObserver.observe(card));

// ─── Marquee speed on hover ────────────────────
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => {
    marqueeTrack.style.animationPlayState = 'paused';
  });
  marqueeTrack.addEventListener('mouseleave', () => {
    marqueeTrack.style.animationPlayState = 'running';
  });
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
    el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
  });
  el.addEventListener('mouseenter', () => {
    el.style.transition = 'transform 0.1s';
  });
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
