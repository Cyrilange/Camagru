const express = require('express')
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