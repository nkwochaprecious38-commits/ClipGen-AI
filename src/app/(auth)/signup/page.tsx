import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { supabaseConfigured } from '@/lib/env';
export const metadata: Metadata = { title: 'Sign Up', robots: { index: false } };
export default function Page() { return <Suspense><AuthForm mode="signup" configured={supabaseConfigured()} /></Suspense>; }
