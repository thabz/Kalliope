#!/usr/bin/ruby

poetid = ''
if ARGV.length > 0
    poetid = ARGV[0]
else
    puts "Skriv digter-id: "
    poetid = gets.strip
end

folder = "fdirs/#{poetid}"

if (!File.directory?(folder)) 
    abort("Mappen #{folder} findes ikke.")
end

puts "Skriv år: "
year = STDIN.gets.strip
puts "Skriv titel: "
title= STDIN.gets.strip


lines = %{<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE kalliopework SYSTEM "../../data/kalliopework.dtd">
<kalliopework id="#{year}" author="#{poetid}" status="incomplete" type="poetry">
<workhead>
    <title>#{title}</title>
    <year>#{year}</year>
</workhead>
<workbody>
</workbody>
</kalliopework>
}

path = "#{folder}/#{year}.xml"

if (File.file?(path))
    abort("Filen #{path} eksisterer.")
end

File.open(path, 'w') do |file|
  file.puts lines
end
