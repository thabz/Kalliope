
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

package Kalliope::Quality;

use Kalliope::Internationalization;
use Kalliope;
use Kalliope::Help;
use utf8;

my %items = (
     korrektur1 => { name     => _('Første korrekturlæsning'),
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_yes_gray.gif' },
     korrektur2 => { name     => _('Anden korrekturlæsning'),
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_yes_gray.gif' },
     korrektur3 => { name     => _('Tredje korrekturlæsning'),
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_yes_gray.gif' },
     kilde      => { name     => _('Kildeangivelse'),
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_yes_gray.gif' },
     side       => { name     => _('Sidehenvisninger'),
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_yes_gray.gif' } 
);

my @order = qw/ korrektur1 korrektur2 korrektur3 kilde side /;

sub new {
    my ($class,$quality) = @_;
    $quality = '' unless $quality;
    my $self = bless {},$class;
    @{$self->{'array'}} = split ',',$quality;
    %{$self->{'hash'}} = map { $_ => 1 } @{$self->{'array'}};
    return $self;
}

sub asHTML {
   my $self = shift;
   my $HTML;
   foreach my $key (@order) {
      my $status = $self->{'hash'}->{$key};
      my %item = %{$items{$key}};
      my $icon = $status ? $item{'icon_on'} : $item{'icon_off'};
      my $alt = $status ? _('Har ') : _('Mangler ');
      $alt .= $item{'name'};
      $HTML .= qq|<IMG SRC="$icon" BORDER=0 ALT="$alt" TITLE="$alt">|;
   }

   my $help = new Kalliope::Help('quality');
   $HTML = '<A HREF="javascript:{}" onClick="'.$help->onClickJS.'">'.$HTML.'</A>';
   return $HTML;
}

1;

