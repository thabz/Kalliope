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

package Kalliope::Page;

use Kalliope::Web ();
use strict;

sub new {
    my ($class,%args) = @_;
    my $self = bless {}, $class;
    foreach my $key (%args) {
        $self->{$key} = $args{$key};
    }
    $self->{'lang'} = $args{'lang'} || 'dk';
    $self->{'pagegroup'} = $args{'pagegroup'};
    $self->{'page'} = $args{'page'};
    $self->{'author'} = $args{'author'};
    $self->{'title'} = $args{'title'}.' - Kalliope' || 'Kalliope';
    my $title = $self->{'title'};
    $self->{'columns'} = [];
    return $self;
}

sub newAuthor {
    my ($class,%args) = @_;
    my $poet = $args{'poet'};
    my $page = new Kalliope::Page(title => $poet->name,
                                  lang => $poet->lang,  %args);
    $page->addBox(content => $poet->blobHTML,
                  coloumn => 0,
                  align => 'center',
                  width => '100%' );
    return $page;
}

sub lang {
    return shift->{'lang'};
}

sub addHTML {
    my ($self,$HTML,%args) = @_;
    my $coloumn = $args{'coloumn'} || 0;
    @{$self->{'coloumns'}}[$coloumn] .= $HTML;
}

sub setColoumnWidths {
    my ($self,@widths) = @_;
    $self->{'coloumnwidths'} = \@widths;
}

sub getColoumnWidths {
    my $self = shift; 
    if ($self->{'poet'} && !$self->{'coloumnwidths'}) {
        return ('100','100%','100');
    }
    return $self->{'coloumnwidths'} ? @{$self->{'coloumnwidths'}} : ('100%');
}

sub _constructBreadcrumbs {
    my $self = shift;
    return '' unless $self->{'crumbs'};
    my @crumbs = (
                ['&nbsp;&nbsp;Kalliope','index.cgi'],
                @{$self->{'crumbs'}});
    my @blocks;
    foreach my $item (@crumbs) {
       if ($$item[1]) {
          push @blocks,qq|<A HREF="$$item[1]">$$item[0]</A>|;
       } else {
          push @blocks,$$item[0];
       }
    }
    my $HTML = join ' >> ',@blocks;
    $HTML = qq|<SPAN STYLE="font-family:Arial,Helvetica; font-size: 10px">$HTML</SPAN>|;
    return $HTML;
}

sub addBox {
    my ($self,%args) = @_;
    $self->addHTML (Kalliope::Web::makeBox (
               $args{'title'} || '',
               $args{'width'} || '',
               $args{'align'} || '',
               $args{'content'} || '',
               $args{'end'} || ''), %args );
}

sub print {
    my $self = shift;
    print "Content-type: text/html\n\n";
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print <<"EOF";
<HTML><HEAD><TITLE>$$self{title}</TITLE>
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
</HEAD>
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000">

EOF
    print '<DIV STYLE="background-color: #e0e0e0; padding: 1px">';
    print $self->_constructBreadcrumbs;
    print '</DIV>';
    print '<DIV CLASS="nav"><CENTER>';
    print $self->_navigation;
    print '</CENTER></DIV>';
    print '<DIV CLASS="body">';
    print '<TABLE WIDTH="100%"><TR>';
    my @widths = $self->getColoumnWidths;
    foreach my $colHTML (@{$self->{'coloumns'}}) {
	if (my $width = shift @widths) {
	    print qq|<TD VALIGN="top" WIDTH="$width">$colHTML</TD>\n|;
        } else {
	    print qq|<TD VALIGN="top">$colHTML</TD>\n|;
        }
    }
    print '</TR></TABLE>';
    print '</DIV></BODY></HTML>';
}

#
# Private ------------------------------------------------------
#

my @topMenuItems = ('welcome','poets','worklist','poemlist',
                    'history');


sub _navigation {
    my $self = shift;
    my $lang = $self->lang;

my %menuStructs = (
         'welcome' => {'menuTitle' => 'Velkommen',
                       'url' => 'index.cgi',
                       'pages' => ['news','about','tak','musen','stats']
                       },
         'poets'    => {menuTitle => 'Digtere',
                       url => 'poets.cgi?list=az&sprog='.$lang,
                       'pages' => ['poetsbyname','poetsbyyear','poetsbypic',
		                   'poetsbyflittige']
                       },
         'worklist' => {menuTitle => 'Værker',
                       url => 'kvaerker.pl?sprog='.$lang,
                       pages => ['kvaerkertitel','kvaerkeraar','kvaerkerdigter',
                                 'kvaerkerpop']
                       },
         'poemlist' => {menuTitle => 'Digte',
                       url =>'klines.pl?mode=1&forbogstav=A&sprog='.$lang,
                       pages => ['poemtitles','poem1stlines','poempopular']
                       },
         'history' => {menuTitle => 'Litt. hist',
                       url => 'keywordtoc.cgi?sprog='.$lang,
                       pages => ['keywordtoc','timeline','keyword']
                       },
         'poemtitles' =>{menuTitle => 'Digttitler',
                       url => 'klines.pl?mode=1&forbogstav=A&sprog='.$lang
                       },
         'poem1stlines' => {menuTitle => 'Førstelinier',
                       url => 'klines.pl?mode=0&forbogstav=A&sprog='.$lang
                       },
         'poempopular' => {menuTitle => 'Populære',
                       url => 'klines.pl?mode=2&sprog='.$lang
                       },
         'news' =>     {menuTitle => 'Nyheder',
                       url => 'index.cgi'
                       },
         'about' =>    {menuTitle => 'Om',
                       url => 'kabout.pl?page=about'
                       },
         'tak' =>      {menuTitle => 'Tak',
                       url => 'kabout.pl?page=tak'
                       },
         'musen' =>     {menuTitle => 'Musen',
                       url => 'kabout.pl?page=musen'
                       },
         'stats' =>    {menuTitle => 'Statistik',
                       url => 'kstats.pl'
                       },
         'poetsbyname' => {menuTitle => 'Digtere efter navn',
                           url => 'poets.cgi?list=az&sprog='.$lang
                       },
         'poetsbyyear' => {menuTitle => 'Digtere efter år',
                           url => 'poets.cgi?list=19&sprog='.$lang
                       },
         'poetsbypic' => {menuTitle => 'Digtere efter udseende',
                           url => 'poets.cgi?list=pics&sprog='.$lang
                       },
         'poetsbyflittige' => {menuTitle => 'Flittigste digtere',
                           url => 'poets.cgi?list=flittige&sprog='.$lang
                       },
         'kvaerkertitel' => {menuTitle => 'Værker efter titel',
                           url => 'kvaerker.pl?mode=titel&sprog='.$lang
                       },
         'kvaerkerdigter' => {menuTitle => 'Værker efter digter',
                           url => 'kvaerker.pl?mode=digter&sprog='.$lang
                       },
         'kvaerkeraar' => {menuTitle => 'Værker efter år',
                           url => 'kvaerker.pl?mode=aar&sprog='.$lang
                       },
         'kvaerkerpop' => {menuTitle => 'Mest populære værker',
                           url => 'kvaerker.pl?mode=pop&sprog='.$lang
                       },
         'keywordtoc' => {menuTitle => 'Indhold',
                           url => 'keywordtoc.cgi?sprog='.$lang
                       },
         'timeline' => {menuTitle => 'Tidslinie',
                           url => 'timeline.cgi&sprog='.$lang
                       }
          );

    my $HTML;
    # Pagegroups
    foreach my $key (@topMenuItems) {
        my $struct = $menuStructs{$key};
        my ($title,$url) = ($struct->{'menuTitle'},
                           $struct->{'url'});
        if ($key ne $self->{'pagegroup'}) {
	    $HTML .= qq|<A HREF="$url">[$title]</A> |;
	} else {
            $HTML .= qq|<B>[$title]</B> |;
	}
    }
    $HTML .= '<BR>';
    # Pages
    my $struct = $menuStructs{$self->{'pagegroup'}};
    foreach my $key (@{$struct->{'pages'}}) {
        my $struct = $menuStructs{$key};
        my ($title,$url) = ($struct->{'menuTitle'},
                           $struct->{'url'});
        if ($key ne $self->{'page'}) {
	    $HTML .= qq|<A HREF="$url">[$title]</A> |;
	} else {
            $HTML .= qq|<B>[$title]</B> |;
	}
    }
    # Author menu
    if ($self->{'poet'}) {
       $HTML .= '<BR>'.$self->{'poet'}->menu;
    }
    return $HTML;
}

sub notFound {
    my $HTML;
    my $picNo = int rand(10) + 1;
    my $page = new Kalliope::Page ('title' => 'Hovsa!');
    $page->addBox(content => qq|<IMG SRC="gfx/notfound/$picNo.jpg" ALIGN="center"><BR><BR>Hovsa! Der gik det galt! Siden kunne ikke findes.<BR><BR>Send en mail til <A HREF="mailto:jesper\@kalliope.org">jesper\@kalliope.org</A> hvis du mener at jeg har lavet en fejl.|);
    $page->print;
    exit;
}

1;
