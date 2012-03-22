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
my @blocks = findBlocks('dk');

if (defined $letter) {

    $WML = '<p>Vælg digter.</p>';
    $WML .= '<p>';
    foreach my $block (@blocks) {
	if ($block->{'letter'} eq $letter) {
	    $WML .= $block->{'body'};
	}
    }
    $WML .= '</p>';
} else {
    $WML = '<p>Vælg bogstav</p>';
    $WML .= '<p>';
    foreach my $block (@blocks) {
	my $letter = $block->{'letter'};
	my $ucletter = uc($letter);
	$WML .= qq|<a href="poets.cgi?letter=$letter">$ucletter</a> |;
    }
    $WML .= '</p>';
}

sub findBlocks {
    my $LA = shift;
    my @persons = Kalliope::PersonHome::findByLang($LA);
    my @f = grep { $_->getType eq 'poet' || $_->getType eq 'collection'} @persons;
    map {$_->{'sort'} = $_->efternavn.$_->fornavn } @f;

    my $last = "";
    my @blocks;
    my $bi = -1;
    my $new;
    foreach my $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next unless $f->{'sort'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = uc substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last=$new;
	    $bi++;
	    $blocks[$bi]->{'letter'} = $new;
	}
	$blocks[$bi]->{'body'} .= '<a href="poet.cgi?fhandle='.$f->fhandle.'">'.$f->name.'</a> '.$f->lifespan.'<br/>';
	$blocks[$bi]->{'count'}++;
    }
    return @blocks;
}

$page->addWML($WML);
$page->print;
