#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::iPhone;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my $poetMenuHTML = '';
$poetMenuHTML .= '<div title="Digter" class="panel">';
#$poetMenuHTML .= '<fieldset>';
#$poetMenuHTML .= '<ul id="poet" title="Digter">';
#$poetMenuHTML .= '<li><a href="">Værker</a></li>';
#$poetMenuHTML .= '<li><a href="">Digte</a></li>';
#$poetMenuHTML .= '<li><a href="">Biografi</a></li>';
#$poetMenuHTML .= '</ul>';
#$poetMenuHTML .= '</fieldset>';

@detaljer = split /<br>/, $poet->getDetailsAsHTML;


$poetMenuHTML .= '<h2>Detaljer</h2>';
$poetMenuHTML .= '<fieldset>';
    $poetMenuHTML .= '<div class="row">';
    $poetMenuHTML .= qq|<label>Navn</label>|;
    $poetMenuHTML .= '<span>'.$poet->name.'</span>';
    $poetMenuHTML .= '</div>';
foreach my $detalje (@detaljer) {
    my ($label,$data) = $detalje =~ /<b>(.*)<\/b>(.*)/;
    $poetMenuHTML .= '<div class="row">';
    $poetMenuHTML .= qq|<label>$label</label>|;
    $poetMenuHTML .= qq|<span>$data</span>|;
    $poetMenuHTML .= '</div>';
}
$poetMenuHTML .= '</fieldset>';

$poetMenuHTML .= '<h2>Bigrafi</h2>';
$poetMenuHTML .= '<fieldset>';
$poetMenuHTML .= '<div>';
$poetMenuHTML .= '<p style="text-align:justify">'.$poet->bio.'</p>';
$poetMenuHTML .= '</div>';
$poetMenuHTML .= '</fieldset>';

$poetMenuHTML .= '</div>';

my $page = new Kalliope::Page::iPhone( title => 'Kalliope' );
$page->addFragment($poetMenuHTML);
$page->print;



