'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2, AlertCircle, Search, Tag, Copy, Check as CheckIcon } from 'lucide-react';
import api from '@/lib/api';

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string | null;
  is_available: boolean;
  is_featured: boolean;
  category: number;
  subcategory: number | null;
  created_at: string;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  applies_to: 'DINE_IN' | 'THEATER';
  discount_percentage: number;
  coupon_code: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

// ── Offers Strip ─────────────────────────────────────────────────────────────
function OffersStrip({ offers }: { offers: Offer[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (offers.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="px-8 md:px-20 mb-8">
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <p className="text-[10px] tracking-widest uppercase mb-3 text-center font-medium" style={{ color: C.s3 }}>
          Active Offers
        </p>

        {/* Horizontal scroll strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {offers.map((offer) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer select-none"
              style={{
                background: `${C.s1}30`,
                border: `1px solid ${C.s2}60`,
                minWidth: '220px',
              }}
              onClick={() => handleCopy(offer.coupon_code)}
              whileTap={{ scale: 0.97 }}
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: C.accent }}>
                <Tag className="w-3.5 h-3.5" style={{ color: C.bg }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                  {offer.discount_percentage}% OFF — {offer.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: C.s3 }}>
                    {offer.coupon_code}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background: offer.applies_to === 'DINE_IN' ? '#2d5a2d15' : '#1a2d5a15',
                    color: offer.applies_to === 'DINE_IN' ? '#2d5a2d' : '#1a2d5a',
                  }}>
                    {offer.applies_to === 'DINE_IN' ? 'Dine In' : 'Theater'}
                  </span>
                </div>
              </div>

              {/* Copy icon */}
              <div className="shrink-0">
                {copiedCode === offer.coupon_code
                  ? <CheckIcon className="w-3.5 h-3.5" style={{ color: '#2d5a2d' }} />
                  : <Copy className="w-3.5 h-3.5" style={{ color: C.s2 }} />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Copied toast */}
        <AnimatePresence>
          {copiedCode && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs mt-2 font-medium"
              style={{ color: '#2d5a2d' }}
            >
              ✓ {copiedCode} copied to clipboard!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [catRes, itemRes, offersRes] = await Promise.all([
          api.get<Category[]>('/catalog/categories/'),
          api.get<MenuItem[]>('/catalog/menu-items/'),
          api.get<Offer[]>('/offers/'),
        ]);
        setCategories(catRes.data);
        setItems(itemRes.data);

        // Sirf active aur non-expired offers dikhao
        const now = new Date();
        const activeOffers = offersRes.data.filter(
          o => o.is_active && new Date(o.valid_until) > now
        );
        setOffers(activeOffers);
      } catch {
        setError('Could not load the menu right now. Please try again in a moment.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch && item.is_available;
    });
  }, [items, activeCategory, search]);

  const handleAddToCart = async (menuItemId: string) => {
    try {
      await api.post('/cart/items/', { menu_item: menuItemId, quantity: 1 });
      setAddedItemId(menuItemId);
      setTimeout(() => setAddedItemId(null), 1500);
    } catch {
      // 401 — interceptor handles redirect
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>

      {/* Header */}
      <header className="pt-32 pb-12 px-8 md:px-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Crafted Fresh
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="font-bold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: C.accent }}>
          Our Menu
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm max-w-lg mx-auto" style={{ color: C.s3 }}>
          Dine-in or delivered within 5 KM. Every item made fresh, served right.
        </motion.p>
      </header>

      {/* ✅ Offers Strip — header ke baad, search se pehle */}
      {!isLoading && <OffersStrip offers={offers} />}

      {/* Search bar */}
      <div className="px-8 md:px-20 mb-8">
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.s3 }} />
          <input
            type="text" placeholder="Search the menu..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full pl-11 pr-4 py-3 text-sm outline-none transition-all duration-200"
            style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}60`, color: C.accent }} />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-8 md:px-20 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => setActiveCategory('all')}
            className="px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
            style={{
              background: activeCategory === 'all' ? C.accent : `${C.s1}30`,
              color: activeCategory === 'all' ? C.bg : C.s3,
              border: `1px solid ${activeCategory === 'all' ? C.accent : C.s2}`,
            }}>
            All Items
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="px-5 py-2 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300"
              style={{
                background: activeCategory === cat.id ? C.accent : `${C.s1}30`,
                color: activeCategory === cat.id ? C.bg : C.s3,
                border: `1px solid ${activeCategory === cat.id ? C.accent : C.s2}`,
              }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-7xl mx-auto">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.accent }} />
              <p className="text-sm" style={{ color: C.s3 }}>Loading the menu…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <AlertCircle className="w-8 h-8" style={{ color: '#7a221f' }} />
              <p className="text-sm" style={{ color: '#7a221f' }}>{error}</p>
            </div>
          )}

          {!isLoading && !error && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
              <p className="text-lg font-medium" style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                No items found
              </p>
              <p className="text-sm" style={{ color: C.s3 }}>Try a different category or search term.</p>
            </div>
          )}

          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>

                    <div className="h-44 relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${C.s2} 0%, ${C.s3} 100%)` }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs tracking-widest uppercase opacity-40" style={{ color: C.bg }}>
                            {item.name.split(' ')[0]}
                          </span>
                        </div>
                      )}
                      {item.is_featured && (
                        <span className="absolute top-3 left-3 text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full z-10"
                          style={{ background: C.accent, color: C.bg }}>
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-base mb-1.5 leading-snug"
                        style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                        {item.name}
                      </h3>
                      <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: C.s3 }}>
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold"
                          style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                          ₹{parseFloat(item.price).toFixed(0)}
                        </span>
                        <button onClick={() => handleAddToCart(item.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300"
                          style={{ background: addedItemId === item.id ? '#3a6e3a' : C.accent, color: C.bg }}>
                          {addedItemId === item.id ? 'Added ✓' : <><ShoppingBag className="w-3.5 h-3.5" />Add</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}