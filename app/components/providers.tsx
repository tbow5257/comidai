"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}