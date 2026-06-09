import { User } from "lucide-react"
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
                            <Image src={session.user.image } className="w-10 rounded-full bg-white" alt="User Avatar" width={20} height={20} />
                        </PopoverTrigger>
                        <PopoverContent className="bg-[#0d1117] text-white border border-white/20">
                            <PopoverHeader className="ml-4 gap-2 flex flex-col">
                                <div>
                                    <p className="text-sm font-medium">{session.user.name}</p>
                                    <p className="text-xs text-gray-400 underline">{session.user.email}</p>
                                </div>
                                 <Link href="/dashboard" className="mt-3">
                                    Dashboard
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