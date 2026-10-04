/* ═══════════════════════════════════════════════════
   Travellian — shared scripts (index.html & blog.html)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────── UTILITIES ────────── */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $('#toast');
  let toastTimer;
  function toast(message, type = '') {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = 'toast' + (type ? ' toast--' + type : '');
    clearTimeout(toastTimer);
    requestAnimationFrame(() => toastEl.classList.add('show'));
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
  }
  window.toast = toast;

  /* ────────── FOOTER YEAR ────────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ────────── NAVBAR: scroll state ────────── */
  const navbar = $('#navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ────────── NAVBAR: mobile toggle ────────── */
  const navToggle = $('#navToggle');
  const navLinks  = $('#navLinks');
  if (navToggle && navLinks) {
    const closeNav = () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    // close on link click
    $$('a', navLinks).forEach(a => a.addEventListener('click', closeNav));
    // close on outside click
    document.addEventListener('click', e => {
      if (!navLinks.classList.contains('open')) return;
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });
    // close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ────────── SMOOTH SCROLL for #anchors ────────── */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ────────── REVEAL ON SCROLL ────────── */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('revealed'));
  }

  /* ────────── COUNTER ANIMATION ────────── */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const divide = parseFloat(el.dataset.divide) || 1;
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const value = (target * eased) / divide;
        el.textContent = (divide === 1 ? Math.round(value) : value.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = (divide === 1 ? target : (target / divide).toFixed(1)) + suffix;
      };
      requestAnimationFrame(tick);
    };

    const co = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

  /* ────────── GENERIC SLIDER (scroll-snap based) ────────── */
  $$('[data-slider]').forEach(section => {
    const viewport = $('.slider-viewport', section);
    const track    = $('.slider-track', section);
    const prevBtn  = $('[data-prev]', section);
    const nextBtn  = $('[data-next]', section);
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    const scrollByCard = (dir) => {
      const firstCard = track.firstElementChild;
      if (!firstCard) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      const step = firstCard.getBoundingClientRect().width + gap;
      viewport.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => scrollByCard(-1));
    nextBtn.addEventListener('click', () => scrollByCard(1));

    const updateButtons = () => {
      const max = viewport.scrollWidth - viewport.clientWidth - 2;
      prevBtn.disabled = viewport.scrollLeft <= 2;
      nextBtn.disabled = viewport.scrollLeft >= max;
    };
    updateButtons();
    viewport.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);

    // drag-to-scroll for desktop
    let isDown = false, startX = 0, startScroll = 0, moved = 0;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      isDown = true; moved = 0;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.style.cursor = 'grabbing';
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      if (moved > 4) viewport.scrollLeft = startScroll - dx;
    });
    const endDrag = () => { isDown = false; viewport.style.cursor = ''; };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointerleave', endDrag);
    viewport.addEventListener('click', (e) => {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  /* ────────── BOOKING FORM ────────── */
  const bookingForm = $('#bookingForm');
  if (bookingForm) {
    const cityEl    = $('#city');
    const peopleEl  = $('#people');
    const checkInEl = $('#check_in');
    const checkOutEl= $('#check_out');

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = cityEl.value.trim();
      const people = peopleEl.value;
      const checkIn = checkInEl.value;
      const checkOut = checkOutEl.value;

      if (!city) { toast('Please enter a destination.', 'error'); cityEl.focus(); return; }
      if (!people) { toast('Please select the number of travellers.', 'error'); peopleEl.focus(); return; }
      if (!checkIn) { toast('Please choose a check-in date.', 'error'); checkInEl.focus(); return; }
      if (!checkOut) { toast('Please choose a check-out date.', 'error'); checkOutEl.focus(); return; }

      const dIn  = new Date(checkIn);
      const dOut = new Date(checkOut);
      if (dOut <= dIn) { toast('Check-out must be after check-in.', 'error'); checkOutEl.focus(); return; }

      const nights = Math.round((dOut - dIn) / 86400000);
      toast(
        `✈ Trip to ${city} confirmed for ${people} traveller(s) — ${nights} night${nights > 1 ? 's' : ''} from ${checkIn} to ${checkOut}.`,
        'success'
      );

      bookingForm.reset();
      peopleEl.selectedIndex = 1;
    });

    // min dates
    const today = new Date().toISOString().split('T')[0];
    checkInEl.min = today;
    checkOutEl.min = today;
    checkInEl.addEventListener('change', () => {
      if (checkInEl.value) checkOutEl.min = checkInEl.value;
    });
  }

  /* ────────── "DETAILS" / CTA → prefill booking ────────── */
  $$('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cityInput = $('#city');
      if (cityInput) {
        cityInput.value = btn.dataset.book;
        const form = $('#bookingForm');
        const top = form ? form.getBoundingClientRect().top + window.scrollY - 120 : 0;
        window.scrollTo({ top, behavior: 'smooth' });
        setTimeout(() => cityInput.focus(), 600);
        toast(`Destination set to ${btn.dataset.book}. Pick your dates to continue.`);
      } else {
        // on blog page — bounce back to home booking bar
        window.location.href = 'index.html#home';
      }
    });
  });

  /* ────────── NEWSLETTER ────────── */
  const newsletterForm = $('#newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = $('#newsletterEmail');
      const email = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) { toast('Please enter a valid email address.', 'error'); emailInput.focus(); return; }
      toast('🎉 You\'re subscribed! Check your inbox for a welcome note.', 'success');
      newsletterForm.reset();
    });
  }

  /* ────────── LIGHTBOX ────────── */
  const lightbox    = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');
  if (lightbox && lightboxImg) {
    const openLightbox = (src, alt = '') => {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    $$('.gallery-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const full = btn.dataset.full || ($('img', btn) && $('img', btn).src);
        if (full) openLightbox(full, $('img', btn)?.alt || '');
      });
    });
    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  /* ────────── BLOG FILTERS + LOAD MORE ────────── */
  const filterBtns = $$('.filter-btn');
  const postCards  = $$('#postGrid .post-card');
  if (filterBtns.length && postCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        postCards.forEach(card => {
          const match = filter === 'all' || card.dataset.cat === filter;
          card.classList.toggle('hidden', !match);
        });
      });
    });
  }

  const loadMoreBtn = $('#loadMore');
  if (loadMoreBtn && postCards.length) {
    // hide all but first 6 initially
    postCards.forEach((card, i) => { if (i >= 6) card.classList.add('hidden'); });
    let expanded = false;

    loadMoreBtn.addEventListener('click', () => {
      expanded = !expanded;
      const activeFilter = $('.filter-btn.active')?.dataset.filter || 'all';
      postCards.forEach((card, i) => {
        const matchesFilter = activeFilter === 'all' || card.dataset.cat === activeFilter;
        if (!expanded && i >= 6) card.classList.add('hidden');
        else if (matchesFilter) card.classList.remove('hidden');
      });
      loadMoreBtn.textContent = expanded ? 'Show less' : 'Load more articles';
      // mark hidden state on load
      if (!expanded) {
        postCards.forEach((card, i) => {
          if (i >= 6) card.classList.add('hidden');
        });
      }
    });
  }

})();