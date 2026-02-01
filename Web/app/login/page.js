// login/page.js

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // Renamed state to 'identifier'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    document.title = "Login - Kairos";
    // Redirect if already logged in (essential for seamless experience)
    // if (session) {
    //   router.push("/chatbot");
    // }
  }, [session, router]); // Added session to dependency array

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use Next-Auth's signIn function with the 'credentials' provider
      const result = await signIn("credentials", {
        redirect: false, // Prevents automatic redirect on failure
        identifier: identifier, // Pass the identifier (email or username)
        password: password,
      });

      if (result?.error) {
        // Authentication failed (password incorrect, user not found, etc.)
        setError("Login failed. Check your username/email and password.");
      } else {
        // Authentication successful. Next-Auth handles session and redirect.
        // We manually redirect to avoid the automatic /api/auth/signin page
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Next-Auth Login Error:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[86.4vh] bg-[#a7ebf2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#023859] p-8 md:p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-[#a7ebf2]">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-[#aff7ff]">
            Log In to continue your wellness journey.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            disabled={loading}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            <div className="text-2xl px-2">
              <FcGoogle />
            </div>
            Sign in with Google
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

        <form className="mt-6 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or Username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                suppressHydrationWarning={true}
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} // Use setIdentifier
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
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border bg-transparent border-gray-300 placeholder-[#91d7df] text-white rounded-md focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded-md">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                href="#"
                className="font-medium text-[#a7ebf2] hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-[#a7ebf2] bg-[#26658c] hover:bg-[#54acbf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-[#91d7df]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#a7ebf2] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
