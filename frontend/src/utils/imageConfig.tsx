const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

export const getImgUrl = (img, placeholder = 'https://placehold.co/300') => {
    if (!img) return placeholder;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    // Replace backslashes with forward slashes for cross-platform compatibility
    let normalizedImg = img.replace(/\\/g, '/');

    // Remove /api prefix from the image path if it exists
    if (normalizedImg.startsWith('/api/')) {
        normalizedImg = normalizedImg.replace('/api/', '/');
    }

    return `${IMAGE_URL}${normalizedImg.startsWith('/') ? '' : '/'}${normalizedImg}`;
};
