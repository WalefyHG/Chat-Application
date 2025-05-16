import React from 'react';
import { cn } from '@/lib/utils';  // Presumo que é uma função para combinar classes conditionais
import { format } from 'date-fns';

interface ChatBubbleProps {
    message: {
        id: number;
        content: string;
        username: string;
        senderId: number;
        timestamp?: string;
        read?: boolean;
    };
    isCurrentUser: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser }) => {
    return (
        <div
            className={cn(
                "flex flex-col mb-2 max-w-[75%] md:max-w-[60%]",
                isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
        // 'ml-auto' para alinhar à direita se for usuário atual, 'mr-auto' para alinhar à esquerda para outro usuário
        >
            {/* Nome do remetente acima da mensagem */}
            <div className="flex items-center mb-1">
                <span className="text-xs text-muted-foreground">
                    {isCurrentUser ? 'Você' : message.username}
                </span>
            </div>

            {/* Caixa da mensagem com cores distintas */}
            <div
                className={cn(
                    "px-4 py-3 rounded-2xl break-words",
                    isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-secondary text-secondary-foreground rounded-tl-none"
                )}
            >
                {message.content}
            </div>

            {/* Rodapé da mensagem: horário e ícone de leitura */}
            <div className="flex items-center mt-1 space-x-2">
                {message.timestamp && (
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), "HH:mm")}
                    </span>
                )}
                {isCurrentUser && message.read && (
                    <span className="text-xs text-blue-500 select-none">✓✓</span>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
