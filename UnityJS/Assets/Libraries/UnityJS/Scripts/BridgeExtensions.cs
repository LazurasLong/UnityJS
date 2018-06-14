////////////////////////////////////////////////////////////////////////
// BridgeExtensions.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public static class BridgeExtensions {


    // https://stackoverflow.com/questions/299515/reflection-to-identify-extension-methods

    /// <summary>
    /// This Method extends the System.Type-type to get all extended methods.
    // It searches hereby in all assemblies which are known by the current AppDomain.
    /// </summary>
    /// <remarks>
    /// Insired by Jon Skeet from his answer on
    /// http://stackoverflow.com/questions/299515/c-sharp-reflection-to-identify-extension-methods
    /// </remarks>
    /// <returns>returns MethodInfo[] with the extended Method</returns>

    public static MethodInfo[] GetExtensionMethods(this Type t)
    {
        List<Type> AssTypes = new List<Type>();

        foreach (Assembly item in AppDomain.CurrentDomain.GetAssemblies()) {
            AssTypes.AddRange(item.GetTypes());
        }

        var query = from type in AssTypes
            where type.IsSealed && !type.IsGenericType && !type.IsNested
            from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
            where method.IsDefined(typeof(ExtensionAttribute), false)
            where method.GetParameters()[0].ParameterType == t
            select method;
        return query.ToArray<MethodInfo>();
    }


    /// <summary>
    /// Extends the System.Type-type to search for a given extended MethodName.
    /// </summary>
    /// <param name="MethodName">Name of the Method</param>
    /// <returns>the found Method or null</returns>
    public static MethodInfo GetExtensionMethod(this Type t, string MethodName)
    {
        var mi = from method in t.GetExtensionMethods()
            where method.Name == MethodName
            select method;

        if (mi.Count<MethodInfo>() <= 0) {
            return null;
        } else {
            return mi.First<MethodInfo>();
        }
    }


    public static bool IsNull(this JToken token)
    {
        return ((token == null) ||
                (token.Type == JTokenType.Null));
    }
    

    public static bool IsUndefined(this JToken token)
    {
        return ((token == null) ||
                (token.Type == JTokenType.Undefined));
    }
    

    public static bool IsString(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.String));
    }
    

    public static string GetString(this JToken token, string key, string def=null)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        string result = def;

        switch (resultToken.Type) {
            case JTokenType.Integer:
            case JTokenType.Float:
            case JTokenType.String:
            case JTokenType.Boolean:
                result = (string)resultToken;
                break;
            default:
                return def;
        }

        return result;
    }


    public static bool IsInteger(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Integer));
    }
    

    public static int GetInteger(this JToken token, string key, int def=0)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        int result = def;

        switch (resultToken.Type) {
            case JTokenType.Integer:
                result = (int)resultToken;
                break;
            case JTokenType.Float:
                result = (int)(float)resultToken;
                break;
            default:
                return def;
        }

        return result;
    }


    public static bool IsFloat(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Float));
    }
    

    public static float GetFloat(this JToken token, string key, float def=0.0f)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        float result = def;

        switch (resultToken.Type) {
            case JTokenType.Float:
                result = (float)resultToken;
                break;
            case JTokenType.Integer:
                result = (float)(int)resultToken;
                break;
            default:
                return def;
        }

        return result;
    }


    public static bool IsNumber(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Integer) &&
                (token.Type == JTokenType.Float));
    }
    

    public static bool IsBoolean(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Boolean));
    }
    

    public static bool GetBoolean(this JToken token, string key, bool def=false)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        bool result = def;

        switch (resultToken.Type) {
            case JTokenType.Boolean:
                result = (bool)resultToken;
                break;
            case JTokenType.Float:
                result = ((float)resultToken) != 0.0f;
                break;
            case JTokenType.Integer:
                result = ((int)resultToken) != 0;
                break;
            case JTokenType.String:
                result = ((string)resultToken) != "";
                break;
            default:
                return def;
        }

        return result;
    }


    public static bool IsArray(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Array));
    }
    

    public static JArray GetArray(this JToken token, string key, JArray def=null)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        JArray result = def;

        switch (resultToken.Type) {
            case JTokenType.Array:
                result = (JArray)resultToken;
                break;
            default:
                return def;
        }

        return result;
    }


    public static bool IsObject(this JToken token)
    {
        return ((token != null) &&
                (token.Type == JTokenType.Object));
    }
    

    public static JObject GetObject(this JToken token, string key, JObject def=null)
    {
        if ((key == null) ||
            (token == null) ||
            (token.Type != JTokenType.Object)) {
            return def;
        }

        JObject obj = (JObject)token;
        JToken resultToken = obj[key];

        if (resultToken == null) {
            return def;
        }

        JObject result = def;

        switch (resultToken.Type) {
            case JTokenType.Object:
                result = (JObject)resultToken;
                break;
            default:
                return def;
        }

        return result;
    }


    public static void UpdateMaterial(this Material material, JToken materialData)
    {
        //Debug.Log("BridgeExtensions: Material: UpdateMaterial: material: " + material + " materialData: " + materialData.GetType() + " " + materialData);

        JObject obj = materialData as JObject;
        if (obj == null) {
            Debug.LogError("BridgeExtensions: Material: UpdateMaterial: expected object!");
            return;
        }

        // color
        // doubleSidedGI
        // enableInstancing
        // globalIlluminationFlags
        // mainTexture
        // mainTextureOffset
        // mainTextureScale
        // passCount
        // renderQueue
        // shader => Shader.Find
        // shaderKeywords

        // pass => FindPass, SetPass

        // color* => SetColor
        // color_Color
        // color_SpecColor

        // texture* => SetTexure
        // texture_MainTex
        // texture_BumpMap
        // texture_MetallicGlossMap

        // keyword* => EnableKeyword / DisableKeyword
        // keyword_NORMALMAP
        // keyword_METALLICGLOSSMAP

        // overrideTag* => SetOverrideTag
        // overrideTagRenderType

        // shaderPass* => SetShaderPassEnabled

        // buffer* => SetBuffer
        // color* => SetColor
        // colorArray* => SetColorArray
        // float* => SetFloat
        // floatArray* => SetFloatArray
        // int* => SetInt
        // matrix* => SetMatrix
        // matrixArray* => SetMatrixArray
        // overrideTag* => SetOverrideTag
        // textureOffset* => SetTextureOffset
        // textureScale* => SetTextureScale
        // texture* => SetTexture
        // vector* => SetVector
        // vectorArray* => SetVectorArray

        // copyPropertiesFromMaterial => CopyPropertiesFromMaterial

        // lerp => Lerp(start, end, t)

        // https://docs.unity3d.com/Manual/MaterialsAccessingViaScript.html
        
        // The specific Keywords required to enable the Standard Shader features are as follows:
        // 
        // Keyword	Feature
        // _NORMALMAP				Normal Mapping
        // _ALPHATEST_ON			“Cut out” Transparency Rendering Mode
        // _ALPHABLEND_ON			“Fade” Transparency Rendering Mode
        // _ALPHAPREMULTIPLY_ON		“Transparent” Transparency Rendering Mode
        // _EMISSION				Emission Colour or Emission Mapping
        // _PARALLAXMAP				Height Mapping
        // _DETAIL_MULX2			Secondary “Detail” Maps (Albedo & Normal Map)
        // _METALLICGLOSSMAP		Metallic/Smoothness Mapping in Metallic Workflow
        // _SPECGLOSSMAP			Specular/Smoothness Mapping in Specular Workflow

        foreach (JProperty property in obj.Properties()) {
            string key = property.Name;
            //Debug.Log("BridgeExtensions: Material: Key: " + key);

            if (key.StartsWith("textureOffset")) {
                //Vector2 offset;
                //ConvertToType
            } else if (key.StartsWith("textureScale")) {
            } else if (key.StartsWith("texture")) {
            } else if (key.StartsWith("keyword")) {
            } else if (key.StartsWith("overrideTag")) {
            } else if (key.StartsWith("shaderPass")) {
            } else if (key.StartsWith("buffer")) {
            } else if (key.StartsWith("colorArray")) {
            } else if (key.StartsWith("color")) {
            } else if (key.StartsWith("floatArray")) {
            } else if (key.StartsWith("float")) {
            } else if (key.StartsWith("int")) {
            } else if (key.StartsWith("matrixArray")) {
            } else if (key.StartsWith("matrix")) {
            } else if (key.StartsWith("vectorArray")) {
            } else if (key.StartsWith("vector")) {
            } else if (key.StartsWith("copyPropertiesFromMaterial")) {
            } else if (key.StartsWith("lerp")) {
            } else {
                
            }
        }

    }


}

