#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::PersonHome;
use Kalliope::Page::WML;
use CGI (':standard');

my $letter = url_param('letter');

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];

my $page = new Kalliope::Page::WML( 
	title => 'Digtere',
	crumbs => \@crumbs
	);

my $WML;

if (defined $letter) {

    $WML = '<p>Vælg digter.</p>';
    my @poets = Kalliope::PersonHome::findByLang('dk');
    $WML .= '<p>';
    foreach my $poet (@poets) {
	my $efternavn = $poet->efternavn;
	if (lc(substr($efternavn,0,1)) eq $letter) {
	    $WML .= '<a href="poet.cgi?fhandle='.$poet->fhandle.'">'.$poet->name.'</a><br/>';
	}
    }
    $WML .= '</p>';
} else {
    $WML = '<p>Vælg bogstav</p>';
    $WML .= '<p>';
    foreach my $letter ('a'...'z') {
	my $ucletter = uc($letter);
	$WML .= qq|<a href="poets.cgi?letter=$letter">$ucletter</a> |;
    }
    $WML .= '</p>';
}

$page->addWML($WML);
$page->print;
