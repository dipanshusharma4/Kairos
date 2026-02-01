'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const userId = searchParams.get('user_id');

        if (token) {
            // Store token in localStorage for manual API calls
            localStorage.setItem('token', token);
            if (userId) {
                localStorage.setItem('userId', userId);
            }

            // Attempt to notify any other listeners (optional)
            window.dispatchEvent(new Event('storage'));

            // Redirect to the main application area
            router.push('/dashboard');
        } else {
            // Handle error or missing token
            console.error("No token received in callback");
            router.push('/login?error=auth_failed');
        }
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#a7ebf2]">
            <div className="text-[#023859] text-xl font-bold animate-pulse">
                Finalizing authentication...
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#a7ebf2]">Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
