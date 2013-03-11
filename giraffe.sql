CREATE TABLE `posts` (
`id`		INT(11) UNSIGNED AUTO_INCREMENT,
`message`	VARCHAR(250),
`image_url`	VARCHAR(100) DEFAULT NULL,
`latitude` DECIMAL(10,7),
`longitude`	DECIMAL(10,7),
`direction_x`	DOUBLE(16,7),
`direction_y`	DOUBLE(16,7),
`direction_z`	DOUBLE(16,7),
`num_likes`	INT(11) UNSIGNED DEFAULT 0,
`date_created`	DATETIME DEFAULT NULL,
`user_id`	INT(11) UNSIGNED,
`num_flagged`	INT(10) UNSIGNED DEFAULT 0,

PRIMARY KEY (id)
);

CREATE TABLE `users` (
`id` INT(11) UNSIGNED AUTO_INCREMENT,
`full_name` VARCHAR(50),
`username` VARCHAR(25),
`email` VARCHAR(50),
`fb_email`	VARCHAR(50) DEFAULT NULL,
`password_hash`	VARCHAR(100),
`salt`		VARCHAR(50),
`date_joined`	DATETIME DEFAULT NULL,
`num_flagged`	INT(11) UNSIGNED DEFAULT 0,

PRIMARY KEY (id)
);

INSERT INTO `users` (full_name, username, email, date_joined) values('Justin Chen', 'justinkchen', 'justinkchen@stanford.edu', '2013-03-10 13:00:00');
INSERT INTO `posts` (message, latitude, longitude, date_created, user_id) values ('FML missed the midterm today', '37.1253452', '127.5343216','2013-03-10 13:00:00', '1');
INSERT INTO `posts` (message, latitude, longitude, date_created, user_id) values ('This bathroom stall is awesome', '37.1253452', '127.5343216','2013-03-10 13:00:00', '1');
INSERT INTO `posts` (message, latitude, longitude, date_created, user_id) values ('So lonely...', '37.1253452', '127.5343216','2013-03-10 13:00:00', '1');