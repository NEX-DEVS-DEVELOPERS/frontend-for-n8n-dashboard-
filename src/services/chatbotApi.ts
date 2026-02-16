import { ChatMessage, MessageAuthor } from '../types';
import { apiFetch, apiStreamFetch } from './api';

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
 * Send a message to the chatbot backend for streaming
 */
export const sendMessageToBackend = async (
    message: string,
    history: ChatMessage[],
    sessionId?: string
): Promise<Response> => {
    // Backend expects 'messages' array in Vercel AI SDK format
    const messages = [
        ...history.map(m => ({
            role: m.author === MessageAuthor.Assistant ? 'assistant' : 'user',
            content: m.text
        })),
        { role: 'user', content: message }
    ];

    return apiStreamFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, sessionId })
    });
};

/**
 * Fetch Chatbot Configuration (Welcome Message & Plan)
 */
export const getChatbotConfig = async (): Promise<{ welcomeMessage: string; plan: string }> => {
    const response = await apiFetch<{ welcomeMessage: string; plan: string }>('/chat/config');

    if (response.success && response.data) {
        return response.data;
    }

    // Fallback
    return {
        welcomeMessage: "Hello! I'm Zappy. How can I help you today?",
        plan: 'free'
    };
};

/**
 * Get user's chat sessions (only those with actual user messages)
 */
export const getChatSessions = async (): Promise<BackendSession[]> => {
    const response = await apiFetch<{ sessions: BackendSession[] }>('/chat/sessions');

    if (response.success && response.data?.sessions) {
        return response.data.sessions;
    }

    return [];
};

/**
 * Load a specific session's messages
 */
export const loadChatSession = async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiFetch<{ messages: ChatMessage[] }>(`/chat/sessions/${sessionId}`);

    if (response.success && response.data?.messages) {
        return response.data.messages;
    }

    return [];
};

/**
 * Create a new chat session
 */
export const createChatSession = async (): Promise<{ session: BackendSession; welcomeMessage: string } | null> => {
    const response = await apiFetch<{ session: BackendSession; welcomeMessage: string }>('/chat/sessions', {
        method: 'POST'
    });

    if (response.success && response.data) {
        return response.data;
    }

    return null;
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
    const response = await apiFetch<any>(`/chat/sessions/${sessionId}`, {
        method: 'DELETE'
    });

    return !!response.success;
};
