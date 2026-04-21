"use client";

import { useState } from "react";

export default function LoginPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/magic-link/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                setStep(2);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-600 text-white text-2xl mb-4">
                        ✉️
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
                    <p className="text-gray-500 mt-1">Sign in or create an account instantly</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendLink}>
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Magic Link"}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="text-center py-4">
                            <div className="text-4xl mb-4">📧</div>
                            <p className="text-gray-700 font-medium mb-2">Check your email inbox</p>
                            <p className="text-sm text-gray-500">
                                We sent a secure login link to{" "}
                                <span className="font-medium text-gray-700">{email}</span>.
                                <br />
                                Click the link in the email to sign in.
                            </p>
                            <button
                                onClick={() => { setStep(1); setError(""); }}
                                className="mt-4 text-sm text-violet-600 hover:underline"
                            >
                                Use a different email
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    No password needed. We&apos;ll email you a secure link.
                </p>
            </div>
        </div>
    );
}
