CREATE TABLE digte_keywords ( 
              longdid char(128) NOT NULL,
	      keywords text,
	      lang char(2),
	      PRIMARY KEY (longdid),
	      UNIQUE longdidd (longdid),
	      INDEX (lang),
	      FULLTEXT (keywords)
	      );
