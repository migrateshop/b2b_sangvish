import Login from '@/app/pages/Login';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In / Login | Alibaba Next B2B Marketplace',
  description: 'Log into your Alibaba Next buyer or supplier account to manage orders, chat with manufacturers, submit RFQs, and access your personalized dashboard.',
};

export default function Page() { return <Login />; }