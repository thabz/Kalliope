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

my $poet = new Kalliope::Person ( fhandle => $fhandle);
my $work = new Kalliope::Work ( longvid => $vhandle, fhandle => $fhandle );

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,['Værker','fvaerker.pl?fhandle='.$poet->fhandle];
push @crumbs,[$work->titleWithYear,''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
                                      page => 'vaerker',
                                      extrawindowtitle => $work->titleWithYear,
                                      crumbs => \@crumbs );

my ($vtitel,$vaar,$vid,$noter) = $dbh->selectrow_array("SELECT titel, aar, vid,noter FROM vaerker WHERE vhandle = '$vhandle' AND fhandle = '$fhandle'");


#$page->addBox( width => '80%',
#               coloumn => 1,
#               content => '<SPAN CLASS=digtoverskrift><I>'.$vtitel."</I> ".(($vaar ne '?')?"($vaar)":'').'</SPAN>'
#              );

my $mode = $work->isProse ? 'prosa' : 'poetical'; 

$page->addBox( width => '80%',
               coloumn => 1,
#               title => 'Indhold',
               content => &tableOfContent($work),
	       theme => 'book'
              );

if ($work->hasPics) {
    $page->addBox( width => '100%',
	           coloumn => 2,
	           theme => 'dark',
                   content => &pics($work) );
}

$page->addBox( width => '250',
               coloumn => 2,
               theme => 'dark',
               content => &notes($work) );


#$page->addBox( width => '250',
#               coloumn => 2,
#               title => 'Værker',
#	       theme => 'dark',
#               content => &completeWorks($poet,$work)
#              );

$page->addBox( width => '100%',
	       coloumn => 2,
	       theme => 'dark',
	       content => &otherFormats($poet,$work) );

$page->addBox( width => '250',
	       coloumn => 2,
	       theme => 'dark',
	       content => qq|<img src="gfx/trans1x1.gif" width="150" height="1">| );

$page->setColoumnWidths(0,'80%',250);
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

sub notes {
    my $work = shift;
    my @notes = $work->notes;
    @notes = map { Kalliope::buildhrefs(\$_) } @notes;

    my $HTML;
    $HTML .= join '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>',@notes;
    $HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>' if $#notes >= 0;
    $HTML .= 'Sidst ændret: '.Kalliope::Date::shortDate($work->lastModified);
    $HTML .= '<div class="lifespan" style="padding: 5px 0 5px 0; text-align: center">&#149;&nbsp;&#149;&nbsp;&#149;</div>';
    $HTML .= $work->quality->asHTML;
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
    my $sth = $dbh->prepare("SELECT longdid,toctitel as titel,afsnit,did FROM digte WHERE vid=? ORDER BY vaerkpos");
    $sth->execute($work->vid);
    return 'Kalliope indeholder endnu ingen tekster fra dette værk.' unless $sth->rows;
    $HTML .= qq|\n<table cellpadding="0" cellspacing="0">\n|;

    while(my $d = $sth->fetchrow_hashref) {
	my $tit = $d->{'titel'};
	my $num;
        if ($tit =~ /<num>/) {
	    ($num) = $tit =~ /<num>(.*?)<\/num>/;
	    $tit =~ s/<num>.*?<\/num>//;
	}		
	
	if ($d->{'afsnit'} && !($tit =~ /^\s*$/)) {
	    $tit = qq|<span class="toctitle$$d{afsnit}"><br>$tit</span>|;
	} else {
	    $tit = qq|<a href="digt.pl?longdid=$$d{longdid}">$tit</a>|;
	}
	if ($num) {
	    $HTML .= qq|<tr><td nowrap class="tocnum">$num</td><td>$tit</td></tr>\n|;
	} else { 
	    if ($d->{'afsnit'}) {
	       $HTML .= qq|<tr><td colspan="2">$tit</td></tr>\n|;
   	    } else {
	        $HTML .= qq|<tr><td colspan="2">&nbsp;&nbsp;&nbsp;$tit</td></tr>\n|;
	    }
	}

    }
    $HTML .= '</table>';
    $sth->finish;
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
