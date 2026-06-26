/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceItem, Barber, Testimonial } from './types';

// @ts-ignore
import barberMusa from './assets/images/barber_musa.jpg';
// @ts-ignore
import barberJane from './assets/images/barber_jane.jpg';
// @ts-ignore
import barberOmari from './assets/images/barber_omari.jpg';
// @ts-ignore
import barberSoxxy from './assets/images/barber_soxxy.jpg';

export const SERVICES: ServiceItem[] = [
  {
    id: 's1',
    name: 'South C Sharp Low Fade',
    price: 1500,
    durationMinutes: 45,
    description: 'Our signature drop fade with flawless gradient transitions, laser-crisp edge lineup, and soothing lavender splash.',
    category: 'cuts',
    popular: true
  },
  {
    id: 's2',
    name: 'Barbariq Designer Buzz & Color',
    price: 3000,
    durationMinutes: 60,
    description: 'Premium short crop styled with geometric parts, hair-tattoo designs, and executive dye (Blonde, Copper, or Platinum).',
    category: 'cuts',
    popular: true
  },
  {
    id: 's3',
    name: 'The Nairobi Razor Bald Shave',
    price: 1200,
    durationMinutes: 35,
    description: 'Traditional straight razor scalp shave, skin-conditioning tea tree oils, finished with an ice-cold scalp massage.',
    category: 'cuts'
  },
  {
    id: 's4',
    name: 'The Executive Scissor Contour',
    price: 1800,
    durationMinutes: 45,
    description: 'Expert, hand-shaped shear crop for longer hairstyles, structured templates, and customized texture thinning.',
    category: 'cuts'
  },
  {
    id: 's5',
    name: 'Sleek Beard Sculpt & Sandalwood Oil',
    price: 1000,
    durationMinutes: 30,
    description: 'Exquisite scissor trims and straight-razor cheek framing, deep conditioning with locally sourced Kenyan sandalwood oil.',
    category: 'beards',
    popular: true
  },
  {
    id: 's6',
    name: 'Infused Hot Towel Razor Shave',
    price: 1400,
    durationMinutes: 40,
    description: 'A pre-shave eucalyptus massage, hot towels to steam skin, shaving cream whipped in copper, razor glide, and ice-wrap finish.',
    category: 'beards'
  },
  {
    id: 's7',
    name: 'The Alchemist Signature Combo',
    price: 2200,
    durationMinutes: 75,
    description: 'Combines our legendary South C Fade with detail-oriented Beard Sculpting, charcoal face steam, and complimentary espresso.',
    category: 'combos',
    popular: true
  },
  {
    id: 's8',
    name: 'The Kilimani Supreme Overhaul',
    price: 4500,
    durationMinutes: 100,
    description: 'Full hair sculpt + bleach/tint, detailed hot-oil beard detox, customized clay facial mask, and an intense head/shoulder wrap.',
    category: 'combos'
  },
  {
    id: 's9',
    name: 'Dreadlocks Retwist & Style',
    price: 3200,
    durationMinutes: 90,
    description: 'Deep cleansing organic tea-tree shampoo wash, professional lock palm rolling/interlocking, and styled buns or barrel twists.',
    category: 'treatments'
  },
  {
    id: 's10',
    name: '360 Waves Wave-Lord Compress',
    price: 1500,
    durationMinutes: 45,
    description: 'Special deep brush pattern alignment, customized hot compression wrap with beeswax pomade, and an elite wave alignment check.',
    category: 'treatments'
  }
];

export const BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Musa Kamau',
    nickname: 'The Fade Guru',
    bio: 'Nairobi\'s undisputed heavyweight of fade detailing. Musa specializes in geometric lineup etching and high-contrast skin fades.',
    rating: 4.9,
    reviewsCount: 342,
    specialties: ['High-skin Drop Fades', 'Bleaching & Buzz Art', 'Beard Contour'],
    imageUrl: barberMusa,
    experienceYears: 8,
    instagram: '@musa_fadeguru'
  },
  {
    id: 'b2',
    name: 'Jane Wambui',
    nickname: 'Shear Empress',
    bio: 'Jane is a creative visionary who handles premium shears with precision. Known for intricate hair artistic line engravings and dreadlock restyling.',
    rating: 4.9,
    reviewsCount: 288,
    specialties: ['Dreadlocks & Sisterlocks', 'Intricate Graphic Lines', 'Textured Shear Cuts'],
    imageUrl: barberJane,
    experienceYears: 6,
    instagram: '@jane_shearempress'
  },
  {
    id: 'b3',
    name: 'Omari Juma',
    nickname: 'Straight-Edge',
    bio: 'Omari is Nairobi\'s go-to specialist for luxury beard grooming and vintage straight razor hot-shaves. His hot towels are legendary.',
    rating: 5.0,
    reviewsCount: 195,
    specialties: ['Hot Towel Aromatherapy', 'Straight-Razor Sculpting', 'Beard Conditioning'],
    imageUrl: barberOmari,
    experienceYears: 11,
    instagram: '@omari_straightedge'
  },
  {
    id: 'b4',
    name: 'Soxxy Mwangi',
    nickname: 'Wave Lord',
    bio: 'Soxxy mastered wave compression and hair-tinting in South Africa before returning to Nairobi. He creates pristine waves and vibrant color profiles.',
    rating: 4.8,
    reviewsCount: 220,
    specialties: ['360 Waves compression', 'Design Dyeing & Blending', 'Sharp Tapers'],
    imageUrl: barberSoxxy,
    experienceYears: 5,
    instagram: '@soxxy_wavelord'
  }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    userName: 'Kiprotich Bett',
    reviewText: 'Musa gave me the cleanest low-skin fade I’ve ever had in Nairobi. The atmosphere at the Westlands branch is unparalleled—elite tunes and absolute focus!',
    rating: 5,
    date: '2026-05-24',
    barberId: 'b1',
    barberName: 'Musa Kamau'
  },
  {
    id: 't2',
    userName: 'Nia Nyambura',
    reviewText: 'Jane completely revitalized my dreadlocks. She is incredibly gentle, uses natural organic tea-tree formulas, and has unmatched styling execution.',
    rating: 5,
    date: '2026-05-28',
    barberId: 'b2',
    barberName: 'Jane Wambui'
  },
  {
    id: 't3',
    userName: 'Farid Amin',
    reviewText: 'The Hot Towel Treatment by Omari is not just a shave, it’s a high-end spiritual experience. Perfectly sculpted beard, absolute stress-buster.',
    rating: 5,
    date: '2026-05-30',
    barberId: 'b3',
    barberName: 'Omari Juma'
  }
];
