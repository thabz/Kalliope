#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::iPhone;

print STDERR CGI::user_agent();
#print STDERR "\n";

#@accepted = CGI::Accept();
#foreach my $type (@accepted) {
#   print STDERR $type."\n";
#}


my $page = new Kalliope::Page::iPhone( title => 'Kalliope' );
my $HTML = '<div id="index" selected="true">';
$html .= '<p>Velkommen til Kalliopes iPhone udgave.</p>';
$HTML .= '<p>';
$HTML  .= '<img align="middle" width="16"height="21" src="../gfx/icons/poet-w32.png" alt=""/><a href="poets.cgi" target="_self">Digtere</a><br/>';
$HTML .= '<img align="middle" width="16" height="17" src="../gfx/keywords-w16.gif" alt=""/><a href="about.cgi">Om Kalliope</a>';
$HTML .= '</p></div>';
$page->addHTML($HTML);
$page->print;

