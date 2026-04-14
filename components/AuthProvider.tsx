"use client";

import { useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { loadData, loadUserProfile } from "@/lib/firestore";
import { LoginOverlay } from "./LoginOverlay";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      useStore.getState().setIsOnline(true);
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      useStore.getState().setIsOnline(false);
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial online status
    useStore.getState().setIsOnline(navigator.onLine);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const { setUser, setRecords, setRawSheet, setIsLoading } = useStore.getState();

      if (firebaseUser) {
        // User is logged in
        // Load user data from Firestore
        try {
          setIsLoading(true);
          const { records, rawSheets } = await loadData(firebaseUser.uid);
          const profile = await loadUserProfile(firebaseUser.uid);

          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            apartmentName: profile.apartmentName,
          });

          setRecords(records);
          Object.entries(rawSheets).forEach(([yearMonth, sheet]) => {
            setRawSheet(yearMonth, sheet);
          });
        } catch (error) {
          console.error("Failed to load user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setRecords([]);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <LoginOverlay />
      {children}
    </>
  );
}
