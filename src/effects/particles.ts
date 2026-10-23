import { VisualEffect } from '../types/theme';

export class EffectManager {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private particles: any[] = [];
  private currentEffect: VisualEffect = 'none';
  private isVisible = true;
  private prefersReducedMotion = false;
  private boundResize: () => void;
  private boundVisibility: () => void;

  constructor() {
    this.boundResize = this.handleResize.bind(this);
    this.boundVisibility = this.handleVisibility.bind(this);

    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        if (this.prefersReducedMotion) this.stop();
        else this.setEffect(this.currentEffect);
      });
    }
  }

  public init(container: HTMLElement = document.body) {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'themeflow-effect-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0'; // Behind foreground content, above background image
    this.canvas.style.opacity = '0.9';

    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.handleResize();

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibility);
  }

  private handleResize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private handleVisibility() {
    this.isVisible = !document.hidden;
    if (this.isVisible && this.currentEffect !== 'none') {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  public setEffect(effect: VisualEffect) {
    this.currentEffect = effect;
    this.particles = [];
    this.stopLoop();

    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (effect === 'none' || this.prefersReducedMotion) {
      if (this.canvas) this.canvas.style.display = 'none';
      return;
    }

    if (!this.canvas) {
      this.init();
    }

    if (this.canvas) {
      this.canvas.style.display = 'block';
    }

    this.initParticles(effect);
    this.startLoop();
  }

  private initParticles(effect: VisualEffect) {
    const width = this.canvas?.width || window.innerWidth;
    const height = this.canvas?.height || window.innerHeight;

    if (effect === 'sakura') {
      // 36 gentle sakura petals
      const count = 36;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 8 + 6,
          speedY: Math.random() * 0.8 + 0.6,
          speedX: Math.random() * 0.6 - 0.2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.4 + 0.4,
        });
      }
    } else if (effect === 'rain') {
      // 60 subtle rain streaks
      const count = 60;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 20 + 15,
          speedY: Math.random() * 8 + 12,
          speedX: -1.5,
          opacity: Math.random() * 0.25 + 0.15,
        });
      }
    } else if (effect === 'stars') {
      // 50 softly twinkling stars
      const count = 50;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.008,
          increasing: Math.random() > 0.5,
        });
      }
    }
  }

  private startLoop() {
    if (this.animId !== null) return;
    const loop = () => {
      this.updateAndRender();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  private stopLoop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private updateAndRender() {
    if (!this.ctx || !this.canvas || !this.isVisible) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    if (this.currentEffect === 'sakura') {
      for (const p of this.particles) {
        p.y += p.speedY;
        p.sway += p.swaySpeed;
        p.x += p.speedX + Math.sin(p.sway) * 0.6;
        p.rotation += p.rotSpeed;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
        else if (p.x < -20) p.x = w + 20;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.beginPath();
        // Sakura petal curve
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, p.size / 2, 0, p.size * 1.3);
        this.ctx.bezierCurveTo(-p.size, p.size / 2, -p.size / 2, -p.size / 2, 0, 0);
        this.ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity})`;
        this.ctx.fill();
        this.ctx.restore();
      }
    } else if (this.currentEffect === 'rain') {
      this.ctx.lineWidth = 1.2;
      for (const p of this.particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > h + 30) {
          p.y = -30;
          p.x = Math.random() * (w + 100);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.length);
        this.ctx.strokeStyle = `rgba(186, 215, 255, ${p.opacity})`;
        this.ctx.stroke();
      }
    } else if (this.currentEffect === 'stars') {
      for (const p of this.particles) {
        if (p.increasing) {
          p.alpha += p.speed;
          if (p.alpha >= 0.85) p.increasing = false;
        } else {
          p.alpha -= p.speed;
          if (p.alpha <= 0.1) p.increasing = true;
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        this.ctx.fill();
      }
    }
  }

  public stop() {
    this.stopLoop();
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.display = 'none';
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
