#!/usr/bin/perl -w
use CGI qw /:standard/;
use Kalliope;
use Web;
use strict;
do 'kstdhead.pl';

my $LA = url_param('sprog');

&kheaderHTML("Kalliope - Nøgleord",$LA);

&kcenterpageheader("Nøgleord");

my @blocks= ();
my $idx;
my $sth = $dbh->prepare("SELECT id,titel FROM keywords ORDER BY titel");
$sth->execute ();
while (my $h = $sth->fetchrow_hashref) {
    $idx = (ord lc substr($h->{'titel'},0,1)) - ord('a');
    $blocks[$idx]->{'head'} = '<DIV CLASS=listeoverskrifter>'.uc (chr $idx + ord('a')).'</DIV><BR>';
    $blocks[$idx]->{'count'}++;
    $blocks[$idx]->{'body'} .= '<A HREF="keyword.cgi?keywordid='.$h->{'id'}.'&sprog='.$LA.'">'.$h->{'titel'}.'</A><BR>';
}
beginwhitebox('Nøgleord',"75%","left");
Kalliope::doublecolumn(\@blocks);
endbox();

&kfooterHTML;
