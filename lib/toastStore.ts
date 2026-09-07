export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  public show(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const toast: ToastMessage = { id, type, title, message, duration };
    this.toasts = [toast, ...this.toasts.slice(0, 4)]; // Max 5 visible
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  public success(title: string, message?: string, duration?: number) {
    this.show('success', title, message, duration);
  }

  public error(title: string, message?: string, duration?: number) {
    this.show('error', title, message, duration);
  }

  public info(title: string, message?: string, duration?: number) {
    this.show('info', title, message, duration);
  }

  public warning(title: string, message?: string, duration?: number) {
    this.show('warning', title, message, duration);
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toast = new ToastManager();
