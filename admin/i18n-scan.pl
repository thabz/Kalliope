#!/usr/bin/perl

use lib '..';

use Kalliope::Internationalization;

use File::Find;
use Digest::MD5 qw(md5 md5_hex);

my %strings_found;

sub handle_file {
    /\.(cgi|pl|pm)$/ or return;
    my $file = $_;
    my $dir = $File::Find::dir;
    my $path = "$dir/$file";
    my $head_printed = 0;
    chdir ($dir);

    open(FILE,"<$file") || warn "Can't open $path";
    binmode(FILE,":latin1");
#binmode(FILE,":utf8");
    my $count = 0;
    while(<FILE>) {
	while (/_\((["'])([^\1]*?)\1.*?\)/g) {
	    my $found = $2;
	    $found =~ s/"/\\"/g;
	    $found =~ s/'/\\'/g;
	    $found =~ s/\@/\\\@/g;
	    $found =~ s/\$/\\\$/g;
	    $found =~ s/%/%/g;
	    my @empty;
            $strings_found{$found} = \@empty if !($strings_found{$found});
	    push @{$strings_found{$found}}, $path;
	    $count++;
        }
    }
    close(FILE);
    $_ = $file;
}

find(\&handle_file,'.');

my $i = 1;
foreach my $string (sort keys %strings_found) {
    my $note = join ",", @{$strings_found{$string}};
    my $md5 = md5_hex($string);
    if (!Kalliope::Internationalization::knows_md5($md5)) {
        print "# $note\n";
        print qq|\$translation{'$string'} = "$md5";\n|;
        print qq|\$translation{'da-$md5'} = '$string';\n|;
        print qq|\$translation{'en-$md5'} = "";\n|;
        print qq|\$translation{'de-$md5'} = "";\n|;
        print qq|\$translation{'fr-$md5'} = "";\n|;
        print qq|\$translation{'it-$md5'} = "";\n|;
    }
    $i++;
}
