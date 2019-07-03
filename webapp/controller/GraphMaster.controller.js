sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/data/FlattenedDataset",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
], function(Controller, JSONModel, MessageBox, History, ChartFormatter, FlattenedDataset, Util, Formatter) {
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

            controllerInstance._genModifiedGraphData();
            controllerInstance.genVizChartsFromGraphData("FECHA_TAG", "VALOR");
            
        },

        _turn2RealDates: function(oData){
            var aPoints = oData.TITULOS.TITULO.VARIABLES.VARIABLE.PUNTOS.puntos;
            for(var pt of aPoints){
                pt.VALOR = parseFloat(pt.VALOR["#text"]);
                pt.FECHA_TAG = new Date(pt.FECHA_TAG["#text"]);
            }
            return oData;
        },

        /**
         * Receive the x and y labels the original graph data has for its points.
         * 
         * Modifies the original graph data to store data in a different way so that it can
         * be integrated with viz charts. Stores data of the different traces in the same place. They
         * are  differentiated by its label.
         */
        _genModifiedGraphData: function(xLabel, yLabel){
            if(xLabel === undefined){
                xLabel = "FECHA_TAG";
            }
            if(yLabel === undefined){
                yLabel = "VALOR";
            }
            var oView = this.getView();
            var oOriginalModel = oView.getModel("modmastergraph");
            var oOriginalData = oOriginalModel.getData();

            var oCopiedData = JSON.parse( JSON.stringify(oOriginalData) );

            var oNewData = {GRAPHS: []};
            var newGrp;
            //Iterador sobre grupos - cada grupo contiene varias graficas
            for(var gr_ix=0;gr_ix<oCopiedData.GRUPO.length;gr_ix++){
                var currentGrp = oCopiedData.GRUPO[gr_ix];
                newGrp = {};
                newGrp.ID = currentGrp.ID["#text"];
                newGrp.NOMBRE = currentGrp.NOMBRE["#text"];
                //Dict - key: label, value: label_descr
                newGrp.DESCRIPCIONES = {};
                //Contains a list of all the labels used in the traces (labels of y axis)
                newGrp.ETIQUETAS = [];
                //Unidades de las trazas
                newGrp.UNIDADES = [];
                //stores all points
                newGrp.TRAZAS = [];

                //force array
                let trace_arr = currentGrp.GRAFICAS.GRAFICA
                if(trace_arr != null && !Array.isArray(trace_arr)){
                    //CAUTION MAI FREN
                    trace_arr = [trace_arr];
                }
                //Iterador sobre gráficas - cada gráfica contiene uno o varios grupos de puntos (trazas)
                for(var tr_ix=0;trace_arr!==undefined && tr_ix<trace_arr.length;tr_ix++){
                    var currentGraph = trace_arr[tr_ix];
                    //store description for the label
                    newGrp.DESCRIPCIONES[currentGraph.NOMBRE["#text"]] = currentGraph.CARACTERISTICA["#text"];
                    newGrp.UNIDADES.push(currentGraph.UNIDAD["#text"]);
                    var currentYLabel = currentGraph.NOMBRE["#text"];
                    newGrp.ETIQUETAS.push(currentYLabel);

                    //force array
                    let points_arr = trace_arr[tr_ix].PUNTOS.punto;
                    if(points_arr != null && !Array.isArray(points_arr)){
                        //CAUTION MAI FREN
                        points_arr = [points_arr];
                    }
                    //Iterador sobre puntos
                    for(var pt_ix=0;points_arr!==undefined && pt_ix<points_arr.length;pt_ix++){
                        var currentPnt = points_arr[pt_ix];
                        if(newGrp.TRAZAS[pt_ix] === undefined){
                            newGrp.TRAZAS[pt_ix] = {};
                            //newGrp.TRAZAS[pt_ix]["ETIQUETA_EJEX"] = currentPnt[xLabel];
                            newGrp.TRAZAS[pt_ix][xLabel] = currentPnt[xLabel]["#text"];
                        }
                        newGrp.TRAZAS[pt_ix][currentYLabel] = parseFloat(currentPnt[yLabel]["#text"]).toFixed(3) || currentPnt[yLabel]["#text"];
                        
                    }
                }
                oNewData.GRAPHS.push(newGrp);
            }
            oView.setModel(new JSONModel(oNewData), "modmodifiedmastergraph");
        },

        /**From the modified data of the graphs, generate needed data to create them and
         * call the function that draws them.
         */
        genVizChartsFromGraphData: function(xLabel, yLabel, container){
            container = container || "GraphContainer";
            xLabel = xLabel || "FECHA_TAG";
            yLabel = yLabel || "VALOR";
            var oView = this.getView();
            var oModel = oView.getModel("modmodifiedmastergraph");
            var oData = oModel.getData();

            for(var gr_ix=0;gr_ix<oData.GRAPHS.length;gr_ix++){
                var currentGraph = oData.GRAPHS[gr_ix];
                var aEtiquetas = currentGraph.ETIQUETAS;
                var aDimensions = [];
                var aMeasures = [];

                aDimensions.push({axis: 1, name: xLabel, value: "{"+xLabel+"}"});
                for(var label of aEtiquetas){
                    aMeasures.push({group: 1, name: label, value:"{"+label+"}"});
                }
                var sDataPath = "modmodifiedmastergraph>/GRAPHS/"+gr_ix+"/TRAZAS/";

                this._generateVizChart(container, aDimensions, aMeasures, sDataPath);
            }
        },

        /**Creates a Viz Chart using the data received*/
        _generateVizChart: function(containerId, aDimensions, aMeasures, sDataPath){
            var oSettings;
            //Dinamically generate graphs
            oSettings = {
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

            oSettings = {
                dimensions : aDimensions,
                measures : aMeasures,
                data : {
                    path : sDataPath,
                }
            };

            var oDataset = new FlattenedDataset(oSettings);

            //var oChart = new sap.viz.ui5.Line(
            var oChart = new sap.viz.ui5.Area(
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

            var vbox = new sap.m.VBox();
            vbox.addItem(oChart);    
            vbox.addItem(new sap.m.Button({text: "DETALLE"}));   
            var container = this.byId(containerId);
            if(container){
                container.addContent(vbox);
            }
        },

        _addTooltip2VizFrame: function(oVizFrame){
            //Config tooltip
            var oVizFrame = controllerInstance.getView().byId("vizFrame2");
            var oTooltip = new sap.viz.ui5.controls.VizTooltip({});
            oTooltip.connect(oVizFrame.getVizUid());
            //oTooltip.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
        },

	});
});