"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginOverlay() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      // 매번 계정 선택 화면이 나타나도록 설정
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);

      // Update store with user data
      setUser({
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error("Google sign-in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show overlay if user is logged in
  if (user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-app-text mb-2">우리집 관리비</h1>
          <p className="text-app-muted">아파트 관리비 추적 및 관리</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-semibold py-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <span className="mr-2">🔐</span>
                Google로 로그인
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <p className="text-xs text-app-muted text-center mt-6">
          Google 계정으로 안전하게 로그인하세요.
          <br />
          데이터는 Firebase Cloud에 저장됩니다.
        </p>
      </div>
    </div>
  );
}
