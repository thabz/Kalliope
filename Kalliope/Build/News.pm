

#
#  Copyright (C) 1999-2001 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$

package Kalliope::Build::News;

use Kalliope::DB;
use Kalliope;
use XML::Twig;
use strict;

my $dbh = Kalliope::DB::connect();

sub create {
    $dbh->do("DROP TABLE news");
    $dbh->do("CREATE TABLE news ( 
        entry text,
        active integer,
	lang varchar(2),
        orderby integer,
        pubdate date)");
   $dbh->do(q/CREATE INDEX news_active ON news(active)/);
   $dbh->do(q/CREATE INDEX news_pubdate ON news(pubdate)/);
   $dbh->do(q/GRANT SELECT ON TABLE news TO public/);
}

sub insert {
    my ($filename,$lang) = @_;
    my $sth = $dbh->prepare("INSERT INTO news (entry,active,orderby,lang,pubdate) VALUES (?,?,?,?,?)");
    
    my $twig = new XML::Twig(keep_encoding => 1);
    $twig->parsefile($filename);
    my $i = 1;
    foreach my $event ($twig->root->children('item')) {
        my $body = $event->first_child('body')->xml_string;
    	my $date = $event->first_child('date')->xml_string;
    	Kalliope::buildhrefs(\$body);
    	my ($day,$month,$year) = split('-', $date);
    	$sth->execute($body,1,$i++,$lang,"$year-$month-$day");
    }
    
    
#    open (NEWS,$filename);
#    my $i = 1;
#    foreach my $line (<NEWS>) {
#	next if $line =~ /^\s*$/;
#	Kalliope::buildhrefs(\$line);
#	my $active = $line =~ /^#/ ? 0 : 1;
#        $line =~ s/^\#//;
#	$sth->execute($line,$active,$i++);
#    }
#    close (NEWS);
}

1;
