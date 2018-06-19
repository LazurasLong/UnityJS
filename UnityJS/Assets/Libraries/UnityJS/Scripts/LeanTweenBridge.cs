////////////////////////////////////////////////////////////////////////
// LeanTweenBridge.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.EventSystems;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class LeanTweenBridge : BridgeObject {


    public override void HandleEvent(JObject ev)
    {
        base.HandleEvent(ev);

        //Debug.Log("LeanTweenBridge: HandleEvent: this: " + this + " ev: " + ev, this);

        string eventName = (string)ev["event"];
        //Debug.Log("LeanTweenBridge: HandleEvent: eventName: " + eventName, this);
        if (string.IsNullOrEmpty(eventName)) {
            Debug.LogError("LeanTweenBridge: HandleEvent: missing event name in ev: " + ev);
            return;
        }

        JObject data = (JObject)ev["data"];
        Debug.Log("LeanTweenBridge: HandleEvent: eventName: " + eventName, this);

        switch (eventName) {

            case "Tween": {
                Debug.Log("LeanTweenBridge: HandleEvent: Tween: ev: " + ev);
                break;
            }

        }
    }


}
