
package KalliopePoem;

use lib "..";

use Kalliope::Person;
use Kalliope::Work;
use Kalliope::Poem;

sub get { 
    my $line = shift;
    unless ($line =~ /^vis digt/i) { 
	return 'Øh?';
   }

   my ($longdid) = $line =~ /digt *([^ ]+) *$/i;
   return 'Hvilket digt tænker du på?' unless $longdid;

   return "Jeg kender ikke digtet $longdid ..." unless Kalliope::Poem::exist($longdid);

   my $poem = new Kalliope::Poem (longdid => $longdid);

   my $result = "$longdid er ";
   $result .= $poem->clickableTitle;
   $result =~ s/<[^>]*>//g;

   return $result;	      
}

1;
