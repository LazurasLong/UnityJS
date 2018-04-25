////////////////////////////////////////////////////////////////////////
// BridgeTransportWebGL.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


#if UNITY_WEBGL && !UNITY_EDITOR


using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;


public class BridgeTransportWebGL : BridgeTransport
{


    private const string PLUGIN_DLL = "__Internal";


    [DllImport(PLUGIN_DLL)]
    public static extern string ReceiveJSToUnityEvents();


    [DllImport(PLUGIN_DLL)]
    public static extern void SendUnityToJSEvents(string evListString);


    [DllImport(PLUGIN_DLL)]
    public static extern void DistributeJSEvents();


    [DllImport(PLUGIN_DLL)]
    public static extern void HandleAwake();


    [DllImport(PLUGIN_DLL)]
    public static extern void HandleDestroy();


    [DllImport(PLUGIN_DLL)]
    public static extern void EvaluateJS(string js);


    public override void HandleInit()
    {
        base.HandleInit();

        driver = "WebGL";
        url = "";
        startedJS = true;
        bridge.HandleTransportLoaded();
    }


}


#endif
