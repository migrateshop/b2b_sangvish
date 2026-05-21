import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import styles from './AdminEmailTemplates.module.css';

interface EmailTemplate {
    _id: string;
    name: string;
    description: string;
    slug: string;
    subject: string;
    status: string;
}

const AdminEmailTemplates: React.FC = () => {
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useRouter();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/email-templates');
            setTemplates(res.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
            setErrorMsg('Failed to fetch templates.');
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await api.delete(`/admin/email-templates/${id}`);
                showToast('Template deleted successfully', 'success');
                fetchTemplates();
            } catch (err) {
                showToast('Error occurred while deleting', 'error');
            }
        }
    };

    return (
        <div className={styles['aet-container']}>
            <div className={styles['aet-header']}>
                <div className={styles['aet-title-box']}>
                    <h1>Email Templates</h1>
                    <p>Manage all system transactional emails and their dynamic content.</p>
                </div>
                <button className={styles['aet-btn-add']} onClick={() => navigate.push('/admin/email-templates/add')}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Template
                </button>
            </div>

            {errorMsg && <div className={`${styles['aet-alert']} ${styles['error']}`}>{errorMsg}</div>}

            {loading ? (
                <div className={`${styles['aet-alert']} ${styles['info']}`}>Loading templates...</div>
            ) : (
                <div className={styles['aet-table-card']}>
                    <table className={styles['aet-table']}>
                        <thead>
                            <tr>
                                <th>Template Name</th>
                                <th>Slug</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(t => (
                                <tr key={t._id}>
                                    <td>
                                        <div className={styles['aet-template-name']}>{t.name}</div>
                                        <div className={styles['aet-template-desc']}>{t.description}</div>
                                    </td>

                                    <td><span className={styles['aet-template-slug']}>{t.slug}</span></td>
                                    <td>{t.subject}</td>
                                    <td>
                                        <span className={`${styles['aet-badge']} ${styles[t.status] || ''}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => navigate.push(`/admin/email-templates/edit/${t._id}`)} className="admin-action-btn-edit">Edit</button>
                                            <button onClick={() => handleDelete(t._id)} className="admin-action-btn-delete">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No templates found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminEmailTemplates;
