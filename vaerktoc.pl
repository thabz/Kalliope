#!/usr/bin/perl -w

#  Indholdsfortegnelse for et værk.
#
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

use CGI qw(:standard);
use Kalliope::Person ();
use Kalliope::DB ();
use Kalliope::Work ();
use Kalliope::Page ();
use Kalliope::Date ();
use Kalliope;

my $dbh = Kalliope::DB->connect;

my $fhandle = url_param('fhandle');
my $vhandle = url_param('vhandle');

my $vid = $vhandle ? "$fhandle/$vhandle" : url_param('vid');

my $work = new Kalliope::Work ( vid => $vid);
my $poet = $work->author;

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Værker','fvaerker.pl?fhandle='.$poet->fhandle];
push @crumbs,[$work->titleWithYear,''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                                      page => 'vaerker',
                                      coloumnwidths => [70,30],
                                      extrawindowtitle => $work->titleWithYear,
                                      crumbs => \@crumbs );

my $mode = $work->isProse ? 'prosa' : 'poetical'; 

$page->addBox( width => '80%',
               coloumn => 0,
#               title => 'Indhold',
               content => &tableOfContent($work),
	       theme => 'book'
              );

if ($work->hasPics) {
    $page->addBox( width => '100%',
	            coloumn => 1,
	            theme => 'dark',
                content => &pics($work) );
}

$page->addBox( width => '250',
               coloumn => 1,
               theme => 'dark',
               cssClass => 'noter',
               content => &notes($work) );


#$page->addBox( width => '250',
#               coloumn => 2,
#               title => 'Værker',
#	       theme => 'dark',
#               content => &completeWorks($poet,$work)
#              );

$page->addBox( width => '100%',
	       coloumn => 1,
	       theme => 'dark',
	       cssClass => 'morelinks',
	       content => &otherFormats($poet,$work) );

$page->print;

#
# Generate boxes
#

sub completeWorks {
    my ($poet,$work) = @_;
    $sth = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fhandle=? AND type = ? ORDER BY aar");
    $sth->execute($fhandle,$work->isProse ? 'p' : 'v');
    while(my $d = $sth->fetchrow_hashref) {
	$HTML .= '<P STYLE="font-size: 12px">';
	if ($d->{'findes'}) {
	    $HTML .= '<A HREF="vaerktoc.pl?fhandle='.$fhandle."&vhandle=".$d->{'vhandle'}.'">';
	} else {
	    $HTML .= '<FONT COLOR="#808080">';
	}
	$aar = ($d->{'aar'} eq "\?") ? '' : '('.$d->{'aar'}.')';
	$myTitel = '<I>'.$d->{'titel'}.'</I> '.$aar;
	$myTitel = b($myTitel) if $d->{'vhandle'} eq $vhandle;
	$HTML .= $myTitel;

	if ($d->{'findes'}) {
	    $HTML .= '</A>';
	} else {
	    $HTML .= '</FONT>';
	}
    }
    return $HTML;
}

sub pics {
    my $work = shift;
    my $HTML = '<small>';
    my @pics = $work->pics;
    foreach my $pic (@pics) {
        $HTML .= '<center>';
        $HTML .= Kalliope::Web::insertThumb($pic);
        $HTML .= '</center>';
	    $HTML .= '<br>';
	    $HTML .= $pic->{'description'};
	    $HTML .= '<br>';
	    $HTML .= '<br>';
    }
    $HTML .= '</small>';
    return $HTML;
}

sub notes {
    my $work = shift;
    my @notes = $work->notesAsHTML;

    my $HTML;
    $HTML .= join '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>',@notes;
    $HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>' if $#notes >= 0;
    $HTML .= 'Sidst ændret: '.Kalliope::Date::shortDate($work->lastModified);
    $HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>';
    $HTML .= '<div class="quality">';
    $HTML .= $work->quality->asHTML;
    $HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>';
    $HTML .= '</div>';
    $HTML = qq|<span style="font-size: 12px">$HTML</span>|;
    return $HTML;
}

sub tableOfContent {
    my $work = shift;
    my $HTML;
    $HTML .= '<SPAN CLASS="digtoverskrift"><I>'.$work->title."</I> ".$work->parenthesizedYear.'</SPAN><BR>';
    if ($work->subtitle) {
        my $subTitle = join '<BR>', split /\n/, $work->subtitle;
	$HTML .= '<SPAN CLASS="workunderoverskrift"><i>'.$subTitle.'</i></SPAN><BR>';
    }
    $HTML .= '<BR>';
    my $sth = $dbh->prepare("SELECT longdid,toctitel as titel,type,did FROM digte WHERE vid=? ORDER BY vaerkpos");
    $sth->execute($work->vid);
    return 'Kalliope indeholder endnu ingen tekster fra dette værk.' unless $sth->rows;
    $HTML .= _renderSection($work->vid,undef,1);
    $sth->finish;
    return $HTML;
}

sub _renderSection {
    my ($vid,$parent,$depth) = @_;
    my $HTML;
    my $indentstr = '&nbsp;'x8;
    my $sthgroup;
    if ($parent) {
       $sthgroup = $dbh->prepare("SELECT longdid,toctitel as title, type,did FROM digte WHERE vid = ? AND parentdid = ? AND toctitel IS NOT NULL ORDER BY vaerkpos");
       $sthgroup->execute($vid,$parent);
    } else {
       $sthgroup = $dbh->prepare("SELECT longdid,toctitel as title, type,did FROM digte WHERE vid = ? AND parentdid IS NULL AND toctitel IS NOT NULL ORDER BY vaerkpos");
       $sthgroup->execute($vid);
    }
    $HTML .= qq|\n<table cellpadding="0" cellspacing="0">\n|;
    while (my $d = $sthgroup->fetchrow_hashref) {
	$HTML .= "<tr><td>$indentstr</td>";
	my $tit = $d->{'title'};
	my $num;
	if ($tit =~ /<num>/) {
	    ($num) = $tit =~ /<num>(.*?)<\/num>/;
	    $tit =~ s/<num>.*?<\/num>//;
	}
	my $anchor = $$d{longdid} ? qq(<A NAME="$$d{longdid}">) : '';
	if ($d->{'type'} eq 'section') {
	    $HTML .= qq|<td colspan="2" class="toctitle$depth">|;
	    $HTML .= qq|$anchor$tit</td></tr>\n|;
	    $HTML .= qq|<tr><td>$indentstr</td><td colspan="2" class="tocgroup$depth">|;
   	    $HTML .= _renderSection($vid,$d->{'did'},$depth+1);
	    $HTML .= "</td></tr>\n";
	} else {
	    my $link = qq|$anchor<a href="digt.pl?longdid=$$d{longdid}">$tit</a>|;
	    if ($num) {
		$HTML .= qq(<td class="tocnum" nowrap>$num</td><td>$link</td></tr>\n);
	    } else {
		$HTML .= qq(<td colspan="2">$link</td></tr>\n);
	    }
	}
    }		
    $HTML .= qq(\n</table>);
    return $HTML;
}

sub otherFormats {
    my ($poet,$work) = @_;
    my $HTML;
#    $HTML .= '<A TARGET="_top" TITLE="»'.$work->title.'« i PDF format" HREF="downloadvaerk.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->longvid.'&mode=Printer"><IMG SRC="gfx/pdf.gif" BORDER=0 ALT="»'.$work->title.'« i PDF format"></A><BR>PDF<BR><BR>';
#    $HTML .= '<A TARGET="_top" HREF="downloadvaerk.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->longvid.'&mode=Printer"><IMG HEIGHT=48 WIDTH=48 SRC="gfx/floppy.gif" BORDER=0 ALT="»'.$work->title.'« i printervenligt format"></A><BR>Printer venligt<BR><BR>';
    $HTML .= '<A CLASS="more" TARGET="_top" HREF="downloadvaerk.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->longvid.'&mode=Printer">Vis printudgave...</A><BR>';
#    $HTML .= '<A TARGET="_top" TITLE="»'.$work->title.'« som etext til Palm" HREF="downloadvaerk.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->longvid.'&mode=PRC"><IMG SRC="gfx/pilot.gif" BORDER=0 ALT="»'.$work->title.'« som etext til Palm"></A><BR>Palmpilot<BR><BR>';
    $HTML .=  '<A TARGET="_top" CLASS="more" HREF="downloadvaerk.pl?fhandle='.$poet->fhandle.'&vhandle='.$work->longvid.'&mode=XML">Vis XML-udgave...</A><BR>';
    return $HTML;
}
