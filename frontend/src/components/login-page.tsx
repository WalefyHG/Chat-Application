import React, { useState } from "react";
import { User, Key, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/api";
import { toast } from "sonner";

interface LoginPageProps {
    onLogin: (username: string, token: string, userData?: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        setLoading(true);

        try {
            const response = await authService.login(username, password);

            // Salvar dados no localStorage
            localStorage.setItem("auth_token", response.token);
            localStorage.setItem("username", username);
            localStorage.setItem("user", JSON.stringify(response.user));

            // Chamar a função de callback com os dados
            onLogin(username, response.token, response.user);

            toast.success("Login realizado com sucesso!");
        } catch (error) {
            console.error("Erro de login:", error);
            toast.error("Falha no login. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Bem-vindo ao Chat</CardTitle>
                <CardDescription>
                    Entre com suas credenciais para acessar
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Usuário</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                id="username"
                                placeholder="Digite seu usuário"
                                className="pl-10"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="Digite sua senha"
                                className="pl-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                            </span>
                        ) : (
                            "Entrar"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default LoginPage;