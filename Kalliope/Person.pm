
#  Copyright (C) 1999-2001 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$

package Kalliope::Person;

use strict ('vars');
use Carp;
use Kalliope::DB ();
use Kalliope::Work ();
use Kalliope ();

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    my $sql;
    $sql = 'fhandle = "'.$arg{'fhandle'}.'"' if defined $arg{'fhandle'};
    $sql = 'fid = "'.$arg{'fid'}.'"' if defined $arg{'fid'};
    confess "Need some kind of id to initialize a new person\n" unless $sql;
    my $sth = $dbh->prepare("SELECT * FROM  fnavne WHERE $sql");
    $sth->execute();
    my $obj = $sth->fetchrow_hashref;
    bless $obj,$class;
    return $obj;
}

sub fhandle {
    return $_[0]->{'fhandle'};
}

sub fid {
    return $_[0]->{'fid'};
}

sub lang {
    return shift->{'sprog'};
}

sub thumbURI {
    my $self = shift;
    return $self->{'thumb'} ? 'fdirs/'.$self->fhandle.'/thumb.jpg' : '';
}

sub hasBio {
    return $_[0]->{'bio'};
}

sub bio {
   my $self = shift;
   my $sth = $dbh->prepare("SELECT biotext FROM fnavne WHERE fid = ?");
   $sth->execute($self->fid);
   my $bio = $sth->fetchrow_array || '';
   $bio =~ s/<BR>/<BR>&nbsp;&nbsp;&nbsp;&nbsp;/gi;
   Kalliope::buildhrefs(\$bio);
   return $bio;
}

sub lifespan {
   my $self = shift;
   return "(".$self->yearBorn.'-'.$self->yearDead.')';
}

sub yearBorn {
   return $_[0]->{'foedt'};
}

sub yearDead {
   return $_[0]->{'doed'};
}

sub sortString {
   return $_[0]->reversedName;
}

sub name {
   return $_[0]->{'fornavn'}.' '.$_[0]->{'efternavn'};
}

sub efternavn {
   return $_[0]->{'efternavn'};
}

sub reversedName {
   return $_[0]->{'efternavn'}.', '.$_[0]->{'fornavn'};
}

sub bioURI {
    return 'ffront.cgi?fhandle='.$_[0]->fhandle;
}

sub worksURI {
    return 'fvaerker.pl?'.$_[0]->fhandle;
}

sub clickableTitle {
    return $_[0]->clickableNameGreen;
}

sub smallIcon {
     return '<IMG BORDER=0 HEIGHT=32 WIDTH=32 SRC="gfx/poet_40.GIF">';
}

sub clickableNameBlack {
   my $self = shift;
   return '<A CLASS=black HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub clickableNameGreen {
   my $self = shift;
   return '<A CLASS=green HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub concurrentPersons {

}

sub poeticalWorks {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT vid FROM vaerker WHERE fid=? AND type='v' ORDER BY aar");
    $sth->execute($self->fid);
    my @list;
    while (my ($vid) = $sth->fetchrow_array) {
        push @list, new Kalliope::Work('vid' => $vid);
    }
    return @list;
}

sub proseWorks {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT vid FROM vaerker WHERE fid=? AND type='p' ORDER BY aar");
    $sth->execute($self->fid);
    my @list;
    while (my ($vid) = $sth->fetchrow_array) {
        push @list, new Kalliope::Work('vid' => $vid);
    }
    return @list;
}

sub blobHTML {
    my $self = shift;
    my $url = $self->thumbURI;
    my $HTML;
    my $fhandle = $self->fhandle;
    my $alt = "Tilbage til hovedmenuen for ".$self->name;
    $HTML .= qq|<A TITLE="$alt" HREF="ffront.cgi?fhandle=$fhandle"><IMG ALT="$alt" BORDER=0 SRC="$url"></A><BR>| if $url;
    $HTML .= $self->name.'<BR>'.$self->lifespan;
}

sub menu {
    my $self = shift;
    my %menuStruct = (
       vaerker => { url => 'fvaerker.pl?', 
                    title => 'Værker', 
                    status => $self->{'vaerker'} },
       titlelines => { url => 'flines.pl?mode=1&', 
                    title => 'Digttitler', 
                    status => $self->{'vers'} },
       firstlines => { url => 'flines.pl?mode=0&', 
                    title => 'Førstelinier', 
                    status => $self->{'vers'} },
       popular => { url => 'fpop.pl?', 
                    title => 'Populære', 
                    status => $self->{'vers'} },
       prosa     => { url => 'fvaerker.pl?mode=prosa&', 
                    title => 'Prosa', 
                    status => $self->{'prosa'} },
       pics      => { url => 'fpics.pl?', 
                    title => 'Portrætter', 
                    status => $self->{'pics'} },
       bio       => { url => 'biografi.cgi?', 
                    title => 'Biografi', 
                    status => $self->{'bio'} },
       samtidige => { url => 'samtidige.cgi?', 
                    title => 'Samtidige', 
                    status => 1 },
       links     => { url => 'flinks.pl?', 
                    title => 'Links', 
                    status => $self->{'links'} },
       sekundaer => { url => 'fsekundaer.pl?', 
                    title => 'Sekundær', 
		    status => $self->{'sekundaer'} } );
    my @keys = qw/vaerker titlelines firstlines popular prosa pics bio samtidige links sekundaer/;
    my $HTML;
    foreach my $key (@keys) {
        my %item = %{$menuStruct{$key}};
        my $url = $item{url}.'fhandle='.$self->fhandle;
        $HTML .= qq|[<A HREF="$url">$item{title}</A>] | if $item{status};
    }
    return $HTML;
}

1;
