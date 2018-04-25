////////////////////////////////////////////////////////////////////////
// BridgeObjectTrackerProxy.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;


public class BridgeObjectTrackerProxy : MonoBehaviour {


    public BridgeObjectTracker target;


    public virtual void OnMouseEnter()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseEnter: target: " + target);
        target.OnMouseEnter();
    }


    public virtual void OnMouseExit()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseExit: target: " + target);
        target.OnMouseExit();
    }

    public virtual void OnMouseDown()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseDown: target: " + target);
        target.OnMouseDown();
    }


    public virtual void OnMouseUp()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseUp: target: " + target);
        target.OnMouseUp();
    }


    public virtual void OnMouseUpAsButton()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseUpAsButton: target: " + target);
        target.OnMouseUpAsButton();
    }


    public virtual void OnMouseDrag()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseDrag: target: " + target);
        target.OnMouseDrag();
    }


    public virtual void OnMouseOver()
    {
        Debug.Log("BridgeObjectTrackerProxy: OnMouseOver: target: " + target);
        target.OnMouseOver();
    }


}
