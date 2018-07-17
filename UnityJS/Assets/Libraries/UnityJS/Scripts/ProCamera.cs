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
    public float moveSpeed = 60.0f;
    public float yawSpeed = 60.0f;
    public float pitchSpeed = 60.0f;
    public float orbitYawSpeed = 60.0f;
    public float orbitPitchSpeed = 60.0f;
    public float wheelZoomSpeed = 30.0f;
    public float wheelPanSpeed = -30.0f;
    public Vector3 moveVelocity = Vector3.zero;
    public float yawVelocity = 0.0f;
    public float pitchVelocity = 0.0f;
    public float orbitYawVelocity = 0.0f;
    public float orbitPitchVelocity = 0.0f;
    public float wheelZoomVelocity = 0.0f;
    public float wheelPanVelocity = 0.0f;
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
    public Vector3 orbitLocation;


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

        float deltaTime = Time.deltaTime;
        Vector3 moveDelta = moveVelocity * deltaTime;
        float yawDelta = yawVelocity * deltaTime;
        float pitchDelta = pitchVelocity * deltaTime;
        float orbitYawDelta = orbitYawVelocity * deltaTime;
        float orbitPitchDelta = orbitPitchVelocity * deltaTime;
        float wheelZoomDelta = wheelZoomVelocity * deltaTime;
        float wheelPanDelta = wheelPanVelocity * deltaTime;

        if (Input.GetKey("w")) {
            moveDelta.z += moveSpeed * deltaTime;
        }
        if (Input.GetKey("s")) {
            moveDelta.z -= moveSpeed * deltaTime;
        }
        if (Input.GetKey("a")) {
            moveDelta.x -= moveSpeed * deltaTime;
        }
        if (Input.GetKey("d")) {
            moveDelta.x += moveSpeed * deltaTime;
        }
        if (Input.GetKey("z")) {
            moveDelta.y -= moveSpeed * deltaTime;
        }
        if (Input.GetKey("x")) {
            moveDelta.y += moveSpeed * deltaTime;
        }
        if (Input.GetKey("q")) {
            yawDelta -= yawSpeed * deltaTime;
        }
        if (Input.GetKey("e")) {
            yawDelta += yawSpeed * deltaTime;
        }
        if (Input.GetKey("r")) {
            pitchDelta -= pitchSpeed * deltaTime;
        }
        if (Input.GetKey("f")) {
            pitchDelta += pitchSpeed * deltaTime;
        }
        if (Input.GetKey("i")) {
            orbitYawDelta += orbitYawSpeed * deltaTime;
        }
        if (Input.GetKey("m")) {
            orbitYawDelta -= orbitYawSpeed * deltaTime;
        }
        if (Input.GetKey("j")) {
            orbitPitchDelta += orbitPitchSpeed * deltaTime;
        }
        if (Input.GetKey("k")) {
            orbitPitchDelta -= orbitPitchSpeed * deltaTime;
        }
        wheelZoomDelta += Input.mouseScrollDelta.y * wheelZoomSpeed * deltaTime;
        wheelPanDelta += Input.mouseScrollDelta.x * wheelPanSpeed * deltaTime;

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


        if (wheelZoomDelta != 0.0f) {
            zoomDeltaRotated =
                transform.rotation *
                (Vector3.forward * wheelZoomDelta * wheelZoomSpeed);

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
