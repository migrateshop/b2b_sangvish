import React from 'react';
import styles from './OrderTimeline.module.css';

const OrderTimeline = ({ timeline, currentStatus }) => {
    const steps = [
        { status: 'pending', label: 'Order Placed' },
        { status: 'confirmed', label: 'Payment Confirmed' },
        { status: 'processing', label: 'Processing' },
        { status: 'shipped', label: 'Shipped' },
        { status: 'delivered', label: 'Delivered' }
    ];

    const getStatusIndex = (status) => {
        const idx = steps.findIndex(s => s.status === (status || '').toLowerCase());
        return idx === -1 ? 0 : idx;
    };

    const currentIdx = getStatusIndex(currentStatus || 'pending');

    return (
        <div className={styles['ot-container']}>
            <h3 className={styles['ot-title']}>Order Progress</h3>
            <div className={styles['ot-timeline']}>
                {steps.map((step, index) => {
                    const isCompleted = index <= currentIdx;
                    const isCurrent = index === currentIdx;
                    const logEntry = timeline?.find(l => (l?.status || '').toLowerCase() === step.status.toLowerCase() ||
                        (l?.status === 'Confirmed' && step.status === 'confirmed'));

                    const customLog = timeline?.find(l => l?.status === step.label);
                    const finalLog = customLog || logEntry;

                    return (
                        <div key={index} className={`${styles['ot-step']} ${isCompleted ? styles['completed'] : ''} ${isCurrent ? styles['current'] : ''}`}>
                            <div className={styles['ot-line']}></div>
                            <div className={styles['ot-icon-wrapper']}>
                                <div className={styles['ot-icon']}>{(index + 1)}</div>
                            </div>
                            <div className={styles['ot-content']}>
                                <span className={styles['ot-label']}>{step.label}</span>
                                <span className={styles['ot-date']}>
                                    {finalLog ? new Date(finalLog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (isCompleted ? 'Completed' : 'Pending')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTimeline;
