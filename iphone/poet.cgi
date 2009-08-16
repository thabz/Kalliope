#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::iPhone;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my $poetMenuHTML = '';
$poetMenuHTML .= '<ul id="poet" title="'.$poet->reversedName.'" selected="true">';
$poetMenuHTML .= '<li><a href="works.cgi?fhandle='.$poet->fhandle.'">V&aelig;rker</a></li>';
$poetMenuHTML .= '<li><a href="">Digte</a></li>';
$poetMenuHTML .= '<li><a href="biography.cgi?fhandle='.$poet->fhandle.'">Biografi</a></li>';
$poetMenuHTML .= '</ul>';

my $page = new Kalliope::Page::iPhone( title => 'Kalliope' );
$page->addFragment($poetMenuHTML);
$page->print;



