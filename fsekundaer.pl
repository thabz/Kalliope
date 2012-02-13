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

use CGI (':standard');
use Kalliope::Person;
use Kalliope::Page;
use strict;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

#
# Breadcrumbs -------------------------------------------------------------
#

my @crumbs;
push @crumbs,['Digtere','poets.cgi?list=az&sprog='.$poet->lang];
push @crumbs,[$poet->name,'ffront.cgi?fhandle='.$poet->fhandle];
push @crumbs,[_('Bibliografi'),''];

my $page = newAuthor Kalliope::Page ( poet => $poet, 
	                              subtitle => _('Bibliografi'),
				      printer => url_param('printer') || 0,
                                      page => 'bibliografi',
                                      crumbs => \@crumbs );


if (-e "fdirs/$fhandle/primaer.txt") {

    my $HTML = fileAsHTML("fdirs/$fhandle/primaer.txt");
    $page->addBox(
	    width => '80%',
	    coloumn => 0,
	    printer => 1,
	    title => _('Primærlitteratur'),
	    end => qq|<a title="|._("Udskriftsvenlig udgave").qq|" href="fsekundaer.pl?fhandle=$fhandle&printer=1"><img src="gfx/print.gif" border=0></a>|,
	    content => $HTML );
}

if (-e "fdirs/$fhandle/sekundaer.txt") {
    my $HTML = fileAsHTML("fdirs/$fhandle/sekundaer.txt");

    my $column = -e "fdirs/$fhandle/primaer.txt" ? 1 : 0;
    $page->addBox(
	    width => '80%',
	    coloumn => $column,
	    printer => 1,
	    title => _('Sekundærlitteratur'),
	    end => qq|<a title="|._("Udskriftsvenlig udgave").qq|" href="fsekundaer.pl?fhandle=$fhandle&printer=1"><img src="gfx/print.gif" border=0></a>|,
	    content => $HTML );
}

$page->setColoumnWidths('50%','50%');

$page->print;


sub fileAsHTML {
    my $file = shift;
    open (FILE,$file);
    my $HTML = join '</p><p class="bibliografi">',<FILE>;
    $HTML = qq|<p class="bibliografi">$HTML</p>|;
    close (FILE);

    $HTML =~ s/<biblio>/[/gi;
    $HTML =~ s/<\/biblio>/]&nbsp;&nbsp;/gi;
    return $HTML;

}
