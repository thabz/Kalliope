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
          <fo:region-after extent="3cm"/>
        </fo:simple-page-master>

      </fo:layout-master-set>

      <fo:page-sequence  initial-page-number="1">

    <!-- header -->
    <fo:static-content flow-name="xsl-region-before">
      <fo:block text-align="end" 
            font-size="10pt" 
            font-family="serif" 
            line-height="14pt" >
            side <fo:page-number/>
      </fo:block>
    </fo:static-content> 

    <fo:static-content flow-name="xsl-region-after">
      <fo:block text-align="end" 
            font-size="10pt" 
            font-family="serif" 
            line-height="14pt" >
            side <fo:page-number/>
      </fo:block>
    </fo:static-content> 

        <fo:flow flow-name="xsl-region-body">
          <xsl:apply-templates/>
        </fo:flow>
      </fo:page-sequence>

    </fo:root>

  </xsl:template>

  <xsl:template match="content">
    <fo:block font-size="10pt" font-family="Times" break-before="page">
      <fo:block>Indholdsfortegnelse</fo:block>
      <xsl:for-each select="poem">
        <fo:block>
	  <xsl:value-of select="title"/>
          <xsl:variable name="myid" select="@id"/>     	   
	  ... side 
	  <fo:page-number-citation ref-id="{$myid}"/>
        </fo:block>   
      </xsl:for-each>
    </fo:block>
    <xsl:apply-templates/>
  </xsl:template>


  <xsl:template match="poem">
     <xsl:variable name="myid" select="@id"/>
    <fo:block id="{$myid}" font-size="12pt" font-family="Times" break-before="page">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="title">
    <fo:block  space-after.optimum="12pt">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="verse">
    <fo:block space-before.optimum="6pt" space-after.optimum="6pt"
              keep-together.within-page="10">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="line">
    <fo:block font-size="10pt" font-family="Times">
      <xsl:apply-templates/>
    </fo:block>
  </xsl:template>

  <xsl:template match="i"><!-- proper names -->
    <fo:inline font-style="italic">
      <xsl:apply-templates/>
    </fo:inline>
  </xsl:template>

</xsl:stylesheet>

