CREATE TABLE korrektur ( 
              id int NOT NULL AUTO_INCREMENT,
	      date int NOT NULL,
	      longdid char(50) NOT NULL,
	      korrektur text,
	      INDEX (date),
	      INDEX (id));
	      
