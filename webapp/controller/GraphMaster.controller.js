sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/unified/Calendar",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
], function(Controller, JSONModel, Filter, FilterOperator, Calendar, MessageBox, History, Util, Formatter) {
	"use strict";

	return Controller.extend("simple-app.controller.GraphMaster", {

        formatter: Formatter,
        
        onInit: function(){
            console.log("onInit graph");
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

        retrieveGraphData: function(params){
            var that = this;
            if(params === undefined){
                params = Util.getMasterGraphParams();
            }
            var settings = {
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_LISTADO_PAGINAS",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData
                //completeCallback: that._unsetGeneralTableBusy //Busyness is unset inside bindRetrieveData
            }
            that._setGeneralTableBusy();
            Util.sendSOAPRequest(settings, that);  
        },

        /**Used as ajax success callback for general list. Order of the parameters matter */
        bindRetrievedData: function (controllerInstance, data, textStatus, jqXHR){
            var oView = controllerInstance.getView();
            
            var oDataXML = Util.unescapeXML(data)
            var oDataJSON = Util.xmlToJson(oDataXML);
            controllerInstance._fixGeneralData(oDataJSON);
            var oJSONModel = new JSONModel(oDataJSON);

            //oView.setModel(oJSONModel, "modmultigraph");
        },
	});
});