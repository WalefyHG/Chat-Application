import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth-api"

// Rotas que não precisam de autenticação
const publicRoutes = ["/", "/login", "/api/auth/login", "/api/test"]

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    console.log("Middleware checking path:", path) // Log para depuração

    // Verificar se a rota é pública
    if (publicRoutes.includes(path) || path.startsWith("/_next")) {
        return NextResponse.next()
    }

    // Verificar se é uma rota de API
    if (path.startsWith("/api/")) {
        const authHeader = request.headers.get("authorization")
        console.log("Auth header:", authHeader ? "Present" : "Missing") // Log para depuração

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        const token = authHeader.split(" ")[1]
        const isValid = await verifyToken(token)
        console.log("Token verification:", isValid ? "Valid" : "Invalid") // Log para depuração

        if (!isValid) {
            return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        // Token válido, continuar
        return NextResponse.next()
    }

    // Para rotas de página que precisam de autenticação
    // Você pode implementar redirecionamento para login se necessário

    return NextResponse.next()
}

// Configurar quais caminhos devem passar pelo middleware
export const config = {
    matcher: [
        // Aplicar a todas as rotas de API exceto auth
        "/api/:path*",
        // Aplicar a rotas específicas de página que precisam de autenticação
        "/chat",
        "/profile",
    ],
}
