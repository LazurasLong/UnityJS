////////////////////////////////////////////////////////////////////////
// KineticText.cs
// Copyright (C) 2017 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class KineticText : Tracker {


    ////////////////////////////////////////////////////////////////////////
    // Component references


    public TextMeshPro textMesh;
    public List<BoxCollider> boxColliders = new List<BoxCollider>();
    public ConfigurableJoint joint;
    public PhysicMaterial physicMaterial;


    ////////////////////////////////////////////////////////////////////////
    // KineticText properties


    public bool textCollider = false;
    public bool characterColliders = true;
    public Color colorNormal = Color.gray;
    public Color faceColorNormal = Color.gray;
    public Color outlineColorNormal = Color.black;
    public Color colorMouseEntered = Color.yellow;
    public Color faceColorMouseEntered = Color.red;
    public Color outlineColorMouseEntered = Color.green;
    public Color colorMouseDown = Color.red;
    public Color faceColorMouseDown = Color.yellow;
    public Color outlineColorMouseDown = Color.green;
    public float colliderThickness = 0.1f;
    public float bumpMag = 3.0f;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    public override void HandleEvent(JObject ev)
    {
        base.HandleEvent(ev);

        //Debug.Log("LeanTweenBridge: HandleEvent: this: " + this + " ev: " + ev, this);

        string eventName = (string)ev["event"];
        //Debug.Log("LeanTweenBridge: HandleEvent: eventName: " + eventName, this);
        if (string.IsNullOrEmpty(eventName)) {
            Debug.LogError("LeanTweenBridge: HandleEvent: missing event name in ev: " + ev);
            return;
        }

        JObject data = (JObject)ev["data"];
        //Debug.Log("LeanTweenBridge: HandleEvent: eventName: " + eventName, this);

        switch (eventName) {

            case "Disrupt": {
                Disrupt();
                break;
            }

        }
    }


    public void Disrupt()
    {
        Rigidbody rigidbody = gameObject.GetComponent<Rigidbody>();
        if (rigidbody != null) {
            rigidbody.AddForce(
                new Vector3(
                    Random.Range(-bumpMag, bumpMag),
                    Random.Range(-bumpMag, bumpMag),
                    Random.Range(-bumpMag, bumpMag)),
                ForceMode.Impulse);
        }
    }


    void Update()
    {
        if (textMesh == null) {
            return;
        }

        UpdateState();
        UpdateColliders();
    }


    public void UpdateState()
    {
        if (mouseEnteredChanged || mouseDownChanged) {
            mouseEnteredChanged = false;
            mouseDownChanged = false;

            textMesh.color = mouseDown ? colorMouseDown : (mouseEntered ? colorMouseEntered : colorNormal);
            textMesh.faceColor = mouseDown ? faceColorMouseDown : (mouseEntered ? faceColorMouseEntered : faceColorNormal);
            textMesh.outlineColor = mouseDown ? outlineColorMouseDown : (mouseEntered ? outlineColorMouseEntered : outlineColorNormal);
        }
    }


    public bool ShouldRenderCharacter(TMP_CharacterInfo info)
    {
        return (
            (info.character != ' ') &&
            (info.character != '\n') &&
            (info.bottomLeft.x < info.topRight.x) &&
            (info.bottomLeft.y < info.topRight.y));
    }
    

    public void UpdateColliders()
    {
        int colliderCount = 0;
        int colliderIndex = 0;

        if (textCollider) {
            colliderCount++;
        }

        if (characterColliders) {

            TMP_TextInfo textInfo = textMesh.textInfo;
            TMP_CharacterInfo[] characterInfo = textInfo.characterInfo;

            for (int i = 0, n = characterInfo.Length;
                 i < n;
                 i++) {

                TMP_CharacterInfo info = characterInfo[i];

                if (ShouldRenderCharacter(info)) {
                    colliderCount++;
                }

            }
        }

        SetColliderCount(colliderCount);

        if (textCollider) {

            Bounds bounds = textMesh.bounds;
            BoxCollider boxCollider = boxColliders[colliderIndex++];
            boxCollider.material =
                physicMaterial;
            boxCollider.center =
                Vector3.zero;
            boxCollider.size =
                new Vector3(
                    bounds.size.x,
                    bounds.size.y,
                    colliderThickness);

        }

        if (characterColliders) {

            TMP_TextInfo textInfo = textMesh.textInfo;
            TMP_CharacterInfo[] characterInfo = textInfo.characterInfo;

            for (int i = 0, n = characterInfo.Length;
                 i < n;
                 i++) {

                TMP_CharacterInfo info = characterInfo[i];

                if (!ShouldRenderCharacter(info)) {
                    continue;
                }

                float left   = info.bottomLeft.x;
                float bottom = info.bottomLeft.y;
                float right  = info.topRight.x;
                float top    = info.topRight.y;

                BoxCollider boxCollider = boxColliders[colliderIndex++];
                boxCollider.center =
                    new Vector3(
                        (left + right) / 2.0f,
                        (top + bottom) / 2.0f,
                        0.0f);
                boxCollider.size =
                    new Vector3(
                        right - left,
                        top - bottom,
                        colliderThickness);

            }

        }

    }


    public void SetColliderCount(int n)
    {
        if (boxColliders == null) {
            boxColliders = new List<BoxCollider>();
        }

        while (boxColliders.Count < n) {
            BoxCollider collider = gameObject.AddComponent<BoxCollider>();
            boxColliders.Add(collider);
        }

        int len;
        while ((len = boxColliders.Count) > n) {
            BoxCollider boxCollider = boxColliders[len - 1];
            boxColliders.RemoveAt(len - 1);
            Destroy(boxCollider);
        }

    }
    

}
