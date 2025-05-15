const { createServer } = require("http")
const { Server } = require("socket.io")
const express = require("express")

const app = express()
const httpServer = createServer(app)

// Configurar CORS para permitir conexões do seu frontend
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", // URL do seu frontend
        methods: ["GET", "POST"],
        credentials: true,
    },
})

// Simplificar a autenticação para fins de teste
io.use((socket: { handshake: { auth: { token: any }; query: { username: string } }; user: { id: string; username: any } }, next: (arg0: Error | undefined) => void) => {
    const token = socket.handshake.auth.token
    const username = socket.handshake.query.username || "Anonymous"

    console.log("Socket connection attempt:", { username, hasToken: !!token })

    if (!token) {
        console.log("Authentication failed: No token provided")
        return next(new Error("Authentication error"))
    }

    // Para fins de teste, aceitamos qualquer token
    // Em produção, você verificaria com o Django
    socket.user = {
        id: "123",
        username: username,
    }

    console.log("Authentication successful for user:", username)
    next(undefined)
})

// Armazenar usuários conectados
const connectedUsers = new Map()

io.on("connection", (socket: { user: { username: string; id: string }; id: any; emit: (arg0: string, arg1: { id: string; sender: string; content: string; timestamp: Date }) => void; broadcast: { emit: (arg0: string, arg1: { id: string; sender: string; content: string; timestamp: Date }) => void }; on: (event: string, listener: (...args: any[]) => void) => void }) => {
    // Obter nome de usuário do token ou do parâmetro de conexão
    const username = socket.user.username || "Anonymous"
    const userId = socket.user.id || "unknown"

    // Armazenar informações do usuário
    connectedUsers.set(socket.id, { username, userId })

    console.log(`User connected: ${username} (${socket.id})`)

    // Enviar mensagem de boas-vindas
    socket.emit("welcome", {
        id: Date.now().toString(),
        sender: "System",
        content: `Welcome to the chat, ${username}!`,
        timestamp: new Date(),
    })

    // Notificar outros usuários
    socket.broadcast.emit("message", {
        id: Date.now().toString(),
        sender: "System",
        content: `${username} has joined the chat`,
        timestamp: new Date(),
    })

    // Lidar com mensagens enviadas pelo cliente
    socket.on("send_message", (message: { sender: any }) => {
        console.log("Received message:", message)

        // Validar que o remetente da mensagem corresponde ao usuário autenticado
        if (message.sender !== username && username !== "Anonymous") {
            console.warn(`Message sender mismatch: ${message.sender} vs ${username}`)
            message.sender = username // Corrigir o remetente para evitar falsificação
        }

        // Reenviar a mensagem para todos os clientes (incluindo o remetente)
        io.emit("message", message)
    })

    // Lidar com desconexão
    socket.on("disconnect", () => {
        const user = connectedUsers.get(socket.id)
        if (user) {
            console.log(`User disconnected: ${user.username} (${socket.id})`)

            // Notificar outros usuários
            socket.broadcast.emit("message", {
                id: Date.now().toString(),
                sender: "System",
                content: `${user.username} has left the chat`,
                timestamp: new Date(),
            })

            // Remover usuário da lista
            connectedUsers.delete(socket.id)
        }
    })
})

// Rota de API para verificar o status do servidor
app.get("/api/status", (req: any, res: { json: (arg0: { status: string; connections: number; users: any[] }) => void }) => {
    res.json({
        status: "online",
        connections: connectedUsers.size,
        users: Array.from(connectedUsers.values()).map((u) => u.username),
    })
})

// Iniciar o servidor
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`)
})
