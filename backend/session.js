const crypto = require('crypto')

const sessions = new Map()

function parseCookies(req) {
    const header = req.headers.cookie
    const cookies = {}
    if (!header) return cookies
    header.split(';').forEach(pair => {
        const [key, ...rest] = pair.trim().split('=')
        cookies[key] = decodeURIComponent(rest.join('='))
    })
    return cookies
}

function createSession(data) {
    const sessionId = crypto.randomBytes(32).toString('hex')
    sessions.set(sessionId, data)
    return sessionId
}

function getSession(sessionId) {
    return sessions.get(sessionId) || null
}

function destroySession(sessionId) {
    sessions.delete(sessionId)
}

function sessionMiddleware(req, res, next) {
    const cookies = parseCookies(req)
    const sessionId = cookies.session_id

    req.sessionId = sessionId
    req.session = sessionId ? (getSession(sessionId) || {}) : {}

    req.saveSession = (data) => {
        const id = req.sessionId || createSession(data)
        sessions.set(id, data)
        if (!req.sessionId) {
            req.sessionId = id
            res.setHeader('Set-Cookie', `session_id=${id}; HttpOnly; Path=/; SameSite=Strict`)
        }
    }

    req.destroySession = () => {
        if (req.sessionId) destroySession(req.sessionId)
        res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Max-Age=0')
    }

    next()
}

module.exports = { sessionMiddleware }