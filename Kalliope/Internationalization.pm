#!/usr/bin/perl -w

#  Copyright (C) 1999-2012 Jesper Christensen 
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

package Kalliope::Internationalization;

use CGI ();

my %translation;
my $translation_init = 0;

sub _ {
    my ($key,@options) = @_;
    init();
    my $md5 = $translation{$key};
    if ($md5) {
	my $result = $translation{"en-$md5"};
	return sprintf("$result",@options) if $result;
    }
    return sprintf("*$key",@options);
}

sub http_accept_language {
    my $http_accept_language = $ENV{HTTP_ACCEPT_LANGUAGE} || 'da';
    return $http_accept_language;
}

sub http_accept_lang {
    return "en";
}

sub http_accept_sprog {
    my $language = http_accept_language();
    if ($language eq 'da') {
	return "dk";
    } else {
        return "uk";
    }
}

sub knows_md5 {
    my $md5 = shift;
    init();
    return $translation{"da-$md5"};
}

sub init {
    if ($translation_init == 1) {
	return
    }
    $translation_init = 1;

# ./index.cgi
$translation{'<p><i>Kalliope</i> er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning. Kalliope indeholder også udenlandsk digtning, men primært i et omfang som kan bruges til belysning af den danske samling.</p>'} = "fd081cbeeb66380fd3598d3e7e2b80ab";
$translation{'da-fd081cbeeb66380fd3598d3e7e2b80ab'} = '<p><i>Kalliope</i> er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning. Kalliope indeholder også udenlandsk digtning, men primært i et omfang som kan bruges til belysning af den danske samling.</p>';
$translation{'en-fd081cbeeb66380fd3598d3e7e2b80ab'} = "<i>Kalliope</i> is a database containing old Danish poetry and associated biographical data. The goal is no less than to collect all of the older Danish poetry, but until then, Kalliope will contain a representative and still growing selection. Kalliope also contains poetry in English and other languages, but primarily as reference material to the Danish collection.";
$translation{'de-fd081cbeeb66380fd3598d3e7e2b80ab'} = "";
$translation{'fr-fd081cbeeb66380fd3598d3e7e2b80ab'} = "";
$translation{'it-fd081cbeeb66380fd3598d3e7e2b80ab'} = "";
# ./Kalliope/Quality.pm
$translation{'Anden korrekturlæsning'} = "8057e4af70929d15a8510ce0556774b3";
$translation{'da-8057e4af70929d15a8510ce0556774b3'} = 'Anden korrekturlæsning';
$translation{'en-8057e4af70929d15a8510ce0556774b3'} = "Second proofreading";
$translation{'de-8057e4af70929d15a8510ce0556774b3'} = "";
$translation{'fr-8057e4af70929d15a8510ce0556774b3'} = "";
$translation{'it-8057e4af70929d15a8510ce0556774b3'} = "";
# ./biografi.cgi
$translation{'Antal digte:'} = "602cebafce11f2763cd6868fbf405fbd";
$translation{'da-602cebafce11f2763cd6868fbf405fbd'} = 'Antal digte:';
$translation{'en-602cebafce11f2763cd6868fbf405fbd'} = "Number of poems:";
$translation{'de-602cebafce11f2763cd6868fbf405fbd'} = "";
$translation{'fr-602cebafce11f2763cd6868fbf405fbd'} = "";
$translation{'it-602cebafce11f2763cd6868fbf405fbd'} = "";
# ./metafront.cgi,./metafront.cgi,./Kalliope/Page.pm,./Kalliope/Page.pm
$translation{'Baggrund'} = "39d407032008498a95cfaad03424afe6";
$translation{'da-39d407032008498a95cfaad03424afe6'} = 'Baggrund';
$translation{'en-39d407032008498a95cfaad03424afe6'} = "Background";
$translation{'de-39d407032008498a95cfaad03424afe6'} = "";
$translation{'fr-39d407032008498a95cfaad03424afe6'} = "";
$translation{'it-39d407032008498a95cfaad03424afe6'} = "";
# ./ffront.cgi,./fsekundaer.pl,./fsekundaer.pl,./Kalliope/Person.pm
$translation{'Bibliografi'} = "5a79b53dfa8e4599db89cc935296c5b2";
$translation{'da-5a79b53dfa8e4599db89cc935296c5b2'} = 'Bibliografi';
$translation{'en-5a79b53dfa8e4599db89cc935296c5b2'} = 'Bibliography';
$translation{'de-5a79b53dfa8e4599db89cc935296c5b2'} = "";
$translation{'fr-5a79b53dfa8e4599db89cc935296c5b2'} = "";
$translation{'it-5a79b53dfa8e4599db89cc935296c5b2'} = "";
# ./ffront.cgi
$translation{'Bibliografi for %s'} = "21dcc703f663c8bf960948c0e35bf7e2";
$translation{'da-21dcc703f663c8bf960948c0e35bf7e2'} = 'Bibliografi for %s';
$translation{'en-21dcc703f663c8bf960948c0e35bf7e2'} = "Bibliography for %s";
$translation{'de-21dcc703f663c8bf960948c0e35bf7e2'} = "";
$translation{'fr-21dcc703f663c8bf960948c0e35bf7e2'} = "";
$translation{'it-21dcc703f663c8bf960948c0e35bf7e2'} = "";
# ./biografi.cgi,./biografi.cgi,./ffront.cgi,./Kalliope/Person.pm
$translation{'Biografi'} = "5e86d25005a1caf2a727c7086b000e7c";
$translation{'da-5e86d25005a1caf2a727c7086b000e7c'} = 'Biografi';
$translation{'en-5e86d25005a1caf2a727c7086b000e7c'} = "Biography";
$translation{'de-5e86d25005a1caf2a727c7086b000e7c'} = "";
$translation{'fr-5e86d25005a1caf2a727c7086b000e7c'} = "";
$translation{'it-5e86d25005a1caf2a727c7086b000e7c'} = "";
# ./Kalliope/Page.pm
$translation{'Biografier'} = "f9e7a1a0a6912af8c1227f268ce80be1";
$translation{'da-f9e7a1a0a6912af8c1227f268ce80be1'} = 'Biografier';
$translation{'en-f9e7a1a0a6912af8c1227f268ce80be1'} = "Biographies";
$translation{'de-f9e7a1a0a6912af8c1227f268ce80be1'} = "";
$translation{'fr-f9e7a1a0a6912af8c1227f268ce80be1'} = "";
$translation{'it-f9e7a1a0a6912af8c1227f268ce80be1'} = "";
# ./kabout.pl
$translation{'Coming attractions'} = "3f242a0b77daee50f5fa45e227b8985c";
$translation{'da-3f242a0b77daee50f5fa45e227b8985c'} = 'Coming attractions';
$translation{'en-3f242a0b77daee50f5fa45e227b8985c'} = "Coming attractions";
$translation{'de-3f242a0b77daee50f5fa45e227b8985c'} = "";
$translation{'fr-3f242a0b77daee50f5fa45e227b8985c'} = "";
$translation{'it-3f242a0b77daee50f5fa45e227b8985c'} = "";
# ./index.cgi
$translation{'Dagen idag'} = "f0ecc464c228ab3de1d6d5e2b7337ced";
$translation{'da-f0ecc464c228ab3de1d6d5e2b7337ced'} = 'Dagen idag';
$translation{'en-f0ecc464c228ab3de1d6d5e2b7337ced'} = "The day today";
$translation{'de-f0ecc464c228ab3de1d6d5e2b7337ced'} = "";
$translation{'fr-f0ecc464c228ab3de1d6d5e2b7337ced'} = "";
$translation{'it-f0ecc464c228ab3de1d6d5e2b7337ced'} = "";
# ./poemsfront.cgi
$translation{'De mest læste digte i Kalliope'} = "dccadf1aea0191390c652061674aeef3";
$translation{'da-dccadf1aea0191390c652061674aeef3'} = 'De mest læste digte i Kalliope';
$translation{'en-dccadf1aea0191390c652061674aeef3'} = "The most read poems in Kalliope";
$translation{'de-dccadf1aea0191390c652061674aeef3'} = "";
$translation{'fr-dccadf1aea0191390c652061674aeef3'} = "";
$translation{'it-dccadf1aea0191390c652061674aeef3'} = "";
# ./worksfront.cgi
$translation{'De mest læste værker i Kalliope'} = "5ff0c0dbf7e8dba6111e3e34e482e76d";
$translation{'da-5ff0c0dbf7e8dba6111e3e34e482e76d'} = 'De mest læste værker i Kalliope';
$translation{'en-5ff0c0dbf7e8dba6111e3e34e482e76d'} = "The most read works in Kalliope";
$translation{'de-5ff0c0dbf7e8dba6111e3e34e482e76d'} = "";
$translation{'fr-5ff0c0dbf7e8dba6111e3e34e482e76d'} = "";
$translation{'it-5ff0c0dbf7e8dba6111e3e34e482e76d'} = "";
# ./poemsfront.cgi
$translation{'De senest tilføjede digte i Kalliope'} = "5a235460271c06b7f40c3f76ab400718";
$translation{'da-5a235460271c06b7f40c3f76ab400718'} = 'De senest tilføjede digte i Kalliope';
$translation{'en-5a235460271c06b7f40c3f76ab400718'} = "Latest added poems in Kalliope";
$translation{'de-5a235460271c06b7f40c3f76ab400718'} = "";
$translation{'fr-5a235460271c06b7f40c3f76ab400718'} = "";
$translation{'it-5a235460271c06b7f40c3f76ab400718'} = "";
# ./kvaerker.pl,./kvaerker.pl
$translation{'Denne oversigt indeholder kun værker som har et faktisk udgivelsesår'} = "5f4cadaa2ba0cbd19dcf7619c2705c29";
$translation{'da-5f4cadaa2ba0cbd19dcf7619c2705c29'} = 'Denne oversigt indeholder kun værker som har et faktisk udgivelsesår';
$translation{'en-5f4cadaa2ba0cbd19dcf7619c2705c29'} = "This list only contains works with an actual publishing year";
$translation{'de-5f4cadaa2ba0cbd19dcf7619c2705c29'} = "";
$translation{'fr-5f4cadaa2ba0cbd19dcf7619c2705c29'} = "";
$translation{'it-5f4cadaa2ba0cbd19dcf7619c2705c29'} = "";
# ./biografi.cgi
$translation{'Der er endnu ikke forfattet en biografi for \%s'} = "7f1cab0bb69799279ef0f344e2803d2a";
$translation{'da-7f1cab0bb69799279ef0f344e2803d2a'} = 'Der er endnu ikke forfattet en biografi for \%s';
$translation{'en-7f1cab0bb69799279ef0f344e2803d2a'} = 'There no biography for %s';
$translation{'de-7f1cab0bb69799279ef0f344e2803d2a'} = "";
$translation{'fr-7f1cab0bb69799279ef0f344e2803d2a'} = "";
$translation{'it-7f1cab0bb69799279ef0f344e2803d2a'} = "";
# ./fvaerker.pl
$translation{'Der findes endnu ingen af %ss værker i Kalliope'} = "57dc8bbeadbd2b7a15ad7460b1ff8454";
$translation{'da-57dc8bbeadbd2b7a15ad7460b1ff8454'} = 'Der findes endnu ingen af %ss værker i Kalliope';
$translation{'en-57dc8bbeadbd2b7a15ad7460b1ff8454'} = "There are not yet any works by %s in Kalliope";
$translation{'de-57dc8bbeadbd2b7a15ad7460b1ff8454'} = "";
$translation{'fr-57dc8bbeadbd2b7a15ad7460b1ff8454'} = "";
$translation{'it-57dc8bbeadbd2b7a15ad7460b1ff8454'} = "";
# ./henvisninger.cgi
$translation{'Der findes ingen tekster, som henviser til %ss tekster.'} = "73e6b9684301f9f46c80db8afb9dea93";
$translation{'da-73e6b9684301f9f46c80db8afb9dea93'} = 'Der findes ingen tekster, som henviser til %ss tekster.';
$translation{'en-73e6b9684301f9f46c80db8afb9dea93'} = "No texts reference the texts of %s";
$translation{'de-73e6b9684301f9f46c80db8afb9dea93'} = "";
$translation{'fr-73e6b9684301f9f46c80db8afb9dea93'} = "";
$translation{'it-73e6b9684301f9f46c80db8afb9dea93'} = "";
# ./digt.pl
$translation{'Dette digt har endnu ingen nøgleord tilknyttet.'} = "c50b4f50c79e0969e4de30a6be4a6d93";
$translation{'da-c50b4f50c79e0969e4de30a6be4a6d93'} = 'Dette digt har endnu ingen nøgleord tilknyttet.';
$translation{'en-c50b4f50c79e0969e4de30a6be4a6d93'} = "This poem has no keywords yet.";
$translation{'de-c50b4f50c79e0969e4de30a6be4a6d93'} = "";
$translation{'fr-c50b4f50c79e0969e4de30a6be4a6d93'} = "";
$translation{'it-c50b4f50c79e0969e4de30a6be4a6d93'} = "";
# ./index.cgi
$translation{'Digtarkiv'} = "d761e058e45b6d4711e385cb1ec990cb";
$translation{'da-d761e058e45b6d4711e385cb1ec990cb'} = 'Digtarkiv';
$translation{'en-d761e058e45b6d4711e385cb1ec990cb'} = "Archive of poetry";
$translation{'de-d761e058e45b6d4711e385cb1ec990cb'} = "";
$translation{'fr-d761e058e45b6d4711e385cb1ec990cb'} = "";
$translation{'it-d761e058e45b6d4711e385cb1ec990cb'} = "";
# ./klines.pl,./klines.pl,./poemsfront.cgi,./poemsfront.cgi,./poets.cgi,./Kalliope/Page.pm,./Kalliope/Page.pm,./Kalliope/Page.pm
$translation{'Digte'} = "ce2dcea5bfcec9e27805794eb74c8ead";
$translation{'da-ce2dcea5bfcec9e27805794eb74c8ead'} = 'Digte';
$translation{'en-ce2dcea5bfcec9e27805794eb74c8ead'} = 'Poems';
$translation{'de-ce2dcea5bfcec9e27805794eb74c8ead'} = "";
$translation{'fr-ce2dcea5bfcec9e27805794eb74c8ead'} = "";
$translation{'it-ce2dcea5bfcec9e27805794eb74c8ead'} = "";
# ./poemsfront.cgi
$translation{'Digte efter førstelinier'} = "8a9f8840a8f8eed66845850a71f1601d";
$translation{'da-8a9f8840a8f8eed66845850a71f1601d'} = 'Digte efter førstelinier';
$translation{'en-8a9f8840a8f8eed66845850a71f1601d'} = "Poems by firstlines";
$translation{'de-8a9f8840a8f8eed66845850a71f1601d'} = "";
$translation{'fr-8a9f8840a8f8eed66845850a71f1601d'} = "";
$translation{'it-8a9f8840a8f8eed66845850a71f1601d'} = "";
# ./poemsfront.cgi
$translation{'Digte efter titler'} = "fb943732e79c310aa86ae010d78e4ae8";
$translation{'da-fb943732e79c310aa86ae010d78e4ae8'} = 'Digte efter titler';
$translation{'en-fb943732e79c310aa86ae010d78e4ae8'} = "Poems by titles";
$translation{'de-fb943732e79c310aa86ae010d78e4ae8'} = "";
$translation{'fr-fb943732e79c310aa86ae010d78e4ae8'} = "";
$translation{'it-fb943732e79c310aa86ae010d78e4ae8'} = "";
# ./poemsfront.cgi
$translation{'Digte ordnet efter førstelinier'} = "7b133727212ab5e23e908ee686bea431";
$translation{'da-7b133727212ab5e23e908ee686bea431'} = 'Digte ordnet efter førstelinier';
$translation{'en-7b133727212ab5e23e908ee686bea431'} = "Poems ordered by firstlines";
$translation{'de-7b133727212ab5e23e908ee686bea431'} = "";
$translation{'fr-7b133727212ab5e23e908ee686bea431'} = "";
$translation{'it-7b133727212ab5e23e908ee686bea431'} = "";
# ./poemsfront.cgi
$translation{'Digte ordnet efter titler'} = "83fb9de5b78ed03b0cdafafd1160a3e8";
$translation{'da-83fb9de5b78ed03b0cdafafd1160a3e8'} = 'Digte ordnet efter titler';
$translation{'en-83fb9de5b78ed03b0cdafafd1160a3e8'} = "Poems ordered by titles";
$translation{'de-83fb9de5b78ed03b0cdafafd1160a3e8'} = "";
$translation{'fr-83fb9de5b78ed03b0cdafafd1160a3e8'} = "";
$translation{'it-83fb9de5b78ed03b0cdafafd1160a3e8'} = "";
# ./klines.pl
$translation{'Digte som begynder med %s'} = "7efa54ee9d1908ba9e56c3db4307166d";
$translation{'da-7efa54ee9d1908ba9e56c3db4307166d'} = 'Digte som begynder med %s';
$translation{'en-7efa54ee9d1908ba9e56c3db4307166d'} = "Poems that begins with %s";
$translation{'de-7efa54ee9d1908ba9e56c3db4307166d'} = "";
$translation{'fr-7efa54ee9d1908ba9e56c3db4307166d'} = "";
$translation{'it-7efa54ee9d1908ba9e56c3db4307166d'} = "";
# ./Kalliope/Person.pm
$translation{'Digter'} = "bac9197ef0dd2d8044a10fb0b017e8ed";
$translation{'da-bac9197ef0dd2d8044a10fb0b017e8ed'} = 'Digter';
$translation{'en-bac9197ef0dd2d8044a10fb0b017e8ed'} = 'Poet';
$translation{'de-bac9197ef0dd2d8044a10fb0b017e8ed'} = "";
$translation{'fr-bac9197ef0dd2d8044a10fb0b017e8ed'} = "";
$translation{'it-bac9197ef0dd2d8044a10fb0b017e8ed'} = "";
# ./fsearch.cgi,./poets.cgi,./poets.cgi,./poetsfront.cgi,./poetsfront.cgi,./vaerktoc.pl,./Kalliope/Page.pm,./Kalliope/Page.pm,./Kalliope/Page.pm,./Kalliope/Person.pm
$translation{'Digtere'} = "bc81cfd8a351788310a5dd08a3b31c97";
$translation{'da-bc81cfd8a351788310a5dd08a3b31c97'} = 'Digtere';
$translation{'en-bc81cfd8a351788310a5dd08a3b31c97'} = "Poets";
$translation{'de-bc81cfd8a351788310a5dd08a3b31c97'} = "";
$translation{'fr-bc81cfd8a351788310a5dd08a3b31c97'} = "";
$translation{'it-bc81cfd8a351788310a5dd08a3b31c97'} = "";
# ./poets.cgi
$translation{'Digtere efter fødeår'} = "327b96078a4b38f6b5fa96daf4df8a1a";
$translation{'da-327b96078a4b38f6b5fa96daf4df8a1a'} = 'Digtere efter fødeår';
$translation{'en-327b96078a4b38f6b5fa96daf4df8a1a'} = "Poets by year of birth";
$translation{'de-327b96078a4b38f6b5fa96daf4df8a1a'} = "";
$translation{'fr-327b96078a4b38f6b5fa96daf4df8a1a'} = "";
$translation{'it-327b96078a4b38f6b5fa96daf4df8a1a'} = "";
# ./poets.cgi,./poetsfront.cgi,./Kalliope/Page.pm
$translation{'Digtere efter navn'} = "5f447970efa0f7357d4b938ff2d8f5e0";
$translation{'da-5f447970efa0f7357d4b938ff2d8f5e0'} = 'Digtere efter navn';
$translation{'en-5f447970efa0f7357d4b938ff2d8f5e0'} = "Poets by name";
$translation{'de-5f447970efa0f7357d4b938ff2d8f5e0'} = "";
$translation{'fr-5f447970efa0f7357d4b938ff2d8f5e0'} = "";
$translation{'it-5f447970efa0f7357d4b938ff2d8f5e0'} = "";
# ./poets.cgi,./poetsfront.cgi,./Kalliope/Page.pm
$translation{'Digtere efter udseende'} = "9e71eab329126d9d785151b6b125798c";
$translation{'da-9e71eab329126d9d785151b6b125798c'} = 'Digtere efter udseende';
$translation{'en-9e71eab329126d9d785151b6b125798c'} = "Poets by their looks";
$translation{'de-9e71eab329126d9d785151b6b125798c'} = "";
$translation{'fr-9e71eab329126d9d785151b6b125798c'} = "";
$translation{'it-9e71eab329126d9d785151b6b125798c'} = "";
# ./poetsfront.cgi,./Kalliope/Page.pm
$translation{'Digtere efter år'} = "b04d0224d905074b195a7a41d4ca3584";
$translation{'da-b04d0224d905074b195a7a41d4ca3584'} = 'Digtere efter år';
$translation{'en-b04d0224d905074b195a7a41d4ca3584'} = "Poets by year";
$translation{'de-b04d0224d905074b195a7a41d4ca3584'} = "";
$translation{'fr-b04d0224d905074b195a7a41d4ca3584'} = "";
$translation{'it-b04d0224d905074b195a7a41d4ca3584'} = "";
# ./poetsfront.cgi
$translation{'Digtere ordnet efter hvor rigt repræsenteret de er i Kalliope.'} = "af077964be77dd3936d21f2f4c960330";
$translation{'da-af077964be77dd3936d21f2f4c960330'} = 'Digtere ordnet efter hvor rigt repræsenteret de er i Kalliope.';
$translation{'en-af077964be77dd3936d21f2f4c960330'} = "Poets sorted by the numbers of texts in Kalliope";
$translation{'de-af077964be77dd3936d21f2f4c960330'} = "";
$translation{'fr-af077964be77dd3936d21f2f4c960330'} = "";
$translation{'it-af077964be77dd3936d21f2f4c960330'} = "";
# ./poetsfront.cgi
$translation{'Digtere ordnet kronologisk efter fødeår.'} = "bdd90da20d8cb174560c983ca14a1672";
$translation{'da-bdd90da20d8cb174560c983ca14a1672'} = 'Digtere ordnet kronologisk efter fødeår.';
$translation{'en-bdd90da20d8cb174560c983ca14a1672'} = "Poets sorted by year of birth";
$translation{'de-bdd90da20d8cb174560c983ca14a1672'} = "";
$translation{'fr-bdd90da20d8cb174560c983ca14a1672'} = "";
$translation{'it-bdd90da20d8cb174560c983ca14a1672'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Digtere som udgav værker i %ss levetid'} = "dd736dc8f8d60c5471f5f69818571f28";
$translation{'da-dd736dc8f8d60c5471f5f69818571f28'} = 'Digtere som udgav værker i %ss levetid';
$translation{'en-dd736dc8f8d60c5471f5f69818571f28'} = "Contemporary poets of %s";
$translation{'de-dd736dc8f8d60c5471f5f69818571f28'} = "";
$translation{'fr-dd736dc8f8d60c5471f5f69818571f28'} = "";
$translation{'it-dd736dc8f8d60c5471f5f69818571f28'} = "";
# ./ffront.cgi,./flines.pl,./Kalliope/Page.pm,./Kalliope/Person.pm
$translation{'Digttitler'} = "366e7d568d1a57e85f2cd4a747ca0012";
$translation{'da-366e7d568d1a57e85f2cd4a747ca0012'} = 'Digttitler';
$translation{'en-366e7d568d1a57e85f2cd4a747ca0012'} = 'Poemtitles';
$translation{'de-366e7d568d1a57e85f2cd4a747ca0012'} = "";
$translation{'fr-366e7d568d1a57e85f2cd4a747ca0012'} = "";
$translation{'it-366e7d568d1a57e85f2cd4a747ca0012'} = "";
# ./Kalliope/Page.pm
$translation{'Du befinder dig i den %s samling.'} = "ff0a8e5af01436687521b76064680810";
$translation{'da-ff0a8e5af01436687521b76064680810'} = 'Du befinder dig i den %s samling.';
$translation{'en-ff0a8e5af01436687521b76064680810'} = "You are in the %s collection";
$translation{'de-ff0a8e5af01436687521b76064680810'} = "";
$translation{'fr-ff0a8e5af01436687521b76064680810'} = "";
$translation{'it-ff0a8e5af01436687521b76064680810'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'En kortfattet introduktion til %ss liv og værk'} = "7fadf21c8182f34debb7b60dbc83a7a0";
$translation{'da-7fadf21c8182f34debb7b60dbc83a7a0'} = 'En kortfattet introduktion til %ss liv og værk';
$translation{'en-7fadf21c8182f34debb7b60dbc83a7a0'} = "A short introduction to the life and work of %s";
$translation{'de-7fadf21c8182f34debb7b60dbc83a7a0'} = "";
$translation{'fr-7fadf21c8182f34debb7b60dbc83a7a0'} = "";
$translation{'it-7fadf21c8182f34debb7b60dbc83a7a0'} = "";
# ./poetsfront.cgi
$translation{'En oversigt med portrætter af alle digtere.'} = "40d208a354a5c2b01b912250895b53c0";
$translation{'da-40d208a354a5c2b01b912250895b53c0'} = 'En oversigt med portrætter af alle digtere.';
$translation{'en-40d208a354a5c2b01b912250895b53c0'} = "An overview with portraits of all poets";
$translation{'de-40d208a354a5c2b01b912250895b53c0'} = "";
$translation{'fr-40d208a354a5c2b01b912250895b53c0'} = "";
$translation{'it-40d208a354a5c2b01b912250895b53c0'} = "";
# ./poetsfront.cgi
$translation{'En oversigt over de mest læste digtere i Kalliope.'} = "60d0bd054902a8c8def0c2d6b329de87";
$translation{'da-60d0bd054902a8c8def0c2d6b329de87'} = 'En oversigt over de mest læste digtere i Kalliope.';
$translation{'en-60d0bd054902a8c8def0c2d6b329de87'} = "The most read poets in Kalliope";
$translation{'de-60d0bd054902a8c8def0c2d6b329de87'} = "";
$translation{'fr-60d0bd054902a8c8def0c2d6b329de87'} = "";
$translation{'it-60d0bd054902a8c8def0c2d6b329de87'} = "";
# ./poets.cgi,./poetsfront.cgi,./Kalliope/Page.pm
$translation{'Flittigste digtere'} = "683c64586678f0366000ca35932d557e";
$translation{'da-683c64586678f0366000ca35932d557e'} = 'Flittigste digtere';
$translation{'en-683c64586678f0366000ca35932d557e'} = "Most busy poets";
$translation{'de-683c64586678f0366000ca35932d557e'} = "";
$translation{'fr-683c64586678f0366000ca35932d557e'} = "";
$translation{'it-683c64586678f0366000ca35932d557e'} = "";
# ./digt.pl,./digt.pl
$translation{'Fodnoter'} = "4ec62dbd5751fa1bb6c24e0347ae6774";
$translation{'da-4ec62dbd5751fa1bb6c24e0347ae6774'} = 'Fodnoter';
$translation{'en-4ec62dbd5751fa1bb6c24e0347ae6774'} = "Footnotes";
$translation{'de-4ec62dbd5751fa1bb6c24e0347ae6774'} = "";
$translation{'fr-4ec62dbd5751fa1bb6c24e0347ae6774'} = "";
$translation{'it-4ec62dbd5751fa1bb6c24e0347ae6774'} = "";
# ./metafront.cgi
$translation{'Forklaringer til svære eller usædvanlige ord som man støder på i de ældre digte.'} = "5f3ec3cec1db5d61f1d5139a82ae335c";
$translation{'da-5f3ec3cec1db5d61f1d5139a82ae335c'} = 'Forklaringer til svære eller usædvanlige ord som man støder på i de ældre digte.';
$translation{'en-5f3ec3cec1db5d61f1d5139a82ae335c'} = "";
$translation{'de-5f3ec3cec1db5d61f1d5139a82ae335c'} = "";
$translation{'fr-5f3ec3cec1db5d61f1d5139a82ae335c'} = "";
$translation{'it-5f3ec3cec1db5d61f1d5139a82ae335c'} = "";
# ./digt.pl
$translation{'Forrige tekst...'} = "dba3278cf43555022026ea80271c8a76";
$translation{'da-dba3278cf43555022026ea80271c8a76'} = 'Forrige tekst...';
$translation{'en-dba3278cf43555022026ea80271c8a76'} = "Previous text...";
$translation{'de-dba3278cf43555022026ea80271c8a76'} = "";
$translation{'fr-dba3278cf43555022026ea80271c8a76'} = "";
$translation{'it-dba3278cf43555022026ea80271c8a76'} = "";
# ./flines.pl
$translation{'Fra %s'} = "b9e98c673130f2666a4db6219d7a45ed";
$translation{'da-b9e98c673130f2666a4db6219d7a45ed'} = 'Fra %s';
$translation{'en-b9e98c673130f2666a4db6219d7a45ed'} = 'From %s';
$translation{'de-b9e98c673130f2666a4db6219d7a45ed'} = "";
$translation{'fr-b9e98c673130f2666a4db6219d7a45ed'} = "";
$translation{'it-b9e98c673130f2666a4db6219d7a45ed'} = "";
# ./Kalliope/Quality.pm
$translation{'Første korrekturlæsning'} = "40989f71dbf01d784b2b411b10ff1b73";
$translation{'da-40989f71dbf01d784b2b411b10ff1b73'} = 'Første korrekturlæsning';
$translation{'en-40989f71dbf01d784b2b411b10ff1b73'} = "First proofreading";
$translation{'de-40989f71dbf01d784b2b411b10ff1b73'} = "";
$translation{'fr-40989f71dbf01d784b2b411b10ff1b73'} = "";
$translation{'it-40989f71dbf01d784b2b411b10ff1b73'} = "";
# ./ffront.cgi,./flines.pl,./Kalliope/Page.pm,./Kalliope/Person.pm
$translation{'Førstelinier'} = "bf149544d46ceb80fcff40e3d3d7dcd5";
$translation{'da-bf149544d46ceb80fcff40e3d3d7dcd5'} = 'Førstelinier';
$translation{'en-bf149544d46ceb80fcff40e3d3d7dcd5'} = 'Firstlines';
$translation{'de-bf149544d46ceb80fcff40e3d3d7dcd5'} = "";
$translation{'fr-bf149544d46ceb80fcff40e3d3d7dcd5'} = "";
$translation{'it-bf149544d46ceb80fcff40e3d3d7dcd5'} = "";
# ./index.cgi
$translation{'Gå til digtet...'} = "8b85e28920532d5c70beea23a0894f61";
$translation{'da-8b85e28920532d5c70beea23a0894f61'} = 'Gå til digtet...';
$translation{'en-8b85e28920532d5c70beea23a0894f61'} = 'Show more...';
$translation{'de-8b85e28920532d5c70beea23a0894f61'} = "";
$translation{'fr-8b85e28920532d5c70beea23a0894f61'} = "";
$translation{'it-8b85e28920532d5c70beea23a0894f61'} = "";
# ./digt.pl,./digt.pl
$translation{'Gå til »%s«'} = "b89fb0839442475ca79c9be116cca499";
$translation{'da-b89fb0839442475ca79c9be116cca499'} = 'Gå til »%s«';
$translation{'en-b89fb0839442475ca79c9be116cca499'} = 'Go to »%s«';
$translation{'de-b89fb0839442475ca79c9be116cca499'} = "";
$translation{'fr-b89fb0839442475ca79c9be116cca499'} = "";
$translation{'it-b89fb0839442475ca79c9be116cca499'} = "";
# ./Kalliope/Quality.pm
$translation{'Har '} = "1a0f6864a518769605ce1c1dcbd4d070";
$translation{'da-1a0f6864a518769605ce1c1dcbd4d070'} = 'Har ';
$translation{'en-1a0f6864a518769605ce1c1dcbd4d070'} = 'Has ';
$translation{'de-1a0f6864a518769605ce1c1dcbd4d070'} = "";
$translation{'fr-1a0f6864a518769605ce1c1dcbd4d070'} = "";
$translation{'it-1a0f6864a518769605ce1c1dcbd4d070'} = "";
# ./ffront.cgi,./henvisninger.cgi,./henvisninger.cgi,./Kalliope/Person.pm
$translation{'Henvisninger'} = "7760b4691340b0cd9994824cb47f57b7";
$translation{'da-7760b4691340b0cd9994824cb47f57b7'} = 'Henvisninger';
$translation{'en-7760b4691340b0cd9994824cb47f57b7'} = "References";
$translation{'de-7760b4691340b0cd9994824cb47f57b7'} = "";
$translation{'fr-7760b4691340b0cd9994824cb47f57b7'} = "";
$translation{'it-7760b4691340b0cd9994824cb47f57b7'} = "";
# ./digt.pl
$translation{'Henvisninger hertil'} = "e4b53d965ccba68df0466a85c357a7f3";
$translation{'da-e4b53d965ccba68df0466a85c357a7f3'} = 'Henvisninger hertil';
$translation{'en-e4b53d965ccba68df0466a85c357a7f3'} = 'References to this text';
$translation{'de-e4b53d965ccba68df0466a85c357a7f3'} = "";
$translation{'fr-e4b53d965ccba68df0466a85c357a7f3'} = "";
$translation{'it-e4b53d965ccba68df0466a85c357a7f3'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Henvisninger til andre steder på internettet som har relevant information om %s'} = "97890d161ef4d663f8d4e71425700ce0";
$translation{'da-97890d161ef4d663f8d4e71425700ce0'} = 'Henvisninger til andre steder på internettet som har relevant information om %s';
$translation{'en-97890d161ef4d663f8d4e71425700ce0'} = 'Links to relevant material on the internet about %s';
$translation{'de-97890d161ef4d663f8d4e71425700ce0'} = "";
$translation{'fr-97890d161ef4d663f8d4e71425700ce0'} = "";
$translation{'it-97890d161ef4d663f8d4e71425700ce0'} = "";
# ./biografi.cgi
$translation{'Historiske begivenheder'} = "ef49010a97d1d6668606beb21bf4fe1a";
$translation{'da-ef49010a97d1d6668606beb21bf4fe1a'} = 'Historiske begivenheder';
$translation{'en-ef49010a97d1d6668606beb21bf4fe1a'} = "Historical events";
$translation{'de-ef49010a97d1d6668606beb21bf4fe1a'} = "";
$translation{'fr-ef49010a97d1d6668606beb21bf4fe1a'} = "";
$translation{'it-ef49010a97d1d6668606beb21bf4fe1a'} = "";
# ./fpop.pl,./klines.pl,./kvaerker.pl,./poets.cgi
$translation{'Hits'} = "b69df945ae986e6b1882cdc87ad19617";
$translation{'da-b69df945ae986e6b1882cdc87ad19617'} = 'Hits';
$translation{'en-b69df945ae986e6b1882cdc87ad19617'} = "Hits";
$translation{'de-b69df945ae986e6b1882cdc87ad19617'} = "";
$translation{'fr-b69df945ae986e6b1882cdc87ad19617'} = "";
$translation{'it-b69df945ae986e6b1882cdc87ad19617'} = "";
# ./Kalliope/Page.pm
$translation{'Hovsa!'} = "debf275b779557973252770283f45436";
$translation{'da-debf275b779557973252770283f45436'} = 'Hovsa!';
$translation{'en-debf275b779557973252770283f45436'} = "Oops!";
$translation{'de-debf275b779557973252770283f45436'} = "";
$translation{'fr-debf275b779557973252770283f45436'} = "";
$translation{'it-debf275b779557973252770283f45436'} = "";
# ./Kalliope/Page.pm
$translation{'Hovsa! Der gik det galt! Siden kunne ikke findes.<br><br>Send en mail til <a href=\"mailto:jesper\@kalliope.org\">jesper\@kalliope.org</a>, hvis du mener, at jeg har lavet en fejl.'} = "c1fe8f4607eb97f61b863a538019a274";
$translation{'da-c1fe8f4607eb97f61b863a538019a274'} = 'Hovsa! Der gik det galt! Siden kunne ikke findes.<br><br>Send en mail til <a href=\"mailto:jesper\@kalliope.org\">jesper\@kalliope.org</a>, hvis du mener, at jeg har lavet en fejl.';
$translation{'en-c1fe8f4607eb97f61b863a538019a274'} = "";
$translation{'de-c1fe8f4607eb97f61b863a538019a274'} = "";
$translation{'fr-c1fe8f4607eb97f61b863a538019a274'} = "";
$translation{'it-c1fe8f4607eb97f61b863a538019a274'} = "";
# ./Kalliope/Date.pm
$translation{'Idag %s:%s'} = "07d41d9577c4abc42d71089692983343";
$translation{'da-07d41d9577c4abc42d71089692983343'} = 'Idag %s:%s';
$translation{'en-07d41d9577c4abc42d71089692983343'} = "Today %s:%s";
$translation{'de-07d41d9577c4abc42d71089692983343'} = "";
$translation{'fr-07d41d9577c4abc42d71089692983343'} = "";
$translation{'it-07d41d9577c4abc42d71089692983343'} = "";
# ./Kalliope/Date.pm
$translation{'Igår %s:%s'} = "cca280efd23ed9ba76209ec45d5c1387";
$translation{'da-cca280efd23ed9ba76209ec45d5c1387'} = 'Igår %s:%s';
$translation{'en-cca280efd23ed9ba76209ec45d5c1387'} = "Yesterday %s:%s";
$translation{'de-cca280efd23ed9ba76209ec45d5c1387'} = "";
$translation{'fr-cca280efd23ed9ba76209ec45d5c1387'} = "";
$translation{'it-cca280efd23ed9ba76209ec45d5c1387'} = "";
# ./digt.pl
$translation{'Indhold'} = "1bebc1ca10adbd9863a9367410f2d918";
$translation{'da-1bebc1ca10adbd9863a9367410f2d918'} = 'Indhold';
$translation{'en-1bebc1ca10adbd9863a9367410f2d918'} = "Content";
$translation{'de-1bebc1ca10adbd9863a9367410f2d918'} = "";
$translation{'fr-1bebc1ca10adbd9863a9367410f2d918'} = "";
$translation{'it-1bebc1ca10adbd9863a9367410f2d918'} = "";
# ./kabout.pl
$translation{'Interne sider'} = "0951afebb144bc765182b4ad23cd0a2c";
$translation{'da-0951afebb144bc765182b4ad23cd0a2c'} = 'Interne sider';
$translation{'en-0951afebb144bc765182b4ad23cd0a2c'} = "Internal pages";
$translation{'de-0951afebb144bc765182b4ad23cd0a2c'} = "";
$translation{'fr-0951afebb144bc765182b4ad23cd0a2c'} = "";
$translation{'it-0951afebb144bc765182b4ad23cd0a2c'} = "";
# ./vaerktoc.pl
$translation{'Kalliope indeholder endnu ingen tekster fra dette værk.'} = "d0af8985faa1aabeaa70b52f21bf384f";
$translation{'da-d0af8985faa1aabeaa70b52f21bf384f'} = 'Kalliope indeholder endnu ingen tekster fra dette værk.';
$translation{'en-d0af8985faa1aabeaa70b52f21bf384f'} = "Kalliope does not yet contain texts from this work";
$translation{'de-d0af8985faa1aabeaa70b52f21bf384f'} = "";
$translation{'fr-d0af8985faa1aabeaa70b52f21bf384f'} = "";
$translation{'it-d0af8985faa1aabeaa70b52f21bf384f'} = "";
# ./Kalliope/Quality.pm
$translation{'Kildeangivelse'} = "c32bdac6063f25a87292cc15ee595e5b";
$translation{'da-c32bdac6063f25a87292cc15ee595e5b'} = 'Kildeangivelse';
$translation{'en-c32bdac6063f25a87292cc15ee595e5b'} = "Source";
$translation{'de-c32bdac6063f25a87292cc15ee595e5b'} = "";
$translation{'fr-c32bdac6063f25a87292cc15ee595e5b'} = "";
$translation{'it-c32bdac6063f25a87292cc15ee595e5b'} = "";
# ./fpics.pl
$translation{'Klik for fuld størrelse'} = "2a45d0e2d101256ba2af628dd1884d83";
$translation{'da-2a45d0e2d101256ba2af628dd1884d83'} = 'Klik for fuld størrelse';
$translation{'en-2a45d0e2d101256ba2af628dd1884d83'} = "Click for full size";
$translation{'de-2a45d0e2d101256ba2af628dd1884d83'} = "";
$translation{'fr-2a45d0e2d101256ba2af628dd1884d83'} = "";
$translation{'it-2a45d0e2d101256ba2af628dd1884d83'} = "";
# ./flinks.pl
$translation{'Klik her for at følge linket'} = "6ed928931826dd741c235c768f5fc735";
$translation{'da-6ed928931826dd741c235c768f5fc735'} = 'Klik her for at følge linket';
$translation{'en-6ed928931826dd741c235c768f5fc735'} = "Click to follow the link";
$translation{'de-6ed928931826dd741c235c768f5fc735'} = "";
$translation{'fr-6ed928931826dd741c235c768f5fc735'} = "";
$translation{'it-6ed928931826dd741c235c768f5fc735'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Links'} = "bd908db5ccb07777ced8023dffc802f4";
$translation{'da-bd908db5ccb07777ced8023dffc802f4'} = 'Links';
$translation{'en-bd908db5ccb07777ced8023dffc802f4'} = "Links";
$translation{'de-bd908db5ccb07777ced8023dffc802f4'} = "";
$translation{'fr-bd908db5ccb07777ced8023dffc802f4'} = "";
$translation{'it-bd908db5ccb07777ced8023dffc802f4'} = "";
# ./metafront.cgi
$translation{'Litteraturhistoriske skitser og forklaringer af litterære begreber.'} = "4df9a384b30f0f9646c9d97a2626966e";
$translation{'da-4df9a384b30f0f9646c9d97a2626966e'} = 'Litteraturhistoriske skitser og forklaringer af litterære begreber.';
$translation{'en-4df9a384b30f0f9646c9d97a2626966e'} = "";
$translation{'de-4df9a384b30f0f9646c9d97a2626966e'} = "";
$translation{'fr-4df9a384b30f0f9646c9d97a2626966e'} = "";
$translation{'it-4df9a384b30f0f9646c9d97a2626966e'} = "";
# ./metafront.cgi
$translation{'Litterært interessante personer som ikke har skrevet lyrik.'} = "28d6c5128bf3242b0449d1fc6c977f27";
$translation{'da-28d6c5128bf3242b0449d1fc6c977f27'} = 'Litterært interessante personer som ikke har skrevet lyrik.';
$translation{'en-28d6c5128bf3242b0449d1fc6c977f27'} = "Interesting non-poets";
$translation{'de-28d6c5128bf3242b0449d1fc6c977f27'} = "";
$translation{'fr-28d6c5128bf3242b0449d1fc6c977f27'} = "";
$translation{'it-28d6c5128bf3242b0449d1fc6c977f27'} = "";
# ./index.cgi
$translation{'Læs gamle nyheder...'} = "2e7a3352be9b62fbe7e6c2cc7339d8ae";
$translation{'da-2e7a3352be9b62fbe7e6c2cc7339d8ae'} = 'Læs gamle nyheder...';
$translation{'en-2e7a3352be9b62fbe7e6c2cc7339d8ae'} = "Read older news...";
$translation{'de-2e7a3352be9b62fbe7e6c2cc7339d8ae'} = "";
$translation{'fr-2e7a3352be9b62fbe7e6c2cc7339d8ae'} = "";
$translation{'it-2e7a3352be9b62fbe7e6c2cc7339d8ae'} = "";
# ./kabout.pl
$translation{'Mange tak...'} = "35d286514d2cdf2ca5b61b67562704c4";
$translation{'da-35d286514d2cdf2ca5b61b67562704c4'} = 'Mange tak...';
$translation{'en-35d286514d2cdf2ca5b61b67562704c4'} = "Many thanks...";
$translation{'de-35d286514d2cdf2ca5b61b67562704c4'} = "";
$translation{'fr-35d286514d2cdf2ca5b61b67562704c4'} = "";
$translation{'it-35d286514d2cdf2ca5b61b67562704c4'} = "";
# ./Kalliope/Quality.pm
$translation{'Mangler '} = "2c001f548aed36910c775240c5e6fda2";
$translation{'da-2c001f548aed36910c775240c5e6fda2'} = 'Mangler ';
$translation{'en-2c001f548aed36910c775240c5e6fda2'} = "Missing ";
$translation{'de-2c001f548aed36910c775240c5e6fda2'} = "";
$translation{'fr-2c001f548aed36910c775240c5e6fda2'} = "";
$translation{'it-2c001f548aed36910c775240c5e6fda2'} = "";
# ./flinks.pl
$translation{'Mere om %s på nettet'} = "691647c270abcab20460e865730c696f";
$translation{'da-691647c270abcab20460e865730c696f'} = 'Mere om %s på nettet';
$translation{'en-691647c270abcab20460e865730c696f'} = 'More on %s online';
$translation{'de-691647c270abcab20460e865730c696f'} = "";
$translation{'fr-691647c270abcab20460e865730c696f'} = "";
$translation{'it-691647c270abcab20460e865730c696f'} = "";
# ./klines.pl
$translation{'Mest populære'} = "8f11be27d70f9bfe3678d4a328f3111b";
$translation{'da-8f11be27d70f9bfe3678d4a328f3111b'} = 'Mest populære';
$translation{'en-8f11be27d70f9bfe3678d4a328f3111b'} = "Most popular";
$translation{'de-8f11be27d70f9bfe3678d4a328f3111b'} = "";
$translation{'fr-8f11be27d70f9bfe3678d4a328f3111b'} = "";
$translation{'it-8f11be27d70f9bfe3678d4a328f3111b'} = "";
# ./fpop.pl,./poemsfront.cgi
$translation{'Mest populære digte'} = "486adfd4c9234d90f4e6663fe5e3b0b6";
$translation{'da-486adfd4c9234d90f4e6663fe5e3b0b6'} = 'Mest populære digte';
$translation{'en-486adfd4c9234d90f4e6663fe5e3b0b6'} = "Most popular poems";
$translation{'de-486adfd4c9234d90f4e6663fe5e3b0b6'} = "";
$translation{'fr-486adfd4c9234d90f4e6663fe5e3b0b6'} = "";
$translation{'it-486adfd4c9234d90f4e6663fe5e3b0b6'} = "";
# ./poets.cgi,./poetsfront.cgi,./Kalliope/Page.pm
$translation{'Mest populære digtere'} = "d947697fdc78629bb5b7772994a4d2be";
$translation{'da-d947697fdc78629bb5b7772994a4d2be'} = 'Mest populære digtere';
$translation{'en-d947697fdc78629bb5b7772994a4d2be'} = "Most popular poets";
$translation{'de-d947697fdc78629bb5b7772994a4d2be'} = "";
$translation{'fr-d947697fdc78629bb5b7772994a4d2be'} = "";
$translation{'it-d947697fdc78629bb5b7772994a4d2be'} = "";
# ./kvaerker.pl,./worksfront.cgi,./Kalliope/Page.pm
$translation{'Mest populære værker'} = "b38c7820ce8a765ec1ba83b3755e1a8d";
$translation{'da-b38c7820ce8a765ec1ba83b3755e1a8d'} = 'Mest populære værker';
$translation{'en-b38c7820ce8a765ec1ba83b3755e1a8d'} = "Most popular works";
$translation{'de-b38c7820ce8a765ec1ba83b3755e1a8d'} = "";
$translation{'fr-b38c7820ce8a765ec1ba83b3755e1a8d'} = "";
$translation{'it-b38c7820ce8a765ec1ba83b3755e1a8d'} = "";
# ./Kalliope/Page.pm
$translation{'Musen'} = "cf9e909e73d8349a16f9b637024a2f91";
$translation{'da-cf9e909e73d8349a16f9b637024a2f91'} = 'Musen';
$translation{'en-cf9e909e73d8349a16f9b637024a2f91'} = 'The muse';
$translation{'de-cf9e909e73d8349a16f9b637024a2f91'} = "";
$translation{'fr-cf9e909e73d8349a16f9b637024a2f91'} = "";
$translation{'it-cf9e909e73d8349a16f9b637024a2f91'} = "";
# ./kabout.pl
$translation{'Musen Kalliope'} = "5baa1b15aab14f114e330f80b1defb7a";
$translation{'da-5baa1b15aab14f114e330f80b1defb7a'} = 'Musen Kalliope';
$translation{'en-5baa1b15aab14f114e330f80b1defb7a'} = 'Calliope the muse';
$translation{'de-5baa1b15aab14f114e330f80b1defb7a'} = "";
$translation{'fr-5baa1b15aab14f114e330f80b1defb7a'} = "";
$translation{'it-5baa1b15aab14f114e330f80b1defb7a'} = "";
# ./poets.cgi,./poets.cgi
$translation{'Navn'} = "3ffcaf33f0c7f7a222bdff749d3d48a4";
$translation{'da-3ffcaf33f0c7f7a222bdff749d3d48a4'} = 'Navn';
$translation{'en-3ffcaf33f0c7f7a222bdff749d3d48a4'} = "Name";
$translation{'de-3ffcaf33f0c7f7a222bdff749d3d48a4'} = "";
$translation{'fr-3ffcaf33f0c7f7a222bdff749d3d48a4'} = "";
$translation{'it-3ffcaf33f0c7f7a222bdff749d3d48a4'} = "";
# ./digt.pl
$translation{'Noter'} = "523cbbc69f54eaa1d7c50f06b6123c27";
$translation{'da-523cbbc69f54eaa1d7c50f06b6123c27'} = 'Noter';
$translation{'en-523cbbc69f54eaa1d7c50f06b6123c27'} = "Notes";
$translation{'de-523cbbc69f54eaa1d7c50f06b6123c27'} = "";
$translation{'fr-523cbbc69f54eaa1d7c50f06b6123c27'} = "";
$translation{'it-523cbbc69f54eaa1d7c50f06b6123c27'} = "";
# ./Kalliope/Page.pm
$translation{'Nyheder'} = "ef09864269d996d836dc8e3ff4a78107";
$translation{'da-ef09864269d996d836dc8e3ff4a78107'} = 'Nyheder';
$translation{'en-ef09864269d996d836dc8e3ff4a78107'} = "News";
$translation{'de-ef09864269d996d836dc8e3ff4a78107'} = "";
$translation{'fr-ef09864269d996d836dc8e3ff4a78107'} = "";
$translation{'it-ef09864269d996d836dc8e3ff4a78107'} = "";
# ./digt.pl
$translation{'Næste tekst...'} = "156c574a52bb9a7b03e97ceee30fc17e";
$translation{'da-156c574a52bb9a7b03e97ceee30fc17e'} = 'Næste tekst...';
$translation{'en-156c574a52bb9a7b03e97ceee30fc17e'} = 'Next text...';
$translation{'de-156c574a52bb9a7b03e97ceee30fc17e'} = "";
$translation{'fr-156c574a52bb9a7b03e97ceee30fc17e'} = "";
$translation{'it-156c574a52bb9a7b03e97ceee30fc17e'} = "";
# ./digt.pl,./digt.pl,./metafront.cgi,./Kalliope/Page.pm
$translation{'Nøgleord'} = "eeedf991f35b476b4f453f01b18aac23";
$translation{'da-eeedf991f35b476b4f453f01b18aac23'} = 'Nøgleord';
$translation{'en-eeedf991f35b476b4f453f01b18aac23'} = "Keywords";
$translation{'de-eeedf991f35b476b4f453f01b18aac23'} = "";
$translation{'fr-eeedf991f35b476b4f453f01b18aac23'} = "";
$translation{'it-eeedf991f35b476b4f453f01b18aac23'} = "";
# ./kabout.pl
$translation{'Ofte stillede spørgsmål'} = "d69c1e1a20c8b42b0c133fef4954554e";
$translation{'da-d69c1e1a20c8b42b0c133fef4954554e'} = 'Ofte stillede spørgsmål';
$translation{'en-d69c1e1a20c8b42b0c133fef4954554e'} = "Frequently asked questions";
$translation{'de-d69c1e1a20c8b42b0c133fef4954554e'} = "";
$translation{'fr-d69c1e1a20c8b42b0c133fef4954554e'} = "";
$translation{'it-d69c1e1a20c8b42b0c133fef4954554e'} = "";
# ./Kalliope/Page.pm
$translation{'Om'} = "4299ca79cca4859502d9f5ad0ea90cd2";
$translation{'da-4299ca79cca4859502d9f5ad0ea90cd2'} = 'Om';
$translation{'en-4299ca79cca4859502d9f5ad0ea90cd2'} = "About";
$translation{'de-4299ca79cca4859502d9f5ad0ea90cd2'} = "";
$translation{'fr-4299ca79cca4859502d9f5ad0ea90cd2'} = "";
$translation{'it-4299ca79cca4859502d9f5ad0ea90cd2'} = "";
# ./kabout.pl,./metafront.cgi
$translation{'Om Kalliope'} = "a626254ee86e020a5160548e993df64b";
$translation{'da-a626254ee86e020a5160548e993df64b'} = 'Om Kalliope';
$translation{'en-a626254ee86e020a5160548e993df64b'} = "About Kalliope";
$translation{'de-a626254ee86e020a5160548e993df64b'} = "";
$translation{'fr-a626254ee86e020a5160548e993df64b'} = "";
$translation{'it-a626254ee86e020a5160548e993df64b'} = "";
# ./Kalliope/Page.pm
$translation{'Om Kalliope og andet baggrundsmateriale'} = "d39716dd7e8c9f0fdd58e4608dc0e253";
$translation{'da-d39716dd7e8c9f0fdd58e4608dc0e253'} = 'Om Kalliope og andet baggrundsmateriale';
$translation{'en-d39716dd7e8c9f0fdd58e4608dc0e253'} = "About Kalliope and other background material";
$translation{'de-d39716dd7e8c9f0fdd58e4608dc0e253'} = "";
$translation{'fr-d39716dd7e8c9f0fdd58e4608dc0e253'} = "";
$translation{'it-d39716dd7e8c9f0fdd58e4608dc0e253'} = "";
# ./metafront.cgi
$translation{'Om websitet Kalliope.'} = "496fded8c7f591b02a3938c8615b5d04";
$translation{'da-496fded8c7f591b02a3938c8615b5d04'} = 'Om websitet Kalliope.';
$translation{'en-496fded8c7f591b02a3938c8615b5d04'} = "About the website Kalliope";
$translation{'de-496fded8c7f591b02a3938c8615b5d04'} = "";
$translation{'fr-496fded8c7f591b02a3938c8615b5d04'} = "";
$translation{'it-496fded8c7f591b02a3938c8615b5d04'} = "";
# ./metafront.cgi,./Kalliope/Page.pm
$translation{'Ordbog'} = "23bb6e1e557ac7207a56903b3f3d1e71";
$translation{'da-23bb6e1e557ac7207a56903b3f3d1e71'} = 'Ordbog';
$translation{'en-23bb6e1e557ac7207a56903b3f3d1e71'} = "Dictionary";
$translation{'de-23bb6e1e557ac7207a56903b3f3d1e71'} = "";
$translation{'fr-23bb6e1e557ac7207a56903b3f3d1e71'} = "";
$translation{'it-23bb6e1e557ac7207a56903b3f3d1e71'} = "";
# ./klines.pl
$translation{'Ordnet efter digttitel'} = "790e7c31725b08bd887b25fd26e7f583";
$translation{'da-790e7c31725b08bd887b25fd26e7f583'} = 'Ordnet efter digttitel';
$translation{'en-790e7c31725b08bd887b25fd26e7f583'} = "Sorted by poemtitles";
$translation{'de-790e7c31725b08bd887b25fd26e7f583'} = "";
$translation{'fr-790e7c31725b08bd887b25fd26e7f583'} = "";
$translation{'it-790e7c31725b08bd887b25fd26e7f583'} = "";
# ./klines.pl
$translation{'Ordnet efter førstelinie'} = "ff869bc77e85bfb254c70ee636a3613c";
$translation{'da-ff869bc77e85bfb254c70ee636a3613c'} = 'Ordnet efter førstelinie';
$translation{'en-ff869bc77e85bfb254c70ee636a3613c'} = "Ordered by firstline";
$translation{'de-ff869bc77e85bfb254c70ee636a3613c'} = "";
$translation{'fr-ff869bc77e85bfb254c70ee636a3613c'} = "";
$translation{'it-ff869bc77e85bfb254c70ee636a3613c'} = "";
# ./Kalliope/Page.pm
$translation{'Oversigt'} = "47d7c9cf715b20d7d12cb3994adf6433";
$translation{'da-47d7c9cf715b20d7d12cb3994adf6433'} = 'Oversigt';
$translation{'en-47d7c9cf715b20d7d12cb3994adf6433'} = "Overview";
$translation{'de-47d7c9cf715b20d7d12cb3994adf6433'} = "";
$translation{'fr-47d7c9cf715b20d7d12cb3994adf6433'} = "";
$translation{'it-47d7c9cf715b20d7d12cb3994adf6433'} = "";
# ./poetsfront.cgi
$translation{'Oversigt over digtere ordnet alfabetisk efter navn.'} = "b2586e2d144fb78d1dab42d24a3e8d2e";
$translation{'da-b2586e2d144fb78d1dab42d24a3e8d2e'} = 'Oversigt over digtere ordnet alfabetisk efter navn.';
$translation{'en-b2586e2d144fb78d1dab42d24a3e8d2e'} = "Overview of the poets ordered by name";
$translation{'de-b2586e2d144fb78d1dab42d24a3e8d2e'} = "";
$translation{'fr-b2586e2d144fb78d1dab42d24a3e8d2e'} = "";
$translation{'it-b2586e2d144fb78d1dab42d24a3e8d2e'} = "";
# ./samtidige.cgi
$translation{'Oversigt over digtere som udgav værker i %ss levetid.'} = "bcf9b35f1da7e5d1968c93fd58739f17";
$translation{'da-bcf9b35f1da7e5d1968c93fd58739f17'} = 'Oversigt over digtere som udgav værker i %ss levetid.';
$translation{'en-bcf9b35f1da7e5d1968c93fd58739f17'} = 'Overview the contemporay poets that published in the lifetime of %s';
$translation{'de-bcf9b35f1da7e5d1968c93fd58739f17'} = "";
$translation{'fr-bcf9b35f1da7e5d1968c93fd58739f17'} = "";
$translation{'it-bcf9b35f1da7e5d1968c93fd58739f17'} = "";
# ./ffront.cgi
$translation{'Oversigt over tekster som henviser til %ss tekster'} = "b2bfd52030a78bfb53618c888edd1a49";
$translation{'da-b2bfd52030a78bfb53618c888edd1a49'} = 'Oversigt over tekster som henviser til %ss tekster';
$translation{'en-b2bfd52030a78bfb53618c888edd1a49'} = "Overview of texts that references the texts of %s";
$translation{'de-b2bfd52030a78bfb53618c888edd1a49'} = "";
$translation{'fr-b2bfd52030a78bfb53618c888edd1a49'} = "";
$translation{'it-b2bfd52030a78bfb53618c888edd1a49'} = "";
# ./henvisninger.cgi
$translation{'Oversigt over tekster, som henviser til %ss tekster.'} = "c3d492427d33347a909f3c7494061be6";
$translation{'da-c3d492427d33347a909f3c7494061be6'} = 'Oversigt over tekster, som henviser til %ss tekster.';
$translation{'en-c3d492427d33347a909f3c7494061be6'} = "Overview over texts that references the texts of %s";
$translation{'de-c3d492427d33347a909f3c7494061be6'} = "";
$translation{'fr-c3d492427d33347a909f3c7494061be6'} = "";
$translation{'it-c3d492427d33347a909f3c7494061be6'} = "";
# ./metafront.cgi,./Kalliope/Person.pm
$translation{'Personer'} = "57e876a07af4ab8a4ebcf862d4dd5a27";
$translation{'da-57e876a07af4ab8a4ebcf862d4dd5a27'} = 'Personer';
$translation{'en-57e876a07af4ab8a4ebcf862d4dd5a27'} = "Persons";
$translation{'de-57e876a07af4ab8a4ebcf862d4dd5a27'} = "";
$translation{'fr-57e876a07af4ab8a4ebcf862d4dd5a27'} = "";
$translation{'it-57e876a07af4ab8a4ebcf862d4dd5a27'} = "";
# ./Kalliope/Page.pm
$translation{'Personer efter navn'} = "54fe9c5dbd5fec95042f798d2bfa06c0";
$translation{'da-54fe9c5dbd5fec95042f798d2bfa06c0'} = 'Personer efter navn';
$translation{'en-54fe9c5dbd5fec95042f798d2bfa06c0'} = "Persons by name";
$translation{'de-54fe9c5dbd5fec95042f798d2bfa06c0'} = "";
$translation{'fr-54fe9c5dbd5fec95042f798d2bfa06c0'} = "";
$translation{'it-54fe9c5dbd5fec95042f798d2bfa06c0'} = "";
# ./Kalliope/Page.pm
$translation{'Personer efter udseende'} = "7e678df38bcbb51fef5ca2e8ba22ee48";
$translation{'da-7e678df38bcbb51fef5ca2e8ba22ee48'} = 'Personer efter udseende';
$translation{'en-7e678df38bcbb51fef5ca2e8ba22ee48'} = "Persons by their look";
$translation{'de-7e678df38bcbb51fef5ca2e8ba22ee48'} = "";
$translation{'fr-7e678df38bcbb51fef5ca2e8ba22ee48'} = "";
$translation{'it-7e678df38bcbb51fef5ca2e8ba22ee48'} = "";
# ./Kalliope/Page.pm
$translation{'Personer efter år'} = "ad8185b723edf1d4a6600df80c18c717";
$translation{'da-ad8185b723edf1d4a6600df80c18c717'} = 'Personer efter år';
$translation{'en-ad8185b723edf1d4a6600df80c18c717'} = "Persons by year";
$translation{'de-ad8185b723edf1d4a6600df80c18c717'} = "";
$translation{'fr-ad8185b723edf1d4a6600df80c18c717'} = "";
$translation{'it-ad8185b723edf1d4a6600df80c18c717'} = "";
# ./Kalliope/Page.pm,./Kalliope/Person.pm
$translation{'Populære'} = "25977e5b77fe71ca35e8647c1532d02b";
$translation{'da-25977e5b77fe71ca35e8647c1532d02b'} = 'Populære';
$translation{'en-25977e5b77fe71ca35e8647c1532d02b'} = "Popular";
$translation{'de-25977e5b77fe71ca35e8647c1532d02b'} = "";
$translation{'fr-25977e5b77fe71ca35e8647c1532d02b'} = "";
$translation{'it-25977e5b77fe71ca35e8647c1532d02b'} = "";
# ./ffront.cgi
$translation{'Populære digte'} = "e79698500590d188a3a949b649ac957f";
$translation{'da-e79698500590d188a3a949b649ac957f'} = 'Populære digte';
$translation{'en-e79698500590d188a3a949b649ac957f'} = "Popular poems";
$translation{'de-e79698500590d188a3a949b649ac957f'} = "";
$translation{'fr-e79698500590d188a3a949b649ac957f'} = "";
$translation{'it-e79698500590d188a3a949b649ac957f'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Portrætgalleri for %s'} = "fc4b05ca8521e3767844866f2c85e7f1";
$translation{'da-fc4b05ca8521e3767844866f2c85e7f1'} = 'Portrætgalleri for %s';
$translation{'en-fc4b05ca8521e3767844866f2c85e7f1'} = "Portraits of %s";
$translation{'de-fc4b05ca8521e3767844866f2c85e7f1'} = "";
$translation{'fr-fc4b05ca8521e3767844866f2c85e7f1'} = "";
$translation{'it-fc4b05ca8521e3767844866f2c85e7f1'} = "";
# ./ffront.cgi,./fpics.pl,./fpics.pl,./Kalliope/Person.pm
$translation{'Portrætter'} = "86104b953e80ba57555c76e47c3c4c90";
$translation{'da-86104b953e80ba57555c76e47c3c4c90'} = 'Portrætter';
$translation{'en-86104b953e80ba57555c76e47c3c4c90'} = "Portraits";
$translation{'de-86104b953e80ba57555c76e47c3c4c90'} = "";
$translation{'fr-86104b953e80ba57555c76e47c3c4c90'} = "";
$translation{'it-86104b953e80ba57555c76e47c3c4c90'} = "";
# ./fsekundaer.pl
$translation{'Primærlitteratur'} = "3e131d96d4630d0eaa1a998648bf40bf";
$translation{'da-3e131d96d4630d0eaa1a998648bf40bf'} = 'Primærlitteratur';
$translation{'en-3e131d96d4630d0eaa1a998648bf40bf'} = "Primary sources";
$translation{'de-3e131d96d4630d0eaa1a998648bf40bf'} = "";
$translation{'fr-3e131d96d4630d0eaa1a998648bf40bf'} = "";
$translation{'it-3e131d96d4630d0eaa1a998648bf40bf'} = "";
# ./digt.pl
$translation{'Printer venligt'} = "998f888e1f004b8bae5cf998dd8cc035";
$translation{'da-998f888e1f004b8bae5cf998dd8cc035'} = 'Printer venligt';
$translation{'en-998f888e1f004b8bae5cf998dd8cc035'} = "Printerfriendly";
$translation{'de-998f888e1f004b8bae5cf998dd8cc035'} = "";
$translation{'fr-998f888e1f004b8bae5cf998dd8cc035'} = "";
$translation{'it-998f888e1f004b8bae5cf998dd8cc035'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Prosa'} = "fdfd75397c8eb23b82cf54c504590988";
$translation{'da-fdfd75397c8eb23b82cf54c504590988'} = 'Prosa';
$translation{'en-fdfd75397c8eb23b82cf54c504590988'} = "Prose";
$translation{'de-fdfd75397c8eb23b82cf54c504590988'} = "";
$translation{'fr-fdfd75397c8eb23b82cf54c504590988'} = "";
$translation{'it-fdfd75397c8eb23b82cf54c504590988'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Samtid'} = "1d19e5d1db3b679da9ff0e5ac79b5b2d";
$translation{'da-1d19e5d1db3b679da9ff0e5ac79b5b2d'} = 'Samtid';
$translation{'en-1d19e5d1db3b679da9ff0e5ac79b5b2d'} = 'Contemporaries';
$translation{'de-1d19e5d1db3b679da9ff0e5ac79b5b2d'} = "";
$translation{'fr-1d19e5d1db3b679da9ff0e5ac79b5b2d'} = "";
$translation{'it-1d19e5d1db3b679da9ff0e5ac79b5b2d'} = "";
# ./samtidige.cgi,./samtidige.cgi
$translation{'Samtidige digtere'} = "a3c033e35e4842accf09fe898274bf6d";
$translation{'da-a3c033e35e4842accf09fe898274bf6d'} = 'Samtidige digtere';
$translation{'en-a3c033e35e4842accf09fe898274bf6d'} = 'Contemporary poets';
$translation{'de-a3c033e35e4842accf09fe898274bf6d'} = "";
$translation{'fr-a3c033e35e4842accf09fe898274bf6d'} = "";
$translation{'it-a3c033e35e4842accf09fe898274bf6d'} = "";
# ./kvaerker.pl
$translation{'Se hele listen...'} = "fd0666d3e36dd803438a757aca0875e3";
$translation{'da-fd0666d3e36dd803438a757aca0875e3'} = 'Se hele listen...';
$translation{'en-fd0666d3e36dd803438a757aca0875e3'} = 'See all...';
$translation{'de-fd0666d3e36dd803438a757aca0875e3'} = "";
$translation{'fr-fd0666d3e36dd803438a757aca0875e3'} = "";
$translation{'it-fd0666d3e36dd803438a757aca0875e3'} = "";
# ./fsekundaer.pl
$translation{'Sekundærlitteratur'} = "1c9612052beda375a4a86e63d8dd0920";
$translation{'da-1c9612052beda375a4a86e63d8dd0920'} = 'Sekundærlitteratur';
$translation{'en-1c9612052beda375a4a86e63d8dd0920'} = 'Bibliography';
$translation{'de-1c9612052beda375a4a86e63d8dd0920'} = "";
$translation{'fr-1c9612052beda375a4a86e63d8dd0920'} = "";
$translation{'it-1c9612052beda375a4a86e63d8dd0920'} = "";
# ./digt.pl
$translation{'Send en rettelse...'} = "454795048468ce13703ffc383654d628";
$translation{'da-454795048468ce13703ffc383654d628'} = 'Send en rettelse...';
$translation{'en-454795048468ce13703ffc383654d628'} = 'Send a correction...';
$translation{'de-454795048468ce13703ffc383654d628'} = "";
$translation{'fr-454795048468ce13703ffc383654d628'} = "";
$translation{'it-454795048468ce13703ffc383654d628'} = "";
# ./digt.pl
$translation{'Send redaktionen en rettelse til denne tekst'} = "7dd93c1ff41b2ce840f67b3a3dfb26bf";
$translation{'da-7dd93c1ff41b2ce840f67b3a3dfb26bf'} = 'Send redaktionen en rettelse til denne tekst';
$translation{'en-7dd93c1ff41b2ce840f67b3a3dfb26bf'} = "Send the editors a correction for this text";
$translation{'de-7dd93c1ff41b2ce840f67b3a3dfb26bf'} = "";
$translation{'fr-7dd93c1ff41b2ce840f67b3a3dfb26bf'} = "";
$translation{'it-7dd93c1ff41b2ce840f67b3a3dfb26bf'} = "";
# ./fpop.pl,./klines.pl,./kvaerker.pl,./poets.cgi
$translation{'Senest'} = "4192ba5e4edbf93411dcd777f889d078";
$translation{'da-4192ba5e4edbf93411dcd777f889d078'} = 'Senest';
$translation{'en-4192ba5e4edbf93411dcd777f889d078'} = 'Latest';
$translation{'de-4192ba5e4edbf93411dcd777f889d078'} = "";
$translation{'fr-4192ba5e4edbf93411dcd777f889d078'} = "";
$translation{'it-4192ba5e4edbf93411dcd777f889d078'} = "";
# ./poemsfront.cgi
$translation{'Seneste tilføjelser'} = "26beba78e8a48c7ceb464e78076362f4";
$translation{'da-26beba78e8a48c7ceb464e78076362f4'} = 'Seneste tilføjelser';
$translation{'en-26beba78e8a48c7ceb464e78076362f4'} = 'Latest additions';
$translation{'de-26beba78e8a48c7ceb464e78076362f4'} = "";
$translation{'fr-26beba78e8a48c7ceb464e78076362f4'} = "";
$translation{'it-26beba78e8a48c7ceb464e78076362f4'} = "";
# ./Kalliope/Quality.pm
$translation{'Sidehenvisninger'} = "228c8240544cebab96dd0a00f91c2087";
$translation{'da-228c8240544cebab96dd0a00f91c2087'} = 'Sidehenvisninger';
$translation{'en-228c8240544cebab96dd0a00f91c2087'} = "Pagereferences";
$translation{'de-228c8240544cebab96dd0a00f91c2087'} = "";
$translation{'fr-228c8240544cebab96dd0a00f91c2087'} = "";
$translation{'it-228c8240544cebab96dd0a00f91c2087'} = "";
# ./vaerktoc.pl
$translation{'Sidst ændret:'} = "a22f34722bd0821c43c6263a25729c3f";
$translation{'da-a22f34722bd0821c43c6263a25729c3f'} = 'Sidst ændret:';
$translation{'en-a22f34722bd0821c43c6263a25729c3f'} = 'Last modified:';
$translation{'de-a22f34722bd0821c43c6263a25729c3f'} = "";
$translation{'fr-a22f34722bd0821c43c6263a25729c3f'} = "";
$translation{'it-a22f34722bd0821c43c6263a25729c3f'} = "";
# ./Kalliope/Page.pm
$translation{'Skift til den %s samling'} = "d77de40ce4c768c41660d45cbdf0cb32";
$translation{'da-d77de40ce4c768c41660d45cbdf0cb32'} = 'Skift til den %s samling';
$translation{'en-d77de40ce4c768c41660d45cbdf0cb32'} = 'Switch to the %s collection';
$translation{'de-d77de40ce4c768c41660d45cbdf0cb32'} = "";
$translation{'fr-d77de40ce4c768c41660d45cbdf0cb32'} = "";
$translation{'it-d77de40ce4c768c41660d45cbdf0cb32'} = "";
# ./index.cgi
$translation{'Sonetten på pletten'} = "250f358546f8c7dae496c9a280145049";
$translation{'da-250f358546f8c7dae496c9a280145049'} = 'Sonetten på pletten';
$translation{'en-250f358546f8c7dae496c9a280145049'} = 'Sonnet';
$translation{'de-250f358546f8c7dae496c9a280145049'} = "";
$translation{'fr-250f358546f8c7dae496c9a280145049'} = "";
$translation{'it-250f358546f8c7dae496c9a280145049'} = "";
# ./Kalliope/Page.pm
$translation{'Statistik'} = "9ba4b5882443870a87c03aa9035ba6f2";
$translation{'da-9ba4b5882443870a87c03aa9035ba6f2'} = 'Statistik';
$translation{'en-9ba4b5882443870a87c03aa9035ba6f2'} = "Stats";
$translation{'de-9ba4b5882443870a87c03aa9035ba6f2'} = "";
$translation{'fr-9ba4b5882443870a87c03aa9035ba6f2'} = "";
$translation{'it-9ba4b5882443870a87c03aa9035ba6f2'} = "";
# ./Kalliope/Page.pm
$translation{'Søg i Kalliope'} = "4665871d901b94be9636e422e12b79c3";
$translation{'da-4665871d901b94be9636e422e12b79c3'} = 'Søg i Kalliope';
$translation{'en-4665871d901b94be9636e422e12b79c3'} = "Search Kalliope";
$translation{'de-4665871d901b94be9636e422e12b79c3'} = "";
$translation{'fr-4665871d901b94be9636e422e12b79c3'} = "";
$translation{'it-4665871d901b94be9636e422e12b79c3'} = "";
# ./ffront.cgi
$translation{'Søg i %ss tekster'} = "9f390dbab05339ad08f92e2e59b7e98f";
$translation{'da-9f390dbab05339ad08f92e2e59b7e98f'} = 'Søg i %ss tekster';
$translation{'en-9f390dbab05339ad08f92e2e59b7e98f'} = 'Search the texts of %s';
$translation{'de-9f390dbab05339ad08f92e2e59b7e98f'} = "";
$translation{'fr-9f390dbab05339ad08f92e2e59b7e98f'} = "";
$translation{'it-9f390dbab05339ad08f92e2e59b7e98f'} = "";
# ./Kalliope/Person.pm
$translation{'Søg i %ss værker'} = "c39f2fc4bf192d95362e0faea29498df";
$translation{'da-c39f2fc4bf192d95362e0faea29498df'} = 'Søg i %ss værker';
$translation{'en-c39f2fc4bf192d95362e0faea29498df'} = "Search the works of %s";
$translation{'de-c39f2fc4bf192d95362e0faea29498df'} = "";
$translation{'fr-c39f2fc4bf192d95362e0faea29498df'} = "";
$translation{'it-c39f2fc4bf192d95362e0faea29498df'} = "";
# ./ffront.cgi,./fsearch.cgi,./Kalliope/Person.pm
$translation{'Søgning'} = "71848520ad378c70d245fa68815b0eb5";
$translation{'da-71848520ad378c70d245fa68815b0eb5'} = 'Søgning';
$translation{'en-71848520ad378c70d245fa68815b0eb5'} = 'Search';
$translation{'de-71848520ad378c70d245fa68815b0eb5'} = "";
$translation{'fr-71848520ad378c70d245fa68815b0eb5'} = "";
$translation{'it-71848520ad378c70d245fa68815b0eb5'} = "";
# ./Kalliope/Search.pm
$translation{'Søgning i digttitler'} = "7a591c99ceca8cac7606d2b89555b779";
$translation{'da-7a591c99ceca8cac7606d2b89555b779'} = 'Søgning i digttitler';
$translation{'en-7a591c99ceca8cac7606d2b89555b779'} = "Search poemtitles";
$translation{'de-7a591c99ceca8cac7606d2b89555b779'} = "";
$translation{'fr-7a591c99ceca8cac7606d2b89555b779'} = "";
$translation{'it-7a591c99ceca8cac7606d2b89555b779'} = "";
# ./Kalliope/Search.pm
$translation{'Søgning i navne'} = "09c98f355679f65a205d7842adda1edb";
$translation{'da-09c98f355679f65a205d7842adda1edb'} = 'Søgning i navne';
$translation{'en-09c98f355679f65a205d7842adda1edb'} = "Search names";
$translation{'de-09c98f355679f65a205d7842adda1edb'} = "";
$translation{'fr-09c98f355679f65a205d7842adda1edb'} = "";
$translation{'it-09c98f355679f65a205d7842adda1edb'} = "";
# ./Kalliope/Search.pm
$translation{'Søgning i værktitler'} = "9c37e8d5fa412ac31188a0727c017539";
$translation{'da-9c37e8d5fa412ac31188a0727c017539'} = 'Søgning i værktitler';
$translation{'en-9c37e8d5fa412ac31188a0727c017539'} = "Search worktitles";
$translation{'de-9c37e8d5fa412ac31188a0727c017539'} = "";
$translation{'fr-9c37e8d5fa412ac31188a0727c017539'} = "";
$translation{'it-9c37e8d5fa412ac31188a0727c017539'} = "";
# ./Kalliope/Page.pm
$translation{'Tak'} = "f6c5dc9e87737f27cbffe323def199af";
$translation{'da-f6c5dc9e87737f27cbffe323def199af'} = 'Tak';
$translation{'en-f6c5dc9e87737f27cbffe323def199af'} = "Thanks";
$translation{'de-f6c5dc9e87737f27cbffe323def199af'} = "";
$translation{'fr-f6c5dc9e87737f27cbffe323def199af'} = "";
$translation{'it-f6c5dc9e87737f27cbffe323def199af'} = "";
# ./Kalliope/Page.pm
$translation{'Tidslinie'} = "cfb038e7e526d53f2e70fbbbddb1296d";
$translation{'da-cfb038e7e526d53f2e70fbbbddb1296d'} = 'Tidslinie';
$translation{'en-cfb038e7e526d53f2e70fbbbddb1296d'} = "Timeline";
$translation{'de-cfb038e7e526d53f2e70fbbbddb1296d'} = "";
$translation{'fr-cfb038e7e526d53f2e70fbbbddb1296d'} = "";
$translation{'it-cfb038e7e526d53f2e70fbbbddb1296d'} = "";
# ./Kalliope/Page.pm
$translation{'Tilbage til hovedmenuen for %s'} = "086d15c57d28ca8e60794c8c3082f2a2";
$translation{'da-086d15c57d28ca8e60794c8c3082f2a2'} = 'Tilbage til hovedmenuen for %s';
$translation{'en-086d15c57d28ca8e60794c8c3082f2a2'} = 'Back to the mainmenu for %s';
$translation{'de-086d15c57d28ca8e60794c8c3082f2a2'} = "";
$translation{'fr-086d15c57d28ca8e60794c8c3082f2a2'} = "";
$translation{'it-086d15c57d28ca8e60794c8c3082f2a2'} = "";
# ./digt.pl
$translation{'Tilføj'} = "0053a122e6bf32f70122ee27c72af448";
$translation{'da-0053a122e6bf32f70122ee27c72af448'} = 'Tilføj';
$translation{'en-0053a122e6bf32f70122ee27c72af448'} = "Add";
$translation{'de-0053a122e6bf32f70122ee27c72af448'} = "";
$translation{'fr-0053a122e6bf32f70122ee27c72af448'} = "";
$translation{'it-0053a122e6bf32f70122ee27c72af448'} = "";
# ./digt.pl
$translation{'Tilføj nøgleord'} = "41492cb1037be414f2dcfef2ebe9bc52";
$translation{'da-41492cb1037be414f2dcfef2ebe9bc52'} = 'Tilføj nøgleord';
$translation{'en-41492cb1037be414f2dcfef2ebe9bc52'} = "Add keywork";
$translation{'de-41492cb1037be414f2dcfef2ebe9bc52'} = "";
$translation{'fr-41492cb1037be414f2dcfef2ebe9bc52'} = "";
$translation{'it-41492cb1037be414f2dcfef2ebe9bc52'} = "";
# ./digt.pl
$translation{'Tilføj/fjern linjenumre'} = "678abe193c64cf9da8151c70e75aca0d";
$translation{'da-678abe193c64cf9da8151c70e75aca0d'} = 'Tilføj/fjern linjenumre';
$translation{'en-678abe193c64cf9da8151c70e75aca0d'} = "Toggle linenumbers";
$translation{'de-678abe193c64cf9da8151c70e75aca0d'} = "";
$translation{'fr-678abe193c64cf9da8151c70e75aca0d'} = "";
$translation{'it-678abe193c64cf9da8151c70e75aca0d'} = "";
# ./Kalliope/Page.pm
$translation{'Tilføjelser'} = "29dfea721f2ace0e9f2d69ef43086583";
$translation{'da-29dfea721f2ace0e9f2d69ef43086583'} = 'Tilføjelser';
$translation{'en-29dfea721f2ace0e9f2d69ef43086583'} = "Additions";
$translation{'de-29dfea721f2ace0e9f2d69ef43086583'} = "";
$translation{'fr-29dfea721f2ace0e9f2d69ef43086583'} = "";
$translation{'it-29dfea721f2ace0e9f2d69ef43086583'} = "";
# ./fpop.pl,./klines.pl,./kvaerker.pl
$translation{'Titel'} = "18a8022569d6ced829f833aa855530ce";
$translation{'da-18a8022569d6ced829f833aa855530ce'} = 'Titel';
$translation{'en-18a8022569d6ced829f833aa855530ce'} = "Title";
$translation{'de-18a8022569d6ced829f833aa855530ce'} = "";
$translation{'fr-18a8022569d6ced829f833aa855530ce'} = "";
$translation{'it-18a8022569d6ced829f833aa855530ce'} = "";
# ./biografi.cgi
$translation{'Titelblad til %s <i>%s</i> som udkommer %s.'} = "20311b52fa2a26baa1ad2e4dfd9c7e10";
$translation{'da-20311b52fa2a26baa1ad2e4dfd9c7e10'} = 'Titelblad til %s <i>%s</i> som udkommer %s.';
$translation{'en-20311b52fa2a26baa1ad2e4dfd9c7e10'} = "Titlepage for %s <i>%a</i> published %s";
$translation{'de-20311b52fa2a26baa1ad2e4dfd9c7e10'} = "";
$translation{'fr-20311b52fa2a26baa1ad2e4dfd9c7e10'} = "";
$translation{'it-20311b52fa2a26baa1ad2e4dfd9c7e10'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Top-10 over mest læste %s digte i Kalliope'} = "5f341a0fc25fa9fff5ac1ac60e16dca5";
$translation{'da-5f341a0fc25fa9fff5ac1ac60e16dca5'} = 'Top-10 over mest læste %s digte i Kalliope';
$translation{'en-5f341a0fc25fa9fff5ac1ac60e16dca5'} = 'Top 10 most read %s poems in Kalliope';
$translation{'de-5f341a0fc25fa9fff5ac1ac60e16dca5'} = "";
$translation{'fr-5f341a0fc25fa9fff5ac1ac60e16dca5'} = "";
$translation{'it-5f341a0fc25fa9fff5ac1ac60e16dca5'} = "";
# ./kvaerker.pl,./poets.cgi
$translation{'Total'} = "96b0141273eabab320119c467cdcaf17";
$translation{'da-96b0141273eabab320119c467cdcaf17'} = 'Total';
$translation{'en-96b0141273eabab320119c467cdcaf17'} = "Total";
$translation{'de-96b0141273eabab320119c467cdcaf17'} = "";
$translation{'fr-96b0141273eabab320119c467cdcaf17'} = "";
$translation{'it-96b0141273eabab320119c467cdcaf17'} = "";
# ./Kalliope/Quality.pm
$translation{'Tredje korrekturlæsning'} = "f8ce85a2627340d7a9b5941c796033ca";
$translation{'da-f8ce85a2627340d7a9b5941c796033ca'} = 'Tredje korrekturlæsning';
$translation{'en-f8ce85a2627340d7a9b5941c796033ca'} = "Third proofreading";
$translation{'de-f8ce85a2627340d7a9b5941c796033ca'} = "";
$translation{'fr-f8ce85a2627340d7a9b5941c796033ca'} = "";
$translation{'it-f8ce85a2627340d7a9b5941c796033ca'} = "";
# ./Kalliope/Page/Print.pm
$translation{'Udskrift af <tt>%s</tt> foretaget %s. Denne tekst må frit redistribueres.'} = "5d6404e06126ff596a4e574a804727bc";
$translation{'da-5d6404e06126ff596a4e574a804727bc'} = 'Udskrift af <tt>\%s</tt> foretaget \%s. Denne tekst må frit redistribueres.';
$translation{'en-5d6404e06126ff596a4e574a804727bc'} = "Print of <tt>%s</tt> done %s. This text may be freely redistributed.";
$translation{'de-5d6404e06126ff596a4e574a804727bc'} = "";
$translation{'fr-5d6404e06126ff596a4e574a804727bc'} = "";
$translation{'it-5d6404e06126ff596a4e574a804727bc'} = "";
# ./biografi.cgi,./fsekundaer.pl,./fsekundaer.pl
$translation{'Udskriftsvenlig udgave'} = "ae465f582b686515421b930d579049c2";
$translation{'da-ae465f582b686515421b930d579049c2'} = 'Udskriftsvenlig udgave';
$translation{'en-ae465f582b686515421b930d579049c2'} = 'Printer friendly edition';
$translation{'de-ae465f582b686515421b930d579049c2'} = "";
$translation{'fr-ae465f582b686515421b930d579049c2'} = "";
$translation{'it-ae465f582b686515421b930d579049c2'} = "";
# ./poets.cgi
$translation{'Ukendt digter'} = "abc89bdf16b4abc12e7c193e409d2cae";
$translation{'da-abc89bdf16b4abc12e7c193e409d2cae'} = 'Ukendt digter';
$translation{'en-abc89bdf16b4abc12e7c193e409d2cae'} = 'Unknown poet';
$translation{'de-abc89bdf16b4abc12e7c193e409d2cae'} = "";
$translation{'fr-abc89bdf16b4abc12e7c193e409d2cae'} = "";
$translation{'it-abc89bdf16b4abc12e7c193e409d2cae'} = "";
# ./Kalliope/Person.pm
$translation{'Ukendt levetid'} = "543e1bb1120a79a25bfea67d454e680f";
$translation{'da-543e1bb1120a79a25bfea67d454e680f'} = 'Ukendt levetid';
$translation{'en-543e1bb1120a79a25bfea67d454e680f'} = 'Unknown lifetime';
$translation{'de-543e1bb1120a79a25bfea67d454e680f'} = "";
$translation{'fr-543e1bb1120a79a25bfea67d454e680f'} = "";
$translation{'it-543e1bb1120a79a25bfea67d454e680f'} = "";
# ./Kalliope/Person.pm
$translation{'Ukendt år'} = "b3f99ad2dea3d4d14ff47bc776ef79af";
$translation{'da-b3f99ad2dea3d4d14ff47bc776ef79af'} = 'Ukendt år';
$translation{'en-b3f99ad2dea3d4d14ff47bc776ef79af'} = 'Unknown year';
$translation{'de-b3f99ad2dea3d4d14ff47bc776ef79af'} = "";
$translation{'fr-b3f99ad2dea3d4d14ff47bc776ef79af'} = "";
$translation{'it-b3f99ad2dea3d4d14ff47bc776ef79af'} = "";
# ./index.cgi
$translation{'Velkommen'} = "bbee0ca5abd7691bdf6dd330a4e396cf";
$translation{'da-bbee0ca5abd7691bdf6dd330a4e396cf'} = 'Velkommen';
$translation{'en-bbee0ca5abd7691bdf6dd330a4e396cf'} = "Welcome";
$translation{'de-bbee0ca5abd7691bdf6dd330a4e396cf'} = "";
$translation{'fr-bbee0ca5abd7691bdf6dd330a4e396cf'} = "";
$translation{'it-bbee0ca5abd7691bdf6dd330a4e396cf'} = "";
# ./vaerktoc.pl
$translation{'Vis XML-udgave...'} = "4c4b52c68a22e73a85dd4058510db662";
$translation{'da-4c4b52c68a22e73a85dd4058510db662'} = 'Vis XML-udgave...';
$translation{'en-4c4b52c68a22e73a85dd4058510db662'} = 'Show XML-edition...';
$translation{'de-4c4b52c68a22e73a85dd4058510db662'} = "";
$translation{'fr-4c4b52c68a22e73a85dd4058510db662'} = "";
$translation{'it-4c4b52c68a22e73a85dd4058510db662'} = "";
# ./digt.pl
$translation{'Vis denne tekst i et format som pænere når udskrevet'} = "f9633a35bc85326652e826df77eafc81";
$translation{'da-f9633a35bc85326652e826df77eafc81'} = 'Vis denne tekst i et format som pænere når udskrevet';
$translation{'en-f9633a35bc85326652e826df77eafc81'} = "Show this text in a format ready to print";
$translation{'de-f9633a35bc85326652e826df77eafc81'} = "";
$translation{'fr-f9633a35bc85326652e826df77eafc81'} = "";
$translation{'it-f9633a35bc85326652e826df77eafc81'} = "";
# ./digt.pl
$translation{'Vis dette digt opsat på en side lige til at printe ud.'} = "ee6fe8f0efc4db5201edba054f8935d6";
$translation{'da-ee6fe8f0efc4db5201edba054f8935d6'} = 'Vis dette digt opsat på en side lige til at printe ud.';
$translation{'en-ee6fe8f0efc4db5201edba054f8935d6'} = "Show this poem in a format ready to print";
$translation{'de-ee6fe8f0efc4db5201edba054f8935d6'} = "";
$translation{'fr-ee6fe8f0efc4db5201edba054f8935d6'} = "";
$translation{'it-ee6fe8f0efc4db5201edba054f8935d6'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Vis førstelinier for samtlige digte'} = "638d70eca26b388500c1611b0032a69b";
$translation{'da-638d70eca26b388500c1611b0032a69b'} = 'Vis førstelinier for samtlige digte';
$translation{'en-638d70eca26b388500c1611b0032a69b'} = "All poems listed by firstline";
$translation{'de-638d70eca26b388500c1611b0032a69b'} = "";
$translation{'fr-638d70eca26b388500c1611b0032a69b'} = "";
$translation{'it-638d70eca26b388500c1611b0032a69b'} = "";
# ./digt.pl
$translation{'Vis linienumre...'} = "5d4c9dbd7ac9f234178b59b3c6c40aeb";
$translation{'da-5d4c9dbd7ac9f234178b59b3c6c40aeb'} = 'Vis linienumre...';
$translation{'en-5d4c9dbd7ac9f234178b59b3c6c40aeb'} = 'Toggle linenumbers...';
$translation{'de-5d4c9dbd7ac9f234178b59b3c6c40aeb'} = "";
$translation{'fr-5d4c9dbd7ac9f234178b59b3c6c40aeb'} = "";
$translation{'it-5d4c9dbd7ac9f234178b59b3c6c40aeb'} = "";
# ./poets.cgi
$translation{'Vis portrætter af %s'} = "48e990d23b8f391375be7d516974d2c6";
$translation{'da-48e990d23b8f391375be7d516974d2c6'} = 'Vis portrætter af %s';
$translation{'en-48e990d23b8f391375be7d516974d2c6'} = "Show portraits of %s";
$translation{'de-48e990d23b8f391375be7d516974d2c6'} = "";
$translation{'fr-48e990d23b8f391375be7d516974d2c6'} = "";
$translation{'it-48e990d23b8f391375be7d516974d2c6'} = "";
# ./digt.pl,./vaerktoc.pl
$translation{'Vis printudgave...'} = "00262825dd966ccebc94494727fc80ab";
$translation{'da-00262825dd966ccebc94494727fc80ab'} = 'Vis printudgave...';
$translation{'en-00262825dd966ccebc94494727fc80ab'} = 'Show print-edition...';
$translation{'de-00262825dd966ccebc94494727fc80ab'} = "";
$translation{'fr-00262825dd966ccebc94494727fc80ab'} = "";
$translation{'it-00262825dd966ccebc94494727fc80ab'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'Vis titler på alle digte'} = "182aef90e38b049d54acb73d5a0afb33";
$translation{'da-182aef90e38b049d54acb73d5a0afb33'} = 'Vis titler på alle digte';
$translation{'en-182aef90e38b049d54acb73d5a0afb33'} = "All poems listed by title";
$translation{'de-182aef90e38b049d54acb73d5a0afb33'} = "";
$translation{'fr-182aef90e38b049d54acb73d5a0afb33'} = "";
$translation{'it-182aef90e38b049d54acb73d5a0afb33'} = "";
# ./index.cgi
$translation{'Vælg anden dato...'} = "b377b3fa9ef0ae7f198ce0527cf16512";
$translation{'da-b377b3fa9ef0ae7f198ce0527cf16512'} = 'Vælg anden dato...';
$translation{'en-b377b3fa9ef0ae7f198ce0527cf16512'} = 'Choose another date...';
$translation{'de-b377b3fa9ef0ae7f198ce0527cf16512'} = "";
$translation{'fr-b377b3fa9ef0ae7f198ce0527cf16512'} = "";
$translation{'it-b377b3fa9ef0ae7f198ce0527cf16512'} = "";
# ./klines.pl
$translation{'Vælg begyndelsesbogstav nedenfor'} = "2d5cef4658ebf82f6bb1d7701ebd9d08";
$translation{'da-2d5cef4658ebf82f6bb1d7701ebd9d08'} = 'Vælg begyndelsesbogstav nedenfor';
$translation{'en-2d5cef4658ebf82f6bb1d7701ebd9d08'} = 'Choose first letter below';
$translation{'de-2d5cef4658ebf82f6bb1d7701ebd9d08'} = "";
$translation{'fr-2d5cef4658ebf82f6bb1d7701ebd9d08'} = "";
$translation{'it-2d5cef4658ebf82f6bb1d7701ebd9d08'} = "";
# ./klines.pl
$translation{'Vælg begyndelsesbogstav:'} = "b8d5192dfaa7807c3c3bb7ec0ac5cbcd";
$translation{'da-b8d5192dfaa7807c3c3bb7ec0ac5cbcd'} = 'Vælg begyndelsesbogstav:';
$translation{'en-b8d5192dfaa7807c3c3bb7ec0ac5cbcd'} = 'Choose first letter:';
$translation{'de-b8d5192dfaa7807c3c3bb7ec0ac5cbcd'} = "";
$translation{'fr-b8d5192dfaa7807c3c3bb7ec0ac5cbcd'} = "";
$translation{'it-b8d5192dfaa7807c3c3bb7ec0ac5cbcd'} = "";
# ./ffront.cgi,./fvaerker.pl,./fvaerker.pl,./kvaerker.pl,./kvaerker.pl,./vaerktoc.pl,./worksfront.cgi,./worksfront.cgi,./Kalliope/Page.pm,./Kalliope/Page.pm,./Kalliope/Page.pm,./Kalliope/Person.pm
$translation{'Værker'} = "9fe9bca93a18c2f510836c03ce202a20";
$translation{'da-9fe9bca93a18c2f510836c03ce202a20'} = 'Værker';
$translation{'en-9fe9bca93a18c2f510836c03ce202a20'} = "Works";
$translation{'de-9fe9bca93a18c2f510836c03ce202a20'} = "";
$translation{'fr-9fe9bca93a18c2f510836c03ce202a20'} = "";
$translation{'it-9fe9bca93a18c2f510836c03ce202a20'} = "";
# ./kvaerker.pl,./worksfront.cgi,./Kalliope/Page.pm
$translation{'Værker efter digter'} = "5b3786dc42ed14701136f89e35b50488";
$translation{'da-5b3786dc42ed14701136f89e35b50488'} = 'Værker efter digter';
$translation{'en-5b3786dc42ed14701136f89e35b50488'} = "Works by poet";
$translation{'de-5b3786dc42ed14701136f89e35b50488'} = "";
$translation{'fr-5b3786dc42ed14701136f89e35b50488'} = "";
$translation{'it-5b3786dc42ed14701136f89e35b50488'} = "";
# ./kvaerker.pl,./worksfront.cgi,./Kalliope/Page.pm
$translation{'Værker efter titel'} = "b964dad1cc3be9da648bc80199706ef5";
$translation{'da-b964dad1cc3be9da648bc80199706ef5'} = 'Værker efter titel';
$translation{'en-b964dad1cc3be9da648bc80199706ef5'} = "Works by title";
$translation{'de-b964dad1cc3be9da648bc80199706ef5'} = "";
$translation{'fr-b964dad1cc3be9da648bc80199706ef5'} = "";
$translation{'it-b964dad1cc3be9da648bc80199706ef5'} = "";
# ./kvaerker.pl,./worksfront.cgi,./Kalliope/Page.pm
$translation{'Værker efter år'} = "d6abeed19f921e485ed5142458f6dce5";
$translation{'da-d6abeed19f921e485ed5142458f6dce5'} = 'Værker efter år';
$translation{'en-d6abeed19f921e485ed5142458f6dce5'} = "Works by year";
$translation{'de-d6abeed19f921e485ed5142458f6dce5'} = "";
$translation{'fr-d6abeed19f921e485ed5142458f6dce5'} = "";
$translation{'it-d6abeed19f921e485ed5142458f6dce5'} = "";
# ./worksfront.cgi
$translation{'Værker grupperet efter digter'} = "cdec7d760604e076af1381b60a4c9eda";
$translation{'da-cdec7d760604e076af1381b60a4c9eda'} = 'Værker grupperet efter digter';
$translation{'en-cdec7d760604e076af1381b60a4c9eda'} = "Works grouped by poet";
$translation{'de-cdec7d760604e076af1381b60a4c9eda'} = "";
$translation{'fr-cdec7d760604e076af1381b60a4c9eda'} = "";
$translation{'it-cdec7d760604e076af1381b60a4c9eda'} = "";
# ./worksfront.cgi
$translation{'Værker ordnet efter titel'} = "86180cf3fb52fcc6897f1296bd58376a";
$translation{'da-86180cf3fb52fcc6897f1296bd58376a'} = 'Værker ordnet efter titel';
$translation{'en-86180cf3fb52fcc6897f1296bd58376a'} = "Works grouped by title";
$translation{'de-86180cf3fb52fcc6897f1296bd58376a'} = "";
$translation{'fr-86180cf3fb52fcc6897f1296bd58376a'} = "";
$translation{'it-86180cf3fb52fcc6897f1296bd58376a'} = "";
# ./worksfront.cgi
$translation{'Værker ordnet efter udgivelsesår'} = "03d00876d96382a5f0c9d1c179ebb373";
$translation{'da-03d00876d96382a5f0c9d1c179ebb373'} = 'Værker ordnet efter udgivelsesår';
$translation{'en-03d00876d96382a5f0c9d1c179ebb373'} = "Works grouped by year of publishing";
$translation{'de-03d00876d96382a5f0c9d1c179ebb373'} = "";
$translation{'fr-03d00876d96382a5f0c9d1c179ebb373'} = "";
$translation{'it-03d00876d96382a5f0c9d1c179ebb373'} = "";
# ./biografi.cgi
$translation{'%s død'} = "6ff81942f8e9149c85bb4b35a54ee956";
$translation{'da-6ff81942f8e9149c85bb4b35a54ee956'} = '%s død';
$translation{'en-6ff81942f8e9149c85bb4b35a54ee956'} = '%s dead';
$translation{'de-6ff81942f8e9149c85bb4b35a54ee956'} = "";
$translation{'fr-6ff81942f8e9149c85bb4b35a54ee956'} = "";
$translation{'it-6ff81942f8e9149c85bb4b35a54ee956'} = "";
# ./biografi.cgi
$translation{'%s født'} = "ac4b63e5249d65eeabc5ac17bc8fa0f5";
$translation{'da-ac4b63e5249d65eeabc5ac17bc8fa0f5'} = '%s født';
$translation{'en-ac4b63e5249d65eeabc5ac17bc8fa0f5'} = '%s born';
$translation{'de-ac4b63e5249d65eeabc5ac17bc8fa0f5'} = "";
$translation{'fr-ac4b63e5249d65eeabc5ac17bc8fa0f5'} = "";
$translation{'it-ac4b63e5249d65eeabc5ac17bc8fa0f5'} = "";
# ./Kalliope/Person.pm
$translation{'\%ss bibliografi'} = "0ea99cc800d739898973254e13dd1884";
$translation{'da-0ea99cc800d739898973254e13dd1884'} = '%ss bibliografi';
$translation{'en-0ea99cc800d739898973254e13dd1884'} = '%ss biography';
$translation{'de-0ea99cc800d739898973254e13dd1884'} = '';
$translation{'fr-0ea99cc800d739898973254e13dd1884'} = "";
$translation{'it-0ea99cc800d739898973254e13dd1884'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'\%ss prosatekster'} = "3dd7a915749fd08ed919bb88d4276af3";
$translation{'da-3dd7a915749fd08ed919bb88d4276af3'} = '\%ss prosatekster';
$translation{'en-3dd7a915749fd08ed919bb88d4276af3'} = 'The prose by %s';
$translation{'de-3dd7a915749fd08ed919bb88d4276af3'} = "";
$translation{'fr-3dd7a915749fd08ed919bb88d4276af3'} = "";
$translation{'it-3dd7a915749fd08ed919bb88d4276af3'} = "";
# ./ffront.cgi,./Kalliope/Person.pm
$translation{'%ss samlede poetiske værker'} = "7929fd7c9f070d5903c049a936012cf6";
$translation{'da-7929fd7c9f070d5903c049a936012cf6'} = '\%ss samlede poetiske værker';
$translation{'en-7929fd7c9f070d5903c049a936012cf6'} = 'The collected poetical work of %s';
$translation{'de-7929fd7c9f070d5903c049a936012cf6'} = "";
$translation{'fr-7929fd7c9f070d5903c049a936012cf6'} = "";
$translation{'it-7929fd7c9f070d5903c049a936012cf6'} = "";
# ./Kalliope/Page.pm
$translation{'amerikanske'} = "35baf123680c2dfc387af514f059f0f4";
$translation{'da-35baf123680c2dfc387af514f059f0f4'} = 'amerikanske';
$translation{'en-35baf123680c2dfc387af514f059f0f4'} = "American";
$translation{'de-35baf123680c2dfc387af514f059f0f4'} = "";
$translation{'fr-35baf123680c2dfc387af514f059f0f4'} = "";
$translation{'it-35baf123680c2dfc387af514f059f0f4'} = "";
# ./Kalliope/Page.pm
$translation{'britiske'} = "d7570d36242a8761c769e0211187f2e8";
$translation{'da-d7570d36242a8761c769e0211187f2e8'} = 'britiske';
$translation{'en-d7570d36242a8761c769e0211187f2e8'} = "British";
$translation{'de-d7570d36242a8761c769e0211187f2e8'} = "";
$translation{'fr-d7570d36242a8761c769e0211187f2e8'} = "";
$translation{'it-d7570d36242a8761c769e0211187f2e8'} = "";
# ./Kalliope/Page.pm
$translation{'danske'} = "6dfe461386f8ba9357050778935e68cd";
$translation{'da-6dfe461386f8ba9357050778935e68cd'} = 'danske';
$translation{'en-6dfe461386f8ba9357050778935e68cd'} = "Danish";
$translation{'de-6dfe461386f8ba9357050778935e68cd'} = "";
$translation{'fr-6dfe461386f8ba9357050778935e68cd'} = "";
$translation{'it-6dfe461386f8ba9357050778935e68cd'} = "";
# ./kvaerker.pl
$translation{'efter digter'} = "2b7b110bd2ad6e2ad30dcbcffc92adcc";
$translation{'da-2b7b110bd2ad6e2ad30dcbcffc92adcc'} = 'efter digter';
$translation{'en-2b7b110bd2ad6e2ad30dcbcffc92adcc'} = "by poet";
$translation{'de-2b7b110bd2ad6e2ad30dcbcffc92adcc'} = "";
$translation{'fr-2b7b110bd2ad6e2ad30dcbcffc92adcc'} = "";
$translation{'it-2b7b110bd2ad6e2ad30dcbcffc92adcc'} = "";
# ./poets.cgi
$translation{'efter fødeår'} = "55df9468ce9f20dad3ed7d0e7ea428b9";
$translation{'da-55df9468ce9f20dad3ed7d0e7ea428b9'} = 'efter fødeår';
$translation{'en-55df9468ce9f20dad3ed7d0e7ea428b9'} = "by year";
$translation{'de-55df9468ce9f20dad3ed7d0e7ea428b9'} = "";
$translation{'fr-55df9468ce9f20dad3ed7d0e7ea428b9'} = "";
$translation{'it-55df9468ce9f20dad3ed7d0e7ea428b9'} = "";
# ./poets.cgi
$translation{'efter navn'} = "61648379a49e19b56e1ba85c74aeaef2";
$translation{'da-61648379a49e19b56e1ba85c74aeaef2'} = 'efter navn';
$translation{'en-61648379a49e19b56e1ba85c74aeaef2'} = "by name";
$translation{'de-61648379a49e19b56e1ba85c74aeaef2'} = "";
$translation{'fr-61648379a49e19b56e1ba85c74aeaef2'} = "";
$translation{'it-61648379a49e19b56e1ba85c74aeaef2'} = "";
# ./kvaerker.pl
$translation{'efter titel'} = "d5669c48e66eaa7653a76a5afd150a4f";
$translation{'da-d5669c48e66eaa7653a76a5afd150a4f'} = 'efter titel';
$translation{'en-d5669c48e66eaa7653a76a5afd150a4f'} = "by title";
$translation{'de-d5669c48e66eaa7653a76a5afd150a4f'} = "";
$translation{'fr-d5669c48e66eaa7653a76a5afd150a4f'} = "";
$translation{'it-d5669c48e66eaa7653a76a5afd150a4f'} = "";
# ./poets.cgi
$translation{'efter udseende'} = "3dfaadcd6c9d704ce6fff53b23afdf33";
$translation{'da-3dfaadcd6c9d704ce6fff53b23afdf33'} = 'efter udseende';
$translation{'en-3dfaadcd6c9d704ce6fff53b23afdf33'} = "by look";
$translation{'de-3dfaadcd6c9d704ce6fff53b23afdf33'} = "";
$translation{'fr-3dfaadcd6c9d704ce6fff53b23afdf33'} = "";
$translation{'it-3dfaadcd6c9d704ce6fff53b23afdf33'} = "";
# ./kvaerker.pl
$translation{'efter år'} = "2f4760d60bf545d00a4013123c059635";
$translation{'da-2f4760d60bf545d00a4013123c059635'} = 'efter år';
$translation{'en-2f4760d60bf545d00a4013123c059635'} = "by year";
$translation{'de-2f4760d60bf545d00a4013123c059635'} = "";
$translation{'fr-2f4760d60bf545d00a4013123c059635'} = "";
$translation{'it-2f4760d60bf545d00a4013123c059635'} = "";
# ./poets.cgi
$translation{'flittigste'} = "fe1a9ac6f713cf809af13f041d89d4fb";
$translation{'da-fe1a9ac6f713cf809af13f041d89d4fb'} = 'flittigste';
$translation{'en-fe1a9ac6f713cf809af13f041d89d4fb'} = "busy";
$translation{'de-fe1a9ac6f713cf809af13f041d89d4fb'} = "";
$translation{'fr-fe1a9ac6f713cf809af13f041d89d4fb'} = "";
$translation{'it-fe1a9ac6f713cf809af13f041d89d4fb'} = "";
# ./Kalliope/Page.pm
$translation{'franske'} = "9446b2b5ee38f9d3b8ccca6d4649287e";
$translation{'da-9446b2b5ee38f9d3b8ccca6d4649287e'} = 'franske';
$translation{'en-9446b2b5ee38f9d3b8ccca6d4649287e'} = "French";
$translation{'de-9446b2b5ee38f9d3b8ccca6d4649287e'} = "";
$translation{'fr-9446b2b5ee38f9d3b8ccca6d4649287e'} = "";
$translation{'it-9446b2b5ee38f9d3b8ccca6d4649287e'} = "";
# ./Kalliope/Page.pm
$translation{'italienske'} = "359468881f9f02c9d386618d6c32ea67";
$translation{'da-359468881f9f02c9d386618d6c32ea67'} = 'italienske';
$translation{'en-359468881f9f02c9d386618d6c32ea67'} = 'Italian';
$translation{'de-359468881f9f02c9d386618d6c32ea67'} = "";
$translation{'fr-359468881f9f02c9d386618d6c32ea67'} = "";
$translation{'it-359468881f9f02c9d386618d6c32ea67'} = "";
# ./kvaerker.pl,./poets.cgi
$translation{'mest populære'} = "e9ba81d072438c1dd03962f8a3813685";
$translation{'da-e9ba81d072438c1dd03962f8a3813685'} = 'mest populære';
$translation{'en-e9ba81d072438c1dd03962f8a3813685'} = "most popular";
$translation{'de-e9ba81d072438c1dd03962f8a3813685'} = "";
$translation{'fr-e9ba81d072438c1dd03962f8a3813685'} = "";
$translation{'it-e9ba81d072438c1dd03962f8a3813685'} = "";
# ./Kalliope/Page.pm
$translation{'norske'} = "3a155308ef4baebb945c6a751ce6b55b";
$translation{'da-3a155308ef4baebb945c6a751ce6b55b'} = 'norske';
$translation{'en-3a155308ef4baebb945c6a751ce6b55b'} = "Norwegian";
$translation{'de-3a155308ef4baebb945c6a751ce6b55b'} = "";
$translation{'fr-3a155308ef4baebb945c6a751ce6b55b'} = "";
$translation{'it-3a155308ef4baebb945c6a751ce6b55b'} = "";
# ./Kalliope/Page.pm
$translation{'svenske'} = "fa1590dd3833d431892a6c0786f9eb14";
$translation{'da-fa1590dd3833d431892a6c0786f9eb14'} = 'svenske';
$translation{'en-fa1590dd3833d431892a6c0786f9eb14'} = "Swedish";
$translation{'de-fa1590dd3833d431892a6c0786f9eb14'} = "";
$translation{'fr-fa1590dd3833d431892a6c0786f9eb14'} = "";
$translation{'it-fa1590dd3833d431892a6c0786f9eb14'} = "";
# ./Kalliope/Page.pm
$translation{'tyske'} = "c993224e0dd87f717603e2c2da093ca5";
$translation{'da-c993224e0dd87f717603e2c2da093ca5'} = 'tyske';
$translation{'en-c993224e0dd87f717603e2c2da093ca5'} = "German";
$translation{'de-c993224e0dd87f717603e2c2da093ca5'} = "";
$translation{'fr-c993224e0dd87f717603e2c2da093ca5'} = "";
$translation{'it-c993224e0dd87f717603e2c2da093ca5'} = "";
# ./Kalliope/Date.pm
$translation{'Ingen dato'} = "68549db21c794e6b14e6336700846bbf";
$translation{'da-68549db21c794e6b14e6336700846bbf'} = 'Ingen dato';
$translation{'en-68549db21c794e6b14e6336700846bbf'} = "No date";
$translation{'de-68549db21c794e6b14e6336700846bbf'} = "";
$translation{'fr-68549db21c794e6b14e6336700846bbf'} = "";
$translation{'it-68549db21c794e6b14e6336700846bbf'} = "";
# ./persons.cgi
$translation{'Andre personer'} = "b04745626317e6772a7edc4e91d3daab";
$translation{'da-b04745626317e6772a7edc4e91d3daab'} = 'Andre personer';
$translation{'en-b04745626317e6772a7edc4e91d3daab'} = "Other persons";
$translation{'de-b04745626317e6772a7edc4e91d3daab'} = "";
$translation{'fr-b04745626317e6772a7edc4e91d3daab'} = "";
$translation{'it-b04745626317e6772a7edc4e91d3daab'} = "";


};

1;

