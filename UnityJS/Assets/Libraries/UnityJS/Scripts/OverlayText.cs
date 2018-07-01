////////////////////////////////////////////////////////////////////////
// OverlayText.cs
// Copyright (C) 2017 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class OverlayText : BridgeObject {


    public enum TrackPosition {
        Hidden,
        Passive,
        Screen,
        World,
        Transform,
    };


    ////////////////////////////////////////////////////////////////////////
    // OverlayText properties


    public TextMeshProUGUI textMesh;
    public TrackPosition trackPosition = TrackPosition.Passive;
    public Vector2 screenPosition;
    public Vector3 worldPosition;
    public Transform transformPosition;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Update()
    {
        if (textMesh == null) {
            return;
        }

        UpdatePosition();
    }


    public void UpdatePosition()
    {
        bool active = false;
        bool trackScreen = false;

        switch (trackPosition) {

            case TrackPosition.Hidden:
                break;

            case TrackPosition.Passive:
                active = true;
                break;

            case TrackPosition.Transform:
                 if (transformPosition == null) {
                     break;
                 }
                 worldPosition = transformPosition.position;
                 goto case TrackPosition.World;

            case TrackPosition.World:
                screenPosition =
                    Camera.main.WorldToScreenPoint(worldPosition);
                goto case TrackPosition.Screen;

            case TrackPosition.Screen:
                active = true;
                trackScreen = true;
                break;

        }

        if (active != textMesh.enabled) {
            textMesh.enabled = active;
        }

        if (active && trackScreen) {
            RectTransform rt = gameObject.GetComponent<RectTransform>();
            rt.anchoredPosition = screenPosition;
        }

    }
    

}
