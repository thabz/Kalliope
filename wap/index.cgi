#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::Page::WML;

my $page = new Kalliope::Page::WML( title => 'Kalliope' );
my $WML = '<p>Velkommen til Kalliopes mobiludgave.</p>';
$WML .= '<p><a href="poets.cgi">Digtere</a></p>';
$page->addWML($WML);
$page->print;
