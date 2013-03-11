CREATE TABLE `posts` (
`id`		INT(11) UNSIGNED AUTO_INCREMENT,
`message`	VARCHAR(250) DEFAULT NULL,
`image_url`	VARCHAR(100) DEFAULT NULL,
`latitude` DECIMAL(10,7) DEFAULT 0,
`longitude`	DECIMAL(10,7) DEFAULT 0,
`radius`	DOUBLE(12,7) DEFAULT 0,
`direction_x`	DOUBLE(16,7) DEFAULT 0,
`direction_y`	DOUBLE(16,7) DEFAULT 0,
`direction_z`	DOUBLE(16,7) DEFAULT 0,
`num_likes`	INT(11) UNSIGNED DEFAULT 0,
`date_created`	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
`user_id`	INT(11) UNSIGNED DEFAULT 0,
`num_flagged`	INT(10) UNSIGNED DEFAULT 0,

PRIMARY KEY (id)
);

CREATE TABLE `users` (
`id` INT(11) UNSIGNED AUTO_INCREMENT,
`full_name` VARCHAR(50) DEFAULT NULL,
`username` VARCHAR(25) DEFAULT NULL,
`email` VARCHAR(50) DEFAULT NULL,
`fb_email`	VARCHAR(50) DEFAULT NULL,
`password_hash`	VARCHAR(100) DEFAULT NULL,
`salt`		VARCHAR(50) DEFAULT NULL,
`date_joined`	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
`num_flagged`	INT(11) UNSIGNED DEFAULT 0,

PRIMARY KEY (id)
);

INSERT INTO `users` (full_name, username, email, date_joined) values('Justin Chen', 'justinkchen', 'justinkchen@stanford.edu', '2013-03-10 13:00:00');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('FML missed the midterm today', '37.1253452', '127.5343216', '10.523','1');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('This bathroom stall is awesome', '37.1253452', '127.5343216','50.25','1');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('So lonely...', '37.1253452', '127.5343216','100.0','1');

