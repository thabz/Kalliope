#!/usr/bin/perl -w

use strict;
use Kalliope;
use Web;
do 'dk_sort.pl';

my $LA = $ARGV[0];
$0 =~ /\/([^\/]*)$/;
&kheaderHTML("Digtere",$LA,$1.'?');

#Indlæs alle navnene
my $sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt != '' ORDER BY efternavn, fornavn");
$sth->execute($LA);
my $i=0;
my @f;
while ($f[$i] = $sth->fetchrow_hashref) { 
    $f[$i]->{'sort'} = $f[$i]->{'efternavn'};
    $i++; 
}

my $last = "";
my @blocks;
my $bi = -1;
my $new;
my $f;
foreach $f (sort dk_sort2 @f) {
    next unless $f->{'sort'};
    $f->{'sort'} =~ s/Aa/Å/g;
    $new = uc substr($f->{'sort'},0,1);
    if ($new ne $last) {
	$last=$new;
	$bi++;
	$blocks[$bi]->{'head'} = "<DIV CLASS=listeoverskrifter>$new</DIV><BR>";
    }
    $blocks[$bi]->{'body'} .= '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'efternavn'}.", ".$f->{'fornavn'}.' <FONT COLOR="#808080">('.$f->{'foedt'}."-".$f->{'doed'}.')</FONT></A><BR>';
    $blocks[$bi]->{'count'}++;
}

# Udenfor kategori (dvs. folkeviser, o.l.)
$bi++;
$sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt='' ORDER BY fornavn");
$sth->execute($LA);
if ($sth->rows) {
    $blocks[$bi]->{'head'} = qq|<BR><DIV CLASS="listeoverskrifter">Ukendt digter</DIV><BR>|;
    while ($f = $sth->fetchrow_hashref) {
	$blocks[$bi]->{'body'} .= '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'fornavn'}.'</A><BR>';
	$blocks[$bi]->{'count'}++;
    }
}

beginwhitebox("Digtere efter navn","","left");
Kalliope::doublecolumn(\@blocks);
endbox();

&kfooterHTML;
