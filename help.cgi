#!/usr/bin/perl -w

use strict;
use CGI qw/:standard/;
use Kalliope::Help;

my $help = new Kalliope::Help(url_param('helpid'));
print "Content-type: text/html\n\n";
print $help->textAsHTML;
