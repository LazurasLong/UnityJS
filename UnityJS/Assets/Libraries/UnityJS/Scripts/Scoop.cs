////////////////////////////////////////////////////////////////////////
// Scoop.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Scoop: BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public Transform[] children;
    public Mesh scoopMesh = null;
    public Vector3[] vertices;
    public int[] triangles;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Awake()
    {
        //MeshRenderer mr = gameObject.GetComponent<MeshRenderer>();
        MeshFilter mf = gameObject.GetComponent<MeshFilter>();
        Mesh normalMesh = mf.sharedMesh;
        scoopMesh = mf.mesh;

        vertices = normalMesh.vertices;
        triangles = normalMesh.triangles;
        
        for (int i = 0; i < triangles.Length; i += 3) {
            int tmp = triangles[i];
            triangles[i] = triangles[i + 2];
            triangles[i + 2] = tmp;
        }

        scoopMesh.vertices = vertices;
        scoopMesh.triangles = triangles;
        scoopMesh.RecalculateNormals();

        mf.mesh = scoopMesh;
    }    


}
