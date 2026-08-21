import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord"
import supabase from "./db"
import jwt from "jsonwebtoken"
import Resend from "next-auth/providers/resend"

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
        Resend({
            // If your environment variable is named differently than default
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.EMAIL_FROM,

            async generateVerificationToken() {
                return crypto.randomUUID()
            },

            normalizeIdentifier(identifier: string): string {
                let [local, domain] = identifier.toLowerCase().trim().split("@")
                domain = domain.split(",")[0]
                if (identifier.split("@").length > 2) {
                    throw new Error("Only one email allowed")
                }
                return `${local}@${domain}`
            },
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