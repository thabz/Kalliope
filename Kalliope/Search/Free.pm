
package Kalliope::Search::Free;
@ISA = qw/ Kalliope::Search /;

use Kalliope::DB;
use URI::Escape;
use strict;

my $dbh = Kalliope::DB->connect;

sub pageTitle {
    my $needle = shift->{'needle'};
    return "Søgning efter »$needle«"
}

sub hasSearchBox {
    return 1;
}

sub searchBoxHTML {
    my $self = shift;
    my $needle = $self->needle;
    my $LA = $self->lang;
    return qq|<FORM METHOD="get" ACTION="ksearch.cgi"><INPUT NAME="needle" VALUE="$needle"><INPUT TYPE="hidden" NAME="sprog" VALUE="$LA"></FORM>|;
}

sub count {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT count(*) FROM haystack WHERE (MATCH titel,hay AGAINST (?) > 0) AND lang = ?");
    $sth->execute($self->needle,$self->lang);
    my ($hits) = $sth->fetchrow_array;
    $self->{'hits'} = $hits;
    return $hits;
}

sub needle {
    return shift->{'needle'};
}

sub splitNeedle {
    my $needle2 = shift->needle;
    $needle2 =~ s/^\s+//;
    $needle2 =~ s/\s+$//;
    $needle2 =~ s/[^a-zA-ZæøåÆØÅ ]//g;
    return split /\s+/,$needle2;
}

sub escapedNeedle {
    return uri_escape(shift->needle);
}


sub result {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT id,id_class, MATCH titel,hay AGAINST (?) AS quality FROM haystack WHERE (MATCH titel,hay AGAINST (?) > 0) AND lang = ? ORDER BY quality DESC LIMIT ?,10");
    $sth->execute($self->needle,$self->needle,$self->lang,$self->firstNumShowing);

    print STDERR "Antal:".$sth->rows;
    my @matches;
    while (my $d = $sth->fetchrow_hashref)  {
	push @matches,[$$d{'id'},$$d{'id_class'},$$d{'quality'}];
    }
    $sth->finish();

    return @matches;
}

sub getExtraURLParam {
    my $self = shift;
    return 'needle='.uri_escape($self->needle);
}

sub log {
    my $self = shift;
    my $remotehost = CGI::remote_host();
    open (FIL,">>../stat/searches.log");
    print FIL localtime()."\$\$".$remotehost."\$\$".$self->needle."\$\$\n";
    close FIL;
}

