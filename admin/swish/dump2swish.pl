#!/usr/bin/perl -w

use strict;
use lib '..';

use Kalliope::DB;

my $lang = $ARGV[0];
my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT longdid,fhandle,linktitel,indhold,lang FROM digte WHERE lang = ?");
my $sthkeywords = $dbh->prepare("SELECT keyword FROM textxkeyword WHERE longdid = ?");
$sth->execute($lang);

while (my $h = $sth->fetchrow_hashref) {
    next unless $h->{'longdid'};
    $sthkeywords->execute($$h{longdid});
    my @words;
    while (my ($w) = $sthkeywords->fetchrow_array) {
        push @words,$w;
    }
    $h->{'keywords'} = join ' ',@words;
    my $content = html($h);
    my $size = length $content;

    print "Path-Name: ".$h->{'longdid'}."\n"; 
    print "Content-Length: $size\n"; 
    print "Last-Mtime: ".time."\n";
    print "Document-Type: HTML*\n\n";
    print $content;
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
