#!/usr/bin/perl -w

package Kalliope::Date;

use strict;

my @months = qw (Jan Feb Mar Apr Maj Jun Jul Aug Sep Okt Nov Dec);
my @weekdays = qw (Søn Man Tir Ons Tors Fre Lør);


sub weekdayShortName {
    return $weekdays[$_[0]];
}

sub shortDate {
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


1;
