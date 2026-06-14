const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../database')
const router = express.Router()

const crypto = require('crypto')
const { sendVerification, sendResetPassword } = require('../mailer')
const { validatePassword, isAuth } = require('../middlewares/auth')


router.post('/register', validatePassword, async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ error: 'login, email and password are required' })

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username))
    return res.status(400).json({ error: 'Username must be 3-20 chars, letters, numbers and _ only' })

  try {
    const token = crypto.randomBytes(32).toString('hex')
    const salt = await bcrypt.genSalt(12)
    const password_hash = await bcrypt.hash(password, salt)

    await db.execute(
      'INSERT INTO users (username, email, password_hash, verify_token) VALUES (?, ?, ?, ?)',
      [username, email, password_hash, token]
    )

    const appUrl = `${req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`
    await sendVerification(email, token, appUrl)

    res.json({ success: true, message: 'Account created, check your email' })
  } catch (err) {
    if (err.message.includes('UNIQUE'))
      return res.status(409).json({ error: 'username or email already taken' })
    res.status(500).json({ error: err.message })
  }
})
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' })

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]

    if (!user || !user.password_hash)
      return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })
    if (!user.is_verified)
      return res.status(403).json({ error: 'Please verify your email first' })
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    }
  
    res.json({ success: true, user: req.session.user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: 'email is required' })
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]
    if (!user)
      return res.json({ success: true, message: 'If this email exists, a reset link was sent' })
    await db.execute(
    'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',[token, user.id])
    await sendResetPassword(email, token);
    res.json({ success: true, message: 'If this email exists, a reset link was sent' })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/logout', isAuth, (req, res) => {
  req.session.destroy()
  res.json({ success: true, message: 'Logged out' })
})

router.get('/me', async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: 'Not authenticated' })

  try {
    const [rows] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id])
    const user = rows[0]
    if (!user)
      return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
})


router.get('/verify', async (req, res) => {
  try {
    const token = req.query.token
    const [rows] = await db.execute('SELECT * FROM users WHERE verify_token = ?', [token])
    const user = rows[0]
    if (!user)
        return res.status(404).json({ error: 'Invalid token' })
    
    await db.execute('UPDATE users SET is_verified = 1, verify_token = NULL WHERE id = ?', [user.id])
    res.redirect('/login.html')
    res.json({ success: true, message: 'Account verified' })
  } catch(err) {
    res.status(500).json({error: err.message})
  }
})

router.post('/reset-password', validatePassword, async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password)
    return res.status(400).json({ error: 'missing token or password' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE reset_token = ?',
      [token]
    );

    const user = rows[0];

    if (!user)
      return res.status(400).json({ error: 'invalid token' })

    if (new Date(user.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Token expired, please request a new one' })

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    res.json({ success: true, message: 'Password updated' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router