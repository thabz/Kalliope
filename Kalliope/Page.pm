package Kalliope::Page;

use Kalliope::Web ();

sub new {
    my ($class,%args) = @_;
    my $self = bless {}, $class;
    foreach my $key (%args) {
        $self->{$key} = $args{$key};
    }
    $self->{'lang'} = $args{'lang'} || 'dk';
    $self->{'pagegroup'} = $args{'pagegroup'} || 'normal';
    $self->{'metadata'} = $args{'metadata'} || 'dk';
    $self->{'author'} = $args
    $self->{'title'} = $args{'title'}.' - Kalliope' || 'dk';
    $self->{'html'} = <<"EOF";
<HTML><HEAD><TITLE>$kpagetitel</TITLE>
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
$ekstrametakeywords
</HEAD>
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000">

EOF
}

sub addHTML {
    my ($self,$HTML) = @_;
    $self->{'html'} .= $HTML;
}

sub addBox {
    my ($self,%args) = @_;
    return Kalliope::Web::makeBox (
               $args{'title'} || '',
               $args{'width'} || '',
               $args{'align'} || '',
               $args{'content'} || '',
               $args{'end'} || '');
}

sub print {
    my $self = shift;
    print "Content-type: text/html\n\n";
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print $self->{'html'};
}

1;
