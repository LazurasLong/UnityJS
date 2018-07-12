////////////////////////////////////////////////////////////////////////
// ProCamera.cs
// Copyright (C) 2017 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class ProCamera : BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // ProCamera properties


    public Camera proCamera;
    public float yaw;
    public float pitch;
    public float moveSpeed = 3.0f;
    public float rotateSpeed = 3.0f;
    public float zoomSpeed = 1.0f;
    public float panSpeed = 1.0f;
    public Vector3 positionMin = new Vector3(-100.0f, 0.0f, -100.0f);
    public Vector3 positionMax = new Vector3(100.0f, 20.0f, 100.0f);
    public float pitchMin = -90f;
    public float pitchMax = 90f;
    public bool initialized = false;
    public Vector3 forward;
    public Vector3 initialPosition;
    public Quaternion initialRotation;
    public Vector3 initialEulers;
    public Vector3 zoomDeltaRotated;

    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Update()
    {
        if (!initialized) {

            initialized = true;

            if (proCamera == null) {
                proCamera = gameObject.GetComponent<Camera>();
            }

            initialPosition = transform.position;
            initialRotation = transform.rotation;
            initialEulers = transform.rotation.eulerAngles;

            forward = 
                transform.rotation * Vector3.forward;

            yaw =
                Mathf.Atan2(forward.x, forward.z) *
                Mathf.Rad2Deg;

            pitch =
                Mathf.Atan2(-forward.y, forward.z) *
                Mathf.Rad2Deg;

        }

        Vector3 moveDelta = Vector3.zero;
        float yawDelta = 0.0f;
        float pitchDelta = 0.0f;
        float zoomDelta = 0.0f;

        if (Input.GetKey("w")) {
            moveDelta.z += moveSpeed;
        }
        if (Input.GetKey("s")) {
            moveDelta.z -= moveSpeed;
        }
        if (Input.GetKey("a")) {
            moveDelta.x -= moveSpeed;
        }
        if (Input.GetKey("d")) {
            moveDelta.x += moveSpeed;
        }
        if (Input.GetKey("z")) {
            moveDelta.y -= moveSpeed;
        }
        if (Input.GetKey("x")) {
            moveDelta.y += moveSpeed;
        }
        if (Input.GetKey("q")) {
            yawDelta -= rotateSpeed;
        }
        if (Input.GetKey("e")) {
            yawDelta += rotateSpeed;
        }
        if (Input.GetKey("r")) {
            pitchDelta -= rotateSpeed;
        }
        if (Input.GetKey("f")) {
            pitchDelta += rotateSpeed;
        }
        if (Input.mouseScrollDelta.x != 0) {
            yawDelta += Input.mouseScrollDelta.x * panSpeed;
        }
        if (Input.mouseScrollDelta.y != 0) {
            zoomDelta += Input.mouseScrollDelta.y * zoomSpeed;
        }

        if ((yawDelta != 0.0f) || 
            (pitchDelta != 0.0f)) {
            pitch = pitch + pitchDelta;
            //pitch = Mathf.Clamp(pitch, pitchMin, pitchMax);
            yaw = yaw + yawDelta;
            transform.rotation = 
                Quaternion.Euler(0.0f, yaw, 0.0f) *
                Quaternion.Euler(pitch, 0.0f, 0.0f);
            forward = 
                transform.rotation * Vector3.forward;
        }

        if (moveDelta != Vector3.zero) {
            Vector3 moveDeltaRotated =
                Quaternion.Euler(0.0f, yaw, 0.0f) *
                moveDelta;
            Vector3 pos =
                transform.position + moveDeltaRotated;
/*
            pos = 
                new Vector3(
                    Mathf.Clamp(pos.x, positionMin.x, positionMax.x),
                    Mathf.Clamp(pos.y, positionMin.y, positionMax.y),
                    Mathf.Clamp(pos.z, positionMin.z, positionMax.z));
*/
            transform.position = pos;
        }


        if (zoomDelta != 0.0f) {
            zoomDeltaRotated =
                transform.rotation *
                (Vector3.forward * zoomDelta * zoomSpeed);

            Vector3 pos =
                transform.position + zoomDeltaRotated;
/*
            pos = 
                new Vector3(
                    Mathf.Clamp(pos.x, positionMin.x, positionMax.x),
                    Mathf.Clamp(pos.y, positionMin.y, positionMax.y),
                    Mathf.Clamp(pos.z, positionMin.z, positionMax.z));
*/
            transform.position = pos;

        }

    }

    
}
