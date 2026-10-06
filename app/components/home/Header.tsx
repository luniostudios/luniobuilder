import Link from 'next/link'
import { auth } from '@/app/auth/auth'
import UserAvatar from '../auth/UserAvatar'
import { BarChart, LayoutDashboard, Menu, Rocket, Settings, User } from 'lucide-react'
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
        <div className='bg-[#0b0d10] w-full mt-0 flex flex-row fixed z-100 justify-between align-middle items-center gap-2 py-4 px-[10%] max-lg:px-5'>
            <div className='flex'>
                <Link href={"/"}>
                    <div className="flex items-center text-white gap-2 cursor-pointer font-bold uppercase text-lg">
                        <div className='flex flex-row text-2xl align-middle items-center'>
                            <h1>LUNI</h1>
                            <Rocket width={20} className="text-bold text-[#b8f36b]" />
                        </div>
                        <h1 className='flex flex-row text-2xl align-middle items-center'>BUILDER</h1>
                    </div>
                </Link>
            </div>

            <div className='flex items-center gap-6 justify-center max-md:hidden'>
                <nav>
                    <ul className='flex gap-6 items-center justify-center'>
                        <li><Link href="/#faq" className='text-gray-400 hover:text-gray-300 transition-colors'>FAQ</Link></li>
                        <li><Link href="/pricing" className='text-gray-400 hover:text-gray-300 transition-colors'>Pricing</Link></li>
                        <li className='items-align-middle'><Link href="/#templates" className='flex flex-row gap-2 text-gray-400 hover:text-gray-300 transition-colors'>Templates</Link></li>
                        <li><Link href="/#services" className='text-gray-400 hover:text-gray-300 transition-colors'>Services</Link></li>
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
                    <PopoverContent className="bg-[#0b0d10] text-white border border-white/20 mr-6 mt-8">
                        <PopoverHeader className="ml-4">
                            <div>
                                <p className="text-sm font-medium">{session?.user?.name}</p>
                                <p className="text-xs text-gray-400 underline">{session?.user?.email}</p>
                            </div>
                            <ul className='flex flex-col gap-4 mt-4'>
                                <li><Link href="/#faq" className='text-gray-400 hover:text-gray-300 transition-colors'>FAQ</Link></li>
                                <li><Link href="/pricing" className='text-gray-400 hover:text-gray-300 transition-colors'>Pricing</Link></li>
                                <li className='items-align-middle'><Link href="/#templates" className='flex flex-row gap-2 text-gray-400 hover:text-gray-300 transition-colors'>Templates</Link></li>
                                <li><Link href="/#services" className='text-gray-400 hover:text-gray-300 transition-colors'>Services</Link></li>
                                <li><Link href="/documentation" className='text-gray-400 hover:text-gray-300 transition-colors'>Documentation</Link></li>
                                {!session && (
                                    <li><Link href="/auth/signin" className="flex flex-row text-white mt-2 border justify-center border-white/20 px-3 py-3 gap-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><User size={16} /> Sign In</Link></li>
                                )}
                                {session && (
                                    <div className='flex flex-col gap-4'>
                                        <Link href="/dashboard?tab=projects" className="flex felx-row mt-3 text-gray-400 hover:text-gray-300 transition-colors">
                                            <LayoutDashboard size={16} className="inline-block mr-2" />
                                            My Projects
                                        </Link>
                                        <Link href="" className="mt-3 flex flex-row items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors">
                                            <span className="text-gray-400 line-through"><BarChart size={16} className="inline-block mr-2" />Analytics</span><span className="text-xs text-yellow-400 border border-yellow-400 bg-yellow-200/30 rounded-full px-2 py-0.5">coming soon</span>
                                        </Link>
                                        <Link href="/dashboard?tab=settings" className="mt-3 text-gray-400 hover:text-gray-300 transition-colors">
                                            <Settings size={16} className="inline-block mr-2" />
                                            Account Settings
                                        </Link>
                                        <hr className="border-white/20 my-2" />
                                        <SignOut />
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