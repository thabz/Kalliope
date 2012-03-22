#
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

package Kalliope::Timeline::Event;

use utf8;

sub new {
    my ($class,$select) = @_;
    my $self = $select;
    bless $self,$class;
    return $self;
}

sub getYear {
    return shift->{'year'};
}

sub getText {
    my $self = shift;
    my $text = $self->{'description'};
    if ($self->useGrayText) {
        return qq|<span class="gray">$text</span>|
    } else {
	return $text;
    }
}

sub useGrayText {
    my ($self,$value) = @_;
    $self->{'useGrayedText'} = $value if $value;
    return $self->{'useGrayedText'} unless $value;
}

sub isImage {
    return shift->{'url'} ? 1 : 0;
}

sub getImageUrl {
    return shift->{'url'};
}

sub getThumbUrl {
    my $self = shift;
    my $imageUrl = $self->getImageUrl;
    $imageUrl =~ s/\/([^\/]+)$/\/_$1/;
    return $imageUrl;
}

# Get the image in a format usable by Kalliope::Web::insertThumb
sub getKalliopeImage {
    my $self = shift;
    my $k;
    $k->{'thumbfile'} = $self->getThumbUrl; 
    $k->{'destfile'} = $self->getImageUrl;
    return $k;
}

1;
