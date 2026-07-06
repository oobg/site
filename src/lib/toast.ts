import { toast } from 'sonner';

export const Toast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
};
