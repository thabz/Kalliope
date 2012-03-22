#!/usr/bin/perl

use lib '..';

use Kalliope;
use Kalliope::DB ();
use CGI (':standard');
use Kalliope::PersonHome;
use Kalliope::WorkHome;
use Kalliope::Page::WML;

my $dbh = Kalliope::DB->connect;
my $fhandle = url_param('fhandle');
my $vhandle = url_param('vhandle');
my $vid = "$fhandle/$vhandle";
my $poet = Kalliope::PersonHome::findByFhandle($fhandle);
my $work = Kalliope::WorkHome::findByVid($vid);

my @crumbs;
push @crumbs, ['Digtere','poets.cgi'];
push @crumbs, [$poet->name,"poet.cgi?fhandle=$fhandle"];
push @crumbs, ["Værker","works.cgi?fhandle=$fhandle"];
push @crumbs, [$work->titleWithYear,""];

my $page = new Kalliope::Page::WML( 
	title => ''.$work->titleWithYear,
	crumbs => \@crumbs
       	);

my $WML = '<p>';
$WML .= renderSection($vid,undef,0);

$WML .= '</p>';

$page->addWML($WML);
$page->print;

sub renderSection {
    my ($vid,$parent,$depth) = @_;
    my $HTML;
    my $indentstr = ' 'x(2*$depth);
    my $sthgroup;
    if ($parent) {
       $sthgroup = $dbh->prepare("SELECT longdid,toctitel as title, type,did FROM digte WHERE vid = ? AND parentdid = ? AND toctitel IS NOT NULL ORDER BY vaerkpos");
       $sthgroup->execute($vid,$parent);
    } else {
       $sthgroup = $dbh->prepare("SELECT longdid,toctitel as title, type,did FROM digte WHERE vid = ? AND parentdid IS NULL AND toctitel IS NOT NULL ORDER BY vaerkpos");
       $sthgroup->execute($vid);
    }
    while (my $d = $sthgroup->fetchrow_hashref) {
	$HTML .= $indentstr;
	my $tit = $d->{'title'};
	my $num;
	if ($tit =~ /<num>/) {
	    ($num) = $tit =~ /<num>(.*?)<\/num>/;
	    $tit =~ s/<num>.*?<\/num>//;
	}
	$tit =~ s/&mdash;/-/g;
	if ($d->{'type'} eq 'section') {
	    $HTML .= qq|<b>$tit</b><br/>|;
   	    $HTML .= renderSection($vid,$d->{'did'},$depth+1);
	} else {
	    my $link = qq|<a href="poem.cgi?longdid=$$d{longdid}">$tit</a>|;
	    if ($num) {
		$HTML .= qq(<i>$num</i> $link);
	    } else {
		$HTML .= qq($link);
	    }
	    $HTML .= '<br/>';
	}
    }		
    return $HTML;
}
