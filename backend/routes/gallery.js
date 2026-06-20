const router = require('../router')
const db = require('../database')
const { isAuth, validatePassword } = require('../middlewares/auth')
const { sendCommentNotification } = require('../mailer');


router.get('/api/gallery', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const [countRows] = await db.execute('SELECT COUNT(*) as total FROM images');

        const total = countRows?.[0]?.total || 0;

        const [rows] = await db.execute(`
            SELECT 
                images.id,
                images.filename,
                images.created_at,
                users.username,
                (SELECT COUNT(*) FROM likes WHERE likes.image_id = images.id) AS likes,
                (SELECT COUNT(*) FROM comments WHERE comments.image_id = images.id) AS comments
            FROM images
            JOIN users ON users.id = images.user_id
            ORDER BY images.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({ images: rows, total });
    } catch (err) {
        res.json({ error: err.message }, 500);
    }
});

router.get('/api/gallery/:id/comments', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT comments.content, comments.created_at, users.username
            FROM comments
            JOIN users ON users.id = comments.user_id
            WHERE comments.image_id = ?
            ORDER BY comments.created_at ASC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.json({ error: err.message }, 500);
    }
});

router.get('/api/gallery/me', isAuth, async (req, res) => {
    try {
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.json({ error: "unauthorized" }, 401);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM images WHERE user_id = ?',
            [userId]
        );

        const total = countRows?.[0]?.total || 0;

        const [rows] = await db.execute(`
            SELECT 
                images.id,
                images.filename,
                images.created_at,
                users.username,
                (SELECT COUNT(*) FROM likes WHERE likes.image_id = images.id) AS likes,
                (SELECT COUNT(*) FROM comments WHERE comments.image_id = images.id) AS comments
            FROM images
            JOIN users ON users.id = images.user_id
            WHERE images.user_id = ?
            ORDER BY images.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        return res.json({ images: rows, total });

    } catch (err) {
        return res.json({ error: "server error" }, 500);
    }
});

router.post('/api/gallery/:id/like', isAuth, async (req, res) => {
	const image = req.params.id
	const userId = req.session?.user?.id
	if(!image) {
		return res.json("No images", 404)
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
		res.json({ error : err.message }, 500)
	}
})

router.post('/api/gallery/:id/comment', isAuth, async (req, res) => {
	const image = req.params.id
	const userId = req.session?.user?.id
	if(!image) {
		return res.json("No images", 404)
	}
    const content = req.body?.content;

    if (!content) {
        return res.json("No content", 404);
    }
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
		res.json({ error: err.message }, 500)
	}

})