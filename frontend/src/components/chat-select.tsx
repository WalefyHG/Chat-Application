"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type User = { id: number; username: string, email: string };

export default function SelectUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Supondo que você armazene seu próprio ID no localStorage ou contexto
    const myId = Number(localStorage.getItem("user_id"));

    useEffect(() => {
        fetch("http://localhost:8000/api/user/", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                // remover a si mesmo da lista
                const userList: User[] = data.results || [];
                setUsers(userList.filter((u) => u.id !== myId));
            })
            .finally(() => setLoading(false));
    }, [myId]);

    function startChatWith(userId: number) {
        // formatar room: sempre menor_maior para não duplicar
        const roomName = myId < userId ? `${myId}_${userId}` : `${userId}_${myId}`;
        router.push(`/api/chat/messages/${roomName}`);
    }

    console.log("Users:", users);

    if (loading) return <p>Loading...</p>;
    if (!users.length) return <p>No other users found.</p>;

    return (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
                <Card key={u.id} className="hover:shadow-lg cursor-pointer" onClick={() => startChatWith(u.id)}>
                    <CardHeader>
                        <CardTitle>{u.username}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>User ID: {u.id}</p>
                        <Button variant="outline" className="mt-2" onClick={() => startChatWith(u.id)}>
                            Chat with {u.username}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}