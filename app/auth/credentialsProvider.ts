import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Verify password against stored hash
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
        const [salt, hash] = storedHash.split(':')
        const passwordHash = crypto
            .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
            .toString('hex')
        return passwordHash === hash
    } catch {
        return false
    }
}

// Authorize user with email and password
export async function authorizeUser(email: string, password: string) {
    try {
        if (!email || !password) {
            return null
        }

        // Fetch user from database
        const { data: user, error: userError } = await supabase
            .schema('next_auth')
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single()

        if (userError || !user) {
            return null
        }

        // Fetch account with credentials from next_auth.accounts
        const { data: account, error: accountError } = await supabase
            .schema('next_auth')
            .from('accounts')
            .select('*')
            .eq('id', user.id)
            .eq('provider', 'credentials')
            .single()

        if (accountError || !account) {
            return null
        }

        // Check if account has a password
        if (!account.password_hash) {
            return null
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, account.password_hash)

        if (!isPasswordValid) {
            return null
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
        }
    } catch (error) {
        console.error('Error authorizing user:', error)
        return null
    }
}
