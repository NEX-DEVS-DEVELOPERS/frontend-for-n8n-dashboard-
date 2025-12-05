import { ChatMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface BackendSession {
    id: string;
    sessionKey: string;
    title: string;
    messageCount: number;
    hasUserMessages: boolean;
    firstUserMessagePreview: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Send a message to the chatbot backend
 */
export const sendMessageToBackend = async (
    message: string,
    history: ChatMessage[],
    sessionId?: string
): Promise<string> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, history, sessionId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        return data.data.response;
    } catch (error) {
        console.error('Chatbot API Error:', error);
        throw error;
    }
};

/**
 * Fetch Chatbot Configuration (Welcome Message & Plan)
 */
export const getChatbotConfig = async (): Promise<{ welcomeMessage: string; plan: string }> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return { welcomeMessage: "Hello! I'm Zappy. How can I help you today?", plan: 'free' };
        }

        const response = await fetch(`${API_URL}/chat/config`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch config');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Chatbot Config Error:', error);
        // Fallback
        return { welcomeMessage: "Hello! I'm Zappy. How can I help you today?", plan: 'free' };
    }
};

/**
 * Get user's chat sessions (only those with actual user messages)
 */
export const getChatSessions = async (): Promise<BackendSession[]> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return [];
        }

        const response = await fetch(`${API_URL}/chat/sessions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        return data.data.sessions || [];
    } catch (error) {
        console.error('Get Sessions Error:', error);
        return [];
    }
};

/**
 * Load a specific session's messages
 */
export const loadChatSession = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return [];
        }

        const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load session');
        }

        const data = await response.json();
        return data.data.messages || [];
    } catch (error) {
        console.error('Load Session Error:', error);
        return [];
    }
};

/**
 * Create a new chat session
 */
export const createChatSession = async (): Promise<{ session: BackendSession; welcomeMessage: string } | null> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return null;
        }

        const response = await fetch(`${API_URL}/chat/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Create Session Error:', error);
        return null;
    }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return false;
        }

        const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete session');
        }

        return true;
    } catch (error) {
        console.error('Delete Session Error:', error);
        return false;
    }
};
