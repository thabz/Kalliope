#!/usr/bin/perl -w

use DBI;
use Kalliope;
use CGI qw(:standard);
use Web;
use strict;
do 'dk_sort.pl';

my $mode = url_param('mode');
my $LA = url_param('sprog');
my $limit = url_param('limit') || '';

$0 =~ /\/([^\/]*)$/;
&kheaderHTML("Værker",$LA,$1.'?mode='.$mode.'&sprog=');

if ($mode eq 'titel') {
    beginwhitebox("Værker efter titel","80%","left");

    my $sth = $dbh->prepare("SELECT fornavn,efternavn,fnavne.fhandle,vhandle,titel,aar,findes FROM fnavne,vaerker WHERE sprog=? AND vaerker.fid = fnavne.fid");
    $sth->execute($LA);

    my ($i,$et,$to,@f);
    while ($f[$i] = $sth->fetchrow_hashref) {
	if ($LA eq 'dk' && $f[$i]->{'titel'} =~ /^Den |^Det |^Af /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    $to =~ s/^å/Å/;
	    $to =~ s/^ø/Ø/;
	    $to =~ s/^æ/Æ/;
	    substr($to,0,1) = uc(substr($to,0,1));
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($LA eq 'uk' && $f[$i]->{'titel'} =~ /^The /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    substr($to,0,1) = uc(substr($to,0,1));
	    $f[$i]->{'titel'} = $to.", ".$et;
	} elsif ($LA eq 'fr' && $f[$i]->{'titel'} =~ /^La |^Les /) {
	    $f[$i]->{'titel'} =~ /^([^ ]+) (.*)/;
	    $et = $1;
	    $to = $2;
	    substr($to,0,1) = uc(substr($to,0,1));
	    $f[$i]->{'titel'} = $to.", ".$et;
	}

	$f[$i]->{'sort'} = $f[$i]->{'titel'};
#	$f[$i]->{'sort'} =~ s/Aa/Å/;
#	$f[$i]->{'sort'} =~ s/aa/å/;
	$i++;
    };

#Udskriv titler på vaerker
    my ($f,$new,$last);
    foreach $f (sort dk_sort2 @f) {
	next if ( $f->{'aar'} eq "?");
	next if ($f->{'titel'} eq '');
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last = $new;
	    print "<BR><SPAN CLASS=listeoverskrifter>$new</SPAN><BR>\n";
# print "<BR><I><FONT COLOR=#6384AC SIZE=+1><B>$new</B></FONT></I><BR>\n";
	}
	unless ($f->{'findes'}) {
	    print "<I>".$f->{'titel'}."</I> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>\n";
	} else {
	    print '<A CLASS=green HREF="vaerktoc.pl?'.$f->{'fhandle'}.'?'.$f->{'vhandle'}."?$LA\">\n";
	    print "<I>".$f->{'titel'}."</I></A> (".$f->{'aar'}.") - ".$f->{'fornavn'}." ".$f->{'efternavn'}."<BR>\n";

	}
    }

    print "<BR><BR><I>Denne oversigt indeholder kun værker som har et faktisk udgivelsesår</I><BR>\n";
    endbox();

} elsif ($mode eq 'aar') {
    beginwhitebox("Værker efter år","80%","left");
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
    my ($last,$last2,$vaerkaar,$vtitel,$vhandle,$exists); 
    foreach (sort @liste) {
	($vaerkaar,$vtitel,$vhandle,$fhandle,$ffornavn,$fefternavn,$exists) = split(/%/);
	if ( ($vaerkaar eq "?") && !($last eq "?")) {
	    last;
	}
	elsif ($vaerkaar-$last >= 10) {
	    $last = $vaerkaar - $vaerkaar%10;
	    $last2 = $last+9;
	    print "<BR><SPAN CLASS=listeoverskrifter>$last-$last2</SPAN><BR>\n";
	}

	print $vaerkaar.' - <A HREF="fvaerker.pl?'.$fhandle.'">'.$ffornavn.' '.$fefternavn.'</A>: ';
	if ($exists == 0) {
	    print "<I>$vtitel</I><BR>";
	} else {
	    print "<A CLASS=green HREF=\"vaerktoc.pl"."?"."$fhandle"."?".$vhandle."?$LA\">\n";
	    print "<I>$vtitel</I></A><BR>";
	}
    }

    print "<BR><BR><I>Denne oversigt indeholder kun værker som har et faktisk udgivelsesår</I><BR>\n";
    endbox();

} elsif ($mode eq 'digter') {
    beginwhitebox("Værker efter digter","80%","left");
    my $sth = $dbh->prepare("SELECT CONCAT(efternavn,', ',fornavn) as navn, fornavn, efternavn, fhandle,fid FROM fnavne WHERE sprog=?");
    my $sthvaerker = $dbh->prepare("SELECT vhandle,titel,aar,findes FROM vaerker WHERE fid = ? ORDER BY aar");
    $sth->execute($LA);
    my $i=0;
    my @f;
    while ($f[$i] = $sth->fetchrow_hashref) {
	$f[$i]->{'sort'} = $f[$i]->{'efternavn'}.$f[$i]->{fornavn};
	$i++;
    };

    my $last = "";
    my ($new,$html,$f,$v,$aar);
    foreach $f (sort dk_sort2 @f) {
	$f->{'sort'} =~ s/Aa/Å/g;
	$new = substr($f->{'sort'},0,1);
	if ($new ne $last) {
	    $last = $new;
	    print "<BR><SPAN CLASS=listeoverskrifter>$new</SPAN><BR>\n";
	}
	$sthvaerker->execute($f->{fid});
	if ($sthvaerker->rows) {
	    print $f->{navn}."<BR>";
	    $html = '<DIV STYLE="padding:0 0 0 20">';
	    while ($v = $sthvaerker->fetchrow_hashref) {
		next if ($v->{'titel'} eq '');
		$aar = ($v->{aar} ne '?') ? "($v->{aar})" : '';
		unless ($v->{'findes'}) {
		    $html .= "<I>".$v->{'titel'}."</I> $aar, ";
		} else {
		    $html .='<A CLASS=green HREF="vaerktoc.pl?'.$f->{'fhandle'}.'?'.$v->{'vhandle'}."?$LA\">\n";
		    $html .= "<I>".$v->{'titel'}."</I></A> $aar, ";
		}
	    }
	    $html =~ s/, $//;
	    $html .= '</DIV>';
	    print $html;
	}
    }
    endbox();

} elsif ($mode eq 'pop') {
    beginwhitebox("Mest populære værker","90%","left");
    my $sth = $dbh->prepare("SELECT fornavn, efternavn, v.titel as vtitel, vhandle, aar, f.fhandle, sum(hits) as hits, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f, vaerker as v WHERE dh.longdid = d.longdid AND d.fid = f.fid AND d.vid = v.vid AND f.sprog=? GROUP BY v.vid ORDER BY hits DESC ".(defined($limit) ? 'LIMIT '.$limit : ''));
    $sth->execute($LA);
    my $i = 1;
    my $total;
    my $aar;
    print '<TABLE width="100%">';
    print '<TR><TH></TH><TH>Titel</TH><TH>Hits</TH><TH>Senest</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
	$aar = $h->{'aar'} ne '?' ? ' ('.$h->{'aar'}.')' : '';
		print '<TR><TD>'.($i++).'.</TD>';
		print '<TD>'.$h->{fornavn}.' '.$h->{efternavn}.': <A CLASS=green HREF="vaerktoc.pl?'.$h->{fhandle}.'?'.$h->{vhandle}.'?'.$LA.'"><I>'.$h->{vtitel}.'</I>'.$aar.'</A></TD>';
		print '<TD ALIGN=right>'.$h->{'hits'}.'</TD>';
		print '<TD ALIGN=right>'.Kalliope::shortdate($h->{'lasttime'}).'</TD>';
		$total += $h->{'hits'};
		}

		if (defined($limit)) {
		print '</TABLE>';
		endbox('<A HREF="kvaerker.pl?mode=pop&sprog='.$LA.'"><IMG VALIGN=center BORDER=0 SRC="gfx/rightarrow.gif" ALT="Hele listen"></A>');
		} else {
		print "<TR><TD></TD><TD><B>Total</B></TD><TD ALIGN=right>$total</TD><TD></TD></TR>";
		print '</TABLE>';
		endbox();
		}
		}

		&kfooterHTML;

