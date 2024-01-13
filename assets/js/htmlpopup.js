var htmlpopup_app = function () {
    
    var self = this;

    self.f = window.globals.accessors.functions;
    self.ui;
    self.uuid;
    self.timers = {};
    self.tabs = {};

    // Theme data
    self.themedata = {
        "light": {
            "popup-parent": {
                "background": "#bbbbbb",
                "text": "#222222"
            },
            "tabs-item-inactive": {
                "background": "#dddddd",
                "text": "#222222"
            },
            "tabs-item-active": {
                "background": "#ffffff",
                "text": "#222222"
            },
            "popup-body": {
                "background": "#bbbbbb",
                "text": "#222222"
            },
            "body-panel": {
                "background": "#FFF",
                "text": "#222222"
            },
            "popup-heading": {
                "background": "#f6f6f6",
                "text": "#222222"
            },
            "popup-title": {
                "text": "#222222"
            },
            "popup-subtitle": {
                "text": "#666666"
            }
        },
        "dark": {
            "popup-parent": {
                "background": "#202020f5",
                "text": "#DDD"
            },
            "tabs-item-inactive": {
                "background": "#282727",
                "text": "#DDD"
            },
            "tabs-item-active": {
                "background": "#161616f5",
                "text": "#DDD"
            },
            "popup-body": {
                "background": "#161616f5",
                "text": "#DDD"
            },
            "body-panel": { // unused
                "background": "#343434",
                "text": "#DDD"
            },
            "popup-heading": {
                "background": "#404040",
                "text": "#222222"
            },
            "popup-title": {
                "text": "#f3f3f3"
            },
            "popup-subtitle": {
                "text": "#999999"
            }
        }
    };

    self.init = function () {
        self.uuid = self.f.uuid().split("-")[0];
        return self;
    }

    /* 
        Entry function to show a popup
    */
    self.open = function (args) {

        self.args = args;
        
        //! Create UI
        self.create(args);

        //! Set theme
        self.args.theme = self.args.theme || "light"; 

        //! Show/hide circular close button
        if(!args.close_button) $(".html-popup-ui[uuid='" + self.uuid + "'] .modal-close-button.circle-button").parent().css("display", "none");
        else $(".html-popup-ui[uuid='" + self.uuid + "'] .modal-close-button.circle-button").parent().css("display", "inline-flex");
        
        setTimeout(() => {

            //! Set popup dimensions
            if(args.css) {
                $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").css(args.css);
                $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder .body").css(args.css);
            }
            else {
                $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").css({
                    "max-width": "450px",
                    "height": "unset"
                });
            }

            $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").css({
                "background-color": self.themedata[self.args.theme]["popup-parent"]["background"],
            });

            //! Scroll to top everytime new popup is opened
            $(".html-placeholder[uuid='" + self.uuid + "'] .body").animate({
                scrollTop: $(window).scrollTop(0)
            });

            // //! These are basically callbacks when all contentz is loaded to signal time to bind listeners and custom ui actions
            // if (args.on_load && typeof args.on_load == "function") args.on_load(self.ui, self); 
            // if (args.listeners && typeof args.listeners == "function") args.listeners(self.ui, self);
            
            //! Close button click listener
            $(".html-popup-ui[uuid='" + self.uuid + "'] .modal-close-button").off("click").click(function () {
                self.close();
                
                if (args.on_close && typeof args.on_close == "function") args.on_close(); 
            });

            //! Show popup
            $(".html-popup-ui[uuid='" + self.uuid + "']").removeClass("hidden");

            //! Set height
            self.setheight();

            $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").css("display", "block");

        }, 100);

        //! Close popup by clicking outside of the popup
        if (args.finicky == undefined || args.finicky == true) {
            if (!args.close_on_click || args.close_button == false) {
                
                // Use timeout to prevent accidental clicking causing closing of the popup
                setTimeout(() => {
                    
                    $(".html-popup-ui[uuid='" + self.uuid + "']").off("click").click(function () {
                        $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .body").html("");
                        $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .heading .title").html("");
                        $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .heading .subtitle").html("");
                        if (args.on_close && typeof args.on_close == "function") args.on_close(self.ui, self); 
                    });

                    $(".html-popup-ui[uuid='" + self.uuid + "'] .html-placeholder").off("click").click(function(e){
                        e.stopPropagation();
                    });
                }, 500);
            }
        }

        //! Prevent closing popup if clicked outside of the popup
        else {
            $(".html-popup-ui[uuid='" + self.uuid + "']").off("click");
            $(".html-popup-ui[uuid='" + self.uuid + "'] .html-placeholder").off("click");
        }

        //! Populate tabs if provided
        if (args.tabs) {
            if (args.tabs.length > 0) {

                // Show tabs list
                self.ui.find(".tabs").removeClass("hidden");
                self.ui.find(".tabs .list").html("");

                args.tabs.forEach(function (row, ri) {
                    var name = row.name;
                    var selector = row.selector;
                    var selected = row.selected;

                    //! Set html contentz
                    var tabid = selector;
                    var tabdata = self.f.grep(args.tabs, "selector", tabid, true);
                    self.tabid = tabid;
                    
                    // Append html to the popup
                    $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").find(".body").append(multiline(function () {/*
                        <div class="{{visible-flag}}" data-tab-ui-id="{{tab-id}}">{{html}}</div>
                    */}, {
                        "tab-id": tabid,
                        "html": row.html,
                        "visible-flag": !selected ? "hidden" : ""
                    }));

                    var tabui = $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id='" + tabid + "']");
                    
                    // Trigger on_load and listener callback for tabs
                    if (tabdata && tabdata.on_load && typeof tabdata.on_load == "function") tabdata.on_load(self.ui, self, tabdata, tabui);
                    if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") tabdata.listeners(self.ui, self, tabdata, tabui);

                    if (selected) {
                        self.setheader(args, tabdata.title, tabdata.subtitle);
                        self.setlisteners(tabdata.on_close);
                    }

                    self.ui.find(".tabs .list").append(multiline(function () {/* 
                        <div class="tab-item {{active}}" data-tab-id="{{tab-id}}" style="min-width: 100px;text-align: center;cursor: pointer;margin-right: 6px;font-size: 12px;font-weight: 100;background: {{background}}; padding: 4px 10px;">
                            {{name}}
                        </div>
                    */}, 
                    {
                        "active": ri == 0 ? "active" : "",
                        "background": ri == 0 ? self.themedata[self.args.theme]["tabs-item-active"]["background"] : self.themedata[self.args.theme]["tabs-item-inactive"]["background"],
                        "name": name,
                        "tab-id": selector
                    }));
                })
            }
            else {
                // Hide tabs list
                self.ui.find(".tabs").addClass("hidden");
            }

            //! On tab change
            self.ui.find(".tabs .list .tab-item").off("click").click(function() {
                
                var tabid = $(this).attr("data-tab-id");
                var tabdata = self.f.grep(args.tabs, "selector", tabid, true);

                self.tabid = tabid;
                tabdata.recreate = tabdata.recreate == undefined ? true : tabdata.recreate;

                self.ui.find(".tabs .list .tab-item").css({
                    "background": self.themedata[self.args.theme]["tabs-item-inactive"]["background"]
                }).removeClass("active");

                $(this).css({
                    "background": self.themedata[self.args.theme]["tabs-item-active"]["background"]
                }).addClass("active");

                //! Recreate/refresh html contentz on tab change and on first load
                if (tabdata.recreate) {

                    var html = tabdata ? tabdata.html : "No HTML provided for " + tabid + " tab.";
                    $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id='" + tabid + "']").remove();

                    $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").find(".body").append(multiline(function () {/*
                        <div data-tab-ui-id="{{tab-id}}">{{html}}</div>
                    */}, {
                        "tab-id": tabid,
                        "html": html,
                    }));

                    // Trigger on_load callback
                    if (tabdata && tabdata.on_load && typeof tabdata.on_load == "function") tabdata.on_load(self.ui, self, tabdata, tabui);
                }

                var tabui = $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id='" + tabid + "']");

                // Trigger listeners callback
                if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") tabdata.listeners(self.ui, self, tabdata, tabui);

                // Trigger tabchange callback
                if (args.on_tab_change && typeof args.on_tab_change == "function") args.on_tab_change(self.ui, self, tabdata, tabui);
                
                // Change tab
                self.changetab(tabid);

                // Set headers and listeners
                self.setheader(args, tabdata.title, tabdata.subtitle);
                self.setlisteners(tabdata.on_close);

                // Animate height
                self.setheight(self.args);

                console.log((tabdata.recreate ? "Recreating" : "Showing") + " tab: " + tabid);
            });
        }

        //! If no tabs are provided
        else {

            // Hide tabs list
            self.ui.find(".tabs").addClass("hidden");

            //! Set html contentz
            $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find(".html-placeholder").find(".body").html(multiline(function () {/*
                {{html}}
            */}, {
                html: args.html
            }));

            //! These are basically callbacks when all contentz is loaded to signal time to bind listeners and custom ui actions
            if (args.on_load && typeof args.on_load == "function") args.on_load(self.ui, self); 
            if (args.listeners && typeof args.listeners == "function") args.listeners(self.ui, self);

            self.setheader(args, args.title, args.subtitle);
            self.setlisteners(args.on_close);
        }

        return self.ui, self;
    }

    /* 
        Create base UI for the popup
    */
    self.create = function (args) {

        if (true || !args.clearfirst) {
            $(".html-popup-ui[uuid='" + self.uuid + "']").remove();
        }

        console.log("Creating new popup, ID: " + self.uuid);
        
        if ($(".html-popup-ui[uuid='" + self.uuid + "']").length == 0) {

            // If tabs are requested
            if (args.tabs && args.tabs.length > 0) {
                $("body").append(multiline(function () {/* 
                    <div class="html-popup-ui hidden {{theme}}" uuid="{{uuid}}" style="height: 100%;width: 100%;margin: 0;padding: 20px;background: rgba(26, 26, 26, 0.6);backdrop-filter: blur({{blur-value}}); -webkit-backdrop-filter: blur({{blur-value}});top: 0;position: absolute; z-index: 1000; overflow-y: hidden;">
                        
                        <!-- Content -->
                        <div class="contentz" style="color: #FFFFFF99; padding: 10px; width: 98%; max-height: 95vh; overflow-y: hidden;">
                            <div class="html-placeholder shadow-heavy absolute-center" theme-item="popup-parent" style="background: #bbbbbb;border-radius: 8px;min-width: 150px;min-height: 100px; color: rgb(34, 34, 34);overflow: hidden;width: 90%;">
                                
                                <!-- Heading -->
                                <div class="heading shadow" theme-item="popup-heading" style="background: #f6f6f6;z-index: 1;padding: 8px 14px; animation: 1s all ease-in-out;">
                                    <p class="title ui-truncate" theme-item="popup-title" style="font-size: 1.375rem; margin-bottom: 0px; color: #222; line-height: 2rem;"></p>
                                    <p class="subtitle ui-truncate" theme-item="popup-subtitle" style="font-size: 0.875rem; margin-bottom: 0px; color: #666; font-weight: 300;"></p>
                                </div>

                                <!-- Tabs -->
                                <div class="tabs hidden" style="z-index: 1;padding: 7px 12px 0;animation: 1s all ease-in-out; margin-bottom: 0px;">
                                    <div class="list scrollbar-style-hidden" style="display: inline-flex; overflow-x: auto; overflow-y: hidden; width: 100%;">
                                    </div>
                                </div>
                                
                                <!-- Body -->
                                <div class="body shadow scrollbar-style" theme-item="popup-body" style="overflow: hidden auto;padding: 10px;margin: 6px; margin-top: 0;min-height: 150px;background-color: #FFFFFF;border-radius: 4px;max-height: 98vh;"></div>

                                <!-- Overlay action buttons -->
                                <div class="overlay-action-buttons hidden" style="pointer-events: auto;position: absolute;bottom: 0px;background: rgba(255, 255, 255, 0.882);border-radius: 0px;width: 100%;height: 60px;color: rgb(34, 34, 34);overflow: hidden;backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);">
                            </div>
                        </div>
                        
                        <!-- Control buttons -->
                        <div class="modal-close-button circle-button" style="cursor: pointer; height: 49px; width: 49px; transform: scale(0.8); cursor: pointer;position: absolute; top: 18px; right: 24px; display: inline-flex; border-radius: 40px;padding: 4px;">
                            <i class="fas fa-times" style="color: #EEE;font-size: 37px;margin-top: 3px;margin-left: 7px;"></i>
                        </div>
                    </div>
                */},
                {
                    "theme": self.args.theme,
                    "uuid": self.uuid,
                    "blur-value": $(".html-popup-ui").length == 0 ? "14px" : "4px"
                }))
            }

            // No tabs requested
            else {
                $("body").append(multiline(function () {/* 
                    <div class="html-popup-ui hidden {{theme}}" uuid="{{uuid}}" style="height: 100%;width: 100%;margin: 0;padding: 20px; backdrop-filter: blur({{blur-value}}); -webkit-backdrop-filter: blur({{blur-value}});top: 0;position: absolute; z-index: 1000;">
                        
                        <!-- Content -->
                        <div class="contentz" style="padding: 10px; width: 98%; height: 100%;">
                            <div class="html-placeholder shadow-heavy absolute-center" theme-item="popup-parent" style="border-radius: 8px;min-width: 150px;min-height: 100px; color: rgb(34, 34, 34);overflow: hidden;width: 90%;">
                                
                                <!-- Heading -->
                                <div class="heading shadow" theme-item="popup-heading" style=" z-index: 1;padding: 8px 14px;animation: 1s ease-in-out 0s 1 normal none running all;display: block;height: auto;margin: 5px;border-radius: 5px;">
                                    <p class="title ui-truncate" theme-item="popup-title" style="font-size: 1.375rem; margin-bottom: 0px;  line-height: 2rem;"></p>
                                    <p class="subtitle ui-truncate" theme-item="popup-subtitle" style="font-size: 0.875rem; margin-bottom: 0px; color: #666; font-weight: 300;"></p>
                                </div>

                                <!-- Tabs -->
                                <div class="tabs hidden" style="z-index: 1;padding: 7px 6px;animation: 1s all ease-in-out;">
                                    <div class="list scrollbar-style-horizontal" style="display: inline-flex; overflow-x: auto; overflow-y: hidden; width: 100%;"></div>
                                </div>
                                
                                <!-- Body -->
                                <div class="body shadow scrollbar-style" theme-item="popup-body" style="overflow: hidden auto; padding: 10px;margin: 6px;min-height: 150px;border-radius: 4px;max-heightx: 98vh;"></div>

                                <!-- Overlay action buttons -->
                                <div class="overlay-action-buttons hidden" style="pointer-events: auto;position: absolute;bottom: 0px; border-radius: 0px;width: 100%;height: 60px;color: rgb(34, 34, 34);overflow: hidden;backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);">
                            </div>
                        </div>
                        
                        <!-- Control buttons -->
                        <div class="modal-close-button circle-button" style="cursor: pointer; height: 49px; width: 49px; transform: scale(0.8); cursor: pointer;position: absolute; top: 18px; right: 24px; display: inline-flex; border-radius: 40px;padding: 4px;">
                            <i class="fas fa-times" style="color: #EEE;font-size: 37px;margin-top: 3px;margin-left: 7px;"></i>
                        </div>
                    </div>
                */},
                {
                    "theme": self.args.theme,
                    "uuid": self.uuid,
                    "blur-value": $(".html-popup-ui").length == 0 ? "14px" : "4px"
                }))
            }
        }
            
        self.parent = $(".html-popup-ui[uuid='" + self.uuid + "']");
        self.ui = $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder");

        // Set theme
        if (args.theme && args.theme  == "dark") {
            $("[theme-item]").each(function (ei, el) {
                    
                if (self.themedata[self.args.theme][$(el).attr("theme-item")]["background"]) $(el).css("background-color", self.themedata[self.args.theme][$(el).attr("theme-item")]["background"] + " !important");
                if (self.themedata[self.args.theme][$(el).attr("theme-item")]["text"]) $(el).css("color", self.themedata[self.args.theme][$(el).attr("theme-item")]["text"]);
            });
        }

        return self;
    }

    /* 
        Redraw popup and contentz
    */
    self.redraw = function () {
        console.log("Redrawing popup");
        self.open(self.args);
    }
    
    /* 
        Set height of the body of the popup
    */
    self.setheight = function () {
        var viewheight = $("body").height() - 50 - 10;
        var headingheight = $(".html-popup-ui[uuid='" + self.uuid + "'] .heading").height();
        var tabsheight = $(".html-popup-ui[uuid='" + self.uuid + "'] .tabs").hasClass("hidden") ? 0 : $(".html-popup-ui[uuid='" + self.uuid + "'] .tabs").height();
        var bodyheight = viewheight - tabsheight - headingheight + 7;
        $(".html-popup-ui[uuid='" + self.uuid + "'] .body").css("max-height", bodyheight);

        setTimeout(() => {

            $("body").append('<div class="temp-object"></div>');

            var tempobject = $("body .temp-object");
            tempobject.html($(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").html());
            var height = tempobject.height() + 6;
            tempobject.remove();

            // var animationduration = 100;
            // $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").animate({height: height}, animationduration, function() {});

            // setTimeout(() => {
            //     $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").css("height", "auto");
            // }, animationduration + 15);
            // setTimeout(() => {
            //     $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").css("height", "auto");
            // }, animationduration + 25);
            // setTimeout(() => {
            //     $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").css("height", "auto");
            // }, animationduration + 30);
            
            $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz .html-placeholder").css("height", "auto");
        }, 50);
    }

    /* 
        Set title of the popup
    */
    self.title = function(title) {
        if (!title) return;
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading .title").html(title);
    }

    /* 
        Set subtitle of the popup
    */
    self.subtitle = function(subtitle) {
        if (!subtitle) return;
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading .subtitle").html(subtitle);
    }

    /* 
        Close the popup
    */
    self.close = function (mode, callback) {

        if (mode == "all") {
            $(".html-popup-ui").remove();
        }
        else {
            $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .body").html("");
            $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .heading .title").html("");
            $(".html-popup-ui[uuid='" + self.uuid + "']").addClass("hidden").find(".html-placeholder .heading .subtitle").html("");
            $(".html-popup-ui[uuid='" + self.uuid + "']").remove();
        }

        // Clear timers
        Object.keys(self.timers).forEach(function(key) {
            if (self.timers[key]) clearInterval(self.timers[key]);
        });

        if (callback && typeof callback =='function') callback(self.ui, self);

    }

    /* 
        Set listeners
    */
    self.setlisteners = function (on_close) {

        setTimeout(() => {
            
            //! Close button click listener
            $(".html-popup-ui[uuid='" + self.uuid + "'] .modal-close-button").off("click").click(function () {
                self.close();
                if (on_close && typeof on_close == "function") on_close(); 
            });

            //! Back button click listener
            $(".html-popup-ui[uuid='" + self.uuid + "'] .modal-back-button").off("click").click(function () {
                var goto = $(this).attr("data-go-to");
                var from = $(this).attr("data-go-from");

                if (!goto || !from) return; 

                $(".html-popup-ui[uuid='" + self.uuid + "'] .body").find("div[data-step='" + from + "']").addClass("hidden");
                $(".html-popup-ui[uuid='" + self.uuid + "'] .body").find("div[data-step='" + goto + "']").removeClass("hidden");
            });
        }, 500);
    }

    /* 
        Set html
    */
    self.sethtml = function (html) {
        if (!html) return;
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .body").html(html);
    }
    /* 
        Set title, subtitle, and animate
    */
    self.setheader = function (args, title, subtitle) {

        //! Set title and subtitle
        self.title(title);
        self.subtitle(subtitle);

        //! Show all title and subtitle and after a delay truncate overflowing text
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading .ui-truncate").removeClass("ui-truncate").addClass("ui-truncate-revert");
        self.setheight();

        self.timers.heading_expand_timer = setTimeout(() => {
            var heading = $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading");
            setTimeout(() => {
                var height_old = heading.height();
                heading.find(".ui-truncate-revert").removeClass("ui-truncate-revert").addClass("ui-truncate");
                var height_new = heading.height() + 16;
                heading.height(height_old);
                heading.animate({
                    "height": height_new,
                }, 300);

                setTimeout(() => {
                    heading.css({
                        "height": "auto",
                    });
                    
                    self.setheight();
                }, 400);
            }, 300);
        }, 5000);

        //! Expand title/subtitle on click
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading .title").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
            self.setheight();
        });
        $(".html-popup-ui[uuid='" + self.uuid + "']").find(".html-placeholder .heading .subtitle").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
            self.setheight();
        });

        //! Show/hide header
        if (args.header != undefined && args.header === false) $(".html-popup-ui[uuid='" + self.uuid + "'] .heading").addClass("hidden");
        else $(".html-popup-ui[uuid='" + self.uuid + "'] .heading").removeClass("hidden").css("display", "block");

        //! Heading width
        if (args.close_button) $(".html-popup-ui[uuid='" + self.uuid + "'] .heading .contentz").width(($(".html-popup-ui[uuid='" + self.uuid + "'] .body").width() - 40) + "px");
        else $(".html-popup-ui[uuid='" + self.uuid + "'] .heading .modal-close-button").parent().addClass("hidden");
    }

    self.showdiv = function (divname) {
        if (!self.tabid) return;
        var tabui = $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id='" + self.tabid + "']");
        
        // Hide the visible div first
        tabui.find("[data-step]").each(function (ei, el) {
            if (!$(el).hasClass("hidden")) $(el).addClass("hidden");
        });
        
        // Show the requested div
        tabui.find("[data-step]").each(function (ei, el) {
            if ($(el).attr("data-step") == divname) $(el).removeClass("hidden");
        });
    }

    self.changetab = function (tabid) {
        if (!self.tabid) return;
        
        // Hide all tab contentz divs
        $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id]").addClass("hidden");

        // Show selected tab
        $(".html-popup-ui[uuid='" + self.uuid + "'] .contentz").find("[data-tab-ui-id='" + tabid + "']").removeClass("hidden");
    }
}

// Create a new instance of the Popup
var popup = function () {
    return new htmlpopup_app().init();
}
