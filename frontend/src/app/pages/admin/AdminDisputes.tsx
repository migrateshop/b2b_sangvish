import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import styles from './AdminLayout.module.css';

const STATUS_DETAILS: Record<string, { badge: string; label: string }> = {
    open: { badge: 'admin-badge-warning', label: 'Open' },
    under_review: { badge: 'admin-badge-info', label: 'Under Review' },
    resolved_buyer_favored: { badge: 'admin-badge-success', label: 'Resolved (Buyer)' },
    resolved_supplier_favored: { badge: 'admin-badge-success', label: 'Resolved (Supplier)' },
    closed: { badge: 'admin-badge-neutral', label: 'Closed' },
};

interface Dispute {
    _id: string;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
    buyer_id?: { first_name: string; last_name: string };
    supplier_id?: { company_name?: string; first_name: string; last_name: string };
    order_id?: { _id: string };
    messages?: Array<{ sender_role: string; message: string; timestamp: string }>;
}

const AdminDisputes = () => {
    const { showToast } = useToast();
    const { t } = useAuth();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Dispute | null>(null); 
    const [resolveModal, setResolveModal] = useState(false);
    const [resolution, setResolution] = useState('resolved_buyer_favored');
    const [adminNote, setAdminNote] = useState('');
    const [issueRefund, setIssueRefund] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [adminMsg, setAdminMsg] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/site-settings');
                if (data?.pagination_limit) setItemsPerPage(data.pagination_limit);
            } catch (err) { }
        };
        fetchSettings();
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/disputes/admin/all');
            setDisputes(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch disputes');
            setLoading(false);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        setResolving(true);
        try {
            await api.put(`/disputes/${selected._id}/resolve`, { resolution, adminNote, issueRefund });
            setResolveModal(false);
            setAdminNote('');
            setIssueRefund(false);
            const { data } = await api.get('/disputes/admin/all');
            setDisputes(data);
            if (selected) {
                const updated = data.find((d: Dispute) => d._id === selected._id);
                setSelected(updated);
            }
            showToast('Dispute resolved successfully', 'success');
        } catch (err) {
            showToast('Failed to resolve dispute', 'error');
        } finally {
            setResolving(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || !adminMsg.trim()) return;
        setSendingMsg(true);
        try {
            await api.post(`/disputes/${selected._id}/message`, { message: adminMsg });
            setAdminMsg('');
            const { data } = await api.get('/disputes/admin/all');
            setDisputes(data);
            const updated = data.find((d: Dispute) => d._id === selected._id);
            if (updated) setSelected(updated);
            showToast('Message sent', 'success');
        } catch (err) {
            showToast('Failed to send message', 'error');
        } finally {
            setSendingMsg(false);
        }
    };

    const filtered = filterStatus === 'all' ? disputes : disputes.filter(d => d.status === filterStatus);

    const stats = {
        total: disputes.length,
        open: disputes.filter(d => d.status === 'open').length,
        under_review: disputes.filter(d => d.status === 'under_review').length,
        resolved: disputes.filter(d => ['resolved_buyer_favored', 'resolved_supplier_favored', 'closed'].includes(d.status)).length,
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDisputes = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <div className={"admin-page"}>
            <style dangerouslySetInnerHTML={{ __html: `
                .dispute-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    animation: disputeFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .dispute-panel {
                    background: #ffffff;
                    border-radius: 24px;
                    box-shadow: 0 25px 80px rgba(13, 46, 103, 0.16);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    width: 95%;
                    max-width: 860px;
                    max-height: 88vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: disputeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .dark .dispute-panel {
                    background: #0d1630;
                    border-color: rgba(30, 41, 59, 0.8);
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
                }
                .dispute-header {
                    padding: 24px 32px;
                    background: linear-gradient(135deg, var(--primary-color, #0d2e67) 0%, #061633 100%);
                    color: #ffffff;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .dispute-header-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.02em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dispute-header-subtitle {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-top: 4px;
                    font-weight: 500;
                }
                .dispute-close-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 1.15rem;
                    transition: all 0.2s;
                }
                .dispute-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }
                .dispute-body {
                    padding: 32px;
                    overflow-y: auto;
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }
                @media (max-width: 768px) {
                    .dispute-body {
                        grid-template-columns: 1fr;
                    }
                }
                .dispute-card {
                    background: #f8fafc;
                    border-radius: 18px;
                    padding: 22px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
                }
                .dark .dispute-card {
                    background: #111a36;
                    border-color: rgba(30, 41, 59, 0.6);
                }
                .dispute-card-title {
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: var(--primary-color);
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                    border-bottom: 1.5px solid rgba(13, 46, 103, 0.08);
                    padding-bottom: 8px;
                }
                .dispute-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                .dispute-label {
                    color: #64748b;
                    font-weight: 600;
                }
                .dispute-value {
                    font-weight: 700;
                    color: #1e293b;
                }
                .dark .dispute-value {
                    color: #f1f5f9;
                }
                .dispute-desc-box {
                    margin-top: 14px;
                    padding: 14px;
                    background: #fffbeb;
                    border-radius: 12px;
                    border-left: 4px solid #f59e0b;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #78350f;
                }
                .dispute-timeline-section {
                    grid-column: span 2;
                }
                @media (max-width: 768px) {
                    .dispute-timeline-section {
                        grid-column: span 1;
                    }
                }
                .dispute-chat-box {
                    max-height: 280px;
                    overflow-y: auto;
                    padding: 18px;
                    background: #f1f5f9;
                    border-radius: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .dark .dispute-chat-box {
                    background: #090f24;
                }
                .dispute-chat-box::-webkit-scrollbar {
                    width: 6px;
                }
                .dispute-chat-box::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.08);
                    border-radius: 10px;
                }
                .dispute-bubble {
                    max-width: 78%;
                    padding: 12px 18px;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    font-size: 13px;
                    line-height: 1.45;
                }
                .dispute-bubble-admin {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
                    color: #1e1b4b;
                    border-bottom-right-radius: 4px;
                }
                .dispute-bubble-other {
                    align-self: flex-start;
                    background: #ffffff;
                    color: #1e293b;
                    border-bottom-left-radius: 4px;
                }
                .dark .dispute-bubble-other {
                    background: #111a36;
                    color: #f1f5f9;
                }
                .dispute-footer {
                    padding: 24px 32px;
                    background: #f8fafc;
                    border-top: 1px solid rgba(226, 232, 240, 0.8);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .dark .dispute-footer {
                    background: #0e1633;
                    border-color: rgba(30, 41, 59, 0.8);
                }
                @keyframes disputeFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes disputeSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            ` }} />

            <div className={"admin-page-header"}>
                <div>
                    <h1 className={"admin-page-title"}>{t('dispute_management') || 'Dispute Management'}</h1>
                    <p className={"admin-page-subtitle"}>{t('dispute_management_desc') || 'Mediate and resolve platform disputes between buyers and suppliers'}</p>
                </div>
            </div>

            {error && <div className={styles['admin-alert'] + " " + styles['admin-alert-error']}>{error}</div>}

            {/* Stats Cards Section - Matching Order Page */}
            <div className={"admin-stats-grid"}>
                <div className={"admin-stat-premium"} style={{ borderLeft: '4px solid var(--primary-color)' }}>
                    <div className={"admin-stat-card-label"}>Total Disputes</div>
                    <div className={"admin-stat-card-value"}>{stats.total}</div>
                </div>
                <div className={"admin-stat-premium"} style={{ borderLeft: '4px solid #854d0e' }}>
                    <div className={"admin-stat-card-label"}>Open</div>
                    <div className={"admin-stat-card-value"} style={{ color: '#854d0e' }}>{stats.open}</div>
                </div>
                <div className={"admin-stat-premium"} style={{ borderLeft: '4px solid #1d4ed8' }}>
                    <div className={"admin-stat-card-label"}>Under Review</div>
                    <div className={"admin-stat-card-value"} style={{ color: '#1d4ed8' }}>{stats.under_review}</div>
                </div>
                <div className={"admin-stat-premium"} style={{ borderLeft: '4px solid #166534' }}>
                    <div className={"admin-stat-card-label"}>Resolved</div>
                    <div className={"admin-stat-card-value"} style={{ color: '#166534' }}>{stats.resolved}</div>
                </div>
            </div>

            <div className={"admin-card" + " " + styles['mt-6']}>
                <div className={""} style={{ padding: '16px 24px', borderBottom: '1px solid var(--admin-border)' }}>
                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['all', 'open', 'under_review', 'resolved_buyer_favored', 'resolved_supplier_favored', 'closed'].map(s => (
                            <button key={s} onClick={() => { setFilterStatus(s); setCurrentPage(1); }} className={`admin-btn ${filterStatus === s ? 'admin-btn-primary' : 'admin-btn-secondary'}`} style={{ fontSize: '11px', padding: '6px 14px' }}>
                                {s === 'all' ? 'All Disputes' : (STATUS_DETAILS[s]?.label || s)}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={"admin-table"}>
                        <thead>
                            <tr>
                                <th>Dispute ID</th>
                                <th>Reason</th>
                                <th>Buyer</th>
                                <th>Supplier</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className={"admin-loading-text"}>Loading Disputes...</td>
                                </tr>
                            ) : currentDisputes.length === 0 ? (
                                <tr className={""}>
                                    <td colSpan={7}>No disputes found</td>
                                </tr>
                            ) : (
                                currentDisputes.map(d => (
                                    <tr key={d._id} className={selected?._id === d._id ? 'admin-table-row-selected' : ''}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800 }}>
                                            #{d._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: 'var(--admin-text-main)', fontSize: '13px' }}>
                                                {d.reason}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 700, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {d.description}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '12px' }}>
                                                {d.buyer_id?.first_name} {d.buyer_id?.last_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>
                                                {d.supplier_id?.company_name || `${d.supplier_id?.first_name} ${d.supplier_id?.last_name}`}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${STATUS_DETAILS[d.status]?.badge || 'admin-badge-neutral'}`}>
                                                {STATUS_DETAILS[d.status]?.label || d.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                                            {new Date(d.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setSelected(d)}
                                                className={"admin-action-btn-edit"}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} disputes
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Prev</button>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dispute Detail Sidebar Overlay (similar to a fly-out or modal) */}
            {selected && (
                <div className="dispute-overlay" onClick={() => setSelected(null)}>
                    <div className="dispute-panel" onClick={e => e.stopPropagation()}>
                        <div className="dispute-header">
                            <div>
                                <h3 className="dispute-header-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                    Dispute #{selected._id.slice(-8).toUpperCase()}
                                </h3>
                                <div className="dispute-header-subtitle">Resolution Control Center</div>
                            </div>
                            <button className="dispute-close-btn" onClick={() => setSelected(null)}>&times;</button>
                        </div>
                        
                        <div className="dispute-body">
                            {/* Case Information */}
                            <div className="dispute-card">
                                <h4 className="dispute-card-title">Case Information</h4>
                                <div className="dispute-row">
                                    <span className="dispute-label">Reason</span>
                                    <span className="dispute-value">{selected.reason}</span>
                                </div>
                                <div className="dispute-row">
                                    <span className="dispute-label">Opened On</span>
                                    <span className="dispute-value">{new Date(selected.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="dispute-row">
                                    <span className="dispute-label">Status</span>
                                    <span className={`admin-badge ${STATUS_DETAILS[selected.status]?.badge || 'admin-badge-neutral'}`}>
                                        {STATUS_DETAILS[selected.status]?.label || selected.status}
                                    </span>
                                </div>
                                <div className="dispute-desc-box">
                                    <strong style={{ display: 'inline-block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.02em' }}>Description:</strong><br/>
                                    {selected.description}
                                </div>
                            </div>

                            {/* Parties & Order */}
                            <div className="dispute-card">
                                <h4 className="dispute-card-title">Parties & Order</h4>
                                <div className="dispute-row" style={{ alignItems: 'center' }}>
                                    <span className="dispute-label">Buyer</span>
                                    <span className="dispute-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(13, 46, 103, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                                            {selected.buyer_id?.first_name?.charAt(0)}{selected.buyer_id?.last_name?.charAt(0)}
                                        </span>
                                        {selected.buyer_id?.first_name} {selected.buyer_id?.last_name}
                                    </span>
                                </div>
                                <div className="dispute-row" style={{ alignItems: 'center' }}>
                                    <span className="dispute-label">Supplier</span>
                                    <span className="dispute-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                                            {selected.supplier_id?.company_name?.charAt(0) || selected.supplier_id?.first_name?.charAt(0)}
                                        </span>
                                        {selected.supplier_id?.company_name || `${selected.supplier_id?.first_name} ${selected.supplier_id?.last_name}`}
                                    </span>
                                </div>
                                <div className="dispute-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span className="dispute-label">Order Attachment</span>
                                    <span className="dispute-value">
                                        <a href={`/admin/orders/${selected.order_id?._id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 800 }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            Order #{String(selected.order_id?._id).slice(-8)}
                                        </a>
                                    </span>
                                </div>
                            </div>

                            {/* Message Thread */}
                            <div className="dispute-card dispute-timeline-section">
                                <h4 className="dispute-card-title">Communication History</h4>
                                <div className="dispute-chat-box">
                                    {selected.messages?.length === 0 ? (
                                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>No messages exchanged yet.</div>
                                    ) : (
                                        selected.messages?.map((msg, i) => {
                                            const isAdmin = msg.sender_role === 'admin';
                                            return (
                                                <div key={i} className={`dispute-bubble ${isAdmin ? 'dispute-bubble-admin' : 'dispute-bubble-other'}`}>
                                                    <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', color: isAdmin ? '#1d4ed8' : '#64748b', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                        <span>{msg.sender_role}</span>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div style={{ fontSize: '13.5px', color: 'inherit', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.message}</div>
                                                </div>
                                            );
                                        })
                                    ) || []}
                                </div>
                                
                                {!['resolved_buyer_favored', 'resolved_supplier_favored', 'closed'].includes(selected.status) && (
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <input
                                            className={styles['admin-form-input']}
                                            style={{ borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.08)', padding: '12px 16px', fontSize: '13px' }}
                                            value={adminMsg}
                                            onChange={e => setAdminMsg(e.target.value)}
                                            placeholder="Write an internal note or reply to parties..."
                                        />
                                        <button className={"admin-btn" + " " + "admin-btn-primary"} style={{ borderRadius: '12px', padding: '0 24px', fontWeight: 800 }} disabled={sendingMsg}>
                                            {sendingMsg ? '...' : 'Send'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        <div className="dispute-footer">
                            <button className={"admin-btn" + " " + "admin-btn-secondary"} style={{ borderRadius: '12px', fontWeight: 800 }} onClick={() => setSelected(null)}>Close Details</button>
                            {!['resolved_buyer_favored', 'resolved_supplier_favored', 'closed'].includes(selected.status) && (
                                <button className={"admin-btn" + " " + "admin-btn-primary"} style={{ borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary-color) 0%, #1a4a99 100%)' }} onClick={() => setResolveModal(true)}>Resolve Case</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {resolveModal && selected && (
                <div className="dispute-overlay" style={{ zIndex: 10005 }}>
                    <div className="dispute-panel" style={{ maxWidth: '500px', borderRadius: '24px' }}>
                        <div className="dispute-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                            <h3 className="dispute-header-title">Verify Resolution</h3>
                            <button className="dispute-close-btn" onClick={() => setResolveModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleResolve}>
                            <div className="dispute-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']} style={{ fontWeight: 800 }}>Resolution Decision</label>
                                    <select
                                        className={styles['admin-form-select']}
                                        style={{ borderRadius: '12px', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                        value={resolution}
                                        onChange={e => setResolution(e.target.value)}
                                    >
                                        <option value="resolved_buyer_favored">Favor Buyer (Refund Recommended)</option>
                                        <option value="resolved_supplier_favored">Favor Supplier (Release Payment)</option>
                                        <option value="closed">Close with No Action</option>
                                        <option value="under_review">Further Review Required</option>
                                    </select>
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']} style={{ fontWeight: 800 }}>Resolution Note</label>
                                    <textarea
                                        className={styles['admin-form-textarea']}
                                        style={{ borderRadius: '12px', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                        rows={3}
                                        value={adminNote}
                                        onChange={e => setAdminNote(e.target.value)}
                                        placeholder="Explain the logic behind this decision..."
                                    />
                                </div>
                                {resolution === 'resolved_buyer_favored' && (
                                    <div style={{ padding: '16px', background: '#fff1f2', borderRadius: '14px', border: '1.5px solid #fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" id="refund-chk" checked={issueRefund} onChange={e => setIssueRefund(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        <label htmlFor="refund-chk" style={{ fontSize: '13px', fontWeight: 800, color: '#9f1239', cursor: 'pointer', selectText: 'none' }}>Automatically Issue Stripe Refund</label>
                                    </div>
                                )}
                            </div>
                            <div className="dispute-footer" style={{ background: '#f8fafc' }}>
                                <button type="button" className={"admin-btn" + " " + "admin-btn-secondary"} style={{ borderRadius: '12px', fontWeight: 800 }} onClick={() => setResolveModal(false)}>Cancel</button>
                                <button type="submit" className={"admin-btn" + " " + "admin-btn-primary"} style={{ borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} disabled={resolving}>
                                    {resolving ? 'Applying...' : 'Apply Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDisputes;
