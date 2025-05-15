"use client";

import dynamic from "next/dynamic";
import { useAuth } from "../../../../../lib/useAuth";

const ChatPage = dynamic(() => import("../../../../../components/chat-page"), { ssr: false });

export default function RoomPage({ params }: { params: { roomName: string } }) {
    const { token, username, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p className="p-4">Carregando...</p>;
    }

    if (!isAuthenticated || !token || !username) {
        return <p className="p-4 text-red-600">Usuário não autenticado. Faça login novamente.</p>;
    }

    return (
        <div className="p-4">
            <ChatPage
                roomName={params.roomName}
                token={token}
                username={username}
                onLogout={() => {
                    localStorage.clear();
                    window.location.href = "/";
                }}
            />
        </div>
    );
}
