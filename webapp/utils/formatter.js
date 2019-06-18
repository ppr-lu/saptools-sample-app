sap.ui.define([], function () {
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
        global2SpainDate: function(value){
            var dateParts = value.split("-");
            if(dateParts.length === 3){
                return dateParts[2]+"-"+dateParts[1]+"-"+dateParts[0];
            }else{
                return value;
            }
        }
	};
});