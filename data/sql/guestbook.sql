CREATE TABLE guestbook (
  id NUMBER NOT NULL PRIMARY KEY,
  name TEXT,
  email VARCHAR(1024),
  homepage VARCHAR(1024),
  subject VARCHAR(1024),
  body TEXT,
  unixtime NUMBER,
  active BOOLEAN
);

CREATE SEQUENCE seq_guestbook_id INCREMENT 1 START 1;
CREATE INDEX ON guestbook(id);
GRANT SELECT,UPDATE,INSERT ON TABLE guestbook TO "www-data";

