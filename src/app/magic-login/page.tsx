"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MagicLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("");
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const verify = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("error");
                setMessage("Invalid magic link. Missing token.");
                return;
            }

            try {
                const res = await fetch("/api/auth/magic-link/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok && data.data?.accessToken) {
                    window.history.replaceState({}, "", "/magic-login");
                    localStorage.setItem("accessToken", data.data.accessToken);
                    setStatus("success");
                    setMessage("Login successful! Redirecting...");
                    setTimeout(() => router.push("/dashboard"), 1000);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Verification failed.");
                }
            } catch {
                setStatus("error");
                setMessage("Something went wrong. Please try again.");
            }
        };

        verify();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    {status === "verifying" && (
                        <>
                            <div className="text-4xl mb-4 animate-pulse">🔐</div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your link...</h1>
                            <p className="text-gray-500 text-sm">Please wait while we sign you in.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="text-4xl mb-4">✅</div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h1>
                            <p className="text-gray-500 text-sm">{message}</p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 text-xl mb-4">
                                ✕
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                            <p className="text-red-500 text-sm mb-4">{message}</p>
                            <a
                                href="/login"
                                className="text-violet-600 font-medium text-sm hover:underline"
                            >
                                ← Back to Login
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MagicLoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <p className="text-gray-500">Loading...</p>
                </div>
            }
        >
            <MagicLoginContent />
        </Suspense>
    );
}
