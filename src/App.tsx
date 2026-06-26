/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SERVICES } from './data';
import BookingSystem from './components/BookingSystem';
import GalleryAndWall from './components/GalleryAndWall';
import BlogSection from './components/BlogSection';
import { ServiceItem } from './types';
import AdminPortal from './components/AdminPortal';
import FAQSection from './components/FAQSection';
import { 
  Scissors, 
  Calendar, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight, 
  Check, 
  Award, 
  Star, 
  Coffee, 
  Music, 
  Wind, 
  Instagram, 
  ChevronRight,
  Volume2,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import our generated premium hero banner
// @ts-ignore
import heroBg from './assets/images/barbariq_hero_bg_1780295480688.png';
// @ts-ignore
import logoImg from './assets/images/barbariq-logo.png';

const PHONE = import.meta.env.VITE_PHONE || '+254706794740';
const PHONE_DISPLAY = PHONE.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
const PHONE_STRIPPED = PHONE.replace(/[^0-9]/g, '');
const EMAIL = import.meta.env.VITE_EMAIL || 'barbariq254@gmail.com';
const ADDRESS = import.meta.env.VITE_ADDRESS || 'Along Thika Road, Juja';
const LAT = parseFloat(import.meta.env.VITE_LAT || '-1.0915');
const LNG = parseFloat(import.meta.env.VITE_LNG || '37.016');

export default function App() {
  const [activeTab, setActiveTab] = useState<'lounge' | 'book' | 'faq' | 'wall' | 'blog' | 'admin'>('lounge');
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);

  // Load services from local storage or fallback to static SERVICES
  useEffect(() => {
    const stored = localStorage.getItem('barbariq_services');
    if (stored) {
      try {
        setServices(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Listen for simulated subdomain/admin route path on mount
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  // Dynamic title & meta description per tab
  useEffect(() => {
    const meta: Record<string, { title: string; desc: string }> = {
      lounge: {
        title: 'BARBARIQ | Premium Barbershop in Juja, Nairobi',
        desc: 'Barbariq is Juja\'s premium grooming lounge — precision fades, beard sculpting, and hot towel treatments along Thika Road. Book online.'
      },
      book: {
        title: 'Book a Barber in Juja | Premium Fades Near Thika Road | BARBARIQ',
        desc: 'Reserve your chair at Barbariq Juja. Online booking for fades, beard sculpts, dreadlocks & the Alchemist Combo. No queues, just craft.'
      },
      faq: {
        title: 'FAQs | BARBARIQ Juja — Barbershop Questions Answered',
        desc: 'Everything you need to know about Barbariq Juja: booking, pricing, services, location along Thika Road, and payment options.'
      },
      wall: {
        title: 'Freshness Wall | BARBARIQ Juja — Community Cuts Gallery',
        desc: 'See the latest cuts from Barbariq Juja. Real clients, real fades. Upload your own style and join the Freshness Wall.'
      },
      blog: {
        title: 'Barbershop Blog | Grooming Tips & Style Guides | BARBARIQ Juja',
        desc: 'Barber tips, fade guides, beard sculpting tutorials, and Nairobi grooming culture from the team at Barbariq Juja.'
      },
      admin: {
        title: 'Admin Desk | BARBARIQ Juja — Station Manager',
        desc: 'Barbariq Juja administrative console for managing bookings, pricing, and content.'
      }
    };
    const tab = meta[activeTab] || meta.lounge;
    document.title = tab.title;
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.setAttribute('name', 'description');
      document.head.appendChild(descEl);
    }
    descEl.setAttribute('content', tab.desc);
    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute('content', tab.title);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
    ogDesc.setAttribute('content', tab.desc);
  }, [activeTab]);

  // Inject SEO JSON-LD schemas on mount
  useEffect(() => {
    const schemas = [
      // LocalBusiness (Barbershop) — always present
      {
        '@context': 'https://schema.org',
        '@type': 'Barbershop',
        name: 'BARBARIQ Nairobi',
        image: 'https://barbariq.co.ke/og-image.jpg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Thika Road, Juja',
          addressLocality: 'Juja',
          addressRegion: 'Kiambu County',
          postalCode: '01030',
          addressCountry: 'KE'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: LAT,
          longitude: LNG
        },
        url: 'https://barbariq.co.ke',
        telephone: PHONE,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '08:00',
            closes: '20:00'
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Sunday',
            opens: '10:00',
            closes: '17:00'
          }
        ],
        priceRange: '$$'
      },
      // FAQPage — always present on SPA
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Do I need to book an appointment?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We highly recommend booking online to secure your slot, but walk-ins are always welcome at our Juja lounge.'
            }
          },
          {
            '@type': 'Question',
            name: 'What payment methods do you accept?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We accept cash, M-Pesa, and all major credit/debit cards.'
            }
          },
          {
            '@type': 'Question',
            name: 'How long does a haircut take?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A standard fade takes about 30–45 minutes. Our Alchemist Signature Combo (fade + beard sculpt) runs approximately 75 minutes.'
            }
          },
          {
            '@type': 'Question',
            name: 'What services do you offer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We offer precision fades, beard sculpting, dreadlock retwists, hot towel treatments, and our signature Alchemist Combo — all at our Juja lounge.'
            }
          }
        ]
      }
    ];

    schemas.forEach((schema, i) => {
      const id = `schema-ld-${i}`;
      const existing = document.getElementById(id);
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      schemas.forEach((_, i) => {
        const s = document.getElementById(`schema-ld-${i}`);
        if (s) s.remove();
      });
    };
  }, []);

  const handleUpdateServices = (newServices: ServiceItem[]) => {
    setServices(newServices);
    localStorage.setItem('barbariq_services', JSON.stringify(newServices));
  };

  // High-fidelity analog Web Audio synth simulating handcrafted stylist tools
  const triggerAudio = (style: 'snip' | 'hum' | 'click' | 'chime') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (style === 'snip') {
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        // White noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4500, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
      } else if (style === 'hum') {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, ctx.currentTime);
        
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(170, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        sub.start();
        osc.stop(ctx.currentTime + 0.2);
        sub.stop(ctx.currentTime + 0.2);
      } else if (style === 'chime') {
        [523, 659].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.3);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      }
    } catch (_) {}
  };

  const handleTabChange = (tab: 'lounge' | 'book' | 'faq' | 'wall' | 'blog') => {
    triggerAudio('snip');
    setActiveTab(tab);
  };

  // Directly trigger booking for a specific service
  const handleQuickBook = (serviceId: string) => {
    triggerAudio('hum');
    setPreSelectedServiceId(serviceId);
    setActiveTab('book');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans relative">
      {/* Organic analog film grain noise covering */}
      <div className="noise-overlay" />
      
      {/* LUXURY DESKTOP & MOBILE HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/80 px-4 md:px-8 py-4">

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => { setActiveTab('lounge'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-1.5 hover:opacity-80 transition-all"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <img src={logoImg} alt="BARBARIQ" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="text-left">
              <span className="font-display font-black text-lg md:text-xl tracking-widest text-white">BARBARIQ</span>
              <span className="block text-[8px] font-mono tracking-widest text-amber-500 uppercase leading-none">Nairobi Elite Grooming</span>
            </div>
          </button>

          {/* NAVBAR LINK CONSTRAINTS */}
          <nav className="hidden md:flex gap-1 bg-zinc-900 p-1 rounded-full border border-zinc-800 font-heading">
            <button
              onClick={() => handleTabChange('lounge')}
              onMouseEnter={() => triggerAudio('click')}
              className={`px-4 py-2 rounded-full text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'lounge' 
                  ? 'bg-amber-500 text-black font-bold shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              The Lounge
            </button>
            <button
              onClick={() => handleTabChange('book')}
              onMouseEnter={() => triggerAudio('click')}
              className={`px-4 py-2 rounded-full text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'book' 
                  ? 'bg-amber-500 text-black font-bold shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Book Session
            </button>
            <button
              onClick={() => handleTabChange('wall')}
              onMouseEnter={() => triggerAudio('click')}
              className={`px-4 py-2 rounded-full text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'wall' 
                  ? 'bg-amber-500 text-black font-bold shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Freshness Wall
            </button>
            <button
              onClick={() => handleTabChange('blog')}
              onMouseEnter={() => triggerAudio('click')}
              className={`px-4 py-2 rounded-full text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'blog' 
                  ? 'bg-amber-500 text-black font-bold shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Blog
            </button>
            <button
              onClick={() => handleTabChange('faq')}
              onMouseEnter={() => triggerAudio('click')}
              className={`px-4 py-2 rounded-full text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'faq' 
                  ? 'bg-amber-500 text-black font-bold shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              FAQs
            </button>
          </nav>

          {/* Quick Contact & Audio Toggle Accent */}
          <div className="flex items-center gap-4">
            {/* Tactile Stylist Soundbox Button */}
            <button
              onClick={() => {
                const draft = !soundEnabled;
                setSoundEnabled(draft);
                if (draft) {
                  // Direct clean initial pulse to active context
                  setTimeout(() => {
                    try {
                      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                      const ctx = new AudioCtx();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(800, ctx.currentTime);
                      gain.gain.setValueAtTime(0.015, ctx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.06);
                    } catch (_) {}
                  }, 50);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 ${
                soundEnabled 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                  : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-400'
              }`}
              title="Enable sensory tools sounds (scissors, clippers)"
            >
              <Volume2 className={`w-3.5 h-3.5 ${soundEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>{soundEnabled ? 'Sensory On' : 'Sensory Off'}</span>
            </button>

            <div className="hidden lg:block text-right">
              <span className="block text-[9px] font-mono text-zinc-500 uppercase">Call or WhatsApp</span>
              <a href={`tel:${PHONE}`} className="text-xs font-mono font-bold text-amber-400 hover:underline">
                  {PHONE_DISPLAY}
              </a>
            </div>

            <button
              onClick={() => handleTabChange('book')}
              onMouseEnter={() => triggerAudio('click')}
              className="px-4 py-2 rounded-full bg-amber-500 text-black font-display font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all active:scale-95 shadow-md shadow-amber-500/10"
            >
              Reserve Chair
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE FLOATING BOTTOM BAR */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-2 rounded-full flex justify-between shadow-2xl">
        <button
          onClick={() => handleTabChange('lounge')}
          className={`flex-1 py-2 text-center rounded-full text-[10px] font-display font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'lounge' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
          }`}
        >
          Lounge
        </button>
        <button
          onClick={() => handleTabChange('book')}
          className={`flex-1 py-2 text-center rounded-full text-[10px] font-display font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'book' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
          }`}
        >
          Book
        </button>
        <button
          onClick={() => handleTabChange('faq')}
          className={`flex-1 py-2 text-center rounded-full text-[10px] font-display font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'faq' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
          }`}
        >
          FAQ
        </button>
        <button
          onClick={() => handleTabChange('blog')}
          className={`flex-1 py-2 text-center rounded-full text-[10px] font-display font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'blog' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
          }`}
        >
          Blog
        </button>
        <button
          onClick={() => handleTabChange('wall')}
          className={`flex-1 py-2 text-center rounded-full text-[10px] font-display font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'wall' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
          }`}
        >
          Wall
        </button>
      </div>

      {/* HERO SECTION WITH IMAGE GENERATED BACKGROUND */}
      <section className="relative min-h-[460px] md:min-h-[520px] flex items-center justify-center overflow-hidden border-b border-zinc-900 bg-zinc-950">
        {/* Background Image with elegant overlay gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Barbariq Industrial Barber Lounge" 
            className="w-full h-full object-cover scale-105 select-none"
            referrerPolicy="no-referrer"
          />
          {/* Moody Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-12 md:py-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
              WESTLANDS & KILIMANI PRESERVE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-designer font-extrabold tracking-tight text-white leading-[1.1] uppercase"
          >
            We don't just shave.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 font-display font-black tracking-widest block py-2 text-3xl sm:text-4xl md:text-5xl">
              WE DEFINE THE CROWN.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Nairobi's elite sanctuary blending raw rustic loft aesthetics with geometric lineup precision. Connect with master craftsmen, map your ideal texture, and claim your physical identity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <button
              onClick={() => handleTabChange('book')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-8 py-3.5 rounded-full font-display font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              Configure Appointment <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* CORE DYNAMIC CONTENT REGION */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-10 md:py-16">
        <AnimatePresence mode="wait">
          
          {/* THE LOUNGE (LANDING PAGE VIEW) */}
          {activeTab === 'lounge' && (
            <motion.div
              key="lounge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              {/* BRAND AMENITIES & VIBE STORY */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">
                    THE BARBARIQ STANDARD
                  </span>

                  <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
                    Premium Industrial Grooming Inspired by Creative Culture.
                  </h2>

                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                    Inspired by the timeless raw industrial aesthetics of global creative zones, Barbariq introduces a rugged yet bespoke sanctuary in the heart of Nairobi. Think solid concrete blocks, warm overhead Edison coils, vintage hand-stitched leather thrones, and custom record plates playing chilled afro-beats.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-amber-500 flex items-center justify-center shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-xs md:text-sm">Single Origin Espresso</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">Free premium coffee or craft beverage with any service package.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-amber-500 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-xs md:text-sm">Premium Audio Experience</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">Live curated vinyl, lo-fi beats, and warm, conversational lounges.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-amber-500 flex items-center justify-center shrink-0">
                        <Wind className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-xs md:text-sm">Aroma Hot Towels</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">Infused with raw eucalyptus and mint to deeply calm and detox skin.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-amber-500 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-xs md:text-sm">Gold Edge Products</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">We use 100% natural wax, sandalwood, and custom chemical-free oils.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Card - Contact */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 glow-gold relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">BOOK YOUR SESSION</span>
                    <h3 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight">
                      Ready for a fresh cut? Reserve your chair today.
                    </h3>
                    <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                      Walk into our Juja lounge along Thika Road and experience premium industrial grooming. Complimentary espresso, curated sounds, and master barbers ready to define your crown.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-4">
                    <button
                      onClick={() => handleTabChange('book')}
                      className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Book Now <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    <span className="text-[11px] font-mono text-zinc-500">WhatsApp {PHONE_DISPLAY}</span>
                  </div>
                </div>
              </div>

              {/* SERVICES CATALOG & INTERACTIVE MENU */}
              <div className="space-y-6 md:space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">OUR TREATMENTS</span>
                  <h2 className="text-2xl md:text-3xl font-display font-medium text-white">Bespoke Services Menu</h2>
                  <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto">
                    Priced for premium value. Select any service to pre-select it directly in our calendar reservation wizard.
                  </p>
                </div>

                {/* Services list styled beautifully with staggered spring entrances and smooth gold border lifts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((s, idx) => (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ 
                        y: -4, 
                        borderColor: "rgba(212, 175, 55, 0.35)", 
                        boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.7)" 
                      }}
                      className="bg-zinc-900 border border-zinc-805 rounded-xl p-5 transition-colors flex flex-col justify-between group cursor-pointer"
                      onClick={() => handleQuickBook(s.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-display font-bold text-white text-sm md:text-base group-hover:text-amber-400 transition-colors">{s.name}</h3>
                          <span className="text-amber-400 font-mono font-bold text-sm md:text-base shrink-0">KES {s.price.toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">{s.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 mt-2 border-t border-zinc-850 text-xs text-zinc-500">
                        <span className="font-mono">{s.durationMinutes} Mins Session</span>
                        <span
                          className="text-white group-hover:text-amber-400 font-display font-semibold uppercase flex items-center gap-1 transition-all text-[11px]"
                        >
                          Book Service <ChevronRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* LOCATION & AREAS WE SERVE — SEO TARGETING */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">FIND US</span>
                  <h2 className="text-2xl md:text-3xl font-display font-medium text-white">
                    Your Go-To Barbershop Near Juja & Thika Road
                  </h2>
                  <p className="text-zinc-400 text-xs md:text-sm max-w-2xl mx-auto">
                    Conveniently located along Thika Road, we serve Juja town, JKUAT, and the entire Nairobi north-east corridor.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display font-bold text-white text-sm">Barbershop Near Juja Town</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Right on Thika Road, minutes from Juja town centre and JKUAT. Whether you're a student or a local resident, our lounge is your closest premium barbershop for precision fades and beard sculpts.
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display font-bold text-white text-sm">Barbershop Along Thika Road</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Easy access from Nairobi via Thika Superhighway. Just off the Juja exit, we're the go-to barbershop along Thika Road for commuters, students, and residents looking for premium grooming without the city traffic.
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display font-bold text-white text-sm">Barber Near JKUAT & KU</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Serving JKUAT, Kenyatta University, and surrounding campuses. Student-friendly pricing, quick sessions between lectures, and the cleanest fades near campus — walk in or book online.
                    </p>
                  </div>
                </div>
              </div>

              {/* LOUNGE DIRECTIONS, METRICS, & GENERAL CREED */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-900 border border-zinc-805 p-6 md:p-8 rounded-2xl">
                
                {/* HOURS */}
                <div className="space-y-3 lg:border-r lg:border-zinc-800 lg:pr-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Operational Hours</h3>
                  </div>
                  <div className="space-y-1.5 text-xs md:text-sm text-zinc-300 font-mono">
                    <p className="flex justify-between"><span className="text-zinc-500">Mon - Fri:</span> <span>08:00 AM - 08:00 PM</span></p>
                    <p className="flex justify-between"><span className="text-zinc-500">Saturday:</span> <span>08:00 AM - 08:30 PM</span></p>
                    <p className="flex justify-between"><span className="text-zinc-500">Sunday:</span> <span>09:00 AM - 07:00 PM</span></p>
                  </div>
                </div>

                {/* ADDRESS & BRANCHES */}
                <div className="space-y-3 lg:border-r lg:border-zinc-800 lg:px-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Our Lounges</h3>
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-zinc-300">
                    <p>
                      <strong>Juja Lounge:</strong> Along Thika Road, Juja.
                    </p>
                  </div>
                </div>

                {/* CONTACT & SUPPORT */}
                <div className="space-y-3 lg:pl-6">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Contact & Desk</h3>
                  </div>
                  <div className="space-y-1 text-xs md:text-sm text-zinc-300 font-mono">
                    <p className="flex justify-between">              <span className="text-zinc-500">WhatsApp:</span> <a href={`tel:${PHONE}`} className="hover:underline text-amber-400">{PHONE_DISPLAY}</a></p>
                    <p className="flex justify-between"><span className="text-zinc-500">Reception:</span> <a href={`tel:${PHONE}`} className="hover:underline">{PHONE_DISPLAY}</a></p>
                    <p className="flex justify-between"><span className="text-zinc-500">E-Mail:</span> <a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a></p>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* BOOK SESSION VIEW */}
          {activeTab === 'book' && (
            <motion.div
              key="book"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-8 space-y-2">
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">CHAIR RESERVATION</span>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Secure Your Styling Seat</h1>
                <p className="text-zinc-400 text-xs md:text-sm max-w-lg">
                  Lock in exact hourly slots with Nairobi's favorite craftsmen. No queues, complimentary espresso and zero wait time.
                </p>
              </div>

              <BookingSystem 
                preSelectedServiceId={preSelectedServiceId}
                onClearPreSelectedService={() => setPreSelectedServiceId(null)}
                services={services}
                onBookingSuccess={() => triggerAudio('chime')}
              />
            </motion.div>
          )}

          {/* COMMUNITY GALLERY WALL */}
          {activeTab === 'wall' && (
            <motion.div
              key="wall"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GalleryAndWall />
            </motion.div>
          )}

          {/* FAQ SECTION */}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FAQSection />
            </motion.div>
          )}

          {/* BLOG SECTION */}
          {activeTab === 'blog' && (
            <motion.div
              key="blog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BlogSection />
            </motion.div>
          )}

          {/* ADMIN VAULT PANEL */}
          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminPortal 
                services={services} 
                onUpdateServices={handleUpdateServices}
                onNavigateHome={() => setActiveTab('lounge')}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* LUXURY LUXE BRAND FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 mt-12 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Brand block */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                <img src={logoImg} alt="BARBARIQ" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="font-display font-black tracking-widest text-white text-base">BARBARIQ</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Kenya's premium grooming standard. Blending rugged, high-end industrial design with flawless contour mastery. Established in Nairobi, 2026.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-between md:justify-center gap-x-8 gap-y-2 text-xs text-zinc-400 font-display">
            <button onClick={() => setActiveTab('lounge')} className="hover:text-amber-400 transition-all">Lounge Experience</button>
            <button onClick={() => setActiveTab('book')} className="hover:text-amber-400 transition-all">Select Services & Book</button>
            <button onClick={() => setActiveTab('blog')} className="hover:text-amber-400 transition-all">Blog & Grooming Guides</button>
            <button onClick={() => setActiveTab('faq')} className="hover:text-amber-400 transition-all">Frequently Asked Questions</button>
            <button onClick={() => setActiveTab('wall')} className="hover:text-amber-400 transition-all">Community Freshness Wall</button>
            <button onClick={() => setActiveTab('admin')} className="hover:text-amber-400 transition-all text-amber-500/80 font-mono">Admin Desk 🔑</button>
          </div>

          {/* Copyright, Socials */}
          <div className="text-left md:text-right space-y-2">
            <div className="flex md:justify-end gap-3 text-zinc-500">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <span className="text-[10px] font-mono text-zinc-650">•</span>
              <span className="text-[11px] font-mono text-zinc-500">@barbariq_lounge</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-600">
              © 2026 BARBARIQ Kenya. All rights reserved. Crafted in Juja, Nairobi.
            </p>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${PHONE_STRIPPED}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-all hover:scale-110 active:scale-95"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

    </div>
  );
}
