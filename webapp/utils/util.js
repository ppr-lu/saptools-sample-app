sap.ui.define([
], function () {
    "use strict";

    return {
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
        }
    };

});