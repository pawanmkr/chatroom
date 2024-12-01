import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatComponent from '../components/ChatBox';
import UserList from '../components/UserList';
import axios from 'axios';

const Chat = () => {
    const { user_id } = useParams();
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [activeUsers, setActiveUsers] = useState<string[]>([]);
    const [chattingWith, setChattingWith] = useState<string>();

    useEffect(() => {
        if (user_id) {
            localStorage.setItem('user_id', user_id);
        }
        fetchInitialActiveUsers();

        const socket = new WebSocket(
            `${import.meta.env.VITE_MY_WS_URL}/${user_id}`,
        );
        setWs(socket);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);

            if (message.event === 'user_joined') {
                setActiveUsers((prevActiveUsers) => {
                    const updatedSet = new Set(prevActiveUsers);
                    updatedSet.add(message.user_id);
                    return [...updatedSet];
                });
            } else if (message.event === 'user_left') {
                if (message.user_id == chattingWith) setChattingWith('OFFLINE');
                setActiveUsers((prevActiveUsers) =>
                    prevActiveUsers.filter((user) => user !== message.user_id),
                );
            } else {
                console.log('error occurred');
            }
        };
        socket.onopen = () => {
            console.log('WebSocket connected');
        };
        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };
        return () => {
            if (socket) socket.close();
        };
    }, [user_id]);

    async function fetchInitialActiveUsers() {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_MY_API_URL}/user/active`,
            );
            if (res.data && res.data.active_users) {
                setActiveUsers(res.data.active_users);
            }
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    }

    return (
        <div className="chat flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar for UserList */}
            <div className="w-1/4 p-4 bg-[#282A36]">
                <UserList
                    activeUsers={activeUsers}
                    setChattingWith={setChattingWith}
                />
            </div>
            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col">
                <ChatComponent ws={ws} chattingWith={chattingWith} />
            </div>
        </div>
    );
};

export default Chat;
