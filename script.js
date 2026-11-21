(() => {
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let scheduled = false;
  function updateNavigation() {
    const header = document.querySelector('.site-header');
    const offset = (header ? header.offsetHeight : 72) + 90;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) current = section;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12 && sections.length) {
      current = sections[sections.length - 1];
    }
    for (const link of links) {
      const active = current && link.hash === `#${current.id}`;
      link.classList.toggle('active', Boolean(active));
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();

  const filterBtns = [...document.querySelectorAll('.pub-filter')];
  const papers = [...document.querySelectorAll('#publications-list .paper')];
  const countBadge = document.querySelector('.section-aside');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.filter;
      filterBtns.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      let shown = 0;
      papers.forEach(card => {
        const ok =
          key === 'all' ||
          (key === 'first' && card.dataset.first === '1') ||
          (key === 'conference' && card.dataset.kind === 'conference') ||
          (key === 'preprint' && card.dataset.kind === 'preprint');
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (countBadge) countBadge.textContent = `${shown} work${shown === 1 ? '' : 's'}`;
    });
  });

  document.querySelectorAll('[data-copy-email]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.copyEmail;
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const span = btn.querySelector('[data-copy-text]');
      if (span) {
        const prev = span.textContent;
        span.textContent = 'Copied!';
        btn.classList.add('is-copied');
        window.setTimeout(() => {
          span.textContent = prev;
          btn.classList.remove('is-copied');
        }, 1800);
      }
    });
  });

  const modal = document.getElementById('figure-lightbox');
  if (modal) {
    const imgEl = modal.querySelector('.lb-img');
    const titleEl = modal.querySelector('.lb-title');
    const linkEl = modal.querySelector('.lb-link');
    const closeBtn = modal.querySelector('.lb-close');
    function open(src, alt, title, href) {
      imgEl.src = src;
      imgEl.alt = alt || title;
      titleEl.textContent = title;
      linkEl.href = href;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(() => { modal.hidden = true; }, 160);
    }
    document.querySelectorAll('.paper-image[data-zoom-title]').forEach(a => {
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        const img = a.querySelector('img');
        open(img.src, img.alt, a.dataset.zoomTitle, a.href);
      });
    });
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }
})();
