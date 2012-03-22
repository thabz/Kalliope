#  Copyright (C) 2005 Jesper Christensen 
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

package Kalliope::Page::Feed;
use Kalliope::Page;
use Kalliope::Date;
use utf8;

@ISA = 'Kalliope::Page';

use strict;

sub addItem {
    my ($self,$title,$link,$descr,$date) = @_;
    my $pubDate = Kalliope::Date::RFC822($date);
#    $descr =~ s/</&lt;/g;
#    $descr =~ s/>/&gt;/g;
    my $xml = '';
    $xml .= qq|<item>\n|;
    $xml .= qq|  <title><![CDATA[$title]]></title>\n|;
    $xml .= qq|  <link><![CDATA[$link]]></link>\n|;
$xml .= qq|  <description><![CDATA[$descr]]></description>\n|;
#    $xml .= qq|  <description>$descr</description>\n|;
    $xml .= qq|  <pubDate><![CDATA[$pubDate]]></pubDate>\n|;
    $xml .= qq|</item>\n|;
    $self->{'feed_xml'} .= $xml;
}

sub print {
    my $self = shift;
    my $link = $self->{'rss_feed_url'};
    my $title = $self->{'rss_feed_title'};
    my $items = $self->{'feed_xml'};
    print "Content-Type: text/xml; charset=ISO-8859-1\n\n";
    print <<"EOF"
<?xml version="1.0" encoding="ISO-8859-1"?>
<rss version="2.0">
  <channel>
     <title>$title</title>
     <link>$link</link>
     <language>da</language>
     $items
  </channel>
</rss>
EOF
}

1;

