/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceCategory = 'cuts' | 'beards' | 'combos' | 'treatments';

export interface ServiceItem {
  id: string;
  name: string;
  price: number; // in Kenyan Shilling (KES)
  durationMinutes: number;
  description: string;
  category: ServiceCategory;
  popular?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  nickname: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  imageUrl: string;
  experienceYears: number;
  instagram?: string;
}

export interface Appointment {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  price: number;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  status: 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  userName: string;
  reviewText: string;
  rating: number;
  date: string;
  barberId: string;
  barberName: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl?: string;
  tags: string[];
  published: boolean;
}

export interface FreshCut {
  id: string;
  uploaderName: string;
  barberId: string;
  barberName: string;
  caption: string;
  base64Image: string;
  likesCount: number;
  date: string;
  styleName: string;
}


