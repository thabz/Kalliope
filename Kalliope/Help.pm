
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

use Kalliope::Web ();

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


sub textAsHTML {
    my $self = shift;
    my $HTML;
    $HTML =  "<HEAD><TITLE>".$self->title.'</TITLE>';
    $HTML .= '<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">';
    $HTML .= "</HEAD";
    $HTML .= "<BODY>";
    $HTML .= "<h2>$$self{title}</h2>";
    $HTML .= $self->text;
#    $HTML .= Kalliope::Web::makeBox($self->title,"100%",'',$self->text,'');
    $HTML .= '</BODY></HTML>';
    return $HTML;
}

sub linkAsHTML {
    my $self = shift;
    my $id = $self->helpid;
    my $title = $self->title;
    return qq|<INPUT onClick="window.open('help.cgi?helpid=$id','Helppopup','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=400,height=300'); return false" TITLE="Hjælp til $title" CLASS="button" TYPE="submit" VALUE="Hjælp">|;
}

1;
