
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

package Kalliope::Build::Dict;

use XML::Twig;
use Kalliope::DB;
use Kalliope::Date;
use Kalliope::Poem;
use strict;

my $dbh = Kalliope::DB::connect();

sub parse {
    my $filename = shift;
    my %dict;

    my $twig = new XML::Twig(keep_encoding => 1);
    $twig->parsefile($filename);
    foreach my $entry ($twig->root->children('entry')) {

    my $lastOK;
    
	my $p;
	my %dentry;

	$dentry{'id'} = $entry->{'att'}->{'id'};

	if ($entry->first_child('ord')) {
	    $dentry{'ord'} = $entry->first_child('ord')->text;
	    $lastOK = $dentry{'ord'};
	} else {
	    print $lastOK;
	    exit;
	}

	$dentry{'forkl'} = '';

	if ($entry->first_child('frase')) {
	    $dentry{'forkl'} .= '<span style="color: #808080">('.$entry->first_child('frase')->text.')</span> ';
	}

	if ($entry->first_child('forkl')->text) {
	    $dentry{'forkl'} .= $entry->first_child('forkl')->text;
	} else {
	}

	addToDict(\%dentry);

	foreach my $var ($entry->children('var')) {
		my %dentryVar;
		$dentryVar{'id'} = $dentry{'ord'}.$var->text;
		$dentryVar{'ord'} = $var->text;
		$dentryVar{'forkl'} = 'Se <A CLASS="green" HREF="dict.cgi?wid='.$dentry{'id'}.'">'.
		    $dentry{'ord'}.'</A>';
		addToDict(\%dentryVar);
		
	}
    }
    return %dict;

    sub addToDict {
	my $entry = shift;
	if ($dict{$entry->{'ord'}}) {
	    my $old = $dict{$entry->{'ord'}};
	    my $forkl = $old->{'forkl'};
	    if ($old->{'count'} == 1) {
		$forkl = "1. ".$forkl;
	    }
	    $old->{'count'}++;
	    $forkl .= '; '.$old->{'count'}.'. '.$entry->{'forkl'};
	    $old->{'forkl'} = $forkl;
	    $dict{$entry->{'ord'}} = $old;
	} else {
	    $entry->{'count'} = 1;
	    $dict{$entry->{'ord'}} = $entry;
	}
    }
}



sub create {
    $dbh->do("DROP TABLE dict");
    $dbh->do("CREATE TABLE dict ( 
	wid varchar(50) primary key,
        firstletter varchar(3),
        word varchar(127),
        forkl text,
        var text)
    ");
   $dbh->do(q/CREATE INDEX dict_firstletter ON dict(firstletter)/);
   $dbh->do(q/CREATE INDEX dict_word ON dict(word)/);
   $dbh->do(q/GRANT SELECT ON TABLE dict TO public/);
}

sub insert {
    my $dictRef = shift;
    my %dict = %{$dictRef};

    my $rc = $dbh->prepare("INSERT INTO dict (wid,firstletter,word,forkl,var) VALUES (?,?,?,?,?)");

    foreach my $entry (values %dict) {
	my $ord = $entry->{'ord'};
	my $fl = lc substr($ord,0,2);
	$fl = $fl eq 'aa' ? 'å' : lc substr($ord,0,1);

	$rc->execute($entry->{'id'},
		$fl,
		$ord,
		fixTags($entry->{'forkl'}), 
		fixTags($entry->{'var'}));
    }
}

sub fixTags {
    my $str = shift;
    $str =~ s/\$i\$/<i>/g;
    $str =~ s/\$\/i\$/<\/i>/g;
    return $str;
}

1;
