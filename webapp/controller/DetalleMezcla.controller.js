sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/xml/XMLModel",
    "sap/ui/model/json/JSONModel",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
    "sap/ui/core/routing/History"
], function(Controller, XMLModel, JSONModel, Util, Formatter, History) {
	"use strict";

	return Controller.extend("simple-app.controller.DetalleMezcla", {

        formatter: Formatter,
        
        onInit: function(){
            console.log("on init DETALLE!!!!");
            //initial config
            var oConfig = {
                // currentMainSize: "35em",
                // bigMainSize: "35em",
                // smallMainSize: "25em",
                currentMainSize: "90%",
                bigMainSize: "90%",
                smallMainSize: "50%",
                detailsVisible: false,
            }
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("mixDetail").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {
            var mixId = oEvent.getParameter("arguments").mixId;
            console.log("mix id:"  + mixId);
		},
        onNavBack: function(){
            var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("mixList", {}, true);
			}
        },
        
	});
});