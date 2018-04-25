////////////////////////////////////////////////////////////////////////
// BridgeTest.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class BridgeTest : BridgeObject {


    public enum FooBarEnum {
        Foo, Bar
    };


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public int i;
    public float f;
    public bool b;
    public string str;
    public FooBarEnum fooBar;
    public Vector2 v2;
    public Vector3 v3;
    public Vector4 v4;
    public Quaternion quatXYZW;
    public Quaternion quatRollPitchYaw;
    public Color colorRGB;
    public Color colorRGBA;
    public Matrix4x4 mat;

#if true
    public ParticleSystem.MinMaxCurve minMaxCurveNumber;
    public ParticleSystem.MinMaxCurve minMaxCurveConstant;
    public ParticleSystem.MinMaxCurve minMaxCurveCurve;
    public ParticleSystem.MinMaxCurve minMaxCurveRandomCurves;
    public ParticleSystem.MinMaxCurve minMaxCurveRandomConstants;
    public ParticleSystem.MinMaxGradient minMaxGradientColor;
    public ParticleSystem.MinMaxGradient minMaxGradientGradient;
    public ParticleSystem.MinMaxGradient minMaxGradientTwoColors;
    public ParticleSystem.MinMaxGradient minMaxGradientTwoGradients;
    public ParticleSystem.MinMaxGradient minMaxGradientRandomColor;
    public AnimationCurve animationCurve;
    public ParticleCollisionEvent particleCollisionEvent;
#endif

#if USE_ARKIT
    public ARPlaneAnchor arPlaneAnchor;
    public ARUserAnchor arUserAnchor;
    public ARHitTestResult arHitTestResult;
#endif


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


}
