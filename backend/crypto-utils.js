const crypto = require('crypto')

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex')
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err)
            resolve(`${salt}:${derivedKey.toString('hex')}`)
        })
    })
}

function verifyPassword(password, stored) {
    return new Promise((resolve, reject) => {
        const [salt, hash] = stored.split(':')
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err)
            resolve(derivedKey.toString('hex') === hash)
        })
    })
}

module.exports = { hashPassword, verifyPassword }