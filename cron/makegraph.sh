#!/bin/sh

./graph.pl > tal
/usr/local/bin/gnuplot gplot > plot.png
/usr/local/bin/convert -transparent white plot.png plot.gif
rm tal plot.png
