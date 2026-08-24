import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/layout/AuthGate";
import "@/lib/i18n";
import { initLangFromStorage } from "@/lib/i18n";

/**
 * Application shell: global providers, i18n bootstrap, auth gating and the
 * sidebar layout. Rendered once by the root route around the current page.
 */
export default function App({ queryClient, children }: { queryClient: QueryClient; children: React.ReactNode }) {
  useEffect(() => { initLangFromStorage(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
