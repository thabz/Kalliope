#!/usr/bin/perl

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

do 'kstdhead.pl';

$wheretolinklanguage = 'kfront.pl';
$titel = "Litteraturhistorie ";
$0 = "hpage.pl";
&kheaderHTML("Litteraturhistorie");

beginwhitebox("","","");

opendir(ETC,"hist.$LA/") || die "ARGH!!";
@files = readdir(ETC);
closedir(ETC);
foreach (@files) {
	if (/\.txt$/) {
		#Find titel
		$filename=$_;
		open(FILE,"hist.$LA/".$_);
		while (<FILE>) {
			if (/^T:/) {
				$titel=$_;
				chomp($titel);
				$titel=~ s/^T://;
				last;
			}
		}
		push(@index,$titel."%".$filename);
	}
};

foreach (sort @index) {
	($titel,$filename)=split(/%/);
	$filename =~ s/\.txt$//;
	print "<A HREF=\"hpage.pl?$filename?$LA\">$titel</A><BR>";
}

#print '<BR><A HREF="keyword.cgi?mode=visalle&sprog='.$LA.'">Nøgleord</A><BR>';
print "<BR><BR><I>Disse artikler vil snart forsvinde - deres indhold vil blive overflyttet til nøgleordene</I>\n";

endbox();

kfooterHTML();
