#!/usr/bin/perl

use Kalliope::Page::Feed;
use Kalliope::Poem;
use strict;

my $DAYS_TO_SHOW = 120;

my $link = 'http://www.kalliope.org/latest.cgi';

my $page = new Kalliope::Page::Feed(
	rss_feed_title => 'Kalliope - seneste tilføjelser',
	rss_feed_url => $link 
	);

my $dbh = Kalliope::DB->connect();
my @blocks;
my $i = -1;
my $lastDate = 0;
my $lastAuthor = '';
my $sth = $dbh->prepare("SELECT longdid,createtime FROM digte WHERE createtime >= ? ORDER BY createtime DESC");
$sth->execute(time - $DAYS_TO_SHOW*24*60*60);
my $count = $sth->rows;
while (my @h = $sth->fetchrow_array) {
    my ($longdid,$createdate) = @h;
    $i++ if $lastDate != $createdate;
    my $poem = new Kalliope::Poem (longdid => $longdid);
    my $authorName = $poem->author->name;
    if ($authorName ne $lastAuthor) {
	$blocks[$i]->{'descr'} .= $authorName.": ";
    }
    $blocks[$i]->{'descr'} .= "»".$poem->linkTitle."«, ";
    $blocks[$i]->{'count'}++;
    $blocks[$i]->{'createdate'} = $createdate;
    $lastDate = $createdate;
    $lastAuthor = $authorName;
}
for (my $j = 0; $j<=$i; $j++) {
    my $descr = $blocks[$j]->{'descr'};
    $descr =~ s/, $//;
    my $dateForDisplay = lc Kalliope::Date::longDate($blocks[$j]->{'createdate'});
    $page->addItem("Tilføjelser $dateForDisplay",
	           $link,$descr,
		   $blocks[$j]->{'createdate'});
}

$page->print;

