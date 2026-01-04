#!/usr/bin/ruby

require 'tmpdir'

def handle(pdffilename, lang)
    Dir.mktmpdir("foo") { |workdir| 
        imageprefix = "#{workdir}/page"
        `pdftoppm -jpeg -f 20 -l 23 -r 300  '#{pdffilename}' '#{imageprefix}'`
        Dir["#{workdir}/*.jpg"].each { |imagefile|
            textfile = imagefile.gsub('.jpg','')
            `tesseract -l #{lang} --dpi 300 --tessdata-dir tools/tessdata #{imagefile} #{textfile}`
        }
        puts "Nogen"

        outcontent = Dir["#{workdir}/*.txt"].sort.map { |textfile|
            puts textfile
            File.read(textfile)
        }.join "\n"

        puts outcontent
        puts "Nogen"

        outfile = pdffilename.gsub(/.*\//,'').gsub('.pdf','.txt')
        File.write(outfile, outcontent)
    }
end


if ARGV.length > 0
    handle(ARGV[0], 'dan_frak')
else
    puts "./tools/ocr.rb pdf-filename"
end


