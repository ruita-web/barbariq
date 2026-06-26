import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Tag, BookOpen, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// @ts-ignore
import blogFade from '../assets/images/cut_fade.jpg';
// @ts-ignore
import blogBeard from '../assets/images/cut_beard.jpg';
// @ts-ignore
import blogDreads from '../assets/images/cut_dreads.jpg';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const SEED_BLOGS: BlogPost[] = [
  {
    id: 'bp1',
    title: "5 Reasons Why Every Nairobi Man Needs a Signature Fade",
    slug: 'nairobi-signature-fade-guide',
    imageUrl: blogFade,
    excerpt: 'From boardroom to barbershop, the signature fade is more than a style — it\'s a statement. Here\'s why every Nairobi gent needs one in his rotation.',
    content: `The signature fade has become the defining hairstyle of the modern Nairobi man. But why has this particular cut taken over the city's grooming scene with such force?

**1. Versatility That Works For Every Setting**

Whether you're closing deals in a CPA Centre boardroom or vibing at a rooftop lounge in Westlands, a well-executed fade transitions seamlessly. The gradient from skin to hair creates a clean, intentional look that says you care about details.

**2. Complements African Hair Textures Perfectly**

Our coarser, denser hair textures are actually an advantage when it comes to fades. The natural contrast between the faded sides and the textured top creates dimension that straight hair simply cannot achieve. Barbers like Musa Kamau have mastered the art of working with kinky and coily textures to produce gradients that look like works of art.

**3. Low Maintenance, High Impact**

Unlike other styles that require daily product and styling, a proper fade needs minimal upkeep between appointments. A quick morning splash and you're out the door. Just make sure you're back at Barbariq every 10-14 days for touch-ups.

**4. Customizable To Your Face Shape**

The beauty of a fade is that it can be tailored to complement your specific facial structure. Round faces benefit from height on top, square faces can pull off almost anything, and oval faces — well, you hit the genetic jackpot.

**5. It's Become A Cultural Marker**

In Nairobi 2026, a crisp fade is more than a haircut — it's part of the city's identity. From South C to Kilimani, the fade signals that you're dialed in, switched on, and moving with purpose.

**Book Your Signature Fade at Barbariq**

Ready to join the ranks of Nairobi's best-groomed men? Our master barbers are waiting at our Westlands and Kilimani lounges.`,
    author: 'Barbariq Editorial',
    date: '2026-06-10',
    tags: ['fade', 'nairobi style', 'grooming tips'],
    published: true
  },
  {
    id: 'bp2',
    title: "Beard Guide: Sculpting, Oils, and the Art of the Perfect Jawline",
    slug: 'beard-sculpting-guide',
    imageUrl: blogBeard,
    excerpt: 'Your beard is your frame. Here\'s how to maintain, sculpt, and elevate it with the right products and techniques used by Nairobi\'s top barbers.',
    content: `A great beard doesn't happen by accident. It requires intention, the right tools, and a barber who understands your facial structure. Here's your comprehensive guide to beard mastery.

**Finding Your Beard Style**

The first step is understanding what works for your face shape. A full sculpted beard adds width to narrow faces, while a shorter, tapered beard complements rounder features. Omari Juma, Barbariq's straight-razor specialist, recommends starting with what grows naturally densest and shaping from there.

**The Essential Beard Care Routine**

*Morning:*
- Rinse with warm water (no soap — it strips natural oils)
- Apply a few drops of sandalwood beard oil while damp
- Brush downward with a boar bristle brush to train the hairs

*Evening:*
- Wash with sulfate-free beard wash 2-3 times per week
- Apply beard butter before bed for deep conditioning
- Use a satin pillowcase to prevent breakage

**The Barbariq Treatment**

Every beard sculpt at Barbariq includes a hot towel prep to soften the hairs, a precision straight-razor cheek line, and a sandalwood oil finish. Our barbers are trained to work with all beard textures, from patchy to thick.

**Products We Recommend**

- Sandalwood Beard Hydrate-Oil: Deeply softens coarse follicles
- Barbariq Beeswax Balm: Light hold without greasy residue
- Organic Tea-Tree Wash: Cleanses without drying

Your beard is an investment. Treat it like one.`,
    author: 'Omari Juma',
    date: '2026-06-05',
    tags: ['beard', 'grooming', 'products'],
    published: true
  },
  {
    id: 'bp3',
    title: "The Alchemist Signature: Inside Barbariq's Most Popular Combo",
    slug: 'alchemist-signature-combo',
    imageUrl: blogDreads,
    excerpt: 'What makes the Alchemist Signature Combo Barbariq\'s most requested service? A deep dive into the 75-minute experience that defines Nairobi luxury grooming.',
    content: `The Alchemist Signature Combo isn't just a service — it's a ritual. Here's what happens during the 75 minutes that have made it Barbariq's most-booked experience.

**First 15 Minutes: Consultation & Coffee**

Your session begins with a genuine conversation about what you want. Our barbers study your hair texture, your face shape, and your lifestyle. Meanwhile, you're served a single-origin espresso — on the house.

**Next 35 Minutes: The South C Fade**

This is where the magic happens. Using clipper-over-comb techniques and precision shear work, your barber executes a flawless gradient fade. The result is seamless — no lines, no harsh transitions, just pure graduation.

**20 Minutes: Beard Sculpting**

With the same precision, your barber moves to your beard. Hot towels open the pores, straight razors define the cheek lines, and scissors shape the bulk. The sandalwood oil finish leaves you smelling like a king.

**Final 5 Minutes: The Reveal**

You're guided to the mirror for the big moment. This is when our barbers earn their reputation — the reaction is almost always the same: a slow nod of approval.

**Why It Works**

The Alchemist Combo works because it treats grooming as a complete experience, not a transaction. It's 75 minutes of focus, craft, and premium care — and it costs less than a dinner date.

Book yours at Barbariq Westlands or Kilimani.`,
    author: 'Barbariq Editorial',
    date: '2026-05-28',
    tags: ['services', 'combo', 'experience'],
    published: true
  }
];

function generateJsonLd(posts: BlogPost[], currentPost?: BlogPost) {
  if (currentPost) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: currentPost.title,
      description: currentPost.excerpt,
      author: { '@type': 'Person', name: currentPost.author },
      datePublished: currentPost.date,
      publisher: { '@type': 'Organization', name: 'BARBARIQ', url: 'https://barbariq.co.ke' }
    });
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'BARBARIQ Blog',
    description: 'Nairobi\'s premium grooming blog — style tips, barber guides, and Nairobi barbershop culture.',
    url: 'https://barbariq.co.ke/blog',
    publisher: { '@type': 'Organization', name: 'BARBARIQ' }
  });
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let loaded: BlogPost[] = [];
    const stored = localStorage.getItem('barbariq_blogs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed;
        }
      } catch (_) {}
    }
    // Merge: patch missing imageUrl on seed posts (from old stored data that lacks it)
    const seedMap = new Map(SEED_BLOGS.map(b => [b.id, b]));
    const merged = loaded.map(p => {
      const seed = seedMap.get(p.id);
      if (seed) {
        return { ...seed, ...p, imageUrl: seed.imageUrl };
      }
      return p;
    });
    // Add any seed posts not yet in stored data
    for (const seed of SEED_BLOGS) {
      if (!merged.some(p => p.id === seed.id)) {
        merged.push(seed);
      }
    }
    localStorage.setItem('barbariq_blogs', JSON.stringify(merged));
    setPosts(merged);
  }, []);

  useEffect(() => {
    const scriptId = 'blog-jsonld';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = selectedPost
      ? generateJsonLd(posts, selectedPost)
      : generateJsonLd(posts);
    document.head.appendChild(script);

    return () => { const s = document.getElementById(scriptId); if (s) s.remove(); };
  }, [selectedPost, posts]);

  const published = posts.filter(p => p.published);
  const filtered = search
    ? published.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : published;

  if (selectedPost) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-all text-sm font-display mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Blog
        </button>

        <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

          {selectedPost.imageUrl && (
            <div className="w-full h-56 md:h-72 overflow-hidden">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.title}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap gap-2">
              {selectedPost.tags.map(tag => (
                <span key={tag} className="text-[10px] font-mono bg-zinc-950 text-amber-400 px-2.5 py-1 rounded border border-zinc-800">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight">
              {selectedPost.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono border-b border-zinc-800 pb-4">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> {selectedPost.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {new Date(selectedPost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-zinc-300 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-line">
              {selectedPost.content}
            </div>
          </div>

          <div className="border-t border-zinc-800 px-6 md:px-8 py-4 bg-zinc-950/50">
            <p className="text-xs text-zinc-500 font-mono text-center">
              Originally published on {new Date(selectedPost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} by {selectedPost.author} &bull; BARBARIQ Nairobi
            </p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">BARBARIQ BLOG</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Grooming Stories & Style Guides</h1>
        <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto">
          Tips, trends, and tales from Nairobi's premium grooming lounge.
        </p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search blog posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, idx) => (
            <motion.article
              key={post.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              onClick={() => setSelectedPost(post)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group flex flex-col"
            >
              <div className="h-36 bg-zinc-950 overflow-hidden border-b border-zinc-800">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950">
                    <BookOpen className="w-10 h-10 text-amber-500/30" />
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] font-mono text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="font-display font-bold text-white text-sm md:text-base leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-zinc-700" />
          <p className="text-sm">No blog posts found{search ? ' matching your search' : ''}.</p>
        </div>
      )}
    </div>
  );
}
