#!/usr/bin/perl

do 'kstdhead.pl';

$wheretolinklanguage = 'kfront.pl';
$titel = "Litteraturhistorie ";
$0 = "hpage.pl";
&kheaderHTML("Litteraturhistorie");

#&kcenterpageheader("Litteraturhistorie - indeks");


#Indled kasse til selve teksten
beginwhitebox("","","");

opendir(ETC,"hist.$LA/") || die "ARGH!!";
@files = readdir(ETC);
closedir(ETC);
foreach (@files) {
	if (/\.txt$/) {
		#Find titel
		$filename=$_;
		open(FILE,"hist.$LA/".$_);
		while (<FILE>) {
			if (/^T:/) {
				$titel=$_;
				chomp($titel);
				$titel=~ s/^T://;
				last;
			}
		}
		push(@index,$titel."%".$filename);
	}
};

foreach (sort @index) {
	($titel,$filename)=split(/%/);
	$filename =~ s/\.txt$//;
	print "<A HREF=\"hpage.pl?$filename?$LA\">$titel</A><BR>";
}

#print '<BR><A HREF="keyword.cgi?mode=visalle&sprog='.$LA.'">Nøgleord</A><BR>';
print "<BR><BR><I>Disse artikler vil snart forsvinde - deres indhold vil blive overflyttet til nøgleordene</I>\n";

endbox();

kfooterHTML();
