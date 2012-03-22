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

use Kalliope;
use CGI qw(:standard);
use Kalliope::Page();
use Kalliope::Sort();
use Kalliope::Date ();
#use strict;
use utf8;

my $mode = url_param('mode') || 'titel';
my $country = Kalliope::Internationalization::country();
my $limit = url_param('limit') && url_param('limit') eq 'no' ? 0 : 1;

my %crumbTitle = ('aar'    => _('efter år'),
                  'titel'  => _('efter titel'),
		  'digter' => _('efter digter'),
		  'pop'    => _('mest populære' ));

my %pageTitle =  ('aar'    => _('Værker efter år'),
                  'titel'  => _('Værker efter titel'),
		  'digter' => _('Værker efter digter'),
		  'pop'    => _('Mest populære værker' ));

my @crumbs;
push @crumbs,[_('Værker'),"worksfront.cgi?cn=$country"];
push @crumbs,[$crumbTitle{$mode},''];

my $page = new Kalliope::Page (
    title => _('Værker'),
    titleLink => "worksfront.cgi?cn=$country",
    subtitle => $crumbTitle{$mode},
    country => $country,
    crumbs => \@crumbs,
    icon => 'works-green',
    pagegroup => 'worklist',
    countrySelector => 1,
    page => "kvaerker$mode" );

my $dbh = Kalliope::DB->connect;


if ($mode eq 'titel') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT fornavn,efternavn,fnavne.fhandle,vhandle,titel,aar,hascontent FROM fnavne,vaerker WHERE country = ? AND vaerker.fhandle = fnavne.fhandle ");
    $sth->execute($country);

    my ($i,$et,$to,@f);
    $i = 0;
    while ($f[$i] = $sth->fetchrow_hashref) {
	if ($country eq 'dk' && $f[$i]->{'titel'} =~ /^Den |^Det |^Af /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($country eq 'gb' && $f[$i]->{'titel'} =~ /^The /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($country eq 'fr' && $f[$i]->{'titel'} =~ /^La |^Les /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	}
	$f[$i]->{'sort'} = $f[$i]->{'titel'};
	$i++;
    };

    # Udskriv titler på vaerker
    my ($new,$last) = ('','');
    foreach my $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next if ( $f->{'aar'} && $f->{'aar'} eq "?");
	next unless $f->{'titel'};
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = Kalliope::Sort::myuc(substr($f->{'sort'},0,1));
	if ($new ne $last) {
	    $last = $new;
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>$new</DIV><BR>\n";
	}
	if ($f->{'hascontent'} eq 'no') {
	    $HTML .= "<I>".$f->{'titel'}."</I> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>";
	} else {
	    $HTML .= '<A CLASS=green HREF="vaerktoc.pl?fhandle='.$f->{'fhandle'}.'&vhandle='.$f->{'vhandle'}.'">';
	    $HTML .= "<I>".$f->{'titel'}."</I></A> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>";

	}
    }

    $HTML .= "<BR><BR><I>"._("Denne oversigt indeholder kun værker som har et faktisk udgivelsesår")."</I><BR>";
    $page->addBox( width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'aar') {

    my $sth = $dbh->prepare("SELECT v.*,f.fornavn,f.efternavn FROM vaerker AS v, fnavne AS f WHERE f.fhandle = v.fhandle AND v.country = ? AND v.aar != '?' AND v.aar IS NOT NULL ORDER BY v.aar ASC");
    $sth->execute($country);

    my $HTML = '<TABLE BORDER=0 CELLSPACING=0 CELLPADDING=0>';
    #Udskriv titler på vaerker
    my ($last,$last2,$last3) = (0,0,0);  
    
    while (my $v = $sth->fetchrow_hashref) {
        my $vaerkaar = $v->{'aar'};
	$vaerkaar =~ s/[^0-9]+//g;
	if (int("$vaerkaar") - int("$last") >= 10) {
	    $last = $vaerkaar - $vaerkaar%10;
	    $last2 = $last+9;
	    $HTML .= "<TR><TD COLSPAN=2><BR><DIV CLASS=listeoverskrifter>$last-$last2</DIV><BR></TD></TR>";
	}

        my $liVal = $vaerkaar ne $last3 ? "$vaerkaar" : '';
	$last3 = $vaerkaar;
        $HTML .= qq|<TR><TD NOWRAP>$liVal</TD>|;
	$HTML .= '<TD>&nbsp;<A HREF="fvaerker.pl?fhandle='.$$v{fhandle}.'">'.$$v{fornavn}.' '.$$v{efternavn}.'</A>: ';
	if ($$v{hascontent} ne 'yes') {
	    $HTML .= "<I>$$v{titel}</I><BR>";
	} else {
	    $HTML .= qq|<A CLASS=green HREF="vaerktoc.pl?fhandle=$$v{fhandle}&vhandle=$$v{vhandle}">|;
	    $HTML .= "<I>$$v{titel}</I></A><BR>";
	}
	$HTML .= '</TD></TR>';
    }
    $HTML .= '</TABLE>';

    $HTML .= "<BR><BR><I>"._("Denne oversigt indeholder kun værker som har et faktisk udgivelsesår")."</I><BR>";
    $page->addBox( width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'digter') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT fornavn, efternavn, fhandle FROM fnavne WHERE land = ? AND vers = 1");
    my $sthvaerker = $dbh->prepare("SELECT vid,titel,aar,hascontent FROM vaerker WHERE fhandle = ? ORDER BY aar");
    $sth->execute($country);
    my @f;
    while (my $f = $sth->fetchrow_hashref) {
	$f->{'sort'} = ($f->{'efternavn'}||'').($f->{'fornavn'}||'');
	push @f,$f;
    };

    my $last = "";
    my ($new,$html,$f,$v,$aar);
    foreach $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last = $new;
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>$new</DIV><BR>\n";
	}
	$sthvaerker->execute($f->{fhandle});
	if ($sthvaerker->rows) {
            $HTML .= '<SPAN CLASS="listeblue">&#149;</SPAN> ';
	    $f->{'navn'} =~ s/^, // if $f->{'navn'};
	    $HTML .= ($f->{efternavn} || '')."<BR>";
	    $html = '<DIV STYLE="padding:0 0 0 20">';
	    while ($v = $sthvaerker->fetchrow_hashref) {
		next if ($v->{'titel'} eq '');
		$aar = ($v->{aar} ne '?') ? "($v->{aar})" : '';
		if ($v->{'hascontent'} eq 'no') {
		    $html .= "<I>".$v->{'titel'}."</I> $aar, ";
		} else {
		    $html .='<A CLASS=green HREF="vaerktoc.pl?vid='.$v->{'vid'}.'">';
		    $html .= "<I>".$v->{'titel'}."</I> $aar</A>, ";
		}
	    }
	    $html =~ s/, $//;
	    $html .= '</DIV>';
	    $HTML .= $html;
	}
    }

    $page->addBox( width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'pop') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT fornavn, efternavn, v.titel as vtitel, v.vid, aar, f.fhandle, sum(hits) as hits, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f, vaerker as v WHERE dh.longdid = d.longdid AND d.fhandle = f.fhandle AND d.vid = v.vid AND f.land = ? GROUP BY v.vid,fornavn,efternavn,vtitel,aar,f.fhandle ORDER BY hits DESC ".($limit == 0 ? '' : 'LIMIT 10' ));
    $sth->execute($country);
    my $i = 1;
    my $total;
    my $aar;
    $HTML .= '<TABLE CLASS="oversigt" width="100%" CELLSPACING=0>';
    $HTML .= '<TR><TH>&nbsp;</TH><TH ALIGN="left">'._("Titel").'</TH><TH ALIGN="right">'._("Hits").'</TH><TH ALIGN="right">'._("Senest").'</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	$aar = $h->{'aar'} ne '?' ? ' ('.$h->{'aar'}.')' : '';
        my $class = $i % 2 ? '' : ' CLASS="darker" ';
	$HTML .= qq|<TR $class><TD>|.$i++.'.</TD>';
	$HTML .= '<TD>'.$h->{fornavn}.' '.($h->{efternavn}||'').': <A CLASS=green HREF="vaerktoc.pl?vid='.$h->{vid}.'"><I>'.$h->{vtitel}.'</I>'.$aar.'</A></TD>';
	$HTML .= '<TD ALIGN=right>'.$h->{'hits'}.'</TD>';
	$HTML .= '<TD ALIGN=right>'.Kalliope::Date::shortDate($h->{'lasttime'}).'</TD>';
	$total += $h->{'hits'};
    }
    my $endHTML = '';

    if ($limit == 1) {
        $HTML .= '</TABLE>';
        $endHTML = '<A class="more" HREF="kvaerker.pl?mode=pop&limit=no&cn='.$country.'">'._("Se hele listen...").'</A>';
    } else {
        $HTML .= "<TR><TD></TD><TD><B>"._("Total")."</B></TD><TD ALIGN=right>$total</TD><TD></TD></TR>";
        $HTML .= '</TABLE>';
    }
    $page->addBox( width => '90%',
	           content => $HTML,
	           end => $endHTML );
    $page->print;
}

