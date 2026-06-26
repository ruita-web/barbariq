/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

import { Appointment, ServiceItem, Barber, BlogPost, FAQItem } from '../types';
import { 
  ShieldAlert, 
  DollarSign, 
  Calendar, 
  Users, 
  Scissors, 
  Edit3, 
  Save, 
  Search, 
  Trash2, 
  Settings, 
  Lock, 
  LogOut, 
  TrendingUp, 
  Clock,
  Sparkles,
  Check,
  RefreshCw,
  Info,
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPortalProps {
  services: ServiceItem[];
  onUpdateServices: (updated: ServiceItem[]) => void;
  onNavigateHome: () => void;
}

export default function AdminPortal({ services, onUpdateServices, onNavigateHome }: AdminPortalProps) {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bookings' | 'pricing' | 'blog' | 'faqs' | 'system'>('overview');
  
  // Local state for bookings and pricing editor
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Form values for editing a service
  const [editPrice, setEditPrice] = useState(0);
  const [editDuration, setEditDuration] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editName, setEditName] = useState('');

  // New service form
  const [showNewService, setShowNewService] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 30, description: '', category: 'cuts' as ServiceItem['category'], popular: false });

  // Blog management state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', excerpt: '', content: '', author: '', date: '', imageUrl: '', tags: '', published: true });
  const [showBlogForm, setShowBlogForm] = useState(false);

  // FAQ management state
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqForm, setFaqForm] = useState({ q: '', a: '' });
  const [showFaqForm, setShowFaqForm] = useState(false);

  // Load FAQ items from localStorage
  const loadFaqs = () => {
    const stored = localStorage.getItem('barbariq_faqs');
    if (stored) {
      try {
        setFaqList(JSON.parse(stored));
      } catch (_) {}
    }
  };

  const saveFaqs = (items: FAQItem[]) => {
    setFaqList(items);
    localStorage.setItem('barbariq_faqs', JSON.stringify(items));
  };

  const resetFaqForm = () => {
    setFaqForm({ q: '', a: '' });
    setEditingFaq(null);
    setShowFaqForm(false);
  };

  // Load blog posts from localStorage
  const loadBlogPosts = () => {
    const stored = localStorage.getItem('barbariq_blogs');
    if (stored) {
      try {
        setBlogPosts(JSON.parse(stored));
      } catch (_) {}
    }
  };

  const saveBlogPosts = (posts: BlogPost[]) => {
    setBlogPosts(posts);
    localStorage.setItem('barbariq_blogs', JSON.stringify(posts));
  };

  // Reset blog form
  const resetBlogForm = () => {
    setBlogForm({ title: '', slug: '', excerpt: '', content: '', author: '', date: new Date().toISOString().split('T')[0], imageUrl: '', tags: '', published: true });
    setEditingBlog(null);
    setShowBlogForm(false);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') {
          new Notification('✅ BARBARIQ Notifications Active', { body: 'You\'ll be notified here when new bookings arrive.' });
        }
      });
    }
  }, []);

  // Listen for ntfy.sh push notifications when authenticated (cross-device)
  const notifSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
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
    } catch (_) {}
  };
  useEffect(() => {
    if (!isAuthenticated) return;
    // SSE connection to ntfy.sh for real-time pushes
    const ntfyTopic = import.meta.env.VITE_NTFY_TOPIC || 'barbariq-bookings';
    const evtSource = new EventSource(`https://ntfy.sh/${ntfyTopic}/sse`);
    evtSource.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data);
        const msg = data.message || '';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('✂️ New Booking at BARBARIQ!', {
            body: msg.length > 120 ? msg.slice(0, 120) + '...' : msg,
            icon: '/favicon.ico'
          });
        }
        notifSound();
        setTimeout(() => loadBookings(), 1000);
      } catch (_) {}
    });
    // Backup polling every 15s in case SSE misses
    const interval = setInterval(() => loadBookings(), 15000);
    return () => { evtSource.close(); clearInterval(interval); };
  }, [isAuthenticated]);

  // Load data on mount (no auto-auth — lock on refresh)
  useEffect(() => {
    loadBookings();
    loadBlogPosts();
    loadFaqs();
  }, []);

  // Reload bookings when navigating to bookings tab
  useEffect(() => {
    if (activeSubTab === 'bookings') loadBookings();
  }, [activeSubTab]);

  const loadBookings = () => {
    const list = localStorage.getItem('barbariq_bookings');
    if (list) {
      try {
        setBookings(JSON.parse(list));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Cyberpunk Keypad input
  const handleKeypadPress = (val: string) => {
    setAuthError(false);
    if (passcode.length < 8) {
      setPasscode(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
    setAuthError(false);
  };

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode === (import.meta.env.VITE_ADMIN_PASSCODE || '60872711')) {
      setIsAuthenticated(true);
      setPasscode('');
    } else {
      setAuthError(true);
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Delete booking handler
  const handleDeleteBooking = (id: string) => {
    if (window.confirm(`Are you sure you want to cancel and remove booking ${id}?`)) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem('barbariq_bookings', JSON.stringify(updated));
    }
  };

  // Start editing service
  const handleStartEdit = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setEditPrice(srv.price);
    setEditDuration(srv.durationMinutes);
    setEditDescription(srv.description);
    setEditName(srv.name);
  };

  // Add a new service
  const handleAddService = () => {
    if (!newService.name.trim()) { alert('Service name is required.'); return; }
    const newSrv: ServiceItem = {
      id: 's' + Date.now(),
      name: newService.name.trim(),
      price: newService.price,
      durationMinutes: newService.duration,
      description: newService.description.trim(),
      category: newService.category,
      popular: newService.popular
    };
    onUpdateServices([...services, newSrv]);
    setNewService({ name: '', price: 0, duration: 30, description: '', category: 'cuts', popular: false });
    setShowNewService(false);
  };

  // Delete a service
  const handleDeleteService = (id: string) => {
    const srv = services.find(s => s.id === id);
    if (!srv) return;
    if (!window.confirm(`Delete "${srv.name}"? This cannot be undone.`)) return;
    onUpdateServices(services.filter(s => s.id !== id));
  };

  // Save service edits
  const handleSaveService = (id: string) => {
    const updated = services.map(srv => {
      if (srv.id === id) {
        return {
          ...srv,
          name: editName,
          price: editPrice,
          durationMinutes: editDuration,
          description: editDescription
        };
      }
      return srv;
    });
    onUpdateServices(updated);
    setEditingServiceId(null);
  };

  // Reset system data
  const handleResetSystem = () => {
    if (window.confirm('WARNING: This will reset all pricing catalog and bookings back to defaults. Continue?')) {
      localStorage.removeItem('barbariq_services');
      localStorage.removeItem('barbariq_bookings');
      // Force reload app
      window.location.href = '/admin';
    }
  };

  // Populate mock data for visuals
  const handleLoadMockBookings = () => {
    const mockBookings: Appointment[] = [
      {
        id: 'B-849204',
        userName: 'Brian Kiprop',
        userPhone: '+254 722 000 111',
        userEmail: 'kiprop@outlook.com',
        serviceId: 's1',
        serviceName: 'South C Sharp Low Fade',
        price: 1500,
        barberId: 'b1',
        barberName: 'Musa Kamau',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        timeSlot: '11:00 AM',
        status: 'confirmed',
        notes: 'Needs razor lineup clean.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'B-739182',
        userName: 'Clara Njoki',
        userPhone: '+254 733 999 888',
        userEmail: 'clara.n@gmail.com',
        serviceId: 's9',
        serviceName: 'Dreadlocks Retwist & Style',
        price: 3200,
        barberId: 'b2',
        barberName: 'Jane Wambui',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], 
        timeSlot: '02:00 PM',
        status: 'confirmed',
        notes: 'Sisterlocks tight tension retwist.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'B-629402',
        userName: 'David Ochieng',
        userPhone: '+254 701 555 444',
        userEmail: 'dochieng@corporate.ke',
        serviceId: 's5',
        serviceName: 'Sleek Beard Sculpt & Sandalwood Oil',
        price: 1000,
        barberId: 'b3',
        barberName: 'Omari Juma',
        date: new Date(Date.now()).toISOString().split('T')[0], // Today
        timeSlot: '04:00 PM',
        status: 'confirmed',
        notes: 'Hot towel prep requested.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'B-103948',
        userName: 'George Murimi',
        userPhone: '+254 755 333 222',
        userEmail: 'murimi@fashion.ke',
        serviceId: 's7',
        serviceName: 'The Alchemist Signature Combo',
        price: 2200,
        barberId: 'b1',
        barberName: 'Musa Kamau',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        timeSlot: '06:00 PM',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      }
    ];

    const current = localStorage.getItem('barbariq_bookings');
    let merged = mockBookings;
    if (current) {
      try {
        const parsed = JSON.parse(current);
        // avoid adding duplicates
        const filteredMock = mockBookings.filter(mb => !parsed.some((p: any) => p.id === mb.id));
        merged = [...parsed, ...filteredMock];
      } catch (e) {}
    }
    setBookings(merged);
    localStorage.setItem('barbariq_bookings', JSON.stringify(merged));
  };

  // Metrics calculators
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.price, 0);
  
  // Total confirmed bookings
  const topBarber = confirmedBookings.length > 0 ? `Owner (${confirmedBookings.length} cuts)` : 'No active cuts';

  // Calculate category metrics
  const categoryStats = services.map(srv => {
    const count = confirmedBookings.filter(b => b.serviceId === srv.id).length;
    return { name: srv.name, count, price: srv.price };
  }).sort((a, b) => b.count - a.count);

  // Search bookings filter
  const filteredBookings = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      b.userName.toLowerCase().includes(term) ||
      b.userPhone.toLowerCase().includes(term) ||
      b.id.toLowerCase().includes(term) ||
      b.barberName.toLowerCase().includes(term) ||
      b.serviceName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-[580px] bg-zinc-950 text-zinc-100 flex flex-col font-sans relative border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* CYBERPUNK PASSCODE LOCK SCREEN */
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col items-center justify-center py-16 px-6"
          >
            <div className="max-w-md w-full text-center space-y-6">
              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/5">
                <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-display font-medium tracking-tight text-white">
                  BARBARIQ ADMIN VAULT
                </h2>
                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
                  ENTER SECURE EXECUTIVE PIN
                </p>
              </div>

              {/* Dots display */}
              <div className="flex justify-center gap-3 py-2">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      i < passcode.length 
                        ? 'bg-amber-500 border-amber-400 scale-110 shadow shadow-amber-500/50' 
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  />
                ))}
              </div>

              {/* Pin feedback */}
              <div className="h-4">
                {authError && (
                  <p className="text-xs text-red-505 font-mono flex items-center justify-center gap-1.5 text-red-400">
                    <ShieldAlert className="w-3.5 h-3.5" /> DECRYPTION FAILED. ACCESS DENIED.
                  </p>
                )}
              </div>

              {/* Keyboard Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleKeypadPress(val)}
                    className="w-16 h-16 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 font-mono text-lg font-bold text-white transition-all flex items-center justify-center"
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 active:scale-95 font-mono text-xs text-zinc-500 transition-all flex items-center justify-center"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-16 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 font-mono text-lg font-bold text-white transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 active:scale-95 font-mono text-xs text-zinc-500 transition-all flex items-center justify-center"
                >
                  BACK
                </button>
              </div>

              <div className="flex flex-col gap-3 pt-4 max-w-[280px] mx-auto">
                <button
                  onClick={() => handleAuthSubmit()}
                  disabled={passcode.length === 0}
                  className={`w-full py-3 rounded-full font-display font-bold text-xs uppercase tracking-widest transition-all ${
                    passcode.length > 0 
                      ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-[0.98]' 
                      : 'bg-zinc-900 text-zinc-650 cursor-not-allowed border border-zinc-850'
                  }`}
                >
                  DECRYPT & ENTER
                </button>
                
                <button
                  onClick={onNavigateHome}
                  className="w-full py-2.5 rounded-full border border-zinc-850 hover:bg-zinc-900/40 text-xs font-display text-zinc-400 hover:text-white transition-all"
                >
                  Return to Lounge
                </button>
              </div>

              <div className="pt-6 text-[10px] font-mono text-zinc-600">
                🔒 Authorised personnel only.
              </div>
            </div>
          </motion.div>
        ) : (
          /* AUTHENTICATED DASHBOARD PANEL */
          <motion.div
            key="dashboard-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col md:flex-row h-full"
          >
            {/* Left Sidebar */}
            <div className="w-full md:w-64 bg-zinc-900/60 border-b md:border-b-0 md:border-r border-zinc-900 p-6 flex flex-col justify-between shrink-0 space-y-6">
              <div className="space-y-6">
                {/* Brand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-amber-500 text-black rounded flex items-center justify-center font-display font-bold text-sm">
                      A
                    </div>
                    <div>
                      <span className="font-display font-black text-sm tracking-wider text-white">ADMIN DESK</span>
                      <span className="block text-[8px] font-mono text-amber-500 leading-none">BARBARIQ MANAGER</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="md:hidden text-zinc-400 hover:text-red-400 transition-all"
                    title="Lock Console"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Tab Items */}
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none font-display text-xs">
                  <button
                    onClick={() => setActiveSubTab('overview')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium ${
                      activeSubTab === 'overview' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    Lounge Overview
                  </button>
                  <button
                    onClick={() => setActiveSubTab('bookings')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium flex justify-between items-center gap-2 ${
                      activeSubTab === 'bookings' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    <span>Manage Bookings</span>
                    {confirmedBookings.length > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        activeSubTab === 'bookings' ? 'bg-black text-amber-500' : 'bg-zinc-950 text-zinc-450'
                      }`}>
                        {confirmedBookings.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveSubTab('pricing')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium ${
                      activeSubTab === 'pricing' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    Edit Pricing Menu
                  </button>
                  <button
                    onClick={() => setActiveSubTab('blog')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium ${
                      activeSubTab === 'blog' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    Blog Manager
                  </button>
                  <button
                    onClick={() => setActiveSubTab('faqs')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium ${
                      activeSubTab === 'faqs' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    FAQs Manager
                  </button>
                  <button
                    onClick={() => setActiveSubTab('system')}
                    className={`px-4 py-2.5 rounded-lg text-left transition-all shrink-0 font-medium ${
                      activeSubTab === 'system' 
                        ? 'bg-amber-500 text-black font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    System Control
                  </button>
                </nav>
              </div>

              {/* Console Lock Button */}
              <div className="hidden md:flex flex-col gap-3 pt-6 border-t border-zinc-800/80">
                <button
                  onClick={onNavigateHome}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-white text-[11px] font-display rounded-lg transition-all"
                >
                  Exit Admin Desk
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full py-2 flex items-center justify-center gap-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> Lock Console
                </button>
              </div>
            </div>

            {/* Right content view */}
            <div className="flex-grow p-6 md:p-8 overflow-y-auto max-h-[580px] scrollbar-thin">
              
              {/* TAB 1: OVERVIEW METRICS */}
              {activeSubTab === 'overview' && (
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-xl font-display font-medium text-white">Lounge Operations Analytics</h2>
                    <p className="text-xs text-zinc-400">Live operational stats compiled from this workstation's bookings registry.</p>
                  </div>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-zinc-905 border border-zinc-850 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute right-3 top-3 w-8 h-8 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Total Earnings</span>
                      <h3 className="text-xl font-bold font-mono text-white">KES {totalRevenue.toLocaleString()}</h3>
                      <span className="text-[9px] text-zinc-405 block">From {confirmedBookings.length} completed shaves.</span>
                    </div>

                    <div className="bg-zinc-905 border border-zinc-850 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute right-3 top-3 w-8 h-8 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Total bookings</span>
                      <h3 className="text-xl font-bold font-mono text-white">{confirmedBookings.length}</h3>
                      <span className="text-[9px] text-zinc-405 block">Active appointments.</span>
                    </div>

                    <div className="bg-zinc-905 border border-zinc-850 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute right-3 top-3 w-8 h-8 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Top Barber</span>
                      <h3 className="text-sm font-bold font-display text-white truncate max-w-[130px]">{topBarber}</h3>
                      <span className="text-[9px] text-zinc-405 block">Highest demand rating.</span>
                    </div>

                    <div className="bg-zinc-905 border border-zinc-850 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute right-3 top-3 w-8 h-8 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Avg. Session Value</span>
                      <h3 className="text-xl font-bold font-mono text-white">
                        KES {confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length).toLocaleString() : '0'}
                      </h3>
                      <span className="text-[9px] text-zinc-405 block">Basket size per guest.</span>
                    </div>

                  </div>

                  {/* Operational breakdown lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Treatments popular */}
                    <div className="bg-zinc-905 border border-zinc-850 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                        <h4 className="text-xs font-mono text-zinc-450 uppercase tracking-wider font-bold">Treatment Popularity (Active Cuts)</h4>
                        <Scissors className="w-4 h-4 text-zinc-600" />
                      </div>
                      
                      {confirmedBookings.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                          No booking data to index. Add demo data in System tab!
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {categoryStats.slice(0, 5).map(stat => {
                            const percent = confirmedBookings.length > 0 ? (stat.count / confirmedBookings.length) * 100 : 0;
                            return (
                              <div key={stat.name} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-zinc-350 truncate pr-4">{stat.name}</span>
                                  <span className="font-mono text-amber-400 font-bold">{stat.count} booked</span>
                                </div>
                                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Total Bookings Summary */}
                    <div className="bg-zinc-905 border border-zinc-850 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                        <h4 className="text-xs font-mono text-zinc-450 uppercase tracking-wider font-bold">Booking Summary</h4>
                        <Users className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-350">Total Confirmed Bookings</span>
                            <span className="font-mono text-amber-400 font-bold">{confirmedBookings.length}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/75 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 pt-1">
                          All sessions handled by Owner at Juja lounge.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE BOOKINGS */}
              {activeSubTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-display font-medium text-white">Workstation Booking Log</h2>
                      <p className="text-xs text-zinc-400">Search, review notes, and manage active scheduling entries.</p>
                    </div>

                    {/* Search + Refresh */}
                    <div className="flex items-center gap-2 max-w-xs w-full">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-550" />
                        <input 
                          type="text" 
                          placeholder="Search guest, barber, id..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white pl-9 pr-4 py-2.5 rounded-lg outline-none font-mono"
                        />
                      </div>
                      <button
                        onClick={loadBookings}
                        className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-amber-400 transition-all"
                        title="Refresh bookings"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bookings table / list */}
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-905 border border-zinc-850 rounded-xl space-y-3">
                      <Calendar className="w-8 h-8 text-zinc-700 mx-auto" />
                      <p className="text-sm text-zinc-505">No appointments match your filter query.</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-905">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-zinc-950 border-b border-zinc-850 font-mono text-[10px] text-zinc-450 uppercase tracking-wider">
                              <th className="p-4">Appointment ID</th>
                              <th className="p-4">Guest</th>
                              <th className="p-4">Barber / Service</th>
                              <th className="p-4">Date / Slot</th>
                              <th className="p-4 text-right">Price</th>
                              <th className="p-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850/60 font-mono">
                            {filteredBookings.map(b => (
                              <tr key={b.id} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="p-4 font-semibold text-amber-500">{b.id}</td>
                                <td className="p-4 space-y-0.5">
                                  <div className="font-sans font-bold text-white text-[13px]">{b.userName}</div>
                                  <div className="text-[10px] text-zinc-500">{b.userPhone}</div>
                                  {b.userEmail && <div className="text-[9px] text-zinc-550 truncate max-w-[130px]">{b.userEmail}</div>}
                                </td>
                                <td className="p-4 space-y-0.5">
                                  <div className="font-sans font-semibold text-zinc-300">{b.serviceName}</div>
                                  <div className="text-[10px] text-zinc-505 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-550" /> {b.barberName}
                                  </div>
                                </td>
                                <td className="p-4 space-y-0.5">
                                  <div className="text-zinc-300 font-semibold">{b.date}</div>
                                  <div className="text-[10px] text-zinc-505 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {b.timeSlot}
                                  </div>
                                </td>
                                <td className="p-4 text-right font-bold text-white text-[13px]">
                                  KES {b.price.toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleDeleteBooking(b.id)}
                                    className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/20 active:scale-95 transition-all"
                                    title="Cancel Appointment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EDIT PRICING MENU */}
              {activeSubTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-display font-medium text-white">Grooming Catalog Configuration</h2>
                    <p className="text-xs text-zinc-400">Modify service names, prices, durations, and descriptions. Price updates propagate reactively.</p>
                  </div>

                  {/* Add Service controls */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowNewService(!showNewService)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> {showNewService ? 'Cancel' : 'Add Service'}
                    </button>
                  </div>

                  {/* New service form */}
                  {showNewService && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-display font-bold text-white">New Service</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 block">Service Name</label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={e => setNewService({ ...newService, name: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none"
                            placeholder="e.g. Premium Lineup & Shape"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 block">Category</label>
                          <select
                            value={newService.category}
                            onChange={e => setNewService({ ...newService, category: e.target.value as ServiceItem['category'] })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none"
                          >
                            <option value="cuts">Cuts</option>
                            <option value="beards">Beards</option>
                            <option value="combos">Combos</option>
                            <option value="treatments">Treatments</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 block">Price (KES)</label>
                          <input
                            type="number"
                            value={newService.price}
                            onChange={e => setNewService({ ...newService, price: parseInt(e.target.value) || 0 })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 block">Duration (Mins)</label>
                          <input
                            type="number"
                            value={newService.duration}
                            onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) || 30 })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 block">Description</label>
                          <textarea
                            value={newService.description}
                            onChange={e => setNewService({ ...newService, description: e.target.value })}
                            rows={2}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none leading-relaxed"
                            placeholder="Describe the service..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="newServicePopular"
                            checked={newService.popular}
                            onChange={e => setNewService({ ...newService, popular: e.target.checked })}
                            className="rounded border-zinc-800 bg-zinc-950 accent-amber-500"
                          />
                          <label htmlFor="newServicePopular" className="text-[10px] font-mono text-zinc-500">Mark as Popular</label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowNewService(false)}
                          className="px-3.5 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-display text-zinc-500 hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddService}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Service
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grid lists of services */}
                  <div className="space-y-4">
                    {services.map(srv => {
                      const isEditing = editingServiceId === srv.id;
                      return (
                        <div 
                          key={srv.id}
                          className={`bg-zinc-905 border p-5 rounded-xl transition-all relative flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                            isEditing 
                              ? 'border-amber-500 bg-amber-500/5 glow-gold shadow-md' 
                              : 'border-zinc-850 hover:border-zinc-800'
                          }`}
                        >
                          {/* Left Details */}
                          <div className="flex-grow space-y-3">
                            {isEditing ? (
                              <div className="space-y-3 max-w-xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-zinc-505 block">Service Title</label>
                                    <input 
                                      type="text"
                                      value={editName}
                                      onChange={e => setEditName(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded p-2 text-xs font-sans text-white outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-zinc-505 block">Category</label>
                                    <span className="block text-xs font-mono text-zinc-400 bg-zinc-950/40 p-2 border border-zinc-850 rounded uppercase">
                                      {srv.category}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-505 block">Description Vibe</label>
                                  <textarea 
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    rows={2}
                                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded p-2 text-xs font-sans text-white outline-none leading-relaxed"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-display font-bold text-white text-sm md:text-base">{srv.name}</h3>
                                  <span className="bg-zinc-950 text-zinc-500 text-[8px] font-mono px-2 py-0.5 rounded border border-zinc-850 uppercase tracking-wider">
                                    {srv.category}
                                  </span>
                                  {srv.popular && (
                                    <span className="bg-amber-500/10 text-amber-400 text-[8px] font-mono px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">{srv.description}</p>
                              </div>
                            )}

                            {/* Duration / category metrics */}
                            <div className="flex gap-4 text-xs font-mono text-zinc-500 pt-1">
                              {isEditing ? (
                                <div className="grid grid-cols-2 gap-3 max-w-[320px]">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-zinc-505 block">Duration (Mins)</label>
                                    <input 
                                      type="number"
                                      value={editDuration}
                                      onChange={e => setEditDuration(parseInt(e.target.value) || 30)}
                                      className="w-20 bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded p-2 text-xs text-white outline-none font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-zinc-550 block">Price (KES)</label>
                                    <input 
                                      type="number"
                                      value={editPrice}
                                      onChange={e => setEditPrice(parseInt(e.target.value) || 0)}
                                      className="w-32 bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded p-2 text-xs text-white outline-none font-mono font-bold"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {srv.durationMinutes} Mins Session</span>
                                  <span>•</span>
                                  <span>ID: {srv.id}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right Price & Save */}
                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-zinc-850 pt-4 md:pt-0 shrink-0">
                            {!isEditing && (
                              <div className="text-right">
                                <span className="block text-[8px] font-mono text-zinc-500 uppercase">Current Fee</span>
                                <span className="text-amber-400 font-mono font-bold text-sm md:text-base">KES {srv.price.toLocaleString()}</span>
                              </div>
                            )}

                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingServiceId(null)}
                                  className="px-3.5 py-2 border border-zinc-850 hover:bg-zinc-800 rounded-lg text-xs font-display text-zinc-500 hover:text-white transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveService(srv.id)}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all flex items-center gap-1"
                                >
                                  <Save className="w-3.5 h-3.5" /> Save Changes
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteService(srv.id)}
                                  className="px-3 py-2 border border-zinc-800 hover:border-red-500/30 bg-zinc-950 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 text-xs font-display rounded-lg transition-all flex items-center gap-1.5"
                                  title="Delete service"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleStartEdit(srv)}
                                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-display rounded-lg transition-all flex items-center gap-1.5"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit Service
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: BLOG MANAGER */}
              {activeSubTab === 'blog' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-display font-medium text-white">Blog Manager</h2>
                      <p className="text-xs text-zinc-400">Create, edit, and manage blog posts including thumbnails, tags, and publish state.</p>
                    </div>
                    <button
                      onClick={() => { resetBlogForm(); setShowBlogForm(true); }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Post
                    </button>
                  </div>

                  {/* Blog Form (create/edit) */}
                  {showBlogForm && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-display font-bold text-white">{editingBlog ? 'Edit Post' : 'Create New Post'}</h3>
                        <button onClick={resetBlogForm} className="text-zinc-500 hover:text-white text-xs">Cancel</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Title</label>
                          <input type="text" value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Slug</label>
                          <input type="text" value={blogForm.slug} onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Author</label>
                          <input type="text" value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Date</label>
                          <input type="date" value={blogForm.date} onChange={e => setBlogForm({ ...blogForm, date: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-500">Thumbnail Image</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input type="file" accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setBlogForm({ ...blogForm, imageUrl: ev.target?.result as string || '' });
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-amber-500 file:text-black file:cursor-pointer hover:file:bg-amber-400 bg-zinc-950 border border-zinc-800 rounded p-1.5 outline-none"
                            />
                            <span className="text-[10px] font-mono text-zinc-600 self-center">or paste URL</span>
                            <input type="text" value={blogForm.imageUrl} onChange={e => setBlogForm({ ...blogForm, imageUrl: e.target.value })}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                          </div>
                          {blogForm.imageUrl && (
                            <div className="mt-2 relative inline-block">
                              <img src={blogForm.imageUrl} alt="Preview" className="h-24 w-auto rounded-lg border border-zinc-800 object-cover" referrerPolicy="no-referrer" />
                              <button
                                onClick={() => setBlogForm({ ...blogForm, imageUrl: '' })}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-400 transition-all"
                              >×</button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-500">Tags (comma-separated)</label>
                          <input type="text" value={blogForm.tags} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })}
                            placeholder="fade, nairobi style, grooming tips"
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-500">Excerpt</label>
                          <textarea rows={2} value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-500">Content (full article text)</label>
                          <textarea rows={6} value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none font-mono leading-relaxed" />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] font-mono text-zinc-500">Published</label>
                          <button
                            onClick={() => setBlogForm({ ...blogForm, published: !blogForm.published })}
                            className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold border transition-all ${
                              blogForm.published
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                            }`}
                          >
                            {blogForm.published ? 'PUBLISHED' : 'DRAFT'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (!blogForm.title.trim() || !blogForm.content.trim()) { alert('Title and content are required.'); return; }
                            const tags = blogForm.tags.split(',').map(t => t.trim()).filter(Boolean);
                            const slug = blogForm.slug.trim() || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            const newPost: BlogPost = {
                              id: editingBlog ? editingBlog.id : 'bp-' + Date.now(),
                              title: blogForm.title.trim(),
                              slug,
                              excerpt: blogForm.excerpt.trim(),
                              content: blogForm.content.trim(),
                              author: blogForm.author.trim() || 'Barbariq Editorial',
                              date: blogForm.date || new Date().toISOString().split('T')[0],
                              imageUrl: blogForm.imageUrl.trim() || undefined,
                              tags,
                              published: blogForm.published
                            };
                            let updated: BlogPost[];
                            if (editingBlog) {
                              updated = blogPosts.map(p => p.id === editingBlog.id ? newPost : p);
                            } else {
                              updated = [...blogPosts, newPost];
                            }
                            saveBlogPosts(updated);
                            resetBlogForm();
                          }}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all"
                        >
                          <Save className="w-3.5 h-3.5 mr-1 inline" /> {editingBlog ? 'Update Post' : 'Create Post'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Blog List */}
                  <div className="space-y-3">
                    {blogPosts.length === 0 ? (
                      <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                        <BookOpen className="w-8 h-8 text-zinc-700 mx-auto" />
                        <p className="text-sm text-zinc-500">No blog posts yet. Create your first post above.</p>
                      </div>
                    ) : (
                      blogPosts.map(post => (
                        <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition-all">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {post.imageUrl ? (
                              <img src={post.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 bg-zinc-950" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-zinc-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-display font-bold text-white truncate">{post.title}</h4>
                                {post.published ? (
                                  <span className="text-[8px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> Live</span>
                                ) : (
                                  <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> Draft</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                <span>{post.author}</span>
                                <span>•</span>
                                <span>{post.date}</span>
                                <span>•</span>
                                <span>{post.tags.slice(0, 2).join(', ')}{post.tags.length > 2 && '...'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const updated = blogPosts.map(p => p.id === post.id ? { ...p, published: !p.published } : p);
                                saveBlogPosts(updated);
                              }}
                              className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                              title={post.published ? 'Unpublish' : 'Publish'}
                            >
                              {post.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingBlog(post);
                                setBlogForm({
                                  title: post.title,
                                  slug: post.slug,
                                  excerpt: post.excerpt,
                                  content: post.content,
                                  author: post.author,
                                  date: post.date,
                                  imageUrl: post.imageUrl || '',
                                  tags: post.tags.join(', '),
                                  published: post.published
                                });
                                setShowBlogForm(true);
                              }}
                              className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${post.title}"?`)) {
                                  saveBlogPosts(blogPosts.filter(p => p.id !== post.id));
                                  if (editingBlog?.id === post.id) resetBlogForm();
                                }
                              }}
                              className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: FAQ MANAGER */}
              {activeSubTab === 'faqs' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-display font-medium text-white">FAQ Manager</h2>
                      <p className="text-xs text-zinc-400">Add, edit, reorder, or remove frequently asked questions.</p>
                    </div>
                    <button
                      onClick={() => { resetFaqForm(); setShowFaqForm(true); }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add FAQ
                    </button>
                  </div>

                  {showFaqForm && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-display font-bold text-white">{editingFaq ? 'Edit FAQ' : 'New FAQ'}</h3>
                        <button onClick={resetFaqForm} className="text-zinc-500 hover:text-white text-xs">Cancel</button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Question</label>
                          <input type="text" value={faqForm.q} onChange={e => setFaqForm({ ...faqForm, q: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500">Answer</label>
                          <textarea rows={4} value={faqForm.a} onChange={e => setFaqForm({ ...faqForm, a: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white outline-none" />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!faqForm.q.trim() || !faqForm.a.trim()) { alert('Both question and answer are required.'); return; }
                          const newItem: FAQItem = {
                            id: editingFaq ? editingFaq.id : 'faq-' + Date.now(),
                            q: faqForm.q.trim(),
                            a: faqForm.a.trim()
                          };
                          let updated: FAQItem[];
                          if (editingFaq) {
                            updated = faqList.map(f => f.id === editingFaq.id ? newItem : f);
                          } else {
                            updated = [...faqList, newItem];
                          }
                          saveFaqs(updated);
                          resetFaqForm();
                        }}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold rounded-lg transition-all"
                      >
                        <Save className="w-3.5 h-3.5 mr-1 inline" /> {editingFaq ? 'Update FAQ' : 'Add FAQ'}
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {faqList.length === 0 ? (
                      <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                        <HelpCircle className="w-8 h-8 text-zinc-700 mx-auto" />
                        <p className="text-sm text-zinc-500">No FAQs yet. Add your first one above.</p>
                      </div>
                    ) : (
                      faqList.map((faq, idx) => (
                        <div key={faq.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-zinc-700 transition-all">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-zinc-600 shrink-0">#{idx + 1}</span>
                              <h4 className="text-sm font-display font-bold text-white">{faq.q}</h4>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2">{faq.a}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <button
                              onClick={() => {
                                if (idx > 0) {
                                  const reordered = [...faqList];
                                  [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
                                  saveFaqs(reordered);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Move up"
                            >
                              <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                            </button>
                            <button
                              onClick={() => {
                                if (idx < faqList.length - 1) {
                                  const reordered = [...faqList];
                                  [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
                                  saveFaqs(reordered);
                                }
                              }}
                              disabled={idx === faqList.length - 1}
                              className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingFaq(faq);
                                setFaqForm({ q: faq.q, a: faq.a });
                                setShowFaqForm(true);
                              }}
                              className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-400 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete FAQ: "${faq.q}"?`)) {
                                  saveFaqs(faqList.filter(f => f.id !== faq.id));
                                  if (editingFaq?.id === faq.id) resetFaqForm();
                                }
                              }}
                              className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-400 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SYSTEM CONTROL */}
              {activeSubTab === 'system' && (
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-xl font-display font-medium text-white">Station Configuration Panel</h2>
                    <p className="text-xs text-zinc-400">Initialize demonstration components, debug databases, or reset state keys.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mock Bookings Card */}
                    <div className="bg-zinc-905 border border-zinc-850 p-6 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm md:text-base">Demonstration Booking Generator</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Populates your local database with 4 beautiful mock bookings spanning yesterday, today, and tomorrow. Excellent for inspecting how the analytics widgets and booking grids handle real data.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleLoadMockBookings();
                          alert('4 Premium mock bookings successfully generated! Review them in the overview or bookings tabs.');
                        }}
                        className="py-2.5 px-4 bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900 text-xs font-display font-bold text-amber-400 rounded-lg transition-all self-start flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Inject Mock Bookings
                      </button>
                    </div>

                    {/* Reset Database Card */}
                    <div className="bg-zinc-905 border border-zinc-850 p-6 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm md:text-base">Hard Factory Reset</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Clears all bookings from browser cache and deletes dynamic pricing edits, restoring the app to its fresh git-clone seed state.
                        </p>
                      </div>

                      <button
                        onClick={handleResetSystem}
                        className="py-2.5 px-4 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 text-xs font-display font-bold text-red-400 rounded-lg transition-all self-start flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reset Local State
                      </button>
                    </div>

                    {/* Test Notification Card */}
                    <div className="bg-zinc-905 border border-zinc-850 p-6 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-bold text-white text-sm md:text-base">Test Notifications</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Test if browser notifications and sound alerts work on this device. You should see a popup and hear a chime.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!('Notification' in window)) { alert('Notifications not supported in this browser.'); return; }
                          if (Notification.permission === 'granted') {
                            new Notification('🧪 Test Notification', { body: 'BARBARIQ notifications are working!' });
                            notifSound();
                          } else if (Notification.permission === 'denied') {
                            alert('Notifications are blocked. Enable them in your browser site settings (lock icon in address bar).');
                          } else {
                            Notification.requestPermission().then(p => {
                              if (p === 'granted') {
                                new Notification('🧪 Test Notification', { body: 'BARBARIQ notifications are working!' });
                                notifSound();
                              } else {
                                alert('Permission denied. Allow notifications from the lock icon in your address bar.');
                              }
                            });
                          }
                        }}
                        className="py-2.5 px-4 bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 text-xs font-display font-bold text-green-400 rounded-lg transition-all self-start flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Test Notification
                      </button>
                    </div>

                  </div>

                  {/* System Log Details Info Alert */}
                  <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl flex gap-3 text-xs text-zinc-400">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-semibold text-white">Browser Local Storage Allocation</h5>
                      <p className="leading-relaxed">
                        To guarantee completely sandboxed, zero-dependency executions, all prices edited on the catalog and bookings configured in the scheduler use <code>localStorage</code> keys: <code>barbariq_bookings</code> and <code>barbariq_services</code>. This lets your entire workspace work offline on any device.
                      </p>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
