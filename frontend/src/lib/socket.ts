// lib/socket.ts
export type MessagePayload = {
    id: string
    sender: string
    content: string
    timestamp: string
    type?: string
}

export class ChatSocket {
    private socket: WebSocket | null = null

    constructor(
        private url: string,
        private token: string,
        private onMessage: (msg: MessagePayload) => void,
        private onOpen?: () => void,
        private onClose?: () => void,
        private onError?: (err: Event) => void
    ) { }

    connect() {
        // monta a URL com token como query param
        const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`
        this.socket = new WebSocket(wsUrl)

        this.socket.onopen = () => this.onOpen?.()
        this.socket.onclose = () => this.onClose?.()
        this.socket.onerror = (e) => this.onError?.(e)
        this.socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data) as MessagePayload
                this.onMessage(data)
            } catch {
                console.warn("WS: mensagem não pôde ser parseada", e.data)
            }
        }
    }

    send(content: string, sender: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
        const msg = { content, sender }
        this.socket.send(JSON.stringify(msg))
    }

    disconnect() {
        this.socket?.close()
        this.socket = null
    }
}
