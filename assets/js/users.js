window.globals.apps["users"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function (callback) {

        $(".show-hide-config-button").off("click").click(function () {
            
            var html = multiline(function () {/*

                <div class="shadow-light config-editor-header" style="padding: 4px 10px;background: #c8dfde;margin-bottom: 16px;">
                    <p style="margin-bottom: 5px;">Use the following editor to customize the dashboard for the selected device. Please use caution while making changes. Please read the documentation before you fiddle with any configuration.</p>
                    <div class="update-config-button shadow" style="cursor: pointer;margin-bottom: 6px;background: #14440e;border: 0px solid #EEE;color: #EEE;padding: 6px 12px;width: fit-content;">
                        Update
                    </div>
                </div>

                <div class="site-config-div scrollbar-style" style="position: relative;height: -webkit-fill-available;overflow-y: auto;overflow-x: hidden;border: 2px solid #dddddd;">

                    <div class="row shadow-light" style="">
                        <textarea class="codemirror-textarea"></textarea>
                    </div>
                </div>
            */});

            window.globals.accessors["htmlslidein"].open({
                html: html,
                css: {
                    "height": "90vh",
                    "max-width": "90vw",
                    "indentUnit": "4",
                    "indentWithTabs": true,
                    "lineWrapping": true,
                    "hasFocus": true,
                    "spellcheck": false,
                    "noHScroll": true
                },
                on_load: function () {
                    window.globals.variables["configeditor"] = CodeMirror.fromTextArea($(".codemirror-textarea")[0], {
                        mode: { name: "javascript", json: true },
                        lineNumbers: true,
                        lineWrapping: true,
                        lint: true,
                        autoIndent: true,
                        extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
                        foldGutter: true,
                        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                        foldOptions: {
                            widget: (from, to) => {
                                var count = undefined;
                                var editor = window.globals.variables["configeditor"];

                                // Get open / close token
                                var startToken = '{', endToken = '}';
                                var prevLine = editor.getLine(from.line);
                                if (prevLine.lastIndexOf('[') > prevLine.lastIndexOf('{')) {
                                    startToken = '[', endToken = ']';
                                }

                                // Get json content
                                var internal = editor.getRange(from, to);
                                var toParse = startToken + internal + endToken;

                                // Get key count
                                try {
                                    var parsed = JSON.parse(toParse);
                                    count = Object.keys(parsed).length;
                                } catch (e) { }

                                // return count ? `\u21A4${count}\u21A6` : '\u2194';
                                return " --- "
                            },
                        }
                    });

                    resize ();
                    $(window).resize(self.f.debounce(function () {
                        resize ();
                    }, 100));

                    $(".CodeMirror-hscrollbar").addClass("scrollbar-style-horizontal");

                    function resize () {
                        // Set height of the editor
                        var height = $(".html-slidein-ui .html-placeholder").height() - $(".config-editor-header").height() - 30;
                        $(".site-config-div").height(height);
                        window.globals.variables["configeditor"].setSize("100%", "100%");
                    }
                    
                    // Get site's data
                    var site = window.globals.data["site"];
                    
                    // Set the site config json to the editor
                    if(self.ls.getItem("login/state") == "true") window.globals.variables["configeditor"].setValue(JSON.stringify(site, null, "\t"));
                },
                on_close: function (ui, popup) {
                    Mousetrap.bind('command+s', 'ctrl+s');
                },
                listeners: function (ui, popup) {
                    
                    Mousetrap.bind(['command+s', 'ctrl+s'], function(e) {
                        e.preventDefault();
                        $(".update-config-button").click();
                        return false;
                    });

                    $(".update-config-button").off("click").click(function () {

                        try {
                            var parseddata = JSON.parse(window.globals.variables["configeditor"].getValue());

                            // Update device config
                            $.ajax({
                                url: window.globals.constants.api + "/gatorbyte/sites/site/update",
                                method: "post",
                                data: JSON.stringify({
                                    "timestamp": new Date().getTime(),
                                    "data": parseddata,
                                    "device-id": window.globals.constants["device"]["id"]
                                }),
                                success: function (response) {
                                    if (response.status == "success") self.f.create_notification("success", "Changes successfully applied.", "sunset");
                                },
                                error: function (x, h, r) {
                                    self.f.create_notification("error", "Some error encountered. Please try again.", "mint");
                                }
                            });
                        }
                        catch (e) {
                            self.f.create_notification("error", "There was an error parsing the data.", "mint");

                        }
                    });
                }
            });
        });

        $(".settings-menu-row .logout-button").off("click").click(function () {

            if(self.ls.getItem("login/state") == "true") {
                self.ls.removeItem("login/state");
                self.ls.removeItem("login/email");
                self.ls.removeItem("login/timestamp");

                self.get_login_state();

                $(this).find(".text").text("Login");
            }
            else {
                self.open_login_dialog();
            }

        });

        self.get_login_state(callback);

        return self;
    }

    self.open_login_dialog = function () {
        
        var html = multiline(function () {/*
            <div class="member-login-form-div">
                <div step="1"> 
                    <form action="javascript:void(0);" style="padding: 0 14px; margin-bottom: 4px;">

                        <!-- Member email input -->
                        <p style="color: coral; font-weight: 200; margin-bottom: 2px;">Email</p>
                        <div class="row" style="margin: -4px 4px 10px 4px;">
                            <div class="col-auto" style="padding: 0;">
                                <input placeholder="albert.gator@ufl.edu" type="email" class="ui-input-dark member-login-email" style="font-size: 16px;width: 100%;padding: 2px 5px;font-weight: 400;border-bottom: 1px solid #329E5E !important; color: #222;"/>
                            </div>
                        </div>

                        <!-- Member password input -->
                        <p style="color: coral; font-weight: 200; margin-bottom: 2px;">Password</p>
                        <div class="row" style="margin: -4px 4px 10px 4px;">
                            <div class="col-auto" style="padding: 0;">
                                <input type="password" class="ui-input-dark member-login-password" style="font-size: 16px;width: 100%;padding: 2px 5px;font-weight: 400;border-bottom: 1px solid #329E5E !important; color: #222;"/>
                            </div>
                        </div>
                    
                        <!-- Buttons -->
                        <div class="row" style="margin: 0 4px; width: 100%;">
                            <div class="col-auto" style="padding: 0;">
                                <button type="submit" class="ui-btn-1 shadow member-login-verify-button ui-disabled" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 20px;font-size: 13px;">Verify</button>
                            </div>
                            <div class="col-auto" style="padding: 0;">
                                <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 20px;font-size: 13px;">Close</button>
                            </div>
                        </div>
                    </form>
                </div>

                <div step="2" class="hidden"> 
                    <div class="row" style="margin: 0 4px; width: 100%;">
                        <div class="col-12" style="padding: 0;">
                            <span style="color: #329E5E; font-weight: bold;">Your identity has been verified.</span>
                        </div>
                        <div class="col-12" style="padding: 0; margin-top: 10px;">
                            You can now send control commands to devices associated with your account and configure other operational parameters.
                        </div>
                    </div>
                    <div class="row" style="margin: 0 4px; width: 100%;">
                        <div class="col-auto" style="padding: 0;">
                            <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: 10px 6px 6px 6px;background: #329E5E;border-radius: 20px;font-size: 13px;">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        */});

        popup().open({
            html: html,
            title: "Login",
            subtitle: "Please enter your credentials to continue",
            theme: "light",
            on_load: function () {

            },
            listeners: function (ui, popup) {
                
                /* Custom listeners/ui functions */
                $(".member-login-form-div .member-login-email").off("keyup").keyup(self.f.debounce(function () {
                    if($(this).val().trim().length == 0 || !self.f.validate_email($(this).val().trim()) || $(".member-login-form-div .member-login-password").val().trim().length == 0) {
                        $(".member-login-form-div .member-login-verify-button").addClass("ui-disabled");
                    } 
                    else {
                        $(".member-login-form-div .member-login-verify-button").removeClass("ui-disabled");
                    }
                }, 300));

                $(".member-login-form-div .member-login-password").off("keyup").keyup(self.f.debounce(function () {
                    if($(".member-login-form-div .member-login-password").val().trim().length == 0) {
                        $(".member-login-form-div .member-login-verify-button").addClass("ui-disabled");
                    } 
                    else {
                        $(".member-login-form-div .member-login-verify-button").removeClass("ui-disabled");
                    }
                }, 300));
                
                //! Verify email and password
                $(".member-login-form-div .member-login-verify-button").off("click").click(function () {
                    self.verify_user({
                        email: $(".member-login-form-div .member-login-email").val(),
                        password: $(".member-login-form-div .member-login-password").val(),
                        callback: function () {
                            var height = $(".member-login-form-div div[step='1']").height(), width = $(".member-login-form-div div[step='1']").width();
                            $(".member-login-form-div div[step='2']").width(width);

                            $(".member-login-form-div div[step='1']").addClass("hidden");
                            $(".member-login-form-div div[step='2']").removeClass("hidden");
                            $(".settings-menu-row .logout-button").find(".text").text("Logout");

                            popup.subtitle("Login successful");
                        }
                    });
                    
                });
            }
        });
    }

    self.verify_user = function (args) {
        if (!args.email || !args.password) return;
        var email = args.email.trim().toLowerCase();
        var password = args.password.trim().toLowerCase();

        // Verify OTP on the server
        $.ajax({
            url: window.globals.constants.api + "/users/verify",
            method: "post",
            data: JSON.stringify({
                "email": email,
                "password": password,
                "timestamp": new Date().getTime()
            }),
            success: function (response) {

                // If verified
                self.ls.setItem("user/data", JSON.stringify(response.payload));
                self.ls.setItem("login/state", "true");
                self.ls.setItem("login/email", email);
                self.ls.setItem("login/password", password);
                self.ls.setItem("login/name", response.payload["NAME"]);
                self.ls.setItem("login/position", response.payload["POSITION"]);
                self.ls.setItem("login/role", response.payload["ROLE"]);
                self.ls.setItem("login/uuid", response.payload["UUID"]);
                self.ls.setItem("login/timestamp", new Date().getTime());

                // Get/update login state
                self.get_login_state();

                if (args.callback && typeof args.callback ==  "function") args.callback();
            },
            error: function (x, h, r) {
                self.f.create_notification("error", x.responseJSON.status, "mint");
                self.ls.removeItem("login/state");
                self.ls.removeItem("login/email");
                self.ls.removeItem("login/timestamp");
                self.ls.removeItem("login/password");
                self.ls.removeItem("login/position");
                self.ls.removeItem("login/role");
                self.ls.removeItem("login/uuid");
            }
        });
    }

    // TODO: Move this to sites.json
    // TODO: Deprecate
    self.get_sites = function (callback) {
        $.ajax({
            url: window.globals.constants.api + "/users/sites/get",
            method: "post",
            data: JSON.stringify({
                "email": self.ls.getItem("login/email"),
                "password": self.ls.getItem("login/password"),
                "timestamp": new Date().getTime(),
            }),
            success: function (response) {

                if (response.status == "success") {
                    
                    // If user is authorized to view at least one site
                    if (response.payload.length > 0) {

                        // Set global data variable
                        window.globals.data["devices"] = response.payload;

                        // Reset sites list
                        $("#device-selector").html("<option value=''></option>");
                        
                        // If at least one site is available
                        if (window.globals.data["devices"].length > 0) {
            
                            // Add sites to sites selector dropdown
                            window.globals.data["devices"].forEach(function (site, index) {
                                if (!site["SITE-ID"]) return;

                                $(".device-menu .device-list").append(multiline (function () {/* 
                                    <div class="device-list-item" site-id="{{device-name}}" site-type="{{device-type}}">{{device-name}}</div>
                                */}, {
                                    "device-name": site["SITE-ID"],
                                    "device-type": site["SITE-TYPE"]
                                }))

                                // TODO: Replace the option's text to LOCATION-NAME
                                $("#device-selector").append('<option site-id="' + site["SITE-ID"] + '" site-type="' + site["SITE-TYPE"] + '">' + site["SITE-ID"] + '</option>');
                            });
            
                            //TODO: Get saved site from localStorage and load it
                            $(".notification-parent-ui .no-site-selected-notification").removeClass("hidden");
                            
                            // When user selects a site/device
                            $("#device-selector").change(function() {
                                site_dropdown_selected($("#device-selector").find("option:selected").attr("site-id"), $("#device-selector").find("option:selected").attr("site-type"));
                            });
                            
                            // If site requested in the URL
                            if (globals.data["url-params"].has("d")) {
                                $("#device-selector").find("option[site-id='" + globals.data["url-params"].get("d") + "']").prop("selected", true);
                                site_dropdown_selected(globals.data["url-params"].get("d"));
                                $(".project-device-selector-button .selected-device-name").html(globals.data["url-params"].get("d"));
                            }
                            
                            function site_dropdown_selected(siteid, sitetype) {

                                sitetype = "gatorbyte";

                                // Set selected site to localStorage
                                self.ls.setItem("site", siteid);

                                // Leave room of old device/site
                                window.globals.accessors["socket"].publish({
                                    action: "room/leave",
                                    payload: window.globals.constants["device"]["id"]
                                });

                                // Set device id
                                window.globals.constants["device"]["id"] = siteid;
                                
                                // Set device type
                                window.globals.constants["device"]["type"] = sitetype;
            
                                // Call on_site_selected function
                                window.globals.accessors["sites"].on_site_selected(callback);

                                //TODO: Move this for here.
                                //  Recreate chart
                                let chart = $("#chart-container").highcharts();
                                while(chart && chart.series.length > 0) chart.series[0].remove(true);
                            }
                        }
                        else console.error("No available devices.");
                    }

                    // TODO: Finish this
                    else { }

                }

            },
            error: function (x, h, r) {
                self.f.create_notification("error", x.responseJSON.status, "mint");
            }
        });
    }

    self.get_login_state = function (callback) {

        // If the user is already logged in
        if(self.ls.getItem("login/state") == "true") {

            self.on_login_verified(JSON.parse(self.ls.getItem("user/data")));

            // Set global variable data
            window.globals.data["user"][self.ls.functions.hash("email")] = self.ls.functions.encrypt(self.ls.getItem("login/email"));
            window.globals.data["user"][self.ls.functions.hash("password")] = self.ls.functions.encrypt(self.ls.getItem("login/password"));
            window.globals.data["user"][self.ls.functions.hash("role")] = self.ls.functions.encrypt(self.ls.getItem("login/role"));
            window.globals.data["user"][self.ls.functions.hash("position")] = self.ls.functions.encrypt(self.ls.getItem("login/position"));
            window.globals.data["user"][self.ls.functions.hash("id")] = self.ls.functions.encrypt(self.ls.getItem("login/uuid"));
            
            // Get projects for the user
            window.globals.accessors["projects"].get_all_projects(callback);

        }

        // If the user in not logged in on the device
        else {
            
            window.globals.data["user"][self.ls.functions.hash("email")] = null;
            window.globals.data["user"][self.ls.functions.hash("password")] = null;
            window.globals.data["user"][self.ls.functions.hash("role")] = null;
            window.globals.data["user"][self.ls.functions.hash("position")] = null;
            window.globals.data["user"][self.ls.functions.hash("id")] = null;
            
            self.on_logout();
        }
    }

    self.on_login_verified = function (data) {

        $(".notification-parent-ui .no-login-notification").addClass("hidden");
        $(".settings-menu-row .logout-button").find(".text").text("Logout");
        $(".dashboard-ui").removeClass("hidden");
        $(".project-device-selector-button, .show-hide-config-button, add-project-button").removeClass("ui-disabled");
        $(".header-menu-row .member-info-div").removeClass("hidden");

        $(".member-info-div").find(".user-name-text").text(data.NAME);
        $(".member-info-div").find(".user-email-text").text(data.EMAIL);
        // $(".member-info-div").find(".user-position-text").text(data.POSITION);
        // $(".member-info-div").find(".user-role-text").text(data.ROLE);
        $(".member-info-div").find(".user-position-text").text("v4.1");
        $(".member-info-div").find(".user-role-text").text("Updated: Dec 2023");
        
        $(".dashboard-ui").removeClass("hidden");
    }

    self.on_logout = function () {
                    
        $(".notification-parent-ui .no-login-notification").removeClass("hidden");
        $(".notification-parent-ui .no-site-selected-notification").addClass("hidden");
        $(".settings-menu-row .logout-button").find(".text").text("Login");
        $(".dashboard-ui").addClass("hidden");
        $(".project-device-selector-button, .show-hide-config-button, add-project-button").addClass("ui-disabled");
        
        $(".header-menu-row .member-info-div").removeClass("hidden");
        $(".member-info-div").find(".user-name-text").text("guest");
        $(".member-info-div").find(".user-email-text").text("GatorByte dashboard");
        $(".member-info-div").find(".user-position-text").text("v4.1");
        $(".member-info-div").find(".user-role-text").text("Updated: Dec 2023");
        
        $(".dashboard-ui").addClass("hidden");
    }
}