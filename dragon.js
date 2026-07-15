/**
 * dragon.js - Physics-driven, canvas-based dark shadow dragon cursor trail.
 * Renders armored chevron plates, 4 skeletal limbs with claws, and a barbed tail assembly.
 */

class DragonCursor {
  constructor() {
    // Detect if running on a mobile device (viewport width <= 768px)
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    // For mobile, we still create the canvas but use autonomous movement
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'dragon-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '99999'; // Float above webpage content
    this.canvas.style.transition = 'opacity 0.35s ease'; // Smooth fading
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Core parameters
    this.numSegments = 30; // Slightly longer for complex details
    this.segmentLength = 11;
    this.segments = [];
    this.particles = [];

    // Mobile autonomous target
    this.mobileTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    // Mobile movement timer (change direction every 4-6 seconds)
    this.mobileTimer = null;

    // Mouse tracking
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.velocity = { x: 0, y: 0 };
    this.speed = 0;

    // Animation constants
    this.wingFlap = 0;
    this.wingFlapSpeed = 0.07;
    this.time = 0;

    // Initialize segments at center
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push({
        x: this.mouse.x,
        y: this.mouse.y,
        angle: 0,
        width: this.getSegmentWidth(i),
        targetWidth: this.getSegmentWidth(i)
      });
    }

    this.initEvents();
    this.resizeCanvas();
    this.animate();
  }

  // Segment widths - chest core, tapering to tail spikes
  getSegmentWidth(index) {
    if (index === 0) return 11; // Head base
    if (index < 4) return 14;   // Chest cavity
    if (index < 12) return 11;  // Front torso
    if (index < 22) return 8;   // Lower spinal column
    return Math.max(1.8, 6.5 * (1 - (index - 22) / (this.numSegments - 22))); // Whip tail spine
  }

  initEvents() {
    // Desktop mouse tracking
    if (!this.isMobile) {
      window.addEventListener('mousemove', (e) => {
        this.target.x = e.clientX;
        this.target.y = e.clientY;
      });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          this.target.x = e.touches[0].clientX;
          this.target.y = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          this.target.x = e.touches[0].clientX;
          this.target.y = e.touches[0].clientY;
          this.mouse.x = this.target.x;
          this.mouse.y = this.target.y;
          for (let i = 0; i < this.numSegments; i++) {
            this.segments[i].x = this.target.x;
            this.segments[i].y = this.target.y;
          }
        }
      }, { passive: true });
    }

    // Mobile autonomous movement timer
    if (this.isMobile) {
      const changeDirection = () => {
        this.mobileTarget.x = Math.random() * window.innerWidth;
        this.mobileTarget.y = Math.random() * window.innerHeight;
        // schedule next change between 4-6 seconds
        const next = 4000 + Math.random() * 2000;
        this.mobileTimer = setTimeout(changeDirection, next);
      };
      changeDirection();
      // Keep canvas behind text on mobile
      this.canvas.style.zIndex = '5';
    }

    // Send the dragon behind text/buttons and lower its opacity when hovering over interactive elements (desktop only)
    if (!this.isMobile) {
      document.addEventListener('mouseover', (e) => {
        if (!e.target) return;
        const isInteractive = e.target.closest('a, button, input, textarea, [role="button"], .project-card, .btn');
        if (isInteractive) {
          this.canvas.style.zIndex = '5'; // Below content wrappers (z-index: 10)
          this.canvas.style.opacity = '0.2'; // Drop opacity
        } else {
          this.canvas.style.zIndex = '99999'; // Default top layer
          this.canvas.style.opacity = '1.0'; // Full opacity
        }
      });
    }

    // Hide dragon when mouse leaves the window (desktop only)
    if (!this.isMobile) {
      window.addEventListener('mouseleave', () => {
        this.canvas.style.opacity = '0';
      });
      window.addEventListener('mouseenter', () => {
        this.canvas.style.opacity = '1.0';
      });
    }

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.dpr = dpr;
  }

  // Emit red particle ash embers
  spawnParticles(x, y, count = 1, force = 1, directionAngle = null) {
    for (let i = 0; i < count; i++) {
      let angle = Math.random() * Math.PI * 2;

      // If specifying direction, spray in a narrow cone (like snout breath)
      if (directionAngle !== null) {
        angle = directionAngle + (Math.random() - 0.5) * 0.7;
      }

      const speed = (Math.random() * 2.5 + 0.4) * force;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.4,
        vy: Math.sin(angle) * speed - (Math.random() * 0.7 + 0.3), // Float drift
        size: Math.random() * 2.8 + 1.2,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.015,
        color: this.getRandomParticleColor()
      });
    }
  }

  getRandomParticleColor() {
    const r = 255;
    const g = Math.floor(Math.random() * 50);
    const b = Math.floor(Math.random() * 15);
    return `rgb(${r}, ${g}, ${b})`;
  }

  updatePhysics() {
    this.time += 0.028;

    // For mobile, use autonomous target
    if (this.isMobile) {
      this.target.x = this.mobileTarget.x;
      this.target.y = this.mobileTarget.y;
    }

    // Head physics
    this.velocity.x = this.target.x - this.mouse.x;
    this.velocity.y = this.target.y - this.mouse.y;
    this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);

    this.mouse.x += this.velocity.x * 0.22;
    this.mouse.y += this.velocity.y * 0.22;

    this.segments[0].x = this.mouse.x;
    this.segments[0].y = this.mouse.y;

    // Kinematic link segment tracking
    for (let i = 1; i < this.numSegments; i++) {
      const prev = this.segments[i - 1];
      const curr = this.segments[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const angle = Math.atan2(dy, dx);
      curr.angle = angle;

      curr.x = prev.x - Math.cos(angle) * this.segmentLength;
      curr.y = prev.y - Math.sin(angle) * this.segmentLength;

      // Armored segments expand slightly at speed
      const widthFactor = Math.min(1.3, 1 + this.speed * 0.012);
      curr.width += (curr.targetWidth * widthFactor - curr.width) * 0.1;
    }

    // Cone spray sparks from mouth (facing opposite to movement angle)
    if (this.speed > 2) {
      const headAngle = this.segments[0].angle;
      const mouthX = this.segments[0].x + Math.cos(headAngle) * 14;
      const mouthY = this.segments[0].y + Math.sin(headAngle) * 14;
      this.spawnParticles(mouthX, mouthY, Math.min(2, Math.floor(this.speed * 0.1)), this.speed * 0.06, headAngle);
    }

    // Idle glowing body embers
    if (Math.random() < 0.1) {
      // Spawn at mouth
      this.spawnParticles(this.segments[0].x, this.segments[0].y, 1, 0.4);
    }
    if (Math.random() < 0.08) {
      // Spawn near tail assembly
      const tailTip = this.segments[this.numSegments - 1];
      this.spawnParticles(tailTip.x, tailTip.y, 1, 0.3);
    }

    // Update ash particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.98;
      p.vx *= 0.97;
      p.life -= p.decay;
      p.size *= 0.97;
      if (p.life <= 0 || p.size < 0.25) {
        this.particles.splice(i, 1);
      }
    }

    const wingSpeedMod = Math.min(2.8, 1 + this.speed * 0.11);
    this.wingFlap += this.wingFlapSpeed * wingSpeedMod;
  }

  draw() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // 1. Embers Glow backdrop (canvas screen overlay)
    this.ctx.globalCompositeOperation = 'screen';
    for (let p of this.particles) {
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

    // 2. Front & Back Skeletal Limbs (Behind the body)
    // Front limbs attached at segment 5, back limbs at segment 14
    this.drawLimb(this.segments[5], -1, true); // Front Left
    this.drawLimb(this.segments[5], 1, true);  // Front Right
    this.drawLimb(this.segments[14], -1, false); // Back Left
    this.drawLimb(this.segments[14], 1, false);  // Back Right

    // 3. Huge dragon wings attached at segment 3
    const wingNode = this.segments[3];
    if (wingNode) {
      this.drawWings(wingNode);
    }

    // 4. Overlapping Chevron Scales (Armored Plates)
    // Draw from tail (bottom layer) to head (top layer) to ensure correct layering
    for (let i = this.numSegments - 2; i >= 1; i--) {
      this.drawScalePlate(this.segments[i], i);
    }

    // 5. Spinal dorsal ridges on every third segment
    for (let i = 2; i < this.numSegments - 4; i += 3) {
      this.drawSpineRidge(this.segments[i], this.segments[i + 1]);
    }

    // 6. Barbed tail spear assembly attached at the tail tip
    const tailTip = this.segments[this.numSegments - 1];
    this.drawTailSpear(tailTip);

    // 7. Large detailed dragon head with horns
    this.drawHead(this.segments[0]);
  }

  // Draw overlapping diamond chevron plate scales
  drawScalePlate(seg, index) {
    const angle = seg.angle;
    const w = seg.width;
    const l = this.segmentLength * 1.4; // Shell overlap length

    this.ctx.save();
    this.ctx.translate(seg.x, seg.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();

    // Diamond chevron coordinates pointing backward
    this.ctx.moveTo(w * 0.8, 0); // Front tip
    this.ctx.lineTo(-w * 0.2, -w * 0.95); // Left corner
    this.ctx.lineTo(-l, 0); // Back point (underlapping prev segment)
    this.ctx.lineTo(-w * 0.2, w * 0.95);  // Right corner
    this.ctx.closePath();

    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = 'rgba(255, 10, 10, 0.2)';

    // Metallic gradient for scales: deep charcoal core
    const scaleGrad = this.ctx.createRadialGradient(-w * 0.2, 0, 0, 0, 0, w * 1.2);
    scaleGrad.addColorStop(0, '#101010');
    scaleGrad.addColorStop(0.7, '#070707');
    scaleGrad.addColorStop(1, '#000000');

    this.ctx.fillStyle = scaleGrad;
    this.ctx.fill();

    // Red neon outline glow on edges
    this.ctx.strokeStyle = 'rgba(255, 30, 30, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawLimb(node, side, isFront) {
    const angle = node.angle;
    const perpAngle = angle + (Math.PI / 2) * side;

    // Limb proportions
    const length1 = isFront ? 14 : 11;
    const length2 = isFront ? 12 : 9;

    // Swinging motion based on speed and time
    const speedFactor = Math.min(2.5, this.speed * 0.08);
    const swingPhase = this.time * 6.5 + (isFront ? 0 : Math.PI);
    const jointOscillation = Math.sin(swingPhase) * 0.25 * speedFactor;

    // Leg angle vectors
    const thighAngle = perpAngle - (0.4 * side) + jointOscillation;
    const shinAngle = thighAngle + (isFront ? 0.95 : 0.75) * side;

    // Joint mapping coordinates
    const joint1X = node.x + Math.cos(thighAngle) * length1;
    const joint1Y = node.y + Math.sin(thighAngle) * length1;

    const footX = joint1X + Math.cos(shinAngle) * length2;
    const footY = joint1Y + Math.sin(shinAngle) * length2;

    this.ctx.save();
    this.ctx.shadowBlur = 6;
    this.ctx.shadowColor = 'rgba(255, 20, 20, 0.25)';

    // Draw femur/thigh limb bone
    this.ctx.beginPath();
    this.ctx.moveTo(node.x, node.y);
    this.ctx.lineTo(joint1X, joint1Y);
    this.ctx.lineTo(footX, footY);

    this.ctx.strokeStyle = '#050505';
    this.ctx.lineWidth = 3.5;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    this.ctx.strokeStyle = '#ff1c1c'; // Red highlights
    this.ctx.lineWidth = 1.0;
    this.ctx.stroke();

    // Draw three sharp claws/talons
    const clawLength = 5.5;
    const baseClawAngle = shinAngle + Math.PI;

    for (let c = -1; c <= 1; c++) {
      const ca = baseClawAngle + (c * 0.4);
      const tipX = footX - Math.cos(ca) * clawLength;
      const tipY = footY - Math.sin(ca) * clawLength;

      this.ctx.beginPath();
      this.ctx.moveTo(footX, footY);
      this.ctx.lineTo(tipX, tipY);
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();

      this.ctx.strokeStyle = '#ff2b2b'; // Glowing tips
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawWings(node) {
    const angle = node.angle;
    const size = 95; // Flapping wings span
    const speedfactor = Math.min(0.6, this.speed * 0.008);
    const wave = Math.sin(this.wingFlap) * 0.28;

    const leftWingAngle = angle - Math.PI / 2 + wave - speedfactor;
    const rightWingAngle = angle + Math.PI / 2 - wave + speedfactor;

    this.ctx.save();
    this.drawSingleWing(node.x, node.y, leftWingAngle, -1);
    this.drawSingleWing(node.x, node.y, rightWingAngle, 1);
    this.ctx.restore();
  }

  drawSingleWing(x, y, angle, side) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // Wing bone structures
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = 'rgba(255, 10, 10, 0.4)';
    this.ctx.fillStyle = '#060606';
    this.ctx.strokeStyle = '#121212';
    this.ctx.lineWidth = 3;

    // Wing boundary scallops
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);

    const jointX = 35;
    const jointY = -18 * side;

    const tipX = 85;
    const tipY = -8 * side;

    const rib1X = 72;
    const rib1Y = 24 * side;

    const rib2X = 42;
    const rib2Y = 32 * side;

    this.ctx.bezierCurveTo(jointX * 0.65, jointY * 0.8, jointX, jointY, jointX, jointY);
    this.ctx.bezierCurveTo(jointX + 20, jointY - 3, tipX - 5, tipY - 2, tipX, tipY);

    this.ctx.quadraticCurveTo(rib1X + 8, rib1Y - 14 * side, rib1X, rib1Y);
    this.ctx.quadraticCurveTo(rib2X + 8, rib2Y - 14 * side, rib2X, rib2Y);
    this.ctx.quadraticCurveTo(20, 22 * side, 0, 0);

    this.ctx.closePath();

    const membraneGradient = this.ctx.createLinearGradient(0, 0, tipX, tipY);
    membraneGradient.addColorStop(0, '#000000');
    membraneGradient.addColorStop(0.55, '#0e0101');
    membraneGradient.addColorStop(1, '#3b0000'); // Blood red tips

    this.ctx.fillStyle = membraneGradient;
    this.ctx.fill();
    this.ctx.stroke();

    // Wing skeletal arm bones
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(jointX, jointY);
    this.ctx.lineTo(tipX, tipY);

    this.ctx.moveTo(jointX, jointY);
    this.ctx.lineTo(rib1X, rib1Y);

    this.ctx.moveTo(jointX, jointY);
    this.ctx.lineTo(rib2X, rib2Y);

    this.ctx.strokeStyle = '#050505';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Neon bone highlight
    this.ctx.strokeStyle = 'rgba(255, 20, 20, 0.4)';
    this.ctx.lineWidth = 1.0;
    this.ctx.stroke();

    // Claw spur
    this.ctx.beginPath();
    this.ctx.arc(jointX, jointY, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff1c1c';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawSpineRidge(curr, prev) {
    const angle = curr.angle;
    const size = curr.width * 1.25;
    const perpAngle = angle + Math.PI / 2;

    this.ctx.save();
    this.ctx.beginPath();

    const spikeX = curr.x + Math.cos(perpAngle) * size;
    const spikeY = curr.y + Math.sin(perpAngle) * size;

    this.ctx.moveTo(curr.x - Math.cos(angle) * (curr.width * 0.6), curr.y - Math.sin(angle) * (curr.width * 0.6));
    this.ctx.lineTo(spikeX, spikeY);
    this.ctx.lineTo(prev.x, prev.y);

    this.ctx.closePath();
    this.ctx.fillStyle = '#ff1c1c'; // Glowing spine structures
    this.ctx.fill();
    this.ctx.restore();
  }

  // Draw barbed spear fin at the tail tip instead of flat tapering
  drawTailSpear(tailNode) {
    const angle = tailNode.angle;
    const size = 26; // Arrow size

    this.ctx.save();
    this.ctx.translate(tailNode.x, tailNode.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    // Spear Head points opposite to tail tracking
    this.ctx.moveTo(-size, 0); // Tip of tail arrow
    this.ctx.lineTo(0, -9);     // Top barb
    this.ctx.lineTo(-size * 0.4, -3); // Inner barb groove
    this.ctx.lineTo(0, 0);      // Base spine
    this.ctx.lineTo(-size * 0.4, 3);  // Inner barb groove
    this.ctx.lineTo(0, 9);      // Bottom barb
    this.ctx.closePath();

    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ff2b2b';

    const spearGrad = this.ctx.createLinearGradient(-size, 0, 0, 0);
    spearGrad.addColorStop(0, '#ff1010');
    spearGrad.addColorStop(1, '#050505');

    this.ctx.fillStyle = spearGrad;
    this.ctx.fill();

    this.ctx.strokeStyle = '#ff1c1c';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawHead(head) {
    const angle = head.angle;
    this.ctx.save();
    this.ctx.translate(head.x, head.y);
    this.ctx.rotate(angle);

    // Glowing skull crown
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ff2a2a';
    this.ctx.fillStyle = '#060606';

    // Detailed skeletal dragon head
    this.ctx.beginPath();
    this.ctx.moveTo(17, 0);     // Long Snout tip
    this.ctx.lineTo(8, -5.5);    // Left nostril/jaw line
    this.ctx.lineTo(4, -8);      // Left cheek arch
    this.ctx.lineTo(-5, -9.5);   // Left Horn crown base
    this.ctx.lineTo(-19, -15);   // Left Crown Horn tip (long curve back)
    this.ctx.lineTo(-12, -4);    // Upper inner neck connector

    // Draw two extra center crown spires
    this.ctx.lineTo(-16, -1);    // Center left crown horn
    this.ctx.lineTo(-11, 0);     // Spine valley
    this.ctx.lineTo(-16, 1);     // Center right crown horn

    this.ctx.lineTo(-12, 4);     // Upper inner neck connector right
    this.ctx.lineTo(-19, 15);    // Right Crown Horn tip (long curve back)
    this.ctx.lineTo(-5, 9.5);    // Right Horn crown base
    this.ctx.lineTo(4, 8);       // Right cheek arch
    this.ctx.lineTo(8, 5.5);     // Right nostril/jaw line
    this.ctx.closePath();
    this.ctx.fill();

    // Deep black-red skull highlights
    const skullGrad = this.ctx.createLinearGradient(-15, 0, 15, 0);
    skullGrad.addColorStop(0, '#ff1010');
    skullGrad.addColorStop(1, '#0a0a0d');

    this.ctx.strokeStyle = skullGrad;
    this.ctx.lineWidth = 1.6;
    this.ctx.stroke();

    // Red intense glowing slit eyes
    this.ctx.shadowBlur = 11;
    this.ctx.shadowColor = '#ff2b2b';
    this.ctx.fillStyle = '#ff2b2b';

    this.ctx.beginPath();
    this.ctx.arc(6, -4.5, 2.0, 0, Math.PI * 2); // left iris
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(6, 4.5, 2.0, 0, Math.PI * 2);  // right iris
    this.ctx.fill();

    // Draw secondary barbels/whiskers tracing backwards from jaw
    this.ctx.beginPath();
    this.ctx.moveTo(3, -7.5);
    this.ctx.bezierCurveTo(-5, -12, -15, -10, -22, -6);
    this.ctx.moveTo(3, 7.5);
    this.ctx.bezierCurveTo(-5, 12, -15, 10, -22, 6);
    this.ctx.strokeStyle = 'rgba(255, 28, 28, 0.4)';
    this.ctx.lineWidth = 1.0;
    this.ctx.stroke();

    this.ctx.restore();
  }

  animate() {
    this.updatePhysics();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  new DragonCursor();
});
