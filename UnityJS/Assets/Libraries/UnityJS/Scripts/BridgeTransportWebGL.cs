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
    public static extern void _UnityJS_HandleAwake();


    [DllImport(PLUGIN_DLL)]
    public static extern void _UnityJS_HandleDestroy();


    [DllImport(PLUGIN_DLL)]
    public static extern void _UnityJS_EvaluateJS(string js);


    [DllImport(PLUGIN_DLL)]
    public static extern string _UnityJS_ReceiveJSToUnityEvents();


    [DllImport(PLUGIN_DLL)]
    public static extern void _UnityJS_SendUnityToJSEvents(string evListString);


    [DllImport(PLUGIN_DLL)]
    public static extern void _UnityJS_DistributeJSEvents();


    public override void HandleInit()
    {
        base.HandleInit();

        driver = "WebGL";
        startedJS = true;
        bridge.HandleTransportStarted();
    }


    public override void HandleAwake()
    {
        //Debug.Log("BridgeTransportWebGL: HandleAwake: this: " + this + " bridge: " + bridge);
        _UnityJS_HandleAwake();
    }


    public override void HandleDestroy()
    {
        //Debug.Log("BridgeTransportWebGL: HandleDestroy: this: " + this + " bridge: " + bridge);
        _UnityJS_HandleDestroy();
    }


    public override void SendJSToUnityEvents(string evListString)
    {
        Debug.LogError("BridgeTransportWebGL: SendJSToUnityEvents: should not be called!");
    }


    public override string ReceiveJSToUnityEvents()
    {
        return _UnityJS_ReceiveJSToUnityEvents();
    }
    

    public override void SendUnityToJSEvents(string evListString)
    {
        //Debug.Log("BridgeTransportWebGL: SendUnityToJSEvents: evListString: " + evListString);

        _UnityJS_SendUnityToJSEvents(evListString);
    }


    public override string ReceiveUnityToJSEvents()
    {
        Debug.LogError("BridgeTransportWebGL: DistributeJSEvents: should not be called!");
        return null;
    }


    public override void DistributeJSEvents()
    {
        _UnityJS_DistributeJSEvents();
    }
    

    public override void EvaluateJS(string js)
    {
        //Debug.Log("BridgeTransportWebGL: EvaluateJS: js: " + js);
        _UnityJS_EvaluateJS(js);
    }


}


#endif
