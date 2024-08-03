window.globals.apps["users"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function (callback) {


        // Add a user button listener
        $(".add-user-button").click(function () {
            self.add_edit_users_button();
        });


        // List users button listener
        $(".list-users-button").click(function () {
            self.manage_users_button();
        });

        // Site configuration button listener
        $(".show-hide-config-button").off("click").click(function () {

            var html = multiline(function () {/*
                <div class="config-editor-header" style="padding: 8px 16px;background: #bebebe; margin: 6px 0px 16px 0px;border-radius: 10px;">
                    <p style="margin-bottom: 5px;">Use the following editor to customize the dashboard for the selected device. Please read the documentation before you fiddle with any configuration.</p>

                    <div style="display: inline-flex;">
                        <div class="update-config-gui-button hidden shadow-light" style="cursor: pointer;margin-bottom: 4px; margin-right: 10px; background: #5e5e5e;border: 0px solid #EEE;color: #EEE;padding: 4px 10px;width: fit-content;border-radius: 2px;">
                            GUI
                        </div>

                        <div class="update-config-button shadow-light" style="cursor: pointer;margin-bottom: 4px; margin-right: 10px; background: #5e5e5e;border: 0px solid #EEE;color: #EEE;padding: 4px 10px;width: fit-content;border-radius: 2px;">
                            Update
                        </div>

                        <div class="modal-close-button shadow-light" style="cursor: pointer;margin-bottom: 4px; margin-right: 10px; background: #6e6e6e;border: 0px solid #EEE;color: #EEE;padding: 4px 10px;width: fit-content;border-radius: 2px;">
                            Close
                        </div>
                    </div>
                </div>

                <div class="site-config-div scrollbar-style" style="position: relative;height: -webkit-fill-available;overflow-y: auto;overflow-x: hidden;border: 1px solid #dddddd; border-radius: 10px;">
                    <div id="config-editor" style="flex-grow: 1;overflow: hidden; display: block;"></div>
                    <textarea class="hidden codemirror-textarea"></textarea>
                </div>
            */});

            window.globals.accessors["htmlslidein"].open({
                html: html,
                css: {
                    "height": "100%",
                    "max-width": "100%",
                    "indentUnit": "4",
                    "indentWithTabs": true,
                    "lineWrapping": true,
                    "hasFocus": true,
                    "spellcheck": false,
                    "noHScroll": true
                },
                on_load: function () {

                    resize();
                    // $(window).resize(self.f.debounce(function () {
                    //     resize();
                    // }, 100));

                    // $(".CodeMirror-hscrollbar").addClass("scrollbar-style-horizontal");

                    function resize() {
                        // Set height of the editor
                        var height = $(".html-slidein-ui .html-placeholder").height() - $(".config-editor-header").height() - 30 - 26;
                        $(".site-config-div").height(height);
                        // window.globals.variables["configeditor"].setSize("100%", "100%");
                        
                        $("#config-editor").css("height", height);
                    }

                    // Get site's data
                    var site = window.globals.data["site"];

                    //! Monaco
                    /*
                        https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html#roundedSelection
                        https://log.schemescape.com/posts/web-development/embedding-monaco-from-cdn.html
                    */
                    require(["vs/editor/editor.main"], function () {
                        monaco.editor.defineTheme("myTheme", {
                            base: "vs",
                            inherit: true,
                            rules: [],
                            colors: {
                                "editor.foreground": "#000000",
                                "editor.background": "#FFFFFFAA",
                                "editorCursor.foreground": "#8B0000",
                                // "editor.lineHighlightBackground": "#0000FF20",
                                "editorLineNumber.foreground": "#AAAAAA",
                                "editor.selectionBackground": "#00008830",
                                "editor.inactiveSelectionBackground": "#88000015",
                            },
                        });
                        monaco.editor.setTheme("myTheme");

                        // Create the editor with some sample JavaScript code
                        window.globals.variables["configeditor"] = monaco.editor.create(document.getElementById("config-editor"), {
                            value: JSON.stringify(site, null, 4),
                            language: "json",
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            readOnly: false,
                            autoIndent: "full",
                            lineNumbersMinChars: 2,
                            minimap: false,
                            lightbulb: true,
                            fontSize: 16,

                        });
                    
                        // Resize the editor when the window size changes
                        const editorElement = document.getElementById("config-editor");
                        window.addEventListener("resize", () => window.globals.variables["configeditor"].layout({
                            width: editorElement.offsetWidth,
                            height: editorElement.offsetHeight
                        }));
                    });

                    // // Set the site config json to the editor
                    // if (self.ls.getItem("login/state") == "true") window.globals.variables["configeditor"].setValue(JSON.stringify(site, null, "\t"));
                },
                on_close: function () {
                    Mousetrap.bind('command+s', 'ctrl+s');
                },
                listeners: function () {

                    Mousetrap.bind(['command+s', 'ctrl+s'], function (e) {
                        e.preventDefault();
                        $(".update-config-button").click();
                        return false;
                    });

                    // Update config on the server
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
                                    "device-sn": self.ls.getItem("state/device/sn"),
                                    "device-id": self.ls.getItem("state/device/id"),
                                    "project-id": self.ls.getItem("state/project/id"),
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

                    // Show update GUI
                    $(".update-config-gui-button").off("click").click(function () {

                        try {
                            var parseddata = JSON.parse(window.globals.variables["configeditor"].getValue());

                            popup().open({
                                "css": {
                                    "body": {
                                        "background-color": "transparent"
                                    },
                                },
                                html: multiline(function () {/*
                                    <div class="member-login-form-div">
                                        <div class="form-parent"> 
                        
                                            <!-- Email input -->
                                            <div class="col-12 panel light">
                                                <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">User's full name</p> 
                                                <p style="font-size: 13px;color: #444;margin-bottom: 0;">Please enter the full name of the user.</p> 
                                                <input placeholder="albert.gator@ufl.edu" type="email" class="ui-input-dark member-login-email" style=""/>
                                            </div>
                                        </div>
                                    </div>
                                */}),
                                title: "Site configuration",
                                subtitle: "Use the following form for editing the configuration for the selected site.",
                                theme: "light",
                                "actionbuttons": [
                                    multiline(function () {/* 
                                        <button class="green member-login-verify-button">Update</button>
                                    */}),
                                    multiline(function () {/* 
                                        <button class="grey modal-close-button">Cancel</button>
                                    */}),
                                ],
                                on_load: function (args) {
                                    var ui = args.ui;
                                    ui.popup.find(".body").removeClass("shadow");

                                    console.log(configschema);
                                    var parentobject;
                                    iterateoverproperties({...configschema.properties});

                                    function iterateoverproperties (object, parentproperty) {
                                        for (var property in object) {
                                            var type = object[property].type;
    
                                            // console.log(property + ": " + type);

                                            
                                            if (type == "object") iterateoverproperties(object[property].properties, property);
                                            if (type == "string") {
                                                ui.body.find(".form-parent").append(multiline(function () {/* 
                                                    <div class="col-12 panel light">
                                                        <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">{{parent}} {{title}}</p> 
                                                        <input placeholder="text input" type="text" class="ui-input-dark {{class-name}}"/>
                                                    </div>
                                                */}, {
                                                    "parent": parentproperty || "",
                                                    "title": object[property].name || property,
                                                    "class-name": "x"
                                                }))
                                            }
                                        }
                                    }
                                },
                                listeners: function (args) {
                                    var ui = args.ui;
                    
                                    ui.body.find(".member-login-form-div .member-login-password").off("keyup").keyup(self.f.debounce(function () {
                                        if (ui.body.find(".member-login-form-div .member-login-password").val().trim().length == 0) {
                                            ui.body.find(".member-login-form-div .member-login-verify-button").addClass("ui-disabled");
                                        }
                                        else {
                                            ui.body.find(".member-login-form-div .member-login-verify-button").removeClass("ui-disabled");
                                        }
                                    }, 300));
                                }
                            });
                        }
                        catch (e) {
                            self.f.create_notification("error", "There was an error parsing the data.", "mint");
                            console.log(e);
                        }
                    });
                } 
            });
        });

        $(".settings-menu-row .logout-button").off("click").click(function () {

            if (self.ls.getItem("login/state") == "true") {
                self.f.create_popup(
                    "Are you sure you want to logout?<br>You will need to log in again to access the dashboard."
                , true, function () {

                    self.ls.removeItem("login/state");
                    self.ls.removeItem("login/email");
                    self.ls.removeItem("login/timestamp");

                    self.get_login_state();

                    $(this).find(".text").text("Login");
                    $(".requires-login").addClass("hidden");
                    $(".project-device-selector-button .selected-device-name").text("No device selected");

                }, function () {});
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

                    <!-- Email input -->
                    <div class="col-12 panel light">
                        <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">User's full name</p> 
                        <p style="font-size: 13px;color: #444;margin-bottom: 0;">Please enter the full name of the user.</p> 
                        <input placeholder="albert.gator@ufl.edu" type="email" class="ui-input-dark member-login-email" style=""/>
                    </div>
                    
                    <!-- Member password input -->
                    <div class="col-12 panel light">
                        <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">User's full name</p> 
                        <p style="font-size: 13px;color: #444;margin-bottom: 0;">Please enter the full name of the user.</p> 
                        <input type="password" class="ui-input-dark member-login-password" style=""/>
                    </div>
                </div>

                <div step="2" class="hidden"> 
                    <div class="row" style="margin: 0 4px; width: 100%;">
                    <div class="col-12 panel light">
                        <p style="color: #329E5E; font-weight: bold;margin-bottom: 0;">Your identity has been verified.</p>
                        <p style="margin-bottom: 0;">You can now send control commands to devices associated with your account and configure other operational parameters.</p>
                    </div>
                </div>
            </div>
        */});

        popup().open({
            "css": {
                "body": {
                    "background-color": "transparent"
                },
            },
            html: html,
            title: "Login",
            subtitle: "Please enter your credentials to continue",
            theme: "light",
            "actionbuttons": [
                multiline(function () {/* 
                    <button class="green member-login-verify-button">Login</button>
                */}),
                multiline(function () {/* 
                    <button class="grey modal-close-button">Cancel</button>
                */}),
            ],
            on_load: function (args) {
                var ui = args.ui;
                ui.popup.find(".body").removeClass("shadow");
            },
            listeners: function (args) {
                var ui = args.ui;

                /* Custom listeners/ui functions */
                ui.body.find(".member-login-form-div .member-login-email").off("keyup").keyup(self.f.debounce(function () {
                    if ($(this).val().trim().length == 0 || !self.f.validate_email($(this).val().trim()) || $(".member-login-form-div .member-login-password").val().trim().length == 0) {
                        ui.body.find(".member-login-form-div .member-login-verify-button").addClass("ui-disabled");
                    }
                    else {
                        ui.body.find(".member-login-form-div .member-login-verify-button").removeClass("ui-disabled");
                    }
                }, 300));

                ui.body.find(".member-login-form-div .member-login-password").off("keyup").keyup(self.f.debounce(function () {
                    if (ui.body.find(".member-login-form-div .member-login-password").val().trim().length == 0) {
                        ui.body.find(".member-login-form-div .member-login-verify-button").addClass("ui-disabled");
                    }
                    else {
                        ui.body.find(".member-login-form-div .member-login-verify-button").removeClass("ui-disabled");
                    }
                }, 300));

                //! Verify email and password
                ui.actionbuttons.find(".member-login-verify-button").off("click").click(function () {

                    self.verify_user({
                        email: ui.body.find(".member-login-email").val(),
                        password: ui.body.find(".member-login-password").val(),
                        callback: function () {
                            var height = ui.body.find(".member-login-form-div div[step='1']").height(), width = ui.body.find(".member-login-form-div div[step='1']").width();
                            ui.body.find(".member-login-form-div div[step='2']").width(width);

                            ui.body.find(".member-login-form-div div[step='1']").addClass("hidden");
                            ui.body.find(".member-login-form-div div[step='2']").removeClass("hidden");
                            ui.body.find(".settings-menu-row .logout-button").find(".text").text("Logout");

                            args.object.popup.subtitle("Login successful");

                            args.function.updateactionbuttons([
                                multiline(function () {/* 
                                    <button class="grey modal-close-button">Cancel</button>
                                */}),
                            ])
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
                self.ls.setItem("login/position", response.payload["POSITION"] || "");
                self.ls.setItem("login/role", response.payload["ROLE"] || "");
                self.ls.setItem("login/uuid", response.payload["UUID"]);
                self.ls.setItem("login/timestamp", new Date().getTime());

                // Get/update login state
                self.get_login_state();

                if (args.callback && typeof args.callback == "function") args.callback();
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

    self.get_login_state = function (callback) {

        // If the user is already logged in
        if (self.ls.getItem("login/state") == "true") {

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
        $(".project-device-selector-button, .show-hide-config-button, add-project-button, .manage-projects-button, .users-menu-button").removeClass("ui-disabled");
        $(".header-menu-row .member-info-div").removeClass("hidden");

        $(".member-info-div").find(".user-name-text").text(data.NAME);
        $(".member-info-div").find(".user-email-text").text(data.EMAIL);
        // $(".member-info-div").find(".user-position-text").text(data.POSITION);
        // $(".member-info-div").find(".user-role-text").text(data.ROLE);
        $(".member-info-div").find(".user-position-text").text("v4.2");
        $(".member-info-div").find(".user-role-text").text("Updated: June 2024");

        $(".dashboard-ui").removeClass("hidden");
    }

    self.on_logout = function () {

        $(".notification-parent-ui .no-login-notification").removeClass("hidden");
        $(".notification-parent-ui .no-site-selected-notification").addClass("hidden");
        $(".project-device-selector-button").removeClass("an-flash");
        $(".settings-menu-row .logout-button").find(".text").text("Login");
        $(".dashboard-ui").addClass("hidden");
        $(".project-device-selector-button, .show-hide-config-button, add-project-button, .manage-projects-button, .users-menu-button").addClass("ui-disabled");

        $(".header-menu-row .member-info-div").removeClass("hidden");
        $(".member-info-div").find(".user-name-text").text("guest");
        $(".member-info-div").find(".user-email-text").text("GatorByte dashboard");
        $(".member-info-div").find(".user-position-text").text("v4.2");
        $(".member-info-div").find(".user-role-text").text("Updated: June 2024");

        $(".dashboard-ui").addClass("hidden");
    }

    self.add_edit_users_button = (editdata) => {

        popup().open({
            "css": {
                "body": {
                    "background-color": "transparent"
                },
                "inject": multiline(() => {/* 

                    .list {
                        display: flex; 
                        flex-wrap: wrap;
                        margin-top: 4px;
                    }

                    .list-item {
                        flex: 0 1 auto; 
                        margin: 0 8px 8px 0; 
                        padding: 0px 10px; 
                        border-radius: 2px; 
                        background: #e9e9e9; 
                        cursor: pointer;
                    }

                    .list-item[role='user'] {
                        background: #b9e79d;
                    }

                    .list-item[role='admin'] {
                        background: #abecf7;
                    }

                    .list-item[role='super'] {
                        background: #e2c1eb;
                    }
                */})
            },
            "html": multiline(function () {/* 
                <div class="row" data-step="form">
                    <div class="col">

                        <form action="javascript:void(0);" style="margin-bottom: 0;">
                            <div class="row" style="margin: 0 4px;">

                                <!-- Name input -->
                                <div class="col-12 panel light">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">User's full name</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Please enter the full name of the user.</p> 
                                    <input placeholder="Albert Gator" validation="non-empty" type="text" class="ui-input-dark name-input" style=""/>
                                    <div class="required-tag"></div>
                                </div>

                                <!-- Email input -->
                                <div class="col-12 panel light">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Email</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">The email will allso be the username for the account.</p> 
                                    <input placeholder="albert.gator@ufl.edu" validation="non-empty" type="text" class="ui-input-dark email-input" style=""/>
                                    <div class="required-tag"></div>
                                </div>

                                <!-- Password input -->
                                <div class="col-12 panel light">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Password</p> 
                                    <input placeholder="carmine-pencil" validation="non-empty" type="text" class="ui-input-dark password-input" style=""/>
                                    <div class="required-tag"></div>
                                </div>

                                <!-- Projects list -->
                                <div class="col-12 panel light">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Projects</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Select the projects the users will have access to.</p> 
                                    <div class="projects-list list">
                                        <div class="empty-notification">No projects exists.</div>
                                    </div>
                                </div>

                                <!-- Devices list -->
                                <div class="col-12 panel light devices-list-parent hidden">
                                    <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Devices</p> 
                                    <p style="font-size: 13px;color: #444;margin-bottom: 0;">Select the devices accessible to this user.</p> 
                                    <div class="devices-list" style="padding: 0px 4px;"></div>
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
            "title": editdata ? "Edit user" : "New user",
            "subtitle": editdata ? "Editing account for " + editdata["NAME"] : "Use this to add a new user",
            "theme": "light",
            "waitforready": editdata ? true : false,
            "on_load": function (args) {
                var ui = args.ui;
                ui.popup.find(".body").removeClass("shadow");

                $(ui).find(".add-another-button").off("click").click(function () {
                    $(ui).find("[data-step='form']").removeClass("hidden");
                    $(ui).find("[data-step='success']").addClass("hidden");
                });

                $(ui).find("[data-step='form']").find(".add-button").off("click").click(function () {
                    var projectname = $(ui).find("[data-step='form']").find(".project-name-input").val().trim();
                    var projectid = $(ui).find("[data-step='form']").find(".project-id-input").val().trim().replace(/\s/g, "-").toLowerCase();
                    var piname = $(ui).find("[data-step='form']").find(".pi-name-input").val().trim();

                    if (projectname.length < 3 || projectname.length < 15) {
                        self.f.create_notification("error", "The project name should be between 3 and 15 characters.", "mint");
                        return;
                    }

                    if (projectid.length < 3 || projectid.length < 6) {
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
                        success: function (response) {
                            $(ui).find("[data-step='form']").addClass("hidden");
                            $(ui).find("[data-step='success']").removeClass("hidden");
                        },
                        error: function (request, textStatus, errorThrown) { }
                    });
                });

                // Populate projects list
                if (window.globals.data["accessible-projects"] && window.globals.data["accessible-projects"].length > 0) {
                    ui.body.find(".projects-list").find(".empty-notification").addClass("hidden");
                    ui.body.find(".projects-list .projects-list-item").remove();
                    
                    window.globals.data["accessible-projects"].forEach(function (projectaccessdata, pi) {

                        // Return if user is not a 'super' or an 'admin'
                        if (projectaccessdata["ROLE"] != "super" && projectaccessdata["ROLE"] != "admin") return;

                        var projectdata = self.f.grep(window.globals.data["all-projects"], "UUID", projectaccessdata["PROJECTUUID"], true);
                        ui.body.find(".projects-list").append(multiline(function () {/* 
                            <div class="projects-list-item list-item" project-uuid="{{project.uuid}}" data-b64="{{data-b64}}" style="font-size: 12px; padding: 4px 10px;">{{project.name}}</div>
                        */}, {
                            "project": {
                                "uuid": projectaccessdata["PROJECTUUID"],
                                "name": projectdata["NAME"]
                            },
                            "data-b64": self.f.json_to_b64(projectaccessdata)
                        }));
                    });
                }
                else {
                    ui.body.find(".projects-list").find(".empty-notification").removeClass("hidden");
                }

                // If edit mode is requested
                if (editdata != undefined) {

                    ui.body.attr("user-uuid", editdata["UUID"]);
                    ui.body.find(".name-input").val(editdata["NAME"]);
                    ui.body.find(".email-input").val(editdata["EMAIL"]);
                    ui.body.find(".password-input").closest(".panel").remove();

                    $.ajax({
                        url: window.globals.constants.api + "/users/get/projects/byuser",
                        method: "post",
                        data: JSON.stringify({
                            "timestamp": moment.now(),
                            "user-uuid": editdata["UUID"]
                        }),
                        success: function (response) {
                            if (response.status == "success") {
                                var projectaccessdata = response.payload;

                                // Timeout to wait for listeners to be registered
                                setTimeout(() => {
                                    projectaccessdata.forEach(function (projectaccessrow, par) {
                                        ui.body.find(".projects-list-item[project-uuid='" + projectaccessrow["PROJECTUUID"] + "']").click().attr("role", projectaccessrow["ROLE"]);
                                        
                                        // Get device access data
                                        if (par == projectaccessdata.length - 1) {
                                            $.ajax({
                                                url: window.globals.constants.api + "/users/get/devices/byuser",
                                                method: "post",
                                                data: JSON.stringify({
                                                    "timestamp": moment.now(),
                                                    "user-uuid": editdata["UUID"]
                                                }),
                                                success: function (response) {
                                                    if (response.status == "success") {
                                                        var deviceaccessdata = response.payload;

                        
                                                        // Timeout to wait for listeners to be registered
                                                        setTimeout(() => {
                                                            deviceaccessdata.forEach(function (deviceaccessrow, dar) {
                                                                ui.body.find(".devices-list-item[device-uuid='" + deviceaccessrow["DEVICEUUID"] + "']").click().attr("role", deviceaccessrow["ROLE"]);
                                                            });
                                                            
                                                            // Set the ready flag
                                                            args.object.popup.ready();
                                                        }, 500);
                                                    }
                                                },
                                                error: function (x, h, r) {
                                                    variables.results.push({
                                                        "user-creation": "Error creating user.",
                                                        "success": false
                                                    });

                                                    // Set the ready flag
                                                    args.object.popup.ready();
                                                }
                                            });
                                        }
                                    });

                                }, 500);
                            }
                        },
                        error: function (x, h, r) {
                            variables.results.push({
                                "user-creation": "Error creating user.",
                                "success": false
                            });
                        }
                    });

                }
            },
            "listeners": function (args) {

                var ui = args.ui;

                ui.body.find(".devices-list").find(".list-item").off("click").click(function () {
                    var role = $(this).attr("role");
                    if (!role) {
                        $(this).attr("role", "user");
                    }
                    else if (role == "user") {
                        $(this).attr("role", "admin");
                    }
                    else if (role == "admin") {
                        $(this).removeAttr("role");
                    }
                });

                ui.body.find(".projects-list").find(".list-item").off("click").click(function () {
                    var role = $(this).attr("role");
                    if (!role) {
                        $(this).attr("role", "user");
                    }
                    else if (role == "user") {
                        $(this).attr("role", "admin");
                    }
                    else if (role == "admin") {
                        $(this).removeAttr("role");
                    }

                    // For all selected projects, show the devices
                    if (ui.body.find(".projects-list").find(".list-item[role]").length == 0) {
                        ui.body.find(".panel.devices-list-parent").addClass("hidden");
                    }
                    else {
                        ui.body.find(".panel.devices-list-parent").removeClass("hidden");

                        // Delete project containers that are not selected
                        ui.body.find(".projects-list").find(".list-item").not("[role]").each(function (ei, el) {
                            var projectuuid = $(el).attr("project-uuid");

                            ui.body.find(".devices-list").find(".project-devices-list-parent[project-uuid='" + projectuuid + "']").remove();
                        });

                        // Add project containers for selected projects if not already added
                        ui.body.find(".projects-list").find(".list-item[role]").each(function (ei, el) {
                            var projectuuid = $(el).attr("project-uuid");
                            var projectaccessdata = self.f.grep(window.globals.data["accessible-projects"], "PROJECTUUID", projectuuid, true);
                            var projectdata = self.f.grep(window.globals.data["all-projects"], "UUID", projectaccessdata["PROJECTUUID"], true);

                            // Add project containers
                            if (ui.body.find(".devices-list").find(".project-devices-list-parent[project-uuid='" + projectuuid + "']").length == 0) {
                                ui.body.find(".devices-list").append(multiline(function () {/* 
                                    <div class="project-devices-list-parent" project-uuid="{{project.uuid}}" style="margin-bottom: 6px;">
                                        <p style="font-size: 13px;">{{project.name}}</p>
                                        <hr style="margin: -2px 0 4px 0;">
                                        <div class="list project-devices-list" project-uuid="{{project.uuid}}" style="padding-top: 6px;"></div>
                                    </div>
                                */}, {
                                    "project": {
                                        "uuid": projectuuid,
                                        "name": projectdata["NAME"]
                                    }
                                }));

                                // Add devices to the projects's container
                                var deviceslistdata = self.f.grep(window.globals.data["all-devices"], "PROJECTUUID", projectuuid);
                                if (deviceslistdata && deviceslistdata.length > 0) {

                                    ui.body.find(".devices-list").find(".project-devices-list-parent[project-uuid='" + projectuuid + "'] .list").html("");
                                    deviceslistdata.forEach(function (device, di) {

                                        ui.body.find(".devices-list").find(".project-devices-list-parent[project-uuid='" + projectuuid + "'] .project-devices-list").append(multiline(function () {/*
                                            <div class="devices-list-item list-item" project-uuid="{{project.uuid}}" device-uuid="{{device.uuid}}" data-b64="{{data-b64}}" style="font-size: 12px; padding: 4px 10px;">{{device.name}}</div>    
                                        */}, {
                                            "project": {
                                                "uuid": projectuuid
                                            },
                                            "device": {
                                                "uuid": device["UUID"],
                                                "name": device["NAME"]
                                            },
                                            "data-b64": self.f.json_to_b64(device)
                                        }));
                                    });
                                }
                            }

                            // Re-call listeners
                            args.object.popup.args.listeners(args);
                        });
                    }
                });

                ui.actionbuttons.find(".form-submit-button").off("click").click(function () {
                    self.add_edit_on_server(args);
                });
            },
            "actionbuttons": [
                multiline(function () {/* 
                    <button class="green form-submit-button">{{button-text}}</button>
                */}, {
                    "button-text": editdata ? "Update" : "Add"
                }),
                multiline(function () {/* 
                    <button class="grey modal-close-button">Discard</button>
                */}),
            ]
        });
    }

    self.manage_users_button = () => {

        popup().open({
            "css": {
                "body": {
                    "background-color": "transparent"
                },
                "inject": multiline(() => {/* 

                    .list {
                        display: flex; 
                        flex-wrap: wrap;
                        margin-top: 4px;
                    }

                    .list-item {
                        flex: 0 1 auto; 
                        margin: 0 8px 8px 0; 
                        padding: 0px 10px; 
                        border-radius: 2px; 
                        background: #e9e9e9; 
                        cursor: pointer;
                    }

                    .list-item[role='user'] {
                        background: #b9e79d;
                    }

                    .list-item[role='admin'] {
                        background: #96b9ff;
                    }
                */})
            },
            "html": multiline(function () {/* 
                <div class="row" data-step="form">
                    <div class="col">

                        <!-- Users list -->
                        <div class="col-12 panel light devices-list-parent">
                            <p style="font-size: 14px;color: #d32a2a;margin-bottom: 0;">Users</p> 
                            <p class="hidden" style="font-size: 13px;color: #444;margin-bottom: 0;">Select a user t.</p> 
                            <div class="users-list-parent" style="padding: 0px 4px;"></div>
                        </div>
                        
                    
                    </div>
                </div>
            */}),
            "title": "Users list",
            "subtitle": "The following list shows all users in the project(s) you are administrator.",
            "theme": "light",
            "waitforready": true,
            "on_load": function (args) {
                var ui = args.ui;
                ui.popup.find(".body").removeClass("shadow");

                // Get users who have access to the current project
                $.ajax({
                    url: window.globals.constants.api + "/users/get/users/byproject/",
                    method: "post",
                    data: JSON.stringify({
                        "timestamp": moment.now(),
                        "project-uuid": window.sls.getItem("state/project/uuid")
                    }),
                    success: function (response) {

                        // Set the ready flag
                        args.object.popup.ready();

                        if (response.status == "success") {
                            
                            try {
                                datatable().generate({
                                    "id": "users-list",
                                    "theme": "light",
                                    "container": ui.body.find(".users-list-parent"),
                                    "empty-message": "No users added yet",
                                    "striped": true,
                                    "data": {
                                        "uuid": "ID",
                                        "headers": [
                                            {
                                                "id": "NAME",
                                                "name": "Name",
                                                "width": "140px",
                                                "title": true,
                                            },
                                            {
                                                "id": "ROLE",
                                                "name": "Role",
                                                "width": "60px"
                                            },
                                            {
                                                "id": "EMAIL",
                                                "name": "Email",
                                                "width": "150px",
                                                "title": true
                                            }                        
                                        ],
                                        "rows": response.payload
                                    },
                                    "actions": [
                                        {
                                            "id": "edit-user",
                                            "title": "Edit user",
                                            "onclick": function (that) {
                                                var userdata = self.f.b64_to_json($(that).parent().attr("data-b64"));
                                                self.add_edit_users_button(userdata);
                                            },
                                            "icon": {
                                                "class": "fas fa-edit",
                                            }
                                        },
                                        {
                                            "id": "delete-user-button",
                                            "title": "Delete user",
                                            "icon": {
                                                "class": "fa-solid fa-trash",
                                                "color": "crimson"
                                            },
                                            "ondblclick": function (that) {
                                                
                                                self.f.create_popup(
                                                    "Are you sure you want to delete this event? This action is irreversible."
                                                , true, function () {
                        
                                                    if (!self.f.b64_to_json($(that).parent().attr("data-b64"))) {
                                                        console.error ("The event could not be deleted. The b64 is invalid.")    
                                                        return;
                                                    }
                        
                                                }, function () {});
                                            }
                                        }
                                    ],
                                    "rowsperpage": 8,
                                    "searchable": false
                                });
                            }
                            catch (e) {
                                console.log(e);
                            }
                        }
                    },
                    error: function (x, h, r) {
                        variables.results.push({
                            "user-creation": "Error creating user.",
                            "success": false
                        });
                    }
                });
            },
            "listeners": function (args) {

                var ui = args.ui;

            },
            "actionbuttons": [
                multiline(function () {/* 
                    <button class="green form-submit-button">Add</button>
                */}),
                multiline(function () {/* 
                    <button class="grey modal-close-button">Discard</button>
                */}),
            ]
        });
    }

    self.add_edit_on_server = function (args) {
        var ui = args.ui;
        var editmode = ui.body.find(".password-input").val() == undefined;
        
        var name = ui.body.find(".name-input").val().trim();
        var email = ui.body.find(".email-input").val().toLowerCase().trim();
        var password = editmode ? null : ui.body.find(".password-input").val().trim();
        var useruuid = editmode ? ui.body.attr("user-uuid") : null;

        // Validation
        var errors = [];
        ui.body.find("[validation^='non-empty']").each(function (ei, el) {
            if ($(el).val().trim().length <= parseInt($(this).attr("validation-min-length") || 0)) {
                args.object.popup.shownotification({
                    "type": "error",
                    "message": "Please do not leave any the highlighted fields empty.",
                });

                $(el).parent().find(".required-tag").addClass("highlighted");
                errors.push($(el));
            }
            else {
                $(el).parent().find(".required-tag").removeClass("highlighted");
            }
        });

        // Execute tasks using Waterfall library
        var wf = Waterfall().setVariables({
            "results": []
        });

        // Create/update user account
        wf.addTask(function (variables) {

            return new Promise(function (resolve, reject) {
                console.log((editmode ? "Updating" : "Adding") + " user account: " + email);

                $.ajax({
                    url: window.globals.constants.api + "/users/user/" + (editmode ? "update" : "add"),
                    method: "post",
                    data: JSON.stringify({
                        "timestamp": moment.now(),
                        "name": name,
                        "email": email,
                        "password": password,
                        "user-uuid": useruuid
                    }),
                    success: function (response,) {
                        if (response.status == "success") {
                            variables.results.push({
                                "user-creation": response.message,
                                "success": true
                            });

                            variables["user-uuid"] = response.payload.uuid;
                            resolve();
                        }
                    },
                    error: function (x, h, r) {
                        variables.results.push({
                            "user-creation": "Error creating user.",
                            "success": false
                        });
                        reject();
                    }
                });
            });
        });
        
        // Delete current project access for the user
        wf.addTask(function (variables) {
            return new Promise(function (resolve, reject) {

                console.log("Deleting all project access");

                // Add project access entry
                $.ajax({
                    url: window.globals.constants.api + "/gatorbyte/projects/access/delete/all",
                    method: "post",
                    data: JSON.stringify({
                        "timestamp": moment.now(),
                        "user-uuid": variables["user-uuid"],
                    }),
                    success: function (response) {
                        if (response.status == "success") {
                            resolve();
                        }
                        else {
                            reject();
                        }
                    },
                    error: function (x, h, r) {
                        variables.results.push({
                            "device-access": "Couldn't create delete all projec access.",
                            "device-uuid": devicedata["UUID"],
                            "success": false
                        });
                        reject();
                    }
                });
            });
        });

        // Add each project to access list
        ui.body.find(".projects-list-item[role]").each(function (ei, el) {
            var role = $(el).attr("role");
            var projectaccessdata = self.f.b64_to_json($(el).attr("data-b64"));

            wf.addTask(function (variables) {

                console.log(variables);
                return new Promise(function (resolve, reject) {
                    
                    console.log("Adding/updating project access: " + projectaccessdata["PROJECTUUID"]);

                    // Add project access entry
                    $.ajax({
                        url: window.globals.constants.api + "/gatorbyte/projects/access/add",
                        method: "post",
                        data: JSON.stringify({
                            "timestamp": moment.now(),
                            "project-uuid": projectaccessdata["PROJECTUUID"],
                            "user-uuid": variables["user-uuid"],
                            "role": role
                        }),
                        success: function (response) {
                            variables.results.push({
                                "project-access": response.message,
                                "project-uuid": projectaccessdata["PROJECTUUID"],
                                "success": response.status
                            });

                            if (response.status == "success") {
                                resolve();
                            }
                            else {
                                reject();
                            }
                        },
                        error: function (x, h, r) {
                            variables.results.push({
                                "project-access": "Couldn't create project access.",
                                "project-uuid": projectaccessdata["PROJECTUUID"],
                                "success": false
                            });
                            reject();
                        }
                    });
                });
            });
        });

        // Delete current access for the user
        wf.addTask(function (variables) {
            return new Promise(function (resolve, reject) {

                console.log("Deleting all device access");

                // Add device access entry
                $.ajax({
                    url: window.globals.constants.api + "/gatorbyte/sites/access/delete/all",
                    method: "post",
                    data: JSON.stringify({
                        "timestamp": moment.now(),
                        "user-uuid": variables["user-uuid"],
                    }),
                    success: function (response) {
                        if (response.status == "success") {
                            resolve();
                        }
                        else {
                            reject();
                        }
                    },
                    error: function (x, h, r) {
                        variables.results.push({
                            "device-access": "Couldn't create delete all device access.",
                            "device-uuid": devicedata["UUID"],
                            "success": false
                        });
                        reject();
                    }
                });
            });
        });
        
        // Add each device to access list
        ui.body.find(".devices-list-item[role]").each(function (ei, el) {
            var role = $(el).attr("role");
            var devicedata = self.f.b64_to_json($(el).attr("data-b64"));
            var projectuuid = devicedata["PROJECTUUID"];

            wf.addTask(function (variables) {
                return new Promise(function (resolve, reject) {

                    console.log("Adding device access: " + devicedata["UUID"]);

                    // Add device access entry
                    $.ajax({
                        url: window.globals.constants.api + "/gatorbyte/sites/access/add",
                        method: "post",
                        data: JSON.stringify({
                            "timestamp": moment.now(),
                            "project-uuid": projectuuid,
                            "device-uuid": devicedata["UUID"],
                            "user-uuid": variables["user-uuid"],
                            "role": role
                        }),
                        success: function (response) {
                            variables.results.push({
                                "device-access": response.message,
                                "device-uuid": devicedata["UUID"],
                                "success": response.status
                            });
                            
                            if (response.status == "success") {
                                resolve();
                            }
                            else {
                                reject();
                            }
                        },
                        error: function (x, h, r) {
                            variables.results.push({
                                "device-access": "Couldn't create device access.",
                                "device-uuid": devicedata["UUID"],
                                "success": false
                            });
                            reject();
                        }
                    });
                });
            });
        });

        // Execute the tasks
        wf.executeTasks()
            .then ((variables) => {
                console.log("All tasks have been executed.");
                console.log(variables);

                console.log(variables);

                args.object.popup.shownotification({
                    "type": "success",
                    "message": "All tasks completed.",
                });
            });
    }
}

var configschema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "SiteConfigurationSchema",
    "type": "object",
    "properties": {
        "SITE-ID": {
            "type": "string"
        },
        "SITE-METADATA": {
            "type": "object",
            "properties": {
                "LOCATION-NAME": {
                    "type": "string",
                    "name": "Location name"
                },
                "INSTALLED-ON": {
                    "type": "string",
                    "format": "date",
                    "name": "Installation timestamp"
                },
                "ADDRESS": {
                    "type": "object",
                    "properties": {
                        "LOCATION": {
                            "type": "string",
                            "name": "Address"
                        },
                        "COORDINATES": {
                            "type": "array",
                            "items": [
                                {
                                    "type": "number"
                                }
                            ]
                        }
                    },
                    "required": [
                        "LOCATION"
                    ]
                }
            },
            "required": [
                "LOCATION-NAME",
                "INSTALLED-ON",
                "ADDRESS"
            ]
        },
        "ACTIVE": {
            "type": "boolean"
        },
        "VARIABLES": {
            "type": "object",
            "properties": {
                "MM-TO-INCH-FACTOR": {
                    "type": "number"
                },
                "STATION-ID": {
                    "type": "string"
                }
            },
            "required": [
                "MM-TO-INCH-FACTOR",
                "STATION-ID"
            ]
        },
        "DATA-FIELDS": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/DataField"
            }
        },
        "CONTROL": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/ControlItem"
            }
        }
    },
    "required": [
        "SITE-ID",
        "SITE-METADATA",
        "ACTIVE",
        "VARIABLES",
        "DATA-FIELDS",
        "CONTROL"
    ],
    "definitions": {
        "DataField": {
            "type": "object",
            "properties": {
                "ID": {
                    "type": "string",
                    "name": "Field ID"
                },
                "NAME": {
                    "type": "string",
                    "name": "Field name"
                },
                "UNITS": {
                    "type": "string",
                    "name": "Unit"
                },
                "ORDER": {
                    "type": "integer",
                    "name": "Order"
                },
                "HIGHLIGHT": {
                    "type": "boolean",
                    "name": "Highlighted"
                },
                "FORMULA": {
                    "type": "string",
                    "name": "Formula"
                },
                "CHART": {
                    "$ref": "#/definitions/Chart"
                },
                "TABLE": {
                    "$ref": "#/definitions/Table"
                },
                "DESCRIPTION": {
                    "type": "string",
                    "name": "Description"
                },
                "BRAND": {
                    "type": "string",
                    "name": "Manufacturer"
                },
                "CALIBRATION": {
                    "type": "object",
                    "properties": {
                        "LAST-CALIBRATED": {
                            "type": "string",
                            "format": "date",
                            "name": "Last calibrated on"
                        },
                        "TYPE": {
                            "type": "string",
                            "name": "Type"
                        },
                        "VALUE": {
                            "type": "number",
                            "name": "Value"
                        },
                        "DESCRIPTION": {
                            "type": "string",
                            "name": "Description"
                        }
                    },
                    "required": [
                        "REQUIRED",
                        "LAST-CALIBRATED",
                        "TYPE",
                        "VALUE",
                        "DESCRIPTION"
                    ]
                }
            },
            "required": [
                "ID",
                "NAME",
                "UNITS",
                "ORDER",
                "HIGHLIGHT",
                "FORMULA",
                "CHART",
                "TABLE",
                "DESCRIPTION",
                "BRAND",
                "CALIBRATION"
            ]
        },
        "Chart": {
            "type": "object",
            "properties": {
                "GROUP-NAME": {
                    "type": "string",
                    "name": "Group name"
                },
                "STATS": {
                    "type": "object",
                    "properties": {
                        "VISIBLE": {
                            "type": "boolean",
                            "name": "Visible"
                        },
                        "METRICS": {
                            "type": "array",
                            "name": "Metrics",
                            "items": {
                                "type": "string"
                            }
                        }
                    }
                },
                "TYPE": {
                    "type": "string",
                    "name": "Type"
                },
                "BIN": {
                    "type": "integer",
                    "name": "Bin"
                },
                "GAPSIZE": {
                    "type": "integer",
                    "name": "Gap size"
                }
            },
            "required": [
                "GROUP-NAME",
                "TYPE"
            ]
        },
        "Table": {
            "type": "object",
            "properties": {
                "GROUP-NAME": {
                    "type": "string"
                },
                "PRECISION": {
                    "type": "integer"
                }
            },
            "required": [
                "GROUP-NAME",
                "PRECISION"
            ]
        },
        "ControlItem": {
            "type": "object",
            "properties": {
                "key": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "unit": {
                    "type": "string"
                },
                "type": {
                    "type": "string"
                },
                "format": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                }
            },
            "required": [
                "key",
                "name",
                "unit",
                "type",
                "format",
                "description"
            ]
        }
    }
}