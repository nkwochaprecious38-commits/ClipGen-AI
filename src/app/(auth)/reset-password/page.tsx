import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { supabaseConfigured } from '@/lib/env';
export const metadata: Metadata = { title: 'Reset Password', robots: { index: false } };
export default function Page() { return <Suspense><AuthForm mode="reset" configured={supabaseConfigured()} /></Suspense>; }
