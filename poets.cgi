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

use strict;
no strict 'refs';
use CGI ();
use Kalliope::DB ();
use Kalliope::Web ();
use Kalliope::Page ();
use Kalliope::Sort ();
use Kalliope::Person ();
use Kalliope::PersonHome ();

my $LA = CGI::url_param('sprog') || 'dk';
my $limit = CGI::url_param('limit') || '10';

my %pageTypes = (
    'az' => {
        'title' => 'Digtere efter navn',
        'function' => 'listaz',
        'crumbtitle' => 'efter navn',
        'page' => 'poetsbyname'},
    '19' => {
        'title' => 'Digtere efter fødeår',
        'function' => 'list19',
        'crumbtitle' => 'efter fødeår',
        'page' => 'poetsbyyear'},
    'pics' => {
        'title' => 'Digtere efter udseende',
        'function' => 'listpics',
        'crumbtitle' => 'efter udseende',
        'page' => 'poetsbypic'},
    'flittige' => {
        'title' => 'Flittigste digtere',
        'function' => 'listflittige',
        'crumbtitle' => 'flittigste',
        'page' => 'poetsbyflittige'},
    'pop'  => {
        'title' => 'Mest populære digtere',
        'function' => 'listpop',
        'crumbtitle' => 'mest populære',
        'page' => 'poetsbypop'});

my $listType = CGI::url_param('list');

if ($listType ne 'az' && $listType ne '19' && 
    $listType ne 'pics' && $listType ne 'flittige' &&
    $listType ne 'pop') {
    Kalliope::Page::notFound;
}

my $struct = $pageTypes{$listType};

my @crumbs;
push @crumbs,['Digtere',"poetsfront.cgi?sprog=$LA"];
push @crumbs,[$struct->{'crumbtitle'},''];

my $page = new Kalliope::Page (
    title => 'Digtere',
    titleLink => "poetsfront.cgi?sprog=$LA",
    subtitle => $struct->{'crumbtitle'},
    lang => $LA,
	crumbs => \@crumbs,
    pagegroup => 'poets',
	thumb => 'gfx/icons/poet-h70.gif',
    page => $struct->{'page'}); 

my $function = $struct->{'function'};

if ($function eq 'listaz' || $function eq 'list19') {
    my @blocks = &{$struct->{'function'}}($LA,$limit);
    $page->addDoubleColumn(@blocks);
} else {
    my ($HTML,$endHTML) = &{$struct->{'function'}}($LA,$limit);
    $page->addBox ( width => '90%',
                    content =>  $HTML,
    		        end => $endHTML);
}


$page->print;

sub listaz {
    my $LA = shift;
    my @persons = Kalliope::PersonHome::findByLang($LA);
    my @f = grep { $_->getType eq 'poet'} @persons;
    map {$_->{'sort'} = $_->efternavn } @f;

    my $last = "";
    my @blocks;
    my $bi = -1;
    my $new;
    foreach my $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next unless $f->{'sort'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = uc substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last=$new;
	    $bi++;
	    $blocks[$bi]->{'head'} = qq|<DIV CLASS="listeoverskrifter">$new</DIV><BR>|;
	}
	$blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->fhandle.'">'.$f->reversedName.'</A>&nbsp;<FONT COLOR="#808080">'.$f->lifespan.'</FONT><BR>';
	$blocks[$bi]->{'count'}++;
    }

    # Udenfor kategori (dvs. folkeviser, o.l.)
    $bi++;
    my @colls = grep {$_->getType eq 'collection'} @persons;
    if ($#colls >= 0) {
	    $blocks[$bi]->{'head'} = qq|<BR><DIV CLASS="listeoverskrifter">Ukendt digter</DIV><BR>|;
	    foreach my $f (@colls) {
	        $blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->fhandle.'">'.$f->fornavn.'</A><BR>';
	        $blocks[$bi]->{'count'}++;
	    }
    }
    return @blocks;
}

sub list19 {
    my $LA = shift;
    my @persons = grep {$_->getType eq 'poet'} Kalliope::PersonHome::findByLang($LA);
    my @knownYear = grep {$_->yearBorn ne '' && $_->yearBorn ne '?'} @persons;
    my @unknownYear = grep {$_->yearBorn eq '' || $_->yearBorn eq '?'} @persons;

    map {($_->{'sort'}) = $_->yearBorn =~ /(\d\d\d\d)/} @knownYear;

    my $last = 0;
    my $last2;
    my @blocks;
    my $bi = -1;
    my $new;
    my $f;
    foreach $f (sort { Kalliope::Sort::sort($a,$b) } @knownYear) {
	    next unless $f->{'sort'};
	    if ($f->{'sort'} - $last >= 25) {
	        $last = $f->{'sort'} - $f->{'sort'}%25;
	        $last2 = $last + 24;
	        $bi++;
	        $blocks[$bi]->{'head'} = qq|<DIV CLASS="listeoverskrifter">$last-$last2</DIV><BR>|;
	    }
	    $blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->fhandle.'">'.$f->reversedName.'</A>&nbsp;<FONT COLOR="#808080">'.$f->lifespan.'</FONT><BR>';
	    $blocks[$bi]->{'count'}++;
    }

    # Udenfor kategori (dvs. folkeviser, o.l.)
    $bi++;
    if ($#unknownYear >= 0) {
	    $blocks[$bi]->{'head'} = qq|<BR><DIV CLASS="listeoverskrifter">Ukendt fødeår</DIV><BR>|;
	    foreach my $f (@unknownYear) {
	        $blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->fhandle.'">'.$f->reversedName.'</A>&nbsp;<FONT COLOR="#808080">'.$f->lifespan.'</FONT><BR>';
	        $blocks[$bi]->{'count'}++;
	    }
    }
    return @blocks;
}

sub listpics {
    my $LA = shift;
    my $HTML;
    my @poets;

    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT fhandle FROM fnavne WHERE type='poet' AND sprog=? AND foedt != '' AND foedt != '?' AND thumb = 1 ORDER BY efternavn,fornavn");
    $sth->execute($LA);
    while (my $fid = $sth->fetchrow_array) {
	my $poet = Kalliope::PersonHome::findByFhandle($fid);
	push @poets, $poet;
    }

    $HTML = qq|<TABLE ALIGN="center" border=0 cellspacing=10><TR>|;
    my $i=0;
    foreach my $poet (sort Kalliope::Sort::sortObject @poets) {
	my $fhandle = $poet->fhandle;
	my $fullname = $poet->name;
	$HTML .= "<TD align=center valign=bottom>";
	$HTML .= Kalliope::Web::insertThumb({thumbfile=>"fdirs/$fhandle/thumb.jpg",url=>"fpics.pl?fhandle=$fhandle",alt=>"Vis portrætter af $fullname"});
	$HTML .= "<BR>$fullname<BR>";
	$HTML .= '<FONT COLOR="#808080">'.$poet->lifespan.'</FONT><BR>';
	$HTML .= "</TD>";
	if (++$i % 3 == 0) {
	    $HTML .= "</TR><TR>";
	}
    }
    $HTML .= "</TR></TABLE>";
    return ($HTML,'');
}

sub listflittige {
    my ($LA,$limit) = @_;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("select fnavne.fhandle, count(longdid) as val from fnavne, digte where foedt != '' AND digte.fhandle = fnavne.fhandle and fnavne.sprog=? and digte.type = 'poem' group by fnavne.fhandle order by val desc ".($limit != -1 ? "LIMIT $limit" : ''));
    $sth->execute($LA);

    my $HTML;
    my $total;
    my $i = 1;
    $HTML .= '<TABLE CLASS="oversigt" CELLSPACING=0 WIDTH="100%">';
    $HTML .= '<TR><TH>&nbsp;</TH><TH ALIGN="left">Navn</TH><TH ALIGN="right">Digte</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	    my $poet = Kalliope::PersonHome::findByFhandle($h->{'fhandle'});

	    my $class = $i % 2 ? '' : ' CLASS="darker" ';
	    $HTML .= qq|<TR $class><TD ALIGN="right">|.$i++.'.</TD>';
	    $HTML .= '<TD WIDTH="100%"><A HREF="ffront.cgi?fhandle='.$poet->fhandle.'">&nbsp;'.$poet->name.'<FONT COLOR=#808080> '.$poet->lifespan.'</FONT></A></TD>';
	    $HTML .= '<TD ALIGN=right>'.$h->{'val'}.'</TD>';
	    $total += $h->{val};
    }

    my $endHTML = '';
    if ($limit != -1) {
	    $endHTML = qq|<A class="more" HREF="poets.cgi?list=flittige&limit=-1&sprog=$LA">Se hele listen...</A>|;
    } else {
	    $HTML .= "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD></TR>";
    }
    $HTML .= '</TABLE>';
    return ($HTML,$endHTML); 
}

sub listpop {
    my ($LA,$limit) = @_;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT f.fornavn, f.efternavn, f.foedt, f.doed, d.fhandle, sum(hits) as hitssum, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f WHERE dh.longdid = d.longdid AND d.fhandle = f.fhandle AND f.sprog = ? AND f.type != 'collection' GROUP BY d.fhandle,f.fornavn,f.efternavn,f.foedt,f.doed ORDER BY hitssum DESC ".($limit != -1 ? "LIMIT $limit" : ''));
    $sth->execute($LA);

    my $i = 1;
    my $total;
    my $endHTML = '';
    my $HTML = '<TABLE CLASS="oversigt" WIDTH="100%" CELLSPACING=0>';
    $HTML .= '<TR><TH>&nbsp;</TH><TH ALIGN="left">Navn</TH><TH ALIGN="right">Hits&nbsp;&nbsp;</TH><TH ALIGN="right">Senest</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	    my $class = $i % 2 ? '' : ' CLASS="darker" ';
	    $HTML .= qq|<TR $class><TD ALIGN="right">|.$i++.'.</TD>';
	    $HTML .= '<TD WIDTH="100%"><A HREF="ffront.cgi?fhandle='.$h->{fhandle}.'">'.$h->{fornavn}.' '.$h->{efternavn}.'<FONT COLOR=#808080> ('.$h->{foedt}.'-'.$h->{doed}.')</FONT></A></TD>';
	    $HTML .= '<TD ALIGN="right">'.$h->{'hitssum'}.'&nbsp;&nbsp;</TD>';
	    $HTML .= '<TD ALIGN="right" NOWRAP>'.Kalliope::shortdate($h->{'lasttime'}).'</TD>';
	    $total += $h->{'hitssum'};
    }
    if ($limit != -1) {
        $endHTML = qq|<A class="more" HREF="poets.cgi?list=pop&limit=-1&sprog=$LA">Se hele listen...</A>|;
    } else {
        $HTML .= qq|<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN="right">$total</TD></TR>|;
    }
    $HTML .= '</TABLE>';
    return ($HTML,$endHTML);
}


