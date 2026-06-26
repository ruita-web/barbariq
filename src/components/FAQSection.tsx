import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, Phone, Mail, Clock, CreditCard, Scissors, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQItem } from '../types';

const PHONE = import.meta.env.VITE_PHONE || '+254706794740';
const PHONE_DISPLAY = PHONE.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
const PHONE_STRIPPED = PHONE.replace(/[^0-9]/g, '');
const EMAIL = import.meta.env.VITE_EMAIL || 'barbariq254@gmail.com';

const SEED_FAQS: FAQItem[] = [
  { id: 'faq1', q: 'Do I need to book an appointment?', a: 'We highly recommend booking online to secure your slot, but walk-ins are always welcome at our Juja lounge. Walk-ins are served on a first-come, first-served basis — booking ahead guarantees zero wait time.' },
  { id: 'faq2', q: 'What payment methods do you accept?', a: 'We accept cash, M-Pesa (buy goods till number available at the lounge), and all major credit/debit cards. All prices are in KES and include applicable taxes.' },
  { id: 'faq3', q: 'How long does a haircut take?', a: 'A standard fade or cut runs about 30–45 minutes. Add a beard sculpt for another 20 minutes. Our Alchemist Signature Combo (fade + beard + hot towel + sandalwood oil) runs approximately 75 minutes. Plan accordingly.' },
  { id: 'faq4', q: 'What is The Alchemist Signature Combo?', a: 'Our flagship service — a precision South C fade combined with a straight-razor beard sculpt, finished with a hot towel treatment and sandalwood beard oil. It\'s 75 minutes of Barbariq\'s full craft, and it\'s our most requested package.' },
  { id: 'faq5', q: 'What products do you use?', a: 'We use our own Barbariq-branded line: sandalwood beard hydrate-oil, beeswax balm, and organic tea-tree wash. All products are available for purchase at the lounge. We also carry select partner pomades and styling clays.' },
  { id: 'faq6', q: 'Do you offer beard sculpting only?', a: 'Absolutely. Walk in for a standalone beard sculpt, straight-razor neckline cleanup, or full beard reshape. Prices start at KES 1,000. No haircut required.' },
  { id: 'faq7', q: 'Can I request a specific barber?', a: 'Yes. When booking online, select your preferred barber from the dropdown. If you\'re a walk-in, just let the front desk know who you\'d like and we\'ll accommodate if they\'re available.' },
  { id: 'faq8', q: 'What is your cancellation policy?', a: 'No penalty for cancellations — we just ask that you let us know as early as possible so we can open the slot for another guest. You can always rebook through the site.' },
  { id: 'faq9', q: 'Where are you located?', a: 'We\'re along Thika Road, Juja — easily accessible from Nairobi via Thika Superhighway. Plenty of parking available.' }
];

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Clock, CreditCard, Scissors, Sparkles, HelpCircle, Phone, Mail
};

function iconFor(idx: number): React.ComponentType<any> {
  const icons = [Clock, CreditCard, Scissors, Sparkles, Sparkles, Scissors, HelpCircle, Clock, Phone];
  return icons[idx] || HelpCircle;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('barbariq_faqs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFaqs(parsed);
          return;
        }
      } catch (_) {}
    }
    localStorage.setItem('barbariq_faqs', JSON.stringify(SEED_FAQS));
    setFaqs(SEED_FAQS);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">BARBARIQ</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Frequently Asked Questions</h1>
        <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto">
          Everything you need to know before your visit. Still have questions? Reach out.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openId === faq.id;
          const Icon = iconFor(idx);
          return (
            <div
              key={faq.id}
              className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                isOpen ? 'border-amber-500/40' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-amber-500" />
                </div>
                <span className="flex-1 font-display font-bold text-sm md:text-base text-white leading-snug pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-amber-500' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 ml-[65px]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
        <HelpCircle className="w-6 h-6 text-amber-500 mx-auto" />
        <div>
          <h3 className="font-display font-bold text-white text-sm">Still have questions?</h3>
          <p className="text-xs text-zinc-400 mt-1">We're here to help. Reach out directly.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`https://wa.me/${PHONE_STRIPPED}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-xs font-display font-bold hover:bg-green-500/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`tel:${PHONE}`}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-full text-xs font-display font-bold hover:border-zinc-700 transition-all"
          >
            <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-full text-xs font-display font-bold hover:border-zinc-700 transition-all"
          >
            <Mail className="w-4 h-4" /> Email
          </a>
        </div>
      </div>
    </div>
  );
}
