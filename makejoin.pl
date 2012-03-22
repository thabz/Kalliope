#!/usr/bin/perl -w

use strict;
use Getopt::Long;
use utf8;

my @notes = ();
my $quality;
GetOptions ("note=s" => \@notes, "quality=s" => \$quality);

if ($#ARGV < 1) {
    usage();
    exit;
}

my $fhandle = $ARGV[0];
my $dir = $ARGV[1];

my (undef,undef,undef,$day,$month,$year,undef,undef,undef)=localtime(time);
$month++;
$year += 1900;
my $date = sprintf("%4d%02d%02d",$year,$month,$day);
my $i = 1;

opendir(DIR,$dir) || die $!;
my @files = grep {!/^\./} readdir(DIR);

foreach my $file (@files) {
    print header($fhandle,sprintf("%03d",$i),$date,$quality,@notes);
    open(FILE,"$dir/$file");
    while (<FILE>) { print $_ };
    print footer();
    $i++;
}

sub header {
    my ($fhandle,$i,$date,$quality,@notes) = @_;
    my $notes = '';
    if ($#notes >= 0) {
        $notes = "\n   <notes>\n";
	foreach my $note (@notes) {
           $notes .= "      <note>$note</note>\n";
	}
        $notes .= "   </notes>";
    }
    $quality = qq(\n   <quality>$quality</quality>) if $quality;
    
    return <<"EOF";
<!-- ================================================================ -->
<poem id="$fhandle$date$i">
<head>
   <title></title>
   <toctitle></toctitle>
   <indextitle></indextitle>
   <firstline></firstline>$notes$quality
</head>
<body>
EOF
}

sub footer {
    return <<"EOF";
</body>
</poem>    

EOF
}


sub usage {
    print "Usage: makejoin.pl [options] fhandle dir\n";
    print "Wraps a dir of poem files into xml to create a work\n\n";
    print "Options:\n";
    print qq(  --note <string>\t\tAdds a note field to alle poems.\n\t\t\t\tYou can have several --note\n);
    print qq(  --quality <string>\t\tAdds a quality field poems\n);
}

