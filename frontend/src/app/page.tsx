'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, MapPin, Star, Tv, Calendar, ImageIcon } from 'lucide-react';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    class P {
      x = Math.random() * canvas!.width;
      y = Math.random() * canvas!.height;
      r = Math.random() * 1.3 + 0.4;
      vx = (Math.random() - 0.5) * 0.25;
      vy = (Math.random() - 0.5) * 0.25;
      o = Math.random() * 0.25 + 0.05;
      od = (Math.random() - 0.5) * 0.003;
      update() {
        this.x += this.vx; this.y += this.vy;
        this.o += this.od;
        if (this.o < 0.03 || this.o > 0.3) this.od *= -1;
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;
      }
      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(41,28,14,${this.o})`;
        ctx!.fill();
      }
    }

    resize();
    const ps = Array.from({ length: 90 }, () => new P());
    const loop = () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ps.forEach(p => { p.update(); p.draw(); });
      for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) {
        const dx = ps[a].x - ps[b].x, dy = ps[a].y - ps[b].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) { ctx.strokeStyle = `rgba(110,71,59,${(1 - d / 90) * 0.06})`; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(ps[a].x, ps[a].y); ctx.lineTo(ps[b].x, ps[b].y); ctx.stroke(); }
      }
      id = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: 'transparent' }} />;
}

function Reveal({ children, delay = 0, className = '', direction = 'up' }: {
  children: React.ReactNode; delay?: number; className?: string; direction?: 'up' | 'left' | 'right';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const initial = direction === 'left' ? { opacity: 0, x: -40 } : direction === 'right' ? { opacity: 0, x: 40 } : { opacity: 0, y: 50 };
  return (
    <motion.div ref={ref} initial={initial} animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      className={`h-full ${className}`}>
      {children}
    </motion.div>
  );
}

function AccentLine() {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,transparent,${C.accent}40)` }} />
      <div className="w-1 h-1 rounded-full" style={{ background: C.accent }} />
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,${C.accent}40,transparent)` }} />
    </div>
  );
}

function ImagePlaceholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ borderRadius: '16px', background: `linear-gradient(135deg, ${C.s2} 0%, ${C.s3} 100%)`, border: `1px solid ${C.s2}60` }}>
      <div className="flex flex-col items-center gap-3 opacity-40">
        <ImageIcon className="w-8 h-8" style={{ color: C.bg }} />
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: C.bg }}>{label}</span>
      </div>
    </div>
  );
}

function SocialButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
      style={{ border: `1px solid ${C.bg}30`, color: C.bg, background: hovered ? `${C.bg}20` : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className="block text-sm transition-colors duration-300"
      style={{ color: hovered ? C.bg : `${C.bg}80` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const textY = useTransform(scrollY, [0, 400], [0, -60]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const u = scrollY.on('change', v => setScrolled(v > 50));
    return u;
  }, [scrollY]);

  return (
    <div style={{ background: C.bg, color: C.accent, overflowX: 'hidden', minHeight: '100vh' }}>
      <ParticleCanvas />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden px-8 md:px-20 pt-24"
        style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.s1}50 100%)` }}>

        <motion.div style={{ opacity: heroOpacity, y: textY }} className="relative z-10 w-full flex flex-col items-center text-center">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }}
              className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-10" style={{ background: C.accent }} />
              <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: C.s3 }}>Vijay Nagar, Indore</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-bold leading-[0.92] mb-8"
              style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(3.5rem, 8vw, 7rem)', color: C.accent }}>
              <span className="block">Your Own</span>
              <span className="block italic" style={{ color: C.s3 }}>Private</span>
              <span className="block">Space.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
              className="mb-10 leading-relaxed mx-auto" style={{ color: C.s3, fontSize: '1rem', maxWidth: '480px', fontWeight: 400 }}>
              Premium cafe, private mini theater, curated celebrations — entirely yours for the night.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-4 justify-center">
              <Link href="/book" className="group flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300"
                style={{ background: C.accent, color: C.bg, boxShadow: `0 8px 32px ${C.accent}30` }}>
                <Tv className="w-4 h-4" />
                Book Mini Theater
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link href="/menu" className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-medium transition-all duration-300"
                style={{ border: `1px solid ${C.s2}`, color: C.s3, background: `${C.s1}40` }}>
                Explore Menu
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="flex items-center gap-16 mt-16 pt-8 justify-center" style={{ borderTop: `1px solid ${C.s2}50` }}>
              {[['2', 'Daily Slots'], ['8', 'Theater Guests'], ['5 km', 'Delivery']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: C.accent }}>{v}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: C.s3 }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── THEATER ──────────────────────────────────────────────────── */}
      <section id="theater" className="relative z-10 py-32 px-8 md:px-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <div className="relative h-[600px]">
              <img src="/theater.png" alt="Private Mini Theater"
                className="w-full h-full object-cover rounded-2xl"
                style={{ border: `1px solid ${C.s2}60` }} />
              <div className="absolute bottom-6 left-6 px-5 py-3 rounded-xl"
                style={{ background: `${C.bg}f0`, backdropFilter: 'blur(16px)', border: `1px solid ${C.s2}` }}>
                <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: C.accent }}>Max Capacity</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: C.accent }}>8 Guests</div>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.15}>
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-6" style={{ color: C.accent }}>Exclusive Experience</p>
              <h2 className="font-bold mb-4 leading-tight"
                style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,4vw,3.5rem)', color: C.accent }}>
                Private Mini<br />Theater
              </h2>
              <AccentLine />
              <p className="mt-6 mb-10 leading-relaxed" style={{ color: C.s3, fontWeight: 400 }}>
                A fully private screening room for up to 8 guests. No strangers, no interruptions — just your group, your film, and the night to yourselves.
              </p>
              <Link href="/book" className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300"
                style={{ background: C.accent, color: C.bg, boxShadow: `0 8px 32px ${C.accent}30` }}>
                <Calendar className="w-4 h-4" />
                Check Availability
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MENU ─────────────────────────────────────────────────────── */}
      <section id="menu" className="relative z-10 py-32 px-8 md:px-20" style={{ background: `${C.s1}25` }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>Crafted Fresh</p>
                <h2 className="font-bold leading-tight"
                  style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,4vw,3.5rem)', color: C.accent }}>
                  Food That Completes<br />the Night
                </h2>
              </div>
              <Link href="/menu" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 self-start md:self-auto"
                style={{ border: `1px solid ${C.s2}`, color: C.accent }}>
                Full Menu <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-12 gap-4" style={{ height: '600px' }}>
            <Reveal className="col-span-5 row-span-2 h-full" delay={0}>
             <img src="/Specialty Coffee.jpg" alt="Specialty Coffee" className="w-full h-full object-cover rounded-2xl" />
            </Reveal>
            <Reveal className="col-span-4 h-[290px]" delay={0.1}>
              <img src="/burger.jpg" alt="Loaded Burgers" className="w-full h-full object-cover rounded-2xl" />
            </Reveal>
            <Reveal className="col-span-3 h-[290px]" delay={0.15}>
              <img src="/pasta.jpg" alt="Pasta" className="w-full h-full object-cover rounded-2xl" />
            </Reveal>
            <Reveal className="col-span-4 h-[290px]" delay={0.2}>
              <img src="/maggie.jpg" alt="Maggi Specials" className="w-full h-full object-cover rounded-2xl" />
            </Reveal>
            <Reveal className="col-span-3 h-[290px]" delay={0.25}>
              <img src="/snacks.jpg" alt="Snacks" className="w-full h-full object-cover rounded-2xl" />
            </Reveal>
          </div>

         
        </div>
      </section>

      {/* ── EVENTS ───────────────────────────────────────────────────── */}
      <section id="events" className="relative z-10 py-32 px-8 md:px-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-6" style={{ color: C.accent }}>Celebrate in Style</p>
              <h2 className="font-bold mb-4 leading-tight"
                style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,4vw,3.5rem)', color: C.accent }}>
                Birthday &<br />Farewell Packages
              </h2>
              <AccentLine />
              <p className="mt-6 mb-10 leading-relaxed" style={{ color: C.s3, fontWeight: 400 }}>
                Up to 15 guests. Decorated space, curated food, and the entire private lounge — yours for the evening.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  { name: 'Essential', price: '₹1,499', desc: 'Intimate setup · Up to 15 guests' },
                  { name: 'Premium', price: '₹2,999', desc: 'Full experience + Theater access', highlight: true },
                  { name: 'Farewell', price: '₹1,999', desc: 'Memory board · Group food order' },
                ].map(p => (
                  <div key={p.name} className="flex items-center justify-between p-5 rounded-xl transition-all duration-300"
                    style={{ background: p.highlight ? `${C.accent}10` : `${C.s1}35`, border: p.highlight ? `1px solid ${C.accent}50` : `1px solid ${C.s2}50` }}>
                    <div>
                      <div className="font-semibold text-sm mb-0.5" style={{ color: C.accent }}>{p.name}
                        {p.highlight && <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full tracking-widest uppercase" style={{ background: `${C.accent}15`, color: C.accent }}>Popular</span>}
                      </div>
                      <div className="text-xs" style={{ color: C.s3 }}>{p.desc}</div>
                    </div>
                    <div className="text-lg font-bold" style={{ color: C.accent, fontFamily: "'Playfair Display',serif" }}>{p.price}</div>
                  </div>
                ))}
              </div>
              <Link href="/book-celebration" className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300"
              style={{ background: C.accent, color: C.bg, boxShadow: `0 8px 32px ${C.accent}30` }}>
              <Calendar className="w-4 h-4" />
              Book a Celebration
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.15}>
            <div className="relative h-[720px]">
              <img src="/celebration.png" alt="Birthday & Farewell Celebration"
                className="w-full h-full object-cover rounded-2xl"
                style={{ border: `1px solid ${C.s2}60` }} />
              <div className="absolute top-6 right-6 px-5 py-3 rounded-xl"
                style={{ background: `${C.bg}f0`, backdropFilter: 'blur(16px)', border: `1px solid ${C.s2}` }}>
                <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: C.accent }}>Capacity</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: C.accent }}>15 Guests</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT / CTA ──────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 py-32 px-8 md:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.s2}40` }}>
            <img src="/about-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" />
            <Reveal>
              <div className="relative z-10 py-16 px-10 md:px-16 text-center max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8" style={{ color: C.s3 }}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px] tracking-[0.3em] uppercase">Scheme No. 74, Vijay Nagar, Indore</span>
                </div>
                <h2 className="font-bold mb-4 leading-tight"
                  style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,5vw,4rem)', color: C.accent }}>
                  Not just a cafe.<br />
                  <span style={{ color: C.s3 }}>A feeling.</span>
                </h2>
                <div className="flex items-center gap-3 my-6 justify-center">
                  <div className="h-px w-16" style={{ background: `${C.accent}40` }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: C.accent }} />
                  <div className="h-px w-16" style={{ background: `${C.accent}40` }} />
                </div>
                <p className="mt-6 mb-4 leading-relaxed" style={{ color: C.s3, fontWeight: 400, fontSize: '1rem' }}>
                  Built for those who want more — more privacy, more quality, more memories.
                  Come once, and you&apos;ll understand why we call it your own private space.
                </p>
                <div className="flex items-center justify-center gap-1 mb-10 mt-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" style={{ color: C.s2 }} />)}
                  <span className="ml-2 text-xs" style={{ color: C.s2 }}>Premium Experience</span>
                </div>
                <Link href="/register"
                  className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-semibold text-sm tracking-wider uppercase transition-all duration-300"
                  style={{ background: C.accent, color: C.bg }}>
                  Create Your Account <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-16 px-8 md:px-20" style={{ background: C.accent }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Playfair Display',serif", color: C.bg }}>
              Midnight House
            </div>
            <p className="text-xs leading-relaxed mb-6" style={{ color: `${C.bg}80` }}>
              Your own private space — premium cafe, mini theater, and curated celebrations in Vijay Nagar, Indore.
            </p>
            <div className="flex items-center gap-3">
              <SocialButton href="https://www.instagram.com/themidnighthouse_" label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </SocialButton>
              <SocialButton href="https://facebook.com" label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialButton>
            </div>
          </div>

          {/* Explore */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-6 font-semibold" style={{ color: `${C.bg}50` }}>Explore</div>
            <div className="space-y-3">
              <FooterLink href="/menu">Menu</FooterLink>
              <FooterLink href="/book">Book Theater</FooterLink>
              <FooterLink href="/reviews">Reviews</FooterLink>
              <FooterLink href="/dashboard">Dashboard</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-6 font-semibold" style={{ color: `${C.bg}50` }}>Contact</div>
            <div className="space-y-4">
              <a href="mailto:hello@midnighthouse.in" className="flex items-start gap-3 text-sm" style={{ color: `${C.bg}80` }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                hello@midnighthouse.in
              </a>
              <a href="tel:+919876543210" className="flex items-start gap-3 text-sm" style={{ color: `${C.bg}80` }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +91 98765 43210
              </a>
              <div className="flex items-start gap-3 text-sm" style={{ color: `${C.bg}80` }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scheme No. 74, Vijay Nagar, Indore
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-6 font-semibold" style={{ color: `${C.bg}50` }}>Hours</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1" style={{ color: `${C.bg}80` }}>Mon — Sat</div>
                <div className="text-base font-semibold" style={{ color: C.bg }}>11:00 AM — 12:00 AM</div>
              </div>
              <div className="text-xs" style={{ color: `${C.bg}50` }}>Sunday by reservation only</div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${C.bg}15` }}>
          <div className="text-xs" style={{ color: `${C.bg}40` }}>© 2026 Midnight House. All rights reserved.</div>
          <div className="flex items-center gap-6 text-[11px] tracking-[0.15em] uppercase">
            {[['Menu', '/menu'], ['Book', '/book'], ['Login', '/login']].map(([l, h]) => (
              <Link key={l} href={h} style={{ color: `${C.bg}40` }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
