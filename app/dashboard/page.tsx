"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { LoadingScreen } from "@/components/ui";

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!auth.isLoggedIn()) { router.push("/login"); return; }
    auth.me().then((u) => {
      if (u.role === "super_admin") router.replace("/dashboard/admin");
      else if (u.role === "teacher") router.replace("/dashboard/teacher");
      else router.replace("/dashboard/student");
    }).catch(() => router.push("/login"));
  }, [router]);
  return <LoadingScreen />;
}
