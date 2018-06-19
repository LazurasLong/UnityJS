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
        bridge.DestroyBridgeObject(this);
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

        JObject data = (JObject)ev["data"];
        //Debug.Log("BridgeObject: HandleEvent: eventName: " + eventName, this);

        switch (eventName) {

            case "Destroy": {
                bridge.DestroyBridgeObject(this);
                break;
            }

            case "Update": {
                LoadConfig(data);
                break;
            }

            case "UpdateInterests": {
                UpdateInterests(data);
                break;
            }

            case "Animate": {
                AnimateData(data);
                break;
            }

            case "Query": {
                JObject query = (JObject)data["query"];
                string callbackID = (string)data["callbackID"];
                bridge.SendQueryData(this, query, callbackID);
                break;
            }

            case "AddComponent": {
                // TODO: AddComponent
                //string className = (string)data["className"];
                //Debug.Log("BridgeObject: HandleEvent: AddComponent: className: " + className);
                break;
            }

            case "DestroyAfter": {
                float delay = (float)data["delay"];
                //Debug.Log("BridgeObject: HandleEvent: DestroyAfter: delay: " + delay + " this: " + this);
                UnityEngine.Object.Destroy(gameObject, delay);
                break;
            }

            case "AssignTo": {
                string path = (string)data["path"];
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
                //Debug.Log("BridgeObject: HandleEvent: SetParent: this: " + this + " data: " + data);
                string path = (string)data["path"];
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
                                transform.SetParent(xform);

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


    public virtual void AnimateData(JObject data)
    {
        //Debug.Log("BridgeObject: AnimateData: data: " + data, this);

#if false
        if (!data.IsList) {
            Debug.LogError("BridgeObject: AnimateData: not array data: " + data);
            return;
        }

        var commandList = data.AsList;
        foreach (JObject commandData in commandList) {

            if (!commandData.IsList) {
                Debug.LogError("BridgeObject: AnimateData: not array commandData: " + commandData);
                continue;
            }

            var argList = commandData.AsList;
            var command = argList[0].AsString;
            switch (command) {

                case "AudioFrom":
                case "AudioTo": {

                    if (argList.Count == 2) {

                        Hashtable hash = null;
                        if (ConvertArgs(argList[1], ref hash)) {
                            switch (command) {
                                case "AudioFrom":
                                    iTween.AudioFrom(gameObject, hash);
                                    break;
                                case "AudioTo":
                                    iTween.AudioTo(gameObject, hash);
                                    break;
                            }
                        }

                    } else if (argList.Count == 4) {

                        float volume = 1.0f;
                        float pitch = 1.0f;
                        float time = 1.0f;
                        if (ConvertFloat(argList[1], ref volume) &&
                            ConvertFloat(argList[2], ref pitch) &&
                            ConvertFloat(argList[3], ref time)) {
                            switch (command) {
                                case "AudioFrom":
                                    iTween.AudioFrom(gameObject, volume, pitch, time);
                                    break;
                                case "AudioTo":
                                    iTween.AudioTo(gameObject, volume, pitch, time);
                                    break;
                            }

                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 or 4 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "ColorFrom":
                case "ColorTo": {

                    if (argList.Count == 2) {

                        Hashtable hash = null;
                        if (ConvertArgs(argList[1], ref hash)) {
                            switch (command) {
                                case "ColorFrom":
                                    iTween.ColorFrom(gameObject, hash);
                                    break;
                                case "ColorTo":
                                    iTween.ColorTo(gameObject, hash);
                                    break;
                            }
                        }

                    } else if (argList.Count == 3) {

                        Color color = Color.white;
                        float time = 1.0f;
                        if (ConvertColor(argList[1], ref color) &&
                            ConvertFloat(argList[2], ref time)) {
                            switch (command) {
                                case "ColorFrom":
                                    iTween.ColorFrom(gameObject, color, time);
                                    break;
                                case "ColorTo":
                                    iTween.ColorTo(gameObject, color, time);
                                    break;
                            }

                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 or 3 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "FadeFrom":
                case "FadeTo": {

                    if (argList.Count == 2) {

                        Hashtable hash = null;
                        if (ConvertArgs(argList[1], ref hash)) {
                            switch (command) {
                                case "FadeFrom":
                                    iTween.FadeFrom(gameObject, hash);
                                    break;
                                case "FadeTo":
                                    iTween.FadeTo(gameObject, hash);
                                    break;
                            }
                        }

                    } else if (argList.Count == 3) {

                        float alpha = 1.0f;
                        float time = 1.0f;
                        if (ConvertFloat(argList[1], ref alpha) &&
                            ConvertFloat(argList[2], ref time)) {
                            switch (command) {
                                case "FadeFrom":
                                    iTween.FadeFrom(gameObject, alpha, time);
                                    break;
                                case "FadeTo":
                                    iTween.FadeTo(gameObject, alpha, time);
                                    break;
                            }

                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 or 3 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "LookFrom":
                case "LookTo":
                case "MoveAdd":
                case "MoveBy":
                case "MoveFrom":
                case "MoveTo":
                case "PunchPosition":
                case "PunchRotation":
                case "PunchScale":
                case "RotateAdd":
                case "RotateBy":
                case "RotateFrom":
                case "RotateTo":
                case "ScaleAdd":
                case "ScaleBy":
                case "ScaleFrom":
                case "ScaleTo":
                case "ShakePosition":
                case "ShakeRotation":
                case "ShakeScale": {

                    if (argList.Count == 2) {

                        Hashtable hash = null;
                        if (ConvertArgs(argList[1], ref hash)) {
                            switch (command) {
                                case "LookFrom":
                                    iTween.LookFrom(gameObject, hash);
                                    break;
                                case "LookTo":
                                    iTween.LookTo(gameObject, hash);
                                    break;
                                case "MoveAdd":
                                    iTween.MoveAdd(gameObject, hash);
                                    break;
                                case "MoveBy":
                                    iTween.MoveBy(gameObject, hash);
                                    break;
                                case "MoveFrom":
                                    iTween.MoveFrom(gameObject, hash);
                                    break;
                                case "MoveTo":
                                    iTween.MoveTo(gameObject, hash);
                                    break;
                                case "PunchPosition":
                                    iTween.PunchPosition(gameObject, hash);
                                    break;
                                case "PunchRotation":
                                    iTween.PunchRotation(gameObject, hash);
                                    break;
                                case "PunchScale":
                                    iTween.PunchScale(gameObject, hash);
                                    break;
                                case "RotateAdd":
                                    iTween.RotateAdd(gameObject, hash);
                                    break;
                                case "RotateBy":
                                    iTween.RotateBy(gameObject, hash);
                                    break;
                                case "RotateFrom":
                                    iTween.RotateFrom(gameObject, hash);
                                    break;
                                case "RotateTo":
                                    iTween.RotateTo(gameObject, hash);
                                    break;
                                case "ScaleAdd":
                                    iTween.ScaleAdd(gameObject, hash);
                                    break;
                                case "ScaleBy":
                                    iTween.ScaleBy(gameObject, hash);
                                    break;
                                case "ScaleFrom":
                                    iTween.ScaleFrom(gameObject, hash);
                                    break;
                                case "ScaleTo":
                                    iTween.ScaleTo(gameObject, hash);
                                    break;
                                case "ShakePosition":
                                    iTween.ShakePosition(gameObject, hash);
                                    break;
                                case "ShakeRotation":
                                    iTween.ShakeRotation(gameObject, hash);
                                    break;
                                case "ShakeScale":
                                    iTween.ShakeScale(gameObject, hash);
                                    break;
                            }
                        }

                    } else if (argList.Count == 3) {

                        Vector3 vector3 = Vector3.one;
                        float time = 1.0f;
                        if (ConvertVector3(argList[1], ref vector3) &&
                            ConvertFloat(argList[2], ref time)) {
                            switch (command) {
                                case "LookFrom":
                                    iTween.LookFrom(gameObject, vector3, time);
                                    break;
                                case "LookTo":
                                    iTween.LookTo(gameObject, vector3, time);
                                    break;
                                case "MoveAdd":
                                    iTween.MoveAdd(gameObject, vector3, time);
                                    break;
                                case "MoveBy":
                                    iTween.MoveBy(gameObject, vector3, time);
                                    break;
                                case "MoveFrom":
                                    iTween.MoveFrom(gameObject, vector3, time);
                                    break;
                                case "MoveTo":
                                    iTween.MoveTo(gameObject, vector3, time);
                                    break;
                                case "PunchPosition":
                                    iTween.PunchPosition(gameObject, vector3, time);
                                    break;
                                case "PunchRotation":
                                    iTween.PunchRotation(gameObject, vector3, time);
                                    break;
                                case "PunchScale":
                                    iTween.PunchScale(gameObject, vector3, time);
                                    break;
                                case "RotateAdd":
                                    iTween.RotateAdd(gameObject, vector3, time);
                                    break;
                                case "RotateBy":
                                    iTween.RotateBy(gameObject, vector3, time);
                                    break;
                                case "RotateFrom":
                                    iTween.RotateFrom(gameObject, vector3, time);
                                    break;
                                case "RotateTo":
                                    iTween.RotateTo(gameObject, vector3, time);
                                    break;
                                case "ScaleAdd":
                                    iTween.ScaleAdd(gameObject, vector3, time);
                                    break;
                                case "ScaleBy":
                                    iTween.ScaleBy(gameObject, vector3, time);
                                    break;
                                case "ScaleFrom":
                                    iTween.ScaleFrom(gameObject, vector3, time);
                                    break;
                                case "ScaleTo":
                                    iTween.ScaleTo(gameObject, vector3, time);
                                    break;
                                case "ShakePosition":
                                    iTween.ShakePosition(gameObject, vector3, time);
                                    bstring id0 = null, reak;
                                case "ShakeRotation":
                                    iTween.ShakeRotation(gameObject, vector3, time);
                                    break;
                                case "ShakeScale":
                                    iTween.ShakeScale(gameObject, vector3, time);
                                    break;
                            }

                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 or 3 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "Stab": {

                    if (argList.Count == 2) {

                        Hashtable hash = null;
                        if (ConvertArgs(argList[1], ref hash)) {
                            iTween.Stab(gameObject, hash);
                        }

                    } else if (argList.Count == 3) {

                        AudioClip audioClip = null;
                        float delay = 1.0f;
                        if (ConvertAudioClip(argList[1], ref audioClip) &&
                            ConvertFloat(argList[2], ref delay)) {
                            iTween.Stab(gameObject, audioClip, delay);
                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 or 3 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "PauseAll": {

                    if (argList.Count == 1) {

                        iTween.Pause();

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 1 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "StopAll": {

                    if (argList.Count == 1) {

                        iTween.Stop();

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 1 for argList: " + argList);
                        continue;
                    }

                    break;
                }

                case "Pause":
                case "Stop": {

                    if (argList.Count == 1) {

                        switch (command) {
                            case "Pause":
                                iTween.Pause(gameObject);
                                break;
                            case "Stop":
                                iTween.Stop(gameObject);
                                break;
                        }

                    } else if (argList.Count == 2) {

                        JObject arg = argList[1];
                        if (arg.IsBool) {

                            bool includechildren = arg.AsBool;

                            switch (command) {
                                case "Pause":
                                    iTween.Pause(gameObject, includechildren);
                                    break;
                                case "Stop":
                                    iTween.Stop(gameObject, includechildren);
                                    break;
                            }

                        } else if (arg.IsString) {
                            
                            string type = arg.AsString;

                            switch (command) {
                                case "Pause":
                                    iTween.Pause(gameObject, type);
                                    break;
                                case "Stop":
                                    iTween.Stop(gameObject, type);
                                    break;
                            }


                        } else {
                            Debug.LogError("BridgeObject: AnimateData: " + command + ": expected bool or string arg: " + arg);
                            continue;
                        }

                    } else if (argList.Count == 3) {

                        string type = "";
                        bool includechildren = false;
                        if (ConvertString(argList[1], ref type) &&
                            ConvertBool(argList[2], ref includechildren)) {

                            switch (command) {
                                case "Pause":
                                    iTween.Pause(gameObject, type, includechildren);
                                    break;
                                case "Stop":
                                    iTween.Stop(gameObject, type, includechildren);
                                    break;
                            }

                        } else {
                            Debug.LogError("BridgeObject: AnimateData: " + command + ": expected string arg: " + argList[1] + " bool arg: " + argList[2]);
                            continue;
                        }

                    }

                    break;
                }

                case "StopByName": {

                    if (argList.Count == 2) {

                        string name = "";
                        if (ConvertString(argList[1], ref name)) {

                            iTween.StopByName(name);

                        } else {
                            Debug.LogError("BridgeObject: AnimateData: " + command + ": expected string arg: " + argList[1]);
                            continue;
                        }

                    } else {
                        Debug.LogError("BridgeObject: AnimateData: " + command + ": expected length 2 for argList: " + argList);
                        continue;
                    }
                    
                    break;
                }

                case "ValueTo": {
                    Debug.LogError("BridgeObject: AnimateData: ValueTo: TODO");
                    break;
                }

                default: {
                    Debug.LogError("BridgeObject: AnimateData: undefined command: " + command);
                    break;
                }

            }

        }
#endif

    }

 
}
