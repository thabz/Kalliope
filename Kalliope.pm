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

package Kalliope;
use URI::Escape;
use Kalliope::Poem;

#
# Datoer 
#

@months = qw (Jan Feb Mar Apr Maj Jun Jul Aug Sep Okt Nov Dec);
@weekdays = qw (Søn Man Tir Ons Tors Fre Lør);

sub shortdate {
    my $time = shift;
    my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($time);
    my ($sec2,$min2,$hour2,$mday2,$mon2,$year2,$wday2,$yday2,$isdst2) = localtime(time);
    $min = "0".$min if ($min<10);
    $hour = "0".$hour if ($hour<10);
    if ($yday == $yday2 && $year == $year2) {
	return "Idag $hour:$min";
    } elsif ($yday == $yday2-1 && $year == $year2) {
	return "Igår $hour:$min";
    } elsif (time - $time < 6*24*60*60) {
	return $weekdays[$wday]." $hour:$min";	
    } elsif ($year == $year2) {
	return "$mday. $months[$mon] $hour:$min"
    } else {
	$year+=1900;
	return "$mday. $months[$mon] $year $hour:$min"
    }
}


#
# Fix URLer
#

sub buildhrefs {
   my $txt = $_[0];
   if ($$txt =~ /<XREF BIBEL="(.+)">/) {
      my $did = $1;
      my $poem = new Kalliope::Poem(longdid => $did);
      my $link = $poem->clickableTitleSimple;
      $$txt =~ s/<XREF BIBEL="$did">/$link/;
   }
   if ($$txt =~ /<XREF DIGT="(.+)">/) {
      my $did = $1;
      my $poem = new Kalliope::Poem(longdid => $did);
      my $link = $poem->clickableTitleSimple;
      $$txt =~ s/<XREF DIGT="$did">/$link/;
   }
   $$txt =~ s/<A\s+F=([^\s>]+)\s*>/<A HREF="biografi.cgi?fhandle=$1">/g;
   $$txt =~ s/<A\s+D=([^\s>]+)\s*>/<A HREF="digt.pl?longdid=$1">/g;
   $$txt =~ s/<A\s+K=([^\s>]+)\s*>/<A HREF="keyword.cgi?keyword=$1">/g;
   $$txt =~ s/<A\s+/<A CLASS=green /g;
   return $$txt;
}

#
# Returnerer en fils størrelse i kB
# 

sub filesize {
    my $filename = $_[0];
    my ($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size, $atime,$mtime,$ctime,$blksize,$blocks)
	= stat($filename);
    $size /= (1024);
    return sprintf ("%.0f kB",$size);
}

#
# Udskriver en dobbeltspaltet liste
#

sub doublecolumn {
    my $ptr = $_[0];
    my @blocks = @$ptr;
    my $total;
    my $subtotal = 0;
    my $columnchanged = 0;

    map { $total += $_->{'count'}+2 } grep {$_->{'count'}} @blocks;

    print '<TABLE WIDTH="100%" CELLPADDING=0><TR><TD VALIGN=top>';
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if (!$columnchanged && $subtotal > $total/2) {
	    $columnchanged = 1;
	    print '</TD><TD WIDHT=1 VALIGN=top BGCOLOR=black>';
	    print '<IMG SRC="gfx/trans1x1.gif" BORDER=0></TD>';
	    print '<TD WIDHT=10 VALIGN=top>';
	    print '<IMG SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    print '<TD VALIGN=top>';
	}
        $subtotal += $b->{'count'}+2;
	print $b->{'head'};
	print $b->{'body'}."<BR>";
    }
    print '</TD></TR></TABLE>';
}

sub doublecolumnHTML {
    my $ptr = $_[0];
    my $HTML;
    my @blocks = @$ptr;
    my $total;
    my $subtotal = 0;
    my $columnchanged = 0;

    map { $total += $_->{'count'}+2 } grep {$_->{'count'}} @blocks;

    $HTML .= '<TABLE WIDTH="100%" CELLPADDING=0><TR><TD VALIGN=top>';
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if (!$columnchanged && $subtotal > $total/2) {
	    $columnchanged = 1;
	    $HTML .= '</TD><TD WIDHT=1 VALIGN=top BGCOLOR=black>';
	    $HTML .= '<IMG SRC="gfx/trans1x1.gif" BORDER=0></TD>';
	    $HTML .= '<TD WIDHT=10 VALIGN=top>';
	    $HTML .= '<IMG SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    $HTML .= '<TD VALIGN=top>';
	}
        $subtotal += $b->{'count'}+2;
	$HTML .= $b->{'head'};
	$HTML .= $b->{'body'}."<BR>";
    }
    $HTML .= '</TD></TR></TABLE>';
    return $HTML;
}

sub sortObject {
    if ($a && $b) {
    return lc($a->sortString) cmp lc($b->sortString);
    } else { return 0 };
}

