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
                //listItem = oEvent.getSource().getSelectedItem();
                listItem = oEvent.getParameter("listItem");
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
                successCallback: that.bindRetrievedData,
                completeCallback: that._unsetGeneralTableBusy
            }
            that._setGeneralTableBusy();
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

        /**Used as ajax success callback. Order of the parameters matter */
        bindRetrievedData: function (controllerInstance, data, textStatus, jqXHR){
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
        },

        /**
         * Busy Indicators
         */
        _setGeneralTableBusy(controllerInstance){
            if(!controllerInstance){
                controllerInstance = this;
            }
            Util.setControlBusyness(controllerInstance, "generalTable", true);
        },
        _unsetGeneralTableBusy(controllerInstance){
            if(!controllerInstance){
                controllerInstance = this;
            }
            Util.setControlBusyness(controllerInstance, "generalTable", false);
        },

        /**
         * Simple Filter (Search)
         */
		onFilterGeneralMixTable : function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            // build filter array
            var aFilter = [
                new sap.ui.model.Filter("ORDENCARGA/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("PESO_IDEAL/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("PESO_CARGADO/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("UNIDAD/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("FECHA/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("ACTIVA/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("ZRECURSO/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("SILO/#text", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("ORDENES_PROCESO/item/0/DESC_MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery)
            ];

            //ORDENES_PROCESO
            var oModel = this.getView().getModel("modjson");
            var oData = oModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT/OT_ORDENES_MEZCLA/item/");
            if(oData != null && !Array.isArray(oData)){
                oData = [oData];
            }

            var maxLenOrdenesProceso = 0;
            for(var i=0;i<oData.length;i++){
                if(oData[i].ORDENES_PROCESO.item && oData[i].ORDENES_PROCESO.item.length){
                    if(oData[i].ORDENES_PROCESO.item.length > maxLenOrdenesProceso){
                        maxLenOrdenesProceso = oData[i].ORDENES_PROCESO.item.length;
                    }
                }
            }

            for(var i=0;i<maxLenOrdenesProceso;i++){
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/CANTIDAD/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/CANT_ENTREGADA/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/DESC_MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/ESTADO/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/FECHA_PROG_FIN/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/FECHA_PROG_INI/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/FECHA_REAL_FIN/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/FECHA_REAL_INI/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/HORA_PROG_FIN/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/HORA_PROG_INI/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/HORA_REAL_FIN/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/HORA_REAL_INI/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/NUM_ORDEN_PROCESO/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/PRIORIDAD/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("ORDENES_PROCESO/item/"+i+"/UNIDAD/#text", sap.ui.model.FilterOperator.Contains, sQuery));
            }

            //MATERIALES_ORDEN
            var maxLenMaterialesOrden = 0;
            for(var i=0;i<oData.length;i++){
                if(oData[i].MATERIALES_ORDEN.item && oData[i].MATERIALES_ORDEN.item.length){
                    if(oData[i].MATERIALES_ORDEN.item.length > maxLenMaterialesOrden){
                        maxLenMaterialesOrden = oData[i].MATERIALES_ORDEN.item.length;
                    }
                }
            }

            for(var i=0;i<maxLenMaterialesOrden;i++){
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/DESC_MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/DESC_MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/LOTE/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/MATERIAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/PESO_CARGADO/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/PESO_IDEAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/PORCENTAJE/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/PORCENTAJE_IDEAL/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/STOCK_LIBRE/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/UM_STOCK_LIBRE/#text", sap.ui.model.FilterOperator.Contains, sQuery));
                aFilter.push(new sap.ui.model.Filter("MATERIALES_ORDEN/item/"+i+"/UNIDAD/#text", sap.ui.model.FilterOperator.Contains, sQuery));
            }

			var theFilter = [];
			
			if (sQuery) {
                theFilter.push(new sap.ui.model.Filter({
                    filters: aFilter,
                    and: false
                }));
			}

			// filter binding
			var oTable = this.byId("generalTable");
			var oBinding = oTable.getBinding("items");
            oBinding.filter(theFilter);
            
            //Emulate click of first item
            /* var firstElem = oEvent.getSource().getParent().getParent().getItems()[0];
            if(firstElem){
                oTable.fireSelectionChange({listItem: firstElem});
            } */
        },
        
        /**
         * Advanced Filtering
         */
        
        _genAllMaterialModel(){
            var oView = this.getView();
            var oGenModel = oView.getModel("modjson");
            var matData = {results: []};
            var oGenData = oGenModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT/OT_ORDENES_MEZCLA/item/");
            if(oGenData != null && !Array.isArray(oGenData)){
                oGenData = [oGenData];
            }

            for(var i=0;i<oGenData.length;i++){
                var currentMixOrder = oGenData[i];
                if(currentMixOrder.MATERIALES_ORDEN.item){
                    for(var j=0;j<currentMixOrder.MATERIALES_ORDEN.item.length;j++){
                        var insertData = currentMixOrder.MATERIALES_ORDEN.item[j];
                        insertData.ORDEN_PADRE = currentMixOrder.ORDENCARGA;
                        matData.results.push(insertData);
                    }
                }
            }

            var matModel = new JSONModel(matData);
            oView.setModel(matModel, "modtodosmateriales");
        },

        _genAllProcessModel(){
            var oView = this.getView();
            var oGenModel = oView.getModel("modjson");
            var procData = {results: []};
            var oGenData = oGenModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT/OT_ORDENES_MEZCLA/item/");
            if(oGenData != null && !Array.isArray(oGenData)){
                oGenData = [oGenData];
            }

            for(var i=0;i<oGenData.length;i++){
                var currentMixOrder = oGenData[i];
                if(currentMixOrder.ORDENES_PROCESO.item){
                    for(var j=0;j<currentMixOrder.ORDENES_PROCESO.item.length;j++){
                        var insertData = currentMixOrder.ORDENES_PROCESO.item[j];
                        insertData.ORDEN_PADRE = currentMixOrder.ORDENCARGA;
                        procData.results.push(insertData);
                    }
                }
            }

            var procModel = new JSONModel(procData);
            oView.setModel(procModel, "modtodosprocesos");
        },

        retrieve_mc_materiales: function(){
            var that = this;
            var params = Util.getListaOrdenMezParams();
            var settings = {
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Global/MatchCodes/TX_mc_materiales",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedMaterials,   
            }
            Util.sendSOAPRequest(settings, that);
        },

        bindRetrievedMaterials: function(controllerInstance, data){
            var oView = controllerInstance.getView();
    
            var oJSONModel;
            var oXML = Util.unescapeXML(data)
            var xmlJson = Util.xmlToJson(oXML);
            oJSONModel = new JSONModel(xmlJson);

            oView.setModel(oJSONModel, "modmcmateriaes");
        },

        onDebugBtn: function(){
            this._genAllMaterialModel();
            this._genAllProcessModel();
            this.retrieve_mc_materiales();
        }
	});
});