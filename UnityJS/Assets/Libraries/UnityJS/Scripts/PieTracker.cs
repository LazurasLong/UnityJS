////////////////////////////////////////////////////////////////////////
// PieTracker.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.EventSystems;


public class PieTracker : BridgeObjectTracker {


    public bool tracking = true;

    public bool trackingMouseButton = false;
    public bool mouseButtonChanged = true;
    public bool mouseButton = false;
    public bool mouseButtonLast = false;

    public bool trackingMousePosition = false;
    public bool mousePositionChanged = true;
    public Vector3 mousePositionLast = Vector3.zero;
    public Vector3 mousePositionStart = Vector3.zero;
    public Vector3 mousePositionDelta = Vector3.zero;
    public float distance = 0.0f;
    public float direction = 0.0f;
    public int sliceIndex = -1;
    public int itemIndex = -1;
    public int slices = 8;
    public float initialDirection = 90.0f;
    public bool clockwise = true;
    public float inactiveDistance = 10.0f;
    public float itemDistance = 10.0f;

    public bool trackingCameraPosition = false;
    public bool cameraPositionChanged = true;
    public Vector3 cameraPosition = Vector3.zero;
    public Vector3 cameraPositionLast = Vector3.zero;

    public bool trackingCameraRotation = false;
    public bool cameraRotationChanged = true;
    public Quaternion cameraRotation = Quaternion.identity;
    public Quaternion cameraRotationLast = Quaternion.identity;
    public Vector3 cameraRotationEulerAngles = Vector3.zero;

    public Camera pieCamera = null;


    public void Awake()
    {
        if (pieCamera == null) {
            pieCamera = Camera.main;
        }

        Refresh();
    }


    public void Refresh()
    {
        mousePositionChanged = true;
        cameraPositionChanged = true;
        cameraRotationChanged = true;
    }


    void Update()
    {
        if (!tracking) {
            return;
        }

        TrackCameraPosition();
        TrackCameraRotation();
        TrackMousePosition();

        if (ignoringMouseClick) {
            if (Input.GetMouseButtonUp(0)) {
                //Debug.Log("PieTracker: Update: ignoringMouseClick: Up: isPointerOverUIObject: " + isPointerOverUIObject);
                SendEventName("MouseButtonUpUI");
                ignoringMouseClick = false;
            }
        } else {
            TrackMouseButton();
        }
    }


    public override void TrackMousePosition()
    {
        base.TrackMousePosition();

        if (!trackingMousePosition) {
            return;
        }

        mousePositionChanged |= (mousePosition != mousePositionLast);

        if (!mousePositionChanged) {
            return;
        }

        mousePositionLast = mousePosition;

        mousePositionDelta = mousePosition - mousePositionStart;

        distance = mousePositionDelta.magnitude;

        direction =
            (distance == 0)
                ? 0.0f
                : NormalDeg(
                      Mathf.Rad2Deg *
                      Mathf.Atan2(
                          mousePositionDelta.y, 
                          mousePositionDelta.x));

        bool inactive = distance < inactiveDistance;

        if (inactive || slices <= 0) {

            sliceIndex = -1;

        } else {

            float sliceSubtend = 
                360.0f / slices;

            float deg =
                NormalDeg(
                    initialDirection +
                    ((clockwise ? -1.0f : 1.0f) *
                     (direction -
                      (sliceSubtend / 2.0f))));

            sliceIndex =
                (int)Mathf.Floor(deg / sliceSubtend);

        }

        if (inactive) {
            itemIndex = -1;
        } else {
            itemIndex =
                (int)Mathf.Floor(
                    (distance - inactiveDistance) /
                    itemDistance);
        }

        SendEventName("MousePositionChanged");

        mousePositionChanged = false;
    }


    public float NormalDeg(float deg)
    {
        while (deg < 0.0f) {
            deg += 360.0f;
        }

        while (deg >= 360.0f) {
            deg -= 360.0f;
        }

        return deg;
    }


    public void TrackCameraPosition()
    {
        if (!trackingCameraPosition) {
            return;
        }

        cameraPositionChanged |= cameraPosition != cameraPositionLast;
        cameraPositionLast = cameraPosition;

        if (cameraPositionChanged) {
            SendEventName("CameraPositionChanged");
            cameraPositionChanged = false;
        }
    }


    public void TrackCameraRotation()
    {
        if (!trackingCameraRotation) {
            return;
        }

        cameraRotationChanged |= cameraRotation != cameraRotationLast;
        cameraRotationLast = cameraRotation;
        cameraRotationEulerAngles = cameraRotation.eulerAngles;

        if (cameraRotationChanged) {
            SendEventName("CameraRotationChanged");
            cameraRotationChanged = false;
        }

    }


    public void TrackMouseButton()
    {
        if (!trackingMouseButton) {
            return;
        }

        if (Input.GetMouseButtonDown(0)) {

            isPointerOverUIObject = IsPointerOverUIObject();

            //Debug.Log("PieTracker: TrackMouseButton: Down: isPointerOverUIObject: "+ isPointerOverUIObject);

            if (isPointerOverUIObject) {
                SendEventName("MouseButtonDownUI");
                ignoringMouseClick = true;
                return;
            }

            SendEventName("MouseButtonDown");
        }

        if (Input.GetMouseButtonUp(0)) {
            SendEventName("MouseButtonUp");
        }

        mouseButton = Input.GetMouseButton(0);
        mouseButtonChanged |= mouseButton != mouseButtonLast;
        mouseButtonLast = mouseButton;

        if (mouseButtonChanged) {
            SendEventName("MouseButtonChanged");
            mouseButtonChanged = false;
        }

    }


}
