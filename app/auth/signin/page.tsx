"use client"

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import SignInButton from '../../components/auth/googleSignIn'
import GitHub from '../../components/auth/githubSignIn'
import Discord from '../../components/auth/discordSignIn'
import { AlertCircle, Check, Loader } from 'lucide-react'

const page = () => {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain a special character'
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        // Validate password
        const passwordError = validatePassword(password)
        if (passwordError) {
          setError(passwordError)
          setLoading(false)
          return
        }

        // Signup
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const signupData = await signupRes.json()

        if (!signupRes.ok) {
          setError(signupData.error || 'Signup failed')
          setLoading(false)
          return
        }

        setSuccess('Account created! Signing you in...')

        // Auto sign in after signup
        const signinRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (signinRes?.ok) {
          router.push('/dashboard')
        } else {
          setError('Account created but sign in failed. Please try signing in.')
        }
      } else {
        // Login
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          setSuccess('Signed in successfully!')
          router.push('/dashboard')
        } else {
          setError('Invalid email or password')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070909] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 w-fit mb-8">
            <button
              className={`rounded-full px-4 py-2 transition ${mode === 'login' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              onClick={() => {
                setMode('login')
                setError(null)
                setSuccess(null)
              }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`rounded-full px-4 py-2 transition ${mode === 'signup' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
              onClick={() => {
                setMode('signup')
                setError(null)
                setSuccess(null)
              }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-black">{header.title}</h1>
            <p className="text-gray-400">{header.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className=" hidden space-y-6">
            {mode === 'signup' && (
              <div className="space-y-3">
                <label className="text-sm text-gray-300 block" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-3xl border border-white/20 bg-[#0f131a] px-4 py-3 text-white outline-none focus:border-[#1d976c] focus:ring-2 focus:ring-[#1d976c]/30"
                />
              </div>
            )}

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
                required
                className="w-full rounded-3xl border border-white/20 bg-[#0f131a] px-4 py-3 text-white outline-none focus:border-[#1d976c] focus:ring-2 focus:ring-[#1d976c]/30 disabled:opacity-50"
                disabled={loading}
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
                required
                className="w-full rounded-3xl border border-white/20 bg-[#0f131a] px-4 py-3 text-white outline-none focus:border-[#1d976c] focus:ring-2 focus:ring-[#1d976c]/30 disabled:opacity-50"
                disabled={loading}
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-2">
                  Password must be 8+ characters with uppercase, number, and special character
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1d976c] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#16a66e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Processing...' : header.button}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-gray-500">
            <span className="h-px flex-1 bg-white/10" />
            Continue with
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex flex-col gap-4">
            <SignInButton />
            <GitHub/>
            <Discord/>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            By signing in, you agree to our <a href="/legal/terms" className="underline">Terms of Service</a> and <a href="/legal/privacy" className="underline">Privacy Policy</a>.
          </p>
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-[#0b10169c] p-10">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[#8ce6b6]">Why choose LUNIO Builder?</p>
              <h2 className="mt-3 text-2xl font-bold">Visual Drag & Drop Editor Experience.</h2>
              <p className="mt-3 text-gray-400">Sign in once and access your dashboard, interactive editor, and projects immediately. LUNIO Builder keeps your website builder workflow focused and modern.</p>
            </div>

            <div className="grid gap-4">
              {['No Code Editor', 'Instant Previews', 'Drag & Drop Experience', 'Fast Publishing'].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-gray-300">
                  <Check size={18} className="inline-block mr-2 text-[#1d976c]" />
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