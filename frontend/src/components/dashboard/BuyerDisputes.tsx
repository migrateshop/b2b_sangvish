import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

const STATUS_COLORS = {
    open: { bg: '#fef3c7', color: '#92400e', label: 'Open' },
    under_review: { bg: '#eff6ff', color: '#1d4ed8', label: 'Under Review' },
    resolved_buyer_favored: { bg: '#dcfce7', color: '#166534', label: 'Resolved (Buyer)' },
    resolved_supplier_favored: { bg: '#f0fdf4', color: '#15803d', label: 'Resolved (Supplier)' },
    closed: { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};

const BuyerDisputes = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [buyerMsg, setBuyerMsg] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchDisputes = async () => {
        try {
            const { data } = await api.get('/disputes/my-disputes');
            setDisputes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDisputes(); }, []);

    useEffect(() => {
        if (selected) {
            const updated = disputes.find(d => d._id === selected._id);
            if (updated) setSelected(updated);
        }
    }, [disputes]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!buyerMsg.trim()) return;
        setSendingMsg(true);
        try {
            await api.post(`/disputes/${selected._id}/message`, { message: buyerMsg });
            setBuyerMsg('');
            await fetchDisputes();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSendingMsg(false);
        }
    };

    const filtered = filterStatus === 'all' ? disputes : disputes.filter(d => d.status === filterStatus);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading your disputes...</div>;

    return (
        <div className="buyer-disputes-wrapper">
            <style jsx global>{`
                .buyer-disputes-wrapper {
                    display: flex;
                    gap: 24px;
                    height: calc(100vh - 120px);
                }
                .buyer-disputes-left {
                    width: ${selected ? '350px' : '100%'};
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    overflow-y: auto;
                }
                .buyer-disputes-right {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    overflow-y: auto;
                }

                @media (max-width: 1024px) {
                    .buyer-disputes-wrapper {
                        gap: 0;
                        height: auto !important;
                        min-height: calc(100vh - 120px);
                        display: block !important;
                    }
                    .buyer-disputes-left {
                        width: 100% !important;
                        display: ${selected ? 'none' : 'flex'} !important;
                        padding: 10px !important;
                    }
                    .buyer-disputes-right {
                        width: 100% !important;
                        flex: none !important;
                        display: ${selected ? 'flex' : 'none'} !important;
                        padding: 0 !important;
                        overflow-x: hidden !important;
                    }
                    .dispute-detail-container {
                        padding: 12px !important;
                        border-radius: 0 !important;
                        border: none !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .dispute-header-mobile {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        margin-bottom: 16px !important;
                        flex-wrap: nowrap !important;
                        gap: 8px !important;
                    }
                    .dispute-stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        padding: 12px !important;
                    }
                    .chat-messages-container {
                        max-height: none !important;
                        min-height: 200px !important;
                        padding: 10px !important;
                        overflow-y: visible !important;
                    }
                    .chat-input-form {
                        padding: 10px !important;
                        border-radius: 0 !important;
                        margin-top: 0 !important;
                        position: sticky;
                        bottom: 0;
                        background: #fff !important;
                        border-top: 1px solid #eee !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        gap: 8px !important;
                    }
                    .chat-input-form input {
                        flex: 1 !important;
                        min-width: 0 !important;
                        padding: 8px 12px !important;
                        font-size: 13px !important;
                    }
                    .chat-input-form button {
                        padding: 8px 14px !important;
                        font-size: 13px !important;
                        flex-shrink: 0 !important;
                    }
                }
            `}</style>

            {/* Left Panel: List */}
            <div className="buyer-disputes-left">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a1a2e' }}>My Disputes</h2>
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>{filtered.length} found</span>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['all', 'open', 'under_review', 'closed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} style={{
                            padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                            border: 'none', cursor: 'pointer',
                            background: filterStatus === s ? 'var(--primary-color)' : '#f1f5f9',
                            color: filterStatus === s ? '#fff' : '#64748b',
                            textTransform: 'capitalize'
                        }}>
                            {s === 'all' ? 'All' : STATUS_COLORS[s]?.label || s}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        No active disputes
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map(d => {
                            const sc = STATUS_COLORS[d.status] || STATUS_COLORS.open;
                            const isSelected = selected?._id === d._id;
                            return (
                                <div
                                    key={d._id}
                                    onClick={() => setSelected(d)}
                                    style={{
                                        background: '#fff', borderRadius: '16px', padding: '20px',
                                        border: `2px solid ${isSelected ? 'var(--primary-color)' : '#f1f5f9'}`,
                                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isSelected ? '0 10px 25px rgba(13,46,103,0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '2px' }}>
                                                Order #{String(d.order_id?._id || d.order_id || '').slice(-6).toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                                                Opened on {new Date(d.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', background: sc.bg, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                    
                                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Reason</div>
                                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>{d.reason}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelected(d); }}
                                            style={{
                                                padding: '8px 18px', borderRadius: '10px', border: 'none',
                                                background: isSelected ? 'var(--primary-color)' : '#f1f5f9',
                                                color: isSelected ? '#fff' : '#475569',
                                                fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            View Details
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Panel: Detail view and Chat */}
            {selected && (
                <div className="buyer-disputes-right">
                    <div className="dispute-detail-container" style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div className="dispute-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.4px' }}>Dispute Details</h3>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #f1f5f9', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#64748b', transition: 'all 0.2s' }}>✕ Close</button>
                        </div>
 
                        <div className="dispute-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Reason</div>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{selected.reason}</div>
                            </div>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Current Status</div>
                                <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: STATUS_COLORS[selected.status]?.bg, color: STATUS_COLORS[selected.status]?.color }}>
                                    {STATUS_COLORS[selected.status]?.label || selected.status}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Detailed Description</div>
                                <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>{selected.description}</div>
                            </div>
                        </div>
                    </div>
 
                    <div className="dispute-detail-container" style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%' }}></div>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Thread</h4>
                        </div>
 
                        <div className="chat-messages-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '500px', paddingRight: '12px', paddingBottom: '20px' }}>
                            {selected.messages?.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
                                    <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, maxWidth: '280px', margin: '0 auto' }}>Wait for admin or supplier response. You can add more details to your claim below.</div>
                                </div>
                            )}
                            {selected.messages?.map((msg, i) => {
                                const isMe = msg.sender_role === 'buyer';
                                const isAdmin = msg.sender_role === 'admin';
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                                            background: isAdmin ? '#fff1f2' : isMe ? 'var(--primary-color)' : '#ecfdf5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: '900',
                                            color: isAdmin ? '#e11d48' : isMe ? '#fff' : '#10b981',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                        }}>
                                            {isAdmin ? 'A' : isMe ? 'B' : 'S'}
                                        </div>
                                        <div style={{
                                            background: isAdmin ? '#fff1f2' : isMe ? '#f8fafc' : '#f0fdf4',
                                            border: `1px solid ${isAdmin ? '#fee2e2' : isMe ? '#e2e8f0' : '#dcfce7'}`,
                                            borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px', 
                                            padding: '12px 16px', maxWidth: '80%',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                        }}>
                                            <div style={{ fontSize: '10px', fontWeight: '800', color: isMe ? 'var(--primary-color)' : '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {isAdmin ? 'Platform Admin' : isMe ? 'You' : 'Supplier'}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>{msg.message}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'right', fontWeight: 600 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
 
                        {!['resolved_buyer_favored', 'resolved_supplier_favored', 'closed'].includes(selected.status) && (
                            <form onSubmit={handleSendMessage} className="chat-input-form" style={{ display: 'flex', gap: '12px', marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <input
                                    value={buyerMsg}
                                    onChange={e => setBuyerMsg(e.target.value)}
                                    placeholder="Type your message here..."
                                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <button type="submit" disabled={sendingMsg} style={{
                                    padding: '12px 24px', borderRadius: '12px', border: 'none',
                                    background: 'var(--primary-color)', color: '#fff', fontWeight: '800', cursor: 'pointer',
                                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(13,46,103,0.2)', fontSize: '14px'
                                }}>
                                    {sendingMsg ? '...' : 'Send'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerDisputes;
