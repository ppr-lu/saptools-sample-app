sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/viz/ui5/data/FlattenedDataset",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
], function (Controller, JSONModel, MessageBox, History, VizFrame, FeedItem, ChartFormatter, Format, FlattenedDataset, Util, Formatter) {
    "use strict";

    return Controller.extend("simple-app.controller.GraphMaster", {

        formatter: Formatter,

        formatPatter: ChartFormatter.DefaultPattern,

        onInit: function () {
            console.log("onInit graph");
            this.onRetrieveGeneralGraphsData();
        },

        
        /***
         *    ______      _        
         *    |  _  \    | |       
         *    | | | |__ _| |_ __ _ 
         *    | | | / _` | __/ _` |
         *    | |/ / (_| | || (_| |
         *    |___/ \__,_|\__\__,_|
         *                         
         *                         
         */


        onRetrieveGeneralGraphsData: function (oEvent) {
            this.getGeneralGraphData();
        },

        getGeneralGraphData: function (params) {
            var that = this;
            if (params === undefined) {
                params = Util.getMasterGraphParams();
            }
            var settings = {

                url: "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Pantallas/TX_LISTADO_PAGINAS",
                httpMethod: "POST",
                reqParams: params,
                successCallback: that.bindRetrievedData,
                completeCallback: function(){},
                errorCallback: function(){}
            }
            this.getView().setBusy(true);
            var promise = Util.sendSOAPRequest(settings, that);
            promise.done(function() {
                this.getView().setBusy(false);
            }.bind(this));
        },

        /**Used as ajax success callback for general list. Order of the parameters matter */
        bindRetrievedData: function (controllerInstance, data, textStatus, jqXHR) {
            var oView = controllerInstance.getView();

            var oDataXML = Util.unescapeXML(data)
            var oDataJSON = Util.xmlToJson(oDataXML);
            //Remove unneeded data by cutting path
            oDataJSON = oDataJSON["soap:Envelope"]["soap:Body"].XacuteResponse.Rowset.Row.O_GRAFICAS.GRUPOS;
            var oJSONModel = new JSONModel(oDataJSON);

            //console.log(oDataJSON);

            oView.setModel(oJSONModel, "modmastergraph");

            //Generate new model from retrieved data so we have data better organized
            controllerInstance._genModifiedGraphData();
            //generate charts with data in the new model. We have to specify which property of the traces
            //is used for the x-axis. The rest of the trace properties will be considered as values for the y-axis.
            //The second parameter is the id of the control where we will insert the graphs. It is recommended to be a VBox.
            controllerInstance.genVizChartsFromGraphData("FECHA_TAG", "GraphContainer");

        },

        /**
         * Receive the x and y labels the original graph data has for its points.
         * 
         * Modifies the original graph data to store data in a different way so that it can
         * be integrated with viz charts. Stores data of the different traces in the same place. They
         * are  differentiated by its label.
         */
        _genModifiedGraphData: function (xLabel, yLabel) {
            if (xLabel === undefined) {
                xLabel = "FECHA_TAG";
            }
            if (yLabel === undefined) {
                yLabel = "VALOR";
            }
            var oView = this.getView();
            var oOriginalModel = oView.getModel("modmastergraph");
            var oOriginalData = oOriginalModel.getData();

            var oCopiedData = JSON.parse(JSON.stringify(oOriginalData));

            var oNewData = { GRAPHS: [] };
            var newGrp;
            //Iterador sobre grupos - cada grupo contiene varias graficas
            for (var gr_ix = 0; gr_ix < oCopiedData.GRUPO.length; gr_ix++) {
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
                //binds graph name to its id, so it can be retrieved from the server for the detail view
                newGrp.TRACEID = [];

                //force array
                let trace_arr = currentGrp.GRAFICAS.GRAFICA
                if (trace_arr != null && !Array.isArray(trace_arr)) {
                    //CAUTION MAI FREN
                    trace_arr = [trace_arr];
                }
                //Iterador sobre gráficas - cada gráfica contiene uno o varios grupos de puntos (trazas)
                for (var tr_ix = 0; trace_arr !== undefined && tr_ix < trace_arr.length; tr_ix++) {
                    var currentGraph = trace_arr[tr_ix];
                    //store description for the label
                    newGrp.DESCRIPCIONES[currentGraph.NOMBRE["#text"]] = currentGraph.CARACTERISTICA["#text"];
                    //IDs to retrieve individual traces from server
                    newGrp.TRACEID[currentGraph.NOMBRE["#text"]] = currentGraph.ID["#text"]
                    newGrp.UNIDADES.push(currentGraph.UNIDAD["#text"]);
                    var currentYLabel = currentGraph.NOMBRE["#text"];
                    newGrp.ETIQUETAS.push(currentYLabel);

                    //force array
                    let points_arr = trace_arr[tr_ix].PUNTOS.punto;
                    if (points_arr != null && !Array.isArray(points_arr)) {
                        //CAUTION MAI FREN
                        points_arr = [points_arr];
                    }
                    //Iterador sobre puntos
                    for (var pt_ix = 0; points_arr !== undefined && pt_ix < points_arr.length; pt_ix++) {
                        var currentPnt = points_arr[pt_ix];
                        if (newGrp.TRAZAS[pt_ix] === undefined) {
                            newGrp.TRAZAS[pt_ix] = {};
                            newGrp.TRAZAS[pt_ix][xLabel] = new Date(currentPnt[xLabel]["#text"]) || currentPnt[xLabel]["#text"];
                        }
                        newGrp.TRAZAS[pt_ix][currentYLabel] = parseFloat(currentPnt[yLabel]["#text"]).toFixed(3) || currentPnt[yLabel]["#text"];

                    }
                }
                oNewData.GRAPHS.push(newGrp);
            }
            oView.setModel(new JSONModel(oNewData), "modmodifiedmastergraph");
            console.log(oNewData);
        },


        
        /***
         *     _____                 _         
         *    |  __ \               | |        
         *    | |  \/_ __ __ _ _ __ | |__  ___ 
         *    | | __| '__/ _` | '_ \| '_ \/ __|
         *    | |_\ \ | | (_| | |_) | | | \__ \
         *     \____/_|  \__,_| .__/|_| |_|___/
         *                    | |              
         *                    |_|              
         */


        /**From the modified data of the graphs, generate needed data to create them and
         * call the function that draws them.
         */
        genVizChartsFromGraphData: function (xLabel, containerId) {
            containerId = containerId || "GraphContainer";
            xLabel = xLabel || "FECHA_TAG";
            var oView = this.getView();
            var oModel = oView.getModel("modmodifiedmastergraph");
            var oData = oModel.getData();
            var container = oView.byId(containerId);
            //clear previous content
            container.removeAllItems();

            for (var gr_ix = 0; gr_ix < oData.GRAPHS.length; gr_ix++) {
                var currentGraph = oData.GRAPHS[gr_ix];
                var aEtiquetas = currentGraph.ETIQUETAS;
                var aDimensions;
                var aMeasures;
                var sDataPath = "modmodifiedmastergraph>/GRAPHS/" + gr_ix + "/TRAZAS/";
                var chartTitle;
                var measureUnit;
                var chartId;

                //Set title of section
                var hboxTitle = new sap.m.HBox(/* {alignContent: "Center", alignItems: "Center" ,justifyContent: "Center"} */);
                var title = new sap.m.Title({ text: currentGraph.NOMBRE , level: "H1" });
                title.addStyleClass("sapUiSmallMarginTopBottom");
                title.addStyleClass("myCustomTitle");
                hboxTitle.addItem(title);
                
                //container is a VBox
                container.addItem(hboxTitle);

                // //New section to add Graphs
                // var hboxGraphSection = new sap.m.HBox("ZGraphSection"+gr_ix,{});
                // container.addItem(hboxGraphSection);

                var hboxGraphSection;

                let graphsPerColumn = 3;
                for (var label_ix = 0; label_ix < aEtiquetas.length; label_ix++) {
                    if (label_ix % graphsPerColumn === 0) {
                        //New section to add Graphs
                        //hboxGraphSection = new sap.m.HBox("ZGraphSection" + gr_ix + "-" + label_ix, {});
                        hboxGraphSection = new sap.m.HBox();
                        container.addItem(hboxGraphSection);
                    }
                    let label = aEtiquetas[label_ix];
                    aDimensions = [];
                    aMeasures = [];
                    aDimensions.push({ axis: 1, name: xLabel, value: "{" + xLabel + "}",
                        dataType: "date"
                    });
                    aMeasures.push({ group: 1, name: label, value: "{" + label + "}" });
                    //this._generateVizChart(containerId, aDimensions, aMeasures, sDataPath);
                    chartTitle = currentGraph.DESCRIPCIONES[label];
                    measureUnit = currentGraph.UNIDADES[label_ix];
                    chartId = currentGraph.TRACEID[label];
                    this._generateVizFrame(hboxGraphSection, aDimensions, aMeasures, sDataPath, chartTitle, measureUnit, chartId);
                }
            }
        },

        /**UP TO DATE LIB - Creates a Viz Frame using the data received*/
        _generateVizFrame: function (container, aDimensions, aMeasures, sDataPath, chartTitle, measureUnit, chartId) {
            chartTitle = chartTitle || "";
            var oView = this.getView();
            var oModel = oView.getModel("modmodifiedmastergraph");

            var oSettings = {
                dimensions: aDimensions,
                measures: aMeasures,
                data: {
                    path: sDataPath,
                }
            };
            var oDataset = new FlattenedDataset(oSettings);

            Format.numericFormatter(ChartFormatter.getInstance());
            var formatPattern = ChartFormatter.DefaultPattern;

            var oFormat = {};
            oFormat[aMeasures[0].name] = "0.00" + " " + measureUnit;
            oFormat[aDimensions[0].name] = "HH:mm - DD/MM/YYYY";

            //Chart Properties
            var oProperties = {
                title: chartTitle,
                //Avoid horizontal scroll
                plotArea: {
                    window: {
                        start:"firstDataPoint",
                        end:"lastDataPoint"
                    }
                },
                tooltip: {
                    background: {
                        //color: "#ff0000"
                    },
                    formatString: oFormat,
                    //postRender: jQuery.proxy(this._tooltipPostRenderer, this)
                },
                //X Axis for non time type charts (e.g. area)
                categoryAxis: {
                    axisTick: {
                        shortTickVisible: true,
                        visible: true
                    },
                    layout:{
                        width: "10px"
                    },
                    //labelRenderer: jQuery.proxy(this._labelRenderer, this)
                    title: {
                        visible: false
                    }
                },
                //X Axis for time type charts (e.g. timeseries_line)
                timeAxis:{
                    title: {visible: false},
                    levels: ["minute"],
				    levelConfig: {                  
                        minute: {visible: true, row: 1},
				    }
                },    
                valueAxis: {
                    title: {
                        visible: false
                    }
                }
            };

            var oFrame = new VizFrame({
                    width: "100%",
                    height: "400px",
                    vizProperties: oProperties,
                    //vizType: "area"
                    vizType: "timeseries_line"
            });
            //PATCH - Does not work otherwise
            //https://stackoverflow.com/questions/40301442/how-to-set-a-title-for-vizframe-chart
            var asyncChartUpdate = function () {
                oFrame.setVizProperties({
                    title: {
                        text: chartTitle
                    }
                });
            };
            setTimeout(asyncChartUpdate, 0);

            oFrame.setDataset(oDataset);
            oFrame.setModel(oModel);

            //Measure Feed Items (y axis)
            var aValues = []
            for (var i = 0; i < aMeasures.length; i++) {
                aValues.push(aMeasures[i].name);
            }
            var feedValueAxis = new FeedItem({
                'uid': "valueAxis",
                'type': "Measure",
                'values': aValues
            });
            oFrame.addFeed(feedValueAxis);

            //Dimension Feed Items (x axis)
            aValues = [];
            for (var i = 0; i < aDimensions.length; i++) {
                aValues.push(aDimensions[i].name);
            }
            var feedCategoryAxis = new FeedItem({
                //'uid': "categoryAxis",
                'uid' : "timeAxis",
                'type': "Dimension",
                'values': aValues
            });
            oFrame.addFeed(feedCategoryAxis);

            //----

            var vbox = new sap.m.VBox({ width: "100%" });
            vbox.addItem(oFrame);
            var btn = new sap.m.Button({ text: "DETALLE"});
            btn.ZChartId = chartId; 
            btn.attachPress(this.navToDetailGraph, this)
            vbox.addItem(btn);
            //var container = this.byId(containerId);
            if (container) {
                container.addItem(vbox);
            }
        },

        /**UNUSED - Adds a tooltip to the vizframe received as a parameter */
        _addTooltip2VizFrame: function (oVizFrame) {
            //Config tooltip
            var oVizFrame = controllerInstance.getView().byId("vizFrame2");
            var oTooltip = new sap.viz.ui5.controls.VizTooltip({});
            oTooltip.connect(oVizFrame.getVizUid());
            //oTooltip.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
        },

        /**UNUSED - postrender function for tooltips. Can be passed as tooltip.postRender 
         * attribute in vizConfig when instantiating VizFrame to use it.
         */
        _tooltipPostRenderer: function (tooltipDomNode) {
            // .v-body-<measure/dimension>-<label/value>
            tooltipDomNode.selectAll(".v-body-dimension-value").text(function(){
                var d = new Date(tooltipDomNode.selectAll(".v-body-dimension-value").text());
                var value = d.getHours()+":"+d.getMinutes()+" - "+d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();
                return value;
            });
        },

        /**UNUSED - Render function for Labels in an axis -> 
         * e.g. vizProperties: { ...categoryAxis.labelRenderer: jQuery.proxy(this._labelRenderer, this)... }
         */
        _labelRenderer: function(rendData){
            debugger;
        },

        
        /***
         *     _   _             _             _   _             
         *    | \ | |           (_)           | | (_)            
         *    |  \| | __ ___   ___  __ _  __ _| |_ _  ___  _ __  
         *    | . ` |/ _` \ \ / / |/ _` |/ _` | __| |/ _ \| '_ \ 
         *    | |\  | (_| |\ V /| | (_| | (_| | |_| | (_) | | | |
         *    \_| \_/\__,_| \_/ |_|\__, |\__,_|\__|_|\___/|_| |_|
         *                          __/ |                        
         *                         |___/                         
         */
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("mixList", {}, true);
            }
        },

        onNavToGraphDetail: function (oEvent) {
            console.log("NAV!");
            var graphId = "TEST";

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("graphDetail", { graphId: graphId });
        },

        navToDetailGraph: function(oEvent){
            console.log("NAV!");
            //Custom property set to the button when creating it at the same time as the chart.
            var graphId = oEvent.getSource().ZChartId;

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("graphDetail", { graphId: graphId });
        }

    });
});