#!/usr/bin/perl

#Udskriver alle titel-linier for en forfatter.
#Kan hurtigt ændres til kun at udskrive titel-linier for en bestemt værk også.
use Kalliope;

do 'fstdhead.pl';
do 'dk_sort.pl';

@ARGV = split(/\?/,$ARGV[0]);

$fhandle = $ARGV[0];
$mode = $ARGV[1];
$LA = $ARGV[2];

chop($fhandle);
chop($mode);
chomp($LA);
fheaderHTML($fhandle);

do 'fstdhead.ovs';

print "<BR>\n";


$sth = $dbh->prepare("SELECT longdid, digte.titel, digte.foerstelinie FROM digte, vaerker WHERE digte.fid=? AND digte.vid = vaerker.vid AND vaerker.type = 'v' AND afsnit=0");
$sth->execute($fid);
$i=0;
while ($f[$i] = $sth->fetchrow_hashref) { 
    if ($mode == 1) {
	$f[$i]->{'sort'} = $f[$i]->{'titel'};
    } else {
	$f[$i]->{'sort'} = $f[$i]->{'foerstelinie'};
    }
    $i++; 
}

my $last="";
my $body;
my $antal = 0;
my @blocks = ();
foreach $f (sort dk_sort2 @f) {
    next unless $f->{'sort'};
    $line =  $mode == 1 ? $f->{'titel'} : $f->{'foerstelinie'};
    $linefix = $line;
    $linefix =~ s/^Aa/Å/ig;
    $idx = (ord lc substr($linefix,0,1)) - ord('a');
    $blocks[$idx]->{'head'} = '<SPAN CLASS=listeoverskrifter>'.uc (chr $idx + ord('a')).'</SPAN><BR>';
    $blocks[$idx]->{'count'}++;
    $blocks[$idx]->{'body'} .= '<A HREF="digt.pl?longdid='.$f->{'longdid'}.'">'.$line.'</A><BR>';
}
#
# Udskriv boks
#

if ($mode == 1) {
    beginwhitebox("Digttitler","","left");
} else {
    beginwhitebox("Førstelinier","","left");
}
Kalliope::doublecolumn(\@blocks);
endbox();

ffooterHTML();
