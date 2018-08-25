/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbwZsTt8rUekSzwrK4PSnndaoGsMWXwIZnKm1IOFlg/exec?sheets=1&sheetValues=1';
globals.configuration = 'private';


////////////////////////////////////////////////////////////////////////


function CreatePrivate()
{
    var world = globals.world;
    var tuning = world.tuning;
    var companies = world.companies;

    var effects = world.prefabMap.effects;

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
        DestroyHighlight(target);
        target.highlightObject = CreatePrefab({
            prefab: effects.dir + '/' + name,
            parent: 'object:' + target.id,
            worldPositionStays: false,
            update: {
                'transform/localScale': { x: tuning.verbSubjectHighlightScale, y: tuning.verbSubjectHighlightScale, z: tuning.verbSubjectHighlightScale },
                'transform/localPosition': { z: -0.51 },
                'component:ParticleSystem/main/scalingMode': 'Hierarchy',
                'component:ParticleSystemRenderer/alignment': 'Local'
            }
        });
        //console.log("CreateHighlight", target.highlightObject.id);
    }

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
                CreateHighlight(target, item.label);
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
    companies.forEach(function (company) {
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

}


function ShowInfoPanel(text)
{
    //console.log("ShowInfoPanel", text);
    UpdateObject(globals.textOverlays, {
        'infoText/text': text,
        'infoPanel/gameObject/method:SetActive': [true]
    });
}


function HideInfoPanel()
{
    UpdateObject(globals.textOverlays, {
        'infoPanel/gameObject/method:SetActive': [false]
    });
}


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
    var yearObject = company.yearObjects[yearIndex];
    if (!yearObject) {
        return;
    }

    var world = globals.world;
    var tuning = world.tuning;
    
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


function ShowOverview()
{
}


function ShowCompany(company)
{
    if (company.showing) {
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
    company.showing = true;

    FocusCompany(company);
}


function HideCompany(company)
{
    HidePopupText();
    HideInfoPanel();

    if (!company.companyObject || !company.showing) {
        return;
    }

    if (globals.currentCompany == company) {
        globals.currentCompany = null;
    }

    UpdateObject(company.companyObject, {
        'gameObject/method:SetActive': [false]
    });

    globals.cuboid.pieID = 'companies';
    company.showing = false;
}


function CreateCompany(company)
{
    var world = globals.world;
    var tuning = world.tuning;
    var companies = world.companies;

    var valuationMin = company.valuationMin;
    var valuationMax = company.valuationMax;
    var valuationRange = valuationMax - valuationMin;
    var unitValueMax = company.unitValueMax
    var years = company.years;
    var financialType = company.financialType;
    var financialTable = company.financialTable;
    var marketType = company.marketType;
    var marketDimension = company.marketDimension;
    var marketTable = company.marketTable;
    var modelType = company.modelType;
    var modelTable = company.modelTable;
    var unitOutline = company.unitOutline;
    var unitYears = company.unitYears;
    var unitModels = company.unitModels;
    var unitTable = company.unitTable;
    var valuationType = company.valuationType;
    var valuationTable = company.valuationTable;
    var verb = company.verb;
    var subject = company.subject;
    var verbSubjectTable = company.verbSubjectTable;

    var yearSpacing = SearchDefault('yearSpacing', company, tuning.yearSpacing);
    var yearHeight = SearchDefault('yearHeight', company, tuning.yearHeight);
    var unitSizeMin = SearchDefault('unitSizeMin', company, tuning.unitSizeMin);
    var unitSizeMax = SearchDefault('unitSizeMax', company, tuning.unitSizeMax);
    var marketSizeMin = SearchDefault('marketSizeMin', company, tuning.marketSizeMin);
    var marketSizeMax = SearchDefault('marketSizeMax', company, tuning.marketSizeMax);

    var colorSchemes = world.colorSchemes;
    var modelColorScheme = colorSchemes[SearchDefault('modelColorScheme', company, tuning.modelColorScheme)];
    var marketColorScheme = colorSchemes[SearchDefault('marketColorScheme', company, tuning.marketColorScheme)];
    var verbSubjectColorScheme = colorSchemes[SearchDefault('verbSubjectColorScheme', company, tuning.verbSubjectColorScheme)];

    var unitSizeRange = unitSizeMax - unitSizeMin;
    var marketSizeRange = marketSizeMax - marketSizeMin;
    var tinyScale = { x:0.01, y: 0.01, z: 0.01 };
    var firstYearIndex = -1;
    var lastYearIndex = years.length - 1;
    var yearsShown = (lastYearIndex - firstYearIndex) + 1;
    var x = -0.5 * yearSpacing * (yearsShown - 1);
    var y = 0;
    var z = 0;
    var lastBaseObject = null;

    // Clean up all the names.
    financialType.forEach(function (type, financialIndex) {
        financialType[financialIndex] = type.trim();
    });
    marketType.forEach(function (type, marketIndex) {
        marketType[marketIndex] = type.trim();
    });
    marketDimension.forEach(function (dimension, marketIndex) {
        marketDimension[marketIndex] = dimension.trim();
    });
    modelType.forEach(function (type, modelIndex) {
        modelType[modelIndex] = type.trim();
    });
    unitYears.forEach(function (years, unitIndex) {
        unitYears[unitIndex] = years.trim();
    });
    unitModels.forEach(function (models, unitIndex) {
        unitModels[unitIndex] = models.trim();
    });
    valuationType.forEach(function (type, valuationIndex) {
        valuationType[valuationIndex] = type.trim();
    });

    company.baseObjects = [];
    company.yearObjects = [];
    company.bundleObjects = [];

    var companyObject = CreatePrefab({
        obj: {
            yearObjects: []
        },
        prefab: "Prefabs/Company"
    });

    company.companyObject = companyObject;

    function HighlightObject(obj, highlight, effect, update)
    {
        //console.log("HighlightObject", "obj", obj, "highlight", highlight, "effect", effect, "scale", scale);

        if (highlight == (obj.highlighted)) {
            return;
        }

        if (highlight) {

            obj.highlighted = true;

            if (obj.highlightObject) {

                UpdateObject(obj.highlightObject, {
                    'gameObject/method:SetActive': [true]
                });

            } else {

                obj.highlightObject = CreatePrefab({
                    prefab: world.prefabMap.effects.dir + '/' + effect,
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


    function DescribeVerbSubject(verbIndex, yearIndex, nextYearIndex)
    {
        var text = 
            'Verb:\n  ' +
            verb[verbIndex] + 
            ' ' + 
            subject[verbIndex];
        if (yearIndex != -1) {
            text += 
                '\n    ' + 
                years[yearIndex];
            if (nextYearIndex != -1) {
                text +=
                    '-' + 
                    years[nextYearIndex];
            }
        }
        ShowInfoPanel(text);
    }


    function HighlightVerbSubjects(verbSubjectIndexes)
    {
        // company.companyObject.yearObjects[].bundleObject.wireObjects[].fromBudObject|toBudObject

        company.companyObject.yearObjects.forEach(function (yearObject) {

            yearObject.bundleObject.wireObjects.forEach(function (wireObject) {

                var highlight = 
                    verbSubjectIndexes &&
                    (verbSubjectIndexes.indexOf(wireObject.verbSubjectIndex) != -1);
                if (wireObject.highlighted != highlight) {

                    wireObject.highlighted = highlight;

                    UpdateObject(wireObject, {
                        'color': highlight ? tuning.highlightColor : wireObject.color,
                        'updateMaterial': true
                    });

                    [ 
                        wireObject.fromBudObject, 
                        wireObject.toBudObject, 
                    ].forEach(function (budObject) {

                        if (!budObject) {
                            return;
                        }

                        UpdateObject(budObject, {
                            'component:MeshRenderer/material/color': highlight ? tuning.highlightColor : budObject.color
                        });

                    });

                }

            });

        });

    }


    function DescribeModel(modelIndex, yearIndex, unitIndex)
    {
        var text =
            'Model:\n  ' +
            modelType[modelIndex];
        //console.log("DescribeModel", modelIndex, text);
        ShowInfoPanel(text);
    }


    function HighlightModels(modelIndexes)
    {
        // company.companyObject.yearObjects[].unitObjects[].modelObjects[]
        //console.log("HighlightModels", modelIndexes && modelIndexes.join(','));

        var update = {
            'transform/localScale': {
                x: tuning.modelHighlightScale, 
                y: tuning.modelHighlightScale, 
                z: tuning.modelHighlightScale
            },
            'component:ParticleSystem/main/scalingMode': 'Hierarchy',
            'component:ParticleSystemRenderer/alignment': 'View'
        };

        company.companyObject.yearObjects.forEach(function (yearObject) {

            yearObject.unitObjects.forEach(function (unitObject) {

                unitObject.modelObjects.forEach(function (modelObject) {

                    var highlight =
                        modelIndexes &&
                        (modelIndexes.indexOf(modelObject.modelIndex) != -1);
                    //console.log("HighlightModels", "year", yearObject.year, "unit", unitObject.unit.unitIndex, "modelIndexes", (modelIndexes && modelIndexes.join(',')), "modelObject.modelIndex", modelObject.modelIndex, "highlight", highlight);

                    HighlightObject(modelObject, highlight, tuning.modelHighlightEffect, update);

                });

            });

        });

    }


    function DescribeMarket(marketIndex, yearIndex)
    {
        var text =
            'Market:\n  ' +
            marketType[marketIndex] +
            ((yearIndex == -1)
                ? ''
                : ('\n    ' +
                   years[yearIndex] + 
                   ': ' +
                   FormatDollars(
                       marketTable[marketIndex][yearIndex])));
        //console.log("DescribeMarket", marketIndex, yearIndex, text);
        ShowInfoPanel(text);
    }


    function HighlightMarkets(marketIndexes)
    {
        // company.companyObject.yearObjects[].anchorObject.baseObject.tiles

        //console.log("HighlightMarkets", "marketIndexes", marketIndexes);

        company.companyObject.yearObjects.forEach(function (yearObject) {

            var baseObject = yearObject.anchorObject.baseObject;

            var tileIndexes = [];
            baseObject.tiles.forEach(function (tile, tileIndex) {
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
    

    function FormatDollars(dollars)
    {
        return '$' + dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }


    function IndentLine(line, indent)
    {
        var emPerIndent = 2;
        var em = indent * emPerIndent;
        return '<margin-left=' + em + 'em>' + line;
    }

    function DescribeUnit(unit, yearIndex)
    {
        //console.log("DescribeUnit", unit, unit.unitIndex, yearIndex);
        var indent = 0;
        
        var text =
            IndentLine('Unit:', indent);

        var parents = [];
        var u = unit;
        while (u.parent) {
            parents.unshift(u);
            if (!tuning.unitDescribeParents) {
                break;
            }
            u = u.parent;
        }

        parents.forEach(function (unit) {
            indent += 2;
            text += '\n' + IndentLine(unit.name, indent);
        });

        if (yearIndex != -1) {
            indent += 2;
            text +=
                '\n' +
                IndentLine(
                   years[yearIndex] + 
                   ': ' +
                   FormatDollars(unitTable[unit.unitIndex][yearIndex]),
                   indent);
        }

        indent = 0;

        if (tuning.unitDescribeModels) {
            text += '\n' + IndentLine('Models:', indent);
            indent += 2;
            unit.modelNames.forEach(function (modelName) {
                text += '\n' + IndentLine(modelName.trim(), 2);
            });
        }

        //console.log("DescribeUnit", unit, unit.unitIndex, yearIndex, text);
        ShowInfoPanel(text);
    }


    function GetAllUnitIndexes(unit)
    {
        var unitIndexes = [];

        function recur(unit)
        {
            if (unit.parent) {
                unitIndexes.push(unit.unitIndex);
            }
            var children = unit.children;
            if (children && children.length) {
                children.forEach(recur);
            }
        }

        recur(unit);

        return unitIndexes;
    }


    function HighlightUnits(unitIndexes)
    {
        // company.companyObject.yearObjects[].unitObjects[]

        var update = {
            'transform/localScale': {
                x: tuning.unitHighlightScale, 
                y: tuning.unitHighlightScale, 
                z: tuning.unitHighlightScale
            },
            'component:ParticleSystem/main/scalingMode': 'Hierarchy',
            'component:ParticleSystemRenderer/alignment': 'View'
        };

        company.companyObject.yearObjects.forEach(function (yearObject) {

            yearObject.unitObjects.forEach(function (unitObject) {

                var highlight =
                    unitIndexes &&
                    (unitIndexes.indexOf(unitObject.unit.unitIndex) != -1);

                HighlightObject(unitObject, highlight, tuning.unitHighlightEffect, update);

            });

        });

    }


    function CreateYear(yearIndex, x, y, z)
    {
        var year =
            ((yearIndex >= 0) &&
             (yearIndex < years.length))
                ? years[yearIndex]
                : 0;

        var valuation = 0;
        var height = tuning.hexDummyHeight;

        if (year) {
            valuationTable.forEach(function (valuationYears) {
                valuation += valuationYears[yearIndex];
            });

            height =
                tuning.hexHeightMin + 
                (((valuation - company.valuationMin) / 
                  (company.valuationMax - company.valuationMin)) * 
                 (tuning.hexHeightMax - tuning.hexHeightMin));
        }

        var anchorObject = CreatePrefab({
            prefab: "Prefabs/Anchor",
            parent: 'object:' + companyObject.id,
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
                            company.bundleObjects.forEach(function (bundleObject) {
                                UpdateObject(bundleObject, {
                                    'gameObject/method:SetActive': [false]
                                });
                            });
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

                        company.bundleObjects.forEach(function (bundleObject) {
                            UpdateObject(bundleObject, {
                                'gameObject/method:SetActive': [true]
                            });
                        });

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
            parent: 'object:' + companyObject.id,
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
                    handler: function (obj, results) {
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
                                DescribeMarket(tile.marketIndex, yearIndex);
                                HighlightMarkets([tile.marketIndex]);
                            }
                        } else {
                            if (obj.highlightedTile) {
                                HighlightMarkets(null);
                                obj.highlightedTile = null;
                            }
                        }
                    }
                },
                MouseExit: {
                    handler: function (obj, results) {
                        if (obj.highlightedTile) {
                            HighlightMarkets(null);
                            obj.highlightedTile = null;
                        }
                    }
                },
                MouseDown: { // MouseDown on baseObject.
                    handler: function (obj, results) {

                        var animations = [];

                        // Select or toggle this base as the current base.
                        // First deselect the current base, if there is one.
                        if (company.currentBaseObject) {

                            // If the current base has a year, then un-puff all of its units and move it back down.
                            var yearObject = company.currentBaseObject.yearObject;
                            if (yearObject != null) {

                                // Un-puff all of the current base's units.
                                for (var i = 0, n = yearObject.leafUnitObjects.length; i < n; i++) {

                                    var unit = yearObject.leafUnitObjects[i];

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
                        }

                        // If this was already the current base, then toggle off.
                        if (company.currentBaseObject == obj) {

                            // Now no base is selected.
                            company.currentBaseObject = null;

                        } else {

                            // Select this base as the current base.
                            company.currentBaseObject = obj;

                            // If this base has a year, then puff all of its units and move it up.
                            var yearObject = obj.yearObject;
                            if (yearObject != null) {

                                // Puff up all of this base's leaf units.
                                for (var i = 0, n = yearObject.leafUnitObjects.length; i < n; i++) {

                                    var unit = yearObject.leafUnitObjects[i];

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

                            }

                        }

                        // Perform all the animations, if any.
                        if (animations.length > 0) {
                            AnimateObject(obj, animations);
                        }

                    }
                }
            }
        });

        company.baseObjects.push(baseObject);

        baseObject.lastBaseObject = lastBaseObject;
        if (lastBaseObject) {
            lastBaseObject.nextBaseObject = baseObject;
        }

        anchorObject.baseObject = baseObject;

        if (!year) {

            // Make one dummy hex if there is no year.

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

            // Make a set of base hexes for each market.

            var hexTileIndex = 0;

            marketTable.forEach(function (market, marketIndex) {
                
                var marketSize = marketTable[marketIndex][yearIndex];
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

                for (var tileIndex = 0; tileIndex < marketHexTileCount; tileIndex++) {

                    (function (tileIndex, hexTileIndex) {

                        var pos = 
                            world.hexBases[hexTileIndex].position;

                        var tile = {
                            dummy: false,
                            yearIndex: yearIndex,
                            marketIndex: marketIndex,
                            tileIndex: tileIndex,
                            hexTileIndex: hexTileIndex,
                            color: color,
                            height: height,
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

                    hexTileIndex++;

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
                    y: y + height + yearHeight, 
                    z: z
                }
                //console.log("year", year, "yearPosition", yearPosition.x, yearPosition.y, yearPosition.z, "height", height, "yearHeight", yearHeight, "x", x, "y", y, "z", z);

                var yearObject = CreatePrefab({
                    obj: {
                        anchorObject: anchorObject,
                        baseObject: baseObject,
                        company: company,
                        name: company.name + ' ' + year,
                        year: year,
                        yearIndex: yearIndex,
                        unitObjects: [],
                        leafUnitObjects: [],
                        position: yearPosition,
                        height: height
                    },
                    prefab: 'Prefabs/Ball',
                    component: 'Tracker',
                    parent: 'object:' + baseObject.id,
                    update: {
                        "dragTracking": false,
                        "transform/position": yearPosition,
                        "transform/localScale": tinyScale,
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

                companyObject.yearObjects.push(yearObject);
                anchorObject.yearObject = yearObject;
                baseObject.yearObject = yearObject;

                if (tuning.yearLabels) {

                    yearObject.labelObject = CreatePrefab({
                        prefab: "Prefabs/ProText",
                        parent: 'object:' + companyObject.id,
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

                company.yearObjects.push(yearObject);

                if (tuning.unitEnabled) {

                    // Filter out the zero units, and make unit dicts to represent the non-zero units.
                    
                    yearObject.units = [];

                    unitOutline.forEach(function (indentedName, unitIndex) {

                        var unit = {
                            indentedName: indentedName,
                            name: indentedName.trim(),
                            unitIndex: unitIndex,
                            parent: null,
                            children: [],
                            value: unitTable[unitIndex][yearIndex],
                            modelNames: [],
                            modelIndexes: [],
                            modelColors: []
                        };
                        yearObject.units.push(unit);

                        var modelString = unitModels[unitIndex].trim();
                        var unitModelCount = 0;
                        if (modelString) {

                            unit.modelNames = modelString.split(',');
                            unitModelCount = unit.modelNames.length;

                            unit.modelNames.forEach(function (modelName, unitModelIndex) {

                                var modelName = modelName.trim();
                                unit.modelNames[unitModelIndex] = modelName;
                                var modelIndex = modelType.indexOf(modelName);

                                if (modelIndex == -1) {
                                    modelIndex = 0;
                                    console.log("private.js: can't find modelIndex for modelName: " + modelName + " modelType: " + JSON.stringify(modelType));
                                }

                                unit.modelIndexes.push(modelIndex);
                                var colorIndex = modelIndex % modelColorScheme.length;
                                unit.modelColors.push(modelColorScheme[colorIndex]);

                            });

                        }

                    });

                    yearObject.nonZeroUnits = [];
                    yearObject.units.forEach(function (unit, unitIndex) {

                        if (!unit.value) {
                            return;
                        }

                        yearObject.nonZeroUnits.push(unit);

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

                    yearObject.nonZeroUnits.forEach(function (unit, nonZeroUnitIndex) {

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
                            (unitSizeRange *
                             (unit.value / unitValueMax));

                        parentStack.push(unit);

                    });

                    var layoutIndex = 0;
                    var layoutCount = yearObject.nonZeroUnits.length;

                    function CreateUnitTree(unit)
                    {

                        var ang = 
                            layoutIndex++ * 
                            (2.0 * Math.PI / layoutCount);
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

                        //console.log("CreateUnitTree", "year", year, "year position", yearObject.position.x, yearObject.position.y, yearObject.position.z, "unit", unit, "unitIndex", unit.unitIndex, "x", x, "y", y, "z", z, "layoutIndex", layoutIndex, "layoutCount", layoutCount, "ang", ang, ang * (180.0 / Math.PI), "dx", dx, "dy", dy, "dz", dz, "unitInitialDistance", tuning.unitInitialDistance, "height", height, "yearHeight", yearHeight, "position", unit.position.x, unit.position.y, unit.position.z);

                        unit.isLeaf =
                            !(unit.children && unit.children.length);
                        unit.scale = 
                            unit.isLeaf
                                ? unit.size
                                : tuning.unitNonLeafSize;

                        var unitObject = CreatePrefab({
                            obj: {
                                unit: unit,
                                year: year,
                                yearObject: yearObject,
                                yearIndex: yearIndex,
                                modelObjects: []
                            },
                            prefab: 'Prefabs/Unit',
                            parent: 'object:' + companyObject.id,
                            update: {
                                'dragTracking': true,
                                'transform/position': unit.position,
                                'transform/localScale': tinyScale,
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
                                        //console.log("MouseEnter unitObject", unitObject, "unit", unit, "unitIndex", unit.unitIndex, "yearIndex", yearIndex);
                                        DescribeUnit(unit, yearIndex);
                                        HighlightUnits([unit.unitIndex]);
                                    }
                                },
                                MouseExit: {
                                    handler: function(unitObject, results) {
                                        //console.log("MouseExit unitObject", unitObject, "unit", unit, "unitIndex", unit.unitIndex, "yearIndex", yearIndex);
                                        HighlightUnits(null);
                                    }
                                }
                            },
                            postEvents: [
                                {
                                    event: 'Animate',
                                    data: [
                                        {
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

                        if (unit.isLeaf) {

                            yearObject.leafUnitObjects.push(unit);

                            var unitModelCount = unit.modelNames.length;
                            unit.modelNames.forEach(function (modelName, unitModelIndex) {

                                var modelIndex = unit.modelIndexes[unitModelIndex];
                                var modelColor = unit.modelColors[unitModelIndex];
                                var ang = unitModelIndex * (2.0 * Math.PI / unitModelCount);
                                var dist = (unitModelCount == 1) ? 0 : tuning.unitModelOffset;
                                var dx = Math.cos(ang) * dist;
                                var dy = Math.sin(ang) * dist;
                                var modelObject = CreatePrefab({
                                    obj: {
                                        yearIndex: yearIndex,
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
                                        "component:MeshRenderer/materials": [tuning.material],
                                        "component:MeshRenderer/material/color": modelColor
                                    },
                                    interests: {
                                        MouseEnter: {
                                            handler: function(modelObject, results) {
                                                //console.log("MouseEnter modelObject", "unitModelIndex", unitModelIndex, "unitIndex", unit.unitIndex, "yearIndex", yearIndex);
                                                DescribeModel(modelIndex, unit.unitIndex, yearIndex);
                                                HighlightModels([modelIndex]);
                                            }
                                        },
                                        MouseExit: {
                                            handler: function(unit, results) {
                                                //console.log("MouseEnter modelObject", "modelIndex", modelIndex, "yearIndex", yearIndex);
                                                HighlightModels(null);
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
                                    companyObject);

                        }

                        if (unit.isLeaf && tuning.unitLabels) {

                            unitObject.labelObject = CreatePrefab({
                                prefab: "Prefabs/ProText",
                                parent: 'object:' + companyObject.id,
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
                                window.setTimeout(function () {
                                    CreateUnitTree(subUnit);
                                }, tuning.unitCreateDelay * (index + 1));
                            });
                        }

                    }

                    yearObject.rootUnit.children.forEach(function(subUnit, index) {
                        window.setTimeout(function () {
                            CreateUnitTree(subUnit);
                        }, tuning.unitCreateDelay * (index + 1));
                    });

                }

            }

            if (tuning.bundleEnabled) {

                var verbCount = verb.length;
                while ((verbCount > 0) && 
                       (verbSubjectTable[verbCount - 1][yearIndex] == "")) {
                    verbCount--;
                }

                if (verbCount > 0) {

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
                            parent: 'object:' + companyObject.id,
                            update: {
                                'fromTransform!': 'object:' + fromID + '/transform',
                                'toTransform!': 'object:' + toID + '/transform',
                                fromWidth: 0,
                                fromHeight: verbCount,
                                toWidth: 0,
                                toHeight: verbCount,
                                fromRotation: 90,
                                toRotation: -90,
                                updateWireHeight: false,
                                fromLocalOffset: { x: (verbCount * 0.5) + tuning.bundleGap, y: fromHeight }, // Left justify the start the bundle.
                                toLocalOffset: { x: (verbCount * -0.5) - tuning.bundleGap, y: toHeight } // Right justify the end of the bundle.
                            }
                        });

                    company.bundleObjects.push(bundleObject);
                    yearObject.bundleObject = bundleObject;

                    for (var verbIndex = verbCount - 1;
                         verbIndex >= 0;
                         verbIndex--) {
                         (function (verbIndex) {
                            var colorIndex = verbIndex % verbSubjectColorScheme.length;
                            var color = verbSubjectColorScheme[colorIndex];

                            //console.log("wireUpdate", JSON.stringify(wireUpdate));

                            var fromBudObject = null;
                            var toBudObject = null;

                            if (tuning.bundleBuds) {

                                fromBudObject =
                                    CreatePrefab({
                                        obj: {
                                            yearIndex: yearIndex,
                                            verbSubjectIndex: verbIndex,
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
                                                    DescribeVerbSubject(verbIndex, fromYearIndex, -1);
                                                    HighlightVerbSubjects([verbIndex]);
                                                }
                                            },
                                            MouseExit: {
                                                handler: function(obj, results) {
                                                    HighlightVerbSubjects(null);
                                                }
                                            }
                                        }
                                    });

                                toBudObject =
                                    CreatePrefab({
                                        obj: {
                                            yearIndex: yearIndex,
                                            verbSubjectIndex: verbIndex,
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
                                                    DescribeVerbSubject(verbIndex, toYearIndex, -1);
                                                    HighlightVerbSubjects([verbIndex]);
                                                }
                                            },
                                            MouseExit: {
                                                handler: function(obj, results) {
                                                    //console.log("MouseExit To Bud", obj, results);
                                                    HighlightVerbSubjects(null);
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
                                        verbSubjectIndex: verbIndex,
                                        color: color
                                    },
                                    prefab: 'Prefabs/Wire',
                                    parent: 'object:' + bundleObject.id,
                                    update: {
                                        wireStart: 0,
                                        wireEnd: 1,
                                        fromEndDistance: { x: 0.0, y: 0.0, z: 0.0 },
                                        fromEndDirection: { x: 5.0, y: 0.0, z: 0.0 },
                                        fromMiddleDistance: { x: 10.0, y: 0.0, z: 0.0 },
                                        fromMiddleDirection: { x: 15.0, y: 0.0, z: 0.0 },
                                        toEndDistance: { x: 0, y: 0.0, z: 0.0 },
                                        toEndDirection: { x: 5.0, y: 0.0, z: 0.0 },
                                        toMiddleDistance: { x: -10.0, y: 0.0, z: 0.0 },
                                        toMiddleDirection: { x: -5.0, y: 0.0, z: 0.0 },
                                        'fromView!': fromBudObject ? ('object:' + fromBudObject.id + '/transform') : null,
                                        'toView!': toBudObject ? ('object:' + toBudObject.id + '/transform') : null,
                                        'color': color
                                    },
                                    interests: {
                                        MouseEnter: {
                                            handler: function(obj, results) {
                                                DescribeVerbSubject(verbIndex, fromYearIndex, toYearIndex);
                                                HighlightVerbSubjects([verbIndex]);
                                            }
                                        },
                                        MouseExit: {
                                            handler: function(obj, results) {
                                                HighlightVerbSubjects(null);
                                            }
                                        }
                                    }
                                });

                            bundleObject.wireObjects.push(wireObject);

                         })(verbIndex);
                    }

                    UpdateObject(bundleObject, {
                        updateWires: true
                    });

                }

            }

        }

        lastBaseObject = baseObject;
    }


    for (var yearIndex = firstYearIndex; yearIndex <= lastYearIndex; yearIndex++) {
        (function (yearIndex, x, y, z) {
            window.setTimeout(function() {
                CreateYear(yearIndex, x, y, z);
            }, 
            tuning.yearBeforeDelay + (yearIndex * tuning.yearCreateDelay));
        })(yearIndex, x, y, z);
        x += yearSpacing;
    }


    // Make a tree out of the entire unitOutline.

    company.rootUnit = {
        name: company.name + ' Units',
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

    unitOutline.forEach(function (unitName, unitIndex) {

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

        var modelString = unitModels[unitIndex].trim();
        var unitModelCount = 0;
        if (modelString) {

            unit.modelNames = modelString.split(',');
            unitModelCount = unit.modelNames.length;

            unit.modelNames.forEach(function (modelName, unitModelIndex) {

                var modelName = modelName.trim();
                unit.modelNames[unitModelIndex] = modelName;
                var modelIndex = modelType.indexOf(modelName);

                if (modelIndex == -1) {
                    modelIndex = 0;
                    console.log("private.js: can't find modelIndex for modelName: " + modelName + " modelType: " + JSON.stringify(modelType));
                }

                unit.modelIndexes.push(modelIndex);
                var colorIndex = modelIndex % modelColorScheme.length;
                unit.modelColors.push(modelColorScheme[colorIndex]);

            });

        }

        parentStack.push(unit);
    });

    function MakeUnitPies(parentPieID, pieID, unit)
    {
        //console.log("MakeUnitPies: pieID:", pieID, "unit", unit, unit.name, unit.children.length);

        var drawBackground = null;
        var slices = null;
        if (unit.children && unit.children.length) {
            drawBackground = 'DrawBackground_Pie';
            slices = [];
            unit.children.forEach(function (subUnit, childIndex) {
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
                                var unitIndexes = GetAllUnitIndexes(subUnit);
                                DescribeUnit(subUnit, -1);
                                HighlightUnits(unitIndexes);
                            },
                            stayUp: !hasChildren,
                            pieID: subPieID
                        }
                    ]
                });
                if (hasChildren) {
                    var subPie = MakeUnitPies(pieID, subPieID, subUnit);
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
                var unitIndexes = GetAllUnitIndexes(unit);
                HighlightUnits(unitIndexes);
            },
            onstartpie: function(pie, target) {
                var unitIndexes = GetAllUnitIndexes(unit);
                HighlightUnits(unitIndexes);
            },
            onstoppie: function(pie, target) {
                if (unit.parent == null) {
                    HighlightUnits(null);
                }
            }
        };

        return pie;
    }

    MakeUnitPies(null, 'units_' + company.name, company.rootUnit);

    var slices = [];
    marketType.forEach(function (marketName, marketIndex) {
        slices.push({
            items: [
                {
                    label: marketName,
                    onenteritem: function(item, slice, pie, target) {
                        //console.log("Item Market Enter", marketName);
                        DescribeMarket(marketIndex, -1);
                        HighlightMarkets([marketIndex]);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Market Exit", marketName);
                        HighlightMarkets(null);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['markets_' + company.name] = {
        title: company.name + ' Markets',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };

    var slices = [];
    modelType.forEach(function (modelName, modelIndex) {
        slices.push({
            items: [
                {
                    label: modelName,
                    onenteritem: function(item, slice, pie, target) {
                        //console.log("Item Model Enter", modelName);
                        DescribeModel(modelIndex, -1, -1);
                        HighlightModels([modelIndex]);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Model Exit", modelName);
                        HighlightModels(null);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['models_' + company.name] = {
        title: company.name + ' Models',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };

    var slices = [];
    verb.forEach(function (verbName, verbIndex) {
        var verbSubject = verbName + ' ' + subject[verbIndex];
        slices.push({
            items: [
                {
                    label: verbSubject,
                    onenteritem: function(item, slice, pie, target) {
                        //console.log("Item Verb Enter", verbSubject);
                        DescribeVerbSubject(verbIndex, -1, -1);
                        HighlightVerbSubjects([verbIndex]);
                    },
                    onexititem: function(item, slice, pie, target) {
                        //console.log("Item Verb Exit", verbSubject);
                        HighlightVerbSubjects(null);
                    }
                }
            ]
        });
    });
    globals.pieTracker.pies['verbs_' + company.name] = {
        title: company.name + ' Verbs',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 100
    };

    var yearCount = years.length;
    var topSliceSize = Math.PI * (1.0 / (yearCount + 2));
    var slices = [];

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

    for (var yearIndex = 0; yearIndex < yearCount; yearIndex++) {
        (function (yearIndex) {
            var year = years[yearIndex];
            slices.push({
                items: [
                    {
                        label: '' + year,
                        onselectitem: function(item, slice, pie, target) {
                            FocusYear(company, yearIndex);
                        }
                    }
                ],
                sliceSize: topSliceSize
            });
        })(yearIndex);
    }
    
    slices.push({
        items: [
            {
                label: 'All',
                onselectitem: function() {
                    FocusCompany(company);
                }
            }
        ],
        sliceSize: topSliceSize
    });

    var commands = [
        ['Models', 'models_' + company.name, null],
        ['Markets', 'markets_' + company.name, null],
        ['Verbs', 'verbs_' + company.name, null],
        ['Units', 'units_' + company.name, null]
    ];
    var commandCount = commands.length;
    var bottomSliceSize = Math.PI * (1.0 / commandCount);
    for (var commandIndex = 0; commandIndex < commandCount; commandIndex++) {
        (function (commandIndex) {
            var command = commands[commandIndex];
            slices.push({
                items: [
                    {
                        label: command[0],
                        pieID: command[1],
                        onselectitem: command[2]
                    }
                ],
                sliceSize: bottomSliceSize
            });
        })(commandIndex);
    }

    globals.pieTracker.pies['company_' + company.name] = {
        label: company.name,
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        initialDirection: Math.PI,
        subtend: 2.0 * Math.PI,
        itemDistance: 100
    }

}


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
    //console.log("DrawBackground_Unit: yearObject", yearObject, Object.keys(yearObject));

    var rootUnit = yearObject.rootUnit;
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
    //console.log("DrawBackground_Unit: yearObject", yearObject, Object.keys(yearObject));

    var rootUnit = yearObject.rootUnit;
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

