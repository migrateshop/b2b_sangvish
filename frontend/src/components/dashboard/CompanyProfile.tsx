import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/axiosConfig';
import styles from './CompanyProfile.module.css';
import { getImgUrl } from '@/utils/imageConfig';
import GoogleAddressAutocomplete from '@/components/js/GoogleAddressAutocomplete';

const CompanyProfile = () => {
    const logoInputRef = useRef();
    const docInputRef = useRef();
    const bannerInputRef = useRef();

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    const [companyData, setCompanyData] = useState({
        company_name: '',
        business_type: '',
        country: '',
        state: '',
        city: '',
        address: '',
        website: '',
        phone: '',
        phone_country: '',
        mobile: '',
        mobile_country: '',
        description: '',
        logo: '',
        document: '',
        banner_image: '',
        staff_size: '',
        factory_area: '',
        annual_revenue: '',
        capabilities: '',
        certifications: '',
        tax_id: '',
        id_proof: '',
        verification_status: 'pending',
        rejection_reason: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [docFile, setDocFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [bannerPreview, setBannerPreview] = useState('');
    const [businessTypes, setBusinessTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        fetchProfile();
        fetchBusinessTypes();
        fetchCountries();
    }, []);

    useEffect(() => {
        if (companyData.country && countries.length > 0) {
            const country = countries.find(c => c.name === companyData.country);
            if (country) {
                fetchStates(country._id);
            }
        }
    }, [companyData.country, countries]);

    const fetchCountries = async () => {
        try {
            const { data } = await api.get('/common/countries');
            setCountries(data);
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    };

    const fetchStates = async (countryId) => {
        try {
            const { data } = await api.get(`/common/states/${countryId}`);
            setStates(data);
        } catch (err) {
            console.error('Error fetching states:', err);
        }
    };

    const fetchBusinessTypes = async () => {
        try {
            const { data } = await api.get('/auth/business-types');
            setBusinessTypes(data);
        } catch (err) {
            console.error('Error fetching business types:', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/company/profile');
            if (data) {
                setCompanyData(data);
                if (data.logo) setLogoPreview(getImgUrl(data.logo));
                if (data.banner_image) setBannerPreview(getImgUrl(data.banner_image));
            }
        } catch (err) {
            console.error('Error fetching company profile:', err);
        }
    };

    const handleCountryChange = async (e) => {
        const countryId = e.target.value;
        const selectedCountry = countries.find(c => c._id === countryId);
        if (selectedCountry) {
            setCompanyData(prev => ({ ...prev, country: selectedCountry.name, state: '' }));
            fetchStates(countryId);
        }
    };

    const handleAddressSelect = async (data) => {
        setCompanyData(prev => ({
            ...prev,
            address: data.addressLine || data.formatted_address,
            city: data.city || prev.city
        }));

        if (data.country) {
            const matchedCountry = countries.find(c => 
                c.countryCode === data.country || 
                c.name.toLowerCase() === data.country.toLowerCase()
            );
            
            if (matchedCountry) {
                setCompanyData(prev => ({ ...prev, country: matchedCountry.name }));
                try {
                    const { data: stateData } = await api.get(`/common/states/${matchedCountry._id}`);
                    setStates(stateData);
                    if (data.state) {
                        const matchedState = stateData.find(s => s.name.toLowerCase() === data.state.toLowerCase());
                        if (matchedState) {
                            setCompanyData(prev => ({ ...prev, state: matchedState.name }));
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch states during autocomplete:', err);
                }
            }
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDocChange = (e) => {
        const file = e.target.files[0];
        if (file) setDocFile(file);
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setBannerPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const fd = new FormData();
            fd.append('company_name', companyData.company_name);
            fd.append('business_type', companyData.business_type);
            fd.append('country', companyData.country);
            fd.append('state', companyData.state);
            fd.append('city', companyData.city);
            fd.append('address', companyData.address);
            fd.append('website', companyData.website);
            fd.append('phone', companyData.phone);
            fd.append('phone_country', companyData.phone_country || companyData.country);
            fd.append('mobile', companyData.mobile);
            fd.append('mobile_country', companyData.mobile_country || companyData.country);
            fd.append('description', companyData.description);
            fd.append('staff_size', companyData.staff_size);
            fd.append('factory_area', companyData.factory_area);
            fd.append('annual_revenue', companyData.annual_revenue);
            fd.append('capabilities', companyData.capabilities);
            fd.append('certifications', companyData.certifications);
            fd.append('tax_id', companyData.tax_id);
            fd.append('id_proof', companyData.id_proof);

            if (logoFile) fd.append('logo', logoFile);
            if (docFile) fd.append('document', docFile);
            if (bannerFile) fd.append('banner_image', bannerFile);

            await api.post('/company/profile', fd);
            setSuccess('✅ Profile updated successfully! Verification is pending review.');
            fetchProfile();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['cp-container']} style={{ background: '#fff', boxShadow: 'none' }}>
            <div className={styles['cp-header-v2']}>
                <div className={styles['cp-header-left']}>
                    <h2>{'Company Profile'}</h2>
                    <p>Manage your business identity, verification documents, and branding assets.</p>
                </div>
                <div className={styles['cp-status-chip']}>
                    <div className={`${styles['status-indicator']} ${styles[companyData.verification_status]}`}></div>
                    <span className={styles['status-text']}>
                        {companyData.verification_status === 'verified' ? 'Verified Business' : 
                         companyData.verification_status === 'pending' ? 'Verification Pending' : 
                         companyData.verification_status === 'rejected' ? 'Verification Rejected' : 'Unverified'}
                    </span>
                </div>
            </div>

            {companyData.verification_status === 'rejected' && companyData.rejection_reason && (
                <div className={styles['cp-rejection-banner']}>
                    <div className={styles['rejection-icon']}>⚠️</div>
                    <div className={styles['rejection-body']}>
                        <strong>Verification Rejected:</strong> {companyData.rejection_reason}
                        <p>Please update the required information and resubmit for review.</p>
                    </div>
                </div>
            )}

            <div className={styles['cp-tabs-v2']}>
                <button 
                    type="button" 
                    className={`${styles['cp-tab-item']} ${activeTab === 'basic' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Basic Details
                </button>
                <button 
                    type="button" 
                    className={`${styles['cp-tab-item']} ${activeTab === 'location' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('location')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Address
                </button>
                <button 
                    type="button" 
                    className={`${styles['cp-tab-item']} ${activeTab === 'stats' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    Capability
                </button>
                <button 
                    type="button" 
                    className={`${styles['cp-tab-item']} ${activeTab === 'media' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('media')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    Branding
                </button>
            </div>

            <form className={styles['cp-form']} onSubmit={handleSubmit}>
                {error && <div className={styles['cp-alert-error']}>{error}</div>}
                {success && <div className={styles['cp-alert-success']}>{success}</div>}

                {activeTab === 'basic' && (
                    <div className={styles['cp-section'] + " " + styles['fade-in']}>
                        <h3>Basic Information</h3>
                        <div className={styles['cp-grid']}>
                            <div className={styles['cp-field']}>
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    value={companyData.company_name}
                                    onChange={e => setCompanyData({ ...companyData, company_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Business Type *</label>
                                <select
                                    value={companyData.business_type}
                                    onChange={e => setCompanyData({ ...companyData, business_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {businessTypes.map(type => (
                                        <option key={type._id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Website</label>
                                <input
                                    type="text"
                                    value={companyData.website}
                                    onChange={e => setCompanyData({ ...companyData, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        <div className={styles['cp-grid'] + " " + styles['mt-4']}>
                            <div className={styles['cp-field']}>
                                <label>Company Phone</label>
                                <div>
                                    <select
                                        value={companyData.phone_country || companyData.country}
                                        onChange={e => setCompanyData({ ...companyData, phone_country: e.target.value })}
                                        style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        {countries.map(c => (
                                            <option key={c._id} value={c.name}>{c.code} {c.dial_code}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={companyData.phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const country = countries.find(c => c.name === (companyData.phone_country || companyData.country));
                                            const maxLen = country ? country.phone_length : 15;
                                            if (val.length <= maxLen) setCompanyData({ ...companyData, phone: val });
                                        }}
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Company Mobile</label>
                                <div>
                                    <select
                                        value={companyData.mobile_country || companyData.country}
                                        onChange={e => setCompanyData({ ...companyData, mobile_country: e.target.value })}
                                        style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        {countries.map(c => (
                                            <option key={c._id} value={c.name}>{c.code} {c.dial_code}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={companyData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const country = countries.find(c => c.name === (companyData.mobile_country || companyData.country));
                                            const maxLen = country ? country.phone_length : 15;
                                            if (val.length <= maxLen) setCompanyData({ ...companyData, mobile: val });
                                        }}
                                        placeholder="Mobile Number"
                                    />
                                </div>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Company Fax</label>
                                <input
                                    type="text"
                                    value={companyData.fax || ''}
                                    onChange={e => setCompanyData({ ...companyData, fax: e.target.value })}
                                    placeholder="+91 XXXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className={styles['cp-field'] + " " + styles['full'] + " " + styles['mt-4']}>
                            <label>Company Description</label>
                            <textarea
                                rows="4"
                                value={companyData.description}
                                onChange={e => setCompanyData({ ...companyData, description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'location' && (
                    <div className={styles['cp-section'] + " " + styles['fade-in']}>
                        <h3>Location Details</h3>
                        <div className={styles['cp-field'] + " " + styles['full']}>
                            <label>Business Address (Street, Building, etc.)</label>
                            <GoogleAddressAutocomplete 
                                onAddressSelect={handleAddressSelect}
                                placeholder={companyData.address || "Enter business address"}
                                className={styles['cp-input']}
                            />
                        </div>

                        <div className={styles['cp-grid'] + " " + styles['mt-4']}>
                            <div className={styles['cp-field']}>
                                <label>Country/Region</label>
                                <select
                                    value={countries.find(c => c.name === companyData.country)?._id || ''}
                                    onChange={handleCountryChange}
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(c => (
                                        <option key={c._id} value={c._id}>{c.flag} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>City</label>
                                <input
                                    type="text"
                                    value={companyData.city}
                                    onChange={e => setCompanyData({ ...companyData, city: e.target.value })}
                                    placeholder="e.g. Mumbai"
                                />
                            </div>
                            <div className={styles['cp-field']}>
                                <label>State</label>
                                <select
                                    value={companyData.state}
                                    onChange={e => setCompanyData({ ...companyData, state: e.target.value })}
                                    disabled={!companyData.country}
                                >
                                    <option value="">Select State</option>
                                    {states.map(s => (
                                        <option key={s._id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className={styles['cp-section'] + " " + styles['fade-in']}>
                        <h3>Business Stats & Capability</h3>
                        <div className={styles['cp-grid']}>
                            <div className={styles['cp-field']}>
                                <label>Staff Size</label>
                                <select
                                    value={companyData.staff_size}
                                    onChange={e => setCompanyData({ ...companyData, staff_size: e.target.value })}
                                >
                                    <option value="">Select Size</option>
                                    <option value="1-5 staff">1-5 staff</option>
                                    <option value="5-50 staff">5-50 staff</option>
                                    <option value="50-100 staff">50-100 staff</option>
                                    <option value="100-500 staff">100-500 staff</option>
                                    <option value="500+ staff">500+ staff</option>
                                </select>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Factory Area (e.g., 1,200+ m²)</label>
                                <input
                                    type="text"
                                    value={companyData.factory_area}
                                    onChange={e => setCompanyData({ ...companyData, factory_area: e.target.value })}
                                    placeholder="e.g. 2000 m²"
                                />
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Annual Revenue</label>
                                <select
                                    value={companyData.annual_revenue}
                                    onChange={e => setCompanyData({ ...companyData, annual_revenue: e.target.value })}
                                >
                                    <option value="">Select Revenue</option>
                                    <option value="Below $100k">Below $100k</option>
                                    <option value="$100k - $1M">$100k - $1M</option>
                                    <option value="$1M - $10M">$1M - $10M</option>
                                    <option value="$10M - $50M">$10M - $50M</option>
                                    <option value="Above $50M">Above $50M</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles['cp-grid'] + " " + styles['mt-4']}>
                            <div className={styles['cp-field']}>
                                <label>Factory Capabilities</label>
                                <input
                                    type="text"
                                    value={companyData.capabilities}
                                    onChange={e => setCompanyData({ ...companyData, capabilities: e.target.value })}
                                    placeholder="e.g. Warranty available, Inspection"
                                />
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Certifications (e.g. CE, ISO)</label>
                                <input
                                    type="text"
                                    value={companyData.certifications}
                                    onChange={e => setCompanyData({ ...companyData, certifications: e.target.value })}
                                    placeholder="e.g. CE, ISO 9001"
                                />
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Tax ID / GST Number</label>
                                <input
                                    type="text"
                                    value={companyData.tax_id}
                                    onChange={e => setCompanyData({ ...companyData, tax_id: e.target.value })}
                                    placeholder="e.g. GSTIN12345678"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'media' && (
                    <div className={styles['cp-section'] + " " + styles['fade-in']}>
                        <h3>Branding & Media Assets</h3>
                        <div className={styles['cp-banner-upload']}>
                            <label>Company Banner Image</label>
                            <div className={styles['cp-banner-preview']} onClick={() => bannerInputRef.current.click()}>
                                {bannerPreview ? <img src={bannerPreview} alt="Banner" /> : <span>Click to upload banner (Large image recommended)</span>}
                            </div>
                            <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={handleBannerChange} />
                        </div>

                        <div className={styles['cp-upload-grid'] + " " + styles['mt-4']}>
                            <div className={styles['cp-upload-box']}>
                                <label>Company Logo</label>
                                <div className={styles['cp-logo-preview']} onClick={() => logoInputRef.current.click()}>
                                    {logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>Click to upload logo</span>}
                                </div>
                                <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoChange} />
                            </div>

                            <div className={styles['cp-upload-box']}>
                                <label>Business License / Tax Certificate</label>
                                <div className={styles['cp-doc-uploader']} onClick={() => docInputRef.current.click()}>
                                    {docFile ? <p>📄 {docFile.name}</p> : (companyData.document || companyData.id_proof) ? <p>✅ Document Uploaded</p> : <p>Click to upload business license (PDF/Doc/Image)</p>}
                                </div>
                                <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx,image/*" onChange={handleDocChange} />
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles['cp-actions']}>
                    <button type="submit" className={styles['cp-btn-primary']} disabled={loading}>
                        {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyProfile;
