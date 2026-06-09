import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json()

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Password strength validation
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            )
        }

        if (!/[A-Z]/.test(password)) {
            return NextResponse.json(
                { error: 'Password must contain at least one uppercase letter' },
                { status: 400 }
            )
        }

        if (!/[0-9]/.test(password)) {
            return NextResponse.json(
                { error: 'Password must contain at least one number' },
                { status: 400 }
            )
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return NextResponse.json(
                { error: 'Password must contain at least one special character (!@#$%^&*)' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .schema('next_auth')
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Check user error:', checkError)
            return NextResponse.json(
                { error: `Database error: ${checkError.message}` },
                { status: 500 }
            )
        }

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            )
        }

        // Hash password using built-in crypto (Node.js)
        const salt = crypto.randomBytes(16).toString('hex')
        const hashedPassword = crypto
            .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
            .toString('hex')

        // Create user
        const { data: newUser, error } = await supabase
            .schema('next_auth')
            .from('users')
            .insert([
                {
                    email: email.toLowerCase(),
                    name: name || email.split('@')[0],
                    emailVerified: null,
                },
            ])
            .select()
            .single()

        if (error) {
            console.error('Create user error:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
            })
            return NextResponse.json(
                { error: `Failed to create account: ${error.message}` },
                { status: 500 }
            )
        }

        // Create account entry in next_auth.accounts for credentials provider
        const { error: accountError } = await supabase
            .schema('next_auth')
            .from('accounts')
            .insert([
                {
                    id: newUser.id,
                    type: 'credentials',
                    provider: 'credentials',
                    providerAccountId: email.toLowerCase(),
                    password_hash: `${salt}:${hashedPassword}`,
                },
            ])

        if (accountError) {
            console.error('Create account error:', accountError)
            // Delete the user if account creation fails
            await supabase
                .schema('next_auth')
                .from('users')
                .delete()
                .eq('id', newUser.id)

            return NextResponse.json(
                { error: `Failed to link credentials: ${accountError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 }
        )
    }
}
