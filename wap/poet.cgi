#!/usr/bin/perl

use lib '..';

use Kalliope;
use CGI (':standard');
use Kalliope::Page::WML;

my $fhandle = url_param('fhandle');
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];
push @crumbs, [$poet->name,""];

my $page = new Kalliope::Page::WML( 
	title => $poet->name,
	crumbs => \@crumbs
       	);

my $WML = '<p>';
#$WML .= '<a href="poems.cgi?fhandle='.$poet->fhandle.'">Digte</a><br/>';
$WML .= '<img src="gfx/works-w16.gif" alt="Værker"/><a href="works.cgi?fhandle='.$poet->fhandle.'">Værker</a> ';
$WML .= '</p>';
$page->addWML($WML);
$page->print;
