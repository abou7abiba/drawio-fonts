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


const ibmURL = (new RegExp(/^.*\//)).exec(window.location.href)[0];
const ibmParams = new URLSearchParams(window.location.search);
const ibmLanguage = ibmParams.get('lang') ? ibmParams.get('lang') : 'en';
const ibmConfig = JSON.parse(mxUtils.load(ibmURL + 'js/diagramly/sidebar/ibm/IBMConfig.json').getText());
const ibmIcons = JSON.parse(mxUtils.load(ibmURL + 'js/diagramly/sidebar/ibm/IBMIcons.json').getText());


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

mxIBMShapeBase.prototype.init = function (container) {
	if (this.node == null) {
		this.node = this.create(container);
		if (container != null) {
			container.appendChild(this.node);
		}
		// Define custom event handler
		this.customEventsHandler = mxUtils.bind(this, function (sender, event) {
			if (event.properties.change && event.properties.change.cell && event.properties.change.cell.id === this.state.cell.id) {
				if ("mxStyleChange" === event.properties.change.constructor.name) {
					this.styleChangedEventsHandler(this.state.view.graph, event);
				}
			}
		})
		this.state.view.graph.model.addListener('executed', this.customEventsHandler);
	}
}

/**
 * styleChangedEventsHandler
 * @param {*} graph 
 * @param {*} event 
 */
mxIBMShapeBase.prototype.styleChangedEventsHandler = function (graph, event) {
// console.log('mxIBMShapeBase.prototype.styleChangedEventsHandler', event);
	var cell = event.properties.change.cell;	
	var pStyleStr = event.properties.change.previous;
	var cStyleStr = event.properties.change.style;
	var pStyle = this.getStylesObj(pStyleStr);
	var cStyle = this.getStylesObj(cStyleStr);
	// get shapeType and shapeLayout
	var shapeType = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	var shapeLayout = this.getStyleValues(pStyle, cStyle, this.cst.SHAPE_LAYOUT, this.cst.SHAPE_LAYOUT_DEFAULT);

	// Hold all the changes
	var changes = {};
	changes.style = cStyleStr;
	// get the new style
	changes.style = this.setLayoutStyle(changes.style, pStyle, cStyle);
	changes.style = this.setLineStyle(changes.style, pStyle, cStyle);
	changes.style = this.setColorStyle(changes.style, pStyle, cStyle);

	// Get the new geometry
	changes.geometry = cell.getGeometry();
	var properties = this.getDetails(this, shapeType.current, shapeLayout.current, null, null);
	if (!shapeLayout.current.startsWith('item')) {
		if (shapeType.current == 'actor') {
			changes.geometry.width = properties.minWidth;
			changes.geometry.height = properties.minHeight;			
		} else if (shapeType.current.startsWith('node') || shapeType.current.startsWith('comp') || shapeType.current == 'target') {
			if (shapeLayout.current == 'collapsed') {
				changes.geometry.width = properties.minWidth;
				changes.geometry.height = properties.minHeight;
			} else {
				changes.geometry.height = properties.defaultHeight;
				changes.geometry.width = properties.defaultWidth;
			}
		}
	}

	graph.model.beginUpdate();
	try {		
		graph.model.setStyle(cell, changes.style);
		graph.model.setGeometry(cell, changes.geometry);
	} finally {
		graph.model.endUpdate();
	}	
}

/**
* Function: paintVertexShape
* 
* Paints the vertex shape.
*/
mxIBMShapeBase.prototype.paintVertexShape = function (c, x, y, w, h) {
	var properties = this.getProperties(this, h, w);
console.log('mxIBMShapeBase.prototype.paintVertexShape', properties);

	c.translate(x, y);

	if(!properties.shapeLayout.startsWith('item')) {		
		if (properties.shapeType == 'target' || properties.shapeType == 'actor') {
			this.drawRoundRectShape(c, properties);
		} else {
			this.drawRectShape(c, properties);
		}
		this.drawStencil(c, properties);		
		this.drawStyle(c, properties);		
		this.drawBadge(c, properties);
	} else {
		if (properties.shapeLayout == 'itemColor' || properties.shapeLayout == 'itemShape' || properties.shapeLayout == 'itemStyle' || properties.shapeLayout == 'itemIcon') {
			if (properties.shapeType == 'target' || properties.shapeType == 'actor') {
				this.drawRoundRectShape(c, properties);
			} else {
				this.drawRectShape(c, properties);
			}
		}
		if (properties.shapeLayout == 'itemIcon') {
			this.drawStencil(c, properties);
		}
		if (properties.shapeLayout == 'itemStyle') {
			this.drawStyle(c, properties);
		}
		if (properties.shapeLayout == 'itemBadge') { 
			this.drawBadge(c, properties);
		}
	}
}

mxIBMShapeBase.prototype.getProperties = function (shape, shapeHeight, shapeWidth) {
	var properties = {}
	if (shape.state.style) {
		properties.shapeType = mxUtils.getValue(shape.state.style, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
		properties.shapeLayout = mxUtils.getValue(shape.state.style, this.cst.SHAPE_LAYOUT, this.cst.SHAPE_LAYOUT_DEFAULT);
		properties.styleDashed = mxUtils.getValue(shape.state.style, this.cst.STYLE_DASHED, this.cst.STYLE_DASHED_DEFAULT);
		properties.styleDouble = mxUtils.getValue(shape.state.style, this.cst.STYLE_DOUBLE, this.cst.STYLE_DOUBLE_DEFAULT);
		properties.styleStrikethrough = mxUtils.getValue(shape.state.style, this.cst.STYLE_STRIKETHROUGH, this.cst.STYLE_STRIKETHROUGH_DEFAULT);
		properties.styleMultiplicity = mxUtils.getValue(shape.state.style, this.cst.STYLE_MULTIPLICITY, this.cst.STYLE_MULTIPLICITY_DEFAULT);
		properties.ibmBadge = mxUtils.getValue(shape.state.style, this.cst.BADGE, this.cst.BADGE_DEFAULT);
		properties.hideIcon = mxUtils.getValue(shape.state.style, this.cst.HIDE_ICON, this.cst.HIDE_ICON_DEFAULT);
		properties.rotateIcon = mxUtils.getValue(shape.state.style, this.cst.ROTATE_ICON, this.cst.ROTATE_ICON_DEFAULT);
		properties.lineColor = mxUtils.getValue(shape.state.style, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
		properties.fillColor = mxUtils.getValue(shape.state.style, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
		properties.fontColor = mxUtils.getValue(shape.state.style, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);

		var details = this.getDetails(shape, properties.shapeType, properties.shapeLayout, shapeWidth, shapeHeight);
		for (var key in details) {
			properties[key] = details[key];
		}
	}

	// set the min size
	if (details['shapeHeight'] == null) {
		details['shapeHeight'] = properties.defaultHeight;
	}
	if (details['shapeWidth'] == null) {
		details['shapeWidth'] = properties.defaultWidth;
	}
	if (!properties.shapeLayout.startsWith('item')) {
		details['shapeHeight'] = Math.max(details['shapeHeight'], properties.minHeight);
		details['shapeWidth'] = Math.max(details['shapeWidth'], properties.minWidth);
	}
	return properties;
}

/**
 * Draw round rect shape for actor, target system
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawRoundRectShape = function (c, properties) {
	if (properties.styleDashed || properties.styleDouble) {
		c.roundrect(0, 0, properties.shapeWidth, properties.shapeHeight, properties.curveRadius, properties.curveRadius);
		if (properties.styleDashed) {
			c.setDashed(true, true);
			c.setDashPattern('6 6');
		} else {
			c.setDashed(false);
		}
		c.setStrokeColor(properties.lineColor);
		c.fillAndStroke();

		drawShapeContainer(properties.doubleAlign, properties.doubleAlign, properties.shapeWidth - properties.doubleAlign * 2, properties.shapeHeight - properties.doubleAlign * 2);
	} else {
		drawShapeContainer(0, 0, properties.shapeWidth, properties.shapeHeight)
	}

	function drawShapeContainer(x, y, w, h) {
		c.roundrect(x, y, w, h, properties.curveRadius, properties.curveRadius);
		c.setStrokeColor(properties.lineColor);
		if (properties.shapeLayout.startsWith('item')) {
			c.setFillColor(ibmConfig.ibmColors.white);
		} else {
			c.setFillColor(properties.lineColor);
		}
		c.setDashed(false);
		c.fillAndStroke();
	}
}

/**
 * Draw rect shape for logical component, prescribed component, logical node, prescribed node, logical group, prescribed group
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawRectShape = function (c, properties) {	
	if (properties.styleDashed || properties.styleDouble) {
		if (properties.styleDashed) {
			c.setDashed(true, true);
			c.setDashPattern('6 6');
		} else {
			c.setDashed(false);
		}
		c.setStrokeColor(properties.lineColor);
		drawNode(0, 0, properties.shapeWidth, properties.shapeHeight);
		c.fillAndStroke();

		drawShapeContainer(properties.doubleAlign, properties.doubleAlign, properties.shapeWidth - properties.doubleAlign * 2, properties.shapeHeight - properties.doubleAlign * 2);
	} else {
		drawShapeContainer(0, 0, properties.shapeWidth, properties.shapeHeight);
	}
	

	if (properties.shapeType.startsWith('group')) {
		c.rect(0, 0, properties.sidebarWidth, properties.sidebarHeight);
		c.setStrokeColor(properties.lineColor);
		c.setFillColor(properties.lineColor);
		c.fillAndStroke();
	} else {
		if (properties.shapeLayout.startsWith('expanded')) {
			if (!properties.hideIcon) {
				drawNode(0, 0, properties.iconAreaWidth, properties.iconAreaHeight);
				c.setStrokeColor(properties.lineColor);
				c.setFillColor(properties.lineColor);
				c.fillAndStroke();
			}
		}
		if (properties.shapeType.startsWith('comp')) {
			c.setStrokeColor(properties.lineColor);
			c.setFillColor(properties.fillColor);
			c.rect(properties.sidetickAlign, properties.shapeHeight / 4, properties.sidetickWidth, properties.sidetickHeight);
			c.fillAndStroke();
			c.rect(properties.sidetickAlign, properties.shapeHeight - properties.shapeHeight / 4 - properties.sidetickHeight, properties.sidetickWidth, properties.sidetickHeight);
			c.fillAndStroke();
		}
	}

	function drawNode(x, y, w, h) {
		if (properties.shapeType.endsWith('l')) { // nodel, compl, groupl 
			c.roundrect(x, y, w, h, properties.curveRadius, properties.curveRadius);
		} else {
			c.rect(x, y, w, h);
		}
	}

	function drawShapeContainer(x, y, w, h) {
		if (properties.shapeLayout == 'itemIcon') {
			c.setStrokeColor('none');
			c.setFillColor(properties.fillColor);
		} else {
			c.setStrokeColor(properties.lineColor);		
			if (properties.shapeLayout == 'collapsed') {
				c.setFillColor(properties.lineColor);
			} else {
				c.setFillColor(properties.fillColor);
			}
		}
		c.setDashed(false);
		drawNode(x, y, w, h);
		c.fillAndStroke();
	}
}

/**
 * Draw stencil, hideIcon if set
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawStencil = function (c, properties) {
	if (!properties.hideIcon) {
		var prIcon = this.state.cell.getAttribute('Icon-Name');
		var prStencil = mxStencilRegistry.getStencil('mxgraph.ibm.' + prIcon);
		if (prStencil) {
			c.save();
			// rotate icon if set
			if (properties.rotateIcon) {
				c.rotate(properties.rotateIcon, false, false, properties.iconAreaWidth / 2, properties.iconAreaHeight / 2);
			}
			// set icon color
			c.setFillColor(properties.iconColor)
			c.setStrokeColor(properties.lineColor);
			if (properties.shapeType == 'target' && properties.shapeLayout == 'collapsed') {
				prStencil.drawShape(c, this, properties.defaultWidth / 2 - properties.iconSize / 2, properties.iconAlign, properties.iconSize, properties.iconSize);
			} else {
				prStencil.drawShape(c, this, properties.iconAlign, properties.iconAlign, properties.iconSize, properties.iconSize);
			}
			c.restore();
		}
	}
}

/**
 * Draw style, styleStrikethrough and styleMultiplicity
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawStyle = function (c, properties) {
	if (properties.styleStrikethrough) {
		c.begin();
		if (properties.shapeLayout == 'collapsed' || properties.shapeLayout == 'itemStyle' || properties.shapeType.startsWith('group')) {
			c.moveTo(0, 0);
			c.lineTo(properties.shapeWidth, properties.shapeHeight);
		} else if (properties.shapeLayout.startsWith('expanded')) {
			if (properties.shapeType == 'target') {
				c.moveTo(properties.iconSize, 0);
				c.lineTo(properties.shapeWidth - properties.iconSize, properties.iconAreaHeight);
			} else {
				properties.hideIcon ? c.moveTo(0, 0) : c.moveTo(properties.iconAreaWidth, 0);
				c.lineTo(properties.shapeWidth, properties.iconAreaHeight);
			}
		}
		c.setStrokeColor(properties.styleColor);
		c.close();
		c.stroke();
	}

	if (properties.styleMultiplicity) {
		c.begin();
		for (var i = 1; i <= 2; i++) {
			var offSet = properties.multiplicityAlign * i;
			if (properties.shapeType == 'actor') {
				c.moveTo(properties.shapeWidth / 2 + offSet, - offSet);
				c.arcTo(properties.curveRadius, properties.curveRadius, 0, 0, 1, properties.shapeWidth + offSet, properties.shapeHeight / 2 - offSet);
				c.moveTo(properties.shapeWidth / 2 + offSet, - offSet);
			} else if (properties.shapeType == 'target') {
				c.moveTo(properties.iconSize + offSet, - offSet);
				c.lineTo(properties.shapeWidth + offSet - properties.curveRadius, - offSet);
				c.arcTo(properties.curveRadius, properties.curveRadius, 0, 0, 1, properties.shapeWidth + offSet, properties.curveRadius - offSet);
				c.lineTo(properties.shapeWidth + offSet, properties.shapeHeight / 2 - offSet);
				c.moveTo(properties.iconSize + offSet, - offSet);
			} else if (properties.shapeType.endsWith('l')) {
				c.moveTo(offSet, - offSet);
				c.lineTo(properties.shapeWidth + offSet - properties.curveRadius, - offSet);
				c.arcTo(properties.curveRadius, properties.curveRadius, 0, 0, 1, properties.shapeWidth + offSet, properties.curveRadius - offSet);
				c.lineTo(properties.shapeWidth + offSet, properties.shapeHeight - offSet);
				c.moveTo(offSet, - offSet);
			} else {
				c.moveTo(offSet, - offSet);
				c.lineTo(properties.shapeWidth + offSet, - offSet);
				c.lineTo(properties.shapeWidth + offSet, properties.shapeHeight - offSet);
				c.moveTo(offSet, - offSet);
			}
		}
		if (properties.styleDashed) {
			c.setDashed(true, true);
			c.setDashPattern('6 6');
		} else {
			c.setDashed(false);
		}
		c.setStrokeColor(properties.lineColor);
		c.close();
		c.stroke();
	}
}

/**
 * Draw badge shape, color, text, font color
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawBadge = function (c, properties) {
	var bW = 14;
	var bM = 1;
	if (properties.shapeLayout == 'itemBadge') {
		if (properties.ibmBadge == 'circle' || properties.ibmBadge == 'square') {
			drawBadgeIcon(properties.badgeColor, 0, 1, bW, bW);
		} else {
			drawBadgeIcon(properties.badgeColor, bW / 2, 1, bW, bW);
		}
	} else {
		var offset = properties.shapeType == 'target' || properties.shapeType == 'actor' ? 0 : bW / 2 + 1;
		if (properties.ibmBadge == 'circle' || properties.ibmBadge == 'square') {
			drawBadgeIcon(properties.badgeFontColor, properties.shapeWidth - bW - bM * 2 + offset, - bW / 2 - bM, bW + bM * 2, bW + bM * 2);
			drawBadgeIcon(properties.badgeColor, properties.shapeWidth - bW - bM + offset, - bW / 2, bW, bW);
		} else {
			drawBadgeIcon(properties.badgeFontColor, properties.shapeWidth - bW / 2 - bM + offset, - bW / 2 - bM, bW + bM * 2, bW + bM * 2);
			drawBadgeIcon(properties.badgeColor, properties.shapeWidth - bW / 2 - bM + offset, - bW / 2, bW, bW);
		}
	}

	function drawBadgeIcon(color, x, y, w, h) {
		switch (properties.ibmBadge) {
			case 'circle':
				c.ellipse(x, y, w, h);
				break;
			case 'square':
				c.rect(x, y, w, h);
				break;
			case 'diamond':
				c.begin();
				c.moveTo(x, y);
				c.lineTo(x - w / 2, y + h / 2);
				c.lineTo(x, y + h);
				c.lineTo(x + w / 2, y + h / 2);
				c.close();
				break;
			case 'hexagon':
				c.begin();
				c.moveTo(x - w / 2 / 2, y);
				c.lineTo(x - w / 2, y + h / 2);
				c.lineTo(x - w / 2 / 2, y + h);
				c.lineTo(x + w / 2 / 2, y + h);
				c.lineTo(x + w / 2, y + h / 2);
				c.lineTo(x + w / 2 / 2, y);
				c.close();
				break;
			case 'octagon':
				c.begin();
				c.moveTo(x - w / 2 / 2, y);
				c.lineTo(x - w / 2, y + h / 2 / 2);
				c.lineTo(x - w / 2, y + h / 2 / 2 + h / 2);
				c.lineTo(x - w / 2 / 2, y + h);
				c.lineTo(x + w / 2 / 2, y + h);
				c.lineTo(x + w / 2, y + h / 2 / 2 + h / 2);
				c.lineTo(x + w / 2, y + h / 2 / 2);
				c.lineTo(x + w / 2 / 2, y);
				c.close();
				break;
			case 'triangle':
				c.begin();
				c.moveTo(x, y);
				c.lineTo(x - w / 2, y + h);
				c.lineTo(x + w / 2, y + h);
				c.close();
				break;
			default: ;
		}
		c.setFillColor(color);
		c.setStrokeColor(color);
		c.setDashed(false);
		c.fillAndStroke();
	}
}

/**
 * Rewrite label position
 * @param {*} rect 
 * @returns 
 */
mxIBMShapeBase.prototype.getLabelBounds = function (rect) {
	var properties = this.getProperties(this, null, null);
	var offSet = properties.hideIcon || properties.shapeLayout.startsWith('item') ? properties.labelAlign : properties.iconAreaWidth + properties.labelAlign;
	return new mxRectangle(rect.x + offSet * this.scale, rect.y, rect.width - properties.labelAlign * this.scale, properties.labelHeight * this.scale);
};

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

// Remove categories leaving only icons.
mxIBMShapeBase.prototype.flattenIcons = function(icons)
{
	let flatIcons = {};
	for (let categoryKey in icons)
	{       
		let category = icons[categoryKey];
		for (let iconKey in category)
			flatIcons[iconKey] = category[iconKey];
	}
	return flatIcons;
}

// Change icon to iconl or iconp if available when changing between logical and prescribed shapes.
mxIBMShapeBase.prototype.changeIcon = function(shapeType)
{
	let changed = shapeType.isChanged;
	if (!changed)
		return;

	let icons = this.flattenIcons(ibmIcons.Sidebars.Icons);

	iconKey = 'icon' + shapeType.current.slice(-1);

	iconName = this.state.cell.getAttribute('Icon-Name',null);
	icon = icons[iconName];

	if (icon[iconKey])
		this.state.cell.setAttribute('Icon-Name', icon[iconKey]);

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
	
	if ((shapeType.previous.startsWith('group') && shapeLayout.current === 'collapsed') ||
		(shapeType.previous === 'actor' && shapeLayout.current.startsWith('expanded')) ||
		(shapeType.previous === 'target' && shapeLayout.current === 'expandedStack'))
	{
		properties += 'ibmLayout=' + shapeLayout.previous + ';';
		return properties;
	}

	if (shapeType.current.startsWith('group') && shapeLayout.current === 'collapsed')
	{
		shapeLayout.current = 'expanded';
		properties = 'ibmLayout=expanded;';
	}
	else if (shapeType.current === 'actor' && shapeLayout.current.startsWith('expanded'))
	{
		shapeLayout.current = 'collapsed';
		properties = 'ibmLayout=collapsed;';
	}
	else if (shapeType.current === 'target' && shapeLayout.current === 'expandedStack')
	{
		shapeLayout.current = 'expanded';
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

	// Change icon if changing between logical and prescribed.
	this.changeIcon(shapeType);

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

	let changed = lineColor.isChanged || fillColor.isChanged || fontColor.isChanged || badgeColor.isChanged;
	if (!changed)
		return properties;

	let UNUSED_COLOR_NAME = ibmConfig.ibmBaseConstants.UNUSED_COLOR_NAME;
        let LINE_COLOR_NAME = ibmConfig.ibmBaseConstants.LINE_COLOR_NAME;
        let FILL_COLOR_NAME = ibmConfig.ibmBaseConstants.FILL_COLOR_NAME;
        let FONT_COLOR_NAME = ibmConfig.ibmBaseConstants.FONT_COLOR_NAME;

	// If line color changed but not a valid color then reset line and fill to previous.
        if (lineColor.isChanged)
        {
                let lineColorName = this.getColorName(lineColor.current);

                if (!lineColorName || lineColorName.indexOf(LINE_COLOR_NAME) === -1)
		{
                        properties += 'strokeColor=' + lineColor.previous + ';';
                        properties += 'fillColor=' + fillColor.previous + ';';
		}
        }

	/* In progress.
	// If fill color changed but not a valid color then reset.
	if (fillColor.isChanged && !lineColorReset)
	{

		if (!fillColorName || fillColorName.indexOf(FILL_COLOR_NAME) === -1 ||
				      (!fillColorName.startsWith('Transparent') && !fillColorName.startsWith('White')) ||
                                      fillColorName.search(/[0-9]/) != lineColorName.search(/[0-9]/))
		{
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
	}
	*/

	// If font color changed but not a valid color then reset.
        if (fontColor.isChanged)
        {
                let fontColorName = this.getColorName(fontColor.current);

                if (!fontColorName || fontColorName.indexOf(FONT_COLOR_NAME) === -1)
                        properties += 'fontColor=' + fontColor.previous + ';';
        }

	// If badge color changed but not valid color then reset.
        if (badgeColor.isChanged)
        {
                let badgeColorName = this.getColorName(badgeColor.current);

                if (!badgeColorName || badgeColorName.indexOf(LINE_COLOR_NAME) === -1)
                        properties += 'ibmBadgeColor=' + badgeColor.previous + ';';
        }

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

mxIBMShapeLegend.prototype.init = function (container) {
	if (this.node == null) {
		this.node = this.create(container);
		if (container != null) {
			container.appendChild(this.node);
		}
		// Define custom event handler
		this.customEventsHandler = mxUtils.bind(this, function (sender, event) {
			if (event.properties.change && event.properties.change.cell && event.properties.change.cell.id === this.state.cell.id) {
				if ("mxStyleChange" === event.properties.change.constructor.name) {
					this.styleChangedEventsHandler(this.state.view.graph, event);
				}
			}
		})
		this.state.view.graph.model.addListener('executed', this.customEventsHandler);
	}
}

mxIBMShapeLegend.prototype.styleChangedEventsHandler = function (graph, event) {	
	var cell = event.properties.change.cell;
	// var pStyle = getStylesObj(event.properties.change.previous);
	var cStyle = getStylesObj(event.properties.change.style);

	// set the default style of shapeType
	var shapeType = mxUtils.getValue(cStyle, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);	
	// var pNoHeader = mxUtils.getValue(pStyle, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);
	var cNoHeader = mxUtils.getValue(cStyle, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);
	
	var cellStyles = this.getCellStyles(shapeType, cNoHeader);
	for (let key in cellStyles) {
		cStyle[key] = cellStyles[key];
	}

	graph.model.beginUpdate();
	try {
		graph.model.setStyle(cell, getStylesStr(cStyle));
		this.setCellGeometry(graph, cell, shapeType, cStyle);
	} finally {
		graph.model.endUpdate();
	}
}

mxIBMShapeLegend.prototype.setCellGeometry = function(graph, cell, shapeType, cStyle) {
	var cells = graph.getChildCells(cell, true, false);
	if (cells.length > 0) {			
		// Set child's geometry
		var childMaxWidth = 0;
		var childMaxHeight = 0;
		for (var i = 0; i < cells.length; i++) {
			var cellBounds = graph.getCellBounds(cells[i], true, false);
			childMaxWidth = Math.max(cellBounds.width / this.scale, childMaxWidth);
			childMaxHeight = Math.max(cellBounds.height / this.scale, childMaxHeight);
		}
		for (var i = 0; i < cells.length; i++) {
			var geometry = cells[i].getGeometry();
			geometry.width = childMaxWidth;
			geometry.height = childMaxHeight;
			graph.model.setGeometry(cells[i], geometry);
		}
		// set parent's geometry
		var geometry = cell.getGeometry();
		if (shapeType == 'legendh') {
			geometry.width = cStyle.marginLeft * 1 + childMaxWidth * cells.length + cStyle.marginRight * 1;
			geometry.height = cStyle.marginTop * 1 + childMaxHeight + cStyle.marginBottom * 1;
		} else {
			geometry.width =  cStyle.marginLeft * 1 + childMaxWidth + cStyle.marginRight * 1;
			geometry.height = cStyle.marginTop * 1 + childMaxHeight * cells.length + cStyle.marginBottom * 1;
		}		
		graph.model.setGeometry(cell, geometry);
	}
}

mxIBMShapeLegend.prototype.paintVertexShape = function (c, x, y, w, h) {
	var properties = this.getProperties();
	c.rect(x, y, w, h);
	c.setFillColor(properties.fillColor);
	c.setStrokeColor(properties.strokeColor);
	c.setFontColor(properties.fontColor);
	c.fillAndStroke();
}

mxIBMShapeLegend.prototype.getProperties = function () {
	var properties = {}
	properties = ibmConfig.ibmShapeSizes.legend;
	properties.shapeType = mxUtils.getValue(this.state.style, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	properties.fillColor = mxUtils.getValue(this.state.style, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
	properties.strokeColor = mxUtils.getValue(this.state.style, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
	properties.fontColor = mxUtils.getValue(this.state.style, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);
	properties.ibmNoHeader = mxUtils.getValue(this.state.style, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);
	return properties;
}

mxIBMShapeLegend.prototype.getCellStyles = function(shapeType, ibmNoHeader) {
	let properties = '';
	let styles = {};

	if (shapeType === "legendh") {
		if (ibmNoHeader == 1) {
			properties = ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties.legendhStackNoHeader;
		} else {
			properties = ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties.legendhStack;
		}
	} else if (shapeType === "legendv") {
		if (ibmNoHeader == 1) {
			properties = ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties.legendvStackNoHeader;
		} else {
			properties = ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties.legendvStack;
		}		
	}

	properties = properties.slice(0, -1);
	let array = properties.split(';');
	for (var index = 0; index < array.length; index++) {
		element = array[index].split('=');
		if (element[1] === 'null')
			styles[element[0]] = null;
		else	
			styles[element[0]] = element[1];
	}
	return styles;
}

mxIBMShapeLegend.prototype.getLabelBounds = function (rect) {
	var properties = this.getProperties();	
	return new mxRectangle(rect.x, rect.y, rect.width, properties.shapeHeight * this.scale);
};
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

mxIBMShapeUnit.prototype.paintVertexShape = function (c, x, y, w, h) {
	var properties = this.getProperties();
// console.log("mxIBMShapeUnit.prototype.paintVertexShape", properties);
	var textStr = "";
	switch(properties.shapeType) {
		case "unite" : textStr = "E"; break;
		case "uniti" : textStr = "I"; break;
		case "unitp" : textStr = "P"; break;
		case "unittd" : textStr = "TD"; break;
		case "unitte" : textStr = "TE"; break;
		case "unitti" : textStr = "TI"; break;
		case "unittp" : textStr = "TP"; break;
		case "unitd" : textStr = "D"; break;
		default : textStr = "D";
	}
	c.translate(x, y);
	// background
	c.rect(0, 0, w, h);
	c.setFillColor(properties.fillColor);
	// c.setStrokeColor(properties.strokeColor);
	c.setStrokeColor('none');
	c.setFontColor(properties.fontColor);
	c.fillAndStroke();
	// text
	c.text(properties.iconSize / 2, properties.iconSize / 2, w, h, textStr, 'center', 'middle', 0, 0, 0, 0, 0, 0);
}

mxIBMShapeUnit.prototype.getProperties = function () {
	var properties = {}
	properties = ibmConfig.ibmShapeSizes.unit;
	properties.shapeType = mxUtils.getValue(this.state.style, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	properties.fillColor = mxUtils.getValue(this.state.style, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
	properties.fontColor = mxUtils.getValue(this.state.style, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);
	// properties.strokeColor = mxUtils.getValue(this.state.style, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
	return properties;
}

mxIBMShapeUnit.prototype.getLabelBounds = function (rect) {
	var properties = this.getProperties();	
	var offSet = properties.labelAlign;
	return new mxRectangle(rect.x + offSet * this.scale, rect.y, rect.width - properties.labelAlign * this.scale, properties.labelHeight * this.scale);
};

mxCellRenderer.registerShape(mxIBMShapeBase.prototype.cst.SHAPE, mxIBMShapeBase);
mxCellRenderer.registerShape(mxIBMShapeLegend.prototype.cst.SHAPE, mxIBMShapeLegend);
mxCellRenderer.registerShape(mxIBMShapeUnit.prototype.cst.SHAPE, mxIBMShapeUnit);

//**********************************************************************************************************************************************************
// Common Functions
//**********************************************************************************************************************************************************
function getStylesObj(stylesStr) {
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

function getStylesStr(stylesObj) {
	var stylesStr = '';
	for (var key in stylesObj) {
		stylesStr += key + '=' + stylesObj[key] + ';'
	}
	return stylesStr
} 
