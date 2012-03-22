#!/usr/bin/perl

use lib '..';

use Kalliope;
use CGI (':standard');
use Kalliope::Person;
use Kalliope::Page::WML;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];
push @crumbs, [$poet->name,"poet.cgi?fhandle=$fhandle"];
push @crumbs, ["Værker",""];

my $page = new Kalliope::Page::WML( 
	title => $poet->efternavn.'s værker',
	crumbs => \@crumbs
       	);

my $WML = '<p>';
my @works = $poet->poeticalWorks;
foreach my $work (@works) {
    if ($work->hasContent) {
	$WML .= '<img src="gfx/book-h16.gif" alt=""/>';
	$WML .= '<a href="toc.cgi?fhandle='.$fhandle."&amp;vhandle=".$work->vhandle.'">'.$work->title.'</a> '.$work->parenthesizedYear;
    } else {
	$WML .= '<img src="gfx/book-na-h16.gif" alt=""/>';
	$WML .= $work->title.' '.$work->parenthesizedYear;
    }
    $WML .= '<br/>';
}
$WML .= '</p>';

$page->addWML($WML);
$page->print;

