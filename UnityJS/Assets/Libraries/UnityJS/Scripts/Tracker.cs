////////////////////////////////////////////////////////////////////////
// Tracker.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class Tracker : BridgeObject {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public bool mouseTracking = true;
    public bool mouseEntered = false;
    public float mouseEnteredTime = 0.0f;
    public bool mouseEnteredChanged = false;
    public bool mouseDown = false;
    public float mouseDownTime = 0.0f;
    public bool mouseDownChanged = false;
    public bool ignoringMouseClick = false;
    public bool isPointerOverUIObject = false;
    public bool mouseTrackingPosition = true;
    public Vector2 screenSize = Vector2.zero;
    public Vector3 mousePosition = Vector3.zero;
    public Vector3 mousePositionToCameraOffset;
    public bool mouseTrackingRaycast = true;
    public float mouseRayMaxDistance = Mathf.Infinity;
    public int mouseRayLayerMask = Physics.DefaultRaycastLayers;
    public QueryTriggerInteraction mouseRayQueryTriggerInteraction = QueryTriggerInteraction.UseGlobal;
    public Ray mouseRay;
    public bool mouseRaycastResult = false;
    public RaycastHit mouseRaycastHit;
    public Quaternion mouseRaycastHitPointFaceCameraRotation;
    public BridgeObject mouseRaycastHitBridgeObject;
    public string mouseRaycastHitBridgeObjectID;
    public bool dragTracking = false;
    public bool dragging = false;
    public Plane dragPlane = new Plane(Vector3.up, Vector3.zero);
    public Vector3 dragStartPosition;
    public Vector3 dragStartPlanePosition;
    public Vector3 dragPlanePosition;
    public Vector3 dragPlaneDistance;
    public Quaternion dragStartRotation;
    public Vector3 dragStartScreenPosition;
    public Vector3 dragScreenDistance;
    public Vector3 dragDistance;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    public virtual void TrackMousePosition()
    {
        mouseRaycastHitBridgeObject = null;
        mouseRaycastHitBridgeObjectID = null;

        if (!mouseTrackingPosition) {
            return;
        }

        mousePosition = Input.mousePosition;
        screenSize = new Vector2(Screen.width, Screen.height);

        if (Camera.main == null) {
            return;
        }

        mouseRay =
            Camera.main.ScreenPointToRay(
                mousePosition);

        if (!mouseTrackingRaycast) {

            mouseRaycastResult = false;

        } else {

            mouseRaycastResult =
                Physics.Raycast(
                    mouseRay, 
                    out mouseRaycastHit, 
                    mouseRayMaxDistance, 
                    mouseRayLayerMask, 
                    mouseRayQueryTriggerInteraction);

            //Debug.Log("Tracker: TrackMousePosition: mouseRaycastResult: " + mouseRaycastResult + " mouseRaycastHitPoint: " + mouseRaycastHit.point.x + " " + mouseRaycastHit.point.y + " " + mouseRaycastHit.point.z);

            if (!mouseRaycastResult) {

            } else {

                Vector3 cameraPosition = Camera.main.transform.position;
                Vector3 offset = cameraPosition - mouseRaycastHit.point;
                offset.y = 0.0f;
                float direction = 
                    (offset == Vector3.zero)
                        ? 0.0f
                        : (180.0f + (Mathf.Atan2(offset.x, offset.z) * Mathf.Rad2Deg));
                mouseRaycastHitPointFaceCameraRotation =
                    Quaternion.Euler(0.0f, direction, 0.0f);

                mouseRaycastHitBridgeObject = null;
                Transform xform = mouseRaycastHit.transform;
                while (xform != null) {
                    mouseRaycastHitBridgeObject = xform.gameObject.GetComponent<BridgeObject>();
                    if (mouseRaycastHitBridgeObject != null) {
                        break;
                    }

                    xform = xform.parent;
                }

                mouseRaycastHitBridgeObjectID =
                    (mouseRaycastHitBridgeObject == null)
                        ? null
                        : mouseRaycastHitBridgeObject.id;
            }

            //Debug.Log("Tracker: TrackMousePosition: cameraPosition: " + cameraPosition.x + " " + cameraPosition.y + " " + cameraPosition.z + " point: " + mouseRaycastHit.point.x + " " + mouseRaycastHit.point.y + " " + mouseRaycastHit.point.z + " offset: " + offset.x + " " + offset.y + " " + offset.z + " direction: " + direction);

        }

        if (dragging) {

            dragScreenDistance = 
                mousePosition - dragStartScreenPosition;

            float enter = 0.0f;
            if (dragPlane.Raycast(mouseRay, out enter)) {
                dragPlanePosition = mouseRay.GetPoint(enter);
                dragPlaneDistance = dragPlanePosition - dragStartPlanePosition;
            }

            if (dragDistance != dragPlaneDistance) {

                dragDistance = dragPlaneDistance;

                transform.position =
                    dragStartPosition + dragDistance;

                SendEventName("DragMove");

          }

       }

    }


    public virtual void SetMouseEntered(bool mouseEntered0)
    {
        //Debug.Log("Tracker: SetMouseEntered: mouseEntered0: " + mouseEntered0, this);
        mouseEntered = mouseEntered0;
    }


    public virtual void OnMouseEnter()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseEnter", this);

        TrackMousePosition();

        SetMouseEntered(true);

        mouseEnteredTime = Time.time;

        HandleMouseEnter();
    }


    public virtual void HandleMouseEnter()
    {
        //Debug.Log("Tracker: HandleMouseEnter", this);
        SendEventName("MouseEnter");
    }
    

    public virtual void OnMouseExit()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseExit", this);

        TrackMousePosition();

        SetMouseEntered(false);

        HandleMouseExit();
    }


    public virtual void HandleMouseExit()
    {
        //Debug.Log("Tracker: HandleMouseExit", this);
        SendEventName("MouseExit");
    }
    

    public virtual void SetMouseDown(bool mouseDown0)
    {
        //Debug.Log("Tracker: SetMouseDown: mouseDown0: " + mouseDown0, this);
        mouseDown = mouseDown0;

        if (dragTracking) {
            if (mouseDown) {
                dragging = true;
                dragPlane.SetNormalAndPosition(
                    Vector3.up,
                    transform.position);

                float enter = 0.0f;
                if (!dragPlane.Raycast(mouseRay, out enter)) {
                    dragging = false;
                    return;
                }
                dragStartPlanePosition = mouseRay.GetPoint(enter);

                dragStartPosition = transform.position;
                dragStartRotation = transform.rotation;
                dragStartScreenPosition = mousePosition;
                SendEventName("DragStart");
            } else {
                dragging = false;
                SendEventName("DragStop");
            }
        }
    }


    public virtual void OnMouseDown()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseDown", this);

        TrackMousePosition();

        SetMouseDown(true);

        HandleMouseDown();
    }


    public virtual void HandleMouseDown()
    {
        //Debug.Log("Tracker: HandleMouseDown", this);
        SendEventName("MouseDown");
    }


    public virtual void OnMouseUp()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseUp", this);

        TrackMousePosition();

        SetMouseDown(false);

        HandleMouseUp();
    }


    public virtual void HandleMouseUp()
    {
        //Debug.Log("Tracker: HandleMouseUp", this);
        SendEventName("MouseUp");
    }


    public virtual void OnMouseUpAsButton()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseUpAsButton", this);

        TrackMousePosition();

        SetMouseDown(false);

        HandleMouseUpAsButton();
    }


    public virtual void HandleMouseUpAsButton()
    {
        //Debug.Log("Tracker: HandleMouseUpAsButton", this);
        SendEventName("MouseUpAsButton");
    }


    public virtual void OnMouseDrag()
    {
        if (!mouseTracking) {
            return;
        }

        //Debug.Log("Tracker: OnMouseDrag", this);

        TrackMousePosition();

        HandleMouseDrag();
    }


    public virtual void HandleMouseDrag()
    {
        //Debug.Log("Tracker: HandleMouseDrag", this);
        SendEventName("MouseDrag");
    }


    public virtual void OnMouseOver()
    {
        //Debug.Log("Tracker: OnMouseOver", this);

        TrackMousePosition();

        HandleMouseOver();
    }


    public virtual void HandleMouseOver()
    {
        //Debug.Log("Tracker: HandleMouseOver", this);
        SendEventName("MouseOver");
    }


     public bool IsPointerOverUIObject()
     {
         PointerEventData eventDataCurrentPosition = new PointerEventData(EventSystem.current);
         eventDataCurrentPosition.position = new Vector2(Input.mousePosition.x, Input.mousePosition.y);
         List<RaycastResult> results = new List<RaycastResult>();
         EventSystem.current.RaycastAll(eventDataCurrentPosition, results);
#if false
         foreach (RaycastResult result in results) {
             Debug.Log("Tracker: IsPointerOverUIObject: " + result);
         }
#endif
         return results.Count > 0;
     }


}
