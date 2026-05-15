import React from 'react';
import styles from './AlertModal.module.css';

const AlertModal = ({ isOpen, onClose, message, title = "Notification" }) => {
    if (!isOpen) return null;

    return (
        <div className={styles['alert-modal-overlay']}>
            <div className={styles['alert-modal-content']}>
                <div className={styles['alert-modal-header']}>
                    <h3>{title}</h3>
                    <button className={styles['alert-modal-close']} onClick={onClose}>&times;</button>
                </div>
                <div className={styles['alert-modal-body']}>
                    <p>{message}</p>
                </div>
                <div className={styles['alert-modal-footer']}>
                    <button className={styles['btn-alert-ok']} onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
