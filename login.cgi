#!/usr/bin/perl

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
#  $Id: kabout.pl 3697 2002-11-01 08:48:31Z jec $

use Kalliope::Page ();
use Kalliope::User ();
use CGI ();
use CGI::Cookie;
use utf8;

my $login = CGI::param('login');
my $password = CGI::param('password');
my $action = CGI::param('action');

if ($action eq 'logout') {
    my $page = new Kalliope::Page (
	    redirect => 'index.cgi',
	    removeremoteuser => 1); 
    $page->print;
} elsif ($login) {
    my $user = new Kalliope::User(login => $login, password => $password);
    if ($user) {
	my $HTML = "Du er logget ind som ".$user->name();
	my $page = new Kalliope::Page (
		title => "Redaktør side",
		setremoteuser => $user->login(),
		pagegroup => 'om',
		crumbs => \@crumbs
		); 
	$page->addBox (width => '75%',
		content => $HTML);
	$page->print;
    } else {
        my @crumbs = (['Login','login.cgi']);
	my $HTML = "Forkert brugernavn eller adgangskode.";
	my $page = new Kalliope::Page (
		title => "Login fejlet",
		pagegroup => 'om',
		crumbs => \@crumbs
		); 
	$page->addBox (width => '75%',
		content => $HTML);
	$page->print;

    }

} else {
    my @crumbs = (['Login','']);

    my $page = new Kalliope::Page (
		title => "Kalliope login $login",
                pagegroup => 'om',
		subtitle => "Hemmelig side for redaktører",
		crumbs => \@crumbs
                ); 

    my $HTML = qq|
       <form action="login.cgi" method="post">
          Brugernavn:<br>
          <input name="login"><br>
          Adgangskode:<br>
          <input name="password" type="password"><br>
          <input type="submit" value=" Login ">
       </form>
    |;

    $page->addBox (width => '75%',
                   content => $HTML);
    $page->print;
}


