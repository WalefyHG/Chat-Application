'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "../components/login-page";
import SelectUserPage from "../components/chat-select";
import { Loader } from "lucide-react";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugState, setDebugState] = useState<any>({});

  // Verificar se o usuário já está logado ao carregar a página
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedUser = localStorage.getItem("user");

    // Atualizar estado de depuração
    setDebugState({
      hasToken: !!storedToken,
      hasUsername: !!storedUsername,
      hasUserData: !!storedUser
    });

    if (storedToken && storedUsername) {
      console.log("Found stored credentials, setting logged in state");
      setToken(storedToken);
      setUsername(storedUsername);

      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }

      setIsLoggedIn(true);
    }

    setIsLoading(false);
  }, []);

  const handleLogin = (user: string, authToken: string, userData?: any) => {
    console.log("handleLogin called with:", {
      user,
      tokenLength: authToken?.length || 0,
      hasUserData: !!userData
    });

    // Atualizar estado imediatamente
    setUsername(user);
    setToken(authToken);
    if (userData) {
      setUserData(userData);
    }

    // Importante: definir isLoggedIn como true para acionar a renderização da página de chat
    setIsLoggedIn(true);

    // Registrar o estado após a atualização
    console.log("Login state updated, should redirect to chat");
  };

  // Mostrar um indicador de carregamento enquanto verificamos o estado de login
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </main>
    );
  }

  console.log("Render state:", { isLoggedIn, username, hasToken: !!token });

  // Componente de depuração para mostrar o estado atual
  const DebugPanel = () => (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs max-w-xs z-50">
      <p className="font-bold mb-1">Debug State:</p>
      <pre>{JSON.stringify({ isLoggedIn, username, hasToken: !!token, ...debugState }, null, 2)}</pre>
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      {process.env.NODE_ENV !== "production" && <DebugPanel />}

      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <SelectUserPage />
      )}
    </main>
  );
};

export default Index;