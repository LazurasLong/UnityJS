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

    public Color color = Color.white;
    public Vector3 rotation;
    public float radius = 0.5f;
    public int sides = 8;
    public float curveSmallDistance = 0.1f;
    public float curveStepLength = 1.0f;
    public float curveLength;
    public float curveStepSize;
    public int curveSteps;
    public Spline spline = null;
    public Vector3 splineFromPosition;
    public Vector3 splineToPosition;
    public bool updateSpline = true;
    public bool updateSplineAlways = false;
    public MeshRenderer wireMeshRenderer;
    public MeshFilter wireMeshFilter;
    public Mesh wireMesh;
    public bool updateMeshes = true;
    public bool updateMeshesAlways = false;


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

            wireMeshRenderer.material.color = color;

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

        }

        if ((splineFromPosition != fromPosition) ||
            (splineToPosition != toPosition)) {
            updateSpline = true;
        }

        if (updateSpline || updateSplineAlways) {
            UpdateSpline();
        }

        if (updateMeshes || updateMeshesAlways) {
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
        List<Vector3> vertices = new List<Vector3>();
        List<int> triangles = new List<int>();
        var curves = spline.GetCurves();
        int curveCount = curves.Count;
        int curveIndex = 0;
        Quaternion turnY = Quaternion.Euler(0, -90, 0);
        bool firstPoint = true;
        Vector3 lastCurvePoint = Vector3.zero;

        foreach (CubicBezierCurve curve in curves) {

            curveLength = curve.Length;
            if ((curveLength <= 0.0f) ||
                (curveStepLength <= 0.0f)) {
                continue;
            }

            curveSteps = (int)Mathf.Ceil(curveLength / curveStepLength);
            curveStepSize = curveLength / (float)curveSteps;
            float curvePos = 0.0f;
            for (int curveStep = 0; 
                 curveStep <= curveSteps; 
                 curveStep++, curvePos = Mathf.Min(curvePos + curveStepSize, curveLength)) {
                Vector3 curvePoint = curve.GetLocationAtDistance(curvePos);
                Vector3 curveTangent = curve.GetTangentAtDistance(curvePos);
                Quaternion q = CubicBezierCurve.GetRotationFromTangent(curveTangent) * turnY;

                if (!firstPoint) {
                    float distance = (lastCurvePoint - curvePoint).magnitude;
                    if (distance < curveSmallDistance) {
                        continue;
                    }
                }

                int b = vertices.Count;
                for (int side = 0; side < sides; side++) {
                    float ang = (2.0f * Mathf.PI) * ((float)side / (float)sides);
                    var dx = Mathf.Cos(ang);
                    var dy = Mathf.Sin(ang);
                    Vector3 v = 
                        curvePoint +
                        (q * new Vector3(0.0f, dx * radius, dy * radius));
                    vertices.Add(v);
                }

                if (!firstPoint) {
                    for (int side1 = 0; side1 < sides; side1++) {
                        int side2 = (side1 + 1) % sides;
                        triangles.Add(b + side2 - sides);
                        triangles.Add(b + side2);
                        triangles.Add(b + side1);
                        triangles.Add(b + side1 - sides);
                        triangles.Add(b + side2 - sides);
                        triangles.Add(b + side1);
                    }
                }

                lastCurvePoint = curvePoint;
                firstPoint = false;
            }

            curveIndex++;
        }

        if (wireMesh == null) {
            wireMesh = new Mesh();
            wireMesh.MarkDynamic();
            wireMeshFilter.mesh = wireMesh;
        }

        wireMesh.triangles = new int[0];
        wireMesh.vertices = vertices.ToArray();
        wireMesh.triangles = triangles.ToArray();

        wireMesh.RecalculateNormals();

        updateMeshes = false;
    }


    public Vector3 WirePosition(float value)
    {
        return Vector3.zero;
    }


}
