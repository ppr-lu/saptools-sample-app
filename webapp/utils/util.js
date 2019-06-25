sap.ui.define([
], function () {
    "use strict";

    return {

        init_i18n: function(controllerInstance){
            var i18nModel = controllerInstance.getOwnerComponent().getModel("i18n");
            if(i18nModel){
                controllerInstance.getView().setModel(i18nModel, "i18n");
            }
        },

        /**Converts an xml to a json */
        xmlToJson: function (xml) {
            // Create the return object
            var obj = {};
 
            if (xml.nodeType == 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue;
            }
 
            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof (obj[nodeName]) == "undefined") {
                        obj[nodeName] = this.xmlToJson(item);
                    } else {
                        if (typeof (obj[nodeName].push) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(this.xmlToJson(item));
                    }
                }
            }
            return obj;
        },

        /**Parses a DOM which has been filtered:
         * with &lt; instead of <
         * &gt; instead of >
         * &amp; instead of &
         * &quot; instead of "
         * &apos; instead of '
         */
        unescapeXML: function(oXML){
            var sXML = new XMLSerializer().serializeToString(oXML);

            sXML = sXML.replace(/&amp;/g, "&");
            sXML = sXML.replace(/&quot;/g, "\"");
            sXML = sXML.replace(/&apos;/g, "'");
            sXML = sXML.replace(/&lt;/g, "<");
            sXML = sXML.replace(/&gt;/g, ">");

            oXML = new DOMParser().parseFromString(sXML, "text/xml");
            return oXML;
        },

        _isObject: function(thing){
            return typeof thing === 'object' && thing !== null;
        },

        setControlBusyness(controllerInstance, id, busy){
            controllerInstance.byId(id).setBusy(busy);
        },

        /**
         * SOAP
         */
        getListaOrdenMezParams(oSettings){
            if(!this._isObject(oSettings)){
                oSettings={};
            }
            //check settings. Set them to defualt if they are not present
            if(oSettings.centro === undefined){
                oSettings.centro = "0901";
            }
            if(oSettings.user === undefined){
                oSettings.user = "PDOMINGUEZ";
            }
            if(oSettings.idioma === undefined){
                oSettings.idioma = "S";
            }

            var sReq = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\
            <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"  xmlns:s0=\"http://www.sap.com/xMII\">\
            <soap:Body><s0:XacuteRequest>\
            <s0:InputParams xmlns:s0=\"http://www.sap.com/xMII\" xmlns=\"http://www.sap.com/xMII\">\
            <s0:I_CENTRO>"+oSettings.centro+"</s0:I_CENTRO>\
            <s0:I_USER>"+oSettings.user+"</s0:I_USER>\
            <s0:I_IDIOMA>"+oSettings.idioma+"</s0:I_IDIOMA>\
            </s0:InputParams></s0:XacuteRequest></soap:Body></soap:Envelope>";

            return sReq;
        },

        getDetalleOrdenMezParams(oSettings){
            if(!this._isObject(oSettings)){
                oSettings={};
            }
            if(oSettings.user === undefined){
                oSettings.user = "PDOMINGUEZ";
            }
            if(oSettings.ordenMezcla === undefined){
                oSettings.ordenMezcla = "99";
            }
            if(oSettings.idioma === undefined){
                oSettings.idioma = "S";
            }
            var sReq = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\
            <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" \
            xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"  \
            xmlns:s0=\"http://www.sap.com/xMII\"><soap:Body><s0:XacuteRequest>\
            <s0:InputParams xmlns:s0=\"http://www.sap.com/xMII\" xmlns=\"http://www.sap.com/xMII\">\
            <s0:I_USER>"+oSettings.user+"</s0:I_USER>\
            <s0:I_IDIOMA>"+oSettings.idioma+"</s0:I_IDIOMA>\
            <s0:I_ORDEN_MEZ>"+oSettings.ordenMezcla+"</s0:I_ORDEN_MEZ>\
            </s0:InputParams></s0:XacuteRequest></soap:Body></soap:Envelope>";

            return sReq;
        },

        /**
         * The object given as argument should posses the following fields:
         *  > url:              · URL to where the request should be sent
         *  > httpMethod:       · HTTP method to be used in the request
         *  > reqParams:        · Data to be sent in the request body. Should be XML and adquired with getListaOrdenMezParams or getListaOrdenMezParams
         *  > successCallback:  · Callback function to be called when the request is answered successfully. It receives three parameters: data, textStatus and jqXHR. 
         *  > errorCallback:    · Callback function to be called when the request is answered unsuccessfully. It receives a single parameter: oError.
         * 
         *      Every callback function also recieves a controller instance as extra parameter. 
         *      It is placed as the first one since it is most likely to be the one to be used in most of the cases, so the rest can be ignored.
         *      Through it, the view associated to the controller can be obtained and the data can be stored inside a model, or a busy indicator can be set
         * 
         * The controller instance may also be needed by the successCallback if the retrieved data wants to be stored in a view model
         */
        sendSOAPRequest: function(oSettings, controllerInstance){

            //check if oSettings is not an object. If that is the case, init it
            if( !this._isObject ){
                oSettings = {};
            }
            //check settings. Set them to defualt if they are not present
            if(oSettings.url === undefined){
                oSettings.url = "http://desarrollos.lyrsa.es/XMII/SOAPRunner/MEFRAGSA/Fundicion/Produccion/Ord_Mezcla/TX_lista_orden_mez";
            }
            if(oSettings.httpMethod === undefined){
                oSettings.httpMethod = "POST";
            }
            if(oSettings.reqParams === undefined){
                oSettings.reqParams = "";
            }
            if(oSettings.successCallback === undefined){
                oSettings.successCallback = function(controllerInstance, data, textStatus, jqXHR){
                    console.log("You have not specified a success callback function");
                    console.log("> Params");
                    console.log(">> controllerInstance:");
                    console.log(controllerInstance);
                    console.log(">> data:");
                    console.log(data);
                    console.log(">> textStatus:");
                    console.log(textStatus);
                    console.log(">> jqXHR:");
                    console.log(jqXHR);
                    
                };
            }
            if(oSettings.errorCallback === undefined){
                oSettings.errorCallback = function(controllerInstance, oError){
                    console.log("You have not specified a error callback function");
                    console.log("> Params");
                    console.log(">> controllerInstance:");
                    console.log(controllerInstance);
                    console.log(">> oError:");
                    console.log(oError);
                };
            }
            if(oSettings.completeCallback === undefined){
                oSettings.completeCallback = function(controllerInstance, jqXHR, textStatus){
                    console.log("You have not specified a complete callback function");
                    console.log("> Params");
                    console.log(">> controllerInstance:");
                    console.log(controllerInstance);
                    console.log(">> jqXHR:");
                    console.log(jqXHR);
                    console.log(">> textStatus:");
                    console.log(textStatus);
                };
            }

            //Send request with recived settings
            $.ajax({
                url: oSettings.url,
                method: oSettings.httpMethod,
                dataType: "xml",
                contentType: "text/xml; charset=\"utf-8\"",
                data: oSettings.reqParams,
                //PAY ATTENTION TO THE ORDER OF THE PARAMETERS
                success: function(data, textStatus, jqXHR){oSettings.successCallback(controllerInstance, data, textStatus, jqXHR);},
                error: function(oError){oSettings.errorCallback(controllerInstance, oError);},
                complete: function(jqXHR, textStatus){oSettings.completeCallback(controllerInstance, jqXHR, textStatus);}
            });
        },

        getResourcesKeyValue: function(){
            var recursosDescr = { 
                TF: "Torre Fusora",
                HRB: "Horno Rotativo"
            };
            return recursosDescr;
        },

        getFlowsKeyValue: function(){
            var flujoDescr = { 
                TFHM1: 'TF para HM1',
                TFHM2: 'TF para HM2',
                TFHM2TFHRB: 'TF para HM2 con TF + HRB',
                HRBHM2TFHR: 'HRB para HM2 con TF + HRB',
                HRBHM2: 'HRB para HM2',
                HRBHM3: 'HRB para HM3'
            };
            return flujoDescr;
        },

    };

});