#!/usr/bin/perl

use lib '..';
use Kalliope::Sort;
use Kalliope::DB;
use Kalliope::Strings;

my $dbh = Kalliope::DB->connect;

#
# Keywords
#

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

$rc = $dbh->do("drop table if exists fnavne");
$rc = $dbh->do("CREATE TABLE fnavne ( 
fid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
fhandle char(40) NOT NULL, 
              fornavn text DEFAULT '', 
              efternavn text DEFAULT '',
              foedt char(8), 
              doed char(8), 
              sprog char(2), 
              land text,
              /* Beholdning */
              cols int(2),
              thumb int(1),
              pics int(1),
              bio int(1),
              biotext text,
              links int(1),
              sekundaer int(1),
              vaerker int(1),
              vers int(1),
              prosa int(1),
              KEY fhandle_index (fhandle(10)), 
              UNIQUE (fid))");

$lastinsertsth = $dbh->prepare("SELECT DISTINCT LAST_INSERT_ID() FROM fnavne");
foreach $LA ('dk','uk','fr','de','se','no') {
    open (IN, "../data.$LA/fnavne.txt") || next;
    while (<IN>) {
	chop($_);chop($_);
	($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
	$fddir = "../fdirs/".$fhandle;		#forfatterens doc-dir
	$fsdir = "../fdirs/".$fhandle;	#forfatterens cgi-bin-dir
	$fcols = $fthumb = $pics = $fbio = $flinks = $fsekundaer = $fvaerker = $fprosa = $fvaerkerindhold = 0;	
        $biotext = '';
	@keys = ();
	if (-e $fddir."/thumb.jpg") {
	    $fthumb=1;
	}
	$fpics = 0;
	while (-e $fddir."/p".($fpics+1).".jpg") { $fpics++; };
	$fcols++ if ($fpics);
	if (-e $fsdir."/bio.txt") {
	    open(BIO,$fsdir."/bio.txt");
	    while (<BIO>) {
		if (/^K:/) {
		    s/^K://;
		    chop;
		    push @keys,$_;
		} else {
                    $biotext .= $_;
                } 
	    }
	    close(BIO);
	    $fbio=1;
	    $fcols++;
	}
	if (-e $fsdir."/links.txt") {
	    $flinks=1;
	    $fcols++;
	}
	if (-e $fsdir."/sekundaer.txt") {
	    $fsekundaer=1;
	    $fcols++;
	}
	if (-e $fsdir."/vaerker.txt") {
	    $fvaerker=1;
	    # Undersøg om der er indhold i disse vaerker.
	    open (FILE,$fsdir."/vaerker.txt");
	    foreach (<FILE>) {
		my ($vhandle,$titel,$vaar,$type) = split(/=/,$_);
		if ($type eq "p") {
		    $fprosa = 1;
		} elsif (-e $fsdir."/".$vhandle.".txt") {
		    $fvaerkerindhold = 1;
		}
	    }
	    $fcols+=2;
	}   

	$rc = $dbh->prepare("INSERT INTO fnavne (fhandle,fornavn,efternavn,foedt,doed,sprog,cols,thumb,pics,biotext,bio,links,sekundaer,vaerker,vers,prosa) VALUES (?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?)");
        $rc->execute($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed,$LA,$fcols,$fthumb,$fpics,$biotext,$fbio,$flinks,$fsekundaer,$fvaerkerindhold,$fvaerker,$fprosa);
	$lastinsertsth->execute();
	($lastid) = $lastinsertsth->fetchrow_array;
        $insertedfnavne{$fhandle} = $lastid;
	foreach (@keys) {
	    &insertkeywordrelation($_,$lastid,'biografi');
	}
    }
    close(IN);
}

#
# Andet pass af keywords som laver links imellem dem
#

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

#
# Build links
#

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

#
# Build værker
#

$rc = $dbh->do("drop table if exists vaerker");
$rc = $dbh->do("CREATE TABLE vaerker ( 
              vid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              fhandle char(40) NOT NULL,
              fid INT NOT NULL,
              vhandle char(40) NOT NULL,
              titel text NOT NULL, 
              aar char(40),
              noter text,
              type char(5),
              findes char(1),
              UNIQUE (vid))");

$sth = $dbh->prepare("SELECT * FROM fnavne");
$sth->execute;
$lastinsertsth = $dbh->prepare("SELECT DISTINCT LAST_INSERT_ID() FROM vaerker");
$stharv = $dbh->prepare("SELECT ord FROM keywords,keywords_relation WHERE keywords.id = keywords_relation.keywordid AND keywords_relation.otherid = ? AND keywords_relation.othertype = 'biografi'");
$sth2= $dbh->prepare("INSERT INTO vaerker (fhandle,fid,vhandle, titel,aar,type,findes,noter) VALUES (?,?,?,?,?,?,?,?)");
print "Antal forfattere: ".$sth->rows."\n";

while ($fn = $sth->fetchrow_hashref) {
    $fdir = "../fdirs/".$fn->{'fhandle'}."/";
    open(IN,$fdir."vaerker.txt");
    foreach (<IN>) {
	($vhandle,$titel,$aar,$type)=split(/=/,$_);
	next unless ($vhandle =~ /\S+/);
	if ($vhandle =~ /\S/) {
	    $type = 'v' unless ($type =~ /\S/);
	    $findes = (-e $fdir.$vhandle.".txt") ? 1 : 0;
	    $noter = '';
	    @keys = ();
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
		    } elsif (/^VK/) {
			s/^VK://;
			chop;
			push @keys,$_;
		    }
		}
		close(IN2);
	    }
	    chop($noter);
	    $sth2->execute($fn->{'fhandle'},$fn->{'fid'},$vhandle,$titel,$aar,
		    $type,$findes,$noter);
            $lastinsertsth->execute;
	    ($lastid) = $lastinsertsth->fetchrow_array;
	    foreach (@keys) {
		&insertkeywordrelation($_,$lastid,'vaerk');
	    }
	}
    }
    close(IN);
}

$sth->finish;
$sth = $dbh->prepare("SELECT count(*) FROM vaerker");
$sth->execute;
($c) = $sth->fetchrow_array;
print "Antal værker: $c\n";
$sth->finish;
$sth = $dbh->prepare("SELECT count(*) FROM vaerker WHERE type='p'");
$sth->execute;
($c) = $sth->fetchrow_array;
print "  heraf prosa: $c\n";
$sth->finish;

#
# Build digte
#
      

$rc = $dbh->do("drop table if exists digte");
$rc = $dbh->do("CREATE TABLE digte ( 
              did int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
              longdid char(40) NOT NULL,
              fid INT NOT NULL,
              vid INT NOT NULL,
              vaerkpos INT,
              titel text NOT NULL,
              foerstelinie text,
              underoverskrift text,
              indhold mediumtext,
	      haystack mediumtext,
              noter text,
              layouttype enum('prosa','digt') default 'digt',
              afsnit int,      /* 0 hvis ikke afsnitstitel, ellers H-level. */
              KEY longdid_indeks (longdid(10)),
              UNIQUE (did,longdid))
	      TYPE = MYISAM
	      ");
#
# vaerkpos er digtets position i samlingen.
# afsnit i digtsamliner betegnes med afsnit=1. Afsnittets titel ligger i titel.
#
$stharv = $dbh->prepare("SELECT ord FROM keywords,keywords_relation WHERE keywords.id = keywords_relation.keywordid AND keywords_relation.otherid = ? AND keywords_relation.othertype = 'vaerk'");
$lastinsertsth = $dbh->prepare("SELECT DISTINCT LAST_INSERT_ID() FROM digte");
$sth = $dbh->prepare("SELECT * FROM vaerker WHERE findes=1");
$sthafs = $dbh->prepare("INSERT INTO digte (fid,vid,titel,vaerkpos,afsnit) VALUES (?,?,?,?,?)");
$sthkdigt = $dbh->prepare("INSERT INTO digte (longdid,fid,vid,vaerkpos,titel,foerstelinie,underoverskrift,indhold,noter,afsnit,layouttype,haystack) VALUES (?,?,?,?,?,?,?,?,?,0,?,?)");
$sth->execute;
print "  Ikke tomme: ".$sth->rows."\n";

my $counterMax = $sth->rows;
my $counter = 1;
while ($v = $sth->fetchrow_hashref) {
    print sprintf("[%3d/%3d]",$counter++,$counterMax);
    print ' '.$v->{'titel'}."\n";
    $fdir = "../fdirs/".$v->{'fhandle'}."/";
    open(IN,$fdir.$v->{'vhandle'}.".txt") || die "Argh! ".$fdir.$v->{'vhandle'}.'.txt ikke fundet!';
    $i=0;
    $first = 1;
    $noter = $under = $indhold = '';
    @arvedekeys = ();
    # Nedarv keys fra værket
    $stharv->execute($v->{'vid'});
    while ($kewl = $stharv->fetchrow_array) {
	push @arvedekeys,$kewl;
    }
    @mykeys = @arvedekeys;
    while (<IN>) {
	chop;
	s/\r//;
	s/ $//g;
	next if (/^\#/);
	next if (/^VN:/);
	next if (/^VK:/);
	if (/^H(.):(.*)/) {
	    $level = $1;
	    $afsnitstitel = $2;
	    &insertdigt unless ($first);
	    @mykeys = @arvedekeys;
	    $first = 1; #fordi vi ikke kender næste digt ID
	    $sthafs->execute($v->{'fid'},$v->{'vid'},$afsnitstitel,$i,$level);
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
	} elsif (/^T:/) {
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
print "Antal digte: $count\n";
$sth->finish;


#
# Build forbogstaver
#

$rc = $dbh->do("drop table if exists forbogstaver");
$rc = $dbh->do("CREATE TABLE forbogstaver ( 
              bid int UNSIGNED DEFAULT '0' NOT NULL PRIMARY KEY auto_increment,
	      forbogstav char(2) NOT NULL,
	      did INT NOT NULL,
	      sprog char(2) NOT NULL,
	      type char(1) NOT NULL,   /* t eller f */
	      KEY forbogstav_key (forbogstav(2)), 
	      UNIQUE (bid))");
$sth = $dbh->prepare("SELECT foerstelinie,titel,did,sprog FROM digte D, fnavne F WHERE D.fid = F.fid AND afsnit=0 AND D.layouttype = 'digt' ORDER BY F.sprog");
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

	$sthk->execute(substr($f->{'sort'},0,1), $f->{'did'}, $f->{'sprog'},$mode);
    }
}

#$dbh->disconnect;

sub insertdigt {
    chop($noter);
    chop($under);
    $layouttype = 'prosa' if $v->{'type'} ne 'v' && $layouttype ne 'digt';
    print "$id er set før!\n" if ++$knownlongdids{$id} > 1;
    print "$id mangler førstelinie\n" if $firstline eq '' && $layouttype ne 'prosa';
    print "$id mangler titel\n" if $titel eq '';
    $indhold =~ s/\s+$//;
    $noter =~ s/[\n\s]+$//;
    $indhold =~ s/^\n+//m;
# Insæt hvad vi har.
    $haystack = Kalliope::Strings::stripHTML("$titel $under $indhold");

    $sthkdigt->execute($id,$v->{'fid'},$v->{'vid'},$i,$titel,$firstline,$under,$indhold,$noter,$layouttype || 'digt',$haystack);
    $i++;
    $layouttype = $noter = $under = $indhold = '';
    $firstline = '';
    $titel = '';
    $lastinsertsth->execute();	
    ($mymylastid) = $lastinsertsth->fetchrow_array;
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
	    print "Nøgleordet '$keyword' i $othertype:$ord er ukendt.\n";
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
	      hay text,
	      lang char(2) NOT NULL)");

my $sth_hay_ins = $dbh->prepare("INSERT INTO haystack (id,id_class,titel,hay,lang) VALUES (?,?,?,?,?)");

# Poems
print "Inserting poem hay\n";
my $sth = $dbh->prepare("SELECT did,indhold,underoverskrift,titel,sprog FROM digte AS d,fnavne AS f WHERE d.fid = f.fid AND d.afsnit = 0"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = Kalliope::Strings::stripHTML("$$h{titel} $$h{underoverskrift} $$h{indhold}");
    $sth_hay_ins->execute($$h{did},'Kalliope::Poem',$$h{titel},$hay,$$h{sprog});
}

# Persons
print "Inserting person hay\n";
my $sth = $dbh->prepare("SELECT fid,efternavn,fornavn,sprog FROM fnavne"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = "$$h{fornavn} $$h{efternavn}";
    $sth_hay_ins->execute($$h{fid},'Kalliope::Person',$hay,$hay,$$h{sprog});
}

# Works 
print "Inserting works hay\n";
my $sth = $dbh->prepare("SELECT vid,titel,sprog FROM fnavne,vaerker WHERE fnavne.fid = vaerker.fid"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = "$$h{titel}";
    $sth_hay_ins->execute($$h{vid},'Kalliope::Work',$hay,$hay,$$h{sprog});
}

# Keywords 
print "Inserting keyword hay\n";
my $sth = $dbh->prepare("SELECT id,titel,beskrivelse FROM keywords"); 
$sth->execute;
while ($h = $sth->fetchrow_hashref) {
    my $hay = Kalliope::Strings::stripHTML("$$h{titel} $$h{beskrivelse}");
    $sth_hay_ins->execute($$h{id},'Kalliope::Keyword',$$h{titel},$hay,'dk');
}

print "Creating FULLTEXT index...\n";
$dbh->do('CREATE FULLTEXT INDEX haystackidx ON haystack (titel,hay)');

