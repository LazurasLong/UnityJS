////////////////////////////////////////////////////////////////////////
// Rainbow.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Rainbow: BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public bool fromTransformAttached = true;
    public Transform fromTransform;
    public Vector3 fromOffset;
    public Vector3 fromLocalOffset;
    public Vector3 fromLocalOffsetRotated;
    public Vector3 fromPosition;
    public float fromWidth;
    public float fromRotation;
    public bool toTransformAttached = true;
    public Transform toTransform;
    public Vector3 toOffset;
    public Vector3 toLocalOffset;
    public Vector3 toLocalOffsetRotated;
    public Vector3 toPosition;
    public float toWidth;
    public float toRotation;
    public bool updateBows = false;
    public bool updateBowsAlways = false;
    public int lastChildCount = 0;
    public Bow[] bows = new Bow[0];
    public float angle;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Start()
    {
        updateBows = true;
    }


    void Update()
    {
        if (updateBows || updateBowsAlways) {

            updateBows = false;

            int childCount = transform.childCount;
            if ((bows == null) || 
                (childCount != lastChildCount)) {

                lastChildCount = childCount;

                List<Bow> bowList = new List<Bow>();

                for (int childIndex = 0;
                     childIndex < childCount; 
                     childIndex++) {

                    Transform child = 
                        transform.GetChild(childIndex);

                    Bow bow =
                        child.gameObject.GetComponent<Bow>();
                    if (bow != null) {
                        bowList.Add(bow);
                    }
                }

                bows = bowList.ToArray();
            }

            angle =
                Mathf.Atan2(
                    toPosition.z - fromPosition.z,
                    toPosition.x - fromPosition.x);

            Quaternion aroundAngle =
                Quaternion.AngleAxis(-angle * (180.0f / Mathf.PI), Vector3.up);

            fromLocalOffsetRotated =
                aroundAngle * fromLocalOffset;
            toLocalOffsetRotated =
                aroundAngle * toLocalOffset;

            float fromAngle = 
                angle + 
                (0.5f * Mathf.PI) +
                (fromRotation * (Mathf.PI / 180.0f));
            float toAngle = 
                angle + 
                (0.5f * Mathf.PI) +
                (toRotation * (Mathf.PI / 180.0f));

            for (int i = 0, n = bows.Length; i < n; i++) {
                Bow bow = bows[i];

                float t = 
                    (n == 1)
                        ? 0.0f
                        : (((float)i / (float)(n - 1)) - 0.5f);

                t *= (float)(n - 1) / (float)n;

                bow.fromTransform = fromTransformAttached ? fromTransform : null;
                bow.toTransform = toTransformAttached ? toTransform : null;

                if (fromTransformAttached && 
                    (bow.fromTransform != null)) {
                    fromPosition =
                        fromTransform.position + fromOffset + fromLocalOffsetRotated;
                }

                if (toTransformAttached &&
                    (bow.toTransform != null)) {
                    toPosition =
                        toTransform.position + toOffset + toLocalOffsetRotated;
                }

                bow.fromOffset = 
                    fromOffset +
                    fromLocalOffsetRotated +
                    new Vector3(
                        (t * fromWidth *
                         Mathf.Cos(fromAngle)),
                        0.0f, 
                        (t * fromWidth *
                         Mathf.Sin(fromAngle)));

                bow.toOffset = 
                    toOffset +
                    toLocalOffsetRotated +
                    new Vector3(
                        (t * toWidth *
                        Mathf.Cos(toAngle)), 
                        0.0f, 
                        (t * toWidth *
                         Mathf.Sin(toAngle)));
            }

        }
    }


}
