#En lille speciel sorterings sub til gammeldags Aa, etc.

sub dk_sort {
	local($ai) = "\L$a";
	$ai =~ s/aa/å/;
	local($bi) = "\L$b";
	$bi =~ s/aa/å/;
        return $ai cmp $bi;
}

sub dk_sort2 { 
    my $aa = mylc($a->{'sort'});
    $aa =~ s/aa/å/g;
    $aa =~ tr/àáâãäåçèéêëìíîïğñòóôõöùúûüı/aaaaæüceeeeiiiidnooooøuuuyy/;

    my $bb = mylc($b->{'sort'});
    $bb =~ s/aa/å/g;
    $bb =~ tr/àáâãäåçèéêëìíîïğñòóôõöùúûüı/aaaaæüceeeeiiiidnooooøuuuyy/;
    return $aa cmp $bb;
}

sub mylc {
    my $str = shift;
    $str =~ tr/A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖØÙÚÛÜİŞ/a-zàáâãäåæçèéêëìíîïğñòóôõöøùúûüış/;
    return $str;
}
