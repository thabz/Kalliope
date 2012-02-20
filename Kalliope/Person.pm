
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
use Kalliope::Page ();
use Kalliope::Sort ();
use Kalliope ();

my $dbh = Kalliope::DB->connect;

# Class method
sub exist {
    my $fhandle = shift;
    my $sth = $dbh->prepare("SELECT fhandle FROM fnavne WHERE fhandle = ?");
    $sth->execute($fhandle);
    return $sth->rows;
}

sub fhandle {
    return shift->{'fhandle'};
}

sub fid {
    return shift->{'fid'};
}

sub hasPoems {
    return shift->{'vers'};
}

sub hasWorks {
    return shift->{'workslist'} || '' ne '';
}

sub hasPics {
    return shift->{'pics'} || '' ne '';
}

# Digterens portrætter.
# Returnerer et array med hashrefs.
# Hver hash har keys thumbfile, file og måske text.
sub pics {
    my $i = 1;
    my @result;
    my $fhandle = shift->fhandle;
    while (-e "fdirs/".$fhandle."/p".$i.".jpg") {
	my %pic;
        $pic{thumbfile} = "fdirs/$fhandle/_p$i.jpg";
	$pic{file} = "fdirs/$fhandle/p$i.jpg";
	if (-e "fdirs/".$fhandle."/p".$i.".txt") {
	    my $html = '';
	    open(IN,"fdirs/".$fhandle."/p".$i.".txt");
	    while (<IN>) {
		$html .= $_."<br>";
	    }
	    $pic{text} = $html;
	}
	$i++;
	push @result,\%pic;
    }
    return @result;
}

sub lang {
    return shift->{'sprog'};
}

sub thumbURI {
    my $self = shift;
    return $self->{'thumb'} ? 'fdirs/'.$self->fhandle.'/thumb.jpg' : '';
}

sub icon {
    my $self = shift;
    return -e 'fdirs/'.$self->fhandle.'/frame.gif' ?
               'fdirs/'.$self->fhandle.'/frame.gif' :
	       'gfx/frames/poet-red.gif';
}

sub hasBio {
    return $_[0]->{'bio'};
}

sub bio {
   my $self = shift;
   my $sth = $dbh->prepare("SELECT biotext FROM fnavne WHERE fhandle = ?");
   $sth->execute($self->fhandle);
   my $bio = $sth->fetchrow_array || '';
   $bio =~ s/<BR>/<BR>&nbsp;&nbsp;&nbsp;&nbsp;/gi;
   Kalliope::buildhrefs(\$bio);
   return $bio;
}

sub getDetailsAsHTML {
    return shift->{'detaljer'} || '';
}

sub lifespan {
   my $self = shift;
   return '' if ($self->isUnknownPoet);
   my $born = $self->yearBorn;
   my $dead = $self->yearDead;
   $dead = _('Ukendt år') if $dead eq '?';
   if (substr($born,0,2) eq substr($dead,0,2)) {
       $dead = substr($dead,2);
   }
   $born = _('Ukendt år') if $born eq '?';
   return "("._('Ukendt levetid').")" if $born eq $dead;
   return "($born-$dead)";
}

sub yearBorn {
   return $_[0]->{'foedt'};
}

sub yearDead {
   return $_[0]->{'doed'};
}

sub isUnknownPoet {
   my $self = shift;
   return !($self->yearDead && $self->yearBorn);
}

sub sortString {
   return $_[0]->reversedName;
}

sub name {
   return $_[0]->fornavn.' '.$_[0]->efternavn;
}

sub fornavn {
   return shift->{'fornavn'} || '';
}

sub efternavn {
   return shift->{'efternavn'} || '';
}

sub reversedName {
    my $result = $_[0]->efternavn;
    $result .= $_[0]->fornavn eq '' ? '' : ',&nbsp;'.$_[0]->fornavn;
    return $result;
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
     return '<IMG alt="#" BORDER=0 HEIGHT=32 WIDTH=32 SRC="gfx/icons/poet-h48.gif">';
}

sub clickableNameBlack {
   my $self = shift;
   return '<A CLASS=black HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub clickableNameGreen {
   my $self = shift;
   return '<A CLASS=green HREF="'.$self->bioURI.'">'.$self->name.'</A>';
}

sub poemCount {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT count(*) FROM digte WHERE fid = ? AND layouttype = 'digt' AND afsnit = 0");
    $sth->execute($self->fid);
    my ($count) = $sth->fetchrow_array;
    return $count;
}

sub concurrentPersons {

}

sub getType {
    return shift->{'type'};
}

sub getCrumbs {
    my ($self,%args) = @_;
    my @crumbs;
    if ($self->getType eq 'person') {
	push @crumbs,[_('Personer'),'persons.cgi?list=az'];
    } else {
	push @crumbs,[_('Digtere'),'poets.cgi?list=az&amp;sprog='.$self->lang];
    }
    if ($args{'front'}) {
        push @crumbs,[$self->name,''];
    } else {
        push @crumbs,[$self->name,'ffront.cgi?fhandle='.$self->fhandle];
    }
    return @crumbs;
}

sub allVids {
    my $self = shift;
    my $workslist = $self->{'workslist'} || '';
    my @vids = split /,/,$workslist;
    return \@vids;
}

sub allWorks {
    my $self = shift;
    my $fhandle = $self->fhandle;
    my @result;
    map { push @result, new Kalliope::Work('vid' => "$fhandle/$_") } @{$self->allVids};
    return @result;
}

sub poeticalWorks {
    my $self = shift;
    my @works = $self->allWorks();
    my @result;
    foreach my $work (@works) {
	if (!$work->isProse) {
	    push @result, $work;
	}
    }
    return @result;
}

sub proseWorks {
    my $self = shift;
    my @works = $self->allWorks();
    my @result;
    foreach my $work (@works) {
	if ($work->isProse) {
	    push @result, $work;
	}
    }
    return @result;
}

sub hasHenvisninger {
    my $self = shift;
    return $self->{'hashenvisninger'} && $self->{'hashenvisninger'} > 0;
}

sub menu {
    my $self = shift;
    my $page = shift;
    my $poetName = $self->name;
    my %menuStruct = (
       vaerker => { url => 'fvaerker.pl?', 
                    title => _('Værker'), 
                    desc => _("%ss samlede poetiske værker", $poetName),
                    status => $self->hasWorks },
       titlelines => { url => 'flines.pl?mode=1&amp;', 
                    title => _('Digttitler'), 
                    desc => _("Vis titler på alle digte"),
                    status => $self->hasPoems },
       firstlines => { url => 'flines.pl?mode=0&amp;', 
                    title => _('Førstelinier'), 
                    desc => _("Vis førstelinier for samtlige digte"),
                    status => $self->hasPoems },
       search     => { url => 'fsearch.cgi?', 
                    title => _('Søgning'), 
                    desc => _("Søg i %ss værker", $poetName),
                    status => $self->hasPoems },
       popular => { url => 'fpop.pl?', 
                    title => _('Populære'), 
                    desc => _("Top-10 over mest læste %s digte i Kalliope",$poetName),
                    status => $self->hasPoems },
       prosa     => { url => 'fvaerker.pl?mode=prosa&amp;', 
                    title => _('Prosa'), 
	            desc => _("%ss prosatekster",$poetName),
                    status => $self->{'prosa'} },
       pics      => { url => 'fpics.pl?', 
                    title => _('Portrætter'), 
                    desc => _("Portrætgalleri for %s", $poetName),
                    status => $self->{'pics'} },
       bio       => { url => 'biografi.cgi?', 
                    title => _('Biografi'), 
                    desc => _("En kortfattet introduktion til %ss liv og værk", $poetName),
                    status => 1 },
       samtidige => { url => 'samtidige.cgi?', 
                    title => _('Samtid'), 
                    desc => _("Digtere som udgav værker i %ss levetid", $poetName),
                    status => !$self->isUnknownPoet && $self->yearBorn ne '?'},
       henvisninger => { url => 'henvisninger.cgi?', 
                    title => _('Henvisninger'), 
                    desc => _("Oversigt over tekster som henviser til %ss tekster", $poetName),
                    status => $self->hasHenvisninger},
       links     => { url => 'flinks.pl?', 
                    title => _('Links'), 
                    desc => _('Henvisninger til andre steder på internettet som har relevant information om %s',$poetName),
                    status => $self->{'links'} },
       bibliografi => { url => 'fsekundaer.pl?', 
                    title => _('Bibliografi'), 
                    desc => _("%ss bibliografi", $poetName),
		    status => $self->{'primaer'} || $self->{'sekundaer'} } );
    my @keys = qw/vaerker titlelines firstlines search popular prosa pics bio samtidige henvisninger links bibliografi/;
    my $HTML;
    my @itemsHTML;
    foreach my $key (@keys) {
	print STDERR "$key fucked" unless $menuStruct{$key};
        my %item = %{$menuStruct{$key}};
        my $url = $item{url}.'fhandle='.$self->fhandle;
        my $title = $key eq $page->{'page'} ?
                    '<b>'.$item{'title'}.'</b>' :
                    $item{'title'};
        push @itemsHTML, qq|<A CLASS="submenu" TITLE="$item{desc}" HREF="$url">$title</A>| if $item{status};
    }
#$HTML = join ' <span class="lifespan">&#149;</span> ',@itemsHTML;
    $HTML = join ' <span class="lifespan">&bull;</span> ',@itemsHTML;
    return $HTML;
}

sub getSearchResultEntry {
    my ($self,$escapedNeedle,@needle) = @_;
    my $content = $self->name;

    foreach my $ne (@needle) {
	$content=~ s/($ne)/\n$1\t/gi;
    }
    $content =~ s/\n/<B>/g;
    $content =~ s/\t/<\/B>/g;
    
    my $HTML = '<IMG ALT="'._("Digter").'" ALIGN="right" SRC="gfx/icons/poet-h48.gif">';
    $HTML .= '<A CLASS=blue HREF="ffront.cgi?fhandle='.$self->fhandle.qq|">|.$content.qq|</A><BR>|;
    $HTML .= '<SPAN STYLE="color: #a0a0a0">'.$self->lifespan."</SPAN><BR><BR>";
    return $HTML;
}

sub getBiblioEntry {
    my ($self,$bibid) = @_;
    my $sth = $dbh->prepare("SELECT entry FROM biblio WHERE fhandle = ? AND bibid = ?");
    $sth->execute($self->fhandle,$bibid);
    my ($entry) = $sth->fetchrow_array;
    return $entry;
}

sub getBiblioEntryAsString {
    my ($self,$bibid) = @_;
    my $entry = $self->getBiblioEntry($bibid);
    print STDERR "Entry for bibid $bibid doesn't exist!\n" unless $entry;
    $entry =~ s/<.*?>//g;
    return $entry;
    
}

1;

