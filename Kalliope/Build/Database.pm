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

package Kalliope::Build::Database;

use Kalliope::DB;
use strict;

my $dbh = Kalliope::DB::connect();

sub grant {
   $dbh->do(q/GRANT SELECT ON TABLE fnavne,vaerker,digte,worknotes,textxkeyword,timeline,textpictures,keywords,keywords_images,xrefs TO PUBLIC/);
   $dbh->do(q/GRANT SELECT ON TABLE keywords_relation,textnotes TO PUBLIC/);
   $dbh->do(q/GRANT SELECT ON TABLE workpictures,news,dict TO PUBLIC/);
}

1;
