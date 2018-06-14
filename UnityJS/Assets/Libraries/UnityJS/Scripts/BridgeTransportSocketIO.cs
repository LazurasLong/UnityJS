////////////////////////////////////////////////////////////////////////
// BridgeTransportSocketIO.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


#if USE_SOCKETIO


using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Newtonsoft.Json;

using Quobject.SocketIoClientDotNet.Client;


using StringCallback = System.Action<string>;


public class BridgeTransportSocketIO : BridgeTransport
{

    public Socket socket;


    public override void HandleInit()
    {
        url = "http://localhost:3000";

        //Debug.Log("BridgeSocketIO: Init: url0: " + url0);

        driver = "SocketIO";

        socket = IO.Socket(url);
        
        socket.On(Socket.EVENT_CONNECT, () => {
            socket.Emit("Hi");
        });

        socket.On("hi", (data) => {
            Debug.Log(data);
            socket.Disconnect();
        });

        startedJS = true; // XXX
        bridge.HandleTransportLoaded(); // XXX

    }


}


#endif