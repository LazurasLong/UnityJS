/*
 * emoji.js
 * Don Hopkins, Ground Up Software.
 */


////////////////////////////////////////////////////////////////////////


const delay = require('delay');
const googleTrends = require('google-trends-api');
const Emoji = require('./emoji');
const zzz = 1000;


function doOne(id) {
    var data = Emoji[id];
    if (!data) {
        return;
    }

    var emoji = data[2];
    var name = data[3];

    googleTrends.interestOverTime({
        keyword: emoji
    })
    .then(function(results) {
        results = JSON.parse(results);
        var def = results ? results['default'] : null;
        var timelineData = def ? def['timelineData'] : null;
        var lastSample = timelineData ? timelineData[timelineData.length - 1] : null;
        var hasData = lastSample ? lastSample.hasData : false;
        var value = hasData
            ? (lastSample.value[0] || 0) 
            : 0;
        console.log(id, emoji, name, value);
        
        delay(zzz)
            .then(
                function() {
                    doOne(id + 1);
                });
    })
    .catch(function(err){
      console.log("ERROR", id, emoji, name, err);
    });
}


//doOne(1);
doOne(111);


////////////////////////////////////////////////////////////////////////
