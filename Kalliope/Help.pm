
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

package Kalliope::Help;
use Kalliope;
use Kalliope::Web;
use utf8;

sub new {
   my ($class,$helpid) = @_;
   my $obj = bless {},$class;
   $obj->{'helpid'} = $helpid;
   $obj->_init;
   return $obj;
}

sub _init {
   my $self = shift;
   open(FILE,"help/".$self->helpid);
   while (<FILE>) {
       if (/^T:(.*)$/) {
	   $self->{'title'} = $1;
      } else {
	  $self->{'text'} .= $_;
      }
   }
   close(FILE);
}


sub helpid {
    return shift->{'helpid'};
}

sub title {
    return shift->{'title'};
}

sub text {
    return shift->{'text'};
}

sub linkAsHTML {
    my $self = shift;
    my $onClickJS = $self->onClickJS;
    my $title = $self->title;
    return qq|<INPUT onClick="$onClickJS" TITLE="Hjælp til $title" CLASS="button" TYPE="submit" VALUE="Hjælp">|;
}

sub onClickJS {
    my $id = shift->helpid;
    return qq|window.open('help.cgi?helpid=$id','Helppopup','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=400,height=300'); return false|;
}

1;
