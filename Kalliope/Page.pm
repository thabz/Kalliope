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
    $self->{'title'} = $args{'title'}.' - Kalliope' || 'dk';
    my $title = $self->{'title'};
    $self->{'html'} = <<"EOF";
<HTML><HEAD><TITLE>$title</TITLE>
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
</HEAD>
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000">
<DIV CLASS="nav">
EOF
    $self->_addNavigation;
    $self->addHTML ('</DIV><DIV CLASS="body">');
    return $self;
}


sub addHTML {
    my ($self,$HTML) = @_;
    $self->{'html'} .= $HTML;
}

sub addBox {
    my ($self,%args) = @_;
    $self->addHTML (Kalliope::Web::makeBox (
               $args{'title'} || '',
               $args{'width'} || '',
               $args{'align'} || '',
               $args{'content'} || '',
               $args{'end'} || '') );
}

sub print {
    my $self = shift;
    print "Content-type: text/html\n\n";
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print $self->{'html'};
    print '</DIV></BODY></HTML>';
}

#
# Private ------------------------------------------------------
#

my @topMenuItems = ('welcome','poets','worklist','poemlist',
                    'history');

my %menuStructs = (
         'welcome' => {'menuTitle' => 'Velkommen',
                       'url' => 'index.cgi',
                       'pages' => ['news','about','musen','stats']
                       },
         'poets'    => {menuTitle => 'Digtere',
                       url => 'poets.cgi?list=az',
                       'pages' => ['poetsbyname','poetsbyyear','poetsbypic']
                       },
         'worklist' => {menuTitle => 'Værker',
                       url => 'kvaerker.pl'
                       },
         'poemlist' => {menuTitle => 'Digte',
                       url => 'klines.pl'
                       },
         'history' => {menuTitle => 'Litt. hist',
                       url => 'keywords.cgi'
                       },
         'news' =>     {menuTitle => 'Nyheder',
                       url => 'kfront.pl'
                       },
         'about' =>    {menuTitle => 'Om',
                       url => 'kabout.pl?page=about'
                       },
         'musen' =>     {menuTitle => 'Musen',
                       url => 'kabout.pl?page=musen'
                       },
         'stats' =>    {menuTitle => 'Statistik',
                       url => 'kstats.pl'
                       },
         'poetsbyname' => {menuTitle => 'Digtere efter navn',
                           url => 'poets.cgi?list=az'
                       },
         'poetsbyyear' => {menuTitle => 'Digtere efter år',
                           url => 'poets.cgi?list=19'
                       },
         'poetsbypic' => {menuTitle => 'Digtere efter udseende',
                           url => 'poets.cgi?list=pics'
                       }
          );

sub _addNavigation {
    my $self = shift;
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
    $self->addHTML("<CENTER>$HTML</CENTER>");
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
