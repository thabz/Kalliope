
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

package Kalliope::DB;

use strict;
use DBI;
use Carp;
use vars qw($COMC_DBH);
use Kalliope::Page;

#my $DB_CONNECT_STRING = 'DBI:mysql:kalliope:localhost';
#my $DB_USER = 'jec';
#my $DB_PASSWORD = '';

my $DB_CONNECT_STRING = 'dbi:Pg:dbname=kalliope';
my $DB_USER = 'jec';
my $DB_PASSWORD = '';
my %DB_ATTR = ( AutoCommit => 1, PrintError => 1, Warn => 1 );
$ENV{PGCLIENTENCODING} = 'LATIN1';

sub connect {
    # connect
    if (!defined $COMC_DBH) { 
	$COMC_DBH = DBI->connect($DB_CONNECT_STRING, $DB_USER, $DB_PASSWORD,\%DB_ATTR) || connect_error();
    }
    # Do status check on existing handle
    if (!$COMC_DBH->ping) {
	$COMC_DBH = DBI->connect($DB_CONNECT_STRING, $DB_USER, $DB_PASSWORD,\%DB_ATTR) || connect_error();
    }
    return $COMC_DBH;
}

sub connect_error {
    Kalliope::Page::notFound('Der opstod en fejl under tilslutning til databasen, prøv igen senere!<p><i>'.$DBI::errstr.'</i>');
    exit;
}

sub getLastInsertId {
    my ($dbh,$table) = @_;
    my $sth = $dbh->prepare_cached("SELECT LAST_INSERT_ID() FROM $table");
    $sth->execute();
    my ($id) = $sth->fetchrow_array();
    $sth->finish();
    return $id;
}

1;
