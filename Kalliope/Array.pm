
package Kalliope::Array;

sub uniq {
   my %list = map { $_ => 1 } @_;
   return keys %list;
}

1;
