const nodemailer = require('nodemailer')


const transporter = nodemailer.createTransport({
    host: process.env.ET_NAME,
    port: 587,
    secure: false,
    auth: {
        user: process.env.ET_SERNAME,
        pass: process.env.ET_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
})

async function sendVerification(email, token, appUrl) {
    const link = `${appUrl}/api/auth/verify?token=${token}`
    
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


async function sendCommentNotification(email, imageId, content) {
    await transporter.sendMail({
        from: process.env.ET_SERNAME,
        to: email,
        subject: 'New comment on your image',
        html: `
            <p>Your image received a new comment:</p>
            <p><b>${content}</b></p>
            <p>Image ID: ${imageId}</p>
        `
    })
}

module.exports = { sendVerification, sendResetPassword , sendCommentNotification}