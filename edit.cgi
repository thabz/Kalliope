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

use lib '..';

use CGI qw /:standard/;
use Kalliope::Web;
use Kalliope::Page;
use Kalliope::Date;
use Kalliope;
use Kalliope::DB;
use URI::Escape;
use strict;


my $filename = param('file') || '';
my $dir = param('dir') || '';
my $knap = param('knap');

my @crumbs;
my $HTML;

if ($knap) {
    &handleForm($dir,$filename,$knap);
   print "Location: edit.cgi?dir=$dir\n";
} elsif ($filename) {
    $HTML = &editPage($dir,$filename);
} elsif ($dir) {
    $HTML = &showDir($dir);
} else {
    $HTML = &showRootDir();
}

#push @crumbs,['Ordbog','dict.cgi'];
#push @crumbs,[Kalliope::Strings::uc($letter),''] if $letter;
push @crumbs,[$filename,''];

my $page;
$page = new Kalliope::Page (
	title => "Redigér $dir/$filename",
	thumb => 'gfx/icons/keywords-h70.gif',
	lang => 'dk',
	crumbs => \@crumbs );

$page->addBox (
	width => "80%",
	title => '',
	content => $HTML);
$page->print;

# ------------------------------------


sub editPage {
    my ($dir,$filename) = @_;
    my $gfxFile = "$dir/$filename";
    my $user = remote_user() || '';
    
    my $dbh = Kalliope::DB::connect();
    my $sth = $dbh->prepare("SELECT data FROM editpages WHERE filename=? AND dir=?");
    $sth->execute($filename,$dir);
    my ($new,$data) = (1,'');
    if ($sth->rows) {
	$new = 0;
	($data) = $sth->fetchrow_array;
    }
    
    my ($prev,$next) = _nextAndPrevFiles($dir,$filename);
    my $navHTML = '<table width="100%"><tr>';
    $navHTML .= $prev ? qq|<td width="33%"><a href="edit.cgi?dir=$dir&file=$prev">&lt;&lt; Forrige side</a></td>| : "<td></td>";
    $navHTML .= qq|<td width="33%"><a href="edit.cgi?dir=$dir">Indeks</a></td>|;
    $navHTML .= $next ? qq|<td width="33%"><a href="edit.cgi?dir=$dir&file=$next">Næste side &gt;&gt;</a></td>| : "<td></td>";
    $navHTML .= '</tr></table>';

    my $HTML = '<form method="post">';
    $HTML .= qq|<input type="hidden" name="dir" value="$dir">|;
    $HTML .= qq|<input type="hidden" name="file" value="$filename">|;
    $HTML .= qq|<input type="hidden" name="user" value="$user">|;
    $HTML .= qq|<input type="hidden" name="new" value="$new">|;
    $HTML .= qq|<table width="100%"><tr>\n|;
    $HTML .= qq|<td valign=top>|;
    $HTML .= $navHTML;
    $HTML .= qq|<br><img src="edit/files/$gfxFile"></td>|;
    $HTML .= qq|<td valign=top><textarea rows=30 name="data" style="width:300px; height:90%">$data</textarea><br>|;
    $HTML .= '<INPUT TYPE="Submit" NAME="knap" VALUE="Gem ændringer">';
    $HTML .= '<INPUT TYPE="Submit" NAME="knap" VALUE="Godkend tekst">';
    $HTML .= '</td>';
    $HTML .= '</tr></table>';
    $HTML .= '</form>';
    return $HTML;
}

sub handleForm {
    my ($dir,$filename,$knap) = @_;
    my $dbh = Kalliope::DB::connect();
    if ($knap =~ /^Gem/) {
	if (param('new') == 1) {
	    my $sth = $dbh->prepare("INSERT INTO editpages (filename,dir,data) VALUES (?,?,?)");
	    $sth->execute($filename,$dir,param('data'));
	} else {
	    my $sth = $dbh->prepare("UPDATE editpages SET data=? WHERE dir=? AND filename=?");
	    $sth->execute(param('data'),$dir,$filename);
	}
	my $sth = $dbh->prepare("INSERT INTO edithistory (filename,dir,action,login,date) VALUES (?,?,?,?,?)");
	$sth->execute($filename,$dir,'edit',param('user'),time);
    } elsif ($knap =~ /Godkend/) {
	my $sth = $dbh->prepare("INSERT INTO edithistory (filename,dir,action,login,date) VALUES (?,?,?,?,?)");
	$sth->execute($filename,$dir,'accept',param('user'),time);
    }
}

sub showDir {
    my $dir = shift;
    my $entriesPerColumn = int(_sizeOfDir($dir) / 3) + 1;
    return "Fejl. Fandt ingen filer i <tt>$dir</tt>" unless $entriesPerColumn;
    my $HTML = '<table width="100%"><tr><td valign="top" width="33%">';
    my $dbh = Kalliope::DB::connect();
    my $sth = $dbh->prepare("SELECT action,login,date FROM edithistory WHERE filename = ? AND dir = ?");
    my $i = 0;
    foreach my $f (_readDir($dir)) {
	$HTML .= qq|<a class="green" href="edit.cgi?dir=$dir&file=$f">$f</a>|;
	$sth->execute($f,$dir);
	while (my ($action,$login,$date) = $sth->fetchrow_array) {
	    my $dateTxt = Kalliope::Date::shortDate($date);
	    $HTML .= qq|<IMG ALT="$dateTxt af $login" SRC="gfx/$action.png">|;
	}
	$HTML .= "<br>\n";
	$i++;
	unless ($i % $entriesPerColumn) {
	    $HTML .= '</td><td valign="top" width="33%">';
	}
    }
    return $HTML.'</td></tr></table>';
}

sub showRootDir {
    opendir(DIR,"edit/files");
    my $HTML = '';
    foreach my $f (grep {!/^\./} readdir(DIR)) {
	$HTML .= qq|<a class="green" href="edit.cgi?dir=$f">$f</a> <a href="dumpedit.cgi?dir=$f">[Formateret]</a><br>|
    }
    return $HTML;
}

sub _sizeOfDir {
    return _readDir(shift) + 1;
}

sub _readDir {
    my $dir = shift;
    opendir(DIR,"edit/files/$dir");
    my @files = grep {!/^\./} readdir(DIR);
    close DIR;
    return @files;
}

sub _nextAndPrevFiles {
    my ($dir,$file) = @_;
    my @files = _readDir($dir);
    my $index = _indexOf($file,@files);
    return (($index - 1 >= 0) ? $files[$index - 1] : undef,
	    ($index + 1 <= $#files) ? $files[$index + 1] : undef);
}

sub _indexOf {
    my ($val,@array) = @_;
    for(my $i = 0; $i <= $#array; $i++) {
	return $i if $array[$i] eq $val;
    }
    return undef;
}
