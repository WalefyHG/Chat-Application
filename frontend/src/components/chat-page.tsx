import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatService, userService, type Message, type User } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ChatPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [chatUser, setChatUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserAndMessages = async () => {
            if (!userId) return;

            try {
                setLoading(true);
                const users = await userService.getUsers();
                const user = users.find((u: { id: number; }) => u.id === parseInt(userId));

                if (user) {
                    setChatUser(user);
                    const msgs = await chatService.getMessages(user.id.toString());
                    setMessages(msgs);
                } else {
                    toast.error("Usuário não encontrado");
                    navigate("/");
                }
            } catch (error) {
                console.error("Error fetching chat data:", error);
                toast.error("Erro ao carregar o chat");
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndMessages();
    }, [userId, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !chatUser || sending) return;

        try {
            setSending(true);
            const message = await chatService.sendMessage(chatUser.id.toString(), newMessage);
            setMessages(prev => [...prev, message]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Erro ao enviar mensagem");
        } finally {
            setSending(false);
        }
    };

    const getInitials = (username: string) => {
        return username.substring(0, 2).toUpperCase();
    };

    const formatMessageTime = (timestamp: string) => {
        try {
            return format(new Date(timestamp), "HH:mm");
        } catch (e) {
            return "";
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col bg-gray-50 rounded-lg shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center bg-white p-4 shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                {chatUser && (
                    <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={chatUser.avatar} alt={chatUser.username} />
                            <AvatarFallback>{getInitials(chatUser.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-medium">{chatUser.username}</h2>
                            <p className="text-xs text-gray-500">
                                {chatUser.isOnline ? "Online" : "Offline"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isMine = message.sender === currentUser?.id;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${isMine
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                <p className="break-words">{message.content}</p>
                                <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                    {formatMessageTime(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 bg-white p-4 flex gap-2"
            >
                <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                />
                <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            <span className="ml-2">Enviar</span>
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

export default ChatPage;