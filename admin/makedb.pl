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
use Kalliope::Build::Biblio;
use POSIX;

$| = 1; # No buffered I/O on STDOUT

my $dbh = Kalliope::DB->connect;

#
# Build dictionary 
#

&log ("Making dict... ");
Kalliope::Build::Dict::create();
%dict = Kalliope::Build::Dict::parse('../data/dict.xml');
Kalliope::Build::Dict::insert(\%dict);
&log ("Done");

#
# Keywords
#

&log ("Making keywords... ");

$rc = $dbh->do("drop table if exists keywords");
$rc = $dbh->do("CREATE TABLE keywords ( 
              id int UNSIGNED PRIMARY KEY NOT NULL,
	      ord char(128),
	      titel text,
	      beskrivelse text,
	      UNIQUE(id))");

$rc = $dbh->do("drop table if exists keywords_images");
$rc = $dbh->do("CREATE TABLE keywords_images ( 
              id int UNSIGNED PRIMARY KEY NOT NULL auto_increment,
	      keyword_id int unsigned,
	      imgfile char(128),
	      beskrivelse text,
	      UNIQUE(id))");

$sth = $dbh->prepare('INSERT INTO keywords (id,ord,beskrivelse,titel) VALUES (?,?,?,?)');	      
$sthimg = $dbh->prepare('INSERT INTO keywords_images (keyword_id,imgfile,beskrivelse) VALUES (?,?,?)');	      
opendir (DIR,'../keywords');
$i = 1;
while ($file = readdir(DIR)) {
    unless ($file =~ /^\./ || $file eq 'CVS') {
	$keywords{$file} = $i;
	$beskr = '';
	open(FILE,'../keywords/'.$file);
	$titel = '';
	while (<FILE>) { 
	    if (/^T:/) {
		s/^T://;
		chop;
		$titel = $_;
	    } elsif (/^K:/ || /^F:/) {
		next;
	    } elsif (/^P:/) {
		s/^P://;
		chop;
		$imgfile = $_;
		open(IMGFILE,"../gfx/hist/$imgfile.txt");
		$beskrivelse = join (' ',<IMGFILE>);
		close(IMGFILE);
		$sthimg->execute($i,$imgfile,$beskrivelse);
	    } else {
		$beskr .= $_ 
	    }
	};
	close (FILE);
	$sth->execute($i,$file,$beskr,$titel);
	$i++;
    }
}

&log("Done");

$rc = $dbh->do("drop table if exists keywords_relation");
$rc = $dbh->do("CREATE TABLE keywords_relation ( 
              keywordid int UNSIGNED NOT NULL,
	      otherid int NOT NULL,
	      othertype ENUM('digt','person','biografi','hist','keyword','vaerk') NOT NULL,
	      UNIQUE(keywordid,otherid,othertype))");

$sthkeyword = $dbh->prepare("INSERT INTO keywords_relation (keywordid,otherid,othertype) VALUES (?,?,?)");

#
# Build fnavne
#

&log("Making persons... ");
Kalliope::Build::Persons::create();
my %persons = Kalliope::Build::Persons::parse('../data/poets.xml');
my %fhandle2fid = Kalliope::Build::Persons::insert(%persons);
&log("Done");

#
# Build biblio
#

&log("Making biblio... ");
Kalliope::Build::Biblio::build();
&log("Done");

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
# Build links
#

&log("Build links... ");
$rc = $dbh->do("drop table if exists links");
$rc = $dbh->do("CREATE TABLE links ( 
              id int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              fid int NOT NULL,
              fhandle char(40) NOT NULL,
              url text NOT NULL,
              beskrivelse text NOT NULL,
              KEY fid_index (fid), 
              UNIQUE (id))");

$sth = $dbh->prepare("SELECT fhandle,fid FROM fnavne WHERE links=1");
$sth->execute;
$sth2= $dbh->prepare("INSERT INTO links (fhandle,fid,url,beskrivelse) VALUES (?,?,?,?)");
while ($fn = $sth->fetchrow_hashref) {
    open (FILE,"../fdirs/".$fn->{'fhandle'}."/links.txt");
    while (<FILE>) {
	$url = $_;
	$desc = <FILE>;
	$sth2->execute($fn->{'fhandle'},$fn->{'fid'},$url,$desc);
    }
    close (FILE)
}
$sth2->finish;
$sth->finish;
&log("Done");

#
# Build værker
#

&log("Build works... ");
$rc = $dbh->do("drop table if exists vaerker");
$rc = $dbh->do("CREATE TABLE vaerker ( 
              vid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              fhandle char(40) NOT NULL,
              fid INT NOT NULL,
              vhandle char(40) NOT NULL,
              titel text NOT NULL, 
	      underoverskrift text,
              aar char(40),
              noter text,
	      pics text,
              type char(5),
	      status enum('complete','incomplete'),
              findes char(1),
	      cvstimestamp int,
	      quality set('korrektur1','korrektur2','korrektur3',
	                  'kilde','side'),
	      lang char(10),
	      INDEX (lang),
	      INDEX (vhandle),
	      INDEX (fhandle),
	      INDEX (type),
              UNIQUE (vid))");


$sth = $dbh->prepare("SELECT * FROM fnavne");
$sth->execute;
$stharv = $dbh->prepare("SELECT ord FROM keywords,keywords_relation WHERE keywords.id = keywords_relation.keywordid AND keywords_relation.otherid = ? AND keywords_relation.othertype = 'biografi'");
$sth2= $dbh->prepare("INSERT INTO vaerker (fhandle,fid,vhandle,titel,underoverskrift,aar,type,findes,noter,pics,quality,lang,status,cvstimestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
&log("Antal forfattere: ".$sth->rows);

while ($fn = $sth->fetchrow_hashref) {
    $fdir = "../fdirs/".$fn->{'fhandle'}."/";
    my $fhandle = $fn->{'fhandle'};
    open(IN,$fdir."vaerker.txt");
    foreach (<IN>) {
	($vhandle,$titel,$aar,$type)=split(/=/,$_);
	next unless ($vhandle =~ /\S+/);
	if ($vhandle =~ /\S/) {
	    $type = 'v' unless ($type =~ /\S/);
	    $findes = (-e $fdir.$vhandle.".txt") ? 1 : 0;
	    $status = 'incomplete';
	    $cvsdate = 0;
	    $noter = '';
	    @pics = ();
	    @subtitles = ();
	    @keys = ();
	    my @qualities;
	    if ($findes) { 
                # Nedarv keys fra digteren
		$stharv->execute($fn->{'fid'});
		while ($kewl = $stharv->fetchrow_array) {
		    push @keys,$kewl;
		}
                # Læs filen for noter og ekstra keywords
		open (IN2,$fdir.$vhandle.".txt");
		foreach (<IN2>) {
		    if (/^VN:/) {
			s/^VN://;
			$noter .= $_."\n";
		    } elsif (/^VU:/) {
			s/^VU://;
		        push @subtitles,$_;
		    } elsif (/^VP:/) {
			s/^VP://;
		        push @pics,$_;
		    } elsif (/^CVS-TIMESTAMP:/) {
		        $cvsdate = Kalliope::Date::cvsTimestampToUNIX($_);
		    } elsif (/^VQ:/) {
			s/^VQ://;
			my @q = split /\s*,\s*/,$_;
			push @qualities,@q;
			push @{$qualityCache{"$fhandle/$vhandle"}},@q;
		    } elsif (/^STATUS:/) {
			s/^STATUS://;
			$status = $_;
		    } elsif (/^VK/) {
			s/^VK://;
			chop;
			push @keys,$_;
		    }
		}
		close(IN2);
	    }
	    chop($noter);
	    $pics = join '$$$',@pics;
	    my $quality = join ',',@qualities;
	    my $subtitle = join "\n",@subtitles;
	    $sth2->execute($fn->{'fhandle'},$fn->{'fid'},$vhandle,$titel,
	            $subtitle,$aar,
		    $type,$findes,$noter,$pics,$quality,$fn->{'sprog'},
		    $status,$cvsdate);
	    $lastid = Kalliope::DB::getLastInsertId($dbh,"vaerker");
	    foreach (@keys) {
		&insertkeywordrelation($_,$lastid,'vaerk');
	    }
	}
    }
    close(IN);
}
&log("Done");

$sth->finish;
$sth = $dbh->prepare("SELECT count(*) FROM vaerker");
$sth->execute;
($c) = $sth->fetchrow_array;
&log ("Antal værker: $c");
$sth->finish;
$sth = $dbh->prepare("SELECT count(*) FROM vaerker WHERE type='p'");
$sth->execute;
($c) = $sth->fetchrow_array;
&log("  heraf prosa: $c");
$sth->finish;

#
# Timeline ------------------------------------------------------------
#

&log ("Making timeline... ");
Kalliope::Build::Timeline::build(%persons);

#
# Build digte -------------------------------------------------------------
#
      

$rc = $dbh->do("drop table if exists digte");
$rc = $dbh->do("CREATE TABLE digte ( 
              did int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              longdid char(40) NOT NULL,
              fid INT NOT NULL,
              vid INT NOT NULL,
              vaerkpos INT,
              titel text NOT NULL,
              toctitel text NOT NULL,
	      tititel text NOT NULL,
              foerstelinie text,
              underoverskrift text,
              indhold mediumtext,
	      haystack mediumtext,
              noter text,
	      pics text,
	      quality set('korrektur1','korrektur2','korrektur3',
	                  'kilde','side'),
              layouttype enum('prosa','digt') default 'digt',
	      createtime INT NOT NULL,
              afsnit int,      /* 0 hvis ikke afsnitstitel, ellers H-level. */
	      lang char(10),
	      INDEX (longdid),
	      INDEX (afsnit),
	      INDEX (did),
	      INDEX (lang),
	      INDEX (createtime),
	      INDEX (fid),
	      INDEX (vid),
              UNIQUE (did,longdid))
	      TYPE = MYISAM
	      ");
#
# vaerkpos er digtets position i samlingen.
# afsnit i digtsamliner betegnes med afsnit=1. Afsnittets titel ligger i titel.
#
$stharv = $dbh->prepare("SELECT ord FROM keywords,keywords_relation WHERE keywords.id = keywords_relation.keywordid AND keywords_relation.otherid = ? AND keywords_relation.othertype = 'vaerk'");
$sth = $dbh->prepare("SELECT * FROM vaerker WHERE findes=1 ORDER BY cvstimestamp DESC");
$sthafs = $dbh->prepare("INSERT INTO digte (fid,vid,titel,toctitel,vaerkpos,afsnit) VALUES (?,?,?,?,?,?)");
my $sthLastIns = $dbh->prepare("SELECT LAST_INSERT_ID() FROM digte");

$sthkdigt = $dbh->prepare("INSERT INTO digte (longdid,fid,vid,vaerkpos,titel,toctitel,tititel,foerstelinie,underoverskrift,indhold,noter,pics,afsnit,layouttype,haystack,createtime,quality,lang) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?)");
$sth->execute;
&log ("  Ikke tomme: ".$sth->rows);

my $counterMax = $sth->rows;
my $counter = 1;
while ($v = $sth->fetchrow_hashref) {
    &log (sprintf("[%3d/%3d]",$counter++,$counterMax).' '.$v->{'titel'});
    $fdir = "../fdirs/".$v->{'fhandle'}."/";
    open(IN,$fdir.$v->{'vhandle'}.".txt") || die "Argh! ".$fdir.$v->{'vhandle'}.'.txt ikke fundet!';
    $i=0;
    $first = 1;
    $toctitel = $noter = $under = $indhold = '';
    $tititel = '';
    @arvedekeys = ();
    @pics = ();
    @qualities = ();
    # Nedarv keys fra værket
    $stharv->execute($v->{'vid'});
    while ($kewl = $stharv->fetchrow_array) {
	push @arvedekeys,$kewl;
    }
    @mykeys = @arvedekeys;
    while (<IN>) {
	chomp;
	s/\r//;
	s/,,/&bdquo;/g;
	s/''/&ldquo;/g;
	s/ *$//;
	next if (/^\#/);
	next if (/^VN:/);
	next if (/^VP:/);
	next if (/^VK:/);
	next if (/^VU:/);
	next if (/^VQ:/);
	next if (/^STATUS:/);
	next if (/^CVS-TIMESTAMP:/);
	next if (/^FILES:/);
	if (/^H(.):(.*)/) {
	    $level = $1;
	    $afsnitstitel = $2;
	    &insertdigt unless ($first);
	    @mykeys = @arvedekeys;
	    $first = 1; #fordi vi ikke kender næste digt ID
	    $sthafs->execute($v->{'fid'},$v->{'vid'},$afsnitstitel,$afsnitstitel,$i,$level);
	    $i++;
	    next;
	}; 
	if (/^I:/) {
	    s/^I://;	
		$tempid = $_;
	    if ($first) {
		$id = $tempid;
		$first = 0;
	    } else {
		&insertdigt;
	    }
	} elsif (/^TOC:/) {
	    s/^TOC://;
	    $toctitel = $_;
	}  elsif (/^TI:/) {
	    s/^TI://;
	    $tititel = $_;
	}  elsif (/^T:/) {
	    s/^T://;
	    $titel = $_;
	} elsif (/^F:/) {
	    s/^F://;
	    $firstline = $_;
	} elsif (/^K:/) { 
	    s/^K://;
	    s/\s+$//;
	    push @mykeys,$_;
	} elsif (/^N:/) {
	    s/^N://;
	    $noter .= $_."\n";
	} elsif (/^P:/) {
	    s/^P://;
	    push @pics,$_;
	} elsif (/^Q:/) {
	    s/^Q://;
	    my @q = split /\s*,\s*/,$_;
	    push @qualities,@q;
	} elsif (/^U:/) {
	    s/^U://;
	    $under .= $_."\n";
	} elsif (/^TYPE:/) {
	    s/^TYPE://;
            $layouttype = $_;
        }  else {
	    $indhold .= $_."\n";
	}
    }
    close(IN);
    # insert sidste digt
    &insertdigt;
}
$sth->finish;

$sthkdigt->finish;
$sthafs->finish;

$sth = $dbh->prepare("SELECT count(*) FROM digte WHERE afsnit=0");
$sth->execute;
($count) = $sth->fetchrow_array;
&log ("Antal digte: $count");
$sth->finish;

#
# Xrefs
#

&log ("Building Xrefs...");
Kalliope::Build::Xrefs::build();
&log ("Done");

#
# Build hasHenvisninger 
#

pis:
&log ("Detekterer henvisninger...");
Kalliope::Build::Persons::buildHasHenvisninger($dbh);
&log ("Done");

#
# Build forbogstaver
#

print "Building firstletters...";

$rc = $dbh->do("drop table if exists forbogstaver");
$rc = $dbh->do("CREATE TABLE forbogstaver ( 
              bid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
	      forbogstav char(2) NOT NULL,
	      did INT NOT NULL,
	      sprog char(2) NOT NULL,
	      type char(1) NOT NULL,   /* t eller f */
	      KEY forbogstav_key (forbogstav(2)), 
	      UNIQUE (bid))");
$sth = $dbh->prepare("SELECT foerstelinie,tititel as titel,did,sprog FROM digte D, fnavne F WHERE D.fid = F.fid AND afsnit=0 AND D.layouttype = 'digt' ORDER BY F.sprog");
$sth->execute();
$i=0;
while ($f[$i] = $sth->fetchrow_hashref) { 
    $i++; 
}
$sthk = $dbh->prepare("INSERT INTO forbogstaver (forbogstav,did,sprog,type) VALUES (?,?,?,?)");
$mode = 't';
foreach (@f) { $_->{'sort'} = $_->{'titel'}};
&insertforbogstav();
$mode = 'f';
foreach (@f) { $_->{'sort'} = $_->{'foerstelinie'}};
&insertforbogstav();

#
# Subs
#

sub insertforbogstav {
    foreach $f (sort { Kalliope::Sort::sort ($a,$b) } @f) {
	next unless $f->{'sort'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$f->{'sort'} =~ tr/ÁÀÉÈ/AAEE/;
	$sthk->execute(substr($f->{'sort'},0,1), $f->{'did'}, $f->{'sprog'},$mode);
    }
}
&log ("Done");

#$dbh->disconnect;

sub insertdigt {
    chop($noter);
    chop($under);
    $layouttype = 'prosa' if $v->{'type'} ne 'v' && $layouttype ne 'digt';
    &log ("$id er set før!") if ++$knownlongdids{$id} > 1;
    &log ("$id mangler førstelinie") if $firstline eq '' && $layouttype ne 'prosa';
    &log ("$id mangler titel") if $titel eq '';
    $indhold =~ s/\s+$//;
    $noter =~ s/[\n\s]+$//;
    $indhold =~ s/^\n+//s;
    $pics = join '$$$',@pics;
    $haystack = Kalliope::Strings::stripHTML("$titel $under $indhold");

    # Try to find create date...
    my ($year,$mon,$day) = $id =~ /(\d\d\d\d)(\d\d)(\d\d)/;
    my $time = POSIX::mktime(0,0,2,$day,$mon-1,$year-1900) || 0;

    # Prepare qualities
    my $quality = join ',',Kalliope::Array::uniq(@qualities,@{$qualityCache{"$$v{fhandle}/$$v{vhandle}"}});
    
    # Insæt hvad vi har.
    $sthkdigt->execute($id,$v->{'fid'},$v->{'vid'},$i,$titel,$toctitel || $titel, $tititel || $titel,$firstline,$under,$indhold,$noter,$pics,$layouttype || 'digt',$haystack,$time,$quality,$v->{'lang'});
    $i++;
    $layouttype = $noter = $under = $indhold = '';
    $firstline = '';
    $titel = '';
    $tititel = '';
    $toctitel = '';
    @pics = ();
    @qualities = ();
    
    $sthLastIns->execute();
    ($mymylastid) = $sthLastIns->fetchrow_array();

    foreach (@mykeys) {
	&insertkeywordrelation($_,$mymylastid,'digt');
    }
    @mykeys = @arvedekeys;
    $id = $tempid;
}

sub insertkeywordrelation {
    my ($keyword,$otherid,$othertype,$ord) = @_;
    if ($othertype eq 'person') {
	$sthkeyword->execute($insertedfnavne{$keyword},$otherid,$othertype);
    } else {
	if ($keywords{$keyword}) {
	    $sthkeyword->execute($keywords{$keyword},$otherid,$othertype);
	} else {
	    &log("Nøgleordet '$keyword' i $othertype:$ord er ukendt.");
	}
    }
}


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
