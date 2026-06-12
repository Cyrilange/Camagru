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

INSERT INTO users (username, email, password_hash)
VALUES
('alice', 'alice@test.com', 'hash'),
('bob', 'bob@test.com', 'hash'),
('charlie', 'charlie@test.com', 'hash');

INSERT INTO images (user_id, filename)
VALUES
(1, '/uploads/overlays/overlay_1.jpg'),
(1, '/uploads/overlays/overlay_2.jpg'),
(2, '/uploads/overlays/overlay_3.jpg'),
(2, '/uploads/overlays/overlay_4.jpg'),
(3, '/uploads/overlays/overlay_5.jpg');

INSERT INTO likes (user_id, image_id)
VALUES
(2, 1),
(3, 1),
(1, 2),
(3, 2),
(1, 3),
(2, 3),
(1, 4),
(2, 5),
(3, 5);

INSERT INTO comments (user_id, image_id, content)
VALUES
(2, 1, 'This looks amazing!'),
(3, 1, 'Love the style 🔥'),
(1, 2, 'Nice shot!'),
(3, 2, 'Very clean edit'),
(1, 3, 'This is my favorite one'),
(2, 3, 'Great composition'),
(3, 4, 'Simple but effective'),
(1, 5, 'This is hilarious 😂'),
(2, 5, 'Good creativity here!');