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

            this.onRetrieveDetalleOrdenMezcla(mixId);
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
        onRetrieveDetalleOrdenMezcla: function(ordenMezclaId){
            var that = this;
            var params = Util.getDetalleOrdenMezParams({ordenMezcla: ordenMezclaId});
            var settings = {
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_detalle_orden_mez",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedDetailData
            }
            Util.sendSOAPRequest(settings, that);  
        },
        bindRetrievedDetailData: function (data, textStatus, jqXHR, controllerInstance){
            var oView = controllerInstance.getView();
    
            var oJSONModel;
            var oXML = Util.unescapeXML(data)
            var xmlJson = Util.xmlToJson(oXML);
            oJSONModel = new JSONModel(xmlJson);
            oView.setModel(oJSONModel, "moddetailjson");
        },
        
	});
});