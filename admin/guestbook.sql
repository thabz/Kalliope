CREATE TABLE guestbook (
  id int(10) unsigned DEFAULT '0' NOT NULL auto_increment,
  name text,
  email text,
  homepage text,
  content text,
  date int,
  KEY date_index (date),
  UNIQUE id (id)
);

