/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Appointment, ServiceItem } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  CreditCard,
  Sparkles,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import logoImg from '../assets/images/barbariq-logo.png';
import logoBlackImg from '../assets/images/barbariq-logo-black.png';

const imageToDataUrl = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });

const PHONE = import.meta.env.VITE_PHONE || '+254706794740';
const PHONE_DISPLAY = PHONE.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
const EMAIL = import.meta.env.VITE_EMAIL || 'barbariq254@gmail.com';

export default function BookingSystem({ 
  onBookingSuccess,
  preSelectedServiceId,
  onClearPreSelectedService,
  services
}: { 
  onBookingSuccess?: () => void;
  preSelectedServiceId: string | null;
  onClearPreSelectedService: () => void;
  services: ServiceItem[];
}) {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [locationBranch, setLocationBranch] = useState<'Juja'>('Juja');
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Local Storage appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Preselected service trigger
  useEffect(() => {
    if (preSelectedServiceId) {
      const found = services.find(s => s.id === preSelectedServiceId);
      if (found) {
        setSelectedService(found);
        setStep(2); // Jump directly to date selection
        onClearPreSelectedService();
      }
    }
  }, [preSelectedServiceId, services]);

  // Read existing appointments
  useEffect(() => {
    const list = localStorage.getItem('barbariq_bookings');
    if (list) {
      try {
        setAppointments(JSON.parse(list));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (booking: Appointment) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('✂️ New Booking at BARBARIQ!', {
        body: `${booking.userName} booked ${booking.serviceName} on ${booking.date} @ ${booking.timeSlot}`,
        icon: '/favicon.ico'
      });
    }
  };

  // Time slots list mapping
  const TIME_SLOTS = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  // Get next 10 dates for selection (skipping past dates, looking local)
  const getNextDates = () => {
    const dates = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const formatted = d.toISOString().split('T')[0];
      const displayWeekday = weekdays[d.getDay()];
      const displayDay = d.getDate();
      const displayMonth = months[d.getMonth()];
      
      dates.push({
        value: formatted,
        day: displayDay,
        weekday: displayWeekday,
        month: displayMonth
      });
    }
    return dates;
  };

  const dates = getNextDates();

  const isSlotBooked = (date: string, slot: string) => {
    return appointments.some(a =>
      a.date === date &&
      a.timeSlot === slot &&
      a.status === 'confirmed'
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot || !name || !phone) {
      return alert('Please complete all fields before confirming booking.');
    }

    if (isSlotBooked(selectedDate, selectedSlot)) {
      return alert('This time slot is already taken. Please select a different time.');
    }

    const newBooking: Appointment = {
      id: 'B-' + Math.floor(100000 + Math.random() * 900000),
      userName: name,
      userPhone: phone,
      userEmail: email || EMAIL,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      barberId: 'owner',
      barberName: 'Owner',
      date: selectedDate,
      timeSlot: selectedSlot,
      status: 'confirmed',
      notes: notes,
      createdAt: new Date().toISOString()
    };

    const updated = [newBooking, ...appointments];
    setAppointments(updated);
    localStorage.setItem('barbariq_bookings', JSON.stringify(updated));

    // Push notification via ntfy.sh (cross-device)
    try {
      const ntfyTopic = import.meta.env.VITE_NTFY_TOPIC || 'barbariq-bookings';
      navigator.sendBeacon(`https://ntfy.sh/${ntfyTopic}`,
        `${name} booked ${selectedService.name} on ${selectedDate} @ ${selectedSlot}. Phone: ${phone}`
      );
    } catch (_) {}

    // POST to server for cross-device sync
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    }).catch(() => {});

    // Alert sound + browser notification
    sendNotification(newBooking);
    if (onBookingSuccess) {
      onBookingSuccess();
    }

    // Reset wizard
    setStep(4);
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedDate('');
    setSelectedSlot('');
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setStep(1);
  };

  const currentBookings = appointments.filter(a => a.status === 'confirmed');

  const handleDownloadReceipt = async (booking: Appointment) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    const pageW = doc.internal.pageSize.getWidth();
    const gold: [number, number, number] = [212, 175, 55];
    const black: [number, number, number] = [0, 0, 0];
    const darkGrey: [number, number, number] = [60, 60, 65];
    const midGrey: [number, number, number] = [100, 100, 105];
    const dark: [number, number, number] = [24, 24, 27];

    // Gold header bar
    doc.setFillColor(...gold);
    doc.rect(0, 0, pageW, 36, 'F');

    // Logo in receipt header (black version for gold background)
    try {
      const logoSrc = await imageToDataUrl(logoBlackImg);
      doc.addImage(logoSrc, 'PNG', 8, 4, 14, 14);
    } catch { /* fallback: no logo */ }

    const white: [number, number, number] = [255, 255, 255];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...white);
    doc.text('BARBARIQ', pageW / 2, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('OFFICIAL BOOKING RECEIPT', pageW / 2, 26, { align: 'center' });

    // Booking ID
    doc.setFillColor(...dark);
    doc.rect(10, 44, pageW - 20, 14, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING REFERENCE', pageW / 2, 49, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(booking.id, pageW / 2, 56, { align: 'center' });

    // Divider line
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(10, 63, pageW - 10, 63);

    let y = 70;
    const leftX = 14;
    const rightX = pageW - 14;
    const rowH = 6.5;

    const rows: [string, string][] = [
      ['Client Name', booking.userName],
      ['Phone', booking.userPhone],
      ['Email', booking.userEmail],
      ['Service', booking.serviceName],
      ['Barber', booking.barberName],
      ['Date', booking.date],
      ['Time', booking.timeSlot],
      ['Location', 'Juja Lounge'],
      ['Status', 'CONFIRMED'],
    ];
    if (booking.notes) rows.push(['Notes', booking.notes]);

    rows.forEach(([label, value], i) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGrey);
      doc.text(label, leftX, y);
      if (label === 'Status') {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(...black);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(value, rightX, y, { align: 'right' });
      y += rowH;
      if (i === 2 || i === 6) y += 2;
    });

    // Total
    y += 4;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(10, y - 2, pageW - 10, y - 2);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('Total', leftX, y + 6);
    doc.text(`KES ${booking.price.toLocaleString()}`, rightX, y + 6, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...midGrey);
    doc.text('Pay at counter on arrival', pageW / 2, y + 15, { align: 'center' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 16;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, footerY, pageW, 28, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGrey);
    doc.text('BARBARIQ \u2022 Nairobi Elite Grooming', pageW / 2, footerY + 8, { align: 'center' });
    doc.text('Juja Lounge \u2022 Along Thika Road', pageW / 2, footerY + 14, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text('@barbariq_lounge', pageW / 2, footerY + 21, { align: 'center' });

    doc.save(`BARBARIQ_Receipt_${booking.id}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT 2 COLUMNS: BOOKING FLOW WIZARD */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-4 md:p-8">
        
        {/* Step Indicator Header */}
        {step < 5 && (
          <div className="mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono tracking-wider text-amber-500 uppercase">
                Step {step} of 3
              </span>
              <h3 className="text-[11px] md:text-sm font-heading font-semibold text-zinc-400">
                {step === 1 && "Select Grooming Service"}
                {step === 2 && "Select Date & Time"}
                {step === 3 && "Confirm Details"}
              </h3>
            </div>
            
            {/* Step Progress Bar */}
            <div className="h-1 bg-zinc-800 rounded-full flex overflow-hidden">
              <div 
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: SERVICES SELECT */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-designer font-bold tracking-tight text-white mb-0.5 uppercase">
                    Select Service
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-400">
                    Choose from our grooming packages.
                  </p>
                </div>
                
                {/* Location Badge */}
                <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-400 flex items-center gap-1.5 self-start">
                  <MapPin className="w-3.5 h-3.5" /> Along Thika Road, Juja
                </div>
              </div>

              {/* Service Grid categorized with interactive motion buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-none md:max-h-[440px] overflow-y-auto pr-1 md:pr-2 scrollbar-thin">
                {services.map((srv, srvIdx) => (
                  <motion.button
                    key={srv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: srvIdx * 0.03 }}
                    whileHover={srv.id !== selectedService?.id ? { y: -2, borderColor: "#3f3f46" } : undefined}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(srv)}
                    className={`text-left p-3 md:p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      selectedService?.id === srv.id
                        ? 'border-amber-500 bg-amber-500/10 glow-gold'
                        : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/30'
                    }`}
                  >
                    {srv.popular && (
                      <span className="absolute top-2 md:top-3 right-2 md:right-3 text-[8px] md:text-[9px] font-mono tracking-widest bg-amber-500/15 text-amber-400 px-1.5 md:px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                        Popular
                      </span>
                    )}
                    <div>
                      <h4 className="font-heading font-semibold text-white pr-10 text-xs md:text-sm">
                        {srv.name}
                      </h4>
                      <p className="text-[10px] md:text-xs text-zinc-400 mt-1 lines-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60 w-full">
                      <span className="text-zinc-500 text-[10px] md:text-xs font-mono">
                        {srv.durationMinutes} Mins
                      </span>
                      <span className="text-amber-400 font-mono font-medium text-xs md:text-sm">
                        KES {srv.price.toLocaleString()}
                      </span>
                    </div>

                    {selectedService?.id === srv.id && (
                      <div className="absolute bottom-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-end pt-3 md:pt-4">
                <button
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full font-heading font-bold text-xs md:text-sm transition-all ${
                    selectedService
                      ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DATE & TIME SELECT */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl md:text-2xl font-designer font-bold tracking-tight text-white mb-0.5 uppercase">
                  Schedule Session
                </h2>
                <p className="text-xs md:text-sm text-zinc-400">
                  Pick a date and time for your visit.
                </p>
              </div>

              {/* Date horizontal scroller */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block">
                  Select Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 pr-2 scrollbar-thin -mx-1 px-1">
                  {dates.map((d, dIdx) => (
                    <motion.button
                      key={d.value}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: dIdx * 0.02 }}
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDate(d.value);
                        setSelectedSlot(''); // Reset slot when date changes
                      }}
                      className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-lg border min-w-[60px] md:min-w-[70px] transition-all shrink-0 ${
                        selectedDate === d.value
                          ? 'border-amber-500 bg-amber-500/20 text-white shadow-sm shadow-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-[9px] md:text-[10px] font-mono uppercase text-zinc-500">
                        {d.weekday}
                      </span>
                      <span className="text-base md:text-lg font-display font-semibold mt-0.5">
                        {d.day}
                      </span>
                      <span className="text-[8px] md:text-[9px] font-mono text-zinc-500 uppercase">
                        {d.month}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time Slots grid */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block">
                  Select Time Slot
                </label>
                {selectedDate ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 md:gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = isSlotBooked(selectedDate, slot);
                      return (
                        <motion.button
                          key={slot}
                          disabled={isBooked}
                          whileHover={!isBooked && selectedSlot !== slot ? { scale: 1.03 } : undefined}
                          whileTap={!isBooked ? { scale: 0.96 } : undefined}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 md:py-2.5 px-1 rounded border text-[10px] md:text-xs font-mono transition-all text-center ${
                            isBooked
                              ? 'border-zinc-900 bg-zinc-950 text-zinc-700 cursor-not-allowed line-through'
                              : selectedSlot === slot
                              ? 'border-amber-500 bg-amber-500 text-black font-semibold shadow-sm'
                              : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                          }`}
                        >
                          {slot}
                          {isBooked && <span className="block text-[7px] md:text-[8px] opacity-40">Booked</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 md:p-8 text-center rounded-xl bg-zinc-950/30 border border-zinc-800/60 text-zinc-500 text-xs md:text-sm">
                    Select a date first to see available slots.
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 md:pt-6 border-t border-zinc-800">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs md:text-sm font-display transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
                </button>
                <button
                  disabled={!selectedDate || !selectedSlot}
                  onClick={() => setStep(3)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-display font-medium text-xs md:text-sm transition-all ${
                    selectedDate && selectedSlot
                      ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CUSTOMER DETAILS & REVIEW */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl md:text-2xl font-designer font-bold tracking-tight text-white mb-0.5 uppercase">
                  Contact Info
                </h2>
                <p className="text-xs md:text-sm text-zinc-400">
                  Final step to lock in your reservation.
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Liam Bett"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 md:p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      Phone Number *
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder={`e.g. ${PHONE_DISPLAY}`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 md:p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                    Email (for receipt)
                  </label>
                  <input 
                    type="email" 
                    placeholder="e.g. liam@bett.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 md:p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                    Style Notes
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Keep beard line thin, sensitive skin, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 md:p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                {/* Summary Box */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 md:p-4 mt-4 md:mt-6">
                  <h4 className="text-[10px] md:text-xs font-mono tracking-wider text-amber-500 uppercase mb-2 md:mb-3 border-b border-zinc-800 pb-1.5 md:pb-2">
                    SUMMARY
                  </h4>
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Service:</span>
                      <span className="font-medium text-white">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Barber:</span>
                      <span className="font-medium text-white">Owner</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Date & Time:</span>
                      <span className="font-medium text-amber-400 font-mono">{selectedDate} @ {selectedSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Location:</span>
                      <span className="font-medium text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 inline" /> Along Thika Road, Juja
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 md:pt-2 border-t border-zinc-800 text-sm md:text-base font-semibold">
                      <span className="text-zinc-400">Total:</span>
                      <span className="text-amber-500 font-mono">KES {selectedService?.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 md:pt-6 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs md:text-sm font-display transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-amber-500 text-black px-5 md:px-8 py-2.5 md:py-3 rounded-full font-display font-bold text-xs md:text-sm tracking-wide hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" /> Book Chair
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS TICKET CONFIRMATION */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="text-center py-4 md:py-6 space-y-5 md:space-y-6"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <Check className="w-7 h-7 md:w-8 md:h-8 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                  CHAIR CONFIRMED!
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 max-w-md mx-auto">
                  Your seat is reserved. Digital pass below — confirmation also sent via SMS.
                </p>
              </div>

              {/* RETRO-MODERN AIR-BOARDING PASS DESIGN */}
              {appointments[0] && (
                <div className="max-w-md mx-auto bg-amber-500 text-black rounded-3xl overflow-hidden shadow-2xl relative border border-amber-400 glow-gold text-left">
                  {/* Outer punched circles for ticket look */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 md:w-4 md:h-8 bg-zinc-900 rounded-r-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 md:w-4 md:h-8 bg-zinc-900 rounded-l-full" />

                  <div className="p-4 md:p-6 border-b-2 border-dashed border-amber-600/40">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img src={logoBlackImg} alt="BARBARIQ" className="w-7 h-7 md:w-8 md:h-8 object-contain rounded" referrerPolicy="no-referrer" />
                        <span className="font-display font-black text-lg md:text-xl tracking-wider">BARBARIQ</span>
                      </div>
                      <span className="text-[9px] md:text-[10px] font-mono tracking-widest border border-black/30 px-1.5 md:px-2 py-0.5 rounded font-semibold uppercase">
                        CHAIR PASS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Client</span>
                        <span className="font-display font-bold text-sm md:text-base leading-tight block">{appointments[0].userName}</span>
                      </div>
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Booking ID</span>
                        <span className="font-mono font-bold text-sm md:text-base block">{appointments[0].id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Service</span>
                        <span className="font-display font-medium text-xs md:text-sm leading-tight block">{appointments[0].serviceName}</span>
                      </div>
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Barber</span>
                        <span className="font-display font-bold text-xs md:text-sm block">Owner</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Date & Time</span>
                        <span className="font-mono font-bold text-xs md:text-sm block">{appointments[0].date} @ {appointments[0].timeSlot}</span>
                      </div>
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Lounge</span>
                        <span className="font-display font-bold text-xs md:text-sm block">Juja</span>
                      </div>
                    </div>

                    <div className="pt-3 md:pt-4 border-t border-amber-600/20 flex justify-between items-center">
                      <div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Payment</span>
                        <span className="font-display text-[10px] md:text-xs font-bold block">Pay at Counter</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] md:text-[9px] font-mono tracking-wider text-amber-950 uppercase block">Rate</span>
                        <span className="font-mono font-black text-lg md:text-xl">KES {appointments[0].price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 md:gap-4 pt-2 md:pt-4">
                <button
                  onClick={resetFlow}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs md:text-sm font-display transition-all"
                >
                  Book New Session
                </button>
                {appointments[0] && (
                  <button
                    onClick={() => handleDownloadReceipt(appointments[0])}
                    className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-amber-500 text-black hover:bg-amber-400 text-xs md:text-sm font-display font-bold transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
                  >
                    Download Receipt
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: ACTIVE RESERVATIONS SHELF */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 flex flex-col justify-between">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 pb-2 md:pb-3 border-b border-zinc-800">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
            <h3 className="font-display font-medium text-base md:text-lg text-white">
              Your Bookings
            </h3>
            <span className="ml-auto text-[10px] md:text-xs font-mono font-bold bg-zinc-800 text-amber-400 px-2 md:px-2.5 py-0.5 rounded-full">
              {currentBookings.length}
            </span>
          </div>

          {currentBookings.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-zinc-500 space-y-2 md:space-y-3">
              <Scissors className="w-7 h-7 md:w-8 md:h-8 text-zinc-700 mx-auto" />
              <p className="text-xs md:text-sm max-w-[200px] mx-auto">
                No active bookings. Select a cut to book now!
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4 max-h-[460px] overflow-y-auto pr-1 md:pr-2">
              {currentBookings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 md:p-4 space-y-2 md:space-y-3 hover:border-zinc-700 transition-all relative group"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] md:text-[10px] font-mono text-amber-500 uppercase tracking-widest block">
                      {b.id} • CONFIRMED
                    </span>
                    <h4 className="font-display font-semibold text-white text-xs md:text-sm">
                      {b.serviceName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[10px] md:text-xs text-zinc-400 pt-0.5 md:pt-1">
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <User className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-500" />
                      <span className="truncate">Owner</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-500" />
                      <span className="font-mono">{b.timeSlot}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 md:pt-2.5 border-t border-zinc-800/60 text-[10px] md:text-xs">
                    <span className="font-mono text-zinc-400">{b.date}</span>
                    <span className="font-mono font-medium text-amber-400">
                      KES {b.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 md:pt-6 border-t border-zinc-800 mt-4 md:mt-0">
          <div className="flex gap-2 md:gap-3 items-center text-[10px] md:text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 shrink-0" />
            <p>
              <strong>Location:</strong> Along Thika Road, Juja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
