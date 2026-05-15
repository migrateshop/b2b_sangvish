'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
    const { openLogin } = useAuth();
    const navigate = useRouter();

    useEffect(() => {
        openLogin();
        // Redirect back home so the user is on the main page while the modal is open
        navigate.replace('/');
    }, [openLogin, navigate]);

    return null;
};

export default Login;
