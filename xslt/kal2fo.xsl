<?xml version="1.0" encoding="ISO-8859-1"?>
<!-- xq503.xsl: converts xq502.xml into xq504.xml -->
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:fo="http://www.w3.org/1999/XSL/Format">

  <xsl:template match="/">

    <fo:root>
      
      <fo:layout-master-set>

        <!-- begin: first page -->
        <fo:simple-page-master>
          <fo:region-body margin-top="36pt"
                          margin-bottom="36pt" 
			  margin-left="36pt"
                          margin-right="36pt"/>
          <fo:region-before extent="3cm"/>
          <fo:region-after extent="1cm"/>
        </fo:simple-page-master>

      </fo:layout-master-set>

      <fo:page-sequence initial-page-number="1">

    <!-- header -->
    <fo:static-content flow-name="xsl-region-before">
      <fo:block border-bottom-style="solid" margin-right="30pt" text-align="end" 
            font-size="10pt" 
            font-family="serif" 
            line-height="14pt" >
            side <fo:page-number/>
      </fo:block>
    </fo:static-content> 

    <!-- footer -->
    <fo:static-content flow-name="xsl-region-after">
      <fo:block border-top-style="solid" 
            margin-right="36pt"
            margin-left="36pt"
	    margin-top="12pt"
            text-align="end" 
            font-size="14pt" 
            font-family="serif">
            <fo:page-number/>
      </fo:block>
    </fo:static-content> 

    <fo:flow flow-name="xsl-region-body">
        <xsl:apply-templates/>
        </fo:flow>
      </fo:page-sequence>

    </fo:root>
  </xsl:template>


  <xsl:template match="content">
    <!-- Table of contents -->
    <fo:block font-size="14pt" font-family="Times" break-before="page">
      <fo:block space-after.optimum="14pt" font-size="18pt" font-weight="bold">
        Indholdsfortegnelse
      </fo:block>
      <xsl:for-each select="poem">
        <xsl:variable name="myid" select="@id"/>
        <fo:block>
          <fo:basic-link internal-destination="{$myid}">
	    <xsl:value-of select="title"/>
          </fo:basic-link>
	  <fo:leader leader-alignment="reference-area" leader-pattern-width="10pt" leader-pattern="dots"/>
	  <fo:page-number-citation ref-id="{$myid}"/>
        </fo:block>   
      </xsl:for-each>

        <fo:block font-weight="bold" space-before.optimum="14pt">
          <fo:basic-link internal-destination="titleregistry">
	     Register over digttitler 
          </fo:basic-link>
	  <fo:leader leader-alignment="reference-area" leader-pattern-width="10pt" leader-pattern="dots"/>
	  <fo:page-number-citation ref-id="titleregistry"/>
        </fo:block>   

        <fo:block font-weight="bold" space-before.optimum="14pt">
          <fo:basic-link internal-destination="firstlineregistry">
	     Register over førsteliner
          </fo:basic-link>
	  <fo:leader leader-alignment="reference-area" leader-pattern-width="10pt" leader-pattern="dots"/>
	  <fo:page-number-citation ref-id="firstlineregistry"/>
        </fo:block>   


    </fo:block>

    <!-- Poems -->
    <xsl:apply-templates/>

    <!-- Poem titles -->
    <fo:block id="titleregistry" font-size="14pt" font-family="Times" break-before="page">
      <fo:block space-after.optimum="14pt" font-size="18pt" font-weight="bold">
        Register over digttitler 
      </fo:block>
      <xsl:for-each select="poem">
        <xsl:sort select="title" data-type="text" order="ascending"/>
	<xsl:variable name="myid" select="@id"/>
        <fo:block>
          <fo:basic-link internal-destination="{$myid}">
	    <xsl:value-of select="title"/>
          </fo:basic-link>
	  <fo:leader leader-alignment="reference-area" leader-pattern-width="10pt" leader-pattern="dots"/>
	  <fo:page-number-citation ref-id="{$myid}"/>
        </fo:block>   
      </xsl:for-each>
    </fo:block>


    <!-- Firstlines -->
    <fo:block id="firstlineregistry" font-size="14pt" font-family="Times" break-before="page">
      <fo:block space-after.optimum="14pt" font-size="18pt" font-weight="bold">
        Register over førstelinier
      </fo:block>
      <xsl:for-each select="poem">
        <xsl:sort select="firstline" data-type="text" order="ascending"/>
        <fo:block>
	  <xsl:variable name="myid" select="@id"/>
          <fo:basic-link internal-destination="{$myid}">
	    <xsl:value-of select="firstline"/>
          </fo:basic-link>
	  <fo:leader leader-alignment="reference-area" leader-pattern-width="10pt" leader-pattern="dots"/>
	  <fo:page-number-citation ref-id="{$myid}"/>
        </fo:block>   
      </xsl:for-each>
    </fo:block>

    
  </xsl:template>

  <!-- Templates -->

  <xsl:template match="head/title">
    <fo:block text-align="center" space-before.optimum="100pt" space-after.optimum="100pt" font-size="24pt">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="head/author">
    <fo:block  text-align="center" space-after.optimum="100pt" font-size="18pt">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="head/date">
    <fo:block  text-align="center" space-after.optimum="16pt" font-size="18pt">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="poem/title">
    <fo:block  space-after.optimum="14pt" font-size="18pt" font-weight="bold">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>
   

  <xsl:template match="poem">
     <xsl:variable name="myid" select="@id"/>
     <fo:block id="{$myid}" font-size="12pt" font-family="Times" break-before="page">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="poem/firstline">
  </xsl:template>

  <xsl:template match="poem/verse">
    <fo:block space-before.optimum="6pt" space-after.optimum="6pt"
              keep-together.within-page="200">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="line">
    <fo:block font-size="14pt" font-family="Times">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="i">
    <fo:inline font-style="italic">
      <xsl:apply-templates/>
    </fo:inline>
  </xsl:template>

  <xsl:template match="footnote">
    <fo:footnote>
      <fo:inline font-size="10pt" vertical-align="super"><xsl:number level="any" from="poem" format="1"/></fo:inline> 
    
      <fo:footnote-body>
        <fo:block font-size="10pt">
	  <xsl:number level="any" from="poem" format="1. "/>
          <xsl:apply-templates/>
        </fo:block>
      </fo:footnote-body>   
    </fo:footnote>
  </xsl:template>
  

</xsl:stylesheet>

