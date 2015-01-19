#!/usr/bin/perl

# Monitoring page for pingdom.com

use Kalliope::Page::Feed;
use Kalliope::Poem;
use Time::HiRes qw(gettimeofday tv_interval);
use strict;
use utf8;

my $t0 = [gettimeofday];

my $dbh = Kalliope::DB->connect();
my $limit = "LIMIT 10";
my $sth = $dbh->prepare("SELECT entry, pubdate FROM news ORDER BY pubdate DESC $limit");
$sth->execute;

my $elapsed = tv_interval($t0);
my $elapsed_string = sprintf("%.3f", $elapsed);

print CGI::header(-type => 'text/xml');
print <<EOF;
<?xml version="1.0" encoding="UTF-8" ?>
<pingdom_http_custom_check>
    <status>OK</status>
    <response_time>$elapsed_string</response_time>
</pingdom_http_custom_check>
EOF
