"use client";

import { createContext, useContext, type ReactNode } from "react";

const MarketingAuthContext = createContext(false);

export function MarketingAuthProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  return (
    <MarketingAuthContext.Provider value={isAuthenticated}>
      {children}
    </MarketingAuthContext.Provider>
  );
}

export function useMarketingAuth(): boolean {
  return useContext(MarketingAuthContext);
}
