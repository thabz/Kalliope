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
use Kalliope::PoemHome;
use Kalliope::Page;
use Kalliope::Help;
use CGI qw(:standard);
use strict;

my $dbh = Kalliope::DB->connect;

my $poem;
if (url_param('longdid')) {
    $poem = new Kalliope::Poem ('longdid' => url_param('longdid'));
} elsif (url_param('did')) {
    $poem = new Kalliope::Poem (did => url_param('did'));
} else {
    Kalliope::Page::notFound();
}

Kalliope::Page::notFound() unless $poem;

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
push @crumbs,['Digtere','poets.cgi?list=az&amp;sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Værker','fvaerker.pl?fhandle='.$poet->fhandle];
push @crumbs,[$work->titleWithYear,'vaerktoc.pl?fhandle='.$poet->fhandle.'&amp;vhandle='.$work->vhandle];
push @crumbs,[$poem->linkTitle,''];

my $page = newAuthor Kalliope::Page ( poet => $poet,
				      printer => url_param('printer') || 0,
                                      page => 'vaerker',
				      extrawindowtitle => $poem->linkTitle,
                                      crumbs => \@crumbs);


if (defined param('newkeywords')) {
    $poem->addToKeyPool(param('newkeywords'));
}

$page->addBox( width => $poem->isProse ? '' : '10',
	       coloumn => 1,
	       align => $poem->isProse ? 'justify' : 'left',
	       printer => 1,
	       theme => 'book',
	       content => &poem($poem,$needle,$biblemark).'<br><br>' );


if ($poem->hasPics) { 
    $page->addBox( width => '250',
	           coloumn => 2,
		   theme => 'dark',
	           content => &pics($poem) );
}

my @keywords = $poem->keywords;
my @notes = $poem->notes;
if ($#notes >= 0 || $#keywords >= 0) {
    $page->addBox( width => '250',
	           printer => 1,
		   printtitle => 'Noter',
	           coloumn => 2,
		   theme => 'dark',
	           content => &notes($poem,@keywords) );
}

$page->addBox( width => '250',
               printer => 0,
               coloumn => 2,
  	       theme => 'dark',
	       content => &quality($poem) );

if ($poem->footnotes) { 
    $page->addBox( width => '250',
	           coloumn => 2,
	           printer => 1,
		   theme => 'dark',
                   title => 'Fodnoter',
	           content => &footnotes($poem) );

}

if ($poem->hasLineNotes) {
    $page->addBox( width => '250',
	           coloumn => 2,
	           printer => 1,
		   theme => 'dark',
                   title => 'Fodnoter',
	           content => &linenotes($poem) );
}

if (&xrefs($poem)) { 
    $page->addBox( width => '250',
	           coloumn => 2,
		   theme => 'dark',
                   title => 'Henvisninger hertil',
	           content => &xrefs($poem) );
}


#$page->addBox( width => '200',
#               coloumn => 2,
#	       theme => 'dark',
#               title => 'Nøgleord',
#               content => &keywords($poem) );



my $workTitle = $work->titleWithYear;

#$page->addBox( width =>'250',
#	       coloumn => 2,
#               title => 'Indhold',
#	       theme => 'dark',
#	       content => &tableOfContents($work),
#	       end => qq|<A HREF="vaerktoc.pl?fhandle=$fhandle&vhandle=$vhandle"><IMG VALIGN=center ALIGN=left SRC="gfx/leftarrow.gif" BORDER=0 TITLE="$workTitle" ALT="$workTitle"></A>|
#	     );

$page->addBox( width => '250',
	       coloumn => 2,
	       theme => 'dark',
	       content =>  &moreLinks($poem,$work));

$page->addBox( width => '250',
	       coloumn => 2,
	       theme => 'dark',
	       content => qq|<img alt="" src="gfx/trans1x1.gif" width="150" height="1">| );

$page->print;

#
# Boxes
#

sub moreLinks {
    my ($poem,$work) = @_;
    my $longdid = $poem->longdid;
    my $HTML = '<div class="morelinks">';
    $HTML .= qq|<a title="Tilføj/fjern linienumre" href="javascript:{\$('.linenumber').toggle()}">Vis linienumre...<span class="linenumber">&#x2611;</span><span class="linenumber" style="display:none">&#x2610;</span></a><br>|;
    $HTML .= qq|<a class="more" title="Vis denne tekst i et format som pænere når udskrevet" href="digt.pl?longdid=$longdid&amp;printer=1">Vis printudgave...</a><br>|;
    $HTML .= qq|<a title="Send redaktionen en rettelse til denne tekst" class="more" onClick="window.open('korrektur.cgi?longdid=$longdid','Korrekturpopup','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=400,height=330'); return false" href="javascript:{}">Send en rettelse...</a><br>|;

    my $nextPoem = $work->getNextPoem($longdid);
    my $prevPoem = $work->getPrevPoem($longdid);
    if ($nextPoem) {
	my $poem = Kalliope::PoemHome::findByLongdid($nextPoem);
	my $title = $poem->linkTitle;
        $HTML .= qq|<a class="more" title="Gå til »$title«" href="digt.pl?longdid=$nextPoem">Næste tekst...</a><br>|;
    }
    if ($prevPoem) {
	my $poem = Kalliope::PoemHome::findByLongdid($prevPoem);
	my $title = $poem->linkTitle;
        $HTML .= qq|<a class="more" title="Gå til »$title«" href="digt.pl?longdid=$prevPoem">Forrige tekst...</a><br>|;
    }
    $HTML .= '</div>';
    return $HTML;
}

sub poem {
    my ($poem,$needle,$biblemark) = @_;
    my $HTML;
    $HTML .= '<SPAN CLASS="digtoverskrift"><I>'.$poem->topTitle."</I></SPAN><BR>";
    $HTML .= '<SPAN CLASS="digtunderoverskrift">'.$poem->subtitle.'</SPAN><BR>' if $poem->subtitleAsHTML;
    $HTML .= '<BR>';

    unless ($poem->isProse) {
        my $indhold = '<table cellpadding="0" cellspacing="0">';
        $indhold .= qq|<tr><td><img alt="" src="gfx/trans1x1.gif" width="50" height="1"></td><td>$HTML</td></tr>|;
        $indhold .= '</table>';
        $HTML = $indhold;
    }
   
 #   $HTML .= '<div style="white-space: nowrap">' unless $poem->isProse;
    $HTML .= $poem->content($biblemark);
 #   $HTML .= '</div>' unless $poem->isProse;

    foreach (1..4) { # TODO: Løs dette mere elegant.
	$HTML =~ s/ -&nbsp;/ &mdash;&nbsp;/g;
	$HTML =~ s/ - / &mdash; /g;
	$HTML =~ s/>- />&mdash; /gm;
	$HTML =~ s/&nbsp;- /&nbsp;&mdash; /gm;
	$HTML =~ s/ -<br>/ &mdash;<br>/gi;
	$HTML =~ s/ -&ldquo;/ &mdash;&ldquo;/g;
	$HTML =~ s/ -([\!;\?\.»«,:])/ &mdash;$1/g;
    }

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

sub linenotes {
    my $poem = shift;
    my @lines = $poem->getContentAsLineHashes;
    my $HTML = '<span style="font-size: 12px">';
    foreach my $line (@lines) {
	my %line = %{$line};
	my $text = $line{'linenote'};
	next unless $text;
	Kalliope::buildhrefs(\$text);
	my $num = $line{'linenum'};
	$HTML .= "<b>$num</b> $text<br>";
    }
    $HTML .= '</span>';
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
	    $HTML .= qq|<BR><SPAN CLASS="title$$d{afsnit}">$$d{titel}</SPAN><BR>\n|;
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
    return qq|<A HREF="digtprinter.pl?fhandle=$fhandle&amp;longdid=$longdid"><IMG SRC="gfxold/gfx/printer.gif" BORDER=0 ALT="Vis dette digt opsat på en side lige til at printe ud."></A><BR>Printer venligt<BR>|;
}


sub xrefs {
    my $poem = shift;
    my @xrefs = $poem->xrefsTo;
    my $HTML;
    foreach my $otherPoem (grep {defined} @xrefs) {
        $HTML .= $otherPoem->clickableTitle.'<br><br>';
    }
    $HTML = qq|<span style="font-size: 12px">$HTML</span>| if $HTML;
    return $HTML;
}

sub notes {
    my ($poem,@keywords) = @_;
    my $HTML = '<div class="noter" >';
    my @notes = $poem->notesAsHTML;
    $HTML .= join '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center"><span class="noprint">&#149;&nbsp;&#149;&nbsp;&#149;</span></div>',@notes;
    if ($#keywords >= 0) {
	$HTML .= '<span class="noprint"><br><br><B>Nøgleord:</B> ';
        $HTML .= join ', ', map { $_->clickableTitle($LA) } @keywords;
	$HTML .= '</span>';
    }
    $HTML .= "</noter>";
    return $HTML;
}

sub quality {
    my $poem = shift;
    my $HTML = '';
    $HTML .= '<span class="noprint"><br><br>'.$poem->quality->asHTML;
    $HTML .= "</span>";
    return $HTML;
}

sub pics {
    my $work = shift;
    my $HTML = "\n\n<center><small>";
    my @pics = $work->pics;
    foreach my $pic (@pics) {
        $HTML .= Kalliope::Web::insertThumb($pic);
	$HTML .= '<br>';
	$HTML .= $pic->{'description'} || '';
	$HTML .= '<br>';
	$HTML .= '<br>';
    }
    $HTML .= '</small></center>';
    return $HTML;
}

