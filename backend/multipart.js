const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const busboy = require('busboy')

function uploadSingle(fieldName, options = {}) {
    const maxSize = options.limits?.fileSize || 5 * 1024 * 1024
    const allowedMimeTypes = options.allowedMimeTypes || []

    return function upload(req, res, next) {
        const contentType = req.headers['content-type'] || ''
        if (!contentType.includes('multipart/form-data')) {
            return next()
        }

        req.body = req.body || {}

        const bb = busboy({
            headers: req.headers,
            limits: {
                fileSize: maxSize
            }
        })

        const fields = {}
        let fileBuffer = null
        let fileInfo = null

        bb.on('field', (name, value) => {
            fields[name] = value
        })

        bb.on('file', (name, file, info) => {
            if (name !== fieldName) {
                file.resume()
                return
            }

            fileInfo = info
            const chunks = []

            file.on('data', chunk => chunks.push(chunk))
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks)
            })
        })

        bb.on('finish', () => {
            req.body = { ...req.body, ...fields }

            if (fileInfo && fileBuffer) {
                const mime = fileInfo.mimeType || ''
                const filename = fileInfo.filename || ''

                if (allowedMimeTypes.length && !allowedMimeTypes.includes(mime)) {
                    return res.json({ error: 'Invalid file type' }, 415)
                }

                const ext = path.extname(filename) || ''
                const tempPath = path.join(
                    __dirname,
                    'uploads',
                    `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`
                )

                fs.writeFileSync(tempPath, fileBuffer)
                req.file = {
                    fieldname: fieldName,
                    originalname: filename,
                    filename: path.basename(tempPath),
                    path: tempPath,
                    mimetype: mime || 'application/octet-stream',
                    size: fileBuffer.length
                }
            }

            return next()
        })

        bb.on('error', (err) => {
            if (err && err.message.includes('file size')) {
                return res.json({ error: 'File too large' }, 413)
            }
            return res.json({ error: err.message }, 400)
        })

        req.pipe(bb)
    }
}

module.exports = { uploadSingle }
