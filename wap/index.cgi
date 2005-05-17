#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::WML;

print STDERR CGI::user_agent();
print STDERR "\n";

@accepted = CGI::Accept();
foreach my $type (@accepted) {
   print STDERR $type."\n";
}


my $page = new Kalliope::Page::WML( title => 'Kalliope' );
my $WML = '<p>Velkommen til Kalliopes mobiludgave.</p>';
$WML .= '<p>';
$WML  .= '<img align="middle" width="16" height="21" src="gfx/poet-w16.gif" alt=""/><a href="poets.cgi">Digtere</a><br/>';
$WML .= '<img align="middle" width="16" height="17" src="gfx/keywords-w16.gif" alt=""/><a href="about.cgi">Om Kalliope</a>';
$WML .= '</p>';
$page->addWML($WML);
$page->print;
