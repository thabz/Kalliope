#!/usr/bin/ruby

if ARGV.length != 2
    puts "USAGE: split-source.rb poetid workid"
  exit 0
end

poetid = ARGV[0]
workid = ARGV[1]

text = File.open("static/edit/#{poetid}/#{workid}/full.txt").read
parts = text.split(/===\s*\d*\s*/).each_with_index { |part,i| 
    File.open("static/edit/#{poetid}/#{workid}/page-#{i+1}.txt", 'w') { |file|
        file.write(part)
    }
}


