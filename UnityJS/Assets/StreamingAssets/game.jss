/*
 * game.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////
// Error Handler


window.onerror = function(message, source, line, column, error) {
    window.onerror = null;
    console.log("!!!!!!!!!!!!!!!! WINDOW.ONERROR", "MESSAGE", message, "LINE", line, "COLUMN", column, "SOURCE", source);
    console.trace();
};


////////////////////////////////////////////////////////////////////////
// Globals


globals.useApp = false;
globals.appURL = 'https://script.google.com/macros/s/AKfycbx6yinuIWLYE21Sd7UuEDxiJE3443gZutmhBhXVNo8Kk8lwAMc/exec';
globals.sheets = {};
globals.ranges = {};


////////////////////////////////////////////////////////////////////////


function CreateObjects()
{
    CreateKeyboardTracker();
    CreateBrowserRenderer();
    CreatePieTracker();
    LoadObjects();
}


function CreateKeyboardTracker()
{

    globals.keyboardTracker = CreatePrefab({
        prefab: 'Prefabs/KeyboardTracker', 
        obj: {
            doNotDelete: true
        },
        update: {
            tracking: true,
            inputStringTracking: true,
            keyEventTracking: true
        },
        interests: {
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


function TrackInputString(inputString)
{
    //console.log("TrackInputString: inputString: " + inputString);
}


function TrackKeyEvent(results)
{
    //console.log("game.js: TrackKeyEvent: results: " + JSON.stringify(results));

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


function CreateBrowserRenderer()
{

    var browserRenderer = null;


    function HandleIframeLoaded(ev)
    {
    }


    function Render(results)
    {
        browserRenderer.renderQueue.push(results);
        HandleRendering();
    }


    function HandleRendering()
    {
    }


    globals.browserRenderer = browserRenderer = CreatePrefab({
        prefab: 'Prefabs/BrowserRenderer', 
        obj: {
            doNotDelete: true,
            renderQueue: [],
            rendering: null,
            renderTimer: null
        },
        update: {
        },
        interests: {
            Render: {
                handler: function (obj, results) {
                    //console.log("game.js: BrowserRenderer: Render: obj:", obj, "results:", results);
                    Render(results);
                }
            }
        }
    });


}


function DrawBackground_Pie(canvas, context, params, success, error)
{
    var pieTracker = globals.pieTracker;
    var pie = params.pie;
    var target = params.target;
    var width = params.width;
    var height = params.height;
    var cx = width * 0.5;
    var cy = height * 0.5;
    var initialDirection = SearchDefault('initialDirection', pie, pieTracker.initialDirection);
    var subtend = SearchDefault('subtend', pie, pieTracker.subtend);
    var clockwise = SearchDefault('clockwise', pie, pieTracker.clockwise);
    var inactiveDistance = SearchDefault('inactiveDistance', pie, pieTracker.inactiveDistance);
    var itemDistance = SearchDefault('itemDistance', pie, pieTracker.itemDistance); // TODO: search item too?
    var drawBackgroundGradient = SearchDefault('drawBackgroundGradient', pie, pieTracker.drawBackgroundGradient);
    var backgroundGradientInnerRadius = SearchDefault('backgroundGradientInnerRadius', pie, pieTracker.backgroundGradientInnerRadius);
    var backgroundGradientOuterRadius = SearchDefault('backgroundGradientOuterRadius', pie, pieTracker.backgroundGradientOuterRadius);
    var drawInactiveCircle = SearchDefault('drawInactiveCircle', pie, pieTracker.drawInactiveCircle);
    var drawSlices = SearchDefault('drawSlices', pie, pieTracker.drawSlices);
    var sliceLength = SearchDefault('sliceLength', pie, pieTracker.sliceLength);
    var sliceLengthSelected = SearchDefault('sliceLengthSelected', pie, pieTracker.sliceLengthSelected);

    context.clearRect(0, 0, width, height);

    var slices = pie.slices;
    var sliceCount = slices ? slices.length : 0;
    var clockSign = clockwise ? -1 : 1;

    if (drawBackgroundGradient) {
        var gradient = context.createRadialGradient(cx, cy, 0, cx, cy, backgroundGradientOuterRadius);
        var r = inactiveDistance / backgroundGradientOuterRadius;
        gradient.addColorStop(0, '#ffffff20');
        gradient.addColorStop(r, '#ffffff20');
        gradient.addColorStop(r + 0.001, '#000000A0');
        gradient.addColorStop(1, '#00000000');
        if ((pieTracker.sliceIndex == -1) ||
            !slices ||
            !slices[pieTracker.sliceIndex]) {
            context.arc(cx, cy, backgroundGradientOuterRadius, 0, Math.PI * 2.0);
        } else {
            var slice = slices[pieTracker.sliceIndex];
            var sliceDirection = slice.sliceDirection;
            var sliceSubtend = slice.sliceSubtend;
            var halfTurn = 0.5 * clockSign * sliceSubtend;
            //console.log("slice", slice, "sliceDirection", sliceDirection, "sliceSubtend", sliceSubtend, "halfTurn", halfTurn);
            var dir1 = -(sliceDirection - halfTurn);
            var dx1 = Math.cos(dir1);
            var dy1 = Math.sin(dir1);
            var dir2 = -(sliceDirection + halfTurn);
            var dx2 = Math.cos(dir2);
            var dy2 = Math.sin(dir2);
            context.beginPath();
            context.moveTo(
                cx + (dx1 * inactiveDistance),
                cy + (dy1 * inactiveDistance));
            context.arc(
                cx,
                cy,
                backgroundGradientOuterRadius,
                dir1,
                dir2,
                !clockwise);
            context.lineTo(
                cx + (dx2 * inactiveDistance),
                cy + (dy2 * inactiveDistance));
            context.arc(
                cx,
                cy,
                inactiveDistance,
                dir2,
                dir1,
                clockwise);
            context.closePath();
        }
        context.fillStyle = gradient;
        context.fill();
    }

    if (drawInactiveCircle) {
        context.beginPath();
        context.arc(
            cx,
            cy,
            inactiveDistance,
            0,
            Math.PI * 2.0);
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.stroke();
    }

    if (!sliceCount) {
        success();
        return;
    }

    for (var sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
        var slice = slices[sliceIndex];
        var sliceSubtend = slice.sliceSubtend;
        var sliceDirection = slice.sliceDirection;
        var halfTurn = 0.5 * clockSign * sliceSubtend;

        if (drawSlices) {
            var selected = sliceIndex == pieTracker.sliceIndex;
            var previousIndex = (sliceIndex + sliceCount - 1) % sliceCount;
            var previousSelected = 
                ((subtend == 0) || (sliceIndex != 0)) &&
                (previousIndex == pieTracker.sliceIndex);
            var longSlice = selected || previousSelected;
            //console.log("sliceIndex", sliceIndex, "pieTracker.sliceIndex", pieTracker.sliceIndex, "selected", selected, "previousIndex", previousIndex, "previousSelected", previousSelected, "longSlice", longSlice); 
            if ((pieTracker.sliceIndex == -1) ||
                longSlice) {
                var length =
                    longSlice
                        ? backgroundGradientOuterRadius
                        : inactiveDistance + sliceLength;
                var dx = Math.cos(sliceDirection - halfTurn);
                var dy = -Math.sin(sliceDirection - halfTurn);
                context.beginPath();
                context.moveTo(
                    cx + (dx * inactiveDistance),
                    cy + (dy * inactiveDistance));
                context.lineTo(
                    cx + (dx * length),
                    cy + (dy * length));
                context.strokeStyle = 'black';
                context.lineWidth = 1;
                context.stroke();
            }
            if ((subtend != 0) && 
                (sliceIndex == (sliceCount - 1)) &&
                (selected ||
                 (pieTracker.sliceIndex == -1))) {
                var length =
                    selected
                        ? backgroundGradientOuterRadius
                        : inactiveDistance + sliceLength;
                var dx = Math.cos(sliceDirection + halfTurn);
                var dy = -Math.sin(sliceDirection + halfTurn);
                context.beginPath();
                context.moveTo(
                    cx + (dx * inactiveDistance),
                    cy + (dy * inactiveDistance));
                context.lineTo(
                    cx + (dx * length),
                    cy + (dy * length));
                context.strokeStyle = 'black';
                context.lineWidth = 1;
                context.stroke();
            }
        }

    }

    success();
}


function DrawToCanvas(params, drawer, success, error)
{
    var width = params.width;
    var height = params.height;
    var canvas = 
        d3.select('body')
            .append('canvas')
            .attr('width', width)
            .attr('height', height)
            .attr('style', 'display: none');
    var canvasNode =
        canvas.node();
    var context =
        canvasNode.getContext('2d');

    drawer(
        canvas,
        context,
        params,
        function() {
            var texture = null;
            switch (globals.driver) {

                case "WebGL":
                    var id = params.pie.backgroundSharedTextureID;
                    if (!id) {
                        params.pie.backgroundSharedTextureID = id = 
                            window.bridge._UnityJS_AllocateTexture(params.width, params.height);
                        //console.log("game.js: DrawToCanvas: WebGL: AllocateTexture: width: " + params.width + " height: " + params.height + " id: " + id);
                    }
                    var imageData =
                        context.getImageData(0, 0, params.width, params.height);
                    window.bridge._UnityJS_UpdateTexture(id, imageData);
                    texture = {
                        type: 'sharedtexture',
                        id: id
                    };
                    var uvRect = { x: 0, y: 0, width: 1, height: -1 };
                    success(texture, uvRect, params);
                    canvasNode.parentNode.removeChild(canvasNode);
                    break;

                default:
                    canvasNode.toBlob(function(blob) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            var data = e.target.result;
                            var texture = {
                                type: 'datauri',
                                uri: data,
                                width: width,
                                height: height
                            };
                            var uvRect = { x: 0, y: 0, width: 1, height: 1 };
                            success(texture, uvRect, params);
                            canvasNode.parentNode.removeChild(canvasNode);
                        };
                        reader.onerror = reader.onabort = function(e) {
                            error(params);
                            canvasNode.parentNode.removeChild(canvasNode);
                        };
                        reader.readAsDataURL(blob);
                    });
                    break;

            }
        }, 
        function() {
            error(params);
            canvasNode.parentNode.removeChild(canvasNode);
        });

}


function CreatePieTracker()
{
    var pieTracker = null;

    function CallHandler()
    {
        var handler = arguments[0];
        if (!handler) {
            return;
        }

        var args = [];
        var argCount = arguments.length; 
        for (var i = 1; i < argCount; i++) {
            args.push(arguments[i]);
        }

        //console.log("CALLHANDLER", handler, args);

        switch (typeof(handler)) {

            case "function":
                handler.apply(null, args);
                break;

            case "string":
                var f = SearchDefault(handler, pieTracker.pie, pieTracker.target, pieTracker, null);
                if (f) {
                    f.apply(null, args);
                } else {
                    console.log("game.js: PieTracker: CallHandler: target:", pieTracker.target, "missing handler:", handler);
                }
                break;

            case "object":
                if (Array.isArray(handler)) {
                    for (var i = 0, n = handler.length; i < n; i++) {
                        handler.id = pieTracker.target.id;
                        SendEvent(handler[i]);
                    }
                } else {
                    console.log("game.js: PieTracker: CallHandler: unexpected handler type:", handler);
                    handler.id = pieTracker.target.id;
                    SendEvent(handler);
                }
                break;

            default:
                console.log("game.js: PieTracker: CallHandler: unexpected handler type:", handler);
                break;

        }

    }


    function HandleStartPie(pie, target)
    {
        var handler = SearchDefault('onstartpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleStopPie(pie, target)
    {
        var handler = SearchDefault('onstoppie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleConstructPie(pie, target)
    {
        var handler = SearchDefault('onconstructpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleDeconstructPie(pie, target)
    {
        var handler = SearchDefault('ondeconstructpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleLayoutPie(pie, target)
    {
        var handler = SearchDefault('onlayoutpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleShowPie(pie, target)
    {
        var handler = SearchDefault('onshowpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleHidePie(pie, target)
    {
        var handler = SearchDefault('onhidepie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleCancelPie(pie, target)
    {
        var handler = SearchDefault('oncancelpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleSelectCenterPie(pie, target)
    {
        var handler = SearchDefault('onselectcenterpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleSelectPie(pie, target)
    {
        var handler = SearchDefault('onselectpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleSelectEmptySlice(sliceIndex, pie, target)
    {
        var handler = SearchDefault('onselectpie', pie, target, null);
        CallHandler(handler, sliceIndex, pie, target);
    }


    function HandleSelectSlice(slice, pie, target)
    {
        var handler = SearchDefault('onselectslice', slice, pie, target, null);
        CallHandler(handler, slice, pie, target);
    }


    function HandleSelectEmptyItem(itemIndex, slice, pie, target)
    {
        var handler = SearchDefault('onselectemptyitem', slice, pie, target, null);
        CallHandler(handler, itemIndex, slice, pie, target);
    }


    function HandleSelectItem(item, slice, pie, target)
    {
        var handler = SearchDefault('onselectitem', item, slice, pie, target, null);
        CallHandler(handler, item, slice, pie, target);
    }


    function HandleTrackPie(pie, target)
    {
        var handler = SearchDefault('ontrackpie', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleEnterPieCenter(pie, target)
    {
        var handler = SearchDefault('onenterpiecenter', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleTrackPieCenter(pie, target)
    {
        var handler = SearchDefault('ontrackpiecenter', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleExitPieCenter(pie, target)
    {
        //console.log("HandleExitPieCenter");
        var handler = SearchDefault('onexitpiecenter', pie, target, null);
        CallHandler(handler, pie, target);
    }


    function HandleEnterEmptySlice(sliceIndex, pie, target)
    {
        //console.log("HandleEnterEmptySlice", sliceIndex);
        var handler = SearchDefault('onenteremptyslice', pie, target, null);
        CallHandler(handler, sliceIndex, pie, target);
    }


    function HandleTrackEmptySlice(sliceIndex, pie, target)
    {
        var handler = SearchDefault('ontrackemptyslice', pie, target, null);
        CallHandler(handler, sliceIndex, pie, target);
    }


    function HandleExitEmptySlice(sliceIndex, pie, target)
    {
        //console.log("HandleExitEmptySlice", sliceIndex);
        var handler = SearchDefault('onexitemptyslice', pie, target, null);
        CallHandler(handler, sliceIndex, pie, target);
    }


    function HandleEnterSlice(slice, pie, target)
    {
        //console.log("HandleEnterSlice", slice, slice.items[0].label, slice.items[0].labelObject.id);
        var handler = SearchDefault('onenterslice', slice, pie, target, null);
        CallHandler(handler, slice, pie, target);
    }


    function HandleTrackSlice(slice, pie, target)
    {
        var handler = SearchDefault('ontrackslice', slice, pie, target, null);
        CallHandler(handler, slice, pie, target);
    }


    function HandleExitSlice(slice, pie, target)
    {
        //console.log("HandleExitSlice", slice, slice.items[0].label, slice.items[0].labelObject.id);
        var handler = SearchDefault('onexitslice', slice, pie, target, null);
        CallHandler(handler, slice, pie, target);
    }


    function HandleEnterEmptyItem(itemIndex, slice, pie, target)
    {
        //console.log("HandleEnterEmptyItem", itemIndex);
        var handler = SearchDefault('onenteritem', slice, pie, target, null);
        CallHandler(handler, itemIndex, slice, pie, target);
    }


    function HandleTrackEmptyItem(itemIndex, slice, pie, target)
    {
        var handler = SearchDefault('ontrackemptyitem', slice, pie, target, null);
        CallHandler(handler, itemIndex, slice, pie, target);
    }


    function HandleExitEmptyItem(itemIndex, slice, pie, target)
    {
        //console.log("HandleExitEmptyItem", itemIndex);
        var handler = SearchDefault('onexititem', slice, pie, target, null);
        CallHandler(handler, itemIndex, slice, pie, target);
    }


    function HandleEnterItem(item, slice, pie, target)
    {
        //console.log("HandleEnterItem", item.label, item.labelObject.id);
        if (item.labelObject) {
            UpdateObject(item.labelObject, {
                'textMesh/text': '<b>' + item.label
            });
        }
        var handler = SearchDefault('onenteritem', item, slice, pie, target, null);
        CallHandler(handler, item, slice, pie, target);
    }


    function HandleTrackItem(item, slice, pie, target)
    {
        var handler = SearchDefault('ontrackitem', item, slice, pie, target, null);
        CallHandler(handler, item, slice, pie, target);
    }


    function HandleExitItem(item, slice, pie, target)
    {
        //console.log("HandleExitItem", item.label, item.labelObject.id);
        if (item.labelObject == null) {
        }
        if (item.labelObject) {
            UpdateObject(item.labelObject, {
                'textMesh/text': item.label
            });
        }
        var handler = SearchDefault('onexititem', item, slice, pie, target, null);
        CallHandler(handler, item, slice, pie, target);
    }


    function PieTrackerView(pie)
    {
        var pieTrackerView = pie.pieTrackerView;
        if (pieTrackerView) {
            return pieTrackerView;
        }

        var viewSlices = [];
        var slices = pie.slices;
        if (slices && slices.length) {
            for (var sliceIndex = 0, sliceCount = slices.length; sliceIndex < sliceCount; sliceIndex++) {
                var slice = slices[sliceIndex] || {};
                var viewItems = [];
                var items = slice.items;
                if (items && items.length) {
                    for (var itemIndex = 0, itemCount = items.length; itemIndex < itemCount; itemIndex++) {
                        var item = items[itemIndex] || {};
                        var viewItem = {
                            itemDistance: SearchDefault('itemDistance', item, slice, pie, pieTracker.itemDistance)
                        }
                        viewItems.push(viewItem);
                    }
                }
                var viewSlice = {
                    items: viewItems,
                    sliceSize: SearchDefault('sliceSize', slice, pie, pieTracker.sliceSize)
                }
                viewSlices.push(viewSlice);
            }
        }

        pieTrackerView = {
           initialDirection: SearchDefault('initialDirection', pie, pieTracker.initialDirection),
           subtend: SearchDefault('subtend', pie, pieTracker.subtend),
           clockwise: SearchDefault('clockwise', pie, pieTracker.clockwise),
           inactiveDistance: SearchDefault('inactiveDistance', pie, pieTracker.inactiveDistance),
           itemDistance: SearchDefault('itemDistance', pie, pieTracker.itemDistance),
           slices: viewSlices
        };

        pie.pieTrackerView = pieTrackerView;

        return pieTrackerView;
    }


    function StartPie(position, pieID, target, pinned)
    {
        //console.log("StartPie", "position", position.x, position.y, "pieID", pieID, "target", target, "pinned", pinned, "PIES", Object.keys(pieTracker.pies));

        var pie = pieTracker.pie = 
            pieTracker.pies[pieID] ||
            null;

        if (!pie) {
            //console.log("no pie");
            pieTracker.tracking = false;
            return;
        }

        //pie.clockwise = false;

        pieTracker.tracking = true;
        pieTracker.pinned = pinned;
        pieTracker.target = target;
        pieTracker.slices = pie.slices ? pie.slices.length : 0;
        pieTracker.piePosition = position;

        UpdateInterests(pieTracker, {
            MousePositionChanged: true
        });

        var initialDirection = SearchDefault('initialDirection', pie, pieTracker.initialDirection);
        var subtend = SearchDefault('subtend', pie, pieTracker.subtend);
        var clockwise = SearchDefault('clockwise', pie, pieTracker.clockwise);
        var inactiveDistance = SearchDefault('inactiveDistance', pie, pieTracker.inactiveDistance);
        var itemDistance = SearchDefault('itemDistance', pie, pieTracker.itemDistance);
        //console.log("pieTrackerView:", pieTrackerView);

        UpdateObject(pieTracker, {
            trackingMousePosition: true,
            mousePositionChanged: true,
            mousePositionStart: position,
            mousePositionLast: {x: -1, y: -1},
            slices: pieTracker.slices,
            initialDirection: initialDirection,
            subtend: subtend,
            clockwise: clockwise,
            inactiveDistance: inactiveDistance,
            itemDistance: itemDistance
        });

        TrackPie(position, 0.0, 0.0, -1, -1, true);

        HandleStartPie(pie, target);

        ShowPie(position);
        //console.log("showed pie", pie);
    }


    function StopPie()
    {
        //console.log("StopPie", "pieTracker.tracking", pieTracker.tracking, "pieTracker.pie" , pieTracker.pie);

        var pie = pieTracker.pie;
        if (!pie)  {
            return;
        }

        var pinnable = SearchDefault('pinnable', pie, pieTracker.pinnable);
        if (pinnable && 
            !pieTracker.pinned &&
           (pieTracker.sliceIndex < 0)) {
            pieTracker.pinned = true;
            return;
        }

        var stayUp =
            ((pieTracker.sliceIndex >= 0) &&
             (pie.slices[pieTracker.sliceIndex].stayUp ||
              ((pieTracker.itemIndex >= 0) &&
               pie.slices[pieTracker.sliceIndex] &&
               pie.slices[pieTracker.sliceIndex].items &&
               pie.slices[pieTracker.sliceIndex].items[pieTracker.itemIndex] &&
               pie.slices[pieTracker.sliceIndex].items[pieTracker.itemIndex].stayUp)));

        if (!stayUp) {

            HidePie();

            pieTracker.tracking = false;

            UpdateObject(pieTracker, {
                trackingMousePosition: false
            });

            var nextPieID = null;
            var target = pieTracker.target;

            HandleStopPie(pie, target);

        }

        if (pieTracker.sliceIndex < 0) {

            HandleSelectCenterPie(pie, target);

            nextPieID = pie.centerPieID;

        } else {

            HandleSelectPie(pie, target);

            var slice = pieTracker.slice;
            if (!slice) {

                HandleSelectEmptySlice(pieTracker.sliceIndex, pie, target);

            } else {

                HandleSelectSlice(slice, pie, target);

                var item = pieTracker.item;
                if (item) {

                    HandleSelectItem(item, slice, pie, target);

                    nextPieID = item.pieID;

                }

            }

        }

        if (stayUp) {
            // TODO: Make sure the current item gets reselected without flickering.
        } else {
            TrackPie(pieTracker.mousePosition, 0.0, 0.0, -1, -1, true);
        }

        if (nextPieID) {
            StartPie(pieTracker.mousePosition, nextPieID, pieTracker.target, true);
        }

    }


    function ConstructPie(pie)
    {
        if (!pie) {
            return;
        }

        if (!pie.freeLabels) {
            pie.freeLabels = [];
        }

        if (!pie.usedLabels) {
            pie.usedLabels = [];
        }

        UpdateObject(pieTracker, {
            pie: PieTrackerView(pie)
        });

        if (!pie.groupObject) {

            pie.groupObject = CreatePrefab({
                prefab: 'Prefabs/PieGroup',
                parent: 'object:' + globals.textOverlays.id + '/overlay',
                update: {
                    'gameObject/method:SetActive': [false]
                }
            });

        }

    }


    function DeconstructPie(pie)
    {
        if (!pie) {
            return;
        }

        if (pie.labelObject) {
            delete pie.labelObject;
        }

        var slices = pie.slices;
        if (slices) {
            slices.forEach(function (slice) {
                if (slice.items) {
                    slice.items.forEach(function (item) {
                        if (item.labelObject) {
                            delete item.labelObject;
                        }
                    });
                }
            });
        }

        if (pie.freeLabels) {
            pie.freeLabels.forEach(DeleteObject);
            pie.freeLabels = [];
        }

        if (pie.usedLabels) {
            pie.usedLabels.forEach(DeleteObject);
            pie.usedLabels = [];
        }

        if (pie.groupObject) {
            DestroyObject(pie.groupObject);
            delete pie.groupObject;
        }

    }


    function LayoutPie(pie)
    {
        //console.log("LayoutPie", pie);

        if (!pie) {
            return;
        }

        function MakeLabel()
        {
            var label;
            if (pie.freeLabels.length) {
                label = pie.freeLabels.pop();
            } else {
                 label = CreatePrefab({
                    obj: {
                        active: true
                    },
                    prefab: 'Prefabs/OverlayText',
                    parent: 'object:' + pie.groupObject.id
                });
            }
            pie.usedLabels.push(label);
            return label;
        }

        ConstructPie(pie);

        if (pie.usedLabels.length) {
            pie.usedLabels.forEach(function (label) {
                pie.freeLabels.push(label);
            });
            pie.usedLabels = [];
        }

        var initialDirection = SearchDefault('initialDirection', pie, pieTracker.initialDirection);
        var subtend = SearchDefault('subtend', pie, pieTracker.subtend);
        var clockwise = SearchDefault('clockwise', pie, pieTracker.clockwise);
        var inactiveDistance = SearchDefault('inactiveDistance', pie, pieTracker.inactiveDistance);
        var itemDistance = SearchDefault('itemDistance', pie, pieTracker.itemDistance);
        var maxDistance = 0;

        var slices = pie.slices;
        if (slices && slices.length) {
            var sliceCount = slices.length;
            var clockSign = clockwise ? -1 : 1;

            var sliceSizeTotal = 0.0;
            slices.forEach(function (slice) {
                var sliceSize = 
                    (slice && ('sliceSize' in slice))
                        ? slice.sliceSize
                        : 1;
                sliceSizeTotal += sliceSize;
            });

            var pieSubtend = 
                (subtend == 0.0) 
                    ? (2.0 * Math.PI)
                    : subtend;
            var sliceSizeScale =
                (sliceSizeTotal == 0) 
                    ? 1 
                    : (pieSubtend / sliceSizeTotal);
            var sliceDirection = initialDirection;
            var firstSlice = true;

            var sliceIndex = 0;
            slices.forEach(function (slice) {

                var sliceSize = 
                    (slice && ('sliceSize' in slice))
                        ? slice.sliceSize
                        : 1;
                var sliceSubtend = sliceSize * sliceSizeScale;
                var halfTurn = 0.5 * clockSign * sliceSubtend;

                if (firstSlice) {
                    firstSlice = false;
                    // If the subtend was zero, use the whole pie, but start the first slice centered no the initial direction.
                    if (subtend == 0.0) {
                        sliceDirection -= halfTurn;
                    }
                }

                sliceDirection += halfTurn;

                var dx = Math.cos(sliceDirection);
                var dy = Math.sin(sliceDirection);

                slice.sliceDirection = sliceDirection;
                slice.sliceSubtend = sliceSubtend;
                slice.dx = dx;
                slice.dy = dy;

                var items = slice.items;
                if (items) {

                    var vertical = Math.abs(dx) < 0.001;
                    var pivot = {
                        x: (vertical
                            ? 0.5
                            : ((dx < 0)
                                ? 1.0
                                : 0.0)),
                        y: (vertical
                            ? ((dy < 0)
                                ? 1.0
                                : 0.0)
                            : 0.5)
                    };

                    var itemLabelDistance = SearchDefault('itemLabelDistance', slice, pie, pieTracker.itemLabelDistance);

                    var itemIndex = 0;
                    items.forEach(function (item) {
                        //console.log("LayoutPie item:", JSON.stringify(item));

                        if (!item.label) {
                            delete item.labelObject;
                        } else {
                            var itemLabelPosition = SearchDefault('itemLabelPosition', item, slice, pie, pieTracker.itemLabelPosition);
                            var itemLabelOffset = SearchDefault('itemLabelOffset', item, slice, pie, pieTracker.itemLabelOffset);
                            var anchor = itemLabelPosition || {
                                x: itemLabelOffset.x + (dx * (itemLabelDistance + (itemDistance * itemIndex))),
                                y: itemLabelOffset.y + (dy * (itemLabelDistance + (itemDistance * itemIndex)))
                            };

                            item.labelObject = MakeLabel();

                            var itemSelected =
                                (sliceIndex == pieTracker.sliceIndex) &&
                                (itemIndex  == pieTracker.itemIndex);
                            var itemLabel =
                                (itemSelected ? '<b>' : '') +
                                item.label;

                            var update = {
                                'textMesh/text': itemLabel,
                                'textMesh/fontSize': SearchDefault('itemLabelFontSize', item, slice, pie, pieTracker.itemLabelFontSize),
                                'textMesh/color': SearchDefault('itemLabelFontColor', item, slice, pie, pieTracker.itemLabelFontColor),
                                'textMesh/alignment': SearchDefault('itemLabelAlignment', item, slice, pie, pieTracker.itemLabelAlignment),
                                'component:RectTransform/anchoredPosition': SearchDefault('pieLabelPosition', pie, pieTracker.pieLabelPosition),
                                'component:RectTransform/pivot': pivot,
                                'component:RectTransform/anchoredPosition': anchor
                            };

                            if (!item.labelObject.active) {
                                update['gameObject/method:SetActive'] = [true];
                                item.labelObject.active = true;
                            }

                            UpdateObject(item.labelObject, update);
                        }

                        itemIndex++;
                    });

                }

                sliceDirection += halfTurn;
                sliceIndex++;
            });

        }

        if (!pie.label) {
            delete pie.labelObject;
        } else {

            pie.labelObject = MakeLabel();

            var update = {
                'textMesh/text': pie.label,
                'textMesh/fontSize': SearchDefault('pieLabelFontSize', pie, pieTracker.pieLabelFontSize),
                'textMesh/color': SearchDefault('pieLabelFontColor', pie, pieTracker.pieLabelFontColor),
                'textMesh/alignment': SearchDefault('pieLabelAlignment', pie, pieTracker.pieLabelAlignment),
                'component:RectTransform/pivot': { x: 0.5, y: 0.5 },
                'component:RectTransform/anchoredPosition': SearchDefault('pieLabelPosition', pie, pieTracker.pieLabelPosition)
            };

            if (!pie.labelObject.active) {
                update['gameObject/method:SetActive'] = [true];
                pie.labelObject.active = true;
            }

            UpdateObject(pie.labelObject, update);

        }

        if (pie.freeLabels.length) {
            pie.freeLabels.forEach(function (label) {
                if (label.active) {
                    UpdateObject(label, {
                        'gameObject/method:SetActive': [false]
                    });
                    label.active = false;
                }
            });
        }

        var groupSize = {
            x: itemDistance * 2,
            y: itemDistance * 2
        };
        UpdateObject(pie.groupObject, {
            'component:RectTransform/sizeDelta': groupSize
        });

        var target = pieTracker.target;

        HandleLayoutPie(pie, target);
    }


    function ShowPie(position)
    {
        var pie = pieTracker.pie;
        if (!pie) {
            return;
        }

        LayoutPie(pie);

        pie.position = position;

        var cx = pieTracker.screenSize.x * 0.5;
        var cy = pieTracker.screenSize.y * 0.5;

        var screenPosition = {
            x: position.x - cx, 
            y: position.y - cy
        };

        UpdateObject(pie.groupObject, {
            'component:RectTransform/anchoredPosition': screenPosition,
            'gameObject/method:SetActive': [true]
        });

        var target = pieTracker.target;

        HandleShowPie(pie, target);
        DrawPieBackground(pie, target);
    }


    function HidePie()
    {
        var pie = pieTracker.pie;
        var target = pieTracker.target;
        if (!pie || !pie.groupObject) {
            return;
        }

        UpdateObject(pie.groupObject, {
            'gameObject/method:SetActive': [false]
        });

        //DeconstructPie(pie);


        HandleHidePie(pie, target);
    }


    function TrackPie(position, distance, direction, nextSliceIndex, nextItemIndex, reset)
    {
        //console.log("TrackPie", "pieTracker.tracking", pieTracker.tracking, "pieTracker.pie" , pieTracker.pie);

        var pie = pieTracker.pie;
        var target = pieTracker.target;
        if (!pie)  {
            console.log("TrackPie: called with null pieTracker.pie! ");
            return;
        }

        var lastSliceIndex = 
            pieTracker.sliceIndex;

        var lastSlice = 
            (pie.slices && 
             (lastSliceIndex >= 0))
                ? pie.slices[lastSliceIndex]
                : null;

        var lastItemIndex = 
            pieTracker.itemIndex;

        var lastItem = 
            (lastSlice && 
             lastSlice.items &&
              (lastItemIndex >= 0))
                ? lastSlice.items[Math.min(lastItemIndex, lastSlice.items.length - 1)]
                : null;

        var nextSlice = 
            ((nextSliceIndex >= 0) &&
             pie.slices)
                ? pie.slices[nextSliceIndex]
                : null;

        var nextItem =
            (nextSlice &&
             nextSlice.items &&
             (nextItemIndex >= 0))
                ? nextSlice.items[Math.min(nextItemIndex, nextSlice.items.length - 1)]
                : null;

        var changedSlice = 
            lastSliceIndex != nextSliceIndex;

        var changedItem = 
            changedSlice || 
            (lastItemIndex != nextItemIndex);

        pieTracker.mousePosition = position;
        pieTracker.distance = distance;
        pieTracker.direction = direction;
        pieTracker.sliceIndex = nextSliceIndex;
        pieTracker.itemIndex = nextItemIndex;
        pieTracker.slice = nextSlice;
        pieTracker.item = nextItem;

        if (changedSlice) {

            if (lastSlice) {
                if (lastItem) {
                    HandleExitItem(lastItem, lastSlice, pie, target);
                } else {
                    HandleExitEmptyItem(lastItemIndex, lastSlice, pie, target);
                }
            } 

            if (lastSliceIndex < 0) {

                HandleExitPieCenter(pie, target);

            } else {

                if (lastSlice) {
                    HandleExitSlice(lastSlice, pie, target);
                } else {
                    HandleExitEmptySlice(lastSliceIndex, pie, target);
                }

            }

            if (nextSliceIndex < 0) {
                HandleEnterPieCenter(pie, target);
                DrawPieBackground(pie, target);
            } else {

                if (nextSlice) {
                    HandleEnterSlice(nextSlice, pie, target);
                    DrawPieBackground(pie, target);

                    if (nextItem) {
                        HandleEnterItem(nextItem, nextSlice, pie, target);
                    } else {
                        HandleEnterEmptyItem(nextItemIndex, nextSlice, pie, target);
                    }

                } else {
                    HandleEnterEmptySlice(nextSliceIndex, pie, target);
                    DrawPieBackground(pie, target);
                }

            }

        } else if (changedItem) {

            if (lastItem) {
                HandleExitItem(lastItem, lastSlice, pie, target);
            } else {
                HandleExitEmptyItem(lastItemIndex, lastSlice, pie, target);
            }

            if (nextItem) {
                HandleEnterItem(nextItem, nextSlice, pie, target);
            } else {
                HandleEnterEmptyItem(nextItemIndex, nextSlice, pie, target);
            }

        }

        HandleTrackPie(pie, target);

        if (nextSliceIndex < 0) {

            HandleTrackPieCenter(pie, target);

        } else {

            if (pieTracker.slice) {
                HandleTrackSlice(nextSlice, pie, target);
                if (nextItem) {
                    HandleTrackItem(nextItem, nextSlice, pie, target);
                } else {
                    HandleTrackEmptyItem(nextItemIndex, nextSlice, pie, target);
                }
            } else {
                HandleTrackEmptySlice(nextSliceIndex, pie, target);
            }

        }

    }


    globals.pieTracker = pieTracker = CreatePrefab({
        prefab: 'Prefabs/PieTracker', 
        obj: {
            doNotDelete: true,
            pie: null,
            tracking: false,
            strokable: true,
            clickDistance: 5,
            clickDuration: 0.5,
            clickStartTime: -1,
            clickStartPosition: {x: 0, y: 0},
            pinned: false,
            pinnable: true,
            target: null,
            id: 'main',
            slices: 8,
            initialDirection: 0.5 * Math.PI,
            subtend: 0,
            clockwise: true,
            inactiveDistance: 30,
            itemDistance: 50,
            drawBackground: 'DrawBackground_Pie',
            drawBackgroundGradient: true,
            backgroundGradientInnerRadius: 50,
            backgroundGradientOuterRadius: 250,
            drawInactiveCircle: true,
            drawSlices: true,
            sliceLength: 10,
            sliceLengthSelected: 100,
            startMousePosition: null,
            trackMousePosition: null,
            screenSize: { x: 640, y: 480 },
            mousePosition: null,
            mousePositionDelta: null,
            distance: 0,
            direction: 0,
            sliceIndex: -1,
            itemIndex: -1,
            slice: null,
            item: null,
            pieLabelFontSize: 22,
            pieLabelFontColor: '#ffffff',
            pieLabelPosition: { x: 0, y: 0 },
            itemLabelFontSize: 18,
            itemLabelFontColor: '#ffffff',
            itemLabelDistance: 75,
            itemLabelOffset: { x: 0, y: 0 },
            itemLabelPosition: null,
            DeconstructPie: DeconstructPie,
            LayoutPie: LayoutPie,
            DrawPieBackground: DrawPieBackground,
            pies: {

                'navigate': {
                    label: 'Navigate',
                    slices: [
                        {
                            items: [
                                {
                                    label: "Approach",
                                    onenteritem: function(item, slice, pie, target) {
                                        //console.log("Approach ENTER", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: (globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.wheelZoomScale
                                        });
                                    },
                                    ontrackitem: function(item, slice, pie, target) {
                                        //console.log("Approach TRACK", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: (globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.wheelZoomScale
                                        });
                                    },
                                    onexititem: function(item, slice, pie, target) {
                                        //console.log("Approach EXIT", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: 0
                                        });
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    label: "Turn =>",
                                    onenteritem: function(item, slice, pie, target) {
                                        //console.log("Turn => ENTER", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: (globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.yawScale
                                        });
                                    },
                                    ontrackitem: function(item, slice, pie, target) {
                                        //console.log("Turn => TRACK", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: (globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.yawScale
                                        });
                                    },
                                    onexititem: function(item, slice, pie, target) {
                                        //console.log("Turn => EXIT", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: 0
                                        });
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    label: "Retreat",
                                    onenteritem: function(item, slice, pie, target) {
                                        //console.log("Retreat ENTER", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: -(globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.wheelZoomScale
                                        });
                                    },
                                    ontrackitem: function(item, slice, pie, target) {
                                        //console.log("Retreat TRACK", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: -(globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.wheelZoomScale
                                        });
                                    },
                                    onexititem: function(item, slice, pie, target) {
                                        //console.log("Retreat EXIT", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            wheelZoomVelocity: 0
                                        });
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    label: "<= Turn",
                                    onenteritem: function(item, slice, pie, target) {
                                        //console.log("<= Turn ENTER", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: -(globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.yawScale
                                        });
                                    },
                                    ontrackitem: function(item, slice, pie, target) {
                                        //console.log("<= Turn TRACK", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: -(globals.pieTracker.distance - globals.pieTracker.inactiveDistance) * globals.world.pie.yawScale
                                        });
                                    },
                                    onexititem: function(item, slice, pie, target) {
                                        //console.log("<= Turn EXIT", globals.pieTracker.distance);
                                        UpdateObject(globals.proCamera, {
                                            yawVelocity: 0
                                        });
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        },
        update: {
            tracking: true,
            trackingMouseButton: true,
            trackingMousePosition: false
        },
        interests: {
            MouseButtonDown: {
                query: {
                    screenSize: "screenSize",
                    mousePosition: "mousePosition",
                    mouseRaycastResult: "mouseRaycastResult",
                    mouseRaycastHitPoint: "mouseRaycastHit/point",
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonDown: results:", JSON.stringify(results), "pieTracker.tracking:", pieTracker.tracking);

                    pieTracker.screenSize = results.screenSize;
                    pieTracker.mouseRaycastHitPoint = results.mouseRaycastHitPoint;

                    if (pieTracker.tracking) {
                        //console.log("PieTracker: MouseButtonDown: already tracking pie so ignoring. updating pieTracker.mousePosition from", pieTracker.mousePosition, "to", results.mousePosition);
                        pieTracker.mousePosition = results.mousePosition;
                        return;
                    }

                    var target =
                        results.mouseRaycastResult
                            ? globals.objects[results.mouseRaycastHitBridgeObjectID]
                            : null;

                    var pieID = 
                        target ? target.pieID : (globals.tuning && globals.tuning.backgroundPieID);

                    //console.log("game.js: PieTracker: MouseButtonDown:", "mouseRaycastHitBridgeObjectID", results.mouseRaycastHitBridgeObjectID, "target:", target, (target ? target.id : ""), "pieID", pieID);

                    if (pieID) {

                        var pie = pieTracker.pies[pieID];
                        if (!pie) {
                            console.log("game.js: PieTracker: MouseButtonDown:", "undefined pieID:", pieID);
                            return;
                        }

                        pieTracker.clickStartPosition = results.mousePosition;
                        pieTracker.clickStartTime = new Date();

                        var strokable = true; // SearchDefault('strokable', pie, pieTracker.strokable);
                        if (strokable) {
                            StartPie(results.mousePosition, pieID, target, false);
                        } else {
                            pieTracker.clickPieID = pieID;
                        }

                    }

                }
            },
            MouseButtonUp: {
                query: {
                    mousePosition: "mousePosition",
                    distance: "distance",
                    direction: "direction",
                    sliceIndex: "sliceIndex",
                    itemIndex: "itemIndex"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonUp: results:", results, "pieTracker.tracking:", pieTracker.tracking);

                    if (!pieTracker.tracking) {
                        return;
                    }

                    TrackPie(
                        results.mousePosition, 
                        results.distance, 
                        results.direction, 
                        results.sliceIndex, 
                        results.itemIndex,
                        false);

                    var pie = pieTracker.pie;
                    if (pie) {
                        StopPie();
                    }

                }
            },
            MouseButtonChanged: {
                disabled: true,
                query: {
                    mouseButton: "mouseButton"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonChanged: results:", results, "pieTracker.tracking:", pieTracker.tracking);
                }
            },
            MousePositionChanged: {
                disabled: true,
                query: {
                    mousePosition: "mousePosition",
                    distance: "distance",
                    direction: "direction",
                    sliceIndex: "sliceIndex",
                    itemIndex: "itemIndex"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MousePositionChanged: results:", results, "pieTracker.tracking:", pieTracker.tracking);

                    if (!pieTracker.tracking) {
                        return;
                    }

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
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonDownUI: results:", results);
                }
            },
            MouseButtonUpUI: {
                query: {
                    mousePosition: "mousePosition",
                    mouseRaycastResult: "mouseRaycastResult",
                    mouseRaycastHitBridgeObjectID: "mouseRaycastHitBridgeObjectID?"
                },
                handler: function (obj, results) {
                    //console.log("PieTracker: MouseButtonUpUI: results:", results);
                }
            }
        }
    });


}


function DrawPieBackground(pie, target)
{
    //console.log("game.js: DrawPieBackground: pie:", pie);
    var pieTracker = globals.pieTracker;

    var drawBackgroundName = SearchDefault('drawBackground', pie, pieTracker.drawBackground);
    var drawBackground = eval(drawBackgroundName);

    var params = {
        width: 512, 
        height: 512, 
        pie: pie,
        target: target
    };

    DrawToCanvas(params,
        drawBackground,
        function(texture, uvRect, params) {
            //console.log("pie DrawToCanvas success", texture);
            UpdateObject(pie.groupObject, {
                'component:RectTransform/sizeDelta': {
                    x: params.width, 
                    y: params.height 
                },
                'component:UnityEngine.UI.RawImage/texture': texture,
                'component:UnityEngine.UI.RawImage/uvRect': uvRect
            });
        },
        function(params) {
            console.log("pie DrawToCanvas error", params);
        });
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
        globals.ranges = data.ranges;

        //console.log("sheets", globals.sheets, "ranges", globals.ranges);

        if (!globals.sheets[globals.configuration]) {
            console.log("game.js: LoadObjects: Finished loading sheets, but configuration sheet '" + globals.configuration + "' was not loaded!");
            return;
        }

        var scope = SheetToScope(globals.sheets, globals.ranges, globals.configuration);
        globals.scope = scope;

        var error = scope.error;
        var world = scope.value;

        if (error) {
            console.log("game.js: LoadObjects: LoadSheetsSuccess: Error loading world. Error in sheetName:", scope.errorScope.errorSheetName, "row:", scope.errorScope.errorRow, "column:", scope.errorScope.errorColumn, "error:", error, "errorScope:", scope.errorScope);
        } else if (!world) {
            console.log("game.js: LoadObjects: LoadSheetsSuccess: Loaded world but it was null.", "scope:", scope);
        } else {
            globals.world = world;
            //console.log("game.js: LoadObjects: LoadSheetsSuccess: Loaded world:", world, "scope:", scope);
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
        LoadSheets(gSheetsIndex, LoadedSheetsSuccess, LoadedSheetsError);
    }

}


function CreateLoadedObjects()
{
    //console.log("game.js: CreateLoadedObjects");

    var world = globals.world;

    if (world.createTemplatedObjects) {
        CreateTemplatedObjects();
    }

    if (world.createMap) {
        CreateMap();
    }

    if (world.createBlobs) {
        CreateBlobs();
    }

    if (world.createJsonsters) {
        CreateJsonsters();
    }

    if (world.createPies) {
        CreatePies();
    }

    if (world.createPlaces) {
        CreatePlaces();
    }

    if (world.createTests) {
        CreateTests();
    }

    if (world.createPrivate) {
        CreatePrivate();
    }

}


function CreateTemplatedObjects()
{
    var world = globals.world;
    var templatedObjectNames = world.templatedObjectNames;
    var templates = world.templates;

    for (var nameIndex = 0, nameCount = templatedObjectNames.length; 
         nameIndex < nameCount; 
         nameIndex++) {

        var name = templatedObjectNames[nameIndex];
        var template = templates[name];

        //console.log("game.js: CreateTemplatedObjects:", name, template, "nameIndex", nameIndex, "nameCount", nameCount);

        globals[name] = CreatePrefab(template);
    }
}


function CreateMap()
{
    var world = globals.world;
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
                        update: {
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
                                handler: function(obj, results) {
                                    //console.log("MouseDown on Hex", "x", obj.x, "y", obj.y, "position", results.position, "prefabName", obj.prefabName);
                                    if (obj.onMouseDown) obj.onMouseDown(obj, results);
                                }
                            },
                            DragStart: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, results) {
                                    //console.log("DragStart on Hex", "x", obj.x, "y", obj.y, "position", results.position, "prefabName", obj.prefabName);
                                    if (obj.onDragStart) obj.onDragStart(obj, results);
                                }
                            },
                            DragMove: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, results) {
                                    //console.log("DragMove on Hex", "x", obj.x, "y", obj.y, "position", results.position, "prefabName", obj.prefabName);
                                    if (obj.onDragMove) obj.onDragMove(obj, results);
                                }
                            },
                            DragStop: {
                                query: {
                                    position: "transform/localPosition"
                                },
                                handler: function(obj, results) {
                                    //console.log("DragStop on Hex", "x", obj.x, "y", obj.y, "position", results.position, "prefabName", obj.prefabName);
                                    if (obj.onDragStop) obj.onDragStop(obj, results);
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
                            obj: {
                                x: x,
                                y: y,
                                tileX: tileX,
                                tileY: tileY
                            }, 
                            prefab: vegPrefabName, 
                            parent: 'object:' + tilePrefab.id,
                            update: {
                                "transform/localPosition": {
                                    x: tileX, 
                                    y: tileZ, 
                                    z: tileY
                                }
                            }, 
                            interests: {
                                MouseDown: {
                                    query: {
                                        position: "transform/localPosition"
                                    },
                                    handler: function(obj, results) {
                                        //console.log("MouseDown on Veg", obj.x, obj.y, results.position, obj.prefabName);
                                    }
                                }
                            }

                        });

                    prefabs.push(vegPrefab);

                }

                row.push(prefabs);

            })(x, y, tileY);

        }

    }

}


function CreateBlobs()
{
    var world = globals.world;
    var id = 0;
    var blobs = world.blobs;
    var blobData = blobs.blobData;
    var bloopData = blobs.bloopData;
    var bleepData = blobs.bleepData;
    var tinyScale = { x: 0.01, y: 0.01, z: 0.01 };
    var label;
    var t;

    var interests = {
        MouseEnter: {
            update: {
                'component:Rigidbody/maxAngularVelocity': 100,
                'component:Rigidbody/drag': 2,
                'component:Rigidbody/angularVelocity': { x: 0, y: 20, z: 0 },
                'transform:Ball/transform:A/component:MeshRenderer/material/color': { r: 1, g: 0, b: 0 },
                'transform:Ball/transform:B/component:MeshRenderer/material/color': { r: 0, g: 1, b: 1 }
            },
            events: [
                {
                    event: 'Animate',
                    data: [
                        {
                            command: 'scale',
                            target: 'transform:Ball',
                            time: 0.2,
                            to: { x: 2, y: 2, z: 2 }
                        }
                    ]
                }
            ],
            doNotSend: true
        },
        MouseExit: {
            update: {
                'component:Rigidbody/velocity': { x: 0, y: 150, z: 0 },
                'component:Rigidbody/drag': .1,
                'transform:Ball/transform:A/component:MeshRenderer/material/color': { r: 0, g: 0, b: 1 },
                'transform:Ball/transform:B/component:MeshRenderer/material/color': { r: 0, g: 1, b: 0 }
            },
            events: [
                {
                    event: 'Animate',
                    data: [
                        {
                            command: 'scale',
                            target: 'transform:Ball',
                            time: 2,
                            to: { x: 1, y: 1, z: 1 }
                        }
                    ]
                }
            ],
            doNotSend: true
        }
    };

    var blob = CreatePrefab({
        prefab: 'Prefabs/Bubble',
        component: 'Tracker',
        obj: {
            bloops: []
        },
        update: {
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
                        to: blobData.size,
                        time: blobData.animateTime
                    }
                ]
            }
        ],
        interests: interests
    });

    globals.blob = blob;

    label = null; t = null;

    if (blobData.createProText) {
        label = CreatePrefab({
            prefab: "Prefabs/ProText",
            update: {
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
            "component:RectTransform/sizeDelta": { x: 100, y: 50 }
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
            obj: {
                //blob: blob,
                index: bloopIndex,
                bleeps: []
            },
            update: {
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
                            to: bloopData.size,
                            time: bloopData.animateTime
                        }
                    ]
                }
            ],
            interests: interests

        });

        blob.bloops.push(bloop);

        label = null; t = null;

        if (bloopData.createProText) {
            label = CreatePrefab({
                prefab: "Prefabs/ProText",
                update: {
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
                "component:RectTransform/sizeDelta": { x: 100, y: 50 }
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
                obj: {
                    //bloop: bloop,
                    index: bleepIndex
                },
                update: {
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
                                to: bleepData.size,
                                time: bleepData.animateTime
                            }
                        ]
                    }
                ],
                interests: interests
            });

            bloop.bleeps.push(bleep);

            label = null; t = null;

            if (bleepData.createProText) {
                label = CreatePrefab({
                    prefab: "Prefabs/ProText",
                    update: {
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
                    "component:RectTransform/sizeDelta": { x: 100, y: 50 }
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
}


function CreatePies()
{
    var world = globals.world;
    var pieTracker = globals.pieTracker;

    if (!pieTracker) {
        return;
    }

    Object.assign(pieTracker.pies, world.pie.pies);

}


function CreatePlaces()
{
    var world = globals.world;
    var places = world.places;
    var connections = world.connections;
    var placeObjectsByName = world.placeObjectsByName = {};
    var placeObjectsByID = world.placeObjectsByID = {};
    world.draggingPlace = null;
    world.draggingPlaceKissed = {};

    for (var placeIndex = 0, placeCount = places.length; placeIndex < placeCount; placeIndex++) {

        var place = places[placeIndex];

        var anchorObject =  CreatePrefab({
            "prefab": "Prefabs/Anchor",
            "update": {
                "transform/localPosition": place.position,
                dragTracking: true,
                "component:Rigidbody/drag": 10,
                "component:Rigidbody/isKinematic": true
            },
            interests: {
                DragStart: {
                    handler: function(obj, results) {
                        world.draggingPlace = obj.placeObject;
                        world.draggingPlaceKissed = {};
                        //console.log("game.js: Place Anchor: DragStart", obj.id);
                    }
                },
                DragStop: {
                    handler: function(obj, results) {
                        world.draggingPlace = null;
                        //console.log("game.js: Place Anchor: DragStop", obj.id);
                        QueryObject(obj.placeObject, {
                                position: 'transform/position'
                            }, function(results) {
                                //console.log("Moving anchor " + obj.id + " to " + results.position.x + " " + results.position.y + " " + results.position.z);
                                UpdateObject(obj, {
                                    "transform/position": results.position
                                });
                            });
                    }
                }
            }
        });

        var placeSpring = 100;
        var placeDamper = 10;
        var placeDrag = 10;

        var placeObject = CreatePrefab({
            "prefab": "Prefabs/Place",
            "obj": {
                connections: []
            },
            "update": {
                "transform/localPosition": place.position,
                "transform/localScale": place.size,
                "component:Collider/sharedMaterial": "PhysicMaterials/HighFrictionLowBounce",
                "component:Rigidbody/isKinematic": false,
                "component:Rigidbody/drag": placeDrag,
                "component:Rigidbody/constraints": "FreezePositionY,FreezeRotationX,FreezeRotationY,FreezeRotationZ",
                "component:SpringJoint/spring": placeSpring,
                "component:SpringJoint/damper": placeDamper,
                "component:SpringJoint/autoConfigureConnectedAnchor": false,
                "component:SpringJoint/enableCollision": true,
                "component:SpringJoint/connectedBody!": "object:" + anchorObject.id + "/component:Rigidbody",
                "component:TrackerProxy/target!": "object:" + anchorObject.id,
                "tiles/index:0/textureScale": {
                    "x": place.size.x * place.topTextureZoom,
                    "y": place.size.z * place.topTextureZoom
                },
                "tiles/index:0/component:MeshRenderer/material": place.topMaterial,
                "tiles/index:1/textureScale": {
                    "x": place.size.x * place.bottomTextureZoom,
                    "y": place.size.z * place.bottomTextureZoom
                },
                "tiles/index:1/component:MeshRenderer/material": place.bottomMaterial,
                "tiles/index:2/textureScale": {
                    "x": place.size.x * place.sideTextureZoom,
                    "y": place.size.y * place.sideTextureZoom
                },
                "tiles/index:2/component:MeshRenderer/material": place.sideMaterial,
                "tiles/index:3/textureScale": {
                    "x": place.size.x * place.sideTextureZoom,
                    "y": place.size.y * place.sideTextureZoom
                },
                "tiles/index:3/component:MeshRenderer/material": place.sideMaterial,
                "tiles/index:4/textureScale": {
                    "x": place.size.z * place.sideTextureZoom,
                    "y": place.size.y * place.sideTextureZoom
                },
                "tiles/index:4/component:MeshRenderer/material": place.sideMaterial,
                "tiles/index:5/textureScale": {
                    "x": place.size.z * place.sideTextureZoom,
                    "y": place.size.y * place.sideTextureZoom
                },
                "tiles/index:5/component:MeshRenderer/material": place.sideMaterial
            },
            interests: {
                CollisionEnter: {
                    query: {
                        collisionGameObjectName: 'collision/gameObject/name',
                        collisionObjectID: 'collision/gameObject/component:BridgeObject?/id',
                        collisionImpulse: 'collision/impulse',
                        collisionRelativeVelocity: 'collision/relativeVelocity'
                    },
                    handler: function(obj, results) {
                        // Ignore if not another place.
                        //console.log("game.js: Place: CollisionEnter", obj.id, JSON.stringify(results));
                        var collisionPlace = world.placeObjectsByID[results.collisionObjectID];
                        if ((!collisionPlace) ||
                             (world.draggingPlace != obj)) {
                            return;
                        }
                        world.draggingPlaceKissed[results.collisionObjectID] = true;
                        //console.log("KISS", obj.id, results.collisionObjectID, JSON.stringify(world.draggingPlaceKissed), JSON.stringify(results));
                        var foundConnection = null;
                        for (var i = 0, n = obj.connections.length; i < n; i++) {
                            var connection = obj.connections[i];
                            if ((connection.placeFrom == collisionPlace) ||
                                (connection.placeTo == collisionPlace)) {
                                foundConnection = connection;
                                break;
                            }
                        }
                        if (foundConnection == null) {
                            var newConnection = CreateRainbow('connection', obj, collisionPlace);
                            newConnection.placeFrom = obj;
                            newConnection.placeTo = collisionPlace;
                            obj.connections.push(newConnection);
                            collisionPlace.connections.push(newConnection);
                            //console.log("Creating connection", newConnection, newConnection.placeFrom.id, newConnection.placeTo.id);
                        } else {
                            //console.log("Destroying connection", foundConnection, foundConnection.placeFrom, foundConnection.placeTo);
                            //console.log(foundConnection.placeFrom.id, foundConnection.placeTo.id);
                            i = foundConnection.placeTo.connections.indexOf(foundConnection);
                            if (i < 0) {
                                console.log("MISSING", foundConnection);
                            } else {
                                foundConnection.placeTo.connections.splice(i, 1);
                            }
                            i = foundConnection.placeFrom.connections.indexOf(foundConnection);
                            if (i < 0) {
                                console.log("MISSING", foundConnection);
                            } else {
                                foundConnection.placeFrom.connections.splice(i, 1);
                            }
                            DestroyObject(foundConnection);
                        }
                    }
                },
                CollisionExit: {
                    query: {
                        collisionGameObjectName: 'collision/gameObject/name',
                        collisionObjectID: 'collision/gameObject/component:BridgeObject?/id',
                        collisionImpulse: 'collision/impulse',
                        collisionRelativeVelocity: 'collision/relativeVelocity'
                    },
                    handler: function(obj, results) {
                        // Ignore if not another place.
                        //console.log("game.js: Place: CollisionExit", obj.id, JSON.stringify(results));
                        var collisionPlace = world.placeObjectsByID[results.collisionObjectID];
                        if ((!collisionPlace) ||
                            (world.draggingPlace != obj)) {
                            return;
                        }
                        delete world.draggingPlaceKissed[results.collisionObjectID];
                        //console.log("UNKISS", obj.id, results.collisionObjectID, JSON.stringify(world.draggingPlaceKissed), JSON.stringify(results));
                    }
                }
            }
        });

        anchorObject.placeObject = placeObject;
        placeObject.anchorObject = anchorObject;

        placeObject.place = place;
        placeObjectsByName[place.name] = placeObject;
        placeObjectsByID[placeObject.id] = placeObject;

    }

    for (var connectionIndex = 0, connectionCount = connections.length; connectionIndex < connectionCount; connectionIndex++) {
        var connection = connections[connectionIndex];
        var placeFrom = placeObjectsByName[connection.from];
        var placeTo = placeObjectsByName[connection.to];
        var connectionObject = CreateRainbow('connection', placeFrom, placeTo);

        connectionObject.placeFrom = placeFrom;
        connectionObject.placeTo = placeTo;
        placeFrom.connections.push(connectionObject);
        placeTo.connections.push(connectionObject);
    }

}


function CreateTests()
{
    var world = globals.world;

    function CreateText(label, position, animation) {
        return CreatePrefab({
              prefab: 'Prefabs/KineticText',
              update: {
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


function CreatePrivate()
{
}


function CreateRainbow(kind, fromTarget, toTarget, parent)
{
    var world = globals.world;
    var rainbows = world.rainbows;
    var rainbow = rainbows[kind];

    //console.log("bows", JSON.stringify(world.bows));

    var rainbowObject =
        CreatePrefab({
            prefab: 'Prefabs/Rainbow',
            obj: {
                bows: []
            },
            parent: parent ? ('object:' + parent.id) : null,
            update: {
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

        var bowUpdate = bows[bowIndex];

        //console.log("bowConfig", JSON.stringify(bowConfig));

        var bowObject =
            CreatePrefab({
                prefab: 'Prefabs/Bow',
                parent: 'object:' + rainbowObject.id,
                update: bowUpdate
            });

        rainbowObject.bows.push(bowObject);
    }

    return rainbowObject;
}


////////////////////////////////////////////////////////////////////////
