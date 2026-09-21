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
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
                            <Avatar size="lg" className="cursor-pointer bg-white">
                                <AvatarImage src={session.user.image} />
                                <AvatarFallback>{session?.user.name?.charAt(0)}</AvatarFallback>
                                <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                            </Avatar>
                        </PopoverTrigger>
                        <PopoverContent className="bg-[#0d1117] w-full mt-2 text-white border border-white/20">
                            <PopoverHeader className="ml-5 mr-5 gap-2 flex flex-col">
                                <div className="flex flex-col">
                                    <p className="text-white text-sm">{session?.user.name}</p>
                                    <p className="text-xs text-gray-400 underline">{session?.user.email}</p>
                                </div>
                                <Link href="/dashboard?tab=projects" className="flex felx-row mt-3">
                                    <LayoutDashboard size={16} className="inline-block mr-2" />
                                    Dashboard
                                </Link>
                                <Link href="/dashboard?tab=settings" className="mt-3">
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