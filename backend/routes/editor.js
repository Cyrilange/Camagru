const router = require('../router')
const db = require('../database')
const fs = require('fs')
const sharp = require('sharp')
const path = require('path')
const { isAuth } = require('../middlewares/auth')
const { uploadSingle } = require('../multipart')

const upload = uploadSingle('image', {
    limits: { fileSize: 5 * 1024 * 1024 },
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
})

router.get('/api/editor/overlays', async (req, res) => {
    try {
        const files = fs.readdirSync('./uploads/overlays')
        res.json({ overlays: files })
    } catch(err) {
        res.json({ error: err.message }, 500)
    }
})

router.get('/api/editor/images', async (req, res) => {
	try {
	  const [rows] = await db.execute(`
		SELECT 
		  images.id,
		  images.filename,
		  images.created_at,
		  users.username,
  
		  (SELECT COUNT(*) 
		   FROM likes 
		   WHERE likes.image_id = images.id) AS likes,
  
		  (SELECT COUNT(*) 
		   FROM comments 
		   WHERE comments.image_id = images.id) AS comments
  
		FROM images
		JOIN users ON users.id = images.user_id
		ORDER BY images.created_at DESC
	  `);
  
	  res.json(rows);
	} catch (err) {
	  res.json({ error: err.message }, 500);
	}
});

router.post('/api/editor/capture', isAuth, upload, async (req, res) => {
    if (!req.file)
        return res.json({ error: 'file does not exist' }, 404)

    const overlay = req.body?.overlay
    const userId = req.session?.user?.id

    if (!overlay)
        return res.json({ error: 'overlay is required' }, 400)

    try {
        const overlays = fs.readdirSync('./uploads/overlays')
        if (!overlays.includes(overlay))
            return res.json({ error: 'Invalid overlay' }, 400)

        const outputPath = `./uploads/${Date.now()}_result.png`

        const baseImage = sharp(req.file.path)
        const metadata = await baseImage.metadata()

        const overlayResized = await sharp(`./uploads/overlays/${overlay}`)
            .resize(metadata.width, metadata.height, { fit: 'fill' })
            .toBuffer()

        await baseImage
            .composite([{ input: overlayResized, gravity: 'center' }])
            .toFile(outputPath)

        fs.unlinkSync(req.file.path)

        await db.execute(
            'INSERT INTO images (user_id, filename) VALUES (?, ?)',
            [userId, outputPath]
        )

        res.json({ success: true, filename: outputPath })

    } catch (err) {
        res.json({ error: err.message }, 400)
    }
})

router.delete('/api/editor/:id', isAuth, async (req, res) => {
    const imageId = req.params?.id
	const userId = req.session?.user?.id

	try {
		const [rows] = await db.execute('SELECT * FROM images WHERE id = ?', [imageId])
		const image = rows[0]
	
		if (!image)
			return res.json({ error: 'Image not found' }, 404)
	
		if (image.user_id !== userId)
			return res.json({ error: 'Not your image' }, 403)
	
		fs.unlinkSync(image.filename)
		await db.execute('DELETE FROM images WHERE id = ?', [imageId]);
		res.json("image deleted", 200)

	} catch(err) {
		res.json({ message : err.message }, 500)
	}
})