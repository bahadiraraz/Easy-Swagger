import { toast as sonnerToast } from "sonner";

declare global {
  interface Window {
    toast: typeof sonnerToast;
  }
}

export {};
