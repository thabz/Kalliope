
package KalliopePrimaer;

use lib "..";

use Kalliope::Person;

sub get { 
    my $line = shift;
    unless ($line =~ /^primær/i) { 
	return 'Øh?';
   }

   my ($fhandle) = $line =~ /primær *([^ ]+) *$/;
   return 'Hvilket navn ville du se primær litteratur for?' unless $fhandle;

   return "Jeg kender ingen $fhandle ..." unless Kalliope::Person::exist($fhandle);

   my $person = new Kalliope::Person (fhandle => $fhandle);

   $filename = "../fdirs/$fhandle/primaer.txt";

   return "Jeg kender intet primærlitteratur for ".$person->name."." unless -e $filename;

   my $result = $person->name."s primærlitteratur er ";

   open (FILE,$filename);
   $result .= join ' *** ', <FILE>;

   $result =~ s/\n//g;
   $result =~ s/<[^>]*>//g;

   return $result;	      
}

1;
