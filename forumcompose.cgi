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
use Kalliope::Page::Popup ();
use Kalliope::Forum ();
use Kalliope::Help ();
use Kalliope::Forum::Post ();
use CGI qw(:standard);
use CGI::Cookie ();
use strict;

my $parentId = param('parentid') || 0;
my $threadId = param('threadid') || 0;

if (defined param('posted')) {
    my $h = { parent => $parentId,
              thread_id => $threadId,
	      date => time,
	      sender => param('name') || 'Anonym',
	      email => param('email') || '',
	      subject => param('subject') || 'Intet emne angivet',
	      content => param('content') || 'Intet indhold' };
    my $post = new Kalliope::Forum::Post($h);
    $post->insertIntoDB;
    my $dummyPage = new Kalliope::Page::Popup (
                          setcookies => {name => param('name') || '',
		                         email => param('email') || ''});
    
    print $dummyPage->_printCookies;
    print "Content-type: text/html\n\n";
    print qq|<html><body onLoad="opener.document.location = opener.document.location; this.close()"></body></html>|;
    exit;
}


#
# Get ID from Cookie if set
#

my %cookies = fetch CGI::Cookie;
my $userName = $cookies{'name'} ? $cookies{'name'}->value : '';
my $userEmail = $cookies{'email'} ? $cookies{'email'} ->value : '';


my $parentPost;
my $subject = '';
my $content = '';

if ($parentId) {
   $parentPost = Kalliope::Forum::Post::newFromId($parentId);
   $threadId = $parentPost->threadId;
   $subject = 'Re: '.$parentPost->subject;
   $subject =~ s/^Re: Re:/Re:/g;
   $content = $parentPost->content;
   $content =~ s/^/>/gm;
   $content = $parentPost->from." skrev:\n".$content;
}


my $page = new Kalliope::Page::Popup (
       title => 'Skriv indlæg'
       );

my $HELP = Kalliope::Help->new('forumcompose')->linkAsHTML;

my $HTML = <<"EOF";
<FORM>
<SPAN STYLE="font-family: Arial, Helvetica">
Navn:<BR>
<INPUT CLASS="inputtext" STYLE="width:100%;" TYPE="text" NAME="name" VALUE="$userName"><BR><BR>
E-mail:<BR>
<INPUT CLASS="inputtext" STYLE="width:100%;" TYPE="text" NAME="email" VALUE="$userEmail"><BR><BR>
Emne:<BR>
<INPUT CLASS="inputtext" STYLE="width:100%;" WIDTH=40 TYPE="text" NAME="subject" VALUE="$subject"><BR><BR>
Besked:<BR>
<TEXTAREA CLASS="inputtext" WRAP="virtual" NAME="content" COLS=10 ROWS=15 STYLE="width:100%;">$content</TEXTAREA><BR><BR>
<INPUT TYPE="hidden" NAME="parentid" VALUE="$parentId">
<INPUT TYPE="hidden" NAME="threadid" VALUE="$threadId">
<INPUT TYPE="hidden" NAME="posted" VALUE="1">
<INPUT CLASS="button" TYPE="submit" VALUE=" Send ">
$HELP
</SPAN>
</FORM>


EOF

$page->addBox( width => '100%',
               content => $HTML
              );
$page->print;	      

