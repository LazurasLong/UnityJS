/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Globals.


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbwZsTt8rUekSzwrK4PSnndaoGsMWXwIZnKm1IOFlg/exec?sheets=1&sheetValues=1';
globals.configuration = 'private';
globals.tinyScale = { x:0.01, y: 0.01, z: 0.01 };


////////////////////////////////////////////////////////////////////////
// Utilities.


function GetAllUnitNames(unit)
{
    var unitNames = [];

    function recur(unit)
    {
        if (unit.parent) {
            unitNames.push(unit.name);
        }
        var children = unit.children;
        if (children && children.length) {
            children.forEach(recur);
        }
    }

    recur(unit);

    return unitNames;
}


function IndentLine(line, indent)
{
    var emPerIndent = 2;
    var em = indent * emPerIndent;
    return '<margin-left=' + em + 'em>' + line;
}


function FormatDollars(dollars)
{
    return '$' + dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


////////////////////////////////////////////////////////////////////////
// Create everything.


function CreatePrivate()
{
    var world = globals.world;
    var tuning = world.tuning;
    var companies = world.companies;
    var effects = world.prefabMap.effects;

    // Create "effects" pie.
    var effectsPie = globals.pieTracker.pies.effects = {
        label: 'Effects',
        pieLabelPosition: { x: 0, y: 160 },
        slices: [],
        initialDirection: Math.PI,
        allLabels: effects.names,
        scroll: 0,
        slicesPerSide: 5,
        drawBackground:	'DrawBackground_Pie',
        inactiveDistance: 50,
        itemLabelDistance: 100,
        itemDistance: 100,
        onenteritem: function(item, slice, pie, target) {
            //console.log("effects enter item", item.label);
            delete item.selected;
            if (!item.stayUp && item.label) {
                CreateHighlight(target, effects.dir + '/' + item.label);
            }
        },
        onexititem: function(item, slice, pie, target) {
            //console.log("effects exit item", item.label);
            if (!item.stayUp && item.label && !item.selected) {
                DestroyHighlight(target);
            }
        },
        onselectitem: function(item, slice, pie, target) {
            //console.log("effects select item", item.label);
            if (!item.stayUp) {
                if (item.label) {
                    item.selected = true;
                }
            } else {
                if (item.direction) {
                    pie.scroll += 2 * pie.slicesPerSide * item.direction;
                } else if (item.side) {
                    var chunk = (2 * pie.slicesPerSide);
                    pie.scroll = Math.floor(pie.allLabels.length / chunk) * chunk;
                    if ((pie.scroll != 0) &&
                        (pie.scroll == pie.allLabels.length)) {
                        pie.scroll -= chunk;
                    }
                } else {
                    pie.scroll = 0;
                }
                pie.onstartpie(pie, target);
                globals.pieTracker.LayoutPie(pie);
                globals.pieTracker.DrawPieBackground(pie, globals.pieTracker.target);
            }
        },
        onstartpie: function(pie, target) {

            var before = pie.scroll;
            var after = pie.allLabels.length - (pie.scroll + (2 * pie.slicesPerSide));
            var canScrollBack = before > 0;
            var canScrollForward = after > 0;

            //globals.pieTracker.DeconstructPie(pie, true);
            pie.slices = [];

            for (var side = 0; side < 2; side++) {

                if (side ? canScrollForward : canScrollBack) {
                    var label =
                        side
                            ? ("=> (" + after + ")")
                            : ("(" + before + ") <=");
                    pie.slices.push({
                        itemLabelDistance: 50,
                        itemDistance: 80,
                        items: [
                            {
                                label: label,
                                direction: side ? 1 : -1,
                                stayUp: true
                            },
                            {
                                label: side ? "Last" : "First",
                                side: side,
                                stayUp: true
                            }
                        ]
                    });
                } else {
                    pie.slices.push({
                        stayUp: true
                    });
                }

                for (i = 0; i < pie.slicesPerSide; i++) {
                    if (i + pie.scroll < pie.allLabels.length) {
                        pie.slices.push({
                            items: [
                                {
                                    label: pie.allLabels[
                                        side
                                            ? (pie.scroll + (2 * pie.slicesPerSide) - 1 - i)
                                            : (pie.scroll + i)]

                                }
                            ]
                        });
                    } else {
                        pie.slices.push({});
                    }
                }

            }

        }
    };

    // Create "companies" pie.
    globals.pieTracker.pies.companies = {
        label: 'Companies',
        slices: [],
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };
    companies.forEach(function(company) {
        globals.pieTracker.pies.companies.slices.push({
            items: [
                {
                    label: company.name,
                    itemDistance: 100,
                    onselectitem: function(item, slice, pie, target) {
                        ShowCompany(company);
                    }
                }
            ]
        });
    });

    globals.cuboid.pieID = 'companies';
    globals.currentCompany = null;

    UpdateObject(globals.proCamera, {
        'component:ProCamera/moveSpeed': tuning.cameraMoveSpeed,
        'component:ProCamera/yawSpeed': tuning.cameraYawSpeed,
        'component:ProCamera/pitchSpeed': tuning.cameraPitchSpeed,
        'component:ProCamera/orbitYawSpeed': tuning.cameraOrbitYawSpeed,
        'component:ProCamera/orbitPitchSpeed': tuning.cameraOrbitPitchSpeed,
        'component:ProCamera/wheelZoomSpeed': tuning.cameraWheelZoomSpeed,
        'component:ProCamera/wheelPanSpeed': tuning.cameraWheelPanSpeed
    });

    if (tuning.probes) {
        for (var row = 0; row < tuning.probeRows; row++) {
            for (var column = 0; column < tuning.probeColumns; column++) {
                var x = (column - (tuning.probeColumns / 2)) * tuning.probeSpacing;
                var z = (row - (tuning.probeRows / 2)) * tuning.probeSpacing;
                var probe = CreatePrefab({
                    prefab: 'Prefabs/ReflectionProbe',
                    update: {
                        'transform/position': {
                            x: x,
                            y: tuning.probeHeight,
                            z: z
                        }
                    }
                });
            }
        }
    }

}


////////////////////////////////////////////////////////////////////////
// Create a company.


function CreateCompany(company)
{
    var world = globals.world;
    var tuning = world.tuning;
    var companies = world.companies;


    // Years
    var yearSpacing = SearchDefault('yearSpacing', company, tuning.yearSpacing);
    var firstYearIndex = -1;
    var lastYearIndex = company.years.length - 1;
    var yearsShown = (lastYearIndex - firstYearIndex) + 1;


    // Valuations
    company.valuationType.forEach(function(type, valuationIndex) {
        company.valuationType[valuationIndex] = type.trim();
    });


    // Financials
    company.financialType.forEach(function(type, financialIndex) {
        company.financialType[financialIndex] = type.trim();
    });


    // Markets
    company.marketType.forEach(function(type, marketIndex) {
        company.marketType[marketIndex] = type.trim();
    });
    company.marketDimension.forEach(function(dimension, marketIndex) {
        company.marketDimension[marketIndex] = dimension.trim();
    });


    // Models
    company.modelType.forEach(function(type, modelIndex) {
        company.modelType[modelIndex] = type.trim();
    });


    // Units
    company.unitYears.forEach(function(years, unitIndex) {
        company.unitYears[unitIndex] = years.trim();
    });
    company.unitModels.forEach(function(models, modelIndex) {
        company.unitModels[modelIndex] = models.trim();
    });


    // Create a tree out of the entire unitOutline.
    var modelColorScheme = world.colorSchemes[SearchDefault('modelColorScheme', company, tuning.modelColorScheme)];

    company.units = [];
    company.rootUnit = {
        name: company.name + '\nUnits',
        unitIndex: -1,
        parent: null,
        children: [],
        value: 1,
        indent: -1,
        depth: 0
    };

    var parentStack = [
        company.rootUnit
    ];

    //Tag(company.rootUnit, "rootUnit");

    company.unitOutline.forEach(function(unitName, unitIndex) {

        for (var indent = 0, nameLength = unitName.length; indent < nameLength; indent++) {
            if (unitName[indent] != ' ') {
                break;
            }
        }

        while (indent <= parentStack[parentStack.length - 1].indent) {
            parentStack.pop();
        }
        var parentUnit = parentStack[parentStack.length - 1];

        var unit = {
            name: unitName.trim(),
            unitIndex: unitIndex,
            parent: parentUnit,
            children: [],
            value: 1,
            modelNames: [],
            modelIndexes: [],
            modelColors: [],
            indent: indent,
            depth: parentStack.length
        };
        parentUnit.children.push(unit);
        company.units.push(unit);

        var modelString = company.unitModels[unitIndex].trim();
        var unitModelCount = 0;
        if (modelString) {

            unit.modelNames = modelString.split(',');
            unitModelCount = unit.modelNames.length;

            unit.modelNames.forEach(function(modelName, unitModelIndex) {

                var modelName = modelName.trim();
                unit.modelNames[unitModelIndex] = modelName;
                var modelIndex = company.modelType.indexOf(modelName);

                if (modelIndex == -1) {
                    modelIndex = 0;
                    console.log("private.js: can't find modelIndex for modelName: " + modelName + " modelType: " + JSON.stringify(company.modelType));
                }

                unit.modelIndexes.push(modelIndex);
                var colorIndex = modelIndex % modelColorScheme.length;
                unit.modelColors.push(modelColorScheme[colorIndex]);

            });

        }

        parentStack.push(unit);
        //Tag(unit, "unit");
    });


    // Verbs and Subjects
    company.verbToIndex = {};
    var verbCount = 0;
    company.verb.forEach(function(verbName) {
        if (company.verbToIndex[verbName] === undefined) {
            company.verbToIndex[verbName] = verbCount++;
        }
    });


    // Merges
    if (company.mergeModels) {
        company.mergeModels.forEach(function(models, mergeIndex) {
            company.mergeModels[mergeIndex] = models.trim();
        });
    }
    if (company.mergeVerbTable) {
        company.mergeVerbTable.forEach(function(years, mergeIndex) {
            years.forEach(function(type, yearIndex) {
                years[yearIndex] = type.trim();
            });
        });
    }


    // Layout Parameters
    var x = -0.5 * yearSpacing * (yearsShown - 1);
    var y = 0;
    var z = 0;

    // Create company.
    var companyObject = CreatePrefab({
        obj: {
            company: company,
            yearObjects: [],
            baseObjects: [],
            bundleObjects: [],
        },
        prefab: "Prefabs/Company"
    });
    company.companyObject = companyObject;


    // Create years asynchronously.
    for (var yearIndex = firstYearIndex; yearIndex <= lastYearIndex; yearIndex++) {
        (function(yearIndex, x, y, z) {
            window.setTimeout(function() {
                CreateYear(company, yearIndex, x, y, z);
            },
            tuning.yearBeforeDelay + (yearIndex * tuning.yearCreateDelay));
        })(yearIndex, x, y, z);
        x += yearSpacing;
    }


    // Create unit pies.
    CreateUnitPies(company, null, 'units_' + company.name, company.rootUnit);


    // Create market pie.
    var slices = [];
    company.marketType.forEach(function(marketName, marketIndex) {
        slices.push({
            items: [
                {
                    label: marketName,
                    onenteritem: function(item, slice, pie, target) {
                        //console.log("Item Market Enter", marketName);
                        DescribeMarket(company, marketIndex, -1);
                        HighlightMarkets(company, [marketIndex]);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Market Exit", marketName);
                        HighlightMarkets(company, null);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['markets_' + company.name] = {
        label: company.name + '\nMarkets',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };


    // Create model pie.
    var slices = [];
    company.modelType.forEach(function(modelName, modelIndex) {
        slices.push({
            items: [
                {
                    label: modelName,
                    onenteritem: function(item, slice, pie, target) {
                        DescribeModel(company, modelIndex, -1, -1);
                    },
                    ontrackitem: function(item, slice, pie, target) {
                        var distance =
                            globals.pieTracker.distance -
                            SearchDefault('inactiveDistance', pie, globals.pieTracker.inactiveDistance);
                        var cameraAttraction = 
                            tuning.modelHighlightCameraAttraction +
                            tuning.modelHighlightCameraAttractionPieDistanceScale * distance;
                        HighlightModels(company, [modelName], tuning.modelHighlightScale, cameraAttraction);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Model Exit", modelName);
                        HighlightModels(company, null, 0, 0);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['models_' + company.name] = {
        label: company.name + '\nModels',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };


    // Create verb subject pies.
    var slices = [];
    company.verb.forEach(function(verbName, verbSubjectIndex) {
        var verbSubject = verbName + ' ' + company.subject[verbSubjectIndex];
        slices.push({
            items: [
                {
                    label: verbSubject,
                    onenteritem: function(item, slice, pie, target) {
                        //console.log("Item Verb Enter", verbSubject);
                        DescribeVerbSubject(company, verbSubjectIndex, -1, -1);
                        HighlightVerbSubjects(company, [verbSubjectIndex]);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Verb Exit", verbSubject);
                        HighlightVerbSubjects(company, null);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['verbs_' + company.name] = {
        label: company.name + '\nVerbs',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };


    // Create company combo navigation / data pie slices.
    var yearCount = company.years.length;
    var topSliceSize = Math.PI * (1.0 / (yearCount + 2));
    var slices = [];

    // Add "Back" navigation slice.
    slices.push({
        items: [
            {
                label: 'Back',
                onselectitem: function() {
                    HideCompany(company);
                }
            }
        ],
        sliceSize: topSliceSize
    });

    // Add top year navigation slices.
    company.years.forEach(function(year, yearIndex) {
        slices.push({
            items: [
                {
                    label: '' + year,
                    onenteritem: function(item, slice, pie, target) {
                        for (var i = 0; i < company.years.length; i++) {
                            PuffYearSoon(company.companyObject.yearObjects[i], i == yearIndex);
                        }
                    },
                    onexititem: function(item, slice, pie, target) {
                        if (!globals.pieTracker.justSelected) {
                            for (var i = 0; i < company.years.length; i++) {
                                PuffYearSoon(company.companyObject.yearObjects[i], false);
                            }
                        }
                    },
                    onselectitem: function(item, slice, pie, target) {
                        FocusYear(company, yearIndex);
                        for (var i = 0; i < company.years.length; i++) {
                            PuffYearSoon(company.companyObject.yearObjects[i], i, i == yearIndex);
                        }
                    }
                }
            ],
            sliceSize: topSliceSize
        });
    });

    // Add "All" year navigation slice.
    slices.push({
        items: [
            {
                label: 'All',
                onselectitem: function() {
                    FocusCompany(company);
                    for (var yearIndex = 0; yearIndex < company.years.length; yearIndex++) {
                        PuffYearSoon(company.companyObject.yearObjects[yearIndex], true);
                    }
                },
                onenteritem: function(item, slice, pie, target) {
                    for (var yearIndex = 0; yearIndex < company.years.length; yearIndex++) {
                        PuffYearSoon(company.companyObject.yearObjects[yearIndex], true);
                    }
                },
                onexititem: function(item, slice, pie, target) {
                    if (!globals.pieTracker.justSelected) {
                        for (var yearIndex = 0; yearIndex < company.years.length; yearIndex++) {
                            PuffYearSoon(company.companyObject.yearObjects[yearIndex], false);
                        }
                    }
                }
            }
        ],
        sliceSize: topSliceSize
    });

    // Create other bottom data slices.
    var commands = [
        ['Models', 'models_' + company.name, null],
        ['Markets', 'markets_' + company.name, null],
        ['Verbs', 'verbs_' + company.name, null],
        ['Units', 'units_' + company.name, null]
    ];
    var commandCount = commands.length;
    var bottomSliceSize = Math.PI * (1.0 / commandCount);
    commands.forEach(function(command, commandIndex) {
        var command = commands[commandIndex];
        slices.push({
            items: [{
                label: command[0],
                pieID: command[1],
                onselectitem: command[2]
            }],
            sliceSize: bottomSliceSize
        });
    });

    // Create company pie.
    globals.pieTracker.pies['company_' + company.name] = {
        label: company.name,
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        initialDirection: Math.PI,
        subtend: 2.0 * Math.PI,
        itemDistance: 100
    }

}


////////////////////////////////////////////////////////////////////////
// Create a year.


function CreateYear(company, yearIndex, x, y, z)
{
    var world = globals.world;
    var tuning = world.tuning;

    var year =
        ((yearIndex >= 0) &&
         (yearIndex < company.years.length))
            ? company.years[yearIndex]
            : 0;

    var valuation = 0;
    var yearHeight = 0;
    var yearHeightMin = SearchDefault('yearHeightMin', company, tuning.yearHeightMin);
    var yearHeightMax = SearchDefault('yearHeightMax', company, tuning.yearHeightMax);

    if (year) {

        company.valuationTable.forEach(function(valuationYears) {
            valuation += valuationYears[yearIndex];
        });

        yearHeight =
            yearHeightMin +
            (yearHeightMin == yearHeightMax)
                ? yearHeightMin
                : (((valuation - company.valuationMin) /
                    (company.valuationMax - company.valuationMin)) *
                   (yearHeightMax - yearHeightMin));

         //console.log("yearHeight", yearHeight, "yearHeightMin", yearHeightMin, "yearHeightMax", yearHeightMax, "valuation", valuation, "valuationMin", company.valuationMin, "valuationMax", company.valuationMax);

    }

    var anchorObject = CreatePrefab({
        prefab: "Prefabs/Anchor",
        parent: 'object:' + company.companyObject.id,
        update: {
            dragTracking: true,
            "transform/localPosition": {
                x: x,
                y: tuning.baseElevation,
                z: z
            },
            "component:Rigidbody/drag": tuning.anchorDrag,
            "component:Rigidbody/constraints": tuning.anchorConstraints,
            "component:Rigidbody/collisionDetectionMode": tuning.anchorCollisionDetectionMode,
            "component:Rigidbody/isKinematic": false
        },
        interests: {
            DragStart: { // DragStart on anchorObject.
                query: {
                    mousePosition: 'mousePosition'
                },
                handler: function(obj, results) {
                    //console.log("private.js: Anchor: DragStart", obj.id);
                    obj.dragMoved = false;
                    obj.dragStartPosition = results.mousePosition
                }
            },
            DragMove: {
                query: {
                    mousePosition: 'mousePosition'
                },
                handler: function(obj, results) {
                    //console.log("private.js: Anchor: DragStart", obj.id);
                    if (obj.dragMoved) {
                        return;
                    }

                    var dx = results.mousePosition.x - obj.dragStartPosition.x;
                    var dy = results.mousePosition.y - obj.dragStartPosition.y;
                    if (dx || dy) {
                        obj.dragMoved = true;
                    }
                }
            },
            DragStop: { // DragStop on anchorObject.
                handler: function(obj, results) {
                    //console.log("private.js: Anchor: DragStop", obj.id);
                    UpdateObject(obj.baseObject, {
                        sleepNow: true
                    });

                    if (!obj.dragMoved) {
                        return;
                    }

                    obj.dragMoved = false;
                }
            }
        }
    });

    var baseObject = CreatePrefab({
        obj: {
            anchorObject: anchorObject,
            tiles: [],
            tileColors: [],
            tileHeights: [],
            tilePositions: []
        },
        prefab: 'Prefabs/HexBase',
        parent: 'object:' + company.companyObject.id,
        update: {
            'mouseTrackingPosition': false,
            'transform/localPosition': {
                x: x,
                y: tuning.baseElevation,
                z: z
            },
            'transform:Hexes/localScale': {
                x: tuning.baseScale,
                y: tuning.baseScale,
                z: tuning.baseScale
            },
            'component:Rigidbody/isKinematic': false,
            'component:Rigidbody/useGravity': false,
            'component:Rigidbody/mass': tuning.baseMass,
            'component:Rigidbody/drag': tuning.baseDrag,
            'component:Rigidbody/constraints': 'FreezePositionY,FreezeRotationX,FreezeRotationY,FreezeRotationZ',
            'component:Rigidbody/collisionDetectionMode': tuning.baseCollisionDetectionMode,
            'component:SpringJoint/spring': tuning.baseSpring,
            'component:SpringJoint/damper': tuning.baseDamper,
            'component:SpringJoint/tolerance': tuning.baseTolerance,
            'component:SpringJoint/enableCollision': tuning.baseEnableCollision,
            'component:SpringJoint/autoConfigureConnectedAnchor': false,
            'component:SpringJoint/anchor': {},
            'component:SpringJoint/connectedBody!': 'object:' + anchorObject.id + '/component:Rigidbody',
            'component:TrackerProxy/target!': 'object:' + anchorObject.id
        },
        interests: {
            TileEnter: {
                query: {
                    currentTileIndex: 'currentTileIndex'
                },
                handler: function(obj, results) {
                    UpdateObject(obj, {
                        mouseTrackingPosition: true
                    });
                    var tile = obj.tiles ? obj.tiles[results.currentTileIndex] : null;
                    //console.log("results.currentTileIndex", results.currentTileIndex);
                    if (tile && !tile.dummy) {
                        if ((!obj.highlightedTile) ||
                            (obj.highlightedTile.marketIndex != tile.marketIndex)) {
                            obj.highlightedTile = tile;
                            //console.log("tile", tile, "marketIndex", tile.marketIndex);
                            DescribeMarket(company, tile.marketIndex, yearIndex);
                            HighlightMarkets(company, [tile.marketIndex]);
                        }
                    } else {
                        if (obj.highlightedTile) {
                            HighlightMarkets(company, null);
                            obj.highlightedTile = null;
                        }
                    }
                }
            },
            MouseExit: {
                handler: function(obj, results) {
                    if (obj.highlightedTile) {
                        HighlightMarkets(company, null);
                        obj.highlightedTile = null;
                    }
                }
            },
            MouseDown: {
                handler: function(obj, results) {
                    if (yearIndex >= 0) {
                        PuffYearSoon(obj.yearObject, !obj.puffedUp);
                    }
                }
            }
        }
    });

    //Tag(baseObject, "baseObject");

    var baseObjects = company.companyObject.baseObjects;
    var baseIndex = baseObjects.length;
    baseObjects.push(baseObject);

    var lastBaseObject =
        (baseIndex == 0)
            ? null
            : baseObjects[baseIndex - 1];

    baseObject.lastBaseObject = lastBaseObject;
    if (lastBaseObject) {
        lastBaseObject.nextBaseObject = baseObject;
    }

    anchorObject.baseObject = baseObject;

    if (!year || 
        !tuning.baseMarketTilesEnabled) {

        // Create one dummy hex if there is no year.

        var pos = world.hexBases[0].position;
        var color = '#808080';

        var tile = {
            dummy: true,
            yearIndex: -1,
            marketIndex: -1,
            tileIndex: 0,
            hexTileIndex: 0,
            color: color,
            height: tuning.hexDummyHeight,
            position: {
                x: pos.x * tuning.hexDX,
                y: pos.y,
                z: pos.z * tuning.hexDY
            }
        };

        baseObject.tiles.push(tile);
        baseObject.tileColors.push(tile.color);
        baseObject.tileHeights.push(tile.height);
        baseObject.tilePositions.push(tile.position);

    } else {

        // Create a set of base hexes for each market.

        var hexTileIndex = 0;
        var marketColorScheme = world.colorSchemes[SearchDefault('marketColorScheme', company, tuning.marketColorScheme)];

        company.marketTable.forEach(function(market, marketIndex) {

            var marketSize = company.marketTable[marketIndex][yearIndex];
            if (marketSize == 0) {
                return;
            }

            var colorIndex = marketIndex % marketColorScheme.length;
            var color = marketColorScheme[colorIndex];
            var marketHexTileCount =
                Math.max(1,
                    Math.floor(
                        marketSize /
                        company.hexTileValue));

            //console.log("year", year, "marketSize", marketSize, "hexTileValue", company.hexTileValue, "marketHexTileCount", marketHexTileCount);

            for (var tileIndex = 0; tileIndex < marketHexTileCount; tileIndex++, hexTileIndex++) {
                (function(tileIndex, hexTileIndex) {

                    var pos =
                        world.hexBases[hexTileIndex].position;

                    var tile = {
                        dummy: false,
                        yearIndex: yearIndex,
                        marketIndex: marketIndex,
                        tileIndex: tileIndex,
                        hexTileIndex: hexTileIndex,
                        color: color,
                        height: tuning.hexHeight,
                        position: {
                            x: pos.x * tuning.hexDX,
                            y: pos.y,
                            z: pos.z * tuning.hexDY
                        }
                    };

                    baseObject.tiles.push(tile);
                    baseObject.tileColors.push(tile.color);
                    baseObject.tileHeights.push(tile.height);
                    baseObject.tilePositions.push(tile.position);

                })(tileIndex, hexTileIndex);
            }

        });

    }

    UpdateObject(baseObject, {
        tileColors: baseObject.tileColors,
        tileHeights: baseObject.tileHeights,
        tilePositions: baseObject.tilePositions,
        tileScale: company.hexTileScale
    });

    if (year) {

        if (tuning.yearEnabled) {

            var yearPosition = {
                x: x,
                y: y + yearHeight,
                z: z
            }
            //console.log("year", year, "yearPosition", yearPosition.x, yearPosition.y, yearPosition.z, "yearHeight", yearHeight, "x", x, "y", y, "z", z, "hexHeight", tuning.hexHeight, "tuning", JSON.stringify(tuning));

            var yearObject = CreatePrefab({
                obj: {
                    anchorObject: anchorObject,
                    baseObject: baseObject,
                    companyObject: company.companyObject,
                    company: company,
                    name: company.name + ' ' + year,
                    year: year,
                    yearIndex: yearIndex,
                    unitObjects: [],
                    leafUnitObjects: [],
                    mergeIndexes: [],
                    mergeModels: [],
                    mergeVerbs: [],
                    mergeUniqueVerbs: [],
                    mergeAnchorObject: null,
                    mergeObject: null,
                    mergeBaseObject: null,
                    position: yearPosition,
                    height: yearHeight,
                    isMerge: false
                },
                prefab: 'Prefabs/Ball',
                component: 'Tracker',
                parent: 'object:' + baseObject.id,
                update: {
                    "dragTracking": false,
                    "transform/position": yearPosition,
                    "transform/localScale": globals.tinyScale,
                    "component:MeshRenderer/materials": [tuning.yearMaterial],
                    "component:MeshRenderer/enabled": tuning.yearRendererEnabled,
                    "component:Collider/sharedMaterial": tuning.yearPhysicMaterial,
                    "component:Collider/radius": tuning.yearColliderRadius,
                    "component:Collider/enabled": tuning.yearColliderEnabled,
                    "component:Rigidbody/isKinematic": tuning.yearIsKinematic,
                    "component:Rigidbody/useGravity": tuning.yearUseGraviy,
                    "component:Rigidbody/constraints": tuning.yearConstraints,
                    "component:Rigidbody/collisionDetectionMode": tuning.yearCollisionDetectionMode,
                    "component:Rigidbody/mass": tuning.yearMass,
                    "component:Rigidbody/angularDrag": tuning.yearAngularDrag
                }
            });

            //Tag(yearObject, "yearObject");

            company.companyObject.yearObjects.push(yearObject);
            anchorObject.yearObject = yearObject;
            baseObject.yearObject = yearObject;

            if (tuning.yearLabels) {

                yearObject.labelObject = CreatePrefab({
                    prefab: "Prefabs/ProText",
                    parent: 'object:' + company.companyObject.id,
                    update: {
                        'textMesh/text': '' + year,
                        'textMesh/fontSize': tuning.yearLabelFontSize,
                        trackPosition: 'Transform',
                        'transformPosition!': 'object:' + yearObject.id + '/transform',
                        extraOffset: { y: tuning.yearLabelHeight },
                        trackRotation: 'TransformYaw'
                    }
                });

            }

            if (tuning.unitEnabled) {

                // Filter out the zero units, and create unit dicts to represent the non-zero units.

                var modelColorScheme = world.colorSchemes[SearchDefault('modelColorScheme', company, tuning.modelColorScheme)];
                var unitSizeMin = SearchDefault('unitSizeMin', company, tuning.unitSizeMin);
                var unitSizeMax = SearchDefault('unitSizeMax', company, tuning.unitSizeMax);
                var unitSizeRange = unitSizeMax - unitSizeMin;

                yearObject.units = [];
                yearObject.nonZeroUnits = [];

                company.unitOutline.forEach(function(indentedName, unitIndex) {

                    var unit = {
                        indentedName: indentedName,
                        name: indentedName.trim(),
                        unitIndex: unitIndex,
                        parent: null,
                        children: [],
                        value: company.unitTable[unitIndex][yearIndex],
                        modelNames: [],
                        modelIndexes: [],
                        modelColors: []
                    };
                    yearObject.units.push(unit);
                    if (unit.value) {
                        yearObject.nonZeroUnits.push(unit);
                    }

                    var modelString = company.unitModels[unitIndex].trim();
                    var unitModelCount = 0;
                    if (modelString) {

                        unit.modelNames = modelString.split(',');
                        unitModelCount = unit.modelNames.length;

                        unit.modelNames.forEach(function(modelName, unitModelIndex) {

                            var modelName = modelName.trim();
                            unit.modelNames[unitModelIndex] = modelName;
                            var modelIndex = company.modelType.indexOf(modelName);

                            if (modelIndex == -1) {
                                modelIndex = 0;
                                console.log("private.js: can't find modelIndex for modelName: " + modelName + " modelType: " + JSON.stringify(company.modelType));
                            }

                            unit.modelIndexes.push(modelIndex);
                            var colorIndex = modelIndex % modelColorScheme.length;
                            unit.modelColors.push(modelColorScheme[colorIndex]);

                        });

                    }

                });

                // Use the year as the root.
                yearObject.rootUnit = {
                    unitObject: yearObject,
                    name: '' + year,
                    unitIndex: -1,
                    parent: null,
                    children: [],
                    value: 0,
                    indent: -1,
                    depth: 0,
                    position: yearObject.position
                };
                var parentStack = [
                    yearObject.rootUnit
                ];

                // Arrange the non-zero units into a tree.
                var nonZeroUnitCount = yearObject.nonZeroUnits.length;

                yearObject.nonZeroUnits.forEach(function(unit, nonZeroUnitIndex) {

                    var unitName = unit.indentedName;
                    for (var indent = 0, nameLength = unitName.length; indent < nameLength; indent++) {
                        if (unitName[indent] != ' ') {
                            break;
                        }
                    }

                    while (indent <= parentStack[parentStack.length - 1].indent) {
                        parentStack.pop();
                    }
                    var parentUnit = parentStack[parentStack.length - 1];
                    parentUnit.children.push(unit);

                    unit.nonZeroUnitIndex = nonZeroUnitIndex;
                    unit.indent = indent;
                    unit.depth = parentStack.length;
                    unit.parent = parentUnit;
                    unit.children = [];
                    unit.size =
                        unitSizeMin +
                        ((unitSizeRange == 0)
                            ? 0
                            : (unitSizeRange *
                               (unit.value / company.unitValueMax)));

                    //console.log("unit.size", unit.size, "unitSizeMin", unitSizeMin, "unitSizeRange", unitSizeRange, "unit.value", unit.value, "company.unitValueMax", company.unitValueMax);

                    parentStack.push(unit);

                });

                var scope = {
                    company: company,
                    yearObject: yearObject,
                    layoutCount: yearObject.nonZeroUnits.length,
                    layoutIndex: 0
                };

                yearObject.rootUnit.children.forEach(function(subUnit, index) {
                    //window.setTimeout(function() {
                        CreateUnitTree(scope, subUnit);
                    //}, tuning.unitCreateDelay * (index + 1));
                });

            }

        }

        if (tuning.bundleEnabled) {

            var verbSubjectCount = company.verb.length;
            while ((verbSubjectCount > 0) &&
                   (company.verbSubjectTable[verbSubjectCount - 1][yearIndex] == "")) {
                verbSubjectCount--;
            }

            if (verbSubjectCount > 0) {

                var fromID = lastBaseObject.id;
                var fromYearIndex =
                    lastBaseObject.yearObject
                        ? lastBaseObject.yearObject.yearIndex
                        : -1;
                var fromHeight =
                    lastBaseObject.yearObject
                        ? (tuning.bundleElevationYear + lastBaseObject.yearObject.height)
                        : tuning.bundleElevationBase;

                var toID = baseObject.id;
                var toYearIndex =
                    baseObject.yearObject
                        ? baseObject.yearObject.yearIndex
                        : -1;
                var toHeight =
                    baseObject.yearObject
                        ? (tuning.bundleElevationYear + baseObject.yearObject.height)
                        : tuning.bundleElevationBase;

                var bundleObject =
                    CreatePrefab({
                        obj: {
                            wireObjects: []
                        },
                        prefab: 'Prefabs/Bundle',
                        parent: 'object:' + company.companyObject.id,
                        update: {
                            'fromTransform!': 'object:' + fromID + '/transform',
                            'toTransform!': 'object:' + toID + '/transform',
                            fromRotation: 90,
                            toRotation: -90,
                            updateWiresAlways: true,
                            updateWireHeight: false,
                            fromLocalOffset: { x: (verbSubjectCount * 0.5) + tuning.bundleGap, y: fromHeight }, // Left justify the start the bundle.
                            toLocalOffset: { x: (verbSubjectCount * -0.5) - tuning.bundleGap, y: toHeight }, // Right justify the end of the bundle.
                            fromLocalSpread: { y: verbSubjectCount * tuning.bundleWireSpread },
                            toLocalSpread: { y: verbSubjectCount * tuning.bundleWireSpread }
                        }
                    });

                company.companyObject.bundleObjects.push(bundleObject);
                yearObject.bundleObject = bundleObject;

                var verbSubjectColorScheme = world.colorSchemes[SearchDefault('verbSubjectColorScheme', company, tuning.verbSubjectColorScheme)];

                for (var verbSubjectIndex = verbSubjectCount - 1;
                     verbSubjectIndex >= 0;
                     verbSubjectIndex--) {
                     (function(verbSubjectIndex) {
                        var verb = company.verb[verbSubjectIndex];
                        var verbIndex = company.verbToIndex[verb];
                        var color = verbSubjectColorScheme[verbIndex % verbSubjectColorScheme.length];

                        //console.log("verbSubjectIndex", verbSubjectIndex, "verb", verb, "verbIndex", company.verbToIndex[verb], "color", color, "verbSubjectColorScheme", verbSubjectColorScheme, "length", verbSubjectColorScheme.length);

                        //console.log("wireUpdate", JSON.stringify(wireUpdate));

                        var fromBudObject = null;
                        var toBudObject = null;

                        if (tuning.bundleBuds) {

                            fromBudObject =
                                CreatePrefab({
                                    obj: {
                                        yearIndex: yearIndex,
                                        verbSubjectIndex: verbSubjectIndex,
                                        verbIndex: verbIndex,
                                        color: color
                                    },
                                    prefab: tuning.bundleBudPrefab,
                                    parent: 'object:' + bundleObject.id,
                                    update: {
                                        'transform/localScale': {
                                            x: tuning.bundleBudScale,
                                            y: tuning.bundleBudScale,
                                            z: tuning.bundleBudScale
                                        },
                                        'component:MeshRenderer/material/color': color
                                    },
                                    interests: {
                                        MouseEnter: {
                                            handler: function(obj, results) {
                                                DescribeVerbSubject(company, verbSubjectIndex, fromYearIndex, -1);
                                                HighlightVerbSubjects(company, [verbSubjectIndex]);
                                            }
                                        },
                                        MouseExit: {
                                            handler: function(obj, results) {
                                                HighlightVerbSubjects(company, null);
                                            }
                                        }
                                    }
                                });

                            toBudObject =
                                CreatePrefab({
                                    obj: {
                                        yearIndex: yearIndex,
                                        verbSubjectIndex: verbSubjectIndex,
                                        verbIndex: verbIndex,
                                        color: color
                                    },
                                    prefab: tuning.bundleBudPrefab,
                                    parent: 'object:' + bundleObject.id,
                                    update: {
                                        'transform/localScale': {
                                            x: tuning.bundleBudScale,
                                            y: tuning.bundleBudScale,
                                            z: tuning.bundleBudScale
                                        },
                                        'component:MeshRenderer/material/color': color
                                    },
                                    interests: {
                                        MouseEnter: {
                                            handler: function(obj, results) {
                                                DescribeVerbSubject(company, verbSubjectIndex, toYearIndex, -1);
                                                HighlightVerbSubjects(company, [verbSubjectIndex]);
                                            }
                                        },
                                        MouseExit: {
                                            handler: function(obj, results) {
                                                //console.log("MouseExit To Bud", obj, results);
                                                HighlightVerbSubjects(company, null);
                                            }
                                        }
                                    }
                                });

                        }

                        var wireObject =
                            CreatePrefab({
                                obj: {
                                    fromBudObject: fromBudObject,
                                    toBudObject: toBudObject,
                                    yearIndex: yearIndex,
                                    verbSubjectIndex: verbSubjectIndex,
                                    verbIndex: verbIndex,
                                    color: color
                                },
                                prefab: 'Prefabs/Wire',
                                parent: 'object:' + bundleObject.id,
                                update: {
                                    wireStart: 0,
                                    wireEnd: 1,
                                    radius: tuning.bundleWireRadius,
                                    fromEndDistance:     { x: tuning.bundleWireFromEndDistance },
                                    fromEndDirection:    { x: tuning.bundleWireFromEndDirection },
                                    fromMiddleDistance:  { x: tuning.bundleWireFromMiddleDistance },
                                    fromMiddleDirection: { x: tuning.bundleWireFromMiddleDirection },
                                    toEndDistance:       { x: tuning.bundleWireToEndDistance },
                                    toEndDirection:      { x: tuning.bundleWireToEndDirection },
                                    toMiddleDistance:    { x: tuning.bundleWireToMiddleDistance },
                                    toMiddleDirection:   { x: tuning.bundleWireToMiddleDirection },
                                    'fromView!': fromBudObject ? ('object:' + fromBudObject.id + '/transform') : null,
                                    'toView!': toBudObject ? ('object:' + toBudObject.id + '/transform') : null,
                                    'color': color
                                },
                                interests: {
                                    MouseEnter: {
                                        handler: function(obj, results) {
                                            DescribeVerbSubject(company, verbSubjectIndex, fromYearIndex, toYearIndex);
                                            HighlightVerbSubjects(company, [verbSubjectIndex]);
                                        }
                                    },
                                    MouseExit: {
                                        handler: function(obj, results) {
                                            HighlightVerbSubjects(company, null);
                                        }
                                    }
                                }
                            });

                        bundleObject.wireObjects.push(wireObject);

                     })(verbSubjectIndex);
                }

                UpdateObject(bundleObject, {
                    updateWires: true
                });

            }

        }

        if (tuning.mergeEnabled && company.mergeOutline && company.mergeVerbTable) {

            var mergeCount = company.mergeOutline.length;

            for (var mergeIndex = 0; mergeIndex < mergeCount; mergeIndex++) {
                var mergeVerb = company.mergeVerbTable[mergeIndex][yearIndex];
                if (mergeVerb == "") {
                    continue;
                }
                yearObject.mergeIndexes.push(mergeIndex);
                yearObject.mergeVerbs.push(mergeVerb);
                if (yearObject.mergeUniqueVerbs.indexOf(mergeVerb) == -1) {
                    yearObject.mergeUniqueVerbs.push(mergeVerb);
                }
            }

            var mergeBasePosition = {
                x: x + tuning.mergeBaseXOffset,
                y: tuning.baseElevation,
                z: z + tuning.mergeBaseZOffset,
            }

            var mergeAnchorObject = yearObject.mergeAnchorObject = CreatePrefab({
                prefab: "Prefabs/Anchor",
                parent: 'object:' + company.companyObject.id,
                update: {
                    dragTracking: true,
                    "transform/localPosition": mergeBasePosition,
                    "component:Rigidbody/drag": tuning.anchorDrag,
                    "component:Rigidbody/constraints": tuning.anchorConstraints,
                    "component:Rigidbody/collisionDetectionMode": tuning.anchorCollisionDetectionMode,
                    "component:Rigidbody/isKinematic": false
                },
                interests: {
                    DragStart: { // DragStart on anchorObject.
                        query: {
                            mousePosition: 'mousePosition'
                        },
                        handler: function(obj, results) {
                            //console.log("private.js: Anchor: DragStart", obj.id);
                            obj.dragMoved = false;
                            obj.dragStartPosition = results.mousePosition
                        }
                    },
                    DragMove: {
                        query: {
                            mousePosition: 'mousePosition'
                        },
                        handler: function(obj, results) {
                            //console.log("private.js: Anchor: DragStart", obj.id);
                            if (obj.dragMoved) {
                                return;
                            }

                            var dx = results.mousePosition.x - obj.dragStartPosition.x;
                            var dy = results.mousePosition.y - obj.dragStartPosition.y;
                            if (dx || dy) {
                                obj.dragMoved = true;
                            }
                        }
                    },
                    DragStop: { // DragStop on anchorObject.
                        handler: function(obj, results) {
                            //console.log("private.js: Anchor: DragStop", obj.id);
                            UpdateObject(obj.baseObject, {
                                sleepNow: true
                            });

                            if (!obj.dragMoved) {
                                return;
                            }

                            obj.dragMoved = false;
                        }
                    }
                }
            });

            var mergeBaseObject = yearObject.mergeBaseObject = CreatePrefab({
                obj: {
                    anchorObject: mergeAnchorObject,
                    tiles: [],
                    tileColors: [],
                    tileHeights: [],
                    tilePositions: [],
                    mergedYearObject: yearObject,
                },
                prefab: 'Prefabs/HexBase',
                parent: 'object:' + company.companyObject.id,
                update: {
                    'mouseTrackingPosition': false,
                    'transform/localPosition': mergeBasePosition,
                    'transform:Hexes/localScale': {
                        x: tuning.baseScale,
                        y: tuning.baseScale,
                        z: tuning.baseScale
                    },
                    'component:Rigidbody/isKinematic': false,
                    'component:Rigidbody/useGravity': false,
                    'component:Rigidbody/mass': tuning.baseMass,
                    'component:Rigidbody/drag': tuning.baseDrag,
                    'component:Rigidbody/constraints': 'FreezePositionY,FreezeRotationX,FreezeRotationY,FreezeRotationZ',
                    'component:Rigidbody/collisionDetectionMode': tuning.baseCollisionDetectionMode,
                    'component:SpringJoint/spring': tuning.baseSpring,
                    'component:SpringJoint/damper': tuning.baseDamper,
                    'component:SpringJoint/tolerance': tuning.baseTolerance,
                    'component:SpringJoint/enableCollision': tuning.baseEnableCollision,
                    'component:SpringJoint/autoConfigureConnectedAnchor': false,
                    'component:SpringJoint/anchor': {},
                    'component:SpringJoint/connectedBody!': 'object:' + mergeAnchorObject.id + '/component:Rigidbody',
                    'component:TrackerProxy/target!': 'object:' + mergeAnchorObject.id
                },
                interests: {
                    MouseDown: {
                        handler: function(obj, results) {
                            if (yearIndex >= 0) {
                                PuffYearSoon(obj.mergeObject, !obj.puffedUp);
                            }
                        }
                    }
                }
            });

            mergeAnchorObject.baseObject = mergeBaseObject;

            var pos = world.hexBases[0].position;
            var color = '#808080';

            var tile = {
                dummy: true,
                yearIndex: -1,
                marketIndex: -1,
                tileIndex: 0,
                hexTileIndex: 0,
                color: color,
                height: tuning.hexDummyHeight,
                position: {
                    x: pos.x * tuning.hexDX,
                    y: pos.y,
                    z: pos.z * tuning.hexDY
                }
            };

            mergeBaseObject.tiles.push(tile);
            mergeBaseObject.tileColors.push(tile.color);
            mergeBaseObject.tileHeights.push(tile.height);
            mergeBaseObject.tilePositions.push(tile.position);

            var mergePosition = {
                x: mergeBasePosition.x,
                y: y + tuning.mergeHeight,
                z: mergeBasePosition.z
            }
            //console.log("mergePosition", mergePosition.x, mergePosition.y, mergePosition.z, "mergeHeight", tuning.mergeHeight, "x", x, "y", y, "z", z);

            var mergeObject = CreatePrefab({
                obj: {
                    anchorObject: anchorObject,
                    baseObject: mergeBaseObject,
                    companyObject: company.companyObject,
                    company: company,
                    name: company.name + ' ' + yearObject.year + ' Merge',
                    year: yearObject.year,
                    yearIndex: yearObject.yearIndex,
                    unitObjects: [],
                    leafUnitObjects: [],
                    position: mergePosition,
                    height: tuning.mergeHeight,
                    isMerge: true
                },
                prefab: 'Prefabs/Ball',
                component: 'Tracker',
                parent: 'object:' + mergeBaseObject.id,
                update: {
                    "dragTracking": false,
                    "transform/position": mergePosition,
                    "transform/localScale": globals.tinyScale,
                    "component:MeshRenderer/materials": [tuning.yearMaterial],
                    "component:MeshRenderer/enabled": tuning.yearRendererEnabled,
                    "component:Collider/sharedMaterial": tuning.yearPhysicMaterial,
                    "component:Collider/radius": tuning.yearColliderRadius,
                    "component:Collider/enabled": tuning.yearColliderEnabled,
                    "component:Rigidbody/isKinematic": tuning.yearIsKinematic,
                    "component:Rigidbody/useGravity": tuning.yearUseGraviy,
                    "component:Rigidbody/constraints": tuning.yearConstraints,
                    "component:Rigidbody/collisionDetectionMode": tuning.yearCollisionDetectionMode,
                    "component:Rigidbody/mass": tuning.yearMass,
                    "component:Rigidbody/angularDrag": tuning.yearAngularDrag
                }
            });

            //Tag(mergeObject, 'mergeObject');

            yearObject.mergeObject = mergeObject;
            company.companyObject.mergeObject = mergeObject;
            mergeAnchorObject.mergeObject = mergeObject;
            mergeAnchorObject.yearObject = yearObject;
            mergeBaseObject.mergeObject = mergeObject;
            mergeBaseObject.yearObject = yearObject;

            if (tuning.unitEnabled) {

                // Filter out the zero units, create unit dicts to represent the non-zero units.

                var modelColorScheme = world.colorSchemes[SearchDefault('modelColorScheme', company, tuning.modelColorScheme)];
                var unitSizeMin = SearchDefault('unitSizeMin', company, tuning.unitSizeMin);
                var unitSizeMax = SearchDefault('unitSizeMax', company, tuning.unitSizeMax);
                var unitSizeRange = unitSizeMax - unitSizeMin;

                mergeObject.units = [];
                mergeObject.nonZeroUnits = [];

                company.mergeOutline.forEach(function(indentedName, unitIndex) {

                    var unit = {
                        indentedName: indentedName,
                        name: indentedName.trim(),
                        unitIndex: unitIndex,
                        parent: null,
                        children: [],
                        verb: company.mergeVerbTable[unitIndex][yearIndex],
                        value: 100, // XXX
                        modelNames: [],
                        modelIndexes: [],
                        modelColors: []
                    };
                    mergeObject.units.push(unit);
                    if (unit.verb) {
                        mergeObject.nonZeroUnits.push(unit);
                    }

                    var modelString = company.unitModels[unitIndex].trim();
                    var unitModelCount = 0;
                    if (modelString) {

                        unit.modelNames = modelString.split(',');
                        unitModelCount = unit.modelNames.length;

                        unit.modelNames.forEach(function(modelName, unitModelIndex) {

                            var modelName = modelName.trim();
                            unit.modelNames[unitModelIndex] = modelName;
                            var modelIndex = company.modelType.indexOf(modelName);

                            if (modelIndex == -1) {
                                modelIndex = 0;
                                console.log("private.js: can't find modelIndex for modelName: " + modelName + " modelType: " + JSON.stringify(company.modelType));
                            }

                            unit.modelIndexes.push(modelIndex);
                            var colorIndex = modelIndex % modelColorScheme.length;
                            unit.modelColors.push(modelColorScheme[colorIndex]);

                        });

                    }

                });

                // Use the merge as the root.
                mergeObject.rootUnit = {
                    unitObject: mergeObject,
                    name: '' + yearObject.year,
                    unitIndex: -1,
                    parent: null,
                    children: [],
                    value: 0,
                    indent: -1,
                    depth: 0,
                    position: mergeObject.position
                };
                var parentStack = [
                    mergeObject.rootUnit
                ];

                // Arrange the non-zero units into a tree.
                var nonZeroUnitCount = mergeObject.nonZeroUnits.length;

                mergeObject.nonZeroUnits.forEach(function(unit, nonZeroUnitIndex) {

                    var unitName = unit.indentedName;
                    for (var indent = 0, nameLength = unitName.length; indent < nameLength; indent++) {
                        if (unitName[indent] != ' ') {
                            break;
                        }
                    }

                    while (indent <= parentStack[parentStack.length - 1].indent) {
                        parentStack.pop();
                    }
                    var parentUnit = parentStack[parentStack.length - 1];
                    parentUnit.children.push(unit);

                    unit.nonZeroUnitIndex = nonZeroUnitIndex;
                    unit.indent = indent;
                    unit.depth = parentStack.length;
                    unit.parent = parentUnit;
                    unit.children = [];
                    unit.size =
                        unitSizeMin +
                        ((unitSizeRange == 0)
                            ? 0
                            : (unitSizeRange *
                               (unit.value / company.unitValueMax)));

                    //console.log("unit.size", unit.size, "unitSizeMin", unitSizeMin, "unitSizeRange", unitSizeRange, "unit.value", unit.value, "company.unitValueMax", company.unitValueMax);

                    parentStack.push(unit);

                });

                var scope = {
                    company: company,
                    yearObject: mergeObject,
                    layoutCount: mergeObject.nonZeroUnits.length,
                    layoutIndex: 0
                };
                mergeObject.rootUnit.children.forEach(function(subUnit, index) {
                    //window.setTimeout(function() {
                        CreateUnitTree(scope, subUnit);
                    //}, tuning.unitCreateDelay * (index + 1));
                });

            }

            UpdateObject(mergeBaseObject, {
                tileColors: mergeBaseObject.tileColors,
                tileHeights: mergeBaseObject.tileHeights,
                tilePositions: mergeBaseObject.tilePositions,
                tileScale: company.hexTileScale
            });

            var mergeWireCount = yearObject.mergeUniqueVerbs.length;

            var fromID = mergeBaseObject.id;
            var toID = baseObject.id;

            var bundleObject =
                CreatePrefab({
                    obj: {
                        wireObjects: []
                    },
                    prefab: 'Prefabs/Bundle',
                    parent: 'object:' + company.companyObject.id,
                    update: {
                        'fromTransform!': 'object:' + fromID + '/transform',
                        'toTransform!': 'object:' + toID + '/transform',
                        fromRotation: 0,
                        toRotation: 180,
                        updateWiresAlways: true,
                        updateWireHeight: false,
                        fromLocalOffset: { y: tuning.mergeBundleHeightFrom },
                        toLocalOffset: { y: tuning.mergeBundleHeightTo },
                        fromLocalSpread: { z: mergeWireCount * tuning.bundleWireSpread },
                        toLocalSpread: { z: mergeWireCount * tuning.bundleWireSpread }
                    }
                });

            company.companyObject.bundleObjects.push(bundleObject);

            var verbSubjectColorScheme = world.colorSchemes[SearchDefault('verbSubjectColorScheme', company, tuning.verbSubjectColorScheme)];

            for (var mergeWireIndex = mergeWireCount - 1;
                 mergeWireIndex >= 0;
                 mergeWireIndex--) {
                 (function(mergeWireIndex) {
                    var uniqueVerb = yearObject.mergeUniqueVerbs[mergeWireIndex];
                    var uniqueVerbIndex = company.verbToIndex[uniqueVerb];
                    var color = verbSubjectColorScheme[uniqueVerbIndex % verbSubjectColorScheme.length];

                    var fromBudObject = null;
                    var toBudObject = null;

                    if (tuning.bundleBuds) {

                        fromBudObject =
                            CreatePrefab({
                                obj: {
                                    yearIndex: yearIndex,
                                    mergeWireIndex: mergeWireIndex,
                                    color: color
                                },
                                prefab: tuning.mergeBundleBudPrefab,
                                parent: 'object:' + bundleObject.id,
                                update: {
                                    'transform/localScale': {
                                        x: tuning.mergeBundleBudScale,
                                        y: tuning.mergeBundleBudScale,
                                        z: tuning.mergeBundleBudScale
                                    },
                                    'component:MeshRenderer/material/color': color
                                },
                                interests: {
                                }
                            });

                        toBudObject =
                            CreatePrefab({
                                obj: {
                                    yearIndex: yearIndex,
                                    mergeWireIndex: mergeWireIndex,
                                    color: color
                                },
                                prefab: tuning.mergeBundleBudPrefab,
                                parent: 'object:' + bundleObject.id,
                                update: {
                                    'transform/localScale': {
                                        x: tuning.mergeBundleBudScale,
                                        y: tuning.mergeBundleBudScale,
                                        z: tuning.mergeBundleBudScale
                                    },
                                    'component:MeshRenderer/material/color': color
                                },
                                interests: {
                                }
                            });

                    }

                    var wireObject =
                        CreatePrefab({
                            obj: {
                                fromBudObject: fromBudObject,
                                toBudObject: toBudObject,
                                yearIndex: yearIndex,
                                mergeWireIndex: mergeWireIndex,
                                color: color
                            },
                            prefab: 'Prefabs/Wire',
                            parent: 'object:' + bundleObject.id,
                            update: {
                                wireStart: 0,
                                wireEnd: 1,
                                radius: tuning.bundleWireRadius,
                                fromEndDistance:     { x: tuning.mergeWireFromEndDistance },
                                fromEndDirection:    { x: tuning.mergeWireFromEndDirection },
                                fromMiddleDistance:  { x: tuning.mergeWireFromMiddleDistance },
                                fromMiddleDirection: { x: tuning.mergeWireFromMiddleDirection },
                                toEndDistance:       { y: tuning.mergeWireToEndDistance },
                                toEndDirection:      { y: tuning.mergeWireToEndDirection },
                                toMiddleDistance:    { y: tuning.mergeWireToMiddleDistance, x: -0.1 },
                                toMiddleDirection:   { y: tuning.mergeWireToMiddleDirection },
                                'fromView!': fromBudObject ? ('object:' + fromBudObject.id + '/transform') : null,
                                'toView!': toBudObject ? ('object:' + toBudObject.id + '/transform') : null,
                                'color': color
                            },
                            interests: {
                            }
                        });

                    bundleObject.wireObjects.push(wireObject);

                 })(mergeWireIndex);
            }

            UpdateObject(bundleObject, {
                updateWires: true
            });

        }

    }
}


////////////////////////////////////////////////////////////////////////
// Create a unit tree.
//
// scope:
//   layoutIndex
//   layoutCount
//   company
//   yearObject
//     year
//     yearIndex
//     unitObjects
//     leafUnitObjects


function CreateUnitTree(scope, unit)
{
    //console.log("================ CreateUnitTree", "scope", scope, "unit", unit);

    var world = globals.world;
    var tuning = world.tuning;
    var company = scope.company;
    var yearObject = scope.yearObject

    //Tag(yearObject, "yearObject");
    //Tag(unit, "unit");

    var ang =
        scope.layoutIndex++ *
        (2.0 * Math.PI / scope.layoutCount);
    unit.distance =
        tuning.unitInitialDistance;
    var dx = Math.cos(ang);
    var dy = Math.sin(ang);
    var dz = Math.random() - 0.5;
    unit.position = {
        x: yearObject.position.x + dx * tuning.unitInitialDistance,
        y: yearObject.position.y + dy * tuning.unitInitialDistance,
        z: yearObject.position.z + dz
    };

    //console.log("CreateUnitTree", "year", yearObject.year, "year position", yearObject.position.x, yearObject.position.y, yearObject.position.z, "unit", unit, "unitIndex", unit.unitIndex, "x", x, "y", y, "z", z, "layoutIndex", layoutIndex, "layoutCount", layoutCount, "ang", ang, ang * (180.0 / Math.PI), "dx", dx, "dy", dy, "dz", dz, "unitInitialDistance", tuning.unitInitialDistance, "position", unit.position.x, unit.position.y, unit.position.z);

    unit.isLeaf =
        !(unit.children && unit.children.length);
    unit.scale =
        unit.isLeaf
            ? unit.size
            : tuning.unitNonLeafSize;

    var unitObject = CreatePrefab({
        obj: {
            unit: unit,
            year: yearObject.year,
            yearObject: yearObject,
            yearIndex: yearObject.yearIndex,
            modelObjects: []
        },
        prefab: 'Prefabs/Unit',
        parent: 'object:' + company.companyObject.id,
        update: {
            'dragTracking': true,
            'transform/position': unit.position,
            'transform/localScale': globals.tinyScale,
            'transform:Collider/component:Collider/sharedMaterial': tuning.unitPhysicMaterial,
            'transform:Collider/component:Collider/radius': tuning.unitColliderRadius,
            'component:Rigidbody/isKinematic': tuning.unitIsKinematic,
            'component:Rigidbody/useGravity': tuning.unitUseGravity,
            'component:Rigidbody/mass': tuning.unitMass,
            'component:Rigidbody/drag': tuning.unitDrag,
            'component:Rigidbody/angularDrag': tuning.unitAngularDrag,
            'component:Rigidbody/collisionDetectionMode': tuning.unitCollisionDetectionMode,
            'component:SpringJoint/spring': tuning.unitSpring,
            'component:SpringJoint/damper': tuning.unitDamper,
            'component:SpringJoint/tolerance': tuning.unitTolerance,
            'component:SpringJoint/enableCollision': tuning.unitEnableCollision,
            'component:SpringJoint/autoConfigureConnectedAnchor': false,
            'component:SpringJoint/anchor': {},
            'component:SpringJoint/connectedBody!': 'object:' + unit.parent.unitObject.id + '/component:Rigidbody'
        },
        interests: {
            MouseEnter: {
                handler: function(unitObject, results) {
                    //console.log("MouseEnter unitObject", unitObject, "unit", unit, "unitIndex", unit.unitIndex, "name", unit.name, "yearIndex", yearObject.yearIndex);
                    DescribeUnit(company, unit, yearObject.yearIndex);
                    HighlightUnits(company, [unit.name], tuning.unitHighlightScale, 0);
                }
            },
            MouseExit: {
                handler: function(unitObject, results) {
                    //console.log("MouseExit unitObject", unitObject, "unit", unit, "unitIndex", unit.unitIndex, "name", unit.name, "yearIndex", yearObject.yearIndex);
                    HighlightUnits(company, null, 0, 0);
                }
            }
        },
        postEvents: [
            {
                event: 'Animate',
                data: [
                    {
                        unit: '' + unit,
                        unitKeys: '' + Object.keys(unit),
                        unitIsLeaf: '' + unit.isLeaf,
                        unitSize: '' + unit.size,
                        unitNonLeafSize : '' + tuning.unitNonLeafSize,
                        command: 'scale',
                        time: tuning.unitCreateAnimateTime,
                        to: unit.scale
                    }
                ]
            }
        ]
    });

    unit.unitObject = unitObject;
    yearObject.unitObjects.push(unitObject);

    //Tag(yearObject, "yearObject");
    //Tag(unitObject, "unitObject");

    if (unit.isLeaf) {

        yearObject.leafUnitObjects.push(unit);

        var unitModelCount = unit.modelNames.length;
        unit.modelNames.forEach(function(modelName, unitModelIndex) {

            var modelIndex = unit.modelIndexes[unitModelIndex];
            var modelColor = unit.modelColors[unitModelIndex];
            var ang = unitModelIndex * (2.0 * Math.PI / unitModelCount);
            var dist = (unitModelCount == 1) ? 0 : tuning.unitModelOffset;
            var dx = Math.cos(ang) * dist;
            var dy = Math.sin(ang) * dist;
            var modelObject = CreatePrefab({
                obj: {
                    yearObject: yearObject,
                    yearIndex: yearObject.yearIndex,
                    unit: unit,
                    unitModelIndex: unitModelIndex,
                    name: modelName,
                    modelIndex: modelIndex,
                    color: modelColor
                },
                prefab: 'Prefabs/UnitModel',
                parent: 'object:' + unitObject.id,
                worldPositionStays: false,
                update: {
                    "transform/localPosition": {x: dx, y: 0, z: dy},
                    //"component:MeshRenderer/materials": [tuning.material],
                    "component:MeshRenderer/material/color": modelColor
                },
                interests: {
                    MouseEnter: {
                        handler: function(modelObject, results) {
                            //console.log("MouseEnter modelObject", "unitModelIndex", unitModelIndex, "unitIndex", unit.unitIndex, "yearIndex", yearObject.yearIndex);
                            DescribeModel(company, modelIndex, unit.unitIndex, yearObject.yearIndex);
                            HighlightModels(company, [modelName], 0, 0);
                        }
                    },
                    MouseExit: {
                        handler: function(unit, results) {
                            //console.log("MouseEnter modelObject", "modelIndex", modelIndex, "yearIndex", yearObject.yearIndex);
                            HighlightModels(company, null, 0, 0);
                        }
                    }
                }
            });

            unitObject.modelObjects.push(modelObject);

        });

    }

    if (tuning.unitArrows) {

        unitObject.unitArrow =
            CreateRainbow(
                tuning.unitArrowRainbowType,
                unit.parent.unitObject,
                unit.unitObject,
                company.companyObject);

    }

    if (unit.isLeaf && tuning.unitLabels) {

        unitObject.labelObject = CreatePrefab({
            prefab: "Prefabs/ProText",
            parent: 'object:' + company.companyObject.id,
            update: {
                'textMesh/text': unit.name.trim(),
                'textMesh/fontSize': tuning.unitLabelFontSize,
                'trackPosition': 'Transform',
                'transformPosition!': 'object:' + unit.unitObject.id + '/transform',
                'extraOffset': { y: unit.size + tuning.labelHeightExtra },
                'trackRotation': 'CameraRotation'
            }
        });

    }

    if (unit.children && unit.children.length) {
        unit.children.forEach(function(subUnit, index) {
            window.setTimeout(function() {
                CreateUnitTree(scope, subUnit);
            }, tuning.unitCreateDelay * (index + 1));
        });
    }

}



////////////////////////////////////////////////////////////////////////
// Navigation.


function FocusCompany(company)
{
    var world = globals.world;
    var tuning = world.tuning;

    AnimateObject(globals.proCamera, [
        {
            command: 'move',
            time: tuning.cameraStartAnimationDuration,
            position: SearchDefault('cameraStartPosition', company, tuning.cameraStartPosition)
        },
        {
            command: 'rotate',
            time: tuning.cameraStartAnimationDuration,
            to: SearchDefault('cameraStartRotation', company, tuning.cameraStartRotation)
        }
    ]);
}


function FocusYear(company, yearIndex)
{
    var world = globals.world;
    var tuning = world.tuning;

    var yearObject = company.companyObject.yearObjects[yearIndex];
    if (!yearObject) {
        return;
    }

    QueryObject(yearObject, {
            position: 'transform/position'
        }, function(results) {
            var offset = SearchDefault('cameraYearOffset', company, tuning.cameraYearOffset);
            var cameraPosition = {
                x: results.position.x + offset.x,
                y: results.position.y + offset.y,
                z: results.position.z + offset.z
            };
            var cameraRotation = SearchDefault('cameraYearRotation', company, tuning.cameraYearRotation);

            AnimateObject(globals.proCamera, [
                {
                    command: 'move',
                    time: tuning.cameraYearAnimationDuration,
                    position: cameraPosition
                },
                {
                    command: 'rotate',
                    time: tuning.cameraYearAnimationDuration,
                    to: cameraRotation
                }
            ]);
        });
}


function ShowCompany(company)
{
    if (company.companyObject &&
        company.companyObject.showing) {
        return;
    }

    if (globals.currentCompany) {
        HideCompany(globals.currentCompany);
    }

    globals.currentCompany = company;

    if (company.companyObject) {
        UpdateObject(company.companyObject, {
            'gameObject/method:SetActive': [true]
        });
    } else {
        CreateCompany(company);
    }

    globals.cuboid.pieID = 'company_' + company.name;
    company.companyObject.showing = true;

    FocusCompany(company);
}


function HideCompany(company)
{
    HidePopupText();
    HideInfoPanel();

    if (!company.companyObject ||
        !company.companyObject.showing) {
        return;
    }

    if (globals.currentCompany == company) {
        globals.currentCompany = null;
    }

    UpdateObject(company.companyObject, {
        'gameObject/method:SetActive': [false]
    });

    globals.cuboid.pieID = 'companies';
    company.companyObject.showing = false;
}


////////////////////////////////////////////////////////////////////////
// Create pies.


function CreateUnitPies(company, parentPieID, pieID, unit)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("CreateUnitPies: pieID:", pieID, "unit", unit, unit.name, unit.children.length);

    var drawBackground = null;
    var slices = null;
    if (unit.children && unit.children.length) {
        drawBackground = 'DrawBackground_Pie';
        slices = [];
        unit.children.forEach(function(subUnit, childIndex) {
            var subUnit = unit.children[childIndex];
            var unitLabel = subUnit.name;
            var hasChildren = subUnit.children && subUnit.children.length;
            var subPieID = hasChildren ? pieID + '_' + subUnit.unitIndex : null;
            //console.log("childIndex", childIndex, "subUnit", subUnit, "unitLabel", unitLabel, "subPieID", subPieID);
            slices.push({
                items: [
                    {
                        label: unitLabel,
                        onenteritem: function(item, slice, pie, target) {
                            DescribeUnit(company, subUnit, -1);
                        },
                        ontrackitem: function(item, slice, pie, target) {
                            var unitNames = GetAllUnitNames(subUnit);
                            var distance =
                                globals.pieTracker.distance -
                                SearchDefault('inactiveDistance', pie, globals.pieTracker.inactiveDistance);
                            var cameraAttraction = 
                                tuning.unitHighlightCameraAttraction +
                                tuning.unitHighlightCameraAttractionPieDistanceScale * distance;
                            HighlightUnits(company, unitNames, tuning.unitHighlightScale, cameraAttraction);
                        },
                        stayUp: !hasChildren,
                        pieID: subPieID
                    }
                ]
            });
            if (hasChildren) {
                var subPie = CreateUnitPies(company, pieID, subPieID, subUnit);
            }
        });
    } else {
        drawBackground = 'DrawBackground_AllUnits_Info';
    }
    var pie = globals.pieTracker.pies[pieID] = {
        label: unit.name,
        slices: slices,
        drawBackground:	drawBackground,
        centerPieID: parentPieID,
        itemDistance: 100,
        unit: unit,
        onenterpiecenter: function(item, slice, pie, target) {
            var unitNames = GetAllUnitNames(unit);
            HighlightUnits(company, unitNames, tuning.unitHighlightScale, tuning.unitHighlightEffectCameraAttraction);
        },
        onstartpie: function(pie, target) {
            var unitNames = GetAllUnitNames(unit);
            HighlightUnits(company, unitNames, tuning.unitHighlightScale, tuning.unitHighlightEffectCameraAttraction);
        },
        onstoppie: function(pie, target) {
            if (unit.parent == null) {
                HighlightUnits(company, null, 0, 0);
            }
        }
    };

    return pie;
}


////////////////////////////////////////////////////////////////////////
// Info panel.


function DrawCompanyInfoPanel(company, context, yearIndex, nextYearIndex, pos, size)
{
    var world = globals.world;
    var tuning = world.tuning;
    var titleFont = tuning.infoPanelTitleFontStyle + ' ' + tuning.infoPanelTitleFontSize + 'px ' + tuning.infoPanelTitleFontName;
    var titleYearsFont = tuning.infoPanelTitleYearsFontStyle + tuning.infoPanelTitleYearsFontSize + 'px ' + tuning.infoPanelTitleYearsFontName;

    // Clear background.
    context.beginPath();
    context.fillStyle = tuning.infoPanelColor;
    context.fillRect(0, 0, size.width, size.height);

    // Draw company name and years.

    context.font = titleFont;
    var companyNameWidth = context.measureText(company.name).width;

    var firstYear = 0;
    var lastYear = 0;
    if (yearIndex == -1) {
        firstYear = company.years[0];
        lastYear = company.years[company.years.length - 1];
    } else {
        firstYear = company.years[yearIndex];
        lastYear =
            (nextYearIndex == -1)
                ? firstYear
                : company.years[nextYearIndex];
    }
    var yearsLabel =
        (firstYear == lastYear)
            ? (firstYear + '')
            : (firstYear + '-' + lastYear);

    context.font = titleYearsFont;
    var yearsWidth = context.measureText(yearsLabel).width;

    var titleWidth =
        tuning.infoPanelTitleIndent + companyNameWidth + tuning.infoPanelTitleGap + yearsWidth + tuning.infoPanelTitleIndent;
    var titleHeight =
        tuning.infoPanelTitleGap + tuning.infoPanelTitleFontSize + tuning.infoPanelTitleGap;

    context.fillStyle = tuning.infoPanelTitleBorderColor;
    context.fillRect(
        pos.x,
        pos.y,
        titleWidth,
        titleHeight);

    context.fillStyle = tuning.infoPanelTitleBoxColor;
    context.fillRect(
        pos.x + tuning.infoPanelTitleBorder,
        pos.y + tuning.infoPanelTitleBorder,
        titleWidth - (tuning.infoPanelTitleBorder * 2),
        titleHeight - (tuning.infoPanelTitleBorder * 2));

    context.font = titleFont;
    context.fillStyle = tuning.infoPanelTitleFontColor;
    context.fillText(
        company.name,
        pos.x + tuning.infoPanelTitleGap,
        pos.y + tuning.infoPanelTitleGap + tuning.infoPanelTitleFontSize - tuning.infoPanelTitleFontLift);

    context.font = titleYearsFont;
    context.fillStyle = tuning.infoPanelTitleYearsFontColor;
    context.fillText(
        yearsLabel,
        pos.x + tuning.infoPanelTitleGap + companyNameWidth + tuning.infoPanelTitleGap,
        pos.y + tuning.infoPanelTitleGap + tuning.infoPanelTitleFontSize - tuning.infoPanelTitleFontLift);

    pos.x = 0;
    pos.y += titleHeight;
}


function ShowInfoPanel(text)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("ShowInfoPanel", text);

    UpdateObject(globals.textOverlays, {
        'infoText/text': text,
        'infoPanel/gameObject/method:SetActive': [true],
        'infoPanel/component:RectTransform/sizeDelta': {
            x: tuning.infoPanelWidth,
            y: tuning.infoPanelHeight
        },
        'infoPanel/component:UnityEngine.UI.RawImage/texture': null
    });

}


function HideInfoPanel()
{
    UpdateObject(globals.textOverlays, {
        'infoPanel/gameObject/method:SetActive': [false]
    });
}


////////////////////////////////////////////////////////////////////////
// Object description feedback.


function DescribeVerbSubject(company, verbSubjectIndex, yearIndex, nextYearIndex)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("DescribeVerbSubject", unit, unit.unitIndex, yearIndex);

    ShowInfoPanel("");

    DrawToCanvas({
            width: tuning.infoPanelWidth,
            height: tuning.infoPanelHeight,
            cache: globals.textOverlays
        },
        function(canvas, context, params, success, error) {
            var pos = {
                x: 0,
                y: 0
            };
            var size = {
                width: params.width,
                height: params.height
            };

            DrawCompanyInfoPanel(company, context, yearIndex, nextYearIndex, pos, size);

            var verbSubjectFont = tuning.infoPanelVerbSubjectFontStyle + ' ' + tuning.infoPanelVerbSubjectFontSize + 'px ' + tuning.infoPanelVerbSubjectFontName;
            context.font = verbSubjectFont;
            context.fillStyle = tuning.infoPanelVerbSubjectFontColor;

            pos.x = tuning.infoPanelVerbSubjectIndent;
            pos.y += tuning.infoPanelVerbSubjectGap + tuning.infoPanelVerbSubjectFontSize;

            context.fillText(
                'Verb:',
                pos.x,
                pos.y);

            pos.x += tuning.infoPanelVerbSubjectIndent;
            pos.y += tuning.infoPanelVerbSubjectGap + tuning.infoPanelVerbSubjectFontSize;

            var verbSubjectLabel =
                company.verb[verbSubjectIndex].trim() +
                ' ' +
                company.subject[verbSubjectIndex].trim();

            context.fillText(
                verbSubjectLabel,
                pos.x,
                pos.y);

            success();
        },
        function(texture, uvRect, params) {
            //console.log("DescribeVerbSubject DrawToCanvas success", texture);
            UpdateObject(globals.textOverlays, {
                'infoPanel/component:RectTransform/sizeDelta': {
                    x: params.width,
                    y: params.height
                },
                'infoPanel/component:UnityEngine.UI.RawImage/texture': texture,
                'infoPanel/component:UnityEngine.UI.RawImage/uvRect': uvRect
            });
        },
        function(params) {
            console.log("private.js: DescribeVerbSubject DrawToCanvas error", params);
        });
}


function DescribeModel(company, modelIndex, yearIndex, unitIndex)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("DescribeModel", unit, unit.unitIndex, yearIndex);

    ShowInfoPanel("");

    DrawToCanvas({
            width: tuning.infoPanelWidth,
            height: tuning.infoPanelHeight,
            cache: globals.textOverlays
        },
        function(canvas, context, params, success, error) {
            var pos = {
                x: 0,
                y: 0
            };
            var size = {
                width: params.width,
                height: params.height
            };

            DrawCompanyInfoPanel(company, context, yearIndex, -1, pos, size);

            var modelFont = tuning.infoPanelModelFontStyle + ' ' + tuning.infoPanelModelFontSize + 'px ' + tuning.infoPanelModelFontName;
            context.font = modelFont;
            context.fillStyle = tuning.infoPanelModelFontColor;

            pos.x = tuning.infoPanelModelIndent;
            pos.y += tuning.infoPanelModelGap + tuning.infoPanelModelFontSize;

            context.fillText(
                'Model:',
                pos.x,
                pos.y);

            pos.x += tuning.infoPanelModelIndent;
            pos.y += tuning.infoPanelModelGap + tuning.infoPanelModelFontSize;

            context.fillText(
                company.modelType[modelIndex].trim(),
                pos.x,
                pos.y);

            success();
        },
        function(texture, uvRect, params) {
            //console.log("DescribeModel DrawToCanvas success", texture);
            UpdateObject(globals.textOverlays, {
                'infoPanel/component:RectTransform/sizeDelta': {
                    x: params.width,
                    y: params.height
                },
                'infoPanel/component:UnityEngine.UI.RawImage/texture': texture,
                'infoPanel/component:UnityEngine.UI.RawImage/uvRect': uvRect
            });
        },
        function(params) {
            console.log("private.js: DescribeModel DrawToCanvas error", params);
        });
}


function DescribeMarket(company, marketIndex, yearIndex)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("DescribeMarket", marketIndex, yearIndex);

    ShowInfoPanel("");

    DrawToCanvas({
            width: tuning.infoPanelWidth,
            height: tuning.infoPanelHeight,
            cache: globals.textOverlays
        },
        function(canvas, context, params, success, error) {
            var pos = {
                x: 0,
                y: 0
            };
            var size = {
                width: params.width,
                height: params.height
            };

            DrawCompanyInfoPanel(company, context, yearIndex, -1, pos, size);

            var marketFont = tuning.infoPanelMarketFontStyle + ' ' + tuning.infoPanelMarketFontSize + 'px ' + tuning.infoPanelMarketFontName;
            context.font = marketFont;
            context.fillStyle = tuning.infoPanelMarketFontColor;

            pos.x = tuning.infoPanelMarketIndent;
            pos.y += tuning.infoPanelMarketGap + tuning.infoPanelMarketFontSize;

            context.fillText(
                'Market:',
                pos.x,
                pos.y);

            pos.x += tuning.infoPanelMarketIndent;
            pos.y += tuning.infoPanelMarketGap + tuning.infoPanelMarketFontSize;

            context.fillText(
                company.marketType[marketIndex].trim(),
                pos.x,
                pos.y);

            if (yearIndex != -1) {

                pos.x += tuning.infoPanelMarketIndent;
                pos.y += tuning.infoPanelMarketGap + tuning.infoPanelMarketFontSize;

                context.fillText(
                    FormatDollars(company.marketTable[marketIndex][yearIndex]),
                    pos.x,
                    pos.y);

            }

            success();
        },
        function(texture, uvRect, params) {
            //console.log("DescribeMarket DrawToCanvas success", texture);
            UpdateObject(globals.textOverlays, {
                'infoPanel/component:RectTransform/sizeDelta': {
                    x: params.width,
                    y: params.height
                },
                'infoPanel/component:UnityEngine.UI.RawImage/texture': texture,
                'infoPanel/component:UnityEngine.UI.RawImage/uvRect': uvRect
            });
        },
        function(params) {
            console.log("private.js: DescribeMarket DrawToCanvas error", params);
        });
}


function DescribeUnit(company, unit, yearIndex)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("DescribeUnit", unit, unit.unitIndex, yearIndex);

    ShowInfoPanel("");

    DrawToCanvas({
            width: tuning.infoPanelWidth,
            height: tuning.infoPanelHeight,
            cache: globals.textOverlays
        },
        function(canvas, context, params, success, error) {
            var pos = {
                x: 0,
                y: 0
            };
            var size = {
                width: params.width,
                height: params.height
            };

            DrawCompanyInfoPanel(company, context, yearIndex, -1, pos, size);

            var parentFont = tuning.infoPanelParentFontStyle + ' ' + tuning.infoPanelParentFontSize + 'px ' + tuning.infoPanelParentFontName;
            var unitFont = tuning.infoPanelUnitFontStyle + ' ' + tuning.infoPanelUnitFontSize + 'px ' + tuning.infoPanelUnitFontName;
            var unitModelFont = tuning.infoPanelUnitModelFontStyle + ' ' + tuning.infoPanelUnitModelFontSize + 'px ' + tuning.infoPanelUnitModelFontName;
            var unitYearFont = tuning.infoPanelUnitYearFontStyle + ' ' + tuning.infoPanelUnitYearFontSize + 'px ' + tuning.infoPanelUnitYearFontName;
            var unitValueFont = tuning.infoPanelUnitValueFontStyle + ' ' + tuning.infoPanelUnitValueFontSize + 'px ' + tuning.infoPanelUnitValueFontName;

            // Draw parents, if any.
            var parents = [];
            var u = unit.parent;
            while (u && u.parent) {
                parents.unshift(u);
                u = u.parent;
            }

            pos.y += tuning.infoPanelParentGap;

            if (parents.length > 0) {

                pos.x = tuning.infoPanelTitleIndent;
                pos.y += tuning.infoPanelParentGap + tuning.infoPanelParentFontSize;

                parents.forEach(function(parent) {
                    var parentLabel =
                        parent.name +
                        ' > ';
                    context.font = parentFont;
                    var parentWidth = context.measureText(parentLabel).width;

                    // Wrap if it doesn't fit.
                    if ((pos.x != tuning.infoPanelTitleIndent) && // Don't wrap if already at beginning of line.
                        ((pos.x + parentWidth + tuning.infoPanelParentGap) >= size.width)) {
                       pos.x = tuning.infoPanelTitleIndent;
                       pos.y += tuning.infoPanelParentGap + tuning.infoPanelParentFontSize;
                    }

                    context.fillStyle = tuning.infoPanelParentFontColor;
                    context.fillText(
                        parentLabel,
                        pos.x,
                        pos.y);

                    pos.x += parentWidth;

                });

                pos.x = 0;

            }

            pos.x = tuning.infoPanelUnitIndent;
            pos.y += tuning.infoPanelUnitGap + tuning.infoPanelUnitFontSize;

            var unitLabel =
                'Unit: ' +
                unit.name.trim();
            context.font = unitFont;
            var unitWidth = context.measureText(unitLabel).width;
            context.fillStyle = tuning.infoPanelUnitFontColor;
            context.fillText(
                unitLabel,
                pos.x,
                pos.y);

            pos.x = tuning.infoPanelUnitModelIndent;
            pos.y += tuning.infoPanelUnitGap + tuning.infoPanelUnitModelGap;

            var top = pos.y;

            unit.modelNames.forEach(function(modelName, unitModelIndex) {
                pos.x = tuning.infoPanelUnitModelIndent;

                var label = modelName.trim();
                var color = unit.modelColors[unitModelIndex];

                context.fillStyle = tuning.infoPanelUnitModelBoxBorderColor;
                context.fillRect(
                    pos.x,
                    pos.y,
                    tuning.infoPanelUnitModelBoxSize,
                    tuning.infoPanelUnitModelBoxSize);

                context.fillStyle = color;
                context.fillRect(
                    pos.x + tuning.infoPanelUnitModelBoxBorder,
                    pos.y + tuning.infoPanelUnitModelBoxBorder,
                    tuning.infoPanelUnitModelBoxSize - (2 * tuning.infoPanelUnitModelBoxBorder),
                    tuning.infoPanelUnitModelBoxSize - (2 * tuning.infoPanelUnitModelBoxBorder));

                pos.x += tuning.infoPanelUnitModelBoxSize + tuning.infoPanelUnitModelGap;
                pos.y += tuning.infoPanelUnitModelFontSize;

                context.font = unitModelFont;
                context.fillStyle = tuning.infoPanelUnitModelFontColor;
                context.fillText(
                    label,
                    pos.x,
                    pos.y + tuning.infoPanelUnitModelFontLift)

                pos.y += tuning.infoPanelUnitModelGap;
            });

            pos.x = tuning.infoPanelUnitYearIndent;
            pos.y = top;

            company.companyObject.yearObjects.forEach(function(yearObject, yearIndex) {
                pos.y += tuning.infoPanelUnitModelFontSize;

                var yearLabel = '' + yearObject.year;
                context.font = unitYearFont;
                context.fillStyle = tuning.infoPanelUnitYearFontColor;
                var yearLabelWidth = context.measureText(yearLabel).width;
                context.fillText(
                    yearLabel,
                    pos.x - yearLabelWidth,
                    pos.y)

                var value = company.unitTable[unit.unitIndex][yearIndex];
                var yearValue = ': ' + FormatDollars(value);
                context.font = unitValueFont;
                context.fillStyle = tuning.infoPanelUnitYearFontColor;
                context.fillText(
                    yearValue,
                    pos.x,
                    pos.y);

                pos.y += tuning.infoPanelUnitYearGap;
            });

            success();
        },
        function(texture, uvRect, params) {
            //console.log("DescribeUnit DrawToCanvas success", texture);
            UpdateObject(globals.textOverlays, {
                'infoPanel/component:RectTransform/sizeDelta': {
                    x: params.width,
                    y: params.height
                },
                'infoPanel/component:UnityEngine.UI.RawImage/texture': texture,
                'infoPanel/component:UnityEngine.UI.RawImage/uvRect': uvRect
            });
        },
        function(params) {
            console.log("private.js: DescribeUnit DrawToCanvas error", params);
        });
}


////////////////////////////////////////////////////////////////////////
// Object highlighting.


function HighlightVerbSubjects(company, verbSubjectIndexes)
{
    var world = globals.world;
    var tuning = world.tuning;

    company.companyObject.yearObjects.forEach(function(yearObject) {

        yearObject.bundleObject.wireObjects.forEach(function(wireObject) {

            var highlight =
                verbSubjectIndexes &&
                (verbSubjectIndexes.indexOf(wireObject.verbSubjectIndex) != -1);
            if (wireObject.highlighted != highlight) {

                wireObject.highlighted = highlight;

                //console.log("set wire color", wireObject.id, "highlight", highlight, "color", highlight ? tuning.highlightColor : wireObject.color);
                UpdateObject(wireObject, {
                    'color': highlight ? tuning.highlightColor : wireObject.color,
                    'updateMaterial': true
                });

                [
                    wireObject.fromBudObject,
                    wireObject.toBudObject,
                ].forEach(function(budObject) {

                    if (!budObject) {
                        return;
                    }

                    //console.log("set bud color", budObject.id, "highlight", highlight, "color", highlight ? tuning.highlightColor : budObject.color);
                    UpdateObject(budObject, {
                        'component:MeshRenderer/material/color': highlight ? tuning.highlightColor : budObject.color
                    });

                });

            }

        });

    });

}


function HighlightModels(company, modelNames, scale, cameraAttraction)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("HighlightModels", modelNames && modelNames.join(','));

    var update = {
        'component:ParticleSystem/main/scalingMode': 'Hierarchy',
        'component:ParticleSystemRenderer/alignment': 'View'
    };

    var alwaysUpdate = {
        'transform/localScale': { x: scale, y: scale, z: scale },
        'component:CameraAttractionForce/cameraAttraction': cameraAttraction
    };

    company.companyObject.yearObjects.forEach(function(yearObject) {

        var unitObjectLists = [yearObject.unitObjects];
        if (yearObject.mergeObject) {
            unitObjectLists.push(yearObject.mergeObject.unitObjects);
        }

        unitObjectLists.forEach(function(unitObjectList) {

            unitObjectList.forEach(function(unitObject) {

                unitObject.modelObjects.forEach(function(modelObject) {

                    var highlight =
                        modelNames &&
                        (modelNames.indexOf(modelObject.name) != -1);
                    //console.log("HighlightModels", "year", yearObject.year, "unit", unitObject.unit.unitIndex, "modelNames", (modelNames && modelNames.join(',')), "modelObject.modelIndex", modelObject.modelIndex, "modelObject.name", modelObject.name, "highlight", highlight);

                    HighlightObject(modelObject, highlight, tuning.modelHighlightEffect, update, alwaysUpdate);

                });

            });

        });

    });

}


function HighlightMarkets(company, marketIndexes)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("HighlightMarkets", "marketIndexes", marketIndexes);

    company.companyObject.yearObjects.forEach(function(yearObject) {

        var baseObject = yearObject.anchorObject.baseObject;

        var tileIndexes = [];
        baseObject.tiles.forEach(function(tile, tileIndex) {
            if (!tile.dummy &&
                marketIndexes &&
                (marketIndexes.indexOf(tile.marketIndex) != -1)) {
                tileIndexes.push(tileIndex);
            }
        });

        UpdateObject(baseObject, {
            highlightedTiles: tileIndexes,
            updateHighlights: true
        });

        //console.log("HighlightMarkets", "year", yearObject.year, "marketIndexes", marketIndexes, "tileIndexes", tileIndexes);

    });

}


function HighlightUnits(company, unitNames, scale, cameraAttraction)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("HighlightUnits cameraAttraction", cameraAttraction);
    var update = {
        'component:ParticleSystem/main/scalingMode': 'Hierarchy',
        'component:ParticleSystemRenderer/alignment': 'View'
    };
    var alwaysUpdate = {
        'transform/localScale': { x: scale, y: scale, z: scale },
        'component:CameraAttractionForce/cameraAttraction': cameraAttraction
    };

    company.companyObject.yearObjects.forEach(function(yearObject) {

        var unitObjectLists = [yearObject.unitObjects];
        if (yearObject.mergeObject) {
            unitObjectLists.push(yearObject.mergeObject.unitObjects);
        }

        unitObjectLists.forEach(function(unitObjectList) {

            unitObjectList.forEach(function(unitObject) {

                var highlight =
                    unitNames &&
                    (unitNames.indexOf(unitObject.unit.name) != -1);

                //console.log("HighlightUnits unitObject", unitObject, "highlight", highlight, "update", JSON.stringify(update), "alwaysUpdate", JSON.stringify(alwaysUpdate));
                HighlightObject(unitObject, highlight, tuning.unitHighlightEffect, update, alwaysUpdate);

            });

        });

    });

}


function HighlightObject(obj, highlight, effect, update, alwaysUpdate)
{
    var world = globals.world;
    var tuning = world.tuning;

    //console.log("HighlightObject", "obj", obj, "highlight", highlight, "effect", effect, "update", update, "alwaysUpdate", alwaysUpdate);

    if (highlight != (obj.highlighted)) {

        if (highlight) {

            obj.highlighted = true;

            if (obj.highlightObject) {

                UpdateObject(obj.highlightObject, {
                    'gameObject/method:SetActive': [true]
                });

            } else {

                obj.highlightObject = CreatePrefab({
                    prefab: effect,
                    parent: 'object:' + obj.id,
                    worldPositionStays: false,
                    update: update
                });

            }

        } else {

            obj.highlighted = false;

            if (obj.highlightObject) {
                UpdateObject(obj.highlightObject, {
                    'gameObject/method:SetActive': [false]
                });
            }

        }

    }

    if (alwaysUpdate && obj.highlightObject) {
        UpdateObject(obj.highlightObject, alwaysUpdate);
    }

}


function DestroyHighlight(target)
{
    if (target.highlightObject) {
        //console.log("DestroyHighlight", target.highlightObject.id);
        DestroyObject(target.highlightObject);
        target.highlightObject = null;
    }
}


function CreateHighlight(target, name)
{
    var world = globals.world;
    var tuning = world.tuning;

    DestroyHighlight(target);
    var scale = tuning.verbSubjectHighlightScale;
    target.highlightObject = CreatePrefab({
        prefab: name,
        parent: 'object:' + target.id,
        worldPositionStays: false,
        update: {
            'transform/localScale': { x: scale, y: scale, z: scale },
            'transform/localPosition': { z: -0.51 },
            'component:ParticleSystem/main/scalingMode': 'Hierarchy',
            'component:ParticleSystemRenderer/alignment': 'Local'
        }
    });
    //console.log("CreateHighlight", target.highlightObject.id);
}


////////////////////////////////////////////////////////////////////////
// Puffery feedback.


function PuffYearSoon(yearObject, puffedUp)
{
    var world = globals.world;
    var tuning = world.tuning;
    var baseObject = yearObject.baseObject;

    //console.log("PuffYearSoon", "yearObject", yearObject, "puffedUp", puffedUp, "baseObject", baseObject);

    if (puffedUp == baseObject.wannaPuff) {
        return;
    }

    baseObject.wannaPuff = puffedUp;
    if (baseObject.gonnaPuff) {
        return;
    }

    window.setTimeout(function() {

        var animations = [];
        var leafUnitObjects = yearObject.leafUnitObjects;
        baseObject.puffedUp = baseObject.wannaPuff;

        if (baseObject.puffedUp) {

            // Puff up all of this base's leaf units.
            for (var i = 0, n = leafUnitObjects.length; i < n; i++) {

                var unit = leafUnitObjects[i];
                
                animations.push({
                    command: 'scale',
                    target: 'object:' + unit.unitObject.id + '/transform:Collider',
                    time: tuning.unitColliderPuffTime,
                    to: tuning.unitColliderPuff
                });

                UpdateObject(unit.unitObject, {
                    'component:SpringJoint/anchor': unit.anchor
                });

            }

        } else {

            // Un-puff all of the current base's units.
            for (var i = 0, n = leafUnitObjects.length; i < n; i++) {

                var unit = leafUnitObjects[i];

                animations.push({
                    command: 'scale',
                    target: 'object:' + unit.unitObject.id + '/transform:Collider',
                    time: tuning.unitColliderUnPuffTime,
                    to: 1
                });

                UpdateObject(unit.unitObject, {
                    'component:SpringJoint/anchor': {}
                });

            }

        }

        // Perform all the animations, if any.
        if (animations.length > 0) {
            AnimateObject(baseObject, animations);
        }

    }, 0);
}


////////////////////////////////////////////////////////////////////////
// Popup text.


function ShowPopupText(text, xform)
{
    if (!globals.popupText) {
        globals.popupText = CreatePrefab({
            prefab: 'Prefabs/OverlayText',
            parent: 'object:' + globals.textOverlays.id + '/overlay',
            update: {
                'textMesh/fontSize': 18,
                'textMesh/color': { r: 1, g: 1, b: 1 },
                'textMesh/alignment': 'Left',
                'component:RectTransform/pivot': { x: 0, y: 1 },
                'screenOffset': { x: 0, y: 0 }
            }
        });
    }

    UpdateObject(globals.popupText, {
        'textMesh/text': text,
        'trackPosition': 'Transform',
        'transformPosition!': xform,
        'gameObject/method:SetActive': [true]
    });
}


function HidePopupText()
{
    if (!globals.popupText) {
        return;
    }

    UpdateObject(globals.popupText, {
        'trackPosition': 'Hidden'
    });

}


////////////////////////////////////////////////////////////////////////
// Pie backgrounds.


function DrawBackground_Unit_Bubbles(canvas, context, params, success, error)
{
    var pieTracker = globals.pieTracker;
    var pie = params.pie;
    var target = params.target;
    var width = params.width;
    var height = params.height;
    var cx = width * 0.5;
    var cy = height * 0.5;
    var unitObject = target;
    var unit = unitObject.unit;
    var unitName = (unit.name + '').trim();

    //console.log("DrawBackground_Unit: target", target, "width", width, "height", height, "cx", cx, "cy", cy, "unitName", unitName, "unit keys", Object.keys(unit), "unitObject keys", Object.keys(unitObject));

    var yearObject = unitObject.yearObject;
    var year = yearObject.year;
    //console.log("DrawBackground_Unit: yearObject", yearObject, Object.keys(yearObject));

    var rootUnit = year.rootUnit;
    //console.log("DrawBackground_Unit: rootUnit", rootUnit, Object.keys(rootUnit));

    var margin = 50;
    var padding = 10;
    var pack = d3.pack()
        .size([width - (2 * margin), height - (2 * margin)])
        .padding(padding);

    //console.log("DrawBackground_Unit: pack", pack);

    var root = d3.hierarchy(rootUnit)
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.value - a.value; });

    //console.log("DrawBackground_Unit: root", root, Object.keys(root));

    pack(root);

    var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, cx);
    var r = (cx - margin) / cx;
    gradient.addColorStop(0, '#00000080');
    gradient.addColorStop(r, '#00000080');
    gradient.addColorStop(1, '#00000000');
    context.arc(cx, cy, cx, 0, Math.PI * 2.0);
    context.fillStyle = gradient;
    context.fill();

    var descendants = root.descendants();

    for (var i = 0, n = descendants.length; i < n; i++) {
        var node = descendants[i];
        var label = ('' + node.data.name).trim();
        var selected = label == unitName;
        var hasChildren = node.children && node.children.length;

        if (selected) {

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            context.fillStyle = '#ffff0080';
            context.fill();

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            context.strokeStyle = '#0000ffff';
            context.lineWidth = 4;
            context.stroke();

            var labelPosition = {
                x:           (node.x + margin)  - cx,
                y: (height - (node.y + margin)) - cy + node.r
            };
            UpdateObject(pie.labelObject, {
                'component:RectTransform/anchoredPosition': labelPosition,
                'component:RectTransform/pivot': { x: 0.5, y: 0.0 },
                'textMesh/text': label + ':\n' + FormatDollars(node.data.value),
                'textMesh/color': { r: 1, g: 1, b: 1 }
            });

        } else {

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            if (hasChildren) {
                context.strokeStyle = '#a0a0a0ff';
                context.lineWidth = 1;
                context.stroke();
            } else {
                context.fillStyle = '#ffffff40';
                context.fill();
            }

        }

    }

    success();
}


function DrawBackground_Unit_Info(canvas, context, params, success, error)
{
    var pieTracker = globals.pieTracker;
    var pie = params.pie;
    var target = params.target;
    var width = params.width;
    var height = params.height;
    var cx = width * 0.5;
    var cy = height * 0.5;
    var unitObject = target;
    var unit = unitObject.unit;
    var unitName = (unit.name + '').trim();

    //console.log("DrawBackground_Unit: target", target, "width", width, "height", height, "cx", cx, "cy", cy, "unitName", unitName, "unit keys", Object.keys(unit), "unitObject keys", Object.keys(unitObject));

    var yearObject = unitObject.yearObject;
    var year = yearObject.year;
    //console.log("DrawBackground_Unit: yearObject", yearObject, Object.keys(yearObject));

    var rootUnit = year.rootUnit;
    //console.log("DrawBackground_Unit: rootUnit", rootUnit, Object.keys(rootUnit));

    var margin = 50;
    var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, cx);
    var r = (cx - margin) / cx;
    gradient.addColorStop(0, '#00000080');
    gradient.addColorStop(r, '#00000080');
    gradient.addColorStop(1, '#00000000');
    context.arc(cx, cy, cx, 0, Math.PI * 2.0);
    context.fillStyle = gradient;
    context.fill();

    var u = unit;
    var a = [];
    a.unshift(('' + u.name).trim() + ':\n' + FormatDollars(u.value));
    u = u.parent;
    while (u) {
        a.unshift(('' + u.name).trim());
        u = u.parent;
    }
    a.unshift(unitObject.yearObject.company.name);
    var text = "";
    for (var i = 0, n = a.length; i < n; i++) {
        text += a[i] + "\n";
    }

    UpdateObject(pie.labelObject, {
        'textMesh/text': text,
        'textMesh/color': { r: 1, g: 1, b: 1 }
    });

    success();
}


function DrawBackground_AllUnits_Bubbles(canvas, context, params, success, error)
{
    var world = globals.world;
    var tuning = world.tuning;
    var company = globals.currentCompany;
    var pieTracker = globals.pieTracker;
    var pie = params.pie;
    var target = params.target;
    var width = params.width;
    var height = params.height;
    var cx = width * 0.5;
    var cy = height * 0.5;
    var rootUnit = company.rootUnit;
    var selectedUnit = pie.unit;

    var margin = 50;
    var padding = 10;
    var pack = d3.pack()
        .size([width - (2 * margin), height - (2 * margin)])
        .padding(padding);

    var root = d3.hierarchy(rootUnit)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.value - a.value; });

    pack(root);

    var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, cx);
    var r = (cx - margin) / cx;
    gradient.addColorStop(0, '#00000080');
    gradient.addColorStop(r, '#00000080');
    gradient.addColorStop(1, '#00000000');
    context.arc(cx, cy, cx, 0, Math.PI * 2.0);
    context.fillStyle = gradient;
    context.fill();

    var descendants = root.descendants();

    for (var i = 0, n = descendants.length; i < n; i++) {
        var node = descendants[i];
        var label = node.data.name;
        var selected = label == selectedUnit.name;
        var hasChildren = node.children && node.children.length;

        if (selected) {

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            context.fillStyle = '#ffff0080';
            context.fill();

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            context.strokeStyle = '#0000ffff';
            context.lineWidth = 4;
            context.stroke();

            var labelPosition = {
                x:           (node.x + margin)  - cx,
                y: (height - (node.y + margin)) - cy + node.r
            };

            UpdateObject(pie.labelObject, {
                'component:RectTransform/anchoredPosition': labelPosition,
                'component:RectTransform/pivot': { x: 0.5, y: 0.0 },
                'textMesh/text': label,
                'textMesh/color': { r: 1, g: 1, b: 1 }
            });

        } else {

            context.beginPath();
            context.arc(margin + node.x, margin + node.y, node.r, 0, Math.PI * 2);
            if (hasChildren) {
                context.strokeStyle = '#a0a0a0ff';
                context.lineWidth = 1;
                context.stroke();
            } else {
                context.fillStyle = '#ffffff40';
                context.fill();
            }

        }

    }

    success();
}


function DrawBackground_AllUnits_Info(canvas, context, params, success, error)
{
    var world = globals.world;
    var tuning = world.tuning;
    var company = globals.currentCompany;
    var pieTracker = globals.pieTracker;
    var pie = params.pie;
    var target = params.target;
    var width = params.width;
    var height = params.height;
    var cx = width * 0.5;
    var cy = height * 0.5;
    var rootUnit = company.rootUnit;
    var selectedUnit = pie.unit;

    var margin = 50;
    var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, cx);
    var r = (cx - margin) / cx;
    gradient.addColorStop(0, '#00000080');
    gradient.addColorStop(r, '#00000080');
    gradient.addColorStop(1, '#00000000');
    context.arc(cx, cy, cx, 0, Math.PI * 2.0);
    context.fillStyle = gradient;
    context.fill();

    var a = [];
    var u = selectedUnit;
    while (u) {
        a.unshift(('' + u.name).trim());
        u = u.parent;
    }
    var text = "";
    var prefix = "";
    for (var i = 0, n = a.length; i < n; i++) {
        text += prefix + a[i] + "\n";
        prefix += "  ";
    }

    UpdateObject(pie.labelObject, {
        'textMesh/text': text,
        'textMesh/color': { r: 1, g: 1, b: 1 }
    });

    success();
}


////////////////////////////////////////////////////////////////////////

