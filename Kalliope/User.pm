
#  Copyright (C) 1999-2009 Jesper Christensen 
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
#  $Id: Keyword.pm 5857 2004-09-20 20:51:01Z jec $

package Kalliope::User;

use strict ('vars');
use Carp;
use Kalliope::DB;
use utf8;

sub new {
    my ($class,%arg) = @_;
    my $dbh = Kalliope::DB->connect;
    my $sth = $dbh->prepare("SELECT login,name FROM users WHERE login = ? AND password = ?");
    $sth->execute($arg{login}, $arg{password});
    my $obj = $sth->fetchrow_hashref;
    if ($obj) {
	bless $obj,$class;
	return $obj;
    } else {
	return 0;
    }
}

sub login {
    return shift->{'login'};
}

sub name {
    return shift->{'name'};
}

sub fetch {
    my %cookies = fetch CGI::Cookie; 
    if ($cookies{'user'}) {
	return $cookies{'user'}->value;
    } else {
	return 0;
    }
}

1;
