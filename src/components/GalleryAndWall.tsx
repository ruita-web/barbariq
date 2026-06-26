/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BARBERS } from '../data';
import { FreshCut } from '../types';
import { 
  Camera, 
  Upload, 
  Heart, 
  Share2, 
  User, 
  Scissors, 
  Plus,
  MessageCircle, 
  Image as ImageIcon,
  Check,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// @ts-ignore
import cutFade from '../assets/images/cut_fade.jpg';
// @ts-ignore
import cutDreads from '../assets/images/cut_dreads.jpg';
// @ts-ignore
import cutBeard from '../assets/images/cut_beard.jpg';

const INITIAL_CUTS: FreshCut[] = [
  {
    id: 'f1',
    uploaderName: 'Alvin Kosgei',
    barberId: 'b1',
    barberName: 'Musa Kamau',
    caption: 'Locked in with the South C High Taper and classic razor side lineup. Absolute perfection by Musa!',
    base64Image: cutFade,
    likesCount: 42,
    date: '2026-05-29',
    styleName: 'South C Sharp Low Fade'
  },
  {
    id: 'f2',
    uploaderName: 'Zack Omondi',
    barberId: 'b2',
    barberName: 'Jane Wambui',
    caption: 'Interlocking retwist with a custom copper-tint crown. Jane has absolute magic in her hands.',
    base64Image: cutDreads,
    likesCount: 56,
    date: '2026-05-30',
    styleName: 'Dreadlocks Retwist & Style'
  },
  {
    id: 'f3',
    uploaderName: 'David Muthomi',
    barberId: 'b3',
    barberName: 'Omari Juma',
    caption: 'Sandalwood conditioning, smooth cheeks, razor edge. If you value your beard, book with Omari immediately.',
    base64Image: cutBeard,
    likesCount: 31,
    date: '2026-06-01',
    styleName: 'Sleek Beard Sculpt'
  }
];

export default function GalleryAndWall() {
  const [cuts, setCuts] = useState<FreshCut[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form fields
  const [uploaderName, setUploaderName] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('b1');
  const [caption, setCaption] = useState('');
  const [styleName, setStyleName] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts (seed from imports, extra from localStorage)
  useEffect(() => {
    localStorage.removeItem('barbariq_wall_cuts'); // clean old key
    const userCuts: FreshCut[] = [];
    const stored = localStorage.getItem('barbariq_wall_uploads');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) userCuts.push(...parsed);
      } catch (_) {}
    }
    setCuts([...userCuts, ...INITIAL_CUTS]);
  }, []);

  // Handle Drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Convert File to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are permitted on the Barbariq Wall.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImagePreview(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Simulate selfie taking if they want a fast portrait
  const handleDemoPhoto = () => {
    // Generate a beautiful, high-contrast placeholder
    const randomDemoImages = [
      cutFade,
      cutDreads,
      cutBeard
    ];
    const picked = randomDemoImages[Math.floor(Math.random() * randomDemoImages.length)];
    setImagePreview(picked);
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName || !caption || !imagePreview || !styleName) {
      return alert('Before uploading, kindly input your name, style received, and upload a snap.');
    }

    const barber = BARBERS.find(b => b.id === selectedBarberId) || BARBERS[0];

    const newCut: FreshCut = {
      id: 'CUT-' + Date.now(),
      uploaderName: uploaderName,
      barberId: barber.id,
      barberName: barber.name,
      caption: caption,
      base64Image: imagePreview,
      likesCount: 1, // Start with their own self-like
      date: new Date().toISOString().split('T')[0],
      styleName: styleName
    };

    const stored = localStorage.getItem('barbariq_wall_uploads');
    const existing: FreshCut[] = stored ? JSON.parse(stored) : [];
    const updatedUploads = [newCut, ...existing];
    localStorage.setItem('barbariq_wall_uploads', JSON.stringify(updatedUploads));
    setCuts([...updatedUploads, ...INITIAL_CUTS]);

    // Reset Form
    setUploaderName('');
    setCaption('');
    setStyleName('');
    setImagePreview('');
    setUploadOpen(false);
  };

  const handleLike = (cutId: string) => {
    const updated = cuts.map(c => {
      if (c.id === cutId) {
        return { ...c, likesCount: c.likesCount + 1 };
      }
      return c;
    });
    setCuts(updated);
    // Only persist likes for user-uploaded cuts
    const stored = localStorage.getItem('barbariq_wall_uploads');
    if (stored) {
      const uploads: FreshCut[] = JSON.parse(stored);
      const updatedUploads = uploads.map(u => {
        const match = updated.find(c => c.id === u.id);
        return match || u;
      });
      localStorage.setItem('barbariq_wall_uploads', JSON.stringify(updatedUploads));
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION WITH UPLOAD TRIGGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-805 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-display font-medium text-white flex items-center gap-2">
            The Freshness Wall
          </h2>
          <p className="text-xs md:text-sm text-zinc-400">
            A live showcase of crisp contours, sharp tapers, and designer colors fresh out the Barbariq chair!
          </p>
        </div>

        <button
          onClick={() => setUploadOpen(prev => !prev)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-full font-display font-medium text-sm transition-all shadow-md active:scale-95 self-start"
        >
          {uploadOpen ? (
            'Close Upload'
          ) : (
            <>
              <Plus className="w-4 h-4 text-black stroke-[3]" /> Post Your Cut
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {/* LIGHT SLICK UPLOADER FORM */}
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-mono text-amber-500 uppercase tracking-widest block">
                Post Your Styling Session Link
              </h3>

              <form onSubmit={handlePostSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Drag Zone */}
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                      isDragging
                        ? 'border-amber-500 bg-amber-500/5'
                        : imagePreview
                        ? 'border-zinc-700 bg-zinc-950/20'
                        : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-3 w-full">
                        <div className="w-24 h-24 rounded-lg overflow-hidden mx-auto border border-zinc-800 shadow-lg">
                          <img 
                            src={imagePreview} 
                            alt="Scan Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-xs text-amber-400 flex items-center gap-1 justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Photo Loaded Successfully
                        </p>
                        <span className="text-[10px] text-zinc-500 underline hover:text-zinc-300 block">
                          Change Snap
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 text-zinc-400">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                          <Upload className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">Drag & Drop Your Hair Photo Here</p>
                          <p className="text-xs text-zinc-500">or click to browse local files</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* fast snap assistant */}
                  {!imagePreview && (
                    <button
                      type="button"
                      onClick={handleDemoPhoto}
                      className="w-full py-2 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Simulate Live Camera Capture
                    </button>
                  )}
                </div>

                {/* Text entries */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      Your Name / Nickname
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Jeremy K."
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                        Style Name Received
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. South C Low Taper"
                        value={styleName}
                        onChange={(e) => setStyleName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                        Schooled By Barber
                      </label>
                      <select
                        value={selectedBarberId}
                        onChange={(e) => setSelectedBarberId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-all"
                      >
                        {BARBERS.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      Caption / Review Shoutout
                    </label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Felt elite, playlist was top drawer. Jane did a sublime job detailing the left part!"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-amber-500 text-black px-6 py-2.5 rounded-full font-display font-bold text-sm tracking-wide hover:bg-amber-400 transition-all"
                    >
                      Post with Pride <Sparkles className="w-4 h-4 fill-black text-black" />
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMMUNITY WALL POSTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuts.map((c) => (
          <div 
            key={c.id}
            className="bg-zinc-900 border border-zinc-805 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-zinc-950 border-b border-zinc-805 relative">
              <img 
                src={c.base64Image} 
                alt={c.styleName} 
                className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-300"
                referrerPolicy="no-referrer"
              />

              <div className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur-sm border border-zinc-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-zinc-300 text-[10px]">{c.styleName}</span>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-zinc-300 text-xs md:text-sm leading-relaxed italic">
                "{c.caption}"
              </p>

              <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-zinc-850 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <User className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs text-white font-medium">{c.uploaderName}</span>
                  </div>
                  
                  <span className="text-[10px] font-mono text-zinc-500">
                    By <strong className="text-amber-500">{c.barberName}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] font-mono text-zinc-600">{c.date}</span>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleLike(c.id)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-red-400 active:scale-90 transition-all font-mono"
                    >
                      <Heart className="w-4 h-4 fill-red-500/10 text-zinc-400 hover:text-red-400 hover:fill-red-500/10" />
                      <span>{c.likesCount}</span>
                    </button>
                    <button
                      onClick={() => alert(`Share link copied for ${c.uploaderName}'s fresh cut!`)}
                      className="text-zinc-500 hover:text-amber-400 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
