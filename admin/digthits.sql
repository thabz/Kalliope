# MySQL dump 5.12
#
# Host: localhost    Database: kalliope
#--------------------------------------------------------
# Server version	3.22.16a-gamma

#
# Table structure for table 'digthits'
#
CREATE TABLE digthits (
  longdid varchar(40) DEFAULT '0' NOT NULL,
  hits int(11) DEFAULT '0' NOT NULL,
  lasttime int DEFAULT '0' NOT NULL,
  PRIMARY KEY (longdid),
  UNIQUE did (longdid)
);
