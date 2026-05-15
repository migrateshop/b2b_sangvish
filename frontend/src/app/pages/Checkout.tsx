'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './Checkout.module.css';

import { getImgUrl } from '@/utils/imageConfig';
import GoogleAddressAutocomplete from '@/components/js/GoogleAddressAutocomplete';

interface CheckoutData {
    product?: any;
    bookingDetails?: any;
    cartItems?: any[];
    isQuote?: boolean;
    quote?: any;
    rfq?: any;
}

interface Country {
    _id: string;
    name: string;
    countryCode: string;
}

interface State {
    _id: string;
    name: string;
}

interface Address {
    _id: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    country: string;
    country_code: string;
    postalCode: string;
    isDefault: boolean;
    lat?: number;
    lng?: number;
}

interface CheckoutItem {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image: string;
    productId?: string;
    variantOptions?: any;
}

const Checkout = () => {
    const location = usePathname();
    const navigate = useRouter();
    const { convertPrice, user, currency, t, siteSettings } = useAuth();
    const { showToast } = useToast();
    const [checkoutData, setCheckoutData] = useState<CheckoutData>({});
    const { product, bookingDetails, cartItems, isQuote, quote, rfq } = checkoutData;

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).checkoutState) {
            setCheckoutData((window as any).checkoutState);
        }
    }, []);

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [street, setStreet] = useState('');
    const [apartment, setApartment] = useState('');
    const [fullName, setFullName] = useState('');
    const [stateVal, setStateVal] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState(user?.country_code || 'IN');
    const [taxInfo, setTaxInfo] = useState({ amount: 0, name: '' });
    const [commissionInfo, setCommissionInfo] = useState({ amount: 0, name: '' });
    const [paymentMethod, setPaymentMethod] = useState('');
    const [enabledMethods, setEnabledMethods] = useState<any[]>([]);
    const [protectionOpen, setProtectionOpen] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [isDefault, setIsDefault] = useState(false);
    const [addressSaving, setAddressSaving] = useState(false);
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);

    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const { data } = await api.get('/payment-methods/public');
                setEnabledMethods(data);
                if (data.length > 0) {
                    const hasStripe = data.some((m: any) => m.provider === 'stripe');
                    setPaymentMethod(hasStripe ? 'stripe' : data[0].provider);
                }
            } catch (err) {
                console.error('Failed to fetch payment methods:', err);
            }
        };

        const fetchCountries = async () => {
            try {
                const { data } = await api.get('/common/countries');
                setCountries(data);
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };

        const fetchAddresses = async () => {
            try {
                const { data } = await api.get('/shipping-address');
                setSavedAddresses(data);
                const defaultAddr = data.find((addr: Address) => addr.isDefault) || data[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id);
                    setStreet(defaultAddr.addressLine || '');
                    setCity(defaultAddr.city || '');
                    setStateVal(defaultAddr.state || '');
                    setPostalCode(defaultAddr.postalCode || '');
                    setPhone(defaultAddr.phone || '');
                    setFullName(defaultAddr.fullName || '');
                    setCountry(defaultAddr.country_code || defaultAddr.country || user?.country_code || 'IN');

                    const cObj = data.find((c: Country) => c.name === defaultAddr.country || c.countryCode === defaultAddr.country_code);
                    if (cObj) {
                        const { data: stData } = await api.get(`/common/states/${cObj._id}`);
                        setStates(stData);
                    }
                } else {
                    setIsEditingAddress(true);
                }
            } catch (err) {
                console.error('Failed to fetch shipping addresses:', err);
                setIsEditingAddress(true);
            }
        };

        fetchMethods();
        fetchCountries();
        fetchAddresses();
    }, [user]);

    const fetchStates = async (countryId: string) => {
        if (!countryId) { setStates([]); return; }
        try {
            const { data } = await api.get(`/common/states/${countryId}`);
            setStates(data);
        } catch (err) {
            console.error('Failed to fetch states:', err);
        }
    };

    const handleCountryChange = (val: string) => {
        setCountry(val);
        setStateVal('');
        const selectedC = countries.find(c => c.countryCode === val || c.name === val || c._id === val);
        if (selectedC) fetchStates(selectedC._id);
    };

    const handleAddressSelect = (data: any) => {
        setStreet(data.addressLine || data.formatted_address);
        if (data.city) setCity(data.city);
        if (data.state) setStateVal(data.state);
        if (data.postalCode) setPostalCode(data.postalCode);
        if (data.country) handleCountryChange(data.country);
        if (data.lat) setLat(data.lat);
        if (data.lng) setLng(data.lng);
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) { showToast('Geolocation not supported.', 'error'); return; }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
                setLat(latitude);
                setLng(longitude);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();
                    const addr = data.address || {};
                    const road = addr.road || addr.pedestrian || addr.footway || '';
                    setStreet(`${addr.house_number || ''} ${road}`.trim() || data.display_name?.split(',')[0] || '');
                    setCity(addr.city || addr.town || addr.village || addr.county || '');

                    const countryName = addr.country;
                    const matchedC = countries.find(c => c.name.toLowerCase() === countryName?.toLowerCase());
                    if (matchedC) {
                        setCountry(matchedC.countryCode || matchedC.name);
                        fetchStates(matchedC._id);
                        if (addr.state) setStateVal(addr.state);
                    } else {
                        setStateVal(addr.state || addr.region || '');
                    }
                    setPostalCode(addr.postcode || '');
                } catch { showToast('Could not fetch address. Please enter manually.', 'info'); }
                finally { setLocationLoading(false); }
            },
            () => {
                setLocationLoading(false);
                showToast('Unable to retrieve location.', 'error');
            }
        );
    };

    const checkoutItems: CheckoutItem[] = isQuote
        ? [{
            name: `RFQ: as per your request`,
            description: rfq?.sourcing_purpose || 'Custom Quote fulfillment',
            price: quote?.price_offered || 0,
            quantity: rfq?.quantity || 1,
            image: getImgUrl(rfq?.attachments?.[0]),
            variantOptions: null
        }]
        : cartItems
            ? cartItems.map(item => ({ 
                productId: item.productId, 
                quantity: item.quantity, 
                variantOptions: item.variants, 
                name: item.name, 
                price: item.price, 
                image: getImgUrl(item.image) 
            }))
            : [{
                productId: product?._id,
                quantity: bookingDetails?.quantity,
                variantOptions: bookingDetails?.selectedVariants || bookingDetails?.variantQtys,
                name: product?.name,
                price: bookingDetails?.unitPrice,
                image: getImgUrl(product?.images?.[0] || product?.main_image),
                customizationId: bookingDetails?.customizationId
            }];

    const shippingFee = bookingDetails?.shippingFee || 0;
    const itemSubtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    useEffect(() => {
        const fetchTaxAndCommission = async () => {
            if (itemSubtotal <= 0) return;
            try {
                const taxRes = await api.post('/tax/calculate', {
                    country_code: country,
                    amount: itemSubtotal
                });
                setTaxInfo({ amount: taxRes.data.tax_amount, name: taxRes.data.tax_rule?.name || 'Tax' });

                const firstCategory = product?.category?.title || cartItems?.[0]?.category || '';
                const commRes = await api.post('/commissions/calculate', {
                    amount: itemSubtotal,
                    category: firstCategory
                });
                setCommissionInfo({ amount: commRes.data.commission_amount, name: commRes.data.rule_name || 'Service Fee' });

            } catch (err) {
                console.error('Calculation error:', err);
            }
        };
        fetchTaxAndCommission();
    }, [country, itemSubtotal, product, cartItems]);

    if (!cartItems && (!product || !bookingDetails) && !isQuote) {
        return (
            <div className={styles['container'] + " " + styles['mt-20'] + " " + styles['text-center'] + " " + styles['py-20'] + " " + styles['bg-white'] + " " + styles['shadow-md'] + " " + styles['rounded-xl'] + " " + styles['max-w-2xl'] + " " + styles['mx-auto']}>
                <h2 className={styles['text-2xl'] + " " + styles['font-bold'] + " " + styles['text-gray-800'] + " " + styles['mb-4']}>Your checkout is currently empty</h2>
                <button onClick={() => navigate.push('/')} className={styles['co-btn-pay'] + " " + styles['px-10'] + " " + styles['py-3']}>Return to home</button>
            </div>
        );
    }

    const orderTotal = itemSubtotal + shippingFee + taxInfo.amount;
    const processingFee = commissionInfo.amount;
    const finalTotal = orderTotal + processingFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const shippingAddress = {
                fullName,
                phone,
                addressLine: street,
                city,
                state: stateVal,
                country: countries.find(c => c.countryCode === country || c.name === country)?.name || country,
                postalCode,
                lat,
                lng
            };

            let response;
            if (isQuote) {
                response = await api.post(`/orders/checkout-quote/${quote._id}`, {
                    countryCode: country,
                    shippingAddress,
                    paymentMethod
                });
            } else {
                response = await api.post('/orders/create-checkout-session', {
                    items: checkoutItems,
                    shippingFee,
                    countryCode: country,
                    shippingAddress,
                    paymentMethod
                });
            }

            const { data } = response;

            if (data.url) {
                window.location.href = data.url;
            } else if (paymentMethod === 'razorpay') {
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: data.currency,
                    name: "B2B Marketplace",
                    description: isQuote ? "RFQ Quote Payment" : "Order Checkout",
                    order_id: data.id,
                    handler: async function (response: any) {
                        try {
                            const verifyData = {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            };
                            await api.post('/orders/verify-razorpay', verifyData);
                            navigate.push('/dashboard?status=success');
                        } catch (err) {
                            showToast('Verification failed. Please contact support.', 'error');
                        }
                    },
                    prefill: {
                        name: fullName,
                        email: user?.email,
                        contact: phone
                    },
                    theme: {
                        color: "#ff6600"
                    }
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
                setLoading(false);
            } else if (paymentMethod === 'bank_transfer' || paymentMethod === 'cod') {
                showToast('Order placed successfully. Please complete payment as instructed.', 'success');
                navigate.push('/dashboard?tab=orders');
            }
        } catch (err) {
            console.error(err);
            showToast('Could not start checkout. Please try again.', 'error');
            setLoading(false);
        }
    };

    const handleSelectSavedAddress = async (addr: Address) => {
        setFullName(addr.fullName || '');
        setPhone(addr.phone || '');
        setStreet(addr.addressLine || '');
        setCity(addr.city || '');
        setPostalCode(addr.postalCode || '');
        setIsDefault(addr.isDefault || false);

        const cVal = addr.country_code || addr.country || 'IN';
        setCountry(cVal);

        const cObj = countries.find(c => c.countryCode === cVal || c.name === addr.country || c._id === addr.country);
        if (cObj) {
            await fetchStates(cObj._id);
            setStateVal(addr.state || '');
        } else {
            setStateVal(addr.state || '');
        }

        if (addr.lat) setLat(addr.lat);
        if (addr.lng) setLng(addr.lng);

        setSelectedAddressId(addr._id);
        setIsEditingAddress(false);
    };

    const handleSaveAddress = async () => {
        if (!fullName || !street || !city || !stateVal || !postalCode || !phone) {
            showToast('Please fill all required fields', 'warning');
            return;
        }
        setAddressSaving(true);
        try {
            const payload = {
                fullName,
                phone,
                addressLine: street,
                city,
                state: stateVal,
                country: countries.find(c => c.countryCode === country || c.name === country)?.name || country,
                country_code: country,
                postalCode,
                isDefault,
                lat,
                lng
            };

            if (selectedAddressId) {
                await api.put(`/shipping-address/${selectedAddressId}`, payload);
            } else {
                const { data } = await api.post('/shipping-address', payload);
                setSelectedAddressId(data._id);
            }

            const { data: refreshed } = await api.get('/shipping-address');
            setSavedAddresses(refreshed);

            setIsEditingAddress(false);
            showToast('Address saved successfully', 'success');
        } catch (err) {
            console.error('Failed to save address:', err);
            showToast('Could not save address. Proceeding with checkout.', 'info');
            setIsEditingAddress(false);
        } finally {
            setAddressSaving(false);
        }
    };

    const countryObj = countries.find(c => c.countryCode === country || c.name === country || c._id === country);
    const countryName = countryObj ? countryObj.name : country;

    const fullAddress = [street, apartment, city, stateVal, countryName, postalCode].filter(Boolean).join(', ');

    return (
        <div className={styles['co-page']}>
            {/* Header */}
            <div className={styles['co-header']}>
                <div className={styles['co-header-inner']}>
                    <h1 className={styles['co-header-title']}>{t('checkout') || 'Checkout'}</h1>
                </div>
            </div>

            <div className={styles['co-body']}>
                <form onSubmit={handleSubmit} className={styles['co-layout']}>

                    {/* ── LEFT COLUMN ─────────────────────────── */}
                    <div className={styles['co-left']}>

                        {/* Shipping Address */}
                        <section className={styles['co-section']}>
                            <div className={styles['co-section-header']}>
                                <h2 className={styles['co-section-title']}>{t('shipping_address') || 'Shipping address'}</h2>
                                {savedAddresses.length > 0 && !isEditingAddress && (
                                    <button type="button" className={styles['co-change-btn']} onClick={() => setIsEditingAddress(true)}>
                                        {t('change') || 'Change'}
                                    </button>
                                )}
                            </div>

                            {isEditingAddress ? (
                                <div className={styles['co-address-editor']}>
                                    {savedAddresses.length > 0 && (
                                        <div className={styles['co-saved-list']} style={{ marginBottom: '1.5rem' }}>
                                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Select a saved address</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr._id}
                                                        className={`${styles['co-address-card']} ${selectedAddressId === addr._id ? styles['active'] : ''}`}
                                                        onClick={() => handleSelectSavedAddress(addr)}
                                                    >
                                                        <p className={styles['co-addr-name']}>{addr.fullName}</p>
                                                        <p className={styles['co-addr-line'] + " " + styles['line-clamp-1']}>{addr.addressLine}, {addr.city}</p>
                                                        {selectedAddressId === addr._id && <span className={styles['co-check-mark']}>✓</span>}
                                                    </div>
                                                ))}
                                                <div
                                                    className={styles['co-address-card'] + " " + styles['add-new']}
                                                    onClick={() => {
                                                        setSelectedAddressId(null);
                                                        setStreet(''); setCity(''); setStateVal(''); setPostalCode(''); setPhone(''); setFullName(''); setApartment('');
                                                    }}
                                                >
                                                    <span>+ Use different address</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles['co-form-grid']}>
                                        <div className={styles['co-field'] + " " + styles['co-field-full']}>
                                            <label>Country / region</label>
                                            <select
                                                className={styles['co-input']}
                                                value={country}
                                                onChange={(e) => handleCountryChange(e.target.value)}
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map(c => (
                                                    <option key={c._id} value={c.countryCode || c.name}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles['co-field']}>
                                            <label>First & Last name *</label>
                                            <input type="text" className={styles['co-input']} required value={fullName} onChange={e => setFullName(e.target.value)} />
                                        </div>
                                        <div className={styles['co-field']}>
                                            <label>Phone number *</label>
                                            <div className={styles['co-phone-wrap']}>
                                                <span className={styles['co-phone-prefix']}>+91</span>
                                                <input type="tel" className={styles['co-input'] + " " + styles['co-phone-input']} required value={phone} onChange={e => setPhone(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles['co-field'] + " " + styles['co-field-full'] + " " + styles['co-field-relative']}>
                                            <label>Street address or P.O. box *</label>
                                            <GoogleAddressAutocomplete
                                                onAddressSelect={handleAddressSelect}
                                                placeholder="Search for address..."
                                                className={styles['co-input'] + " " + styles['co-input-loc']}
                                            />
                                            <button type="button" className={styles['co-loc-btn']} onClick={handleUseMyLocation} disabled={locationLoading}>
                                                {locationLoading ? 'Detecting...' : 'Use my current location'}
                                            </button>
                                        </div>
                                        <div className={styles['co-field'] + " " + styles['co-field-full']}>
                                            <label>Apartment, suite, floor (optional)</label>
                                            <input type="text" className={styles['co-input']} value={apartment} onChange={e => setApartment(e.target.value)} />
                                        </div>
                                        <div className={styles['co-field']}>
                                            <label>State / province *</label>
                                            {states.length > 0 ? (
                                                <select
                                                    className={styles['co-input']}
                                                    required
                                                    value={stateVal}
                                                    onChange={e => setStateVal(e.target.value)}
                                                >
                                                    <option value="">Select State</option>
                                                    {states.map(s => (
                                                        <option key={s._id} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input type="text" className={styles['co-input']} required value={stateVal} onChange={e => setStateVal(e.target.value)} />
                                            )}
                                        </div>
                                        <div className={styles['co-field']}>
                                            <label>City *</label>
                                            <input type="text" className={styles['co-input']} required value={city} onChange={e => setCity(e.target.value)} />
                                        </div>
                                        <div className={styles['co-field']}>
                                            <label>Postal code *</label>
                                            <input type="text" className={styles['co-input']} required value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                                        </div>
                                        <div className={styles['co-field'] + " " + styles['co-field-full'] + " " + styles['co-checkbox-row']}>
                                            <input
                                                type="checkbox"
                                                id="def-addr"
                                                checked={isDefault}
                                                onChange={e => setIsDefault(e.target.checked)}
                                            />
                                            <label htmlFor="def-addr" className={styles['co-checkbox-label']}>Set as default shipping address</label>
                                        </div>
                                        <div className={styles['co-field'] + " " + styles['co-field-full']}>
                                            <button
                                                type="button"
                                                className={styles['co-btn-save-addr']}
                                                onClick={handleSaveAddress}
                                                disabled={addressSaving}
                                            >
                                                {addressSaving ? 'Saving...' : 'Use this address'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles['co-address-display']}>
                                    <p className={styles['co-address-name']}>{fullName || `${user?.first_name} ${user?.last_name}`} {phone && <span className={styles['co-address-phone']}>({phone})</span>}</p>
                                    <p className={styles['co-address-line']}>{fullAddress}</p>
                                </div>
                            )}
                        </section>

                        {/* Payment Method */}
                        <section className={styles['co-section']}>
                            <div className={styles['co-section-header']}>
                                <h2 className={styles['co-section-title']}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('payment_method') || 'Payment method'}
                                </h2>
                            </div>

                            <div className={styles['co-payment-options']}>
                                {enabledMethods.some(m => m.provider === 'stripe') && (
                                    <label
                                        className={`${styles['co-payment-row-v2']} ${paymentMethod === 'stripe' ? styles['active'] : ''}`}
                                        onClick={() => setPaymentMethod('stripe')}
                                    >
                                        <input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'} readOnly />
                                        <div className={styles['co-pay-info']}>
                                            <span className={styles['co-pay-title']}>Stripe (Credit / Debit Card)</span>
                                        </div>
                                        <div className={styles['co-pay-check']}>
                                            {paymentMethod === 'stripe' && <div className={styles['dot']}></div>}
                                        </div>
                                    </label>
                                )}

                                {enabledMethods.some(m => m.provider === 'paypal') && (
                                    <label
                                        className={`${styles['co-payment-row-v2']} ${paymentMethod === 'paypal' ? styles['active'] : ''}`}
                                        onClick={() => setPaymentMethod('paypal')}
                                    >
                                        <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'} readOnly />
                                        <div className={styles['co-pay-info']}>
                                            <span className={styles['co-pay-title']}>PayPal</span>
                                        </div>
                                        <div className={styles['co-pay-check']}>
                                            {paymentMethod === 'paypal' && <div className={styles['dot']}></div>}
                                        </div>
                                    </label>
                                )}

                                {enabledMethods.some(m => m.provider === 'razorpay') && (
                                    <label
                                        className={`${styles['co-payment-row-v2']} ${paymentMethod === 'razorpay' ? styles['active'] : ''}`}
                                        onClick={() => setPaymentMethod('razorpay')}
                                    >
                                        <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} readOnly />
                                        <div className={styles['co-pay-info']}>
                                            <span className={styles['co-pay-title']}>Razorpay</span>
                                        </div>
                                        <div className={styles['co-pay-check']}>
                                            {paymentMethod === 'razorpay' && <div className={styles['dot']}></div>}
                                        </div>
                                    </label>
                                )}

                                {enabledMethods.some(m => m.provider === 'bank_transfer') && (
                                    <label
                                        className={`${styles['co-payment-row-v2']} ${paymentMethod === 'bank_transfer' ? styles['active'] : ''}`}
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                    >
                                        <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} readOnly />
                                        <div className={styles['co-pay-info']}>
                                            <span className={styles['co-pay-title']}>Bank Transfer</span>
                                        </div>
                                        <div className={styles['co-pay-check']}>
                                            {paymentMethod === 'bank_transfer' && <div className={styles['dot']}></div>}
                                        </div>
                                    </label>
                                )}

                                {enabledMethods.some(m => m.provider === 'cod') && (
                                    <label
                                        className={`${styles['co-payment-row-v2']} ${paymentMethod === 'cod' ? styles['active'] : ''}`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} readOnly />
                                        <div className={styles['co-pay-info']}>
                                            <span className={styles['co-pay-title']}>Cash on Delivery</span>
                                        </div>
                                        <div className={styles['co-pay-check']}>
                                            {paymentMethod === 'cod' && <div className={styles['dot']}></div>}
                                        </div>
                                    </label>
                                )}

                                {enabledMethods.length === 0 && (
                                    <p className={styles['co-no-methods']}>No payment methods available.</p>
                                )}
                            </div>
                        </section>

                        {/* Items & Delivery */}
                        <section className={styles['co-section']}>
                            <h2 className={styles['co-section-title']} style={{ marginBottom: '12px' }}>{t('items_and_delivery') || 'Items and delivery options'}</h2>
                            {checkoutItems.map((item, idx) => (
                                <div key={idx} className={styles['co-item-row']} style={{ marginBottom: idx < checkoutItems.length - 1 ? '16px' : '0', borderBottom: idx < checkoutItems.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: idx < checkoutItems.length - 1 ? '16px' : '0' }}>
                                    <div className={styles['co-item-img-wrap']}>
                                        <img src={item.image} alt="" className={styles['co-item-img']} />
                                        <span className={styles['co-item-qty-badge']}>{item.quantity}</span>
                                    </div>
                                    <div className={styles['co-item-info']}>
                                        <p className={styles['co-item-name']}>{item.name}</p>
                                        {item.variantOptions && Object.entries(item.variantOptions).map(([k, v]) => (
                                            <span key={k} className={styles['co-item-variant']}>{k}: {String(v)}</span>
                                        ))}
                                    </div>
                                    <div className={styles['co-item-price']}>{convertPrice(item.price * item.quantity).formatted}</div>
                                </div>
                            ))}
                        </section>

                        {/* Submit */}
                        <div className={styles['co-submit-row']}>
                            <button type="submit" disabled={loading} className={styles['co-btn-pay']}>
                                {loading ? 'Processing...' : (t('continue_to_payment') || 'Continue to payment')}
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ─────────────────────────── */}
                    <div className={styles['co-right']}>
                        <div className={styles['co-summary-card']}>
                            <h2 className={styles['co-summary-title']}>{t('order_summary') || 'Order summary'} ({checkoutItems.length} item{checkoutItems.length > 1 ? 's' : ''})</h2>

                            {/* Product thumbs list */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                                {checkoutItems.map((item, idx) => (
                                    <div key={idx} className={styles['co-summary-product']} style={{ marginBottom: '8px' }}>
                                        <div className={styles['co-item-img-wrap']} style={{ width: '40px', height: '40px' }}>
                                            <img src={item.image} alt="" className={styles['co-item-img']} />
                                            <span className={styles['co-item-qty-badge']}>{item.quantity}</span>
                                        </div>
                                        <div style={{ flex: 1, fontSize: '12px', color: '#333', lineHeight: '1.4' }}>{item.name}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Price rows */}
                            <div className={styles['co-summary-rows']}>
                                <div className={styles['co-summary-row']}>
                                    <span>{t('merchandise_total') || 'Item subtotal'}</span>
                                    <span>{convertPrice(itemSubtotal).formatted}</span>
                                </div>
                                <div className={styles['co-summary-row']}>
                                    <span>{t('estimated_shipping') || 'Shipping fee'}</span>
                                    <span>{convertPrice(shippingFee).formatted}</span>
                                </div>
                                {taxInfo.amount > 0 && (
                                    <div className={styles['co-summary-row']}>
                                        <span>{t('tax') || 'Tax'} ({taxInfo.name})</span>
                                        <span>{convertPrice(taxInfo.amount).formatted}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles['co-summary-rows'] + " " + styles['co-summary-sub']}>
                                <div className={styles['co-summary-row'] + " " + styles['co-bold']}>
                                    <span>{t('subtotal') || 'Subtotal'}</span>
                                    <span>{convertPrice(orderTotal).formatted}</span>
                                </div>
                                <div className={styles['co-summary-row']}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {commissionInfo.name || t('payment_processing_fee') || 'Payment processing fee'}
                                        <span title="Estimated platform service fee" style={{ cursor: 'help', color: '#aaa' }}>ⓘ</span>
                                    </span>
                                    <span>{convertPrice(processingFee).formatted}</span>
                                </div>
                            </div>

                            <div className={styles['co-summary-total']}>
                                <span>{t('pay_in') || 'Pay in'} {currency}</span>
                                <span>{convertPrice(finalTotal).formatted}</span>
                            </div>

                            <button type="submit" disabled={loading} className={styles['co-btn-pay'] + " " + styles['co-pay-full']}>
                                {loading ? (t('processing') || 'Processing...') : (t('pay_now') || 'Pay now')}
                            </button>

                            <p className={styles['co-terms']}>
                                {t('by_clicking_above') || 'By clicking the above, you agree to'}{' '}
                                <Link href="/page/terms-of-use" className={styles['co-link']}>{t('terms_of_use') || 'Terms of Use'}</Link> {t('and') || 'and'}{' '}
                                <Link href="/page/privacy-policy" className={styles['co-link']}>{t('privacy_policy') || 'Privacy Policy'}</Link>
                            </p>

                            {/* Protection */}
                            <div className={styles['co-protection']}>
                                <div className={styles['co-protection-header']} onClick={() => setProtectionOpen(v => !v)}>
                                    <span className={styles['co-protection-title']}>Alibaba.com order protection</span>
                                    <span>{protectionOpen ? '∧' : '›'}</span>
                                </div>
                                <div className={styles['co-protection-items']}>
                                    {[
                                        { title: 'Secure payments', text: 'Every payment is secured with strict SSL encryption and PCI DSS data protection.' },
                                        { title: 'Delivery via Alibaba.com Logistics', text: 'Expect your order delivered on time or receive compensation.' },
                                        { title: 'Money-back protection', text: "Claim a refund if your order doesn't ship, is missing, or arrives with issues." },
                                    ].map((p, i) => (
                                        <div key={i} className={styles['co-protection-item']}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            <div>
                                                <div className={styles['co-protection-item-title']}>{p.title}</div>
                                                <div className={styles['co-protection-item-text']}>{p.text}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};


export default Checkout;
