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

@ARGV = split(/\?/,$ARGV[0]);
$LA=$ARGV[0];

&kheaderHTML('Søgning');

do 'ksearch.ovs';

#&kcenterpageheader($ovs1{$LA});

#Indled kasse til selve teksten
beginwhitebox("","","");

print "<FORM METHOD=POST ACTION=\"ksearchresult.pl?$LA\">";
print "$ovs2{$LA} <INPUT TYPE=text NAME=string size=30>&nbsp;";
print "<INPUT TYPE=submit VALUE=\"$ovs10{$LA}\">";
#print "<INPUT TYPE=\"Reset\" VALUE=\"$ovs11{$LA}\"><BR><BR>";
#print "Logik:<BR>\n";
#print "<INPUT TYPE=radio NAME=logic VALUE=\"or\" CHECKED>Eller<BR>";
#print "<INPUT TYPE=radio NAME=logic VALUE=\"and\" >Og<BR>";

#Udskriv forfatter selector...

#print "$ovs3{$LA}: <FONT SIZE=2><select name=\"fdata\">\n";
#print "<FONT SIZE=2>";
#print "<option value=\"*%$ovs22{$LA}\">$ovs4{$LA}";

#open (IN, "data.$LA/fnavne.txt");
#while (<IN>) {
#	chop($_);chop($_);
#	($fhandle,$ffornavn,$fefternavn,$ffoedt,$fdoed) = split(/=/);
#	$fefternavn =~ s/^Aa/Å/;	#Et lille hack til at klare sorteringsproblemet med Aa.
#	push(@liste,"$fefternavn%$ffornavn%$fhandle%$ffoedt%$fdoed");
#}
#close(IN);
#foreach (sort @liste) {
#	@k=split(/%/);
#	$k[0] =~ s/Å/Aa/;
#	$fdata="$k[2]%$k[1] $k[0]";
#	print "<option value=\"$fdata\">$k[0], $k[1]";
#}
#print "</select></FONT><BR><BR>";


#udskriv resten af FORMen.

#print "<INPUT TYPE=radio NAME=hvor VALUE=\"begge\" CHECKED> $ovs5{$LA}.<BR>";
#print "<INPUT TYPE=radio NAME=hvor VALUE=\"indhold\"> $ovs6{$LA}<BR>";
#print "<INPUT TYPE=radio NAME=hvor VALUE=\"titler\"> $ovs7{$LA}<BR>";
#print "<INPUT TYPE=checkbox NAME=whole> $ovs8{$LA}<BR>";
#print "Indstillinger:<BR>\n";
#print "<INPUT TYPE=checkbox NAME=case>Forskel på store og små bogstaver<BR>";
#print "<INPUT TYPE=checkbox NAME=aa CHECKED>Aa og Å er ens<BR>";
print "</FORM>";
#print "<FONT SIZE=2><I>Flere ord kan knyttes sammen med \"...\" til én søgeterm<BR>";
#print "pt. bruges kun første søgeterm.</I><FONT><BR><BR>";

#if (-e "data.$LA/searchhelp.html") {
#    print "<BR><BR>\n";
#    print "<A HREF=\"ksearchhelp.pl?$LA\">$ovs9{$LA}</A>";
#}
print '<UL><LI><I>Søgemaskinen er stadig under udvikling. ';
print 'Den søger udelukkende i digtenes indhold eller titel.</I>';
print '<LI><I>Søg kun på eet ord. Forsøg at vælge det mest usædvanlige ord i det digt du ønsker at finde.</I>';
print '</UL>';
#Afslut kassen
endbox();

&kfooterHTML;
