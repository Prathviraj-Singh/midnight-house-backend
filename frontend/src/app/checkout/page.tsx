'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Truck, MapPin, Loader2, AlertCircle, CheckCircle2, CreditCard, Tag, X,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const C = {
  bg: '#E1D4C2',
  s1: '#BEB5A9',
  s2: '#A78D78',
  s3: '#6E473B',
  accent: '#291C0E',
};

const CAFE_LAT = 22.7533;
const CAFE_LNG = 75.8937;

interface CartItem {
  id: string;
  quantity: number;
  line_total: string;
}

interface CartResponse {
  items: CartItem[];
  subtotal: string;
}

interface OrderResponse {
  id: string;
  order_number: string;
  total_amount: string;
  status: string;
}

interface RazorpayOrderResponse {
  payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
}

interface CouponValidateResponse {
  valid: boolean;
  title: string;
  discount_percentage: number;
  applies_to: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type DeliveryType = 'DINE_IN' | 'DELIVERY';
type Stage = 'form' | 'creating-order' | 'paying' | 'success' | 'error';
type CouponStatus = 'idle' | 'checking' | 'applied' | 'invalid';

function CheckoutPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DINE_IN');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<CouponStatus>('idle');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResponse | null>(null);
  const [couponError, setCouponError] = useState('');

  const [stage, setStage] = useState<Stage>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get<CartResponse>('/cart/');
        setCart(res.data);
      } catch {
        setErrorMsg('Could not load your cart.');
      } finally {
        setIsLoadingCart(false);
      }
    };
    fetchCart();
  }, []);

  const detectLocation = useCallback(() => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await handlePinChange(lat, lng);
        setIsLocating(false);
      },
      () => {
        setLocationError('Could not detect your location. You can also set it manually on the map below.');
        setIsLocating(false);
      }
    );
  }, []);

  const handlePinChange = useCallback(async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      // address stays editable manually if this fails
    }
  }, []);

  // Coupons only apply to DINE_IN — clear any applied coupon if user switches to DELIVERY
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === 'DELIVERY') {
      setAppliedCoupon(null);
      setCouponStatus('idle');
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    setCouponStatus('checking');
    setCouponError('');

    try {
      const res = await api.post<CouponValidateResponse>('/offers/validate/', {
        coupon_code: code,
        applies_to: 'DINE_IN',
      });
      setAppliedCoupon(res.data);
      setCouponStatus('applied');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setCouponError(e?.response?.data?.detail || 'Invalid or expired coupon code.');
      setCouponStatus('invalid');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponStatus('idle');
    setCouponInput('');
    setCouponError('');
  };

  const subtotal = cart ? parseFloat(cart.subtotal) : 0;
  const tax = subtotal * 0.05;
  const preDiscountTotal = subtotal + tax;
  const discountAmount = appliedCoupon
    ? preDiscountTotal * (appliedCoupon.discount_percentage / 100)
    : 0;
  const total = preDiscountTotal - discountAmount;

  const handleCheckout = async () => {
    setErrorMsg('');

    if (deliveryType === 'DELIVERY') {
      if (!address.trim()) {
        setErrorMsg('Please enter your delivery address.');
        return;
      }
      if (!coords) {
        setErrorMsg('Please detect your location to calculate delivery distance.');
        return;
      }
    }

    setStage('creating-order');

    try {
      const orderPayload: Record<string, unknown> = { delivery_type: deliveryType };
      if (deliveryType === 'DELIVERY') {
        orderPayload.delivery_address = address.trim();
        orderPayload.delivery_latitude = coords?.lat;
        orderPayload.delivery_longitude = coords?.lng;
      }
      if (deliveryType === 'DINE_IN' && appliedCoupon) {
        orderPayload.coupon_code = couponInput.trim();
      }

      const orderRes = await api.post<OrderResponse>('/orders/create-from-cart/', orderPayload);
      const order = orderRes.data;

      setStage('paying');
      const rzpRes = await api.post<RazorpayOrderResponse>('/payments/create-order/', {
        payment_for: 'ORDER',
        payment_type: 'FULL',
        payment_method: 'UPI',
        amount: order.total_amount,
        order: order.id,
      });
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Midnight House',
        description: `Order ${order.order_number}`,
        order_id: rzpData.razorpay_order_id,
        prefill: {
          name: user ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          contact: user?.phone_number || '',
        },
        theme: { color: C.accent },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/payments/verify/', {
              payment_id: rzpData.payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setConfirmedOrder(order);
            setStage('success');
            window.dispatchEvent(new Event('cart-updated'));
          } catch {
            setErrorMsg('Payment verification failed. Please contact support if money was deducted.');
            setStage('error');
          }
        },
        modal: {
          ondismiss: () => {
            setStage('form');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(e?.response?.data?.detail || 'Checkout failed. Please try again.');
      setStage('error');
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="pt-32 pb-10 px-8 md:px-20 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: C.accent }}>
          Almost There
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Checkout
        </motion.h1>
      </header>

      <div className="px-8 md:px-20 pb-32">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">

            {stage === 'success' && confirmedOrder && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${C.accent}15` }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: C.accent }} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                  Order Confirmed
                </h2>
                <p className="text-sm mb-2" style={{ color: C.s3 }}>
                  Order <strong style={{ color: C.accent }}>#{confirmedOrder.order_number}</strong> has been placed successfully.
                </p>
                <p className="text-sm mb-8" style={{ color: C.s3 }}>
                  Total paid: ₹{parseFloat(confirmedOrder.total_amount).toFixed(0)}
                </p>
                <button
                  onClick={() => router.push('/menu')}
                  className="px-8 py-3 rounded-full text-sm font-semibold"
                  style={{ background: C.accent, color: C.bg }}
                >
                  Continue Browsing
                </button>
              </motion.div>
            )}

            {stage !== 'success' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {isLoadingCart ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.accent }} />
                  </div>
                ) : cart && cart.items.length > 0 ? (
                  <div className="rounded-2xl p-5 mb-6" style={{ background: `${C.s1}25`, border: `1px solid ${C.s2}50` }}>
                    <div className="flex justify-between text-sm mb-1" style={{ color: C.s3 }}>
                      <span>{cart.items.length} item(s)</span>
                      <span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2" style={{ color: C.s3 }}>
                      <span>Tax (5%)</span>
                      <span>₹{tax.toFixed(0)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm mb-2" style={{ color: '#3d7a4f' }}>
                        <span>Discount ({appliedCoupon.discount_percentage}% — {appliedCoupon.title})</span>
                        <span>−₹{discountAmount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="h-px my-2" style={{ background: `${C.s2}50` }} />
                    <div className="flex justify-between text-base font-bold" style={{ color: C.accent }}>
                      <span>Total</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: C.s3 }}>Your cart is empty.</p>
                  </div>
                )}

                {cart && cart.items.length > 0 && (
                  <>
                    <h2 className="text-sm font-medium mb-3" style={{ color: C.s3 }}>How would you like this?</h2>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        onClick={() => handleDeliveryTypeChange('DINE_IN')}
                        className="flex flex-col items-center gap-2 p-5 rounded-xl transition-all duration-300"
                        style={{
                          background: deliveryType === 'DINE_IN' ? `${C.accent}10` : `${C.s1}25`,
                          border: `1px solid ${deliveryType === 'DINE_IN' ? C.accent : C.s2}60`,
                        }}
                      >
                        <Store className="w-5 h-5" style={{ color: C.accent }} />
                        <span className="text-sm font-medium" style={{ color: C.accent }}>Dine In</span>
                      </button>
                      <button
                        onClick={() => handleDeliveryTypeChange('DELIVERY')}
                        className="flex flex-col items-center gap-2 p-5 rounded-xl transition-all duration-300"
                        style={{
                          background: deliveryType === 'DELIVERY' ? `${C.accent}10` : `${C.s1}25`,
                          border: `1px solid ${deliveryType === 'DELIVERY' ? C.accent : C.s2}60`,
                        }}
                      >
                        <Truck className="w-5 h-5" style={{ color: C.accent }} />
                        <span className="text-sm font-medium" style={{ color: C.accent }}>Delivery</span>
                      </button>
                    </div>

                    {deliveryType === 'DINE_IN' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                        <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                          Have a coupon code?
                        </label>

                        {appliedCoupon ? (
                          <div
                            className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl"
                            style={{ background: '#3d7a4f12', border: '1px solid #3d7a4f50' }}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5" style={{ color: '#3d7a4f' }} />
                              <span className="text-xs font-semibold" style={{ color: '#3d7a4f' }}>
                                {couponInput.trim().toUpperCase()} applied — {appliedCoupon.discount_percentage}% off
                              </span>
                            </div>
                            <button onClick={handleRemoveCoupon} aria-label="Remove coupon">
                              <X className="w-3.5 h-3.5" style={{ color: C.s3 }} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value);
                                if (couponStatus === 'invalid') {
                                  setCouponStatus('idle');
                                  setCouponError('');
                                }
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                              placeholder="Enter coupon code"
                              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none uppercase"
                              style={{
                                background: `${C.bg}90`,
                                border: `1px solid ${couponStatus === 'invalid' ? '#7a221f80' : `${C.s2}80`}`,
                                color: C.accent,
                              }}
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={!couponInput.trim() || couponStatus === 'checking'}
                              className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 disabled:opacity-50"
                              style={{ background: C.accent, color: C.bg }}
                            >
                              {couponStatus === 'checking' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </button>
                          </div>
                        )}

                        {couponError && (
                          <p className="text-[11px] mt-1.5" style={{ color: '#7a221f' }}>{couponError}</p>
                        )}
                      </motion.div>
                    )}

                    {deliveryType === 'DELIVERY' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 space-y-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                            Delivery Address <span style={{ fontWeight: 400, opacity: 0.7 }}>(please verify/edit if needed)</span>
                          </label>
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            placeholder="Flat / House no, Street, Landmark..."
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                            style={{ background: `${C.bg}90`, border: `1px solid ${C.s2}80`, color: C.accent }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: C.s3 }}>
                            Pin Your Exact Location <span style={{ fontWeight: 400, opacity: 0.7 }}>(drag the marker)</span>
                          </label>
                          <MapPicker
                            lat={coords?.lat ?? CAFE_LAT}
                            lng={coords?.lng ?? CAFE_LNG}
                            onChange={handlePinChange}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={detectLocation}
                            disabled={isLocating}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-300"
                            style={{ background: `${C.s1}40`, color: C.accent, border: `1px solid ${C.s2}` }}
                          >
                            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                            {coords ? 'Location Detected ✓' : 'Detect My Location'}
                          </button>
                        </div>

                        {locationError && (
                          <p className="text-xs" style={{ color: '#7a221f' }}>{locationError}</p>
                        )}

                        <p className="text-[11px]" style={{ color: C.s2 }}>
                          Delivery available within 5 KM of Vijay Nagar, Indore.
                        </p>
                      </motion.div>
                    )}

                    {errorMsg && (
                      <div className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6" style={{ background: '#7a221f15', color: '#7a221f' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={stage === 'creating-order' || stage === 'paying'}
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-60"
                      style={{ background: C.accent, color: C.bg }}
                    >
                      {stage === 'creating-order' && <><Loader2 className="w-4 h-4 animate-spin" /> Creating order…</>}
                      {stage === 'paying' && <><Loader2 className="w-4 h-4 animate-spin" /> Opening payment…</>}
                      {(stage === 'form' || stage === 'error') && <><CreditCard className="w-4 h-4" /> Pay ₹{total.toFixed(0)}</>}
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}