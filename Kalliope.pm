#!/usr/bin/perl -w
package Kalliope;
use URI::Escape;
use Kalliope::Poem;

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
# Thumbnail pictures
#

sub insertthumb {
    my $h = shift;
    my ($tx,$ty) = imgsize ($h->{'thumbfile'});
    my $border = defined $h->{border} ? $h->{border} : 2;
    my $html = '';
    if ($h->{destfile}) {
	my ($dx,$dy) = imgsize ($h->{'destfile'});
	$html .= '<A HREF="javascript:{}" onclick=\'window.open("picfull.pl?imgfile='.uri_escape($h->{destfile}).'","popup","toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizeable=no,width='.$dx.',height='.$dy.'")\'>';
    } elsif ($h->{url}) {
	$html .= qq|<A HREF="$h->{url}">|;
    }
    $html .= qq|<IMG WIDTH=$tx HEIGHT=$ty ALT="$h->{alt}" SRC="$h->{thumbfile}" BORDER=$border></A>|;
    return $html;
}

sub imgsize {
    my $filename = shift;
    open(IDE,"./jpeggeometry $filename|");
    my ($kaj) = <IDE>;
    close (IDE);
    $kaj =~ /(.*)x(.*)/;
    return ($1,$2);
}

#
# Fix URLer
#

sub buildhrefs {
   my $txt = $_[0];
   if ($$txt =~ /<XREF BIBEL="(.+)">/) {
      my $did = $1;
      my $poem = new Kalliope::Poem(longdid => $did);
      my $link = $poem->clickableTitleSimple;
      $$txt =~ s/<XREF BIBEL="$did">/$link/;
   }
   $$txt =~ s/<A\s+F=([^\s>]+)\s*>/<A HREF="biografi.cgi?fhandle=$1">/g;
   $$txt =~ s/<A\s+D=([^\s>]+)\s*>/<A HREF="digt.pl?longdid=$1">/g;
   $$txt =~ s/<A\s+K=([^\s>]+)\s*>/<A HREF="keyword.cgi?keyword=$1">/g;
   $$txt =~ s/<A\s+/<A CLASS=green /g;
   return $$txt;
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

#
# Udskriver en dobbeltspaltet liste
#

sub doublecolumn {
    my $ptr = $_[0];
    my @blocks = @$ptr;
    my $total;
    my $subtotal = 0;
    my $columnchanged = 0;

    map { $total += $_->{'count'}+2 } grep {$_->{'count'}} @blocks;

    print '<TABLE WIDTH="100%" CELLPADDING=0><TR><TD VALIGN=top>';
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if (!$columnchanged && $subtotal > $total/2) {
	    $columnchanged = 1;
	    print '</TD><TD WIDHT=1 VALIGN=top BGCOLOR=black>';
	    print '<IMG SRC="gfx/trans1x1.gif" BORDER=0></TD>';
	    print '<TD WIDHT=10 VALIGN=top>';
	    print '<IMG SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    print '<TD VALIGN=top>';
	}
        $subtotal += $b->{'count'}+2;
	print $b->{'head'};
	print $b->{'body'}."<BR>";
    }
    print '</TD></TR></TABLE>';
}

sub doublecolumnHTML {
    my $ptr = $_[0];
    my $HTML;
    my @blocks = @$ptr;
    my $total;
    my $subtotal = 0;
    my $columnchanged = 0;

    map { $total += $_->{'count'}+2 } grep {$_->{'count'}} @blocks;

    $HTML .= '<TABLE WIDTH="100%" CELLPADDING=0><TR><TD VALIGN=top>';
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	if (!$columnchanged && $subtotal > $total/2) {
	    $columnchanged = 1;
	    $HTML .= '</TD><TD WIDHT=1 VALIGN=top BGCOLOR=black>';
	    $HTML .= '<IMG SRC="gfx/trans1x1.gif" BORDER=0></TD>';
	    $HTML .= '<TD WIDHT=10 VALIGN=top>';
	    $HTML .= '<IMG SRC="gfx/trans1x1.gif" WIDTH=10 BORDER=0></TD>';
	    $HTML .= '<TD VALIGN=top>';
	}
        $subtotal += $b->{'count'}+2;
	$HTML .= $b->{'head'};
	$HTML .= $b->{'body'}."<BR>";
    }
    $HTML .= '</TD></TR></TABLE>';
    return $HTML;
}

sub sortObject {
    if ($a && $b) {
    return lc($a->sortString) cmp lc($b->sortString);
    } else { return 0 };
}

