
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
    
use XML::DOM;
require Unicode::String;
use Kalliope::DB;
use Kalliope::Date;
use Kalliope::Poem;
use strict;

my $dbh = Kalliope::DB::connect();

sub parse {
   my $filename = shift;
   my $parser = new XML::DOM::Parser;
   my $doc = $parser->parsefile($filename);
 
   my @dict;
   my $entries = $doc->getElementsByTagName('entry');
   my $n = $entries ->getLength;

   my $lastOK;
   for (my $i = 0; $i < $n; $i++) {
       my $p;
       my $entry = $entries ->item($i);
       my %dentry;

       $dentry{'id'} = $entry->getAttribute('id');

       if ($entry->getElementsByTagName('ord')->item(0)) {
          $dentry{'ord'} = Unicode::String::utf8($entry->getElementsByTagName('ord')->item(0)->getFirstChild->getNodeValue)->latin1;
          $lastOK = $dentry{'ord'};
       } else {
          print $lastOK;
          exit;
       }

       $dentry{'forkl'} = '';

       if ($entry->getElementsByTagName('frase')->item(0)) {
          $dentry{'forkl'} .= '<span style="color: #808080">('.Unicode::String::utf8(
		  $entry->getElementsByTagName('frase')->item(0)->toString)->latin1.
                 ')</span> ';
       }

       if ($entry->getElementsByTagName('forkl')->item(0)) {
          $dentry{'forkl'} .= Unicode::String::utf8($entry->getElementsByTagName('forkl')->item(0)->toString)->latin1;
       } else {
       }

       push @dict,\%dentry;

       if ($entry->getElementsByTagName('var')->item(0)) {
           my $vars = $entry->getElementsByTagName('var');
           my $nn = $vars->getLength;
           for (my $j = 0; $j < $nn; $j++) {
               my %dentryVar;
               my $var = Unicode::String::utf8($vars->item($j)->getFirstChild->getNodeValue)->latin1;
               $dentryVar{'id'} = $dentry{'ord'}.$var;
               $dentryVar{'ord'} = $var;
               $dentryVar{'forkl'} = 'Se <A CLASS="green" HREF="dict.cgi?wid='.$dentry{'id'}.'">'.
                                      $dentry{'ord'}.'</A>';
               push @dict,\%dentryVar;
           }
       }
   }
   return @dict;
}


sub create {
    $dbh->do("DROP TABLE IF EXISTS dict");
    $dbh->do("CREATE TABLE dict ( 
              wid char(20) primary key,
              firstletter char(3),
              word varchar(127),
              forkl text,
              var text,
              KEY word_index (word(10)), 
              KEY firstletter_index (firstletter(1)), 
              UNIQUE (wid))");
}

sub insert {
    my $dictRef = shift;
    my @dict = @{$dictRef};

    my $rc = $dbh->prepare("INSERT INTO dict (wid,firstletter,word,forkl,var) VALUES (?,?,?,?,?)");
    
    foreach my $entry (@dict) { 
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
