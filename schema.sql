CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    verify_token VARCHAR(64) DEFAULT NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    reset_token VARCHAR(64) DEFAULT NULL,
    notify_comments TINYINT(1) NOT NULL DEFAULT 1
);

ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES images(id),
    UNIQUE KEY unique_like (user_id, image_id)
);
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES images(id)
);

INSERT INTO users (username, email, password_hash, is_verified) VALUES
('alice',   'alice@test.com',   'hash', 1),
('bob',     'bob@test.com',     'hash', 1),
('charlie', 'charlie@test.com', 'hash', 1);

INSERT INTO images (user_id, filename) VALUES
(1, '/uploads/test1.jpg'),
(1, '/uploads/test2.jpg'),
(2, '/uploads/test3.jpg'),
(2, '/uploads/test4.jpg'),
(3, '/uploads/test5.jpg'),
(1, '/uploads/test6.jpg'),
(2, '/uploads/test7.jpg'),
(3, '/uploads/test8.jpg'),
(1, '/uploads/test9.jpg'),
(2, '/uploads/test10.jpg'),
(3, '/uploads/test11.jpg'),
(1, '/uploads/test12.jpg'),
(2, '/uploads/test13.jpg'),
(3, '/uploads/test14.jpg'),
(1, '/uploads/test15.jpg'),
(2, '/uploads/test16.jpg'),
(3, '/uploads/test17.jpg'),
(1, '/uploads/test18.jpg'),
(2, '/uploads/test19.jpg'),
(3, '/uploads/test20.jpg');

INSERT INTO likes (user_id, image_id) VALUES
(2, 1), (3, 1), (1, 2), (3, 2),
(1, 3), (2, 3), (1, 4), (2, 5), (3, 5);

INSERT INTO comments (user_id, image_id, content) VALUES
(2, 1, 'This looks amazing!'),
(3, 1, 'Love the style 🔥'),
(1, 2, 'Nice shot!'),
(3, 2, 'Very clean edit'),
(1, 3, 'This is my favorite one'),
(2, 3, 'Great composition'),
(3, 4, 'Simple but effective'),
(1, 5, 'This is hilarious 😂'),
(2, 5, 'Good creativity here!');