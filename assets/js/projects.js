window.globals.apps["projects"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function (callback) {
        self.listeners();

        return self;
    }

    self.get_all_projects = function(callback) {
        
        $.ajax({
            url: self.f.url({ path: "/projects/get/all" }), 
            method: 'POST',
            data: JSON.stringify({
                "email": self.ls.functions.decrypt(window.globals.data["user"][self.ls.functions.hash("email")]),
                "user-email": JSON.parse(self.ls.getItem("user/data")).EMAIL,
                "user-id": JSON.parse(self.ls.getItem("user/data")).UUID
            }),
            success: function(response) {

                var allprojects = response.payload.projects;
                var accessibleprojects = response.payload.access;

                window.globals.data["all-projects"] = allprojects;
                window.globals.data["accessible-projects"] = accessibleprojects;

                accessibleprojects.forEach(function (accessrow, ari) {
                    var projectuuid = accessrow["PROJECTUUID"];
                    var projectdata = self.f.grep(allprojects, "UUID", projectuuid, true);

                    $(".device-menu .projects-list").append(multiline (function () {/* 
                        <div class="col-auto projects-list-item ui-truncate" data-b64="{{data-b64}}" project-uuid="{{project-uuid}}" project-role="{{project-role}}" project-id="{{project-id}}" project-name="{{project-name}}">
                            {{project-name}}
                        </div>
                    */},
                    {
                        "data-b64": self.f.json_to_b64(projectdata),
                        "project-name": projectdata["NAME"],
                        "project-role": accessrow["ROLE"],
                        "project-id": projectdata["ID"],
                        "project-uuid": projectdata["UUID"]
                    }));
                });

                // Get list of sites for the user
                window.globals.accessors["sites"].get_all_devices(function (sitesdata) {
                    var alldevices = sitesdata.devices;
                    var accessibledevices = sitesdata.access;

                    window.globals.data["accessible-devices"] = accessibledevices;
                    window.globals.data["all-devices"] = [];
                    accessibledevices.forEach(function (accessrow, ari) {
                        var deviceuuid = accessrow["DEVICEUUID"];
                        var devicedata = self.f.grep(alldevices, "UUID", deviceuuid, true);
                        window.globals.data["all-devices"].push(devicedata);
                    });
                    
                    // Project click listener
                    $(".device-menu .projects-list").find(".projects-list-item").off("click").on("click", function () {
                        
                        $(".projects-list .projects-list-item").removeClass("selected");
                        $(this).addClass("selected");
                        $(".devices-list").find(".project-not-selected-notification").addClass("hidden");

                        var that = this;
                        $(".devices-list .devices-list-item").remove();
                        var data = self.f.b64_to_json($(that).attr("data-b64"));
                        var projectid = $(that).attr("project-id");
                        var projectname = $(that).attr("project-name");
                        var projectuuid = $(that).attr("project-uuid");
                        var projectrole = $(that).attr("project-role");

                        // Persist to storage
                        self.ls.setItem("state/project/uuid", projectuuid);
                        self.ls.setItem("state/project/id", projectid);
                        self.ls.setItem("state/project/name", projectname);
                        self.ls.setItem("state/project/role", projectrole);

                        if (accessibledevices.length == 0) {
                            $(".devices-list").find(".empty-notification").removeClass("hidden");
                        }
                        else {
                            $(".devices-list").find(".empty-notification").addClass("hidden");

                            accessibledevices.forEach(function (accessrow, ari) {
                                var deviceuuid = accessrow["DEVICEUUID"];
                                var devicedata = self.f.grep(alldevices, "UUID", deviceuuid, true);
                                
                                if (devicedata["PROJECTUUID"] != projectuuid) return;
                                
                                $(".devices-list").removeClass("hidden");
                                $(".devices-list").append(multiline (function () {/* 
                                    <div class="col-auto devices-list-item ui-truncate" project-id="{{project-id}}" device-uuid="{{device-uuid}}" device-sn="{{device-sn}}" device-id="{{device-id}}" device-name="{{device-name}}" device-role="{{device-role}}">
                                        {{device-name}}
                                    </div>
                                */},
                                {
                                    "project-id": projectid,
                                    "project-uuid": projectuuid,
                                    "device-name": devicedata["NAME"],
                                    "device-role": accessrow["ROLE"],
                                    "device-id": devicedata["NAME"],
                                    "device-sn": devicedata["SN"],
                                    "device-uuid": devicedata["UUID"]
                                }));

                                $(".devices-list .devices-list-item").off("click").click(function (e) {
                                    var devicetype = "gatorbyte";
                                    var projectid = $(this).attr("project-id");
                                    var deviceid = $(this).attr("device-id");
                                    var deviceuuid = $(this).attr("device-uuid");
                                    var devicesn = $(this).attr("device-sn");
                                    var devicename = $(this).attr("device-name");
                                    var devicerole = $(this).attr("device-role");

                                    if (!devicesn) console.log("Device's SN is not set.");

                                    // Show loader
                                    $(".loader-parent").removeClass("hidden");
        
                                    $(".project-device-selector-button .selected-device-name").html(devicename);
                                    
                                    self.f.set_state("?p=" + projectid + "&d=" + deviceid);
        
                                    $(".devices-list .devices-list-item").removeClass("selected");
                                    $(this).addClass("selected");

                                    // Hide the  menu
                                    var $devicesBtn = $(".project-device-selector-button");
                                    var $deviceMenu = $(".project-device-selector-menu");
                                    $deviceMenu.hide();
                                    $(".section-heading").css("filter", "blur(0px)").css("pointer-events", "auto");
                                    $(".section-parent").css("filter", "blur(0px)").css("pointer-events", "auto");
        
                                    // Leave room of the OLD device
                                    if (self.ls.getItem("state/device/sn")) {
                                        window.globals.accessors["socket"].publish({
                                            action: "room/leave",
                                            payload: self.ls.getItem("state/device/sn")
                                        });
                                    }
        
                                    // Set selected device to localStorage
                                    self.ls.setItem("state/device/id", deviceid);
                                    self.ls.setItem("state/device/uuid", deviceuuid);
                                    self.ls.setItem("state/device/sn", devicesn);
                                    self.ls.setItem("state/device/name", devicename);
                                    self.ls.setItem("state/device/role", devicerole);

                                    // Set device id
                                    window.globals.constants["device"]["id"] = devicename;
                                    window.globals.constants["device"]["name"] = devicename;
                                    window.globals.constants["device"]["uuid"] = deviceuuid;
                                    window.globals.constants["device"]["type"] = devicetype;
                                    window.globals.constants["device"]["sn"] = devicesn;
                
                                    // Reset last update timestamp display
                                    $(".data-summary-fields-list .last-update-timestamp").removeAttr("title").html(multiline (function () {/* 
                                        <div class="status-circle {{colorclass}}"></div>
                                        <div>{{timestamp}}</div>
                                    */}, {
                                        "timestamp": "Unknown",
                                        "colorclass": ""
                                    }));
                                    
                                    // Call on_device_selected function
                                    window.globals.accessors["sites"].on_site_selected(callback);
        
                                    //  Recreate chart
                                    let chart = $("#chart-container").highcharts();
                                    while(chart && chart.series.length > 0) chart.series[0].remove(true);

                                    // Get site config data
                                    window.globals.accessors["sites"].get_site_config_data(deviceid, function() {
                                        var devicedata = window.globals.data["device"];
                                        console.log(devicedata);

                                        // $(".sites-list").addClass("hidden");
                                        // $(".sites-info").removeClass("hidden");
                                        // $(".sites-info .site-name").text(sitename);
                                        // $(".sites-info .site-id").text(siteid);
                                        // $(".sites-info .site-address").text(sitedata["ADDRESS"]["LOCATION"]);
                                        // $(".sites-info .site-installed-on-date").text(sitedata["INSTALLED-ON"]);
                                    })
                                });
            
                            });
                        }

                        return;
                    });

                    // If site requested in the URL
                    if (globals.data["url-params"].has("p") || globals.data["url-params"].has("d")) {
                        
                        if (!globals.data["url-params"].has("p")) {
                            self.f.create_notification("error", "Please provide the project identifier in the URL.", "mint");
                            return;
                        }
                        
                        if (!globals.data["url-params"].has("d")) {
                            self.f.create_notification("error", "Please provide the device identifier in the URL.", "mint");
                            return;
                        }

                        var deviceid = globals.data["url-params"].get("d");
                        var devicename = globals.data["url-params"].get("d");
                        var projectid = globals.data["url-params"].get("p");
                        var devicetype = "gatorbyte";

                        var projectdata = self.f.grep(allprojects, "ID", projectid, true);
                        var peojectaccessdata = self.f.grep(accessibleprojects, "PROJECTUUID", projectdata["UUID"], true);
                        var devicedata = self.f.grep(self.f.grep(alldevices, "NAME", devicename), "PROJECTUUID", projectdata["UUID"], true);

                        if (!projectdata) {
                            self.f.create_notification("error", "The project (" + projectid + ") does not exist. Please recheck the URL.", "mint");
                            return;
                        }

                        if (!devicedata) {
                            self.f.create_notification("error", "The device (" + deviceid + ") does not exist. Please recheck the URL.", "mint");
                            return;
                        }

                        var deviceaccessdata = self.f.grep(accessibledevices, "DEVICEUUID", devicedata["UUID"], true);
                        if (!deviceaccessdata) {
                            self.f.create_notification("error", "You do not have access to this device's data.", "mint");
                            return;
                        }

                        $(".project-device-selector-button .selected-device-name").html(deviceid);
                        
                        // Persist to storage
                        self.ls.setItem("state/project/uuid", projectdata["UUID"]);
                        self.ls.setItem("state/project/id", projectid);
                        self.ls.setItem("state/project/name", projectdata["NAME"]);
                        self.ls.setItem("state/project/role", peojectaccessdata["ROLE"]);

                        // Set selected device to localStorage
                        self.ls.setItem("state/device/id", deviceid);
                        self.ls.setItem("state/device/uuid", devicedata["UUID"]);
                        self.ls.setItem("state/device/name", devicedata["NAME"]);
                        self.ls.setItem("state/device/sn", devicedata["SN"]);
                        self.ls.setItem("state/device/role", deviceaccessdata["ROLE"]);

                        // Set device id
                        window.globals.constants["device"]["id"] = devicename;
                        window.globals.constants["device"]["name"] = devicename;
                        // window.globals.constants["device"]["uuid"] = deviceuuid;
                        window.globals.constants["device"]["type"] = devicetype;
    
                        // Reset last update timestamp display
                        $(".data-summary-fields-list .last-update-timestamp").removeAttr("title").html(multiline (function () {/* 
                            <div class="status-circle {{colorclass}}"></div>
                            <div>{{timestamp}}</div>
                        */}, {
                            "timestamp": "Unknown",
                            "colorclass": ""
                        }));

                        // Call on_device_selected function
                        window.globals.accessors["sites"].on_site_selected(callback);
                    }
                });

                // If project name requested in the URL
                if (globals.data["url-params"].has("p")) {
                    setTimeout(() => {
                        $(".device-menu .projects-list .projects-list-item[project-id='" + globals.data["url-params"].get("p") + "']").click();
                    }, 10);
                }

                // // Set global data variable
                // window.globals.data["site"] = site;
                // if (callback && typeof callback == "function") callback(window.globals.data["site"]);

            },
            error: function (request, textStatus, errorThrown) { }
        });
    }

    self.get_site_data = function(site_id, callback) {
        if (!site_id) return;

        $.ajax({
            url: self.f.url({ path: "/sites/site/get" }), 
            method: 'POST',
            data: JSON.stringify({
                "site-id": site_id
            }),
            success: function(site) {

                // Set global data variable
                window.globals.data["site"] = site;
                if (callback && typeof callback == "function") callback(window.globals.data["site"]);

            },
            error: function (request, textStatus, errorThrown) { }
        });
    }

    self.listeners = function () {

        // Add a project button listener
        $(".add-project-button").off("click").click(function () {
            self.show_add_projects_modal();
        });

        // Manage projects button listener
        $(".manage-projects-button").off("click").click(function () {
            self.show_manage_projects_modal();
        });

        // Add a site button listener
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

    self.show_locator = function () {

        if(!window.globals.variables["gpsmap"]) window.globals.variables["gpslocatormap"] = L.map("locator-map-container", { attributionControl: false, gestureHandling: true });
            self.locatormap = window.globals.variables["gpslocatormap"];
            self.locatormap.setView(new L.LatLng(29.5627032,-82.2923514), 11);

            var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            osmLayer = new L.TileLayer(osmUrl, {maxZoom: 18});
            self.locatormap.setView(new L.LatLng(29.5627032,-82.2923514), 11);
            self.locatormap.addLayer(osmLayer);

            self.locatormap.zoomControl.setPosition('topright');
            global.markersLayer = L.layerGroup().addTo(self.locatormap);
            setInterval(function () {
                try { self.locatormap.invalidateSize(); } catch (e) {}
            }, 1000);
    }

    self.show_add_projects_modal = function (ui) {
        popup().open({
            html: multiline(function () {/* 
                <div class="row" data-step="form">
                    <div class="col">

                        <form action="javascript:void(0);" style="margin-bottom: 0;">
                            <div class="row" style="margin: 0 4px;">

                                <!-- Name input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Project name</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter the name of the project. You can enter the full name or an abbreviation. <span style="font-weight: bold;">Min. length is 3 while max. length is 15 characters.</span></p> 
                                    <input placeholder="UWRE, Lake Roussou, et cetera" type="text" class="ui-input-dark project-name-input" style=""/>
                                </div>

                                <!-- ID input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Project ID</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter an identifier for the project. Please replace spaces with a hyphen. <span style="font-weight: bold;">Min. length is 3 while max. length is 6 characters.</span></p> 
                                    <input placeholder="uwre, irrec, sasbjep, et cetera" type="text" class="ui-input-dark project-id-input" style=""/>
                                </div>

                                <!-- Project PI input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">PI</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter the name of the project's Principal Investigator.</p> 
                                    <input placeholder="Aberta Gator" type="text" class="ui-input-dark pi-name-input" style=""/>
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
            title: "New project",
            subtitle: "Use this to create a new project",
            theme: "light",
            on_load: function () {

            },
            listeners: function (ui) {
                $(ui).find(".add-another-button").off("click").click(function () {
                    $(ui).find("[data-step='form']").removeClass("hidden");
                    $(ui).find("[data-step='success']").addClass("hidden");
                });

                $(ui).find("[data-step='form']").find(".add-button").off("click").click(function () {
                    console.log($(ui).find("[data-step='form']").find(".project-name-input"));
                    var projectname = $(ui).find("[data-step='form']").find(".project-name-input").val().trim();
                    var projectid = $(ui).find("[data-step='form']").find(".project-id-input").val().trim().replace(/\s/g, "-").toLowerCase();
                    var piname = $(ui).find("[data-step='form']").find(".pi-name-input").val().trim();

                    if (projectname.length < 3 || projectname.length > 15) {
                        self.f.create_notification("error", "The project name should be between 3 and 15 characters.", "mint");
                        return;
                    }

                    if (projectid.length < 3 || projectid.length > 6) {
                        self.f.create_notification("error", "The project id should be between 3 and 6 characters.", "mint");
                        return;
                    }

                    $.ajax({
                        url: self.f.url({ path: "/projects/project/create" }), 
                        method: 'POST',
                        data: JSON.stringify({
                            "project-name": projectname,
                            "project-id": projectid,
                            "pi-name": piname,
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
    }

    self.show_manage_projects_modal = function (ui) {
        popup().open({
            html: multiline(function () {/* 
                <div class="row" data-step="form">
                    <div class="col">

                        <form action="javascript:void(0);" style="margin-bottom: 0;">
                            <div class="row" style="margin: 0 4px;">

                                <!-- Name input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Project name</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter the name of the project. You can enter the full name or an abbreviation. <span style="font-weight: bold;">Min. length is 3 while max. length is 15 characters.</span></p> 
                                    <input placeholder="UWRE, Lake Roussou, et cetera" type="text" class="ui-input-dark project-name-input" style=""/>
                                </div>

                                <!-- ID input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Project ID</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter an identifier for the project. Please replace spaces with a hyphen. <span style="font-weight: bold;">Min. length is 3 while max. length is 6 characters.</span></p> 
                                    <input placeholder="uwre, irrec, sasbjep, et cetera" type="text" class="ui-input-dark project-id-input" style=""/>
                                </div>

                                <!-- Project PI input -->
                                <div class="col-12" style="background: #22222222;border-radius: 2px;padding: 12px 10px; margin: 6px 0;">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">PI</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Enter the name of the project's Principal Investigator.</p> 
                                    <input placeholder="Aberta Gator" type="text" class="ui-input-dark pi-name-input" style=""/>
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
            title: "Manage projects",
            subtitle: "Use this to manage GatorByte projects",
            theme: "dark",
            on_load: function () {

            },
            listeners: function (ui) {
                $(ui).find(".add-another-button").off("click").click(function () {
                    $(ui).find("[data-step='form']").removeClass("hidden");
                    $(ui).find("[data-step='success']").addClass("hidden");
                });

                $(ui).find("[data-step='form']").find(".add-button").off("click").click(function () {
                    console.log($(ui).find("[data-step='form']").find(".project-name-input"));
                    var projectname = $(ui).find("[data-step='form']").find(".project-name-input").val().trim();
                    var projectid = $(ui).find("[data-step='form']").find(".project-id-input").val().trim().replace(/\s/g, "-").toLowerCase();
                    var piname = $(ui).find("[data-step='form']").find(".pi-name-input").val().trim();

                    if (projectname.length < 3 || projectname.length > 15) {
                        self.f.create_notification("error", "The project name should be between 3 and 15 characters.", "mint");
                        return;
                    }

                    if (projectid.length < 3 || projectid.length > 6) {
                        self.f.create_notification("error", "The project id should be between 3 and 6 characters.", "mint");
                        return;
                    }

                    $.ajax({
                        url: self.f.url({ path: "/projects/project/create" }), 
                        method: 'POST',
                        data: JSON.stringify({
                            "project-name": projectname,
                            "project-id": projectid,
                            "pi-name": piname,
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
    }

}
