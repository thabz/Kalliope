#!/bin/sh

./graph.pl > tal
/usr/bin/gnuplot gplot > plot.png
/usr/bin/convert -transparent white plot.png plot.gif
rm tal plot.png
