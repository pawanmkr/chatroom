import { useEffect, useState } from 'react';

type UserHeaderProps = {
    chattingWith: string;
};

const UserHeader = ({ chattingWith }: UserHeaderProps) => {
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        if (chattingWith === 'OFFLINE') {
            setIsOnline(false);
        } else {
            setIsOnline(true);
        }
    }, [chattingWith]);

    return (
        <div className="flex items-center mt-2 p-2 py-1 bg-[#282A36] text-[#F8F8F2] w-max rounded-md">
            <div
                className={`w-3 h-3 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
            ></div>
            <p className="ml-2 text-gray-200 font-medium">{chattingWith}</p>
        </div>
    );
};

export default UserHeader;
