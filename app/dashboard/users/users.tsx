import { Table, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
            <Table className="min-w-full divide-y divide-gray-200">
                <TableCaption>A list of all users.</TableCaption>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                        </TableHead>
                        <TableHead scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                        </TableHead>
                        <TableHead scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </TableHead>
                        <TableHead scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <TableRow>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Loading...
                            </td>
                        </TableRow>
                    )}
                    {error && (
                        <TableRow>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {error}
                            </td>
                        </TableRow>
                    )}
                    {allUserData && allUserData.map((user) => (
                        <TableRow key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.role}</td>
                        </TableRow>
                    ))}
                </tbody>
            </Table>

        </div>
    )
}

export default users