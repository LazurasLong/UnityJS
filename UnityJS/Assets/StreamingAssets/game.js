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
    bowConfigs:     [globals.spreadsheetID, '1544589805'],
    blobs:          [globals.spreadsheetID, '412054745'],
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


function TrackInputString(inputString)
{
    //console.log("game.js: TrackInputString: inputString: " + inputString);

    switch (inputString) {

        case 'r':
            console.log("game.js: TrackInputString: r: Reloading world...");
            ClearWorld();
            LoadObjects();
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
    CreateRainbow();
    CreateBlobs();
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
                    tiles.tileHeight[y][x];

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
                        component: component, // component
                        obj: { // obj
                            x: x,
                            y: y,
                            tileX: tileX,
                            tileY: tileY
                        }, 
                        config: { // config 
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
                        interests: { // interests
                            MouseDown: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    console.log("MouseDown on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                }
                            },
                            DragStart: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragStart on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                }
                            },
                            DragMove: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragMove on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                }
                            },
                            DragEnd: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, result) {
                                    //console.log("DragEnd on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
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
                            //component: component, // component
                            obj: { // obj
                                x: x,
                                y: y,
                                tileX: tileX,
                                tileY: tileY
                            }, 
                            config: { // config 
                                "transform/localPosition": {x: tileX, y: tileZ, z: tileY}
                            }, 
                            interests: { // interests
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

}


function CreateRainbow()
{
    var world = globals.world;

    if (!world.createRainbow) {
        return;
    }

    var rainbows = world.rainbows;
    var fromTile = world.rows[0][0][0];
    var toTile = world.rows[world.tileRows - 1][world.tileColumns - 1][0];
    var bowCount = rainbows.bowConfigs.length;

    //console.log("bowConfigs", JSON.stringify(world.bowConfigs));

    var rainbow =
        CreatePrefab({
            prefab: 'Prefabs/Rainbow',
            obj: {
                bows: []
            },
            config: {
                'fromTransform!': 'object:' + fromTarget.id + '/transform',
                'toTransform!': 'object:' + toTarget.id + '/transform',
                fromWidth: rainbows.rainbowWidth,
                toWidth: rainbows.rainbowWidth
            }
        });

    world.rainbow = rainbow;

    for (var bowIndex = 0;
         bowIndex < bowCount;
         bowIndex++) {

        var bowConfig = 
            world.bowConfigs[bowIndex];

        //console.log("bowConfig", JSON.stringify(bowConfig));

        var bow =
            CreatePrefab({
                prefab: 'Prefabs/Bow',
                config: bowConfig,
                postEvents: [
                    {
                        event: 'SetParent',
                        data: {
                            'path': 'object:' + world.rainbow.id
                        }
                    }
                ]});

        rainbow.bows.push(bow);

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

    var t = CreateOverlayText({
        "trackPosition": "Transform",
        "transformPosition!": "object:" + blob.id + "/transform",
        "textMesh/text": "blob " + id++,
        "textMesh/fontSize": 24,
        "textMesh/color": { r: 1, g: 0.5, b: 0.5 },
        "component:RectTransform/sizeDelta": { 
            x: 100,
            y: 50
        }
    });

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

        var t = CreateOverlayText({
            "trackPosition": "Transform",
            "transformPosition!": "object:" + bloop.id + "/transform",
            "textMesh/text": "bloop " + id++,
            "textMesh/fontSize": 18,
            "textMesh/color": { r: 0.5, g: 1, b: 0.5 },
            "component:RectTransform/sizeDelta": { 
                x: 100,
                y: 50
            }
        });

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

            var t = CreateOverlayText({
                "trackPosition": "Transform",
                "transformPosition!": "object:" + bleep.id + "/transform",
                "textMesh/text": "bleep " + id++,
                "textMesh/fontSize": 12,
                "textMesh/color": { r: 0.5, g: 0.5, b: 1 },
                "component:RectTransform/sizeDelta": { 
                    x: 100,
                    y: 50
                }
            });

            if (bleepData.linear) {
                lastBleepParent = bleep;
            }
        }


    }

}


function CreatePlayers()
{
    var world = globals.world;

    if (!world.createPlayers) {
        return;
    }

    var players = world.players;
    var playerData = players.playerData;
    var tinyScale = { x:0.01, y: 0.01, z: 0.01 };

    globals.players = [];

    var player = CreatePrefab({
        prefab: 'Prefabs/Ball',
        component: 'Tracker',
        obj: { // obj
        },
        config: { // config 
            "dragTracking": true,
            "transform/localPosition": {x: 0, y: 50, z: 0},
            "transform/localScale": tinyScale,
            "component:MeshRenderer/materials": [playerData.material],
            "component:Collider/sharedMaterial": playerData.physicMaterial,
            "component:Collider/radius": playerData.colliderRadius,
            "component:Rigidbody/isKinematic": playerData.isKinematic,
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
                        to: {x: playerData.size, y: playerData.size, z: playerData.size},
                        time: playerData.animateTime
                    }
                ]
            }
        ]

    });

    globals.players.push(player);

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


////////////////////////////////////////////////////////////////////////
