////////////////////////////////////////////////////////////////////////
// Bundle.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class Bundle: BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public Transform fromView;
    public Transform fromTransform;
    public bool fromTransformAttached = true;
    public Vector3 fromOffset;
    public Vector3 fromLocalOffset;
    public Vector3 fromLocalOffsetRotated;
    public Vector3 fromLocalSpread;
    public Vector3 fromLocalSpreadRotated;
    public Vector3 fromPosition;
    public float fromRotation;
    public float fromAngle;

    public Transform toView;
    public Transform toTransform;
    public bool toTransformAttached = true;
    public Vector3 toOffset;
    public Vector3 toLocalOffset;
    public Vector3 toLocalOffsetRotated;
    public Vector3 toLocalSpread;
    public Vector3 toLocalSpreadRotated;
    public Vector3 toPosition;
    public float toRotation;
    public float toAngle;

    public bool updateWires = false;
    public bool updateWiresAlways = false;
    public int lastChildCount = 0;
    public Wire[] wires = new Wire[0];
    public float angle;
    public bool updateWireHeight = true;
    public float wireHeight = 40.0f;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Start()
    {
        updateWires = true;
    }


    void Update()
    {
        if (updateWires || updateWiresAlways) {

            updateWires = false;

            int childCount = transform.childCount;
            if ((wires == null) || 
                (childCount != lastChildCount)) {

                lastChildCount = childCount;

                List<Wire> wireList = new List<Wire>();

                for (int childIndex = 0;
                     childIndex < childCount; 
                     childIndex++) {

                    Transform child = 
                        transform.GetChild(childIndex);

                    Wire wire =
                        child.gameObject.GetComponent<Wire>();
                    if (wire != null) {
                        wireList.Add(wire);
                    }
                }

                wires = wireList.ToArray();
            }

            if (fromTransformAttached && (fromTransform != null)) {
                fromPosition =
                    fromTransform.position + fromOffset;
            }

            if (toTransformAttached && (toTransform != null)) {
                toPosition =
                    toTransform.position + toOffset;
            }

            angle =
                Mathf.Atan2(
                    toPosition.z - fromPosition.z,
                    toPosition.x - fromPosition.x);

            Quaternion rotate =
                Quaternion.AngleAxis(-angle * (180.0f / Mathf.PI), Vector3.up);

            fromLocalOffsetRotated =
                rotate * fromLocalOffset;
            toLocalOffsetRotated =
                rotate * toLocalOffset;

            fromAngle = 
                angle + 
                (0.5f * Mathf.PI) +
                (fromRotation * (Mathf.PI / 180.0f));
            toAngle = 
                angle + 
                (0.5f * Mathf.PI) +
                (toRotation * (Mathf.PI / 180.0f));

            for (int i = 0, n = wires.Length; i < n; i++) {
                Wire wire = wires[i];

                if (wire == null) {
                    continue;
                }

                float t = 
                    (n == 1)
                        ? 0.0f
                        : (((float)i / (float)(n - 1)) - 0.5f);

                t *= (float)(n - 1) / (float)n;

                fromLocalSpreadRotated =
                    rotate * (t * fromLocalSpread);
                toLocalSpreadRotated =
                    rotate * (t * toLocalSpread);

                wire.fromTransform = fromTransformAttached ? fromTransform : null;
                wire.toTransform = toTransformAttached ? toTransform : null;

                wire.fromOffset = 
                    fromOffset +
                    fromLocalOffsetRotated +
                    fromLocalSpreadRotated;

                wire.toOffset = 
                    toOffset +
                    toLocalOffsetRotated +
                    toLocalSpreadRotated;

                if (updateWireHeight) {
                    wire.wireHeight = wireHeight;
                }

            }

            if (fromView != null) {
                fromView.position = fromPosition;
                fromView.rotation =
                    Quaternion.AngleAxis(-fromAngle * (180.0f / Mathf.PI), Vector3.up);
            }

            if (toView != null) {
                toView.position = toPosition;
                toView.rotation =
                    Quaternion.AngleAxis(-toAngle * (180.0f / Mathf.PI), Vector3.up);
            }

        }
    }


}
