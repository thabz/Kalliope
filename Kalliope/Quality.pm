
package Kalliope::Quality;
use strict;

my %items = (
     korrektur1 => { name     => 'første korrekturlæsning',
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_no.gif' },
     korrektur2 => { name     => 'anden korrekturlæsning',
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_no.gif' },
     korrektur3 => { name     => 'tredie korrekturlæsning',
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_no.gif' },
     kilde      => { name     => 'kildeangivelse',
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_no.gif' },
     side       => { name     => 'sidehenvisninger',
                     icon_on  => 'gfx/tb_yes.gif',
		     icon_off => 'gfx/tb_no.gif' } 
);

my @order = qw/ korrektur1 korrektur2 korrektur3 kilde side /;

sub new {
    my ($class,$quality) = @_;
    my $self = bless {},$class;
    print STDERR "** Q:$quality\n";
    @{$self->{'array'}} = split ',',$quality;
    %{$self->{'hash'}} = map { $_ => 1 } @{$self->{'array'}};
    return $self;
}

sub asHTML {
   my $self = shift;
   my $HTML;
   foreach my $key (@order) {
      my $status = $self->{'hash'}->{$key};
      my %item = %{$items{$key}};
      my $icon = $status ? $item{'icon_on'} : $item{'icon_off'};
      my $alt = $status ? 'Har ' : 'Mangler ';
      $alt .= $item{'name'};
      $HTML .= qq|<IMG SRC="$icon" ALT="$alt" TITLE="$alt">|;
   }
   return $HTML;
}
