'use client';

import { chatService } from '@/services/api';
import React, { useEffect, useState, useRef } from 'react';

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
    const ws = useRef<WebSocket | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Monta o nome da sala (room)
    const getRoomName = (id1: number, id2: number) =>
        id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

    useEffect(() => {
        const roomName = getRoomName(currentUserId, otherUserId);
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://127.0.0.1:8000/ws/chat/${roomName}/?user_id=${currentUser?.id}`;

        ws.current = new WebSocket(wsUrl);

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

        ws.current.onmessage = (e) => {
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

        ws.current.onerror = (error) => {
            console.error('WebSocket erro:', error);
        };

        // Cleanup no unmount ou troca de sala
        return () => {
            ws.current?.close();
            ws.current = null;
            setMessages([]);
        };
    }, [currentUserId, otherUserId]);

    // Auto scroll para o fim da lista sempre que messages mudarem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket não está conectado.');
            return;
        }

        const messageData = {
            type: 'message',       // tipo esperado pelo backend
            message: newMessage.trim(),
            sender_id: currentUser.id,
        };

        ws.current.send(JSON.stringify(messageData));

        // Feedback local imediato
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now(), // temporário, backend vai corrigir
                content: newMessage.trim(),
                username: currentUser.username,
                senderId: currentUserId,
                timestamp: new Date().toISOString(),
                read: false,
            },
        ]);
        setNewMessage('');
    };

    return (
        <div>
            <h2>Chat com usuário {otherUserId}</h2>

            <div
                style={{
                    border: '1px solid #ccc',
                    padding: '10px',
                    height: '300px',
                    overflowY: 'auto',
                    marginBottom: '10px',
                }}
            >
                {messages.map((msg) => (
                    <p
                        key={msg.id}
                        style={{
                            textAlign: msg.senderId === currentUserId ? 'right' : 'left',
                            backgroundColor:
                                msg.senderId === currentUserId ? '#DCF8C6' : '#FFF',
                            padding: '5px 10px',
                            borderRadius: '10px',
                            maxWidth: '60%',
                            marginLeft: msg.senderId === currentUserId ? 'auto' : undefined,
                            marginBottom: '5px',
                        }}
                    >
                        <strong>{msg.username}: </strong> {msg.content}
                    </p>
                ))}
                <div ref={messagesEndRef} />
                {typingUsers.length > 0 && (
                    <p style={style.typing}>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'estão' : 'está'} digitando...</p>
                )}
            </div>

            <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping();
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                }}
                placeholder="Digite sua mensagem e pressione Enter"
                style={{ width: '100%', padding: '8px' }}
            />
        </div>
    );
};

export default Chat;


// Adicione estilos CSS para o componente de chat
const style = {
    typing: {
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderTop: "1px solid #444",
        color: "white",
        justifyContent: "center",
        backgroundColor: "#333",
    }
};
