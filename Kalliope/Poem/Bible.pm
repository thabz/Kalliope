
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

package Kalliope::Poem::Bible;
@ISA = qw/ Kalliope::Poem /;

use Kalliope::Poem;

my %abbrevations = (
        '1mose'		 => '1 Mos',
        '2mose'		 => '2 Mos',
        '3mose'		 => '3 Mos',
        '4mose'		 => '4 Mos',
        '5mose'		 => '5 Mos',
        'josua'		 => 'Jos',
        'dommer'	 => 'Dom',
        'rut'		 => 'Rut',
        '1samuel'	 => '1 Sam',
        '2samuel'	 => '2 Sam',
        '1konge'	 => '1 Kong',
        '2konge'	 => '2 Kong',
        '1kroen'	 => '1 Krøn',
        '2kroen'	 => '2 Krøn',
        'ezra'		 => 'Ezra',
        'nehemias'	 => 'Neh',
        'ester'		 => 'Est',
        'job'		 => 'Job',
        'salme'		 => 'Sl',
        'ordsprog'	 => 'Ordsp',
        'praed'		 => 'Præd',
        'hoej'		 => 'Højs',
        'esajas'	 => 'Es',
        'jeremias'	 => 'Jer',
        'klage'		 => 'Klages',
        'ezekiel'	 => 'Ez',
        'daniel'	 => 'Dan',
        'hoseas'	 => 'Hos',
        'joel'		 => 'Joel',
        'amos'		 => 'Am',
        'obadias'	 => 'Obad',
        'jonas'		 => 'Jon',
        'mikas'		 => 'Mika',
        'nahum'		 => 'Nah',
        'habakkuk'	 => 'Hab',
        'zefanias'	 => 'Zef',
        'haggaj'	 => 'Hagg',
        'zakarias'	 => 'Zak',
        'malakias'	 => 'Mal',
        'matt'		 => 'Matt',
        'markus'	 => 'Mark',
        'lukas'		 => 'Luk',
        'johannes'	 => 'Joh',
        'apostlene'	 => 'Ap.G',
        'rom'		 => 'Rom',
        '1korint'	 => '1 Kor',
        '2korint'	 => '2 Kor',
        'galaterne'	 => 'Gal',
        'efeserne'	 => 'Ef',
        'filipperne'	 => 'Fil',
        'kolossen'	 => 'Kol',
        '1tessa'	 => '1 Tess',
        '2tessa'	 => '2 Tess',
        '1timoteus'	 => '1 Tim',
        '2timoteus'	 => '2 Tim',
        'titus'		 => 'Tit',
        'filemon'	 => 'Filem',
        'hebrae'	 => 'Hebr',
        'jakob'		 => 'Jak',
        '1peter'	 => '1 Pet',
        '2peter'	 => '2 Pet',
        '1johannes'	 => '1 Joh',
        '2johannes'	 => '2 Joh',
        '3johannes'	 => '3 Joh',
        'judas'		 => 'Jud',
        'aabenbaringen'	 => 'Åb',
);

sub clickableTitleSimple {
    my ($self,$verses) = @_;
    my $id = $self->longdid;
    $id =~ s/^bibel//;
    ($kap) = $id =~ /(\d+)$/;
    $id =~ s/\d+$//;
    my $title = $abbrevations{$id}.'.'.(int $kap);
    $title = "$title,$verses" if $verses;
    my $extraURL = $verses ? '&biblemark='.$verses."#biblemark" : '';
    return '<A CLASS=green HREF="digt.pl?longdid='.$self->longdid.qq|$extraURL">$title</A>|;
}
