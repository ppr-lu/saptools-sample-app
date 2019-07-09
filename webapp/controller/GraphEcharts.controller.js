sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "simple-app/utils/util",
    "simple-app/utils/formatter",
    "simple-app/libs/echarts"
], function (Controller, JSONModel, MessageBox, History, Util, Formatter, EchartsImport_THISNAMEISNOTUSED) {
    "use strict";
    return Controller.extend("simple-app.controller.GraphEcharts", {
        //On how to include third party libraries in SapUI5
        //https://blogs.sap.com/2017/04/30/how-to-include-third-party-libraries-modules-in-sapui5/
        //On how to include HTML in SapUI5 views
        //https://stackoverflow.com/questions/39511621/sapui5-insert-html-into-xml-view

        formatter: Formatter,

        onInit: function () {
            console.log("onInit graphEcharts");
            Util.init_i18n(this);

            this.initConfigModel();
            this.initEchartsModel();

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("graphEcharts").attachPatternMatched(this._onObjectMatched, this);
        },

        onAfterRendering: function(){
            this._generateSimpleLyrsaGraph();
            this._generateVBoxSample();
            this._generateGridSample();
        },

        _onObjectMatched: function (oEvent) {
            this._genGraphData();               //Generate data locally
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("graphMaster", {}, true);
            }
        },

        _genRandomPoints: function (numPts) {
            numPts = numPts || 1000;
            var aRes = [];
            var rndObj = { FECHA_TAG: new Date(), VALOR: "" };
            for (var i = 0; i < numPts; i++) {
                rndObj.VALOR = parseFloat(700 + 300 * Math.random()).toFixed(3);
                rndObj.VALOR2 = parseInt(10 + 20 * Math.random());
                rndObj.FECHA_TAG = new Date(rndObj.FECHA_TAG.getTime() + 600000); //10 min
                //rndObj.FECHA_TAG = new Date(rndObj.FECHA_TAG.getTime() + 86400000); //1 day
                let aNewObj = JSON.parse(JSON.stringify(rndObj));
                aRes.push(aNewObj);
            }
            return aRes;
        },

        _formatDate: function (d) {
            var sDate = d.getHour() + ":" + d.getMinutes() + " " + d.getFullYear() + "/" + parseInt(d.getMonth() + 1, 10) + "/" + d.getDate();
            return sDate;
        },

        _genGraphData: function () {
            var oView = this.getView();
            var data = this._genRandomPoints(100);
            // /TITULOS/TITULO/VARIABLES/VARIABLE/PUNTOS/puntos/
            var oDataJSON;
            var oJSONModel;
            
            //Generate random data
            // oDataJSON = { TITULOS: { TITULO: { TEXTO: "Mock Chart", VARIABLES: { VARIABLE: { PUNTOS: { puntos: data } } } } } };
            // oJSONModel = new JSONModel(oDataJSON);  
            
            //Load data from local file
            oJSONModel = new JSONModel();
            //load data synchronously
            oJSONModel.loadData("mockdata/graficaTest.json", "", false)

            oView.setModel(oJSONModel, "modgraphdata");

            console.log(oJSONModel.getData());
        },

        
        /***
         *     _____     _                _       
         *    |  ___|   | |              | |      
         *    | |__  ___| |__   __ _ _ __| |_ ___ 
         *    |  __|/ __| '_ \ / _` | '__| __/ __|
         *    | |__| (__| | | | (_| | |  | |_\__ \
         *    \____/\___|_| |_|\__,_|_|   \__|___/
         *                                        
         *                                        
         */

        initConfigModel: function(){
            var oView = this.getView();
            //Echarts canvas parameters
            var configData={
                width: "600px",
                height: "400px"
            };
            oView.setModel(new JSONModel(configData), "modconfigecharts");
        },

        initEchartsModel: function(){
            var oView = this.getView();
            //Echarts canvas parameters
            var oEcharts={
                echartsList: []
            };
            oView.setModel(new JSONModel(oEcharts), "modecharts");
        },

        /**Generate a div element and instantiates an echart on it using the options provided.
         * The layout of the genereated graphs depends on which control is the container
         */
        _generateEchartCanvas: function(option, containerId){
            containerId = containerId || "echartsContainer"
            var container = this.byId(containerId).$()[0];
            var oView = this.getView();
            var oConfigModel = oView.getModel("modconfigecharts");
            var oConfig = oConfigModel.getData();
            //Store all instantiated echarts in model
            var oEchartModel = oView.getModel("modecharts");
            //Get property by reference
            var aEcharts = oEchartModel.getData().echartsList;
            
            //Create div and add it to the view inside the container
            let div = document.createElement("div");
            div.style.width = oConfig.width;
            div.style.height = oConfig.height;
            div.style.display = "inline-block";
            container.appendChild(div);
                
            //Init echart on div
            let newEchart = echarts.init(div);
            //Add echart to echarts list in model
            aEcharts.push(newEchart);
                
            //Fill echart with providede data
            newEchart.setOption(option);
        },

        //Adapt retrieved data and return result
        _adaptGraphData2Echarts: function(graphData){
            var title = graphData.GRAFICA.TITULOS.TITULO[0].VARIABLES.VARIABLE[0].NOMBRE._text;
            var descr = graphData.GRAFICA.TITULOS.TITULO[0].VARIABLES.VARIABLE[0].DESC._text;
            var measureUnit = graphData.GRAFICA.TITULOS.TITULO[0].TEXTO._text;
            var xPoints = [];
            var yPoints = [];

            for(let point of graphData.GRAFICA.TITULOS.TITULO[0].VARIABLES.VARIABLE[0].PUNTOS.puntos){
                xPoints.push(point.FECHA_TAG._text);
                yPoints.push(point.VALOR._text);
            }

            return {
                title: title,
                descr: descr,
                measureUnit: measureUnit,
                xPoints: xPoints,
                yPoints: yPoints
            };
        },

        //Creates an egraph using lyrsa mock data
        _generateSimpleLyrsaGraph: function() {
            var graphOptions = {
                title: {
                    text: 'ECharts entry example'
                },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        dataView: {readOnly: false},
                        restore: {},
                        saveAsImage: {}
                    }
                },
                tooltip: {
                    trigger: 'axis'
                },
                dataZoom: [
                    {
                        show: true,
                        start: 0,
                        end: 100
                    }
                ],
                legend: {
                    data: ['_PLACEHOLDER_']
                },
                xAxis: {
                    data: ["shirt", "cardign", "chiffon shirt", "pants", "heels", "socks"],
                    axisLabel: {
                        formatter: function (a) {
                            var d = new Date(a).toLocaleTimeString();
                            return d;
                        }
                    }
                },
                yAxis: {
                    
                },
                series: [{
                    name: 'Sales',
                    type:'line',
                    smooth:true,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: 'rgb(255, 70, 131)'
                        }, {
                            offset: 1,
                            color: 'rgb(255, 158, 68)'
                        }])
                    },
                    data: [5, 20, 36, 10, 10, 20]
                }]
            };
            var oView = this.getView();
            var oModel = oView.getModel("modgraphdata");
            var oGraphData = oModel.getProperty("/");
            oGraphData = this._adaptGraphData2Echarts(oGraphData);
            
            graphOptions.title.text = oGraphData.title;
            graphOptions.xAxis.data = oGraphData.xPoints;
            graphOptions.series[0].name = oGraphData.measureUnit;
            graphOptions.series[0].data = oGraphData.yPoints;
            
            this._generateEchartCanvas(graphOptions);
        },

        _generateVBoxSample: function(){
            var option = {
                title: {
                    text: 'ECharts entry example'
                },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        dataView: {readOnly: false},
                        magicType: {type: ['line', 'bar']},
                        restore: {},
                        saveAsImage: {}
                    }
                },
                tooltip: {},
                dataZoom: [
                    {
                        show: true,
                        start: 0,
                        end: 100
                    }
                ],
                legend: {
                    data: ['Sales']
                },
                xAxis: {
                    data: ["shirt", "cardign", "chiffon shirt", "pants", "heels", "socks"]
                },
                yAxis: {},
                series: [{
                    name: 'Sales',
                    type: 'bar',
                    data: [5, 20, 36, 10, 10, 20]
                }]
            };
            for(var i=0;i<3;i++){
                this._generateEchartCanvas(option,"echartsContainerVBoxExample");
            }
        },

        _generateGridSample: function(){
            var option = {
                title: {
                    text: 'ECharts entry example'
                },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        dataView: {readOnly: false},
                        magicType: {type: ['line', 'bar']},
                        restore: {},
                        saveAsImage: {}
                    }
                },
                tooltip: {},
                dataZoom: [
                    {
                        show: true,
                        start: 0,
                        end: 100
                    }
                ],
                legend: {
                    data: ['Sales']
                },
                xAxis: {
                    data: ["shirt", "cardign", "chiffon shirt", "pants", "heels", "socks"]
                },
                yAxis: {},
                series: [{
                    name: 'Sales',
                    type: 'bar',
                    data: [5, 20, 36, 10, 10, 20]
                }]
            };
            for(var i=0;i<3;i++){
                this._generateEchartCanvas(option,"echartsContainerGridExample");
            }
        }

    });
});