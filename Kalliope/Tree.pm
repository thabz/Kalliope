
#  Copyright (C) 2001 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$

package Kalliope::Tree;

use strict "vars"; 
use Carp;


#
# Dokumentation, så godt som det nu bliver  ----------------------------
# 
# Et Tree er et array af nodes.
# Hver node består af $parent,@fieldsData
# $parentid == 0 er topnodes.
# 
# Nodedata består af @fieldsData.
#
# Man kan trække den repræsenterende HTML og nødvendig Javascript ud.
# Selve træet er en <TABLE>. Første <TD> indeholder trægrafik
# og $fieldsData[0]. Resten af <TD>'erne indeholder $fieldsData[1..n]
#
# HTMLen som trækkes har $style, fra ;;new(), påklistret alle TD, TR, TABLE
# tags. Således er udseende af træet fuldstændigt styret udefra.
#
# Arbejdsgangen ved brug er følgende:
# 1) et kald af new():                         $myTree = Tree:new(...);
# 2) antal kald af addNode()                   $myTree->addNode(...);
# 3) et kald af getHTML()                      $myTree->getHTML();
# 4) et kald af getJavaScript()                $myTree->getJavaScript();
#
# Kort sagt, den HTML man har trukket ud, repræsenterer ikke længere træet
# hvis man senere tilføjer flere nodes.
#
# Man kan ikke fjerne nodes.
#
# I eens dokument skal HTMLen placeres før Javascriptet.
#

# ------------------------------------------------------------------------
# new 
#    IN: $style, $fieldsNum [,@fieldsTitles];
#
#

sub new {
    my ($class,$CSSclass,$gfxDir,$fieldsNum,@fieldsTitles) = @_;
    my %temp = ();
    my %tree = (
	'fieldsTitles' => \@fieldsTitles,
	'fieldsNum'    => $fieldsNum,
	'CSSclass'        => $CSSclass,
	'nodes'        => [],  # NodeId 0 er reserveret.
	'nodesNum'     => 0,
	'children'     => [],
	'gfxDir'       => $gfxDir,
	'expandUs'     => \%temp   # All children to expand in JS
    );
    bless \%tree, $class;
    return \%tree;
}

# ------------------------------------------------------------------------
#
# addNode
#    IN: $parentId,@fieldsData
#    OUT: $nodeid

sub addNode {
    my ($tree,$parentId,$show,@fieldsData) = @_;
    my $Id = ++$tree->{'nodesNum'};
    my %node = (
	'id' => $Id,
	'parent' => $parentId,
	'fieldsData' => \@fieldsData,
	'thisIsLastChild' => 1,
	'expandMe' => $show              # Expand tree to show this node
    );
    $tree->{'nodes'}[$Id] = \%node;
    
    # Mark this node as thisIsLastChild instead.
    my $prev = pop @{$tree->{'children'}[$parentId]};
    if (defined $prev) {
	$prev->{'thisIsLastChild'} = 0;
	push @{$tree->{'children'}[$parentId]},$prev;
    }
    
    # Add node to tree
    push @{$tree->{'children'}[$parentId]},\%node;

    #Propagate $show up the tree
    if ($show) {
	while ($parentId) {
	    $tree->{'expandUs'}{$parentId} = 1;
	    $parentId = $tree->{'nodes'}[$parentId]->{'parent'};
	}
    }

    return $Id;
}

# ------------------------------------------------------------------------
#
# getJavaScript
#

sub getJavaScript {
   my $tree = shift;
   my $gfxdir = $tree->{'gfxDir'};

   my ($node,$array);
   my $HTML = qq|\n<SCRIPT TYPE="text/javascript" LANGUAGE="javascript">\n|;

   # Arrays of arrays of children
   $HTML .= qq|TreeChildren = new Array ();\n|;
   foreach $node (@{$tree->{'nodes'}}) {
       my $Id = $node->{'id'} || 0;
       my @children = ();
       foreach my $child (@{$tree->{'children'}[$Id]}) {
	   push @children, $child->{'id'}
       }
       # Javascript suger!
       if ($#children == 0) {       # 1 barn
	   my $child = $children[0];
	   $HTML .= qq|TreeChildren[$Id] = new Array (1);\n|;
	   $HTML .= qq|TreeChildren[$Id][0] = $child;\n|;
       } elsif ($#children > 0)  {  # flere børn
	   $array = '('.(join ',',@children).')';
	   $HTML .= qq|TreeChildren[$Id] = new Array $array;\n|;
       }
   }

   # Array of elements to be initially expanded
   my @toExpandList;
   foreach (keys %{$tree->{'expandUs'}}) {
       if (defined @{$tree->{'children'}[$_]}) {
	   push @toExpandList,$_;
       }
   }
   if ($#toExpandList == 0) {
       $HTML .= qq|TreeToExpand = new Array (1);\n|;
       $HTML .= 'TreeToExpand[0] = '.$toExpandList[0].";\n";
   } else {
       $array = '('.(join ',',@toExpandList).')';
       $HTML .= qq|TreeToExpand = new Array $array;\n|;
   }

   # Code
   $HTML .= <<"EOF";

   function TreeNodeExpand (nodeId) {
       var i,gfxFile,gfxNode,type;
       if (document.getElementById('treeNodeGfx'+nodeId)) {
	   gfxNode = document.getElementById('treeNodeGfx'+nodeId);
	   type = gfxNode.getAttribute('NODETYPE');
	   if (type == 'L') {
	       gfxFile = '$gfxdir/TreeEndMinus.gif';
	   } else {
	       gfxFile = '$gfxdir/TreeTMinus.gif';
	   };
	   gfxNode.src = gfxFile;
	   gfxNode.onclick = new Function('TreeNodeCollapse('+nodeId+',1)');

	   // Show children
	   for(i = 0; i < TreeChildren[nodeId].length; i++) {
	       childId = TreeChildren[nodeId][i];
	       document.getElementById('treeRow'+childId).style.display = 'block';
	   }
       }
   }

   function TreeNodeCollapse (nodeId,first) {
       var i,type,gfxFile;
       if (!first) {
	   document.getElementById('treeRow'+nodeId).style.display = 'none';
       }

       // Change graphics if node has children
       if (TreeChildren[nodeId]) {
	   gfxNode = document.getElementById('treeNodeGfx'+nodeId);
	   type = gfxNode.getAttribute('NODETYPE');
	   if (type == 'L') {
	       gfxFile = '$gfxdir/TreeEndPlus.gif';
	   } else {
	       gfxFile = '$gfxdir/TreeTPlus.gif';
	   };
	   gfxNode.src = gfxFile;
	   gfxNode.onclick = new Function('TreeNodeExpand('+nodeId+')');

	   // Collapse children
	   for(i = 0; i < TreeChildren[nodeId].length; i++) {
	      TreeNodeCollapse(TreeChildren[nodeId][i],0);
	   }
       }
   
   }

   // Initial expansion
   for (j=0; j< TreeToExpand.length; j++) {
      TreeNodeExpand(TreeToExpand[j]);
   }
EOF

   $HTML .= qq|\n</SCRIPT>\n|;
   return $HTML;
}


# ------------------------------------------------------------------------
#
# getHTML
#    OUT: HTML for træet, hvilket består af en <TABLE>***</TABLE>.
#

sub getHTML {
    return $_[0]->_getHTML(1);
}

# -------------------------------------------------------------------------
# 
# getSimpleHTML
#    OUT: Return expanded static tree for older browsers.
#

sub getSimpleHTML {
    return $_[0]->_getHTML(0);
}


# --------------------------------------------------------------------------
# Private subs
#


sub _getHTML {
    my ($tree,$DOM_HTML) = @_;
    my $gfxdir = $tree->{'gfxDir'};
    
    my $class = ($tree->{'CSSclass'} eq '') ? '' : qq|class="$tree->{'CSSclass'}"|;
    # <TH>
    my @fieldsTitles = @{$tree->{'fieldsTitles'}};
    my $HTML = qq|\n<TABLE cellspacing=0 cellpadding=0 $class>\n|;
    if ($#fieldsTitles>0) {
	$HTML .= qq|<TR>|;
	foreach (@fieldsTitles) {
	    $HTML .= qq|<TH>$_</TH>|;
	}
	$HTML .= "</TR>\n";
    }

    # Resten af træet
    $HTML .= $tree->_doNode(0,'',$DOM_HTML);
    $HTML .= '</TABLE>';
    return $HTML;
}

sub _doNode {
    my ($tree,$nodeId,$prefixHTML,$DOM_HTML) = @_;
    my $gfxdir = $tree->{'gfxDir'};

    my ($HTML,$thisGfx,$subGfx);

    my $node = $tree->{'nodes'}[$nodeId];
    my $this_HasChildren = defined $tree->{'children'}[$nodeId] ? 1 : 0;
    my $this_isLastChild = $node->{'thisIsLastChild'};

    # Afgør hvilken grafik der skal bruges
    if ($this_isLastChild) {
	if ($this_HasChildren) {
	    if ($DOM_HTML) {
		$thisGfx = qq|<IMG alt="#" onclick="TreeNodeExpand($nodeId)" onfocus="blur()" ID="treeNodeGfx$nodeId" NODETYPE="L" SRC="$gfxdir/TreeEndPlus.gif">|;
	    } else {
		$thisGfx = qq|<IMG alt="#" SRC="$gfxdir/TreeEndMinus.gif">|;
	    }
	} else {
	    $thisGfx = qq|<IMG alt="#" SRC="$gfxdir/TreeEnd.gif">|;
	}
	$subGfx  = qq|<IMG alt="#" SRC="$gfxdir/TreeNone.gif">|;
    } else {
	if ($this_HasChildren) {
	    if ($DOM_HTML) {
		$thisGfx = qq|<IMG alt="#" onclick="TreeNodeExpand($nodeId)" onfocus="blur()" ID="treeNodeGfx$nodeId" NODETYPE="T" SRC="$gfxdir/TreeTPlus.gif">|;
	    } else {
		$thisGfx = qq|<IMG alt="#" SRC="$gfxdir/TreeTMinus.gif">|;
	    }
	} else {
	    $thisGfx = qq|<IMG alt="#" SRC="$gfxdir/TreeT.gif">|;
	}
	$subGfx  = qq|<IMG alt="#" SRC="$gfxdir/TreeLine.gif">|;
    }

    $subGfx = '' unless $nodeId;

    # Noden selv
    if ($nodeId) {   #Skip top node
	my @fieldsData = @{$node->{'fieldsData'}};
	my $fieldsNum = $tree->{'fieldsNum'};
	# Hide all but top nodes (we'll expand later in JS code)
	my $hideHTML = ($node->{'parent'} && $DOM_HTML) ? ' STYLE="display:none" ' : ''; 
	$HTML .= '<TR '.$hideHTML.' ID="treeRow'.$nodeId.'"><TD NOWRAP>'.$prefixHTML.$thisGfx.$fieldsData[0].'</TD>';
	if ($fieldsNum > 1) {
	    foreach my $i (1..($fieldsNum-1)) {
		$HTML .= '<TD>'.$fieldsData[$i].'</TD>';
	    }
	}
	$HTML .= "</TR>\n";
    }

# Børnene 
    if (defined $tree->{'children'}[$nodeId]) {
	foreach my $child (@{$tree->{'children'}[$nodeId]}) {
	    my $nodeId = $child->{'id'};
	    $HTML .= $tree->_doNode($child->{'id'},$prefixHTML.$subGfx,$DOM_HTML);
	}
    }
    return $HTML || '';
}

1;




