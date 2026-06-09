const express = require('express')
const db = require('../database')
const { isAuth, validatePassword } = require('../middlewares/auth')
const { sendCommentNotification } = require('../mailer');
const router = express.Router()

router.get('/', async (req, res) => {
	try{
		const page = req.query.page || 1
		const limit = req.query.limit || 5
		const offset = (page - 1) * limit

		const [rows] = await db.execute(
			'SELECT * FROM images ORDER BY created_at DESC LIMIT ? OFFSET ?',
			[limit, offset]
		)
		res.json({image: rows, page});
} catch(err) {
	res.status(500).json({error: err.message})
}
})

router.post('/:id/like',isAuth, async (req, res) => {
	const image = req.params.id
	const userId = req.session.user.id
	if(!image) {
		res.status(404).json("No images")
	}
	try {
		const [rows] = await db.execute(
			'SELECT * FROM likes WHERE user_id = ? AND image_id = ?',
			[userId, image]
		)
		const like = rows[0]
		if (rows[0]) {
			await db.execute(
				'DELETE FROM likes WHERE user_id = ? AND image_id = ?',
				[userId, image]
			)
			res.json({ success: true, message: 'like deleted' })
		} else {
			await db.execute(
				'INSERT INTO likes (user_id, image_id) VALUES (?, ?)',
				[userId, image]
			)
			res.json({ success: true, message: 'like added' })	
		}
	} catch(err) {
		res.status(500).json({error : err.message})
	}
})

router.post('/:id/comment', isAuth, async (req, res) => {
	const image = req.params.id
	const userId = req.session.user.id
	if(!image) {
		res.status(404).json("No images")
	}
	const {content} = req.body
	if(!content) {return res.status(404).json("No content")}
	try {
		await db.execute(
			'INSERT INTO comments (user_id, image_id, content) VALUES (?, ?, ?)',
			[userId, image, content]
		)
		const [rows] = await db.execute(
            'SELECT user_id FROM images WHERE id = ?',
            [image]
        );
		const ownerId = rows[0]?.user_id;
		if (ownerId && ownerId !== userId) {
			const [userRows] = await db.execute(
                'SELECT email, notify_comments FROM users WHERE id = ?',
                [ownerId]
            );
            const owner = userRows[0];
            if (owner?.notify_comments) {
                await sendCommentNotification(owner.email, image, content);
            }
		}
		res.json({ success: true, message: 'comment added' })

	} catch(err) {
		res.status(500).json({error: err.message})
	}

})

module.exports = router