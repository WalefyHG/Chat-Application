"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatSocket, MessagePayload } from "@/lib/socket"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
}

interface ChatPageProps {
  username: string
  room_name: string
  token: string
  onLogout: () => void
}

export default function ChatPage({ username, room_name, token, onLogout }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<ChatSocket | null>(null)

  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/chat/${room_name}/`  // ajuste conforme sua rota do Django Channels

    const socket = new ChatSocket(
      wsUrl,
      token,
      (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            ...msg,
            timestamp: new Date(msg.timestamp),
          },
        ])
      },
      () => setIsConnected(true),
      () => setIsConnected(false),
      (err) => console.error("WebSocket error:", err)
    )

    socket.connect()
    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [username, token])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected || !socketRef.current) return

    socketRef.current.send(newMessage, username)

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: username,
        content: newMessage,
        timestamp: new Date(),
      },
    ])

    setNewMessage("")
  }

  const handleLogout = () => {
    socketRef.current?.disconnect()
    onLogout()
  }

  return (
    <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chat Room</CardTitle>
        <div className="flex items-center gap-4">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.sender === username ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{message.sender.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[70%] ${message.sender === username ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium mb-1">
                      {message.sender === username ? "You" : message.sender}
                    </span>
                    <span>{message.content}</span>
                    <span className="text-xs opacity-70 mt-1 text-right">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
        <form onSubmit={sendMessage} className="flex w-full gap-2">
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
