/**
 * API Service for Frontend-Backend Communication
 * Centralizes all API calls and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types for API responses
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    success?: boolean;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: true;
    token: string;
    refreshToken: string;
    expiresAt: string;
    refreshExpiresAt: string;
    user: {
        id: string;
        username: string;
        email?: string;
        planTier: string;
        has247Addon: boolean;
    };
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Generic fetch wrapper with error handling and auto-refresh
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<ApiResponse<T>> {
    try {
        const token = localStorage.getItem('auth_token');

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        // Handle 401 errors with token refresh
        if (response.status === 401 && retry) {
            const errorMsg = data.error || data.message || '';

            // Only try to refresh if the error is about token expiration
            if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
                try {
                    const newToken = await refreshAccessToken();

                    if (newToken) {
                        // Retry the original request with the new token
                        headers['Authorization'] = `Bearer ${newToken}`;
                        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                            ...options,
                            headers,
                        });
                        const retryData = await retryResponse.json();

                        if (retryResponse.ok) {
                            return { data: retryData, success: true };
                        }
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    // Clear tokens and redirect to login
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    window.location.reload();
                }
            }
        }

        if (!response.ok) {
            return {
                error: data.message || data.error || 'API request failed',
                success: false,
            };
        }

        return { data, success: true };
    } catch (error) {
        console.error('API Error:', error);
        return {
            error: error instanceof Error ? error.message : 'Network error',
            success: false,
        };
    }
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
    if (isRefreshing) {
        // Wait for the existing refresh to complete
        return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
                resolve(token);
            });
        });
    }

    isRefreshing = true;

    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Refresh token invalid or expired');
        }

        const data = await response.json();

        if (data.success && data.data?.token) {
            const newToken = data.data.token;
            localStorage.setItem('auth_token', newToken);
            onRefreshed(newToken);
            isRefreshing = false;
            return newToken;
        }

        throw new Error('Invalid refresh response');
    } catch (error) {
        isRefreshing = false;
        console.error('Failed to refresh token:', error);
        return null;
    }
}

/**
 * Authentication API
 */
export const authApi = {
    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await apiFetch<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }, false); // Don't retry login requests

        // Store tokens if login successful
        if (response.data?.token && response.data?.refreshToken) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('refresh_token', response.data.refreshToken);
        }

        return response;
    },

    async updatePlan(planTier: string, has247Addon: boolean): Promise<ApiResponse<any>> {
        return apiFetch('/auth/plan', {
            method: 'PUT',
            body: JSON.stringify({ planTier, has247Addon }),
        });
    },

    async validate(): Promise<ApiResponse<{ valid: boolean; user: any }>> {
        return apiFetch('/auth/validate');
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    },

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },
};

/**
 * Support Requests API
 */
export const supportApi = {
    async getUsage(): Promise<ApiResponse<{ requestCount: number; requestLimit: string | number; nextResetAt: string | null }>> {
        return apiFetch('/stats/support-usage');
    },

    async createRequest(data: {
        name: string;
        issue: string;
        specialist_id: string;
    }): Promise<ApiResponse<{ message: string }>> {
        return apiFetch('/forms/support', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

/**
 * General Forms API
 */
export const formsApi = {
    async submitContact(data: { name: string; email: string; message: string }): Promise<ApiResponse<{ message: string }>> {
        return apiFetch('/forms/contact', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async submitRequestChange(data: { title: string; description: string; priority?: string }): Promise<ApiResponse<{ message: string }>> {
        return apiFetch('/forms/request-change', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

/**
 * Dashboard API
 */
export const dashboardApi = {
    async getOverview(): Promise<ApiResponse<any>> {
        return apiFetch('/dashboard/overview');
    },

    async getDevCredits(): Promise<ApiResponse<any>> {
        return apiFetch('/dashboard/dev-credits');
    },

    async getChangelog(limit?: number): Promise<ApiResponse<any>> {
        const params = limit ? `?limit=${limit}` : '';
        return apiFetch(`/dashboard/changelog${params}`);
    },

    async getActivity(limit?: number): Promise<ApiResponse<any>> {
        const params = limit ? `?limit=${limit}` : '';
        return apiFetch(`/dashboard/activity${params}`);
    },

    async getInvoices(): Promise<ApiResponse<any>> {
        return apiFetch('/dashboard/invoices');
    },

    async getRequests(): Promise<ApiResponse<any>> {
        return apiFetch('/dashboard/requests');
    }
};

/**
 * Agents API
 */
export const agentsApi = {
    async getAll(): Promise<ApiResponse<{ agents: any[] }>> {
        return apiFetch('/agents');
    },

    async create(agent: any): Promise<ApiResponse<{ agent: any }>> {
        return apiFetch('/agents', {
            method: 'POST',
            body: JSON.stringify(agent),
        });
    },

    async update(id: string, agent: any): Promise<ApiResponse<{ agent: any }>> {
        return apiFetch(`/agents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(agent),
        });
    },

    async delete(id: string): Promise<ApiResponse<any>> {
        return apiFetch(`/agents/${id}`, {
            method: 'DELETE',
        });
    },

    async trigger(id: string): Promise<ApiResponse<{ sessionId: string; sseUrl: string }>> {
        return apiFetch(`/agents/${id}/trigger`, {
            method: 'POST',
        });
    },

    async stop(id: string): Promise<ApiResponse<any>> {
        return apiFetch(`/agents/${id}/stop`, {
            method: 'POST',
        });
    }
};

/**
 * Settings API
 */
export const settingsApi = {
    async getUptime(): Promise<ApiResponse<{ uptime: number; uptimeFormatted: string; startTime: string }>> {
        return apiFetch('/settings/uptime');
    },

    async getPreferences(): Promise<ApiResponse<{
        id: string;
        userId: string;
        emailNotifications: boolean;
        agentStatusNotifications: boolean;
        weeklyReports: boolean;
    }>> {
        return apiFetch('/settings/preferences');
    },

    async updatePreferences(preferences: {
        emailNotifications?: boolean;
        agentStatusNotifications?: boolean;
        weeklyReports?: boolean;
    }): Promise<ApiResponse<any>> {
        return apiFetch('/settings/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    },

    async changePassword(data: {
        currentPassword: string;
        newPassword: string;
    }): Promise<ApiResponse<{ message: string }>> {
        return apiFetch('/settings/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async cancelPlan(): Promise<ApiResponse<any>> {
        return apiFetch('/auth/cancel-plan', {
            method: 'POST',
        });
    },
};

/**
 * Admin API
 */
export const adminApi = {
    async verifyPassword(password: string): Promise<ApiResponse<{ message: string }>> {
        return apiFetch('/admin/verify', {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    },

    async createUser(data: {
        username: string;
        password: string;
        email?: string;
        plan?: string;
        adminPassword: string;
    }): Promise<ApiResponse<{ user: any; message: string }>> {
        return apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// Export default API object
export default {
    auth: authApi,
    support: supportApi,
    forms: formsApi,
    dashboard: dashboardApi,
    agents: agentsApi,
    admin: adminApi,
    settings: settingsApi,
};
