"use client";

import { useState, useEffect } from "react";

// Store deferred prompt globally in memory across navigations
let globalDeferredPrompt: any = null;

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      // 2. Check if iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // 3. Register Service Worker for PWA install criteria
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      }

      // 4. Capture beforeinstallprompt event for Android / Chrome / Edge
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        globalDeferredPrompt = e;
        setIsInstallable(true);
      };

      // 5. Detect if app was installed
      const handleAppInstalled = () => {
        globalDeferredPrompt = null;
        setIsInstallable(false);
        setIsInstalled(true);
      };

      if (globalDeferredPrompt) {
        setIsInstallable(true);
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const triggerInstall = async (): Promise<"accepted" | "dismissed" | "ios_guide" | "unavailable"> => {
    if (globalDeferredPrompt) {
      try {
        globalDeferredPrompt.prompt();
        const choiceResult = await globalDeferredPrompt.userChoice;
        globalDeferredPrompt = null;
        setIsInstallable(false);
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          return "accepted";
        }
        return "dismissed";
      } catch (err) {
        console.error("Install prompt error:", err);
        return "unavailable";
      }
    }

    if (isIos) {
      return "ios_guide";
    }

    return "unavailable";
  };

  return {
    triggerInstall,
    isInstallable,
    isInstalled,
    isIos,
  };
}
