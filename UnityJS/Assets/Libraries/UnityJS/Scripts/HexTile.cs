////////////////////////////////////////////////////////////////////////
// HexTile.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class HexTile : Tracker {


    ////////////////////////////////////////////////////////////////////////
    // HexTile properties


    public bool makeCollider = true;
    public MeshCollider meshCollider;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Awake()
    {
        //Debug.Log("HexTile: Awake", this);

        Collider currentCollider = gameObject.GetComponent<Collider>();
        if (currentCollider != null) {

            if (!makeCollider) {
                DestroyObject(currentCollider);
            }

            return;
        }

        if (!makeCollider) {
            return;
        }

        //Debug.Log("HexTile: Awake: Making MeshCollider.");

        MeshFilter meshFilter =
            gameObject.GetComponent<MeshFilter>();
        if (meshFilter == null) {
            Debug.LogError("HexTile: Awake: expected MeshFilter component!");
            return;
        }

        //Debug.Log("HexTile: Awake: meshFilter: " + meshFilter);

        Mesh mesh = meshFilter.sharedMesh;
        if (mesh == null) {
            Debug.LogError("HexTile: Awake: expected MeshFilter mesh!");
            return;
        }

        //Debug.Log("HexTile: Awake: mesh: " + mesh);

        MeshCollider meshCollider =
            gameObject.AddComponent<MeshCollider>();
        
        //Debug.Log("HexTile: Awake: meshCollider: " + meshCollider);

        meshCollider.sharedMesh = mesh;
        meshCollider.convex = true;

        //Debug.Log("HexTile: Awake: Created MeshCollider.");

        Rigidbody rb =
            gameObject.GetComponent<Rigidbody>();
        if (rb == null) {
            rb = gameObject.AddComponent<Rigidbody>();
        }

    }


    public override void HandleEvent(JObject ev)
    {
        base.HandleEvent(ev);

        //Debug.Log("HexTile: HandleEvent: this: " + this + " ev: " + ev, this);

        string eventName = (string)ev["event"];
        //Debug.Log("HexTile: HandleEvent: eventName: " + eventName, this);
        if (string.IsNullOrEmpty(eventName)) {
            Debug.LogError("HexTile: HandleEvent: missing event name in ev: " + ev);
            return;
        }

        //Debug.Log("HexTile: HandleEvent: eventName: " + eventName, this);

        switch (eventName) {

            case "Foo": {
                break;
            }

        }
    }


}
