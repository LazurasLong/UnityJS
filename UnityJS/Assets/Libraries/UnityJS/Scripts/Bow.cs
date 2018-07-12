////////////////////////////////////////////////////////////////////////
// Bow.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Bow: BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public float angle;
    public bool fromTransformAttached = true;
    public Transform fromTransform;
    public Vector3 fromOffset;
    public Vector3 fromLocalOffset;
    public Vector3 fromLocalOffsetRotated;
    public Vector3 fromPosition;
    public bool toTransformAttached = true;
    public Transform toTransform;
    public Vector3 toPosition;
    public Vector3 toOffset;
    public Vector3 toLocalOffset;
    public Vector3 toLocalOffsetRotated;
    public LineRenderer lineRenderer;
    public int bowSegments = 20;
    public float bowHeight = 10.0f;
    public float bowRotation = 90.0f;
    public float bowRotationPerSecond = 360.0f;
    public float bowStart = 0.0f;
    public float bowEnd = 1.0f;
    public float startWidth = 1.0f;
    public float endWidth = 1.0f;
    public float widthMultiplier = 1.0f;
    public string textureName;
    public string textureURL;
    public Texture2D texture;
    public Vector2 textureOffset = Vector2.zero;
    public Vector2 textureScale = Vector2.one;
    public Vector2 textureOffsetPerSecond = Vector2.zero;

    public bool updateTexture = false;
    public bool updateMaterial = false;
    public bool updateMaterialAlways = false;
    public bool updateLine = false;
    public bool updateLineAlways = false;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Start()
    {
        updateTexture = true;
        updateMaterial = true;
        updateLine = true;
    }


    void Update()
    {
        if (updateTexture) {

            updateTexture = false;
            updateMaterial = true;

            if (!string.IsNullOrEmpty(textureName)) {

                texture = (Texture2D)Resources.Load(textureName);

                //Debug.Log("Bow: Update: updateTexture: textureName: " + textureName + " texture: " + texture + " lineRenderer: " + lineRenderer + " material: " + lineRenderer.material.mainTexture + " mainTexture: " + lineRenderer.material.mainTexture + " shader: " + lineRenderer.material.shader);

                //lineRenderer.material.mainTexture = texture;

                //Debug.Log("Bow: Update: updateTexture: textureName: " + textureName + " texture: " + texture + " material: " + lineRenderer.material);

            } else if (!string.IsNullOrEmpty(textureURL)) {

                //Debug.Log("Bow: Update: updateTexture: textureURL: " + textureURL);
                StartCoroutine(LoadTexture(textureURL));

            }

        }

        if (updateMaterial || updateMaterialAlways) {

            updateMaterial = false;

            if (texture != null) {
                lineRenderer.material.mainTexture = texture;
            }

            if ((textureOffsetPerSecond.x != 0.0f) || 
                (textureOffsetPerSecond.y != 0.0f)) {
                textureOffset = textureOffsetPerSecond * Time.time;
            }

            lineRenderer.material.mainTextureOffset = textureOffset;
            lineRenderer.material.mainTextureScale = textureScale;
        }

        if (updateLine || updateLineAlways) {

            updateLine = false;

            Vector3[] points = new Vector3[bowSegments];

            if (fromTransformAttached &&
                (fromTransform != null)) {
                fromPosition = 
                    fromTransform.position + fromOffset;
            }

            if (toTransformAttached &&
                (toTransform != null)) {
                toPosition = 
                    toTransform.position + toOffset;
            }

            angle =
                (180.0f / Mathf.PI) *
                Mathf.Atan2(
                    toPosition.z - fromPosition.z,
                    toPosition.x - fromPosition.x);

            Quaternion aroundAngle =
                Quaternion.AngleAxis(-angle, Vector3.up);

            fromLocalOffsetRotated =
                aroundAngle * fromLocalOffset;
            toLocalOffsetRotated =
                aroundAngle * toLocalOffset;


            //Debug.Log("fromPosition " + fromPosition.x + " " + fromPosition.y + " " + fromPosition.z);
            //Debug.Log("toPosition " + toPosition.x + " " + toPosition.y + " " + toPosition.z);

            for (int i = 0; i < bowSegments; i++) {
                float t = 
                    (float)i / (float)(bowSegments - 1);
                t *= (bowEnd - bowStart);
                t += bowStart;
                float h =
                    Mathf.Sin(Mathf.PI * t);
                float height = 
                    bowHeight * h;

                //Debug.Log("i " + i + " t " + t + " h " + h + " height " + height);

                Vector3 point =
                    Vector3.Lerp(fromPosition + fromLocalOffsetRotated, toPosition + toLocalOffsetRotated, t) +
                    new Vector3(0.0f, height, 0.0f);

                //Debug.Log("i " + i + " bowSegments " + bowSegments + " height " + height + " point " + point.x + " " + point.y + " " + point.z);

                points[i] = point;
            }

            if (bowRotationPerSecond != 0.0f) {
                bowRotation = Time.time * bowRotationPerSecond;
            }

            lineRenderer.transform.localRotation = Quaternion.Euler(bowRotation, 0.0f, 0.0f);
            lineRenderer.startWidth = startWidth;
            lineRenderer.endWidth = endWidth;
            lineRenderer.widthMultiplier = widthMultiplier;
            lineRenderer.positionCount = bowSegments;
            lineRenderer.SetPositions(points);
        }
    }


    IEnumerator LoadTexture(string url)
    {
        //Debug.Log("Bow: LoadTexture: start: url: " + url);

        var www = new WWW(url);

        yield return www;

        lineRenderer.material.mainTexture = www.texture;
        updateMaterial = true;

        Debug.Log("Bow: LoadTexure: url: " + url + " texture: " + www.texture);

    }


}
