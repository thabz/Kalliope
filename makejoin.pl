#!/usr/bin/perl -w

use strict;

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
    print header($fhandle,sprintf("%03d",$i),$date);
    open(FILE,"$dir/$file");
    while (<FILE>) { print $_ };
    print footer();
}

sub header {
    my ($fhandle,$i,$date) = @_;
    return <<"EOF";
<poem id="$fhandle$date$i">
<head>
   <title></title>
   <toctitle></toctitle>
   <indextitle></indextitle>
   <firstline></firstline>
   <notes>
      <note></note>
   </notes>
   <quality>korrektur1</quality>
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
    print "USAGE: makejoin.pl fhandle dir\n";
}

