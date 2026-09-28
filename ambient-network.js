(() => {
  const canvas = document.querySelector('#ambient-network');
  const toggle = document.querySelector('#motion-toggle');
  const context = canvas?.getContext('2d');
  if (!context || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Match the reference's free-moving particles and short-range mouse attraction.
  const pointCount = 99;
  const neighborRangeSquared = 6000;
  const mouseRangeSquared = 20000;
  const pointer = { x: 0, y: 0, active: false };
  const referenceFrame = 1000 / 60;
  let width = 0;
  let height = 0;
  let points = [];
  let frame = null;
  let previousTime = null;
  let paused = false;

  // Remember only an explicit pause; the OS motion preference always takes priority.
  try { paused = localStorage.getItem('wenhao-background-paused') === 'true'; } catch {}

  function resize() {
    const oldWidth = width || window.innerWidth;
    const oldHeight = height || window.innerHeight;
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    for (const point of points) {
      point.x *= width / oldWidth;
      point.y *= height / oldHeight;
    }
    while (points.length < pointCount) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
      });
    }
    pointer.active = false;
  }

  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function drawLink(a, b, gapSquared, rangeSquared) {
    if (gapSquared >= rangeSquared) return;
    const strength = 1 - gapSquared / rangeSquared;
    context.lineWidth = strength / 2;
    context.strokeStyle = `rgba(0, 0, 0, ${Math.min(1, strength + 0.2)})`;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }

  function animate(time) {
    frame = window.requestAnimationFrame(animate);
    const steps = previousTime === null ? 1 : Math.min((time - previousTime) / referenceFrame, 3);
    previousTime = time;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#000';

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      point.x += point.vx * steps;
      point.y += point.vy * steps;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
      context.fillRect(point.x - 0.5, point.y - 0.5, 1, 1);

      // Only nearby real particles connect; there are no added orbiting satellites.
      for (let j = i + 1; j < points.length; j++) {
        drawLink(point, points[j], distanceSquared(point, points[j]), neighborRangeSquared);
      }
      if (pointer.active) {
        const gapSquared = distanceSquared(point, pointer);
        if (gapSquared < mouseRangeSquared) {
          // Pull in the outer part of the mouse radius, leaving the center free to drift.
          // At 60 Hz this is the reference's 3% attraction per frame.
          if (gapSquared >= mouseRangeSquared / 2) {
            const attraction = 1 - Math.pow(0.97, steps);
            point.x += (pointer.x - point.x) * attraction;
            point.y += (pointer.y - point.y) * attraction;
          }
          drawLink(point, pointer, gapSquared, mouseRangeSquared);
        }
      }
    }
  }

  function syncMotion() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    const disabled = reducedMotion.matches || paused;
    canvas.hidden = disabled;
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume animation' : 'Pause animation';
    if (!disabled && !document.hidden) frame = window.requestAnimationFrame(animate);
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused || reducedMotion.matches) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  function releasePointer() { pointer.active = false; }
  document.documentElement.addEventListener('pointerleave', releasePointer);
  window.addEventListener('blur', releasePointer);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    releasePointer();
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('wenhao-background-paused', String(paused)); } catch {}
    syncMotion();
  });

  resize();
  syncMotion();
})();
