sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/unified/Calendar",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/viz/ui5/format/ChartFormatter",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
], function(Controller, JSONModel, Filter, FilterOperator, Calendar, MessageBox, History, ChartFormatter, Util, Formatter) {
	"use strict";

	return Controller.extend("simple-app.controller.GraphMaster", {

        formatter: Formatter,

        formatPatter: ChartFormatter.DefaultPattern,
        
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

        onRetrieveGraphData: function(oEvent){
            //this.retrieveGraphData();
            this.testGeneralData();
        },

        testGeneralData: function(params){
            var that = this;
            if(params === undefined){
                params = Util.getMasterGraphParams();
                //params = Util.getDetailGraphParams({id_grafica: "41"});
            }
            var settings = {
                
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Pantallas/TX_LISTADO_PAGINAS",
                //url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Pantallas/Graficas/TX_GET_GRAFICA",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData,
                //completeCallback: function(){},
                //errorCallback: function(){}
            }
            Util.sendSOAPRequest(settings, that);
        },

        retrieveGraphData: function(params){
            var that = this;
            if(params === undefined){
                //params = Util.getMasterGraphParams();
                params = Util.getDetailGraphParams({id_grafica: "41"});
            }
            var settings = {
                //url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_LISTADO_PAGINAS",
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Pantallas/Graficas/TX_GET_GRAFICA",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData,
                completeCallback: function(){},
                errorCallback: function(){}
            }
            //that._setGeneralTableBusy();
            Util.sendSOAPRequest(settings, that);  
        },

        /**Used as ajax success callback for general list. Order of the parameters matter */
        bindRetrievedData: function (controllerInstance, data, textStatus, jqXHR){
            var oView = controllerInstance.getView();
            
            var oDataXML = Util.unescapeXML(data)
            var oDataJSON = Util.xmlToJson(oDataXML);
            //Remove unneeded path prefix
            oDataJSON = oDataJSON["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_GRAFICAS.GRUPOS; //Master
            //oDataJSON = oDataJSON["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_GRAFICA.GRAFICA; //Detail
            //oDataJSON = controllerInstance._turn2RealDates(oDataJSON);
            //PUNTOS: GRAFICA.TITULOS.TITULO[0].VARIABLES.VARIABLE[0].PUNTOS
            var oJSONModel = new JSONModel(oDataJSON);

            oView.setModel(oJSONModel, "modmastergraph");

            //Config tooltip
            var oVizFrame = controllerInstance.getView().byId("vizFrame2");
            var oTooltip = new sap.viz.ui5.controls.VizTooltip({});
            oTooltip.connect(oVizFrame.getVizUid());
            oTooltip.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);

            //Dinamically generate graphs

            var oSettings = {
                dimensions : [
                    {axis: 1, name: "Date", value: "{FECHA_TAG/#text}"},
                    
                ],
                measures : [
                    {group: 1, name : "Production", value : "{VALOR/#text}"},
                    {group: 1, name : "Second", value : "123"},
                    
                ],
                data : {
                    path : "modmastergraph>/GRUPO/0/GRAFICAS/GRAFICA/0/PUNTOS/punto/",
                }
              };

            var oDataset = new sap.viz.core.FlattenedDataset(oSettings);

            var oChart1 = new sap.viz.ui5.Line(
                //"idChar1", 
                {
                    width : "80%",
                    height : "400px",
                    title: {
                        visible : true,
                        text : "JS Generated"
                    },                
                    plotArea:{                                        
                        marker: {
                            visible:false                    		
                        }                                        
                    },
                    dataset: oDataset               
                }
            );

            var container = controllerInstance.byId("GraphContainer");
            container.addContent(oChart1);

            controllerInstance._mergeGraphData();
        },

        _turn2RealDates: function(oData){
            var aPoints = oData.TITULOS.TITULO.VARIABLES.VARIABLE.PUNTOS.puntos;
            for(var pt of aPoints){
                pt.VALOR = parseFloat(pt.VALOR["#text"]);
                pt.FECHA_TAG = new Date(pt.FECHA_TAG["#text"]);
            }
            return oData;
        },

        _mergeGraphData: function(){
            var oView = this.getView();
            var oOriginalModel = oView.getModel("modmastergraph");
            var oOriginalData = oOriginalModel.getData();

            var oCopiedData = JSON.parse( JSON.stringify(oOriginalData) );

            var oNewData = {};
            var aGraphTraces = [];
            //Iterador sobre grupos - cada grupo contiene varias graficas
            for(var gr_ix=0;gr_ix<oCopiedData.GRUPO.length;gr_ix++){

                let trace_arr = oCopiedData.GRUPO[gr_ix].GRAFICAS.GRAFICA
                if(trace_arr != null && !Array.isArray(trace_arr)){
                    //CAUTION MAI FREN
                    trace_arr = [trace_arr];
                }
                //Iterador sobre gráficas - cada gráfica contiene uno o varios grupos de puntos (trazas)
                for(var tr_ix=0;tr_ix<trace_arr.length;tr_ix++){
                    let points_arr = trace_arr[tr_ix].PUNTOS.punto;
                    if(points_arr != null && !Array.isArray(points_arr)){
                        //CAUTION MAI FREN
                        points_arr = [points_arr];
                    }
                    //Iterador sobre puntos
                    for(var pt_ix=0;pt_ix<points_arr.length;pt_ix++){

                    }
                }

            }



        },
	});
});