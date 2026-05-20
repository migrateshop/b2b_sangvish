import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { createProduct, updateProduct } from '@/services/productApi';
import { getImgUrl } from '@/utils/imageConfig';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useToast } from '@/context/ToastContext';

import styles from './ProductManagement.module.css';

interface PriceTier {
    min_quantity: string | number;
    max_quantity: string | number | null;
    price: string | number;
    discount_percentage?: number;
}

interface Variant {
    name: string;
    value: string;
    image?: string;
    price_modifier: number;
    stock: number;
}

interface Attribute {
    key: string;
    value: string;
}

interface Country {
    name: string;
    code: string;
}

interface Product {
    _id?: string;
    name: string;
    description: string;
    category: any;
    sku: string;
    moq: number;
    currency: string;
    countInStock: number;
    status: string;
    oldPrice: number;
    main_price?: number;
    main_image?: string;
    images?: string[];
    video?: string;
    sample_available?: boolean;
    sample_price?: number;
    customization_available?: boolean;
    customization_options?: string[];
    price_tiers?: PriceTier[];
    variants?: Variant[];
    key_attributes?: Attribute[];
    sales_type?: 'worldwide' | 'specific';
    countries?: string[];
}

interface ProductFormProps {
    product?: Product | null;
    onSave: () => void;
    onCancel: () => void;
}

const emptyTier = (): PriceTier => ({ min_quantity: '', max_quantity: '', price: '', discount_percentage: 0 });
const emptyVariant = (): Variant => ({ name: '', value: '', image: '', price_modifier: 0, stock: -1 });
const emptyAttribute = (): Attribute => ({ key: '', value: '' });

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const isEdit = !!product;
    const coverFileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const maxImages = user?.subscription_plan?.max_images_per_product || 5;

    // Basic fields
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [category, setCategory] = useState<string>(product?.category?._id || product?.category || '');
    const [sku, setSku] = useState(product?.sku || '');
    const [moq, setMoq] = useState<string | number>(product?.moq || 1);
    const [currency, setCurrency] = useState(product?.currency || 'USD');
    const [countInStock, setCountInStock] = useState<string | number>(product ? (product.countInStock ?? 0) : -1);
    const [status, setStatus] = useState(product?.status || 'draft');
    const [oldPrice, setOldPrice] = useState<string | number>(product?.oldPrice || 0);
    const [video, setVideo] = useState(product?.video || '');
    const [sampleAvailable, setSampleAvailable] = useState(product?.sample_available || false);
    const [samplePrice, setSamplePrice] = useState<string | number>(product?.sample_price || 0);
    const [customizationAvailable, setCustomizationAvailable] = useState(product?.customization_available ?? true);
    const [customizationOptions, setCustomizationOptions] = useState<string[]>(product?.customization_options || []);
    const [newOption, setNewOption] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);

    // Sales Region State
    const [salesType, setSalesType] = useState(product?.sales_type || 'worldwide');
    const [selectedCountries, setSelectedCountries] = useState<string[]>(product?.countries || []);
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [showCountryOptions, setShowCountryOptions] = useState(false);

    // Initial calculation of discount percentage if editing
    useEffect(() => {
        if (isEdit && product && product.oldPrice > 0) {
            const currentPrice = product.main_price || product.price_tiers?.[0]?.price || 0;
            if (product.oldPrice > +currentPrice) {
                setDiscountPercentage(Math.round(((product.oldPrice - +currentPrice) / product.oldPrice) * 100));
            }
        }
    }, [isEdit, product]);

    const handleDiscountChange = (pct: string) => {
        const val = parseFloat(pct) || 0;
        setDiscountPercentage(val);
        const firstTierPrice = tiers[0]?.price;
        const currentPrice = typeof firstTierPrice === 'string' ? parseFloat(firstTierPrice) : (firstTierPrice || 0);
        if (val > 0 && currentPrice > 0) {
            const calculatedOldPrice = (currentPrice / (1 - val / 100)).toFixed(2);
            setOldPrice(calculatedOldPrice);
        } else if (val === 0) {
            setOldPrice(0);
        }
    };

    const handleOldPriceChange = (price: string) => {
        const val = parseFloat(price) || 0;
        setOldPrice(val);
        const firstTierPrice = tiers[0]?.price;
        const currentPrice = typeof firstTierPrice === 'string' ? parseFloat(firstTierPrice) : (firstTierPrice || 0);
        if (val > currentPrice && val > 0) {
            setDiscountPercentage(Math.round(((val - currentPrice) / val) * 100));
        } else {
            setDiscountPercentage(0);
        }
    };

    // Pricing tiers
    const [tiers, setTiers] = useState<PriceTier[]>(
        product?.price_tiers?.length ? product.price_tiers.map(t => ({ ...t })) : [emptyTier()]
    );

    // Variants
    const [variants, setVariants] = useState<Variant[]>(
        product?.variants?.length ? product.variants.map(v => ({ ...v })) : []
    );

    // Key Attributes
    const [keyAttributes, setKeyAttributes] = useState<Attribute[]>(
        product?.key_attributes?.length ? product.key_attributes.map(k => ({ ...k })) : []
    );

    // Images
    const [existingCoverImage, setExistingCoverImage] = useState(product && product.main_image ? product.main_image : (product?.images?.length ? product.images[0] : ''));
    const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
    const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);

    const [existingImages, setExistingImages] = useState<string[]>(
        product && product.images 
            ? product.images.filter(img => img !== (product?.main_image || product?.images?.[0])) 
            : []
    );
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [dragOverCover, setDragOverCover] = useState(false);

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | undefined>(undefined);
    const [cropImageIndex, setCropImageIndex] = useState<'cover' | number | null>(null);
    const [crop, setCrop] = useState<any>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    const [completedCrop, setCompletedCrop] = useState<any>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [parentCategory, setParentCategory] = useState('');
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { showToast } = useToast();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        api.get('/categories').then(({ data }) => {
            const tree = Array.isArray(data) ? data : data.categories || [];
            setCategories(tree);

            // If editing, find the parent of the currently selected category
            if (isEdit && category) {
                const findParentId = (list: any[]): string | null => {
                    for (const cat of list) {
                        if (cat._id === category) return null;
                        if (cat.children && cat.children.some((child: any) => child._id === category)) {
                            return cat._id;
                        }
                        const nested = findParentId(cat.children || []);
                        if (nested) return nested;
                    }
                    return null;
                };

                const pId = findParentId(tree);
                if (pId) {
                    setParentCategory(pId);
                    const parentObj = tree.find((c: any) => c._id === pId);
                    setSubCategories(parentObj?.children || []);
                } else {
                    setParentCategory(category);
                }
            }
        }).catch(() => { });

        // Fetch All Countries
        api.get('/common/countries').then(({ data }) => {
            setAllCountries(data || []);
        }).catch(() => { });
    }, [isEdit, category]);

    const handleParentChange = (pId: string) => {
        setParentCategory(pId);
        const parentObj = categories.find(c => c._id === pId);
        const children = parentObj?.children || [];
        setSubCategories(children);
        setCategory(pId);
    };

    const handleSubChange = (sId: string) => {
        setCategory(sId || parentCategory);
    };

    const handleCoverSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const f = files[0];
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.readAsDataURL(f);
        });
        setNewCoverFile(f);
        setNewCoverPreview(dataUrl);
        // Force crop on cover image
        setTimeout(() => {
            handleCropOpen('cover', dataUrl);
        }, 100);
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const remaining = maxImages - 1 - existingImages.length - newFiles.length; // -1 for cover
        if (remaining <= 0) return;
        const arr = Array.from(files).slice(0, remaining);
        
        const tempFiles: File[] = [];
        const tempPreviews: string[] = [];
        
        for (let i = 0; i < arr.length; i++) {
            const f = arr[i];
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target?.result as string);
                reader.readAsDataURL(f);
            });
            tempFiles.push(f);
            tempPreviews.push(dataUrl);
        }
        
        setNewFiles(prev => [...prev, ...tempFiles]);
        setNewPreviews(prev => [...prev, ...tempPreviews]);
    };

    const handleKeyDownOption = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addOption();
        }
    };

    const removeExistingCover = () => {
        setExistingCoverImage('');
        setNewCoverFile(null);
        setNewCoverPreview(null);
    };
    const removeNewCover = () => {
        setNewCoverFile(null);
        setNewCoverPreview(null);
    };
    const removeExisting = (idx: number) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
    const removeNew = (idx: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
        setNewPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const updateTier = (idx: number, field: keyof PriceTier, val: any) => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
    const removeTier = (idx: number) => setTiers(prev => prev.filter((_, i) => i !== idx));
    const updateVariant = (idx: number, field: keyof Variant, val: any) => setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
    const removeVariant = (idx: number) => setVariants(prev => prev.filter((_, i) => i !== idx));
    const updateAttribute = (idx: number, field: keyof Attribute, val: any) => setKeyAttributes(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
    const removeAttribute = (idx: number) => setKeyAttributes(prev => prev.filter((_, i) => i !== idx));
    const addOption = () => { if (newOption.trim()) { setCustomizationOptions(prev => [...prev, newOption.trim()]); setNewOption(''); } };
    const removeOption = (idx: number) => setCustomizationOptions(prev => prev.filter((_, i) => i !== idx));

    const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

    const handleVideoUpload = async (file: File | null) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('media', file);
        setVideoLoading(true);
        try {
            const { data } = await api.post('/products/upload-media', fd);
            if (data.success) {
                setVideo(data.url);
            }
        } catch (err) {
            setError('Failed to upload video.');
        } finally {
            setVideoLoading(false);
        }
    };

    const handleVariantImageUpload = async (idx: number, file: File | null) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('images', file);
        setUploadingVariantIdx(idx);
        try {
            const { data } = await api.post('/products/upload-single', fd);
            if (data.success) {
                updateVariant(idx, 'image', data.url);
            }
        } catch (err) {
            setError('Failed to upload variant image.');
        } finally {
            setUploadingVariantIdx(null);
        }
    };

    // Cropper Logic
    const handleCropOpen = (index: 'cover' | number, src?: string) => {
        setCropImageIndex(index);
        setCropImageSrc(src || (index === 'cover' ? newCoverPreview || undefined : newPreviews[index]));
        setCrop(null); // clear crop so onImageLoad can calculate the max center area
        setCompletedCrop(null);
        setCropModalOpen(true);
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop(
                { unit: '%', width: 100 },
                1,
                width,
                height
            ),
            width,
            height
        );
        setCrop(initialCrop);
    };

    const handleCropSave = () => {
        if (!completedCrop || !imageRef.current || cropImageIndex === null) {
            setCropModalOpen(false);
            return;
        }
        const canvas = document.createElement('canvas');
        const image = imageRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY
        );

        canvas.toBlob((blob) => {
            if (!blob) {
                setCropModalOpen(false);
                return;
            }
            if (cropImageIndex === 'cover') {
                const fileName = newCoverFile?.name || 'cover.jpg';
                const croppedFile = new File([blob], fileName, { type: blob.type });
                const previewUrl = URL.createObjectURL(croppedFile);
                setNewCoverFile(croppedFile);
                setNewCoverPreview(previewUrl);
            } else if (typeof cropImageIndex === 'number') {
                const fileName = newFiles[cropImageIndex]?.name || `image-${cropImageIndex}.jpg`;
                const croppedFile = new File([blob], fileName, { type: blob.type });
                const previewUrl = URL.createObjectURL(croppedFile);
                
                setNewFiles(prev => prev.map((f, i) => i === cropImageIndex ? croppedFile : f));
                setNewPreviews(prev => prev.map((u, i) => i === cropImageIndex ? previewUrl : u));
            }
            setCropModalOpen(false);
        }, cropImageIndex === 'cover' ? (newCoverFile?.type || 'image/jpeg') : (newFiles[typeof cropImageIndex === 'number' ? cropImageIndex : 0]?.type || 'image/jpeg'));
    };

    // Close modal on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setCropModalOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) return showToast('Product name is required.', 'error', 'Validation Error');
        if (!description.trim()) return showToast('Description is required.', 'error', 'Validation Error');
        if (!category) return showToast('Please select a category.', 'error', 'Validation Error');

        // Subcategory check
        if (subCategories.length > 0 && category === parentCategory) {
            return showToast('Please select a specific subcategory.', 'error', 'Validation Error');
        }

        if (!sku || !sku.trim()) return showToast('SKU is required.', 'error', 'Validation Error');
        if (!moq || isNaN(Number(moq)) || Number(moq) <= 0) return showToast('MOQ must be a positive number greater than 0.', 'error', 'Validation Error');
        if (countInStock === undefined || countInStock === null || countInStock === '') return showToast('Stock is required.', 'error', 'Validation Error');
        if (!currency || !currency.trim()) return showToast('Currency is required.', 'error', 'Validation Error');

        if (salesType === 'specific' && selectedCountries.length === 0) {
            return showToast('At least one country must be selected for specific Sales Region.', 'error', 'Validation Error');
        }

        if (tiers.length === 0) return showToast('At least one price tier is required.', 'error', 'Validation Error');
        if (!existingCoverImage && !newCoverFile) return showToast('Cover Image is required.', 'error', 'Validation Error');

        for (const t of tiers) {
            if (!t.min_quantity || !t.price) return showToast('All tier rows must have Min Qty and Price.', 'error', 'Validation Error');
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('description', description.trim());
            fd.append('category', category);
            fd.append('sku', sku);
            fd.append('moq', String(moq));
            fd.append('currency', currency);
            fd.append('countInStock', String(countInStock));
            fd.append('status', status);
            fd.append('oldPrice', String(oldPrice));
            fd.append('video', video);
            fd.append('sample_available', String(sampleAvailable));
            fd.append('sample_price', String(samplePrice));
            fd.append('customization_available', String(customizationAvailable));
            fd.append('customization_options', JSON.stringify(customizationOptions));
            fd.append('price_tiers', JSON.stringify(tiers));
            
            // Filter out empty variants and attributes to prevent validation errors
            const filteredVariants = variants.filter(v => v.name.trim() !== '' || v.value.trim() !== '');
            const filteredAttributes = keyAttributes.filter(a => a.key.trim() !== '' || a.value.trim() !== '');
            
            fd.append('variants', JSON.stringify(filteredVariants));
            fd.append('key_attributes', JSON.stringify(filteredAttributes));
            fd.append('existing_cover_image', existingCoverImage || '');
            if (newCoverFile) {
                fd.append('cover_image', newCoverFile);
            }
            
            fd.append('keep_images', JSON.stringify(existingImages));
            fd.append('sales_type', salesType);
            fd.append('countries', JSON.stringify(selectedCountries));
            newFiles.forEach(f => fd.append('images', f));

            if (isEdit && product?._id) {
                await updateProduct(product._id, fd);
                showToast('Product updated successfully!', 'success', 'Success');
            } else {
                await createProduct(fd);
                showToast('Product created successfully!', 'success', 'Success');
            }
            setTimeout(() => onSave(), 1200);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'An error occurred. Please try again.';
            setError(msg);
            showToast(msg, 'error', 'Submission Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['pm-wrapper']}>
            {cropModalOpen && (
                <div className={styles['pm-crop-modal-overlay']} onClick={() => setCropModalOpen(false)}>
                    <div className={styles['pm-crop-modal']} onClick={e => e.stopPropagation()}>
                        <div className={styles['pm-crop-modal-header']}>
                            <h3>Crop Image</h3>
                            <button type="button" className={styles['pm-modal-close-icon']} onClick={() => setCropModalOpen(false)}>✕</button>
                        </div>
                        <div className={styles['pm-crop-container']}>
                            <ReactCrop 
                                crop={crop} 
                                onChange={c => setCrop(c)} 
                                onComplete={c => setCompletedCrop(c)}
                                aspect={1}
                            >
                                <img 
                                    src={cropImageSrc} 
                                    ref={imageRef} 
                                    onLoad={onImageLoad} 
                                    alt="Crop preview" 
                                    className={styles['pm-crop-image']} 
                                />
                            </ReactCrop>
                        </div>
                        <div className={styles['pm-crop-modal-footer']}>
                            <button type="button" className={styles['pm-btn-secondary']} onClick={() => setCropModalOpen(false)}>Cancel</button>
                            <button type="button" className={styles['pm-btn-primary']} onClick={handleCropSave}>Apply Crop</button>
                        </div>
                    </div>
                </div>
            )}
            <div className={styles['pm-header']}>
                <h2 style={{ color: '#1a1a2e', fontWeight: 900 }}>{isEdit ? 'Edit Product' : '+ Add New Product'}</h2>
                <button 
                    className={styles['pm-btn-secondary']} 
                    onClick={onCancel}
                    style={{ background: '#fff', border: '1.5px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 800 }}
                >
                    ← Back to List
                </button>
            </div>

            <form className={styles['pm-form-wrapper']} onSubmit={handleSubmit}>
                {/* Global error/success can still be shown at top if desired, but toast is primary now */}

                {/* Section 1: Basic Info */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Basic Information</div>
                    <div className={styles['pm-form-card-body']}>
                        <div className={styles['pm-form-row'] + " " + styles['single']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Product Name <span>*</span></label>
                                <input className={styles['pm-form-input']} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Industrial Safety Helmet" />
                            </div>
                        </div>
                        <div className={styles['pm-form-row']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Category <span>*</span></label>
                                <select className={styles['pm-form-select']} value={parentCategory} onChange={e => handleParentChange(e.target.value)}>
                                    <option value="">-- Select Category --</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Sub Category</label>
                                <select className={styles['pm-form-select']} value={category !== parentCategory ? category : ''} onChange={e => handleSubChange(e.target.value)} disabled={subCategories.length === 0}>
                                    <option value="">-- Select Sub Category --</option>
                                    {subCategories.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles['pm-form-row'] + " " + styles['single']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Description <span>*</span></label>
                                <textarea className={styles['pm-form-textarea']} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed product description..." rows={5} />
                            </div>
                        </div>
                        <div className={styles['pm-form-row'] + " " + styles['three-col']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>SKU <span>*</span></label>
                                <input className={styles['pm-form-input']} value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. HLM-RED-XL" />
                            </div>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>MOQ (Min Order Qty) <span>*</span></label>
                                <input className={styles['pm-form-input']} type="number" min="1" value={moq} onChange={e => setMoq(e.target.value)} />
                            </div>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Stock (Inventory) <span>*</span></label>
                                <input className={styles['pm-form-input']} type="number" min="-1" value={countInStock} onChange={e => setCountInStock(e.target.value)} />
                                <span className={styles['helper-text']} style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Enter -1 for unlimited stock</span>
                            </div>
                        </div>
                        <div className={styles['pm-form-row'] + " " + styles['three-col']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Currency</label>
                                <select className={styles['pm-form-select']} value={currency} onChange={e => setCurrency(e.target.value)}>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="CNY">CNY (¥)</option>
                                </select>
                            </div>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Status</label>
                                <select className={styles['pm-form-select']} value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Sales Region Selection */}
                        <div className={styles['pm-form-row']} style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <div className={styles['pm-form-group'] + " " + styles['w-100']}>
                                <label className={styles['pm-form-label']} style={{ fontWeight: 800 }}>Sales Region (Where to sell?) <span>*</span></label>
                                <div className={styles['pm-segmented-control-wrapper']}>
                                    <div 
                                        className={`${styles['pm-segmented-option']} ${salesType === 'worldwide' ? styles['active'] : ''}`}
                                        onClick={() => setSalesType('worldwide')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                        Worldwide
                                    </div>
                                    <div 
                                        className={`${styles['pm-segmented-option']} ${salesType === 'specific' ? styles['active'] : ''}`}
                                        onClick={() => setSalesType('specific')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        Specific Countries
                                    </div>
                                </div>
                                {salesType === 'specific' && (
                                    <div className={styles['country-selector-box']} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                                        <div className={styles['country-search-wrapper']} style={{ position: 'relative', marginBottom: '16px' }}>
                                            <input 
                                                className={styles['pm-form-input']} 
                                                placeholder="Search countries..." 
                                                value={countrySearchTerm} 
                                                onChange={e => setCountrySearchTerm(e.target.value)} 
                                                onFocus={() => setShowCountryOptions(true)}
                                                onClick={() => setShowCountryOptions(true)}
                                            />
                                            {showCountryOptions && (
                                                <div className={styles['country-options-dropdown']} style={{ 
                                                    position: 'absolute', top: '100%', left: 0, right: 0, 
                                                    maxHeight: '320px', overflowY: 'auto', background: '#fff', 
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '8px', 
                                                    zIndex: 1000, marginTop: '5px', border: '1px solid #e2e8f0' 
                                                }}>
                                                    <div 
                                                        style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontWeight: 900, color: '#1a1a2e', background: '#f8fafc' }}
                                                        onClick={() => {
                                                            setSelectedCountries(allCountries.map(c => c.code));
                                                            setShowCountryOptions(false);
                                                        }}
                                                    >
                                                        Select All Countries
                                                    </div>
                                                    {allCountries
                                                        .filter(c => c.name.toLowerCase().includes(countrySearchTerm.toLowerCase()))
                                                        .map(country => (
                                                            <div 
                                                                key={country.code} 
                                                                style={{ 
                                                                    padding: '10px 12px', cursor: 'pointer', 
                                                                    display: 'flex', justifyContent: 'space-between',
                                                                    background: selectedCountries.includes(country.code) ? '#f0f9ff' : 'transparent',
                                                                    borderBottom: '1px solid #f1f5f9'
                                                                }}
                                                                onClick={() => {
                                                                    if (selectedCountries.includes(country.code)) {
                                                                        setSelectedCountries(prev => prev.filter(c => c !== country.code));
                                                                    } else {
                                                                        setSelectedCountries(prev => [...prev, country.code]);
                                                                    }
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '14px' }}>{country.name} ({country.code})</span>
                                                                {selectedCountries.includes(country.code) && <span style={{ color: '#1a1a2e', fontWeight: 900 }}>✓</span>}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected countries table */}
                                        <div className={styles['selected-countries-container']} style={{ marginTop: '4px' }}>
                                            {selectedCountries.length > 0 ? (
                                                <div className={styles['table-responsive']} style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                            <tr>
                                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Country</th>
                                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>ISOCode</th>
                                                                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedCountries.map(code => {
                                                                const country = allCountries.find(c => c.code === code);
                                                                return (
                                                                    <tr key={code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#1a1a2e' }}>
                                                                            {country?.name || code}
                                                                        </td>
                                                                        <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>{code}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => setSelectedCountries(prev => prev.filter(c => c !== code))}
                                                                                style={{ background: '#fff1f2', color: '#be123c', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '12px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No countries selected. Please search and select above.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Tier Pricing */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Pricing & Discount <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8 }}>— B2B bulk discounts & offers</span></div>
                    <div className={styles['pm-form-card-body']}>
                        <div className={styles['pm-form-row'] + " " + styles['single']} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Offer Percentage (%)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: '200px' }}>
                                        <input 
                                            className={styles['pm-form-input']} 
                                            style={{ width: '100%', paddingRight: '40px' }}
                                            type="number" 
                                            min="0" 
                                            max="99" 
                                            value={discountPercentage} 
                                            onChange={e => handleDiscountChange(e.target.value)} 
                                            placeholder="0" 
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '13px' }}>%</span>
                                    </div>
                                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>
                                        {discountPercentage > 0 && tiers[0]?.price ? `Calculated Regular Price: ${currency} ${(parseFloat(String(tiers[0].price)) / (1 - discountPercentage / 100)).toFixed(2)}` : 'No discount applied'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['pm-form-label']} style={{ marginBottom: '12px', fontWeight: 900, color: '#1a1a2e', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wholesale Price Tiers</div>
                        <div className={styles['pm-tier-row'] + " " + styles['pm-variant-header']}>
                            <div className={styles['pm-form-label']} style={{ marginBottom: 0 }}>Min Qty <span style={{ color: '#e11d48' }}>*</span></div>
                            <div className={styles['pm-form-label']} style={{ marginBottom: 0 }}>Max Qty</div>
                            <div className={styles['pm-form-label']} style={{ marginBottom: 0 }}>Unit Price <span style={{ color: '#e11d48' }}>*</span></div>
                            <div></div>
                        </div>
                        {tiers.map((t, i) => (
                            <div key={i} className={styles['pm-tier-row']}>
                                <input className={styles['pm-form-input']} type="number" min="1" placeholder="Min Qty (e.g. 10)" value={t.min_quantity} onChange={e => updateTier(i, 'min_quantity', e.target.value)} />
                                <input className={styles['pm-form-input']} type="number" min="0" placeholder="Max Qty (e.g. 500)" value={t.max_quantity || ''} onChange={e => updateTier(i, 'max_quantity', e.target.value || null)} />
                                <input className={styles['pm-form-input']} type="number" min="0" step="0.01" placeholder="Unit Price ($)" value={t.price} onChange={e => updateTier(i, 'price', e.target.value)} />
                                {i > 0 && (
                                    <button type="button" className={styles['pm-remove-btn']} onClick={() => removeTier(i)}>✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className={styles['pm-add-row-btn']} onClick={() => setTiers(prev => [...prev, emptyTier()])}>
                            + Add Price Tier
                        </button>
                    </div>
                </div>

                {/* Section 3: Variants */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Product Variants <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8 }}>— Color, Size, Spec, etc.</span></div>
                    <div className={styles['pm-form-card-body']}>

                        {/* Variant List */}
                        <div className={styles['pm-variants-container']}>
                            {variants.map((v, i) => (
                                <div key={i} className={styles['pm-variant-card-item']}>
                                    <div className={styles['pm-variant-card-header-inner']}>
                                        <div className={styles['pm-variant-badge']}>#{i + 1}</div>
                                        <button type="button" className={styles['pm-variant-remove-icon']} onClick={() => removeVariant(i)}>✕</button>
                                    </div>
                                    <div className={styles['pm-variant-card-grid']}>
                                        <div className={styles['pm-variant-field']}>
                                            <label>Name</label>
                                            <input type="text" className={styles['pm-form-input']} placeholder="e.g. Color" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} />
                                        </div>
                                        <div className={styles['pm-variant-field']}>
                                            <label>Value</label>
                                            <input type="text" className={styles['pm-form-input']} placeholder="e.g. Red" value={v.value} onChange={e => updateVariant(i, 'value', e.target.value)} />
                                        </div>
                                        <div className={styles['pm-variant-field'] + " " + styles['span-2']}>
                                            <label>Image URL</label>
                                            <div className={styles['pm-variant-image-input-group']}>
                                                <input type="text" className={styles['pm-form-input']} placeholder="Paste image URL or upload →" value={v.image || ''} onChange={e => updateVariant(i, 'image', e.target.value)} />
                                                <label className={styles['pm-variant-upload-btn']}>
                                                    <input type="file" accept="image/*" hidden onChange={e => e.target.files && handleVariantImageUpload(i, e.target.files[0])} />
                                                    {uploadingVariantIdx === i ? (
                                                        <div className={styles['pm-spinner-small']}></div>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                        <div className={styles['pm-variant-field']}>
                                            <label>Price (+/-)</label>
                                            <input type="number" step="0.01" className={styles['pm-form-input']} placeholder="0.00" value={v.price_modifier} onChange={e => updateVariant(i, 'price_modifier', e.target.value)} />
                                        </div>
                                        <div className={styles['pm-variant-field']}>
                                            <label>Stock</label>
                                            <input type="number" min="-1" className={styles['pm-form-input']} placeholder="0" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" className={styles['pm-add-variant-btn-modern']} onClick={() => setVariants(prev => [...prev, emptyVariant()])}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add New Variant Option
                        </button>
                    </div>
                </div>

                {/* Section 4: Key Attributes */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Key Attributes <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8 }}>— Product specs (e.g., Material, Warranty, Weight)</span></div>
                    <div className={styles['pm-form-card-body']}>
                        {keyAttributes.length > 0 && (
                            <div className={styles['pm-variant-header']} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px' }}>
                                <div className={styles['pm-form-label']} style={{ marginBottom: 0 }}>Attribute Name</div>
                                <div className={styles['pm-form-label']} style={{ marginBottom: 0 }}>Value</div>
                                <div></div>
                            </div>
                        )}
                        {keyAttributes.map((attr, i) => (
                            <div key={i} className={styles['pm-variant-row'] + ' ' + styles['pm-attr-row']}>
                                <input className={styles['pm-form-input']} placeholder="Attr Name (e.g. Warranty)" value={attr.key} onChange={e => updateAttribute(i, 'key', e.target.value)} />
                                <input className={styles['pm-form-input']} placeholder="Value (e.g. 1 Year)" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} />
                                <button type="button" className={styles['pm-remove-btn']} onClick={() => removeAttribute(i)}>✕</button>
                            </div>
                        ))}
                        <button type="button" className={styles['pm-add-row-btn']} onClick={() => setKeyAttributes(prev => [...prev, emptyAttribute()])}>
                            + Add Attribute
                        </button>
                    </div>
                </div>

                {/* Section 5: Images */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Product Images <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8 }}>— Main Cover & Additional angles</span></div>
                    <div className={styles['pm-form-card-body']}>
                        
                        {/* 1. Cover Image Upload */}
                        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                            <div className={styles['pm-form-label']} style={{ marginBottom: '8px', color: '#1a1a2e', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 900 }}>
                                Product Cover Image <span style={{color: '#e11d48'}}>*</span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>This will be the primary thumbnail shown in search results and grids. Automatic crop required.</p>
                            
                            {existingCoverImage && !newCoverPreview ? (
                                <div className={styles['pm-image-preview-item']} style={{ position: 'relative', width: '160px', height: '160px', border: '2px solid #e2e8f0' }}>
                                    <img src={getImgUrl(existingCoverImage)} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button type="button" className={styles['pm-image-remove']} onClick={removeExistingCover}>✕</button>
                                </div>
                            ) : newCoverPreview ? (
                                <div className={styles['pm-image-preview-item']} style={{ position: 'relative', width: '160px', height: '160px', border: '2px solid var(--primary-color)' }}>
                                    <img src={newCoverPreview} alt="cover-preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button type="button" className={styles['pm-image-remove']} onClick={removeNewCover}>✕</button>
                                    <button type="button" className={styles['pm-crop-trigger-btn']} onClick={(e) => { e.stopPropagation(); handleCropOpen('cover'); }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg>
                                        Crop
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={`${styles['pm-upload-button-div']} ${dragOverCover ? styles['drag-over'] : ''}`}
                                    onClick={() => coverFileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setDragOverCover(true); }}
                                    onDragLeave={() => setDragOverCover(false)}
                                    onDrop={e => { e.preventDefault(); setDragOverCover(false); handleCoverSelect(e.dataTransfer.files); }}
                                >
                                    <div className={styles['pm-upload-icon-wrapper']}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span>Select Cover Image</span>
                                    <input
                                        ref={coverFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => handleCoverSelect(e.target.files)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 2. Additional Images */}
                        <div className={styles['pm-form-label']} style={{ marginBottom: '12px', color: '#1a1a2e', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 900 }}>Additional Angles & Detail Shots <span style={{ fontWeight: 400, opacity: 0.8, textTransform: 'none', letterSpacing: 'normal' }}>(Optional, up to {maxImages - 1} more)</span></div>
                        
                        {/* Existing images */}
                        {existingImages.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <div className={styles['pm-image-previews']}>
                                    {existingImages.map((img, i) => (
                                        <div key={i} className={styles['pm-image-preview-item']} style={{ position: 'relative' }}>
                                            <img src={getImgUrl(img)} alt={`product-${i}`} />
                                            <button type="button" className={styles['pm-image-remove']} onClick={() => removeExisting(i)}>✕</button>
                                            <button type="button" className={styles['pm-crop-trigger-btn']} onClick={(e) => { e.stopPropagation(); handleCropOpen(i, getImgUrl(img)); }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg>
                                                Crop
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload zone */}
                        {(existingImages.length + newFiles.length) < (maxImages - 1) && (
                            <div
                                className={`${styles['pm-upload-button-div']} ${dragOver ? styles['drag-over'] : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
                            >
                                <div className={styles['pm-upload-icon-wrapper']}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <span>Add additional images</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => handleFileSelect(e.target.files)}
                                />
                            </div>
                        )}

                        {/* New file previews */}
                        {newPreviews.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div className={styles['pm-image-previews']}>
                                    {newPreviews.map((src, i) => (
                                        <div key={i} className={styles['pm-image-preview-item']} style={{ position: 'relative' }}>
                                            <img src={src} alt={`new-${i}`} />
                                            <button type="button" className={styles['pm-image-remove']} onClick={() => removeNew(i)}>✕</button>
                                            <button type="button" className={styles['pm-crop-trigger-btn']} onClick={(e) => { e.stopPropagation(); handleCropOpen(i); }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg>
                                                Crop
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 6: Video & Sample */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Video &amp; Sample Options</div>
                    <div className={styles['pm-form-card-body']}>
                        <div className={styles['pm-form-row'] + " " + styles['single']}>
                            <div className={styles['pm-form-group']}>
                                <label className={styles['pm-form-label']}>Product Video <span style={{ fontWeight: 400, fontSize: '0.8rem', opacity: 0.7 }}>— URL or Upload</span></label>
                                <div className={styles['pm-video-row']}>
                                    <input className={styles['pm-form-input']} value={video} onChange={e => setVideo(e.target.value)} placeholder="https://youtube.com/..." />
                                    <label className={`${styles['pm-btn-secondary']} ${styles['pm-video-upload-btn']}`}>
                                        {videoLoading ? <div className={styles['pm-spinner-small']}></div> : 'Upload Video'}
                                        <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => e.target.files && handleVideoUpload(e.target.files[0])} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className={styles['pm-form-row']} style={{ gridTemplateColumns: (sampleAvailable && !isMobile) ? '1fr 1fr' : '1fr' }}>
                            <div className={styles['pm-form-group']} style={{ padding: '8px 0' }}>
                                <label className={styles['pm-form-label']}>Sample Available?</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <input type="checkbox" checked={sampleAvailable} onChange={e => setSampleAvailable(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: sampleAvailable ? '#1a1a2e' : '#666' }}>
                                        {sampleAvailable ? 'Yes — Sample order allowed' : 'No'}
                                    </span>
                                </div>
                            </div>
                            {sampleAvailable && (
                                <div className={styles['pm-form-group']}>
                                    <label className={styles['pm-form-label']}>Sample Price ({currency || 'USD'})</label>
                                    <input className={styles['pm-form-input']} type="number" min="0" step="0.01" value={samplePrice} onChange={e => setSamplePrice(e.target.value)} placeholder="e.g. 25.00" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 7: Customization */}
                <div className={styles['pm-form-card']}>
                    <div className={styles['pm-form-card-header']}>Customization Options <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8 }}>— Logo, Packaging, Graphics, etc.</span></div>
                    <div className={styles['pm-form-card-body']}>
                        <div className={styles['pm-form-row']}>
                            <div className={styles['pm-form-group']} style={{ padding: '8px 0' }}>
                                <label className={styles['pm-form-label']}>Customization Available?</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <input type="checkbox" checked={customizationAvailable} onChange={e => setCustomizationAvailable(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: customizationAvailable ? '#1a1a2e' : '#666' }}>
                                        {customizationAvailable ? 'Yes — Supplier offers customization' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {customizationAvailable && (
                            <div className={styles['pm-form-group']} style={{ marginTop: '10px' }}>
                                <label className={styles['pm-form-label']}>Specific Options (e.g. "Customized logo", "Customized packaging")</label>
                                <div className={styles['pm-inline-input-row']} style={{ marginBottom: '15px' }}>
                                    <input 
                                        className={styles['pm-form-input']} 
                                        value={newOption} 
                                        onChange={e => setNewOption(e.target.value)} 
                                        onKeyDown={handleKeyDownOption}
                                        placeholder="Add an option and press Enter..." 
                                    />
                                    <button type="button" className={styles['pm-btn-secondary']} onClick={addOption} style={{ height: '42px' }}>Add</button>
                                </div>
                                <div className={styles['pm-custom-options-tags']} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {customizationOptions.map((opt, i) => (
                                        <div key={i} style={{ background: '#f8fafc', color: '#1a1a2e', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            {opt}
                                            <button type="button" onClick={() => removeOption(i)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: 0, fontWeight: 800 }}>✕</button>
                                        </div>
                                    ))}
                                    {customizationOptions.length === 0 && (
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No custom options added. Defaults will be shown.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className={styles['pm-form-actions']}>
                    <button type="button" className={styles['pm-btn-secondary']} onClick={onCancel}>Cancel</button>
                    <button type="submit" className={styles['pm-btn-primary']} disabled={loading}>
                        {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
