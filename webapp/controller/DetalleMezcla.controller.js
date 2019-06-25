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

            console.log(xmlJson);

            oJSONModel = new JSONModel(xmlJson);
            oView.setModel(oJSONModel, "moddetailjson");

            //calculate composition totals
            controllerInstance._initCompositionModel();
            controllerInstance._populateCompositionModel();

            //generate linked orders tags
            controllerInstance.genLinkedOrdersTags();
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
        },

        /**Linked Orders - Tags */
        genLinkedOrdersTags: function(){
            var oView = this.getView();
            var oModel = oView.getModel("moddetailjson");
            var oData = oModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT/O_DETALLE_ORDEN_MEZCLA/");
            var linkedOrders = oData.ORDENES_PROCESO.item;
            for(var i=0;i<linkedOrders.length;i++){
                this._genTag(linkedOrders[i].NUM_ORDEN_PROCESO["#text"]);
            }
        },
        _genTag: function(tagTxt, tagStatus){
            if(tagStatus === undefined){
                tagStatus="Success";
            }
            var tagBlock = this.byId("linkedOrders");
            var tag = new sap.m.GenericTag({
                text: tagTxt,
                status: tagStatus,
                design: "StatusIconHidden"
            });
            tag.addStyleClass("sapUiSmallMarginBegin");
            //ObjectPageSubSection selected
            if(tagBlock.addBlock){
                tagBlock.addBlock(tag);
            }
            //HBox selected
            else if(tagBlock.addItem){
                tagBlock.addItem(tag);
            }
        },

        /**Composition totals */
        _initCompositionModel: function(){
            var oView = this.getView();
            var oCompositionData = {results: [], test: "__placeholder__"};
            oView.setModel(new JSONModel(oCompositionData), "modcomposition");
        },

        _populateCompositionModel: function(){
            var oView = this.getView();
            var oModel = oView.getModel("modcomposition");
            var aCompData = oModel.getData().results;
            
            aCompData.push(this.calculateComposition("IDEAL"));
            aCompData.push(this.calculateComposition("CARGADO"));

            oModel.refresh();
        },

        calculateComposition: function(type){
            var oView = this.getView();
            var oDataModel = oView.getModel("moddetailjson");
            var aMaterialData = oDataModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT/O_DETALLE_ORDEN_MEZCLA/MATERIALES_ORDEN").item;
            var aMaterialCompData = oDataModel.getProperty("/soap:Envelope/soap:Body/XacuteResponse/Rowset/Row/O_XML_DOCUMENT_2/OT_DETALLE_COMPOSICION").item;
            //var oCompModel = oView.getModel("modcomposition");
            //var aCompTableData = oCompModel.getData().results;
            if(aMaterialData && aMaterialData.length > 0 && aMaterialCompData && aMaterialCompData.length > 0){
                const pesos = [
                    { field: 'ALUMINIO', value: 0 },
                    { field: 'SILICIO', value: 0 },
                    { field: 'HIERRO', value: 0 },
                    { field: 'COBRE', value: 0 },
                    { field: 'MANGANESO', value: 0 },
                    { field: 'MAGNESIO', value: 0 },
                    { field: 'CROMO', value: 0 },
                    { field: 'NIQUEL', value: 0 },
                    { field: 'ZINC', value: 0 },
                    { field: 'PLOMO', value: 0 },
                    { field: 'ESTANO', value: 0 },
                    { field: 'TITANIO', value: 0 },
                    { field: 'ESTRONCIO', value: 0 },
                    { field: 'CALCIO', value: 0 },
                    { field: 'FOSFORO', value: 0 },
                ];
            
                // Calculo de peso real de cada material
                let totalPesoRealIdeal = 0;
                let totalPesoRealCargado = 0;
                let totalPesoRendimiento = 0;

                //Peso real
                for(var i=0;i<aMaterialData.length;i++){
                    if(type === "IDEAL"){
                        aMaterialData[i]["PESO_REAL_IDEAL"] = parseInt(aMaterialData[i]["PESO_IDEAL"]["#text"],10) * parseInt(aMaterialCompData[i]["RENDIMIENTO"]["#text"],10) / 100;
                        totalPesoRealIdeal += aMaterialData[i]["PESO_REAL_IDEAL"];
                        totalPesoRendimiento += parseInt(aMaterialData[i]["PESO_IDEAL"]["#text"],10) * parseInt(aMaterialCompData[i]["RENDIMIENTO"]["#text"],10) / 100;
                    }else if(type==="CARGADO"){
                        aMaterialData[i]["PESO_REAL_CARGADO"] = parseInt(aMaterialData[i]["PESO_CARGADO"]["#text"],10) * parseInt(aMaterialCompData[i]["RENDIMIENTO"]["#text"],10) / 100;
                        totalPesoRealCargado += aMaterialData[i]["PESO_REAL_CARGADO"];
                        totalPesoRendimiento += parseInt(aMaterialData[i]["PESO_CARGADO"]["#text"],10) * parseInt(aMaterialCompData[i]["RENDIMIENTO"]["#text"],10) / 100;
                    }
                }

                //Porcentaje real
                for(var i=0;i<aMaterialData.length;i++){
                    if(type === "IDEAL"){
                        if (totalPesoRealIdeal > 0) {
                            aMaterialData[i]['PORCENTAJE_REAL_IDEAL'] = aMaterialData[i]['PESO_REAL_IDEAL'] / totalPesoRealIdeal * 100;
                        } else {
                            aMaterialData[i]['PORCENTAJE_REAL_IDEAL'] = 0;
                        }
                    }else if(type==="CARGADO"){
                        if (totalPesoRealCargado > 0) {
                            aMaterialData[i]['PORCENTAJE_REAL_CARGADO'] = aMaterialData[i]['PESO_REAL_CARGADO'] / totalPesoRealCargado * 100;
                        } else {
                            aMaterialData[i]['PORCENTAJE_REAL_CARGADO'] = 0;
                        }
                    }
                }

                //pesos componentes
                for(var i=0;i<aMaterialData.length;i++){
                    pesos.forEach(element => {
                        if (type == 'IDEAL') {
                            element.value += aMaterialData[i]['PORCENTAJE_REAL_IDEAL'] * parseFloat(aMaterialCompData[i][element.field]["#text"])  / 100;
                        } else if (type == 'CARGADO') {
                            element.value += aMaterialData[i]['PORCENTAJE_REAL_CARGADO'] * parseFloat(aMaterialCompData[i][element.field]["#text"])  / 100;
                        }
                    });
                }

                return {
                    CAMPO: type == 'IDEAL' ? 'IDEAL' : 'CARGADO',
                    TOTAL: totalPesoRendimiento,
                    ALUMINIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'ALUMINIO')[0].value).toFixed(2) : null,
                    SILICIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'SILICIO')[0].value).toFixed(2) : null,
                    HIERRO: pesos.length > 0 ? (pesos.filter(p => p.field == 'HIERRO')[0].value).toFixed(2) : null,
                    COBRE: pesos.length > 0 ? (pesos.filter(p => p.field == 'COBRE')[0].value).toFixed(2) : null,
                    MANGANESO: pesos.length > 0 ? (pesos.filter(p => p.field == 'MANGANESO')[0].value).toFixed(2) : null,
                    MAGNESIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'MAGNESIO')[0].value).toFixed(2) : null,
                    CROMO: pesos.length > 0 ? (pesos.filter(p => p.field == 'CROMO')[0].value).toFixed(2) : null,
                    NIQUEL: pesos.length > 0 ? (pesos.filter(p => p.field == 'NIQUEL')[0].value).toFixed(2) : null,
                    ZINC: pesos.length > 0 ? (pesos.filter(p => p.field == 'ZINC')[0].value).toFixed(2) : null,
                    PLOMO: pesos.length > 0 ? (pesos.filter(p => p.field == 'PLOMO')[0].value).toFixed(2) : null,
                    ESTANO: pesos.length > 0 ? (pesos.filter(p => p.field == 'ESTANO')[0].value).toFixed(2) : null,
                    TITANIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'TITANIO')[0].value).toFixed(2) : null,
                    ESTRONCIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'ESTRONCIO')[0].value).toFixed(2) : null,
                    CALCIO: pesos.length > 0 ? (pesos.filter(p => p.field == 'CALCIO')[0].value).toFixed(2) : null,
                    FOSFORO: pesos.length > 0 ? (pesos.filter(p => p.field == 'FOSFORO')[0].value).toFixed(2) : null,
                };
            }else{
                return {};
            }
        },
        

        
	});
});