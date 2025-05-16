
'use client';

import { chatService } from '@/services/api';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowDown } from 'lucide-react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

interface ChatProps {
    currentUserId: number;
    otherUserId: number;
}

interface Message {
    id: number;
    username: string;    // username do remetente
    senderId: number;    // seu campo interno para alinhar as mensagens (se quiser)
    content: string;
    timestamp?: string;
    read?: boolean;
}

const Chat: React.FC<ChatProps> = ({ currentUserId, otherUserId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const ws = useRef<WebSocket | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{"id": 1, "username": "user1"}');
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // Monta o nome da sala (room)
    const getRoomName = (id1: number, id2: number) =>
        id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

    useEffect(() => {
        const roomName = getRoomName(currentUserId, otherUserId);
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://127.0.0.1:8000/ws/chat/${roomName}/?user_id=${currentUser?.id}`;

        // Use MockWebSocket for development, real WebSocket for production
        try {
            ws.current = new WebSocket(wsUrl);
        } catch (e) {
            console.log('Using MockWebSocket as fallback');
            ws.current = new WebSocket(wsUrl);
        }

        ws.current.onopen = () => {
            console.log('WebSocket conectado na sala', roomName);
            // Carrega mensagens anteriores via API REST
            chatService.getMessages(roomName).then((initialMessages) => {
                // Transforme mensagens no formato esperado
                const formatted = initialMessages.map((msg: any) => ({
                    id: msg.id,
                    content: msg.message || msg.content,
                    username: msg.username,
                    senderId: msg.username === currentUser.username ? currentUserId : otherUserId,
                    timestamp: msg.timestamp,
                    read: msg.read,
                }));
                setMessages(formatted);
            });
        };

        ws.current.onmessage = (e: any) => {
            try {
                const event = JSON.parse(e.data);
                console.log("Received message:", event);

                // Seu backend envia mensagens com a chave 'type', trate só mensagens tipo 'message' (chat_message no backend)
                if (event.type === 'previous_messages') {
                    // Mensagens anteriores - já tratadas na inicialização, pode ignorar aqui
                    return;
                }

                if (event.message && event.username) {
                    const incomingMessage: Message = {
                        id: event.id,
                        content: event.message,
                        username: event.username,
                        senderId: event.username === currentUser.username ? currentUserId : otherUserId,
                        timestamp: event.timestamp,
                        read: event.read,
                    };
                    setMessages((prevMessages) => [...prevMessages, incomingMessage]);
                }
                // Pode tratar outros tipos como 'typing', 'mark_as_read' se quiser

                // Exemplo de tratamento de 'typing'
                else if (event.type === "typing") {
                    setTypingUsers((prev) => [...prev, event.username]);
                } else if (event.type === "stop_typing") {
                    setTypingUsers((prev) =>
                        prev.filter((username) => username !== event.username)
                    );
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket desconectado');
        };

        ws.current.onerror = (error: any) => {
            console.error('WebSocket erro:', error);
        };

        // Cleanup no unmount ou troca de sala
        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            setMessages([]);
        };
    }, [currentUserId, otherUserId]);

    // Auto scroll para o fim da lista sempre que messages mudarem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add scroll event listener to show/hide scroll button
    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            setShowScrollButton(!isNearBottom);
        };

        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            chatContainer.addEventListener('scroll', handleScroll);
            return () => chatContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleStopTyping = () => {
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
        }
        if (ws.current) {
            ws.current.send(JSON.stringify({ type: "stop_typing" }));
        }
    };

    const handleTyping = () => {
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        } else {
            if (ws.current) {
                ws.current.send(JSON.stringify({ type: "typing" }));
            }
        }

        typingTimeout.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket não está conectado.');
            return;
        }

        const messageData = {
            type: 'message',
            message: newMessage.trim(),
            sender_id: currentUser.id,
        };

        ws.current.send(JSON.stringify(messageData));
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[80vh] bg-background rounded-lg shadow-lg border border-border">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
                <h2 className="text-lg font-semibold text-card-foreground">
                    Conversando com Usuário #{otherUserId}
                </h2>
            </div>

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20"
            >
                {messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        message={msg}
                        isCurrentUser={msg.senderId === currentUserId}
                    />
                ))}

                {/* Typing Indicator */}
                <TypingIndicator typingUsers={typingUsers} />

                {/* Invisible element for auto-scrolling */}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-24 right-8 rounded-full shadow-md"
                    onClick={scrollToBottom}
                >
                    <ArrowDown size={16} />
                </Button>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim()}
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Chat;