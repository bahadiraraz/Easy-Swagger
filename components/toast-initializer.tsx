"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ToastInitializer() {
  useEffect(() => {
    // Initialize toast on the window object
    if (typeof window !== "undefined") {
      window.toast = toast;
    }
  }, []);

  return null;
}
