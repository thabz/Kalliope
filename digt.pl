#!/usr/bin/perl -w

#  Copyright (C) 1999-2001 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$

#use strict;
use Kalliope;
use Kalliope::Poem;
use Kalliope::Help;
use Net::SMTP;
use CGI qw(:standard);
do 'fstdhead.pl';

my $MAILTAINER_EMAIL = 'jesper@kalliope.org';

my ($longdid,$fhandle,$LA);

if (defined param('longdid')) {
    $longdid = param('longdid');
    my $sth = $dbh->prepare("SELECT fhandle,sprog FROM digte,fnavne WHERE
                             digte.fid = fnavne.fid AND digte.longdid = ?");
    $sth->execute($longdid);
    ($fhandle,$LA) = $sth->fetchrow_array;
} else {
    @ARGV = split(/\?/,$ARGV[0]);
    if ($ARGV[3] eq '') {
	chop($ARGV[0]); 
	chop($ARGV[1]);
	chomp($ARGV[2]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[1];
	$LA=$ARGV[2];
    } elsif ($ARGV[4] =~ /(dk|uk|fr|de)/) {
	chop($ARGV[0]); 
	chop($ARGV[3]);
	chomp($ARGV[4]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[3];
	$LA=$ARGV[4];
    } else {
	chop($ARGV[0]); 
	chomp($ARGV[3]);
	$fhandle=$ARGV[0];
	$longdid=$ARGV[3];
	$LA='dk';
	}
}



fheaderHTML($fhandle);

# Find detaljer om dette digt.
($did,$dnoter,$vtitel,$vaar,$vhandle,$vid) = $dbh->selectrow_array("SELECT D.did, D.noter, V.titel, aar, vhandle, D.vid FROM digte D, vaerker V WHERE D.longdid = '$longdid' AND V.vid = D.vid");

my $poem = new Kalliope::Poem ('longdid' => $longdid);
$poem->updateHitCounter;
my $author = $poem->author;
my $work = $poem->work;

if (defined param('korrektur')) {
   my $mailBody = 'Dato:       '.localtime(time)."\n";
     $mailBody .= 'Remotehost: '.remote_host()."\n";
     $mailBody .= 'Forfatter:  '.$author->name."\n";
     $mailBody .= 'Fhandle:    '.$author->fhandle."\n";
     $mailBody .= 'Værk:       '.$work->title.' '.$work->parenthesizedYear."\n";
     $mailBody .= 'Værk-id:    '.$vhandle."\n";
     $mailBody .= 'Digt:       '.$poem->title."\n";
     $mailBody .= "Digt-id:    $longdid\n";
     $mailBody .= 'Korrektur:  '.param('korrektur')."\n";
   my $smtp = Net::SMTP->new('localhost') || last;
   $smtp->mail($MAILTAINER_EMAIL);
   $smtp->to($MAILTAINER_EMAIL);
   $smtp->data("From: Kalliope <$MAILTAINER_EMAIL>\r\n".
               "To: $MAILTAINER_EMAIL\r\n".
               "Subject: Korrektur $longdid\r\n".
               "\r\n".$mailBody."\r\n");
   $smtp->quit;
   print STDERR $mailBody;
}

print '<TABLE ALIGN=center><TR><TD width="100%" VALIGN=top>';

#Begynd kasse til selve digtet.
my $align = $poem->isProse ? 'justify' : 'left';
beginwhitebox('','',$align);
print '<SPAN CLASS="digtoverskrift"><I>'.$poem->title."</I></SPAN><BR>";
print '<SPAN CLASS="digtunderoverskrift">'.$poem->subtitle.'</SPAN><BR>' if $poem->subtitle;
print '<BR>';
print $poem->content;
endbox();

#Næste kolonne
print '</TD><TD WIDTH="100%" VALIGN=top>';

begindarkbluebox();

#Udskriv noter & nøgleord
$sth = $dbh->prepare("SELECT titel,id,ord FROM keywords,keywords_relation WHERE keywords_relation.otherid = ? AND keywords.id = keywords_relation.keywordid AND keywords_relation.othertype = 'digt'");
$sth->execute($did);

if ($dnoter || $sth->rows>0) {
    beginwhitebox("Noter","200","left");
    if ($dnoter) {
	foreach $line (split /\n/,$dnoter) {
	    print '<IMG ALIGN="left" SRC="gfx/clip.gif" BORDER=0 ALT="Note til »'.$poem->title.'«">';
	    Kalliope::buildhrefs(\$line);
	    print $line;
	    print "<BR><BR>";
	};
    }
    if ($sth->rows) {
	$keyhtml = '<B>Nøgleord:</B> ';
	while ($h = $sth->fetchrow_hashref) {
	    $keyhtml .= '<A CLASS=green HREF="keyword.cgi?keywordid='.$h->{'id'}.'&sprog='.$LA.'">'.$h->{'titel'}.'</A>, ';
	}
	$keyhtml =~ s/, $/./;
	print $keyhtml;
    }
    endbox();
    print "<br>";
}


#Udskriv indholdsfortegnelse for dette værk

$myvaar = ($vaar eq "\?") ? "" : " (".$vaar.")";
beginwhitebox("Indhold","200","left");
print '<FONT SIZE="-1">';

#Udskriv indholdsfortegnelse
$sth = $dbh->prepare("SELECT longdid,titel,afsnit,did FROM digte WHERE vid=? ORDER BY vaerkpos");
$sth->execute($vid);
while($d = $sth->fetchrow_hashref) {
    if ($d->{'afsnit'} && !($d->{'titel'} =~ /^\s*$/)) {
	print '<BR><FONT SIZE="+1"><I>'.$d->{'titel'}."</I></FONT><BR>";
    } else {
	print "&nbsp;" x 4;
	if ($d->{'longdid'} eq $longdid) {
	    print $d->{'titel'} = "<B>".$d->{'titel'}."</B><BR>";
	} else {
	    print "<A HREF=\"digt.pl?longdid=".$d->{'longdid'}."\">";
	    print $d->{'titel'}."</A><BR>";
	}
    }
}
$sth->finish;
print "</font>";
endbox(qq(<A HREF="vaerktoc.pl?$fhandle?$vhandle?$LA"><IMG VALIGN=center ALIGN=left SRC="gfx/leftarrow.gif" BORDER=0 TITLE="$vtitel $myvaar" ALT="$vtitel $myvaar"></A>));

beginwhitebox('Korrektur','200','left');
if (defined param('korrektur')) {
    print "<SMALL>Tak for din rettelse til »".$poem->title."«! <BR><BR>En mail er automatisk sendt til $MAILTAINER_EMAIL, som vil kigge på sagen.</SMALL>\n";
} else {
    print "<SMALL>Fandt du en trykfejl i denne tekst, skriv da rettelsen i feltet herunder, og tryk Send</SMALL><BR><BR>";
    print '<FORM><TEXTAREA NAME="korrektur" WRAP="virtual" ROWS=4></TEXTAREA>';
    print qq|<INPUT TYPE="hidden" NAME="longdid" VALUE="$longdid">|;
    print '<INPUT TYPE="submit" VALUE="Send"> ';
    print Kalliope::Help->new('korrektur')->linkAsHTML;
    print "</FORM>";
}
endbox();

enddarkbluebox();

#Afslut kolonne-tabellen (digt,note)
print "</TD></TR></TABLE>";


$forfatterekstramenu{'titel'} = 'Formater';
$forfatterekstramenu{'indhold'} = "<A HREF=\"digtprinter.pl?$fhandle?$longdid?$LA\"><IMG SRC=\"gfxold/gfx/printer.gif\" BORDER=0 ALT=\"Vis dette digt opsat på en side lige til at printe ud.\"></A><BR>Printer venligt<BR>";


ffooterHTML();
