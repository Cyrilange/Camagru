const router = require('../router')
const db = require('../database')
const crypto = require('crypto')
const { hashPassword, verifyPassword } = require('../crypto-utils')
const { sendVerification, sendResetPassword } = require('../mailer')
const { validatePassword, isAuth } = require('../middlewares/auth')

router.post('/api/auth/register', validatePassword, async (req, res) => {
    const { username, email, password } = req.body

    if (!username || !email || !password)
        return res.json({ error: 'login, email and password are required' }, 400)

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username))
        return res.json({ error: 'Username must be 3-20 chars, letters, numbers and _ only' }, 400)

    try {
        const token = crypto.randomBytes(32).toString('hex')
        const password_hash = await hashPassword(password)

        await db.execute(
            'INSERT INTO users (username, email, password_hash, verify_token) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, token]
        )

        const host = req.headers['x-forwarded-host'] || req.headers.host
        const proto = req.headers['x-forwarded-proto'] || 'http'
        const appUrl = `${proto}://${host}`
        await sendVerification(email, token, appUrl)

        res.json({ success: true, message: 'Account created, check your email' })
    } catch (err) {
        if (err.message.includes('Duplicate'))
            return res.json({ error: 'username or email already taken' }, 409)
        res.json({ error: err.message }, 500)
    }
})

router.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password)
        return res.json({ error: 'email and password are required' }, 400)

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
        const user = rows[0]

        if (!user || !user.password_hash)
            return res.json({ error: 'Invalid credentials' }, 401)

        const valid = await verifyPassword(password, user.password_hash)
        if (!valid)
            return res.json({ error: 'Invalid credentials' }, 401)
        if (!user.is_verified)
            return res.json({ error: 'Please verify your email first' }, 403)

        const sessionUser = { id: user.id, username: user.username, email: user.email }
        req.saveSession({ user: sessionUser })

        res.json({ success: true, user: sessionUser })
    } catch (err) {
        res.json({ error: err.message }, 500)
    }
})

router.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body
    if (!email)
        return res.json({ error: 'email is required' }, 400)
    try {
        const token = crypto.randomBytes(32).toString('hex')
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
        const user = rows[0]
        if (!user)
            return res.json({ success: true, message: 'If this email exists, a reset link was sent' })

        await db.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
            [token, user.id]
        )
        await sendResetPassword(email, token)
        res.json({ success: true, message: 'If this email exists, a reset link was sent' })
    } catch (err) {
        res.json({ error: err.message }, 500)
    }
})

router.post('/api/auth/logout', isAuth, (req, res) => {
    req.destroySession()
    res.json({ success: true, message: 'Logged out' })
})

router.get('/api/auth/me', async (req, res) => {
    if (!req.session?.user)
        return res.json({ error: 'Not authenticated' }, 401)

    try {
        const [rows] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id])
        const user = rows[0]
        if (!user)
            return res.json({ error: 'User not found' }, 404)
        res.json(user)
    } catch (err) {
        res.json({ error: err.message }, 500)
    }
})

router.get('/api/auth/verify', async (req, res) => {
    try {
        const token = req.query?.token
        const [rows] = await db.execute('SELECT * FROM users WHERE verify_token = ?', [token])
        const user = rows[0]
        if (!user)
            return res.json({ error: 'Invalid token' }, 404)

        await db.execute('UPDATE users SET is_verified = 1, verify_token = NULL WHERE id = ?', [user.id])

        res.writeHead(302, { Location: '/login.html' })
        res.end()
    } catch (err) {
        res.json({ error: err.message }, 500)
    }
})

router.post('/api/auth/reset-password', validatePassword, async (req, res) => {
    const { token, password } = req.body

    if (!token || !password)
        return res.json({ error: 'missing token or password' }, 400)

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE reset_token = ?', [token])
        const user = rows[0]

        if (!user)
            return res.json({ error: 'invalid token' }, 400)

        if (new Date(user.reset_token_expires) < new Date())
            return res.json({ error: 'Token expired, please request a new one' }, 400)

        const password_hash = await hashPassword(password)

        await db.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [password_hash, user.id]
        )

        res.json({ success: true, message: 'Password updated' })
    } catch (err) {
        res.json({ error: err.message }, 500)
    }
})