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

use Kalliope;
use Kalliope::Poem;
use Kalliope::Page;
use Kalliope::Help;
use Net::SMTP;
use CGI qw(:standard);
use strict;

my $dbh = Kalliope::DB->connect;

my $MAILTAINER_EMAIL = 'jesper@kalliope.org';

my $poem;
if (url_param('longdid')) {
    $poem = new Kalliope::Poem ('longdid' => url_param('longdid'));
} elsif (url_param('did')) {
    $poem = new Kalliope::Poem (did => url_param('did'));
} else {
    Kalliope::Page::notFound();
}

my $needle = url_param('needle') || '';
my $biblemark = url_param('biblemark') || '';

$poem->updateHitCounter;
my $poet = $poem->author;
my $work = $poem->work;
my $LA = 'dk';
my ($longdid,$fhandle,$vhandle) = ($poem->longdid,$poet->fhandle,$work->longvid);

#
# Breadcrumbs -----------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Værker','fvaerker.pl?fhandle='.$poet->fhandle];
push @crumbs,[$work->titleWithYear,'vaerktoc.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->vhandle];
push @crumbs,[$poem->title,'digt.pl?longdid='.$poem->longdid];

my $page = newAuthor Kalliope::Page ( poet => $poet,
                                      page => 'vaerker',
				      extrawindowtitle => $poem->title,
                                      crumbs => \@crumbs);

if (defined param('korrektur')) {
    my $mailBody = 'Dato:       '.localtime(time)."\n";
    $mailBody .= 'Remotehost: '.remote_host()."\n";
    $mailBody .= 'Forfatter:  '.$poet->name."\n";
    $mailBody .= 'Fhandle:    '.$poet->fhandle."\n";
    $mailBody .= 'Værk:       '.$work->title.' '.$work->parenthesizedYear."\n";
    $mailBody .= 'Værk-id:    '.$work->longvid."\n";
    $mailBody .= 'Digt:       '.$poem->title."\n";
    $mailBody .= 'Digt-id:    '.$poem->longdid."\n";
    $mailBody .= 'Korrektur:  '.param('korrektur')."\n";
    my $smtp = Net::SMTP->new('localhost') || last;
    $smtp->mail($MAILTAINER_EMAIL);
    $smtp->to($MAILTAINER_EMAIL);
    $smtp->data("From: Kalliope <$MAILTAINER_EMAIL>\r\n".
	    "To: $MAILTAINER_EMAIL\r\n".
	    "Subject: Korrektur $longdid\r\n".
	    "\r\n".$mailBody."\r\n");
    $smtp->quit;
}

if (defined param('newkeywords')) {
    $poem->addToKeyPool(param('newkeywords'));
}

$page->addBox( width => '100%',
	       coloumn => 1,
               align => $poem->isProse ? 'justify' : 'left',
	       content => &poem($poem,$needle,$biblemark) );

my @keywords = $poem->keywords;

if ($poem->notes || $#keywords >= 0) {
    $page->addBox( width => '200',
	           coloumn => 2,
		   theme => 'note',
#                   title => 'Noter',
	           content => &notes($poem,@keywords) );
}


if ($poem->footnotes) { 
    $page->addBox( width => '200',
	           coloumn => 2,
		   theme => 'dark',
                   title => 'Fodnoter',
	           content => &footnotes($poem) );

}

if (&xrefs($poem)) { 
    $page->addBox( width => '200',
	           coloumn => 2,
		   theme => 'dark',
                   title => 'Henvisninger hertil',
	           content => &xrefs($poem) );
}

if ($poem->hasPics) { 
    $page->addBox( width => '200',
	           coloumn => 2,
		   theme => 'dark',
                   title => 'Billeder',
	           content => &pics($poem) );

}

#$page->addBox( width => '200',
#               coloumn => 2,
#	       theme => 'dark',
#               title => 'Nøgleord',
#               content => &keywords($poem) );



my $workTitle = $work->titleWithYear;

$page->addBox( width =>'150',
	       coloumn => 0,
               title => 'Indhold',
	       theme => 'dark',
	       content => &tableOfContents($work),
	       end => qq|<A HREF="vaerktoc.pl?fhandle=$fhandle&vhandle=$vhandle"><IMG VALIGN=center ALIGN=left SRC="gfx/leftarrow.gif" BORDER=0 TITLE="$workTitle" ALT="$workTitle"></A>|
	     );

$page->addBox( width => '100%',
	       coloumn => 2,
		   theme => 'dark',
	       content => &korrekturFelt($poem) );

$page->print;

#
# Boxes
#

sub poem {
    my ($poem,$needle,$biblemark) = @_;
    my $HTML;
    $HTML .= '<SPAN CLASS="digtoverskrift"><I>'.$poem->title."</I></SPAN><BR>";
    $HTML .= '<SPAN CLASS="digtunderoverskrift">'.$poem->subtitle.'</SPAN><BR>' if $poem->subtitleAsHTML;
    $HTML .= '<BR>';
    $HTML .= $poem->content;
    $HTML =~ s/<footmark id="footnote([^"]+)"\/>/<A CLASS="green" NAME="footnotemark$1" HREF="#footnotedesc$1"><sup>$1<\/sup><\/A>/gsi;
    $HTML =~ s/<footmark&nbsp;id="footnote([^"]+)"\/>/<A CLASS="green" NAME="footnotemark$1" HREF="#footnotedesc$1"><sup><span style="font-size: 9px">$1<\/span><\/sup><\/A>/gsi;
    if ($needle) {
	$needle =~ s/^\s+//;
	$needle =~ s/\s+$//;
	$needle =~ s/[^a-zA-ZäëöáéíúæøåÆØÅ ]//g;
	my @needle = split /\s+/,$needle;
	my $split1 = time+10043;
	my $split2 = time+10045;
	my $block1 = '<SPAN STYLE="background-color: #f0f080">';
	my $block2 = '</SPAN>';
	my $anchor = '<A NAME="offset">';
	foreach my $ne (@needle) {
	    $HTML =~ s/($ne)/$split1$1$split2/gi
        }
	$HTML =~ s/$split1/$anchor$split1/;
	$HTML =~ s/$split1/$block1/g;
	$HTML =~ s/$split2/$block2/g;
    }
    if ($biblemark) {
       my ($begin,$end) = split /-/,$biblemark;
       $end = $begin unless $end;
       $end++;
       print STDERR "** $begin - $end **\n";
       $HTML =~ s/(&nbsp;$begin\.\s+)/<A NAME="biblemark"><\/A><DIV CLASS="biblemark">$1/s;
       if ($HTML =~ /&nbsp;$end\.\s+/) {
	   $HTML =~ s/(&nbsp;$end\.\s+)/<\/DIV>$1/s;
       } else {
           $HTML = "$HTML</DIV>";
       }
    }
    return $HTML;
}

sub footnotes {
    my $poem = shift;
    my @notes = $poem->footnotes;
    my $i = 1;
    my $HTML = '<TABLE WIDTH="100%">';
    foreach my $note (@notes) {
       Kalliope::buildhrefs(\$note);
       
       $HTML .= qq|<TR><TD  VALIGN="top"><A STYLE="font-size: 12px" CLASS="green" NAME="footnotedesc$i" HREF="#footnotemark$i">$i.</A></TD><TD STYLE="font-size: 12px">$note</TD></TR>|;
       $i++;
    }
    $HTML .= '</TABLE>';
    return $HTML;
}

sub keywords {
    my ($poem) = @_;
    my @keywords = $poem->getKeyPool;
    my $HTML;
    $HTML .= '<SPAN STYLE="font-size: 12px">';
    if ($#keywords >= 0) {
	foreach my $word (@keywords) {
	    $HTML .= "$word, "
	}
	$HTML =~ s/, $//;
    } else {
        $HTML .= 'Dette digt har endnu ingen nøgleord tilknyttet.';
    }
    my $longdid = $poem->longdid;
    $HTML .= qq|<br><BR>Tilføj nøgleord<BR><FORM METHOD="get"><INPUT TYPE="text" CLASS="inputtext" NAME="newkeywords"><INPUT TYPE="hidden" NAME="longdid" VALUE="$longdid"><INPUT TYPE="submit" CLASS="button" VALUE="Tilføj"> |;
    $HTML .= Kalliope::Help->new('keywordadd')->linkAsHTML;
    $HTML .= '</FORM>';
    $HTML .= '</SPAN>';
    return $HTML;
}

sub tableOfContents {
    my $work = shift;
    my $HTML;

    $HTML .= '<SPAN STYLE="font-size: 12px">';
    my $sth = $dbh->prepare("SELECT longdid,toctitel as titel,afsnit,did FROM digte WHERE vid=? ORDER BY vaerkpos");
    $sth->execute($work->vid);
    while(my $d = $sth->fetchrow_hashref) {
	if ($d->{'afsnit'} && !($d->{'titel'} =~ /^\s*$/)) {
	    $HTML .= '<BR><FONT SIZE="+1"><I>'.$d->{'titel'}."</I></FONT><BR>";
	} else {
            $HTML .= '<SPAN CLASS="listeblue">&#149;</SPAN>&nbsp;' if $d->{'titel'};
	    if ($d->{'longdid'} eq $longdid) {
		$HTML .= $d->{'titel'} = '<span class="blue">'.$d->{'titel'}."</span><BR>";
	    } else {
		$HTML .= "<A HREF=\"digt.pl?longdid=".$d->{'longdid'}."\">";
		$HTML .= $d->{'titel'}."</A><BR>";
	    }
	}
    }
    $sth->finish;
    $HTML .= "</SPAN>";
    return $HTML;
}

sub otherFormats {
    my ($poet,$poem) = @_;
    my ($longdid,$fhandle) = ($poem->longdid,$poet->fhandle);
    return qq|<A HREF="digtprinter.pl?fhandle=$fhandle&longdid=$longdid"><IMG SRC="gfxold/gfx/printer.gif" BORDER=0 ALT="Vis dette digt opsat på en side lige til at printe ud."></A><BR>Printer venligt<BR>|;
}

sub korrekturFelt {
    my $poem = shift;
    my $HTML;
    if (defined param('korrektur')) {
	$HTML .= "<SMALL>Tak for din rettelse til »".$poem->title."«! <BR><BR>En mail er automatisk sendt til $MAILTAINER_EMAIL, som vil kigge på sagen.</SMALL>\n";
    } else {
        my $longdid = $poem->longdid;
	$HTML .= "<SMALL>Fandt du en trykfejl i denne tekst, skriv da rettelsen i feltet herunder, og tryk Send</SMALL><BR><BR>";
	$HTML .= '<FORM><TEXTAREA CLASS="inputtext" NAME="korrektur" WRAP="virtual" COLS=14 ROWS=4></TEXTAREA><BR>';
	$HTML .= qq|<INPUT TYPE="hidden" NAME="longdid" VALUE="$longdid">|;
	$HTML .= '<INPUT CLASS="button" TYPE="submit" VALUE="Send"> ';
	$HTML .= Kalliope::Help->new('korrektur')->linkAsHTML;
	$HTML .= "</FORM>";
    }
    return $HTML;
}

sub xrefs {
    my $poem = shift;
    my @xrefs = $poem->xrefsTo;
    my $HTML;
    foreach my $otherPoem (@xrefs) {
        $HTML .= $otherPoem->clickableTitle.'<br><br>';
    }
    $HTML = qq|<span style="font-size: 12px">$HTML</span>| if $HTML;
    return $HTML;
}

sub notes {
    my ($poem,@keywords) = @_;
    my $HTML = '<span style="font-size: 12px">';
    if ($poem->notes) {
        my @notes = split /\n/,$poem->notes;
	@notes = map { Kalliope::buildhrefs(\$_) } @notes;
	$HTML .= join '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>',@notes;
    }
    if ($#keywords >= 0) {
	$HTML .= '<br><br><B>Nøgleord:</B> ';
        $HTML .= join ', ', map { $_->clickableTitle($LA) } @keywords;
    }
    $HTML .= "</span>";

    # Quality
#    $HTML .= '<br><br><b>Tillid:</b> '.$poem->quality->asHTML;
    $HTML .= '<br><br>'.$poem->quality->asHTML;
    return $HTML;
}

sub pics {
    my $work = shift;
    my $HTML = '<center><small>';
    my @pics = $work->pics;
    foreach my $pic (@pics) {
        $HTML .= Kalliope::Web::insertThumb($pic);
	$HTML .= '<br>';
	$HTML .= $pic->{'description'};
	$HTML .= '<br>';
	$HTML .= '<br>';
    }
    $HTML .= '</small></center>';
    return $HTML;
}

