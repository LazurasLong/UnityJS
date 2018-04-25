////////////////////////////////////////////////////////////////////////
// Accessor.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public class Accessor {


    public enum AccessorType {
        Undefined,
        Constant,
        Array,
        List,
        Dictionary,
        Field,
        Property,
        Transform,
        Component,
        BridgeObject,
    };


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    public AccessorType type;
    public bool conditional;

    public object constantObject;

    public object[] arrayObject;
    public int arrayIndex;

    public List<object> listObject;
    public int listIndex;

    public Dictionary<string, object> dictionaryObject;
    public string dictionaryKey;

    public object fieldObject;
    public string fieldName;
    public FieldInfo fieldInfo;

    public object propertyObject;
    public string propertyName;
    public PropertyInfo propertyInfo;

    public object transformObject;
    public string transformName;

    public object componentObject;
    public string componentName;

    public string bridgeObjectID;


    ////////////////////////////////////////////////////////////////////////
    // Static Methods


    public static bool FindAccessor(object firstObj, string path, ref Accessor accessor)
    {
        //Debug.Log("Accessor: FindAccessor: firstObj: " + firstObj + " path: " + path);

        if (firstObj == null) {
            Debug.LogError("Accessor: FindAccessor: called with null firstObj for path: " + path);
            accessor = null;
            return false;
        }

        accessor = new Accessor();
        accessor.InitConstant(firstObj, false);

        string[] names = path.Split('/');
        int n = names.Length;

        for (int i = 0; i < n; i++) {
            string name = names[i];

            if ((name == "") || (name == "?")) {
                Debug.LogError("Accessor: FindAccessor: empty name in path: " + path);
                return false;
            }

            bool conditional = name[name.Length - 1] == '?';
            if (conditional) {
                name = name.Substring(0, name.Length - 1);
            }

            object nextObj = null;
            if (!accessor.Get(ref nextObj)) {
                if (!accessor.conditional) {
                    Debug.LogError("Accessor: FindAccessor: error getting accessor: " + accessor + " for path: " + path + " firstObj: " + firstObj + " nextObj: " + nextObj);
                    return false;
                } else {
                    //Debug.Log("Accessor: FindAccessor: ignoring error getting conditional accessor: " + accessor + " for path: " + path + " firstObj: " + firstObj + " nextObj: " + nextObj);
                    accessor.InitConstant(null, true);
                    return true;
                }
            }

            //Debug.Log("Accessor: FindAccessor: FOO: GOT nextObj: " + nextObj + " == null: " + (nextObj == null) + " equals null: " + nextObj.Equals(null) + " type: " + ((nextObj == null) ? "null" : ("" + nextObj.GetType())) + " accessor: " + accessor + " " + accessor.type + " " + accessor.conditional + " path: " + path + " name: " + name);

            if ((nextObj == null) || nextObj.Equals(null)) {
                //Debug.Log("Accessor: FindAccessor: BAR: null nextObj: " + nextObj + " accessor: " + accessor + " " + accessor.type + " " + accessor.conditional + " path: " + path + " name: " + name);
                if (!accessor.conditional) {
                    Debug.LogError("Accessor: FindAccessor: null object in path: " + path + " i: " + i + " name: " + name + " firstObj: " + firstObj + " nextObj: " + nextObj);
                   return false;
                } else {
                    //Debug.Log("Accessor: FindAccessor: ignoring null from conditional accessor: " + accessor + " for path: " + path + " firstObj: " + firstObj + " nextObj: " + nextObj);
                    accessor.InitConstant(null, true);
                    return true;
                }
            }
            //Debug.Log("Accessor: FindAccessor: BAZ: got nextObj: " + nextObj + " accessor: " + accessor + " " + accessor.type + " " + accessor.conditional + " path: " + path + " name: " + name);

            string[] parts = name.Split(new char[] { ':' }, 2);
            string prefix = 
                (parts.Length == 1)
                    ? "object"
                    : parts[0];
            string rest = parts[parts.Length - 1];

            //Debug.Log("Accessor: FindAccessor: name: " + name + " parts length: " + parts.Length + " prefix: " + prefix + " rest: " + rest);

            switch (prefix) {

                case "index": // Array or List index
                case "array": // Array or List index
                case "list": // Array or List index

                    bool searchArray = (prefix == "array") || (prefix == "index");
                    bool searchList = (prefix == "list") || (prefix == "index");
                    int index = 0;

                    bool isInteger = int.TryParse(rest, out index);
                    if (!isInteger) {
                        Debug.LogError("Accessor: FindAccessor: prefix: " + prefix + " expected integer index: " + rest + " path: " + path);
                        accessor = null;
                        return false;
                    }

                    if (searchArray && (nextObj is Array)) {

                        object[] array = (object[])nextObj;
                        //Debug.Log("Accessor: FindAccessor: prefix: " + prefix + " array: " + array + " length: " + array.Length + " index: " + index + " path: " + path);
                        if (array == null) {
                            Debug.LogError("Accessor: FindAccessor: prefix: " + prefix + " expected array: " + rest + " path: " + path);
                            accessor = null;
                            return false;
                        }

                        accessor.InitArray(array, index, conditional);

                    } else if (searchList && (nextObj is List<object>)) {

                        List<object> list = (List<object>)nextObj;
                        if (list == null) {
                            Debug.LogError("Accessor: FindAccessor: prefix: " + prefix + " expected List<object>: " + rest + " path: " + path);
                            accessor = null;
                            return false;
                        }

                        accessor.InitList(list, index, conditional);

                    } else {
                        Debug.LogError("Accessor: FindAccessor: prefix: " + prefix + " expected indexed array or list nextObj: " + nextObj + " path: " + path);
                        accessor = null;
                        return false;
                    }

                    break;

                case "dict": // C# Dictionary<string, object> key

                    Dictionary<string, object> dict = nextObj as Dictionary<string, object>;
                    if (dict == null) {
                        Debug.LogError("Accessor: FindAccessor: prefix: dict expected Dictionary<string, object>: " + rest + " path: " + path + " but got nextObj: " + nextObj + " type: " + nextObj.GetType());
                        accessor = null;
                        return false;
                    }
                    accessor.InitDictionary(dict, rest, conditional);

                    break;

                case "transform": // Unity Transform name or index

                    accessor.InitTransform(nextObj, rest, conditional);

                    break;

                case "component": // Unity MonoBehaviour component class name

                    accessor.InitComponent(nextObj, rest, conditional);

                    break;

                case "object": // C# object Field or Property name
                case "field": // C# object Field or Property name
                case "property": // C# object Field or Property name

                    FieldInfo fieldInfo = null;
                    PropertyInfo propertyInfo = null;
                    bool searchField = (prefix == "field") || (prefix == "object");
                    bool searchProperty = (prefix == "property") || (prefix == "object");

                    System.Type objectType = nextObj.GetType();
                    System.Type searchType = objectType;

                     //Debug.Log("Accessor: FindAccessor: prefix: " + prefix + " name: " + name + " objectType: " + objectType);

                    while (searchType != null) {

#if false
                        Debug.Log ("========================================================================");

                        FieldInfo[] fields = searchType.GetFields(BindingFlags.Public | BindingFlags.Static);
                        Debug.Log ("Accessor: FindAccessor: DUMPING searchType: " + searchType + " fields: " + fields.Length);
                        foreach (FieldInfo fieldInfo1 in fields) {
                            Debug.Log ("Accessor: FindAccessor: fieldInfo1: " + fieldInfo1);
                        }

                        PropertyInfo[] properties = searchType.GetProperties(BindingFlags.Public | BindingFlags.Static);
                        Debug.Log ("Accessor: FindAccessor: DUMPING searchType: " + searchType + " properties: " + properties.Length);
                        foreach (PropertyInfo propertyInfo1 in properties) {
                            Debug.Log ("Accessor: FindAccessor: propertyInfo1: " + propertyInfo1);
                        }

                        Debug.Log ("========================================================================");
#endif

                        if (searchProperty) {
                            fieldInfo = searchType.GetField(name);
                            //Debug.Log("Accessor: FindAccessor: searching searchType: " + searchType + " for name: " + name + " and got fieldInfo: " + fieldInfo);
                            if (fieldInfo != null) {
                                break;
                            }
                        }

                        if (searchField) {
                            propertyInfo = searchType.GetProperty(name);
                            //Debug.Log("Accessor: FindAccessor: searching searchType: " + searchType + " for name: " + name + " and got propertyInfo: " + propertyInfo);
                            if (propertyInfo != null) {
                                break;
                            }
                        }

                        searchType = searchType.BaseType;

                    }

                    if (fieldInfo != null) {
                        //Debug.Log("Accessor: FindAccessor: found fieldInfo: " + fieldInfo);
                        accessor.InitField(nextObj, name, fieldInfo, conditional);
                    } else if (propertyInfo != null) {
                        //Debug.Log("Accessor: FindAccessor: found propertyInfo: " + propertyInfo);
                        accessor.InitProperty(nextObj, name, propertyInfo, conditional);
                    } else {
                        Debug.LogError("Accessor: FindAccessor: undefined field or property name: " + name + " firstObj: " + firstObj + " nextObj: " + nextObj);
                        accessor = null;
                        return false;
                    }

                    break;

                case "bridgeobject": // BridgeObject id

                    accessor.InitBridgeObject(rest, conditional);

                    break;

                default:

                    Debug.LogError("Accessor: FindAccessor: undefined prefix: " + prefix + " in path: " + path);
                    accessor = null;

                    break;

            }

        }

        return true;
    }


    public static bool GetProperty(object target, string name, ref object result)
    {
        //Debug.Log("Accessor: GetProperty: target: " + target + " name: " + name);

        Accessor accessor = null;
        if (!Accessor.FindAccessor(
                target,
                name,
                ref accessor)) {
            Debug.LogError("Accessor: GetProperty: can't find accessor for target: " + target + " name: " + name);
            return false;
        }

        if (!accessor.Get(ref result)) {
            if (!accessor.conditional) {
                Debug.LogError("Accessor: GetProperty: can't get from accessor: " + accessor + " " + accessor.type + " " + accessor.conditional + " for target: " + target + " name: " + name);
                return false;
            } else {
                //Debug.Log("Accessor: GetProperty: conditional accessor returned null: " + accessor + " for target: " + target + " name: " + name);
                result = null;
                return true;
            }
        }

        //Debug.Log("Accessor: GetProperty: target: " + target + " name: " + name + " accessor: " + accessor + " result: " + result);

        return true;
    }


    public static bool SetProperty(object target, string name, JToken jsonValue)
    {
        //Debug.Log("Accessor: SetProperty: target: " + target + " name: " + name + " jsonValue: " + jsonValue);

        Accessor accessor = null;
        if (!Accessor.FindAccessor(
                target,
                name,
                ref accessor)) {
            Debug.LogError("Accessor: SetProperty: can't find accessor for target: " + target + " name: " + name);
            return false;
        }

        object value = null;
        Type targetType = accessor.GetTargetType();
        //Debug.Log("Accessor: SetProperty: accessor: " + accessor + " targetType: " + targetType);

        if (targetType == null) {
            if (!accessor.conditional) {
                Debug.LogError("Accessor: SetProperty: accessor got null targetType");
                return false;
            } else {
                //Debug.Log("Accessor: SetProperty: conditional accessor ignored null targetType");
                return false;
            }
        }

        if (!Bridge.bridge.ConvertToType(jsonValue, targetType, ref value)) {
            if (!accessor.conditional) {
                Debug.LogError("Accessor: SetProperty: can't convert jsonValue: " + jsonValue + " to targetType: " + targetType);
                return false;
            } else {
                //Debug.Log("Accessor: SetProperty: conditional accessor could not convert type jsonValue: " + jsonValue + " to targetType: " + targetType + " target: " + target + " name: " + name);
                return true;
            }
        }

        //Debug.Log("Accessor: SetProperty: value: " + value);

        if (!accessor.Set(value)) {
            if (!accessor.conditional) {
                Debug.LogError("Accessor: SetProperty: can't set with accessor: " + accessor + " value: " + value);
                return false;
            } else {
                //Debug.Log("Accessor: SetProperty: not setting with conditional accessor: " + accessor + " value: " + value + " target: " + target + " name " + name);
                return true;
            }
        }

        //Debug.Log("Accessor: SetProperty: target: " + target + " name: " + name + " jsonValue: " + jsonValue + " targetType: " + targetType + " value: " + value + " accessor: " + accessor);

        return true;
    }


    public static bool GetPath(object target, string path, out object result)
    {
        result = null;

        Accessor accessor = null;
        if (!FindAccessor(
                target,
                path,
                ref accessor)) {

            Debug.LogError("Accessor: GetPath: can't find accessor for target: " + target + " path: " + path);
            return false;

        }

        if (!accessor.Get(ref result)) {

            if (!accessor.conditional) {
                Debug.LogError("Accessor: GetPath: can't get accessor: " + accessor + " target: " + target + " path: " + path);
                return false;
            }

        }

        return true;
    }


    public static bool SetPath(object target, string path, object value)
    {
        Accessor accessor = null;
        if (!FindAccessor(
                target,
                path,
                ref accessor)) {

            Debug.LogError("Accessor: SetPath: can't find accessor for target: " + target + " path: " + path);
            return false;

        }

        if (!accessor.Set(value)) {

            Debug.LogError("Accessor: SetPath: can't set accessor: " + accessor + " target: " + target + " path: " + path);
            return false;

        }

        return true;
    }


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    public void Clear()
    {
        type = AccessorType.Undefined;
        constantObject = null;
        arrayObject = null;
        arrayIndex = 0;
        listObject = null;
        listIndex = 0;
        dictionaryObject = null;
        dictionaryKey = null;
        fieldObject = null;
        fieldName = null;
        fieldInfo = null;
        propertyObject = null;
        propertyName = null;
        propertyInfo = null;
        transformObject = null;
        transformName = null;
        componentObject = null;
        componentName = null;
        bridgeObjectID = null;
    }


    public void InitConstant(object constantObject0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Constant;
        constantObject = constantObject0;
        conditional = conditional0;
    }
    

    public void InitArray(object[] arrayObject0, int arrayIndex0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Array;
        arrayObject = arrayObject0;
        arrayIndex = arrayIndex0;
        conditional = conditional0;
    }


    public void InitList(List<object> listObject0, int listIndex0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.List;
        listObject = listObject0;
        listIndex = listIndex0;
        conditional = conditional0;
    }


    public void InitDictionary(Dictionary<string, object> dictionaryObject0, string dictionaryKey0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Dictionary;
        dictionaryObject = dictionaryObject0;
        dictionaryKey = dictionaryKey0;
        conditional = conditional0;
    }


    public void InitField(object fieldObject0, string fieldName0, FieldInfo fieldInfo0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Field;
        fieldObject = fieldObject0;
        fieldName = fieldName0;
        fieldInfo = fieldInfo0;
        conditional = conditional0;
    }
    

    public void InitProperty(object propertyObject0, string propertyName0, PropertyInfo propertyInfo0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Property;
        propertyObject = propertyObject0;
        propertyName = propertyName0;
        propertyInfo = propertyInfo0;
        conditional = conditional0;
    }


    public void InitTransform(object transformObject0, string transformName0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Transform;
        transformObject = transformObject0;
        transformName = transformName0;
        conditional = conditional0;
    }


    public void InitComponent(object componentObject0, string componentName0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.Component;
        componentObject = componentObject0;
        componentName = componentName0;
        conditional = conditional0;
    }


    public void InitBridgeObject(string bridgeObjectID0, bool conditional0 = false)
    {
        Clear();
        type = AccessorType.BridgeObject;
        bridgeObjectID = bridgeObjectID0;
        conditional = conditional0;
    }


    public bool CanGet()
    {
        switch (type) {

            case AccessorType.Undefined:
                return false;

            case AccessorType.Constant:
                return true;

            case AccessorType.Array:
                return (arrayIndex > 0) && (arrayIndex < arrayObject.Length);

            case AccessorType.List:
                return (listIndex > 0) && (listIndex < listObject.Count);

            case AccessorType.Dictionary:
                return dictionaryObject.ContainsKey(dictionaryKey);

            case AccessorType.Field:
                return true;

            case AccessorType.Property:
                return true;

            case AccessorType.Transform:
                return true;

            case AccessorType.Component:
                return true;

            case AccessorType.BridgeObject:
                return true;

        }

        return false;
    }


    public bool Get(ref object result)
    {
        result = null;

        switch (type) {

            case AccessorType.Undefined:
                Debug.LogError("Accessor: Get: type: Unknown: error getting undefined accessor type");
                return false;

            case AccessorType.Constant: {
                result = constantObject;
                return true;
            }

            case AccessorType.Array: {
                //Debug.Log("Accessor: Get: Array: arrayIndex: " + arrayIndex + " length: " + arrayObject.Length + " elementType: " + arrayObject.GetType().GetElementType());
                if ((arrayIndex >= 0) && (arrayIndex < arrayObject.Length)) {
                    result = arrayObject[arrayIndex];
                    //Debug.Log("Accessor: Get: Array: result: " + result);
                    return true;
                } else {
                    Debug.LogError("Accessor: Get: type: Array: invalid arrayIndex: " + arrayIndex);
                    return false;
                }
            }

            case AccessorType.List: {
                if ((listIndex > 0) && (listIndex < listObject.Count)) {
                    result = listObject[listIndex];
                    return true;
                } else {
                    Debug.LogError("Accessor: Get: type: List: invalid listIndex: " + listIndex);
                    return false;
                }
            }

            case AccessorType.Dictionary: {
                if (dictionaryObject.ContainsKey(dictionaryKey)) {
                    result = dictionaryObject[dictionaryKey];
                    return true;
                } else {
                    Debug.LogError("Accessor: Get: type: Dictionary: undefined dictionaryKey: " + dictionaryKey);
                    return false;
                }
            }

            case AccessorType.Field: {
                try {
                    result = fieldInfo.GetValue(fieldObject);
                    return true;
                } catch (Exception ex) {
                    Debug.LogError("Accessor: Get: type: Field: error getting value via fieldInfo: " + fieldInfo + " from fieldObject: " + fieldObject + " ex: " + ex);
                    return false;
                }
            }

            case AccessorType.Property: {
                try {
#if UNITY_IOS
                    // iOS AOT compiler requires this slower invocation.
                    result = propertyInfo.GetGetMethod().Invoke(propertyObject, null);
#else
                    result = propertyInfo.GetValue(propertyObject, null);
#endif
                    return true;
                } catch (Exception ex) {
                    Debug.LogError("Accessor: Get: type: Property: error getting value via propetyInfo: " + propertyInfo + " from propertyObject: " + propertyObject + " ex: " + ex);
                    return false;
                }
            }

            case AccessorType.Transform: {
                Component componentObject = transformObject as Component;
                GameObject gameObject = transformObject as GameObject;

                if ((componentObject == null) &&
                    (gameObject == null)) {
                    Debug.LogError("Accessor: Get: type: Transform: not a component or gameObject! transformObject: " + transformObject);
                    return false;
                }

                if (componentObject != null) {
                    gameObject = componentObject.gameObject;
                }

                Transform gameObjectTransform = gameObject.transform;

                switch (transformName) {

                    case ".":
                        result = gameObjectTransform;
                        return true;

                    case "..":
                        result = gameObjectTransform.parent;
                        return true;

                    default:
                        int index = 0;
                        bool isInteger = int.TryParse(transformName, out index);

                        if (isInteger) {

                            result =
                                ((index >= 0) &&
                                 (index < gameObjectTransform.childCount))
                                    ? gameObjectTransform.GetChild(index)
                                    : null;
                            //Debug.Log("Accessor: Get: type: Transform gameObjectTransform: " + gameObjectTransform + " index: " + index + " result: " + result);
                            return true;


                        } else {

                            result = 
                                gameObjectTransform.Find(transformName);
                            //Debug.Log("Accessor: Get: type: Transform gameObjectTransform: " + gameObjectTransform + " transformName: " + transformName + " result: " + result);
                            return true;

                        }

                }
            }

            case AccessorType.Component: {
                Component thisComponent = (Component)componentObject;

#if false
                Component[] components = thisComponent.gameObject.GetComponents(typeof(Component));
                Debug.Log("Accessor: Get: component: FOUND " + components.Length + " components...");
                foreach (Component c in components) {
                    Debug.Log("Accessor: Get: component: COMPONENT: " + c + " " + c.GetType());
                }
#endif

                if (thisComponent == null) {

                    Debug.Log("Accessor: Get: type: Component Not Component subclass! componentObject: " + componentObject + " componentName: " + componentName);
                    return false;

                }

                //Debug.Log("Accessor: Get: type: Component componentObject: " + componentObject + " thisComponent: " + thisComponent);

                System.Type componentType = FindTypeInLoadedAssemblies(componentName);

                //Debug.Log("Accessor: Get: type: Component FindTypeInLoadedAssemblies componentName: " + componentName + " componentType: " + componentType);

                if (componentType == null) {
                    componentType = FindTypeInLoadedAssemblies("UnityEngine." + componentName);
                    //Debug.Log("Accessor: Get: type: Component FindTypeInLoadedAssemblies componentName: UnityEngine." + componentName + " componentType: " + componentType);
                }

                if (componentType == null) {
                    Debug.LogError("Accessor: Get: type: Component: can't get componentType! componentObject: " + componentObject + " componentName: " + componentName);
                    return false;
                }

                Component component = thisComponent.gameObject.GetComponent(componentType);

                //Debug.Log("Accessor: Get: XXXX: type: Component component: " + component + " Type: " + ((component == null) ? "null" : ("" + component.GetType())));

                if ((component == null) || component.Equals(null)) {
                    return false;
                }

                result = component;
                return true;
            }

            case AccessorType.BridgeObject: {
                BridgeObject bridgeObject = 
                    Bridge.bridge.GetBridgeObject(bridgeObjectID);

                if (bridgeObject != null) {
                    result = bridgeObject;
                    //Debug.Log("Accessor: Get: type: BridgeObject: found bridgeObjectID: " + bridgeObjectID + " result: " + result);

                    return true;
                } else {
                    Debug.LogError("Accessor: Get: type: BridgeObject: undefined bridgeObjectID: " + bridgeObjectID);

                    return false;
                }
            }

        }

        return false;
    }


    public bool CanSet()
    {
        switch (type) {

            case AccessorType.Undefined:
                return false;

            case AccessorType.Constant:
                return false;

            case AccessorType.Array:
                return (arrayIndex > 0) && (arrayIndex < arrayObject.Length);

            case AccessorType.List:
                return (listIndex > 0) && (listIndex < listObject.Count);

            case AccessorType.Dictionary:
                return true;

            case AccessorType.Field:
                return true;

            case AccessorType.Property:
                return true;

            case AccessorType.Transform:
                return false;

            case AccessorType.Component:
                return false;

            case AccessorType.BridgeObject:
                return false;

        }

        return false;
    }


    public bool Set(object value)
    {
        switch (type) {

            case AccessorType.Undefined:
                Debug.LogError("Accessor: Get: type: Unknown: error setting undefined type");
                return false;

            case AccessorType.Constant:
                Debug.LogError("Accessor: Get: type: Unknown: error setting constant type");
                return false;

            case AccessorType.Array:
                if ((arrayIndex > 0) && (arrayIndex < arrayObject.Length)) {
                    arrayObject[arrayIndex] = value;
                    return true;
                } else {
                    Debug.LogError("Accessor: Set: type: Array: out of range arrayIndex: " + arrayIndex + " Length: " + arrayObject.Length);
                    return false;
                }

            case AccessorType.List:
                if ((listIndex > 0) && (listIndex < listObject.Count)) {
                    listObject[listIndex] = value;
                    return true;
                } else {
                    Debug.LogError("Accessor: Set: type: Array: out of range arrayIndex: " + arrayIndex + " Length: " + arrayObject.Length);
                    return false;
                }

            case AccessorType.Dictionary:
                dictionaryObject[dictionaryKey] = value;
                return true;

            case AccessorType.Field:
                try {
                    fieldInfo.SetValue(fieldObject, value);
                    return true;
                } catch (Exception ex) {
                    Debug.LogError("Accessor: Set: type: Field: error setting value! ex: " + ex);
                    return false;
                }

            case AccessorType.Property:
                try {
                    propertyInfo.SetValue(propertyObject, value, null);
                    return true;
                } catch (Exception ex) {
                    Debug.LogError("Accessor: Set: type: Property: error setting value! ex: " + ex);
                    return false;
                }

            case AccessorType.Transform:
                Debug.LogError("Accessor: Set: can't set type: Transform transformObject: " + transformObject);
                return false;

            case AccessorType.Component:
                Debug.LogError("Accessor: Set: can't set type: Component componentObject: " + componentObject);
                return false;

            case AccessorType.BridgeObject:
                Debug.LogError("Accessor: Set: can't set type: BridgeObject bridgeObjectID: " + bridgeObjectID);
                return false;

        }

        return false;
    }


    public Type GetTargetType()
    {
        switch (type) {

            case AccessorType.Undefined:
                Debug.LogError("Accessor: Get: type: Unknown: error getting type of undefined accessor");
                return null;

            case AccessorType.Constant:
                if ((constantObject == null) || constantObject.Equals(null)) {
                    return null;
                }
                return constantObject.GetType();

            case AccessorType.Array:
                return arrayObject.GetType().GetElementType();

            case AccessorType.List:
                return arrayObject.GetType().GetGenericArguments()[0];

            case AccessorType.Dictionary:
                return arrayObject.GetType().GetGenericArguments()[1];

            case AccessorType.Field:
                return fieldInfo.FieldType;

            case AccessorType.Property:
                return propertyInfo.PropertyType;

            case AccessorType.Transform:
                return typeof(Transform);

            case AccessorType.Component:
                return typeof(Component);

            case AccessorType.BridgeObject:
                return typeof(BridgeObject);

        }

        return null;
    }
    

    public static System.Type FindTypeInLoadedAssemblies(string typeName)
    {
        System.Type foundType = null;

        //Debug.Log("Accessor: FindTypeInLoadedAssemblies: typeName: " + typeName + " assemblies: " + System.AppDomain.CurrentDomain.GetAssemblies());

        foreach (var assembly in System.AppDomain.CurrentDomain.GetAssemblies()) {

            foundType = assembly.GetType(typeName);

            //Debug.Log("Accessor: FindTypeInLoadedAssemblies: typeName: " + typeName + " assembly: " + assembly + " foundType: " + foundType);

            if (foundType != null) {

                //Debug.Log("Accessor: FindTypeInLoadedAssemblies: typeName: " + typeName + " FOUND!!!!!!");

#if false
                foreach (PropertyInfo p in foundType.GetProperties()) {
                    Debug.Log("Accessor: FindTypeInLoadedAssemblies: typeName: " + typeName + " with property: " + p.Name);
                }
#endif

                break;
            }

        }

        return foundType;
    }


}

