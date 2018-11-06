/*
 * simple.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Globals.


////////////////////////////////////////////////////////////////////////
// Utilities.


////////////////////////////////////////////////////////////////////////
// Create everything.


function CreateObjects()
{
    var light = CreatePrefab({
        "prefab": "Prefabs/Light",
        "update": {
            "component:Light/type": "Directional",
            "transform/localRotation": {
                "pitch": 40,
                "yaw": 300
            }
        }
    });

    var camera = CreatePrefab({
        "prefab": "Prefabs/ProCamera",
        "update": {
            "transform/localPosition": {
                "x": 0,
                "y": 15,
                "z": -20
            },
            "transform/localRotation": {
                "pitch": 30
            },
            "moveSpeed": 60,
            "yawSpeed": 60,
            "pitchSpeed": 60,
            "orbitYawSpeed": 60,
            "orbitPitchSpeed": 60,
            "wheelPanSpeed": -30,
            "wheelZoomSpeed": 20,
            "positionMin": {
                "x": -475,
                "y": 10,
                "z": -475
            },
            "positionMax": {
                "x": 475,
                "y": 300,
                "z": 475
            },
            "pitchMin": -90,
            "pitchMax": 90
        }
    });

    var hello = CreatePrefab({
        "prefab": "Prefabs/KineticText",
        "update": {
            "transform/position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "dragTracking": true,
            "component:RectTransform/sizeDelta": {x: 50, y: 10},
            "component:Rigidbody/isKinematic": true,
            "component:Rigidbody/centerOfMass": {y: -10},
            "colliderThickness": 1,
            "textMesh/text": "Hello\nWorld!",
            "textMesh/fontSize": 50
        }
    });

}


////////////////////////////////////////////////////////////////////////

