import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import styles from './AdminLayout.module.css';
import { useToast } from '@/context/ToastContext';
import { getImgUrl } from '@/utils/imageConfig';

const initialForm = {
    tag: 'Trending Now',
    title: '',
    subtitle: '',
    cta1_label: 'Get Quotes Now',
    cta1_link: '/rfq/post',
    cta1_needsAuth: false,
    cta2_label: 'Start Selling',
    cta2_link: '/become-supplier',
    accent: '#000000',
    gradFrom: '#ffffff',
    gradMid: '#f8fafc',
    gradTo: '#f1f5f9',
    shape1: '#e2e8f0',
    shape2: '#f1f5f9',
    statLabel: '40M+ Products',
    isActive: true,
    order: 0,
    image: ''
};

interface HeroSlide {
    _id?: string;
    tag: string;
    title: string;
    subtitle: string;
    cta1_label: string;
    cta1_link: string;
    cta1_needsAuth: boolean;
    cta2_label: string;
    cta2_link: string;
    accent: string;
    gradFrom: string;
    gradMid: string;
    gradTo: string;
    shape1: string;
    shape2: string;
    statLabel: string;
    isActive: boolean;
    order: number;
    image: string;
}

const AdminHeroSlides = () => {
    const { t } = useAuth();
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<HeroSlide>(initialForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/hero-slides/all');
            setSlides(data || []);
        } catch (err: any) {
            console.error('Fetch error:', err);
            showToast('Error fetching slides', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlides();
        // eslint-disable-next-line
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('media', file);
        try {
            const res = await api.post('/products/upload-media', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setFormData({ ...formData, image: res.data.url });
                showToast('Banner image uploaded successfully', 'success');
            }
        } catch (err) {
            showToast('Failed to upload image', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/hero-slides/${editingId}`, formData);
                showToast('Slide updated successfully', 'success');
            } else {
                await api.post('/hero-slides', formData);
                showToast('Slide created successfully', 'success');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData(initialForm);
            fetchSlides();
        } catch (err) {
            console.error('Submit error:', err);
            showToast('Failed to save slide', 'error');
        }
    };

    const handleEdit = (slide: HeroSlide) => {
        setFormData(slide);
        setEditingId(slide._id || null);
        setShowForm(true);
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelector('.admin-content-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        try {
            await api.delete(`/hero-slides/${id}`);
            showToast('Slide deleted successfully', 'success');
            fetchSlides();
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Failed to delete slide', 'error');
        }
    };

    const toggleActive = async (slide: HeroSlide) => {
        try {
            await api.put(`/hero-slides/${slide._id}`, { ...slide, isActive: !slide.isActive });
            fetchSlides();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className={styles['flex']} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div className={"admin-loading-spinner"} />
        </div>
    );

    return (
        <div className={"admin-page"} style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {!showForm ? (
                <>
                    <div className={"admin-page-header"} style={{ marginBottom: '32px' }}>
                        <div>
                            <h1 className={"admin-page-title"} style={{ color: '#000', fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Hero Banner Slides</h1>
                            <p className={"admin-page-subtitle"} style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Manage dynamic promotional hero banners</p>
                        </div>
                        <button 
                            onClick={() => { setShowForm(true); setFormData(initialForm); setEditingId(null); window.scrollTo(0, 0); }} 
                            className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}
                            style={{ height: '50px', padding: '0 32px', borderRadius: '14px', fontSize: '14px', fontWeight: 900 }}
                        >
                            + Create Slide
                        </button>
                    </div>

                    {!loading && slides.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--admin-bg)', borderRadius: '24px', border: '2.5px dashed var(--admin-border)' }}>
                            <p style={{ margin: 0, fontSize: '15px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>No hero banners found. Create your first promotion banner to get started.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            {slides.map((slide: any) => (
                                <div key={slide._id} className={"admin-card"} style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', border: '1.5px solid var(--admin-border)', overflowX: 'auto' }}>
                                    <div 
                                        style={{ 
                                            width: '180px', height: '100px', borderRadius: '16px', overflow: 'hidden', 
                                            background: `linear-gradient(135deg, ${slide.gradFrom}, ${slide.gradTo})`,
                                            border: '1px solid var(--admin-border)', position: 'relative', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        {slide.image && <img src={getImgUrl(slide.image)} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover', opacity: 0.8 }} />}
                                        <div style={{ position: 'relative', zIndex: 2, padding: '8px', background: '#000', color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '6px' }}>{slide.tag}</div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{slide.statLabel}</span>
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#000', margin: '0 0 6px' }} dangerouslySetInnerHTML={{ __html: slide.title }} />
                                        <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{slide.subtitle}</p>
                                    </div>

                                    <div className={styles['admin-hero-slide-actions']} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div
                                                className={`${styles['admin-toggle']} ${slide.isActive ? styles['on'] : ''}`}
                                                onClick={() => toggleActive(slide)}
                                            />
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: slide.isActive ? '#000' : 'var(--admin-text-muted)' }}>
                                                {slide.isActive ? 'ACTIVE' : 'HIDDEN'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleEdit(slide)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--admin-bg)', border: '1.5px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                            </button>
                                            <button onClick={() => handleDelete(slide._id)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff', border: '1.5px solid #ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4f' }}>
                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className={"admin-card"} style={{ padding: '32px', border: '1.5px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1.5px solid var(--admin-border)' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#000', margin: 0 }}>{editingId ? 'Edit Hero Banner' : 'Create New Banner'}</h2>
                            <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontWeight: 700, marginTop: '4px' }}>Adjust content, images, and visual configuration</p>
                        </div>
                        <button 
                            onClick={() => { setShowForm(false); setFormData(initialForm); setEditingId(null); }} 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '10px 16px', borderRadius: '12px', border: '1.5px solid var(--admin-border)' }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                            Back to List
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            <div className={styles['admin-form-group']}>
                                <label className={styles['admin-form-label']} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Promo Tag (Badge)</label>
                                <input required name="tag" value={formData.tag} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '48px', borderRadius: '12px', fontWeight: 700 }} placeholder="e.g. SPECIAL OFFER" />
                            </div>
                            <div className={styles['admin-form-group']}>
                                <label className={styles['admin-form-label']} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Stat Label</label>
                                <input required name="statLabel" value={formData.statLabel} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '48px', borderRadius: '12px', fontWeight: 700 }} placeholder="e.g. 50k+ Active Buyers" />
                            </div>
                        </div>

                        <div className={styles['admin-form-group']}>
                            <label className={styles['admin-form-label']} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Main Heading Title</label>
                            <input required name="title" value={formData.title} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '48px', borderRadius: '12px', fontWeight: 900, fontSize: '16px' }} placeholder="Global B2B Marketplace" />
                            <p style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 600, marginTop: '6px' }}>* HTML is supported (e.g., &lt;br/&gt; for line breaks)</p>
                        </div>

                        <div className={styles['admin-form-group']}>
                            <label className={styles['admin-form-label']} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Description Text</label>
                            <textarea required name="subtitle" value={formData.subtitle} onChange={handleInputChange} className={styles['admin-form-input']} style={{ minHeight: '100px', borderRadius: '12px', fontWeight: 500, padding: '16px' }} placeholder="Connect with manufacturers directly..." />
                        </div>

                        {/* Image Upload Area */}
                        <div style={{ background: 'var(--admin-bg)', padding: '24px', borderRadius: '20px', border: '1.5px solid var(--admin-border)' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 20px' }}>Banner Background Image</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                                <div style={{ width: '200px', height: '120px', borderRadius: '16px', background: '#fff', border: '1.5px solid var(--admin-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {formData.image ? <img src={getImgUrl(formData.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️ No Image'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 600, marginBottom: '16px', lineHeight: 1.5 }}>Recommended: 1200x600px. Standard PNG or JPG. The image will be used as a background element in the slide slide.</p>
                                    <label style={{ display: 'inline-block', padding: '10px 20px', background: '#000', color: '#fff', borderRadius: '10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                                        {formData.image ? 'Change Banner Image' : 'Select Hero Banner Image'}
                                        <input type="file" className={styles['hidden']} accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                    {formData.image && (
                                        <button type="button" onClick={() => setFormData({...formData, image: ''})} style={{ marginLeft: '12px', color: '#ff4d4f', fontSize: '12px', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
                            {/* CTA 1 */}
                            <div style={{ padding: '24px', background: '#fff', borderRadius: '20px', border: '1.5px solid var(--admin-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ width: '24px', height: '24px', background: '#000', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                                    <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Primary CTA</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']} style={{ fontSize: '10px', fontWeight: 800 }}>Label</label>
                                        <input required name="cta1_label" value={formData.cta1_label} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }} />
                                    </div>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']} style={{ fontSize: '10px', fontWeight: 800 }}>Link</label>
                                        <input required name="cta1_link" value={formData.cta1_link} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input type="checkbox" name="cta1_needsAuth" checked={formData.cta1_needsAuth} onChange={handleInputChange} style={{ width: '16px', height: '16px' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>Require authentication?</span>
                                    </label>
                                </div>
                            </div>

                            {/* CTA 2 */}
                            <div style={{ padding: '24px', background: '#fff', borderRadius: '20px', border: '1.5px solid var(--admin-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ width: '24px', height: '24px', background: 'var(--admin-bg)', color: '#000', borderRadius: '6px', border: '1.5px solid var(--admin-border)', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                                    <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Secondary CTA</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']} style={{ fontSize: '10px', fontWeight: 800 }}>Label</label>
                                        <input required name="cta2_label" value={formData.cta2_label} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }} />
                                    </div>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']} style={{ fontSize: '10px', fontWeight: 800 }}>Link</label>
                                        <input required name="cta2_link" value={formData.cta2_link} onChange={handleInputChange} className={styles['admin-form-input']} style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Visual Palette & Gradients</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                {[
                                    { label: 'Grad Start', name: 'gradFrom' },
                                    { label: 'Grad Mid', name: 'gradMid' },
                                    { label: 'Grad End', name: 'gradTo' },
                                    { label: 'Accent Tool', name: 'accent' },
                                    { label: 'Design Dot 1', name: 'shape1' },
                                    { label: 'Design Dot 2', name: 'shape2' }
                                ].map((color: any) => (
                                    <div key={color.name} style={{ background: '#fff', border: '1.5px solid var(--admin-border)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="color" name={color.name} value={(formData as any)[color.name]} onChange={handleInputChange} style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>{color.label}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>{(formData as any)[color.name]}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1.5px solid var(--admin-border)', paddingTop: '32px', display: 'flex', gap: '16px' }}>
                            <button type="submit" className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`} style={{ flex: 1, height: '54px', borderRadius: '14px', fontSize: '16px', fontWeight: 900 }}>
                                {editingId ? 'Save Changes' : 'Create Slide'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setFormData(initialForm); setEditingId(null); }} className={styles['admin-btn']} style={{ width: '160px', height: '54px', borderRadius: '14px', fontSize: '16px', fontWeight: 800 }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminHeroSlides;
