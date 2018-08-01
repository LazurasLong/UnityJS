/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbwZsTt8rUekSzwrK4PSnndaoGsMWXwIZnKm1IOFlg/exec?sheets=1&sheetValues=1';
globals.configuration = 'private';

Object.assign(globals.sheetRefs, {
    "private": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        0
    ],
    "ranges": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1318265006
    ],
    "tuning": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1362487343
    ],
    "palette": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1146370483
    ],
    "colorSchemes": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        83117383
    ],
    "hexBases": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1120309657
    ],
    "structSource": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1167688381
    ],
    "struct": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        385164074
    ],
    "amazonSource": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1102331639
    ],
    "amazon": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        886538810
    ],
    "flatironSource": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        813994970
    ],
    "flatiron": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1764994123
    ]

});


////////////////////////////////////////////////////////////////////////


function CreatePrivate()
{
    var world = globals.world;
    var tuning = world.tuning;
    var companies = world.companies;

    var slices = [];
    for (var companyIndex = 0, companyCount = companies.length; companyIndex < companyCount; companyIndex++) {
        var company = companies[companyIndex];
        (function(companyIndex, company) {
            slices.push({
                items: [
                    {
                        label: company.name,
                        onselectitem: function(item, slice, pie, target) {
                            ShowCompany(company);
                        }
                    }
                ]
            });
        })(companyIndex, company);
    }

    globals.pieTracker.pies.companies = {
        label: 'Companies',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 50
    };

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
        }, function(result) {
            var offset = SearchDefault('cameraYearOffset', company, tuning.cameraYearOffset);
            var cameraPosition = {
                x: result.position.x + offset.x,
                y: result.position.y + offset.y,
                z: result.position.z + offset.z
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
    var y = yearHeight;
    var z = 0;
    var lastBaseObject = null;

    company.yearObjects = [];

    var todo = [];

    var companyObject = CreatePrefab({});

    company.companyObject = companyObject;

    function CreateYear(yearIndex)
    {
        var year =
            ((yearIndex >= 0) &&
             (yearIndex < years.length))
                ? years[yearIndex]
                : 0;

        var unitObjects = [];
        var anchorPosition = {x: x, y: tuning.baseElevation, z: z};
        var basePosition = {x: x, y: tuning.baseElevation, z: z};
        var baseScale = {x: tuning.baseScale, y: tuning.baseHeight, z: tuning.baseScale};

        var anchorObject = CreatePrefab({
            prefab: "Prefabs/Anchor",
            update: {
                dragTracking: true,
                "transform/localPosition": anchorPosition,
                "component:Rigidbody/drag": tuning.anchorDrag,
                "component:Rigidbody/constraints": tuning.anchorConstraints,
                "component:Rigidbody/collisionDetectionMode": tuning.anchorCollisionDetectionMode,
                "component:Rigidbody/isKinematic": false
            },
            interests: {
                DragStart: { // DragStart on anchorObject.
                    handler: function(obj, result) {
                        //console.log("private.js: Anchor: DragStart", obj.id);
                    }
                },
                DragStop: { // DragStop on anchorObject.
                    handler: function(obj, result) {
                        //console.log("private.js: Anchor: DragStop", obj.id);
                        QueryObject(obj.baseObject, {
                                position: 'transform/position'
                            }, function(result) {
                                //console.log("Moving anchor " + obj.id + " to " + result.position.x + " " + result.position.y + " " + result.position.z);
                                UpdateObject(obj, {
                                    "transform/position": result.position
                                });
                            });
                    }
                }
            },
            postEvents: [
                {
                    event: 'SetParent',
                    data: {
                        path: 'object:' + companyObject.id
                    }
                }
            ]
        });

        var baseObject = CreatePrefab({
            prefab: 'Prefabs/HexBase',
            component: 'Tracker',
            obj: {
                anchorObject: anchorObject
            },
            update: {
                'transform/localPosition': basePosition,
                'transform:Hexes/localScale': baseScale,
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
                MouseDown: { // MouseDown on baseObject.
                    handler: function (obj, result) {

                        var animations = [];

                        // Select or toggle this base as the current base.
                        // First deselect the current base, if there is one.
                        if (company.currentBaseObject) {

                            // If the current base has a year, then un-puff all of its units and move it back down.
                            var yearObject = company.currentBaseObject.yearObject;
                            if (yearObject != null) {

                                // Un-puff all of the current base's units.
                                var leafUnits = yearObject.leafUnits;
                                
                                for (var i = 0, n = leafUnits.length; i < n; i++) {

                                    var unit = leafUnits[i];
                                    var unitObject = unit.obj;

                                    animations.push({
                                        command: 'scale',
                                        target: 'object:' + unitObject.id + '/transform:Collider',
                                        time: tuning.unitColliderUnPuffTime,
                                        to: { x: 1, y: 1, z: 1 }
                                    });

                                    UpdateObject(unitObject, {
                                        'component:SpringJoint/anchor': {}
                                    });

                                }

                                // Move the year back down.
                                animations.push({
                                    command: 'moveLocal',
                                    target: 'object:' + yearObject.id,
                                    time: tuning.yearLiftTime,
                                    position: yearObject.localPosition
                                });

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
                                var leafUnits = yearObject.leafUnits;
                                for (var i = 0, n = leafUnits.length; i < n; i++) {

                                    var unit = leafUnits[i];
                                    var unitObject = unit.obj;

                                    animations.push({
                                        command: 'scale',
                                        target: 'object:' + unitObject.id + '/transform:Collider',
                                        time: tuning.unitColliderPuffTime,
                                        to: { x: tuning.unitColliderPuff, y: tuning.unitColliderPuff, z: tuning.unitColliderPuff }
                                    });

                                    UpdateObject(unitObject, {
                                        'component:SpringJoint/anchor': unit.anchor
                                    });

                                }

                                // Move the year up.
                                animations.push({
                                    command: 'moveLocal',
                                    target: 'object:' + yearObject.id,
                                    time: tuning.yearLiftTime,
                                    position: { 
                                        x: yearObject.localPosition.x, 
                                        y: yearObject.localPosition.y + tuning.yearLiftHeight, 
                                        z: yearObject.localPosition.z
                                    }
                                });

                            }

                        }

                        // Perform all the animations, if any.
                        if (animations.length > 0) {
                            AnimateObject(obj, animations);
                        }

                    }
                }
            },
            postEvents: [
                {
                    event: 'SetParent',
                    data: {
                        path: 'object:' + companyObject.id
                    }
                }
            ]
        });

        anchorObject.baseObject = baseObject;

        var baseSpecs = [];

        if (!year) {

            // Make one dummy hex if there is no year.

            var height = 
                tuning.hexDummyHeight;
            var pos = world.hexBases[0].position;
            var hexPosition = {
                x: company.hexTileScale * tuning.hexDX * pos.x,
                y: company.hexTileScale * height,
                z: company.hexTileScale * tuning.hexDY * pos.z
            };
            var hexScale = {
                x: company.hexTileScale,
                y: company.hexTileScale * (height / tuning.hexHeight),
                z: company.hexTileScale
            };
            var hex = CreatePrefab({
                prefab: 'Prefabs/Hex',
                update: {
                    'transform/localPosition': hexPosition,
                    'transform/localScale': hexScale,
                    'component:MeshRenderer/material/color': { r: 0.5, g: 0.5, b: 0.5 }
                },
                postEvents: [
                    {
                        event: 'SetParent',
                        data: {
                            path: 'object:' + baseObject.id + '/transform:Hexes',
                            worldPositionStays: false
                        }
                    }
                ]
            });

        } else {

            // Make a set of base hexes for each market.

            var hexTileIndex = 0;
            var nonZeroMarketCount = 0;
            for (var marketIndex = 0, marketCount = marketTable.length; marketIndex < marketCount; marketIndex++) {

                var marketSize = marketTable[marketIndex][yearIndex];
                if (marketSize == 0) {
                    continue;
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

                    var height = 
                        tuning.hexHeightMin + 
                        (0.5 * tuning.hexHeightRange);
                    var pos = world.hexBases[hexTileIndex++].position;
                    var hexPosition = {
                        x: company.hexTileScale * tuning.hexDX * pos.x,
                        y: company.hexTileScale * height,
                        z: company.hexTileScale * tuning.hexDY * pos.z
                    };
                    var hexScale = { 
                        x: company.hexTileScale, 
                        y: company.hexTileScale * (height / tuning.hexHeight), 
                        z: company.hexTileScale
                    };
                    var hex = CreatePrefab({
                        prefab: 'Prefabs/Hex',
                        update: {
                            'transform/localPosition': hexPosition,
                            'transform/localScale': hexScale,
                            'component:MeshRenderer/materials/index:2/method:UpdateMaterial': [{
                                texture_MainTex: null,
                                texture_BumpMap: null,
                                color: color
                            }]
                        },
                        postEvents: [
                            {
                                event: 'SetParent',
                                data: {
                                    path: 'object:' + baseObject.id + '/transform:Hexes',
                                    worldPositionStays: false
                                }
                            }
                        ]
                    });

                }

            }

            if (tuning.yearEnabled) {

                var leafUnits = [];

                var yearObject = CreatePrefab({
                    prefab: 'Prefabs/Ball',
                    component: 'Tracker',
                    obj: {
                        anchorObject: anchorObject,
                        baseObject: baseObject,
                        company: company,
                        name: company.name + ' ' + year,
                        year: year,
                        yearIndex: yearIndex,
                        leafUnits: leafUnits,
                        localPosition: {x: 0, y: y, z: 0}
                    },
                    update: {
                        "dragTracking": false,
                        "transform/position": {x: x, y: y, z: z},
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
                    },
                    postEvents: [
                        {
                            event: 'SetParent',
                            data: {
                                'path': 'object:' + baseObject.id
                            }
                        }
                    ]
                });

                anchorObject.yearObject = yearObject;
                baseObject.yearObject = yearObject;

                if (tuning.yearLabels) {

                    yearObject.labelObject = CreatePrefab({
                        prefab: "Prefabs/ProText",
                        update: {
                            'textMesh/text': '' + year,
                            'textMesh/fontSize': tuning.yearLabelFontSize,
                            trackPosition: 'Transform',
                            'transformPosition!': 'object:' + yearObject.id + '/transform',
                            extraOffset: { y: tuning.yearLabelHeight },
                            trackRotation: 'TransformYaw'
                        },
                        postEvents: [
                            {
                                event: 'SetParent',
                                data: {
                                    path: 'object:' + companyObject.id
                                }
                            }
                        ]
                    });

                }

                company.yearObjects.push(yearObject);

                if (tuning.unitEnabled) {

                    // Filter out the zero units, and make unit dicts to represent the non-zero units.
                    var unitIndex;
                    var nonZeroUnits = [];
                    for (unitIndex = 0; unitIndex < unitOutline.length; unitIndex++) {
                        var value = unitTable[unitIndex][yearIndex];
                        if (value == 0) {
                            continue;
                        }
                        nonZeroUnits.push({
                            obj: null,
                            name: unitOutline[unitIndex],
                            index: unitIndex,
                            parent: null,
                            children: [],
                            value: value
                        });
                    }

                    // Use the year as the root.
                    var rootUnit = {
                        obj: yearObject,
                        name: '' + year,
                        parent: null,
                        children: [],
                        value: 0,
                        indent: -1,
                        depth: 0,
                        position: {x: x, y: y, z: z}
                    };
                    yearObject.rootUnit = rootUnit;

                    var parentStack = [
                        rootUnit
                    ];

                    // Arrange the non-zero units into a tree.
                    var nonZeroUnitCount = nonZeroUnits.length;
                    for (unitIndex = 0; unitIndex < nonZeroUnitCount; unitIndex++) {
                        var unit = nonZeroUnits[unitIndex];

                        var unitName = unit.name;
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

                        unit.index = unitIndex;
                        unit.indent = indent;
                        unit.depth = parentStack.length;
                        unit.parent = parentUnit;
                        unit.children = [];
                        unit.size =
                            unitSizeMin +
                            (unitSizeRange *
                             (unit.value / unitValueMax));

                        parentStack.push(unit);

                    }

                    // Collect the leaf units.
                    for (unitIndex = 0; unitIndex < nonZeroUnitCount; unitIndex++) {
                        var unit = nonZeroUnits[unitIndex];

                        if (unit.children.length == 0) {
                            yearObject.leafUnits.push(unit);
                        }
                    }

                    var leafUnitCount = yearObject.leafUnits.length;
                    for (unitIndex = 0; unitIndex < leafUnitCount; unitIndex++) {
                        var unit = yearObject.leafUnits[unitIndex];

                        var parentUnit = unit.parent;
                        while (!parentUnit.obj) {
                            parentUnit = parentUnit.parent;
                        }


                        unit.ang = 
                            unitIndex * 
                            (2.0 * Math.PI / leafUnitCount);
                        unit.distance =
                            (tuning.unitRadiusHuff * unit.size) + tuning.unitRadiusExtra;
                        unit.position = {
                            x: x + Math.cos(unit.ang) * unit.distance,
                            y: y + Math.sin(unit.ang) * unit.distance,
                            z: z + Math.random() - 0.5
                        };
                        unit.scale = {
                            x: unit.size, 
                            y: unit.size, 
                            z: unit.size
                        };
                        unit.anchor = {
                            x: 0, 
                            y: 0,
                            z: 0
                        };

                        var color = modelColorScheme[0];
                        unit.modelNames = [];
                        unit.modelNumbers = [];
                        unit.modelColors = [];
                        var modelString = unitModels[unit.index % unitModels.length];
                        if (modelString.trim() != "") {
                            unit.modelNames = modelString.split(',');
                            for (var modelIndex = 0, modelCount = unit.modelNames.length; modelIndex < modelCount; modelIndex++) {
                                var modelName = unit.modelNames[modelIndex].trim();
                                unit.modelNames[modelIndex] = modelName;
                                var modelNumber = modelType.indexOf(modelName);
                                if (modelNumber == -1) {
                                    modelNumber = 0;
                                    console.log("private.js: can't find modelNumber for i: " + i + " modelName: " + modelName + " modelType: " + JSON.stringify(modelType));
                                }
                                unit.modelNumbers.push(modelNumber);
                                var colorIndex = modelNumber % modelColorScheme.length;
                                color = modelColorScheme[colorIndex];
                                unit.modelColors.push(color);
                            }
                        }

                        var unitObject = CreatePrefab({
                            prefab: 'Prefabs/Unit',
                            component: 'Tracker',
                            obj: {
                                unit: unit,
                                year: year,
                                yearObject: yearObject,
                                yearIndex: yearIndex,
                                //pieID: 'unit',
                                unitSize: unit.size,
                                unitScale: unit.scale
                            },
                            update: {
                                'dragTracking': true,
                                'transform/localPosition': unit.position,
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
                                'component:SpringJoint/connectedBody!': 'object:' + rootUnit.obj.id + '/component:Rigidbody'
                            },
                            interests: {
                                MouseEnter: {
                                    handler: function(unit, results) {
                                        //console.log("HandleEnterUnit", unit, results, Object.keys(unit.unit));
/*
                                        var u = unit.unit;
                                        var a = [];
                                        a.unshift(('' + u.name).trim() + ': $' + u.value);
                                        u = u.parent;
                                        while (u) {
                                            a.unshift(('' + u.name).trim());
                                            u = u.parent;
                                        }
                                        a.unshift(company.name);
                                        var text = "";
                                        for (var i = 0, n = a.length; i < n; i++) {
                                            for (var j = 0; j < i; j++) {
                                                text += '  ';
                                            }
                                            text += a[i] + "\n";
                                        }
*/
                                        var text = ('' + unit.unit.name).trim() + ': $' + unit.unit.value;
                                        ShowPopupText(text, 'object:' + unit.id + '/transform');
                                    }
                                },
                                MouseExit: {
                                    handler: function(unit, results) {
                                        //console.log("HandleExitUnit", unit, results);
                                        //HidePopupText();
                                    }
                                }
                            },
                            postEvents: [
                                {
                                    event: 'SetParent',
                                    data: {
                                        path: 'object:' + companyObject.id
                                    }
                                },
                                {
                                    event: 'Animate',
                                    data: [
                                        {
                                            command: 'scale',
                                            to: unit.scale,
                                            time: tuning.unitCreateAnimateTime
                                        }
                                    ]
                                }
                            ]
                        });

                        unit.obj = unitObject;

                        for (var modelIndex = 0, modelCount = unit.modelNames.length; modelIndex < modelCount; modelIndex++) {
                            var modelName = unit.modelNames[modelIndex];
                            var modelNumber = unit.modelNumbers[modelIndex];
                            var modelColor = unit.modelColors[modelIndex];
                            var ang = modelIndex * (2.0 * Math.PI / modelCount);
                            var dist = (modelCount == 1) ? 0 : tuning.unitModelOffset;
                            var dx = Math.cos(ang) * dist;
                            var dy = Math.sin(ang) * dist;
                            var modelObject = CreatePrefab({
                                prefab: 'Prefabs/UnitModel',
                                obj: {
                                    name: modelName,
                                    number: modelNumber,
                                    color: modelColor
                                },
                                update: {
                                    "transform/localPosition": {x: dx, y: 0, z: dy},
                                    "component:MeshRenderer/materials": [tuning.material],
                                    "component:MeshRenderer/material/color": modelColor
                                },
                                postEvents: [
                                    {
                                        event: 'SetParent',
                                        data: {
                                            path: 'object:' + unitObject.id,
                                            worldPositionStays: false
                                        }
                                    }
                                ]
                            });

                        }

                        if (tuning.unitArrows) {
                            unitObject.unitArrow = CreateRainbow(tuning.unitArrowRainbowType, yearObject, unit.obj, companyObject);
                        }

                        if (tuning.unitLabels) {
                            unitObject.labelObject = CreatePrefab({
                                prefab: "Prefabs/ProText",
                                update: {
                                    'textMesh/text': unit.name.trim(),
                                    'textMesh/fontSize': tuning.unitLabelFontSize,
                                    trackPosition: 'Transform',
                                    'transformPosition!': 'object:' + unit.obj.id + '/transform',
                                    extraOffset: { y: unit.size + tuning.labelHeightExtra },
                                    trackRotation: 'CameraRotation'
                                },
                                postEvents: [
                                    {
                                        event: 'SetParent',
                                        data: {
                                            path: 'object:' + companyObject.id
                                        }
                                    }
                                ]
                            });
                        }

                    }

                }

            }

            if (tuning.rainbowEnabled) {

                var bowCount = subject.length;
                while ((bowCount > 0) && 
                       (verbSubjectTable[bowCount - 1][yearIndex] == "")) {
                    bowCount--;
                }

                if (bowCount > 0) {

                    var rainbowWidth = bowCount;
                    var rainbowBaseElevation = tuning.rainbowBaseElevation;
                    var rainbowYearElevation = tuning.rainbowYearElevation;
                    var rainbowHeight = tuning.rainbowHeight;
                    var rainbowHeightStep = tuning.rainbowHeightStep;

                    var fromID = 
                        lastBaseObject.yearObject
                            ? lastBaseObject.yearObject.id
                            : lastBaseObject.id;

                    var fromHeight = 
                        lastBaseObject.yearObject
                            ? rainbowYearElevation
                            : rainbowBaseElevation;

                    var toID = 
                        baseObject.yearObject
                            ? baseObject.yearObject.id
                            : baseObject.id;

                    var toHeight = 
                        baseObject.yearObject
                            ? rainbowYearElevation
                            : rainbowBaseElevation;

                    var rainbowObject =
                        CreatePrefab({
                            prefab: 'Prefabs/Rainbow',
                            obj: {
                                bows: []
                            },
                            update: {
                                'fromTransform!': 'object:' + fromID + '/transform',
                                'toTransform!': 'object:' + toID + '/transform',
                                fromWidth: rainbowWidth,
                                toWidth: rainbowWidth,
                                fromRotation: 90,
                                toRotation: -90,
                                updateBowHeight: false,
                                fromLocalOffset: { x: rainbowWidth * 0.5, y: fromHeight }, // Left justify the start the rainbow.
                                toLocalOffset: { x: rainbowWidth * -0.5, y: toHeight } // Right justify the end of the rainbow.
                            },
                            postEvents: [
                                {
                                    event: 'SetParent',
                                    data: {
                                        path: 'object:' + companyObject.id
                                    }
                                }
                            ]
                        });

                    var bows = rainbowObject.bows;

                    for (var bowIndex = 0;
                         bowIndex < bowCount;
                         bowIndex++) {

                        var colorIndex = bowIndex % verbSubjectColorScheme.length;
                        var color = verbSubjectColorScheme[colorIndex];
                        var bowName = verbSubjectTable[bowIndex][yearIndex];

                        //console.log("bowUpdate", JSON.stringify(bowUpdate));

                        var bowObject =
                            CreatePrefab({
                                prefab: 'Prefabs/Bow',
                                update: {
                                    bowStart: 0,
                                    bowEnd: 1,
                                    startWidth: 1,
                                    endWidth: 1,
                                    bowRotation: 0,
                                    bowHeight: rainbowHeight,
                                    'lineRenderer/colorGradient': {
                                        alphaKeys: [
                                            {
                                                time: 0,
                                                alpha: tuning.bowAlpha
                                            }
                                        ],
                                        colorKeys: [
                                            {
                                                time: 0,
                                                color: color
                                            }
                                        ]
                                    }
                                },
                                postEvents: [
                                    {
                                        event: 'SetParent',
                                        data: {
                                            'path': 'object:' + rainbowObject.id
                                        }
                                    }
                                ]});

                        rainbowObject.bows.push(bowObject);

                        rainbowHeight += rainbowHeightStep;
                    }

                }

            }

        }

        lastBaseObject = baseObject;
        x += yearSpacing;
    }


    for (var yearIndex = firstYearIndex; yearIndex <= lastYearIndex; yearIndex++) {
        todo.push((function(yearIndex) {
            return function() {
                CreateYear(yearIndex);
            };
        })(yearIndex));
    }


    function DoNext()
    {
        if (todo.length == 0) {
            return;
        }

        var f = todo.shift();

        f();

        if (todo.length) {
            window.setTimeout(DoNext, tuning.betweenYearDelay);
        }
    }

    // Make a tree out of the entire unitOutline.

    var rootUnit = {
        name: company.name + ' Units',
        parent: null,
        children: [],
        indent: -1,
        depth: 0
    };

    var parentStack = [
        rootUnit
    ];

    console.log("making unit tree", unitOutline.length);
    for (var unitIndex = 0, unitCount = unitOutline.length; unitIndex < unitCount; unitIndex++) {
        var unitName = unitOutline[unitIndex];

        for (var indent = 0, nameLength = unitName.length; indent < nameLength; indent++) {
            if (unitName[indent] != ' ') {
                break;
            }
        }

        console.log("unitIndex", unitIndex, "unitName", unitName, "indent", indent);

        while (indent <= parentStack[parentStack.length - 1].indent) {
            parentStack.pop();
        }
        var parentUnit = parentStack[parentStack.length - 1];
        console.log("parentUnit", parentUnit);
        var unit = {
            name: unitName.trim(),
            index: unitIndex,
            indent: indent,
            depth: parentStack.length,
            parent: parentUnit,
            children: []
        };
        parentUnit.children.push(unit);

        parentStack.push(unit);
    }

    function MakeUnitPies(parentPieID, pieID, unit)
    {
        console.log("MakeUnitPies: pieID:", pieID, "unit", unit, unit.name, unit.children.length);
        var slices = null;
        if (unit.children && unit.children.length) {
            slices = [];
            for (var unitIndex = 0, unitCount = unit.children.length; unitIndex < unitCount; unitIndex++) {
                (function(unitIndex) {
                    var subUnit = unit.children[unitIndex];
                    var unitLabel = subUnit.name;
                    var subPieID = pieID + '_' + subUnit.index;
                    console.log("unitIndex", unitIndex, "subUnit", subUnit, "unitLabel", unitLabel, "subPieID", subPieID);
                    slices.push({
                        items: [
                            {
                                label: unitLabel,
                                onenteritem: function(item, slice, pie, target) {
                                    console.log("Item Unit Enter", unit, unitLabel);
                                },
                                onexititem: function(item, slice, pie, target) {
                                    console.log("Item Unit Exit", unit, unitLabel);
                                },
                                pieID: subPieID
                            }
                        ]
                    });
                    var subPie = MakeUnitPies(pieID, subPieID, subUnit);
                })(unitIndex);
            }
        }
        var pie = globals.pieTracker.pies[pieID] = {
            label: unit.name,
            slices: slices,
            drawBackground:	'DrawBackground_Pie',
            centerPieID: parentPieID,
            itemDistance: 50
        };

        return pie;
    }

    MakeUnitPies(null, 'units_' + company.name, rootUnit);

    var slices = [];

    for (var marketIndex = 0, marketCount = marketType.length; marketIndex < marketCount; marketIndex++) {
        var marketLabel = marketType[marketIndex];
        slices.push({
            items: [
                {
                    label: marketLabel,
                    onenteritem: function(item, slice, pie, target) {
                        console.log("Item Market Enter", marketLabel);
                    },
                    onexititem: function(item, slice, pie, target) {
                        console.log("Item Market Exit", marketLabel);
                    }
                }
            ]
        });
    }
    globals.pieTracker.pies['markets_' + company.name] = {
        title: company.name + ' Markets',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 50
    };

    var slices = [];
    for (var modelIndex = 0, modelCount = modelType.length; modelIndex < modelCount; modelIndex++) {
        var modelLabel = modelType[modelIndex];
        slices.push({
            items: [
                {
                    label: modelLabel,
                    onenteritem: function(item, slice, pie, target) {
                        console.log("Item Model Enter", modelLabel);
                    },
                    onexititem: function(item, slice, pie, target) {
                        console.log("Item Model Exit", modelLabel);
                    }
                }
            ]
        });
    }
    globals.pieTracker.pies['models_' + company.name] = {
        title: company.name + ' Models',
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        itemDistance: 50
    };

    var slices = [];
    for (var yearIndex = 0, yearCount = years.length; yearIndex < yearCount; yearIndex++) {
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
                sliceSize: Math.PI * (1.0 / yearCount)
            });
        })(yearIndex);
    }
    
    var commands = [
        ['Models', 'models_' + company.name, null],
        ['Markets', 'markets_' + company.name, null],
        ['Overview', null, function() { 
                FocusCompany(company);
            }],
        ['Units', 'units_' + company.name, null],
        ['Hide', null, function() {
                HideCompany(company); 
            }]
    ];
    for (var commandIndex = 0, commandCount = commands.length; commandIndex < commandCount; commandIndex++) {
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
                sliceSize: Math.PI * (1.0 / commandCount)
            });
        })(commandIndex);
    }

    globals.pieTracker.pies['company_' + company.name] = {
        label: company.name,
        slices: slices,
        drawBackground:	'DrawBackground_Pie',
        initialDirection: Math.PI,
        subtend: 2.0 * Math.PI,
        itemDistance: 50
    }

    window.setTimeout(DoNext, tuning.beforeYearDelay);
}


 function ShowPopupText(text, xform)
 {
    if (!globals.popupText) {
        globals.popupText = CreatePrefab({
            prefab: 'Prefabs/OverlayText',
            update: {
                'textMesh/fontSize': 18,
                'textMesh/color': { r: 1, g: 1, b: 1 },
                'textMesh/alignment': 'Left',
                'component:RectTransform/pivot': { x: 0, y: 1 },
                'screenOffset': { x: 0, y: 0 }
            },
            postEvents: [
                {
                    event: 'SetParent',
                    data: {
                        path: 'object:' + globals.textOverlays.id + '/overlay'
                    }
                }
            ]
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
                'textMesh/text': label + ":\n$" + node.data.value,
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


function DrawBackground_Unit_RadialTidyTree(canvas, context, params, success, error)
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
    var yearObject = unitObject.yearObject;
    var rootUnit = yearObject.rootUnit;
    var margin = 50;
    var padding = 10;
    var pack = d3.pack()
        .size([width - (2 * margin), height - (2 * margin)])
        .padding(padding);

    //console.log("DrawBackground_Unit: pack", pack);

    var tree = function(data) {
        return d3.tree()
            .size([2 * Math.PI, cx])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
            (d3.hierarchy(rootUnit));
    };

    pack(root);

    var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, cx);
    var r = (cx - margin) / cx;
    gradient.addColorStop(0, '#00000080');
    gradient.addColorStop(r, '#00000080');
    gradient.addColorStop(1, '#00000000');
    context.arc(cx, cy, cx, 0, Math.PI * 2.0);
    context.fillStyle = gradient;
    context.fill();

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

    var u = unitObject.unit;
    var a = [];
    a.unshift(('' + u.name).trim() + ':\n$' + u.value);
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


////////////////////////////////////////////////////////////////////////

