'use client';

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Chat from "../../../hooks/chat-socket";
import { Loader } from "lucide-react";

const ChatPage: React.FC = () => {
    const router = useRouter();
    const { user: currentUser, loading } = useAuth();
    const searchParams = useParams();
    const userId = searchParams ? searchParams?.user_id : null;

    if (loading || !userId) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentUser) {
        // Usuário não autenticado
        router.push('/');
        return null;
    }

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
