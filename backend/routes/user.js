const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../database')
const { isAuth, validatePassword } = require('../middlewares/auth')
const router = express.Router()


router.put('/update' , isAuth, validatePassword, async(req, res) => {
	const {username, password, email} = req.body
	try {
		const salt = await bcrypt.genSalt(12)
		const password_hash = await bcrypt.hash(password, salt)
		await db.execute(
			'UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?',
			[username, email, password_hash, req.session.user.id]
		)
		res.json({ success: true, message: 'modified' })
	} catch(err) {
		res.status(500).json({ error: err.message })
	}
})

router.get('/load', isAuth, async (req, res) => {
	const userId = req.session.user.id;
	const [rows] = await db.execute(
		'SELECT username, email, notify_comments FROM users WHERE id = ?',
		[userId]
	);
	res.json(rows[0]);
});

router.patch('/me', isAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { username, email, password, notify_comments } = req.body;

    try {
        if (username) {
            await db.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
            req.session.user.username = username;
        }
        if (email) {
            await db.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
        }
        if (password) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,30}$/;
            if (!passwordRegex.test(password))
                return res.status(400).json({ error: 'Password must have 8+ chars, 1 uppercase, 1 number, 1 special character' });
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);
            await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
        }
        if (notify_comments !== undefined) {
            await db.execute('UPDATE users SET notify_comments = ? WHERE id = ?', [notify_comments ? 1 : 0, userId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router