import { get } from "http";
import { toast } from "sonner";

const API_URL = "http://127.0.0.1:8000"; // Substitua pela URL da sua API Django

export interface User {
    id: number;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
}

export interface Message {
    senderId: number;
    id: number;
    sender: number;
    receiver: number;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface LoginResponse {
    token: string;
    user: User;
}

// Serviço de autenticação
export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            // Em um ambiente real, isso seria uma requisição real para sua API Django
            const response = await fetch(`${API_URL}/api/token/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            if (!response.ok) throw new Error('Credenciais inválidas');
            return await data

            // Simulando resposta para desenvolvimento
            // await new Promise(resolve => setTimeout(resolve, 1000));

            // if (username === "admin" && password === "admin") {
            //     const mockResponse: LoginResponse = {
            //         token: "token-de-exemplo-12345",
            //         user: {
            //             id: 1,
            //             username: "admin",
            //             isOnline: true,
            //             avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            //         }
            //     };
            //     localStorage.setItem("token", mockResponse.token);
            //     localStorage.setItem("user", JSON.stringify(mockResponse.user));
            //     return mockResponse;
            // }

            // throw new Error("Credenciais inválidas");
        } catch (error) {
            toast.error("Erro ao autenticar: " + (error as Error).message);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    getToken: (): string | null => {
        return localStorage.getItem("token");
    },

    getCurrentUser: (): User | null => {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem("token");
    }
};

// Serviço de usuários
export const userService = {
    getUsers: async (): Promise<User[]> => {
        try {
            const token = authService.getToken();
            if (!token) throw new Error("Token não encontrado");

            const response = await fetch(`${API_URL}/api/user/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 401) {
                throw new Error("Não autorizado. Token inválido ou expirado.");
            }

            if (!response.ok) throw new Error('Falha ao obter usuários');

            const data = await response.json();
            // Verifique o formato da resposta e retorne o array correto:
            if (Array.isArray(data)) return data;
            if (data.users && Array.isArray(data.users)) return data.users;
            if (data.results && Array.isArray(data.results)) return data.results;

            throw new Error("Formato inesperado da resposta da API");

        } catch (error) {
            toast.error("Erro ao carregar usuários: " + (error as Error).message);
            throw error;
        }
    },

    getUserById: async (userId: number): Promise<User> => {
        try {
            const token = authService.getToken();
            if (!token) throw new Error("Token não encontrado");

            const response = await fetch(`${API_URL}/api/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 401) {
                throw new Error("Não autorizado. Token inválido ou expirado.");
            }

            if (!response.ok) throw new Error('Falha ao obter usuário');

            return await response.json();
        } catch (error) {
            toast.error("Erro ao carregar usuário: " + (error as Error).message);
            throw error;
        }
    }

};

// Serviço de mensagens
export const chatService = {
    getMessages: async (room_name: string): Promise<Message[]> => {
        try {
            const token = authService.getToken();
            if (!token) throw new Error("Usuário não autenticado");

            // Sua API deve aceitar o room_name para buscar as mensagens
            const response = await fetch(`${API_URL}/api/chat/messages?room_name=${room_name}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao obter mensagens');
            return await response.json();
        } catch (error) {
            toast.error("Erro ao carregar mensagens: " + (error as Error).message);
            throw error;
        }
    },

    sendMessage: async (room_name: string, content: string): Promise<Message> => {
        try {
            const token = authService.getToken();
            const currentUser = authService.getCurrentUser();
            if (!token || !currentUser) throw new Error("Usuário não autenticado");

            const response = await fetch(`${API_URL}/api/chats/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ recipient_id: currentUser.id, content }),
            });

            if (!response.ok) throw new Error('Falha ao enviar mensagem');
            return await response.json();
        } catch (error) {
            toast.error("Erro ao enviar mensagem: " + (error as Error).message);
            throw error;
        }
    },
};