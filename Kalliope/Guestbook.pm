#!/usr/bin/perl -w

package Kalliope::Guestbook;

use strict;
use Kalliope::Guestbook::Entry;


my $GUESTBOOK_DIR = '../gaestebog';

sub guestbookDir {
    return $GUESTBOOK_DIR;
}

sub firstEntries {
    my $antal = shift;
    opendir (DIR,$GUESTBOOK_DIR);
    my @files = reverse sort grep {-f "$GUESTBOOK_DIR/$_"} readdir(DIR);
    closedir (DIR);
    my @list;
    foreach (@files[0..($antal-1)]) {
       push @list, new Kalliope::Guestbook::Entry(id => $_);
    }
    return @list;
}

1;
