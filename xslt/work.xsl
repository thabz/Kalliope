<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="html"/>

  <xsl:template match="/">
     <xsl:apply-templates/>
  </xsl:template>

  <xsl:template match="book">
     <html><head><title>Preview</title>
     <link rel="stylesheet" type="text/css" href="../../xslt/work.css"/> 
     </head>
     <body>

     <div class="poem">
       <h1><i><xsl:value-of select="head/title"/></i> (<xsl:value-of select="head/date"/>)</h1>

        <h2>Indholdsfortegnelse</h2>
        <xsl:for-each select="content/poem">
	<xsl:variable name="myid" select="@id"/>
            <a class="black" href="#{$myid}">
  	      <xsl:value-of select="title"/><br/>
	    </a>
       </xsl:for-each>
     </div>
     <xsl:apply-templates/>
  </body></html>
  </xsl:template>


  <!-- Templates -->

  <xsl:template match="head/title">
  <h1>
      <xsl:apply-templates/>
  </h1>
  </xsl:template>

  <xsl:template match="poem">
    <xsl:variable name="myid" select="@id"/>
       <a name="{$myid}"></a>

     <table><tr><td valign="top">
     <div class="poem">
       <h2>
        <xsl:value-of select="title"/>
       </h2>
       <small>
         <xsl:value-of select="subtitle"/>
       </small>
       <pre class="poem">
         <xsl:value-of select="content"/>
      </pre>
    </div>
    </td>
    <td valign="top">
<!--      <div class="note">
        <xsl:value-of select="note"/>
      </div>
-->      
       <xsl:apply-templates/> 
    </td>
    </tr></table>
  </xsl:template>

  <xsl:template match="poem/title">
  </xsl:template>

  <xsl:template match="poem/firstline">
  </xsl:template>

  <xsl:template match="poem/toc-title">
  </xsl:template>

  <xsl:template match="poem/subtitle">
  </xsl:template>

  <xsl:template match="head/title">
  </xsl:template>

  <xsl:template match="i">
     <i>
       <xsl:apply-templates/>
     </i>
  </xsl:template>

  <xsl:template match="w">
     <span class="spatiering">
       <xsl:apply-templates/>
     </span>
  </xsl:template>

  <xsl:template match="head/date">
  </xsl:template>

  <xsl:template match="poem/content">
  </xsl:template>

  <xsl:template match="note">
  <div class="note">
      <xsl:apply-templates/>
  </div>
  </xsl:template>

  <xsl:template match="p">
  <p>
      <xsl:apply-templates/>
  </p>
  </xsl:template>
</xsl:stylesheet>

