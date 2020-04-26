#!/usr/bin/ruby

poetid = ''
workid = 'andre'

if ARGV.length == 0
    puts "USAGE: ./tools/add-poem.rb poet-id [work-id]"
    exit
elsif ARGV.length == 1
    poetid = ARGV[0]
else
    poetid = ARGV[0]
    workid = ARGV[1]
end

folder = "fdirs/#{poetid}"
workfilename = "#{folder}/#{workid}.xml"

if (!File.directory?(folder)) 
    abort("Mappen #{folder} findes ikke.")
end

if workid == 'andre' and !File.file?(workfilename)
    # Opret filen andre.xml
    andrexml = %{<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE kalliopework SYSTEM "../../data/kalliopework.dtd">
<kalliopework id="#{workid}" author="#{poetid}" status="incomplete" type="poetry">
<workhead>
    <title>Andre digte</title>
    <year>?</year>
</workhead>
<workbody>
</workbody>
</kalliopework>}

    File.open(workfilename, "w") { |file|
        file.write(andrexml)
    }
elsif !File.file?(workfilename)
    abort("#{workfilename} findes ikke.")
end


allcontents = Dir["#{folder}/*.xml"].map{ |f|
    File.read(f)
}.join " "
poemId = '';
date = Time.now.strftime("%Y%m%d")
num = 1
done = false
while (!done)
    poemId = "#{poetid}#{date}%02d" % [num]
    if not allcontents.include? poemId
        done = true
    else 
        num += 1
    end
end

puts "Poem id #{poemId}"

contents = File.read(workfilename)
prefix = ""
if not contents.include?("<poem")
    prefix = "\n"
end

textxml = %{#{prefix}<text id="#{poemId}">
<head>
    <title></title>
    <firstline></firstline>
</head>
<body>
<poetry>
</poetry>
</body>
</text>

</workbody>}

contents.gsub! "</workbody>", textxml

File.open(workfilename, "w") { |file|
    file.write(contents)
}

