CREATE TABLE forum ( 
              id int NOT NULL AUTO_INCREMENT,
	      parent int NOT NULL,
	      thread_id int NOT NULL,
	      latest_thread_activity int NOT NULL,
	      date int NOT NULL,
	      sender text,
	      email text,
	      subject text,
	      content text,
	      KEY (id),
	      INDEX (latest_thread_activity),
	      INDEX (date),
	      INDEX (thread_id),
	      INDEX (parent));
	      
