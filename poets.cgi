#!/usr/bin/perl -w

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

use strict;
no strict 'refs';
use CGI ();
use Kalliope::DB ();
use Kalliope::Web ();
use Kalliope::Page ();
use Kalliope::Sort ();

my $LA = CGI::url_param('sprog') || 'dk';

my %pageTypes = ('az' => {'title' => 'Digtere efter navn',
                          'function' => 'listaz',
			  'crumbtitle' => 'efter navn',
                          'page' => 'poetsbyname'},
                 '19' => {'title' => 'Digtere efter fødeår',
                          'function' => 'list19',
			  'crumbtitle' => 'efter fødeår',
                          'page' => 'poetsbyyear'},
                 'pics' => {'title' => 'Digtere efter udseende',
                          'function' => 'listpics',
			  'crumbtitle' => 'efter udseende',
                          'page' => 'poetsbypic'},
                 'flittige' => {'title' => 'Flittigste digtere',
                          'function' => 'listflittige',
			  'crumbtitle' => 'flittigste',
                          'page' => 'poetsbyflittige'}
                );

my $listType = CGI::url_param('list');

if ($listType ne 'az' && $listType ne '19' && 
    $listType ne 'pics' && $listType ne 'flittige') {
    Kalliope::Page::notFound;
}

my $struct = $pageTypes{$listType};

my @crumbs;
push @crumbs,['Digtere',''];
push @crumbs,[$struct->{'crumbtitle'},''];

my $page = new Kalliope::Page (
		title => $struct->{'title'},
		lang => $LA,
		crumbs => \@crumbs,
                pagegroup => 'poets',
                page => $struct->{'page'}); 
$page->addBox ( width => '75%',
                content =>  &{$struct->{'function'}});
$page->print;

sub listaz {
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt != '' ORDER BY efternavn, fornavn");
    $sth->execute($LA);
    my $i=0;
    my @f;
    while ($f[$i] = $sth->fetchrow_hashref) { 
	$f[$i]->{'sort'} = $f[$i]->{'efternavn'};
	$i++; 
    }

    my $last = "";
    my @blocks;
    my $bi = -1;
    my $new;
    my $f;
    foreach $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next unless $f->{'sort'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = uc substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last=$new;
	    $bi++;
	    $blocks[$bi]->{'head'} = "<DIV CLASS=listeoverskrifter>$new</DIV><BR>";
	}
	$blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->{'fhandle'}.'">'.$f->{'efternavn'}.", ".$f->{'fornavn'}.' <FONT COLOR="#808080">('.$f->{'foedt'}."-".$f->{'doed'}.')</FONT></A><BR>';
	$blocks[$bi]->{'count'}++;
    }

    # Udenfor kategori (dvs. folkeviser, o.l.)
    $bi++;
    $sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt='' ORDER BY fornavn");
    $sth->execute($LA);
    if ($sth->rows) {
	$blocks[$bi]->{'head'} = qq|<BR><DIV CLASS="listeoverskrifter">Ukendt digter</DIV><BR>|;
	while ($f = $sth->fetchrow_hashref) {
	    $blocks[$bi]->{'body'} .= '<A HREF="ffront.cgi?fhandle='.$f->{'fhandle'}.'">'.$f->{'fornavn'}.'</A><BR>';
	    $blocks[$bi]->{'count'}++;
	}
    }
    return Kalliope::Web::doubleColumn(\@blocks)
}

sub list19 {
    my $HTML;
    my @liste;
    my $dbh = Kalliope::DB->connect;
    open (IN, "data.$LA/fnavne.txt");
    while (<IN>) {
	chop($_);chop($_);
	s/\\//g;
	my ($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
	push @liste,"$ffoedt%$fefternavn%$ffornavn%$fhandle%$fdoed" if $ffoedt;
    }
    close(IN);

    my $last = 0;
    my $last2;
    my $notfirstukendt = 0;
    my $blocks = ();
    my $bi = -1;

    foreach (sort @liste) {
	my @f = split(/%/);
	if ($f[0]-$last >= 25) {
	    $last=$f[0]-$f[0]%25;
	    $last2=$last+24;
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>$last-$last2</DIV><BR>";
	}
	if ( ($f[0] eq "?") && ($notfirstukendt == 0) ) {
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>Ukendt fødeår</DIV><BR>\n";
	    $notfirstukendt=1;
	}
	$HTML .= "<A HREF=\"ffront.cgi?fhandle=".$f[3].'">';
	$HTML .= $f[2]." ".$f[1].' <FONT COLOR="#808080">('.$f[0]."-".$f[4].")</FONT></A><BR>";
     }

     # Udenfor kategori (dvs. folkeviser, o.l.)
     my $sth = $dbh->prepare("SELECT * FROM fnavne WHERE sprog=? AND foedt='' ORDER BY fornavn");
     $sth->execute($LA);
     if ($sth->rows) {
         $HTML .= "<BR><DIV CLASS=listeoverskrifter>Ukendt digter</DIV><BR>";
         while (my $f = $sth->fetchrow_hashref) {
             $HTML .= '<A HREF="ffront.cgi?fhandle='.$f->{'fhandle'}.'">';
             $HTML .= $f->{'fornavn'}.'</A><BR>';
         }
     }
     return $HTML;
}

sub listpics {
     my $HTML;
     my @liste = ();
     open (IN, "data.$LA/fnavne.txt");
     while (<IN>) {
         chop($_);chop($_);
         my ($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
         $fefternavn =~ s/^Aa/Å/;
         push(@liste,"$fefternavn%$ffornavn%$fhandle%$ffoedt%$fdoed");
     }
     close(IN);

     $HTML = "<TABLE ALIGN=center border=0 cellspacing=10><TR>";
     my $i=0;
     foreach (sort @liste) {
	 my @f = split(/%/);
	 $f[0] =~ s/^Å/Aa/;
	 if (-e "fdirs/$f[2]/thumb.jpg") {
	     $HTML .= "<TD align=center valign=bottom>";
	     $HTML .= Kalliope::Web::insertThumb({thumbfile=>"fdirs/$f[2]/thumb.jpg",url=>"fpics.pl?fhandle=$f[2]",alt=>"Vis portrætter af $f[1] $f[0]"});
	     $HTML .= "<BR>$f[1] $f[0]<BR>";
	     $HTML .= '<FONT COLOR="#808080">('.$f[3].'-'.$f[4].')</FONT><BR>';
	     $HTML .= "</TD>";
	     $i++;
	     if ($i % 3 == 0) {
		 $HTML .= "</TR><TR>";
	     }
	 }
     }
     $HTML .= "</TR></TABLE>";
     return $HTML;
}

sub listflittige {
    my $limit = 10;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("select fornavn,efternavn,foedt, doed, fhandle, count(did) as val from fnavne, digte where foedt != '' AND digte.fid=fnavne.fid and fnavne.sprog=? and afsnit=0 group by fnavne.fid order by val desc, efternavn ".(defined($limit) ? 'LIMIT '.$limit : ''));
    $sth->execute($LA);

    my $HTML;
    my $total;
    my $i = 1;
    $HTML .= '<TABLE WIDTH="100%">';
    $HTML .= '<TR><TH></TH><TH>Navn</TH><TH>Digte</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	$HTML .= '<TR><TD>'.$i++.'.</TD>';
	$HTML .= '<TD><A HREF="ffront.cgi?fhandle='.$h->{fhandle}.'">'.$h->{fornavn}.' '.$h->{efternavn}.'<FONT COLOR=#808080> ('.$h->{foedt}.'-'.$h->{doed}.')</FONT></A></TD>';
	$HTML .= '<TD ALIGN=right>'.$h->{'val'}.'</TD>';
	$total += $h->{val};
    }
#    if (defined($limit)) {
#	$HTML .= '</TABLE>';
#	endbox('<A HREF="flistflittige.pl?sprog='.$LA.'"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Hele listen"></A>');
#    } else {
#    $HTML .= "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD></TR>";
    $HTML .= '</TABLE>';
#}
    return $HTML; 
}
