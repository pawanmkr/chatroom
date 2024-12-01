import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserHeader from './UserHeader';

export type Message = {
    from: string;
    to: string;
    content: string;
    time: string;
};

type ChatBoxProps = {
    ws: WebSocket | null;
    chattingWith: string | undefined;
};

const ChatBox = ({ ws, chattingWith }: ChatBoxProps) => {
    const { user_id } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');

    useEffect(() => {
        if (!chattingWith || chattingWith === 'OFFLINE') {
            return;
        }
        fetchMessagesForUser(chattingWith);
        if (ws) {
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (
                    message.to === chattingWith ||
                    message.from === chattingWith
                ) {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            };
        }
    }, [chattingWith, ws]);

    // Simulate fetching chat history from an API
    const fetchMessagesForUser = async (user: string) => {
        try {
            // Example API request to fetch messages for the current conversation
            // Replace with your actual API request
            // const response = await fetch(
            //     `/api/messages?from=${user_id}&to=${user}`,
            // );
            // const data = await response.json();
            // if (data.messages) {
            //     setMessages(data.messages);
            // } else {
            //     setMessages([]);
            // }
            setMessages([]);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim() === '' || !chattingWith) return;
        const message = {
            from: user_id as string,
            to: chattingWith,
            content: inputMessage,
            time: new Date().toISOString(),
        };
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open');
        }
        setMessages((prevMessages) => [...prevMessages, message]);
        setInputMessage('');
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a23] px-16">
            {chattingWith && chattingWith.length > 0 && (
                <UserHeader chattingWith={chattingWith} />
            )}
            {/* Messages List */}
            <div className="messages flex-grow overflow-y-auto bg-[#1a1a23] py-4 space-y-3">
                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={`flex ${
                            message.from === user_id
                                ? 'justify-end'
                                : 'justify-start'
                        }`}
                    >
                        <div
                            className={`p-3 rounded-lg text-sm shadow-md ${
                                message.from === user_id
                                    ? 'bg-[#9e9e9e] text-[#1E1E2E]'
                                    : 'bg-[#44475A] text-[#F8F8F2]'
                            }`}
                        >
                            {message.from !== user_id && (
                                <strong className="block mb-1">
                                    {message.from}
                                </strong>
                            )}
                            {message.content}
                        </div>
                    </div>
                ))}
            </div>
            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                className="flex items-center p-2 bg-[#282A36] border-t border-[#3C3F4E] my-4 rounded-lg"
            >
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message"
                    className="flex-grow p-3 rounded-md bg-[#3C3F4E] text-[#F8F8F2] focus:outline-none focus:ring-2 focus:ring-[#BD93F9]"
                />
                <button
                    type="submit"
                    className="ml-4 px-4 py-3 bg-[#BD93F9] text-[#1E1E2E] rounded-md hover:bg-[#FF79C6] transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
