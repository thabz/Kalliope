CREATE TABLE digthits (
  longdid varchar(40) NOT NULL PRIMARY KEY,
  hits int NOT NULL,
  lasttime int NOT NULL
);

CREATE INDEX digthits_hits ON digthits(hits);
GRANT SELECT,UPDATE,INSERT ON TABLE digthits TO "www-data";

