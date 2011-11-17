
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

package Kalliope::Poem;

use strict ('vars');
use Carp;
use Kalliope::DB;
use Kalliope::Keyword;
use Kalliope::Person;
use Kalliope::PersonHome;
use Kalliope::Work;
use Kalliope::WorkHome;
use Kalliope::Strings;
use Kalliope::Quality;
use Kalliope::Poem::Bible;

my $dbh = Kalliope::DB->connect;

sub new {
    my ($class,%arg) = @_;
    $arg{'longdid'} = $arg{'id'} if $arg{'id'};
    confess "Need some kind of id to initialize a new poem\n" unless $arg{'longdid'};
    my $sth = $dbh->prepare("SELECT did,fhandle,vid,longdid,toptitel,linktitel,toctitel,underoverskrift,foerstelinie,type,quality FROM digte WHERE longdid = ?");
    $sth->execute($arg{'longdid'});
    return undef unless $sth->rows;

    my $obj = $sth->fetchrow_hashref;
    
    $class = 'Kalliope::Poem::Bible' if $obj->{'longdid'} =~ /^(bibel|bible)/;
    bless $obj,$class;
    
    $obj->{'quality_obj'} = new Kalliope::Quality($obj->{'quality'});
    return $obj;
}

# Class method
sub exist {
    my $fhandle = shift;
    my $sth = $dbh->prepare("SELECT longdid FROM digte WHERE longdid = ?");
    $sth->execute($fhandle);
    return $sth->rows;
}

sub did {
    return $_[0]->{'did'};
}

sub longdid {
    return $_[0]->{'longdid'};
}

sub isProse {
    return shift->{'type'} eq 'prose';
}

sub topTitle {
    return $_[0]->{'toptitel'};
}

sub linkTitle {
    return $_[0]->{'linktitel'};
}

sub tocTitle {
    return shift->{'toctitel'};
}

sub sortString {
    return $_[0]->linkTitle;
}

sub subtitle {
    my $self = shift;
    $self->{'underoverskrift'} =~ s/\n/<BR>/g if $self->{'underoverskrift'}; 
    return $self->{'underoverskrift'};
}

sub subtitleAsHTML {
    my $self = shift;
    $self->{'underoverskrift'} = $self->extractFootnotes($self->{'underoverskrift'});
    my $subtitle = $self->{'underoverskrift'} || '';
    $subtitle =~ s/\n/<br>/g;
    return $subtitle;
}

sub firstline {
    return $_[0]->{'foerstelinie'};
}

sub quality {
    return shift->{'quality_obj'};
}

sub pics {
    my $self = shift;
    return @{$self->{'picscache'}} if $self->{'picscache'};
    my @result;
    my $fhandle = $self->fhandle;
    my $sth = $dbh->prepare("SELECT caption,url FROM textpictures WHERE longdid = ? ORDER BY orderby");
    $sth->execute($self->longdid);
    while (my ($desc,$url) = $sth->fetchrow_array) {
	my $thumb = $url;
	$thumb =~ s/^(.*?)([^\/]+)$/$1_$2/;
	push @result,{ thumbfile => 'fdirs/'.$fhandle.'/'.$thumb,
	    destfile =>  'fdirs/'.$fhandle.'/'.$url,
	    description => $desc };

    }
    $self->{'picscache'} = \@result;
    return @result;

}

sub hasPics {
    my @pics = shift->pics();
    return $#pics >= 0;
}

sub resolveBiblioTags {
    my ($self,$content) = @_;
    while ($content =~ /<biblio>/mi) {
	my ($bibid) = $content =~ /<biblio>(.*?)<\/biblio>/mi;
	my $entry = $self->author->getBiblioEntryAsString($bibid);
	$content =~ s/<biblio>$bibid<\/biblio>/<acronym title="$entry"><i>$bibid<\/i><\/acronym>/im;
    }
    return $content;
}

sub extractFootnotes {
    my ($self,$content) = @_;
    return '' unless defined $content;
    my @footnotes = $self->{'footnotes'} ? @{$self->{'footnotes'}} : ();
    my $num = $#footnotes >= 0 ? $#footnotes + 2 : 1;
#$content =~ s/<note>/<footnote>/g;
#   $content =~ s/<\/note>/<\/footnote>/g;
    while ($content =~ s/<footnote>(.*?)<\/footnote>/<footmark id="footnote$num"\/>/mi) {
       push @{$self->{'footnotes'}},$1;
       $num++;
    }
    return $content;
}

sub footnotes {
    my $self = shift;
    return $self->{'footnotes'} ? @{$self->{'footnotes'}} : ();
}

sub getContentAsLineHashes {
    my $self = shift;
    return $self->{'lineHashes'} ? @{$self->{'lineHashes'}} : ();
}

sub hasLineNotes {
    return shift->{'hasLineNotes'} || 0;
}

sub content {
    my $self = shift;
    my %options = @_ if $#_;
    
    unless (defined $self->{'content'}) {
	my $sth = $dbh->prepare("SELECT indhold FROM digte WHERE did = ?");
	$sth->execute($self->did);
	my $data = $sth->fetchrow_hashref;
	$self->{'indhold'} = $data->{'indhold'};
	$self->{'raw'} = $data->{'indhold'};
	$self->{'indhold'} = $self->extractFootnotes($self->{'indhold'});
        $self->{'indhold'} = $self->resolveBiblioTags($self->{'indhold'});
	$self->{'indhold'} = $self->_resolveTags($self->{'indhold'});
    }
    my $result;

    if (%options && $options{'layout'} eq 'raw') {
	return $self->{'raw'};
    } elsif ($self->isProse) {
         $result = $self->_contentAsProseHTML();
    } elsif (%options && $options{'layout'} eq 'plainpoem') {
         $result = $self->_contentAsPlainPoemHTML();
    } else {
         $result = $self->_contentAsPoemHTML();
    }
    return $result;
}

sub _contentAsProseHTML {
    my $self = shift;
    my @indhold;
    foreach my $line (split /\n/,$self->{'indhold'}) {
        $line =~ s/^(\s+)/_nbsp($1)/e;
	if ($line =~ /^ *(\-\-\-\-*) *$/) {
	    my $width = (length $1)*10;
	    $width = 100 if $width > 100;
	    $line = qq|<hr align="center" noshade size=1 color="black" width="$width%" style="color:black">|;
	} else {
	    $line = "$line\n";
	}
        # <center> har indbygget <br> så fjern \n
	if ($line =~ /<center>/) {
            $line =~ s/\n$//;
	}
	push @indhold,"$line";
    }
    my $result = join "",@indhold;
    $result  =~ s/\n/<br>\n/g;
    return $result;
}

sub _contentAsPoemHTML {
    my $self = shift;
    my $result = '';
    my $num = 0;
    my $dispNum = 0;
    my $lastNum = 0;
    foreach my $line (split /\n/,$self->{'indhold'}) {
	    my %lineHash;
        
	    if ($line =~ /<resetnum>/) {
	        $line =~ s/<resetnum>//;
	        $lastNum=0;
	        $dispNum=0;
	        $num=0;
	    }
	    my $lineForTjek = $line;
	    $lineForTjek =~ s/<[^>]+>//g;
	    if ( $lineForTjek =~ /[^ _\t\-]/
	    	&& $lineForTjek !~ /^ *\d+\.? *$/
	    	&& $lineForTjek !~ /^ *\[\d+\] *$/
	    	&& $line !~ /<nonum>/
	    	&& $line !~ /<wrap>/
	    	&& $lineForTjek !~ /^[ \t]*[IVXLCDM]+\.? *$/)
	    {
	        $num++;
	    } else {
                # To make <td> not collapse in height.
	        $line .= '&nbsp;';
	    }
	    my $align = 'left';
        
            # Gray out versenumbers
	    if ($lineForTjek =~ /^[ \t]*[IVXLCDM]+\.? *$/ 
                   || $lineForTjek =~ /^ *\d+\.? *$/
	           || $lineForTjek =~ /^ *\[\d+\] *$/ ) {
	        $line = qq|<span style="color:#808080">$line</span>|;
	    }
        
	    if ($line =~ /<center>/) {
	        $align = 'center';
	        $line =~ s/<\/?center>//g;
	    }
	    if ($line =~ /<right>/) {
	        $align = 'right';
	        $line =~ s/<\/?right>//g;
	    }
	    $lineHash{'linenum'} = $num;
	    $lineHash{'align'} = $align;
        
	    $line =~ s/<\/?nonum>//gi;
        
	    if ($lineForTjek =~ /^ *(\-\-\-\-*) *$/) {
	        my $width = (length $1)*10;
	        $width = 100 if $width > 100;
	        $line = qq|<hr noshade size=1 color="black" width="$width%" style="color:black">|;
	        $align = 'center';
	    }
        
	    if (($num % 5 == 0) && $lastNum ne $num) {
	        $dispNum = $num;
	        $lastNum = $num;
	    } else {
	        $dispNum = '';
	    };
	    $lineHash{'displayLineNumber'} = $dispNum;
        
	    my $wrap = 'nowrap';
	    if ($line =~ /<wrap>/i) {
	        $wrap = 'normal';
	        $line =~ s/<\/?wrap>//g;
	    }
	    $lineHash{'white-space'} = $wrap;
        
            # Grab line note 
	    if ($line =~ /<note>/i) {
	        $line =~ s/<note>(.*?)<\/note>//;
	        $lineHash{'linenote'} = $1;
	        $self->{'hasLineNotes'} = 1;
	    }
	    
            # Fix indents
	    $line =~ s/^(\s+)/_nbsp($1)/e;
        
	    $lineHash{'text'} = $line;
	    
	    $result .= qq|<p style="white-space: $wrap; text-align: $align" $wrap>|;
	    $result .= qq|<span class="linenumber instapaper_ignore">$dispNum</span>|;
	    $result .= qq|$line|;
	    $result .= qq|</p>|;
	    push @{$self->{'lineHashes'}}, \%lineHash;
    }
    $self->{'numberOfVerses'} = $num;
    return $result;
}

sub _contentAsPlainPoemHTML {
    my $self = shift;
    my @indhold;
    foreach my $line (split /\n/,$self->{'indhold'}) {
	$line =~ s/^(\s+)/_nbsp($1)/e;
	push @indhold,"$line\n";
    }
    my $result = join "",@indhold;
    $result =~ s/\n/<BR>\n/g;
    $result =~ s/<note>.*?<\/note>//g;
    $result =~ s/\s/\&nbsp;/gs;
    return '<span style="white-space: nowrap">'.$result.'</span>';
}

sub _resolveTags {
    my ($self,$txt) = @_;
    $txt =~ s/<w>/<span class="wide">/gi;
    $txt =~ s/<\/w>/<\/span>/gi;
    $txt =~ s/<sc>/<span style="font-variant: small-caps">/g;
    $txt =~ s/<\/sc>/<\/span>/g;
#    $txt =~ s/<wrap>/<div style="white-space: normal; text-align: justify">/gi;
#    $txt =~ s/<\/wrap>/<\/div>/gi;
    $txt =~ s/<s>/<small>/gi;
    $txt =~ s/<\/s>/<\/small>/gi;
    $txt =~ s/,,/&bdquo;/g;
    $txt =~ s/''/&ldquo;/g;
    $txt = Kalliope::makeMetricLetters($txt);
    return $txt;
}

sub contentForSearch {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT indhold FROM digte WHERE did = ?");
    $sth->execute($self->did);
    my $data = ($self->subtitle || '')."\n";
    $data .= $sth->fetchrow_array;
    return Kalliope::Strings::stripHTML($data);
}

sub _nbsp {
    return '&nbsp;'x(length shift);
}

sub getNumberOfVerses {
    return shift->{'numberOfVerses'} || 0;
}

sub notes {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT note FROM textnotes WHERE longdid = ? ORDER BY orderby");
    $sth->execute($self->longdid);
    my @notes;
    while (my ($note) = $sth->fetchrow_array) {
	$note = $self->resolveBiblioTags($note);
	push @notes,$note;
    }
    return @notes;
}

sub notesAsHTML {
    my $self = shift;
    my @notes = $self->notes();
    @notes = map { Kalliope::buildhrefs(\$_) } @notes;
    return @notes;
}

sub keywords {
    my $self = shift;
    my @keywords;
    my $sth = $dbh->prepare("SELECT keyword FROM textxkeyword WHERE longdid = ?");
    $sth->execute($self->longdid);
    while (my $id = $sth->fetchrow_array) {
	push @keywords,new Kalliope::Keyword('ord' => $id);
    }
    return @keywords;
}

sub xrefsTo {
    my $self = shift;
    my $sth = $dbh->prepare("SELECT fromid FROM xrefs WHERE toid = ?");
    $sth->execute($self->longdid);

    my @result;
    while (my $longdid = $sth->fetchrow_array) {
	push @result, new Kalliope::Poem(longdid => $longdid);
    }
    return @result;
}

sub updateHitCounter {
    my $self = shift;
    my $longdid = $self->longdid;
    my $sth = $dbh->prepare("SELECT hits FROM digthits WHERE longdid=?");
    $sth->execute($longdid);
    if ($sth->rows) {
	my ($hits) = $sth->fetchrow_array;
	$sth = $dbh->prepare("UPDATE digthits SET hits=?, lasttime=? WHERE longdid = ?");
	$sth->execute(++$hits,time(),$longdid);
    } else {
	$sth = $dbh->prepare("INSERT INTO digthits (hits,lasttime,longdid) VALUES (?,?,?)");
	$sth->execute(1,time(),$longdid);
    }
}

sub fhandle {
    return shift->{'fhandle'};
}

sub clickableTitle {
    my ($self) = @_;
    return $self->author->name.': <A CLASS=green HREF="digt.pl?longdid='.$self->longdid.'">»'.$self->linkTitle.'«</A> - '.$self->work->title.' '.$self->work->parenthesizedYear;
}

sub clickableTitleSimple {
    my ($self) = @_;
    return '<A CLASS=green HREF="digt.pl?longdid='.$self->longdid.'">»'.$self->linkTitle.'«</A>';
}

sub smallIcon {
    return '<IMG HEIGHT=48 BORDER=0 SRC="gfx/icons/poem-h48.gif">';
}

sub author {
    my $self = shift;
    return Kalliope::PersonHome::findByFhandle($self->fhandle);
}

sub vid {
    return $_[0]->{'vid'};
}

sub work {
    my $self = shift;
    return Kalliope::WorkHome::findByVid($self->vid);
}

sub getSearchResultEntry {
    my ($self,$escapedNeedle,@needle) = @_;

    use locale;
    use POSIX qw(locale_h);
    setlocale(LC_CTYPE, "da_DK.ISO_8859-1");

    $escapedNeedle = $escapedNeedle || '';
    my $content = $self->contentForSearch();
    my $work = $self->work;
    my $author = $self->author;
    my $poemTitle = $self->linkTitle;

    my $slash = '<SPAN STYLE="color: #a0a0a0">//</SPAN>';
    my $match = '';
    foreach my $ne (@needle) {
	next if $ne =~ /(and|or|not)/i;
#	$ne .= '(\W|$)' unless $ne =~ /\*$/;
	$ne =~ s/\*//;
	if ($match !~ /$ne/is) {
	    my ($a,$b,$c) = $content =~ /(\W.{0,30}\W)($ne)(.{0,30}\W)/si;
	    $match .= " ... $a$b$c " if $b;
	}
    }
    foreach my $ne (@needle) {
	next if $ne =~ /(and|or|not)/i;
#	$ne .= '(\W|$)' unless $ne =~ /\*$/;
	$ne =~ s/\*//;
	if ($ne =~ /\*$/) {
            $match =~ s/(\W)($ne)/$1<b>$2<\/b>/gis;
	} else {
            $match =~ s/(\W)($ne)(\W)/$1<b>$2<\/b>$3/gis;
	}
	$poemTitle =~ s/($ne)/\n$1\t/gi;
    }
    $match =~ s/\n+/ $slash /g if $match;

    $poemTitle =~ s/\n/<B>/g;
    $poemTitle =~ s/\t/<\/B>/g;
    
    my $HTML .= '<IMG ALT="Digt" ALIGN="right" SRC="gfx/icons/poem-h48.gif">';
    $HTML .= '<A CLASS=blue HREF="digt.pl?longdid='.$self->longdid.qq|&needle=$escapedNeedle#offset">|.$poemTitle.qq|</A><BR>|;
    $HTML .= qq|$match<br>|;
    $HTML .= '<SPAN STYLE="color: green">'.$author->name.'</SPAN>: <SPAN STYLE="color: #a0a0a0"><I>'.$work->title."</I> ".$work->parenthesizedYear."</SPAN><BR><BR>";
    return $HTML;
}

sub addToKeyPool {
    my ($self,$newKeys) = @_;
    my @keypool = $self->getKeyPool;
    my @newKeys = split /[ ,.;]+/,$newKeys;
    my %uniq;
    map { $uniq{$_} = 1 } (@keypool,@newKeys);
    my $keyString = join '; ', sort (keys %uniq);

    my $dbh = Kalliope::DB->connect;
    if ($#keypool >= 0) {
	my $sth = $dbh->prepare("UPDATE digte_keywords SET keywords = ? WHERE longdid = ?");
	$sth->execute($keyString,$self->longdid);
    } else {
	my $sth = $dbh->prepare("INSERT INTO digte_keywords (longdid,keywords,lang) VALUES (?,?,?)");
	$sth->execute($self->longdid,$keyString,$self->author->lang);
    }
}

sub getKeyPool {
    my $self = shift;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT keywords FROM digte_keywords WHERE longdid = ?");
    $sth->execute($self->longdid);
    my $string = $sth->fetchrow_array;
    my @result = split '; ',$string;
    return @result;
}

1;


