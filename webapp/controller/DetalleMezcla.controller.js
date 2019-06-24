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
                successCallback: that.bindRetrievedDetailData,
                completeCallback: that._unsetDetailTableBusy
            }
            that._setDetailTableBusy()
            Util.sendSOAPRequest(settings, that);  
        },
        bindRetrievedDetailData: function (controllerInstance, data, textStatus, jqXHR){
            var oView = controllerInstance.getView();
    
            var oJSONModel;
            var oXML = Util.unescapeXML(data)
            var xmlJson = Util.xmlToJson(oXML);

            controllerInstance._fixDetailData(xmlJson);

            oJSONModel = new JSONModel(xmlJson);
            oView.setModel(oJSONModel, "moddetailjson");
        },

        //If only a single line of data is retrieved, the item aggregation in the responds contains
        //a single object instead of an array of objects. This causes the binding to fail and the 
        //view is not displayed properly. To fix this scenario, enter the content of the item aggregation
        //inside an array if it is not already one.
        _fixDetailData: function(oData){
            //If at the end we append ".item", we dont get a reference to it
            var content2Fix = [
                oData["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_XML_DOCUMENT.O_DETALLE_ORDEN_MEZCLA.MATERIALES_ORDEN,
                oData["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_XML_DOCUMENT_2.OT_DETALLE_COMPOSICION,
                oData["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_XML_DOCUMENT.O_DETALLE_ORDEN_MEZCLA.ORDENES_PROCESO
            ];
            for(var i=0;i<content2Fix.length;i++){
                if(content2Fix[i].item && !Array.isArray(content2Fix[i].item)){
                    content2Fix[i].item=[content2Fix[i].item];
                }
            }
        },

        /**
         * BUSY
         */

        _setDetailTableBusyness: function(busy, controllerInstance){            
            var tablesIds = ["mixDetailLeft", "mixDetailRightPart1", "mixDetailRightPart2"];
            for(var i = 0; i<tablesIds.length;i++){
                Util.setControlBusyness(controllerInstance, tablesIds[i], busy)
            }
        },

        _setDetailTableBusy: function(controllerInstance){
            if(!controllerInstance){
                controllerInstance = this;
            }
            controllerInstance._setDetailTableBusyness(true, controllerInstance);
        },

        _unsetDetailTableBusy: function(controllerInstance){
            if(!controllerInstance){
                controllerInstance = this;
            }
            controllerInstance._setDetailTableBusyness(false, controllerInstance);
        }

        
        
	});
});