package Kalliope::Help;

use Kalliope::Web ();

sub new {
   my ($class,$helpid) = @_;
   my $obj = bless {},$class;
   $obj->{'helpid'} = $helpid;
   $obj->_init;
   return $obj;
}

sub _init {
   my $self = shift;
   open(FILE,"help/".$self->helpid);
   while (<FILE>) {
       if (/^T:(.*)$/) {
	   $self->{'title'} = $1;
      } else {
	  $self->{'text'} .= $_;
      }
   }
   close(FILE);
}


sub helpid {
    return shift->{'helpid'};
}

sub title {
    return shift->{'title'};
}

sub text {
    return shift->{'text'};
}


sub textAsHTML {
    my $self = shift;
    my $HTML;
    $HTML =  "<HEAD><TITLE>".$self->title.'</TITLE>';
    $HTML .= '<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">';
    $HTML .= "</HEAD";
    $HTML .= "<BODY>";
    $HTML .= Kalliope::Web::makeBox($self->title,"100%",'',$self->text,'');
    $HTML .= '</BODY></HTML>';
    return $HTML;
}

sub linkAsHTML {
    my $self = shift;
    my $id = $self->helpid;
    my $title = $self->title;
    return qq|<A TITLE="Hjælp til $title" CLASS=green HREF="javascript:{}" onClick="window.open('help.cgi?helpid=$id','Helppopup','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=400,height=300'); return false">Hjælp</A>|;
}

1;
