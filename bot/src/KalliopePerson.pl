
package KalliopePerson;

use lib "..";

use Kalliope::Person;

sub get { 
    my $line = shift;
    unless ($line =~ /^person/i) { 
	return 'Øh?';
   }

   my ($fhandle) = $line =~ /person *([^ \?]+)/;
   return 'Hvilket navn ville du have info for?' unless $fhandle;

   return "Jeg kender ingen $fhandle ..." unless Kalliope::Person::exist($fhandle);

   my $person = new Kalliope::Person (fhandle => $fhandle);

   return $person->name." ".$person->lifespan;
}

1;
