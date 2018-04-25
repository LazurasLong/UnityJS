////////////////////////////////////////////////////////////////////////
// Cuboid.cs
// Copyright (C) 2018 by Don Hopkins, Ground Up Software.


using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


public enum CuboidFace {
    Top = 0,
    Bottom = 1,
    Front = 2,
    Back = 3,
    Right = 4,
    Left = 5,
};


public class Cuboid : BridgeObjectTracker {


    ////////////////////////////////////////////////////////////////////////
    // Instance variables


    public BoxCollider boxCollider;
    public Tile[] tiles = new Tile[6];
    public Vector3 cuboidSize = Vector3.one;
    public bool updateTiles;


    ////////////////////////////////////////////////////////////////////////
    // Instance Methods


    void Start()
    {
        updateTiles = true;
        UpdateTiles();
    }


    void Update()
    {
        UpdateTiles();
    }


    public void UpdateTiles()
    {
        if (!updateTiles) {
            return;
        }

        updateTiles = false;


        if (tiles[(int)CuboidFace.Top   ] != null) {
            UpdateTile(tiles[(int)CuboidFace.Top   ], cuboidSize.x, cuboidSize.z, new Vector3( 0.0f,                 0.5f * cuboidSize.y,  0.0f));
        }
        if (tiles[(int)CuboidFace.Bottom] != null) {
            UpdateTile(tiles[(int)CuboidFace.Bottom], cuboidSize.x, cuboidSize.z, new Vector3( 0.0f,                -0.5f * cuboidSize.y,  0.0f));
        }
        if (tiles[(int)CuboidFace.Front ] != null) {
            UpdateTile(tiles[(int)CuboidFace.Front ], cuboidSize.x, cuboidSize.y, new Vector3( 0.0f,                 0.0f,                 0.5f * cuboidSize.z));
        }
        if (tiles[(int)CuboidFace.Back  ] != null) {
            UpdateTile(tiles[(int)CuboidFace.Back  ], cuboidSize.x, cuboidSize.y, new Vector3( 0.0f,                 0.0f,                -0.5f * cuboidSize.z));
        }
        if (tiles[(int)CuboidFace.Right ] != null) {
            UpdateTile(tiles[(int)CuboidFace.Right ], cuboidSize.z, cuboidSize.y, new Vector3( 0.5f * cuboidSize.x,  0.0f,                 0.0f));
        }
        if (tiles[(int)CuboidFace.Left  ] != null) {
            UpdateTile(tiles[(int)CuboidFace.Left  ], cuboidSize.z, cuboidSize.y, new Vector3(-0.5f * cuboidSize.x,  0.0f,                 0.0f));
        }

        boxCollider.size = cuboidSize;
    }


    public void UpdateTile(Tile tile, float x, float y, Vector3 zOffset)
    {
        tile.transform.localPosition =
            zOffset;
        tile.transform.localScale =
            new Vector3(
                x,
                y,
                1.0f);
    }

}
