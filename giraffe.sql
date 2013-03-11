CREATE TABLE `posts` (
`id`		INTEGER(11) UNSIGNED AUTO_INCREMENT,
`message`	VARCHAR(250),
`image_url`	VARCHAR(100) DEFAULT NULL,
`latitude`          DECIMAL(10,7),
`longitude`	DECIMAL(10,7),
`direction_x`	DOUBLE(10),
`direction_y`	DOUBLE(10),
`direction_z` 	DOUBLE(10),
`num_likes`	INTEGER(10) UNSIGNED,
`created_at`	DATETIME DEFAULT NULL,
`user_id`	INTEGER(11) UNSIGNED,
`num_flagged`	INTEGER(10) UNSIGNED,

PRIMARY KEY (id)
);

CREATE TABLE `users` (
`id`		INTEGER(11) UNSIGNED AUTO_INCREMENT,
`full_name`	VARCHAR(50),
`username`	VARCHAR(25),
`email`          	VARCHAR(50),
`fb_email`	VARCHAR(50) DEFAULT NULL,
`password_hash`	VARCHAR(100),
`salt`		VARCHAR(50),
`date_joined`	DATETIME DEFAULT NULL,
`num_flagged`	INTEGER(10) UNSIGNED,

PRIMARY KEY (id)
);