////////////////////////////////////////////////////////////////////////
// Wire.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Wire: Tracker {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public Transform fromView;
    public Transform fromTransform;
    public bool fromTransformAttached = true;
    public Vector3 fromOffset;
    public Vector3 fromLocalOffset;
    public Vector3 fromLocalOffsetRotated;
    public Vector3 fromAnchor;
    public Vector3 fromAnchorLast;
    public Vector3 fromPosition;
    public Vector3 fromEndDistance = new Vector3(0.0f, 0.0f, 0.0f);
    public Vector3 fromEndDirection = new Vector3(10.0f, 0.0f, 0.0f);
    public Vector3 fromMiddleDistance = new Vector3(50.0f, 0.0f, 0.0f);
    public Vector3 fromMiddleDirection = new Vector3(60.0f, 0.0f, 0.0f);

    public Transform toView;
    public Transform toTransform;
    public bool toTransformAttached = true;
    public Vector3 toOffset;
    public Vector3 toLocalOffset;
    public Vector3 toLocalOffsetRotated;
    public Vector3 toAnchor;
    public Vector3 toAnchorLast;
    public Vector3 toPosition;
    public Vector3 toEndDistance = new Vector3(0.0f, 0.0f, 0.0f);
    public Vector3 toEndDirection = new Vector3(-10.0f, 0.0f, 0.0f);
    public Vector3 toMiddleDistance = new Vector3(-50.0f, 0.0f, 0.0f);
    public Vector3 toMiddleDirection = new Vector3(-40.0f, 0.0f, 0.0f);

    public Transform cursorView;
    public float cursorValue = 0.5f;

    public float wireStart = 0.0f;
    public float wireEnd = 0.0f;
    public float wireHeight = 0.0f;
    public float angle;

    public Vector2 textureOffset = Vector2.zero;
    public Vector2 textureScale = Vector2.one;
    public Vector2 textureOffsetPerSecond = Vector2.zero;

    public bool updateMaterial = false;
    public bool updateMaterialAlways = false;
    public bool updateLine = false;
    public bool updateLineAlways = false;

    public Mesh mesh;
    public Material material;
    public Color color = Color.white;
    public Vector3 rotation;
    public float scale = 1.0f;
    public Spline spline = null;
    public Vector3 splineFromPosition;
    public Vector3 splineToPosition;
    private bool updateSpline = true;
    public List<GameObject> meshes = new List<GameObject>();
    public bool updateMeshes = true;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    private void OnEnable()
    {
        spline = GetComponent<Spline>();
        spline.NodeCountChanged.AddListener(() => updateMeshes = true);
    }


    void Start()
    {
        updateMaterial = true;
        updateLine = true;
        updateSpline = true;
        updateMeshes = true;
    }


    void Update()
    {
        if (updateMaterial || updateMaterialAlways) {

            updateMaterial = false;

            if ((textureOffsetPerSecond.x != 0.0f) || 
                (textureOffsetPerSecond.y != 0.0f)) {
                textureOffset = textureOffsetPerSecond * Time.time;
            }

            //lineRenderer.material.mainTextureOffset = textureOffset;
            //lineRenderer.material.mainTextureScale = textureScale;
        }

        if (fromTransformAttached &&
            (fromTransform != null)) {
            fromAnchor = 
                fromTransform.position + fromOffset;
        }

        if (toTransformAttached &&
            (toTransform != null)) {
            toAnchor = 
                toTransform.position + toOffset;
        }

        if ((fromAnchor != fromAnchorLast) ||
            (toAnchor != toAnchorLast)) {
            fromAnchorLast = fromAnchor;
            toAnchorLast = toAnchor;
            updateLine = true;
        }

        if (updateLine || updateLineAlways) {

            updateLine = false;

            angle =
                (180.0f / Mathf.PI) *
                Mathf.Atan2(
                    toAnchor.z - fromAnchor.z,
                    toAnchor.x - fromAnchor.x);

            Quaternion turn =
                Quaternion.AngleAxis(-angle, Vector3.up);
            fromLocalOffsetRotated =
                turn * fromLocalOffset;
            toLocalOffsetRotated =
                turn * toLocalOffset;
            fromPosition = 
                fromAnchor + fromLocalOffsetRotated;
            toPosition = 
                toAnchor + toLocalOffsetRotated;

            if (fromView != null) {
                fromView.position = fromPosition;
                fromView.rotation =
                    Quaternion.AngleAxis(-angle, Vector3.up);
            }

            if (toView != null) {
                toView.position = toPosition;
                toView.rotation =
                    Quaternion.AngleAxis(-angle, Vector3.up);
            }

            if (cursorView != null) {
                cursorView.position = WirePosition(cursorValue);
                cursorView.rotation =
                    Quaternion.AngleAxis(-angle, Vector3.up);
            }

        }

        if ((splineFromPosition != fromPosition) ||
            (splineToPosition != toPosition)) {
            updateSpline = true;
        }

        if (updateSpline) {
            UpdateSpline();
        }

        if (updateMeshes) {
            UpdateMeshes();
        }

    }


    public void UpdateSpline()
    {
        splineFromPosition = fromPosition;
        splineToPosition = toPosition;
        updateSpline = false;
        updateMeshes = true;

        Quaternion turn = Quaternion.AngleAxis(-angle, Vector3.up);

        List<SplineNode> nodes = spline.nodes;

        nodes[0].SetPosition(fromPosition + (turn * fromEndDistance));
        nodes[0].SetDirection(fromPosition + (turn * fromEndDirection));

        nodes[1].SetPosition(fromPosition + (turn * fromMiddleDistance));
        nodes[1].SetDirection(fromPosition + (turn * fromMiddleDirection));

        nodes[2].SetPosition(toPosition + (turn * toMiddleDistance));
        nodes[2].SetDirection(toPosition + (turn * toMiddleDirection));

        nodes[3].SetPosition(toPosition + (turn * toEndDistance));
        nodes[3].SetDirection(toPosition + (turn * toEndDirection));

    }


    public void UpdateMeshes()
    {
        foreach (GameObject go in meshes) {
            if (go != null) {
                if (Application.isPlaying) {
                    Destroy(go);
                } else {
                    DestroyImmediate(go);
                }
            }
        }

        meshes.Clear();

        int i = 0;
        foreach (CubicBezierCurve curve in spline.GetCurves()) {
            GameObject go =
                new GameObject("SplineMesh" + i++, typeof(MeshFilter), typeof(MeshRenderer), typeof(MeshBender));
            go.transform.parent = transform;
            go.transform.localRotation = Quaternion.identity;
            go.transform.localPosition = Vector3.zero;
            go.transform.localScale = Vector3.one;
            //go.hideFlags = HideFlags.NotEditable;

            MeshRenderer mr = go.GetComponent<MeshRenderer>();
            mr.material = material;
            mr.material.color = color;

            MeshBender mb = go.GetComponent<MeshBender>();
            mb.SetSourceMesh(mesh, false);
            mb.SetRotation(Quaternion.Euler(rotation), false);
            mb.SetCurve(curve, false);
            mb.SetStartScale(scale, false);
            mb.SetEndScale(scale);
            meshes.Add(go);
        }

        updateMeshes = false;
    }


    public Vector3 WirePosition(float value)
    {
        return Vector3.zero;
    }


}
