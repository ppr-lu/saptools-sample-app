sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
], function(Controller, JSONModel, MessageBox, History, VizFrame, FeedItem, ChartFormatter, FlattenedDataset, Filter, FilterOperator, Util, Formatter) {
	"use strict";

	return Controller.extend("simple-app.controller.GraphMaster", {

        formatter: Formatter,

        formatPatter: ChartFormatter.DefaultPattern,
        
        onInit: function(){
            console.log("onInit graphDetail");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("graphDetail").attachPatternMatched(this._onObjectMatched, this);
            
            this._initSliderModel();
            this._configureChartSlider();

        },

        _onObjectMatched: function (oEvent) {
            var graphId = oEvent.getParameter("arguments").graphId;
            console.log("graph id:"  + graphId);

            // this.retrieveGraphData(graphId);    //Retrieve data from server
            this._genGraphData();               //Generate data locally
		},
        
        onNavBack: function(){
            var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("graphMaster", {}, true);
			}
        },

        onRetrieveGraphData: function(oEvent){
            this.retrieveGraphData(graphId);
        },

        retrieveGraphData: function(graphId){
            var that = this;
            var params = Util.getDetailGraphParams({id_grafica: graphId});
            var settings = {
                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Pantallas/Graficas/TX_GET_GRAFICA",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData,
                completeCallback: function(){},
                errorCallback: function(){}
            }

            Util.sendSOAPRequest(settings, that);  
        },

        /**Used as ajax success callback for general list. Order of the parameters matter */
        bindRetrievedData: function (controllerInstance, data, textStatus, jqXHR){
            var oView = controllerInstance.getView();
            
            var oDataXML = Util.unescapeXML(data)
            var oDataJSON = Util.xmlToJson(oDataXML);
            //Remove unneeded path prefix
            oDataJSON = oDataJSON["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_GRAFICA.GRAFICA; //Detail
            controllerInstance._parseTraceData(oDataJSON);
            var oJSONModel = new JSONModel(oDataJSON);

            oView.setModel(oJSONModel, "moddetailgraph");

            //PATCH - Set title
            //REVISE PATH OF THE TITLE (oDataJSON.TITULOS.TITULO.TEXTO)
            controllerInstance._setGraphTitle(oView.byId("idVizFrame"), oDataJSON.TITULOS.TITULO.TEXTO);
            
        },

        /**Modifiy retrieved model so that trace properties are parsed to proper data type */
        _parseTraceData: function(oData){
            var aPoints = oData.TITULOS.TITULO.VARIABLES.VARIABLE.PUNTOS.puntos;
            for(var pt of aPoints){
                pt.VALOR = parseFloat(pt.VALOR["#text"]) || pt.VALOR["#text"];
                pt.FECHA_TAG = new Date(pt.FECHA_TAG["#text"]) || pt.FECHA_TAG["#text"];
            }
            return oData;
        },

        _onGraphRenderComplete: function(oEvent){
            this._addTooltip2VizFrame(oEvent.getSource());
        },

        _addTooltip2VizFrame: function(oVizFrame){
            //Config tooltip
            //var oVizFrame = controllerInstance.getView().byId("vizFrame2");
            // var oFormat = {};

            var oTooltipConfig = {
                formatString: {
                    Data: '0.00',
                    Date:  'HH:mm - DD/MM/YYYY'
                } 
            };
            var oTooltip = new sap.viz.ui5.controls.VizTooltip(oTooltipConfig);
            oTooltip.connect(oVizFrame.getVizUid());
        },

        /**PATCH - Does not work otherwise
         * https://stackoverflow.com/questions/40301442/how-to-set-a-title-for-vizframe-chart */
        _setGraphTitle: function(oGraph, sTitle){
            var asyncChartUpdate = function () {
                oGraph.setVizProperties({
                    title: {
                        text: sTitle
                    },
                    categoryAxis: {
                        labelRenderer: jQuery.proxy(this.testFunction, this)
                    }
                });
            };
            setTimeout(asyncChartUpdate, 0);
        },

        
        /***
         *     _____ _ _     _           
         *    /  ___| (_)   | |          
         *    \ `--.| |_  __| | ___ _ __ 
         *     `--. \ | |/ _` |/ _ \ '__|
         *    /\__/ / | | (_| |  __/ |   
         *    \____/|_|_|\__,_|\___|_|   
         *                               
         *                               
         */

        _initSliderModel: function(){
            var oView = this.getView();
            var oData = {
                fechadesde: "",
                fechahasta: ""
            }
            oView.setModel(new JSONModel(oData), "modsliderrange");
        },

        _configureChartSlider: function(){
            var oView = this.getView();
            var oModel = oView.getModel("moddetailgraph");
            var oVizFrame = oView.byId("idVizFrame");
            var oRangeSlider = oView.byId("idVizSlider");
            oRangeSlider.setModel(oModel);
            oRangeSlider.setValueAxisVisible(false);
            oRangeSlider.setShowPercentageLabel(false);
            // oRangeSlider.setShowStartEndLabel(false);
            oRangeSlider.setLayoutData(new sap.m.FlexItemData({
                maxHeight: '10%',
                baseSize: '100%',
                order: 1,
                styleClass: 'rangeSliderPadding'
            }));

            oRangeSlider.attachRangeChanged(function(e){
                var data = e.getParameters().data;
                var start = data.start.Date;
                var end = data.end.Date;
                var dateFilter =  new Filter({
                    path: "FECHA_TAG",
                    test: function(oValue) {
                        var time = Date.parse(new Date(oValue));
                        return (time >= start && time <= end);
                    }
                });
                oVizFrame.getDataset().getBinding('data').filter([dateFilter]);
            });
        },

        _setChartSliderRange: function(oChartSlider, startDateMs, endDateMs){
            var range = {
                'start' : startDateMs,
                'end' : endDateMs
            };
            oChartSlider.setRange(range);
            //fire range change event
            //Give params with the data and structure expected
            var param = {
                data: {
                    start: {Date: range.start},
                    end: {Date: range.end}
                }
            };
            oChartSlider.fireRangeChanged(param);
        },

        onApplySliderRange: function(oEvent){
            var oView = this.getView();
            var oRangeModel = oView.getModel("modsliderrange");
            var fechadesde = new Date(oRangeModel.getProperty("/fechadesde")).getTime();
            var fechahasta = new Date(oRangeModel.getProperty("/fechahasta")).getTime();
            var oSlider = oView.byId("idVizSlider");

            this._setChartSliderRange(oSlider, fechadesde, fechahasta);
        },

        onResetSliderRange: function(oEvent){
            var oView = this.getView();
            //deatetime pickers
            var oRangeModel = oView.getModel("modsliderrange");
            oRangeModel.setProperty("/fechadesde", "");
            oRangeModel.setProperty("/fechahasta", "");
            //Slider
            var oSlider = oView.byId("idVizSlider");
            var fechadesde = 0
            var fechahasta = new Date("9999/12/31").getTime();

            this._setChartSliderRange(oSlider, fechadesde, fechahasta);
        },
        
        /***
         *     _____ _____ _____ _____ _____ _   _ _____ 
         *    |_   _|  ___/  ___|_   _|_   _| \ | |  __ \
         *      | | | |__ \ `--.  | |   | | |  \| | |  \/
         *      | | |  __| `--. \ | |   | | | . ` | | __ 
         *      | | | |___/\__/ / | |  _| |_| |\  | |_\ \
         *      \_/ \____/\____/  \_/  \___/\_| \_/\____/
         *                                               
         *                                               
         */

        _genRandomPoints: function(numPts){
            numPts = numPts || 1000;
            var aRes = [];
            var rndObj = {FECHA_TAG: new Date(), VALOR: ""};
            for(var i=0;i<numPts;i++){
                rndObj.VALOR = parseFloat(700 + 300*Math.random()).toFixed(3);
                rndObj.VALOR2 = parseInt(10 + 20*Math.random());
                rndObj.FECHA_TAG = new Date(rndObj.FECHA_TAG.getTime() + 600000); //10 min
                //rndObj.FECHA_TAG = new Date(rndObj.FECHA_TAG.getTime() + 86400000); //1 day
                let aNewObj = JSON.parse( JSON.stringify(rndObj) );
                aRes.push(aNewObj); 
            }
            return aRes;
        },

        _formatDate: function(d){
            var sDate = d.getHour()+":"+d.getMinutes()+" "+d.getFullYear()+"/"+parseInt(d.getMonth()+1,10)+"/"+d.getDate();
            return sDate;
        },

        _genGraphData: function(){
            var oView = this.getView();     
            var data=this._genRandomPoints(100);
            // /TITULOS/TITULO/VARIABLES/VARIABLE/PUNTOS/puntos/
            var oDataJSON = {TITULOS: {TITULO: {TEXTO: "Mock Chart", VARIABLES: {VARIABLE: {PUNTOS: {puntos: data}}}}}};
            var oJSONModel = new JSONModel(oDataJSON);
            oView.setModel(oJSONModel, "moddetailgraph");

            this._setGraphTitle(oView.byId("idVizFrame"), oDataJSON.TITULOS.TITULO.TEXTO);
        },

        testFunction: function(rendData){
            debugger;
        }

	});
});