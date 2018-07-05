/*
 * private.js
 * Don Hopkins, Ground Up Software.
 */


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
    var yearSizeMin = playerData.yearSizeMin;
    var yearSizeMax = playerData.yearSizeMax;
    var yearSizeRange = yearSizeMax - yearSizeMin;
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
    var x = -0.5 * yearSpacing * yearCount;
    var y = yearHeight;
    var z = 0;

    globals.players = [];

    var lastYearObject = CreatePrefab({
        update: {
            "transform/localPosition": {x: x, y: y, z: z},
            "transform/localScale": tinyScale
        }
    });

    globals.players.push(lastYearObject);

    x += yearSpacing;

    for (var yearIndex = 0; yearIndex < yearCount; yearIndex++) {
        var year = years[yearIndex];
        var yearInfo = yearInfos[year];
        var yearValuation = yearInfo.valuation.total;
        var valuationSize =
            yearSizeMin +
            (yearSizeRange *
             ((yearValuation - valuationMin) / 
              valuationRange));

        console.log("yearIndex", yearIndex, "yearCount", yearCount, "yearSizeRange", yearSizeRange, "valuationRange", valuationRange, "yearValuation", yearValuation, "valuationSize", valuationSize, "yearSizeMin", yearSizeMin, "valuationMin", valuationMin, "yearInfo", JSON.stringify(yearInfo)); 

        var units = [];

        var yearObject = CreatePrefab({
            prefab: 'Prefabs/Ball',
            component: 'Tracker',
            obj: {
                year: year,
                yearIndex: yearIndex,
                yearInfo: yearInfo,
                units: units
            },
            update: {
                "dragTracking": true,
                "transform/localPosition": {x: x, y: y, z: z},
                "transform/localScale": tinyScale,
                "component:MeshRenderer/materials": [playerData.material],
                "component:Collider/sharedMaterial": playerData.physicMaterial,
                "component:Collider/radius": playerData.colliderRadius,
                "component:Rigidbody/isKinematic": playerData.isYearKinematic,
                "component:Rigidbody/useGravity": playerData.useGravity,
                "component:Rigidbody/mass": playerData.mass,
                "component:Rigidbody/drag": playerData.drag,
                "component:Rigidbody/angularDrag": playerData.angularDrag
            },
            postEvents: [
                {
                    event: 'Animate',
                    data: [
                        {
                            command: 'scale',
                            to: {x: valuationSize, y: valuationSize, z: valuationSize},
                            time: playerData.animateTime
                        }
                    ]
                }
            ]

        });

        var label = CreatePrefab({
            prefab: "Prefabs/ProText",
            update: {
                'textMesh/text': "" + year,
                'textMesh/fontSize': playerData.yearLabelFontSize,
                trackPosition: 'Transform',
                'transformPosition!': 'object:' + yearObject.id + '/transform',
                extraOffset: { y: valuationSize + playerData.labelHeightExtra },
                trackRotation: 'CameraRotation'
            }
        });

        globals.players.push(yearObject);

        var unitsMax = yearInfo.unitsMax;
        var unitsSum = yearInfo.unitsSum;
        var marketsMax = yearInfo.marketsMax;
        var marketsSum = yearInfo.marketsSum;

        var yearUnit;
        var unitIndex;
        var nonZeroUnitCount = 0;
        for (unitIndex = 0; unitIndex < unitCount; unitIndex++) {
            yearUnit = yearInfo.units[unitIndex];
            if (yearUnit != 0) {
                nonZeroUnitCount++;
            }
        }

        console.log("nonZeroUnitCount", nonZeroUnitCount);

        var parentStack = [
            [yearObject, -1]
        ];

        var nonZeroUnitIndex = 0;
        for (unitIndex = 0; unitIndex < unitCount; unitIndex++) {

            yearUnit = yearInfo.units[unitIndex];
            if (yearUnit == 0) {
                continue;
            }

            var unitLabel = unitLabels[unitIndex];

            var unitIndent = 0;
            for (var indent = 0, n = unitLabel.length; indent < n; indent++) {
                if (unitLabel[indent] != ' ') {
                    break;
                }
            }

            while (indent <= parentStack[parentStack.length - 1][1]) {
                parentStack.pop();
            }

            var parentObject = parentStack[parentStack.length - 1][0];

            var ang = nonZeroUnitIndex * (2.0 * Math.PI / nonZeroUnitCount);
            nonZeroUnitIndex++;

            var unitSize =
                unitSizeMin +
                (unitSizeRange *
                 (yearUnit / unitsMax));

            var unitDistance = unitSize + playerData.unitRadiusExtra;
            var unitX = x + Math.cos(ang) * unitDistance;
            var unitY = y + Math.sin(ang) * unitDistance;
            var unitZ = z;

            var unitModelString = amazon.unitModels[unitIndex % amazon.unitModels.length];
            var unitModelList = unitModelString.split(',');
            for (var i = 0, n = unitModelList.length; i < n; i++) {
                var unitModel = unitModelList[i].trim();
                unitModelList[i] = unitModel;
                var modelIndex = amazon.models.indexOf(unitModel);
                if (modelIndex == -1) {
                    modelIndex = 0;
                    console.log("private.js: can't find modelIndex for bowIndex: " + bowIndex + " unitModel: " + unitModel + " models: " + JSON.stringify(amazon.models));
                }
                var paletteIndex = modelIndex % palette.length;
                var pal = palette[paletteIndex];

            }

            var unitObject = CreatePrefab({
                prefab: 'Prefabs/Ball',
                component: 'Tracker',
                obj: {
                    year: year,
                    yearIndex: yearIndex,
                    yearInfo: yearInfo
                },
                update: {
                    "dragTracking": true,
                    "transform/localPosition": {x: unitX, y: unitY, z: unitZ},
                    "transform/localScale": tinyScale,
                    "component:MeshRenderer/materials": [playerData.material],
                    "component:MeshRenderer/material/color": { r: pal.color.r, g: pal.color.g, b: pal.color.b },
                    "component:Collider/sharedMaterial": playerData.physicMaterial,
                    "component:Collider/radius": playerData.colliderRadius,
                    "component:Rigidbody/isKinematic": playerData.isUnitKinematic,
                    "component:Rigidbody/useGravity": playerData.useGravity,
                    "component:Rigidbody/mass": playerData.mass,
                    "component:Rigidbody/drag": playerData.drag,
                    "component:Rigidbody/angularDrag": playerData.angularDrag,
                    "component:SpringJoint/spring": playerData.unitSpring,
                    "component:SpringJoint/autoUpdateureConnectedAnchor": false,
                    "component:SpringJoint/enableCollision": true,
                    "component:SpringJoint/connectedBody!": "object:" + parentObject.id + "/component:Rigidbody"
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
                ]

            });

            units.push(unitObject);
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

        x += yearSpacing;

        var verbSubjects = yearInfo.verbSubjects;
        var bowCount = verbSubjects.length;

        if (bowCount > 0) {

            var rainbowWidth = bowCount;
            var rainbowHeight = playerData.rainbowHeight;
            var rainbowHeightStep = playerData.rainbowHeightStep;

            var rainbowObject =
                CreatePrefab({
                    prefab: 'Prefabs/Rainbow',
                    obj: {
                        bows: []
                    },
                    update: {
                        'fromTransform!': 'object:' + lastYearObject.id + '/transform',
                        'toTransform!': 'object:' + yearObject.id + '/transform',
                        bowHeight: playerData.bowHeight,
                        fromWidth: rainbowWidth,
                        toWidth: rainbowWidth,
                        fromRotation: 90,
                        toRotation: -90,
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

        lastYearObject = yearObject;

    }

}


////////////////////////////////////////////////////////////////////////
