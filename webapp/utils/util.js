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
         *                          Also recieves a controller instance as fourth parameter. 
         *                          Through it, the view associated to the controller can be obtained and the data can be stored inside a model.
         *  > errorCallback:    · Callback function to be called when the request is answered unsuccessfully. It receives a single parameter: oError.
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
                oSettings.successCallback = function(data, textStatus, jqXHR, controllerInstance){
                    console.log("You have not specified a success callback function");
                    console.log("> Params");
                    console.log(">> data:");
                    console.log(data);
                    console.log(">> textStatus:");
                    console.log(textStatus);
                    console.log(">> jqXHR:");
                    console.log(jqXHR);
                    console.log(">> controllerInstance:");
                    console.log(controllerInstance);
                };
            }
            if(oSettings.errorCallback === undefined){
                oSettings.errorCallback = function(oError){
                    console.log("You have not specified a error callback function");
                    console.log("> Params");
                    console.log(">> oError:");
                    console.log(oError);
                };
            }

            //Send request with recived settings
            $.ajax({
                url: oSettings.url,
                method: oSettings.httpMethod,
                dataType: "xml",
                contentType: "text/xml; charset=\"utf-8\"",
                data: oSettings.reqParams,
                success: function(data, textStatus, jqXHR){oSettings.successCallback(data, textStatus, jqXHR, controllerInstance);},
                error: function(oError){oSettings.errorCallback(oError);}
            });
        },

    };

});