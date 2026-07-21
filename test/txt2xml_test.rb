require 'minitest/autorun'
require 'open3'
require 'rbconfig'
require 'rexml/document'
require 'rexml/xpath'
require 'tempfile'

class Txt2XmlTest < Minitest::Test
  ROOT = File.expand_path('..', __dir__)
  CONVERTER = File.join(ROOT, 'tools', 'txt2xml.rb')

  def test_prints_a_template_without_an_input_file
    output, error, status = Open3.capture3(RbConfig.ruby, CONVERTER)

    assert status.success?, error
    assert_includes output, "KILDE:\nDIGTER:"
    assert_includes output, "SEKTION:\nDIGTER:"
    assert_includes output, 'SLUTSEKTION'
  end

  def test_converts_work_and_text_metadata
    document = convert_and_parse(<<~TEXT)
      KILDE:Red.: <i>Digte</i>, København, 1852.
      DIGTER:vaerkejer
      FACSIMILE:scan.pdf
      FACSIMILE-SIDER:20
      FACSIMILE-OFFSET:2
      TITELBLAD:Digte / 1852
      ID:vaerk
      NOTE:Værknote
      TODO:Tjek værket

      T:Solnedgang
      TOCTITEL:Solnedgang i TOC
      INDEXTITEL:Solnedgang i indeks
      LINKTITEL:Solnedgang som link
      U:Første undertitel
      U:Anden undertitel
      F:Det spredes meer og meer
      ID:solnedgang
      DIGTER:hansenfj
      N:natur,aften
      NOTE:Tekstnote
      SIDE:3-3
      FACSIMILE-SIDE:5
      SKREVET:1851
      FREMFØRT:1852-01-01
      BEGIVENHED:1852
      SPROG:da
      VARIANT:anden-variant
      CREDITS:Indtastet af NN
      TODO:Tjek teksten

      Det _spredes_ =meer= og *meer*
      SLUT
    TEXT

    work = document.root
    workhead = REXML::XPath.first(document, '/kalliopework/workhead')
    text = REXML::XPath.first(document, '//text')
    head = REXML::XPath.first(text, 'head')

    assert_equal 'vaerk', work.attributes['id']
    assert_equal 'vaerkejer', work.attributes['author']
    assert_equal 'Digte', element_text(workhead, 'title')
    assert_equal '1852', element_text(workhead, 'year')
    assert_equal 'scan.pdf', REXML::XPath.first(workhead, 'source').attributes['facsimile']
    assert_equal '20', REXML::XPath.first(workhead, 'source').attributes['facsimile-pages-num']
    assert_equal '2', REXML::XPath.first(workhead, 'source').attributes['facsimile-pages-offset']

    assert_equal 'solnedgang', text.attributes['id']
    assert_equal 'hansenfj', text.attributes['author']
    assert_equal 'anden-variant', text.attributes['variant']
    assert_equal 'da', text.attributes['lang']
    assert_equal 'Solnedgang', element_text(head, 'title')
    assert_equal 'Solnedgang i TOC', element_text(head, 'toctitle')
    assert_equal 'Solnedgang i indeks', element_text(head, 'indextitle')
    assert_equal 'Solnedgang som link', element_text(head, 'linktitle')
    assert_equal %w[Første\ undertitel Anden\ undertitel],
                 REXML::XPath.match(head, 'subtitle/line').map(&:text)
    assert_equal 'Det spredes meer og meer', element_text(head, 'firstline')
    assert_equal 'natur,aften', element_text(head, 'keywords')
    assert_equal '1851', element_text(head, 'dates/written')
    assert_equal '1852-01-01', element_text(head, 'dates/performed')
    assert_equal '1852', element_text(head, 'dates/event')

    source = REXML::XPath.first(head, 'source')
    assert_equal '3', source.attributes['pages']
    assert_equal '5', source.attributes['facsimile-pages']
    assert_equal %w[Tekstnote Indtastet\ af\ NN],
                 REXML::XPath.match(head, 'notes/note').map(&:text)
    assert_equal 'credits', REXML::XPath.match(head, 'notes/note')[1].attributes['type']
    assert_equal %w[i w b], REXML::XPath.match(text, 'body/poetry/*').map(&:name)
  end

  def test_section_author_is_emitted_without_repeating_it_on_texts
    document = convert_and_parse(<<~TEXT)
      KILDE:<i>Antologi</i> 1872
      DIGTER:antologierdk
      ID:1872

      SEKTION:F. J. Hansen

      DIGTER:hansenfj

      T:Solnedgang
      F:Det spredes meer og meer
      ID:solnedgang

      Det spredes meer og meer

      T:Et andet digt
      F:En anden førstelinje
      ID:andet

      En anden førstelinje
      SLUTSEKTION

      T:Uden for sektionen
      F:Værkets egen forfatter
      ID:udenfor

      Værkets egen forfatter
      SLUT
    TEXT

    section = REXML::XPath.first(document, '//section')
    texts = texts_by_id(document)

    assert_equal 'hansenfj', section.attributes['author']
    assert_nil texts['solnedgang'].attributes['author']
    assert_nil texts['andet'].attributes['author']
    assert_nil texts['udenfor'].attributes['author']
    assert_equal section, containing_section(texts['solnedgang'])
    assert_equal section, containing_section(texts['andet'])
    assert_nil containing_section(texts['udenfor'])
  end

  def test_nested_sections_override_and_restore_authors
    document = convert_and_parse(<<~TEXT)
      KILDE:<i>Antologi</i> 1872
      DIGTER:antologierdk
      ID:1872

      SEKTION:Ydre
      DIGTER:ydre-digter

      T:Ydre digt
      F:Ydre førstelinje
      ID:ydre

      Ydre førstelinje

      SEKTION2:Indre
      DIGTER:indre-digter

      T:Indre digt
      F:Indre førstelinje
      ID:indre

      Indre førstelinje
      SEKTIONSLUT

      T:Ydre igen
      F:Ydre igen førstelinje
      ID:ydre-igen

      Ydre igen førstelinje
      SLUTSEKTION

      T:Udenfor
      F:Udenfor førstelinje
      ID:udenfor

      Udenfor førstelinje
      SLUT
    TEXT

    sections = REXML::XPath.match(document, '//section')
    texts = texts_by_id(document)

    assert_equal 'ydre-digter', sections[0].attributes['author']
    assert_nil sections[0].attributes['level']
    assert_equal 'indre-digter', sections[1].attributes['author']
    assert_equal '2', sections[1].attributes['level']
    assert_equal sections[0], containing_section(texts['ydre'])
    assert_equal sections[1], containing_section(texts['indre'])
    assert_equal sections[0], containing_section(texts['ydre-igen'])
    assert_nil containing_section(texts['udenfor'])
  end

  def test_a_text_author_overrides_a_section_and_is_reset_for_the_next_text
    document = convert_and_parse(<<~TEXT)
      KILDE:<i>Antologi</i> 1872
      DIGTER:antologierdk

      SEKTION:En digter
      DIGTER:sektionsdigter

      T:Gæstedigt
      DIGTER:gaestedigter
      F:Gæstens førstelinje
      ID:gaest

      Gæstens førstelinje

      T:Sektionens digt
      F:Sektionens førstelinje
      ID:sektion

      Sektionens førstelinje
      SLUTSEKTION
      SLUT
    TEXT

    texts = texts_by_id(document)

    assert_equal 'gaestedigter', texts['gaest'].attributes['author']
    assert_nil texts['sektion'].attributes['author']
  end

  def test_a_numbered_section_without_digter_has_no_author
    document = convert_and_parse(<<~TEXT)
      KILDE:<i>Antologi</i> 1872
      DIGTER:antologierdk

      SEKTION12:Tillæg

      T:Et digt
      F:En førstelinje
      ID:digt

      En førstelinje
      SLUTSEKTION
      SLUT
    TEXT

    section = REXML::XPath.first(document, '//section')

    assert_nil section.attributes['author']
    assert_equal '12', section.attributes['level']
  end

  def test_converts_prose_and_body_type_changes
    document = convert_and_parse(<<~TEXT)
      KILDE:<i>Prosa</i> 1900
      DIGTER:digter
      DATO:20260721

      T:Prosatekst
      TYPE:prose

      Første afsnit
      TYPE:quote
      Et citat

      T:Digt
      F:Første vers

      Første vers
      SLUT
    TEXT

    texts = REXML::XPath.match(document, '//text')

    assert_equal %w[digter2026072101 digter2026072102],
                 texts.map { |text| text.attributes['id'] }
    assert_equal %w[prose quote],
                 REXML::XPath.match(texts[0], 'body/*').map(&:name)
    assert_equal ['poetry'], REXML::XPath.match(texts[1], 'body/*').map(&:name)
  end

  def test_rejects_blank_facsimile_page_count
    assert_conversion_fails(<<~TEXT, 'FEJL: FACSIMILE-SIDER er blank')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter
      FACSIMILE-SIDER:
    TEXT
  end

  def test_requires_page_numbers_when_a_facsimile_is_configured
    assert_conversion_fails(<<~TEXT, 'mangler sideangivelse')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter
      FACSIMILE:scan.pdf

      T:Digt
      F:Første vers

      Første vers
      SLUT
    TEXT
  end

  def test_rejects_incomplete_page_ranges
    assert_conversion_fails(<<~TEXT, 'har kun halv sideangivelse: 7-')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter
      FACSIMILE:scan.pdf

      T:Digt
      F:Første vers
      SIDE:7-

      Første vers
      SLUT
    TEXT
  end

  def test_requires_a_firstline_for_poetry
    assert_conversion_fails(<<~TEXT, 'mangler førstelinje')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter

      T:Digt

      Et vers
      SLUT
    TEXT
  end

  def test_rejects_duplicate_firstlines
    assert_conversion_fails(<<~TEXT, 'har mere end én F:')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter

      T:Digt
      F:Første vers
      F:Andet første vers

      Første vers
      SLUT
    TEXT
  end

  def test_rejects_spaces_in_keywords
    assert_conversion_fails(<<~TEXT, 'har mellemrum i sine nøgleord')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter

      T:Digt
      F:Første vers
      N:to ord

      Første vers
      SLUT
    TEXT
  end

  def test_rejects_unknown_text_headers
    assert_conversion_fails(<<~TEXT, 'Unknown header-line: UKENDT:værdi')
      KILDE:<i>Digte</i> 1900
      DIGTER:digter

      T:Digt
      F:Første vers
      UKENDT:værdi

      Første vers
      SLUT
    TEXT
  end

  private

  def convert(input)
    Tempfile.create(['txt2xml', '.txt']) do |file|
      file.write(input)
      file.flush
      return Open3.capture3(RbConfig.ruby, CONVERTER, file.path)
    end
  end

  def convert_and_parse(input)
    output, error, status = convert(input)
    assert status.success?, error
    REXML::Document.new(output)
  end

  def assert_conversion_fails(input, message)
    _output, error, status = convert(input)
    refute status.success?
    assert_includes error, message
  end

  def texts_by_id(document)
    REXML::XPath.match(document, '//text').to_h do |text|
      [text.attributes['id'], text]
    end
  end

  def containing_section(element)
    current = element.parent
    until current.nil? || current.is_a?(REXML::Document)
      return current if current.name == 'section'

      current = current.parent
    end
    nil
  end

  def element_text(element, path)
    REXML::XPath.first(element, path)&.text
  end
end
