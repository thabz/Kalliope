#!/usr/bin/perl -w

use strict;
use lib '..';

use Kalliope::DB;

my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT longdid,fhandle,linktitel,indhold,lang FROM digte WHERE longdid IS NOT NULL AND linktitel IS NOT NULL");
my $sthkeywords = $dbh->prepare("SELECT keyword FROM textxkeyword WHERE longdid = ?");
$sth->execute();

mkdir "dump" unless -e "dump";
while (my $h = $sth->fetchrow_hashref) {
    my $longdid = $h->{'longdid'};
    next unless defined $longdid;
    $sthkeywords->execute($longdid);
    my @words;
    while (my ($w) = $sthkeywords->fetchrow_array) {
        push @words,$w;
    }
    $h->{'keywords'} = join ' ',@words;
    open (OUTPUT,">dump/$longdid.html");
    print OUTPUT html($h);
    close OUTPUT;
}

sub html {
    my $h = shift;
    return <<"EOF"
<html>
<head>
<title>$$h{linktitel}</title>
<meta name="fhandle" content="$$h{fhandle}">
<meta name="keyword" content="$$h{keywords}">
<meta name="lang" content="$$h{lang}">
</head>
<body>
$$h{indhold}
</body>
</html>	
EOF
}
