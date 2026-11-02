/**
 * dragon.js - Glowing red particle cursor trail (no dragon body).
 * Emits radiant red ember particles that follow the cursor.
 */

class DragonCursor {
  constructor() {
    // Detect mobile
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (this.isMobile) {
      this.enabled = false;
      return;
    }

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'dragon-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '99999';
    this.canvas.style.opacity = '0';
    this.canvas.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.particles = [];

    // Cursor state
    this.isOutside = true;
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.prev  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.velocity = { x: 0, y: 0 };
    this.speed = 0;

    this.initEvents();
    this.resizeCanvas();
    this.animate();
  }

  initEvents() {
    const handlePointerLeave = () => {
      this.isOutside = true;
      this.canvas.style.opacity = '0';
    };

    const handlePointerMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      if (this.isOutside) {
        this.isOutside = false;
        this.mouse.x = x;
        this.mouse.y = y;
        this.prev.x  = x;
        this.prev.y  = y;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.particles = [];
      }

      this.prev.x = this.mouse.x;
      this.prev.y = this.mouse.y;
      this.mouse.x = x;
      this.mouse.y = y;

      // Update opacity based on target element
      const isInteractive = e.target && e.target.closest &&
        e.target.closest('a, button, input, textarea, [role="button"], .project-card, .btn');
      this.canvas.style.zIndex   = isInteractive ? '5' : '99999';
      this.canvas.style.opacity  = isInteractive ? '0.2' : '1.0';
    };

    window.addEventListener('mousemove',  handlePointerMove);
    window.addEventListener('mouseenter', handlePointerMove);
    window.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && !e.toElement) handlePointerLeave();
    });

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = window.innerWidth  * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.dpr = dpr;
  }

  getRandomParticleColor() {
    const r = 255;
    const g = Math.floor(Math.random() * 60);
    const b = Math.floor(Math.random() * 15);
    return `rgb(${r}, ${g}, ${b})`;
  }

  spawnParticles(x, y, count = 1, force = 1, directionAngle = null) {
    for (let i = 0; i < count; i++) {
      let angle = directionAngle !== null
        ? directionAngle + (Math.random() - 0.5) * 0.9
        : Math.random() * Math.PI * 2;

      const speed = (Math.random() * 2.5 + 0.4) * force;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.4,
        vy: Math.sin(angle) * speed - (Math.random() * 0.7 + 0.3),
        size:  Math.random() * 2.8 + 1.2,
        life:  1.0,
        decay: Math.random() * 0.025 + 0.015,
        color: this.getRandomParticleColor()
      });
    }
  }

  updatePhysics() {
    // Derive speed from mouse delta
    this.velocity.x = this.mouse.x - this.prev.x;
    this.velocity.y = this.mouse.y - this.prev.y;
    this.speed = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y
    );

    // Emit particles at cursor position
    if (this.speed > 2) {
      // Directional burst in movement direction
      const moveAngle = Math.atan2(this.velocity.y, this.velocity.x);
      this.spawnParticles(
        this.mouse.x,
        this.mouse.y,
        Math.min(4, Math.floor(this.speed * 0.18)),
        this.speed * 0.07,
        moveAngle
      );
    }

    // Idle ambient glow
    if (Math.random() < 0.35) {
      this.spawnParticles(this.mouse.x, this.mouse.y, 1, 0.5);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy *= 0.98;
      p.vx *= 0.97;
      p.life -= p.decay;
      p.size *= 0.97;
      if (p.life <= 0 || p.size < 0.25) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.ctx.globalCompositeOperation = 'screen';
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.beginPath();

      const radGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      radGrad.addColorStop(0, p.color);
      radGrad.addColorStop(0.35, p.color.replace('rgb', 'rgba').replace(')', `, ${p.life * 0.7})`));
      radGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

      this.ctx.fillStyle = radGrad;
      this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.globalCompositeOperation = 'source-over';
  }

  animate() {
    this.updatePhysics();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new DragonCursor();
});
