
package KalliopeWorks;

use lib "..";

use Kalliope::Person;
use Kalliope::Work;
use Kalliope::PersonHome;

sub get { 
    my $line = shift;
    unless ($line =~ /^værker/i) { 
	return 'Øh?';
   }

   my ($fhandle) = $line =~ /værker *([^ ]+) *$/;
   return 'Hvilket navn ville du se værker for?' unless $fhandle;

   return "Jeg kender ingen $fhandle ..." unless Kalliope::Person::exist($fhandle);

   my $person = Kalliope::PersonHome::findByFhandle($fhandle);

   my $result = $person->name."s værker er ";
   my @works = ($person->poeticalWorks,$person->proseWorks);
   $result .= join ", ",
              map { $_->titleWithYear } 
  	      @works;
   return $result;	      
}

1;
