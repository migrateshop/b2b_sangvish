import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const STEPS = {
    AUTH_START: 'auth_start',
    OTP: 'otp',
    ROLE: 'role',
    SETUP: 'setup',
    BUSINESS: 'business',
    LOGIN: 'login',
    FORGOT_PASSWORD: 'forgot_password',
    RESET_PASSWORD: 'reset_password'
};

// Sub-component to safely handle reCAPTCHA execution
const ReCaptchaHandler = ({ onToken }: { onToken: (token: string) => void }) => {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const handleVerify = useCallback(async () => {
        if (!executeRecaptcha) return;
        try {
            const token = await executeRecaptcha('auth_flow');
            onToken(token);
        } catch (err) {
            console.error('reCAPTCHA error:', err);
        }
    }, [executeRecaptcha, onToken]);

    useEffect(() => { handleVerify(); }, [handleVerify]);
    return null;
};

const AuthModal = ({ isOpen: propIsOpen, onClose: propOnClose, initialMode }: { isOpen?: boolean; onClose?: () => void; initialMode?: string }) => {
    const { authModal, closeAuthModal, siteSettings } = useAuth();
    const navigate = useRouter();
    
    // Support both prop-based (standalone) and context-based (global) usage
    const isOpen = propIsOpen !== undefined ? propIsOpen : authModal.isOpen;
    const onClose = propOnClose || closeAuthModal;

    const [mode, setMode] = useState(STEPS.AUTH_START);
    const [email, setEmail] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('IN');
    const [countries, setCountries] = useState<any[]>([]);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [businessType, setBusinessType] = useState<string[]>([]);
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [stateProvince, setStateProvince] = useState('');
    const [states, setStates] = useState<any[]>([]);
    const otpRefs = useRef<any>([]);
    const [socialConfig, setSocialConfig] = useState({ google: false, facebook: false, linkedin: false });
    const [socialUrls, setSocialUrls] = useState<any>({});

    const handleSocialLogin = async (provider: string) => {
        const url = socialUrls[provider];
        if (!url) {
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Login is not fully configured by administrator.`);
            return;
        }
        window.location.href = url;
    };

    useEffect(() => {
        if (isOpen) {
            setMode((initialMode as any) || authModal.mode || STEPS.AUTH_START);
            setRole(authModal.role || 'buyer');
            setError('');
            
            // Initialization data
            api.get('/auth/countries').then(({ data }) => {
                setCountries(data);
                const india = data.find((c: any) => c.code === 'IN');
                if (india) setSelectedCountry('IN');
            }).catch(() => { });

            api.get('/auth/business-types').then(({ data }) => setBusinessTypes(data)).catch(() => { });
            api.get('/social-login/public').then(({ data }) => setSocialConfig(data)).catch(() => { });
            api.get('/auth/social-urls').then(({ data }) => setSocialUrls(data)).catch(() => { });
        }
    }, [isOpen, initialMode, authModal.mode, authModal.role]);

    useEffect(() => {
        if (selectedCountry) {
            api.get(`/auth/states/${selectedCountry}`)
                .then(({ data }) => {
                    setStates(data);
                    setStateProvince('');
                })
                .catch(() => { setStates([]); });
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (mode === STEPS.OTP && resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [mode, resendTimer]);

    if (!isOpen) return null;

    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    );

    const EyeOffIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { 
                email, password, recaptchaToken
            });

            if (data.requiresOTP) {
                setMode(STEPS.OTP);
                setResendTimer(60);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            onClose();
            const userRole = data.role || (data.roles && data.roles[0]) || 'buyer';
            if (userRole === 'admin') window.location.href = '/admin/dashboard';
            else if (userRole === 'supplier') window.location.href = '/supplier/dashboard';
            else window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) return setError('Email is required');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setResendTimer(60);
            setMode(STEPS.RESET_PASSWORD);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const code = otp.join('');
        if (code.length < 6) return setError('All six digits required.');
        if (!password) return setError('Please set a new password');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp: code, newPassword: password });
            setMode(STEPS.LOGIN);
            setError('');
            // Optional: Show success message
            alert('Password reset successful. Please login with your new password.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailContinue = async (e?: any) => {
        if (e && e.preventDefault) e.preventDefault();
        setError('');
        if (!email) return setError('Email is required');
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email, role, recaptchaToken });
            setResendTimer(60);
            setMode(STEPS.OTP);
        } catch (err: any) {
            // Check if user exists but has password (redirect to login)
            if (err.response?.status === 409) {
                 setMode(STEPS.LOGIN);
            } else {
                 setError(err.response?.data?.message || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    };

    const handleOtpContinue = async () => {
        setError('');
        const code = otp.join('');
        if (code.length < 6) return setError('All six digits required.');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp: code });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            if (data.first_name) {
                onClose();
                const userRole = data.role || (data.roles && data.roles[0]) || 'buyer';
                if (userRole === 'admin') window.location.href = '/admin/dashboard';
                else if (userRole === 'supplier') window.location.href = '/supplier/dashboard';
                else window.location.reload();
            } else {
                setMode(STEPS.ROLE);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (mode === STEPS.OTP) setMode(STEPS.AUTH_START);
        else if (mode === STEPS.ROLE) setMode(STEPS.OTP);
        else if (mode === STEPS.SETUP) setMode(STEPS.ROLE);
        else if (mode === STEPS.BUSINESS) setMode(STEPS.SETUP);
        else if (mode === STEPS.LOGIN) setMode(STEPS.AUTH_START);
        else if (mode === STEPS.FORGOT_PASSWORD) setMode(STEPS.LOGIN);
        else if (mode === STEPS.RESET_PASSWORD) setMode(STEPS.FORGOT_PASSWORD);
    };

    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!agreed) return setError('Please agree to terms.');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                email, password, first_name: firstName, last_name: lastName,
                phone_number: phoneNumber, role, company_name: companyName,
                country_code: selectedCountry, recaptchaToken
            });
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            if (role === 'supplier') setMode(STEPS.BUSINESS);
            else {
                onClose();
                if (data.role === 'admin') window.location.href = '/admin/dashboard';
                else window.location.reload();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    const handleBusinessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/auth/update-profile', { business_type: businessType, state: stateProvince });
            onClose();
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save business info');
        } finally {
            setLoading(false);
        }
    };

    const renderSocialButtons = () => {
        if (!socialConfig.google && !socialConfig.facebook && !socialConfig.linkedin) return null;
        return (
            <>
                <div className="social-btns-group">
                    {socialConfig.google && (
                        <button className="social-btn premium-social" onClick={() => handleSocialLogin('google')}>
                            <svg viewBox="0 0 24 24" className="social-icon" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    )}
                </div>
                <div className="divider"><span>OR</span></div>
            </>
        );
    };

    return (
        <div className="auth-modal-overlay d-flex align-center justify-center" onClick={onClose}>
            {siteSettings?.enable_recaptcha && siteSettings?.recaptcha_site_key && (
                <ReCaptchaHandler onToken={setRecaptchaToken} />
            )}
            <div className="auth-modal-content register-card" onClick={e => e.stopPropagation()}>
                <button className="auth-modal-close-v2" onClick={onClose}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                {mode !== STEPS.AUTH_START && mode !== STEPS.LOGIN && (
                    <button className="auth-modal-back-v2" onClick={handleBack}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                )}

                {mode === STEPS.AUTH_START && (
                    <>
                        <h2 className="register-title-v2">Sign in or create account</h2>
                        {renderSocialButtons()}
                        <form onSubmit={handleEmailContinue}>
                            <div className="float-input-wrap">
                                <input type="email" className="float-input" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} required />
                                <label className="float-label">Enter your email address</label>
                            </div>
                            {error && <p className="reg-error">{error}</p>}
                            <button type="submit" className="reg-btn-primary-v2" disabled={loading}>{loading ? 'Checking...' : 'Continue'}</button>
                        </form>
                    </>
                )}

                {mode === STEPS.LOGIN && (
                    <>
                        <h2 className="register-title-v2">Sign in</h2>
                        {renderSocialButtons()}
                        <form onSubmit={handleLogin}>
                            <div className="float-input-wrap">
                                <input type="email" className="float-input" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} required />
                                <label className="float-label">Email address</label>
                            </div>
                            <div className="float-input-wrap mt-1">
                                <input type={showPassword ? 'text' : 'password'} className="float-input" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} required />
                                <label className="float-label">Password</label>
                                <button type="button" className="toggle-pw-v2" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            <div className="d-flex justify-end mt-1">
                                <button type="button" className="reg-link-btn" style={{ fontSize: '13px' }} onClick={() => setMode(STEPS.FORGOT_PASSWORD)}>Forgot password?</button>
                            </div>
                            {error && <p className="reg-error">{error}</p>}
                            <button type="submit" className="reg-btn-primary-v2" disabled={loading}>Sign in</button>
                        </form>
                        <p className="reg-footer-text-v2">New user? <button type="button" className="reg-link-btn" onClick={() => setMode(STEPS.AUTH_START)}>Register</button></p>
                    </>
                )}

                {mode === STEPS.OTP && (
                    <>
                        <div className="otp-header">
                            <h2 className="register-title-v2">Check your email</h2>
                            <p className="otp-sub">We sent a 6-digit code to<br /><strong>{email}</strong></p>
                        </div>
                        <div className="otp-boxes-v2">
                            {otp.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`otp-box-v2 ${d ? 'filled' : ''}`}
                                    value={d}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                />
                            ))}
                        </div>
                        {error && <p className="reg-error">{error}</p>}
                        <button className="reg-btn-primary-v2" onClick={handleOtpContinue} disabled={loading}>Verify & Continue</button>
                        <p className="otp-resend-row">
                            Didn't receive the code?{' '}
                            {resendTimer > 0 ? <span className="otp-timer">Resend in {resendTimer}s</span> : 
                            <button className="reg-link-btn" onClick={() => handleEmailContinue()}>Resend code</button>}
                        </p>
                    </>
                )}

                {mode === STEPS.ROLE && (
                    <>
                        <h2 className="register-title-v2">Select account type</h2>
                        <div className="role-options">
                            <label className={`role-card-v2 ${role === 'buyer' ? 'selected' : ''}`} onClick={() => setRole('buyer')}>
                                <strong>Buyer</strong>
                                <p>Source from global suppliers</p>
                            </label>
                            <label className={`role-card-v2 ${role === 'supplier' ? 'selected' : ''}`} onClick={() => setRole('supplier')}>
                                <strong>Supplier</strong>
                                <p>Sell to global buyers</p>
                            </label>
                        </div>
                        <button className="reg-btn-primary-v2" onClick={() => setMode(STEPS.SETUP)}>Continue</button>
                    </>
                )}

                {mode === STEPS.SETUP && (
                    <>
                        <h2 className="register-title-v2">Create account</h2>
                        <form onSubmit={handleSetupSubmit}>
                            <div className="name-row">
                                <div className="float-input-wrap">
                                    <input type="text" className="float-input" placeholder=" " value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                    <label className="float-label">First name</label>
                                </div>
                                <div className="float-input-wrap">
                                    <input type="text" className="float-input" placeholder=" " value={lastName} onChange={e => setLastName(e.target.value)} required />
                                    <label className="float-label">Last name</label>
                                </div>
                            </div>
                            {role === 'supplier' && (
                                <div className="float-input-wrap mt-1">
                                    <input type="text" className="float-input" placeholder=" " value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                                    <label className="float-label">Company name</label>
                                </div>
                            )}
                            <div className="float-input-wrap mt-1">
                                <input type={showPassword ? 'text' : 'password'} className="float-input" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} required />
                                <label className="float-label">Set password</label>
                                <button type="button" className="toggle-pw-v2" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                            </div>
                            <div className="phone-row mt-1">
                                <div className="float-input-wrap" style={{ width: '100px', marginBottom: 0 }}>
                                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="float-select">
                                        {countries.map(c => <option key={c._id} value={c.code}>{c.flag} {c.dial_code}</option>)}
                                    </select>
                                </div>
                                <div className="float-input-wrap flex-1 no-margin">
                                    <input type="tel" className="float-input" placeholder=" " value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                                    <label className="float-label">Phone number</label>
                                </div>
                            </div>
                            <label className="terms-row">
                                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} required />
                                <span>Agree to <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</span>
                            </label>
                            {error && <p className="reg-error">{error}</p>}
                            <button type="submit" className="reg-btn-primary-v2" disabled={loading}>Create account</button>
                        </form>
                    </>
                )}

                {mode === STEPS.BUSINESS && (
                    <>
                        <h2 className="register-title-v2">Business Details</h2>
                        <form onSubmit={handleBusinessSubmit}>
                            <div className="business-type-options">
                                {businessTypes.map(type => (
                                    <label key={type._id} className={`business-type-card ${businessType.includes(type.name) ? 'checked' : ''}`}>
                                        <input type="checkbox" checked={businessType.includes(type.name)} onChange={e => e.target.checked ? setBusinessType([...businessType, type.name]) : setBusinessType(businessType.filter(i => i !== type.name))} />
                                        <span>{type.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="float-input-wrap mt-1">
                                <input type="text" className="float-input" placeholder=" " value={stateProvince} onChange={e => setStateProvince(e.target.value)} required />
                                <label className="float-label">State/province</label>
                            </div>
                            {error && <p className="reg-error">{error}</p>}
                            <button type="submit" className="reg-btn-primary-v2" disabled={loading}>Submit</button>
                        </form>
                    </>
                )}
                {mode === STEPS.FORGOT_PASSWORD && (
                    <>
                        <h2 className="register-title-v2">Forgot password?</h2>
                        <p className="otp-sub">Enter your email and we'll send you a code to reset your password.</p>
                        <form onSubmit={handleForgotPassword}>
                            <div className="float-input-wrap">
                                <input type="email" className="float-input" placeholder=" " value={email} onChange={e => setEmail(e.target.value)} required />
                                <label className="float-label">Email address</label>
                            </div>
                            {error && <p className="reg-error">{error}</p>}
                            <button type="submit" className="reg-btn-primary-v2" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'}</button>
                        </form>
                    </>
                )}

                {mode === STEPS.RESET_PASSWORD && (
                    <>
                        <div className="otp-header">
                            <h2 className="register-title-v2">Reset password</h2>
                            <p className="otp-sub">Enter the 6-digit code sent to<br /><strong>{email}</strong></p>
                        </div>
                        <div className="otp-boxes-v2">
                            {otp.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`otp-box-v2 ${d ? 'filled' : ''}`}
                                    value={d}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                />
                            ))}
                        </div>
                        <div className="float-input-wrap mt-2">
                            <input type={showPassword ? 'text' : 'password'} className="float-input" placeholder=" " value={password} onChange={e => setPassword(e.target.value)} required />
                            <label className="float-label">New password</label>
                            <button type="button" className="toggle-pw-v2" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {error && <p className="reg-error">{error}</p>}
                        <button className="reg-btn-primary-v2" onClick={handleResetPassword} disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
                        <p className="otp-resend-row">
                            Didn't receive the code?{' '}
                            {resendTimer > 0 ? <span className="otp-timer">Resend in {resendTimer}s</span> : 
                            <button className="reg-link-btn" onClick={() => handleForgotPassword({ preventDefault: () => {} } as any)}>Resend code</button>}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
