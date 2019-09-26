/* CREATE KEYSPACE essentials WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};
USE essentials; */

CREATE
	TABLE movies ( movie_id UUID,
	title TEXT,
	release_year INT,
	PRIMARY KEY ((movie_id)));
	
insert into movies (movie_id, release_year, title) values (uuid(), 2011, 'Tree of Life');
insert into movies (movie_id, release_year, title) values (uuid(), 2016, 'La La Land');
insert into movies (movie_id, release_year, title) values (uuid(), 2011, 'Birdman');

select * from movies;

ALTER TABLE movies DROP solr_query;

CREATE
	TABLE movies_by_actor( actor TEXT,
	release_year INT,
	movie_id UUID,
	title TEXT,
	genres SET<TEXT>,
	rating FLOAT,
	PRIMARY KEY ((actor), release_year,	movie_id)) 
	WITH CLUSTERING ORDER BY(release_year DESC,	movie_id ASC);
	
insert into movies_by_actor (actor, release_year, movie_id, title, genres, rating) values('Emma Stone', 2016, 4feabf90-1d9b-4291-ac68-50fd04efbc14, 'La La Land', {'musical', 'drama'}, 10);
insert into movies_by_actor (actor, release_year, movie_id, title, genres, rating) values('Brad Pit', 2011, 93671e39-abad-4d7b-bb2e-70177ff09011, 'Tree of Life', {'drama'}, 10);
insert into movies_by_actor (actor, release_year, movie_id, title, genres, rating) values('Emma Stone', 2014, c5b4e452-d35c-4f42-a64f-85551140e628, 'Birdman', {'drama'}, 10);

select * from movies_by_actor where actor='Emma Stone' AND release_year = 2014 and movie_id = 4feabf90-1d9b-4291-ac68-50fd04efbc14;

CREATE CUSTOM INDEX title ON movies_by_actor (title) USING 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'CONTAINS'}; // PREFIX, SPARSE

SELECT * from movies_by_actor where actor='Emma Stone' and title = 'Birdman';

CREATE MATERIALIZED VIEW movies_mv AS 
	SELECT title, release_year, movie_id, genres, actor FROM movies_by_actor
	WHERE title IS NOT NULL AND release_year IS NOT NULL AND movie_id IS NOT NULL AND actor IS NOT NULL
	PRIMARY KEY ((title, release_year), actor, movie_id);
	
CREATE
	TABLE users ( email VARCHAR,
	password VARCHAR,
	name VARCHAR,
	reset_Token VARCHAR,
	reset_Token_Expiration TIMESTAMP,
	cart_items MAP<UUID, frozen <MAP<VARCHAR, decimal>>>,
	PRIMARY KEY (email));
	
CREATE TYPE creator (
	name VARCHAR,
	email VARCHAR	
);

CREATE TABLE post (
	id UUID,
	title VARCHAR,
	image_url VARCHAR,
	content VARCHAR,
	creator frozen <creator>,
	created_at timestamp,
	updated_at timestamp,
	PRIMARY KEY (id)
);

drop table post;

CREATE TYPE post(
	id UUID,
	title VARCHAR,
	image_url VARCHAR,
	content VARCHAR,
	creator frozen <creator>,
	created_at timestamp,
	updated_at timestamp
);

create table IF NOT EXISTS user(
	email varchar,
	password varchar,
	name varchar,
	status varchar,
	id uuid,
	posts set<frozen <post>>,
	primary key(email)
);
drop table user;

CREATE CUSTOM INDEX user_id_index on user(id) using 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'SPARSE'};


CREATE CUSTOM INDEX post_title_index on post(title) using 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'CONTAINS'};
CREATE CUSTOM INDEX post_creator_index on post(creator) using 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'SPARSE'};

drop table post;
select * from post; -- where title = 'Here is a Duck' AND creator = {"name":'Ram', "email":'ram@gmail.com'};	
truncate post;
-- Drop table users;

delete from post where title = 'A Duck!' AND creator = {"name":'Ram', "email":'ram@gmail.com'};	

CREATE CUSTOM INDEX users_reset_token on users(reset_token) using 'org.apache.cassandra.index.sasi.SASIIndex';

Drop table orders;	
CREATE 
	TABLE orders (
		email VARCHAR,
		order_items MAP<UUID, frozen <MAP<VARCHAR, decimal>>>,
		id UUID,
		PRIMARY KEY ((email), id));

CREATE CUSTOM INDEX order_id ON orders (id) USING 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'SPARSE'};
DROP INDEX IF EXISTS order_id;
/* ALTER TABLE users ADD cartItems MAP<UUID, TINYINT>;
ALTER TABLE users rename cartitems to cart_items; */

CREATE
	TABLE products (
	id UUID,
	name VARCHAR,
	type VARCHAR,
	price DECIMAL,
	img_url TEXT,
	description TEXT,
	PRIMARY KEY ((type), name, id))
	WITH CLUSTERING ORDER BY(name ASC);
	
select * from Products where type = 'Book' AND name = 'Ramayana';
select * from Products where img_url = '\images\e2534c31-0990-4645-8607-4aa952b674c6-valmiki-ramayan.jpeg';
	
CREATE CUSTOM INDEX products_price ON products (price) USING 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'SPARSE'};
CREATE CUSTOM INDEX products_id ON products (id) USING 'org.apache.cassandra.index.sasi.SASIIndex' WITH OPTIONS = {'mode' : 'SPARSE'};

DROP TABLE IF EXISTS essentials.products;
DROP INDEX IF EXISTS products_price;

ALTER TABLE products ADD img_url TEXT;
ALTER TABLE products RENAME name to title;

select * from products;
select * from products where id IN (2a074943-0393-4de5-abac-21c2380bc857, 449542ea-2f11-4f28-8f4c-b6b9b59e4c88);
select * from products where type ='Applicance' AND id = 0c54bbd7-ef61-4de5-8461-eead847def1c;
select * from products where type='Book' AND name='Ramayana';

insert into products (id, name, type, price, description) values (uuid(), 'Ramayana', 'Book', 1504, 'Ramayana is the story of Rama, Prince of Ayodhya. Believed to be the seventh incarnation of the Creator and Preserver, Lord Vishnu, he comes in human form to annihilate evil and establish justice and righteousness among people');
update products SET img_url='https://ashisj.page.link/qbvQqa' WHERE type= 'Book' AND name = 'Ramayana' AND id=2a074943-0393-4de5-abac-21c2380bc857;
insert into products (id, title, type, price, description, img_url) values (uuid(), 'Electric Kettle', 'Applicance', 749, 
'Boil water in a matter of minutes for baby food or make a steaming cup of fragrant tea with the 1.5L Flipkart SmartBuy electric kettle. Beautifully crafted and featuring a stainless-steel body, this kettle is perfect for your kitchen or office pantry. ', 
'https://ashisj.page.link/g5761');

--delete from products WHERE type= 'Bagpack' AND title = 'Mi Bagpack' AND price = 1599;
delete from products WHERE id = 5bf9d0c0-b304-4488-8a30-5ce3d49b2c0a;

insert into users (email, name) values ('ram@gmail.com', 'Ram');

select * from users;

-- ALTER TABLE users ALTER cart_items TYPE VARCHAR;

update users set is_verified = true, reset_token=null, is_admin=true, password='$2a$12$kL62ZHTJHHEAgGc9BOpaZupEE9pjIL0Locx6/0k8rxXjLouH84twW' where email = 'ram@gmail.com';

-- truncate users;

ALTER TABLE users ADD is_admin BOOLEAN;
ALTER TABLE users ADD is_verified BOOLEAN;

--truncate table users;

select * from orders;

--truncate orders;

update users SET cart_items = null WHERE email= 'mohitparody@gmail.com';

CREATE TABLE IF NOT EXISTS sessions (
   sid text,
   session text,
   expires timestamp,
   PRIMARY KEY(sid)
);

select * from sessions;

--TRUNCATE TABLE orders;

select * from products;
select * from products where token(type) > token('Hot Wheels');

 
 
delete from user where email = 'test@test.com';


--truncate table sessions;

select * from user;
update user set posts = null where email = 'ram@gmail.com';--'mohitparody@gmail.com';

select * from post;
delete from post where id = 9e46b845-a908-4a85-a3ce-44c9079f064a;
//truncate post;

update post set updated_at = '2019-04-01 19:39:40+0000' where id = f1defb8e-c1c8-4cca-abc4-114f51581c4c;
SELECT * FROM post WHERE id = cb13bd47-497e-45eb-a5b7-6f696f506338;

