'use client';

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Chat from "../../../hooks/chat-socket";
import { use } from "react";

const ChatPage: React.FC = () => {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const searchParams = useParams();
    const userId = searchParams ? searchParams?.user_id : null;

    if (!currentUser || !userId) return <div>Carregando...</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl">
                <h1 className="text-3xl font-bold mb-6 text-center">Mensagens</h1>
                <Chat currentUserId={currentUser.id} otherUserId={Number(userId)} />
            </div>
        </div>
    );
};

export default ChatPage;
