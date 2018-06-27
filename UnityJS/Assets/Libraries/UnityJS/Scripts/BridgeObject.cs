////////////////////////////////////////////////////////////////////////
// BridgeObject.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class BridgeObject : MonoBehaviour {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public string id;
    public Bridge bridge;
    public JObject interests;
    public bool destroyed = false;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    public virtual void OnDestroy()
    {
        if (bridge == null) {
            return;
        }
        
        //Debug.Log("BridgeObject: OnDestroy: this: " + this);
        bridge.DestroyObject(this);
    }
    

    public void HandleEvents(JArray events)
    {
        if (events == null) {
            return;
        }

        foreach (JObject ev in events) {
            HandleEvent(ev);
        }

    }


    public virtual void HandleEvent(JObject ev)
    {
        //Debug.Log("BridgeObject: HandleEvent: this: " + this + " ev: " + ev, this);

        string eventName = (string)ev["event"];
        //Debug.Log("BridgeObject: HandleEvent: eventName: " + eventName, this);

        if (string.IsNullOrEmpty(eventName)) {
            Debug.LogError("BridgeObject: HandleEvent: missing event name in ev: " + ev);
            return;
        }

        JToken data = ev["data"];
        //Debug.Log("BridgeObject: HandleEvent: eventName: " + eventName, this);

        switch (eventName) {

            case "Destroy": {
                bridge.DestroyObject(this);
                break;
            }

            case "Update": {
                JObject dataObject = (JObject)data;
                LoadConfig(dataObject);
                break;
            }

            case "UpdateInterests": {
                JObject dataObject = (JObject)data;
                UpdateInterests(dataObject);
                break;
            }

            case "Animate": {
                JArray dataArray = (JArray)data;
                AnimateData(dataArray);
                break;
            }

            case "Query": {
                JObject dataObject = (JObject)data;
                JObject query = (JObject)dataObject["query"];
                string callbackID = (string)dataObject["callbackID"];
                bridge.SendQueryData(this, query, callbackID);
                break;
            }

            case "AddComponent": {
                // TODO: AddComponent
                //JObject dataObject = (JObject)data;
                //string className = (string)dataObject["className"];
                //Debug.Log("BridgeObject: HandleEvent: AddComponent: className: " + className);
                break;
            }

            case "DestroyAfter": {
                JObject dataObject = (JObject)data;
                float delay = (float)dataObject["delay"];
                //Debug.Log("BridgeObject: HandleEvent: DestroyAfter: delay: " + delay + " this: " + this);
                UnityEngine.Object.Destroy(gameObject, delay);
                break;
            }

            case "AssignTo": {
                JObject dataObject = (JObject)data;
                string path = (string)dataObject["path"];
                //Debug.Log("BridgeObject: HandleEvent: AssignTo: path: " + path + " this: " + this);

                Accessor accessor = null;
                if (!Accessor.FindAccessor(
                        this,
                        path,
                        ref accessor)) {

                    Debug.LogError("BridgeObject: HandleEvent: AssignTo: can't find accessor for this: " + this + " path: " + path);

                } else {

                    if (!accessor.Set(this) &&
                        !accessor.conditional) {
                        Debug.LogError("BridgeObject: HandleEvent: AssignTo: can't set accessor: " + accessor + " this: " + this + " path: " + path);
                    }

                }
                break;
            }

            case "SetParent": {
                JObject dataObject = (JObject)data;
                //Debug.Log("BridgeObject: HandleEvent: SetParent: this: " + this + " data: " + data);
                string path = (string)dataObject["path"];
                //Debug.Log("BridgeObject: HandleEvent: SetParent: path: " + path + " this: " + this);

                if (string.IsNullOrEmpty(path)) {

                    transform.SetParent(null);

                } else {

                    Accessor accessor = null;
                    if (!Accessor.FindAccessor(
                            this,
                            path,
                            ref accessor)) {

                        Debug.LogError("BridgeObject: HandleEvent: SetParent: can't find accessor for this: " + this + " path: " + path);

                    } else {

                        object obj = null;
                        if (!accessor.Get(ref obj)) {

                            if (!accessor.conditional) {
                                Debug.LogError("BridgeObject: HandleEvent: SetParent: can't get accessor: " + accessor + " this: " + this + " path: " + path);
                            }

                        } else {

                            Component component = obj as Component;
                            if (component == null) {

                                if (!accessor.conditional) {
                                    Debug.LogError("BridgeObject: HandleEvent: SetParent: expected Component obj: " + obj + " this: " + this + " path: " + path);
                                }

                            } else {

                                GameObject go = component.gameObject;
                                Transform xform = go.transform;
                                bool worldPositionStays = 
                                    data.ContainsKey("worldPositionStays")
                                        ? data.GetBoolean("worldPositionStays")
                                        : true;
                                transform.SetParent(xform, worldPositionStays);

                            }

                        }
                    }

                }

                break;

            }

        }

    }


    public void LoadConfig(JObject config)
    {
        //Debug.Log("BridgeObject: LoadConfig: this: " + this + " config: " + config);

        foreach (var item in config) {
            string key = item.Key;
            JToken value = (JToken)item.Value;

            //Debug.Log("BridgeObject: LoadConfig: this: " + this + " SetProperty: " + key + ": " + value);

            Accessor.SetProperty(this, key, value);
        }

    }


    public virtual void UpdateInterests(JObject newInterests)
    {
        //Debug.Log("BridgeObject: UpdateInterests: newInterests: " + newInterests, this);

        // TODO: Should we support multiple interests on the same event name?

        if (interests == null) {
            return;
        }

        foreach (var item in newInterests) {
            string eventName = item.Key;
            JToken interestUpdate = (JToken)item.Value;

            JObject interest = 
                (JObject)interests[eventName];

            if (interestUpdate == null) {

                if (interest != null) {
                    interests.Remove(eventName);
                }

            } else if (interestUpdate.Type == JTokenType.Boolean) {

                if (interest != null) {

                    bool disabled = 
                        !(bool)interestUpdate; // disabled = !enabled

                    interest["disabled"] = disabled;

                }

            } else if (interestUpdate.Type == JTokenType.Object) {

                if (interest == null) {

                    interests[eventName] = interestUpdate;

                } else {

                    foreach (var item2 in (JObject)interestUpdate) {
                        var key = item2.Key;
                        interest[key] = interestUpdate[key];
                    }

                }

            }

        }

    }


    public void SendEvent(string eventName)
    {
        SendEventName(eventName);
    }
    

    public void SendEventName(string eventName, JObject data = null)
    {
        //Debug.Log("BridgeObject: SendEventName: eventName: " + eventName + " data: " + data + " interests: " + interests);

        if (bridge == null) {
            Debug.LogError("BridgeObject: SendEventName: bridge is null!");
            return;
        }

        bool foundInterest = false;

        if (interests != null) {

            JObject interest = (JObject)interests[eventName];
            //Debug.Log("BridgeObject: SendEventName: eventName: " + eventName + " interest: " + interest, this);
            if (interest != null) {

                JToken disabledToken = interest["disabled"];
                bool disabled = 
                    (disabledToken != null) &&
                    (bool)disabledToken;

                if (!disabled) {

                    foundInterest = true;
                    //Debug.Log("BridgeObject: SendEventName: foundInterest: eventName: " + eventName + " interest: " + interest, this);

                    JObject query = (JObject)interest["query"];
                    if (query != null) {

                        //Debug.Log("BridgeObject: SendEventName: event interest query: " + query);

                        if (data == null) {
                            data = new JObject();
                        }

                        bridge.AddQueryData(this, query, data);
                        //Debug.Log("BridgeObject: SendEventName: event interest query data: " + dagta);

                    }

                }

            }

        }

        // Always send Created and Destoyed events.
        if (foundInterest ||
            (eventName == "Created") ||
            (eventName == "Destroyed")) {

            JObject ev = new JObject();

            ev.Add("event", eventName);
            ev.Add("id", id);

            if (data != null) {
                ev.Add("data", data);
            }

            //Debug.Log("BridgeObject: SendEventName: ev: " + ev, this);

            bridge.SendEvent(ev);
        }


    }


    public virtual void AnimateData(JArray data)
    {
        //Debug.Log("BridgeObject: AnimateData: data: " + data, this);

        LeanTweenBridge.AnimateData(this, data);
    }

 
}
