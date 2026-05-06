import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import supabase from "./db"

const authOptions = {
    adapter: supabase,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "Enter your email" },
                password: { label: "Password", type: "password", placeholder: "Enter your password" }
            }
        })
    ],
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)