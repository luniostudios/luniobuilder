import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react'

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface ALLUserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

const users = () => {

    const { data: session, status } = useSession();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [allUserData, setAllUserData] = useState<ALLUserData[] | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchALLUserData();
            fetchUserData();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status]);


    const fetchALLUserData = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/allusers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            setError('Unable to load user data.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setAllUserData(data);
        setLoading(false);
    };

    const fetchUserData = async () => {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            setError('Unable to load user data.');
            setLoading(false);
            return;
        }

        const data = await response.json();
        setUserData(data);
        setLoading(false);
    };

    return (
        <div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Loading...
                            </td>
                        </tr>
                    )}
                    {error && (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {error}
                            </td>
                        </tr>
                    )}
                    {allUserData && allUserData.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    )
}

export default users