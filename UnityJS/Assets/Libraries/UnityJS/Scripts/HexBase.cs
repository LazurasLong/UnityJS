////////////////////////////////////////////////////////////////////////
// HexBase.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class HexBase : Tracker {


    ////////////////////////////////////////////////////////////////////////
    // HexBase properties


    public Rigidbody myRigidbody;
    public SpringJoint springJoint;
    public float maxDistance = 0.01f;
    public bool sleepNow = false;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Awake()
    {
        if (myRigidbody == null) {
            myRigidbody = gameObject.GetComponent<Rigidbody>();
        }
        if (springJoint == null) {
            springJoint = gameObject.GetComponent<SpringJoint>();
        }
    }


    void Update()
    {
        if ((myRigidbody == null) ||
            (springJoint == null) ||
            (springJoint.connectedBody == null)) {
            return;
        }

        if (sleepNow) {
            sleepNow = false;
            springJoint.connectedBody.gameObject.transform.position =
                gameObject.transform.position;
        }

        float distance =
             (springJoint.connectedBody.gameObject.transform.position -
              gameObject.transform.position).magnitude;

        if (distance < maxDistance) {
            if (!myRigidbody.isKinematic) {
                myRigidbody.isKinematic = true;
            }
        } else {
            if (myRigidbody.isKinematic) {
                myRigidbody.isKinematic = false;
            }
        }
    }


}
