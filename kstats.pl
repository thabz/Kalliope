#!/usr/bin/perl

#  Udskriver forskellige pseudo-statistiske informationer om Kalliope.
#
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

use CGI;
use Kalliope;

do 'kstdhead.pl';

@ARGV = split(/\?/,$ARGV[0]);
chop($ARGV[0]);
chomp($ARGV[1]);
$valg = $ARGV[0]; 
$LA = $ARGV[1];

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?'.$valg.'?';

&kheaderHTML("Kalliope - Statistik",$LA);

&kcenterpageheader("Statistik");

if ($valg ==1) {
    $mytitel = "Mest flittige digter ifølge Kalliope\n";
} elsif ($valg == 2) {
    $mytitel = "Mest fotogene digter ifølge Kalliope\n";
} elsif ($valg == 3) {
    $mytitel = "Mest ærgerrige digter ifølge Kalliope\n";
} elsif ($valg == 4) {
    $mytitel = "Mest populære digter ifølge Kalliope\n";
} elsif ($valg == 5) {
    $mytitel = "Mest litterære kvarte århundrede ifølge Kalliope\n";
} elsif ($valg == 6) {
    $mytitel = "Server trafik\n";
} elsif ($valg == 7) {
    $mytitel = "Sidste besøgende\n";
} elsif ($valg == 8) {
    $mytitel = "Indhold\n";
} elsif ($valg == 9) {
    $mytitel = "20 mest populære digte i Kalliope\n";
} elsif ($valg == 10) {
    $mytitel = "Besøgs tidspunkter\n";
}
beginwhitebox($mytitel,"","left");

&getnames;

if ($valg==1) {
    # Mest flittige digter
    $sth = $dbh->prepare("select fornavn,efternavn,fhandle, count(did) as val from fnavne, digte where digte.fid=fnavne.fid and fnavne.sprog=? and afsnit=0 group by fnavne.fid order by val desc, efternavn;");
    $sth->execute($LA);
    print "<TABLE>";
    print "<TR><TD BGCOLOR=#DDDDDD>Navn</TD><TD BGCOLOR=#EEEEEE>Antal digte</TD><TD BGCOLOR=#EEEEEE>Fordeling</TD><TR>\n";

    while ($f = $sth->fetchrow_hashref) {
	$fmax = $f->{'val'} unless ($fmax);
	print "<TR><TD BGCOLOR=#DDDDDD>";
	print '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'fornavn'}.' '.$f->{'efternavn'}.'</A>';
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">";
	print $f->{'val'};
	print "</TD><TD BGCOLOR=#EEEEEE>";
	$wid = ( $f->{'val'} / $fmax)*200;
	print '<IMG SRC="gfx/poll_lcap.gif" BORDER=0>';
	print "<IMG WIDTH=$wid HEIGHT=16 SRC=\"gfx/poll_line.gif\">";
	print '<IMG SRC="gfx/poll_rcap.gif" BORDER=0>';
#print "<IMG WIDTH=$wid HEIGHT=10 SRC=\"../../html/kalliope/gfx/barstrip.gif\">";
	print "</TD></TR>\n";
	$total_q+=$f->{'val'};
    }
    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$total_q</TD><TR>\n";
    print "</TABLE>";
    
} elsif ($valg==2) {
    #Find antal portrætter pr. digter
    $sth = $dbh->prepare("select fornavn,efternavn,fhandle,pics from fnavne where sprog=? and pics!=0 order by pics desc, efternavn");
    $sth->execute($LA);

    print "<TABLE>";
    print "<TR><TD BGCOLOR=#DDDDDD>Navn</TD><TD BGCOLOR=#EEEEEE>Antal portrætter</TD><TD BGCOLOR=#EEEEEE>Fordeling</TD><TR>\n";
    while ($f = $sth->fetchrow_hashref) {
	$fmax = $f->{'pics'} unless ($fmax);
	print "<TR><TD BGCOLOR=#DDDDDD>";
	print '<A HREF="fpics.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'fornavn'}.' '.$f->{'efternavn'}.'</A>';
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">";
	print $f->{'pics'};
	print "</TD><TD BGCOLOR=#EEEEEE>";
	$wid = ($f->{'pics'}/$fmax)*100;
	$total_pi+=$f->{'antal'};
#print "<IMG WIDTH=$wid HEIGHT=10 SRC=\"gfx/barstrip.gif\">";
	print '<IMG SRC="gfx/poll_lcap.gif" BORDER=0>';
	print "<IMG WIDTH=$wid HEIGHT=16 SRC=\"gfx/poll_line.gif\">";
	print '<IMG SRC="gfx/poll_rcap.gif" BORDER=0>';
	print "</TD></TR>\n";
    }
    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$total_pi</TD><TR>\n";
    print "</TABLE>";
}
elsif ($valg == 3) {
    #Find antal udgive værker pr. digter
    $sth = $dbh->prepare("select fornavn,efternavn,fnavne.fhandle, count(*) as val from fnavne, vaerker where vaerker.fid=fnavne.fid and fnavne.sprog=? and aar!='?'group by fnavne.fid order by val desc, efternavn");
    $sth->execute($LA);

    print "<TABLE>";
    print "<TR><TD BGCOLOR=#DDDDDD>Navn</TD><TD BGCOLOR=#EEEEEE>Antal udgivne værker</TD><TD BGCOLOR=#EEEEEE>Fordeling</TD><TR>\n";
    while ($f = $sth->fetchrow_hashref) {
	$fmax = $f->{'val'} unless ($fmax);
	print "<TR><TD BGCOLOR=#DDDDDD>";
	print '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'fornavn'}.' '.$f->{'efternavn'}.'</A>';
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">";
	print $f->{'val'};
	print "</TD><TD BGCOLOR=#EEEEEE>";
	$wid = ($f->{'val'}/$fmax)*100;
	$total_va+=$f->{'val'};
	print '<IMG SRC="gfx/poll_lcap.gif" BORDER=0>';
	print "<IMG WIDTH=$wid HEIGHT=16 SRC=\"gfx/poll_line.gif\">";
	print '<IMG SRC="gfx/poll_rcap.gif" BORDER=0>';
#print "<IMG WIDTH=$wid HEIGHT=10 SRC=\"../../html/kalliope/gfx/barstrip.gif\">";
	print "</TD></TR>\n";
    }
    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$total_va</TD><TR>\n";
    print "</TABLE>";
}
elsif ($valg == 4) {
    #Find antal fremviste digte pr. digter
    $sth = $dbh->prepare("SELECT fornavn, efternavn, f.fhandle, sum(hits) as hits, max(lasttime) as lasttime FROM digthits as dh,digte as d,fnavne as f WHERE dh.longdid = d.longdid AND d.fid = f.fid AND f.sprog=? GROUP BY f.fid ORDER BY hits DESC");
    $sth->execute($LA);
    print "<TABLE>";
    print "<TR><TD BGCOLOR=#DDDDDD>Navn</TD><TD BGCOLOR=#EEEEEE>Digt-<BR>fremvisninger</TD><TD BGCOLOR=#EEEEEE>Fordeling</TD><TD BGCOLOR=#EEEEEE>Seneste fremvisning</TD><TR>\n";
    while ($f = $sth->fetchrow_hashref) {
	$fmax = $f->{'hits'} unless ($fmax);
	$total_popu += $f->{'hits'};
	print "<TR><TD BGCOLOR=#DDDDDD>";
	print '<A HREF="fvaerker.pl?'.$f->{'fhandle'}.'?'.$LA.'">'.$f->{'fornavn'}.' '.$f->{'efternavn'}.'</A>';
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">";
	print $f->{'hits'};
	print "</TD><TD BGCOLOR=#EEEEEE>";
	$wid = ($f->{'hits'}/$fmax)*100;
	print '<IMG SRC="gfx/poll_lcap.gif" BORDER=0>';
	print "<IMG WIDTH=$wid HEIGHT=16 SRC=\"gfx/poll_line.gif\">";
	print '<IMG SRC="gfx/poll_rcap.gif" BORDER=0>';
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"right\">";
	print Kalliope::shortdate($f->{'lasttime'});
	print "</TD></TR>\n";
    }
    
    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$total_popu</TD><TR>\n";
    print "</TABLE>";
	print "<BR><FONT SIZE=-2><I>Siden 13. marts 1999</I></FONT>";
    
}
elsif ($valg == 5) {
    #Find antal udgivne digte pr. kvarte århundrede
    $i=0;
    foreach $my_handle (keys(%fnavne)) {
	open(TJUMS,"fdirs/$my_handle/vaerker.txt") || next;
	while (<TJUMS>) {
	    ($vhandle,$vnavn,$vaar) = split(/=/);
	    if ($vaar ne "?") {
		$kvart = $vaar - ($vaar % 25);
		$kvarte{$kvart}++;
		$i++;
	    }
	}
	close(TJUMS);
    }
    $total_kv = $i;
    $kvmax = 0;
    foreach $k (keys(%kvarte)) {
	push(@kvlist,"$kvarte{$k}?$k");
	if ($kvarte{$k} > $kvmax) { $kvmax = $kvarte{$k}; };
    }
    print "<TABLE>";
    print "<TR><TD BGCOLOR=#DDDDDD>Navn</TD><TD BGCOLOR=#EEEEEE>Antal udgivne værker</TD><TR>\n";
    foreach (reverse sort {$a <=> $b} @kvlist) {
	($fantal,$aar)=split(/\?/);
	$aar2 = $aar + 24;
	print "<TR><TD BGCOLOR=#DDDDDD>";
	print "$aar - $aar2";
	print "</TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">";
	print $fantal;
	print "</TD><TD BGCOLOR=#EEEEEE>";
	$wid = ($fantal/$kvmax)*200;
#print "<IMG WIDTH=$wid HEIGHT=10 SRC=\"../../html/kalliope/gfx/barstrip.gif\">";	
	print '<IMG SRC="gfx/poll_lcap.gif" BORDER=0>';
	print "<IMG WIDTH=$wid HEIGHT=16 SRC=\"gfx/poll_line.gif\">";
	print '<IMG SRC="gfx/poll_rcap.gif" BORDER=0>';

	print "</TD></TR>\n";
    }
    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$total_kv</TD><TR>\n";
    print "</TABLE>";
} elsif ($valg == 10) {
    # Besøgstidspunkter
    print '<TABLE><TR><TD COLSPAN=2>';
    &insert_klokkeslet_fordeling();
    print '</TD></TR><TR><TD VALIGN=top>';
    &insert_ugedag_fordeling();
    print '</TD><TD ROWSPAN=4 VALIGN=top>';
    &insert_sidste_besoegende();
    print '</TD></TR><TR><TD>';
    &insert_sidste_uge_hits();
    print '</TD></TR><TR><TD>';
    &insert_uptime();
    print '</TD></TR><TR><TD>';
    &insert_sitehits();
    print '</TD></TR></TABLE>';
    print "<BR><FONT SIZE=-2><I>Siden 1. august 1999</I></FONT>";    
}

endbox();

&kfooterHTML;


#############################################
# getnames

sub getnames {
	open (IN, "data.$LA/fnavne.txt");
	while (<IN>) {
		chop($_);chop($_);
		($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
#		chomp($fhandle);
		$fnavne{$fhandle}=$ffornavn." ".$fefternavn;
#		push(@fhandles,$fhandle);
	#	push(@fliste,"$ffoedt%$fefternavn%$ffornavn%$fhandle%$fdoed");
	}
	close(IN);
}


sub insert_klokkeslet_fordeling {
    $sth = $dbh->prepare("SELECT hour,hits FROM hourhits");
    $sth->execute();
    while ($f = $sth->fetchrow_hashref) {
	$hourhits[$f->{'hour'}] = $f->{'hits'};
	$hourhitsmax = $f->{'hits'} if ($f->{'hits'}>$hourhitsmax);
    }
    
    #Print tabellen
    print '<FIELDSET><LEGEND>Fordelt på klokkeslet</LEGEND>';
    print "<TABLE>";
    print "<TR>";
    for (0..23) {
	print qq|<TD ALIGN=center CLASS=stat BGCOLOR="#EEEEEE">|.$_."</TD>";
    }
    print "</TR><TR>";
    for (0..23) {
	print "<TD ALIGN=center VALIGN=bottom>";
	if ($hourhits[$_]) {
	    $wid = int ((($hourhits[$_]/$hourhitsmax)*100)+0.5);
	    print qq|<IMG WIDTH=15 HEIGHT=$wid ALT="$wid" SRC="gfx/barstrip.gif">|;	
	} else {
	    print "&nbsp";
	}
	print "</TD>";
    }
    print "</TR><TR>";
    for (0..23) {
	print qq|<TD CLASS=stat ALIGN=center BGCOLOR="#EEEEEE">|;
	if ($hourhits[$_]>0) {
	    print $hourhits[$_];
	} else {
	    print '&nbsp;';
	}
	print "</TD>";
    }
    print "</TR></TABLE></FIELDSET>";
}

sub insert_ugedag_fordeling {
    $sth = $dbh->prepare("SELECT day,hits FROM dayhits");
    $sth->execute();
    while ($f = $sth->fetchrow_hashref) {
	$dayhits[$f->{'day'}] = $f->{'hits'};
	$dayhitsmax = $f->{'hits'} if ($f->{'hits'}>$dayhitsmax);
    }
    @weekdays = qw (man tir ons tors fre lør søn);
    #Print tabellen
    print '<FIELDSET><LEGEND>Fordelt på ugedage</LEGEND>';
    print "<TABLE>";
    print "<TR>";
    for (0..6) {
	print qq|<TD CLASS=stat ALIGN=center BGCOLOR="#EEEEEE">|.$weekdays[$_]."</TD>";
    }
    print "</TR><TR>";
    for (0..6) {
	print "<TD ALIGN=center VALIGN=bottom>";
	if ($dayhits[$_]) {
	    $wid = int (($dayhits[$_]/$dayhitsmax)*100);
	    print qq|<IMG ALT="$wid" WIDTH=15 HEIGHT=$wid SRC="gfx/barstrip.gif">|;	
	} else {
	    print "&nbsp";
	}
	print "</TD>";
    }
    print "</TR><TR>";
    for (0..6) {
	print qq|<TD CLASS=stat ALIGN=center BGCOLOR="#EEEEEE">|;
	if ($dayhits[$_]) {
	    print $dayhits[$_];
	} else {
	    print "&nbsp;";
	}
	print "</TD>";
    }
    print "</TR></TABLE></FIELDSET>";
}

sub insert_sidste_uge_hits {
    $datime = time;
    ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($datime);
    $i = $wday;
    @dage = ("Søn","Man","Tir","Ons","Tors","Fre","Lør");

#Load the values
    $counttotal=0;
    $countmax = 0;
    for ($j=0;$j<7;$j++) {
	$statfilename = "../stat/dailyhits.$i";
	open (FIL,"$statfilename");
	@counterl = <FIL>;
	close (FIL);
	$counter[$j] = $counterl[1];
	$counttotal += $counter[$j];
	if ($counter[$j] > $countmax) { $countmax = $counter[$j]; };
	if (--$i < 0) { $i = 6 };
    }
#Print tabellen
    print '<FIELDSET><LEGEND>Sidste uges traffik</LEGEND>';
    print "<TABLE>";
    print qq|<TR><TD CLASS="stat" BGCOLOR="#DDDDDD">Ugedag</TD><TD></TD><TD  CLASS="stat" BGCOLOR="#EEEEEE">Hits</TD></TR>|;
    $i = $wday;
    for ($j=0;$j<7;$j++) {
	$statfilename = "../stat/dailyhits.$i";
	open (FIL,"$statfilename");
	@counterl = <FIL>;
	$counter = $counterl[1];
	close (FIL);
	print qq|<TR><TD  CLASS=stat BGCOLOR="#DDDDDD">|;
	print $dage[$i]." $mday/".($mon+1);
	print "</TD><TD>";
	$wid = ($counter[$j]/$countmax)*200;
	print qq|<IMG WIDTH=$wid ALT="$wid" HEIGHT=10 SRC="gfx/barstrip.gif">|;
	print qq|</TD><TD  CLASS=stat BGCOLOR="#EEEEEE" ALIGN="center">|;
	print $counter[$j];
	print "</TD></TR>";
	if (--$i < 0) { $i = 6 };
	$datime -= 24*60*60;
	($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($datime);
    }
    print "<TR><TD  CLASS=stat BGCOLOR=#DDDDDD><B>Total</B></TD><TD></TD><TD  CLASS=stat BGCOLOR=#EEEEEE ALIGN=\"center\">$counttotal</TD></TR>\n";
    print "</TABLE></FIELDSET>";
}

sub insert_sidste_besoegende {
    open (FIL,"../stat/remote_hosts");

    print '<FIELDSET><LEGEND>Sidste besøgende</LEGEND>';
    print "<TABLE>";
    print "<TR><TD CLASS=stat BGCOLOR=#DDDDDD>Tidspunkt</TD><TD CLASS=stat BGCOLOR=#EEEEEE ALIGN=center>Host</TD></TR>\n";
    $i=0;
    foreach (<FIL>){
	next unless (++$i<20);
	@k = split(/\?/);
	print qq|<TR><TD CLASS=stat BGCOLOR="#DDDDDD">|;
	print Kalliope::shortdate($k[1]);
	print qq|</TD><TD CLASS=stat BGCOLOR="#EEEEEE" ALIGN="right">|;
	print $k[0];
	print "</TD></TR>\n";
    }
    close(FIL);
#    print "<TR><TD BGCOLOR=#DDDDDD><B>Total</B></TD><TD BGCOLOR=#EEEEEE ALIGN=\"center\">$counttotal</TD><TR>\n";
    print "</TABLE></FIELDSET>";

}

sub insert_uptime {
    open (FIL,"/usr/bin/uptime|");
    print '<FIELDSET><LEGEND>Uptime</LEGEND>';
    print join ' ',<FIL>;
    print '</FIELDSET>';
}

sub insert_sitehits {
    open (FIL,"../stat/counter");
    print '<FIELDSET><LEGEND>Hits</LEGEND>';
    print join ' ',<FIL>;
    print ' siden 25. januar 1999.';
    print '</FIELDSET>';
}
