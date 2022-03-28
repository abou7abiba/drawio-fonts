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
	return lineColor;
}

// Normalize fill color and line color.
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
	else if (fillColorName.startsWith("White"))
                return ibmConfig.ibmColors.white;
        else if (fillColorName.startsWith("Black") || fillColorName.startsWith("Transparent"))
                return ibmConfig.ibmColors.none;
	else {
                let lineColorSegments = lineColorName.toLowerCase().split(' ');
                let lineColorFamily = lineColorSegments[0];

                if (lineColorSegments[1] === "gray")
                        lineColorFamily = lineColorFamily + "gray";

                return ibmConfig.ibmColors["light" + lineColorFamily];
        }
}

// Normalize font color to be visible if lineColor is too dark.
mxIBMShapeBase.prototype.normalizeFontColor = function(fontColor, lineColor)
{
	if (lineColor === "none")
		return fontColor;
	else if (lineColor === ibmConfig.ibmColors.black)
		return ibmConfig.ibmColors.white;

	lineColor = lineColor.toUpperCase();
	let name = ibmConfig.colorNames[lineColor.substring(1)];
	if (!name) {
		return name;
	}
	let segments = name.split(' ');

	for (var index = 0; index < segments.length; index++)
	{
		code = parseInt(segments[index]);
		if (!isNaN(code) && code >= 50)
			return ibmConfig.ibmColors.white;
	}

	return fontColor;
}

// Normalize icon color to be visible if lineColor is too dark.
mxIBMShapeBase.prototype.normalizeIconColor = function(iconColor, lineColor)
{
	// Same as font logic initially.
	return mxIBMShapeBase.prototype.normalizeFontColor(iconColor, lineColor);
}

// Normalize style color to be visible if lineColor is too dark.
mxIBMShapeBase.prototype.normalizeStyleColor = function(styleColor, lineColor)
{
	// Same as font logic initially.
	return mxIBMShapeBase.prototype.normalizeFontColor(styleColor, lineColor);
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
	let iconColor = ibmConfig.ibmColors.black;
	let iconAreaColor = (shapeType.startsWith('group')) ? 'none' : lineColor;
	//if (shapeLayout === 'collapsed' && fillColor != this.cst.FILL_COLOR_DEFAULT) iconAreaColor = fillColor;
	let styleColor = lineColor;

	// Set line color to black if not set otherwise use line color.
	lineColor = (lineColor === this.cst.LINE_COLOR_DEFAULT) ? ibmConfig.ibmColors.black : this.rgb2hex(lineColor);

	// Set fill color to transparent if not set otherwise use fill color.
	fillColor = (fillColor === this.cst.FILL_COLOR_DEFAULT) ? ibmConfig.ibmColors.none : this.rgb2hex(fillColor);

	// Set fill color to same as line color for legend color items.
	fillColor = (shapeLayout === 'itemColor') ? lineColor : fillColor;

	// Set icon area color to fill color for collapsed shapes.
	iconAreaColor = (shapeLayout === 'collapsed' && fillColor != this.cst.FILL_COLOR_DEFAULT) ? fillColor : iconAreaColor;

	// Set icon area color to fill color for expanded target shapes.
	iconAreaColor = (shapeLayout === 'expanded' && shapeType === 'target' && fillColor != this.cst.FILL_COLOR_DEFAULT) ? fillColor : iconAreaColor;

	// Set font color to black if not set otherwise use font color.
	fontColor = (fontColor === this.cst.FONT_COLOR_DEFAULT) ? ibmConfig.ibmColors.black : this.rgb2hex(fontColor);

	// Normalize font color to be visible for expanded target shapes.
	fontColor = (shapeType === 'target' && shapeLayout === 'expanded') ? this.normalizeFontColor(fontColor, iconAreaColor) : fontColor;

	// Normalize font color to be visible for collapsed shapes after expanded target shape.
	fontColor = (shapeType === 'target' && shapeLayout === 'collapsed') ? ibmConfig.ibmColors.black : fontColor;

	// Set badge color to line color if not set otherwise use badge color.
	badgeColor = (badgeColor === this.cst.BADGE_COLOR_DEFAULT) ? lineColor : this.rgb2hex(badgeColor);

	// Normalize badge font color to be visible if badge color is too dark.
	badgeFontColor = this.normalizeFontColor(badgeFontColor, badgeColor);

	// Normalize icon color to be visible if icon area color is too dark.
	iconColor = this.normalizeIconColor(iconColor, iconAreaColor);

	// Set icon color to black for legend icon items.
	iconColor = (shapeLayout === 'itemIcon') ? ibmConfig.ibmColors.coolgray : iconColor;

	// Normalize style color to be visibile if icon area color is too dark.
	styleColor = this.normalizeStyleColor(styleColor, iconAreaColor);

	// Set style color to black for expanded shapes and legend style items.
	styleColor = (shapeLayout.startsWith('expanded') || shapeLayout === 'itemStyle') ? lineColor : styleColor;

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
// Sizes should in general only be defined in IBMConfig.json.
mxIBMShapeBase.prototype.getDetails = function(shape, shapeType, shapeLayout, shapeWidth, shapeHeight)
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

                details['shapeWidth'] = shapeWidth;
                details['shapeHeight'] = shapeHeight;
        }
        else if (shapeLayout.startsWith('expanded')) {
                if (shapeType === 'target')
                        details = ibmConfig.ibmShapeSizes.expandedTarget;
                else if (shapeType.startsWith('group'))
                        details = ibmConfig.ibmShapeSizes.group;
                else
                        details = ibmConfig.ibmShapeSizes.expanded;

                details['shapeWidth'] = shapeWidth;
                details['shapeHeight'] = shapeHeight;
        }
        else {
                if (shapeLayout === 'itemBadge')
                        details = ibmConfig.ibmShapeSizes.itemBadge;
                else if (shapeLayout === 'itemColor')
                        details = ibmConfig.ibmShapeSizes.itemColor;
                else if (shapeLayout === 'itemStyle')
                        details = ibmConfig.ibmShapeSizes.itemStyle;
                else if (shapeLayout === 'itemIcon' && shapeType === 'target')
                        details = ibmConfig.ibmShapeSizes.itemTarget;
                else if (shapeLayout === 'itemIcon' && shapeType === 'actor')
                        details = ibmConfig.ibmShapeSizes.itemActor;
                else if (shapeLayout === 'itemIcon')
                        details = ibmConfig.ibmShapeSizes.itemIcon;
                else // (shapeLayout === 'itemShape')
                        details = ibmConfig.ibmShapeSizes.itemShape;

                details['shapeWidth'] = details.defaultWidth;
                details['shapeHeight'] = details.defaultHeight;
        }

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

// Build object for current and previous values.
mxIBMShapeBase.prototype.getStyleValues = function(pStyle, cStyle, key, keyDefault)
{
	var current = mxUtils.getValue(cStyle, key, keyDefault);
	var previous = mxUtils.getValue(pStyle, key, keyDefault);
	return { current, previous, isChanged: current !== previous };
}

// Build styles object from styles string.
mxIBMShapeBase.prototype.getStylesObj = function(stylesStr)
{
	var styles = {};
	stylesStr = stylesStr.slice(0, -1); // Remove trailing semicolon.
	let array = stylesStr.split(';');
	for (var index = 0; index < array.length; index++) {
		element = array[index].split('=');
		if (element[1] === 'null')
			styles[element[0]] = null;
		else
			styles[element[0]] = element[1];
	}
	return styles;
}

// Update styles string from styles object.
mxIBMShapeBase.prototype.getStylesStr = function(stylesObj, stylesStr)
{
	/*
	var stylesStr = '';
	for (var key in stylesObj) {
		stylesStr += key + '=' + stylesObj[key] + ';'
	}
	return stylesStr
	*/

	for (let key in stylesObj)
		stylesStr = mxUtils.setStyle(stylesStr, key, stylesObj[key]);

	return stylesStr;
}

// Change icon using switch statement in ibmIcons when switching between logical and prescribed.
mxIBMShapeBase.prototype.switchIcon = function(shapeType, shapeLayout)
{
	/* In progress.
	console.log(this.state.cell.getAttribute('Icon-Name',null));
	this.state.cell.setAttribute('Icon-Name','ibm-cloud');

	if (previousType.slice(-1) === 'l' && currentType.slice(-1) === 'p')
		// Lookup logical icon in ibmIcons and switch to prescribed icon if available.
	else if (previousType.slice(-1) === 'p' && currentType.slice(-1) === 'l')
		// Lookup prescribed icon in ibmIcons and switch to logical icon if available.
	*/

	return;
}

// Get properties corresponding to layout change.
// Properties are kept minimal by nulling out unused properties when changing layouts.
// Invalid layout changes revert to original layout.
mxIBMShapeBase.prototype.getLayoutProperties = function(shapeType, shapeLayout, hideIcon)
{
	let properties = '';

	let changed = shapeType.isChanged || shapeLayout.isChanged || hideIcon.isChanged;
	if (!changed)
		return properties;

	// Prevent invalid changes.

	if (shapeType.current.startsWith('group') && shapeLayout.current === 'collapsed')
	{
		shapeLayout = 'expanded';
		properties = 'ibmLayout=expanded;';
	}
	else if (shapeType.current === 'actor' && shapeLayout.current.startsWith('expanded'))
	{
		shapeLayout = 'collapsed';
		properties = 'ibmLayout=collapsed;';
	}
	else if (shapeType.current === 'target' && shapeLayout.current === 'expandedStack')
	{
		shapeLayout = 'expanded';
		properties = 'ibmLayout=expanded;';
	}

	// Get shape-specific properties.

	if (shapeLayout.current === "collapsed")
		// Add collapsed label properties, remove expanded stack properties, remove container properties, remove fill.
		properties += ibmConfig.ibmSystemProperties.collapsedLabel + ibmConfig.ibmSystemProperties.expandedStackNull +
				ibmConfig.ibmSystemProperties.containerNull + ibmConfig.ibmSystemProperties.noFill;
	else if (shapeLayout.current === "expanded")
	{
		if (shapeType.current === 'target')
		{
			// Add expanded label properties, remove container properties, remove expanded stack properties, remove fill.
			if (hideIcon.current === '1')
				properties += ibmConfig.ibmSystemProperties.expandedTargetLabelNoIcon;
			else
				properties += ibmConfig.ibmSystemProperties.expandedTargetLabel;

			properties += ibmConfig.ibmSystemProperties.containerNull + ibmConfig.ibmSystemProperties.expandedStackNull +
					ibmConfig.ibmSystemProperties.noFill;
		}
		else
			// Add expanded label properties, add container properties, remove expanded stack properties, add default fill.
			properties += ibmConfig.ibmSystemProperties.expandedLabel + ibmConfig.ibmSystemProperties.container +
						ibmConfig.ibmSystemProperties.expandedStackNull + ibmConfig.ibmSystemProperties.defaultFill;
	}
	else if (shapeLayout.current === "expandedStack")
		// Add expanded label properties, expanded stack properties, add container properties, add default fill.
		properties += ibmConfig.ibmSystemProperties.expandedLabel + ibmConfig.ibmSystemProperties.expandedStack +
				ibmConfig.ibmSystemProperties.container + ibmConfig.ibmSystemProperties.defaultFill;
	else if (shapeLayout.current.startsWith('item'))
		// Add item label properties, remove container properties, remove expanded stack properties, remove fill.
		properties += ibmConfig.ibmSystemProperties.itemLabel + ibmConfig.ibmSystemProperties.containerNull +
				ibmConfig.ibmSystemProperties.expandedStackNull + ibmConfig.ibmSystemProperties.noFill;
	else
		// Remove expanded stack properties, remove container properties, remove fill.
		properties += ibmConfig.ibmSystemProperties.expandedStackNull + ibmConfig.ibmSystemProperties.containerNull +
				ibmConfig.ibmSystemProperties.noFill;

	return properties;
}

// Get and set layout style called by event handler.
mxIBMShapeBase.prototype.setLayoutStyle = function(cStyleStr, pStyle, cStyle)
{
	var shapeType = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	var shapeLayout = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_LAYOUT, this.cst.SHAPE_TYPE_LAYOUT);
	var hideIcon = this.getStyleValues(pStyle, cStyle, this.cst.HIDE_ICON, this.cst.HIDE_ICON_DEFAULT);

	// Change icon if available when switching between logical and prescribed.
	this.switchIcon(shapeType, shapeLayout);

	// Get properties corresponding to layout change.
	var properties = this.getLayoutProperties(shapeType, shapeLayout, hideIcon);

	// Build styles object from styles string.
        var stylesObj = this.getStylesObj(properties);

	// Update styles string from styles object.
	cStyleStr = this.getStylesStr(stylesObj, cStyleStr);

	return cStyleStr;
};

// Get properties for line style change ensuring only one of dashed, double, or strikethrough is set at time,
// for example if user previously selected dashed and later selects double then dashed is auto-deselected.
mxIBMShapeBase.prototype.getLineProperties = function(styleDashed, styleDouble, styleStrikethrough)
{
	let properties = '';

	let changed = styleDashed.isChanged || styleDouble.isChanged || styleStrikethrough.isChanged;
	if (!changed)
		return properties;

	// Set properties to the desired change for dashed, double, or strikethrough.

	if (styleDashed.isChanged)
		properties = (styleDashed.current === '1') ? ibmConfig.ibmSystemProperties.styleDashedOn : ibmConfig.ibmSystemProperties.styleDashedOff;

	if (styleDouble.isChanged)
		properties = (styleDouble.current === '1') ? ibmConfig.ibmSystemProperties.styleDoubleOn : ibmConfig.ibmSystemProperties.styleDoubleOff;

	if (styleStrikethrough.isChanged)
		properties = (styleStrikethrough.current === '1') ? ibmConfig.ibmSystemProperties.styleStrikethroughOn : ibmConfig.ibmSystemProperties.styleStrikethroughOff;

	return properties;
}

// Get and set line style (dashed, double, strikethrough) called by event handler.
mxIBMShapeBase.prototype.setLineStyle = function(cStyleStr, pStyle, cStyle)
{
	var styleDashed = this.getStyleValues(pStyle, cStyle, this.cst.STYLE_DASHED, this.cst.STYLE_DASHED_DEFAULT);
	var styleDouble = this.getStyleValues(pStyle, cStyle, this.cst.STYLE_DOUBLE, this.cst.STYLE_DOUBLE_DEFAULT);
	var styleStrikethrough = this.getStyleValues(pStyle, cStyle, this.cst.STYLE_STRIKETHROUGH, this.cst.STYLE_STRIKETHROUGH_DEFAULT);

	// Get properties corresponding to line style change.
	var properties = this.getLineProperties(styleDashed, styleDouble, styleStrikethrough);

	// Build styles object from styles string.
        var stylesObj = this.getStylesObj(properties);

	// Update styles string from styles object.
	cStyleStr = this.getStylesStr(stylesObj, cStyleStr);

	return cStyleStr;
}

// Get name of color from rbg/hex value.
mxIBMShapeBase.prototype.getColorName = function(color)
{
        var colorHex = this.rgb2hex(color);
        var colorUpper = colorHex.toUpperCase();
        var colorName = ibmConfig.colorNames[colorUpper.substring(1)];
	return colorName;
}

// Get properties for color change ensuring proper use of IBM Color Palette.
mxIBMShapeBase.prototype.getColorProperties = function(shapeType, shapeLayout, lineColor, fillColor, fontColor, badgeColor, container)
{
	let properties = '';

	/* In progress.
	let changed = lineColor.isChanged || fillColor.isChanged || fontColor.isChanged || badgeColor.isChanged;
	if (!changed)
		return properties;

	let UNUSED_COLOR_NAME = ibmConfig.ibmBaseConstants.UNUSED_COLOR_NAME;
        let LINE_COLOR_NAME = ibmConfig.ibmBaseConstants.LINE_COLOR_NAME;
        let FILL_COLOR_NAME = ibmConfig.ibmBaseConstants.FILL_COLOR_NAME;
        let FONT_COLOR_NAME = ibmConfig.ibmBaseConstants.FONT_COLOR_NAME;

	let lineColorLast = lineColor.previous;
	let fillColorLast = fillColor.previous;
	let fontColorLast = fontColor.previous;

	let lineColorName = this.getColorName(lineColor.previous);
	let fillColorName = this.getColorName(fillColor.previous);
	let fontColorName = this.getColorName(fontColor.previous);

	let lineColorReset = false;
	let fillColorReset = false;
	let fontColorReset = false;
	let badgeColorReset = false;

	// If line color changed but not a valid line color then reset line color and fill color to previous.
        if (lineColor.isChanged)
        {
		lineColorLast = lineColor.current;
                lineColorName = this.getColorName(lineColor.current);

                if (!lineColorName || lineColorName.indexOf(LINE_COLOR_NAME) === -1)
		{
			lineColorReset = true;

			lineColorLast = lineColor.previous;
			fillColorLast = fillColor.previous;

                	lineColorName = this.getColorName(lineColor.previous);
                	fillColorName = this.getColorName(fillColor.previous);

                        properties += 'strokeColor=' + lineColor.previous + ';';
                        properties += 'fillColor=' + fillColor.previous + ';';
		}
        }

	// If fill color changed but not a valid fill color then reset fill color.
	if (fillColor.isChanged && !lineColorReset)
	{
		fillColorLast = fillColor.current;
                fillColorName = this.getColorName(fillColor.current);

		*i** progress.
		if (!fillColorName || fillColorName.indexOf(FILL_COLOR_NAME) === -1 ||
				      (!fillColorName.startsWith('Transparent') && !fillColorName.startsWith('White')) ||
                                      fillColorName.search(/[0-9]/) != lineColorName.search(/[0-9]/))
		{
			fillColorReset = true;

                	if (shapeLayout.previous === 'collapsed')
                		properties += ibmConfig.ibmSystemProperties.noFill;
			else if (shapeLayout.previous === 'expanded')
			{
                        	if (container.previous === '1')
                                	properties += ibmConfig.ibmSystemProperties.defaultFill;
				else
                        		properties += ibmConfig.ibmSystemProperties.noFill;
			}
			else if (shapeLayout.previous === "expandedStack")
                		properties += ibmConfig.ibmSystemProperties.defaultFill;
			else
                       		properties += ibmConfig.ibmSystemProperties.noFill;
		}
		***
	}

	// If font color changed but not a valid text color then reset font color.
        if (fontColor.isChanged)
        {
                fontColorName = this.getColorName(fontColor.current);

                if (!fontColorName || fontColorName.indexOf(TEXT_COLOR_NAME) === -1)
                {
			fontColorReset = true;
                        fontColor.current = fontColor.previous;
                        properties += 'fontColor=' + fontColor.previous + ';';
                }
        }

	// If badge color changed but not a valid badge color then reset badge color.
	// This is a placeholder in case needed.
        if (badgeColor.isChanged)
        {
                badgeColorName = this.getColorName(badgeColor.current);

                if (!badgeColorName || badgeColorName.indexOf(LINE_COLOR_NAME) === -1)
                {
			badgeColorReset = true;
                        badgeColor.current = badgeColor.previous;
                        properties += 'ibmBadgeColor=' + badgeColor.previous + ';';
                }
        }
	*/

	return properties;
}

// Get and set color style called by event handler.
mxIBMShapeBase.prototype.setColorStyle = function(cStyleStr, pStyle, cStyle)
{
	var shapeType = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	var shapeLayout = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_LAYOUT, this.cst.SHAPE_TYPE_LAYOUT);
        var container = this.getStyleValues(pStyle, cStyle, this.cst.CONTAINER, this.cst.CONTAINER_DEFAULT);

	var lineColor = this.getStyleValues(pStyle, cStyle, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
        var fillColor = this.getStyleValues(pStyle, cStyle, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
        var fontColor = this.getStyleValues(pStyle, cStyle, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);
        var badgeColor = this.getStyleValues(pStyle, cStyle, this.cst.BADGE_COLOR, this.cst.BADGE_COLOR_DEFAULT);

	// Get properties corresponding to color change.
	var properties = this.getColorProperties(shapeType, shapeLayout, lineColor, fillColor, fontColor, badgeColor, container);

	// Build styles object from styles string.
        var stylesObj = this.getStylesObj(properties);

	// Update styles string from styles object.
	cStyleStr = this.getStylesStr(stylesObj, cStyleStr);

	return cStyleStr;
}




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
