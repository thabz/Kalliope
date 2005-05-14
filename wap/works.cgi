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
	$WML .= '<a href="toc.cgi?fhandle='.$fhandle."&amp;vhandle=".$work->vhandle.'">'.$work->title.' '.$work->parenthesizedYear.'</a>';
    } else {
	$WML .= ''.$work->title.' '.$work->parenthesizedYear;
    }
    $WML .= '<br/>';
}
$WML .= '</p>';

$page->addWML($WML);
$page->print;

