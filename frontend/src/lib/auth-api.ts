// Funções para comunicação com a API Django Ninja

// Substitua pela URL base da sua API Django Ninja
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface LoginResponse {
    success: boolean
    token?: string
    user?: {
        id: string
        username: string
        email?: string
        [key: string]: any // Para campos adicionais que o Django possa retornar
    }
    error?: string
}

/**
 * Autentica um usuário contra a API Django Ninja
 */
export async function authenticateUser(username: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.detail || data.message || "Authentication failed",
            }
        }

        // Assumindo que a API Django Ninja retorna um token e informações do usuário
        // Ajuste conforme a estrutura de resposta da sua API
        return {
            success: true,
            token: data.token || data.access_token,
            user: {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role || "user",
                ...data.user,
            },
        }
    } catch (error) {
        console.error("API authentication error:", error)
        return {
            success: false,
            error: "Failed to connect to authentication server",
        }
    }
}

/**
 * Verifica se um token é válido com a API Django Ninja
 */
export async function verifyToken(token: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        })

        return response.ok
    } catch (error) {
        console.error("Token verification error:", error)
        return false
    }
}

/**
 * Obtém informações do usuário atual usando o token
 */
export async function getCurrentUser(token: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error("Get current user error:", error)
        return null
    }
}
