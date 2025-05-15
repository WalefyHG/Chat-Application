import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"

interface JWTPayload {
    exp: number
    username?: string
    sub?: string
}

export function useAuth() {
    const [token, setToken] = useState<string>("")
    const [username, setUsername] = useState<string>("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token") || ""
        const storedUsername = localStorage.getItem("username") || ""

        setToken(storedToken)
        setUsername(storedUsername)

        if (storedToken) {
            try {
                const decoded = jwtDecode<JWTPayload>(storedToken)
                const currentTime = Date.now() / 1000

                if (decoded.exp && decoded.exp > currentTime) {
                    setIsAuthenticated(true)
                } else {
                    setIsAuthenticated(false)
                    console.warn("Token expirado.")
                }
            } catch (error) {
                setIsAuthenticated(false)
                console.error("Token inválido ou não decodificável.")
            }
        } else {
            setIsAuthenticated(false)
        }

        setLoading(false)
    }, [])

    return { token, username, isAuthenticated, loading }
}
