#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::DB ();
use CGI (':standard');
use Kalliope::PersonHome;
use Kalliope::Poem;
use Kalliope::WorkHome;
use Kalliope::Page::WML;

my $dbh = Kalliope::DB->connect;
my $poem = new Kalliope::Poem ('longdid' => url_param('longdid'));
my $poet = $poem->author;
my $work = $poem->work;
my ($longdid,$fhandle,$vhandle) = ($poem->longdid,$poet->fhandle,$work->longvid);

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];
push @crumbs, [$poet->name,"poet.cgi?fhandle=$fhandle"];
push @crumbs, ["Værker","works.cgi?fhandle=$fhandle"];
push @crumbs, [$work->titleWithYear,"toc.cgi?fhandle=$fhandle&amp;vhandle=$vhandle"];
push @crumbs,[$poem->linkTitle,''];

my $page = new Kalliope::Page::WML( 
	title => $poem->linkTitle,
	crumbs => \@crumbs
       	);

my $WML = '<p>';
$WML .= renderPoem($poem);
$WML .= '</p>';

$page->addWML($WML);
$page->print;

sub renderPoem {
    my $poem = shift;
    my $HTML = '<b>'.$poem->topTitle.'</b>';
    if ($poem->subtitleAsHTML) {
	my $subtitle = $poem->subtitle;
	$subtitle =~ s/<BR>/<br\/>/g;
	$HTML .= "<br/>$subtitle";
    }
    $HTML .= '<br/>';
    
    $text = $poem->content(layout => 'raw');
    $text =~ s/<[^>]+>//g;
    $text =~ s/\n/<br\/>/g;
    $text =~ s/&mdash;/-/g;
    $text =~ s/&iuml;/ï/g;

    $HTML .= $text;
    return $HTML;
}
