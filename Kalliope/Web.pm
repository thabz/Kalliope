#!/usr/bin/perl

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

package Kalliope::Web;

use URI::Escape;

sub doubleColumn {
    my $ptr = $_[0];
    my $HTML;
    my @blocks = @$ptr;
    my $total;
    my $subtotal = 0;
    my $columnchanged = 0;

    map { $_->{'count'} += 3 } @blocks;
    map { $total += $_->{'count'} } grep {$_->{'count'}} @blocks;

    my ($left,$right);
    my $minI;
    my $minDiff = $total;
    for ($i = 0; $i <= $#blocks; $i++) {
	$right = $total - $left;
	print STDERR "$left - $right";
	if (abs ($right-$left) <= $minDiff ) {
            $minDiff = abs ($right-$left);
	    $minI = $i;
	    print STDERR " *";
	}
        $left += $blocks[$i]->{'count'};
        print STDERR "\n";
    }
    

    $HTML .= '<TABLE WIDTH="100%" CELLPADDING=0><TR><TD VALIGN=top>';
    $i = 0;
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if ($i == $minI) {
	    $columnchanged = 1;
	    $HTML .= '</TD><TD WIDHT=1 VALIGN=top BGCOLOR=black>';
	    $HTML .= '<IMG ALT="" SRC="gfx/trans1x1.gif" BORDER=0 ALT=""></TD>';
	    $HTML .= '<TD WIDHT=10 VALIGN=top>';
	    $HTML .= '<IMG ALT="" SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    $HTML .= '<TD VALIGN=top>';
	}
        $subtotal += $b->{'count'};
	$HTML .= $b->{'head'};
	$HTML .= $b->{'body'}."<BR>";
	$i++;
    }
    $HTML .= '</TD></TR></TABLE>';
    return $HTML;
}


sub insertThumb {
    my $h = shift;
    my ($tx,$ty) = imgsize ($h->{'thumbfile'});
    my $border = defined $h->{border} ? $h->{border} : 2;
    my $html = '';
    if ($h->{destfile}) {
	my ($dx,$dy) = imgsize ($h->{'destfile'});
	$html .= '<A HREF="javascript:{}" onclick=\'window.open("picfull.pl?imgfile='.uri_escape($h->{destfile}).'","popup","toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizeable=no,width='.$dx.',height='.$dy.'")\'>';
    } elsif ($h->{url}) {
	$html .= qq|<A HREF="$h->{url}">|;
    }
    $html .= qq|<IMG WIDTH=$tx HEIGHT=$ty ALT="$h->{alt}" SRC="$h->{thumbfile}" BORDER=$border></A>|;
    return $html;
}

sub imgsize {
    my $filename = shift;
    open(IDE,"./jpeggeometry $filename|");
    my ($kaj) = <IDE>;
    close (IDE);
    $kaj =~ /(.*)x(.*)/;
    return ($1,$2);
}


1;
