"use client";

import { ReactNode, useState } from "react";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { AppFooter } from "./AppFooter";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-dvh bg-app-bg">
      <AppHeader onMenuToggle={toggleMobileMenu} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
