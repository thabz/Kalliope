
package KalliopePerson;

use lib "..";

use Kalliope::Person;
use Kalliope::PersonHome;

sub get { 
    my $line = shift;
    unless ($line =~ /^person/i) { 
	return 'Øh?';
   }

   my ($fhandle) = $line =~ /person *([^ \?]+)/;
   return 'Hvilket navn ville du have info for?' unless $fhandle;

   return "Jeg kender ingen $fhandle ..." unless Kalliope::Person::exist($fhandle);
   my $person = Kalliope::PersonHome::findByFhandle($fhandle);

   return $person->name." ".$person->lifespan;
}

1;
