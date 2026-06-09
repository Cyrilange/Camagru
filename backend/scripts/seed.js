const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

   
    await db.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    await db.execute(`TRUNCATE TABLE likes`);
    await db.execute(`TRUNCATE TABLE comments`);
    await db.execute(`TRUNCATE TABLE images`);
    await db.execute(`TRUNCATE TABLE users`);
    await db.execute(`SET FOREIGN_KEY_CHECKS = 1`);

    const hash = await bcrypt.hash('password123', 10);


    const usernames = ['alice', 'bob', 'charlie', 'david', 'emma'];
    const userIds = [];

    for (const username of usernames) {
        const [res] = await db.execute(
            `INSERT INTO users (username, email, password_hash, is_verified)
             VALUES (?, ?, ?, 1)`,
            [
                username,
                `${username}@mail.com`,
                hash
            ]
        );

        userIds.push(res.insertId);
    }

   
    const imageRows = [];

    for (const userId of userIds) {
        for (let i = 1; i <= 4; i++) {
            const filename = `fake_${userId}_${i}.jpg`;

            const [res] = await db.execute(
                `INSERT INTO images (user_id, filename)
                 VALUES (?, ?)`,
                [userId, filename]
            );

            imageRows.push({
                id: res.insertId,
                userId
            });
        }
    }

 
    const commentsPool = [
        "Amazing shot!",
        "Looks great 🔥",
        "I love this!",
        "Nice filter",
        "Really good!",
        "This is awesome",
        "Well done 👍",
        "Fantastic!"
    ];

  
    for (const img of imageRows) {

      
        const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
        const nbLikes = Math.floor(Math.random() * 4) + 1;

        for (let i = 0; i < nbLikes; i++) {
            try {
                await db.execute(
                    `INSERT INTO likes (user_id, image_id)
                     VALUES (?, ?)`,
                    [shuffledUsers[i], img.id]
                );
            } catch {}
        }

        const nbComments = Math.floor(Math.random() * 3);

        for (let i = 0; i < nbComments; i++) {
            const userId = userIds[Math.floor(Math.random() * userIds.length)];
            const content = commentsPool[Math.floor(Math.random() * commentsPool.length)];

            await db.execute(
                `INSERT INTO comments (user_id, image_id, content)
                 VALUES (?, ?)`,
                [userId, img.id]
            );
        }
    }

    console.log("Seed completed: users + images + likes + comments");
    await db.end();
}

seed().catch(console.error);