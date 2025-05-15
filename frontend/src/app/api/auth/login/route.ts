import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { username, password } = body

        console.log("Login attempt:", { username }) // Log para depuração (não logue senhas)

        if (!username || !password) {
            return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
        }

        // Para fins de teste, vamos implementar uma autenticação mock
        // que sempre funciona com credenciais específicas
        if (
            (username === "user1" && password === "password1") ||
            (username === "user2" && password === "password2") ||
            (username === "admin" && password === "admin123")
        ) {
            console.log("Mock authentication successful")

            // Gerar um token mock
            const mockToken = "mock_token_" + Math.random().toString(36).substring(2, 15)

            // Retornar resposta de sucesso
            return NextResponse.json({
                success: true,
                token: mockToken,
                user: {
                    id: username === "admin" ? "1" : "2",
                    username: username,
                    email: `${username}@example.com`,
                    role: username === "admin" ? "admin" : "user",
                },
            })
        }

        // Se chegarmos aqui, as credenciais não correspondem às nossas credenciais mock
        console.log("Mock authentication failed")
        return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
