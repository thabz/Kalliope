#!/usr/bin/perl

# Et bedre alternativ til Metaphone er "Levenshtein edit distance":
# http://theoryx5.uwinnipeg.ca/CPAN/data/String-Approx/Approx.html
# 

#use Text::Metaphone;
use DBI;

sub Metaphone { shift };

my $dbh = DBI->connect("DBI:mysql:kalliope:localhost", "kalliope", "" ) or print ("Connect fejl: $DBI::errstr");
if ($dbh eq "") { die "Error!"; };

$mywid = 0;

$rc = $dbh->do("drop table if exists dict");
$rc = $dbh->do("CREATE TABLE dict ( 
              wid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY,
              ord char(50) NOT NULL,
              antal int NOT NULL,
              dids text NOT NULL,
              sound char(5),
              sprog char(2) NOT NULL,
              KEY dict_sprog (sprog(2)),
              KEY dict_ord (ord(3)),
              UNIQUE (wid))");

$rc = $dbh->do("drop table if exists orddigtrel");
$rc = $dbh->do("CREATE TABLE orddigtrel ( 
              wid int UNSIGNED NOT NULL,
              did int UNSIGNED NOT NULL,
              PRIMARY KEY (wid,did))");

foreach $LA ('dk','uk','de','fr') {
    %ordantal=undef;
    %ordref = undef;

    $sth = $dbh->prepare("SELECT did,indhold,sprog,digte.titel  FROM digte,fnavne,vaerker WHERE digte.fid = fnavne.fid and digte.vid = vaerker.vid and vaerker.type!='p' AND afsnit=0 and fnavne.sprog=?");
    $sth->execute($LA);
    while ($f = $sth->fetchrow_hashref) {
	$indhold = $f->{'titel'}." ".$f->{'indhold'};
	$indhold = lc $indhold;
	#TODO: Vi mister de franske og tyske specialtegn i øjeblikket
	$indhold =~ tr/ÆØÅ/æøå/;
	$indhold =~ s/<.?i>//g;
	$indhold =~ s/[\n \t]+/ /g;
	$indhold =~ s/[^a-zæøå ]//g;
	@ord = sort split (' ',$indhold);
	foreach (@ord) {
	    unless ($lastord eq $_) {
		$ordantal{$_}++;
		$ordref{$_} .= "$f->{'did'}".';';
	    }
	    $lastord = $_;
	}
    }
    $sth->finish;
    
    print "\nAntal ".$LA.' ord: '.(%ordantal+0)."\n";
    
    $sth = $dbh->prepare("INSERT DELAYED INTO dict (wid,ord,antal,dids,sprog,sound) VALUES (?,?,?,?,?,?)");
    $sth2 = $dbh->prepare("INSERT DELAYED INTO orddigtrel (wid,did) VALUES (?,?)");
    
    foreach (keys %ordantal) {
	if (length($_) > 1) {
	    $sth->execute($mywid,$_,$ordantal{$_},$ordref{$_},$LA,Metaphone($_));
	    @dids = split(';',$ordref{$_});
	    foreach $i (@dids) {
		$sth2->execute($mywid,$i);
	    }
	    $mywid++;
	}
    }
    $sth->finish;
    print "Inserted...\n";
}

$dbh->disconnect;
