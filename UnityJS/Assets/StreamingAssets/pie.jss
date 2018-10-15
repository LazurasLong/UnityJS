/*
 * pie.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////


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
        context.strokeStyle = '#808080';
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
                context.strokeStyle = '#808080';
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
                context.strokeStyle = '#808080';
                context.lineWidth = 1;
                context.stroke();
            }
        }

    }

    success();
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
        pieTracker.justSelected = false;
        pieTracker.pinned = pinned;
        pieTracker.target = target;
        pieTracker.slices = pie.slices ? pie.slices.length : 0;

        UpdateInterests(pieTracker, {
            MousePositionChanged: true,
            pinned: pinned
        });

        var initialDirection = SearchDefault('initialDirection', pie, pieTracker.initialDirection);
        var subtend = SearchDefault('subtend', pie, pieTracker.subtend);
        var clockwise = SearchDefault('clockwise', pie, pieTracker.clockwise);
        var inactiveDistance = SearchDefault('inactiveDistance', pie, pieTracker.inactiveDistance);
        var itemDistance = SearchDefault('itemDistance', pie, pieTracker.itemDistance);
        var pinToCursor = SearchDefault('pinToCursor', pie, pieTracker.pinToCursor);
        //console.log("pieTrackerView:", pieTrackerView);

        UpdateObject(pieTracker, {
            trackingMousePosition: true,
            mousePositionChanged: true,
            mousePositionStart: position,
            mousePositionLast: {x: -1, y: -1},
            pinned: false,
            pinToCursor: pinToCursor,
            slices: pieTracker.slices,
            initialDirection: initialDirection,
            subtend: subtend,
            clockwise: clockwise,
            inactiveDistance: inactiveDistance,
            itemDistance: itemDistance
        });

        //console.log("StartPie TrackPie");
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
            //console.log("PINNED true");
            UpdateObject(pieTracker, {
                pinned: true
            });
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

        //console.log("stayUp", stayUp);

        if (!stayUp) {

            HidePie();

            //console.log("setting justSelected true");
            pieTracker.justSelected = true;
            pieTracker.tracking = false;
            pieTracker.pinned = false;

            UpdateObject(pieTracker, {
                trackingMousePosition: false,
                pinned: false
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
            //console.log("stayUp so TrackPie");
            TrackPie(pieTracker.mousePosition, 0.0, 0.0, -1, -1, true);
        }

        //console.log("setting justSelected false");
        pieTracker.justSelected = false;

        //console.log("nextPieID", nextPieID);

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
                                'textMesh/text': SearchDefault('itemLabelPrefix', item, slice, pie, pieTracker.itemLabelPrefix) + itemLabel,
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
                'textMesh/text': SearchDefault('pieLabelPrefix', pie, pieTracker.pieLabelPrefix) + pie.label,
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
        //console.log("ShowPie");
        var pie = pieTracker.pie;
        if (!pie) {
            return;
        }

        LayoutPie(pie);

        MovePie(pie, position);

        UpdateObject(globals.proCamera, {
            'trackerProxy/target!': 'object:' + pieTracker.id,
            'trackerProxy/gameObject/method:SetActive': [true]
        });

        UpdateObject(pie.groupObject, {
            'gameObject/method:SetActive': [true]
        });

        var target = pieTracker.target;

        HandleShowPie(pie, target);
        DrawPieBackground(pie, target);
    }


    function MovePie(pie, position)
    {
        //console.log("MovePie", "pie", pie, "position", position);

        pie.position = position;

        if (!pie.groupObject) {
            return;
        }

        var cx = pieTracker.screenSize.x * 0.5;
        var cy = pieTracker.screenSize.y * 0.5;

        var screenPosition = {
            x: position.x - cx, 
            y: position.y - cy
        };

        UpdateObject(pie.groupObject, {
            'component:RectTransform/anchoredPosition': screenPosition
        });

    }


    function HidePie()
    {
        //console.log("HidePie");

        var pie = pieTracker.pie;
        if (!pie || !pie.groupObject) {
            return;
        }

        UpdateObject(pie.groupObject, {
            'gameObject/method:SetActive': [false]
        });

        UpdateObject(globals.proCamera, {
            'trackerProxy/target!': null,
            'trackerProxy/gameObject/method:SetActive': [false]
        });

        //DeconstructPie(pie);

        HandleHidePie(pie, pieTracker.target);
    }


    function TrackPie(position, distance, direction, nextSliceIndex, nextItemIndex, reset)
    {
        //console.log("TrackPie", "pieTracker.tracking", pieTracker.tracking, "pieTracker.pie" , pieTracker.pie);

        var pie = pieTracker.pie;
        if (!pie)  {
            console.log("TrackPie: called with null pieTracker.pie! ");
            return;
        }

        if (pieTracker.pinned &&
            !pieTracker.buttonDown) {
            var pinToCursor = SearchDefault('pinToCursor', pie, pieTracker.pinToCursor);
            if (pinToCursor) {
                distance = 0.0;
                direction = 0.0;
                nextSliceIndex = -1;
                nextItemIndex = -1;
                //console.log("pinToCursor MovePie", "justSelected", pieTracker.justSelected);
                MovePie(pie, position);
            }
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

        var target = pieTracker.target;

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
            buttonDown: false,
            pinned: false,
            pinnable: true,
            pinToCursor: false,
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
            sliceLength: 50,
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
            pieLabelFontSize: 24,
            pieLabelFontColor: '#ffffff',
            pieLabelPrefix: '<b>',
            pieLabelAlignment: 'Center',
            pieLabelPosition: { x: 0, y: 0 },
            itemLabelFontSize: 16,
            itemLabelFontColor: '#ffffff',
            itemLabelAlignment: 'Center',
            itemLabelPrefix: '',
            itemLabelDistance: 75,
            itemLabelOffset: { x: 0, y: 0 },
            itemLabelPosition: null,
            DeconstructPie: DeconstructPie,
            LayoutPie: LayoutPie,
            DrawPieBackground: DrawPieBackground,
            pies: {}
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
                    pieTracker.buttonDown = true;

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

                    //console.log("MouseButtonUp TrackPie");
                    TrackPie(
                        results.mousePosition, 
                        results.distance, 
                        results.direction, 
                        results.sliceIndex, 
                        results.itemIndex,
                        false);

                    pieTracker.buttonDown = false;

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
        cache: pie,
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


function CreatePies()
{
    var world = globals.world;
    var pieTracker = globals.pieTracker;

    if (!pieTracker) {
        return;
    }

    Object.assign(pieTracker.pies, world.pie.pies);
}


////////////////////////////////////////////////////////////////////////
