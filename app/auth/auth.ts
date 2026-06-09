import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord"
import supabase from "./db"
import { authorizeUser } from "./credentialsProvider"
import jwt from "jsonwebtoken"

const authOptions = {
    adapter: supabase,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
        }),
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID as string,
            clientSecret: process.env.AUTH_GITHUB_SECRET as string,
        }),
        Discord,
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "Enter your email" },
                password: { label: "Password", type: "password", placeholder: "Enter your password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await authorizeUser(
                    credentials.email as string,
                    credentials.password as string
                )

                return user || null
            }
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            const signingSecret = process.env.SUPABASE_JWT_SECRET
            if (signingSecret) {
                const payload = {
                    aud: "authenticated",
                    exp: Math.floor(new Date(session.expires).getTime() / 1000),
                    sub: user.id,
                    email: user.email,
                    role: "authenticated",
                }
                session.supabaseAccessToken = jwt.sign(payload, signingSecret)
            }
            return session
        },
    },
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/auth/signin',
    },
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)