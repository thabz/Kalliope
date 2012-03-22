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
use utf8;
no strict 'refs';
use CGI ();
use Kalliope;
use Kalliope::DB ();
use Kalliope::Web ();
use Kalliope::Page ();
use Kalliope::Sort ();
use Kalliope::Person ();

my $LA = CGI::url_param('sprog') || 'dk';
my $limit = CGI::url_param('limit') || '10';

my %pageTypes = ('az' => {'title' => _('Personer efter navn'),
                          'function' => 'listaz',
			  'crumbtitle' => _('efter navn'),
                          'page' => 'personsbyname'},
                 '19' => {'title' => _('Personer efter fødeår'),
                          'function' => 'list19',
			  'crumbtitle' => _('efter fødeår'),
                          'page' => 'personsbyyear'},
                 'pics' => {'title' => _('Personer efter udseende'),
                          'function' => 'listpics',
			  'crumbtitle' => _('efter udseende'),
                          'page' => 'personsbypic'}
                );

my $listType = CGI::url_param('list');

if ($listType ne 'az' && $listType ne '19' && 
    $listType ne 'pics') {
    Kalliope::Page::notFound;
}

my $struct = $pageTypes{$listType};

my @crumbs;
push @crumbs,[_('Baggrund'),'metafront.cgi'];
push @crumbs,[_('Biografier'),''];
push @crumbs,[_('Andre personer'),''];
push @crumbs,[$struct->{'crumbtitle'},''];

my $page = new Kalliope::Page (
	title => $struct->{'title'},
    lang => $LA,
	crumbs => \@crumbs,
    pagegroup => 'persons',
	thumb => 'gfx/icons/poet-h70.gif',
    page => $struct->{'page'}); 

&{$struct->{'function'}}($LA,$limit);

$page->print;

sub listaz {
    my $LA = shift;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT * FROM fnavne WHERE type='person' AND foedt != '' ORDER BY efternavn, fornavn");
    $sth->execute();
    my @f;
    while (my $f = $sth->fetchrow_hashref) { 
        $f->{'sort'} = $f->{'efternavn'};
	    push @f,$f;
    }

    my $last = "";
    my @blocks;
    my $bi = -1;
    my $new;
    my $f;
    foreach $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	    next unless $f->{'sort'};
	    $f->{'sort'} =~ s/Aa/Å/g;
	    $new = uc substr($f->{'sort'},0,1);
	    if ($new ne $last) {
	        $last=$new;
	        $bi++;
	        $blocks[$bi]->{'head'} = "<DIV CLASS=listeoverskrifter>$new</DIV><BR>";
	    }
	    $blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->{'fhandle'}.'">'.($f->{'efternavn'} || '').",&nbsp;".($f->{'fornavn'} || '').'</A>&nbsp;<FONT COLOR="#808080">('.$f->{'foedt'}."-".$f->{'doed'}.')</FONT><BR>';
	    $blocks[$bi]->{'count'}++;
    }
    $page->addDoubleColumn(@blocks);
}

sub list19 {
    my $LA = shift;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT * FROM fnavne WHERE type='person' AND foedt != '' AND foedt != '?' ORDER BY efternavn, fornavn");
    $sth->execute();
    my @f;
    while (my $f = $sth->fetchrow_hashref) { 
        ($f->{'sort'}) = $f->{'foedt'} =~ /(\d\d\d\d)/;
	push @f,$f;
    }

    my $last = 0;
    my $last2;
    my @blocks;
    my $bi = -1;
    my $new;
    my $f;
    foreach $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next unless $f->{'sort'};
	if ($f->{'sort'} - $last >= 25) {
	    $last = $f->{'sort'} - $f->{'sort'}%25;
	    $last2 = $last + 24;
	    $bi++;
	    $blocks[$bi]->{'head'} = "<DIV CLASS=listeoverskrifter>$last-$last2</DIV><BR>";
	}
	$blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->{'fhandle'}.'">'.$f->{'efternavn'}.",&nbsp;".$f->{'fornavn'}.'</A>&nbsp;<FONT COLOR="#808080">('.$f->{'foedt'}."-".$f->{'doed'}.')</FONT><BR>';
	$blocks[$bi]->{'count'}++;
    }
    $page->addDoubleColumn(@blocks);
}

sub listpics {
    my $LA = shift;
    my $HTML;

    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT fhandle FROM fnavne WHERE type='person' AND foedt != '' AND foedt != '?' AND thumb = 1 ORDER BY efternavn, fornavn");
    $sth->execute();

    $HTML = qq|<TABLE ALIGN="center" border=0 cellspacing=10><TR>|;
    my $i = 0;
    while (my $fhandle = $sth->fetchrow_array) {
        my $poet = Kalliope::PersonHome::findByFhandle($fhandle);
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
    $page->addBox(content => $HTML);
}

