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
use strict;

my $mode = url_param('mode') || 'titel';
my $LA = url_param('sprog') || 'dk';
my $limit = url_param('limit') || '10';

my %crumbTitle = ('aar'    => 'efter år',
                  'titel'  => 'efter titler',
		  'digter' => 'efter figter',
		  'pop'    => 'mest populære' );

my @crumbs;
push @crumbs,['Værker',''];
push @crumbs,[$crumbTitle{$mode},''];

my $page = new Kalliope::Page (
		title => 'Værker',
                lang => $LA,
		crumbs => \@crumbs,
                pagegroup => 'worklist',
                page => "kvaerker$mode" );

my $dbh = Kalliope::DB->connect;


if ($mode eq 'titel') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT fornavn,efternavn,fnavne.fhandle,vhandle,titel,aar,findes FROM fnavne,vaerker WHERE sprog=? AND vaerker.fid = fnavne.fid");
    $sth->execute($LA);

    my ($i,$et,$to,@f);
    $i = 0;
    while ($f[$i] = $sth->fetchrow_hashref) {
	if ($LA eq 'dk' && $f[$i]->{'titel'} =~ /^Den |^Det |^Af /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($LA eq 'uk' && $f[$i]->{'titel'} =~ /^The /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($LA eq 'fr' && $f[$i]->{'titel'} =~ /^La |^Les /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $f[$i]->{'titel'} = $to.", ".$et;
	}
	$f[$i]->{'sort'} = $f[$i]->{'titel'};
	$i++;
    };

    # Udskriv titler på vaerker
    my ($f,$new,$last);
    foreach my $f (sort { Kalliope::Sort::sort($a,$b) } @f) {
	next if ( $f->{'aar'} eq "?");
	next if ($f->{'titel'} eq '');
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = Kalliope::Sort::myuc(substr($f->{'sort'},0,1));
	if ($new ne $last) {
	    $last = $new;
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>$new</DIV><BR>\n";
	}
	unless ($f->{'findes'}) {
	    $HTML .= "<I>".$f->{'titel'}."</I> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>\n";
	} else {
	    $HTML .= '<A CLASS=green HREF="vaerktoc.pl?fhandle='.$f->{'fhandle'}.'&vhandle='.$f->{'vhandle'}.'">';
	    $HTML .= "<I>".$f->{'titel'}."</I></A> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>\n";

	}
    }

    $HTML .= "<BR><BR><I>Denne oversigt indeholder kun værker som har et faktisk udgivelsesår</I><BR>\n";
    $page->addBox( title => "Værker efter titel",
                   width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'aar') {
    my $HTML;
    my @liste = ();
    my ($fhandle,$ffornavn,$fefternavn,$vhandle,$fsdir,@v);
    open (FNAVNE, "data.$LA/fnavne.txt");
    while (<FNAVNE>) {
	chop($_);chop($_);
	($fhandle,$ffornavn,$fefternavn) = split(/=/);
	$fsdir = "fdirs/".$fhandle;
	open (VAERKER,$fsdir."/vaerker.txt") || next;
	while (<VAERKER>) {
	    @v=split(/=/,$_);
	    $vhandle=$v[0];
	    if (-e $fsdir."/".$vhandle.".txt") {
		push(@liste,"$v[2]%$v[1]%$vhandle%$fhandle%$ffornavn%$fefternavn%1");
	    } else { 
		push(@liste,"$v[2]%$v[1]%$vhandle%$fhandle%$ffornavn%$fefternavn%0");
	    }
	}
	close (VAERKER)
    }
    close(FNAVNE);

    #Udskriv titler på vaerker
    my ($last,$last2,$vaerkaar,$vtitel,$exists); 
    foreach (sort @liste) {
	($vaerkaar,$vtitel,$vhandle,$fhandle,$ffornavn,$fefternavn,$exists) = split(/%/);
	if ( ($vaerkaar eq "?") && !($last eq "?")) {
	    last;
	}
	elsif ($vaerkaar-$last >= 10) {
	    $last = $vaerkaar - $vaerkaar%10;
	    $last2 = $last+9;
	    $HTML .= "<BR><DIV CLASS=listeoverskrifter>$last-$last2</DIV><BR>\n";
	}

	$HTML .= $vaerkaar.' - <A HREF="fvaerker.pl?fhandle='.$fhandle.'">'.$ffornavn.' '.$fefternavn.'</A>: ';
	if ($exists == 0) {
	    $HTML .= "<I>$vtitel</I><BR>";
	} else {
	    $HTML .= qq|<A CLASS=green HREF="vaerktoc.pl?fhandle=$fhandle&vhandle=$vhandle">|;
	    $HTML .= "<I>$vtitel</I></A><BR>";
	}
    }

    $HTML .= "<BR><BR><I>Denne oversigt indeholder kun værker som har et faktisk udgivelsesår</I><BR>\n";
    $page->addBox( title => "Værker efter år",
                   width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'digter') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT CONCAT(efternavn,', ',fornavn) as navn, fornavn, efternavn, fhandle,fid FROM fnavne WHERE sprog=?");
    my $sthvaerker = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fid = ? ORDER BY aar");
    $sth->execute($LA);
    my @f;
    while (my $f = $sth->fetchrow_hashref) {
	$f->{'sort'} = $f->{'efternavn'}.$f->{fornavn};
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
	$sthvaerker->execute($f->{fid});
	if ($sthvaerker->rows) {
	    $HTML .= $f->{navn}."<BR>";
	    $html = '<DIV STYLE="padding:0 0 0 20">';
	    while ($v = $sthvaerker->fetchrow_hashref) {
		next if ($v->{'titel'} eq '');
		$aar = ($v->{aar} ne '?') ? "($v->{aar})" : '';
		unless ($v->{'findes'}) {
		    $html .= "<I>".$v->{'titel'}."</I> $aar, ";
		} else {
		    $html .='<A CLASS=green HREF="vaerktoc.pl?fhandle='.$f->{'fhandle'}.'&vhandle='.$v->{'vhandle'}.'">';
		    $html .= "<I>".$v->{'titel'}."</I></A> $aar, ";
		}
	    }
	    $html =~ s/, $//;
	    $html .= '</DIV>';
	    $HTML .= $html;
	}
    }

    $page->addBox( title => "Værker efter digter",
                   width => '80%',
                   content => $HTML );
    $page->print;

} elsif ($mode eq 'pop') {
    my $HTML;
    my $sth = $dbh->prepare("SELECT fornavn, efternavn, v.titel as vtitel, vhandle, aar, f.fhandle, sum(hits) as hits, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f, vaerker as v WHERE dh.longdid = d.longdid AND d.fid = f.fid AND d.vid = v.vid AND f.sprog=? GROUP BY v.vid ORDER BY hits DESC ".(defined($limit) ? 'LIMIT '.$limit : ''));
    $sth->execute($LA);
    my $i = 1;
    my $total;
    my $aar;
    $HTML .= '<TABLE width="100%">';
    $HTML .= '<TR><TH></TH><TH>Titel</TH><TH>Hits</TH><TH>Senest</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	$aar = $h->{'aar'} ne '?' ? ' ('.$h->{'aar'}.')' : '';
	$HTML .= '<TR><TD>'.($i++).'.</TD>';
	$HTML .= '<TD>'.$h->{fornavn}.' '.$h->{efternavn}.': <A CLASS=green HREF="vaerktoc.pl?fhandle='.$h->{fhandle}.'&vhandle='.$h->{vhandle}.'"><I>'.$h->{vtitel}.'</I>'.$aar.'</A></TD>';
	$HTML .= '<TD ALIGN=right>'.$h->{'hits'}.'</TD>';
	$HTML .= '<TD ALIGN=right>'.Kalliope::Date::shortDate($h->{'lasttime'}).'</TD>';
	$total += $h->{'hits'};
    }
    my $endHTML = '';

    if (defined($limit)) {
        $HTML .= '</TABLE>';
        $endHTML = '<A HREF="kvaerker.pl?mode=pop&sprog='.$LA.'"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Hele listen"></A>';
    } else {
        $HTML .= "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD><TD></TD></TR>";
        $HTML .= '</TABLE>';
    }
    $page->addBox( title => "Mest populære værker",
	           width => '90%',
	           content => $HTML,
	           end => $endHTML );
    $page->print;
}

