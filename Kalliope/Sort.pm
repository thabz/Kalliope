package Kalliope::Sort;

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

use utf8;
binmode STDOUT => ":utf8";

sub sort { 
    my ($a,$b) = @_;
    my $aa = mylc($a->{'sort'});
    $aa =~ s/aa/å/g;
    $aa =~ tr/àáâãäåçèéêëìíîïðñòóôõöùúûüý/aaaaæüceeeeiiiidnooooøuuuyy/;

    my $bb = mylc($b->{'sort'});
    $bb =~ s/aa/å/g;
    $bb =~ tr/àáâãäåçèéêëìíîïðñòóôõöùúûüý/aaaaæüceeeeiiiidnooooøuuuyy/;
    return $aa cmp $bb;
}

sub mylc {
    my $str = shift || '';
    $str =~ tr/A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ/a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ/;
    return $str;
}

sub myuc {
    my $str = shift;
    $str =~ tr/a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ/A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ/;
    return $str;
}

sub sortObject {
    my ($a,$b) = @_;
    if ($a && $b) {
	my $aa = $a->sortString;
	$aa = mylc($aa);
	$aa =~ s/aa/å/g;

	my $bb = $b->sortString;
	$bb = mylc($bb);
	$bb =~ s/aa/å/g;

	return $aa cmp $bb;
    } else {
        return 0
    };
}

sub fixForSort {
    my $s = shift;
    $s = mylc($s);
    $s =~ s/aa/å/g;
# $s =~ tr/a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ/A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ/;
    print STDERR "$s x";
    return $s;
}

1;
