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

function mxIBMShapeBase(bounds, fill, stroke, strokewidth) {
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

	var cell = event.properties.change.cell;
	var pStyleStr = event.properties.change.previous;
	var cStyleStr = event.properties.change.style;
	var pStyle = this.getStylesObj(pStyleStr);
	var cStyle = this.getStylesObj(cStyleStr);

	// Hold all the changes
	var changes = {};
	changes.style = this.getNewStyles(cStyleStr, pStyle, cStyle);

	// Get the new geometry	
	var geometry = cell.getGeometry();
	var geometryRect = this.getNewGeometryRect(cStyle, new mxRectangle(geometry.x, geometry.y, geometry.width, geometry.height), false);
	geometry.height = geometryRect.height;
	geometry.width = geometryRect.width;
	changes.geometry = geometry;

	// set the new style and geometry
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
	// console.log('mxIBMShapeBase.prototype.paintVertexShape', properties);

	c.translate(x, y);
	if (properties.shapeLayout.startsWith('item')) {
		if (properties.shapeLayout == 'itemColor' || properties.shapeLayout == 'itemShape' || properties.shapeLayout == 'itemStyle' || properties.shapeLayout == 'itemIcon') {
			this.drawShape(c, properties);
		}

		if (properties.shapeLayout == 'itemIcon') {
			this.drawStencil(c, properties);
		} else if (properties.shapeLayout == 'itemStyle') {
			this.drawStyle(c, properties);
		} else if (properties.shapeLayout == 'itemBadge') {
			this.drawBadge(c, properties);
		}
	} else {
		this.drawShape(c, properties);
		this.drawStencil(c, properties);
		this.drawStyle(c, properties);
		this.drawBadge(c, properties);
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

		// set the shape size
		if (properties['shapeHeight'] == null) {
			properties['shapeHeight'] = properties.defaultHeight;
		}
		if (properties['shapeWidth'] == null) {
			properties['shapeWidth'] = properties.defaultWidth;
		}
	}

	return properties;
}

/**
 * Draw base shape
 * @param {*} c 
 * @param {*} properties 
 */
mxIBMShapeBase.prototype.drawShape = function (c, properties) {
	if (properties.styleDashed || properties.styleDouble) {
		drawDoubleShapeContainer(0, 0, properties.shapeWidth, properties.shapeHeight, properties.curveRadius);
		drawShapeContainer(properties.doubleAlign, properties.doubleAlign, properties.shapeWidth - properties.doubleAlign * 2, properties.shapeHeight - properties.doubleAlign * 2, properties.curveRadius - properties.doubleAlign);
	} else {
		drawShapeContainer(0, 0, properties.shapeWidth, properties.shapeHeight, properties.curveRadius);
	}

	if (properties.shapeType.startsWith('group')) {
		c.rect(0, 0, properties.sidebarWidth, properties.sidebarHeight);
		c.setStrokeColor(properties.lineColor);
		c.setFillColor(properties.lineColor);
		c.fillAndStroke();
	} else {
		if (properties.shapeLayout.startsWith('expanded') && properties.shapeType !== 'target') {
			if (!properties.hideIcon) {
				drawIconArea(0, 0, properties.iconAreaWidth, properties.iconAreaHeight, properties.curveRadius);
				c.setStrokeColor(properties.lineColor);
				c.setFillColor(properties.lineColor);
				c.fillAndStroke();
			}
		}
		if (properties.shapeType.startsWith('comp')) {
			c.rect(properties.sidetickAlign, properties.minHeight / 4, properties.sidetickWidth, properties.sidetickHeight);
			c.setStrokeColor(properties.lineColor);
			c.setFillColor(ibmConfig.ibmColors.white);
			c.fillAndStroke();

			c.rect(properties.sidetickAlign, properties.minHeight - properties.minHeight / 4 - properties.sidetickHeight, properties.sidetickWidth, properties.sidetickHeight);
			c.fillAndStroke();
		}
	}

	function drawShapeContainer(x, y, w, h, curveRadius) {
		drawBaseShape(x, y, w, h, curveRadius);
		if (properties.shapeLayout == 'itemIcon') {
			c.setStrokeColor('none');
			c.setFillColor(properties.fillColor);
		} else if (properties.shapeLayout == 'itemStyle' || properties.shapeLayout == 'itemShape') {
			c.setFillColor(ibmConfig.ibmColors.white)
		} else {
			c.setStrokeColor(properties.lineColor);
			if (properties.shapeLayout.startsWith('expanded') && properties.shapeType !== 'target') {
				c.setFillColor(properties.fillColor)
			} else {
				c.setFillColor(properties.lineColor);
			}
		}
		c.setDashed(false);
		c.fillAndStroke();
	}

	function drawDoubleShapeContainer(x, y, w, h, curveRadius) {
		drawBaseShape(x, y, w, h, curveRadius);
		if (properties.styleDashed) {
			c.setDashed(true, true);
			c.setDashPattern('6 6');
		} else {
			c.setDashed(false);
		}
		c.setStrokeColor(properties.lineColor);
		c.fillAndStroke();
	}

	function drawBaseShape(x, y, w, h, curveRadius) {
		if (properties.shapeType == 'actor') {
			c.ellipse(x, y, w, h);
		} else if (properties.shapeType == 'target') {
			c.roundrect(x, y, w, h, curveRadius, curveRadius);
		} else if (properties.shapeType.endsWith('l')) { // nodel, compl, groupl 
			c.roundrect(x, y, w, h, curveRadius, curveRadius);
		} else {
			c.rect(x, y, w, h);
		}
	}

	function drawIconArea(x, y, w, h, curveRadius) {
		if (properties.shapeType == 'nodel' || properties.shapeType == 'compl') {
			if (properties.sidebarHeight < properties.shapeHeight) {
				c.begin()
				c.moveTo(curveRadius, y);
				c.lineTo(w, y);
				c.lineTo(w, h);
				c.lineTo(x, h);
				c.lineTo(x, curveRadius);
				c.arcTo(curveRadius, curveRadius, 0, 0, 1, curveRadius, y);
				c.close();
			} else {
				c.begin()
				c.moveTo(curveRadius, y);
				c.lineTo(w, y);
				c.lineTo(w, h);
				c.lineTo(curveRadius, h);
				c.arcTo(curveRadius, curveRadius, 0, 0, 1, x, h - curveRadius);
				c.lineTo(x, curveRadius);
				c.arcTo(curveRadius, curveRadius, 0, 0, 1, curveRadius, y);
				c.close();
			}
		} else {
			c.rect(x, y, w, h);
		}
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
 * get the new shape style as per shapeType and shapeLayout
 * @param {*} cStyleStr 
 * @param {*} pStyle 
 * @param {*} cStyle 
 * @returns 
 */
mxIBMShapeBase.prototype.getNewStyles = function (cStyleStr, pStyle, cStyle) {
	var newStyle = this.setLayoutStyle(cStyleStr, pStyle, cStyle);
	newStyle = this.setLineStyle(newStyle, pStyle, cStyle);
	newStyle = this.setColorStyle(newStyle, pStyle, cStyle);
	return newStyle;
}

/**
 * get the new shape size as per shapeType and shapeLayout
 * @param {*} style 
 * @param {*} rect 
 * @param {*} minSize 
 * @returns 
 */
mxIBMShapeBase.prototype.getNewGeometryRect = function (style, rect, minSize) {
	const shapeType = mxUtils.getValue(style, mxIBMShapeBase.prototype.cst.SHAPE_TYPE, mxIBMShapeBase.prototype.cst.SHAPE_TYPE_DEFAULT);
	const shapeLayout = mxUtils.getValue(style, mxIBMShapeBase.prototype.cst.SHAPE_LAYOUT, mxIBMShapeBase.prototype.cst.SHAPE_LAYOUT_DEFAULT);
	var details = this.getDetails(null, shapeType, shapeLayout, rect.width, rect.height);
	if (shapeLayout === 'collapsed') {
		rect.width = details.minWidth;
		rect.height = details.minHeight;
	} else if (shapeLayout.startsWith('expanded')) {
		if (minSize) {
			rect.width = Math.max(details.minWidth, rect.width);
		} else {
			rect.width = Math.max(details.defaultWidth, rect.width);
		}
		if (shapeType === 'target') {
			rect.height = details.minHeight;
		} else {
			rect.height = Math.max(details.minHeight, rect.height);
		}
	} else {
		rect.width = Math.max(details.minWidth, rect.width);
		rect.height = details.minHeight;
	}
	// console.log('rect', rect)
	return rect;
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
mxIBMShapeBase.prototype.rgb2hex = function (color) {
	if (color.toUpperCase().startsWith('RGB')) {
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
	else if (color.toUpperCase() === 'DEFAULT')
		return ibmConfig.ibmColors.white;
	else
		return color;
}

// Normalize object color to be visible if background color is too dark.
mxIBMShapeBase.prototype.normalizeElementColor = function (objectColor, backgroundColor) {
	if (backgroundColor === "none")
		return objectColor;
	else if (backgroundColor === ibmConfig.ibmColors.black)
		return ibmConfig.ibmColors.white;

	backgroundColor = backgroundColor.toUpperCase();
	let name = ibmConfig.colorNames[backgroundColor.substring(1)];
	if (!name) {
		return name;
	}
	let segments = name.split(' ');

	for (var index = 0; index < segments.length; index++) {
		code = parseInt(segments[index]);
		if (!isNaN(code) && code >= 50)
			return ibmConfig.ibmColors.white;
	}

	return objectColor;
}

// Retrieve color settings.
mxIBMShapeBase.prototype.getColorStyles = function (shape, shapeType, shapeLayout) {
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

	// Set badge color to line color if not set otherwise use badge color.
	badgeColor = (badgeColor === this.cst.BADGE_COLOR_DEFAULT) ? lineColor : this.rgb2hex(badgeColor);

	// Normalize badge font color to be visible if badge color is too dark.
	badgeFontColor = this.normalizeElementColor(badgeFontColor, badgeColor);

	// Normalize icon color to be visible if icon area color is too dark.
	iconColor = this.normalizeElementColor(iconColor, iconAreaColor);

	// Set icon color to black for legend icon items.
	iconColor = (shapeLayout === 'itemIcon') ? ibmConfig.ibmColors.coolgray : iconColor;

	// Normalize style color to be visibile if icon area color is too dark.
	styleColor = this.normalizeElementColor(styleColor, iconAreaColor);

	// Set style color to black for expanded shapes and legend style items.
	styleColor = (shapeLayout.startsWith('expanded') || shapeLayout === 'itemStyle') ? lineColor : styleColor;

	return {
		'lineColor': lineColor,
		'fillColor': fillColor,
		'fontColor': fontColor,
		'badgeColor': badgeColor,
		'badgeFontColor': badgeFontColor,
		'iconColor': iconColor,
		'iconAreaColor': iconAreaColor,
		'styleColor': styleColor
	};
}

// Retrieve size and color details.
// Sizes should in general only be defined in IBMConfig.json.
mxIBMShapeBase.prototype.getDetails = function (shape, shapeType, shapeLayout, shapeWidth, shapeHeight) {
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
		let colors = this.getColorStyles(shape, shapeType, shapeLayout);

		details['lineColor'] = colors.lineColor;
		details['fillColor'] = colors.fillColor;
		details['fontColor'] = colors.fontColor;
		details['badgeColor'] = colors.badgeColor;
		details['badgeFontColor'] = colors.badgeFontColor;
		details['iconColor'] = colors.iconColor;
		details['iconAreaColor'] = colors.iconAreaColor;
		details['styleColor'] = colors.styleColor;
	}

	return details;
}

// Build object for current and previous values.
mxIBMShapeBase.prototype.getStyleValues = function (pStyle, cStyle, key, keyDefault) {
	var current = mxUtils.getValue(cStyle, key, keyDefault);
	var previous = mxUtils.getValue(pStyle, key, keyDefault);
	return { current, previous, isChanged: current !== previous };
}

// Build styles object from styles string.
mxIBMShapeBase.prototype.getStylesObj = function (stylesStr) {
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
mxIBMShapeBase.prototype.getStylesStr = function (stylesObj, stylesStr) {
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
mxIBMShapeBase.prototype.flattenIcons = function (icons) {
	let flatIcons = {};
	for (let categoryKey in icons) {
		let category = icons[categoryKey];
		for (let iconKey in category)
			flatIcons[iconKey] = category[iconKey];
	}
	return flatIcons;
}

// Change icon to iconl or iconp if available when changing between logical and prescribed shapes.
mxIBMShapeBase.prototype.changeIcon = function (shapeType) {
	let changed = shapeType.isChanged;
	if (!changed)
		return;

	let icons = this.flattenIcons(ibmIcons.Sidebars.Icons);

	iconKey = 'icon' + shapeType.current.slice(-1);

	iconName = this.state.cell.getAttribute('Icon-Name', null);
	icon = icons[iconName];

	if (icon[iconKey])
		this.state.cell.setAttribute('Icon-Name', icon[iconKey]);

	return;
}

// Get properties corresponding to layout change.
// Properties are kept minimal by nulling out unused properties when changing layouts.
// Invalid layout changes revert to original layout.
mxIBMShapeBase.prototype.getLayoutProperties = function (shapeType, shapeLayout, hideIcon) {
	let properties = '';

	let changed = shapeType.isChanged || shapeLayout.isChanged || hideIcon.isChanged;
	if (!changed)
		return properties;

	// Prevent invalid changes.

	if ((shapeType.previous.startsWith('group') && shapeLayout.current === 'collapsed') ||
		(shapeType.previous === 'actor' && shapeLayout.current.startsWith('expanded')) ||
		(shapeType.previous === 'target' && shapeLayout.current === 'expandedStack')) {
		properties += 'ibmLayout=' + shapeLayout.previous + ';';
		return properties;
	}

	// Get shape-specific properties.

	if (shapeLayout.current === "collapsed")
		// Add collapsed label properties, remove expanded stack properties, remove container properties, remove fill.
		properties += ibmConfig.ibmSystemProperties.collapsedLabel + ibmConfig.ibmSystemProperties.expandedStackNull +
			ibmConfig.ibmSystemProperties.containerNull + ibmConfig.ibmSystemProperties.noFill;
	else if (shapeLayout.current === "expanded") {
		if (shapeType.current === 'target') {
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
mxIBMShapeBase.prototype.setLayoutStyle = function (cStyleStr, pStyle, cStyle) {
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
mxIBMShapeBase.prototype.getLineProperties = function (styleDashed, styleDouble, styleStrikethrough) {
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
mxIBMShapeBase.prototype.setLineStyle = function (cStyleStr, pStyle, cStyle) {
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
mxIBMShapeBase.prototype.getColorName = function (color) {
	var colorHex = this.rgb2hex(color);
	var colorUpper = colorHex.toUpperCase();
	var colorName = ibmConfig.colorNames[colorUpper === "NONE" ? "NONE" : colorUpper.substring(1)];
	return colorName;
}

// Get properties for color change ensuring proper use of IBM Color Palette.
mxIBMShapeBase.prototype.getColorProperties = function (shapeType, shapeLayout, lineColor, fillColor, fontColor, badgeColor, container) {
	let properties = '';

	let changed = lineColor.isChanged || fillColor.isChanged || fontColor.isChanged || badgeColor.isChanged || shapeLayout.isChanged;
	if (!changed)
		return properties;

	let UNUSED_COLOR_NAME = ibmConfig.ibmBaseConstants.UNUSED_COLOR_NAME;
	let LINE_COLOR_NAME = ibmConfig.ibmBaseConstants.LINE_COLOR_NAME;
	let FILL_COLOR_NAME = ibmConfig.ibmBaseConstants.FILL_COLOR_NAME;
	let FONT_COLOR_NAME = ibmConfig.ibmBaseConstants.FONT_COLOR_NAME;
	let LIGHT_COLOR_NAME = ibmConfig.ibmBaseConstants.LIGHT_COLOR_NAME;

	let colorReset = false;

	let lineColorValue = lineColor.isChanged ? lineColor.current : lineColor.previous;
	let lineColorName = this.getColorName(lineColorValue);
	let lineColorSegments = lineColorName.split(' ');
	let lineColorFamily = lineColorSegments[1] === "Gray" ? lineColorSegments[0] + lineColorSegments[1] : lineColorSegments[0];

	let fillColorValue = fillColor.isChanged ? fillColor.current : fillColor.previous;
	let fillColorName = this.getColorName(fillColorValue);
	let fillColorSegments = fillColorName.split(' ');
	let fillColorFamily = fillColorSegments[1] === "Gray" ? fillColorSegments[0] + fillColorSegments[1] : fillColorSegments[0];

	// Check that line color is valid and fill color is valid.
	let validNames = lineColorName.indexOf(LINE_COLOR_NAME) != -1 && fillColorName.indexOf(FILL_COLOR_NAME) != -1;

	// Check that line color and fill color are from the same family or fill color is transparent or white.
	let validFill = validNames && (fillColorName.startsWith('Transparent') ||
		fillColorName.startsWith('White') ||
		fillColorFamily == lineColorFamily);

	// If not valid line color and fill color combination then reset.
	if (!validNames || !validFill) {
		colorReset = true;

		if (lineColor.isChanged)
			properties += 'strokeColor=' + lineColor.previous + ';';

		if (fillColor.isChanged)
			properties += 'fillColor=' + fillColor.previous + ';';

		if (fontColor.isChanged)
			properties += 'fontColor=' + fontColor.previous + ';';
	}

	// If not valid font color then reset.
	if (fontColor.isChanged && !colorReset) {
		let fontColorName = this.getColorName(fontColor.current);

		if (!fontColorName || fontColorName.indexOf(FONT_COLOR_NAME) === -1)
			properties += 'fontColor=' + fontColor.previous + ';';
	}

	// If not valid badge color then reset (future use).
	if (badgeColor.isChanged) {
		let badgeColorName = this.getColorName(badgeColor.current);

		if (!badgeColorName || badgeColorName.indexOf(LINE_COLOR_NAME) === -1)
			properties += 'ibmBadgeColor=' + badgeColor.previous + ';';
	}

	// If shape layout changed then normalize font color for target system shape.
	if (shapeLayout.isChanged) {
		let shapeTypeValue = shapeType.isChanged ? shapeType.current : shapeType.previous;
		let shapeLayoutValue = shapeLayout.current;

		if (shapeTypeValue === 'target') {
			if (shapeLayoutValue === 'collapsed')
				properties += 'fontColor=' + ibmConfig.ibmColors.black + ';';
			else if (shapeLayoutValue === 'expanded') {

				let fillColorName = this.getColorName(fillColorValue);

				if (!fillColorName || fillColorName.indexOf(LIGHT_COLOR_NAME) === -1)
					properties += 'fontColor=' + ibmConfig.ibmColors.black + ';';
				else
					properties += 'fontColor=' + ibmConfig.ibmColors.white + ';';
			}
		}
	}

	return properties;
}

// Get and set color style called by event handler.
mxIBMShapeBase.prototype.setColorStyle = function (cStyleStr, pStyle, cStyle) {
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

// https://jgraph.github.io/mxgraph/docs/js-api/files/handler/mxVertexHandler-js.html#mxVertexHandler.union
var vertexHandlerUnion = mxVertexHandler.prototype.union;
mxVertexHandler.prototype.union = function (bounds, dx, dy, index, gridEnabled, scale, tr, constrained) {
	let rect = vertexHandlerUnion.apply(this, arguments);

	if (this.state.style['shape'] === mxIBMShapeBase.prototype.cst.SHAPE) {
		rect = mxIBMShapeBase.prototype.getNewGeometryRect(this.state.style, rect, true);
	} 
	// else if (this.state.style['shape'] === mxIBMShapeLegend.prototype.cst.SHAPE) {
	// 	rect = mxIBMShapeLegend.prototype.getNewGeometryRect(this.graph, this.state.cell, this.state.style, rect);
	// }
	return rect;
};

//**********************************************************************************************************************************************************
// Legends
//**********************************************************************************************************************************************************

function mxIBMShapeLegend(bounds, fill, stroke, strokewidth) {
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
				if ("mxGeometryChange" === event.properties.change.constructor.name) {
					var cell = event.properties.change.cell;
					var graph = this.state.view.graph;
					var cStyle = getStylesObj(cell.style);
					var geometry = cell.getGeometry();
					var geometryRect = this.getNewGeometryRect(graph, cell, cStyle, new mxRectangle(geometry.x, geometry.y, geometry.width, geometry.height));
					geometry.height = geometryRect.height;
					geometry.width = geometryRect.width;
					graph.model.setGeometry(cell, geometry);
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

	var changes = {};
	changes.style = this.getNewStyles(cStyle);

	var geometry = cell.getGeometry();
	var geometryRect = this.getNewGeometryRect(graph, cell, cStyle, new mxRectangle(geometry.x, geometry.y, geometry.width, geometry.height));
	geometry.height = geometryRect.height;
	geometry.width = geometryRect.width;
	changes.geometry = geometry;

	graph.model.beginUpdate();
	try {
		graph.model.setStyle(cell, changes.style);
		graph.model.setGeometry(cell, changes.geometry);
	} finally {
		graph.model.endUpdate();
	}
}

mxIBMShapeLegend.prototype.paintVertexShape = function (c, x, y, w, h) {
	var properties = this.getProperties(this.state.style);
	c.setFillColor(properties.fillColor);
	c.setStrokeColor(properties.strokeColor);
	c.rect(x, y, w, h);
	c.fillAndStroke();
}

mxIBMShapeLegend.prototype.getProperties = function (style) {
	var properties = {}
	properties = ibmConfig.ibmShapeSizes.legend;
	properties.shapeType = mxUtils.getValue(style, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	properties.fillColor = mxUtils.getValue(style, this.cst.FILL_COLOR, this.cst.FILL_COLOR_DEFAULT);
	properties.strokeColor = mxUtils.getValue(style, this.cst.LINE_COLOR, this.cst.LINE_COLOR_DEFAULT);
	properties.fontColor = mxUtils.getValue(style, this.cst.FONT_COLOR, this.cst.FONT_COLOR_DEFAULT);
	properties.ibmNoHeader = mxUtils.getValue(style, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);
	return properties;
}

mxIBMShapeLegend.prototype.getCellStyles = function (shapeType, ibmNoHeader) {
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

/**
 * get new style of mxIBMShapeLegend
 * @param {*} style 
 */
mxIBMShapeLegend.prototype.getNewStyles = function (style) {
	var shapeType = mxUtils.getValue(style, this.cst.SHAPE_TYPE, this.cst.SHAPE_TYPE_DEFAULT);
	// var pNoHeader = mxUtils.getValue(pStyle, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);
	var cNoHeader = mxUtils.getValue(style, this.cst.HIDE_HEADER, this.cst.HIDE_HEADER_DEFAULT);

	var cellStyles = this.getCellStyles(shapeType, cNoHeader);
	for (let key in cellStyles) {
		style[key] = cellStyles[key];
	}
	return getStylesStr(style);
}

/**
 * get new size of mxIBMShapeLegend
 * @param {*} style 
 * @param {*} rect 
 * @returns 
 */
mxIBMShapeLegend.prototype.getNewGeometryRect = function (graph, cell, style, rect) {
	// Get child's geometry	
	var childWidth = 0;
	var childHeight = 0;
	var childMinWidth = 64;
	var childMinHeight = 16;
	var cells = graph.getChildCells(cell, true, false);
	if (cells.length > 0) {
		for (var i = 0; i < cells.length; i++) {
			var tmpGeometry = cells[i].getGeometry();
			childWidth = Math.max(tmpGeometry.width, childWidth, childMinWidth);
			childHeight = Math.max(tmpGeometry.height, childHeight, childMinHeight);
		}
		for (var i = 0; i < cells.length; i++) {
			var tmpGeometry = cells[i].getGeometry();
			tmpGeometry.width = childWidth;
			tmpGeometry.height = childHeight;
			graph.model.setGeometry(cells[i], tmpGeometry);
		}
	}
	// Get parent's geometry	
	var properties = this.getProperties(style);	
	if (properties.shapeType == 'legendh') {
		rect.width = style.marginLeft * 1 + (childWidth + style.marginRight * 1 ) * cells.length;
		rect.height = style.marginTop * 1 + childHeight + style.marginBottom * 1;
	} else {
		rect.width = style.marginLeft * 1 + childWidth + style.marginRight * 1;
		rect.height = style.marginTop * 1 + (childHeight + style.marginBottom * 1) * cells.length;
	}
	rect.width = Math.max(rect.width, properties.minWidth);
	rect.height = Math.max(rect.height, properties.minHeight);
	
	return rect;
}

mxIBMShapeLegend.prototype.getLabelBounds = function (rect) {
	const legendPadding = 8;
	const legendTitleHeight = 16;
	return new mxRectangle(rect.x + legendPadding * this.scale, rect.y + legendPadding * this.scale, rect.width - (2 * legendPadding * this.scale), legendTitleHeight * this.scale);
};

//**********************************************************************************************************************************************************
// Deployment Units
//**********************************************************************************************************************************************************

function mxIBMShapeUnit(bounds, fill, stroke, strokewidth) {
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
	switch (properties.shapeType) {
		case "unite": textStr = "E"; break;
		case "uniti": textStr = "I"; break;
		case "unitp": textStr = "P"; break;
		case "unittd": textStr = "TD"; break;
		case "unitte": textStr = "TE"; break;
		case "unitti": textStr = "TI"; break;
		case "unittp": textStr = "TP"; break;
		case "unitd": textStr = "D"; break;
		default: textStr = "D";
	}
	c.translate(x, y);
	// background
	c.rect(0, 0, w, h);
	c.setStrokeColor('none');
	c.setFillColor('none');
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
