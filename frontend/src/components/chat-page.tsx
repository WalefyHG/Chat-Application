"use client"

import React, { useEffect, useRef, useState } from "react"
import { ChatSocket, MessagePayload } from "@/lib/socket"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChatPageProps {
    username: string
    token: string
    roomName: string               // <-- recebe o nome da sala
    onLogout: () => void
}

export default function ChatPage({ username, token, roomName, onLogout }: ChatPageProps) {
    const [messages, setMessages] = useState<MessagePayload[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const chatSocket = useRef<ChatSocket | null>(null)

    useEffect(() => {
        // monta a URL incluindo a sala
        const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/chat"
        const WS_URL = `${base}/${encodeURIComponent(roomName)}/?token=${encodeURIComponent(token)}`

        chatSocket.current = new ChatSocket(
            WS_URL,
            token,
            (msg) => setMessages((prev) => [...prev, msg]),
            () => setIsConnected(true),
            () => setIsConnected(false),
            () => onLogout()
        )
        chatSocket.current.connect()

        return () => {
            chatSocket.current?.disconnect()
        }
    }, [roomName, token, onLogout])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        chatSocket.current?.send(newMessage.trim(), username)
        setNewMessage("")
    }

    return (
        <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Chat: {roomName}</CardTitle>
                <div className="flex items-center gap-4">
                    <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
                    <Button variant="outline" onClick={() => { chatSocket.current?.disconnect(); onLogout() }}>
                        Logout
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea ref={scrollRef} className="h-full pr-4">
                    <div className="space-y-4">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex items-start gap-2 ${m.sender === username ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{m.sender.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div
                                    className={`rounded-lg px-3 py-2 max-w-[70%] ${m.sender === username ? "bg-primary text-primary-foreground" : "bg-muted"
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium mb-1">
                                            {m.sender === username ? "You" : m.sender}
                                        </span>
                                        <span>{m.content}</span>
                                        <span className="text-xs opacity-70 mt-1 text-right">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter>
                <form onSubmit={handleSend} className="flex w-full gap-2">
                    <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!isConnected}
                    />
                    <Button type="submit" disabled={!isConnected || !newMessage.trim()}>
                        Send
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
