package Kalliope::DB;

use strict;
use DBI;
use Carp;
use vars qw($COMC_DBH);

sub connect {
    # connect
    if (!defined $COMC_DBH) { 
	$COMC_DBH = DBI->connect('DBI:mysql:kalliope:localhost', 'kalliope', '') || connect_error();
    }
    # Do status check on existing handle
    if (!$COMC_DBH->ping) {
	$COMC_DBH = DBI->connect('DBI:mysql:kalliope:localhost', 'kalliope', '') || connect_error();
    }
    return $COMC_DBH;
}

sub connect_error {
    print "Content-Type: text/html; charset=ISO-8859-1\r\n",
    "\r\n";
    print '<HTML><HEAD>',
    '<TITLE>Database Fejl</TITLE>',
    '</HEAD><BODY>',
    '<H1>Database Fejl</H1>',
    'Der opstod en fejl under tilslutning til databasen, prøv igen senere!<P>',
    $DBI::errstr,
    '</BODY></HTML>';
    exit;
}

1;
