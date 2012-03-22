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

package Kalliope::Page::WML;
use Kalliope::Page;
@ISA = ('Kalliope::Page');
use utf8;
binmode STDOUT => ":utf8";


sub addWML {
   my ($self,$WML) = @_;
   $self->{'wml'} .= $WML;
}

sub print {
    $self = shift;
    my $crumbs = $self->_constructBreadcrumbs;
    my $titleForWindow = $self->{'title'};
    print "Content-type: text/vnd.wap.wml\n\n";
    print '<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN" "http://www.wapforum.org/DTD/wml_1.1.xml">';
    print <<"EOF";
<wml>
<card title="$titleForWindow">
$$self{wml}
<p>
<small>$crumbs</small>
</p>
</card>
</wml>
EOF
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
