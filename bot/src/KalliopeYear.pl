
package KalliopeYear;

use lib "..";

use Kalliope::Timeline;

sub get { 
    my $line = shift;
    unless ($line =~ /^år/i) { 
	return 'Øh?';
   }

   my ($year) = $line =~ /år *([^ ]+) *$/;
   return 'Hvilket år tænkte du på?' unless $year;

   my @events = Kalliope::Timeline::getEventsInYear($year);

   return "Der skete vist ikke noget i år $year ..." unless $#events >= 0;

   my $result = "I $year skete der følgende: ";
   foreach $event (@events) {
       my $descr = $event->{'descr'};
       $descr =~ s/<[^>]*>//g;
       $descr =~ s/\.$//g;
       $result .= $descr.", ";
   }
   $result =~ s/, $/./;
   return $result;

}

1;
