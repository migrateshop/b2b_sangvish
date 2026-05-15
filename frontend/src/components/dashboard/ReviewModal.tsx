import React, { useState } from 'react';
import { createReview } from '@/services/reviewApi';
import { useToast } from '@/context/ToastContext';
import styles from './ReviewModal.module.css';

import { getImgUrl } from '@/utils/imageConfig';

const ReviewModal = ({ isOpen, onClose, product, orderId }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await createReview({
                product_id: product.product_id || product._id,
                order_id: orderId,
                rating,
                comment
            });
            showToast('Review submitted successfully!', 'success');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles['review-modal-overlay']}>
            <div className={styles['review-modal-content']}>
                <div className={styles['review-modal-header']}>
                    <h3>Write a Review</h3>
                    <button className={styles['close-btn']} onClick={onClose}>&times;</button>
                </div>

                <div className={styles['review-product-info']}>
                    <img src={getImgUrl(product.image)} alt={product.name} />
                    <span>{product.name}</span>
                </div>

                {error && <div className={styles['review-error']}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles['form-group']}>
                        <label>Rating</label>
                        <div className={styles['star-rating']}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`${styles.star} ${star <= rating ? styles.filled : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles['form-group']}>
                        <label>Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product and supplier..."
                            required
                            rows="4"
                        />
                    </div>

                    <div className={styles['review-modal-actions']}>
                        <button type="button" className={styles['cancel-btn']} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles['submit-btn']} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
