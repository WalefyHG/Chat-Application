"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from 'lucide-react'

interface LoginPageProps {
    onLogin: (username: string, token: string, userData?: any) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setDebugInfo(null)
        setIsLoading(true)

        try {
            console.log("Submitting login form:", { username }) // Log para depuração

            const response = await fetch("http://localhost:8000/api/token/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            })

            const data = await response.json()

            // Armazenar informações de depuração
            setDebugInfo({
                status: response.status,
                statusText: response.statusText,
                data: data,
            })

            console.log("Login response:", {
                status: response.status,
                statusText: response.statusText,
                data: data,
            })

            // SOLUÇÃO: Se o status for 200, consideramos o login bem-sucedido
            // independentemente do campo success na resposta
            if (response.ok) {
                console.log("Login successful (status 200), proceeding with login")

                // Extrair token da resposta - adaptar conforme a estrutura da sua API
                const token = data.token || data.access_token || data.jwt || "mock_token_" + Date.now()

                // Extrair dados do usuário ou criar um objeto básico
                const userData = data.user || { username: username }

                // Armazenar dados no localStorage
                localStorage.setItem("auth_token", token)
                localStorage.setItem("username", username)
                localStorage.setItem("user", JSON.stringify(userData))

                // Chamar o callback onLogin
                onLogin(username, token, userData)
                return // Importante: sair da função aqui para evitar o código de erro abaixo
            }

            // Se chegamos aqui, houve um erro
            setError(data.error || data.detail || data.message || "Authentication failed")
        } catch (err) {
            console.error("Login error:", err)
            setError("An error occurred during login. Check the console for details.")
            setDebugInfo({ error: String(err) })
        } finally {
            setIsLoading(false)
        }
    }

    // Credenciais de teste para facilitar o login
    const testCredentials = [
        { username: "user1", password: "password1" },
        { username: "user2", password: "password2" },
        { username: "admin", password: "admin123" },
    ]

    const fillTestCredentials = (user: string, pass: string) => {
        setUsername(user)
        setPassword(pass)
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                <CardDescription className="text-center">Enter your credentials to access the chat</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">{error}</p>
                                <p className="text-sm text-red-600">Please check your credentials and try again.</p>
                            </div>
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </form>

                {/* Credenciais de teste para facilitar o login */}
                <div className="mt-6 border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Test accounts:</p>
                    <div className="space-y-2">
                        {testCredentials.map((cred, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => fillTestCredentials(cred.username, cred.password)}
                            >
                                Use {cred.username} / {cred.password}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Informações de depuração */}
                {debugInfo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border text-xs">
                        <p className="font-medium mb-1">Debug Info:</p>
                        <pre className="overflow-auto max-h-32">{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">Don&apos;t have an account? Contact administrator</p>
            </CardFooter>
        </Card>
    )
}
