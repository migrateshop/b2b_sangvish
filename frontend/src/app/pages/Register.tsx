'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Register = () => {
    const { openRegister } = useAuth();
    const navigate = useRouter();

    useEffect(() => {
        openRegister();
        // Redirect back home so the user is on the main page while the modal is open
        navigate.replace('/');
    }, [openRegister, navigate]);

    return null;
};

export default Register;
