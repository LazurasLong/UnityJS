/////////////////////////////////////////////////////////////////////////
// BridgeJsonConverter.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;


public class BridgeJsonConverter : JsonConverter {


    public delegate bool ConvertToDelegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer);
    public delegate bool ConvertFromDelegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer);


    public override bool CanConvert(Type objectType)
    {
        bool canConvertFrom =
            convertFromObjectMap.ContainsKey(objectType);

        bool canConvertTo =
            convertToObjectMap.ContainsKey(objectType);

        bool canConvert = 
            canConvertFrom || canConvertTo;

        if (canConvert) {
            //Debug.Log("BridgeJsonConverter: CanConvert: objectType: " + objectType + " canConvertFrom: " + canConvertFrom + " canConvertTo: " + canConvertTo);
        }

        return canConvert;
    }


    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        Type objectType = value.GetType();

        //Debug.Log("BridgeJsonConverter: WriteJson: writer: " + writer + " value: " + value + " serializer: " + serializer);

        if (!convertFromObjectMap.ContainsKey(objectType)) {
            Debug.LogError("BridgeJsonConverter: WriteJson: convertFromObjectMap missing objectType: " + objectType);
            writer.WriteNull();
            return;
        }
        
        ConvertFromDelegate converter = convertFromObjectMap[objectType];
        //Debug.Log("BridgeJsonConverter: WriteJson: converter: " + converter);

        bool success = converter(writer, objectType, value, serializer);
        //Debug.Log("BridgeJsonConverter: WriteJson: success: " + success);

        if (!success) {
            Debug.LogError("BridgeJsonConverter: WriteJson: error converting value: " + value + " to objectType: " + objectType);
        }

    }


    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        if (!convertToObjectMap.ContainsKey(objectType)) {
            Debug.LogError("BridgeJsonConverter: ReadJson: convertToObjectMap missing objectType: " + objectType);
            return null;
        }
        
        ConvertToDelegate converter = convertToObjectMap[objectType];
        //Debug.Log("BridgeJsonConverter: ReadJson: converter: " + converter);

        object result = null;

        bool success = converter(reader, objectType, ref result, serializer);
        if (!success) {
            Debug.LogError("BridgeJsonConverter: ReadJson: error converting JSON reader: " + reader + " to objectType: " + objectType);
            return null;
        }

        //Debug.Log("BridgeJsonConverter: ReadJson: result: " + result);

        return result;
    }


    public override bool CanRead
    {
        get { return true; }
    }


    public override bool CanWrite
    {
        get { return true; }
    }


    public static Dictionary<System.Type, ConvertToDelegate> convertToObjectMap =
        new Dictionary<System.Type, ConvertToDelegate>() {

            { typeof(Vector2), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {
                    if (reader.TokenType == JsonToken.Null) {
                        result = Vector2.zero;
                        return true;
                    }

                    Vector2 vector2 = Vector2.zero;

                    JObject obj = JObject.Load(reader);
                    float x = (float)obj["x"];
                    float y = (float)obj["y"];

                    result = new Vector2(x, y);
                    return true;
                }
            },

            { typeof(Vector3), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {
                    if (reader.TokenType == JsonToken.Null) {
                        result = Vector3.zero;
                        return true;
                    }

                    Vector3 vector3 = Vector3.zero;

                    JObject obj = JObject.Load(reader);
                    float x = (float)obj["x"];
                    float y = (float)obj["y"];
                    float z = (float)obj["z"];

                    result = new Vector3(x, y, z);
                    return true;
                }
            },

            { typeof(Vector4), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {
                    if (reader.TokenType == JsonToken.Null) {
                        result = Vector4.zero;
                        return true;
                    }

                    Vector4 vector4 = Vector4.zero;

                    JObject obj = JObject.Load(reader);
                    float x = (float)obj["x"];
                    float y = (float)obj["y"];
                    float z = (float)obj["z"];
                    float w = (float)obj["w"];

                    result = new Vector4(x, y, z, w);
                    return true;
                }
            },

            { typeof(Quaternion), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {
                    if (reader.TokenType == JsonToken.Null) {
                        result = Quaternion.identity;
                        return true;
                    }

                    Vector4 vector4 = Vector4.zero;
                    JObject obj = JObject.Load(reader);

                    JToken rollToken = obj["roll"];
                    JToken pitchToken = obj["pitch"];
                    JToken yawToken = obj["yaw"];
                    if ((rollToken != null) ||
                        (pitchToken != null) ||
                        (yawToken != null)) {

                        float roll = (rollToken == null) ? 0.0f : (float)rollToken;
                        float pitch = (pitchToken == null) ? 0.0f : (float)pitchToken;
                        float yaw = (yawToken == null) ? 0.0f : (float)yawToken;

                        result = Quaternion.Euler(pitch, yaw, roll);

                    } else {

                        float x = (float)obj["x"];
                        float y = (float)obj["y"];
                        float z = (float)obj["z"];
                        float w = (float)obj["w"];

                        result = new Quaternion(x, y, z, w);

                    }

                    return true;
                }
            },

            { typeof(Color), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {

                    if (reader.TokenType == JsonToken.Null) {
                        result = Color.black;
                        return true;
                    }

                    Color color = Color.black;

                    if (reader.TokenType == JsonToken.String) {
                        string htmlString = (string)JValue.Load(reader);
                        //Debug.Log("BridgeJsonConverter: convertToObjectMap: Color: htmlString: " + htmlString);

                        if (!ColorUtility.TryParseHtmlString(htmlString, out color)) {
                            Debug.LogError("BridgeJsonConverter: convertToObjectMap: Color: invalid htmlString: " + htmlString);
                            return false;
                        }

                        return true;
                    }

                    JObject obj = JObject.Load(reader);

                    float r = (float)obj["r"];
                    float g = (float)obj["g"];
                    float b = (float)obj["b"];
                    JToken aToken = obj["a"];
                    float a = (aToken == null) ? 1.0f : (float)aToken;

                    result = new Color(r, g, b, a);
                    return true;
                }
            },

            { typeof(Matrix4x4), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {

                    Matrix4x4 mat = Matrix4x4.zero;

                    if (reader.TokenType == JsonToken.Null) {
                        result = mat;
                        return true;
                    }

                    if (reader.TokenType != JsonToken.StartArray) {
                        Debug.LogError("BridgeManager: Matrix4x4: expected array");
                        result = mat;
                        return false;
                    }

                    JArray a = JArray.Load(reader);

                    if (a.Count != 16) {
                        Debug.LogError("BridgeManager: Matrix4x4: expected array of length 16");
                        result = mat;
                        return false;
                    }

                    mat.SetColumn(0, new Vector4((float)a[0], (float)a[1], (float)a[2], (float)a[3]));
                    mat.SetColumn(1, new Vector4((float)a[4], (float)a[5], (float)a[6], (float)a[7]));
                    mat.SetColumn(2, new Vector4((float)a[8], (float)a[9], (float)a[10], (float)a[11]));
                    mat.SetColumn(3, new Vector4((float)a[12], (float)a[13], (float)a[14], (float)a[15]));

                    result = mat;
                    return true;
                }
            },

            { typeof(ParticleSystem.MinMaxCurve), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {

                    ParticleSystem.MinMaxCurve minMaxCurve;

                    if (reader.TokenType == JsonToken.Null) {
                        result = null;
                        return true;
                    }

                    JToken token = JToken.Load(reader);

                    if ((token.Type == JTokenType.Integer) ||
                        (token.Type == JTokenType.Float)) {

                        float constant = (float)token;
                        minMaxCurve = new ParticleSystem.MinMaxCurve(constant);
                        result = minMaxCurve;

                        return true;
                    }


                    JObject obj = (JObject)token;

                    string minMaxCurveType = (string)obj["minMaxCurveType"];

                    switch (minMaxCurveType) {

                        case "Constant": {

                            float constant = (float)obj["constant"];

                            result = new ParticleSystem.MinMaxCurve(constant);
                            //Debug.Log("BridgeManager: MinMaxCurve: minMaxCurveType: Constant: constant:" + constant + " result: " + result);

                            return true;
                        }

                        case "Curve": {

                            JToken multiplierToken = obj["multiplier"];
                            float multiplier = (multiplierToken == null) ? 1.0f : (float)multiplierToken;

                            JToken curveToken = obj["curve"];
                            AnimationCurve curve = null;

                            if (curveToken != null) {
                                curve = (AnimationCurve)curveToken.ToObject(typeof(AnimationCurve), serializer);
                            }

                            minMaxCurve = new ParticleSystem.MinMaxCurve(multiplier, curve);
                            result = minMaxCurve;

                            //Debug.Log("BridgeManager: MinMaxCurve: minMaxCurveType: Curve: multiplier: " + multiplier + " curve: " + curve + " result: " + result);

                            return true;
                        }

                        case "RandomCurves": {

                            JToken multiplierToken = obj["multiplier"];
                            float multiplier = (multiplierToken == null) ? 1.0f : (float)multiplierToken;

                            JToken minCurveToken = obj["min"];
                            AnimationCurve minCurve = null;
                            if (minCurveToken != null) {
                                minCurve = (AnimationCurve)minCurveToken.ToObject(typeof(AnimationCurve), serializer);
                            }

                            JToken maxCurveToken = obj["max"];
                            AnimationCurve maxCurve = null;
                            if (maxCurveToken != null) {
                                maxCurve = (AnimationCurve)maxCurveToken.ToObject(typeof(AnimationCurve), serializer);
                            }

                            minMaxCurve = new ParticleSystem.MinMaxCurve(multiplier, minCurve, maxCurve);
                            result = minMaxCurve;

                            //Debug.Log("BridgeManager: convertToObjectMap: MinMaxCurve: minMaxCurveType: RandomCurves: multiplier: " + multiplier + " minCurve: " + minCurve + " maxCurve: " + maxCurve + " result: " + result);

                            return true;
                        }

                        case "RandomConstants": {

                            float minConstant = (float)obj["min"];
                            float maxConstant = (float)obj["max"];

                            minMaxCurve = new ParticleSystem.MinMaxCurve(minConstant, maxConstant);
                            result = minMaxCurve;

                            //Debug.Log("BridgeManager: convertToObjectMap: MinMaxCurve: minMaxCurveType: RandomConstants min: " + minConstant + " max: " + maxConstant + " result: " + result);
                            return true;
                        }

                        default: {
                            Debug.LogError("BridgeManager: convertToObjectMap: MinMaxCurve: unexpected minMaxCurveType: " + minMaxCurveType);
                            return false;
                        }

                    }

                }
            },

            { typeof(ParticleSystem.MinMaxGradient), // struct
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {

                    ParticleSystem.MinMaxGradient minMaxGradient;

                    if (reader.TokenType == JsonToken.Null) {
                        result = null;
                        return true;
                    }

                    JToken token = JToken.Load(reader);
                    JObject obj = (JObject)token;

                    string minMaxGradientType = (string)obj["minMaxGradientType"];

                    if (string.IsNullOrEmpty(minMaxGradientType)) {
                        Color color = (Color)obj.ToObject(typeof(Color), serializer);

                        minMaxGradient = new ParticleSystem.MinMaxGradient(color);
                        minMaxGradient.mode = ParticleSystemGradientMode.Color;
                        result = minMaxGradient;
                        //Debug.Log("BridgeManager: convertToObjectMap: MinMaxGradient: color:" + color + " result: " + result);
                        return true;
                    }

                    switch (minMaxGradientType) {

                        case "Color": {
                            JToken colorToken = obj["color"];
                            Color color = (colorToken != null) ? (Color)colorToken.ToObject(typeof(Color), serializer) : Color.white;
                            minMaxGradient = new ParticleSystem.MinMaxGradient(color);
                            minMaxGradient.mode = ParticleSystemGradientMode.Color;
                            result = minMaxGradient;
                            return true;
                        }

                        case "Gradient": {
                            JToken gradientToken = obj["gradient"];
                            Gradient gradient = (gradientToken != null) ? (Gradient)gradientToken.ToObject(typeof(Gradient), serializer) : null;
                            minMaxGradient = new ParticleSystem.MinMaxGradient();
                            minMaxGradient.mode = ParticleSystemGradientMode.Gradient;
                            minMaxGradient.gradient = gradient;
                            result = minMaxGradient;
                            return true;
                        }

                        case "TwoColors": {
                            JToken minToken = obj["min"];
                            Color min = (minToken != null) ? (Color)minToken.ToObject(typeof(Color), serializer) : Color.white;
                            JToken maxToken = obj["max"];
                            Color max = (maxToken != null) ? (Color)maxToken.ToObject(typeof(Color), serializer) : Color.white;
                            minMaxGradient = new ParticleSystem.MinMaxGradient();
                            minMaxGradient.mode = ParticleSystemGradientMode.TwoColors;
                            minMaxGradient.colorMin = min;
                            minMaxGradient.colorMax = max;
                            result = minMaxGradient;
                            return true;
                        }

                        case "TwoGradients": {
                            JToken minToken = obj["min"];
                            Gradient gradientMin = (minToken != null) ? (Gradient)minToken.ToObject(typeof(Gradient), serializer) : null;
                            JToken maxToken = obj["max"];
                            Gradient gradientMax = (maxToken != null) ? (Gradient)maxToken.ToObject(typeof(Gradient), serializer) : null;
                            minMaxGradient = new ParticleSystem.MinMaxGradient();
                            minMaxGradient.mode = ParticleSystemGradientMode.TwoGradients;
                            minMaxGradient.gradientMin = gradientMin;
                            minMaxGradient.gradientMax = gradientMax;
                            result = minMaxGradient;
                            return true;
                        }

                        case "RandomColor": {
                            JToken gradientToken = obj["gradient"];
                            Gradient gradient = (gradientToken != null) ? (Gradient)gradientToken.ToObject(typeof(Gradient), serializer) : null;
                            minMaxGradient = new ParticleSystem.MinMaxGradient();
                            minMaxGradient.mode = ParticleSystemGradientMode.RandomColor;
                            minMaxGradient.gradient = gradient;
                            result = minMaxGradient;
                            return true;
                        }

                        default: {
                            Debug.LogError("BridgeManager: convertToObjectMap: MinMaxGradient: unexpected minMaxGradientType: " + minMaxGradientType);
                            result = null;
                            return false;
                        }

                    }

                }
            },

#if false
            { typeof(AnimationCurve), // class
                delegate(JsonReader reader, System.Type objectType, ref object result, JsonSerializer serializer) {

                    AnimationCurve animationCurve = new AnimationCurve();

                    if (reader.TokenType == JsonToken.Null) {
                        result = null;
                        return true;
                    }

                    JObject obj = JObject.Load(reader);

                    string animationCurveType = (string)obj["animationCurveType"];

                    switch (animationCurveType) {

                        case "EaseInOut": {
                            result = AnimationCurve.EaseInOut(
                                GetFloat(dict, "timeStart"),
                                GetFloat(dict, "timeEnd"),
                                GetFloat(dict, "valueStart"),
                                GetFloat(dict, "valueEnd"));
                            return true;
                        }

                        case "Linear": {
                            result = AnimationCurve.Linear(
                                GetFloat(dict, "timeStart"),
                                GetFloat(dict, "timeEnd"),
                                GetFloat(dict, "valueStart"),
                                GetFloat(dict, "valueEnd"));
                            return true;
                        }

                        case "Keys": {
                            fsData keys = dict.ContainsKey("keys") ? dict["keys"] : null;
                            Keyframe[] curveKeys = null;

                            //Debug.Log("BridgeManager: ConvertToAnimationCurve: keys: " + keys + " isList: " + keys.IsList);
                            if ((keys != null) &&
                                !keys.IsList) {
                                Debug.LogError("BridgeManager: ConvertToAnimationCurve: keys should be list!");
                                return false;
                            }

                            var keyframeList = new List<Keyframe>();
                            foreach (fsData key in keys.AsList) {

                                //Debug.Log("BridgeManager: ConvertToAnimationCurve: key: " + key + " isDictionary: " + key.IsDictionary);

                                Keyframe keyframe = new Keyframe();
                                if (!ConvertToKeyframe(key, ref keyframe)) {
                                    //Debug.Log("BridgeManager: ConvertToAnimationCurve: Can't convert to Keyframe key: " + key);
                                    return false;
                                }

                                keyframeList.Add(keyframe);
                            }

                            curveKeys = keyframeList.ToArray();
                            //Debug.Log("BridgeManager: ConvertToAnimationCurve: total keys: " + curveKeys.Length + " curveKeys: " + curveKeys);

                            result = new AnimationCurve(curveKeys);

                            fsData preWrapMode = dict.ContainsKey("preWrapMode") ? dict["preWrapMode"] : null;
                            if (preWrapMode != null) {
                                WrapMode wrapMode = result.preWrapMode;
                                if (!ConvertToEnum<WrapMode>(preWrapMode, ref wrapMode)) {
                                    Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid preWrapMode: " + preWrapMode);
                                } else {
                                    result.preWrapMode = wrapMode;
                                }
                            }

                            fsData postWrapMode = dict.ContainsKey("postWrapMode") ? dict["postWrapMode"] : null;
                            if (postWrapMode != null) {
                                WrapMode wrapMode = result.postWrapMode;
                                if (!ConvertToEnum<WrapMode>(postWrapMode, ref wrapMode)) {
                                    Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid postWrapMode: " + postWrapMode);
                                } else {
                                    result.postWrapMode = wrapMode;
                                }
                            }

                            return true;
                        }

                        default: {
                            Debug.LogError("BridgeManager: convertToObjectMap: AnimationCurve: unexpected animationCurveType: " + animationCurveType);
                            result = null;
                            return false;
                        }
                    }

                }
            },
#endif

        };


    public static Dictionary<System.Type, ConvertFromDelegate> convertFromObjectMap =
        new Dictionary<System.Type, ConvertFromDelegate>() {

            { typeof(Vector2), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Vector2 vector2 = (Vector2)value;
                    writer.WriteStartObject();
                    writer.WritePropertyName("x");
                    writer.WriteValue(vector2.x);
                    writer.WritePropertyName("y");
                    writer.WriteValue(vector2.y);
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(Vector3), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Vector3 vector3 = (Vector3)value;
                    writer.WriteStartObject();
                    writer.WritePropertyName("x");
                    writer.WriteValue(vector3.x);
                    writer.WritePropertyName("y");
                    writer.WriteValue(vector3.y);
                    writer.WritePropertyName("z");
                    writer.WriteValue(vector3.z);
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(Vector4), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Vector4 vector4 = (Vector4)value;
                    writer.WriteStartObject();
                    writer.WritePropertyName("x");
                    writer.WriteValue(vector4.x);
                    writer.WritePropertyName("y");
                    writer.WriteValue(vector4.y);
                    writer.WritePropertyName("z");
                    writer.WriteValue(vector4.z);
                    writer.WritePropertyName("w");
                    writer.WriteValue(vector4.w);
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(Quaternion), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Quaternion quaternion = (Quaternion)value;
                    writer.WriteStartObject();
                    writer.WritePropertyName("x");
                    writer.WriteValue(quaternion.x);
                    writer.WritePropertyName("y");
                    writer.WriteValue(quaternion.y);
                    writer.WritePropertyName("z");
                    writer.WriteValue(quaternion.z);
                    writer.WritePropertyName("w");
                    writer.WriteValue(quaternion.w);
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(Color), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Color color = (Color)value;
                    writer.WriteStartObject();
                    writer.WritePropertyName("r");
                    writer.WriteValue(color.r);
                    writer.WritePropertyName("g");
                    writer.WriteValue(color.g);
                    writer.WritePropertyName("b");
                    writer.WriteValue(color.b);
                    writer.WritePropertyName("a");
                    writer.WriteValue(color.a);
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(Matrix4x4), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    Matrix4x4 mat = (Matrix4x4)value;
                    writer.WriteStartArray();
                    for (int i = 0; i < 16; i++) {
                        writer.WriteValue(mat[i]);
                    }
                    writer.WriteEndArray();
                    return true;
                }
            },

            { typeof(ParticleSystem.MinMaxCurve), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    //ParticleSystem.MinMaxCurve minMaxCurve;
                    writer.WriteStartObject();
                    // TODO
                    writer.WriteEndObject();
                    return true;
                }
            },

            { typeof(ParticleSystem.MinMaxGradient), // struct
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    //ParticleSystem.MinMaxGradient minMaxGradient;
                    writer.WriteStartObject();
                    // TODO
                    writer.WriteEndObject();
                    return true;
                }
            },

#if false
            { typeof(AnimationCurve), // class
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    AnimationCurve animationCurve = (AnimationCurve)value;
                    result = ConvertFromAnimationCurve(animationCurve);
                    return true;
                }
            },
#endif

#if false
            { typeof(ParticleCollisionEvent),
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    ParticleCollisionEvent particleCollisionEvent = (ParticleCollisionEvent)value;
                    result = ConvertFromParticleCollisionEvent(particleCollisionEvent);
                    return true;
                }
            },

#if USE_ARKIT
            { typeof(ARPlaneAnchor),
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    ARPlaneAnchor arPlaneAnchor = (ARPlaneAnchor)value;
                    result = ConvertFromARPlaneAnchor(arPlaneAnchor);
                    return true;
                }
            },

            { typeof(ARUserAnchor),
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    ARUserAnchor arUserAnchor = (ARUserAnchor)value;
                    result = ConvertFromARUserAnchor(arUserAnchor);
                    return true;
                }
            },

            { typeof(ARHitTestResult),
                delegate(JsonWriter writer, System.Type objectType, object value, JsonSerializer serializer) {
                    ARHitTestResult arHitTestResult = (ARHitTestResult)value;
                    result = ConvertFromARHitTestResult(arHitTestResult);
                    return true;
                }
            },
#endif

#endif

        };


#if false


    ////////////////////////////////////////////////////////////////////////
    // Proxied C# object.


    public static bool ConvertToProxied(JToken data, ref object result)
    {
        if (data.IsNull) {
            result = null;
            return true;
        }

        if (!data.IsString) {
            return false;
        }

        string handle = data.AsString;

        object proxied = ProxyGroup.FindProxied(handle);

        if (proxied == null) {
            Debug.LogError("BridgeManager: ConvertToProxied: undefined handle: " + handle);
            return false;
        }

        result = proxied;

        return true;
    }
    
    
    public static bool ConvertFromProxied(object obj, ref JToken result)
    {
        if (obj == null) {
            result = JToken.Null;
            return true;
        }

        string handle = ProxyGroup.FindHandle(obj);

        if (handle == null) {
            Debug.LogError("BridgeManager: ConvertFromProxied: can't make handle for obj: " + obj);
            return false;
        }

        result = new JToken(handle);
        return true;
    }


#endif


    ////////////////////////////////////////////////////////////////////////
    // Unity types.


#if false


    ////////////////////////////////////////////////////////////////////////
    // AnimationCurve type.


    public static bool ConvertToAnimationCurve(JToken data, ref AnimationCurve result)
    {
        if (data.Type != JTokenType.Object) {
            return false;
        }

        JObject dict = (JObject)dict;
        string animationCurveType = GetString(dict, "animationCurveType");

        switch (animationCurveType) {

            case "EaseInOut":
                result = AnimationCurve.EaseInOut(
                    GetFloat(dict, "timeStart"),
                    GetFloat(dict, "timeEnd"),
                    GetFloat(dict, "valueStart"),
                    GetFloat(dict, "valueEnd"));
                return true;

            case "Linear":
                result = AnimationCurve.Linear(
                    GetFloat(dict, "timeStart"),
                    GetFloat(dict, "timeEnd"),
                    GetFloat(dict, "valueStart"),
                    GetFloat(dict, "valueEnd"));
                return true;

            case "Keys":
                JToken keys = dict.ContainsKey("keys") ? dict["keys"] : null;
                Keyframe[] curveKeys = null;

                //Debug.Log("BridgeManager: ConvertToAnimationCurve: keys: " + keys + " isList: " + keys.IsList);
                if ((keys != null) &&
                    !keys.IsList) {
                    Debug.LogError("BridgeManager: ConvertToAnimationCurve: keys should be list!");
                    return false;
                }

                var keyframeList = new List<Keyframe>();
                foreach (JToken key in keys.AsList) {

                    //Debug.Log("BridgeManager: ConvertToAnimationCurve: key: " + key + " isDictionary: " + key.IsDictionary);

                    Keyframe keyframe = new Keyframe();
                    if (!ConvertToKeyframe(key, ref keyframe)) {
                        //Debug.Log("BridgeManager: ConvertToAnimationCurve: Can't convert to Keyframe key: " + key);
                        return false;
                    }

                    keyframeList.Add(keyframe);
                }

                curveKeys = keyframeList.ToArray();
                //Debug.Log("BridgeManager: ConvertToAnimationCurve: total keys: " + curveKeys.Length + " curveKeys: " + curveKeys);

                result = new AnimationCurve(curveKeys);

                JToken preWrapMode = dict.ContainsKey("preWrapMode") ? dict["preWrapMode"] : null;
                if (preWrapMode != null) {
                    WrapMode wrapMode = result.preWrapMode;
                    if (!ConvertToEnum<WrapMode>(preWrapMode, ref wrapMode)) {
                        Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid preWrapMode: " + preWrapMode);
                    } else {
                        result.preWrapMode = wrapMode;
                    }
                }

                JToken postWrapMode = dict.ContainsKey("postWrapMode") ? dict["postWrapMode"] : null;
                if (postWrapMode != null) {
                    WrapMode wrapMode = result.postWrapMode;
                    if (!ConvertToEnum<WrapMode>(postWrapMode, ref wrapMode)) {
                        Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid postWrapMode: " + postWrapMode);
                    } else {
                        result.postWrapMode = wrapMode;
                    }
                }

                return true;

            default:
                Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid animationCurveType: " + animationCurveType);
                return false;

        }

    }


    public static JToken ConvertFromAnimationCurve(AnimationCurve animationCurve)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        // TODO

        return result;
    }


    public static AnimationCurve GetAnimationCurve(Dictionary<string, JToken> dict, string key)
    {
        AnimationCurve result = new AnimationCurve();

        if (dict.ContainsKey(key)) {
            ConvertToAnimationCurve(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // Keyframe type.


    public static bool ConvertToKeyframe(JToken data, ref Keyframe result)
    {
        if (!data.IsDictionary) {
            return false;
        }

        var dict = data.AsDictionary;
        float time = GetFloat(dict, "time");
        float value = GetFloat(dict, "value");
        float inTangent = GetFloat(dict, "inTangent");
        float outTangent = GetFloat(dict, "outTangent");

        result = new Keyframe(time, value, inTangent, outTangent);
        return true;
    }


    public static JToken ConvertFromKeyframe(Keyframe keyframe)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;
        dict["time"] = ConvertFromFloat(keyframe.time);
        dict["value"] = ConvertFromFloat(keyframe.value);
        dict["inTangent"] = ConvertFromFloat(keyframe.inTangent);
        dict["outTangent"] = ConvertFromFloat(keyframe.outTangent);

        return result;
    }


    public static Keyframe GetKeyframe(Dictionary<string, JToken> dict, string key)
    {
        Keyframe result = new Keyframe();

        if (dict.ContainsKey(key)) {
            ConvertToKeyframe(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // Gradient type.


    public static bool ConvertToGradient(JToken data, ref Gradient result)
    {
        if (!data.IsDictionary) {
            return false;
        }

        var dict = data.AsDictionary;
        List<GradientAlphaKey> gradientAlphaKeysList = new List<GradientAlphaKey>();
        List<GradientColorKey> gradientColorKeysList = new List<GradientColorKey>();

        if (dict.ContainsKey("alphaKeys")) {
            JToken alphaKeysData = dict["alphaKeys"];

            if (!alphaKeysData.IsList) {
                Debug.LogError("BridgeManager: ConvertToGradient: invalid alphaKeysData: " + alphaKeysData);
            } else {

                foreach (JToken key in alphaKeysData.AsList) {
                    //Debug.Log("BridgeManager: ConvertToGradient: alphaKeys: key: " + key + " isDictionary: " + key.IsDictionary);

                    if (!key.IsDictionary) {
                        Debug.LogError("BridgeManager: ConvertToGradient: key should be dictionary!");
                        return false;
                    }

                    GradientAlphaKey gradientAlphaKey = new GradientAlphaKey();
                    if (!ConvertToGradientAlphaKey(key, ref gradientAlphaKey)) {
                        //Debug.Log("BridgeManager: ConvertToGradient: Can't convert to GradientAlphaKey key: " + key);
                        return false;
                    }

                    gradientAlphaKeysList.Add(gradientAlphaKey);
                }

            }

        }

        if (dict.ContainsKey("colorKeys")) {
            JToken colorKeysData = dict["colorKeys"];

            if (!colorKeysData.IsList) {
                Debug.LogError("BridgeManager: ConvertToGradient: invalid colorKeysData: " + colorKeysData);
            } else {

                foreach (JToken key in colorKeysData.AsList) {
                    //Debug.Log("BridgeManager: ConvertToGradient: colorKeys: key: " + key + " isDictionary: " + key.IsDictionary);

                    GradientColorKey gradientColorKey = new GradientColorKey();
                    if (!ConvertToGradientColorKey(key, ref gradientColorKey)) {
                        //Debug.Log("BridgeManager: ConvertToGradient: Can't convert to GradientColorKey key: " + key);
                        return false;
                    }

                    gradientColorKeysList.Add(gradientColorKey);
                }

            }

        }

        result = new Gradient();

        result.alphaKeys = gradientAlphaKeysList.ToArray();
        result.colorKeys = gradientColorKeysList.ToArray();
        if (dict.ContainsKey("mode")) {
            GradientMode gradientMode = result.mode;
            if (!ConvertToEnum<GradientMode>(dict["mode"], ref gradientMode)) {
                Debug.LogError("BridgeManager: ConvertToAnimationCurve: invalid gradientMode: " + dict["mode"]);
            } else {
                result.mode = gradientMode;
            }
        }

        return true;
    }


    public static JToken ConvertFromGradient(Gradient gradient)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        // TODO

        return result;
    }


    public static Gradient GetGradient(Dictionary<string, JToken> dict, string key)
    {
        Gradient result = new Gradient();

        if (dict.ContainsKey(key)) {
            ConvertToGradient(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // GradientColorKey type.


    public static bool ConvertToGradientColorKey(JToken data, ref GradientColorKey result)
    {
        if (!data.IsDictionary) {
            return false;
        }

        var dict = data.AsDictionary;
        Color color = GetColor(dict, "color", Color.white);
        float time = GetFloat(dict, "time");

        result = new GradientColorKey(color, time);
        return true;
    }


    public static JToken ConvertFromGradientColorKey(GradientColorKey gradientColorKey)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;
        dict["color"] = ConvertFromColor(gradientColorKey.color);
        dict["time"] = ConvertFromFloat(gradientColorKey.time);

        return result;
    }


    public static GradientColorKey GetGradientColorKey(Dictionary<string, JToken> dict, string key)
    {
        GradientColorKey result = new GradientColorKey();

        if (dict.ContainsKey(key)) {
            ConvertToGradientColorKey(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // GradientAlphaKey type.


    public static bool ConvertToGradientAlphaKey(JToken data, ref GradientAlphaKey result)
    {
        if (!data.IsDictionary) {
            return false;
        }

        var dict = data.AsDictionary;
        float alpha = GetFloat(dict, "alpha", 1.0f);
        float time = GetFloat(dict, "time");

        result = new GradientAlphaKey(alpha, time);
        return true;
    }


    public static JToken ConvertFromGradientAlphaKey(GradientAlphaKey gradientAlphaKey)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;
        dict["alpha"] = ConvertFromFloat(gradientAlphaKey.alpha);
        dict["time"] = ConvertFromFloat(gradientAlphaKey.time);

        return result;
    }


    public static GradientAlphaKey GetGradientAlphaKey(Dictionary<string, JToken> dict, string key)
    {
        GradientAlphaKey result = new GradientAlphaKey();

        if (dict.ContainsKey(key)) {
            ConvertToGradientAlphaKey(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // ParticleCollisionEvent type.


    public static bool ConvertToParticleCollisionEvent(JToken data, ref ParticleCollisionEvent result)
    {
        return false; // TODO: ConvertToParticleCollisionEvent
    }


    public static JToken ConvertFromParticleCollisionEvent(ParticleCollisionEvent particleCollisionEvent)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        JToken colliderComponent = JToken.Null;
        ConvertFromProxied(particleCollisionEvent.colliderComponent, ref colliderComponent);
        dict["colliderComponent"] = colliderComponent;

        dict["intersection"] = ConvertFromVector3(particleCollisionEvent.intersection);
        dict["normal"] = ConvertFromVector3(particleCollisionEvent.normal);
        dict["velocity"] = ConvertFromVector3(particleCollisionEvent.velocity);

        return result;
    }


    public static ParticleCollisionEvent GetParticleCollisionEvent(Dictionary<string, JToken> dict, string key)
    {
        ParticleCollisionEvent result = new ParticleCollisionEvent();

        if (dict.ContainsKey(key)) {
            ConvertToParticleCollisionEvent(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // ARPlaneAnchor type.


    public static bool ConvertToARPlaneAnchor(JToken data, ref ARPlaneAnchor result)
    {
        return false; // TODO: ConvertToARPlaneAnchor
    }


    public static JToken ConvertFromARPlaneAnchor(ARPlaneAnchor arPlaneAnchor)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        dict["identifier"] = ConvertFromString(arPlaneAnchor.identifier);

        Matrix4x4 mat = arPlaneAnchor.transform;
        dict["transform"] = ConvertFromMatrix4x4(mat);

        Vector3 transformPosition = UnityARMatrixOps.GetPosition(mat);
        dict["transformPosition"] = ConvertFromVector3(transformPosition);

        Quaternion transformRotation = UnityARMatrixOps.GetRotation(mat);
        dict["transformRotation"] = ConvertFromQuaternion(transformRotation);

        Vector3 transformEulerAngles = transformRotation.eulerAngles;
        dict["transformEulerAngles"] = ConvertFromVector3(transformEulerAngles);

        dict["alignment"] = ConvertFromEnum<ARPlaneAnchorAlignment>(arPlaneAnchor.alignment);

        dict["center"] = ConvertFromVector3(arPlaneAnchor.center);

        Vector3 centerPosition = 
            transformPosition + 
            (transformRotation * new Vector3(arPlaneAnchor.center.x, arPlaneAnchor.center.y, -arPlaneAnchor.center.z));
        dict["centerPosition"] = ConvertFromVector3(centerPosition);

        dict["extent"] = ConvertFromVector3(arPlaneAnchor.extent);

        return result;
    }


    public static ARPlaneAnchor GetARPlaneAnchor(Dictionary<string, JToken> dict, string key)
    {
        ARPlaneAnchor result = new ARPlaneAnchor();

        if (dict.ContainsKey(key)) {
            ConvertToARPlaneAnchor(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // ARUserAnchor type.


    public static bool ConvertToARUserAnchor(JToken data, ref ARUserAnchor result)
    {
        return false; // TODO: ConvertToARUserAnchor
    }


    public static JToken ConvertFromARUserAnchor(ARUserAnchor arUserAnchor)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        dict["identifier"] = ConvertFromString(arUserAnchor.identifier);

        Matrix4x4 mat = arUserAnchor.transform;
        dict["transform"] = ConvertFromMatrix4x4(mat);

        Vector4 pos = mat.GetColumn(3);
        Vector3 transformPosition = new Vector3(pos.x, pos.y, pos.z);
        dict["transformPosition"] = ConvertFromVector3(transformPosition);

        Quaternion transformRotation = Quaternion.LookRotation(mat.GetColumn(2), mat.GetColumn(1));
        dict["transformRotation"] = ConvertFromQuaternion(transformRotation);

        return result;
    }


    public static ARUserAnchor GetARUserAnchor(Dictionary<string, JToken> dict, string key)
    {
        ARUserAnchor result = new ARUserAnchor();

        if (dict.ContainsKey(key)) {
            ConvertToARUserAnchor(dict[key], ref result);
        }

        return result;
    }


    ////////////////////////////////////////////////////////////////////////
    // ARHitTestResult type.


    public static bool ConvertToARHitTestResult(JToken data, ref ARHitTestResult result)
    {
        return false; // TODO: ConvertToARHitTestResult
    }


    public static JToken ConvertFromARHitTestResult(ARHitTestResult arHitTestResult)
    {
        JToken result = CreateDictionary();
        var dict = result.AsDictionary;

        dict["type"] = ConvertFromEnum<ARHitTestResultType>(arHitTestResult.type);
        dict["anchorIdentifier"] = ConvertFromString(arHitTestResult.anchorIdentifier);
        dict["distance"] = ConvertFromDouble(arHitTestResult.distance);
        dict["worldTransform"] = ConvertFromMatrix4x4(arHitTestResult.worldTransform);
        dict["localTransform"] = ConvertFromMatrix4x4(arHitTestResult.localTransform);

        return result;
    }


    public static ARHitTestResult GetARHitTestResult(Dictionary<string, JToken> dict, string key)
    {
        ARHitTestResult result = new ARHitTestResult();

        if (dict.ContainsKey(key)) {
            ConvertToARHitTestResult(dict[key], ref result);
        }

        return result;
    }


#endif


}
