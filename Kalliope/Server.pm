
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

package Kalliope::Server;

use Kalliope::DB;

my $dbh = Kalliope::DB::connect;

use strict;
use utf8;

sub lastVisitors {
    return;
    my @result;
    open (FIL,"../stat/remote_hosts");
    my $i=0;
    foreach (<FIL>){
	next unless (++$i<20);
	my @k = split(/\?/);
        push @result, [$k[0], $k[1]];
    }
    close (FIL);
    return @result;
}

sub totalHits {
    return;
    open (FILE,"../stat/counter");
    my $hits = join ' ',<FILE>;
    close (FILE);
    return $hits;
}

sub newHit {
    return;
    #Læg een til den totale hitcounter
    my $statfilename = "../stat/counter";

    open (FIL,"+<$statfilename");
    my @counterl = <FIL>;
    my $globalcounter = $counterl[0];
    $globalcounter++;
    seek(FIL,0,0);
    print FIL $globalcounter."\n";
    close (FIL);

    #Læg een til denne datos hit-counter
    my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime;
    $statfilename = "../stat/dailyhits.$wday";
    if (!(-e $statfilename)) {
	open (FIL,">$statfilename");
	print FIL $mday."\n";
	print FIL "0\n";
	close (FIL);
    }

    open (FIL,"+<$statfilename");
    @counterl = <FIL>;
    my $counter = $counterl[1];
    my $filemday = $counterl[0];
    if ($filemday != $mday) {
	$counter=0;
    }
    $counter++;
    seek(FIL,0,0);
    print FIL $mday."\n";
    print FIL $counter."\n";
    close (FIL);

    # Increase denne dayhits
    my $sth = $dbh->prepare("select hits from dayhits where day=?");
    $sth->execute(($wday-1)%7);
    my $hits = $sth->fetchrow_array;
    $dbh->do("replace into dayhits (day,hits) VALUES (?,?)","",($wday-1)%7,++$hits);

    # Increase denne hourhits
    $hits = $dbh->selectrow_array("select hits from hourhits where hour=$hour");
    $dbh->do("replace into hourhits (hour,hits) VALUES (?,?)","",$hour,++$hits);

    # Registrer remote_host
    $statfilename = "../stat/remote_hosts";
    my $q = new CGI;
    my $remotehost = $q->remote_host();

    if (!(-e $statfilename)) {
	open (FIL,">$statfilename");
	print FIL "$remotehost?".time."\n";
	close (FIL);
    } else { 
	open (FIL,"+<$statfilename");
	my @k = <FIL>;
	seek (FIL,0,0);
	print FIL "$remotehost?".time."\n";
	for (my $i=0;$i<20;$i++) {
	    print FIL $k[$i];
	}
	close (FIL);
    }
}

sub uptime {
    open (FIL,"/usr/bin/uptime|");
    my $uptime = join ' ',<FIL>;
    close (FIL);
    return $uptime;
}

sub lastWeeksHits {
    my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
    my $i = $wday;
    my @dage = ("Søn","Man","Tir","Ons","Tors","Fre","Lør");
    my $counttotal = 0;
    my $countmax = 0;
    my $j;
    my @counter;
    my @counterl;
    for ($j=0; $j<7; $j++) {
	open (FIL,"../stat/dailyhits.$i");
	@counterl = <FIL>;
	close (FIL);
	$counter[$j] = $counterl[1];
	$counttotal += $counter[$j];
	$countmax = $counter[$j] if ($counter[$j] > $countmax);
	if (--$i < 0) { $i = 6 };
    }
    $i = $wday;
    my @result;
    for ($j=0;$j<7;$j++) {
        push @result, [$i, $counter[$j],$countmax ? ($counter[$j]/$countmax)*100 : 0];
	if (--$i < 0) { $i = 6 };
    }
    return ($counttotal,@result);
}

1;
