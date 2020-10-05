
var statusObj = {
    online: function () {
        //statusObj.switchFaceUI();
    },
    switchFaceUI: function () {
        var facename = ['sentiment_dissatisfied', 'sentiment_neutral', 'sentiment_satisfied', 'sentiment_very_satisfied', 'face', 'insert_emoticon'];
        var facecolor = ['#cddc39', '#4caf50', '#03a9f4', '#673ab7', '#33691e', '#9c27b0'];
        var index = statusObj.randomNumBoth(0, facename.length - 1);
        $('#active-face-type').html(facename[index]);
        $('#active-face-type').css('color', facecolor[index]);
    },
    randomNumBoth: function (min, max) {
        var range = max - min;
        var rand = Math.random();
        var num = min + Math.round(rand * range);
        return num;
    },
}