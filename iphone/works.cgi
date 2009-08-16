#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::iPhone;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my $worksHTML = '<ul id="works" title="V&aelig;rker" selected="true">';
foreach my $work ($poet->poeticalWorks) {
    if ($work->hasContent) {
	$worksHTML .= '<li><a href="toc.cgi?fhandle='.$fhandle."&amp;vhandle=".$work->vhandle.'">'.$work->title.'</a> '.$work->parenthesizedYear.'</li>';
    } else {
	$worksHTML .= '<li>'.$work->title.' '.$work->parenthesizedYear.'</li>';
    }
}
$worksHTML .= '</ul>';

my $page = new Kalliope::Page::iPhone( title => 'Kalliope' );
$page->addFragment($worksHTML);
$page->print;



