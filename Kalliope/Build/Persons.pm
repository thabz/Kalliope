
package Kalliope::Build::Persons;
    
use Kalliope::DB;
use XML::DOM;
require Unicode::String;
use strict;

my $dbh = Kalliope::DB::connect();

sub parse {
   my $filename = shift;
   my $parser = new XML::DOM::Parser;
   my $doc = $parser->parsefile($filename);
 
   my %persons;
   my $persons = $doc->getElementsByTagName('person');
   my $n = $persons->getLength;

   for (my $i = 0; $i < $n; $i++) {
       my $p;
       my $person = $persons->item($i);
       my $fhandle = $person->getAttributeNode('id')->getValue;
       $p->{'lang'} = $person->getAttributeNode('lang')->getValue;
       $p->{'type'} = $person->getAttributeNode('type')->getValue;

       if ($person->getElementsByTagName('firstname')->item(0)->getFirstChild) {
           my $firstname = Unicode::String::utf8($person->getElementsByTagName('firstname')->item(0)->getFirstChild->getNodeValue);
	   $p->{'firstname'} = $firstname->latin1;
       }

       if ($p->{'type'} ne 'collection') {
           my $lastname = Unicode::String::utf8($person->getElementsByTagName('lastname')->item(0)->getFirstChild->getNodeValue);
	   $p->{'lastname'} = $lastname->latin1;
	   $p->{'born'} = $person->getElementsByTagName('born')->item(0)->getFirstChild->getNodeValue;
	   $p->{'dead'} = $person->getElementsByTagName('dead')->item(0)->getFirstChild->getNodeValue;
       }

       $persons{$fhandle} = $p;
   }
   return %persons;
}

sub create {
    $dbh->do("DROP TABLE IF EXISTS fnavne");
    $dbh->do("CREATE TABLE fnavne ( 
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
}

sub insert {
    my %persons = @_;

    my %fhandle2fid;
    my $lastinsertsth = $dbh->prepare("SELECT DISTINCT LAST_INSERT_ID() FROM fnavne");
    my $rc = $dbh->prepare("INSERT INTO fnavne (fhandle,fornavn,efternavn,foedt,doed,sprog,cols,thumb,pics,biotext,bio,links,sekundaer,vaerker,vers,prosa) VALUES (?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?)");
    
    foreach my $fhandle (keys %persons) { 
	my $person = $persons{$fhandle};
	my $fdir = "../fdirs/$fhandle";

	my ($fcols,$fthumb,$pics,$fbio,$flinks,$fsekundaer,$fvaerker,$fprosa,$fvaerkerindhold);	
	my  $biotext = '';
	my  @keys = ();

	if (-e $fdir."/thumb.jpg") {
	    $fthumb=1;
	}
	
	my $fpics = 0;
	while (-e $fdir."/p".($fpics+1).".jpg") { $fpics++; };
	$fcols++ if ($fpics);
	
	if (-e $fdir."/bio.txt") {
	    open(BIO,$fdir."/bio.txt");
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
	
	if (-e $fdir."/links.txt") {
	    $flinks=1;
	    $fcols++;
	}
	
	if (-e $fdir."/sekundaer.txt") {
	    $fsekundaer=1;
	    $fcols++;
	}
	
	if (-e $fdir."/vaerker.txt") {
	    $fvaerker=1;
            # Undersøg om der er indhold i disse vaerker.
	    open (FILE,$fdir."/vaerker.txt");
	    foreach (<FILE>) {
		my ($vhandle,$titel,$vaar,$type) = split(/=/,$_);
		if ($type eq "p") {
		    $fprosa = 1;
		} elsif (-e $fdir."/".$vhandle.".txt") {
		    $fvaerkerindhold = 1;
		}
	    }
	    $fcols+=2;
	}   

        $rc->execute($fhandle,$person->{'firstname'},$person->{'lastname'},$person->{'born'},$person->{'dead'},$person->{'lang'},$fcols,$fthumb,$fpics,$biotext,$fbio,$flinks,$fsekundaer,$fvaerkerindhold,$fvaerker,$fprosa);
	$lastinsertsth->execute();
	my ($lastid) = $lastinsertsth->fetchrow_array;
        $fhandle2fid{$fhandle} = $lastid;
	foreach (@keys) {
#	    &insertkeywordrelation($_,$lastid,'biografi');
	}
    }
    return %fhandle2fid;
}

