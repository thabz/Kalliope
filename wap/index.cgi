#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::Page::WML;

my $page = new Kalliope::Page::WML( title => 'Mobil forside' );
my $WML = '<p>Velkommen til Kalliopes mobiludgave.</p>';
$WML .= '<a href="poets.cgi">Digtere</a>';
$page->addWML($WML);
$page->print;
