import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/axiosConfig';
import styles from './CompanyProfile.module.css';
import { getImgUrl } from '@/utils/imageConfig';
import GoogleAddressAutocomplete from '@/components/js/GoogleAddressAutocomplete';

const BuyerProfile = () => {
    const logoInputRef = useRef();
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
        logo: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
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
            
            if (logoFile) fd.append('logo', logoFile);

            await api.post('/company/profile', fd);
            setSuccess('✅ Profile updated successfully!');
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
                    <h2>Company Profile</h2>
                    <p>Manage your general business information to build trust with suppliers when submitting sourcing requests.</p>
                </div>
            </div>

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
                    className={`${styles['cp-tab-item']} ${activeTab === 'logo' ? styles['active'] : ''}`}
                    onClick={() => setActiveTab('logo')}
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
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={companyData.phone_country || companyData.country}
                                        onChange={e => setCompanyData({ ...companyData, phone_country: e.target.value })}
                                        style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', minWidth: '70px', cursor: 'pointer', fontSize: '14px' }}
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
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                            <div className={styles['cp-field']}>
                                <label>Company Mobile</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={companyData.mobile_country || companyData.country}
                                        onChange={e => setCompanyData({ ...companyData, mobile_country: e.target.value })}
                                        style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', minWidth: '70px', cursor: 'pointer', fontSize: '14px' }}
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
                                        style={{ flex: 1 }}
                                    />
                                </div>
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

                {activeTab === 'logo' && (
                    <div className={styles['cp-section'] + " " + styles['fade-in']}>
                        <h3>Company Logo</h3>
                        <div className={styles['cp-upload-box']} style={{ maxWidth: '400px' }}>
                            <label>Upload Logo</label>
                            <div className={styles['cp-logo-preview']} onClick={() => logoInputRef.current.click()}>
                                {logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>Click to upload logo</span>}
                            </div>
                            <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoChange} />
                        </div>
                    </div>
                )}

                <div className={styles['cp-actions']}>
                    <button type="submit" className={styles['cp-btn-primary']} disabled={loading}>
                        {loading ? 'Updating...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BuyerProfile;
