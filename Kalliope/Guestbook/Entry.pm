#!/usr/bin/perl -w

package Kalliope::Guestbook::Entry;
use strict;
use lib '..';
use Kalliope::Guestbook;

my $GUESTBOOK_DIR = '../gaestebog';

sub new {
    my ($class,%arg) = @_;
    my $obj;
    my $date = $arg{'id'};
    open (FILE,"$GUESTBOOK_DIR/$date");
    my ($time,$navn,$email,$web,$text);
    foreach (<FILE>) {
	chop;
	if (/^\*\*D:/) {
	    s/^\*\*D://;
	    $obj->{'date'} = $_;
	}
	if (/^\*\*N:/) {
	    s/^\*\*N://;
	    $obj->{'name'} = $_;
	}
	if (/^\*\*E:/) {
	    s/^\*\*E://;
	    $obj->{'email'} = $_;
	}
	if (/^\*\*W:/) {
	    s/^\*\*W://;
	    $obj->{'homepage'} = $_;
	}
	if (/^\*\*T:/) {
	    s/^\*\*T://;
	    $obj->{'text'} = $_;
	}
    }
    close (FILE);
    bless $obj,$class;
    return $obj; 
}

sub name {
    return $_[0]->{'name'} || '';
}

sub email {
    return $_[0]->{'email'} || '';
}

sub text {
    return $_[0]->{'text'} || '';
}

sub homepage {
    return $_[0]->{'web'};
}

sub date {
    return $_[0]->{'date'};
}

1;
