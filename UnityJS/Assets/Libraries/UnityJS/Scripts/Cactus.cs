////////////////////////////////////////////////////////////////////////
// Cactus.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Cactus: Tracker {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public float height = 8.0f;
    public int sides = 8;
    public int sideDivisions = 2;
    public int slices = 8;
    public int sliceDivisions = 2;
    public float spineStrength = 0.5f;
    public Vector2 uvScale = new Vector2(1.0f, 1.0f);
    public float radiusMin = 0.5f;
    public float radiusMax = 1.5f;
    public float[] samples;
    public int[] sideLobeTypes = new int[] { 1 };
    public float[] sideLobeLows = new float[] { 0.5f };
    public float[] sideLobeHighs = new float[] { 1.5f };
    public int[] sliceLobeTypes = new int[] { 1 };
    public float[] sliceLobeLows = new float[] { 0.5f };
    public float[] sliceLobeHighs = new float[] { 1.5f };
    public Vector2 textureOffset = Vector2.zero;
    public Vector2 textureScale = Vector2.one;
    public Vector2 textureOffsetPerSecond = Vector2.zero;
    public bool updateMaterial = false;
    public bool updateMaterialAlways = false;
    public Color color = Color.white;
    public MeshRenderer cactusMeshRender;
    public MeshFilter cactusMeshFilter;
    public Mesh cactusMesh;
    public bool updateMesh = true;
    public bool updateMeshAlways = false;
    public bool noSubSample = true;
    public bool sideRidges = true;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Start()
    {
        updateMaterial = true;
        updateMesh = true;
    }


    void Update()
    {
        if (cactusMeshRender == null) {
            cactusMeshRender = gameObject.GetComponent<MeshRenderer>();
        }

        if (cactusMeshFilter == null) {
            cactusMeshFilter = gameObject.GetComponent<MeshFilter>();
        }

        if (updateMaterial || updateMaterialAlways) {
            UpdateMaterial();
        }

        if (updateMesh || updateMeshAlways) {
            UpdateMesh();
        }

    }


    public void UpdateMaterial()
    {
        updateMaterial = false;

        if ((textureOffsetPerSecond.x != 0.0f) || 
            (textureOffsetPerSecond.y != 0.0f)) {
            textureOffset = textureOffsetPerSecond * Time.time;
        }

        cactusMeshRender.material.color = color;
    }


    public void UpdateMesh()
    {
        if (sides < 1) {
            sides = 1;
        }

        if (slices < 1) {
            slices = 1;
        }

        if (sliceDivisions < 1) {
            sliceDivisions = 1;
        }

        if (sideDivisions < 1) {
            sideDivisions = 1;
        }

        int sampleCount = sides * slices;
        if ((samples == null) ||
            (samples.Length != sampleCount)) {
            float[] oldSamples = samples;
            samples = new float[sampleCount];
            for (int i = 0; i < sampleCount; i++) {
                samples[i] = 
                    ((oldSamples != null) &&
                     (i < oldSamples.Length))
                        ? oldSamples[i]
                        : UnityEngine.Random.value;
            }
        }

        List<Vector3> vertices = new List<Vector3>();
        List<Vector2> uv = new List<Vector2>();
        List<int> triangles = new List<int>();
        bool firstPoint = true;
        float sliceHeight = height / slices;
        float sideTurn = (2.0f * Mathf.PI) / sides;
        float radiusRange = radiusMax - radiusMin;
        int sliceCount = slices * sliceDivisions;
        int sideCount = sides * sideDivisions;

        //Debug.Log("Cactus: UpdateMesh: sides: " + sides + " slices: " + slices + " sliceDivisions: " + sliceDivisions + " sideDivisions: " + sideDivisions);

        for (int slice = 0; slice < slices; slice++) {

            int thisSliceDivisions =
                (slice == (slices - 1))
                    ? 1
                    : sliceDivisions;

            for (int sliceDivision = 0; sliceDivision < thisSliceDivisions; sliceDivision++) {

                float slicePos =
                    (float)slice +
                    ((float)sliceDivision / (float)thisSliceDivisions);
                float y =
                    sliceHeight * slicePos;

                int b = vertices.Count;

                for (int side = 0; side < sides; side++) {

                    for (int sideDivision = 0; sideDivision < sideDivisions; sideDivision++) {

                        float sidePos = 
                            (float)side +
                            ((float)sideDivision / (float)sideDivisions);
                        float angle = 
                            sideTurn * sidePos;

                        float sample = GetSubSample(sidePos, slicePos);

                        var radius =
                            radiusMin +
                            (sample * radiusRange);

                        var x = Mathf.Cos(angle) * radius;
                        var z = -Mathf.Sin(angle) * radius;

                        vertices.Add(
                            new Vector3(x, y, z));
                        uv.Add(
                            new Vector2(sidePos * uvScale.x, slicePos * uvScale.y));
                    }

                }

                if (firstPoint) {
                    firstPoint = false;
                } else {
                    for (int side1 = 0; side1 < sideCount; side1++) {
                        int side2 = (side1 + 1) % sideCount;
                        triangles.Add(b + side2 - sideCount);
                        triangles.Add(b + side2);
                        triangles.Add(b + side1);
                        triangles.Add(b + side1 - sideCount);
                        triangles.Add(b + side2 - sideCount);
                        triangles.Add(b + side1);
                    }
                }

            }

        }

        if (cactusMesh == null) {
            cactusMesh = new Mesh();
            cactusMesh.MarkDynamic();
            cactusMeshFilter.mesh = cactusMesh;
        }

        cactusMesh.triangles = new int[0];
        cactusMesh.vertices = vertices.ToArray();
        cactusMesh.uv = uv.ToArray();
        cactusMesh.triangles = triangles.ToArray();

        cactusMesh.RecalculateNormals();

        updateMesh = false;
    }


    public float GetSubSample(float sidePos, float slicePos)
    {
        if (noSubSample) {
            return GetSample(sidePos, slicePos);
        }

        int row;
        int column;
        int index;
        float sideFrac = sidePos - Mathf.Floor(sidePos);
        float sliceFrac = slicePos - Mathf.Floor(slicePos);

        float sample00 = GetSample(sidePos,        slicePos);
        float sample01 = GetSample(sidePos,        slicePos + 1.0f);
        float sample10 = GetSample(sidePos + 1.0f, slicePos);
        float sample11 = GetSample(sidePos + 1.0f, slicePos + 1.0f);

        float sample0 =
            (sample00 * (1.0f - sideFrac)) +
            (sample10 * sideFrac);
        float sample1 =
            (sample01 * (1.0f - sideFrac)) +
            (sample11 * sideFrac);

        float sample =
            (sample0 * (1.0f - sliceFrac)) +
            (sample1 * sliceFrac);

        if (sideRidges) {
            float c = sideFrac; 
            // 0 .. 1
            if (c >= 0.5f) {
                c -= 1.0f;
            }
            // -0.5 .. 0.5
            c *= 2.0f;
            // -1.0 .. 1.0
            if (c < 0.0f) {
                c = -c;
            }
            c *= 1.0f - spineStrength;
            c += spineStrength;
            sample *= c;
        }

        return sample;
    }


    public float GetSample(float sidePos, float slicePos)
    {
        int column = (int)Mathf.Floor(sidePos);
        column = (column + sides) % sides;
        int row = (int)Mathf.Floor(slicePos);
        if (row < 0) {
            row = 0;
        } else if (row > (slices - 1)) {
            row = slices - 1;
        }

        int index = (row * sides) + column;
        if ((index < 0) |
            (index >= samples.Length)) {
            return UnityEngine.Random.value;
        }

        return samples[index];
    }


}
