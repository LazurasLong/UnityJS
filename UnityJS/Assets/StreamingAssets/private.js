/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbwZsTt8rUekSzwrK4PSnndaoGsMWXwIZnKm1IOFlg/exec';
globals.spreadsheetID = '1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY';

globals.sheetRefs = {
    "world": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        0
    ],
    "test": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        2039021030
    ],
    "templates": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1535357011
    ],
    "texturePaths": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        580619937
    ],
    "materialPaths": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1288543752
    ],
    "prefabMap": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1469835123
    ],
    "tiles": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1579247368
    ],
    "rainbows": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        164091207
    ],
    "bows_rgbymc": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1544589805
    ],
    "bows_red": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1854560943
    ],
    "bows_green": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1454515772
    ],
    "bows_blue": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1466670725
    ],
    "bows_yellow": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1541060846
    ],
    "bows_magenta": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1996689157
    ],
    "bows_cyan": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        724646415
    ],
    "bows_arrow": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        568829119
    ],
    "bows_cobra": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        335200639
    ],
    "blobs": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        412054745
    ],
    "jsonsters": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        131799685
    ],
    "players": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1362487343
    ],
    "palette": [
        "1m7FANuMTPAfugSTw20pHSSpTF-Ugj0Hg11Z52nRtuLY",
        1146370483
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
};



////////////////////////////////////////////////////////////////////////


function CreatePrivate()
{
    var world = globals.world;

    if (!world.createPrivate) {
        return;
    }

    var players = world.players;
    var playerData = players.playerData;
    var yearSpacing = playerData.yearSpacing;
    var yearHeight = playerData.yearHeight;
    var unitSizeMin = playerData.unitSizeMin;
    var unitSizeMax = playerData.unitSizeMax;
    var unitSizeRange = unitSizeMax - unitSizeMin;
    var marketSizeMin = playerData.marketSizeMin;
    var marketSizeMax = playerData.marketSizeMax;
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
    var yearScaleBig = 20;
    var x = -0.5 * yearSpacing * (yearsShown - 1);
    var y = yearHeight;
    var z = 0;

    globals.players = [];

    var lastBaseObject = null;

    for (var yearIndex = firstYearIndex; yearIndex <= lastYearIndex; yearIndex++) {
        var year =
            ((yearIndex >= 0) &&
             (yearIndex < years.length))
                ? years[yearIndex]
                : 0;
        var yearInfo = year ? yearInfos[year] : null;

        var unitObjects = [];
        var baseScale = 1;
        var baseHeight = 0.25;
        var basePosition = {x: x, y: 0, z: z};

        var anchorObject =  CreatePrefab({
            prefab: "Prefabs/Anchor",
            update: {
                "transform/localPosition": basePosition,
                dragTracking: true,
                "component:Rigidbody/drag": 10,
                "component:Rigidbody/constraints": "FreezePositionY,FreezeRotationX,FreezeRotationY,FreezeRotationZ",
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

        var baseMass = 1;
        var baseSpring = 100;
        var baseDamper = 5;
        var baseDrag = 5;

        var baseObject = CreatePrefab({
            prefab: 'Prefabs/HexBase',
            component: 'Tracker',
            obj: {
                anchorObject: anchorObject
            },
            update: {
                "transform/localPosition": basePosition,
                "transform:Hexes/localScale": {x: baseScale, y: baseHeight, z: baseScale},
                "component:Rigidbody/isKinematic": false,
                "component:Rigidbody/useGravity": playerData.useGravity,
                "component:Rigidbody/mass": baseMass,
                "component:Rigidbody/drag": baseDrag,
                "component:Rigidbody/constraints": "FreezePositionY,FreezeRotationX,FreezeRotationY,FreezeRotationZ",
                "component:SpringJoint/spring": baseSpring,
                "component:SpringJoint/damper": baseDamper,
                "component:SpringJoint/autoConfigureConnectedAnchor": false,
                "component:SpringJoint/enableCollision": true,
                "component:SpringJoint/connectedBody!": "object:" + anchorObject.id + "/component:Rigidbody",
                "component:TrackerProxy/target!": "object:" + anchorObject.id
            },
            interests: {
                MouseDown: {
                    handler: function (obj, result) {
                        var animations = [];
                        if (world.currentBaseObject != null) {
                            if (world.currentBaseObject.yearObject != null) {
                                var unitObjects = world.currentBaseObject.yearObject.unitObjects;
                                for (var i = 0, n = unitObjects.length; i < n; i++) {
                                    var unitObject = unitObjects[i];
                                    animations.push({
                                        command: 'scale',
                                        target: 'object:' + unitObject.id + '/transform:Collider',
                                        time: playerData.unitColliderUnPuffTime,
                                        to: { x: 1, y: 1, z: 1 }
                                    });
                                }
                                if (world.currentBaseObject.yearObject) {
                                    UpdateObject(world.currentBaseObject.yearObject, {
                                        'component:Rigidbody/method:WakeUp': []
                                    });
                                    AnimateObject(world.currentBaseObject.yearObject, [
                                        {
                                            command: 'moveLocal',
                                            time: playerData.yearLiftTime,
                                            position: world.currentBaseObject.yearObject.localPosition
                                        }
                                    ]);
                                }
                            }
                        }
                        if (world.currentBaseObject == obj) {
                            world.currentBaseObject = null;
                        } else {
                            world.currentBaseObject = obj;
                            if (obj.yearObject != null) {
                                var unitObjects = obj.yearObject.unitObjects;
                                for (var i = 0, n = unitObjects.length; i < n; i++) {
                                    var unitObject = unitObjects[i];
                                    animations.push({
                                        command: 'scale',
                                        target: 'object:' + unitObject.id + '/transform:Collider',
                                        time: playerData.unitColliderPuffTime,
                                        to: { x: playerData.unitColliderPuff, y: playerData.unitColliderPuff, z: playerData.unitColliderPuff }
                                    });
                                }
                                UpdateObject(obj.yearObject, {
                                    'component:Rigidbody/method:WakeUp': []
                                });
                                AnimateObject(obj.yearObject, [
                                    {
                                        command: 'moveLocal',
                                        time: playerData.yearLiftTime,
                                        position: { 
                                            x: obj.yearObject.localPosition.x, 
                                            y: obj.yearObject.localPosition.y + playerData.yearLiftHeight, 
                                            z: obj.yearObject.localPosition.z
                                        }
                                    }
                                ]);
                            }
                        }
                        if (animations.length > 0) {
                            AnimateObject(obj, animations);
                        }
                    }
                }
            }});

        anchorObject.baseObject = baseObject;

        var labelObject = null;

        var baseSpecs = [];

        if (!yearInfo) {
            UpdateObject(baseObject, {
                'transform:Hexes/transform:HexBase_0/gameObject/method:SetActive': [true],
                'transform:Hexes/transform:HexBase_0/component:MeshRenderer/material/color': { r: 0.5, g: 0.5, b: 0.5 }
            });
        } else {

            var yearObject = CreatePrefab({
                prefab: 'Prefabs/Ball',
                component: 'Tracker',
                obj: {
                    anchorObject: anchorObject,
                    baseObject: baseObject,
                    year: year,
                    yearIndex: yearIndex,
                    yearInfo: yearInfo,
                    unitObjects: unitObjects,
                    localPosition: {x: 0, y: y, z: 0}
                },
                update: {
                    "dragTracking": false,
                    "transform/position": {x: x, y: y, z: z},
                    "transform/localScale": tinyScale,
                    "component:MeshRenderer/materials": [playerData.material],
                    "component:Collider/sharedMaterial": playerData.physicMaterial,
                    "component:Collider/radius": playerData.colliderRadius,
                    "component:Rigidbody/isKinematic": false,
                    "component:Rigidbody/constraints": "FreezePositionX,FreezePositionY,FreezePositionZ,FreezeRotationX,FreezeRotationY,FreezeRotationZ",
                    "component:Rigidbody/useGravity": false,
                    "component:Rigidbody/mass": playerData.mass,
                    "component:Rigidbody/angularDrag": playerData.angularDrag
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

            labelObject = CreatePrefab({
                prefab: "Prefabs/ProText",
                update: {
                    'textMesh/text': "" + year,
                    'textMesh/fontSize': playerData.yearLabelFontSize,
                    trackPosition: 'Transform',
                    'transformPosition!': 'object:' + yearObject.id + '/transform',
                    extraOffset: { y: playerData.yearLabelHeight },
                    trackRotation: 'TransformYaw'
                }
            });

            globals.players.push(yearObject);

            var unitsMax = yearInfo.unitsMax;
            var unitsSum = yearInfo.unitsSum;
            var marketsMax = yearInfo.marketsMax;
            var marketsSum = yearInfo.marketsSum;

            var yearUnit;
            var unitIndex;
            var nonZeroUnits = [];
            for (unitIndex = 0; unitIndex < unitCount; unitIndex++) {
                yearUnit = yearInfo.units[unitIndex];
                if (yearUnit == 0) {
                    continue;
                }
                nonZeroUnits.push({
                    index: unitIndex,
                    value: yearUnit,
                    label: unitLabels[unitIndex],
                    children: []
                });
            }

            var nonZeroUnitCount = nonZeroUnits.length;
            var parentStack = [
                [yearObject, -1]
            ];
            yearObject.children = [];
            for (unitIndex = 0; unitIndex < nonZeroUnitCount; unitIndex++) {
                var unit = nonZeroUnits[unitIndex];
                var unitLabel = unit.label;

                for (var indent = 0, labelLength = unitLabel.length; indent < labelLength; indent++) {
                    if (unitLabel[indent] != ' ') {
                        break;
                    }
                }

                while (indent <= parentStack[parentStack.length - 1][1]) {
                    parentStack.pop();
                }

                var parentObject = parentStack[parentStack.length - 1][0];

                unit.indent = indent;
                unit.depth = parentStack.length;
                unit.parent = parentObject;
                parentObject.children.push(unit);
            }

            var leafUnits = [];
            for (unitIndex = 0; unitIndex < nonZeroUnitCount; unitIndex++) {
                var unit = nonZeroUnits[unitIndex];
                if (unit.children.length) {
                    continue;
                }
                leafUnits.push(unit);
            }

            var leafUnitCount = leafUnits.length;
            for (unitIndex = 0; unitIndex < leafUnitCount; unitIndex++) {
                var unit = leafUnits[unitIndex];
                var ang = unitIndex * (2.0 * Math.PI / leafUnitCount);
                var pal = palette[0];

                var unitSize =
                    unitSizeMin +
                    (unitSizeRange *
                     (unit.value / amazon.unitValueMax));

                var unitDistance = unitSize + playerData.unitRadiusExtra;
                var unitX = x + Math.cos(ang) * unitDistance;
                var unitY = y + Math.sin(ang) * unitDistance;
                var unitZ = z + Math.random() - 0.5;

                var unitModelString = amazon.unitModels[unit.index % amazon.unitModels.length];
                if (unitModelString.trim() != "") {
                    var unitModelList = unitModelString.split(',');
                    for (var i = 0, n = unitModelList.length; i < n; i++) {
                        var unitModel = unitModelList[i].trim();
                        if (unitModel == '') {
                            continue;
                        }
                        unitModelList[i] = unitModel;
                        var modelIndex = amazon.models.indexOf(unitModel);
                        if (modelIndex == -1) {
                            modelIndex = 0;
                            console.log("private.js: can't find modelIndex for i: " + i + " unitModel: " + unitModel + " modelIndex: " + modelIndex + " models: " + JSON.stringify(amazon.models));
                        }
                        var paletteIndex = modelIndex % palette.length;
                        pal = palette[paletteIndex];
                        break;
                    }
                }

                var flingForce = 1000.0;

                var unitObject = CreatePrefab({
                    prefab: 'Prefabs/Unit',
                    component: 'Tracker',
                    obj: {
                        year: year,
                        yearObject: yearObject,
                        yearIndex: yearIndex,
                        yearInfo: yearInfo,
                        unitSize: unitSize
                    },
                    update: {
                        "dragTracking": true,
                        "transform/localPosition": {x: unitX, y: unitY, z: unitZ},
                        "transform/localScale": tinyScale,
                        "component:MeshRenderer/materials": [playerData.material],
                        "component:MeshRenderer/material/color": { r: pal.color.r, g: pal.color.g, b: pal.color.b },
                        "transform:Collider/component:Collider/sharedMaterial": playerData.physicMaterial,
                        "transform:Collider/component:Collider/radius": playerData.colliderRadius,
                        "component:Rigidbody/isKinematic": playerData.isUnitKinematic,
                        "component:Rigidbody/useGravity": false,
                        "component:Rigidbody/mass": playerData.mass,
                        "component:Rigidbody/drag": playerData.drag,
                        "component:Rigidbody/angularDrag": playerData.angularDrag,
                        "component:SpringJoint/spring": playerData.unitSpring,
                        "component:SpringJoint/autoConfigureConnectedAnchor": false,
                        "component:SpringJoint/enableCollision": true,
                        "component:SpringJoint/connectedBody!": "object:" + yearObject.id + "/component:Rigidbody"
                    },
                    postEvents: [
                        {
                            event: 'Animate',
                            data: [
                                {
                                    command: 'scale',
                                    to: {x: unitSize, y: unitSize, z: unitSize},
                                    time: playerData.animateTime
                                }
                            ]
                        }
                    ],
                    interests: {
                    }});

                unitObjects.push(unitObject);
                parentStack.push([unitObject, indent]);

                if (playerData.createUnitRainbows) {
                    CreateRainbow(playerData.unitRainbowType, parentObject, unitObject);
                }

                if (playerData.createUnitLabels) {
                    var label = CreatePrefab({
                        prefab: "Prefabs/ProText",
                        update: {
                            'textMesh/text': unitLabel.trim(),
                            'textMesh/fontSize': playerData.unitLabelFontSize,
                            trackPosition: 'Transform',
                            'transformPosition!': 'object:' + unitObject.id + '/transform',
                            extraOffset: { y: unitSize + playerData.labelHeightExtra },
                            trackRotation: 'CameraRotation'
                        }
                    });
                }

            }

            var verbSubjects = yearInfo.verbSubjects;
            var bowCount = verbSubjects.length;
            while ((bowCount > 0) && 
                   (verbSubjects[bowCount - 1] == "")) {
                bowCount--;
            }

            if (bowCount > 0) {

                var rainbowWidth = bowCount;
                var rainbowBaseElevation = playerData.rainbowBaseElevation;
                var rainbowYearElevation = playerData.rainbowYearElevation;
                var rainbowHeight = playerData.rainbowHeight;
                var rainbowHeightStep = playerData.rainbowHeightStep;
                var fromID = lastBaseObject.yearObject ? lastBaseObject.yearObject.id : lastBaseObject.id;
                var fromHeight = lastBaseObject.yearObject ? rainbowYearElevation : rainbowBaseElevation;
                var toID = baseObject.yearObject ? baseObject.yearObject.id : baseObject.id;
                var toHeight = baseObject.yearObject ? rainbowYearElevation : rainbowBaseElevation;

                var rainbowObject =
                    CreatePrefab({
                        prefab: 'Prefabs/Rainbow',
                        obj: {
                            bows: []
                        },
                        update: {
                            'fromTransform!': 'object:' + fromID + '/transform',
                            'toTransform!': 'object:' + toID + '/transform',
                            bowHeight: playerData.bowHeight,
                            fromWidth: rainbowWidth,
                            toWidth: rainbowWidth,
                            fromRotation: 90,
                            toRotation: -90,
                            fromLocalOffset: { x: rainbowWidth * 0.5, y: fromHeight },
                            toLocalOffset: { x: rainbowWidth * -0.5, y: toHeight },
                            updateBowHeight: false
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
                                textureScale: pal.textureScale,
                                "lineRenderer/material/method:UpdateMaterial": [
                                    {
                                        texture_MainTex: pal.texture,
                                        texture_BumpMap: pal.bumpMap,
                                        color: { r: 1, g: 1, b: 1, a: pal.color.a },
                                        color_EmissionColor: { r: pal.color.r, g: pal.color.g, b: pal.color.b }
                                    }
                                ]
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

            var modelCount = yearInfo.models.length;
            while ((modelCount > 1) &&
                   (yearInfo.models[modelCount - 1] == "")) {
                modelCount--;
            }

            var update = {};
            for (var modelIndex = 0; modelIndex < modelCount; modelIndex++) {
                var paletteIndex = modelIndex % palette.length;
                pal = palette[paletteIndex];
                update['transform:Hexes/transform:HexBase_' + modelIndex + '/gameObject/method:SetActive'] = [true];
                update['transform:Hexes/transform:HexBase_' + modelIndex + '/component:MeshRenderer/material/color'] = pal.color;
            }
            UpdateObject(baseObject, update);

        }

        lastBaseObject = baseObject;
        x += yearSpacing;

    }


    UpdateObject(globals.proCamera, {
        'component:ProCamera/moveSpeed': playerData.proCameraMoveSpeed,
        'component:ProCamera/rotateSpeed': playerData.proCameraRotateSpeed,
        'component:ProCamera/zoomSpeed': playerData.proCameraZoomSpeed,
        'component:ProCamera/panSpeed': playerData.proCameraPanSpeed
    });


}


////////////////////////////////////////////////////////////////////////
