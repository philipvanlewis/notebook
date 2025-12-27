"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/notes");
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook that provides auth state and actions
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
