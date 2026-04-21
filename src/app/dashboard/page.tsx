"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    createdAt: string;
}

interface SessionData {
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;

        let res = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });

        // If 401, try refreshing the token
        if (res.status === 401) {
            const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
            const refreshData = await refreshRes.json();

            if (refreshRes.ok && refreshData.data?.accessToken) {
                localStorage.setItem("accessToken", refreshData.data.accessToken);
                res = await fetch(url, {
                    ...options,
                    headers: { ...options.headers, Authorization: `Bearer ${refreshData.data.accessToken}` },
                });
            } else {
                localStorage.removeItem("accessToken");
                return null;
            }
        }

        return res;
    };

    useEffect(() => {
        const loadData = async () => {
            // Fetch user
            const userRes = await fetchWithAuth("/api/auth/me");
            if (!userRes || !userRes.ok) {
                localStorage.removeItem("accessToken");
                router.push("/login");
                return;
            }

            const userData = await userRes.json();
            setUser(userData.data);

            // Fetch sessions
            const sessionsRes = await fetchWithAuth("/api/auth/sessions");
            if (!sessionsRes) {
                localStorage.removeItem("accessToken");
                router.push("/login");
                return;
            }
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData.data || []);

            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleLogout = async () => {
        const token = localStorage.getItem("accessToken");
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        localStorage.removeItem("accessToken");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h1 className="text-lg font-bold text-gray-900">Magic Link Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>
            </nav>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {/* User Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{user?.email}</span></p>
                        <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{user?.name || "Not set"}</span></p>
                        <p><span className="text-gray-500">Verified:</span> <span className="font-medium text-green-600">{user?.emailVerified ? "Yes" : "No"}</span></p>
                        <p><span className="text-gray-500">Joined:</span> <span className="font-medium text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</span></p>
                    </div>
                </div>

                {/* Sessions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h2>
                    {sessions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No active sessions.</p>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((s) => (
                                <div key={s.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                                    <p className="text-gray-700 font-medium truncate">{s.userAgent}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        IP: {s.ipAddress} · Created: {new Date(s.createdAt).toLocaleString()} · Expires: {new Date(s.expiresAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
