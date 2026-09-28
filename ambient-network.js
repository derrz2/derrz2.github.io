(() => {
  const canvas = document.querySelector('#ambient-network');
  const toggle = document.querySelector('#motion-toggle');
  const context = canvas?.getContext('2d');
  if (!context || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const color = '83, 103, 115';
  const pointer = { x: 0, y: 0, active: false, movedAt: 0 };
  const satellites = Array.from({ length: 7 }, (_, index) => ({
    angle: index * Math.PI * 2 / 7 + Math.random() * 0.6,
    radius: 45 + Math.random() * 75,
    phase: Math.random() * Math.PI * 2,
  }));
  let width = 0;
  let height = 0;
  let points = [];
  let frame = null;
  let previousTime = 0;
  let elapsed = 0;
  let hoverOpacity = 0;
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
    const count = Math.max(20, Math.min(width < 760 ? 30 : 85, Math.round(width * height / 18000)));
    points = points.slice(0, count);
    while (points.length < count) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 9;
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
    pointer.active = false;
    hoverOpacity = 0;
  }

  function drawNetwork(nodes, distance, opacity) {
    context.lineWidth = 0.65;
    for (let i = 0; i < nodes.length; i++) {
      const point = nodes[i];
      context.fillStyle = `rgba(${color}, ${opacity * 1.8})`;
      context.beginPath();
      context.arc(point.x, point.y, 0.8, 0, Math.PI * 2);
      context.fill();
      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const gap = Math.hypot(point.x - other.x, point.y - other.y);
        if (gap >= distance) continue;
        context.strokeStyle = `rgba(${color}, ${opacity * (1 - gap / distance)})`;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }
  }

  function animate(time) {
    frame = window.requestAnimationFrame(animate);
    if (previousTime && time - previousTime < 1000 / 30) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    elapsed += delta;
    context.clearRect(0, 0, width, height);

    for (const point of points) {
      point.x += point.vx * delta;
      point.y += point.vy * delta;
      if (point.x < 0 || point.x > width) {
        point.x = Math.max(0, Math.min(width, point.x));
        point.vx *= -1;
      }
      if (point.y < 0 || point.y > height) {
        point.y = Math.max(0, Math.min(height, point.y));
        point.vy *= -1;
      }
    }
    drawNetwork(points, 130, 0.18);

    // A quiet constellation forms after the mouse rests, and keeps moving on its own.
    const idle = pointer.active && time - pointer.movedAt > 650;
    hoverOpacity += ((idle ? 1 : 0) - hoverOpacity) * Math.min(delta * 4, 1);
    if (hoverOpacity > 0.01) {
      const nearby = satellites.map(({ angle, radius, phase }) => ({
        x: pointer.x + Math.cos(angle + elapsed * 0.045) * radius + Math.sin(elapsed * 0.5 + phase) * 12,
        y: pointer.y + Math.sin(angle + elapsed * 0.045) * radius + Math.cos(elapsed * 0.4 + phase) * 12,
      }));
      nearby.push(pointer);
      drawNetwork(nearby, 170, hoverOpacity * 0.32);
    }
  }

  function syncMotion() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
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
    pointer.movedAt = performance.now();
    hoverOpacity = 0;
  }, { passive: true });
  function releasePointer() { pointer.active = false; }
  document.documentElement.addEventListener('pointerleave', releasePointer);
  window.addEventListener('blur', releasePointer);
  window.addEventListener('scroll', releasePointer, { passive: true });
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
