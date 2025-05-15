import jwt from "jsonwebtoken"

// Em um ambiente de produção, use uma variável de ambiente para a chave secreta
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export interface UserPayload {
    id: string
    username: string
    role?: string
}

export function generateToken(user: UserPayload): string {
    return jwt.sign(user, JWT_SECRET, {
        expiresIn: "24h", // Token expira em 24 horas
    })
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload
    } catch (error) {
        console.error("Token verification failed:", error)
        return null
    }
}
