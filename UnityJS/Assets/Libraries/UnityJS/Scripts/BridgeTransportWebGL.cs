////////////////////////////////////////////////////////////////////////
// BridgeTransportWebGL.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


#if UNITY_WEBGL && !UNITY_EDITOR


using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.IO;


public class BridgeTransportWebGL : BridgeTransport
{


    private const string PLUGIN_DLL = "__Internal";


    [DllImport(PLUGIN_DLL)]
    public static extern string _ReceiveJSToUnityEvents();


    [DllImport(PLUGIN_DLL)]
    public static extern void _SendUnityToJSEvents(string evListString);


    [DllImport(PLUGIN_DLL)]
    public static extern void _DistributeJSEvents();


    [DllImport(PLUGIN_DLL)]
    public static extern void _HandleAwake();


    [DllImport(PLUGIN_DLL)]
    public static extern void _HandleDestroy();


    [DllImport(PLUGIN_DLL)]
    public static extern void _EvaluateJS(string js);


    public override void HandleInit()
    {
        base.HandleInit();

        driver = "WebGL";
        startedJS = true;
        bridge.HandleTransportStarted();
    }


    public override void SendJSToUnityEvents(string evListString)
    {
        Debug.LogError("BridgeTransportWebGL: SendJSToUnityEvents: should not be called!");

        jsToUnityEventQueue.Add(evListString);
    }


    public override string ReceiveJSToUnityEvents()
    {
        return _ReceiveJSToUnityEvents();
    }
    

    public override void SendUnityToJSEvents(string evListString)
    {
        Debug.Log("BridgeTransportWebGL: SendUnityToJSEvents: evListString: " + evListString);

        _SendUnityToJSEvents(evListString);
    }


    public override string ReceiveUnityToJSEvents()
    {
        Debug.LogError("BridgeTransportWebGL: DistributeJSEvents: should not be called!");
        return null;
    }


    public override void DistributeJSEvents()
    {
        _DistributeJSEvents();
    }
    

    public override void EvaluateJS(string js)
    {
        Debug.Log("BridgeTransportWebGL: EvaluateJS: js: " + js);
        _EvaluateJS(js);
    }


}


#endif
