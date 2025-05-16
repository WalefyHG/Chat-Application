import React from 'react';

interface TypingIndicatorProps {
    typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
    if (typingUsers.length === 0) return null;

    return (
        <div className="flex items-center p-2 rounded-full bg-secondary/50 max-w-max my-2">
            <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">
                {typingUsers.join(', ')} {typingUsers.length > 1 ? 'estão' : 'está'} digitando...
            </span>
        </div>
    );
};

export default TypingIndicator;