sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/xml/XMLModel",
    "sap/ui/model/json/JSONModel",
    "simple-app/utils/util",
    "simple-app/utils/formatter"
], function(Controller, XMLModel, JSONModel, Util, Formatter) {
	"use strict";

	return Controller.extend("simple-app.controller.View1", {

        formatter: Formatter,
        
        onInit: function(){
            console.log("on init!!!!");
        },

        onDebugButton: function(){
            var cajaScroll = this.getView().byId("cajaScroll");
            var height = "10em";
            cajaScroll.setHeight(height);
        },

        onListItemPress: function(oEvent){
            console.log("PRESSED!");
            var oSelectedObject = oEvent.getSource().getBindingContext("modjson").getObject();
            console.log(oSelectedObject);
            this.bindToDetailMaterial(oSelectedObject.MATERIALES_ORDEN);
        },

        bindToDetailMaterial: function(oMaterialData){
            if(oMaterialData){
                //If it is a single object instead of an array of them...
                if(typeof oMaterialData.item === 'object' && oMaterialData.item !== null){
                    if(!Array.isArray(oMaterialData.item)){
                        oMaterialData.item = [oMaterialData.item];
                    }
                }
                var oMaterialModel = new JSONModel(oMaterialData);
                this.getView().setModel(oMaterialModel, "modmateriales");
            }
        },

        onRetrieveListaOrdenMezcla: function(oEvent){
            var that = this;
            var url = "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_lista_orden_mez";

            var sReq = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\
            <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"  xmlns:s0=\"http://www.sap.com/xMII\">\
            <soap:Body><s0:XacuteRequest>\
            <s0:InputParams xmlns:s0=\"http://www.sap.com/xMII\" xmlns=\"http://www.sap.com/xMII\">\
            <s0:I_CENTRO>0901</s0:I_CENTRO>\
            <s0:I_USER>PDOMINGUEZ</s0:I_USER>\
            <s0:I_IDIOMA>S</s0:I_IDIOMA>\
            </s0:InputParams></s0:XacuteRequest></soap:Body></soap:Envelope>";

            $.ajax({
                //beforeSend: function(xhr){xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));},
                url: url,
                method: "POST",
                dataType: "xml",
                contentType: "text/xml; charset=\"utf-8\"",
                data: sReq,
                success: function(data, textStatus, jqXHR){that.bindRetrievedData(data, textStatus, jqXHR)},

                error: function(oError){
                    console.log(oError);
                }

            });
        },

        bindRetrievedData: function (data, textStatus, jqXHR){
            var oView = this.getView();
            var oXMLModel = new XMLModel();
            var oJSONModel;
            var oXML = Util.unescapeXML(data)
            var xmlJson = Util.xmlToJson(oXML);
            oXMLModel.setData(oXML);
            oJSONModel = new JSONModel(xmlJson);

            oView.setModel(oXMLModel,"modxml");
            oView.setModel(oJSONModel, "modjson");
        },

        
	});
});