import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userService, User } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const SelectUserPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser, logout } = useAuth();
    const navigate = useRouter();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getUsers();
                const filteredUsers = data.filter((user: User) => user.id !== currentUser?.id);
                setUsers(filteredUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast.error("Erro ao carregar usuários.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUserClick = (userId: number) => {
        navigate.push(`/chat/${userId}`);
    };

    const getInitials = (username: string) => {
        return username.substring(0, 2).toUpperCase();
    };

    const formatLastSeen = (lastSeen?: string) => {
        if (!lastSeen) return "Há algum tempo";
        try {
            return `Visto por último ${format(new Date(lastSeen), "dd/MM/yyyy 'às' HH:mm")}`;
        } catch (e) {
            return "Há algum tempo";
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
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage
                            src={currentUser?.avatar}
                            alt={currentUser?.username}
                        />
                        <AvatarFallback>{currentUser?.username ? getInitials(currentUser.username) : 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-medium">{currentUser?.username}</h1>
                        <p className="text-sm text-gray-500">Online</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        logout();
                        toast.info("Logout realizado com sucesso!");
                    }}
                    className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <h2 className="mb-4 font-medium text-gray-500">Conversas ({users.length})</h2>
                    <div className="space-y-1">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex cursor-pointer items-center rounded-lg p-3 transition-colors hover:bg-gray-100"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={user.avatar} alt={user.username} />
                                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                                    </Avatar>
                                    {user.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                                    )}
                                </div>

                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">{user.username}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {user.isOnline ? "Online" : formatLastSeen(user.lastSeen)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectUserPage;