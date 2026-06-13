const express = require('express')
const db = require('../database')
const fs = require('fs')
const multer = require('multer');
const sharp = require('sharp')
const path = require('path')
const { isAuth } = require('../middlewares/auth')
const router = express.Router()

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, './uploads/'),
	filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
const upload = multer({ storage })


router.get('/overlays', async (req, res) => {
    try {
        const files = fs.readdirSync('./uploads/overlays')
        res.json({ overlays: files })
    } catch(err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/images', async (req, res) => {
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
	  res.status(500).json({ error: err.message });
	}
  });



router.post('/capture', isAuth, upload.single('image'), async (req, res) => {
    if (!req.file)
        return res.status(404).json({ error: 'file does not exist' })

    const overlay = req.body.overlay
    const userId = req.session.user.id

    try {
        const overlays = fs.readdirSync('./uploads/overlays')
        if (!overlays.includes(overlay))
            return res.status(400).json({ error: 'Invalid overlay' })

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
        res.status(400).json({ error: err.message })
    }
})


router.delete('/:id', isAuth, async (req, res) => {
    const imageId = req.params.id
	const userId = req.session.user.id


	try {
		const [rows] = await db.execute('SELECT * FROM images WHERE id = ?', [imageId])
		const image = rows[0]
	
		if (!image)
			return res.status(404).json({ error: 'Image not found' })
	
		if (image.user_id !== userId)
			return res.status(403).json({ error: 'Not your image' })
	
		fs.unlinkSync(image.filename)
		await db.execute('DELETE FROM images WHERE id = ?', [imageId]);
		res.status(200).json("image deleted")

	} catch(err) {
		res.status(500).send({message : err.message})
	}

})





module.exports = router