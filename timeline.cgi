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
use Kalliope::Person;
use Web;
use CGI qw(:standard);
do 'kstdhead.pl';

my $PIXELS_PER_YEAR = 6;
my $ICON_HEIGHT = 20;

my $usedSlots = 1;
my @slotHTML;
my @slotDead;

my $LA = url_param('sprog');

$0 =~ /\/([^\/]*)$/;
$wheretolinklanguage = $1.'?sprog=';
kheaderHTML("Digtere - tidslinie",$LA);

my %timelinehist;
open FILE,"timeline.txt";
foreach (<FILE>) {
    my @line = split '=',$_;
    $timelinehist{$line[0]}->{'img'} = $line[1];
    $timelinehist{$line[0]}->{'txt'} = $line[2];
}
close(FILE);

my $sth = $dbh->prepare("SELECT fid FROM fnavne WHERE sprog=? AND foedt != '' AND foedt != '?' ORDER BY efternavn, fornavn");
$sth->execute($LA);

my @poets;
while (my $fid = $sth->fetchrow_array) { 
    my $poet = new Kalliope::Person(fid => $fid);
    $poet->{'strictBorn'} = &strictYear($poet->yearBorn);
    $poet->{'strictDead'} = &strictYear($poet->yearDead);
    if ($poet->{'strictBorn'} && $poet->{'strictDead'}) {
	push @poets, \$poet;
    }
}

@poets = sort { $$a->yearBorn cmp $$b->yearBorn } @poets;
my $firstPoet = $poets[0];
my $YEAR_BEGIN = $$firstPoet->{'strictBorn'} - $$firstPoet->{'strictBorn'} % 100;
my $YEAR_END = 2000;

my $poet;
foreach $poet (@poets) {
    my $emptySlot = &emptySlotId($$poet->{'strictBorn'});
    $slotHTML[$emptySlot] .= '<TD><IMG SRC="gfx/trans1x1.gif" WIDTH="'.(($$poet->{'strictBorn'}-$slotDead[$emptySlot])*$PIXELS_PER_YEAR).'" HEIGHT=1></TD>';
    $slotHTML[$emptySlot] .= '<TD CLASS="timeline"><IMG SRC="gfx/trans1x1.gif" WIDTH="'.(($$poet->{'strictDead'}-$$poet->{'strictBorn'})*$PIXELS_PER_YEAR).'" HEIGHT=1><BR>';
    $slotHTML[$emptySlot] .= $$poet->thumbURI ? ' <IMG BORDER=0 SRC="'.$$poet->thumbURI.qq|" HEIGHT="$ICON_HEIGHT"> | : qq|<IMG SRC="gfx/trans1x1.gif" HEIGHT="$ICON_HEIGHT">|;
    $slotHTML[$emptySlot] .= $$poet->clickableNameBlack.' '.$$poet->lifespan.'</TD>';
    $slotDead[$emptySlot] = $$poet->{'strictDead'};
}

beginwhitebox("Tidslinie $YEAR_BEGIN-$YEAR_END","","left");
print &historyContextHTML;
print &legendHTML;
print '<IMG SRC="gfx/trans1x1.gif" HEIGHT=4 WIDTH=1>';
foreach my $slotHTML (@slotHTML) {
    print "<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0><TBODY><TR>$slotHTML</TR></TBODY></TABLE>";
    print '<IMG SRC="gfx/trans1x1.gif" HEIGHT=2 WIDTH=1>';
}
endbox();

&kfooterHTML;

sub legendHTML {
    my $toggle = 0;
    my $html = '<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0 ><TR>';
    my $CENTURY_WIDTH = $PIXELS_PER_YEAR * 100;
    for (my $c = $YEAR_BEGIN; $c < $YEAR_END; $c += 100) {
	$html .= qq|<TD WIDTH="$CENTURY_WIDTH"><IMG WIDTH="$CENTURY_WIDTH" HEIGHT=1 SRC="gfx/trans1x1.gif"></TD>|;
    }
    $html .= '</TR><TR>';
    for (my $c = $YEAR_BEGIN; $c < $YEAR_END; $c += 100) {
        $toggle = ~$toggle;
        my $color = $toggle ? '(99,132,173)' : '(119,152,193)';
	$html .= qq|<TD ALIGN="center" STYLE="color:white; background-color: rgb$color" WIDTH="$CENTURY_WIDTH"><B>$c</B></TD>|;
    }
    $html .= '</TR></TABLE>';
    return $html;
}

sub historyContextHTML {
    my $html = '<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0 ><TR>';
    my $SIZE = $PIXELS_PER_YEAR*10;
    for (my $c = $YEAR_BEGIN; $c < $YEAR_END; $c += 10) {
        if ($timelinehist{$c}->{'img'}) {
	    my $alt = $timelinehist{$c}->{'txt'};
	    my $img = $timelinehist{$c}->{'img'} || 'unknown.jpg';
	    $html .= qq|<TD><IMG ALT="$alt" TITLE="$alt" WIDTH="$SIZE" HEIGHT="$SIZE" SRC="gfx/timeline/$img"></TD>|;
	} else {
	    $html .= qq|<TD><IMG WIDTH="$SIZE" HEIGHT="$SIZE" SRC="gfx/trans1x1.gif"></TD>|;
	}
    }
    $html .= '</TR></TABLE>';
    return $html;

}

sub strictYear {
    $_[0] =~ /(\d\d\d\d)/;
    return $1 || '';
}

sub emptySlotId {
    my $yearBorn = shift;
    foreach my $slotid (0..$usedSlots) {
	if (!defined $slotHTML[$slotid]) {
            print STDERR "1. Unused $slotid\n";
            $slotHTML[$slotid] = '';
            $slotDead[$slotid] = $YEAR_BEGIN;
	    return $slotid;
	}
        if ($yearBorn > $slotDead[$slotid]) {
            print STDERR "2. Unused $slotid\n";
            return $slotid;
        }
    }
    # make new slot
    my $newSlot = ++$usedSlots;
    $slotHTML[$newSlot] = '';
    $slotDead[$newSlot] = $YEAR_BEGIN;
    print STDERR "3. Unused $newSlot\n";
    return $newSlot;
}
