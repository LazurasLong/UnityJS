////////////////////////////////////////////////////////////////////////
// TextOverlays.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;


public class TextOverlays: Tracker {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public Canvas canvas;
    public RectTransform panel;
    public Image image;
    public TextMeshProUGUI topLeftText;
    public TextMeshProUGUI topText;
    public TextMeshProUGUI topRightText;
    public TextMeshProUGUI leftText;
    public TextMeshProUGUI centerText;
    public TextMeshProUGUI rightText;
    public TextMeshProUGUI bottomLeftText;
    public TextMeshProUGUI bottomText;
    public TextMeshProUGUI bottomRightText;
    public RectTransform console;
    public ScrollRect consoleTextScrollView;
    public TextMeshProUGUI consoleText;
    public ScrollRect consoleInputScrollView;
    public TMP_InputField consoleInputField;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    public void HandleConsoleInputFieldValueChanged()
    {
        Debug.Log("TextOverlays: HandleConsoleInputFieldValueChanged");
    }
    

    public void HandleConsoleInputFieldEndEdit()
    {
        Debug.Log("TextOverlays: HandleConsoleInputFieldEndEdit");
    }
    

    public void HandleConsoleInputFieldSelect()
    {
        Debug.Log("TextOverlays: HandleConsoleInputFieldSelect");
    }
    

    public void HandleConsoleInputFieldDeselect()
    {
        Debug.Log("TextOverlays: HandleConsoleInputFieldDeselect");
    }
    

}
