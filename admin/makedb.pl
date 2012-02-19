#!/usr/bin/perl

use lib '..';
use Kalliope::Sort;
use Kalliope::DB;
use Kalliope::Strings;
use Kalliope::Array;
use Kalliope::Build::Persons;
use Kalliope::Build::Dict;
use Kalliope::Build::Timeline;
use Kalliope::Build::Xrefs;
use Kalliope::Build::Keywords;
use Kalliope::Build::Biblio;
use Kalliope::Build::Works;
use Kalliope::Build::Texts;
use Kalliope::Build::Timestamps;
use Kalliope::Build::Firstletters;
use Kalliope::Build::Links;
use Kalliope::Build::News;
use Kalliope::Build::Database;
use POSIX;
use Getopt::Long;

$| = 1; # No buffered I/O on STDOUT

my $dbh = Kalliope::DB->connect;

my $__all = '';
my $__xrefs = '';
GetOptions ("all" => \$__all,"xrefs" => \$__xrefs);

if ($__all) {
    &log ("Creating tables...");
    Kalliope::Build::Timestamps::create();
    Kalliope::Build::Timeline::create();
    Kalliope::Build::Keywords::drop();

    Kalliope::Build::Xrefs::drop();
    Kalliope::Build::Links::drop();
    Kalliope::Build::Firstletters::drop();
    Kalliope::Build::Texts::drop();
    Kalliope::Build::Works::drop();
    Kalliope::Build::Biblio::drop();
    Kalliope::Build::Persons::drop();

    Kalliope::Build::Persons::create();
    Kalliope::Build::Links::create();
    Kalliope::Build::Biblio::create();
    Kalliope::Build::Works::create();
    Kalliope::Build::Texts::create();
    Kalliope::Build::Xrefs::create();
    Kalliope::Build::Keywords::create();
    Kalliope::Build::Firstletters::create();

    Kalliope::Build::Database::grant();
}

#
# Build news
#
Kalliope::Build::News::create();
foreach my $lang ('da','en') {
    my $newsFile = "../data/news_$lang.xml";
    if (Kalliope::Build::Timestamps::hasChanged($newsFile) || 1) {
	&log ("Making $lang news... ");
	Kalliope::Build::News::insert($newsFile,$lang);
	Kalliope::Build::Timestamps::register($newsFile);
	&log ("Done");
    }
}

#
# Build dictionary 
#
my $dictFile = '../data/dict.xml';
if (Kalliope::Build::Timestamps::hasChanged($dictFile)) {
    &log ("Making dict... ");
    Kalliope::Build::Dict::create();
    %dict = Kalliope::Build::Dict::parse($dictFile);
    Kalliope::Build::Dict::insert(\%dict);
    Kalliope::Build::Timestamps::register($dictFile);
    &log ("Done");
} else {
    &log ("(Dict not modified)");
}

#
# Keywords
#

&log ("Making keywords... ");
Kalliope::Build::Keywords::clean();
Kalliope::Build::Keywords::insert();
&log("Done");

$rc = $dbh->do("DROP TABLE keywords_relation");
$rc = $dbh->do("CREATE TABLE keywords_relation ( 
              keywordid int NOT NULL,
	      otherid int NOT NULL,
	      othertype VARCHAR(20), -- ENUM('digt','person','biografi','hist','keyword','vaerk') NOT NULL,
	      UNIQUE(keywordid,otherid,othertype))");
   $dbh->do(q/GRANT SELECT ON TABLE keywords_relation TO "www-data"/);

$sthkeyword = $dbh->prepare("INSERT INTO keywords_relation (keywordid,otherid,othertype) VALUES (?,?,?)");

#
# Build fnavne
#

$poetsFile = '../data/poets.xml';
my %persons;
if (Kalliope::Build::Timestamps::hasChanged($poetsFile)) {
    &log("Making persons... ");
    Kalliope::Build::Persons::drop() unless $__all;
    Kalliope::Build::Persons::create() unless $__all; 
    my %persons = Kalliope::Build::Persons::parse($poetsFile);
    Kalliope::Build::Persons::insert(%persons);
    Kalliope::Build::Timestamps::register($poetsFile);
    Kalliope::Build::Links::drop() unless $__all;
    Kalliope::Build::Links::create()  unless $__all;
    Kalliope::Build::Links::insert();
    Kalliope::Build::Database::grant();
    &log("Done");
    &log ("Making timeline... ");
    Kalliope::Build::Timeline::build(%persons);
    &log("Done");
} else {
    &log ("(Poets not modified)");
}

&log("Scanning works...");
my @changedWorks = Kalliope::Build::Works::findmodified();
&log("Done. ".($#changedWorks+1)." files have changed.");
&log("Cleaning works...");
Kalliope::Build::Works::clean(@changedWorks);
&log("Done");
&log("Inserting works heads...");
Kalliope::Build::Works::insert(@changedWorks);
&log("Done");

&log("Inserting works bodies...");
Kalliope::Build::Texts::insert();
&log("Done");

if (!$__all) {
    &log('Cleaning firstletters...');
    Kalliope::Build::Firstletters::clean(@changedWorks);
    &log("Done");
}
&log('Inserting firstletters...');
Kalliope::Build::Firstletters::insert(@changedWorks);
&log("Done");

&log('Persons postinsert...');
Kalliope::Build::Persons::postinsert();
&log("Done");

&log('Inserting xrefs...');
Kalliope::Build::Xrefs::insert(@changedWorks);
&log("Done");

&log('Works postinsert...');
Kalliope::Build::Works::postinsert();
&log("Done");

&log('Texts postinsert...');
Kalliope::Build::Texts::postinsert();
&log("Done");


#
# Build biblio
#

&log("Making biblio... ");
Kalliope::Build::Biblio::build();
&log("Done");


exit;



#
# Andet pass af keywords som laver links imellem dem
#

&log("Second pass of keywords... ");
$sth = $dbh->prepare("SELECT * FROM keywords");
$sth->execute();
while ($h = $sth->fetchrow_hashref) {
    open(FILE,'../keywords/'.$h->{'ord'});
    while (<FILE>) { 
	if (/^K:/) {
	    s/^K://;
	    chop;
	    &insertkeywordrelation($_,$h->{'id'},'keyword',$h->{'ord'});
	} elsif (/^F:/) {
	    s/^F://;
	    chop;
	    &insertkeywordrelation($_,$h->{'id'},'person',$h->{'ord'});
        }
    }
    close(FILE)
}
&log("Done");

#
# Timeline ------------------------------------------------------------
#


#
# Build hasHenvisninger 
#

pis:
&log ("Detekterer henvisninger...");
Kalliope::Build::Persons::buildHasHenvisninger($dbh);
&log ("Done");

#$dbh->disconnect;


#
# Build haystack -------------------------------------------------------------
#

$rc = $dbh->do("DROP TABLE IF EXISTS haystack");
$rc = $dbh->do("CREATE TABLE haystack ( 
              id int,
	      id_class enum('Kalliope::Poem',
	                    'Kalliope::Keyword',
	                    'Kalliope::Work',
			    'Kalliope::Person'),
	      titel text,
	      fid char(40) NOT NULL,
	      hay text,
	      lang char(2) NOT NULL,
	      INDEX (fid),
	      INDEX (lang))");

my $sth_hay_ins = $dbh->prepare("INSERT INTO haystack (id,id_class,titel,hay,lang,fid) VALUES (?,?,?,?,?,?)");

# Poems
&log ("Inserting poem hay");
my $sth = $dbh->prepare("SELECT did,f.fid,indhold,underoverskrift,titel,sprog FROM digte AS d,fnavne AS f WHERE d.fid = f.fid AND d.afsnit = 0"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = Kalliope::Strings::stripHTML("$$h{titel} $$h{underoverskrift} $$h{indhold}");
    $sth_hay_ins->execute($$h{did},'Kalliope::Poem',$$h{titel},$hay,$$h{sprog},$$h{fid});
}

# Persons
print "Inserting person hay\n";
my $sth = $dbh->prepare("SELECT fid,efternavn,fornavn,sprog FROM fnavne"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = "$$h{fornavn} $$h{efternavn}";
    $sth_hay_ins->execute($$h{fid},'Kalliope::Person',$hay,$hay,$$h{sprog},'');
}

# Works 
print "Inserting works hay\n";
my $sth = $dbh->prepare("SELECT vid,fnavne.fid,titel,sprog FROM fnavne,vaerker WHERE fnavne.fid = vaerker.fid"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = "$$h{titel}";
    $sth_hay_ins->execute($$h{vid},'Kalliope::Work',$hay,$hay,$$h{sprog},$$h{fid});
}

# Keywords 
print "Inserting keyword hay\n";
my $sth = $dbh->prepare("SELECT id,titel,beskrivelse FROM keywords"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = Kalliope::Strings::stripHTML("$$h{titel} $$h{beskrivelse}");
    $sth_hay_ins->execute($$h{id},'Kalliope::Keyword',$$h{titel},$hay,'dk','');
}

print "Creating FULLTEXT index...\n";
$dbh->do('CREATE FULLTEXT INDEX haystackidx ON haystack (titel,hay)');


sub log {
   my $text = shift;
   my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
   print sprintf("<%02d:%02d:%02d> %s\n",$hour,$min,$sec,$text);
}
