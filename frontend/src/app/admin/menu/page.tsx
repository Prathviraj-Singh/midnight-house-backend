'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Plus, Pencil, Trash2,
  Camera, X, Check, ToggleLeft, ToggleRight,
} from 'lucide-react';
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
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  is_available: boolean;
  is_featured: boolean;
  image: File | null;
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  category: '',
  is_available: true,
  is_featured: false,
  image: null,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false); // ✅ NEW FLAG
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.get<MenuItem[]>('/catalog/menu-items/'),
        api.get<Category[]>('/catalog/categories/'),
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch {
      setError('Could not load menu items.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddForm = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setRemoveImage(false); // ✅ RESET
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: String(item.category),
      is_available: item.is_available,
      is_featured: item.is_featured,
      image: null,
    });
    setImagePreview(item.image);
    setRemoveImage(false); // ✅ RESET
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setRemoveImage(false); // ✅ RESET
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    setRemoveImage(false); // ✅ Nai image — remove flag off
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      setError('Name, price and category are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      if (form.image || removeImage) {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('price', form.price);
        formData.append('category', form.category);
        formData.append('is_available', form.is_available ? 'true' : 'false');
        formData.append('is_featured', form.is_featured ? 'true' : 'false');

        if (form.image) {
          formData.append('image', form.image);
        } else if (removeImage) {
          formData.append('image', ''); // ✅ Empty = Django image null kar deta hai
        }

        if (editingItem) {
          await api.patch(`/catalog/menu-items/${editingItem.id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await api.post('/catalog/menu-items/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        const jsonData = {
          name: form.name,
          description: form.description,
          price: form.price,
          category: parseInt(form.category),
          is_available: form.is_available,
          is_featured: form.is_featured,
        };

        if (editingItem) {
          await api.patch(`/catalog/menu-items/${editingItem.id}/`, jsonData);
        } else {
          await api.post('/catalog/menu-items/', jsonData);
        }
      }

      setRemoveImage(false);
      closeForm();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      console.error('Save error:', e?.response?.data);
      setError('Could not save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/catalog/menu-items/${id}/`);
      fetchData();
    } catch {
      setError('Could not delete item.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    setTogglingId(item.id);
    try {
      await api.patch(`/catalog/menu-items/${item.id}/`, {
        is_available: !item.is_available,
      });
      fetchData();
    } catch {
      setError('Could not update availability.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: C.s3 }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
            Menu Management
          </h1>
        </div>
        <button onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
          style={{ background: C.accent, color: C.bg }}>
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6"
          style={{ background: '#7a221f15', color: '#7a221f' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.accent }} />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>

              <div className="h-40 relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.s2}, ${C.s3})` }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 opacity-30" style={{ color: C.bg }} />
                )}
                <button
                  onClick={() => handleToggleAvailable(item)}
                  disabled={togglingId === item.id}
                  className="absolute top-3 right-3 p-1.5 rounded-full transition-all"
                  style={{ background: `${C.bg}e0` }}
                  title={item.is_available ? 'Available' : 'Unavailable'}
                >
                  {togglingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.accent }} />
                  ) : item.is_available ? (
                    <ToggleRight className="w-4 h-4" style={{ color: '#2d5a2d' }} />
                  ) : (
                    <ToggleLeft className="w-4 h-4" style={{ color: '#7a221f' }} />
                  )}
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm leading-snug flex-1 mr-2"
                    style={{ color: C.accent, fontFamily: "'Playfair Display', serif" }}>
                    {item.name}
                  </h3>
                  <span className="text-sm font-bold shrink-0" style={{ color: C.accent }}>
                    ₹{parseFloat(item.price).toFixed(0)}
                  </span>
                </div>

                <p className="text-xs mb-3 line-clamp-2" style={{ color: C.s3 }}>
                  {item.description || 'No description'}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: item.is_available ? '#2d5a2d15' : '#7a221f15',
                      color: item.is_available ? '#2d5a2d' : '#7a221f',
                    }}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditForm(item)}
                      className="p-2 rounded-full transition-all"
                      style={{ background: `${C.s1}50`, color: C.accent }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                      className="p-2 rounded-full transition-all"
                      style={{ background: '#7a221f15', color: '#7a221f' }}>
                      {deletingId === item.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }}
              onClick={closeForm} />

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 40 }} exit={{ opacity: 0, y: 40 }}
                className="fixed inset-4 z-50 rounded-2xl overflow-y-auto"
                style={{ background: C.bg, border: `1px solid ${C.s2}50` }}>

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </h2>
                  <button onClick={closeForm} className="p-2 rounded-full"
                    style={{ background: `${C.s1}50`, color: C.accent }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: C.s3 }}>
                      Photo
                    </label>
                    <div className="relative">
                      {imagePreview ? (
                        <div className="relative h-40 rounded-xl overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setForm(p => ({ ...p, image: null }));
                              setRemoveImage(true); // ✅ FLAG SET
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full"
                            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300"
                          style={{ border: `2px dashed ${C.s2}`, color: C.s3 }}>
                          <Camera className="w-6 h-6" />
                          <span className="text-xs">Tap to take photo or choose from gallery</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Item Name *</label>
                    <input type="text" value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="e.g. Midnight Fudge Brownie Shake" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Description</label>
                    <textarea value={form.description} rows={2}
                      onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                      placeholder="Ingredients, taste, highlights..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Price (₹) *</label>
                      <input type="number" value={form.price}
                        onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}
                        placeholder="199" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>Category *</label>
                      <select value={form.category}
                        onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: `${C.s1}30`, border: `1px solid ${C.s2}80`, color: C.accent }}>
                        <option value="">Select...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_available}
                        onChange={(e) => setForm(p => ({ ...p, is_available: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <span className="text-xs" style={{ color: C.s3 }}>Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_featured}
                        onChange={(e) => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <span className="text-xs" style={{ color: C.s3 }}>Featured</span>
                    </label>
                  </div>

                  <button onClick={handleSubmit} disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                    style={{ background: C.accent, color: C.bg }}>
                    {isSubmitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Check className="w-4 h-4" />}
                    {editingItem ? 'Save Changes' : 'Add to Menu'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}