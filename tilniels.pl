#!/usr/bin/perl

#  Hjælp til Niels Jensens automatiske links ind i Kalliope.
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

print "Content-type: text/plain\n\n";
open (FIL,"data.dk/fnavne.txt");

foreach (<FIL>) {
    ($fhandle) = split /=/;
    print $fhandle."=";
    print ((-e "fdirs/$fhandle/vaerker.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/bio.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/links.txt") ? "Y=" : "N=");
    print ((-e "fdirs/$fhandle/sekundaer.txt") ? "Y" : "N");
    print "\n";
}
