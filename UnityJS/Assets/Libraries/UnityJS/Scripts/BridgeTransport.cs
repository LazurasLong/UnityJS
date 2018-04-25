////////////////////////////////////////////////////////////////////////
// BridgeTransport.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;


using StringCallback = System.Action<string>;


public class BridgeTransport : MonoBehaviour
{


    public string driver = "Unknown";
    public string url = "bridge.html";
    public Bridge bridge;
    public List<string> jsToUnityEventQueue = new List<string>();
    public List<string> unityToJSEventQueue = new List<string>();
    public bool startedJS = false;
    

    public void Init(Bridge bridge0)
    {
        bridge = bridge0;
        Debug.Log("BridgeTransport: Init: bridge: " + bridge);
        HandleInit();
    }
    

    public virtual void HandleInit()
    {
        Debug.Log("BridgeTransport: HandleInit: this: " + this + " bridge: " + bridge);
    }


    void Awake()
    {
        HandleAwake();
    }
    

    public virtual void HandleAwake()
    {
        Debug.Log("BridgeTransport: HandleAwake: this: " + this + " bridge: " + bridge);
    }


    void Start()
    {
        HandleStart();
    }
    

    public virtual void HandleStart()
    {
        Debug.Log("BridgeTransport: HandleStart: this: " + this + " bridge: " + bridge);
    }


    void OnDestroy()
    {
        HandleDestroy();
    }
    

    public virtual void HandleDestroy()
    {
        Debug.Log("BridgeTransport: HandleDestroy: this: " + this + " bridge: " + bridge);
    }
    

    public void SendJSToUnityEvents(string evListString)
    {
        //Debug.Log("BridgeTransport: SendJSToUnityEvents: evListString: " + evListString);

        jsToUnityEventQueue.Add(evListString);
    }


    public string ReceiveJSToUnityEvents()
    {
        if (jsToUnityEventQueue.Count == 0) {
            return null;
        }

        string evListString =
            string.Join(",", jsToUnityEventQueue.ToArray());

        jsToUnityEventQueue.Clear();

        Debug.Log("BridgeTransport: ReceiveJSToUnityEvents: evListString: " + evListString);

        return evListString;
    }


    public void SendUnityToJSEvents(string evListString)
    {
        Debug.Log("BridgeTransport: SendUnityToJSEvents: evListString: " + evListString);

        unityToJSEventQueue.Add(evListString);
    }


    public string ReceiveUnityToJSEvents()
    {
        if (unityToJSEventQueue.Count == 0) {
            return null;
        }

        string evListString =
            string.Join(",", unityToJSEventQueue.ToArray());

        unityToJSEventQueue.Clear();

        Debug.Log("BridgeTransport: ReceiveUnityToJSEvents: evListString: " + evListString);

        return evListString;
    }


    public void DistributeJSEvents()
    {
        if (!startedJS) {
            return;
        }

        string evListString = ReceiveUnityToJSEvents();
        int evListStringLength = 0;
        if (string.IsNullOrEmpty(evListString)) {
            //evListString = "null";
            return;
        } else {
            evListString = "[" + evListString + "]";
            evListStringLength = evListString.Length;
        }

        string js =
            "DistributeEvents(" +
                evListString + "," +
                evListStringLength + ");";

        //Debug.Log("BridgeTransport: DistributeJSEvents: js: " + js);

        EvaluateJS(js);
    }


    public virtual void EvaluateJS(string js)
    {
        //Debug.Log("BridgeTransport: EvaluateJS: js: " + js);
    }


}
