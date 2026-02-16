
export class NotificationService {
    private static instance: NotificationService;
    private permission: NotificationPermission = 'default';

    private constructor() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications.');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
    }

    public showNotification(title: string, options?: NotificationOptions) {
        if (this.permission === 'granted') {
            const defaultOptions: NotificationOptions = {
                icon: '/n8n-logo.svg',
                badge: '/n8n-logo.svg',
                ...options
            };

            try {
                // Try to show via service worker first (better for PWA)
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, defaultOptions);
                    });
                } else {
                    new Notification(title, defaultOptions);
                }
            } catch (error) {
                console.error('Failed to show notification:', error);
                // Fallback to basic notification
                new Notification(title, defaultOptions);
            }
        }
    }
}

export const notificationService = NotificationService.getInstance();
