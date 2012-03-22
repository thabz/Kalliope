#!/usr/bin/perl

use lib '..';
use CGI (':standard');

use Kalliope;
use Kalliope::Page::iPhone;

my @persons = Kalliope::PersonHome::findByLang('dk');
my @f = grep { $_->getType eq 'poet'} @persons;
map {$_->{'sort'} = $_->efternavn } @f;
my $new;
my $last = "";
my $poetListHTML = '<ul id="poets" title="Digtere" selected="true">';
foreach my $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
    next unless $f->{'sort'};
    $f->{'sort'} =~ s/Aa/Ã/g;
    $new = uc substr($f->{'sort'},0,1);
    if ($new ne $last) {
	$last = $new;            
	$poetListHTML .= qq|<li class="group">$new</li>|;
    }
    $poetListHTML .= '<li><a href="poet.cgi?fhandle='.$f->fhandle.'">'.$f->reversedName.'</a></li>';
}

# Udenfor kategori (dvs. folkeviser, o.l.)
my @colls = grep {$_->getType eq 'collection'} @persons;
if ($#colls >= 0) {
    $poetListHTML .= qq|<li class="group">Ukendt digter</li>|;
    foreach my $f (@colls) {
	$poetListHTML .= '<li><a href="poet.cgi?fhandle='.$f->fhandle.'">'.$f->fornavn.'</a></li>';
    }
}
$poetListHTML .= '</ul>';

my $toolbarHTML = '<div class="toolbar">';
$toolbarHTML .= '<h1 id="pageTitle"></h1>';
$toolbarHTML .= '<a id="backButton" class="button" href="#"></a>';
$toolbarHTML .= '<a class="button" href="#searchform">S&oslash;g</a>';
$toolbarHTML .= '</div>';

my $page = new Kalliope::Page::iPhone( title => 'Kalliope' );
$page->addHTML($toolbarHTML);
$page->addHTML($poetListHTML);
$page->print;


