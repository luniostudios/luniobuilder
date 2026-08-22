import { LayoutDashboard, Settings, User } from "lucide-react"
import { auth } from "../../auth/auth"
import { SignOut } from "./signOut"
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import Image from "next/image"

export default async function UserAvatar() {
    const session = await auth()

    if (!session?.user?.image) return null

    return (
        <div>
            {!session ? (
                <User size={24} className="text-white" />
            ) : (
                <>
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex flex-row items-center cursor-pointer border border-white/20 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors">
                                <Image src={session.user.image} className="w-10 rounded-full bg-white" alt="User Avatar" width={20} height={20} />
                                <div className="flex flex-col ml-2">
                                    <p className="text-white text-sm">{session.user.name}</p>
                                    <p className="text-xs text-gray-400 underline">{session.user.email}</p>
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="bg-[#0d1117] w-full mt-2 text-white border border-white/20">
                            <PopoverHeader className="ml-5 mr-5 gap-2 flex flex-col">
                                <div className="flex flex-col">
                                    <p className="text-white text-sm">{session.user.name}</p>
                                    <p className="text-xs text-gray-400 underline">{session.user.email}</p>
                                </div>
                                <Link href="/dashboard" className="flex felx-row mt-3">
                                    <LayoutDashboard size={16} className="inline-block mr-2" />
                                    Dashboard
                                </Link>
                                <Link href="/settings" className="mt-3">
                                    <Settings size={16} className="inline-block mr-2" />
                                    Settings
                                </Link>
                                <SignOut />
                            </PopoverHeader>
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </div>
    )
}