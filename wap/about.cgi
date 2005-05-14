#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::Page::WML;

my $page = new Kalliope::Page::WML( title => 'Om Kalliope' );
my $WML;
$WML .= '<p>';
$WML .= 'Kalliope er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning. Kalliope indeholder også udenlandsk digtning, men primært i et omfang som kan bruges til belysning af den danske samling.';
$WML .= '</p>';
$WML .= '<p><a href="index.cgi">Forsiden</a></p>';
$page->addWML($WML);
$page->print;
