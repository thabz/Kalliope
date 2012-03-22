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
#  $Id: WML.pm 6596 2005-05-14 11:53:14Z jec $

package Kalliope::Page::iPhone;
use Kalliope::Page;
@ISA = ('Kalliope::Page');
use utf8;
binmode STDOUT => ":utf8";

sub addHTML {
   my ($self,$HTML) = @_;
   $self->{'html'} .= $HTML;
}

sub addFragment {
   my ($self,$HTML) = @_;
   $self->{'fragment'} .= $HTML;
}

sub print {
    $self = shift;
    print "Content-type: text/html; charset=ISO-8859-1\n\n";
    if ($$self{fragment}) {
	print $$self{fragment};
    } else {
	my $crumbs = $self->_constructBreadcrumbs;
	my $titleForWindow = $self->{'title'};
	print <<"EOF";
	<html xmlns="http://www.w3.org/1999/xhtml">
	    <head>
	    <meta name="apple-touch-fullscreen" content="YES" />
	    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>
	    <link rel="apple-touch-icon" href="http://www.kalliope.org/gfx/icons/iphone-icon.png">
	    <style type="text/css" media="screen">\@import "iui/iui.css";</style>
	    <script type="application/x-javascript" src="iui/iui.js"></script>
	    <script type="text/javascript">
	    iui.animOn = true;
	    </script>
	    </head>
	    <body>
	    $$self{html}
	    </body>
	    </html>
EOF
    }	
}

sub _constructBreadcrumbs {
    my $self = shift;
    return '' unless $self->{'crumbs'};
    my @crumbs = (
	    ['Kalliope','index.cgi'],
	    @{$self->{'crumbs'}});
    my @blocks;
    foreach my $item (@crumbs) {
	if ($$item[1]) {
          push @blocks,qq|<a href="$$item[1]">$$item[0]</a>|;
       } else {
          push @blocks,$$item[0];
       }
    }
    return join ' &gt;&gt; ',@blocks;
}
