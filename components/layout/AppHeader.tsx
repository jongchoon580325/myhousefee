"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Menu, Wifi, WifiOff } from "lucide-react";

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const user = useStore((state) => state.user);
  const isOnline = useStore((state) => state.isOnline);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-app-border bg-app-accent text-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={onMenuToggle}
            className="sm:hidden p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* 로고 */}
          <img
            src="/icon.svg"
            alt={user?.apartmentName || "우리집 관리비"}
            className="h-8 w-8 rounded-md"
          />
          <span className="font-semibold text-sm hidden sm:inline">
            {user?.apartmentName || "우리집 관리비"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 온/오프라인 상태 표시 */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              isOnline
                ? "bg-green-500/20 text-green-200"
                : "bg-red-500/20 text-red-200"
            }`}
            title={isOnline ? "온라인" : "오프라인"}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? "온라인" : "오프라인"}
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm hidden sm:inline">{user.displayName}</span>
              <Button
                onClick={handleLogout}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white text-xs"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
