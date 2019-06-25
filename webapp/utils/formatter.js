sap.ui.define([
    "simple-app/utils/util"
], function (Util) {
	"use strict";
	return {
		noLeadingZeroes: function(value){
            var noZeroes = parseInt(value, 10);
            if(isNaN(noZeroes)){
                return value;
            }
            else{
                noZeroes = String(noZeroes);
                return noZeroes;
            }
        },
        noDecimals: function(value){
            if(isNaN(value)){
                return value;
            }else{
                return String(parseInt(value, 10));
            }
        },
        trimDecimals: function(value){
            if(isNaN(value)){
                return value;
            }else{
                return String(parseFloat(value, 10));
            }
        },
        global2SpainDate: function(value){
            if(value && value.split){
                var dateParts = value.split("-");
                if(dateParts.length === 3){
                    return dateParts[2]+"-"+dateParts[1]+"-"+dateParts[0];
                }
            }
            return value;
            
        },
        checkIcon: function(value){
            var icon = "sap-icon://decline";
            if(value === 'X'){
                icon = "sap-icon://accept";
            }
            return icon;
        },
        resourceKeyToText: function(value){
            //HARDCODED Descriptions
            var recursosDescr = Util.getResourcesKeyValue();
            var descr = recursosDescr[value];
            if(descr){
                return descr;
            }else{
                return value;
            }
        },
        flowKeyToText: function(value){
            //HARDCODED Descriptions
            var flujoDescr = Util.getFlowsKeyValue();
            var descr = flujoDescr[value];
            if(descr){
                return descr;
            }else{
                return value;
            }
        }
	};
});