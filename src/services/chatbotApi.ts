import { ChatMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Send a message to the chatbot backend
 */
export const sendMessageToBackend = async (message: string, history: ChatMessage[]): Promise<string> => {
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
            body: JSON.stringify({ message, history })
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
