const url = require('url')

const routes = {
    GET: [],
    POST: [],
    PUT: [],
    PATCH: [],
    DELETE: []
}

function addRoute(method, path, middlewares, handler) {
    const paramNames = []
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
    })
    const regex = new RegExp(`^${pattern}$`)

    routes[method].push({ regex, paramNames, middlewares, handler })
}

function get(path, ...fns) {
    addRoute('GET', path, fns.slice(0, -1), fns[fns.length - 1])
}
function post(path, ...fns) {
    addRoute('POST', path, fns.slice(0, -1), fns[fns.length - 1])
}
function put(path, ...fns) {
    addRoute('PUT', path, fns.slice(0, -1), fns[fns.length - 1])
}
function patch(path, ...fns) {
    addRoute('PATCH', path, fns.slice(0, -1), fns[fns.length - 1])
}
function del(path, ...fns) {
    addRoute('DELETE', path, fns.slice(0, -1), fns[fns.length - 1])
}

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(data))
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

async function parseJsonBody(req) {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('application/json')) return {}
    const raw = await readBody(req)
    if (!raw.length) return {}
    try {
        return JSON.parse(raw.toString('utf8'))
    } catch {
        return {}
    }
}

async function handleRequest(req, res) {
    const parsed = url.parse(req.url, true)
    const pathname = parsed.pathname

    res.json = (data, status = 200) => sendJson(res, status, data)
    res.status = (code) => {
        res.statusCode = code
        return res
    }

    req.query = parsed.query

    const methodRoutes = routes[req.method] || []

    for (const route of methodRoutes) {
        const match = pathname.match(route.regex)
        if (!match) continue

        req.params = {}
        route.paramNames.forEach((name, i) => {
            req.params[name] = match[i + 1]
        })

        const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data')
        if (!isMultipart) {
            req.body = await parseJsonBody(req)
        }

        let i = 0
        const chain = [...route.middlewares, route.handler]

        const next = async (err) => {
            if (err) {
                return sendJson(res, 500, { error: err.message })
            }
            const fn = chain[i++]
            if (!fn) return
            try {
                await fn(req, res, next)
            } catch (e) {
                sendJson(res, 500, { error: e.message })
            }
        }

        return next()
    }

    sendJson(res, 404, { error: 'Not found' })
}

module.exports = { get, post, put, patch, delete: del, handleRequest, readBody }