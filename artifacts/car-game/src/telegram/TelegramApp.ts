// TelegramApp.ts - Telegram Mini App integration

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready(): void;
  close(): void;
  expand(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  showPopup(params: { title?: string; message: string; buttons?: any[] }, callback?: (id: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    setText(text: string): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  switchInlineQuery(query: string, chooseChatTypes?: string[]): void;
  sendData(data: string): void;
  version: string;
  platform: string;
}

class TelegramIntegration {
  private wa: TelegramWebApp | null = null;
  public isAvailable = false;
  public user: { id: number; name: string; username?: string } | null = null;

  init() {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        this.isAvailable = false;
        return;
      }
      this.wa = tg;
      this.isAvailable = true;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        this.user = {
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(' '),
          username: u.username,
        };
      }
    } catch {
      this.isAvailable = false;
    }
  }

  haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      this.wa?.HapticFeedback?.impactOccurred(type);
    } catch {}
  }

  hapticSuccess() {
    try {
      this.wa?.HapticFeedback?.notificationOccurred('success');
    } catch {}
  }

  hapticError() {
    try {
      this.wa?.HapticFeedback?.notificationOccurred('error');
    } catch {}
  }

  shareScore(score: number, level: number) {
    if (!this.isAvailable) return;
    try {
      const text = `🏎️ I just hit ${score} km/h at level ${level} in CarBoom! Can you beat me?`;
      this.wa?.switchInlineQuery(text, ['users', 'groups']);
    } catch {}
  }

  close() {
    this.wa?.close();
  }
}

export const tgApp = new TelegramIntegration();
