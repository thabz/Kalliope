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
      my $link;
      if ($poem) {
	  $link = $poem->clickableTitleSimple;
      } else {
          $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
      }
      $$txt =~ s/<XREF BIBEL="$did">/$link/;
   }
   if ($$txt =~ /<XREF DIGT="(.+)">/) {
      my $did = $1;
      my $poem = new Kalliope::Poem(longdid => $did);
      my $link;
      if ($poem) {
	  $link = $poem->clickableTitleSimple;
      } else {
          $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
      }
      $$txt =~ s/<XREF DIGT="$did">/»$link«/;
   }
   $$txt =~ s/<sc>/<span style="font-variant: small-caps">/g;
   $$txt =~ s/<\/sc>/<\/span>/g;
   $$txt =~ s/<A\s+F=([^\s>]+)\s*>/<A HREF="ffront.cgi?fhandle=$1">/g;
   $$txt =~ s/<A\s+D=([^\s>]+)\s*>/<A HREF="digt.pl?longdid=$1">/g;
   $$txt =~ s/<A\s+K=([^\s>]+)\s*>/<A HREF="keyword.cgi?keyword=$1">/g;
   $$txt =~ s/<A\s+V=([^\s>\/]+)\/([^\s>\/]+)\s*>/<A HREF="vaerktoc.pl?fhandle=$1&vhandle=$2">/g;
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

