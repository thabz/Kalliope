
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

package Kalliope::Date;

use strict;

my @months = qw (Jan Feb Mar Apr Maj Jun Jul Aug Sep Okt Nov Dec);
my @weekdays = qw (Søn Man Tir Ons Tors Fre Lør);
my @monthsLong = qw (Januar Februar Marts April Maj Juni Juli 
                     August September Oktober November December);

sub getMonthNamesShort {
    return @months;
}

sub getMonthNamesLong {
    return @monthsLong;
}

sub weekdayShortName {
    return $weekdays[$_[0]];
}

sub shortDate {
    my $time = shift;
    return '[Ingen dato]' unless $time;
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
	return "$mday. $months[$mon]"
    } else {
	$year+=1900;
	return "$mday. $months[$mon] $year"
    }
}

sub longDate {
    my $time = shift;
    return '[Ingen dato]' unless $time;
    my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($time);
    $year+=1900;
    return "$mday. $months[$mon] $year"
}

sub splitDate {
    my $date = shift;
    my ($y,$m,$d) = split '-',$date;
    return ($y,$m,$d);
}

1;
