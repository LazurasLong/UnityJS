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
    

    public Dictionary<string, object> idToObject = new Dictionary<string, object>();
    public Dictionary<object, string> objectToID = new Dictionary<object, string>();
    public Dictionary<string, TextureChannelDelegate> textureChannels = new Dictionary<string, TextureChannelDelegate>();
    public string url = "bridge.html";
    public string spreadsheetID = "1nh8tlnanRaTmY8amABggxc0emaXCukCYR18EGddiC4w";
    public string configuration = "world";
    public bool startedJS = false;
    public BridgeTransport transport;


    ////////////////////////////////////////////////////////////////////////
    // Static Methods
    

    public static string GetStringDefault(JObject obj, string key, string def = null)
    {
        var valueToken = obj[key];
        if (valueToken == null) {
            return def;
        }

        string str = (string)valueToken;
        if (str == null) {
            return def;
        }

        return str;
    }


    public static JObject GetJObjectDefault(JObject obj, string key, JObject def = null)
    {
        var valueToken = obj[key];
        if (valueToken == null) {
            return def;
        }

        JObject jobj = valueToken as JObject;
        if (jobj == null) {
            return def;
        }

        return jobj;
    }


    public static JArray GetJArrayDefault(JObject obj, string key, JArray def = null)
    {
        var valueToken = obj[key];
        if (valueToken == null) {
            return def;
        }

        JArray jarr = valueToken as JArray;
        if (jarr == null) {
            return def;
        }

        return jarr;
    }


    public static bool ConvertToEnum<EnumType>(object obj, ref EnumType result)
    {
        if (obj is JToken) {
            JToken token = (JToken)obj;
            switch (token.Type) {
                case JTokenType.String:
                    obj = (string)token.ToString();
                    break;
            }
        }

        if (obj is string) {

            var str = (string)obj;
            
            result =
                (EnumType)Enum.Parse(
                    typeof(EnumType), 
                    str);

            //Debug.Log("BridgeManager: ConvertToEnum: EnumType: " + typeof(EnumType) + " str: " + str + " result: " + result);

            return true;
        }

        int i = 0;
        if (obj is int) {
            i = (int)obj;
        } else if (obj is byte) {
            i = (int)(byte)obj;
        } else if (obj is short) {
            i = (int)(short)obj;
        } else if (obj is long) {
            i = (int)(long)obj;
        } else if (obj is float) {
            i = (int)(float)obj;
        } else if (obj is double) {
            i = (int)(double)obj;
        } else {
            return false;
        }

        result = 
            (EnumType)Enum.ToObject(
                typeof(EnumType), 
                i);

        //Debug.Log("BridgeManager: ConvertToEnum: EnumType: " + typeof(EnumType) + " i: " + i + " result: " + result);

        return true;
    }


    public static string ConvertFromEnum<EnumType>(EnumType value)
    {
        string result =
            Enum.Format(
                typeof(EnumType), 
                value, 
                "g");

        //Debug.Log("BridgeManager: ConvertFromEnum: EnumType: " + typeof(EnumType) + " value: " + value + " result: " + result);

        return result;
    }


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
            Debug.LogError("Bridge: CreateTransport: called multiple times!");
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
        //Debug.Log("Bridge: HandleTransportStarted");

        string js =
            "StartBridge(\"" + transport.driver + "\", \"" + spreadsheetID + "\", \"" + configuration + "\");";
        //Debug.Log("Bridge: HandleTransportStarted: EvaluateJS: " + js);

        transport.EvaluateJS(js);

        JObject ev = new JObject();
        ev.Add("event", "StartedUnity");

        //Debug.Log("Bridge: HandleStart: sending StartedUnity ev: " + ev);
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

        //Debug.Log("Bridge: DistributeUnityEvents: evList.Count: " + evList.Count + " json.Length: " + json.Length);

        foreach (JObject ev in evList) {
            DistributeUnityEvent(ev);
        }
    }


    void DistributeUnityEvent(JObject ev)
    {
        string eventName = (string)ev["event"];

        //Debug.Log("Bridge: DistributeUnityEvent: eventName: " + eventName + " ev: " + ev);

        JObject data = ev["data"] as JObject;

        switch (eventName) {

            case "StartedJS": {

                //Debug.Log("Bridge: DistributeUnityEvent: StartedJS: " + ev);
                startedJS = true;

                break;

            }

            case "Log": {

                string line = (string)data["line"];

                Debug.Log ("Bridge: DistributeUnityEvent: Log: line: " + line);

                break;

            }

            case "Create": {

                string prefab = GetStringDefault(data, "prefab");
                string component = GetStringDefault(data, "component");
                string id = GetStringDefault(data, "id");
                JObject update = GetJObjectDefault(data, "update");
                JObject interests = GetJObjectDefault(data, "interests");
                JArray preEvents = GetJArrayDefault(data, "preEvents");
                JArray postEvents = GetJArrayDefault(data, "postEvents");

                //Debug.Log("Bridge: DistributeUnityEvent: Create: prefab: " + prefab + " id: " + id + " update: " + update + " interests: " + interests + " preEvents: " + preEvents + " postEvents: " + postEvents);

                GameObject instance = null;
                if (string.IsNullOrEmpty(prefab)) {
                    instance = new GameObject();
                } else {
                    GameObject prefabObject = Resources.Load<GameObject>(prefab);
                    //Debug.Log("Bridge: DistributeUnityEvent: Create: prefab: " + prefab + " prefabObject: " + prefabObject);
                    if (prefabObject == null) {
                        Debug.LogError("Bridge: DistributeUnityEvent: Create: Can't find prefab: " + prefab);
                        return;
                    }
                    instance = Instantiate(prefabObject);
                    //Debug.Log("Bridge: DistributeUnityEvent: Create: instance: " + instance);
                    if (instance == null) {
                        Debug.LogError("Bridge: DistributeUnityEvent: Create: Can't instantiate prefab: " + prefab + " prefabObject: " + prefabObject);
                        return;
                    }
                }

                BridgeObject bridgeObject;

                if (string.IsNullOrEmpty(component)) {

                    bridgeObject = instance.GetComponent<BridgeObject>();
                    //Debug.Log("Bridge: DistributeUnityEvent: Create: bridgeObject: " + bridgeObject);

                    if (bridgeObject == null) {
                        bridgeObject = instance.AddComponent<BridgeObject>();
                    }

                } else {

                    Type componentType = Type.GetType(component);

                    if (componentType == null) {
                        Debug.LogError("Bridge: DistributeUnityEvent: Create: undefined component class: " + component);
                        return;
                    }

                    if ((componentType != typeof(BridgeObject)) &&
                        (!componentType.IsSubclassOf(typeof(BridgeObject)))) {
                        Debug.LogError("Bridge: DistributeUnityEvent: Create: component class is not subclass of BridgeObject: " + component);
                        return;
                    }

                    bridgeObject = (BridgeObject)instance.AddComponent(componentType);
                }

                instance.name = id;
                bridgeObject.id = id;
                bridgeObject.bridge = this;
                bridgeObject.AddInterests(interests);
                objectToID[bridgeObject] = id;
                idToObject[id] = bridgeObject;

                //Debug.Log("Bridge: DistributeUnityEvent: Create: created, position: " + bridgeObject.transform.position.x + " " + bridgeObject.transform.position.y + " " + bridgeObject.transform.position.z + " bridgeObject: " + bridgeObject, bridgeObject);

                if (preEvents != null) {
                    bridgeObject.HandleEvents(preEvents);
                }

                if (update != null) {
                    bridgeObject.LoadUpdate(update);
                }

                bridgeObject.SendEventName("Created");

                if (postEvents != null) {
                    bridgeObject.HandleEvents(postEvents);
                }

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

                if (!idToObject.ContainsKey(id)) {
                    Debug.Log("Bridge: DistributeUnityEvent: missing id: " + id + " ev: " + ev);
                    return;
                }

                object obj = idToObject[id];
                //Debug.Log("Bridge: DistributeUnityEvent: obj: " + obj);

                BridgeObject bridgeObject = obj as BridgeObject;

                if (bridgeObject == null) {
                    Debug.LogError("Bridge: DistributeUnityEvent: tried to send eventName: " + eventName + " to non-BridgeObject obj: " + obj + " id: " + id + " ev: " + ev);
                    return;
                }

                bridgeObject.HandleEvent(ev);

                break;

            }

        }

    }


    public object GetObject(string id)
    {
        if (!idToObject.ContainsKey(id)) {
            return null;
        }

        object obj = idToObject[id];

        return obj;
    }


    public void DestroyObject(object obj)
    {
        BridgeObject bridgeObject = obj as BridgeObject;

        string id = null;

        if (bridgeObject != null) {

            if (bridgeObject.destroyed) {
                return;
            }

            id = bridgeObject.id;
            bridgeObject.destroyed = true;

            //Debug.Log("Bridge: DestroyObject: bridgeObject: " + bridgeObject);

            bridgeObject.SendEventName("Destroyed");

            Destroy(bridgeObject.gameObject);
        }

        if (objectToID.ContainsKey(obj)) {
            id = objectToID[obj];
            objectToID.Remove(obj);
        } else {
            //Debug.Log("Bridge: DestroyObject: objectToID missing obj: " + obj, this);
        }

        if ((id != null) &&
            idToObject.ContainsKey(id)) {
            idToObject.Remove(bridgeObject.id);
        } else {
            //Debug.Log("Bridge: DestroyObject: idToObject missing id: " + id, this);
        }

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


    public bool ConvertToType<T>(JToken data, ref T result)
    {
        //Debug.Log("Bridge: ConvertToType: T: " + typeof(T) + " data: " + data);

        result = (T)data.ToObject(typeof(T), jsonSerializer);

        //Debug.Log("Bridge: ConvertToType: result: " + result);

        return true;
    }


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
