# MySQL dump 5.12
#
# Host: localhost    Database: kalliope
#--------------------------------------------------------
# Server version	3.22.16a-gamma

#
# Table structure for table 'hourhits'
#
CREATE TABLE hourhits (
  hour int DEFAULT '0' NOT NULL,
  hits int DEFAULT '0' NOT NULL,
  PRIMARY KEY (hour),
  UNIQUE did (hour)
);
