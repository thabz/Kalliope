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
    `./tools/add-work.rb #{poetid} andre`
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
if not contents.include?("<text")
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

