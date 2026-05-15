import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';

const SecuritySettings = () => {
    const { user, login } = useAuth();
    const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleToggle2FA = async () => {
        setLoading(true);
        setMessage('');
        try {
            const { data } = await api.put('/auth/update-security', {
                twoFactorEnabled: !twoFactor
            });
            setTwoFactor(data.twoFactorEnabled);
            // Update context
            login({ ...user, twoFactorEnabled: data.twoFactorEnabled });
            setMessage(data.message);
        } catch (err) {
            setMessage('Failed to update security settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="security-settings-card bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-blue-600">🛡️</span> Account Security & Compliance
            </h2>

            <div className="security-item flex items-center justify-between py-6 border-b border-slate-50">
                <div className="security-info">
                    <h3 className="font-bold text-slate-700">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-slate-500 max-w-md">Add an extra layer of security to your account. We will send a verification code to your email during login.</p>
                </div>
                <div className="security-action">
                    <button
                        onClick={handleToggle2FA}
                        disabled={loading}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${twoFactor
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        {loading ? 'Processing...' : twoFactor ? '✓ Enabled' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            <div className="security-item flex items-center justify-between py-6 border-b border-slate-50">
                <div className="security-info">
                    <h3 className="font-bold text-slate-700">Email Verification</h3>
                    <p className="text-sm text-slate-500">Your primary email address is used for critical alerts and 2FA.</p>
                </div>
                <div className="security-action">
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        Verified
                    </span>
                </div>
            </div>

            <div className="security-item flex items-center justify-between py-6">
                <div className="security-info">
                    <h3 className="font-bold text-slate-700">Fraud Protection</h3>
                    <p className="text-sm text-slate-500">Our AI-driven system monitors your account for suspicious activity.</p>
                </div>
                <div className="security-action">
                    <span className="text-xs text-slate-400 font-bold italic">Active</span>
                </div>
            </div>

            {message && (
                <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium animate-pulse">
                    {message}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <h4 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-widest">GDPR & Privacy</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        We value your privacy. Your data is encrypted and handled according to our global compliance standards.
                        You can request a data export or account deletion by contacting our legal compliance team at support@alibaba-clone.com.
                    </p>
                </div>
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-widest">Why this matters?</h4>
                    <p className="text-xs text-blue-600 leading-relaxed">
                        Maintaining high security standards is mandatory for <b>Verified Supplier</b> status. This section ensures your account complies with global trade safety regulations, protecting both you and your buyers from fraud and data breaches.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
