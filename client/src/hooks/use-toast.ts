// Wrapper pour sonner compatible avec le hook standard
import { toast as sonnerToast } from "sonner";

export const useToast = () => {
  return {
    toast: sonnerToast,
  };
};

export { sonnerToast as toast };