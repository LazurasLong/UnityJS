/*
* UnityJS.jslib
* Unity3D / JavaScript Bridge
* Don Hopkins, Ground Up Software.
*/


mergeInto(LibraryManager.library, {


    // Called by Unity when awakened.
    _UnityJS_HandleAwake: function _UnityJS_HandleAwake() 
    {
        //console.log("bridge.jslib: _UnityJS_HandleAwake");

        if (!window.bridge) {
            window.bridge = {};
        }

        if (!window.bridge._UnityJS_JSToUnityEventQueue) {
            window.bridge._UnityJS_JSToUnityEventQueue = [];
        }

        if (!window.bridge._UnityJS_UnityToJSEventQueue) {
            window.bridge._UnityJS_UnityToJSEventQueue = [];
        }

        // Called by JS to queue events to Unity.
        function _UnityJS_SendJSToUnityEvents (evListString) {
            window.bridge._UnityJS_JSToUnityEventQueue.push(evListString);
        }

        window.bridge._UnityJS_SendJSToUnityEvents = _UnityJS_SendJSToUnityEvents;
    },


    // Called by Unity when destroyed.
    _UnityJS_HandleDestroy: function _UnityJS_HandleDestroy()
    {
        //console.log("bridge.jslib: _UnityJS_HandleDestroy");
    },


    // Called by Unity to evaluate JS code.
    _UnityJS_EvaluateJS: function _UnityJS_EvaluateJS(jsPointer)
    {
        var js = Pointer_stringify(jsPointer);
        //console.log("bridge.jslib: _UnityJS_EvaluateJS: js:", js);
        window.EvaluateJS(js);
    },


    // Called by Unity to receive all events from JS.
    _UnityJS_ReceiveJSToUnityEvents: function _UnityJS_ReceiveJSToUnityEvents()
    {
        var eventCount = window.bridge._UnityJS_JSToUnityEventQueue.length;
        if (eventCount == 0) {
            return null;
        }

        var str =
            window.bridge._UnityJS_JSToUnityEventQueue.join(',');

        window.bridge._UnityJS_JSToUnityEventQueue.splice(0, eventCount);

        var bufferSize = lengthBytesUTF8(str) + 1;
        var buffer = _malloc(bufferSize);
        stringToUTF8(str, buffer, bufferSize);

        return buffer;
    },


    // Called by Unity to queue events to JS.
    _UnityJS_SendUnityToJSEvents: function _UnityJS_SendUnityToJSEvents(evListStringPointer)
    {
        var evListString = Pointer_stringify(evListStringPointer);
        window.bridge._UnityJS_UnityToJSEventQueue.push(evListString);
    },

    // Called by Unity to distribute queued events from Unity to JS.
    _UnityJS_DistributeJSEvents: function _UnityJS_DistributeJSEvents()
    {
        var evList = null;
        var evListStringLength = 0;
        var eventCount = window.bridge._UnityJS_UnityToJSEventQueue.length;

        var evListString = null;
        if (eventCount) {
            evListString = window.bridge._UnityJS_UnityToJSEventQueue.join(',');
            window.bridge._UnityJS_UnityToJSEventQueue.splice(0, eventCount);
        }

        if (evListString) {
            var json = "[" + evListString + "]";
            evListStringLength = json.length;
            evList = JSON.parse(json);
        }

        window.DistributeEvents(evList, evListStringLength);
    }


});
