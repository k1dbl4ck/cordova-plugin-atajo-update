var fs = require("fs");
var path = require("path");
var utilities = require("./utilities");

module.exports = {

    replaceViewController: function(context) {

        const packageName = utilities.getAppName(context);
        const packageId = utilities.getAppId(context);

        console.log("IOS CODE UPDATE - PACKAGE NAME IS : " + packageName);
        console.log("IOS CODE UPDATE - PACKAGE ID IS : " + packageId);

        let packageComponents = packageId.split('.');
        let viewControllerPath = path.join('platforms', 'ios', 'CordovaLib', 'Classes', 'Public');
        let viewControllerFile = path.join(viewControllerPath, 'CDVCommandDelegateImpl.m');

        let overrideViewControllerPath = path.join(__dirname, '../', 'ios', 'CDVCommandDelegateImpl.m');
       
        let currentViewControllerData = fs.readFileSync(viewControllerFile, 'utf8');
        //console.log("MAIN ACTIVITY DATA IS : ", mainActivityData);
        if (currentViewControllerData.indexOf('ATAJO:OVERRIDE:CONTROLLER') == -1) {
            console.log("REPLACING VIEW CONTROLLER FOR CODE UPDATE HOT LOADING");
            let newViewControllerData = fs.readFileSync(overrideViewControllerPath, 'utf8');
            fs.writeFileSync(viewControllerFile, newViewControllerData)
        }


    },


};