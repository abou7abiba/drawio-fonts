/**
 * $Id: mxIBMShape.js,v 1.0 2022/04/30 17:00:00 mate Exp $
 * Copyright (c) 2022, JGraph Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


//**********************************************************************************************************************************************************
// Base Shapes
//**********************************************************************************************************************************************************

function mxIBMShapeBase(bounds, fill, stroke, strokewidth)
{
	const ibmConfigured = Editor.configure(ibmConfig, true);
	mxShape.call(this, bounds, fill, stroke, strokewidth);
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth : 1;
};

mxUtils.extend(mxIBMShapeBase, mxShape);

mxIBMShapeBase.prototype.cst = ibmConfig.ibmBaseConstants; 

mxIBMShapeBase.prototype.customProperties = ibmConfig.ibmBaseProperties;

// Convert RGB values to hex values.
mxIBMShapeBase.prototype.rgb2hex = function(color)
{
	if (color.toUpperCase().startsWith('RGB'))
	{
		let rgb = color.split(',');
		let r = parseInt(rgb[0].substring(4));
		let g = parseInt(rgb[1]);
		let b = parseInt(rgb[2]);
		var rhex = Number(r).toString(16)
		rhex = (rhex.length < 2) ? "0" + rhex : rhex;
		var ghex = Number(r).toString(16)
		ghex = (ghex.length < 2) ? "0" + ghex : ghex;
		var bhex = Number(r).toString(16)
		bhex = (bhex.length < 2) ? "0" + bhex : bhex;
		return "#" + rhex.toString() + ghex.toString() + bhex.toString();
	}
	else
		return color;
}

// Normalize line color.
mxIBMShapeBase.prototype.normalizeLineColor = function(lineColor)
{
}

// Normalize font/icon/style color to be visible if lineColor is too dark.
mxIBMShapeBase.prototype.normalizeFontColor = function(fontColor, lineColor)
{
	if (lineColor === "none")
		return fontColor;
	else if (lineColor === ibmConfig.ibmColors.black)
		return ibmConfig.ibmColors.white;

	lineColor = lineColor.toUpperCase();
	let name = ibmConfig.colorNames[lineColor.substring(1)];
	let segments = name.split(' ');

	for (var index = 0; index < segments.length; index++)
	{
		code = parseInt(segments[index]);
		if (!isNaN(code) && code >= 50)
			return ibmConfig.ibmColors.white;
	}

	return fontColor;
}

// Normalize fill color to match line color.
mxIBMShapeBase.prototype.normalizeFillColor = function(fillColor, lineColor)
{
	let fillColorHex = this.rgb2hex(fillColor);
        let fillColorUpper = fillColorHex.toUpperCase();
        let fillColorName = ibmConfig.colorNames[(fillColorUpper === "NONE") ? "NONE" : fillColorUpper.substring(1)];

	let lineColorHex = this.rgb2hex(lineColor);
        let lineColorUpper = lineColorHex.toUpperCase();
        let lineColorName = ibmConfig.colorNames[(lineColorUpper === "NONE") ? "NONE" : lineColorUpper.substring(1)];

        if (fillColorName === "NONE")
		return "none";
	else if (fillColorName === "White")
                return ibmConfig.ibmColors.white; 
        else if (fillColorName === "Black" || fillColorName === "Transparent")
                return ibmConfig.ibmColors.none; 
	else {
                let lineColorSegments = lineColorName.toLowerCase().split(' ');
                let lineColorFamily = lineColorSegments[0];

                if (lineColorSegments[1] === "gray")
                        lineColorFamily = lineColorFamily + "gray";

                return ibmConfig.ibmColors["light" + lineColorFamily]; 
        }
}

// Retrieve color settings.
mxIBMShapeBase.prototype.getColors = function(shape, shapeType, shapeLayout)
{
	// Retrieve color settings.
	let lineColor = mxUtils.getValue(shape.state.style, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
	let fillColor = mxUtils.getValue(shape.state.style, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
	let fontColor = mxUtils.getValue(shape.state.style, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);
	let badgeColor = mxUtils.getValue(shape.state.style, this.cst.BADGE_COLOR, this.cst.BADGE_COLOR_DEFAULT);

	let badgeFontColor = fontColor;
	let iconColor = fontColor;
	let iconAreaColor = (shapeType.startsWith('group')) ? 'none' : lineColor;
	let styleColor = lineColor;

	// Set line color to black if not set otherwise use line color.
	lineColor = (lineColor === this.cst.LINE_COLOR_DEFAULT) ? ibmConfig.ibmColors.black : this.rgb2hex(lineColor);

	// Set fill color to transparent if not set otherwise use fill color.
	fillColor = (fillColor === this.cst.FILL_COLOR_DEFAULT) ? ibmConfig.ibmColors.none : this.rgb2hex(fillColor);

	// Set fill color to same as line color for legend color items.
	fillColor = (shapeLayout === 'itemColor') ? lineColor : fillColor;

	// Set font and icon colors to black if not set otherwise use font color.
	fontColor = (fontColor === this.cst.FONT_COLOR_DEFAULT) ? ibmConfig.ibmColors.black : this.rgb2hex(fontColor);

	// Normalize font color to be visible for expanded target shape type.
	fontColor = (shapeType === 'target' && shapeLayout.startsWith('expanded')) ? this.normalizeFontColor(fontColor, iconAreaColor) : fontColor;

	// Set badge color to line color if not set otherwise use badge color.
	badgeColor = (badgeColor === this.cst.BADGE_COLOR_DEFAULT) ? lineColor : this.rgb2hex(badgeColor);

	// Normalize badge font color to be visible if badge color is too dark.
	badgeFontColor = this.normalizeFontColor(badgeFontColor, badgeColor);

	// Normalize icon color to be visible if icon area color is too dark.
	iconColor = this.normalizeFontColor(ibmConfig.ibmColors.black, iconAreaColor);

	// Set icon color to black for legend icon items.
	iconColor = (shapeLayout === 'itemIcon') ? ibmConfig.ibmColors.black : iconColor;

	// Normalize style color to be visibile if icon area color is too dark.
	styleColor = this.normalizeFontColor(styleColor, iconAreaColor);

	// Set icon color to black for legend style items.
	styleColor = (shapeLayout === 'itemStyle') ? ibmConfig.ibmColors.black : styleColor;

	return {'lineColor': lineColor,
		'fillColor': fillColor, 
		'fontColor': fontColor, 
		'badgeColor': badgeColor,
		'badgeFontColor': badgeFontColor,
		'iconColor': iconColor,
		'iconAreaColor': iconAreaColor,
		'styleColor': styleColor};
}

// Retrieve size and color details.
mxIBMShapeBase.prototype.getDetails = function(shape, shapeType, shapeLayout, shapeHeight, shapeWidth)
{
	let details = {};

	// Get shape-specific sizes.
	
	if (shapeLayout === 'collapsed') {
		if (shapeType === 'target') 
			details = ibmConfig.ibmShapeSizes.collapsedTarget;
		else if (shapeType === 'actor') 
			details = ibmConfig.ibmShapeSizes.collapsedActor;
		else
			details = ibmConfig.ibmShapeSizes.collapsed;

		details['shapeHeight'] = shapeHeight;
		details['shapeWidth'] = shapeWidth;
	}
	else if (shapeLayout.startsWith('expanded')) {
		if (shapeType === 'target') 
			details = ibmConfig.ibmShapeSizes.expandedTarget;
		else if (shapeType.startsWith('group')) 
			details = ibmConfig.ibmShapeSizes.group;
		else
			details = ibmConfig.ibmShapeSizes.expanded;

		details['shapeHeight'] = shapeHeight;
		details['shapeWidth'] = shapeWidth;
	}
	else if (shapeLayout.startsWith('item')) {
		if (shapeLayout === 'itemStyle' || shapeLayout === 'itemColor' || shapeLayout === 'itemBadge')
			details = ibmConfig.ibmShapeSizes.itemStyleColorBadge;
		else if (shapeLayout === 'itemIcon' && shapeType === 'target') 
			details = ibmConfig.ibmShapeSizes.itemTarget;
		else if (shapeLayout === 'itemIcon' && shapeType === 'actor') 
			details = ibmConfig.ibmShapeSizes.itemActor;
		else if (shapeLayout === 'itemShape' || shapeLayout === 'itemIcon')
			details = ibmConfig.ibmShapeSizes.itemShapeIcon;

		details['shapeHeight'] = details.defaultHeight;
		details['shapeWidth'] = details.defaultWidth;
	}
	else
		details = ibmConfig.ibmShapeSizes.empty;

	// Add shape colors.
	
	if (shape) {
		let colors = this.getColors(shape, shapeType, shapeLayout);

		details['lineColor'] = colors.lineColor;
		details['fillColor'] = colors.fillColor;
		details['fontColor'] = colors.fontColor;
		details['badgeColor'] = colors.badgeColor;
		details['badgeFontColor'] = colors.badgeFontColor;
		details['iconColor'] = colors.iconColor;
		details['iconAreaColor']  = colors.iconAreaColor;
		details['styleColor']  = colors.styleColor;
	}

	return details;
}

// Get properties corresponding to shape layout and convert to styles.
mxIBMShapeBase.prototype.getCellStyles = function(shapeLayout)
{
	let properties = '';
	let styles = {};

	// Get shape-specific properties.
	
	if (shapeLayout === "collapsed")
		// Add collapsed text properties and remove expanded stack and container properties.
		properties = ibmConfig.ibmSystemProperties.collapsedText + ibmConfig.ibmSystemProperties.expandedStackNull + ibmConfig.ibmSystemProperties.containerNull;
	else if (shapeLayout === "expanded")
		// Add expanded text and container properties and remove expanded stack properties.
		properties = ibmConfig.ibmSystemProperties.expandedText + ibmConfig.ibmSystemProperties.container + ibmConfig.ibmSystemProperties.expandedStackNull;
	else if (shapeLayout === "expandedStack")
		// Add expanded text, expanded stack properties, and container properties.
		properties = ibmConfig.ibmSystemProperties.expandedText + ibmConfig.ibmSystemProperties.expandedStack + ibmConfig.ibmSystemProperties.container;
	else if (shapeLayout.startsWith("group"))
		// Add expanded text and container properties and remove expanded stack properties.
		properties = ibmConfig.ibmSystemProperties.expandedText + ibmConfig.ibmSystemProperties.container + ibmConfig.ibmSystemProperties.expandedStackNull;
	else
		// Remove expanded stack and container properties.
		properties = ibmConfig.ibmSystemProperties.expandedStackNull + ibmConfig.ibmSystemProperties.containerNull;

	// Convert properties to a style dictionary.
	
	properties = properties.slice(0, -1); // Remove trailing semicolon.

	let array = properties.split(';');

	for (var index = 0; index < array.length; index++)
	{
		element = array[index].split('=');
		if (element[1] === 'null')
			styles[element[0]] = null;
		else	
			styles[element[0]] = element[1];
	}

	return styles;
}

// Set cell styles.
mxIBMShapeBase.prototype.setCellStyles = function(graph, shapeType)
{
	let cells = graph.getSelectionCells();
	let styles = this.getCellStyles(shapeType);

	for (let key in styles)
		graph.setCellStyles(key, styles[key], cells);
};




//**********************************************************************************************************************************************************
// Legends
//**********************************************************************************************************************************************************

function mxIBMShapeLegend(bounds, fill, stroke, strokewidth)
{
	mxShape.call(this);
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth : 1;
};

mxUtils.extend(mxIBMShapeLegend, mxShape);

mxIBMShapeLegend.prototype.cst = ibmConfig.ibmLegendConstants; 

mxIBMShapeLegend.prototype.customProperties = ibmConfig.ibmLegendProperties;




//**********************************************************************************************************************************************************
// Deployment Units
//**********************************************************************************************************************************************************

function mxIBMShapeUnit(bounds, fill, stroke, strokewidth)
{
	mxShape.call(this);
	this.bounds = bounds;
	this.fill = fill;
	this.stroke = stroke;
	this.strokewidth = (strokewidth != null) ? strokewidth : 1;
};
 
mxUtils.extend(mxIBMShapeUnit, mxShape);
 
mxIBMShapeUnit.prototype.cst = ibmConfig.ibmUnitConstants;
 
mxIBMShapeUnit.prototype.customProperties = ibmConfig.ibmUnitProperties;




mxCellRenderer.registerShape(mxIBMShapeBase.prototype.cst.SHAPE, mxIBMShapeBase);
mxCellRenderer.registerShape(mxIBMShapeLegend.prototype.cst.SHAPE, mxIBMShapeLegend);
mxCellRenderer.registerShape(mxIBMShapeUnit.prototype.cst.SHAPE, mxIBMShapeUnit);