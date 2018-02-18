var fs = require("fs");
var path = require("path");
var utilities = require("./utilities");

module.exports = {

    replaceMainActivity: function(context) {

        const packageName = utilities.getAppName(context);
        const packageId = utilities.getAppId(context);

        console.log("CODE UPDATE - PACKAGE NAME IS : " + packageName);
        console.log("CODE UPDATE - PACKAGE ID IS : " + packageId);

        let packageComponents = packageId.split('.');
        let mainActivityPath = path.join('platforms', 'android', 'src');
        for (let i in packageComponents) {
            let dir = packageComponents[i];
            mainActivityPath = path.join(mainActivityPath, dir);
        }

        mainActivityPath = path.join(mainActivityPath, 'MainActivity.java');
        overrideActivityPath = path.join(__dirname, '../', 'android', 'MainActivity.java');
        //console.log("OVERRIDE ACTIVITY PATH IS : ", overrideActivityPath);
        //console.log("MAIN ACTIVITY PATH IS : ", mainActivityPath);

        mainActivityData = fs.readFileSync(mainActivityPath, 'utf8');
        //console.log("MAIN ACTIVITY DATA IS : ", mainActivityData);
        if (mainActivityData.indexOf('ATAJO:OVERRIDE:ACTIVITY') == -1) {
            console.log("REPLACING MAIN ACTIVITY FOR CODE UPDATE HOT LOADING");
            mainActivityData = fs.readFileSync(overrideActivityPath, 'utf8');
            fs.writeFileSync(mainActivityPath, mainActivityData)
        }


    },


};