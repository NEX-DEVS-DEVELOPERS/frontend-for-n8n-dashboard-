import React, { useState, useEffect, useRef } from 'react';
import {
    CheckCheck,
    Clock,
    CreditCard,
    Info,
    ShieldCheck,
    RotateCcw,
    X,
} from 'lucide-react';
import { BellIcon } from './icons';
import { cn } from './ui';
import { notificationApi, supportApi } from '../services/api';
import gsap from 'gsap';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'support';
    is_read: boolean;
    metadata: any;
    created_at: string;
}

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClose: () => void;
    onViewAll?: () => void;
    isOpen: boolean;
    isMobile?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onClose,
    onViewAll,
    isOpen,
    isMobile = false
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            gsap.fromTo(dropdownRef.current,
                { autoAlpha: 0, y: -10, scale: 0.95 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        }
    }, [isOpen]);

    const handleResendSupport = async (notification: Notification) => {
        if (!notification.metadata?.requestData) return;

        setResendingId(notification.id);
        try {
            const { requestData } = notification.metadata;
            await supportApi.createRequest({
                name: requestData.name,
                issue: requestData.issue,
                specialistId: requestData.specialistId,
                email: requestData.email
            });
            // Maybe show a localized success state
        } catch (error) {
            console.error('Failed to resend support request:', error);
        } finally {
            setTimeout(() => setResendingId(null), 1000);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'support': return <ShieldCheck className="h-4 w-4 text-primary" />;
            case 'success': return <CheckCheck className="h-4 w-4 text-green-500" />;
            case 'warning': return <Info className="h-4 w-4 text-yellow-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            case 'payment': return <CreditCard className="h-4 w-4 text-blue-500" />;
            default: return <BellIcon className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className={cn(
                "absolute top-full mt-3 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[500px] transition-all duration-300",
                isMobile
                    ? "fixed top-20 right-4 left-4 w-auto sm:right-0 sm:left-auto sm:w-80"
                    : "right-0 w-80 md:w-96"
            )}
        >
            <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm tracking-wide">Notifications</h3>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center opacity-40">
                        <BellIcon className="h-10 w-10 mb-2" />
                        <p className="text-xs font-medium">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/20">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 transition-colors relative group",
                                    !notification.is_read ? "bg-primary/5" : "hover:bg-muted/10"
                                )}
                                onClick={() => !notification.is_read && onMarkRead(notification.id)}
                            >
                                {!notification.is_read && (
                                    <div className="absolute left-1 top-4 bottom-4 w-0.5 bg-primary rounded-full" />
                                )}

                                <div className="flex gap-3">
                                    <div className="mt-0.5 shrink-0 bg-muted/20 p-2 rounded-xl">
                                        {getTypeIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs truncate pr-2">{notification.title}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" />
                                                {formatTime(notification.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                            {notification.message}
                                        </p>

                                        {notification.type === 'support' && notification.metadata?.requestData && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleResendSupport(notification);
                                                }}
                                                disabled={resendingId === notification.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all text-[10px] font-bold uppercase tracking-wide border border-primary/20 disabled:opacity-50"
                                            >
                                                <RotateCcw className={cn("h-3 w-3", resendingId === notification.id && "animate-spin")} />
                                                {resendingId === notification.id ? 'Sending...' : 'Resend Request'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-border/30 bg-muted/5 text-center">
                <button
                    onClick={onViewAll}
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                    View all activity
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
