#!/usr/bin/ruby

i = 1
File.readlines(ARGV[0]).each do |line|
    if line =~ /<(poem|prose|section) id="[a-z]+\d{8}[^"]*"/
        num = "%02d" % i
        i += 1
        line = line.gsub(/<(poem|prose|section) id="([a-z]+\d{8})[^"]*"/, "<\\1 id=\"\\2#{num}\"")
    end
    puts line
end
