'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getImgUrl } from '@/utils/imageConfig';
import styles from './AdminLayout.module.css';

const PRESET_COLORS = [
    { label: 'Ocean Blue', value: '#2563eb' },
    { label: 'Indigo', value: '#4f46e5' },
    { label: 'Violet', value: '#7c3aed' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Teal', value: '#0d9488' },
    { label: 'Slate', value: '#475569' },
];

const DATE_FORMATS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
    { value: 'D MMM YYYY', label: 'D MMM YYYY (31 Dec 2024)' },
];

const FieldRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', alignItems: 'flex-start', padding: '20px 0', borderBottom: '1px solid var(--admin-border)' }}>
        <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{label}</div>
            {hint && <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '3px', lineHeight: '1.5' }}>{hint}</div>}
        </div>
        <div>{children}</div>
    </div>
);

const Toggle = ({ on, onToggle, labelOn, labelOff, danger }: { on: boolean; onToggle: () => void; labelOn: string; labelOff: string; danger?: boolean }) => (
    <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px 16px', background: 'var(--admin-bg)', borderRadius: '10px', border: '1px solid var(--admin-border)' }}
    >
        <div style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', background: on ? (danger ? '#dc2626' : 'var(--primary-color)') : 'var(--admin-border)', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: on ? 'calc(100% - 21px)' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
        </div>
        <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{on ? labelOn : labelOff}</div>
        </div>
    </div>
);

const LogoUpload = ({ label, dark, preview, onFile, onClear, t }: { label: string; dark?: boolean; preview: string | null; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; t: any }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>}
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', border: '1px dashed var(--admin-border)', borderRadius: '10px', cursor: 'pointer', background: dark ? 'var(--admin-text-secondary)' : 'var(--admin-bg)', transition: 'border-color 0.15s' }}>
            {!preview ? (
                <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{t('click_to_upload') || 'Click to upload'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>{t('browse_files') || 'Browse files'}</span>
                </>
            ) : (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: dark ? 'transparent' : '#fff' }}>
                    <img src={getImgUrl(preview)} alt={label} style={{ maxHeight: '36px', maxWidth: '140px', objectFit: 'contain' }} />
                    <span onClick={e => { e.preventDefault(); onClear(); }} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', lineHeight: 1 }}>&#x2715;</span>
                </div>
            )}
            <input type="file" style={{ display: 'none' }} accept=".png,.svg,.jpg,.jpeg,.ico" onChange={onFile} />
        </label>
    </div>
);

const AdminSettings = () => {
    const router = useRouter();
    const { refreshSiteSettings, t } = useAuth();
    const { showToast } = useToast();

    const [settings, setSettings] = useState({
        site_name: '',
        seo_title: '',
        meta_description: '',
        keywords: '',
        primary_color: '#2563eb',
        pagination_limit: 10,
        maintenance_mode: false,
        enable_cron_reset: true,
        default_currency: '',
        default_language: '',
        date_format: 'DD/MM/YYYY',
        price_format: 'prefix',
        contact_email: '',
        contact_phone: '',
        address: '',
        ai_api_key: '',
        logo_dark: '',
        logo_light: '',
        favicon: '',
        footer_description: '',
        google_maps_enabled: false,
        google_maps_api_key: '',
        enable_recaptcha: false,
        recaptcha_site_key: '',
        recaptcha_secret_key: '',
    });

    const [languages, setLanguages] = useState<{ code: string; name: string; native_name: string }[]>([]);
    const [currencies, setCurrencies] = useState<{ code: string; name: string }[]>([]);
    const [darkLogoPreview, setDarkLogoPreview] = useState<string | null>(null);
    const [lightLogoPreview, setLightLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [downloadingBackup, setDownloadingBackup] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [sRes, lRes, cRes] = await Promise.all([
                    api.get('/admin/site-settings'),
                    api.get('/common/languages'),
                    api.get('/common/currencies'),
                ]);
                setSettings(prev => ({ ...prev, ...sRes.data }));
                setLanguages(lRes.data || []);
                setCurrencies(cRes.data || []);
                if (sRes.data.logo_dark) setDarkLogoPreview(sRes.data.logo_dark);
                if (sRes.data.logo_light) setLightLogoPreview(sRes.data.logo_light);
                if (sRes.data.favicon) setFaviconPreview(sRes.data.favicon);
            } catch (err) {
                console.error('Failed to load settings:', err);
            }
        };
        fetchInitialData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'dark' | 'light' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const result = ev.target?.result as string;
            if (type === 'dark') { setDarkLogoPreview(result); setSettings(p => ({ ...p, logo_dark: result })); }
            else if (type === 'light') { setLightLogoPreview(result); setSettings(p => ({ ...p, logo_light: result })); }
            else { setFaviconPreview(result); setSettings(p => ({ ...p, favicon: result })); }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put('/admin/site-settings', settings);
            document.documentElement.style.setProperty('--primary-color', settings.primary_color);
            document.documentElement.style.setProperty('--primary', settings.primary_color);
            document.documentElement.style.setProperty('--sp-primary', settings.primary_color);
            document.documentElement.style.setProperty('--clr-primary', settings.primary_color);
            refreshSiteSettings();
            showToast(t('settings_saved_success') || 'Settings saved successfully', 'success');
        } catch (err: any) {
            setError(err.response?.data?.message || t('failed_save_settings') || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBackupDownload = async () => {
        setDownloadingBackup(true);
        setError('');
        try {
            const response = await api.get('/admin/database-backup', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const cd = response.headers['content-disposition'] || response.headers['Content-Disposition'] || '';
            const match = cd.match(/filename="(.+)"/);
            link.setAttribute('download', match ? match[1] : 'database-backup.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(t('failed_backup_download') || 'Failed to download database backup.');
        } finally {
            setDownloadingBackup(false);
        }
    };

    const handleDirectImport = async () => {
        if (!window.confirm("Are you absolutely sure you want to trigger a full dummy data restoration?\n\nThis action will delete all current custom products, orders, chat history, reviews, and user accounts, and replace them with standard verified B2B buyer and supplier mock portfolios.")) {
            return;
        }

        setImporting(true);
        try {
            const { data } = await api.post('/admin/dummy-data/import');
            if (data.success) {
                showToast(data.message || 'Demo B2B datasets successfully populated and synchronized.', 'success');
            } else {
                showToast(data.message || 'Failed to import dummy B2B dataset.', 'error');
            }
        } catch (err: any) {
            console.error('Import failed:', err);
            showToast(err.response?.data?.message || 'Import failed due to database connection exception.', 'error');
        } finally {
            setImporting(false);
        }
    };



    return (
        <div className={styles['admin-page']}>
            {/* Header */}
            <div className={styles['admin-page-header']}>
                <div>
                    <h1 className={styles['admin-page-title']}>{t('system_configuration') || 'System Configuration'}</h1>
                    <p className={styles['admin-page-subtitle']}>{t('manage_global_settings') || 'Manage global site settings, branding, and platform behavior'}</p>
                </div>
            </div>

            {error && (
                <div className={`${styles['admin-alert']} ${styles['admin-alert-error']}`} style={{ marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSave}>

                {/* ── Site & SEO ── */}
                <div className={styles['admin-card']} style={{ marginBottom: '24px' }}>
                    <div className={styles['admin-card-header']}>
                        <h2>{t('site_seo') || 'Site & SEO'}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{t('site_identity_desc') || 'Site identity and search engine optimization'}</span>
                    </div>
                    <div className={styles['admin-card-body']}>
                        <FieldRow label={t('site_name') || "Site Name"} hint={t('site_name_hint') || "Displayed in browser tabs and emails"}>
                            <input name="site_name" value={settings.site_name} onChange={handleChange} className={styles['admin-form-input']} placeholder="My Platform" />
                        </FieldRow>
                        <FieldRow label={t('seo_title') || "SEO Title"} hint={t('seo_title_hint') || "Default meta title for all pages"}>
                            <input name="seo_title" value={settings.seo_title} onChange={handleChange} className={styles['admin-form-input']} placeholder="Best B2B Marketplace" />
                        </FieldRow>
                        <FieldRow label={t('meta_description') || "Meta Description"} hint={t('meta_description_hint') || "~160 chars shown in search results"}>
                            <textarea name="meta_description" value={settings.meta_description} onChange={handleChange} className={styles['admin-form-input']} placeholder={t('describe_platform_placeholder') || "Describe your platform..."} style={{ minHeight: '80px', resize: 'vertical' }} />
                        </FieldRow>
                        <FieldRow label={t('seo_keywords') || "SEO Keywords"} hint={t('seo_keywords_hint') || "Comma-separated keywords"}>
                            <textarea name="keywords" value={settings.keywords} onChange={handleChange} className={styles['admin-form-input']} placeholder="ecommerce, wholesale, b2b" style={{ minHeight: '60px', resize: 'vertical' }} />
                        </FieldRow>
                        <FieldRow label={t('footer_description') || "Footer Description"} hint={t('footer_description_hint') || "Shown in site footer brand block"}>
                            <textarea name="footer_description" value={settings.footer_description} onChange={handleChange} className={styles['admin-form-input']} placeholder={t('about_brand_placeholder') || "About your brand..."} style={{ minHeight: '60px', resize: 'vertical' }} />
                        </FieldRow>
                    </div>
                </div>

                {/* ── Branding ── */}
                <div className={styles['admin-card']} style={{ marginBottom: '24px' }}>
                    <div className={styles['admin-card-header']}>
                        <h2>{t('branding') || 'Branding'}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{t('branding_desc') || 'Primary color, logos, and favicon'}</span>
                    </div>
                    <div className={styles['admin-card-body']}>
                        <FieldRow label={t('primary_color') || "Primary Color"} hint={t('primary_color_hint') || "Used for buttons, links, and accents"}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <input type="color" name="primary_color" value={settings.primary_color.startsWith('#') ? settings.primary_color : '#2563eb'} onChange={handleChange} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--admin-border)', cursor: 'pointer', padding: '2px', background: 'transparent' }} />
                                <input type="text" name="primary_color" value={settings.primary_color} onChange={handleChange} className={styles['admin-form-input']} placeholder="#2563eb" style={{ fontFamily: 'monospace', maxWidth: '140px' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {PRESET_COLORS.map(opt => (
                                    <button key={opt.value} type="button" title={opt.label}
                                        onClick={() => setSettings(prev => ({ ...prev, primary_color: opt.value }))}
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', background: opt.value, border: settings.primary_color === opt.value ? '3px solid var(--admin-text-secondary)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: settings.primary_color === opt.value ? 'scale(1.15)' : 'scale(1)' }}
                                    />
                                ))}
                            </div>
                        </FieldRow>

                        <FieldRow label={t('logos') || "Logos"} hint={t('logos_hint') || "SVG or PNG recommended"}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                                <LogoUpload label={t('dark_logo_label') || "Dark Logo (on light bg)"} preview={darkLogoPreview} onFile={e => handleLogoChange(e, 'dark')} onClear={() => { setDarkLogoPreview(null); setSettings(p => ({ ...p, logo_dark: '' })); }} t={t} />
                                <LogoUpload label={t('light_logo_label') || "Light Logo (on dark bg)"} dark preview={lightLogoPreview} onFile={e => handleLogoChange(e, 'light')} onClear={() => { setLightLogoPreview(null); setSettings(p => ({ ...p, logo_light: '' })); }} t={t} />
                            </div>
                        </FieldRow>

                        <FieldRow label={t('favicon') || "Favicon"} hint={t('favicon_hint') || "ICO, PNG or SVG, 32x32px"}>
                            <div style={{ maxWidth: '180px' }}>
                                <LogoUpload label="" preview={faviconPreview} onFile={e => handleLogoChange(e, 'favicon')} onClear={() => { setFaviconPreview(null); setSettings(p => ({ ...p, favicon: '' })); }} t={t} />
                            </div>
                        </FieldRow>
                    </div>
                </div>

                {/* ── Platform Behavior ── */}
                <div className={styles['admin-card']} style={{ marginBottom: '24px' }}>
                    <div className={styles['admin-card-header']}>
                        <h2>{t('platform_behavior') || 'Platform Behavior'}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{t('platform_behavior_desc') || 'Currency, language, formats, and contact info'}</span>
                    </div>
                    <div className={styles['admin-card-body']}>
                        <FieldRow label={t('maintenance_mode') || "Maintenance Mode"} hint={t('maintenance_mode_hint') || "Blocks public access while you update"}>
                            <Toggle
                                on={settings.maintenance_mode}
                                onToggle={() => setSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                                labelOn={t('maintenance_active') || "Maintenance Active — public visitors see maintenance page"}
                                labelOff={t('site_live') || "Site is Live — all visitors can access the platform"}
                                danger
                            />
                        </FieldRow>

                        <FieldRow label={t('localization_settings') || "Localization"} hint={t('localization_hint') || "Default currency and interface language"}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{t('currency') || 'Currency'}</div>
                                    <select name="default_currency" value={settings.default_currency} onChange={handleChange} className={styles['admin-form-input']}>
                                        <option value="">{t('select_currency_placeholder') || 'Select currency...'}</option>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{t('language') || 'Language'}</div>
                                    <select name="default_language" value={settings.default_language} onChange={handleChange} className={styles['admin-form-input']}>
                                        <option value="">{t('select_language_placeholder') || 'Select language...'}</option>
                                        {languages.map(l => <option key={l.code} value={l.code}>{l.name} ({l.native_name})</option>)}
                                    </select>
                                </div>
                            </div>
                        </FieldRow>

                        <FieldRow label={t('display_formats') || "Display Formats"} hint={t('display_formats_hint') || "Date and price formatting"}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{t('date_format') || 'Date Format'}</div>
                                    <select name="date_format" value={settings.date_format} onChange={handleChange} className={styles['admin-form-input']}>
                                        {DATE_FORMATS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{t('price_format') || 'Price Format'}</div>
                                    <select name="price_format" value={settings.price_format} onChange={handleChange} className={styles['admin-form-input']}>
                                        <option value="prefix">{t('prefix') || 'Prefix'} — $500</option>
                                        <option value="suffix">{t('suffix') || 'Suffix'} — 500$</option>
                                    </select>
                                </div>
                            </div>
                        </FieldRow>

                        <FieldRow label={t('contact_details') || "Contact Details"} hint={t('contact_details_hint') || "Used in emails and site footer"}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '8px' }}>
                                <input name="contact_email" type="email" value={settings.contact_email} onChange={handleChange} className={styles['admin-form-input']} placeholder="support@company.com" />
                                <input name="contact_phone" type="text" value={settings.contact_phone} onChange={handleChange} className={styles['admin-form-input']} placeholder="+1 234 567 890" />
                            </div>
                            <input name="address" type="text" value={settings.address} onChange={handleChange} className={styles['admin-form-input']} placeholder={t('address_placeholder') || "123 Business St, City, Country"} />
                        </FieldRow>

                        <FieldRow label={t('items_per_page') || "Items Per Page"} hint={t('items_per_page_hint') || "Default pagination limit"}>
                            <input name="pagination_limit" type="number" min="5" max="100" value={settings.pagination_limit} onChange={handleChange} className={styles['admin-form-input']} style={{ maxWidth: '120px' }} />
                        </FieldRow>

                        <FieldRow label={t('google_maps') || "Google Maps"} hint={t('google_maps_hint') || "Address autocomplete and distance-based fees"}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Toggle
                                    on={settings.google_maps_enabled}
                                    onToggle={() => setSettings(prev => ({ ...prev, google_maps_enabled: !prev.google_maps_enabled }))}
                                    labelOn={t('maps_enabled_label') || "Maps Enabled — requires Maps JS, Places and Geocoding APIs"}
                                    labelOff={t('maps_disabled') || "Maps Disabled"}
                                />
                                {settings.google_maps_enabled && (
                                    <input name="google_maps_api_key" type="password" value={settings.google_maps_api_key || ''} onChange={handleChange} className={styles['admin-form-input']} placeholder="AIza... (Google Maps API Key)" />
                                )}
                            </div>
                        </FieldRow>

                        <FieldRow label={t('openai_api_key') || "OpenAI API Key"} hint={t('openai_hint') || "Powers AI-driven features across the platform"}>
                            <input name="ai_api_key" type="password" value={settings.ai_api_key || ''} onChange={handleChange} className={styles['admin-form-input']} placeholder="sk-..." />
                        </FieldRow>
                    </div>
                </div>

                {/* ── Security & Backup ── */}
                <div className={styles['admin-card']} style={{ marginBottom: '24px' }}>
                    <div className={styles['admin-card-header']}>
                        <h2>{t('security_backup') || 'Security & Backup'}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{t('security_backup_desc') || 'reCAPTCHA protection and database backup'}</span>
                    </div>
                    <div className={styles['admin-card-body']}>
                        <FieldRow label={t('recaptcha_v3') || "Google reCAPTCHA v3"} hint={t('recaptcha_hint') || "Protects login and signup forms from bots"}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Toggle
                                    on={settings.enable_recaptcha}
                                    onToggle={() => setSettings(prev => ({ ...prev, enable_recaptcha: !prev.enable_recaptcha }))}
                                    labelOn={t('recaptcha_active') || "reCAPTCHA Active — bot protection is enabled"}
                                    labelOff={t('recaptcha_disabled') || "reCAPTCHA Disabled"}
                                />
                                {settings.enable_recaptcha && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input name="recaptcha_site_key" type="text" value={settings.recaptcha_site_key || ''} onChange={handleChange} className={styles['admin-form-input']} placeholder={t('site_key_placeholder') || "Site Key (6Lc...)"} />
                                        <input name="recaptcha_secret_key" type="password" value={settings.recaptcha_secret_key || ''} onChange={handleChange} className={styles['admin-form-input']} placeholder={t('secret_key_placeholder') || "Secret Key (6Lc...)"} />
                                    </div>
                                )}
                            </div>
                        </FieldRow>

                        <FieldRow label={t('database_backup') || "Database Backup"} hint={t('database_backup_hint') || "Download a full JSON snapshot of all platform data"}>
                            <div className={styles['admin-section-box']} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{t('export_all_data') || 'Export All Data'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                                        {t('export_data_desc') || 'Download a complete JSON snapshot including users, products, orders, and settings. Recommended weekly.'}
                                    </div>
                                    <button type="button" onClick={handleBackupDownload} disabled={downloadingBackup}
                                        className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                        {downloadingBackup ? (t('preparing_backup') || 'Preparing backup...') : (t('download_backup') || 'Download Backup')}
                                    </button>
                                </div>
                            </div>
                        </FieldRow>

                        <FieldRow label={t('dummy_data_management') || "Demo Data & Import"} hint={t('dummy_data_management_hint') || "Clean dynamic datasets and restore default relational demo catalog"}>
                            <div className={styles['admin-section-box']} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <style>{`
                                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                                    .spinner { animation: spin 1s linear infinite; }
                                `}</style>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{t('restore_dummy_data') || 'Import / Restore Predefined B2B Catalog'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                                        {t('restore_dummy_data_desc') || 'Instantly restore baseline dummy B2B categories, products, customer accounts, orders, reviews, and inquiries.'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>


                                        <button type="button" onClick={() => router.push('/admin/dummy-data')}
                                            className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            {t('detailed_management') || 'Detailed History & Cleanup'}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', marginTop: '4px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>Daily Automated Reset (Cron)</div>
                                    <Toggle
                                        on={settings.enable_cron_reset}
                                        onToggle={() => setSettings(prev => ({ ...prev, enable_cron_reset: !prev.enable_cron_reset }))}
                                        labelOn="Enabled — Cron job runs at 2:00 AM everyday"
                                        labelOff="Disabled — Daily cron reset will not run"
                                    />
                                </div>
                            </div>
                        </FieldRow>
                    </div>
                </div>

                {/* ── Save Bar ── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', padding: '20px 24px', background: 'var(--admin-card-bg)', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                        {saving ? (t('saving_changes') || 'Saving changes...') : saved ? (t('all_changes_saved') || 'All changes saved') : (t('unsaved_changes') || 'You have unsaved changes')}
                    </span>
                    <button type="submit" disabled={saving} className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`} style={{ padding: '10px 32px' }}>
                        {saving ? (t('saving') || 'Saving...') : (t('save_settings') || 'Save Settings')}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AdminSettings;
