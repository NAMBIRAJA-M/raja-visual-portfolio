/**
 * RAJA VISUAL — CINEMATIC VIDEO EDITOR PORTFOLIO
 * Main JavaScript: js/main.js
 * Vanilla JavaScript (No frameworks, 100% compatible with GitHub Pages & Netlify)
 */

(() => {
  'use strict';

  // 1. Mark JavaScript active for progressive enhancement of reveal animations
  document.documentElement.classList.add('js-loaded');

  // DOM Query Helpers
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  /* --------------------------------------------------------------------------
     2. PRELOADER & HERO ENTRANCE TRIGGER
     -------------------------------------------------------------------------- */
  const hero = $('#home');
  const triggerHeroEntrance = () => {
    if (hero && !hero.classList.contains('hero-entered')) {
      hero.classList.add('hero-entered');
    }
  };

  const preloader = $('#preloader');
  if (preloader) {
    const hasVisited = sessionStorage.getItem('raja_portfolio_visited');
    if (hasVisited) {
      // Return visitor: hide preloader immediately without waiting
      preloader.classList.add('done');
      triggerHeroEntrance();
    } else {
      // First visit: show short cinematic intro (~0.6s)
      const hidePreloader = () => {
        setTimeout(() => {
          preloader.classList.add('done');
          sessionStorage.setItem('raja_portfolio_visited', 'true');
          triggerHeroEntrance();
        }, 600);
      };

      if (document.readyState === 'complete') {
        hidePreloader();
      } else {
        window.addEventListener('load', hidePreloader);
        // Fallback safeguard if load takes longer than 1.2s
        setTimeout(hidePreloader, 1200);
      }
    }
  } else {
    triggerHeroEntrance();
  }

  /* --------------------------------------------------------------------------
     3. HERO TIMECODE COUNTER (DaVinci Resolve Style — 24fps)
     -------------------------------------------------------------------------- */
  const heroTimecode = $('#heroTimecode');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tcHours = 0, tcMinutes = 0, tcSeconds = 12, tcFrames = 8;
  const tcRate = 24;
  let tcIntervalId = null;
  let isHeroInView = true;

  const startHeroTimecode = () => {
    if (tcIntervalId || !heroTimecode || prefersReducedMotion) return;
    tcIntervalId = setInterval(() => {
      if (!isHeroInView) return;
      tcFrames++;
      if (tcFrames >= tcRate) {
        tcFrames = 0;
        tcSeconds++;
        if (tcSeconds >= 60) {
          tcSeconds = 0;
          tcMinutes++;
          if (tcMinutes >= 60) {
            tcMinutes = 0;
            tcHours++;
          }
        }
      }
      const pad = (n) => (n < 10 ? '0' + n : String(n));
      heroTimecode.textContent = `${pad(tcHours)}:${pad(tcMinutes)}:${pad(tcSeconds)}:${pad(tcFrames)}`;
    }, 1000 / tcRate);
  };

  const stopHeroTimecode = () => {
    if (tcIntervalId) {
      clearInterval(tcIntervalId);
      tcIntervalId = null;
    }
  };

  startHeroTimecode();

  /* --------------------------------------------------------------------------
     4. FULL-SCREEN PARALLAX & MOTION ENGINE (Step 1)
     - ONE passive scroll listener + requestAnimationFrame
     - IntersectionObserver to run updates only while hero is visible
     - Desktop-only smoothed mouse-depth effect with lerp (disabled on touch)
     - Light parallax on project cards & subtle slide-in offsets on section titles
     -------------------------------------------------------------------------- */
  const nav = $('#nav');
  const progress = $('#progress');
  const layer1 = $('.hero-bg-layer', hero);
  const layer2 = $('.hero-gradient-layer', hero);
  const textLayers = $$('.hero-bg-text-layer', hero);
  const layer4 = $('.hero-content', hero);
  const floatRec = $('.hero-float--rec', hero);
  const floatIso = $('.hero-float--iso', hero);
  const floatTc = $('.hero-float--tc', hero);
  const orbs = $$('[data-orb-depth]', hero);
  const scrollCue = $('#scrollCue');
  const projectCardsForParallax = $$('.project-card');
  const sectionTitlesForParallax = $$('.section-title');

  // Track hero visibility with IntersectionObserver
  if ('IntersectionObserver' in window && hero) {
    const heroObserver = new IntersectionObserver((entries) => {
      isHeroInView = entries[0].isIntersecting;
      if (isHeroInView) {
        startHeroTimecode();
        requestTick();
      } else {
        stopHeroTimecode();
      }
    }, { threshold: 0 });
    heroObserver.observe(hero);
  }

  // Desktop Mouse Depth Effect
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  if (!isTouchDevice && !prefersReducedMotion && hero) {
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      requestTick();
    });

    hero.addEventListener('pointerleave', () => {
      targetMouseX = 0;
      targetMouseY = 0;
      requestTick();
    });
  }

  // Unified Scroll & Animation Loop
  let scrollY = window.scrollY || window.pageYOffset;
  let isTicking = false;

  const requestTick = () => {
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(updateMotion);
    }
  };

  const updateMotion = () => {
    isTicking = false;

    if (prefersReducedMotion) return;

    // 1. Mouse Depth Lerp
    if (!isTouchDevice) {
      currentMouseX += (targetMouseX - currentMouseX) * 0.1;
      currentMouseY += (targetMouseY - currentMouseY) * 0.1;
      if (Math.abs(targetMouseX - currentMouseX) > 0.001 || Math.abs(targetMouseY - currentMouseY) > 0.001) {
        requestTick();
      }
    }

    // 2. Hero Parallax Layers (Active only when hero is in view)
    if (isHeroInView && hero) {
      const heroHeight = hero.offsetHeight || window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const motionScale = isMobile ? 0.35 : 1.0;

      const mx = isTouchDevice ? 0 : currentMouseX;
      const my = isTouchDevice ? 0 : currentMouseY;

      hero.style.setProperty('--mx', `${50 + mx * 28}%`);
      hero.style.setProperty('--my', `${42 + my * 22}%`);

      // Layer 1: Background photo (slow drift + stronger scale-up)
      if (layer1) {
        const l1Y = scrollY * 0.18 * motionScale;
        const l1Scale = 1.0 + Math.min(0.18, (scrollY / heroHeight) * 0.16);
        layer1.style.transform = `translate3d(${mx * -36}px, ${l1Y + my * -24}px, 0) scale(${l1Scale})`;
      }

      // Layer 2: Dark/red gradient
      if (layer2) {
        const l2Y = scrollY * 0.34 * motionScale;
        layer2.style.transform = `translate3d(${mx * -18}px, ${l2Y + my * -12}px, 0)`;
      }

      // Layer 3: Outlined type bands (opposite directions, different speeds)
      textLayers.forEach((layer, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        const speed = parseFloat(layer.dataset.parallaxSpeed || '0.4');
        const lX = scrollY * speed * dir * motionScale;
        const lY = scrollY * (0.18 + i * 0.08) * motionScale;
        layer.style.transform = `translate3d(${lX + mx * 42 * dir}px, ${lY + my * 16}px, 0)`;
      });

      // Layer 4: Foreground content (rises, fades, 3D mouse tilt)
      if (layer4) {
        const l4Y = -scrollY * 0.38 * motionScale;
        const fadeProgress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.68)));
        const l4Opacity = Math.max(0, 1 - fadeProgress * 1.35);
        layer4.style.transform = `translate3d(${mx * 18}px, ${l4Y + my * -16}px, 0) rotateY(${mx * 6}deg) rotateX(${my * -4}deg)`;
        layer4.style.opacity = l4Opacity;
      }

      orbs.forEach((orb) => {
        const depth = parseFloat(orb.dataset.orbDepth) || 30;
        const oY = scrollY * (depth * 0.012) * motionScale;
        orb.style.transform = `translate3d(${mx * depth}px, ${oY + my * (depth * 0.45)}px, 0)`;
      });

      // Layer 5: Floating details (REC, ISO, timecode)
      if (floatRec) {
        floatRec.style.transform = `translate3d(${mx * -28}px, ${scrollY * 0.62 * motionScale + my * -18}px, 0)`;
      }
      if (floatIso) {
        floatIso.style.transform = `translate3d(${mx * 20}px, ${scrollY * 0.44 * motionScale + my * 10}px, 0)`;
      }
      if (floatTc) {
        floatTc.style.transform = `translate3d(${mx * -32}px, ${scrollY * 0.7 * motionScale + my * -22}px, 0)`;
      }

      // Scroll Cue: Fades out smoothly as user scrolls
      if (scrollCue) {
        const cueOpacity = Math.max(0, 1 - scrollY / 100);
        scrollCue.style.opacity = cueOpacity;
        scrollCue.style.pointerEvents = cueOpacity <= 0 ? 'none' : '';
      }
    }

    // 3. Extras: Light parallax on project cards & subtle slide-in offsets on section titles
    const winHeight = window.innerHeight;
    const midWin = winHeight / 2;

    projectCardsForParallax.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.top < winHeight && rect.bottom > 0) {
        const imgBox = $('.project-image-box', card);
        if (imgBox) {
          const cardCenter = rect.top + rect.height / 2;
          const offset = Math.max(-16, Math.min(16, (cardCenter - midWin) * 0.05));
          imgBox.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      }
    });

    sectionTitlesForParallax.forEach(title => {
      const rect = title.getBoundingClientRect();
      if (rect.top < winHeight && rect.bottom > 0) {
        const titleCenter = rect.top + rect.height / 2;
        const offset = Math.max(-12, Math.min(12, (titleCenter - midWin) * 0.03));
        title.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    });
  };

  const onScroll = () => {
    scrollY = window.scrollY || window.pageYOffset;

    if (nav) {
      nav.classList.toggle('scrolled', scrollY > 35);
    }
    if (progress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    requestTick();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------------------------
     5. INTERSECTION OBSERVER FOR SCROLL REVEALS
     -------------------------------------------------------------------------- */
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if browser lacks IntersectionObserver
    revealElements.forEach(el => el.classList.add('in-view'));
  }

  /* --------------------------------------------------------------------------
     5. MOBILE NAVIGATION MENU
     -------------------------------------------------------------------------- */
  const menuToggle = $('#menuToggle');
  const navLinks = $('#navLinks');

  if (menuToggle && navLinks) {
    const toggleMenu = (open) => {
      const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '×' : '☰';
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    };

    menuToggle.addEventListener('click', () => toggleMenu());

    // Close mobile menu on clicking any navigation link
    $$('.nav-links a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close when clicking outside header
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !nav.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. PROJECT FILTERS WITH ARIA-PRESSED
     -------------------------------------------------------------------------- */
  const filterBtns = $$('.filter');
  const projectCards = $$('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';

      // Update aria-pressed and active classes
      filterBtns.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });

      // Filter project cards
      projectCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
        if (match && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          card.animate(
            [
              { opacity: 0, transform: 'translateY(14px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: 320, easing: 'cubic-bezier(0.22, 0.8, 0.22, 1)' }
          );
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     7. WATCHABLE VIDEO MODAL (Focus Trap, Esc Close, YouTube/Vimeo Embeds)
     -------------------------------------------------------------------------- */
  const modal = $('#projectModal');
  const modalBox = $('.modal-box', modal);
  const modalClose = $('#modalClose');
  const modalTitle = $('#modalTitle');
  const modalType = $('#modalType');
  const modalDescription = $('#modalDescription');
  const modalVideoIframe = $('#modalVideo');
  const modalVideoWrapper = $('.modal-video-wrapper', modal);
  const modalMetaClient = $('#modalMetaClient');
  const modalMetaCraft = $('#modalMetaCraft');
  const modalMetaDuration = $('#modalMetaDuration');
  const modalContactBtn = $('#modalContact');

  let lastActiveElement = null;

  // Focusable selectors for focus trap inside modal
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = (e) => {
    if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
    const focusable = $$(focusableSelector, modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  const openModal = (card) => {
    lastActiveElement = document.activeElement;

    // Set text content
    if (modalTitle) modalTitle.textContent = card.dataset.title || 'Project Details';
    if (modalType) modalType.textContent = card.dataset.type || 'Selected Work';
    if (modalDescription) modalDescription.textContent = card.dataset.description || '';
    if (modalMetaClient) modalMetaClient.textContent = card.dataset.client || '[Client Name]';
    if (modalMetaCraft) modalMetaCraft.textContent = card.dataset.craft || 'Edit · Colour · Sound';
    if (modalMetaDuration) modalMetaDuration.textContent = card.dataset.duration || '00:00';

    // Handle video embed: lazy-load iframe on modal open
    const videoUrl = card.dataset.video || '';
    const isReel = card.dataset.isReel === 'true' || card.classList.contains('is-reel');

    if (modalVideoWrapper) {
      modalVideoWrapper.classList.toggle('is-reel-video', isReel);
    }

    if (modalVideoIframe) {
      if (videoUrl) {
        // Embed real YouTube / Vimeo URL with autoplay
        let embedSrc = videoUrl;
        if (embedSrc.includes('youtube.com/embed') || embedSrc.includes('youtube-nocookie.com/embed')) {
          embedSrc += (embedSrc.includes('?') ? '&' : '?') + 'autoplay=1&rel=0&modestbranding=1';
        } else if (embedSrc.includes('vimeo.com/video')) {
          embedSrc += (embedSrc.includes('?') ? '&' : '?') + 'autoplay=1';
        }
        modalVideoIframe.src = embedSrc;
        modalVideoIframe.style.display = 'block';
      } else {
        modalVideoIframe.src = '';
        modalVideoIframe.style.display = 'none';
      }
    }

    // Show modal & prevent background scroll
    modal.classList.add('open');
    document.body.classList.add('locked');
    document.addEventListener('keydown', trapFocus);

    // Focus close button for keyboard users
    setTimeout(() => {
      if (modalClose) modalClose.focus();
    }, 50);
  };

  const closeModal = () => {
    if (!modal.classList.contains('open')) return;

    modal.classList.remove('open');
    document.body.classList.remove('locked');
    document.removeEventListener('keydown', trapFocus);

    // Stop video playback by clearing iframe src
    if (modalVideoIframe) {
      modalVideoIframe.src = '';
    }

    // Return focus to the trigger element that opened the modal
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  };

  // Attach click & enter key triggers to project cards
  projectCards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalContactBtn) modalContactBtn.addEventListener('click', closeModal);

  // Close when clicking modal backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  /* --------------------------------------------------------------------------
     8. SHOWREEL VIDEO PLAYER & CONTROLS (Step 2)
     -------------------------------------------------------------------------- */
  const showreelVideo = $('#showreelVideo');
  const showreelToggleBtn = $('#showreelToggleBtn');

  if (showreelVideo && showreelToggleBtn) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      showreelVideo.pause();
      showreelToggleBtn.textContent = '▶';
      showreelToggleBtn.setAttribute('aria-label', 'Play showreel');
    }

    showreelToggleBtn.addEventListener('click', () => {
      if (showreelVideo.paused) {
        showreelVideo.play().then(() => {
          showreelToggleBtn.textContent = '⏸';
          showreelToggleBtn.setAttribute('aria-label', 'Pause showreel');
        }).catch(() => {});
      } else {
        showreelVideo.pause();
        showreelToggleBtn.textContent = '▶';
        showreelToggleBtn.setAttribute('aria-label', 'Play showreel');
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. BEFORE / AFTER COLOUR GRADE SLIDER (Step 2)
     -------------------------------------------------------------------------- */
  const gradeSliderWrap = $('#gradeSlider');
  const gradeBeforeContainer = $('#gradeBefore');
  const gradeRangeInput = $('#gradeRange');

  if (gradeSliderWrap && gradeBeforeContainer) {
    const updateSlider = (percent) => {
      const clamped = Math.max(0, Math.min(100, percent));
      gradeBeforeContainer.style.width = `${clamped}%`;
      if (gradeRangeInput) {
        gradeRangeInput.value = clamped;
      }
    };

    // Range input change (keyboard & accessible controls)
    if (gradeRangeInput) {
      gradeRangeInput.addEventListener('input', (e) => {
        updateSlider(parseFloat(e.target.value));
      });
    }

    // Pointer / mouse / touch drag events on the visual container
    let isDragging = false;

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const rect = gradeSliderWrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percent = (x / rect.width) * 100;
      updateSlider(percent);
    };

    const startDrag = (e) => {
      isDragging = true;
      onPointerMove(e);
    };

    const stopDrag = () => {
      isDragging = false;
    };

    gradeSliderWrap.addEventListener('mousedown', startDrag);
    gradeSliderWrap.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }

  /* --------------------------------------------------------------------------
     10. REAL NUMBERS ANIMATED COUNTERS (Step 3)
     -------------------------------------------------------------------------- */
  const statNumbers = $$('.stat-num');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          if (!isNaN(target) && target > 0) {
            let start = 0;
            const duration = 1400;
            const startTime = performance.now();
            const animateCount = (now) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const current = Math.floor(progress * target);
              el.textContent = current;
              if (progress < 1) {
                requestAnimationFrame(animateCount);
              } else {
                el.textContent = target;
              }
            };
            requestAnimationFrame(animateCount);
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    statNumbers.forEach(s => statsObserver.observe(s));
  }

  /* --------------------------------------------------------------------------
     11. CONTACT FORM (Formspree / Netlify / Mailto Fallback + Toast)
     -------------------------------------------------------------------------- */
  const contactForm = $('#contactForm');
  const toast = $('#toast');
  const formStatus = $('#formStatus');

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  };

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const name = (formData.get('name') || '').trim();
      const email = (formData.get('email') || '').trim();
      const project = formData.get('project') || 'General Project';
      const message = (formData.get('message') || '').trim();

      // Basic client-side validation
      if (!name || !email || !message) {
        if (formStatus) {
          formStatus.textContent = 'Please fill out all required fields.';
          formStatus.className = 'form-status error';
        }
        return;
      }

      const formAction = contactForm.getAttribute('action') || '';
      const isFormspree = formAction.includes('formspree.io') && !formAction.includes('[YOUR_FORMSPREE_ID]');
      const isNetlify = contactForm.hasAttribute('data-netlify');

      // If Formspree endpoint is configured
      if (isFormspree) {
        try {
          const response = await fetch(formAction, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
            contactForm.reset();
            if (formStatus) {
              formStatus.textContent = 'Thank you! Your enquiry has been sent. I will respond within 24 hours.';
              formStatus.className = 'form-status success';
            }
            showToast('Message sent successfully!');
            return;
          }
        } catch (err) {
          console.warn('Formspree submission error, falling back to mailto:', err);
        }
      }

      // If Netlify Forms is submitting
      if (isNetlify && window.location.hostname !== 'localhost') {
        try {
          const body = new URLSearchParams(formData).toString();
          const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
          });
          if (response.ok) {
            contactForm.reset();
            if (formStatus) {
              formStatus.textContent = 'Enquiry submitted! I will be in touch soon.';
              formStatus.className = 'form-status success';
            }
            showToast('Message submitted via Netlify!');
            return;
          }
        } catch (err) {
          console.warn('Netlify form error, falling back to mailto:', err);
        }
      }

      // Universal Mailto Fallback: Pre-fills client's default email app
      const defaultEmail = 'rajaeditz.visual@gmail.com'; /* [YOUR EMAIL HERE] */
      const subject = encodeURIComponent(`Project enquiry — ${project} (${name})`);
      const body = encodeURIComponent(
        `Hi Raja,\n\nMy name is ${name}.\nEmail: ${email}\nProject Type: ${project}\n\nProject Details:\n${message}\n\nLooking forward to collaborating!`
      );
      const mailtoLink = `mailto:${defaultEmail}?subject=${subject}&body=${body}`;

      window.location.href = mailtoLink;

      if (formStatus) {
        formStatus.textContent = 'Opening your email app with a pre-filled draft...';
        formStatus.className = 'form-status success';
      }
      showToast('Opening your email app to send your message.');
    });
  }

  /* --------------------------------------------------------------------------
     12. DYNAMIC YEAR
     -------------------------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------------
     13. SUBTLE MAGNETIC HOVER ON BUTTONS (Desktop Only)
     -------------------------------------------------------------------------- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.04}px, ${y * 0.06}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }
})();
