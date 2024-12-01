import { useEffect } from 'react';

type UserListProps = {
    activeUsers: string[];
    setChattingWith: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const UserList = ({ activeUsers, setChattingWith }: UserListProps) => {
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            console.error('User ID not found');
            return;
        }
    }, []);

    const handleUserClick = (userId: string) => {
        setChattingWith(userId);
    };

    return (
        <div className="user-list text-[#A9A9B2] bg-[#282A36]">
            <h1 className="text-lg font-bold text-gray-100 mb-4">
                Active Users
            </h1>
            {activeUsers.length === 0 ? (
                <p className="text-gray-400">No active users. You're alone!</p>
            ) : (
                <div className="space-y-2">
                    {activeUsers.map((userId) => (
                        <div
                            key={userId}
                            className="flex items-center p-2 bg-gray-700 rounded-md transition cursor-pointer hover:bg-[#44475A]"
                            onClick={() => handleUserClick(userId)}
                        >
                            <img
                                src={`https://ui-avatars.com/api/?name=${userId}&background=random&size=32`}
                                alt={`${userId}'s avatar`}
                                className="w-8 h-8 rounded-full mr-2"
                            />
                            <span className="text-gray-200 font-medium">
                                {userId}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserList;
