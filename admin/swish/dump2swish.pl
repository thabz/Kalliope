#!/usr/bin/perl -w

use strict;
use lib '..';
use Kalliope::DB;

my $dbh = Kalliope::DB::connect();

mkdir "dump" unless -e "dump";
&dumpworks();
&dumptexts();
exit;


sub dumptexts {
    my $sth = $dbh->prepare("SELECT longdid as id,fhandle,linktitel as titel,indhold,lang FROM digte WHERE longdid IS NOT NULL AND linktitel IS NOT NULL");
    my $sthkeywords = $dbh->prepare("SELECT keyword FROM textxkeyword WHERE longdid = ?");
    $sth->execute();

    while (my $h = $sth->fetchrow_hashref) {
	my $longdid = $h->{'id'};
	next unless defined $longdid;
	$$h{type} = 'Poem';
	$sthkeywords->execute($longdid);
	my @words;
	while (my ($w) = $sthkeywords->fetchrow_array) {
	    push @words,$w;
	}
	$h->{'keywords'} = join ' ',@words;
	&savehtml($h,$longdid);
    }
}

sub dumpworks {
    my $sth = $dbh->prepare("SELECT vid as id,fhandle,titel,lang,underoverskrift FROM vaerker");
    my $sthkeywords = $dbh->prepare("SELECT keyword FROM workxkeyword WHERE vid = ?");
    $sth->execute();

    while (my $h = $sth->fetchrow_hashref) {
	$$h{type} = 'Work';
	$$h{indhold} = qq|<h1>$$h{titel}</h1>|;
	$$h{indhold} .= qq|<h2>$$h{underoverskrift}</h2>|;
	my $filename = $$h{id};
	$filename =~ s!/!:!;
	$sthkeywords->execute($$h{id});
	my @words;
	while (my ($w) = $sthkeywords->fetchrow_array) {
	    push @words,$w;
	}
	$h->{'keywords'} = join ' ',@words;
	&savehtml($h,$filename);
    }
}

sub savehtml {
    my ($h,$filename) = @_;
    my $HTML = qq(
	<html>
	<head>
	<title>$$h{titel}</title>
	<meta name="fhandle" content="$$h{fhandle}">
	<meta name="keyword" content="$$h{keywords}">
	<meta name="lang" content="$$h{lang}">
	<meta name="type" content="$$h{type}">
	</head>
	<body>
	$$h{indhold}
        </body>
        </html>);
    
    open (OUTPUT,">dump/$filename.html");
    print OUTPUT $HTML;
    close OUTPUT;
}
