function isAuth(req, res, next) {
    if (!req.session?.user)
        return res.json({ error: 'Not authenticated' }, 401)
    next()
}

function validatePassword(req, res, next) {
    const { password } = req.body
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,30}$/
    if (!passwordRegex.test(password))
        return res.json({ error: 'Password must have 8+ chars, 1 uppercase, 1 number, 1 special character' }, 400)
    next()
}

module.exports = { isAuth, validatePassword }