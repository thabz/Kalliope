#!/usr/bin/perl -w

package Kalliope::Strings;
use strict ('vars');
use Carp;
use Kalliope::DB;

my $dbh = Kalliope::DB->connect;

sub stripHTML {
    my $string = shift;
    $string =~ s/<[^>]*>//g;
    return $string;
}

sub abbr {
    my ($string,$size) = @_;
    return substr($string,0,$size).'...';
}

1;
