window.globals.apps["sites"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function (callback) {
        
        // Show notification
        $(".notification-parent-ui .no-site-selected-notification").removeClass("hidden");
        $(".project-device-selector-button").addClass("an-flash");

        // drawArrow('startDiv', 'devicesBtn', 10, '#f00', 'round');

        self.listeners();

        return self;
    }

    // Fetch devices information from the server
    self.get_all_devices = function(callback) {

        $.ajax({
            url: self.f.url({ path: "/sites/get/all" }), 
            method: 'POST',
            data: JSON.stringify({
                "email": self.ls.functions.decrypt(window.globals.data["user"][self.ls.functions.hash("email")]),
                "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
                "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
            }),
            success: function(response) {

                if (callback && typeof callback == "function") callback(response.payload);
            },
            error: function (request, textStatus, errorThrown) { 
                console.log(errorThrown);
            }
        });
    }

    // Fetch a device's dashboard's configuration data
    self.get_site_config_data = function(callback) {

        $.ajax({
            url: self.f.url({ path: "/sites/site/get" }), 
            method: 'POST',
            data: JSON.stringify({
                "device-sn": self.ls.getItem("state/device/sn"),
                "device-id": self.ls.getItem("state/device/id"),
                "project-id": self.ls.getItem("state/project/id"),
            }),
            success: function(response) {

                // Set global data variable
                window.globals.data["site"] = response.payload;
                if (callback && typeof callback == "function") callback(window.globals.data["site"]);

            },
            error: function (request, textStatus, errorThrown) { }
        });
    }

    self.on_site_selected = function (callback) {
        
        var allowedsites = window.globals.data["all-devices"];

        // Check if the user has permission to see the site data
        if (!self.f.grep(allowedsites, "UUID", self.ls.getItem("state/device/uuid"), true)) {

            self.f.create_notification("error", "You do not have permissions to view this site.", "mint");
            return;
        }

        global.DEVICE_ID = self.ls.getItem("state/device/name");
        console.log("Site selected: " + global.DEVICE_ID);
        console.log("Device SN: " + self.ls.getItem("state/device/sn"));

        // Hide notification
        $(".notification-parent-ui .no-site-selected-notification").addClass("hidden");
        $(".project-device-selector-button").removeClass("an-flash");

        // Show charts, events monitor, and console in GUI
        $(".map-row").removeClass("hidden");[]
        $(".charts-row").removeClass("hidden");

        // Delete the map object
        if (window.globals.variables["gpsmap"]) {
            try {
                window.globals.variables["gpsmap"].off();
                window.globals.variables["gpsmap"].remove();
            }
            catch (e) {}
        }

        // Set URL
        self.f.set_state("?p=" + self.ls.getItem("state/project/id") + "&d=" + self.ls.getItem("state/device/id"));

        // Remove maps and charts from the view
        $(".data-field").remove();
        window.globals.accessors["maps"] = undefined;
        window.globals.variables["gpsmap"] = undefined;

        // Remove all datatable tabs
        $(".datatable-row .datatable-tab").remove();
        $(".datatable-row .no-data-notification").removeClass("hidden");
        $(".datatable-row .table .col").html("");
        $(".datatable-row .download-button").addClass("hidden").attr("type", null);

        // Show log history
        $(".events-monitor-row .list .log-sentence").remove();
        window.globals.accessors["log"].get_log_history();

        // Get site's config data
        self.get_site_config_data(function (site) {

            var allowedsites = window.globals.data["all-devices"];
            var devicerole = self.ls.getItem("state/device/role");
            var projectrole = self.ls.getItem("state/project/role");

            // If the user is an administrator for the project
            if (projectrole == "super" || projectrole == "admin") {
                console.log("The user is an admin/super for the project.");
                
                $(".settings-menu-row").find(".users-menu-button").removeClass("hidden");
                $(".settings-menu-row").find(".add-project-button").removeClass("hidden");
                $(".settings-menu-row").find(".manage-projects-button").removeClass("hidden");
                $(".settings-menu-row").find(".add-device-button").removeClass("hidden");
            }
            else {
                console.log("The user is NOT an admin/super for the project.");

                $(".settings-menu-row").find(".users-menu-button").addClass("hidden").off("click");
                $(".settings-menu-row").find(".add-project-button").addClass("hidden").off("click");
                $(".settings-menu-row").find(".manage-projects-button").addClass("hidden").off("click");
                $(".settings-menu-row").find(".add-device-button").addClass("hidden").off("click");
            }

            // If the user is an administrator for the device
            if (devicerole == "super" || devicerole == "admin") {
                console.log("The user is an admin/super for the device.");

                $(".console-row-heading").removeClass("hidden");
                $(".console-row").removeClass("hidden");
                
                $(".control-variables-row-heading").removeClass("hidden");
                $(".control-variables-row").removeClass("hidden");

                $(".events-monitor-row-heading").removeClass("hidden");
                $(".events-monitor-row").removeClass("hidden");
                
                $(".control-buttons-list-heading").removeClass("hidden");
                $(".control-buttons-list").removeClass("hidden");
                
                $(".notes-row-heading").removeClass("hidden");
                $(".notes-row").removeClass("hidden");

                $(".settings-menu-row").find(".show-hide-config-button").removeClass("hidden");

                window.globals.accessors["control"].get_control_variables();
                window.globals.accessors["state"].get_state_data();
            }
            
            // If the user is NOT an administrator
            else {
                console.log("The user is NOT an admin/super for the device.");
                
                $(".console-row-heading").removeClass("hidden");
                $(".console-row").removeClass("hidden");
                
                $(".events-monitor-row-heading").removeClass("hidden");
                $(".events-monitor-row").removeClass("hidden");
                
                $(".control-buttons-list-heading").removeClass("hidden");
                $(".control-buttons-list").removeClass("hidden");
                
                $(".notes-row-heading").removeClass("hidden");
                $(".notes-row").removeClass("hidden");

                $(".settings-menu-row").find(".show-hide-config-button").addClass("hidden").off("click");
            }

            // Set global sensors data
            window.globals.data["data-fields"] = site["DATA-FIELDS"];

            // TODO: Set site location/description/etc here
            // ...

            //! Join SocketIO room of the selected site
            window.globals.accessors["socket"].publish({
                action: "room/createorjoin",
                payload: self.ls.getItem("state/device/sn")
            });

            // Get readings data
            // TODO: Move to readings.js
            console.log("Downloading site readings data.");
            $.ajax({
                type: 'POST',
                data: JSON.stringify({
                    "device-sn": self.ls.getItem("state/device/sn"),
                    "device-id": self.ls.getItem("state/device/id"),
                    "project-id": self.ls.getItem("state/project/id"),
                    "timestamp": moment.now(),
                }),
                url: self.f.url({ path: "/data/get" }),
                success: function(data) {

                    // Set global data variable
                    window.globals.data["data-fields-readings"] = data.payload;

                    // Try getting reference data
                    $.ajax({
                        type: 'GET',
                        url: self.f.url({ path: "/data/reference/get" }),
                        success: function(referencedata) {

                            // Set reference data
                            window.globals.data["data-fields-readings-reference"] = referencedata;
                            
                            // Call callback if available
                            if (callback && typeof callback == "function") callback();

                            // Hide loader
                            $(".loader-parent").addClass("hidden");
        
                        },
                        error: function (request, textStatus, errorThrown) {

                            console.log("Reference data: " + false);

                            // Call callback if available
                            if (callback && typeof callback == "function") callback();

                            // Hide loader
                            $(".loader-parent").addClass("hidden");
                        }
                    });
                },
                error: function (request, textStatus, errorThrown) { }
            });
        });
    }

    self.listeners = function () {

        function generateUniqueID() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.?:-+';
            let uniqueID = '';
          
            for (let i = 0; i < 8; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              uniqueID += characters.charAt(randomIndex);
            }
          
            return uniqueID;
        }
        

        // Add a project button listener
        $(".add-device-button").click(function () {
            popup().open({
                html: multiline(function () {/* 
                    <div class="row" data-step="form">
                        <div class="col">

                            <form action="javascript:void(0);" style="margin-bottom: 0;">
                                <div class="row" style="margin: 0 4px;">

                                    <!-- ID input -->
                                    <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                        <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Device ID</p> 
                                        <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter an identifier for the project. Please replace spaces with a hyphen. <span style="font-weight: bold;">Min. length is 3 while max. length is 6 characters.</span></p> 
                                        <input placeholder="wauburg-one, northwest-station, et cetera." type="text" class="ui-input-dark device-id-input" style=""/>
                                    </div>

                                </div>
                                <div class="row" style="margin: -2px; width: 100%;">
                                    <div class="col-auto" style="padding: 0;">
                                        <button type="submit" class="ui-btn-1 shadow add-button" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 2px;font-size: 13px;">Add</button>
                                    </div>
                                    <div class="col-auto" style="padding: 0;">
                                        <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #404040;border-radius: 2px;font-size: 13px;">Close</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="row hidden" data-step="success">
                        <div class="col">

                            <div style="font-size: 0.8rem;padding: 10px 18px;text-align: center;">
                                <i class="far fa-check-circle" style="color: green;font-size: 49px;opacity: 0.78;"></i>
                                <p style="font-size: 13px;margin-top: 8px;margin-bottom: 8px;">The site was successfully created.</p>
                                <p style="font-size: 13px;margin-top: 8px;margin-bottom: 8px;">Now, you can add the site's configuration information by clicking the button below.</p>
                            </div>

                            <div class="row" style="margin: 0 4px; width: 100%;">
                                <div class="col-auto" style="padding: 0;">
                                    <button type="submit" class="ui-btn-1 shadow add-another-button" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 2px;font-size: 13px;">Add another</button>
                                </div>
                                <div class="col-auto" style="padding: 0;">
                                    <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #404040;border-radius: 2px;font-size: 13px;">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                */}),
                title: "Add device/site",
                subtitle: "Use this to create a add a device to the selected project",
                theme: "light",
                on_load: function () {

                },
                listeners: function (ui) {
                    $(ui).find(".add-another-button").off("click").click(function () {
                        $(ui).find("[data-step='form']").removeClass("hidden");
                        $(ui).find("[data-step='success']").addClass("hidden");
                    });

                    $(ui).find("[data-step='form']").find(".add-button").off("click").click(function () {
                        var deviceid = $(ui).find("[data-step='form']").find(".device-id-input").val().trim().replace(/\s/g, "-").toLowerCase();

                        if (deviceid.length < 3 || deviceid.length < 6) {
                            self.f.create_notification("error", "The project id should be between 3 and 6 characters.", "mint");
                            return;
                        }

                        $.ajax({
                            url: self.f.url({ path: "/sites/site/create" }), 
                            method: 'POST',
                            data: JSON.stringify({
                                "device-id": projectid,
                                "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
                                "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
                            }),
                            success: function(response) {
                                $(ui).find("[data-step='form']").addClass("hidden");
                                $(ui).find("[data-step='success']").removeClass("hidden");
                            },
                            error: function (request, textStatus, errorThrown) { }
                        });
                    });
                }
            });
        });

        $(".button.add-site-button").click(function () {

            popup().open({
                html: multiline(function () {/* 
                    <div class="calibration-wizard-ui">
    
                        <div class="row" data-step="form">
                            <div class="col">
                                <div style="width: 100%; background: #FFF; color: #666; font-size: 14px; border: 1px solid #DDD;padding: 8px;margin-bottom: 10px;">
                                    Use this feature to add a new site or device to your approved list of devices. You can also give access to this new device to other users.
                                </div>

                                <form action="javascript:void(0);">
                                    <div class="row" style="margin: 0 4px;">
                                        <!-- Name input -->
                                        <div class="col-auto" style="padding: 0;">
                                            <input placeholder="Enter device name" type="text" class="ui-input-dark device-name-input" style="font-size: 16px;width: 100%;padding: 2px 5px;font-weight: 400;border-bottom: 1px solid #329E5E !important; color: #222;"/>
                                        </div>
                                    </div>
                                    <div class="row" style="margin: 0 4px; width: 100%;">
                                        <div class="col-auto" style="padding: 0;">
                                            <button type="submit" class="ui-btn-1 shadow add-site-button ui-disabled" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 20px;font-size: 13px;">Add</button>
                                        </div>
                                        <div class="col-auto" style="padding: 0;">
                                            <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #404040;border-radius: 20px;font-size: 13px;">Close</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="row hidden" data-step="success">
                            <div class="col">

                                <div style="font-size: 0.8rem;padding: 10px 18px;text-align: center;">
                                    <i class="far fa-check-circle" style="color: green;font-size: 49px;opacity: 0.78;"></i>
                                    <p style="font-size: 13px;margin-top: 8px;margin-bottom: 8px;">The site was successfully created.</p>
                                    <p style="font-size: 13px;margin-top: 8px;margin-bottom: 8px;">Now, you can add the site's configuration information by clicking the button below.</p>
                                </div>

                                <div class="row" style="margin: 0 4px; width: 100%;">
                                    <div class="col-auto hidden" style="padding: 0;">
                                        <button type="submit" class="ui-btn-1 shadow add-site-button ui-disabled" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 20px;font-size: 13px;">Add</button>
                                    </div>
                                    <div class="col-auto" style="padding: 0;">
                                        <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #404040;border-radius: 20px;font-size: 13px;">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                */}),
                title: "Add a site",
                subtitle: "Add a new site/device to your user account",
                on_load: function () {

                },
                listeners: function (ui) {
                    $(ui).find("[data-step='form']").find(".add-site-button").off("click").click(function () {
                        $.ajax({
                            url: self.f.url({ path: "/sites/site/create" }), 
                            method: 'POST',
                            data: JSON.stringify({
                                "site-id": $(ui).find("[data-step='form']").find(".device-name-input").val(),
                                "email": self.ls.getItem("login/email")
                            }),
                            success: function(response) {
                                $(ui).find("[data-step='form']").addClass("hidden");
                                $(ui).find("[data-step='success']").removeClass("hidden");
                                console.log(response);
                
                            },
                            error: function (request, textStatus, errorThrown) { }
                        });
                    });

                    $(ui).find("[data-step='form']").find(".device-name-input").off("keyup").keyup(function () {
                        if ($(ui).find("[data-step='form']").find(".device-name-input").val().trim().length > 0) $(ui).find("[data-step='form']").find(".add-site-button").removeClass("ui-disabled");
                        else $(ui).find("[data-step='form']").find(".add-site-button").addClass("ui-disabled");
                    });
                }
            });
            
        });
    }

}
