/*
 * game.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Error Handler


function StackTrace()
{ 
    function st2(f)
    {
        if (!f) return [];
        return st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + f.arguments.join(',') + ')']);
    }
    return st2(arguments.callee.caller);
}


window.onerror = function(message, source, line, column, error) {
    window.onerror = null;
    //var stackTrace = '\n' + StackTrace().join('\n');
    var stackTrace = '[TODO]';
    console.log("!!!!!!!!!!!!!!!! WINDOW.ONERROR", "MESSAGE", message, "LINE", line, "COLUMN", column, "SOURCE", source, "STACKTRACE", stackTrace);
};


////////////////////////////////////////////////////////////////////////
// Globals


globals.useApp = false;

globals.appURL = 'https://script.google.com/macros/s/AKfycbx6yinuIWLYE21Sd7UuEDxiJE3443gZutmhBhXVNo8Kk8lwAMc/exec';

globals.spreadsheetID = '1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w';

globals.sheetRefs = {
    world:          [globals.spreadsheetID, '0'],
    templates:      [globals.spreadsheetID, '1535357011'],
    texturePaths:   [globals.spreadsheetID, '580619937'],
    materialPaths:  [globals.spreadsheetID, '1288543752'],
    prefabMap:      [globals.spreadsheetID, '1469835123'],
    tiles:          [globals.spreadsheetID, '1579247368'],
    rainbows:       [globals.spreadsheetID, '164091207'],
    bows_rgbymc:    [globals.spreadsheetID, '1544589805'],
    bows_red:       [globals.spreadsheetID, '1854560943'],
    bows_green:     [globals.spreadsheetID, '1454515772'],
    bows_blue:      [globals.spreadsheetID, '1466670725'],
    bows_yellow:    [globals.spreadsheetID, '1541060846'],
    bows_magenta:   [globals.spreadsheetID, '1996689157'],
    bows_cyan:      [globals.spreadsheetID, '724646415'],
    bows_arrow:     [globals.spreadsheetID, '568829119'],
    bows_cobra:     [globals.spreadsheetID, '335200639'],
    blobs:          [globals.spreadsheetID, '412054745'],
    jsonsters:      [globals.spreadsheetID, '131799685'],
    players:        [globals.spreadsheetID, '1362487343'],
    amazon:         [globals.spreadsheetID, '886538810'],
    amazon_1996:    [globals.spreadsheetID, '194146645'],
    amazon_2003:    [globals.spreadsheetID, '1209709015'],
    amazon_2010:    [globals.spreadsheetID, '620156431'],
    amazon_2017:    [globals.spreadsheetID, '1020307093']
};

globals.worldSheetName = 'world';
globals.sheets = {};
globals.ranges = {};


////////////////////////////////////////////////////////////////////////


function CreateObjects()
{
    CreateKeyboardTracker();
    CreatePieTracker();
    LoadObjects();
}


function TrackKeyEvent(results)
{
    console.log("game.js: TrackKeyEvent: results: " + JSON.stringify(results));

    switch (results.keyCode) {

        case 'R':
            if ((results.type == "keyDown") && 
                (results.modifiers == "Control")) {

                console.log("game.js: TrackInputString: Ctrl-R: Reloading world...");
                ClearWorld();
                LoadObjects();

            }
            break;

    }

}


function ClearWorld()
{
    var world = globals.world;

    for (var objectID in globals.objects) {

        var obj = globals.objects[objectID];

        if (obj.doNotDelete) {
            continue;
        }

        DestroyObject(obj);
    }

    globals.sheets = {};
    globals.ranges = {};
}


function LoadObjects()
{
    var startTime = new Date();

    function LoadedSheetsSuccess(data)
    {
        var endTime = new Date();
        var duration = endTime - startTime;

        console.log("game.js: LoadObjects: LoadSheetsSuccess: duration: " + duration);

        globals.spreadsheetName = data.name;
        globals.sheets = data.sheets;
        globals.sheetNames = data.sheetNames;
        globals.ranges = data.ranges;
        globals.rangesNames = data.rangesNames;

        //console.log("sheets", globals.sheets);

        if (!globals.sheets[globals.worldSheetName]) {
            console.log("game.js: LoadObjects: Finished loading sheets, but world was not loaded!");
            return;
        }

        var scope = SheetToScope(globals.sheets, globals.ranges, globals.worldSheetName);
        globals.scope = scope;

        var error = scope.error;
        var world = scope.value;

        if (error) {
            console.log("game.js: LoadObjects: LoadSheetsSuccess: Error loading world. Error in sheetName:", scope.errorScope.errorSheetName, "row:", scope.errorScope.errorRow, "column:", scope.errorScope.errorColumn, "error:", error, "errorScope:", scope.errorScope);
        } else if (!world) {
            console.log("game.js: LoadObjects: LoadSheetsSuccess: Loaded world but it was null.", "scope:", scope);
        } else {
            globals.world = world;
            console.log("game.js: LoadObjects: LoadSheetsSuccess: Loaded world:", world, "scope:", scope);
            CreateLoadedObjects();
        }

    }

    function LoadedSheetsError()
    {
        console.log("game.js: LoadObjects: LoadedSheetsError: Error loading sheets!");
    }

    if (globals.useApp) {
        LoadSheetsFromApp(globals.appURL, LoadedSheetsSuccess, LoadedSheetsError);
    } else {
        LoadSheets(globals.sheetRefs, LoadedSheetsSuccess, LoadedSheetsError);
    }
}


function CreateLoadedObjects()
{
    console.log("game.js: CreateLoadedObjects");

    CreateTemplatedObjects();
    CreateMap();
    CreateBlobs();
    CreateJsonsters();
    CreatePlayers();
    CreateTests();
}


function CreateTemplatedObjects()
{
    var world = globals.world;

    if (!world.createTemplatedObjects) {
        return;
    }

    var templatedObjectNames = world.templatedObjectNames;
    var templates = world.templates;

    for (var nameIndex = 0, nameCount = templatedObjectNames.length; 
         nameIndex < nameCount; 
         nameIndex++) {

        var name = templatedObjectNames[nameIndex];
        var template = templates[name];
        console.log("game.js: CreateTemplatedObjects:", name, template, "nameIndex", nameIndex, "nameCount", nameCount);

        globals[name] = CreatePrefab(template);
    }
}


function CreateMap()
{
    var world = globals.world;

    if (!world.createMap) {
        return;
    }

    var tiles = world.tiles;
    var hexes = world.prefabMap.hexes;
    var vegetation = world.prefabMap.vegetation;
    var rows = [];
    //var component = 'Tracker';
    var component = 'HexTile';

    world.rows = rows;

    var tileDX = tiles.tileDX + tiles.tileGapDX;
    var tileDY = tiles.tileDY + tiles.tileGapDY;

    var dx = tiles.tileColumns * tileDX * -0.5;
    var dy = tiles.tileRows * tileDY * -0.5;

    for (var y = 0; y < tiles.tileRows; y++) {
        var tileY =
            tiles.tileY + dy +
            (y * tileDY);
        var row = [];
        rows.push(row);

        for (var x = 0; x < tiles.tileColumns; x++) {

            (function (x, y, tileY) {

                var tileX =
                    tiles.tileX + dx +
                    ((y & 1) ? (tileDX * 0.5) : 0) +
                    (x * tileDX);

                var tileHeight = 14;

                var height =
                    Math.max(1, tiles.tileHeight[y][x]);

                var lift = 1;
                var tileZScale = 
                    height / tileHeight;
                var tileZ = 
                    height + lift;

                var prefabName =
                    hexes.dir + 
                    tiles.tileName[y][x];

                var materialName =
                    tiles.tileMaterial[y][x];

                var prefabs = [];

                var tilePrefab =
                    CreatePrefab({
                        prefab: prefabName, 
                        component: component,
                        obj: {
                            x: x,
                            y: y,
                            tileX: tileX,
                            tileY: tileY
                        }, 
                        config: {
                            "transform/localPosition": {x: tileX, y: tileZ, z: tileY},
                            "transform/localScale": {x: 0.01, y: 0.01, z: 0.01},
                            "transform/localRotation": {yaw: 90},
                            "component:Rigidbody/drag": 0.8,
                            "component:Rigidbody/mass": 10.0,
                            "component:Rigidbody/angularDrag": 0.5,
                            "component:Rigidbody/collisionDetectionMode": "ContinuousDynamic",
                            "component:Collider/sharedMaterial": "PhysicMaterials/HighFrictionLowBounce",
                            "component:MeshRenderer/materials": [materialName, materialName, materialName],
                            "dragTracking": true
                        }, 
                        interests: {
                            MouseDown: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    console.log("MouseDown on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                    if (obj.onMouseDown) obj.onMouseDown(obj, result);
                                }
                            },
                            DragStart: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragStart on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                    if (obj.onDragStart) obj.onDragStart(obj, result);
                                }
                            },
                            DragMove: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragMove on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                    if (obj.onDragMove) obj.onDragMove(obj, result);
                                }
                            },
                            DragEnd: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragEnd on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                    if (obj.onDragEnd) obj.onDragEnd(obj, result);
                                }
                            }
                        },
                        postEvents: [
                            {
                                event: 'Animate',
                                data: [
                                    {
                                        command: 'scale',
                                        to: {x: 1, y: tileZScale, z: 1},
                                        time: 1
                                    }
                                ]
                            }
                        ]
                    });

                prefabs.push(tilePrefab);

                if (world.makeVegetation) {

                    var vegPrefabName =
                        vegetation.dir +
                        tiles.tileVegetation[y][x];

                    var vegPrefab =
                        CreatePrefab({
                            prefab: vegPrefabName, 
                            obj: {
                                x: x,
                                y: y,
                                tileX: tileX,
                                tileY: tileY
                            }, 
                            config: {
                                "transform/localPosition": {x: tileX, y: tileZ, z: tileY}
                            }, 
                            interests: {
                                MouseDown: {
                                    query: {
                                        position: "transform/localPosition"
                                    },
                                    handler: function(obj, result) {
                                        console.log("MouseDown on Veg", obj.x, obj.y, result.position, obj.prefabName);
                                    }
                                }
                            },
                            postEvents: [
                                {
                                    event: 'SetParent',
                                    data: {
                                        'path': 'object:' + tilePrefab.id
                                    }
                                }
                            ]

                        });

                    prefabs.push(vegPrefab);

                }

                row.push(prefabs);

            })(x, y, tileY);

        }

    }

    if (world.createRainbow) {

        var fromTile = rows[0][0][0];
        var toTile = rows[tiles.tileRows - 1][tiles.tileColumns - 1][0];

        var rb = CreateRainbow(tiles.rainbowType, fromTile, toTile);
        
        fromTile.onMouseDown = function(obj, result) {

            console.log("Rainbow Tile Mouse Down", obj, result);

            QueryObject(rb.bows[0], {
                    positions: 'component:LineRenderer/method:GetLinePositions'
                }, function(result) {
                    var positions = result.positions;
                    console.log("POSITIONS", JSON.stringify(positions));

                    var label = CreatePrefab({
                        prefab: "Prefabs/ProText",
                        config: {
                            'transform/position': positions[0],
                            'textMesh/text': 'WEEEE!!!',
                            'textMesh/fontSize': 50,
                            trackPosition: 'Passive',
                            trackRotation: 'CameraRotation'
                        },
                        postEvents: [
                            {
                                event: 'Animate',
                                data: [
                                    {
                                        command: 'moveSpline',
                                        time: 3,
                                        'path': positions
                                    }
                                ]
                            }
                        ]
                    });

                });

        };

    }

}


function CreateBlobs()
{
    var world = globals.world;

    if (!world.createBlobs) {
        return;
    }

    var id = 0;
    var blobs = world.blobs;
    var blobData = blobs.blobData;
    var bloopData = blobs.bloopData;
    var bleepData = blobs.bleepData;
    var tinyScale = { x: 0.01, y: 0.01, z: 0.01 };
    var label;
    var t;

    var blob = CreatePrefab({
        prefab: 'Prefabs/Bubble',
        component: 'Tracker',
        obj: { // obj
            bloops: []
        },
        config: { // config 
            "dragTracking": true,
            "transform/localPosition": blobData.position,
            "transform/localScale": tinyScale,
            "transform:Ball/transform:A/component:MeshRenderer/materials": [blobData.material],
            "transform:Ball/transform:A/component:Collider/sharedMaterial": blobData.physicMaterial,
            "transform:Ball/transform:A/component:Collider/radius": blobData.colliderRadius,
            "transform:Ball/transform:A/transform/localPosition": {y: -blobData.ballSpread + blobData.ballOffset},
            "transform:Ball/transform:A/transform/localScale": {x: blobData.ballAScale, y: blobData.ballAScale, z: blobData.ballAScale},
            "transform:Ball/transform:B/component:MeshRenderer/materials": [blobData.material],
            "transform:Ball/transform:B/component:Collider/sharedMaterial": blobData.physicMaterial,
            "transform:Ball/transform:B/component:Collider/radius": blobData.colliderRadius,
            "transform:Ball/transform:B/transform/localPosition": {y: blobData.ballSpread + blobData.ballOffset},
            "transform:Ball/transform:B/transform/localScale": {x: blobData.ballBScale, y: blobData.ballBScale, z: blobData.ballBScale},
            "component:Rigidbody/isKinematic": blobData.isKinematic,
            "component:Rigidbody/useGravity": blobData.useGravity,
            "component:Rigidbody/mass": blobData.mass,
            "component:Rigidbody/drag": blobData.drag,
            "component:Rigidbody/angularDrag": blobData.angularDrag
        },
        postEvents: [
            {
                event: 'Animate',
                data: [
                    {
                        command: 'scale',
                        to: {x: blobData.size, y: blobData.size, z: blobData.size},
                        time: blobData.animateTime
                    }
                ]
            }
        ]

    });

    globals.blob = blob;

    label = null; t = null;

    if (blobData.createProText) {
        label = CreatePrefab({
            prefab: "Prefabs/ProText",
            config: {
                'textMesh/text': 'Blob',
                'textMesh/fontSize': blobData.proTextFontSize,
                'component:RectTransform/sizeDelta': {x: 100, y: 50},
                trackPosition: 'Transform',
                'transformPosition!': 'object:' + blob.id + '/transform',
                extraOffset: { y: blobData.size * 1.2 },
                trackRotation: 'CameraRotation'
            }
        });
    }

    if (blobData.createOverlayText) {
        t = CreateOverlayText({
            "trackPosition": "Transform",
            "transformPosition!": "object:" + blob.id + "/transform",
            "textMesh/text": "blob " + id++,
            "textMesh/fontSize": blobData.overlayTextFontSize,
            "textMesh/color": { r: 1, g: 0.5, b: 0.5 },
            "component:RectTransform/sizeDelta": { 
                x: 100,
                y: 50
            }
        });
    }

    var lastBloopParent = blob;

    for (var bloopIndex = 0; bloopIndex < bloopData.count; bloopIndex++) {

        var ang = bloopIndex * (2.0 * Math.PI / bloopData.count);
        var deptX = blobData.position.x + Math.cos(ang) * bloopData.distance;
        var deptY = blobData.position.y;
        var deptZ = blobData.position.z + Math.sin(ang) * bloopData.distance;
        var bloop = CreatePrefab({
            prefab: 'Prefabs/Bubble', 
            component: 'Tracker',
            obj: { // obj
                //blob: blob,
                index: bloopIndex,
                bleeps: []
            },
            config: { // config 
                "dragTracking": true,
                "transform/localPosition": {x: deptX, y: deptY, z: deptZ},
                "transform/localScale": tinyScale,
                "transform:Ball/transform:A/component:MeshRenderer/materials": [bloopData.material],
                "transform:Ball/transform:A/component:Collider/sharedMaterial": bloopData.physicMaterial,
                "transform:Ball/transform:A/component:Collider/radius": bloopData.colliderRadius,
                "transform:Ball/transform:A/transform/localPosition": {y: -bloopData.ballSpread + bloopData.ballOffset},
                "transform:Ball/transform:A/transform/localScale": {x: bloopData.ballAScale, y: bloopData.ballAScale, z: bloopData.ballAScale},
                "transform:Ball/transform:B/component:MeshRenderer/materials": [bloopData.material],
                "transform:Ball/transform:B/component:Collider/sharedMaterial": bloopData.physicMaterial,
                "transform:Ball/transform:B/component:Collider/radius": bloopData.colliderRadius,
                "transform:Ball/transform:B/transform/localPosition": {y: bloopData.ballSpread + bloopData.ballOffset},
                "transform:Ball/transform:B/transform/localScale": {x: bloopData.ballBScale, y: bloopData.ballBScale, z: bloopData.ballBScale},
                "component:Rigidbody/isKinematic": bloopData.isKinematic,
                "component:Rigidbody/useGravity": bloopData.useGravity,
                "component:Rigidbody/mass": bloopData.mass,
                "component:Rigidbody/drag": bloopData.drag,
                "component:Rigidbody/angularDrag": bloopData.angularDrag,
                "component:SpringJoint/spring": bloopData.spring,
                "component:SpringJoint/autoConfigureConnectedAnchor": false,
                "component:SpringJoint/enableCollision": true,
                "component:SpringJoint/connectedBody!": "object:" + lastBloopParent.id + "/component:Rigidbody"
            },
            postEvents: [
                {
                    event: 'Animate',
                    data: [
                        {
                            command: 'scale',
                            to: {x: bloopData.size, y: bloopData.size, z: bloopData.size},
                            time: bloopData.animateTime
                        }
                    ]
                }
            ]

        });

        blob.bloops.push(bloop);

        label = null; t = null;

        if (bloopData.createProText) {
            label = CreatePrefab({
                prefab: "Prefabs/ProText",
                config: {
                    'textMesh/text': 'Bloop',
                    'textMesh/fontSize': bloopData.proTextFontSize,
                    'component:RectTransform/sizeDelta': {x: 100, y: 50},
                    trackPosition: 'Transform',
                    'transformPosition!': 'object:' + bloop.id + '/transform',
                    extraOffset: { y: bloopData.size * 1.2 },
                    trackRotation: 'CameraRotation'
                }
            });
        }

        if (bloopData.createOverlayText) {
            t = CreateOverlayText({
                "trackPosition": "Transform",
                "transformPosition!": "object:" + bloop.id + "/transform",
                "textMesh/text": "bloop " + id++,
                "textMesh/fontSize": bloopData.overlayTextFontSize,
                "textMesh/color": { r: 0.5, g: 1, b: 0.5 },
                "component:RectTransform/sizeDelta": { 
                    x: 100,
                    y: 50
                }
            });
        }

        if (bloopData.createRainbow) {
            var r = CreateRainbow(bloopData.rainbowType, lastBloopParent, label || bloop);
        }

        if (bloopData.linear) {
            lastBloopParent = bloop;
        }

        var color = {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
            a: 0.5
        };

        var lastBleepParent = bloop;

        for (var bleepIndex = 0; bleepIndex < bleepData.count; bleepIndex++) {

            var ang2 = bleepIndex * (2.0 * Math.PI / bleepData.count);
            var offX = deptX + Math.cos(ang2) * bleepData.distance;
            var offY = deptY;
            var offZ = deptZ + Math.sin(ang2) * bleepData.distance;
            var bleep = CreatePrefab({
                prefab: 'Prefabs/Bubble', 
                component: 'Tracker',
                obj: { // obj
                    //bloop: bloop,
                    index: bleepIndex
                },
                config: { // config 
                    "dragTracking": true,
                    "transform/localPosition": {x: offX, y: offY, z: offZ},
                    "transform/localScale": tinyScale,
                    "transform:Ball/transform:A/component:MeshRenderer/materials": [bleepData.material],
                    "transform:Ball/transform:A/component:MeshRenderer/material/color": color,
                    "transform:Ball/transform:A/component:Collider/sharedMaterial": bleepData.physicMaterial,
                    "transform:Ball/transform:A/component:Collider/radius": bleepData.colliderRadius,
                    "transform:Ball/transform:A/transform/localPosition": {y: -bleepData.ballSpread + bleepData.ballOffset},
                    "transform:Ball/transform:A/transform/localScale": {x: bleepData.ballAScale, y: bleepData.ballAScale, z: bleepData.ballAScale},
                    "transform:Ball/transform:B/component:MeshRenderer/materials": [bleepData.material],
                    "transform:Ball/transform:B/component:MeshRenderer/material/color": color,
                    "transform:Ball/transform:B/component:Collider/sharedMaterial": bleepData.physicMaterial,
                    "transform:Ball/transform:B/component:Collider/radius": bleepData.colliderRadius,
                    "transform:Ball/transform:B/transform/localPosition": {y: bleepData.ballSpread + bleepData.ballOffset},
                    "transform:Ball/transform:B/transform/localScale": {x: bleepData.ballBScale, y: bleepData.ballBScale, z: bleepData.ballBScale},
                    "component:Rigidbody/isKinematic": bleepData.isKinematic,
                    "component:Rigidbody/useGravity": bleepData.useGravity,
                    "component:Rigidbody/mass": bleepData.mass,
                    "component:Rigidbody/drag": bleepData.drag,
                    "component:Rigidbody/angularDrag": bleepData.angularDrag,
                    "component:SpringJoint/spring": bleepData.spring,
                    "component:SpringJoint/autoConfigureConnectedAnchor": false,
                    "component:SpringJoint/enableCollision": true,
                    "component:SpringJoint/connectedBody!": "object:" + lastBleepParent.id + "/component:Rigidbody"
                },
                postEvents: [
                    {
                        event: 'Animate',
                        data: [
                            {
                                command: 'scale',
                                to: {x: bleepData.size, y: bleepData.size, z: bleepData.size},
                                time: bleepData.animateTime
                            }
                        ]
                    }
                ]

            });

            bloop.bleeps.push(bleep);

            label = null; t = null;

            if (bleepData.createProText) {
                label = CreatePrefab({
                    prefab: "Prefabs/ProText",
                    config: {
                        'textMesh/text': 'Bleep',
                        'textMesh/fontSize': bleepData.proTextFontSize,
                        'component:RectTransform/sizeDelta': {x: 100, y: 50},
                        trackPosition: 'Transform',
                        'transformPosition!': 'object:' + bleep.id + '/transform',
                        extraOffset: { y: bleepData.size * 1.2 },
                        trackRotation: 'CameraRotation'
                    }
                });
            }

            if (bleepData.createOverlayText) {
                t = CreateOverlayText({
                    "trackPosition": "Transform",
                    "transformPosition!": "object:" + bleep.id + "/transform",
                    "textMesh/text": "bleep " + id++,
                    "textMesh/fontSize": bleepData.overlayTextFontSize,
                    "textMesh/color": { r: 0.5, g: 0.5, b: 1 },
                    "component:RectTransform/sizeDelta": { 
                        x: 100,
                        y: 50
                    }
                });
            }

            if (bleepData.createRainbow) {
                var r = CreateRainbow(bleepData.rainbowType, lastBleepParent, label || bleep);
            }

            if (bleepData.linear) {
                lastBleepParent = bleep;
            }
        }


    }

}


function CreateJsonsters()
{
    var world = globals.world;

    if (!world.createJsonsters) {
        return;
    }
/*
    var id = 0;
    var blobs = world.blobs;
    var blobData = blobs.blobData;
    var bloopData = blobs.bloopData;
    var bleepData = blobs.bleepData;
    var tinyScale = { x: 0.01, y: 0.01, z: 0.01 };
    var label;
    var t;

    var blob = CreatePrefab({
        prefab: 'Prefabs/Bubble',
        component: 'Tracker',
        obj: { // obj
            bloops: []
        },
        config: { // config 
            "dragTracking": true,
            "transform/localPosition": blobData.position,
            "transform/localScale": tinyScale,
            "transform:Ball/transform:A/component:MeshRenderer/materials": [blobData.material],
            "transform:Ball/transform:A/component:Collider/sharedMaterial": blobData.physicMaterial,
            "transform:Ball/transform:A/component:Collider/radius": blobData.colliderRadius,
            "transform:Ball/transform:A/transform/localPosition": {y: -blobData.ballSpread + blobData.ballOffset},
            "transform:Ball/transform:A/transform/localScale": {x: blobData.ballAScale, y: blobData.ballAScale, z: blobData.ballAScale},
            "transform:Ball/transform:B/component:MeshRenderer/materials": [blobData.material],
            "transform:Ball/transform:B/component:Collider/sharedMaterial": blobData.physicMaterial,
            "transform:Ball/transform:B/component:Collider/radius": blobData.colliderRadius,
            "transform:Ball/transform:B/transform/localPosition": {y: blobData.ballSpread + blobData.ballOffset},
            "transform:Ball/transform:B/transform/localScale": {x: blobData.ballBScale, y: blobData.ballBScale, z: blobData.ballBScale},
            "component:Rigidbody/isKinematic": blobData.isKinematic,
            "component:Rigidbody/useGravity": blobData.useGravity,
            "component:Rigidbody/mass": blobData.mass,
            "component:Rigidbody/drag": blobData.drag,
            "component:Rigidbody/angularDrag": blobData.angularDrag
        },
        postEvents: [
            {
                event: 'Animate',
                data: [
                    {
                        command: 'scale',
                        to: {x: blobData.size, y: blobData.size, z: blobData.size},
                        time: blobData.animateTime
                    }
                ]
            }
        ]

    });

    globals.blob = blob;

    label = null; t = null;

    if (blobData.createProText) {
        label = CreatePrefab({
            prefab: "Prefabs/ProText",
            config: {
                'textMesh/text': 'Blob',
                'textMesh/fontSize': blobData.proTextFontSize,
                'component:RectTransform/sizeDelta': {x: 100, y: 50},
                trackPosition: 'Transform',
                'transformPosition!': 'object:' + blob.id + '/transform',
                extraOffset: { y: blobData.size * 1.2 },
                trackRotation: 'CameraRotation'
            }
        });
    }

    if (blobData.createOverlayText) {
        t = CreateOverlayText({
            "trackPosition": "Transform",
            "transformPosition!": "object:" + blob.id + "/transform",
            "textMesh/text": "blob " + id++,
            "textMesh/fontSize": blobData.overlayTextFontSize,
            "textMesh/color": { r: 1, g: 0.5, b: 0.5 },
            "component:RectTransform/sizeDelta": { 
                x: 100,
                y: 50
            }
        });
    }

    var lastBloopParent = blob;

    for (var bloopIndex = 0; bloopIndex < bloopData.count; bloopIndex++) {

        var ang = bloopIndex * (2.0 * Math.PI / bloopData.count);
        var deptX = blobData.position.x + Math.cos(ang) * bloopData.distance;
        var deptY = blobData.position.y;
        var deptZ = blobData.position.z + Math.sin(ang) * bloopData.distance;
        var bloop = CreatePrefab({
            prefab: 'Prefabs/Bubble', 
            component: 'Tracker',
            obj: { // obj
                //blob: blob,
                index: bloopIndex,
                bleeps: []
            },
            config: { // config 
                "dragTracking": true,
                "transform/localPosition": {x: deptX, y: deptY, z: deptZ},
                "transform/localScale": tinyScale,
                "transform:Ball/transform:A/component:MeshRenderer/materials": [bloopData.material],
                "transform:Ball/transform:A/component:Collider/sharedMaterial": bloopData.physicMaterial,
                "transform:Ball/transform:A/component:Collider/radius": bloopData.colliderRadius,
                "transform:Ball/transform:A/transform/localPosition": {y: -bloopData.ballSpread + bloopData.ballOffset},
                "transform:Ball/transform:A/transform/localScale": {x: bloopData.ballAScale, y: bloopData.ballAScale, z: bloopData.ballAScale},
                "transform:Ball/transform:B/component:MeshRenderer/materials": [bloopData.material],
                "transform:Ball/transform:B/component:Collider/sharedMaterial": bloopData.physicMaterial,
                "transform:Ball/transform:B/component:Collider/radius": bloopData.colliderRadius,
                "transform:Ball/transform:B/transform/localPosition": {y: bloopData.ballSpread + bloopData.ballOffset},
                "transform:Ball/transform:B/transform/localScale": {x: bloopData.ballBScale, y: bloopData.ballBScale, z: bloopData.ballBScale},
                "component:Rigidbody/isKinematic": bloopData.isKinematic,
                "component:Rigidbody/useGravity": bloopData.useGravity,
                "component:Rigidbody/mass": bloopData.mass,
                "component:Rigidbody/drag": bloopData.drag,
                "component:Rigidbody/angularDrag": bloopData.angularDrag,
                "component:SpringJoint/spring": bloopData.spring,
                "component:SpringJoint/autoConfigureConnectedAnchor": false,
                "component:SpringJoint/enableCollision": true,
                "component:SpringJoint/connectedBody!": "object:" + lastBloopParent.id + "/component:Rigidbody"
            },
            postEvents: [
                {
                    event: 'Animate',
                    data: [
                        {
                            command: 'scale',
                            to: {x: bloopData.size, y: bloopData.size, z: bloopData.size},
                            time: bloopData.animateTime
                        }
                    ]
                }
            ]

        });

        blob.bloops.push(bloop);

        label = null; t = null;

        if (bloopData.createProText) {
            label = CreatePrefab({
                prefab: "Prefabs/ProText",
                config: {
                    'textMesh/text': 'Bloop',
                    'textMesh/fontSize': bloopData.proTextFontSize,
                    'component:RectTransform/sizeDelta': {x: 100, y: 50},
                    trackPosition: 'Transform',
                    'transformPosition!': 'object:' + bloop.id + '/transform',
                    extraOffset: { y: bloopData.size * 1.2 },
                    trackRotation: 'CameraRotation'
                }
            });
        }

        if (bloopData.createOverlayText) {
            t = CreateOverlayText({
                "trackPosition": "Transform",
                "transformPosition!": "object:" + bloop.id + "/transform",
                "textMesh/text": "bloop " + id++,
                "textMesh/fontSize": bloopData.overlayTextFontSize,
                "textMesh/color": { r: 0.5, g: 1, b: 0.5 },
                "component:RectTransform/sizeDelta": { 
                    x: 100,
                    y: 50
                }
            });
        }

        if (bloopData.createRainbow) {
            var r = CreateRainbow(bloopData.rainbowType, lastBloopParent, label || bloop);
        }

        if (bloopData.linear) {
            lastBloopParent = bloop;
        }

        var color = {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
            a: 0.5
        };

        var lastBleepParent = bloop;

        for (var bleepIndex = 0; bleepIndex < bleepData.count; bleepIndex++) {

            var ang2 = bleepIndex * (2.0 * Math.PI / bleepData.count);
            var offX = deptX + Math.cos(ang2) * bleepData.distance;
            var offY = deptY;
            var offZ = deptZ + Math.sin(ang2) * bleepData.distance;
            var bleep = CreatePrefab({
                prefab: 'Prefabs/Bubble', 
                component: 'Tracker',
                obj: { // obj
                    //bloop: bloop,
                    index: bleepIndex
                },
                config: { // config 
                    "dragTracking": true,
                    "transform/localPosition": {x: offX, y: offY, z: offZ},
                    "transform/localScale": tinyScale,
                    "transform:Ball/transform:A/component:MeshRenderer/materials": [bleepData.material],
                    "transform:Ball/transform:A/component:MeshRenderer/material/color": color,
                    "transform:Ball/transform:A/component:Collider/sharedMaterial": bleepData.physicMaterial,
                    "transform:Ball/transform:A/component:Collider/radius": bleepData.colliderRadius,
                    "transform:Ball/transform:A/transform/localPosition": {y: -bleepData.ballSpread + bleepData.ballOffset},
                    "transform:Ball/transform:A/transform/localScale": {x: bleepData.ballAScale, y: bleepData.ballAScale, z: bleepData.ballAScale},
                    "transform:Ball/transform:B/component:MeshRenderer/materials": [bleepData.material],
                    "transform:Ball/transform:B/component:MeshRenderer/material/color": color,
                    "transform:Ball/transform:B/component:Collider/sharedMaterial": bleepData.physicMaterial,
                    "transform:Ball/transform:B/component:Collider/radius": bleepData.colliderRadius,
                    "transform:Ball/transform:B/transform/localPosition": {y: bleepData.ballSpread + bleepData.ballOffset},
                    "transform:Ball/transform:B/transform/localScale": {x: bleepData.ballBScale, y: bleepData.ballBScale, z: bleepData.ballBScale},
                    "component:Rigidbody/isKinematic": bleepData.isKinematic,
                    "component:Rigidbody/useGravity": bleepData.useGravity,
                    "component:Rigidbody/mass": bleepData.mass,
                    "component:Rigidbody/drag": bleepData.drag,
                    "component:Rigidbody/angularDrag": bleepData.angularDrag,
                    "component:SpringJoint/spring": bleepData.spring,
                    "component:SpringJoint/autoConfigureConnectedAnchor": false,
                    "component:SpringJoint/enableCollision": true,
                    "component:SpringJoint/connectedBody!": "object:" + lastBleepParent.id + "/component:Rigidbody"
                },
                postEvents: [
                    {
                        event: 'Animate',
                        data: [
                            {
                                command: 'scale',
                                to: {x: bleepData.size, y: bleepData.size, z: bleepData.size},
                                time: bleepData.animateTime
                            }
                        ]
                    }
                ]

            });

            bloop.bleeps.push(bleep);

            label = null; t = null;

            if (bleepData.createProText) {
                label = CreatePrefab({
                    prefab: "Prefabs/ProText",
                    config: {
                        'textMesh/text': 'Bleep',
                        'textMesh/fontSize': bleepData.proTextFontSize,
                        'component:RectTransform/sizeDelta': {x: 100, y: 50},
                        trackPosition: 'Transform',
                        'transformPosition!': 'object:' + bleep.id + '/transform',
                        extraOffset: { y: bleepData.size * 1.2 },
                        trackRotation: 'CameraRotation'
                    }
                });
            }

            if (bleepData.createOverlayText) {
                t = CreateOverlayText({
                    "trackPosition": "Transform",
                    "transformPosition!": "object:" + bleep.id + "/transform",
                    "textMesh/text": "bleep " + id++,
                    "textMesh/fontSize": bleepData.overlayTextFontSize,
                    "textMesh/color": { r: 0.5, g: 0.5, b: 1 },
                    "component:RectTransform/sizeDelta": { 
                        x: 100,
                        y: 50
                    }
                });
            }

            if (bleepData.createRainbow) {
                var r = CreateRainbow(bleepData.rainbowType, lastBleepParent, label || bleep);
            }

            if (bleepData.linear) {
                lastBleepParent = bleep;
            }
        }


    }
*/

}


function CreatePlayers()
{
    var world = globals.world;

    if (!world.createPlayers) {
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
    var tinyScale = { x:0.01, y: 0.01, z: 0.01 };
    var x = -0.5 * yearSpacing * yearCount;
    var y = yearHeight;
    var z = 0;

    globals.players = [];

    var lastYearObject = CreatePrefab({
        config: { // config 
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

        yearObject = CreatePrefab({
            prefab: 'Prefabs/Ball',
            component: 'Tracker',
            obj: {
                year: year,
                yearIndex: yearIndex,
                yearInfo: yearInfo,
                units: units
            },
            config: { // config 
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
            config: {
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

            var unitObject = CreatePrefab({
                prefab: 'Prefabs/Ball',
                component: 'Tracker',
                obj: {
                    year: year,
                    yearIndex: yearIndex,
                    yearInfo: yearInfo
                },
                config: { // config 
                    "dragTracking": true,
                    "transform/localPosition": {x: unitX, y: unitY, z: unitZ},
                    "transform/localScale": tinyScale,
                    "component:MeshRenderer/materials": [playerData.material],
                    "component:Collider/sharedMaterial": playerData.physicMaterial,
                    "component:Collider/radius": playerData.colliderRadius,
                    "component:Rigidbody/isKinematic": playerData.isUnitKinematic,
                    "component:Rigidbody/useGravity": playerData.useGravity,
                    "component:Rigidbody/mass": playerData.mass,
                    "component:Rigidbody/drag": playerData.drag,
                    "component:Rigidbody/angularDrag": playerData.angularDrag,
                    "component:SpringJoint/spring": playerData.unitSpring,
                    "component:SpringJoint/autoConfigureConnectedAnchor": false,
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

            CreateRainbow(playerData.unitRainbowType, parentObject, unitObject);

            var label = CreatePrefab({
                prefab: "Prefabs/ProText",
                config: {
                    'textMesh/text': unitLabel.trim(),
                    'textMesh/fontSize': playerData.unitLabelFontSize,
                    trackPosition: 'Transform',
                    'transformPosition!': 'object:' + unitObject.id + '/transform',
                    extraOffset: { y: unitSize + playerData.labelHeightExtra },
                    trackRotation: 'CameraRotation'
                }
            });

        }

        x += yearSpacing;

/*
        CreateRainbow('rgbymc', lastYearObject, yearObject);
*/

        var verbSubjects = yearInfo.verbSubjects;
        var bowCount = verbSubjects.length;

        if (bowCount > 0) {

            var rainbowWidth = bowCount;

            var rainbowObject =
                CreatePrefab({
                    prefab: 'Prefabs/Rainbow',
                    obj: {
                        bows: []
                    },
                    config: {
                        'fromTransform!': 'object:' + lastYearObject.id + '/transform',
                        'toTransform!': 'object:' + yearObject.id + '/transform',
                        bowHeight: playerData.bowHeight,
                        fromWidth: rainbowWidth,
                        toWidth: rainbowWidth
                    }
                });

            var bows = rainbowObject.bows;
            for (var bowIndex = 0;
                 bowIndex < bowCount;
                 bowIndex++) {

                var bowName = verbSubjects[bowIndex];

                //console.log("bowConfig", JSON.stringify(bowConfig));

                var bowColor = {
                    r: Math.random(),
                    g: Math.random(),
                    b: Math.random()
                };

                var bowObject =
                    CreatePrefab({
                        prefab: 'Prefabs/Bow',
                        config: {
                            bowStart: 0,
                            bowEnd: 1,
                            startWidth: 1,
                            endWidth: 1,
                            textureScale: { x: 1, y: 1 },
                            "lineRenderer/material/method:UpdateMaterial": [
                                {
                                    texture_MainTex: 'Joao Paulo/Textures/Crystal_001/Crystal_001_COLOR',
                                    texture_BumpMap: 'Joao Paulo/Textures/Crystal_001/Crystal_001_NORMAL',
                                    color: { r: 1, g: 1, b: 1, a: playerData.rainbowAlpha },
                                    color_EmissionColor: bowColor
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
            }

        }

        lastYearObject = yearObject;

    }

}


function CreateTests()
{
    var world = globals.world;

    if (!world.createTests) {
        return;
    }

    function CreateText(label, position, animation) {
        return CreatePrefab({
              prefab: 'Prefabs/KineticText',
              config: {
                  dragTracking: true,
                  "transform/localPosition": position,
                  "component:RectTransform/sizeDelta": {x: 50, y: 10},
                  "component:Rigidbody/isKinematic": true,
                  "component:Rigidbody/centerOfMass": {y: -10},
                  colliderThickness: 10,
                  "textMesh/text": label,
                  "textMesh/fontSize": 50
              }
          });
    }

    var time = 10;
    var x = -100;
    var y = 0;
    var z = 0;
    var step = 30;

    var test1 = CreateText("move\nposition", {x: x, y: y, z: z});
    AnimateObject(test1, [
        {
            command: 'move',
            time: time,
            position: {x: x + 50, y: y + 100, z: z}
        }
    ]);
    x += step;

    var test2 = CreateText("move\ntransform", {x: x, y: y, z: z});
    AnimateObject(test2, [
        {
            command: 'move',
            time: time,
            transform: 'object:' + test1.id + '/transform'
        }
    ]);
    x += step;

    var test3 = CreateText("move\npath", {x: x, y: y, z: z});
    var wiggle = 20;
    var path = [
        {x: x,            y: y,       z: z},
         {x: x - wiggle,  y: y + 10,  z: z},
         {x: x - wiggle,  y: y + 20,  z: z},
        {x: x,            y: y + 30,  z: z},
        {x: x,            y: y + 30,  z: z},
         {x: x + wiggle,  y: y + 40,  z: z},
         {x: x + wiggle,  y: y + 50,  z: z},
        {x: x,            y: y + 60,  z: z}
    ];
    AnimateObject(test3, [
        {
            command: 'moveLocal',
            time: time,
            path: path
        }
    ]);
    x += step; 

    var test4 = CreateText("scale\nto", {x: x, y: y, z: z});
    AnimateObject(test4, [
        {
            command: 'scale',
            time: time,
            to: { x: 0.5, y: 2, z: 0.1 }
        }
    ]);
    x += step;

    var test5 = CreateText("rotate\nto", {x: x, y: y, z: z});
    AnimateObject(test5, [
        {
            command: 'rotate',
            time: time,
            to: { x: 0, y: 180, z: 0 }
        }
    ]);
    x += step;

    var test6 = CreateText("rotate\naround", {x: x, y: y, z: z});
    AnimateObject(test6, [
        {
            command: 'rotateAround',
            time: time,
            axis: { x: 1, y: 1, z: 0 },
            to: 360 * 10
        }
    ]);
    x += step;

}


function CreateRainbow(kind, fromTarget, toTarget)
{
    var world = globals.world;
    var rainbows = world.rainbows;
    var rainbow = rainbows[kind];

    //console.log("bowConfigs", JSON.stringify(world.bowConfigs));

    var rainbowObject =
        CreatePrefab({
            prefab: 'Prefabs/Rainbow',
            obj: {
                bows: []
            },
            config: {
                'fromTransform!': 'object:' + fromTarget.id + '/transform',
                'toTransform!': 'object:' + toTarget.id + '/transform',
                bowHeight: rainbow.bowHeight,
                fromWidth: rainbow.rainbowWidth,
                toWidth: rainbow.rainbowWidth
            }
        });

    world.rainbow = rainbow;

    var bows = rainbow.bows;
    for (var bowIndex = 0;
         bowIndex < bows.length;
         bowIndex++) {

        var bowConfig = bows[bowIndex];

        //console.log("bowConfig", JSON.stringify(bowConfig));

        var bowObject =
            CreatePrefab({
                prefab: 'Prefabs/Bow',
                config: bowConfig,
                postEvents: [
                    {
                        event: 'SetParent',
                        data: {
                            'path': 'object:' + rainbowObject.id
                        }
                    }
                ]});

        rainbowObject.bows.push(bowObject);
    }

    return rainbowObject;
}


////////////////////////////////////////////////////////////////////////
