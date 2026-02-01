// signup/page.js

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";


const Signup = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        document.title = "Signup - Kairos";
        // if (session) {
        //     router.push("/chatbot");
        // }
    }, [session, router]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
    }

        setLoading(true);
        try {
            const registerResponse = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: username,
                    password: password,
                }),
            });
            
            const data = await registerResponse.json();

            if (registerResponse.ok) {
                // --- 2. USER AUTHENTICATION (Next-Auth) ---
                const signInResult = await signIn("credentials", {
                    identifier: username,
                    password: password,
                    redirect: false, // Prevents Next-Auth's default redirect
                });

                if (signInResult.error) {
                    // Show error if authentication failed after successful registration
                    setError(signInResult.error || "Authentication failed after registration.");
                } else {
                    // Success: Redirect the user manually
                    router.push('/chatbot');
                }

            } else {
                // Registration failed (e.g., user already exists, server error)
                setError(data.message || 'Failed to create account.');
            }
        } catch (err) {
            console.error(err);
            setError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[86.4vh] bg-[#a7ebf2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-[#023859] p-8 md:p-10 rounded-xl shadow-2xl">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-[#a7ebf2]">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-[#aff7ff]">
                        Join us and start your wellness journey.
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/chatbot" })}
                        disabled={loading}
                        className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    >
                        <div className="text-2xl px-2">
                            <FcGoogle />
                        </div>
                        Sign up with Google
                    </button>
                </div>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-500"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#023859] text-gray-400">
                            Or continue with
                        </span>
                    </div>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Email
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="email" // Changed type to email for clarity
                                required
                                placeholder="Enter your email" // Changed placeholder
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border bg-transparent border-gray-300 placeholder-[#91d7df] text-white rounded-md focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border bg-transparent border-gray-300 placeholder-[#91d7df] text-white rounded-md focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirm Password
                            </label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border bg-transparent border-gray-300 placeholder-[#91d7df] text-white rounded-md focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="text-sm text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded-md">
                            {error}
                        </div>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-[#a7ebf2] bg-[#26658c] hover:bg-[#54acbf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-[#91d7df]">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-[#a7ebf2] hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
