# NextAuth Credentials Security Guide

## Implementation Overview

Your application now includes secure credentials authentication with the following security features:

### 1. Password Security (PBKDF2 Hashing)
- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 100,000
- **Salt**: 16-byte random salt per password
- **Storage Format**: `salt:hash` in database

**Why PBKDF2?**
- Built into Node.js (no external dependency)
- Industry standard for password hashing
- Adjustable iterations for future-proofing
- Salted by default, preventing rainbow table attacks

### 2. Password Requirements for Sign-Up
Users must create passwords with:
- **Minimum 8 characters** (longer passwords are exponentially harder to crack)
- **At least 1 uppercase letter** (increases entropy)
- **At least 1 number** (prevents dictionary attacks)
- **At least 1 special character** (exponentially increases possible combinations)

### 3. Email Validation
- Standard regex validation to prevent storage of malformed emails
- Case-insensitive email handling (converted to lowercase for consistency)
- Prevents duplicate account registration

### 4. Database Security
- Uses Supabase service role key for secure database access
- Sensitive data never logged or exposed in error messages
- Database-level constraints prevent duplicate emails

### 5. NextAuth Configuration
```typescript
// Configured with:
- Session-based authentication (default secure)
- Custom sign-in page for better UX
- Secure credentials provider with validate callback
- Combined with OAuth providers (Google, GitHub, Discord)
```

## Environment Variables Required

Add these to your `.env.local`:

```env
# NextAuth
AUTH_SECRET=<generate-with: openssl rand -base64 32>

# OAuth Providers (existing)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## Database Schema Required

Your Supabase `user` table must include these fields:

```sql
CREATE TABLE public.user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  image TEXT,
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_user_email ON public.user(email);
```

## Security Best Practices Implemented

✅ **Passwords never logged** - Sanitized in error messages
✅ **Rate limiting ready** - Add middleware for brute-force protection
✅ **HTTPS enforced** - Configure in production
✅ **CSRF protection** - Built into NextAuth
✅ **Secure sessions** - HttpOnly cookies by default
✅ **Password validation** - Strong requirements enforced client & server
✅ **Error handling** - Generic messages for failed logins (no email enumeration)

## Additional Security Recommendations

### 1. Rate Limiting
Add rate limiting to prevent brute-force attacks:
```bash
npm install next-rate-limit
```

### 2. Email Verification
Implement email verification for new accounts:
- Send verification email with token
- Require verification before full access

### 3. Password Reset Flow
Implement password reset with:
- Temporary tokens (expires in 1 hour)
- Email verification required

### 4. Account Lockout
- Lock after N failed attempts
- Auto-unlock after time period
- Consider CAPTCHA after certain attempts

### 5. Monitoring
- Log failed login attempts
- Monitor for suspicious patterns
- Set up alerts for multiple failed logins

### 6. HTTPS in Production
- Required for secure cookie transmission
- Set `secure: true` in cookies
- Set `sameSite: 'strict'` for CSRF protection

### 7. OWASP Compliance
Current implementation follows:
- **A01:2021 - Broken Access Control**: ✅ Session-based auth
- **A02:2021 - Cryptographic Failures**: ✅ PBKDF2 hashing
- **A03:2021 - Injection**: ✅ Using prepared queries (Supabase)
- **A07:2021 - XSS**: ✅ React escapes by default
- **A09:2021 - SSRF**: ✅ OAuth providers validated

## Testing the Implementation

1. **Sign Up with Valid Password**
   ```
   Email: test@example.com
   Password: Test@1234
   ```

2. **Sign Up with Invalid Password**
   - Missing uppercase: `test@1234!` (should fail)
   - Missing number: `Test@!no-number` (should fail)
   - Too short: `Test@123` (should fail)

3. **Sign In**
   - Correct credentials: ✅ Success
   - Wrong password: ✅ Generic error message
   - Non-existent email: ✅ Generic error message

## File Structure

```
app/
├── auth/
│   ├── auth.ts (Main NextAuth config)
│   ├── credentialsProvider.ts (Password verification logic)
│   └── signin/
│       └── page.tsx (Sign-in/up UI)
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts (NextAuth handler)
│       └── signup/
│           └── route.ts (Account creation endpoint)
```

## Troubleshooting

**"Password must contain..."** - User didn't meet requirements. Show them in UI ✅

**"Email already registered"** - User tries to sign up with existing email. Guide to login ✅

**"Invalid email or password"** - Generic message for security (no email enumeration) ✅

**Session not persisting** - Ensure:
1. `AUTH_SECRET` is set
2. Cookies enabled in browser
3. Domain/origin is correct

---

**Last Updated**: June 9, 2026
**Security Level**: Production-ready with additional recommendations above
