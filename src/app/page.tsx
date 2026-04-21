"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          router.push("/dashboard");
          return;
        }

        // Try refreshing
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.data?.accessToken) {
          localStorage.setItem("accessToken", refreshData.data.accessToken);
          router.push("/dashboard");
          return;
        }
      }

      router.push("/login");
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
