
package Kalliope::Search::Keyword;
@ISA = qw/ Kalliope::Search /;

use Kalliope::DB ();
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

sub pageTitle {
    my $title = shift->keyword->title;
    return "Søgning efter nøgleordet »$title«"
}

sub keyword {
    my $self = shift;
    return $self->{'keywordobj'} if $self->{'keywordobj'};
    my $obj = new Kalliope::Keyword(ord => $self->{'keyword'});
    $self->{'keywordobj'} = $obj;
    return $obj;
}

sub count {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT count(*) FROM keywords_relation as k,digte as d WHERE k.keywordid = ? AND k.othertype = 'digt' AND k.otherid = d.did AND d.lang = ?");
    $sth->execute($self->keyword->id,$self->lang);
    my ($hits) = $sth->fetchrow_array;
    $self->{'hits'} = $hits;
    return $hits;
}

sub needle {
    return shift->{'needle'};
}

sub result {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT d.did FROM keywords_relation as k,digte as d, digthits = h WHERE k.keywordid = ? AND k.othertype = 'digt' AND k.otherid = d.did AND d.lang = ? AND d.longdid = h.longdid ORDER BY h.hits DESC LIMIT ?,10");
    $sth->execute($self->keyword->id,$self->lang,$self->firstNumShowing);
    my @matches;
    while (my $d = $sth->fetchrow_hashref)  {
	push @matches,[$$d{'did'},'Kalliope::Poem',1];
    }
    $sth->finish();

    return @matches;
}

sub getExtraURLParam {
    return "keyword=".shift->keyword->ord;

}

