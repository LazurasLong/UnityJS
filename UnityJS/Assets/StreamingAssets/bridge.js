/*
 * bridge.js
 * Unity3D / JavaScript Bridge
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Globals


var globals = {
    driver: "None",
    nextID: 0,
    objects: {},
    callbacks: {},
    consoleLog: null,
    startedUnity: false,
    startedJS: false,
    pollCount: 0,
    jsToUnityEventQueue: [],
    jsToUnityEventCount: 0,
    jsToUnityEventBytes: 0,
    jsToUnityEventLog: "",
    unityToJSEventCount: 0,
    unityToJSEventBytes: 0,
    unityToJSEventLog: "",
    content: null,
    updateContent: false,
    mousePosition: null,
    cameraPosition: null,
    cameraRotation: null
};


////////////////////////////////////////////////////////////////////////


function StartBridge(driver)
{
    console.log("bridge.js: StartBridge: begin");

    if (globals.startedUnity) {
        console.log("bridge.js: StartBridge: called again but ignored");
        return;
    }

    globals.driver = driver || "Unknown";

    SendEvent({
        event: 'StartedJS'
    });

    globals.startedUnity = true;
    globals.startedJS = true;

    CreateObjects();

    console.log("bridge.js: StartBridge: end");
}


////////////////////////////////////////////////////////////////////////
// Bridge Utilities


function MakeID(kind)
{
    // We don't want slashes in the object ids.
    kind = kind.replace(/\//g, '_');
    return kind + "_" + globals.nextID++;
}


function EscapeText(text)
{
    return text.replace("&", "&amp;")
               .replace("<", "&lt;")
               .replace(">", "&gt;")
               .replace("\\", "\\\\");
}


function Dump(obj)
{
    return EscapeText(JSON.stringify(obj, null, 4));
}


function CreatePrefab(d)
{
    console.log("bridge.js: CreatePrefab: d:", JSON.stringify(d, null, 4));

    // prefab, component, obj, config, interests, preEvents, postEvents

    var obj = d.obj || {};
    var prefab = d.prefab || null;
    var component = d.component || null;
    var config = d.config || null;
    var interests = d.interests || null;
    var preEvents = d.preEvents || null;
    var postEvents = d.postEvents || null;

    //console.log("CreatePrefab", "obj", obj, "prefab", prefab, "component", component, "config", config, "interests", JSON.stringify(interests), "length", interests.length, "preEvent", preEvents, "postEvents", postEvents);

    var remoteInterests = {};
    if (interests) {
        for (var eventName in interests) {
            var interest = interests[eventName];
            var remoteInterest = {};
            remoteInterests[eventName] = remoteInterest;
            for (var key in interest) {
                if (key == 'handler') {
                    continue;
                }
                remoteInterest[key] = interest[key];
            }
        }
    }

    //console.log("CreatePrefab", "remoteInterests", JSON.stringify(remoteInterests));

    var id = MakeID(prefab || 'GameObject');

    obj.id = id;
    obj.prefab = prefab;
    obj.component = component;
    obj.config = config;
    obj.interests = interests;
    obj.preEvents = preEvents;
    obj.postEvents = postEvents;

    globals.objects[id] = obj;

    var data = {
        id: id,
        prefab: prefab,
        component: component,
        config: config,
        interests: remoteInterests,
        preEvents: preEvents,
        postEvents: postEvents
    };

    SendEvent({
        event: 'Create',
        data: data
    });

    return obj;
}


function DestroyObject(obj)
{
    SendEvent({
        event: 'Destroy',
        id: obj.id
    });
}


function UpdateObject(obj, data)
{
    SendEvent({
        event: 'Update',
        id: obj.id,
        data: data
    });
}


function AnimateObject(obj, data)
{
    SendEvent({
        event: 'Animate',
        id: obj.id,
        data: data
    });
}


function QueryObject(obj, query, callback)
{
    var callbackID = callback && MakeCallbackID(obj, callback, true);
    var data = {
        query: query,
        callbackID: callbackID
    };

    SendEvent({
        event: 'Query',
        id: obj.id,
        data: data
    });
}


function UpdateInterests(obj, data)
{
    SendEvent({
        event: 'UpdateInterests',
        id: obj.id,
        data: data
    });
}


function MakeCallbackID(obj, callback, oneTime)
{
    var callbackID = MakeID("Callback");

    globals.callbacks[callbackID] = function (data) {
        //console.log("bridge.js: MakeCallbackID:", "callback:", callback, "callbackID:", callbackID, "data:", data);
        callback(data);
        if (oneTime) {
            ClearCallback(callbackID);
        }
    };

    return callbackID;
}


function InvokeCallback(callbackID, data)
{
    var callback = globals.callbacks[callbackID];
    if (callback == null) {
        console.log("bridge.js: InvokeCallback: undefined callbackID:", callbackID);
        return;
    }

    callback(data);
}


function ClearCallback(callbackID)
{
    delete globals.callbacks[callbackID];
}


function SendEvent(ev)
{
    var evString = JSON.stringify(ev);

    //console.log("======== SendEvent", evString);

    globals.jsToUnityEventCount++;
    globals.jsToUnityEventBytes += evString.length;
    globals.jsToUnityEventLog += ev.event + " ";

    switch (globals.driver) {

        case "WebView":
            window.webkit.messageHandlers.bridge.postMessage(evString);
            break;

        case "WebGL":
            globals.jsToUnityEventQueue.push(evString);
            if (!globals.startedUnity) {
                FlushJSToUnityEventQueue();
                UpdateContent();
            }
            break;

        case "CEF":
            globals.jsToUnityEventQueue.push(evString);
            if (!globals.startedUnity) {
                FlushJSToUnityEventQueue();
                UpdateContent();
            }
            break;

    }

}


function DistributeEvents(evList, evListStringLength)
{
    globals.pollCount++;
    if (evList != null) {
        globals.unityToJSEventCount += evList.length;
        globals.unityToJSEventBytes += evListStringLength;

        for (var i = 0, n = evList.length; i < n; i++) {
            var ev = evList[i];

            globals.unityToJSEventLog += ev['event'] + " ";

            DistributeEvent(ev);
        }

    }

    FlushJSToUnityEventQueue();
    UpdateContent();
}


function UpdateContent()
{
    if (!globals.updateContent) {
        return;
    }

    if (globals.content == null) {
        globals.content = document.getElementById('content');
    }
    if (globals.content != null) {
        globals.content.innerText = 
            "Polls: " + globals.pollCount + 
            "\nJS=>Unity Events: " + globals.jsToUnityEventCount + " Bytes: " + globals.jsToUnityEventBytes +
            "\n" + globals.jsToUnityEventLog +
            "\nUnity=>JS Events: " + globals.unityToJSEventCount + " Bytes: " + globals.unityToJSEventBytes +
            "\n" + globals.unityToJSEventLog;
    }
}


function DistributeEvent(ev)
{
    var eventName = ev.event;
    var id = ev.id;
    var data = ev.data;

    switch (eventName) {

        case "StartedUnity":

            console.log("bridge.js: DistributeEvent: StartedUnity:", ev);

            //StartBridge();

            break;

        case "Callback":

            console.log("bridge.js: DistributeEvent: InvokeCallback:", id, data);

            InvokeCallback(id, data);

            break;

        default:

            var obj = (id && globals.objects[id]) || null;
            if (obj == null) {
                console.log("bridge.js: DistributeEvent: undefined object id: " + id + " eventName: " + eventName + " data: " + data);
                return;
            }

            var interests = obj['interests'];
            if (!interests) {
                //console.log("bridge.js: DistributeEvent: no interests for object id: " + id + " eventName: " + eventName + " data: " + data);
                return;
            }

            var interest = interests[eventName];
            if (interest) {
                interest.handler(obj, data);
            } else if ((eventName != "Created") &&
                       (eventName != "Destroyed")) {
                console.log("bridge.js: DistributeEvent: no interest for object id: " + id + " eventName: " + eventName + " data: " + data);
            }

            if ((eventName == "Destroyed") &
                (obj != null)) {
                //console.log("bridge.js: DistributeEvent: Destroy", "id", ev.id, "obj", obj);
                delete globals.objects[id];
            }

            break;

        }
}


function EvaluateJS(js)
{
    console.log("bridge.js: EvaluateJS: js:", js);

    try {
        eval(js);
    } catch (error) {
        console.log("bridge.js: EvaluateJS: error:", error, "js:", js);
    }
}


function ConsoleLog()
{
    if (!globals.consoleLog) {
        return;
    }

    var parts = [];
    for (var i = 0, n = arguments.length; i < n; i++) {
        parts.push("" + arguments[i]);
    }

    var data = {
        line: parts.join(" ")
    };

    SendEvent({
            event: "Log",
            data: data
        });

}


function PollForEventsAndroid()
{
    // TODO
}


function PollForEvents()
{
    if (globals.jsToUnityEventQueue.length == 0) {
        return "";
    }

    var evListString = globals.jsToUnityEventQueue.join(',');
    //console.log("bridge.js: PollForEvents: queue length: " + globals.jsToUnityEventQueue.length + " evListString length: " + evListString.length);

    globals.jsToUnityEventQueue = [];

    return evListString;
}


function FlushJSToUnityEventQueue()
{
    if (globals.jsToUnityEventQueue.length == 0) {
        return null;
    }

    var evListString = globals.jsToUnityEventQueue.join(',');
    //console.log("bridge.js: FlushJSToUnityEventQueue: queue length: " + globals.jsToUnityEventQueue.length + " evListString length: " + evListString.length);

    globals.jsToUnityEventQueue = [];

    SendEventList(evListString);
}


function SendEventList(evListString)
{ 
    if (window.unityAsync) {

        // Unity Editor Runtime

        unityAsync({
            className: "Bridge",
            funcName: "SendEventList",
            funcArgs: [evListString]
        });

    } else {

        // WebGL Runtime

        window.bridge._SendJSToUnityEvents(
            evListString);

    }
}


////////////////////////////////////////////////////////////////////////
// Tracking Utilities


function TrackMouse(position)
{
    globals.mousePosition = position;
}


function TrackCamera(position, rotation)
{
    globals.cameraPosition = position;
    globals.gCameraRotation = rotation;
}


////////////////////////////////////////////////////////////////////////
// Canvas Utilities


function SetJS(text)
{
    UpdateObject(globals.canvas, {
        "transform:Panel/transform:JSField/component:TMPro.TMP_InputField/text": text
    });
}


function SetOutput(text)
{
    UpdateObject(globals.canvas, {
        "transform:Panel/transform:OutputField/component:TMPro.TMP_InputField/text": text
    });
}


function SetText(text)
{
    UpdateObject(globals.canvas, {
        "transform:Panel/transform:TextField/component:TMPro.TMP_InputField/text": text
    });
}


////////////////////////////////////////////////////////////////////////
// TextOverlays Utilities


function SetGridText(topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight)
{
    //console.log("SetGridText", topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight);
    UpdateObject(globals.textOverlays, {
        "topLeftText/text": topLeft || '',
        "topText/text": top || '',
        "topRightText/text": topRight || '',
        "leftText/text": left || '',
        "centerText/text": center || '',
        "rightText/text": right || '',
        "bottomLeftText/text": bottomLeft || '',
        "bottomText/text": bottom || '',
        "bottomRightText/text": bottomRight || ''
    });
}


function SetCenterText(center)
{
    SetGridText(null, null, null, null, center, null, null, null, null);
}


function ShowObjectInfo(obj)
{
    if (obj == null) {
        SetGridText();
    } else {
        SetGridText(
            "\n<size=30%>" + Dump(obj),
            "Info for Object ID:\n" + obj.id);
    }
}


////////////////////////////////////////////////////////////////////////
// Object creation utilities.


function CreateObjects()
{
    CreateInterface();
    CreateKeyboardTracker();
    CreatePieTracker();
    CreateCanvas();
    CreateJunk();
    CreateParticleSystem();
    CreateBridgeTest();
}


function CreateInterface()
{

    globals.light = CreatePrefab({
        prefab: 'Prefabs/Light',
        obj: {
            doNotDelete: true
        }
    });

    globals.camera = CreatePrefab({
        prefab: 'Prefabs/Camera',
        obj: {
            doNotDelete: true
        }
    });

    globals.eventSystem = CreatePrefab({
        prefab: 'Prefabs/EventSystem',
        obj: {
            doNotDelete: true
        }
    });

    globals.textOverlays = CreatePrefab({
        prefab: 'Prefabs/TextOverlays',
        obj: {
            doNotDelete: true
        }
    });

}


function CreatePieTracker()
{

    function StartPie(position, pieID, pieData)
    {
        console.log("StartPie", "position", position, "pieID", pieID, "pieData", pieData);

        globals.pieTracker.pie = 
            globals.pieTracker.pies[pieID] ||
            null;

        if (!globals.pieTracker.pie) {
            globals.pieTracker.tracking = false;
            return;
        }

        globals.pieTracker.tracking = true;
        globals.pieTracker.data = pieData;

        if (globals.pieTracker.pie.onstart) {
            globals.pieTracker.pie.onstart(globals.pieTracker.pie, globals.pieTracker.data);
        }

        UpdateInterests(globals.pieTracker, {
            MousePositionChanged: true
        });
        UpdateObject(globals.pieTracker, {
            trackingMousePosition: true,
            mousePositionChanged: true,
            mousePositionStart: position,
            slices: globals.pieTracker.slices,
            initialDirection: globals.pieTracker.initialDirection,
            clockwise: globals.pieTracker.clockwise,
            inactiveDistance: globals.pieTracker.inactiveDistance,
            itemDistance: globals.pieTracker.itemDistance
        });

        TrackPie(position, 0.0, 0.0, -1, -1, true);
    }

    function StopPie()
    {
        console.log("StopPie", "globals.pieTracker.tracking", globals.pieTracker.tracking, "globals.pieTracker.pie" , globals.pieTracker.pie);

        globals.pieTracker.tracking = false;

        UpdateObject(globals.pieTracker, {
            trackingMousePosition: false
        });

        SetGridText();

        if (!globals.pieTracker.pie)  {
            return;
        }

        if (globals.pieTracker.sliceIndex < 0) {

            if (globals.pieTracker.pie.onselectcenter) {
                globals.pieTracker.pie.onselectcenter(globals.pieTracker.pie, globals.pieTracker.data);
            }

            console.log("StopPie center centerPieID", globals.pieTracker. centerPieID, globals.pieTracker.pie);

            if (globals.pieTracker.pie.centerPieID) {
                StartPie(globals.pieTracker.mousePosition, globals.pieTracker.pie.centerPieID, globals.pieTracker.data);
            }

            return;
        }

        if (!globals.pieTracker.slice) {

            if (globals.pieTracker.pie.onselectempty) {
                globals.pieTracker.pie.onsselectempty(globals.pieTracker.pie, globals.pieTracker.data, globals.pieTracker.sliceIndex);
            }

        } else {

            if (globals.pieTracker.item) {

                if (globals.pieTracker.item.onselect) {
                    globals.pieTracker.item.onselect(globals.pieTracker.pie, globals.pieTracker.data);
                }

            }

            if (globals.pieTracker.slice.onselect) {
                globals.pieTracker.slice.onselect(globals.pieTracker.pie, globals.pieTracker.data);
            }

            if (globals.pieTracker.slice.pieID) {
                StartPie(globals.pieTracker.mousePosition, globals.pieTracker.slice.pieID, globals.pieTracker.data);
            }

        }

    }

    function TrackPie(position, distance, direction, sliceIndex, itemIndex, reset)
    {
        console.log("TrackPie", "globals.pieTracker.tracking", globals.pieTracker.tracking, "globals.pieTracker.pie" , globals.pieTracker.pie);

        if (!globals.pieTracker.pie)  {
            console.log("TrackPie: called with null globals.pieTracker.pie! ");
            return;
        }

        if (globals.pieTracker.sliceIndex != sliceIndex) {

            var lastSlice = 
                (globals.pieTracker.sliceIndex < 0)
                    ? null
                    : globals.pieTracker.pie.slices[globals.pieTracker.sliceIndex];

            if (lastSlice) {
                if (lastSlice.onexit) {
                    lastSlice.onexit(globals.pieTracker.pie, lastSlice);
                }
            } else {
                if (globals.pieTracker.pie.onexitempty) {
                    globals.pieTracker.pie.onexitempty(globals.pieTracker.pie, globals.pieTracker.sliceIndex);
                }
            }

            var nextSlice = 
                (sliceIndex < 0)
                    ? null
                    : globals.pieTracker.pie.slices[sliceIndex];

            if (nextSlice) {
                if (nextSlice.onenter) {
                    nextSlice.onenter(globals.pieTracker.pie, nextSlice);
                }
            } else {
                if (globals.pieTracker.pie.onenterempty) {
                    globals.pieTracker.pie.onenterempty(globals.pieTracker.pie, sliceIndex);
                }
            }

        }

        globals.pieTracker.mousePosition = position;
        globals.pieTracker.distance = distance;
        globals.pieTracker.direction = direction;
        globals.pieTracker.sliceIndex = sliceIndex;
        globals.pieTracker.itemIndex = itemIndex;

        globals.pieTracker.slice =
            ((globals.pieTracker.sliceIndex >= 0) &&
             globals.pieTracker.pie.slices[globals.pieTracker.sliceIndex]) ||
            null;

        globals.item =
            (globals.pieTracker.slice &&
             globals.pieTracker.slice.items &&
             (globals.itemIndex >= 0) &&
             globals.pieTracker.slice.items[Math.min(globals.itemIndex, globals.pieTracker.slice.items.length - 1)]) ||
            null;

        if (globals.pieTracker.pie.ontrack) {
            globals.pieTracker.pie.ontrack(globals.pieTracker.pie);
        }

        if (globals.pieTracker.slice && globals.pieTracker.slice.ontrack) {
            globals.pieTracker.slice.ontrack(globals.pieTracker.slice);
        }

        if (globals.pieTracker.item && globals.pieTracker.item.ontrack) {
            globals.pieTracker.item.ontrack(globals.pieTracker.item);
        }

        if (globals.pieTracker.sliceIndex < 0) {

            if (globals.pieTracker.pie.ontrackcenter) {
                globals.pieTracker.pie.ontrackcenter(globals.pieTracker.pie);
            }

        } else {

            if (globals.pieTracker.slice) {
                if (globals.pieTracker.slice.ontrack) {
                    globals.pieTracker.slice.ontrack(globals.pieTracker.slice);
                }
            } else {
                if (globals.pieTracker.pie.ontrackempty) {
                    globals.pieTracker.pie.ontrackempty(globals.pieTracker.pie, globals.pieTracker.sliceIndex);
                }
            }

        }

        var update = {};

        var slices = globals.pieTracker.pie.slices;
        var sliceCount = slices.length;
        var hilitePrefix = "<size=200%><b>";
        var lolitePrefix = "<size=50%>";
        var normalPrefix = "";

        function label(i) {
            var slice = slices[i];
            if (!slice) {
                return "";
            }

            var sliceLabel =
                slice.getLabel
                    ? slice.getLabel(slice, globals.pieTracker.data)
                    : slice.label;

            // Not selecting any slice, so show each slice label unmodified.
            if (!globals.pieTracker.slice) {
                return normalPrefix + (sliceLabel || "");
            }

            // Selecting a slice, so highlight the selected slice and lowlight the other slices.
            // For the selected slice, show the item label instead of the slice label, if defined.
            if (slice == globals.pieTracker.slice) {

                var item =
                    (slice.items &&
                     (globals.pieTracker.itemIndex >= 0) &&
                     slice.items[Math.min(globals.pieTracker.itemIndex, slice.items.length - 1)]) ||
                    null;

                if (item) {
                    var itemLabel =
                        item.getLabel
                            ? item.getLabel(item)
                            : item.label;
                    return hilitePrefix + (itemLabel || sliceLabel || "");
                }

                return hilitePrefix + (sliceLabel || "");

            } else {

                return lolitePrefix + (sliceLabel || "");

            }

        };

        var title = (
            (globals.pieTracker.slice
                 ? lolitePrefix
                 : normalPrefix) +
             "<b>" + 
             globals.pieTracker.pie.title);

        SetGridText(
            label(7), label(0), label(1),
            label(6), title,    label(2),
            label(5), label(4), label(3));

    }

    globals.pieTracker = CreatePrefab({
        prefab: 'Prefabs/PieTracker', 
        obj: { // obj
            doNotDelete: true,
            pie: null,
            tracking: false,
            data: null,
            id: 'Compass',
            slices: 8,
            initialDirection: 90,
            clockwise: true,
            inactiveDistance: 50,
            itemDistance: 100,
            startMousePosition: null,
            startCameraPosition: null,
            startCameraRotation: null,
            trackMousePosition: null,
            trackCameraPosition: null,
            trackCameraRotation: null,
            cameraRotationEulerAngles: null,
            mousePosition: null,
            mousePositionDelta: null,
            distance: 0,
            direction: 0,
            sliceIndex: -1,
            itemIndex: -1,
            slice: null,
            item: null,
            cameraPositionDelta: null,
            cameraRotationDelta: null,
            pies: {

                'Compass': {
                    title: 'Compass',
                    onselectcenter: function(pie, obj) {
                    },
                    slices: [
                        {
                            label: "N",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass N", obj);
                            }
                        },
                        {
                            label: "NE",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass NE", obj);
                            }
                        },
                        {
                            label: "E",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass E", obj);
                            }
                        },
                        {
                            label: "SE",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass SE", obj);
                            }
                        },
                        {
                            label: "S",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass S", obj);
                            }
                        },
                        {
                            label: "SW",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass SW", obj);
                            }
                        },
                        {
                            label: "W",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass W", obj);
                            }
                        },
                        {
                            label: "NW",
                            onselect: function(pie, obj) {
                                if (!obj) return;
                                console.log("pie Compass NW", obj);
                            }
                        }
                    ]
                }
            }
        }, // obj
        params: { // params:
            tracking: true,
            trackingMouseButton: true,
            trackingMousePosition: false,
            trackingCameraPosition: false,
            trackingCameraRotation: false
        },
        interests: { // interests:
            MouseButtonDown: {
                query: {
                    mousePosition: "mousePosition",
                    mouseRaycastResult: "mouseRaycastResult",
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?",
                    cameraRotationEulerAngles: "pieCamera/transform/rotation/eulerAngles"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonDown: results:", results, "globals.pieTracker.tracking:", globals.pieTracker.tracking);

                    if (globals.pieTracker.tracking) {
                        console.log("PieTracker: MouseButtonDown: already tracking pie so ignoring. updating globals.pieTracker.mousePosition from", globals.pieTracker.mousePosition, "to", results.mousePosition);
                        globals.pieTracker.mousePosition = results.mousePosition;
                        return;
                    }

                    var pieData =
                        results.mouseRaycastResult
                            ? globals.objects[results.mouseRaycastHitBridgeObjectID]
                            : null;

                    var pieID = 
                        (pieData && pieData.pieID) ||
                        'Compass';

                    globals.pieTracker.cameraRotationEulerAngles = results.cameraRotationEulerAngles;

                    StartPie(results.mousePosition, pieID, pieData);

                }
            },
            MouseButtonUp: {
                query: {
                    mousePosition: "mousePosition",
                    distance: "distance",
                    direction: "direction",
                    sliceIndex: "sliceIndex",
                    itemIndex: "itemIndex",
                    cameraRotationEulerAngles: "pieCamera/transform/rotation/eulerAngles"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonUp: results:", results, "globals.pieTracker.tracking:", globals.pieTracker.tracking);

                    if (!globals.pieTracker.tracking) {
                        return;
                    }

                    globals.pieTracker.cameraRotationEulerAngles = results.cameraRotationEulerAngles;

                    TrackPie(
                        results.mousePosition, 
                        results.distance, 
                        results.direction, 
                        results.sliceIndex, 
                        results.itemIndex,
                        false);

                    StopPie();

                }
            },
            MouseButtonChanged: {
                disabled: true,
                query: {
                    mouseButton: "mouseButton"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonChanged: results:", results, "globals.pieTracker.tracking:", globals.pieTracker.tracking);
                }
            },
            MousePositionChanged: {
                disabled: true,
                query: {
                    mousePosition: "mousePosition",
                    distance: "distance",
                    direction: "direction",
                    sliceIndex: "sliceIndex",
                    itemIndex: "itemIndex",
                    cameraRotationEulerAngles: "pieCamera/transform/rotation/eulerAngles"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MousePositionChanged: results:", results, "globals.pieTracker.tracking:", globals.pieTracker.tracking);

                    if (!globals.pieTracker.tracking) {
                        return;
                    }

                    globals.pieTracker.cameraRotationEulerAngles = results.cameraRotationEulerAngles;

                    TrackPie(
                        results.mousePosition, 
                        results.distance, 
                        results.direction, 
                        results.sliceIndex, 
                        results.itemIndex,
                        false);

                }
            },
            MouseButtonDownUI: {
                query: {
                    mousePosition: "mousePosition",
                    mouseRaycastResult: "mouseRaycastResult",
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?",
                    cameraRotationEulerAngles: "pieCamera/transform/rotation/eulerAngles"
                },
                handler: function (obj, results) {
                    console.log("PieTracker: MouseButtonDownUI: results:", results);
                }
            },
            MouseButtonUpUI: {
                query: {
                    mousePosition: "mousePosition",
                    mouseRaycastResult: "mouseRaycastResult",
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?",
                    cameraRotationEulerAngles: "pieCamera/transform/rotation/eulerAngles"
                },
                handler: function (obj, results) {
                    console.log("PieTracker: MouseButtonUpUI: results:", results);
                }
            },
            CameraPositionChanged: {
                disabled: true,
                query: {
                    cameraPosition: "cameraPosition"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: CameraPositionChanged: results:", results);
                }
            },
            CameraRotationChanged: {
                disabled: true,
                query: {
                    cameraRotation: "cameraRotation",
                    cameraRotationEulerAngles: "cameraRotationEulerAngles"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: CameraRotationChanged: results:", results);
                    globals.pieTracker.cameraRotationEulerAngles = results.cameraRotationEulerAngles;
                }
            }
        }
    });

}


function TrackInputString(inputString)
{
    console.log("TrackInputString: inputString: " + inputString);
}


function TrackKeyEvent(results)
{
    console.log("TrackKeyEvent: keyEvent: " + JSON.stringify(results));
}


function CreateKeyboardTracker()
{

    globals.keyboardTracker = CreatePrefab({
        prefab: 'Prefabs/KeyboardTracker', 
        obj: { // obj
            doNotDelete: true
        }, // obj
        params: { // params:
            tracking: true,
            inputStringTracking: true,
            keyEventTracking: true
        },
        interests: { // interests:
            InputString: {
                query: {
                    inputString: "inputString"
                },
                handler: function (obj, results) {
                    //console.log("KeyboardTracker: InputString: inputString: " + results.inputString);
                    TrackInputString(results.inputString);
                }
            },
            KeyEvent: {
                query: {
                    character: "keyEvent/character",
                    keyCode: "keyEvent/keyCode",
                    type: "keyEvent/type/method:ToString",
                    modifiers: "keyEvent/modifiers"
                    //shift: "keyEvent/shift",
                    //alt: "keyEvent/alt",
                    //control: "keyEvent/control",
                    //command: "keyEvent/command",
                    //capsLock: "keyEvent/capsLock",
                    //functionKey: "keyEvent/functionKey",
                    //numeric: "keyEvent/numeric",
                    //mousePosition: "keyEvent/mousePosition"
                },
                handler: function (obj, results) {
                    //console.log("KeyboardTracker: KeyEvent: results: " + JSON.stringify(results));
                    TrackKeyEvent(results);
                }
            }
        }
    });

}


function CreateCanvas()
{
    globals.canvas = CreatePrefab({
        prefab: 'Prefabs/TestCanvas',
        obj: {
            doNotDelete: true
        }
    });

    var canvasRef = 'object:' + globals.canvas.id;

    globals.buttonEval = CreatePrefab({
        perfab: 'Prefabs/ToolbarButton',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            'label/text': 'Eval'
        },
        interests: { // interests:
            Click: {
                query: {
                    js: canvasRef + '/transform:Panel/transform:JSField/component:TMPro.TMP_InputField/text'
                },
                handler: function(obj, result) {
                    console.log("Canvas: button: Eval: js: " + result.js);
                    var result = eval(result.js);
                    SetOutput("" + result);
                }
            }
        },
        postEvents: [ // postEvents:
            {
                event: 'SetParent',
                data: {
                    'path': canvasRef + '/transform:Panel/transform:ButtonPanel'
                }
            }
        ]
    });

    globals.buttonFoo = CreatePrefab({
        prefab: 'Prefabs/ToolbarButton',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            'label/text': 'Foo'
        },
        interests: { // interests:
            Click: {
                query: {
                    text: 'object:' + globals.canvas.id + '/transform:Panel/transform:TextField/component:TMPro.TMP_InputField/text'
                },
                handler: function(obj, result) {
                    console.log("Canvas: button: Foo: text: " + result.text);
                    SetOutput(JSON.stringify(result));
                }
            }
        },
        postEvents: [ // postEvents:
            {
                event: 'SetParent',
                data: {
                    'path': canvasRef + '/transform:Panel/transform:ButtonPanel'
                }
            }
        ]
    });

    globals.buttonBar = CreatePrefab({
        prefab: 'Prefabs/ToolbarButton',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            'label/text': 'Bar'
        },
        interests: { // interests:
            Click: {
                query: {
                    text: 'object:' + globals.canvas.id + '/transform:Panel/transform:TextField/component:TMPro.TMP_InputField/text'
                },
                handler: function(obj, result) {
                    console.log("Canvas: button: Bar: text: " + result.text);
                    SetOutput(JSON.stringify(result));
                }
            }
        },
        postEvents: [ // postEvents:
            {
                event: 'SetParent',
                data: {
                    'path': canvasRef + '/transform:Panel/transform:ButtonPanel'
                }
            }
        ]
    });

}


function CreateJunk()
{

    globals.ball = CreatePrefab({
        prefab: 'Prefabs/Ball',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            "transform/localPosition": {x: 500, y: -200, z: -50},
            "transform/localScale": {x: 300, y: 300, z: 300},
            "transform/localRotation": {roll: 30, pitch: 45, yaw: 0}
        }
    });

    globals.cuboid = CreatePrefab({
        prefab: 'Prefabs/Cuboid',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            "transform/localPosition": {x: -600, y: -200, z: -50},
            "transform/localScale": {x: 200, y: 200, z: 200},
            "transform/localRotation": {roll: 0, pitch: 45, yaw: 45}
        }
    });

}


function CreateParticleSystem()
{

    globals.particleSystem = CreatePrefab({
        prefab: 'Prefabs/ParticleSystems/TileParticles',
        obj: {
            doNotDelete: true
        },
        config: { // config:
            "transform/localPosition": {x: 0, y: 0, z: -0},
            "transform/localScale": {x: 1, y: 1, z: 1},
            "transform/localRotation": {roll: 0, pitch: 0, yaw: 0},
            "particles": [
                {
                    size: 1,
                    position: {
                        x: -1,
                        y: 0,
                        z: 0
                    }
                },
                {
                    size: 1,
                    position: {
                        x: 0.0,
                        y: 0,
                        z: 0
                    }
                },
                {
                    size: 1,
                    position: {
                        x: 1,
                        y: 0,
                        z: 0
                    }
                }
            ]
        }
    });

    QueryObject(
        globals.particleSystem, {
            activeVertexStreams:'activeVertexStreams'
        }, function (result) {
            console.log('QueryObject: globals.particleSystem', globals.particleSystem, 'activeVertexStreams', result.activeVertexStreams);
        });

}


function CreateBridgeTest()
{

    var bridgeTestData = {
        i: 456,
        f: 0.9,
        b: false,
        str: "baz",
        fooBar: "Foo",
        v2: {x: 10.0, y: 20.0},
        v3: {x: 10.0, y: 20.0, z: 30.0},
        v4: {x: 10.0, y: 20.0, z: 30.0, w: 40.0},
        quatXYZW: {x: 10.0, y: 20.0, z: 30.0, w: 40.0},
        quatRollPitchYaw: {roll: 10.0, pitch: 20.0, yaw: 30.0},
        colorRGB: {r: 1.0, g: 0.1, b: 0.4},
        colorRGBA: {r: 0.5, g: 0.9, b: 0.2, a: 0.5},
        mat: [
            2, 0, 0, 0, 
            0, 2, 0, 0, 
            0, 0, 2, 0,
            0, 0, 0, 2
        ],
        minMaxCurveNumber: 0.5,
        minMaxCurveConstant: {
            minMaxCurveType: "Constant",
            constant: 0.9
        },
        minMaxCurveCurve: {
            minMaxCurveType: "Curve",
            multiplier: 10.0,
            curve: {
            }
        },
        minMaxCurveRandomCurves: {
            minMaxCurveType: "RandomCurves",
            multiplier: 10.0,
            min: {
            },
            max: {
            }
        },
        minMaxCurveRandomConstants: {
            minMaxCurveType: "Constant",
            multiplier: 10.0,
            min: -100.0,
            max: 100.0
        },
        minMaxGradientColor: {
            minMaxGradientType: "Color",
            color: {
                r: 1.0,
                g: 0.0,
                b: 0.0
            }
        },
        minMaxGradientGradient: {
            minMaxGradientType: "Gradient",
            gradient: {
            }
        },
        minMaxGradientTwoColors: {
            minMaxGradientType: "TwoColors",
            min: {
                r: 1.0,
                g: 0.0,
                b: 0.0
            },
            max: {
                r: 0.0,
                g: 0.0,
                b: 1.0
            }
        },
        minMaxGradientTwoGradients: {
            minMaxGradientType: "TwoGradients",
            min: {
            },
            max: {
            }
        },
        minMaxGradientRandomColor: {
            minMaxGradientType: "RandomColor",
            gradient: {
            }
        }
    };

    function UpdateBridgeTest()
    {
        UpdateObject(globals.bridgeTest, bridgeTestData);
    }

    function QueryBridgeTest()
    {
        var query = {};
        for (var k in bridgeTestData) {
            query[k] = k;
        }

        QueryObject(globals.bridgeTest, query, function(result) {
            console.log("QueryBridgeTest: query:", query, "result:", result);
        });
    }

    globals.bridgeTest = CreatePrefab({
        prefab: 'Prefabs/BridgeTest',
        obj: {
            doNotDelete: true
        }
    });

}


////////////////////////////////////////////////////////////////////////
// Console log.


/*

if (!window.bridge) {
    window.bridge = {
        log: function() {}
    };
}

(function() {
    if (window.console && window.console.log) {
        window.consoleLogOld = window.consoleLogOld || window.console.log;
        console.log = function WrapConsoleLog() {
            ConsoleLog.apply(this, arguments);
            window.consoleLogOld.apply(this, arguments);
        };
    }  
})();

console.log("JavaScript console log initialized.");

*/


////////////////////////////////////////////////////////////////////////
