/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbwZsTt8rUekSzwrK4PSnndaoGsMWXwIZnKm1IOFlg/exec';

Object.assign(globals.sheetRefs, {
    "private": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        0
    ],
    "hexBases": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1120309657
    ],
    "palette": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1146370483
    ],
    "tuning": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1362487343
    ],
    "amazonSource": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1102331639
    ],
    "amazon": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        886538810
    ],
    "amazon_1996": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        194146645
    ],
    "amazon_2003": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1209709015
    ],
    "amazon_2010": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        620156431
    ],
    "amazon_2017": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1020307093
    ]
});


////////////////////////////////////////////////////////////////////////


function CreatePrivate()
{
    var world = globals.world;
    var tuning = world.tuning;
    var yearSpacing = tuning.yearSpacing;
    var yearHeight = tuning.yearHeight;
    var unitSizeMin = tuning.unitSizeMin;
    var unitSizeMax = tuning.unitSizeMax;
    var unitSizeRange = unitSizeMax - unitSizeMin;
    var marketSizeMin = tuning.marketSizeMin;
    var marketSizeMax = tuning.marketSizeMax;
    var marketSizeRange = marketSizeMax - marketSizeMin;
    var amazon = world.amazon;
    var valuationMin = amazon.valuationMin;
    var valuationMax = amazon.valuationMax;
    var valuationRange = valuationMax - valuationMin;
    var years = amazon.years;
    var yearCount = years.length;
    var yearInfos = amazon.yearInfos;
    var financialLabels = amazon.financialLabels;
    var marketDimension = amazon.marketsDimensions;
    var marketLabels = amazon.marketsLabels;
    var unitLabels = amazon.unitLabels;
    var unitCount = unitLabels.length;
    var subjects = amazon.subjects;
    var verbs = amazon.verbs;
    var palette = world.palette;
    var tinyScale = { x:0.01, y: 0.01, z: 0.01 };
    var firstYearIndex = -1;
    var lastYearIndex = yearCount - 1;
    var yearsShown = (lastYearIndex - firstYearIndex) + 1;
    var x = -0.5 * yearSpacing * (yearsShown - 1);
    var y = yearHeight;
    var z = 0;
    var lastBaseObject = null;

    globals.cuboid.pieID = 'main';
    globals.yearObjects = [];

    UpdateObject(globals.proCamera, {
        'component:ProCamera/moveSpeed': tuning.proCameraMoveSpeed,
        'component:ProCamera/yawSpeed': tuning.proCameraYawSpeed,
        'component:ProCamera/pitchSpeed': tuning.proCameraPitchSpeed,
        'component:ProCamera/orbitYawSpeed': tuning.proCameraOrbitYawSpeed,
        'component:ProCamera/orbitPitchSpeed': tuning.proCameraOrbitPitchSpeed,
        'component:ProCamera/wheelZoomSpeed': tuning.proCameraWheelZoomSpeed,
        'component:ProCamera/wheelPanSpeed': tuning.proCameraWheelPanSpeed
    });

    var todo = [];

    function CreateYear(yearIndex)
    {
        var year =
            ((yearIndex >= 0) &&
             (yearIndex < years.length))
                ? years[yearIndex]
                : 0;
        var yearInfo = year ? yearInfos[year] : null;

        var unitObjects = [];
        var anchorPosition = {x: x, y: tuning.baseElevation, z: z};
        var basePosition = {x: x, y: tuning.baseElevation, z: z};
        var baseScale = {x: tuning.baseScale, y: tuning.baseHeight, z: tuning.baseScale};

        var anchorObject =  CreatePrefab({
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
                DragStart: {
                    handler: function(obj, result) {
                        //console.log("private.js: Anchor: DragStart", obj.id);
                    }
                },
                DragStop: {
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
            }
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
                MouseDown: {
                    handler: function (obj, result) {
                        var animations = [];
                        // Select or toggle this base as the current base.
                        // First deselect the current base, if there is one.
                        if (world.currentBaseObject) {

                            // If the current base has a year, then un-puff all of its units and move it back down.
                            var yearObject = world.currentBaseObject.yearObject;
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
                        if (world.currentBaseObject == obj) {

                            // Now no base is selected.
                            world.currentBaseObject = null;

                        } else {

                            // Select this base as the current base.
                            world.currentBaseObject = obj;

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
            }});

        anchorObject.baseObject = baseObject;

        var baseSpecs = [];

        if (!yearInfo) {

            // Make one dummy base hex if there is no year.

            var height = tuning.hexHeightMin;
            var pos = world.hexBases[0].position;
            var hexPosition = { x: pos.x, y: height, z: pos.z };
            var hexScale = { x: 1, y: height / tuning.hexHeight, z: 1 };
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

            // Calculate the number of models for this year.

            var modelCount = yearInfo.models.length;
            while ((modelCount > 1) &&
                   (yearInfo.models[modelCount - 1] == "")) {
                modelCount--;
            }

            // Make a base hex for each model.

            for (var modelIndex = 0; modelIndex < modelCount; modelIndex++) {

                var paletteIndex = modelIndex % palette.length;
                pal = palette[paletteIndex];

                var pos = world.hexBases[modelIndex].position;
                var height = 
                    ((((pos.z - tuning.hexZMin) / 
                       tuning.hexZRange) * 
                      tuning.hexHeightRange) + 
                     tuning.hexHeightMin);
                var hexPosition = { x: pos.x, y: height, z: pos.z };
                var hexScale = { x: 1, y: height / tuning.hexHeight, z: 1 };
                var hex = CreatePrefab({
                    prefab: 'Prefabs/Hex',
                    update: {
                        'transform/localPosition': hexPosition,
                        'transform/localScale': hexScale,
                        'component:MeshRenderer/material/color': pal.color
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

            if (tuning.yearEnabled) {

                var leafUnits = [];

                var yearObject = CreatePrefab({
                    prefab: 'Prefabs/Ball',
                    component: 'Tracker',
                    obj: {
                        anchorObject: anchorObject,
                        baseObject: baseObject,
                        name: '' + year,
                        year: year,
                        yearIndex: yearIndex,
                        yearInfo: yearInfo,
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
                        }
                    });

                }

                globals.yearObjects.push(yearObject);

                if (tuning.unitEnabled) {

                    // Filter out the zero units, and make unit dicts to represent the non-zero units.
                    var unitIndex;
                    var nonZeroUnits = [];
                    for (unitIndex = 0; unitIndex < unitCount; unitIndex++) {
                        var value = yearInfo.units[unitIndex];
                        if (value == 0) {
                            continue;
                        }
                        nonZeroUnits.push({
                            obj: null,
                            name: unitLabels[unitIndex],
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
                             (unit.value / amazon.unitValueMax));

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

                        var pal = palette[0];
                        unit.modelNames = [];
                        unit.modelNumbers = [];
                        unit.modelPals = [];
                        var modelString = amazon.unitModels[unit.index % amazon.unitModels.length];
                        if (modelString.trim() != "") {
                            unit.modelNames = modelString.split(',');
                            for (var modelIndex = 0, modelCount = unit.modelNames.length; modelIndex < modelCount; modelIndex++) {
                                var modelName = unit.modelNames[modelIndex].trim();
                                unit.modelNames[modelIndex] = modelName;
                                var modelNumber = amazon.models.indexOf(modelName);
                                if (modelNumber == -1) {
                                    modelNumber = 0;
                                    console.log("private.js: can't find modelNumber for i: " + i + " modelName: " + modelName + " unitModels: " + JSON.stringify(amazon.unitModels));
                                }
                                unit.modelNumbers.push(modelNumber);
                                var paletteIndex = modelNumber % palette.length;
                                pal = palette[paletteIndex];
                                unit.modelPals.push(pal);
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
                                yearInfo: yearInfo,
                                unitSize: unit.size,
                                unitScale: unit.scale,
                                pieID: 'unit'
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
                            postEvents: [
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
                            ],
                            interests: {
                                MouseEnter: {
                                    handler: function(unit, results) {
                                        //console.log("HandleEnterUnit", unit, results, Object.keys(unit.unit));
                                        var u = unit.unit;
                                        var a = [];
                                        a.unshift(('' + u.name).trim() + ': $' + u.value);
                                        u = u.parent;
                                        while (u) {
                                            a.unshift(('' + u.name).trim());
                                            u = u.parent;
                                        }
                                        a.unshift(unit.yearObject.yearInfo.name);
                                        var text = "";
                                        for (var i = 0, n = a.length; i < n; i++) {
                                            for (var j = 0; j < i; j++) {
                                                text += '  ';
                                            }
                                            text += a[i] + "\n";
                                        }
                                        ShowPopupText(text, 'object:' + unit.id + '/transform');
                                    }
                                },
                                MouseExit: {
                                    handler: function(unit, results) {
                                        //console.log("HandleExitUnit", unit, results);
                                        //HidePopupText();
                                    }
                                }
                            }
                        });

                        unit.obj = unitObject;

                        for (var modelIndex = 0, modelCount = unit.modelNames.length; modelIndex < modelCount; modelIndex++) {
                            var modelName = unit.modelNames[modelIndex];
                            var modelNumber = unit.modelNumbers[modelIndex];
                            var modelPal = unit.modelPals[modelIndex];
                            var ang = modelIndex * (2.0 * Math.PI / modelCount);
                            var dist = (modelCount == 0) ? 0 : tuning.unitModelOffset;
                            var dx = Math.cos(ang) * dist;
                            var dy = Math.sin(ang) * dist;
                            var modelObject = CreatePrefab({
                                prefab: 'Prefabs/UnitModel',
                                obj: {
                                    name: modelName,
                                    number: modelNumber,
                                    pal: modelPal
                                },
                                update: {
                                    "transform/localPosition": {x: dx, y: 0, z: dy},
                                    "component:MeshRenderer/materials": [tuning.material],
                                    "component:MeshRenderer/material/color": { r: modelPal.color.r, g: modelPal.color.g, b: modelPal.color.b }
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
                            unitObject.unitArrow = CreateRainbow(tuning.unitArrowRainbowType, yearObject, unit.obj);
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
                                }
                            });
                        }

                    }

                }

            }

            if (tuning.rainbowEnabled) {

                var verbSubjects = yearInfo.verbSubjects;
                var bowCount = verbSubjects.length;
                while ((bowCount > 0) && 
                       (verbSubjects[bowCount - 1] == "")) {
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
                            }
                        });

                    var bows = rainbowObject.bows;

                    for (var bowIndex = 0;
                         bowIndex < bowCount;
                         bowIndex++) {

                        var paletteIndex = bowIndex % palette.length;
                        var pal = palette[paletteIndex];
                        var bowName = verbSubjects[bowIndex];

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
                                                alpha: pal.color.a
                                            }
                                        ],
                                        colorKeys: [
                                            {
                                                time: 0,
                                                color: {
                                                    r: pal.color.r,
                                                    g: pal.color.g,
                                                    b: pal.color.b
                                                }
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
            window.setTimeout(DoNext, tuning.todoDelay);
        }
    }

    window.setTimeout(DoNext, tuning.todoDelay);
}


 function ShowPopupText(text, xform)
 {
    if (!globals.popupText) {
        globals.popupText = CreatePrefab({
            prefab: 'Prefabs/OverlayText',
            update: {
                'textMesh/fontSize': 24,
                'textMesh/color': { r: 0.5, g: 1, b: 1 },
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
                x: (node.x + margin) - cx,
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
    a.unshift(unitObject.yearObject.yearInfo.name);
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

