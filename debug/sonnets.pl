#!/usr/bin/perl -w

use strict;

use lib '..';
use Kalliope::DB;
use Kalliope::Poem;

#
# Finder digte på 14 vers, som ikke er markeret som sonnetter.
#

my @false = qw/ rueckert20011027134 rueckert2001102725 brandes2001061715 lessing2002080159 lessing200208012 rilke2002080113 rilke2002080303 grundtvig20010107324 grundtvig20010107279 claussen2002090104 claussen2001123105  oehlenschlaeger1805a1 oehlenschlaeger1805a4 lawrence2001061761 lawrence2001061106 moellerpmandrea0
whitman2001060711 whitman2001060420 whitman2001060955 
whitman2001060930 whitman2001060929 whitman2001060873
whitman2001060894 whitman2001060925 whitman2001060857 
whitman2001060630 whitman2001060815 
brandes2001061738 brandes2001061732
staffeldt1999080102 baudel1999070186 thaarup2001120101 
morgenstern200201293 rueckert2001102714 hostrup1999031808 jacobsenandrea8 grundtvig2001010759 grundtvig2001010769 grundtvig2001010729 grundtvig1837a7 lawrence2001060907 /;

my $dbh = Kalliope::DB::connect();

# Find all known sonnets and false positives
my $sth = $dbh->prepare("SELECT otherid FROM keywords_relation,keywords WHERE keywords.ord = 'sonnet' AND keywords_relation.keywordid = keywords.id AND keywords_relation.othertype = 'digt'");
$sth->execute;
my %sonnets;
while (my ($did) = $sth->fetchrow_array) {
   $sonnets{$did} = 1;
}
foreach my $longdid (@false) {
   my $poem = new Kalliope::Poem(longdid => $longdid);
   next unless $poem;
   $sonnets{$poem->did} = 1;
}

$sth = $dbh->prepare("SELECT did FROM digte WHERE layouttype = 'digt' AND afsnit = 0");
$sth->execute;
while (my ($did) = $sth->fetchrow_array) {
    next if defined $sonnets{$did};
    my $poem = new Kalliope::Poem(did => $did);
    $poem->content;
    my $num = $poem->getNumberOfVerses;
    if ($num == 14) {
	 print "\n*** ".$poem->author->fhandle."/".$poem->work->longvid.".txt : ".$poem->longdid."\n";
         print $poem->{'indhold'};
	 print "\n***\n"
    }
}
