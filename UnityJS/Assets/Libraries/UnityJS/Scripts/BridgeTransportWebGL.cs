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


    // https://forum.unity.com/threads/monopinvokecallback-in-unity.132510/

    public class TextureInfo {
        public int id;
        public int width;
        public int height;
        public Texture2D texture;
        public bool locked;
        public byte[] data;
        public GCHandle handle;
        public IntPtr pointer;
    };


    public delegate int AllocateTextureDelegate(int width, int height);
    public delegate void FreeTextureDelegate(int id);
    public delegate int LockTextureDelegate(int id);
    public delegate void UnlockTextureDelegate(int id);


    public static Dictionary<int, TextureInfo> textureInfos = new Dictionary<int, TextureInfo>();
    public static int nextTextureID = 1;


    private const string PLUGIN_DLL = "__Internal";


    [DllImport(PLUGIN_DLL)]
    public static extern void _UnityJS_HandleAwake(AllocateTextureDelegate allocateTextureCallback, FreeTextureDelegate freeTextureCallback, LockTextureDelegate lockTextureCallback, UnlockTextureDelegate unlockTextureCallback);


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


    [MonoPInvokeCallback(typeof(AllocateTextureDelegate))]
    public static int AllocateTexture(int width, int height)
    {
        //Debug.Log("BridgeTransportWebGL: AllocateTexture: width: " + width + " height: " + height + " id: " + nextTextureID);

        TextureInfo tex = new TextureInfo();
        tex.id = nextTextureID++;
        tex.width = width;
        tex.height = height;
        tex.texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
        tex.locked = false;
        tex.data = null;
        textureInfos[tex.id] = tex;

        return tex.id;
    }


    [MonoPInvokeCallback(typeof(FreeTextureDelegate))]
    public static void FreeTexture(int id)
    {
        //Debug.Log("BridgeTransportWebGL: FreeTexture: id: " + id);
        if (!textureInfos.ContainsKey(id)) {
            Debug.LogError("BridgeTransportWebGL: FreeTexture: invalid id: " + id);
            return;
        }

        TextureInfo tex = textureInfos[id];

        if (tex.locked) {
            Debug.LogError("BridgeTransportWebGL: FreeTexture: free while locked! id: " + id);
            UnlockTexture(id);
        }

        textureInfos.Remove(id);
    }
    

    [MonoPInvokeCallback(typeof(LockTextureDelegate))]
    public static int LockTexture(int id)
    {
        if (!textureInfos.ContainsKey(id)) {
            Debug.LogError("BridgeTransportWebGL: LockTexture: invalid id: " + id);
            return 0;
        }

        TextureInfo tex = textureInfos[id];

        if (tex.locked) {
            Debug.LogError("BridgeTransportWebGL: LockTexture: already locked: " + id);
            return 0;
        }

        tex.locked = true;
        if (tex.data == null) {
            tex.data = new byte[tex.width * tex.height * 4];
        }
        tex.handle = GCHandle.Alloc(tex.data, GCHandleType.Pinned);
        tex.pointer = tex.handle.AddrOfPinnedObject();

        //Debug.Log("BridgeTransportWebGL: LockTexture: locked. pointer: " + tex.pointer);

        return (int)tex.pointer;
    }


    [MonoPInvokeCallback(typeof(UnlockTextureDelegate))]
    public static void UnlockTexture(int id)
    {
        //Debug.Log("BridgeTransportWebGL: UnlockTexture: id: " + id);

        if (!textureInfos.ContainsKey(id)) {
            Debug.LogError("BridgeTransportWebGL: UnlockTexture: invalid id: " + id);
            return;
        }

        TextureInfo tex = textureInfos[id];

        if (!tex.locked) {
            Debug.LogError("BridgeTransportWebGL: UnlockTexture: not locked: " + id);
            return;
        }

        tex.texture.LoadRawTextureData(tex.data);
        tex.texture.Apply();
        tex.handle.Free();
        tex.locked = false;
        //tex.data = null;
        tex.pointer = (IntPtr)0;
        //Debug.Log("BridgeTransportWebGL: UnlockTexture: unlocked.");
    }
    

    public override void HandleAwake()
    {
        //Debug.Log("BridgeTransportWebGL: HandleAwake: this: " + this + " bridge: " + bridge);

        _UnityJS_HandleAwake(
            AllocateTexture,
            FreeTexture,
            LockTexture,
            UnlockTexture);
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


    public override bool HasSharedTextures()
    {
        return true;
    }


    public override Texture2D GetSharedTexture(int id)
    {
        //Debug.Log("BridgeTransportWebGL: GetSharedTexture: id: " + id);

        if (!textureInfos.ContainsKey(id)) {
            Debug.LogError("BridgeTransport: GetSharedTexture: invalid id: " + id);
            return null;
        }

        TextureInfo tex = textureInfos[id];

        return tex.texture;
    }


}


#endif
