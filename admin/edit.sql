# MySQL dump 5.12
#
# Host: localhost    Database: kalliope
#--------------------------------------------------------
# Server version	3.22.16a-gamma

#
# Table structure for table 'editpages'
#
DROP TABLE IF EXISTS editpages;
CREATE TABLE editpages (
	filename varchar(128) NOT NULL,
	dir varchar(128) NOT NULL,
	data text,
        KEY(filename),
        KEY(dir)
);

DROP TABLE IF EXISTS edithistory;
CREATE TABLE edithistory (
	filename varchar(128) NOT NULL,
	dir varchar(128) NOT NULL,
	action enum('edit','accept'),
        login varchar(64),
        date int,
        KEY(filename),
        KEY(dir)
);

