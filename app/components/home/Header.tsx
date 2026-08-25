import Link from 'next/link'
import SignIn from '../auth/googleSignIn'
import { auth } from '@/app/auth/auth'
import UserAvatar from '../auth/UserAvatar'
import { Menu, Rocket, User } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "@/components/ui/popover"
import { SignOut } from '../auth/signOut'


const Header = async () => {


    const session = await auth()

    return (
        <div className='bg-[#111114] w-full mt-0 flex flex-row justify-between align-middle items-center gap-2 py-4 z-10 px-[10%] max-lg:px-5'>
            <div className='flex'>
                <Link href={"/"}>
                    <div className="flex items-center text-white gap-2 cursor-pointer font-bold uppercase text-lg">
                        <div className='flex flex-row text-2xl align-middle items-center'>
                            <h1>LUNI</h1>
                            <Rocket width={20} className="text-bold" />
                        </div>
                        <h1 className='flex flex-row text-2xl align-middle items-center'>BUILDER</h1>
                    </div>
                </Link>
            </div>

            <div className='flex items-center gap-6 justify-center max-md:hidden'>
                <nav>
                    <ul className='flex gap-6 items-center justify-center'>
                        <li><Link href="/pricing#faq" className='text-gray-400 hover:text-gray-300 transition-colors'>FAQ</Link></li>
                        <li><Link href="/pricing" className='text-gray-400 hover:text-gray-300 transition-colors'>Pricing</Link></li>
                        <li><Link href="/documentation" className='text-gray-400 hover:text-gray-300 transition-colors'>Documentation</Link></li>
                        {!session && (
                            <li><Link href="/auth/signin" className="flex flex-row text-white border justify-center border-white/20 rounded-full px-3 py-1 items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <User size={16} />
                                Sign In
                            </Link>
                            </li>
                        )}
                        {session && (
                            <UserAvatar />
                        )}
                    </ul>
                </nav>
            </div>
            <div className='text-white md:hidden gap-2 z-10' >
                <Popover>
                    <PopoverTrigger className='outline-none'>
                        <Menu size={20} />
                    </PopoverTrigger>
                    <PopoverContent className="bg-[#111215] text-white border border-white/20 mr-6 mt-4">
                        <PopoverHeader className="ml-4">
                            <div>
                                <p className="text-sm font-medium">{session?.user?.name}</p>
                                <p className="text-xs text-gray-400 underline">{session?.user?.email}</p>
                            </div>
                            <ul className='flex flex-col gap-4 mt-4'>
                                <li><Link href="/pricing#faq" className='text-gray-400 hover:text-gray-300 transition-colors'>FAQ</Link></li>
                                <li><Link href="/pricing" className='text-gray-400 hover:text-gray-300 transition-colors'>Pricing</Link></li>
                                <li><Link href="/documentation" className='text-gray-400 hover:text-gray-300 transition-colors'>Documentation</Link></li>
                                {!session && (
                                    <li><Link href="/auth/signin" className="flex flex-row text-white mt-10 border justify-center border-white/20 px-3 py-3 gap-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><User size={16} /> Sign In</Link></li>
                                )}
                                {session && (
                                    <div>
                                        <Link href="/dashboard">
                                            Dashboard
                                        </Link>
                                        <li><SignOut /></li>
                                    </div>
                                )}
                            </ul>
                        </PopoverHeader>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default Header