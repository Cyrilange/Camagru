const nodemailer = require('nodemailer')


const transporter = nodemailer.createTransport({
    host: process.env.ET_NAME,
    port: process.env.ET_PORT,
    auth: {
        user: process.env.ET_SERNAME,
        pass: process.env.ET_PASSWORD
    }
})

async function sendVerification(email, token) {
    const link = `https://localhost:8443/api/auth/verify?token=${token}`
    
    await transporter.sendMail({
        from: process.env.ET_SERNAME,
        to: email,
        subject: 'Confirm your account please',
        html: `<p>Click here to verify: <a href="${link}">${link}</a></p>`
    })
}

async function sendResetPassword(email, token) {
	const link = `https://localhost:8443/api/auth/forgot-password?token=${token}`
	await transporter.sendMail({
        from: process.env.ET_SERNAME,
        to: email,
        subject: 'Confirm your account please',
        html: `<p>Click here to verify: <a href="${link}">${link}</a></p>`
    })
}

module.exports = { sendVerification, sendResetPassword }