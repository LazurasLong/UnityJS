/*
 * game.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Error Handler


window.onerror = function(message, source, line, column, error) {
    console.log("!!!!!!!!!!!!!!!! WINDOW.ONERROR", "MESSAGE", message, "LINE", line, "COLUMN", column, "SOURCE", source);
};


////////////////////////////////////////////////////////////////////////
// Globals


globals.sheetURLs = {
    world: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=0',
    globalObjects: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1535357011',
    texturePaths: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=580619937',
    materialPaths: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1288543752',
    prefabMap: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1469835123',
    bowConfigs_outline: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=650116669',
    bowConfigs_table: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=233501381',
    bowConfigs_rainbow: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1544589805',
    twoDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=1423929352',
    threeDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=669397076',
    fourDeeArray: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=894939244',
    vectorArrayDict: 'https://docs.google.com/spreadsheets/d/1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w/export?format=tsv&id=1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w&gid=325407406'
};

globals.sheets = [];


////////////////////////////////////////////////////////////////////////


function CreateObjects()
{
    CreatePieTracker();

    LoadSheets(globals.sheets, globals.sheetURLs, function() {

        if (!globals.sheets['world']) {
            console.log("game.js: CreateObjects: onload: Finished loading sheets, but world was not loaded!");
        } else {

            var scope = SheetToScope(globals.sheets, 'world');
            var error = scope.error;
            var world = scope.value;

            if (error) {
                console.log("game.js: CreateObjects: onload: Error loading world. ERROR in sheetName", scope.errorScope.sheetName, "row", scope.errorScope.row, "column", scope.errorScope.column, "error", error, "errorScope", scope.errorScope);
            } else if (!world) {
                console.log("game.js: CreateObjects: onload: Loaded world but it was null.", "scope:", scope);
            } else {
                globals.world = world;
                console.log("game.js: CreateObjects: onload: Loaded world:", world, "scope:", scope);
                StartWorld(world);
            }

        }
    },
    function() {
        // error
    });
}


function StartWorld(world)
{
    CreateGlobalObjects();
    CreateGame();
}


function CreateGlobalObjects()
{
    var globalObjects = globals.world.globalObjects;
    for (var objectIndex = 0, objectCount = globalObjects.length; 
         objectIndex < objectCount; 
         objectIndex++) {

        var spec = globalObjects[objectIndex];
        var name = spec.name;

        globals[spec.name] = CreatePrefab(spec);

    }
}


function CreateGame()
{
    var world = globals.world;
    var hexes = world.prefabMap.hexes;
    var vegetation = world.prefabMap.vegetation;
    var rows = [];
    //var component = 'Tracker';
    var component = 'HexTile';

    world.rows = rows;

    var dx = world.tileColumns * world.tileDX * -0.5;
    var dy = world.tileRows * world.tileDY * -0.5;

    for (var y = 0; y < world.tileRows; y++) {
        var tileY =
            world.tileY + dy +
            (y * world.tileDY);
        var row = [];
        rows.push(row);

        for (var x = 0; x < world.tileColumns; x++) {

            (function (x, y, tileY) {

                var tileX =
                    world.tileX + dx +
                    ((y & 1) ? (world.tileDX * 0.5) : 0) +
                    (x * world.tileDX);

                var tileZ =
                    world.tileHeight[y][x];

                var prefabName =
                    hexes.dir + 
                    world.tileName[y][x];

                var materialName =
                    world.tileMaterial[y][x];

/*
                var textureName = 
                    world.tileTexture[y][x];

                var updateMaterialParams = [{
                    textureScale_MainTex: world.mainTextureScale,
                    textureScale_BumpMap: world.mainTextureScale,
                    texture_MainTex: textureName + "_COLOR",
                    texture_BumpMap: textureName + "_NORM"
                }];
*/

                var prefabs = [];

                if (world.makeTiles) {

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
                                "transform/localRotation": {yaw: 90},
                                "component:MeshRenderer/materials": [materialName, materialName, materialName]
                                //"component:MeshRenderer/materials/index:0/method:UpdateMaterial": updateMaterialParams,
                                //"component:MeshRenderer/materials/index:1/method:UpdateMaterial": updateMaterialParams,
                                //"component:MeshRenderer/materials/index:2/method:UpdateMaterial": updateMaterialParams
                            }, 
                            interests: { // interests
                                MouseDown: {
                                    query: {
                                        position: "transform/localPosition"
                                    },
                                    handler: function(obj, result) {
                                        console.log("MouseDown on Hex", "x", obj.x, "y", obj.y, "position", result.position, "prefabName", obj.prefabName);
                                        SendEvent({
                                            event: 'Tween',
                                            id: globals.leanTweenBridge.id,
                                            data: {
                                                transform: 'bridgeObject:' + obj.id,
                                                foo: 123,
                                                sequence: [1, 2, 3]
                                            }
                                        });
                                    }
                                }
                            }
                        });

                    prefabs.push(tilePrefab);

                    if (world.makeVegetation) {

                        var vegPrefabName =
                            vegetation.dir +
                            world.tileVegetation[y][x];

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

                }

                row.push(prefabs);

            })(x, y, tileY);

        }

    }

    var fromTile = world.rows[0][0][0];
    var toTile = world.rows[world.tileRows - 1][world.tileColumns - 1][0];
    var bowCount = world.bowConfigs.length;

    //console.log("bowConfigs", JSON.stringify(world.bowConfigs));

    world.rainbow =
        CreatePrefab({
            prefab: 'Prefabs/Rainbow',
            config: {
                'fromTransform!': 'object:' + fromTile.id + '/transform',
                'toTransform!': 'object:' + toTile.id + '/transform',
                fromWidth: world.rainbowWidth,
                toWidth: world.rainbowWidth
            }
        });

    world.bows = [];

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

        world.bows.push(bow);

    }

}


function CreatePlatform()
{
}


////////////////////////////////////////////////////////////////////////
