#!/usr/bin/ruby

require 'nokogiri'

def isYes(v)
    return v == '' || v == 'Y' || v == 'y' || v == 'j' || v == 'J'
end

def wrapInTag(v, tag, indent)
    if (v == '')
        return ''
    else
        return "\n#{indent}<#{tag}>#{v}</#{tag}>"
    end
end

@fieldnames = [
    'Digter-id',
    'Land',
    'Sprog',
    'Fornavn',
    'Efternavn',
    'Fulde navn',
    'Fødselsdato (yyyy-mm-dd)',
    'Fødested',
    'Dødsdato (yyyy-mm-dd)',
    'Dødssted',
    'andre.xml (Y/n)',
    'portraits.xml (Y/n)',
]
@fieldvalues = {}
@fieldvalidations = {
    'Digter-id' => lambda do |id|
        if File.directory?("fdirs/#{id}")
            abort "Mappen fdirs/#{id} findes allerede."
        end
    end
}

@fieldnames.each { |fieldname| 
    puts "#{fieldname}: "
    value = STDIN.gets.strip
    @fieldvalues[fieldname] = value
    validation = @fieldvalidations[fieldname]
    if not validation.nil?
        validation.call(value)
    end
}

@poetId = @fieldvalues['Digter-id']
@lang = @fieldvalues['Sprog']
@country = @fieldvalues['Land']
@poetFolder = "fdirs/#{@poetId}"
@wantsAndreXml = isYes(@fieldvalues['andre.xml (Y/n)'])
@wantsPortraitsXml = isYes(@fieldvalues['portraits.xml (Y/n)'])
@fullname = wrapInTag(@fieldvalues['Fulde navn'], 'fullname', '    ')
@birthplace = wrapInTag(@fieldvalues['Fødested'], 'place', '      ')
@deathplace = wrapInTag(@fieldvalues['Dødssted'], 'place', '      ')

Dir.mkdir(@poetFolder)

def writeXML(filename, xml)
    File.open("#{@poetFolder}/#{filename}", 'w') do |file|
      file.puts xml
    end
end

@infoXml = %{<?xml version="1.0" encoding="UTF-8"?>
<person id="#{@poetId}" country="#{@country}" lang="#{@lang}" type="poet">
  <name>
    <firstname>#{@fieldvalues['Fornavn']}</firstname>
    <lastname>#{@fieldvalues['Efternavn']}</lastname>#{@fullname}
  </name>
  <period>
    <born>
      <date>#{@fieldvalues['Fødselsdato (yyyy-mm-dd)']}</date>#{@birthplace}
    </born>
    <dead>
      <date>#{@fieldvalues['Dødsdato (yyyy-mm-dd)']}</date>#{@deathplace}
    </dead>
  </period>
  #{@wantsAndreXml ? "<works>andre</works>" : ""}
</person>
}

writeXML('info.xml', @infoXml)

if (@wantsAndreXml) 
    today = Time.new.strftime("%Y%m%d")
    @andreXml = %{<?xml version="1.0" encoding="UTF-8"?>
<kalliopework id="andre" author="#{@poetId}" status="incomplete" type="poetry">
<workhead>
    <title>Andre digte</title>
    <year>?</year>
</workhead>
<workbody>

<text id="#{@poetId}#{today}01">
<head>
    <title></title>
    <firstline></firstline>
</head>
<body>
<poetry>
</poetry>
</body>
</text>

</workbody>
</kalliopework>
}
    writeXML('andre.xml', @andreXml)
end

if (@wantsPortraitsXml) 
    Dir.mkdir("static/images/#{@poetId}")

    @portraitsXml = %{<?xml version="1.0" encoding="UTF-8"?>
<pictures>
  <picture src="p1.jpg" primary="true" square-src="p1-square.jpg">
  </picture>
</pictures>
    }
    writeXML('portraits.xml', @portraitsXml)
end

