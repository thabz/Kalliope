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

use CGI qw /:standard/;
use Kalliope::Web;
use Kalliope::Page;
use Kalliope::Date;
use Kalliope;
use Kalliope::DB;
use URI::Escape;
use strict;
use utf8;


my $filename = param('file') || '';
my $dir = param('dir') || '';
my $knap = param('knap');

my @crumbs;
push @crumbs,['Redigér','edit.cgi'];
push @crumbs,[$dir,"edit.cgi?dir=$dir"] if $dir;
push @crumbs,[$filename,""] if $filename;

my $HTML;

if ($knap) {
    &handleForm($dir,$filename,$knap);
    my (undef,$next) = _nextAndPrevFiles($dir,$filename);
    print $next ? "Location: edit.cgi?dir=$dir&file=$next\n" : 
	          "Location: edit.cgi?dir=$dir\n";
} elsif ($filename) {
    $HTML = &editPage($dir,$filename);
} elsif ($dir) {
    $HTML = &showDir($dir);
} else {
    $HTML = &showRootDir();
}

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
    $HTML .= qq|<br><img src="edit/files/$gfxFile"><br>|;
    $HTML .= $navHTML;
    $HTML .= qq|</td>|;
    $HTML .= qq|<td valign=top>|;
    $HTML .= '<INPUT TYPE="Submit" NAME="knap" VALUE="Duplet">';
    $HTML .= qq|<textarea rows=30 name="data" style="width:300px; height:90%">$data</textarea><br>|;
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
    } elsif ($knap =~ /Duplet/) {
	my $sth = $dbh->prepare("INSERT INTO edithistory (filename,dir,action,login,date) VALUES (?,?,?,?,?)");
	$sth->execute($filename,$dir,'duplet',param('user'),time);
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
    my $dbh = Kalliope::DB::connect();
    my $sth = $dbh->prepare("SELECT COUNT(DISTINCT filename) FROM edithistory WHERE action = ? AND dir = ?");
    my $HTML = '<table class="oversigt">';
    $HTML .= '<tr><th>Værk</th><th>Sider</th><th><img alt="redigeret" src="gfx/edit.png"></th><th><img alt="godkendte" src="gfx/accept.png"></th><th><img alt="markerede som dupletter" src="gfx/duplet.png"></th><th>Funktioner</th></tr>';
    foreach my $f (grep {!/^\./} readdir(DIR)) {
	my $size = _sizeOfDir($f);
	$sth->execute('edit',$f);
	my ($edited) = $sth->fetchrow_array;
	$sth->execute('accept',$f);
	my ($accepted) = $sth->fetchrow_array;
	$sth->execute('duplet',$f);
	my ($doubles) = $sth->fetchrow_array;
	$HTML .= qq|<tr><td><a class="green" href="edit.cgi?dir=$f">$f</a></td>|;
	$HTML .= qq|<td>$size</td>|;
	$HTML .= qq|<td>$edited</td>|;
	$HTML .= qq|<td>$accepted</td>|;
	$HTML .= qq|<td>$doubles</td>|;
	$HTML .= qq|<td><a href="dumpedit.cgi?dir=$f">[Formateret]</a></td>|;
	$HTML .= '</tr>';
    }
    return $HTML.'</table>';
}

sub _sizeOfDir {
    return _readDir(shift) + 1;
}

sub _readDir {
    my $dir = shift;
    opendir(DIR,"edit/files/$dir");
    my @files = sort grep {!/^\./} readdir(DIR);
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
