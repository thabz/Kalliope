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
#  Test for Anders
#  $Id$

use lib '.';
use Kalliope ();
use Kalliope::DB;
use Kalliope::Date;
use CGI qw(:standard);
use URI::Escape;
use strict;

my $dbh = Kalliope::DB::connect();

my $page = param('page') || 'forside';
my $pageescaped = uri_escape($page);
my $mode = param('mode') || 'show';

my ($HTML,$title,$navigationHTML);
my ($id,$content,$date);

if (defined param('newedit')) {
    $mode = 'show';
    my $sth = $dbh->prepare("INSERT INTO wiggi (pageid,content,date,note,remotehost) VALUES (?,?,?,?,?)");
    $date = time;
    $sth->execute($page,param('content'),$date,param('note'),remote_host());
    $content = param('content');
} elsif (param('search')) {
    $mode = 'search';
} else {
    my $sql = '';
    if ($mode eq 'past') {
       $sql = 'AND id = '.param('pastid');
    }
    my $sth = $dbh->prepare("SELECT id,content,date FROM wiggi WHERE pageid = ? $sql ORDER BY date DESC LIMIT 1");
    $sth->execute($page);
    ($id,$content,$date) = $sth->fetchrow_array;
}
unless ($content && $date || $mode  eq 'edit') {
   $content = '<I>Denne side har endnu intet indhold. Klik på "rediger" nedenfor, hvis du vil fylde noget på...</I>';

}
$title = $page eq 'forside' ? 'E-Music' : $page;

if ($mode eq 'edit') {
    $title = qq|Rediger »$title«|;
    $HTML = '<FORM METHOD="post">';
    $HTML .= '<INPUT TYPE="hidden" NAME="newedit" VALUE="1">';
    $HTML .= qq|<INPUT TYPE="hidden" NAME="page" VALUE="$page">|;
    $HTML .= qq|<TEXTAREA NAME="content" COLS="80" ROWS="24">$content</TEXTAREA>|;
    $HTML .= qq|<BR>Evt. bemærkning:<BR>|;
    $HTML .= qq|<INPUT TYPE="text" NAME="note" WIDTH="80">|;
    $HTML .= '<BR><INPUT TYPE="submit" NAME="OK" VALUE="Gem ændringer"></FORM>';
    $navigationHTML = qq|<A HREF="wiggi.cgi?page=$pageescaped\&mode=show">Fortryd</A> \||;
} elsif ($mode eq 'historik') {
    $title = qq|Tidligere versioner af »$title«|;
    my $sth = $dbh->prepare("SELECT id,date,note FROM wiggi WHERE pageid = ? ORDER BY date DESC LIMIT 10");
    $sth->execute($page);
    $HTML = '<TABLE>';
    $HTML .= '<TR><TH>Dato</TH><TH>Bemærkning</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
        my $id = $h->{'id'};
        $HTML .= '<TR>';
        $HTML .= '<TD>';
        $HTML .= qq|<A HREF="wiggi.cgi?page=$pageescaped\&mode=past\&pastid=$id">|;
        $HTML .= Kalliope::Date::shortDate($h->{'date'}).'</TD>';
        $HTML .= '</A><TD>'.($h->{'note'} || '').'</TD>';
    }
    $HTML .= '</TABLE>';
} elsif ($mode eq 'changelog') {
    $title = 'Seneste ændringer';
    my $sth = $dbh->prepare("SELECT id,pageid,date,note,remotehost FROM wiggi WHERE date > ? ORDER BY date DESC ");
    $sth->execute(time -3*24*60*60);
    $HTML = '<TABLE>';
    $HTML .= '<TR><TH>Dato</TH><TH>Side</TH><TH>Bemærkning</TH><TH>Remote host</TH></TR>';
    while (my $h = $sth->fetchrow_hashref) {
        my $id = $h->{'id'};
        my $mypageescaped = uri_escape($h->{'pageid'});
        $HTML .= '<TR>';
        $HTML .= '<TD>';
        $HTML .= Kalliope::Date::shortDate($h->{'date'}).'</TD>';
        $HTML .= qq|<TD><A HREF="wiggi.cgi?page=$mypageescaped\&mode=past\&pastid=$id">|;
        $HTML .= $h->{'pageid'};
        $HTML .= '</A></TD><TD>'.($h->{'note'} || '').'</TD>';
        $HTML .= '<TD>'.$h->{'remotehost'}.'</TD>';
        $HTML .= '</TR>';
    }
    $HTML .= '</TABLE>';
} elsif ($mode eq 'past') {
    my $niceDate = Kalliope::Date::shortDate($date);
    $title = "Tidligere udgave af »$title« fra $niceDate";
    $HTML = escapeBody($content);
} elsif ($mode eq 'search') {
    my $bah = param('search');
    $title = qq|Søgning efter "$bah"|;
    my $sth = $dbh->prepare("SELECT pageid,date,content FROM wiggi WHERE pageid like '\%$bah\%' OR content like '\%$bah\%' ORDER BY date DESC");
    $sth->execute ();
    my %results;
    my %dates;
    while (my ($pageid,$date,$content) = $sth->fetchrow_array) {
	   $results{lc $pageid} = $content unless $results{lc $pageid};
    }
    $HTML = '<TABLE>';
    $HTML .= '<TR><TH>Side</TH><TH>Match</TH></TR>';
    foreach my $key (keys %results) {
        my $mypageescaped = uri_escape($key);
        my $content = $results{$key};
        my $match;
        if ($content =~ /(.{0,15}$bah.{0,15})/i) {
           $match = "...".$1."...";
        } else {
           $match = '';
        }
        $HTML .= '<TR>';
        $HTML .= qq|<TD><A HREF="wiggi.cgi?page=$mypageescaped\&mode=show">|;
        $HTML .= $key;
        $HTML .= '</A></TD>';
        $HTML .= '<TD>'.$match.'</TD></TR>';
    }
    $HTML .= '</TABLE>';
} elsif ($mode eq 'content') {
    $title = "Indeks";
    my @blocks;
    my $sth = $dbh->prepare("SELECT DISTINCT pageid FROM wiggi ORDER BY pageid");
    $sth->execute;
    while (my ($pageid) = $sth->fetchrow_array) {
        my $mypageescaped = uri_escape($pageid);
	my $tit = uc substr($pageid,0,1);
        my $bi = ord $tit;
        $blocks[$bi]->{'head'} = qq|<BR><SPAN STYLE="font-family: arial, helvetica; font-size: 18px; color: #404080">$tit</SPAN><BR>|;
        $blocks[$bi]->{'body'} .= qq|<A HREF="wiggi.cgi?page=$mypageescaped\&mode=show">$pageid</A><BR>|;
        $blocks[$bi]->{'count'}++;
    }
    $HTML .= Kalliope::doublecolumnHTML(\@blocks);
} elsif ($mode eq 'show' || 1) {
    $title = $title;
    # Find "Related"
    my $sth = $dbh->prepare("SELECT DISTINCT pageid FROM wiggi WHERE content LIKE ?");
    $sth->execute('%['.$page.']%');
    my $relatedHTML;
    while (my ($pageid) = $sth->fetchrow_array) {
        my $mypageescaped = uri_escape($pageid);
        $relatedHTML .= qq|<A HREF="wiggi.cgi?page=$mypageescaped\&mode=show">|;
        $relatedHTML .= $pageid."</A><BR>";
    }
    $HTML = escapeBody($content);
    if ($relatedHTML) {
    $HTML = qq|<TABLE WIDTH="100%"><TR><TD WIDTH="100%" VALIGN="top">$HTML</TD><TD NOWRAP VALIGN="top">|;
    $HTML .= qq|<DIV STYLE="border: 1px solid black; padding: 10px; background-color: #e8e8d0">|;
    $HTML .= "<B>Related</B><BR>".$relatedHTML;
    $HTML .= '</DIV></TD></TR></TABLE>';
    }
    $navigationHTML = qq|<A HREF="wiggi.cgi?page=$pageescaped\&mode=edit">Rediger</A> \||;
}

my $HTMLdate = $date ? Kalliope::Date::shortDate($date) : 'aldrig';

$navigationHTML .= qq| <A HREF="wiggi.cgi?page=$pageescaped\&mode=historik">Historik</A>|;
$navigationHTML .= ' | <A HREF="wiggi.cgi">Forside</A>';
$navigationHTML .= ' | <A HREF="wiggi.cgi?mode=changelog">Seneste ændringer</A>';
$navigationHTML .= ' | <A HREF="wiggi.cgi?mode=content">Indeks</A>';
$navigationHTML .= ' | <A HREF="wiggi.cgi?page=vejledning&mode=show">Vejledning</A>';
$navigationHTML .= ' | Sidst ændret: '.$HTMLdate;
$navigationHTML .= '<INPUT TYPE="text" NAME="search">';


print "Content-type: text/html\n\n";
print <<"EOF";
<HTML><HEAD><TITLE>$title</TITLE>
<STYLE>
H1 {
   font-family: Arial, Helvetica;
   font-size: 20px;
   background-color: #303050;
   color: white;
   padding: 2px;
}
BODY {
   background-color: #f0f0e0;
}

A {
   color: green;
   text-decoration: none;
}

DIV.navigation {
   font-family: Arial, Helvetica;
   font-size: 12px;
   font-weight: 800;
   background-color: #303050;
   color: white;
   padding: 2px;
   top-margin: 10px;
}

DIV.navigation A {
   color: white;
}
</STYLE>
</HEAD>
<BODY>
<H1> $title</H1>
$HTML
<BR><BR>
<FORM METHOD="post">
<DIV CLASS="navigation">
$navigationHTML
</DIV>
</FORM>
</BODY></HTML>
EOF

sub escapeBody {
   my $HTML = shift;
   $HTML = ' '.$HTML;
    $HTML =~ s/\n/<BR>/g;
    $HTML =~ s/([^\\])\[([^\]]+)\]/$1<A HREF="wiggi.cgi?page=$2&mode=show">$2<\/A>/g;
    $HTML =~ s/\\\[/[/g;
    return $HTML;
}
