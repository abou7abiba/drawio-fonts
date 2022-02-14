/**
 * $Id: Sidebar-IBMShape.js,v 1.0 2022/04/30 17:00:00 mate Exp $
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

function loadIBMConfig()
{
        let jsonURL = ibmURL + 'js/diagramly/sidebar/ibm/IBMConfig.json';
        let jsonText = mxUtils.load(jsonURL).getText();
        return JSON.parse(jsonText);
};
const ibmConfig = loadIBMConfig();

function loadIBMIcons()
{
        let jsonURL = ibmURL + 'js/diagramly/sidebar/ibm/IBMIcons.json';
        let jsonText = mxUtils.load(jsonURL).getText();
        return JSON.parse(jsonText);
};
const ibmIcons = loadIBMIcons();

(function()
{
	Sidebar.prototype.createIBMPalette = function(sidebarID, sidebarFile) 
	{
		let jsonURL = ibmURL + 'js/diagramly/sidebar/ibm/' + sidebarFile;
		let jsonText = `{"id": "${sidebarID}", "name": "IBM" , "url": "${jsonURL}" }`;
		this.GenerateIBMShapePalette([JSON.parse(jsonText)]);
	}

	Sidebar.prototype.addIBMBasePalette = function() 
	{ 
		this.createIBMPalette('ibmbase', 'IBMIcons.json'); 
		this.createIBMPalette('ibmbase', 'IBMShapes.json');
	}

	Sidebar.prototype.addIBMCloudPalette = function() 
	{ 
		this.createIBMPalette('ibmcloud', 'IBMCloud.json'); 
		this.createIBMPalette('ibmcloud', 'IBMCore.json'); 
	}

	Sidebar.prototype.addIBMSetsPalette = function() 
	{ 
		this.createIBMPalette('ibmsets', 'IBMHelpers.json');
		this.createIBMPalette('ibmsets', 'IBMStarters.json'); 
	}

	Sidebar.prototype.addIBMShapeEditorExtensions = function()
	{
		if (Editor.config != null && Editor.config[ibmConfig.ibmBaseConstants.SHAPE])
		{
			let iconStencilLibraries = Editor.config[ibmConfig.ibmBaseConstants.SHAPE].icon_stencil_libraries;
			for (stencilLibrary in iconStencilLibraries) {
				mxStencilRegistry.loadStencilSet(iconStencilLibraries[stencilLibrary]);
			}

			let sideBars = Editor.config[ibmConfig.ibmBaseConstants.SHAPE].sidebars;
			
			return {
				IconStencils: iconStencilLibraries,
				Sidebars: sideBars
			};
		}
	}

	Sidebar.prototype.addIBMShapePaletteMembers = function(shapeName, shape, shapes, bg)
	{
		let maxName = shapeName.length;
		let memberList = shape.members;
		for (var index = 0; index < memberList.length; index++)
		{
			let memberName = memberList[index];
			let memberShape = shapes[memberName];

			var bgmember = Sidebar.prototype.addIBMShapeVertexTemplateFactory(memberName, memberShape);

			if (memberShape.members != null)
				Sidebar.prototype.addIBMShapePaletteMembers(memberName, memberShape, shapes, bgmember);

			bg.insert(bgmember);

			if (memberShape.geometry != null)
			{
				bgmember.geometry.x = memberShape.geometry[0];
				bgmember.geometry.y = memberShape.geometry[1];
				bgmember.geometry.width = memberShape.geometry[2];
				bgmember.geometry.height = memberShape.geometry[3];
			}
			else if (memberName.length > maxName)
				maxName = memberName.length;
		}

		if (shape.geometry != null)
		{
			bg.geometry.x = shape.geometry[0];
			bg.geometry.y = shape.geometry[1];
			bg.geometry.width = shape.geometry[2];
			bg.geometry.height = shape.geometry[3];
		}
		else
			bg.geometry.width = bg.geometry.width + (maxName * 2);
	}

	Sidebar.prototype.GenerateIBMShapePalette = function(sidebarConfigFileURLs)
	{
		let shapesEditorExtensions = Sidebar.prototype.addIBMShapeEditorExtensions() || [];

		sidebarConfigFileURLs = sidebarConfigFileURLs || [];

		if (shapesEditorExtensions.Sidebars != null)
		{
			for(let sidebarExtension in shapesEditorExtensions.Sidebars)
			{
				sidebarConfigFileURLs.push(shapesEditorExtensions.Sidebars[sidebarExtension]);
			}	
		}

		const dt = 'ibm shape ';

		for(let filenameIndex in sidebarConfigFileURLs)
		{
			let filename = sidebarConfigFileURLs[filenameIndex].url;
			let sidebarID = sidebarConfigFileURLs[filenameIndex].id;
			let sidebarMainName = sidebarConfigFileURLs[filenameIndex].name;

			try
			{
				let sidebarFileText = mxUtils.load(filename).getText();
				let sidebarConfigs = JSON.parse(sidebarFileText);
				let sidebarVariables = sidebarConfigs.Variables;
				
				for(let sidebarKey in sidebarConfigs.Sidebars)
				{
					let sidebar = sidebarConfigs.Sidebars[sidebarKey]; 
					let sbEntries = [];
		
					for (let section in sidebar)
					{
						for(let shapeKey in sidebar[section])
						{
							let shape = sidebar[section][shapeKey];
		
							for(let prop in shape)
							{
								if (sidebarVariables[prop])
								{
									for(let newProp in sidebarVariables[prop])
									{
										shape[newProp] = sidebarVariables[prop][newProp]; 
									}
								}
							}
		
							for(let prop in shape)
							{
								if (typeof(shape[prop]) === 'string' && sidebarVariables[shape[prop]])
									shape[prop] = sidebarVariables[shape[prop]]; 
							}
						}
		
						if (section != '*')
							sbEntries.push(this.addEntry(dt + section.toLowerCase(), this.createSection(section)));
			
						let shapes = sidebar[section];
			
						for (let shapeName in shapes) {
							let shape = shapes[shapeName];
							if (shape.ignore) continue;

							sbEntries.push(this.addEntry(dt + shapeName.toLowerCase(), function() {
								const shape = shapes[shapeName];

			                                        shapeName = shapeName.substring(shapeName.indexOf("=")+1);

								var bg = Sidebar.prototype.addIBMShapeVertexTemplateFactory(shapeName, shape);

								if (shape.members != null)
									Sidebar.prototype.addIBMShapePaletteMembers(shapeName, shape, shapes, bg);

								let showLabel = ((shape.format.type.startsWith('legend') || shape.format.type.startsWith('unit') ||
										  (shape.format.layout.startsWith('expanded')) && (shape.format.layout != 'itemShape')));
								
								return sb.createVertexTemplateFromCells([bg], bg.geometry.width, bg.geometry.height, shapeName, showLabel);
							}));
						}
					}
			
					const sidebarFullName = sidebarMainName + " " + sidebarKey;
					this.setCurrentSearchEntryLibrary(sidebarID, sidebarID + sidebarKey);
					this.addPaletteFunctions(sidebarID + sidebarKey, sidebarFullName, false, sbEntries);
				}
			}
			catch (ex){
				console.log(sidebarConfigFileURLs[filenameIndex]);	
				console.log(ex);
			}

		}

		this.setCurrentSearchEntryLibrary();
	};

	Sidebar.prototype.addIBMShapeVertexTemplateFactory = function(name, data)
	{
		let text = data.text ? data.text : name;
		let subText = data.subtext ? data.subtext : "";
		let iconName = data.icon ? data.icon : "undefined";
		let noIcon = !data.icon;

		let shapeType = data.format.type;
		let shapeLayout = data.format.layout;
		let shapeWeight = data.format.weight;
		let shapeContainer = data.format.container;
		let noShapeHeader = !data.format.header;

		let shapeLine = data.color.line;
		let shapeFill = data.color.fill;
		let shapeFont = data.color.font;

		let badgeForm = data.badge.form;
		let badgeLine = data.badge.line;
		let badgeText = data.badge.text ? data.badge.text : "";;

		let styleDashed = data.style.dashed;
		let styleDouble = data.style.double;
		let styleStrikethrough = data.style.strikethrough;
		let styleMultiplicity = data.style.multiplicity;

		let coreProperties = '';
		let systemProperties = '';

		let shapeWidth = 0;
		let shapeHeight = 0;

		if (shapeType.startsWith('legend'))
			coreProperties += 'shape=' + ibmConfig.ibmLegendConstants.SHAPE + ';ibmType=' + shapeType + ';';
		else if (shapeType.startsWith('unit'))
			coreProperties += 'shape=' + ibmConfig.ibmUnitConstants.SHAPE + ';ibmType=' + shapeType + ';';
		else
			coreProperties += 'shape=' + ibmConfig.ibmBaseConstants.SHAPE + ';ibmType=' + shapeType + ';ibmLayout=' + shapeLayout + ';';

		if (shapeLine)
			coreProperties += "strokeColor=" + ibmConfig.ibmColors[shapeLine] + ';';

		if (shapeFill)
			coreProperties += "fillColor=" + ibmConfig.ibmColors[shapeFill] +';';

		if (shapeFont)
			coreProperties += "fontColor=" + ibmConfig.ibmColors[shapeFont] + ';';

		coreProperties += ibmConfig.ibmSystemProperties.basic + ibmConfig.ibmFontProperties[ibmLanguage + 'Primary'];

		if (shapeWeight)
			coreProperties += "strokeWidth=" + shapeWeight + ';';
			
		if (badgeForm)
			coreProperties += "ibmBadge=" + badgeForm + ';';

		if (badgeLine)
			coreProperties += "ibmBadgeColor=" + ibmConfig.ibmColors[badgeLine] + ';';

		if (noIcon)
			coreProperties += "ibmNoIcon=1;";

		if (noShapeHeader)
			coreProperties += "ibmNoHeader=1;";

		if (styleDashed)
			coreProperties += "ibmDashed=1;";

		if (styleDouble)
			coreProperties += "ibmDouble=1;";

		if (styleStrikethrough)
			coreProperties += "ibmStrikethrough=1;";

		if (styleMultiplicity)
			coreProperties += "ibmMultiplicity=1;";

		if (shapeType.startsWith('legend')) {
			//shapeHeight = 56;
			//shapeWidth = 136;
			shapeHeight = ibmConfig.ibmShapeSizes.legend.shapeHeight;
			shapeWidth = ibmConfig.ibmShapeSizes.legend.shapeWidth;

			if (noShapeHeader)
				systemProperties += ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties[shapeType + "StackNoHeader"];
			else
				systemProperties += ibmConfig.ibmSystemProperties.legendStack + ibmConfig.ibmSystemProperties[shapeType + "Stack"];

			if (shapeContainer)
				systemProperties += ibmConfig.ibmSystemProperties.container;
		}
		else if (shapeType.startsWith('unit')) {
			//shapeHeight = 16;
			//shapeWidth = 192;
			shapeHeight = ibmConfig.ibmShapeSizes.unit.shapeHeight;
			shapeWidth = ibmConfig.ibmShapeSizes.unit.shapeWidth;

			systemProperties += ibmConfig.ibmSystemProperties.unitText;
		}
		else {  // base
			if (shapeLayout === 'collapsed') {
				//shapeHeight = 48;
				//shapeWidth = (shapeType === 'target') ? 64 : 48;
				if (shapeType === 'target') {
					shapeHeight = ibmConfig.ibmShapeSizes.collapsedTarget.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.collapsedTarget.shapeWidth;
				}
				else if (shapeType === 'actor') {
					shapeHeight = ibmConfig.ibmShapeSizes.collapsedActor.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.collapsedActor.shapeWidth;
				}
				else {
					shapeHeight = ibmConfig.ibmShapeSizes.collapsed.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.collapsed.shapeWidth;
				}

				systemProperties += ibmConfig.ibmSystemProperties.collapsedText;
			}
			else if (shapeLayout.startsWith('expanded')) {
				//shapeHeight = shapeType.startsWith('group') ? 152 : 48;
				//shapeWidth = 240;
				if (shapeType === 'target') {
					shapeHeight = ibmConfig.ibmShapeSizes.expandedTarget.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.expandedTarget.shapeWidth;
				}
				else if (shapeType.startsWith('group')) {
					shapeHeight = ibmConfig.ibmShapeSizes.group.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.group.shapeWidth;
				}
				else {
					shapeHeight = ibmConfig.ibmShapeSizes.expanded.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.expanded.shapeWidth;
				}

				if (shapeLayout === 'expanded')
					systemProperties += ibmConfig.ibmSystemProperties.expandedText;
				else // expandedStack
					systemProperties += ibmConfig.ibmSystemProperties.expandedText + ibmConfig.ibmSystemProperties.expandedStack;

				if (shapeContainer)
					systemProperties += ibmConfig.ibmSystemProperties.container;
			}
			else if (shapeLayout.startsWith('item')) {
				//shapeHeight = 16;
				//shapeWidth = 240;
				if (shapeLayout === 'itemBadge' || shapeLayout === 'itemColor' || shapeLayout === 'itemStyle') {
					shapeHeight = ibmConfig.ibmShapeSizes.itemStyleColorBadge.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.itemStyleColorBadge.shapeWidth;
				}
				else if (shapeType === 'target') {
					shapeHeight = ibmConfig.ibmShapeSizes.itemTarget.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.itemTarget.shapeWidth;
				}
				else if (shapeType === 'actor') {
					shapeHeight = ibmConfig.ibmShapeSizes.itemActor.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.itemActor.shapeWidth;
				}
				else {
					shapeHeight = ibmConfig.ibmShapeSizes.itemShapeIcon.shapeHeight;
					shapeWidth = ibmConfig.ibmShapeSizes.itemShapeIcon.shapeWidth;
				}

				systemProperties += ibmConfig.ibmSystemProperties.itemText;
			}
		}

		var bg = new mxCell('', new mxGeometry(0, 0, shapeWidth, shapeHeight), coreProperties + systemProperties);
		bg.vertex = true;

		bg.setValue(mxUtils.createXmlDocument().createElement('UserObject'));
		bg.setAttribute('placeholders', '1');
		if (shapeType.startsWith('legend')) {
			bg.setAttribute('label', '<font style=\'font-size: 14px\' face=\'IBM Plex Sans Regular\'>%Legend-Title%</font>');
			bg.setAttribute('Legend-Title', text);
		}
		else if (shapeType.startsWith('unit')) {
			bg.setAttribute('label', '<font style=\'font-size: 14px\' face=\'IBM Plex Sans Regular\'>%Primary-Label%</font><BR><font style=\'font-size: 12px\' face=\'IBM Plex Sans Regular\'>%Secondary-Text%</font>');
			bg.setAttribute('Primary-Label', text);
			bg.setAttribute('Secondary-Text', subText);
		}
		else {
			bg.setAttribute('label', '%Primary-Label%<BR><font style=\'font-size: 14px\' face=\'IBM Plex Sans Regular\'>%Secondary-Text%</font>');
			bg.setAttribute('Badge-Text', badgeText);
			bg.setAttribute('Icon-Name', iconName);
			bg.setAttribute('Primary-Label', text);
			bg.setAttribute('Secondary-Text', subText);
		}
		
		return bg;
	}
})();
