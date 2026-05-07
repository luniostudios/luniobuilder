"use client"

import { FormEvent, useMemo, useState } from 'react'
import SignInButton from '../../components/auth/googleSignIn'
import GitHub from '../../components/auth/githubSignIn'
import { signIn } from '../auth'


interface SignInFormData {
  email: string
  password: string
}

const page = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const header = useMemo(() => {
    if (mode === 'signup') {
      return {
        title: 'Create your account',
        subtitle: 'Start building your website and manage projects with a single sign-on experience.',
        button: 'Create account',
      }
    }

    return {
      title: 'Welcome back',
      subtitle: 'Sign in to continue to your dashboard, manage your workspace, and publish your sites.',
      button: 'Sign in',
    }
  }, [mode])

  return (
    <div className="min-h-screen bg-[#070909] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 w-fit mb-8">
            <button
              className={`rounded-full px-4 py-2 ${mode === 'login' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`rounded-full px-4 py-2 ${mode === 'signup' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-black">{header.title}</h1>
            <p className="text-gray-400">{header.subtitle}</p>
          </div>

          <form className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm text-gray-300 block" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-3xl border border-white/20 bg-[#0f131a] px-4 py-3 text-white outline-none focus:border-[#1d976c] focus:ring-2 focus:ring-[#1d976c]/30"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-300 block" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-3xl border border-white/20 bg-[#0f131a] px-4 py-3 text-white outline-none focus:border-[#1d976c] focus:ring-2 focus:ring-[#1d976c]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#1d976c] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#16a66e]"
            >
              {header.button}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-gray-500">
            <span className="h-px flex-1 bg-white/10" />
            Or continue with
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex flex-col gap-4">
            <SignInButton />
            <GitHub/>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            Email authentication is coming soon. For now, use Google sign in to access your account instantly.
          </p>
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-[#0b1016] p-10">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[#8ce6b6]">Why choose LUNIO Builder</p>
              <h2 className="mt-3 text-2xl font-bold">Fast onboarding, polished experience</h2>
              <p className="mt-3 text-gray-400">Sign in once and access your projects, site editor, and dashboard immediately. LUNIO keeps your website builder workflow focused and modern.</p>
            </div>

            <div className="grid gap-4">
              {['No-code editor', 'Instant previews', 'Project management', 'Google single sign-on'].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-gray-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default page