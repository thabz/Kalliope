
./graph.pl > tal
gnuplot gplot > plot.png
convert -transparent white plot.png plot.gif
rm tal plot.png
