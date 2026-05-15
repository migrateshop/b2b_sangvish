import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './AdminLayout.module.css';

// ─── TYPES ──────────────────────────────────────────────────
interface Country {
    _id: string;
    name: string;
    code: string;
    dial_code: string;
    flag: string;
}

interface CountrySelectProps {
    value: string;
    countries: Country[];
    onChange: (country: Country) => void;
}

interface User {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    roles?: string[];
    status: string;
    company_name?: string;
    phone_number?: string;
    country_code?: string;
    business_type?: string[];
    state?: string;
    createdAt?: string;
}

interface Role {
    _id: string;
    name: string;
}

interface BusinessType {
    _id: string;
    name: string;
    status: string;
}

interface State {
    _id: string;
    name: string;
}

// ─── CUSTOM COUNTRY SELECT COMPONENT ────────────────────────
const CountrySelect: React.FC<CountrySelectProps> = ({ value, countries, onChange }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    const selectedCountry = countries.find((c: Country) => c.code === value);
    const filteredCountries = countries.filter((c: Country) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.dial_code.includes(search)
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !(dropdownRef.current as any).contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className={styles['admin-country-select-container']} style={{ position: 'relative', width: '130px', flexShrink: 0 }}>
            <div
                className={styles['admin-form-input']}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {selectedCountry && <img src={getImgUrl(`/uploads/flags/${selectedCountry.code.toLowerCase()}.png`)} alt="" style={{ width: '16px', height: '11px', borderRadius: '1px' }} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.target as HTMLImageElement).style.display = 'none'} />}
                    {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.dial_code}` : 'Code'}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
            </div>

            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--admin-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--admin-border-subtle)', position: 'sticky', top: 0, background: '#fff' }}>
                        <input
                            autoFocus
                            className={styles['admin-form-input']}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div style={{ overflowY: 'auto' }}>
                        {filteredCountries.length === 0 ? (
                            <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No matches</div>
                        ) : (
                            filteredCountries.map((c: Country) => (
                                <div
                                    key={c._id}
                                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', background: value === c.code ? '#f1f5f9' : 'transparent' }}
                                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLDivElement).style.background = '#f8fafc'}
                                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLDivElement).style.background = value === c.code ? '#f1f5f9' : 'transparent'}
                                    onClick={() => {
                                        onChange(c);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <img src={getImgUrl(`/uploads/flags/${c.code.toLowerCase()}.png`)} alt="" style={{ width: '16px', height: '11px', borderRadius: '1px' }} onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => (e.target as HTMLImageElement).style.display = 'none'} />
                                        <span style={{ fontWeight: 600 }}>{c.flag} {c.dial_code}</span>
                                    </div>
                                    <span style={{ marginLeft: '6px', color: '#64748b', fontSize: '11px' }}>({c.code})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface AdminUsersProps {
    roleFilter?: string;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ roleFilter }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { siteSettings, t } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [roleDropdownValue, setRoleDropdownValue] = useState('All');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(siteSettings?.pagination_limit || 10);

    useEffect(() => {
        if (siteSettings?.pagination_limit) {
            setItemsPerPage(siteSettings.pagination_limit);
        }
    }, [siteSettings?.pagination_limit]);

    const [editFormData, setEditFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        status: '',
        company_name: '',
        phone_number: '',
        country_code: '',
        business_type: [] as string[],
        state: ''
    });


    const [newUserData, setNewUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: roleFilter || 'buyer',
        status: 'active',
        company_name: '',
        phone_number: '',
        country_code: '',
        business_type: [] as string[],
        state: ''
    });

    const [roles, setRoles] = useState<Role[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [statesLoading, setStatesLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchCountries();
        fetchBusinessTypes();
    }, [roleFilter]);

    const fetchBusinessTypes = async () => {
        try {
            const { data } = await api.get('/admin/business-types');
            setBusinessTypes((data || []).filter((t: BusinessType) => t.status === 'Active'));
        } catch (err: any) {
            console.error('Failed to fetch business types:', err);
        }
    };

    const fetchCountries = async () => {
        try {
            const { data } = await api.get('/common/countries');
            setCountries(data || []);
        } catch (err: any) {
            console.error('Failed to fetch countries:', err);
        }
    };

    const fetchStates = async (countryCode: string) => {
        if (!countryCode) {
            setStates([]);
            return;
        }
        setStatesLoading(true);
        try {
            const { data } = await api.get(`/auth/states/${countryCode}`);
            setStates(data || []);
        } catch (err: any) {
            console.error('Failed to fetch states:', err);
        } finally {
            setStatesLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/admin/roles');
            setRoles(data || []);
        } catch (err: any) {
            console.error('Failed to fetch roles:', err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth/admin/users');
            // Filter by role if roleFilter is provided
            const filtered = roleFilter ? data.filter((u: User) => (u.roles || [u.role]).includes(roleFilter)) : data;
            setUsers(filtered);
            setLoading(false);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
            setLoading(false);
        }
    };

    // Fetch states when editing user country changes
    useEffect(() => {
        if (editFormData.country_code) {
            fetchStates(editFormData.country_code);
        }
    }, [editFormData.country_code]);

    // Fetch states when new user country changes
    useEffect(() => {
        if (newUserData.country_code) {
            fetchStates(newUserData.country_code);
        }
    }, [newUserData.country_code]);

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'buyer',
            status: user.status || 'active',
            company_name: user.company_name || '',
            phone_number: user.phone_number || '',
            country_code: user.country_code || '',
            business_type: user.business_type || [],
            state: user.state || ''
        });
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingUser) return;
            await api.put(`/auth/admin/users/${editingUser._id}/status`, editFormData);
            setEditingUser(null);
            fetchUsers();
            showToast('User updated successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update user', 'error');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/admin/users', newUserData);
            setIsAddingUser(false);
            setNewUserData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                role: roleFilter || 'buyer',
                status: 'active',
                company_name: '',
                phone_number: '',
                country_code: '',
                business_type: [],
                state: ''
            });
            fetchUsers();
            showToast('User created successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create user', 'error');
        }
    };

    // Filter Logic
    const filteredUsers = users.filter((u: User) => {
        const matchesSearch =
            u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Use dropdown filter only if we are on "All Users" page
        const matchesDropdown = roleFilter ? true : (
            roleDropdownValue === 'All' || (u.roles || [u.role]).some((r: string) => r.toLowerCase() === roleDropdownValue.toLowerCase())
        );

        return matchesSearch && matchesDropdown;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const stats = [
        { label: t('total_users') || 'Total Users', value: users.length },
        { label: t('active') || 'Active', value: users.filter((u: User) => u.status === 'active').length },
        { label: t('suppliers') || 'Suppliers', value: users.filter((u: User) => (u.roles || [u.role]).includes('supplier')).length },
        { label: t('buyers') || 'Buyers', value: users.filter((u: User) => (u.roles || [u.role]).includes('buyer')).length },
    ];

    const title = roleFilter ? (t(roleFilter.toLowerCase() + 's') || `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s`) : (t('user_management') || 'User Management');

    return (
        <div className={styles['admin-page']}>
            <div className={"admin-page-header"}>
                <div>
                    <h1 className={styles['admin-page-title']}>{title}</h1>
                    <p className={styles['admin-page-subtitle']}>{t('manage_accounts_desc') || 'Manage platform accounts, permissions and access control'}</p>
                </div>
                <div className={styles['admin-page-actions']}>
                    {roleFilter && (
                        <button
                            onClick={() => setIsAddingUser(true)}
                            className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}
                        >
                            + {t('add') || 'Add'} {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                        </button>
                    )}
                </div>
            </div>

            <div className={"admin-stats-grid"}>
                {stats.map((s, i) => (
                    <div key={i} className={styles['admin-stat-premium']}>
                        <div className={styles['admin-stat-card-label']}>{s.label}</div>
                        <div className={styles['admin-stat-card-value']} style={{ fontSize: '1.75rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className={styles['admin-card']} style={{ marginBottom: '24px' }}>
                <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className={styles['admin-search-wrap']} style={{ flex: 1 }}>
                        <svg className={styles['admin-search-icon']} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className={styles['admin-search-input-premium']}
                            placeholder={t('search_users_placeholder') || "Search by name, email or company..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    {/* Role Filter only on "All Users" page */}
                    {!roleFilter && (
                        <select
                            className={styles['admin-form-select']}
                            style={{ width: '160px' }}
                            value={roleDropdownValue}
                            onChange={(e) => { setRoleDropdownValue(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="All">{t('all_roles') || 'All Roles'}</option>
                            <option value="Buyer">{t('buyers') || 'Buyers'}</option>
                            <option value="Supplier">{t('suppliers') || 'Suppliers'}</option>
                            <option value="Admin">{t('admins') || 'Admins'}</option>
                        </select>
                    )}
                </div>

                {/* Result count */}
                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-admin-main" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Showing {filteredUsers.length} of {users.length} records
                    </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles['admin-table']}>
                        <thead>
                            <tr>
                                <th>{t('user') || 'User'}</th>
                                <th>{t('account_type') || 'Account Type'}</th>
                                <th>{t('contact_and_business') || 'Contact & Business'}</th>
                                <th>{t('status') || 'Status'}</th>
                                {roleFilter && <th style={{ textAlign: 'right' }}>{t('actions') || 'Actions'}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className={styles['admin-loading-text']} style={{ padding: '60px', textAlign: 'center' }}>{t('fetching_user_records') || 'Fetching user records...'}</td>
                                </tr>
                            ) : currentUsers.length === 0 ? (
                                <tr className={""}>
                                    <td colSpan={5}>{t('no_users_found') || 'No users found matching your search.'}</td>
                                </tr>
                            ) : (
                                currentUsers.map((user: User) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#64748b', fontSize: '13px' }}>
                                                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-admin-main" style={{ fontWeight: 800, fontSize: '13px' }}>
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                                                        ID: {user._id.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles['admin-badge']} ${user.role === 'admin' ? styles['admin-badge-neutral'] : styles['admin-badge-neutral']}`} style={{ textTransform: 'capitalize' }}>
                                                {user.role}
                                            </span>
                                            {user.createdAt && (
                                                <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--admin-text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>{user.email}</div>
                                            {user.company_name && (
                                                <div className="text-admin-main" style={{ fontSize: '11px', fontWeight: 900, marginTop: '6px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path></svg>
                                                    {user.company_name}
                                                </div>
                                            )}
                                            {user.phone_number && (
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '6px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.29-2.29a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                    {user.phone_number}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`${styles['admin-badge']} ${(user.status === 'active' || user.status === 'verified') ? styles['admin-badge-success'] :
                                                    user.status === 'pending' ? styles['admin-badge-warning'] :
                                                        styles['admin-badge-danger']
                                                }`}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        {roleFilter && (
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleEditUser(user)} className={styles['admin-action-btn-edit']}>{t('edit') || 'Edit'}</button>
                                                    <button onClick={async () => {
                                                        if (window.confirm(t('confirm_delete') || 'Delete this user? This cannot be undone.')) {
                                                            try {
                                                                await api.delete(`/auth/admin/users/${user._id}`);
                                                                fetchUsers();
                                                                showToast(t('user_deleted_success') || 'User deleted successfully!', 'success');
                                                            } catch (err: any) {
                                                                showToast(t('failed_delete_user') || 'Failed to delete user', 'error');
                                                            }
                                                        }
                                                    }} className={styles['admin-action-btn-delete']}>{t('delete') || 'Delete'}</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            {t('showing') || 'Showing'} {indexOfFirstItem + 1} {t('to') || 'to'} {Math.min(indexOfLastItem, filteredUsers.length)} {t('of') || 'of'} {filteredUsers.length} {t('records') || 'records'}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => p - 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>{t('prev') || 'Prev'}</button>
                            <span className="text-admin-main" style={{ fontSize: '12px', fontWeight: 800 }}>{t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => p + 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>{t('next') || 'Next'}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className={styles['admin-modal-overlay']}>
                    <div className={styles['admin-modal']} style={{ maxWidth: '600px' }}>
                        <div className={styles['admin-modal-header']}>
                            <h3>{t('edit_profile_title') || 'Edit Profile'}: {editingUser.first_name}</h3>
                            <button className={styles['admin-modal-close']} onClick={() => setEditingUser(null)}>&times;</button>
                        </div>
                        <div className={styles['admin-modal-body']}>
                            <form onSubmit={handleSaveUser} className={styles['admin-form-grid']}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>{t('first_name') || 'First Name'}</label>
                                    <input
                                        className={styles['admin-form-input']}
                                        value={editFormData.first_name}
                                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>{t('last_name') || 'Last Name'}</label>
                                    <input
                                        className={styles['admin-form-input']}
                                        value={editFormData.last_name}
                                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('email_address') || 'Email Address'}</label>
                                    <input
                                        type="email"
                                        className={styles['admin-form-input']}
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('phone_number') || 'Phone Number'}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <CountrySelect
                                            value={editFormData.country_code}
                                            countries={countries}
                                            onChange={(country) => {
                                                const current = editFormData.phone_number.replace(/^\+\d+\s?/, '');
                                                setEditFormData({
                                                    ...editFormData,
                                                    country_code: country.code,
                                                    phone_number: `${country.dial_code} ${current}`
                                                });
                                            }}
                                        />
                                        <input
                                            className={styles['admin-form-input']}
                                            style={{ flex: 1 }}
                                            value={editFormData.phone_number.replace(/^\+\d+\s?/, '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const country = countries.find((c: Country) => c.code === editFormData.country_code);
                                                setEditFormData({ ...editFormData, phone_number: country ? `${country.dial_code} ${val}` : val });
                                            }}
                                            placeholder="123 456 789"
                                        />
                                    </div>
                                </div>


                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>{t('account_status') || 'Account Status'}</label>
                                    <select
                                        className={styles['admin-form-select']}
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                    >
                                        <option value="active">{t('active') || 'Active'}</option>
                                        <option value="pending">{t('pending') || 'Pending'}</option>
                                        <option value="inactive">{t('inactive') || 'Inactive'}</option>
                                    </select>
                                </div>
                                <div className={styles['admin-form-actions'] + " " + styles['full-width']}>
                                    <button type="button" className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} onClick={() => setEditingUser(null)}>{t('cancel') || 'Cancel'}</button>
                                    <button type="submit" className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}>{t('update_profile') || 'Update Profile'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddingUser && (
                <div className={styles['admin-modal-overlay']}>
                    <div className={styles['admin-modal']} style={{ maxWidth: '600px' }}>
                        <div className={styles['admin-modal-header']}>
                            <h3>{t('create_new_user') || `Create New ${roleFilter ? roleFilter : 'User'}`}</h3>
                            <button className={styles['admin-modal-close']} onClick={() => setIsAddingUser(false)}>&times;</button>
                        </div>
                        <div className={styles['admin-modal-body']}>
                            <form onSubmit={handleAddUser} className={styles['admin-form-grid']}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>{t('first_name') || 'First Name'}</label>
                                    <input
                                        className={styles['admin-form-input']}
                                        placeholder="John"
                                        value={newUserData.first_name}
                                        onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>{t('last_name') || 'Last Name'}</label>
                                    <input
                                        className={styles['admin-form-input']}
                                        placeholder="Doe"
                                        value={newUserData.last_name}
                                        onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('email_address') || 'Email Address'}</label>
                                    <input
                                        type="email"
                                        className={styles['admin-form-input']}
                                        placeholder="user@example.com"
                                        value={newUserData.email}
                                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('phone_number') || 'Phone Number'}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <CountrySelect
                                            value={newUserData.country_code}
                                            countries={countries}
                                            onChange={(country) => {
                                                const current = newUserData.phone_number.replace(/^\+\d+\s?/, '');
                                                setNewUserData({
                                                    ...newUserData,
                                                    country_code: country.code,
                                                    phone_number: `${country.dial_code} ${current}`
                                                });
                                            }}
                                        />
                                        <input
                                            className={styles['admin-form-input']}
                                            style={{ flex: 1 }}
                                            value={newUserData.phone_number.replace(/^\+\d+\s?/, '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const country = countries.find((c: Country) => c.code === newUserData.country_code);
                                                setNewUserData({ ...newUserData, phone_number: country ? `${country.dial_code} ${val}` : val });
                                            }}
                                            placeholder="123 456 789"
                                        />
                                    </div>
                                </div>

                                {newUserData.role === 'supplier' && (
                                    <>
                                        <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                            <label className={styles['admin-form-label']}>{t('company_name') || 'Company Name'}</label>
                                            <input
                                                className={styles['admin-form-input']}
                                                value={newUserData.company_name}
                                                onChange={(e) => setNewUserData({ ...newUserData, company_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                            <label className={styles['admin-form-label']}>{t('state_region') || 'State/Region'}</label>
                                            <select
                                                className={styles['admin-form-select']}
                                                value={newUserData.state}
                                                onChange={(e) => setNewUserData({ ...newUserData, state: e.target.value })}
                                                disabled={statesLoading || !newUserData.country_code}
                                            >
                                                <option value="">{statesLoading ? 'Loading states...' : 'Select State/Region'}</option>
                                                {states.map((s: State) => (
                                                    <option key={s._id} value={s.name}>{s.name}</option>
                                                ))}
                                                {states.length === 0 && !statesLoading && newUserData.country_code && (
                                                    <option value="Other">Other / Not Listed</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                            <label className={styles['admin-form-label']}>{t('business_type') || 'Business Type'}</label>
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                {businessTypes.map((type: BusinessType) => (
                                                    <label key={type._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={newUserData.business_type.includes(type.name)}
                                                            onChange={(e) => {
                                                                const newTypes = e.target.checked
                                                                    ? [...newUserData.business_type, type.name]
                                                                    : newUserData.business_type.filter((t: string) => t !== type.name);
                                                                setNewUserData({ ...newUserData, business_type: newTypes });
                                                            }}
                                                        /> {type.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('password') || 'Password'}</label>
                                    <input
                                        type="password"
                                        className={styles['admin-form-input']}
                                        placeholder="••••••••"
                                        value={newUserData.password}
                                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                {!roleFilter && (
                                    <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                        <label className={styles['admin-form-label']}>{t('role') || 'Role'}</label>
                                        <select
                                            className={styles['admin-form-select']}
                                            value={newUserData.role}
                                            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                        >
                                            <option value="buyer">Buyer</option>
                                            <option value="supplier">Supplier</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                )}
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>{t('account_status') || 'Account Status'}</label>
                                    <select
                                        className={styles['admin-form-select']}
                                        value={newUserData.status}
                                        onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className={styles['admin-form-actions'] + " " + styles['full-width']}>
                                    <button type="button" className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} onClick={() => setIsAddingUser(false)}>{t('cancel') || 'Cancel'}</button>
                                    <button type="submit" className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}>{t('create_account') || 'Create Account'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;


