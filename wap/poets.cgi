#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::PersonHome;
use Kalliope::Page::WML;

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];

my $page = new Kalliope::Page::WML( 
	title => 'Digtere',
	crumbs => \@crumbs
	);

my $WML = '<p>Oversigt over digtere.</p>';


my @poets = Kalliope::PersonHome::findByLang('dk');
$WML .= '<p>';
foreach my $poet (@poets) {
    $WML .= '<a href="poet.cgi?fhandle='.$poet->fhandle.'">'.$poet->name.'</a><br/>';
}
$WML .= '</p>';

$page->addWML($WML);
$page->print;
