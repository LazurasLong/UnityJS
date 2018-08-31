////////////////////////////////////////////////////////////////////////
// HexBase.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class HexBase : Tracker {


    ////////////////////////////////////////////////////////////////////////
    // HexBase properties


    public Rigidbody myRigidbody;
    public SpringJoint springJoint;
    public Transform hexes;
    public float dragDistance = 0.01f;
    public bool sleepNow = false;
    public bool updateTiles = true;
    public float tileHeight = 15.0f;
    public float tileScale = 1.0f;
    public Color[] tileColors;
    public float[] tileHeights;
    public Vector3[] tilePositions;
    public int[] highlightedTiles;
    public bool updateHighlights = true;
    public int currentTileIndex = -1;


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

        updateTiles = true;
        updateHighlights = true;
        currentTileIndex = -1;
    }


    void Update()
    {
        if ((myRigidbody != null) &&
            (springJoint != null) &&
            (springJoint.connectedBody != null)) {

            if (sleepNow) {
                sleepNow = false;
                springJoint.connectedBody.gameObject.transform.position =
                    gameObject.transform.position;
            }

            float distance =
                 (springJoint.connectedBody.gameObject.transform.position -
                  gameObject.transform.position).magnitude;

            if (distance < dragDistance) {
                if (!myRigidbody.isKinematic) {
                    myRigidbody.isKinematic = true;
                }
            } else {
                if (myRigidbody.isKinematic) {
                    myRigidbody.isKinematic = false;
                }
            }

        }

        if (updateTiles) {
            UpdateTiles();
        }

        if (updateHighlights) {
            UpdateHighlights();
        }
        
    }


    public void UpdateTiles()
    {
        updateTiles = false;
        updateHighlights = true;

        if (hexes == null) {
            return;
        }
            
        int childCount = hexes.childCount;
        if (childCount == 0) {
            return;
        }

        int tileIndex = 0;
        int tileCount = tilePositions.Length;
        if ((tileCount > 0) &&
            (tileHeights.Length == tileCount) &&
            (tileColors.Length == tileCount)) {

            for (; tileIndex < tileCount; tileIndex++) {

                while (childCount <= tileIndex) {
                    GameObject prototype =
                        hexes.GetChild(childCount - 1).gameObject;
                    GameObject go =
                        Object.Instantiate(
                            prototype,
                            hexes);
                    childCount++;
                }

                Transform tile = 
                    hexes.GetChild(tileIndex);

                tile.gameObject.name = "" + tileIndex;

                tile.localPosition = 
                    tilePositions[tileIndex];

                float yScale =
                    tileHeights[tileIndex] / tileHeight;

                tile.localScale = 
                    new Vector3(
                        1.0f,
                        yScale,
                        1.0f);

                MeshRenderer mr =
                    tile.GetChild(0).gameObject.GetComponent<MeshRenderer>();

                mr.materials[0].SetTextureScale("_MainTex", new Vector2(1.0f, yScale));
                mr.materials[1].SetTextureScale("_MainTex", new Vector2(1.0f, yScale));
                mr.materials[2].color = tileColors[tileIndex];

                tile.gameObject.SetActive(true);

            }
        }

        for (; tileIndex < childCount; tileIndex++) {
            hexes.GetChild(tileIndex).gameObject.SetActive(false);
        }

        hexes.localScale = new Vector3(tileScale, tileScale, tileScale);

    }


    public void UpdateHighlights()
    {
        updateHighlights = false;

        if (hexes == null) {
            return;
        }
            
        int childCount = hexes.childCount;
        if (childCount == 0) {
            return;
        }

        int tileCount = tilePositions.Length;
        if ((tileCount > 0) &&
            (tileHeights.Length == tileCount) &&
            (tileColors.Length == tileCount)) {

            for (var tileIndex = 0; (tileIndex < tileCount) && (tileIndex < childCount); tileIndex++) {

                Transform tile = 
                    hexes.GetChild(tileIndex);

                if (tile.childCount == 0) {
                    continue;
                }

                Transform child =
                    tile.GetChild(0);
                if (child.childCount == 0) {
                    continue;
                }

                Transform effect =
                    child.GetChild(0);

                bool highlight = 
                    highlightedTiles.Contains(tileIndex);
                
                effect.gameObject.SetActive(highlight);
            }

        }

    }
    

    public override void HandleMouseEnter()
    {
        currentTileIndex = -1;
        mouseTrackingPosition = true;
        base.HandleMouseEnter();
    }


    public override void HandleMouseExit()
    {
        base.HandleMouseExit();
        mouseTrackingPosition = false;
    }


    public override void HandleMouseMove()
    {
        base.HandleMouseMove();
        
        int tileIndex = -1;

        if (mouseRaycastResult &&
            (mouseRaycastHit.collider != null) &&
            (mouseRaycastHit.collider.transform.gameObject.name == "Mesh")) {
            Transform hex = mouseRaycastHit.collider.transform.parent;
            string hexName = hex.gameObject.name;
            int.TryParse(hexName, out tileIndex);
        }

        if (tileIndex != currentTileIndex) {
            currentTileIndex = tileIndex;
            SendEventName("TileEnter");
        }

    }


}
