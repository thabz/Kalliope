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
	if (abs ($right-$left) <= $minDiff ) {
            $minDiff = abs ($right-$left);
	    $minI = $i;
	}
        $left += $blocks[$i]->{'count'};
    }
    
    $HTML .= '<TABLE WIDTH="100%" CELLSPACING=0 CELLPADDING=0><TR><TD WIDTH="50%" VALIGN=top><DIV STYLE="padding: 10px">';
    $i = 0;
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if ($i == $minI && $total > 8) {
	    $columnchanged = 1;
	    $HTML .= '</DIV></TD><TD WIDTH=1 VALIGN=top BGCOLOR="#808080">';
	    $HTML .= '<IMG ALT="" SRC="gfx/trans1x1.gif" BORDER=0 ALT=""></TD>';
	    $HTML .= '<TD WIDTH=10 VALIGN=top>';
	    $HTML .= '<IMG ALT="" SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    $HTML .= '<TD WIDTH="50%" VALIGN=top>';
	    $HTML .= '<DIV STYLE="padding: 10px">';
	}
        $subtotal += $b->{'count'};
	$HTML .= $b->{'head'};
	$HTML .= $b->{'body'}."<BR>";
	$i++;
    }
    $HTML .= '</DIV></TD></TR></TABLE>';
    return $HTML;
}


sub insertThumb {
    my $h = shift;
    my ($tx,$ty) = imgsize ($h->{'thumbfile'});
    my $border = defined $h->{border} ? $h->{border} : 2;
    my $html = '';
    if ($h->{destfile}) {
	my ($dx,$dy) = imgsize ($h->{'destfile'});
	my $winy = $dy+20;
	$html .= qq|<A HREF="javascript:{}" onclick='window.open("picfull.pl?imgfile=|.uri_escape($h->{destfile}).qq|&x=$dx&y=$dy","popup","toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=$dx,height=$winy")'>|;
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
