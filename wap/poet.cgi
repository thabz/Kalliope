#!/usr/bin/perl

use lib '..';

use Kalliope;
use CGI (':standard');
use Kalliope::Page::WML;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];
push @crumbs, [$poet->name,"poet.cgi?fhandle=$fhandle"];

my $page = new Kalliope::Page::WML( 
	title => $poet->efternavn.' forside',
	crumbs => \@crumbs
       	);

my $WML = '';
$WML .= '<a href="poems.cgi?fhandle='.$poet->fhandle.'">Digte</a><br/>';
$WML .= '<a href="works.cgi?fhandle='.$poet->fhandle.'">Værker</a> ';
$page->addWML($WML);
$page->print;
