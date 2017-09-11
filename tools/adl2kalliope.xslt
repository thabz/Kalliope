<?xml version="1.0"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml" indent="yes"/>

<!-- Nedenstående virker kun hvis xmlns="...." fjernes fra kildes rodelement TEI -->
<!-- Brug xsltproc adl2kalliope.xslt adl-xml-fil -->

<xsl:template match="teiHeader">
    <title><xsl:value-of select="fileDesc/titleStmt/title"/></title>
</xsl:template>

<!-- vers -->
<xsl:template match="l">
    <xsl:apply-templates/>
    <xsl:text>&#xa;</xsl:text> 
</xsl:template>

<xsl:template match="hi[contains(@rend, 'italics')]">
    <i><xsl:apply-templates/></i>
</xsl:template>

<!-- paragraph-->
<xsl:template match="p">
    <xsl:apply-templates/>
    <xsl:text>&#xa;</xsl:text> 
</xsl:template>

<xsl:template match="sp">
    <xsl:apply-templates/>
    <xsl:text>&#xa;</xsl:text> 
</xsl:template>

<xsl:template match="speaker">
    <center><nonum><sc><xsl:apply-templates/></sc></nonum></center><xsl:text>&#xa;</xsl:text>
</xsl:template>

<xsl:template match="stage">
    <center><nonum><small><xsl:apply-templates/></small></nonum></center><xsl:text>&#xa;</xsl:text> 
</xsl:template>

<!-- linegroup / strofe -->
<xsl:template match="lg">
   <xsl:apply-templates select="l"/>
    <xsl:text>&#xa;</xsl:text> 
</xsl:template>

<xsl:template match="lg[last()]">
   <xsl:apply-templates select="l"/>
</xsl:template>

<!-- Digte -->
<xsl:template match="//div">
  <!-- digt div har et decls-attribute. Det har section div'er ikke -->    
  <xsl:param name="number"/>
  <poem id="XXX{$number}{position()}"><xsl:text>&#xa;</xsl:text>
    <head><xsl:text>&#xa;</xsl:text>
      <xsl:text>    </xsl:text><title><xsl:value-of select="head"/></title><xsl:text>&#xa;</xsl:text>
      <xsl:text>    </xsl:text><firstline>xx</firstline><xsl:text>&#xa;</xsl:text>
    </head><xsl:text>&#xa;</xsl:text>
    <body><xsl:text>&#xa;</xsl:text>
        <xsl:apply-templates select="lg|p|sp"/>
    </body><xsl:text>&#xa;</xsl:text>
  </poem><xsl:text>&#xa;</xsl:text><xsl:text>&#xa;</xsl:text>
</xsl:template>

<!-- Section -->
<!--
<xsl:template match="div[not(@decls)]">
  <section>
    <head>
        <toctitle><xsl:value-of select="head"/></toctitle>
    </head>
    <content><xsl:text>&#xa;</xsl:text>
        <xsl:apply-templates select="div">
            <xsl:with-param name="number" select="position()"/>
      </xsl:apply-templates>
    </content>
  </section>
</xsl:template>
-->
<xsl:template match="/">
  <kalliopework>
  <workhead>
      <xsl:apply-templates select="//TEI/teiHeader"/>
  </workhead>
  <workbody>
      <xsl:apply-templates select="//TEI/text/body//div"/>
  </workbody>
  </kalliopework>
</xsl:template>

<xsl:template match="//body">
  <workbody>      
      <xsl:apply-templates select="//body/div">
        <xsl:with-param name="number" select="position()"/>
      </xsl:apply-templates>
  </workbody>
</xsl:template>

</xsl:stylesheet>
