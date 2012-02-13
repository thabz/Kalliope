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

package Kalliope;
use URI::Escape;
use Kalliope::Poem;
use Kalliope::Poem::Bible;
use Kalliope::Internationalization qw(_);

#
# Datoer 
#

@months = qw (Jan Feb Mar Apr Maj Jun Jul Aug Sep Okt Nov Dec);
@weekdays = qw (Søn Man Tir Ons Tors Fre Lør);

sub shortdate {
    my $time = shift;
    my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($time);
    my ($sec2,$min2,$hour2,$mday2,$mon2,$year2,$wday2,$yday2,$isdst2) = localtime(time);
    $min = "0".$min if ($min<10);
    $hour = "0".$hour if ($hour<10);
    if ($yday == $yday2 && $year == $year2) {
	return "Idag $hour:$min";
    } elsif ($yday == $yday2-1 && $year == $year2) {
	return "Igår $hour:$min";
    } elsif (time - $time < 6*24*60*60) {
	return $weekdays[$wday]." $hour:$min";	
    } elsif ($year == $year2) {
	return "$mday. $months[$mon] $hour:$min"
    } else {
	$year+=1900;
	return "$mday. $months[$mon] $year $hour:$min"
    }
}

#
# Fix URLer
#

sub buildhrefs {
    my $txt = $_[0];
    return $$txt unless $$txt;
    $$txt =~ s/,,/&bdquo;/g;
    $$txt =~ s/''/&ldquo;/g;

    while ($$txt =~ /XREF BIBEL/i) {
	if ($$txt =~ /<XREF BIBEL="([^"]+)"\/?>/i) {
	    my ($did,$verse) = split /,/,$1;
	    my $poem = new Kalliope::Poem::Bible(longdid => $did);
  	    my $link;
	    if ($poem) {
	        $link = $poem->clickableTitleSimple($verse);
	    } else {
	        $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
	    }
	    $$txt =~ s/<XREF BIBEL="[^"]+"\/?>/$link/i;
        } 
    } 

    while ($$txt =~ /XREF DIGT/i) {
	if ($$txt =~ /<XREF DIGT="([^"]+)"\/?>/i) {
	    my $did = $1;
	    my $poem = new Kalliope::Poem(longdid => $did);
    	    my $link;
 	    if ($poem) {
	        $link = $poem->clickableTitleSimple;
 	    } else {
	        $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
	    }
	    $$txt =~ s/<XREF DIGT="$did"\/?>/$link/i;
        }
    }

    while ($$txt =~ /xref poem/i) {
	if ($$txt =~ /<xref poem="([^"]+)"\/?>/i) {
	    my $did = $1;
	    my $poem = new Kalliope::Poem(longdid => $did);
    	    my $link;
 	    if ($poem) {
	        $link = $poem->clickableTitleSimple;
 	    } else {
	        $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
	    }
	    $$txt =~ s/<xref poem="$did"\/?>/$link/i;
        }
    }


    if ($$txt =~ /<XREF KEYWORD="(.+)"\/?>/i) {
	my $did = $1;
	my $keyword = new Kalliope::Keyword(ord => $did);
	my $link;
	if ($keyword) {
	    $link = $keyword->clickableTitle('dk');
	} else {
	    $link = '<SPAN STYLE="color:red">Fejl! dødt link...</SPAN>';
	}
	$$txt =~ s/<XREF KEYWORD="$did"\/?>/$link/i;
    }
    if ($$txt =~ /<XREF ORD="(.+)"\/?>/i) {
	my $wid = $1;
	my $widurl = uri_escape($1);
	my $dbh = Kalliope::DB->connect;
	my $sth = $dbh->prepare("SELECT word FROM dict WHERE wid = ?");
	$sth->execute($wid);
	my ($ord) = $sth->fetchrow_array;
	my $link = qq|<A HREF="dict.cgi?wid=$widurl">$ord</A>|;
	$$txt =~ s/<XREF ORD="$wid"\/?>/$link/i;
    }
    
    $$txt =~ s/<sc>/<span style="font-variant: small-caps">/gi;
    $$txt =~ s/<\/sc>/<\/span>/gi;
    $$txt = makeMetricLetters($$txt);
    $$txt =~ s/<A\s+F="?([^\s>"]+)"?\s*>/<A HREF="ffront.cgi?fhandle=$1">/gi;
    $$txt =~ s/<A\s+D="?([^\s>"]+)"?\s*>/<A HREF="digt.pl?longdid=$1">/gi;
    $$txt =~ s/<A\s+K="?([^\s>"]+)"?\s*>/<A HREF="keyword.cgi?keyword=$1">/gi;
   $$txt =~ s/<A\s+V="?([^\s>\/]+)\/([^\s>\/"]+)"?\s*>/<A HREF="vaerktoc.pl?fhandle=$1&amp;vhandle=$2">/gi;
   $$txt =~ s/<a\s+work="(.*?)">/<a href="vaerktoc.pl?vid=$1">/gi;
   $$txt =~ s/<A\s+poem="?([^\s>"]+)"?\s*>/<A HREF="digt.pl?longdid=$1">/gi;
   $$txt =~ s/<A\s+poet="?([^\s>"]+)"?\s*>/<A HREF="ffront.cgi?fhandle=$1">/gi;
   $$txt =~ s/<A\s+person="?([^\s>"]+)"?\s*>/<A HREF="ffront.cgi?fhandle=$1">/gi;
   $$txt =~ s/<A\s+keyword="?([^\s>"]+)"?\s*>/<A HREF="keyword.cgi?keyword=$1">/gi;
   $$txt =~ s/<A\s+/<A CLASS=green /gi;
   $$txt =~ s/<year>(\d+)<\/year>/<A CLASS="timecontext" TITLE="Vis historisk kontekst for året $1." onClick="return openTimeContext($1)" HREF="javascript:{}">$1<\/A>/gi;
   return $$txt;
}

sub makeMetricLetters {
    my $text = shift;
    return $text unless $text =~ /<metrik>/i;
    while ($text =~ s/<metrik>(.*?)<\/metrik>/&_makeMetricLetters($1)/mie) {
       1;
    }
    return $text;
}

sub _makeMetricLetters {
    my $metrik = shift;
    my $output;
    my %conv = ( 'uu' => 'uu',
                 '|' => 'pipe',
		 'u' => 'u',
		 'n' => 'n',
		 'o' => 'o',
		 '||' => 'pipepipe',
		 'U' => 'bU',
		 'UU' => 'bUU',
		 '_u' => '_u',
		 'x' => 'x',
		 '_' => 'space',
		 '-' => 'minus',
		 '/' => 'slash' );
    foreach $part (split / +/,$metrik) {
        $output .= '<IMG STYLE="margin-left: 3px; vertical-align: middle" SRC="gfx/metrik/'.$conv{$part}.'.gif">';
    }
    return $output;
}

#
# Returnerer en fils størrelse i kB
# 

sub filesize {
    my $filename = $_[0];
    my ($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size, $atime,$mtime,$ctime,$blksize,$blocks)
	= stat($filename);
    $size /= (1024);
    return sprintf ("%.0f kB",$size);
}

