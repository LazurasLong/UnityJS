/////////////////////////////////////////////////////////////////////////
// Bridge.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;


public class Bridge : MonoBehaviour {


    ////////////////////////////////////////////////////////////////////////
    // Delegates


    public delegate bool ConvertToDelegate(JToken obj, System.Type systemType, ref object result);
    public delegate bool ConvertFromDelegate(object obj, System.Type systemType, ref JToken result);
    public delegate void TextureChannelDelegate(Texture2D texture, string channel, object data);


    ////////////////////////////////////////////////////////////////////////
    // Static Variables


    public static Bridge bridge;
    public static JsonSerializer jsonSerializer;


    //////////////////////////////////////////////////////////////////////////////////
    // Instance Variables
    

    public Dictionary<string, BridgeObject> idToBridgeObject = new Dictionary<string, BridgeObject>();
    public Dictionary<BridgeObject, string> bridgeObjectToID = new Dictionary<BridgeObject, string>();
    public Dictionary<string, TextureChannelDelegate> textureChannels = new Dictionary<string, TextureChannelDelegate>();
    public bool startedJS = false;
    public BridgeTransport transport;


    //////////////////////////////////////////////////////////////////////////////////
    // Instance Methods
    

    public void Awake()
    {
        //Debug.Log("Bridge: Awake: this: " + this + " bridge: " +  ((bridge == null) ? "null" : ("" + bridge)));

        if (bridge == null) {
            bridge = this;
        } else {
            Debug.LogError("Bridge: Awake: There should only be one bridge!");
        }

        if (jsonSerializer == null) {
            jsonSerializer = new JsonSerializer();
            jsonSerializer.Converters.Add(new BridgeJsonConverter());
            jsonSerializer.Converters.Add(new StringEnumConverter());
        }

        CreateTransport();
    }


    public void OnDestroy()
    {
        //Debug.Log("Bridge: OnDestroy: this: " + this + " bridge: " +  ((bridge == null) ? "null" : ("" + bridge)));

        if (bridge == this) {
            bridge = null;
        } else {
            if (bridge != null) {
                Debug.LogError("Bridge: OnDestroy: the global bridge: " + ((bridge == null) ? "null" : ("" + bridge)) + " isn't me!");
            }
        }
    }


    public void CreateTransport()
    {
        if (transport != null) {
            Debug.Log("Bridge: CreateTransport: called multiple times!");
            return;
        }

        transport =
#if UNITY_EDITOR
 #if USE_SOCKETIO
            gameObject.AddComponent<BridgeTransportSocketIO>();
 #else
  #if USE_CEF
            gameObject.AddComponent<BridgeTransportCEF>();
  #else
            gameObject.AddComponent<BridgeTransportWebView>();
  #endif
 #endif
#else
 #if UNITY_WEBGL
            gameObject.AddComponent<BridgeTransportWebGL>();
 #else
  #if USE_SOCKETIO
            gameObject.AddComponent<BridgeTransportSocketIO>();
  #else
            gameObject.AddComponent<BridgeTransportWebView>();
  #endif
 #endif
#endif

        Debug.Log("Bridge: CreateTransport: transport: " + transport);

        transport.Init(this);
    }


    public void HandleTransportStarted()
    {
        Debug.Log("Bridge: HandleTransportStarted");

        string js =
            "StartBridge(\"" + transport.driver + "\");";
        Debug.Log("Bridge: HandleTransportStarted: EvaluateJS: " + js);

        transport.EvaluateJS(js);

        JObject ev = new JObject();
        ev.Add("event", "StartedUnity");

        Debug.Log("Bridge: HandleStart: sending StartedUnity ev: " + ev);
        SendEvent(ev);
    }
    

    public void SendEvent(JObject ev)
    {
        //Debug.Log("Bridge: SendEvent: ev: " + ev);

        string evString = ev.ToString();

        transport.SendUnityToJSEvents(evString);
    }


    void FixedUpdate()
    {
        DistributeUnityEvents();
        transport.DistributeJSEvents();
    }


    void DistributeUnityEvents()
    {
        string evListString = transport.ReceiveJSToUnityEvents();

        if (string.IsNullOrEmpty(evListString)) {
            return;
        }

        string json = "[" + evListString + "]";
        //Debug.Log("Bridge: DistributeUnityEvents: json:\n" + json);

        JArray evList = JArray.Parse(json);
        //Debug.Log("Bridge: DistributeUnityEvents: evList: " + evList);

        foreach (JObject ev in evList) {
            DistributeUnityEvent(ev);
        }
    }


    void DistributeUnityEvent(JObject ev)
    {
        string eventName = (string)ev["event"];
        JObject data = (JObject)ev["data"];

        //Debug.Log("Bridge: DistributeUnityEvent: eventName: " + eventName + " ev: " + ev);

        switch (eventName) {

            case "StartedJS": {

                //Debug.Log("Bridge: DistributeUnityEvent: StartedJS: " + ev);
                startedJS = true;

                break;

            }

            case "Log": {

                string line = (string)data["line"];

                Debug.Log("Bridge: DistributeUnityEvent: Log: line: " + line);

                break;

            }

            case "Create": {

                string prefab = (string)data["prefab"];
                string id = (string)data["id"];
                JObject config = (JObject)data["config"];
                JObject interests = (JObject)data["interests"];
                JArray preEvents = (JArray)data["preEvents"];
                JArray postEvents = (JArray)data["postEvents"];

                //Debug.Log("Bridge: DistributeUnityEvent: Create: prefab: " + prefab + " id: " + id + " config: " + config + " interests: " + interests + " preEvents: " + preEvents + " postEvents: " + postEvents);

                string prefabPath = "Prefabs/" + prefab;
                GameObject prefabObject = Resources.Load<GameObject>(prefabPath);
                //Debug.Log("Bridge: DistributeUnityEvent: Create: prefabPath: " + prefabPath + " prefabObject: " + prefabObject);
                if (prefabObject == null) {
                    Debug.LogError("Bridge: DistributeUnityEvent: Create: Can't find prefab: " + prefab);
                    return;
                }

                GameObject instance = Instantiate(prefabObject);
                //Debug.Log("Bridge: DistributeUnityEvent: Create: instance: " + instance);
                if (instance == null) {
                    Debug.LogError("Bridge: DistributeUnityEvent: Create: Can't instantiate prefab: " + prefab + " prefabObject: " + prefabObject);
                    return;
                }

                BridgeObject bridgeObject = instance.GetComponent<BridgeObject>();
                //Debug.Log("Bridge: DistributeUnityEvent: Create: bridgeObject: " + bridgeObject);

                if (bridgeObject == null) {
                    bridgeObject = instance.AddComponent<BridgeObject>();
                }

                instance.name = id;
                bridgeObject.id = id;
                bridgeObject.bridge = this;
                bridgeObject.interests = interests;
                bridgeObjectToID[bridgeObject] = id;
                idToBridgeObject[id] = bridgeObject;

                //Debug.Log("Bridge: DistributeUnityEvent: Create: created, position: " + bridgeObject.transform.position.x + " " + bridgeObject.transform.position.y + " " + bridgeObject.transform.position.z + " bridgeObject: " + bridgeObject);

                bridgeObject.HandleEvents(preEvents);
                bridgeObject.LoadConfig(config);
                bridgeObject.SendEventName("Created");
                bridgeObject.HandleEvents(postEvents);

                //Debug.Log("Bridge: DistributeUnityEvent: Create: done, position: " + bridgeObject.transform.position.x + " " + bridgeObject.transform.position.y + " " + bridgeObject.transform.position.z + " bridgeObject: " + bridgeObject);

                break;

            }

            default: {

                string id = (string)ev["id"];
                //Debug.Log("Bridge: DistributeUnityEvent: id: " + id + " ev: " + ev);

                if (string.IsNullOrEmpty(id)) {
                    Debug.LogError("Bridge: DistributeUnityEvent: missing id on eventName: " + eventName + " ev: " + ev);
                    return;
                }

                BridgeObject bridgeObject = idToBridgeObject[id];
                //Debug.Log("Bridge: DistributeUnityEvent: bridgeObject: " + bridgeObject);
                if (bridgeObject == null) {
                    Debug.LogError("Bridge: DistributeUnityEvent: missing id: " + id + " ev: " + ev);
                    return;
                }

                bridgeObject.HandleEvent(ev);

                break;

            }

        }

    }


    public BridgeObject GetBridgeObject(string id)
    {
        if (!idToBridgeObject.ContainsKey(id)) {
            return null;
        }

        BridgeObject bridgeObject = idToBridgeObject[id];

        return bridgeObject;
    }


    public void DestroyBridgeObject(BridgeObject bridgeObject)
    {
        if (bridgeObject.destroyed) {
            return;
        }

        bridgeObject.destroyed = true;

        //Debug.Log("Bridge: DestroyBridgeObject: bridgeObject: " + bridgeObject);

        if (idToBridgeObject.ContainsKey(bridgeObject.id)) {
            idToBridgeObject.Remove(bridgeObject.id);
        } else {
            //Debug.Log("Bridge: DestroyBridgeObject: idToBridgeObject missing bridgeObject id: " + bridgeObject.id, this);
        }

        bridgeObject.SendEventName("Destroyed");

        if (bridgeObjectToID.ContainsKey(bridgeObject)) {
            bridgeObjectToID.Remove(bridgeObject);
        } else {
            //Debug.Log("Bridge: DestroyBridgeObject: missing bridgeObject: " + bridgeObject, this);
        }

        Destroy(bridgeObject.gameObject);
    }


    public void SendCallbackData(string callbackID, JObject data)
    {
        //Debug.Log("Bridge: SendCallbackData: callbackID: " + callbackID + " results: " + results);
        JObject ev = new JObject();
        ev.Add("event", "Callback");
        ev.Add("id", callbackID);
        ev.Add("data", data);

        //Debug.Log("Bridge: SendCallbackData: sending ev: " + ev);

        SendEvent(ev);
    }


    public virtual void SendQueryData(object obj, JObject query, string callbackID)
    {
        //Debug.Log("Bridge: SendQueryData: obj: " + obj + " query: " + query + " callbackID: " + callbackID);

        JObject data = new JObject();
        AddQueryData(obj, query, data);

        //Debug.Log("Bridge: QueryData: data: " + data);

        if (!string.IsNullOrEmpty(callbackID)) {
           SendCallbackData(callbackID, data);
        }

    }


    public void AddQueryData(object obj, JObject query, JObject data)
    {
        //Debug.Log("Bridge: AddQueryData: query: " + query);

        foreach (var item in query) {
            string key = item.Key;
            string path = (string)item.Value;
            object value = null;
            JToken valueData = null;

            //Debug.Log("Bridge: AddQueryData: get property obj: " + obj + " path: " + path);

            if (!Accessor.GetProperty(obj, path, ref value)) {

                Debug.LogError("Bridge: AddQueryData: can't get property path: " + path);

            } else {

                //Debug.Log("Bridge: AddQueryData: got property value: " + ((value == null) ? "null" : ("" + value)));

                if (!ConvertFromType(value, ref valueData)) {

                    Debug.LogError("Bridge: AddQueryData: can't convert from JSON for type: " + ((valueData == null) ? "null" : ("" + valueData.GetType())) + " obj: " + obj + " key: " + key + " path: " + path + " value: " + value + " valueData: " + valueData);

                } else {

                    //Debug.Log("Bridge: AddQueryData: obj: " + obj + " key: " + key + " path: " + path + " value: " + value + " valueData: " + valueData);

                    data[key] = valueData;

                }

            }

            //data[key] = valueData;

        }

    }


    ////////////////////////////////////////////////////////////////////////
    // Texture channels.


    public void DistributeTexture(string channel, Texture2D texture, object data)
    {
        if (!textureChannels.ContainsKey(channel)) {
            //Debug.Log("Bridge: SendTexture: not sending to dead channel: " + channel + " texture: " + texture + " data: " + data);
            return;
        }

        TextureChannelDelegate handler = textureChannels[channel];
        //Debug.Log("Bridge: SendTexture: sending to live channel: " + channel + " texture: " + texture + " data: " + data + " handler: " + handler);

        handler(texture, channel, data);
    }


    public void TextureChannelSubscribe(string channel, TextureChannelDelegate handler)
    {
        //Debug.Log("Bridge: TextureChannelSubscribe: channel: " + channel + " handler: " + handler + " exists: " + textureChannels.ContainsKey(channel));

        if (!textureChannels.ContainsKey(channel)) {
            textureChannels.Add(channel, null);
        }

        textureChannels[channel] += handler;
    }


    public void TextureChannelUnsubscribe(string channel, TextureChannelDelegate handler)
    {
        //Debug.Log("Bridge: TextureChannelUnsubscribe: channel: " + channel + " handler: " + handler + " exists: " + textureChannels.ContainsKey(channel));

        if (!textureChannels.ContainsKey(channel)) {
            return;
        }

        textureChannels[channel] -= handler;
    }


    ////////////////////////////////////////////////////////////////////////
    // Type conversion.


    public bool ConvertToType(JToken data, System.Type objectType, ref object result)
    {
        //Debug.Log("Bridge: ConvertToType: objectType: " + objectType + " data: " + data);

        result = data.ToObject(objectType, jsonSerializer);

        //Debug.Log("Bridge: ConvertToType: result: " + result);

        return true;
    }


    public bool ConvertFromType(object value, ref JToken result)
    {
        //Debug.Log("Bridge: ConvertFromType: value: " + value + " type: " + ((value == null) ? "NULL" : ("" + value.GetType())));

        if (value == null) {
            result = null;
            return true;
        }

        result = JToken.FromObject(value, jsonSerializer);

        //Debug.Log("Bridge: ConvertFromType: result: " + result + " TokenType: " + result.Type);

        return true;
    }


}
