sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/xml/XMLModel",
    "sap/ui/model/json/JSONModel",
    "simple-app/utils/util",
    "simple-app/utils/formatter"
], function(Controller, XMLModel, JSONModel, Util, Formatter) {
	"use strict";

	return Controller.extend("simple-app.controller.ListaMezclas", {

        formatter: Formatter,
        
        onInit: function(){
            console.log("on init!!!!");
            //initial config
            var oConfig = {
                // currentMainSize: "35em",
                // bigMainSize: "35em",
                // smallMainSize: "25em",
                currentMainSize: "90%",
                bigMainSize: "90%",
                smallMainSize: "50%",
                detailsVisible: false,
                detailSize: "40%"
            }
            var oConfigModel = new JSONModel(oConfig);
            this.getView().setModel(oConfigModel, "listConfig");
            this.onRetrieveListaOrdenMezcla();
            Util.init_i18n(this);
            //this.getView().setModel(this.getOwnerComponent().getModel("i18n"), "i18n");
        },

        //hide detail tables and enlarge main table
        _renderNoDetailInView: function(){
            var oConfigModel = this.getView().getModel("listConfig");
            var mainSize = oConfigModel.getProperty("/bigMainSize");
            oConfigModel.setProperty("/currentMainSize", mainSize);
            oConfigModel.setProperty("/detailsVisible", false);
        },

        //make detail tables visible and shrink main table
        _renderDetailInView: function(){
            var oConfigModel = this.getView().getModel("listConfig");
            var mainSize = oConfigModel.getProperty("/smallMainSize");
            oConfigModel.setProperty("/currentMainSize", mainSize);
            oConfigModel.setProperty("/detailsVisible", true);
        },

        onDebugButton: function(){
            var cajaScroll = this.getView().byId("cajaScroll");
            var height = "10em";
            cajaScroll.setHeight(height);
        },

        //If we use this as a handler of the selectionChange event fired by the table instead
        //of the press event fired by a column list item, oEvent.getSource() retrieves the table
        //instead of the table row.
        onListItemPress: function(oEvent){
            console.log("PRESSED!");
            var listItem, oSelectedObject;
            //List item
            if(oEvent.getId() === "press"){
                listItem = oEvent.getSource();
                oSelectedObject = oEvent.getSource().getBindingContext("modjson").getObject();
            }
            //Table
            else if(oEvent.getId() === "selectionChange"){
                listItem = oEvent.getSource().getSelectedItem();
                oSelectedObject = listItem.getBindingContext("modjson").getObject();
            }
            console.log(oSelectedObject);
                
            this.bindToDetailMaterial(oSelectedObject.MATERIALES_ORDEN);
            this.bindToDetailProcessOrder(oSelectedObject.ORDENES_PROCESO);
            this._renderDetailInView();
            //does not work because _renderDetailInView causes a rerender of the tables
            //and the custom class added to it is lost
            //this._colorTableRow(listItem);
            //To set the color, a different mode has been given to the Table in the view instead
        },

        _colorTableRow: function(oTableRow){
            var oTable = oTableRow.getParent();
            for(var i=0; i<oTable.getItems().length; i++){
                oTable.getItems()[i].$().removeClass("markrow");
            }
            oTableRow.$().addClass("markrow");
        },

        //Fetch material info from retrieved data and assign it to a local model
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

        //Fetch process orders info from retrieved data and assign it to a local model
        bindToDetailProcessOrder: function(oOrderData){
            if(oOrderData){
                //If it is a single object instead of an array of them...
                if(typeof oOrderData.item === 'object' && oOrderData.item !== null){
                    if(!Array.isArray(oOrderData.item)){
                        oOrderData.item = [oOrderData.item];
                    }
                }
                var oProcessOrderModel = new JSONModel(oOrderData);
                this.getView().setModel(oProcessOrderModel, "modordenesproceso");
            }
        },

        onRetrieveListaOrdenMezcla: function(){
            var that = this;
            var params = Util.getListaOrdenMezParams();
            var settings = {
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_lista_orden_mez",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData
            }
            Util.sendSOAPRequest(settings, that);  
        },

        PREVIOUSonRetrieveListaOrdenMezcla: function(oEvent){
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

        bindRetrievedData: function (data, textStatus, jqXHR, controllerInstance){
            var oView = controllerInstance.getView();
            var oXMLModel = new XMLModel();
            var oJSONModel;
            var oXML = Util.unescapeXML(data)
            var xmlJson = Util.xmlToJson(oXML);
            oXMLModel.setData(oXML);
            oJSONModel = new JSONModel(xmlJson);

            oView.setModel(oXMLModel,"modxml");
            oView.setModel(oJSONModel, "modjson");
        },

        onDetailListClose: function(oEvent){
            this._renderNoDetailInView();
        },

        onNavToDetail: function(oEvent){
            console.log("NAV!");
            var oSelectedObject = oEvent.getSource().getBindingContext("modjson").getObject();
            console.log(oSelectedObject);
            var mixId = String(parseInt(oSelectedObject.ORDENCARGA['#text'], 10));

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("mixDetail", {mixId: mixId});
        }
        
	});
});