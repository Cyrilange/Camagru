const express = require('express')
const db = require('../database')
const fs = require('fs')
const { isAuth } = require('../middlewares/auth')
const router = express.Router()

// GET /overlays — liste les overlays disponibles
// POST /capture — reçoit l'image, superpose, sauvegarde
// DELETE /:id — supprime une image


router.get('/overlays', async (req, res) => {
    try {
        const files = fs.readdirSync('./uploads/overlays')
        res.json({ overlays: files })
    } catch(err) {
        res.status(500).json({ error: err.message })
    }
})










module.exports = router