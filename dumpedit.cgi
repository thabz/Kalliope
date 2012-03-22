#!/usr/bin/perl

use Kalliope::DB;
use CGI qw /:standard/;
use utf8;


my $dir = param('dir');

my $dbh = Kalliope::DB::connect();

my $sth = $dbh->prepare("SELECT data,filename FROM editpages WHERE dir = ? ORDER BY filename ASC");
$sth->execute($dir);

my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
$mon++;
$year += 1900;
$mday = "0$mday" if $mday < 10;
$mon = "0$mon" if $mon < 10;

$i = 1;
my %filer;
my @result;

# Parse --------------------------------------

my $did = '';

while (my ($data,$filename) = $sth->fetchrow_array) {
    next if $data =~ /\[Duplet\]/i;
    # push @result, "\n# $dir/$filename";
    foreach my $line (split /\n/,$data) {
        if ($line =~ (/^T:/)) {
	    $did = "$dir$year$mon$mday$i";
	    push @result,"\n\n\nI:$did";
	    push @{$filer{$filename}},$did;
	    $i++;
	}
	chomp $line;
	push @result,$line;
    }
    push @{$filer{$filename}},$did if $did;
}

my %sider;
foreach my $filename (keys %filer) {
    foreach my $did (@{$filer{$filename}}) {
	push @{$sider{$did}},"$dir/$filename";
    }
}

# Korrektur -----------------------------------
my %korrektur;
my $sth = $dbh->prepare("SELECT filename, count(action) FROM edithistory WHERE dir = ? AND action = 'accept' GROUP BY filename");
$sth->execute($dir);
while (my ($filename,$count) = $sth->fetchrow_array) {
    $count++;
    $string = join ',', map { "korrektur$_" } (1..$count);
    print STDERR "$string\n";
    $korrektur{"$dir/$filename"} = $string;
}

# Saml hele lortet sammen ---------------------

my @finalresult;
foreach $line (@result) {
    push @finalresult,$line;
    if ($line =~ /I:(.*)/) {
	my $did = $1;
	my $files = join ",",uniq(@{$sider{$did}});
	push @finalresult,"FILES:$files";
	push @finalresult,"Q:".$korrektur{$sider{$did}[0]};
    }
}

# Output -------------------------------------

print "Content-type: text/plain\n\n";
print join "\n",@finalresult;


# ----

sub uniq {
    my %uniq;
    map { $uniq{$_} = 1} @_;
    return sort keys %uniq;
}

