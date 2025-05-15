import { generateToken } from "./jwt"

// Mock user database
// Em um ambiente real, isso seria um banco de dados
const users = [
    { id: "1", username: "user1", password: "password1", role: "user" },
    { id: "2", username: "user2", password: "password2", role: "user" },
    { id: "3", username: "admin", password: "admin123", role: "admin" },
]

export async function loginUser(
    username: string,
    password: string,
): Promise<{ success: boolean; token?: string; user?: any }> {
    // Simular atraso de API
    await new Promise((resolve) => setTimeout(resolve, 800))

    console.log("Attempting to authenticate:", { username }) // Log para depuração
    console.log(
        "Available users:",
        users.map((u) => u.username),
    ) // Log para depuração

    // Verificar se o usuário existe e a senha corresponde
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password)

    console.log("User found:", !!user) // Log para depuração

    if (!user) {
        return { success: false }
    }

    // Gerar token JWT para o usuário
    const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
    })

    // Retornar sucesso com token e informações do usuário (sem a senha)
    const { password: _, ...userWithoutPassword } = user
    return {
        success: true,
        token,
        user: userWithoutPassword,
    }
}

export async function verifyAuth(token: string): Promise<boolean> {
    // Em um ambiente real, você verificaria o token JWT
    // e possivelmente consultaria o banco de dados

    // Simular atraso de API
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Verificar se o token é válido
    // Aqui estamos apenas verificando se o token existe
    return !!token
}
