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
`username` VARCHAR(25) NOT NULL,
`email` VARCHAR(50) NOT NULL,
`password_hash`	VARCHAR(100) DEFAULT NULL,
`avatar` VARCHAR(100) DEFAULT NULL,
`date_joined`	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
`num_flagged`	INT(11) UNSIGNED DEFAULT 0,

PRIMARY KEY (id),
UNIQUE (username),
UNIQUE (email)
);

CREATE TABLE `likes` (
`post_id` INT(11) DEFAULT 0,
`user_id` INT(11) DEFAULT 0,
`like` BOOLEAN DEFAULT TRUE,

PRIMARY KEY (post_id, user_id)
);

INSERT INTO `users` (full_name, username, email) values('Justin Chen', 'justinkchen', 'justinkchen@stanford.edu');
INSERT INTO `users` (full_name, username, email) values('CS210 Student', 'cs210student', 'cs210@stanford.edu');

INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ("I'm alive! survived that midterm!", '37.427791', '-122.169675','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('This class in bldg 110 is so boring...anyone wanna chat? #bldg110', '37.428004', '-122.170635','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ("Hey I wanna chat! what's up? #bldg110", '37.428004', '-122.170635','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('The Stanford Memorial church is a must-see on your trip to Stanford.  Absolutely inspiring when you go in', '37.427174', '-122.170377','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('First time using this application...pretty cool!!', '37.426607', '-122.16924','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('JC wuz here #mensbathroom', '37.426535', '-122.169701','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('Go Stanford! #freshman', '37.426531', '-122.170157','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('FML just tripped and fell in front of a group of tourists...', '37.426373', '-122.17057','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('Just saw the Pope inside the Round Room of the Memorial Church!', '37.426565', '-122.170817','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('This path through the main quad is actually really awesome...', '37.426816', '-122.171144','25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ("Almost at cs210 class!! Can't wait!", '37.427008', '-122.171499', '25','2');
INSERT INTO `posts` (message, latitude, longitude, radius, user_id) values ('In cs210, about to present software demo...hope everything works out!', '37.426854', '-122.171853', '25','2');

