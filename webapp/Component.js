sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"simple-app/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("simple-app.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
            this.setModel(models.createDeviceModel(), "device");

            // set i18n model
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleName : "simple-app.i18n.i18n"
            });
            this.setModel(i18nModel, "i18n");
            
            // create the views based on the url/hash
			this.getRouter().initialize();
		}
	});
});