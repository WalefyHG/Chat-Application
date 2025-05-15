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

    return <Chat currentUserId={currentUser.id} otherUserId={Number(userId)} />;
};

export default ChatPage;
