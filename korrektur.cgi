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


use strict;
use CGI qw/:standard/;
use Kalliope::Help;
use Kalliope::Page::Popup;
use Kalliope;
use Net::SMTP();
use utf8;

my $MAILTAINER_EMAIL = 'jesper@kalliope.org';

my $poem = new Kalliope::Poem ('longdid' => url_param('longdid'));
my $poet = $poem->author;
my $work = $poem->work;

my $HTML = '';
if (defined param('korrektur')) {
    # Send as mail ------------------
    my $mailBody = 'Dato:       '.localtime(time)."\n";
    $mailBody .= 'Remotehost: '.remote_host()."\n";
    $mailBody .= 'Forfatter:  '.$poet->name."\n";
    $mailBody .= 'Fhandle:    '.$poet->fhandle."\n";
    $mailBody .= 'Værk:       '.$work->title.' '.$work->parenthesizedYear."\n";
    $mailBody .= 'Værk-id:    '.$work->vid."\n";
    $mailBody .= 'Digt:       '.$poem->linkTitle."\n";
    $mailBody .= 'Digt-id:    '.$poem->longdid."\n";
    $mailBody .= 'Korrektur:  '.param('korrektur')."\n";
    my $smtp = Net::SMTP->new('localhost') || last;
    $smtp->mail($MAILTAINER_EMAIL);
    $smtp->to($MAILTAINER_EMAIL);
    $smtp->data("From: Kalliope <$MAILTAINER_EMAIL>\r\n".
	    "To: $MAILTAINER_EMAIL\r\n".
	    "Date: ".localtime(time)."\r\n".
 	    "Subject: [Korrektur] ".$poem->longdid."\r\n".
	    "\r\n".$mailBody."\r\n");
    $smtp->quit;

    # Database backup ---------------
#my $dbh = Kalliope::DB->connect;
#    my $sth = $dbh->prepare("INSERT INTO korrektur (date,longdid,korrektur) VALUES (?,?,?)");
#    $sth->execute(time,$poem->longdid,param('korrektur'));
    $HTML .= "Tak for din rettelse til »".$poem->linkTitle."«! <BR><BR>En mail er automatisk sendt til $MAILTAINER_EMAIL, som vil kigge på sagen.\n";
} else {
    my $longdid = $poem->longdid;
    my $fulltitle = $poet->name.': »'.$poem->linkTitle.'«';
    $HTML .= "Fandt du en trykfejl i $fulltitle, skriv da rettelsen i feltet herunder, og tryk Send.<BR><BR>";
    $HTML .= '<FORM><TEXTAREA STYLE="width: 100%" CLASS="inputtext" NAME="korrektur" WRAP="virtual" COLS=28 ROWS=6></TEXTAREA><BR><br>';
    $HTML .= qq|<INPUT TYPE="hidden" NAME="longdid" VALUE="$longdid">|;
    $HTML .= '<INPUT CLASS="button" TYPE="submit" VALUE="Send"> ';
    $HTML .= Kalliope::Help->new('korrektur')->linkAsHTML;
    $HTML .= "</FORM>";
}

my $page = new Kalliope::Page::Popup ( title => 'Send en rettelse');
$page->addBox( width => '100',
               title => 'Send en rettelse',
               content => $HTML);
$page->print;


