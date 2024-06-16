var popup_app = function () {
    
    var self = this;
    var timers = {};
    var statedata = {};

    self.ui;
    self.uuid;
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
            "body-panel": {
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
        self.uuid = generateuuid().split("-")[0];

        return self;
    }

    /* 
        Entry function to show a popup
    */
    self.open = function (args) {

        
        self.args = args;
        
        //! Create UI skeleton
        createskeleton(args);

        //! Set theme
        self.args.theme = self.args.theme || "light"; 

        // Detect changes in form data/text/html
        self.args["detect-changes"] = self.args["detect-changes"] || false; 

        //! Hide header is requested
        if (self.args.header == false) {
            $(".popup-container[uuid='" + self.uuid + "']").find(".heading").addClass("hidden");
        }

        //! Show/hide circular close button
        if(!args.close_button) $(".popup-container[uuid='" + self.uuid + "'] .modal-close-button.circle-button").parent().css("display", "none");
        else $(".popup-container[uuid='" + self.uuid + "'] .modal-close-button.circle-button").parent().css("display", "inline-flex");

        setTimeout(() => {

            //! Set default CSS
            $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").css({
                "max-width": "450px",
                "background-color": self.themedata[self.args.theme]["popup-parent"]["background"],
                "height": "unset"
            });

            //! Apply custom CSS
            if (args.css) {

                if (!args.css.popup && !args.css.body) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup");
                    var css = {
                        // ...container.getStyleObject(),
                        ...args.css,
                    }
                    container.css(css);
                }

                if (args.css.popup) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup");
                    var css = {
                        ...args.css.popup,
                    }
                    container.css(css);
                }

                if (args.css.body) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".body");
                    var css = {
                        // ...container.getStyleObject(),
                        ...args.css.body,
                    }
                    container.css(css);
                }

                if (args.css.heading) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".heading");
                    var css = {
                        // ...container.getStyleObject(),
                        ...args.css.heading,
                    }
                    container.css(css);
                }

                if (args.css["action-buttons"]) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".action-buttons-parent");
                    var css = {
                        // ...container.getStyleObject(),
                        ...args.css["action-buttons"],
                    }
                    container.css(css);
                }

                if (args.css.panel) {
                    var container = $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".body").find(".panel");
                    var css = {
                        // ...container.getStyleObject(),
                        ...args.css.panel,
                    }
                    container.css(css);
                }

                if (args.css.inject) {
                    applycss(args.css.inject);
                }
            }

            //! Scroll the popup body to top everytime the popup is opened
            $(".popup-container[uuid='" + self.uuid + "'] .body").animate({
                scrollTop: $(".popup-container[uuid='" + self.uuid + "'] .body").scrollTop()
            });

            // //! These are basically callbacks when all content is loaded to signal time to bind listeners and custom ui actions
            // if (args.on_load && typeof args.on_load == "function") args.on_load({...getreturndata()}); 
            // if (args.listeners && typeof args.listeners == "function") args.listeners({...getreturndata()});
            
            //! Close button click listener
            $(".popup-container[uuid='" + self.uuid + "'] .modal-close-button").off("click").click(function () {
                self.close();
                if (args.on_close && typeof args.on_close == "function") args.on_close(); 
            });

            //! Show popup
            $(".popup-container[uuid='" + self.uuid + "']").removeClass("hidden");

            //! Set height
            setheight();

        }, 100);

        //! Close popup by clicking outside of the popup
        if (args.finicky == undefined || args.finicky == true) {
            if (!args.close_on_click || args.close_button == false) {
                
                // Use timeout to prevent accidental clicking causing closing of the popup
                setTimeout(() => {
                    
                    $(".popup-container[uuid='" + self.uuid + "']").off("click").click(function () {
                        $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .body").html("");
                        $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .heading .title").html("");
                        $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .heading .subtitle").html("");
                        if (args.on_close && typeof args.on_close == "function") args.on_close({...getreturndata()}); 
                    });

                    $(".popup-container[uuid='" + self.uuid + "'] .popup").off("click").click(function(e){
                        e.stopPropagation();
                    });
                }, 500);
            }
        }

        //! Prevent closing popup if clicked outside of the popup
        else {
            $(".popup-container[uuid='" + self.uuid + "']").off("click");
            $(".popup-container[uuid='" + self.uuid + "'] .popup").off("click");
        }

        //! Populate tabs if provided
        if (args.tabs) {

            if (args.tabs.length > 0) {

                //! Show tabs list
                self.ui.find(".tabs").removeClass("hidden");
                self.ui.find(".tabs .list").html("");

                args.tabs.forEach(function (row, ri) {
                    var name = row.name;
                    var selector = row.selector;
                    var selected = row.selected;

                    //! Set html content
                    var tabid = selector;
                    var tabdata = grep(args.tabs, "selector", tabid, true);
                    self.tabid = tabid;
                    
                    //! Append html to the popup
                    $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".body").append(multiline(function () {/*
                        <div class="{{visible-flag}} tab-parent" data-tab-ui-id="{{tab-id}}">{{html}}</div>
                    */}, {
                        "tab-id": tabid,
                        "html": row.html,
                        "visible-flag": !selected ? "hidden" : ""
                    }));

                    var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + tabid + "']");
                    
                    if (selected) {
                        
                        //! Show tab's action buttons if requested
                        if (tabdata.actionbuttons && tabdata.actionbuttons.length > 0) {
                            self.ui.find(".action-buttons-parent").html("").removeClass("hidden");
                            tabdata.actionbuttons.forEach(function (actionbuttonhtml, abhi) {
                                self.ui.find(".action-buttons-parent").append(multiline(function () {/* 
                                    <div class="action-button-container" style="margin-left: 0px; margin-right: 8px; transform: scale(1);">
                                        {{html}}
                                    </div>
                                */}, {
                                    "html": actionbuttonhtml
                                }));
                            });
                        }

                        self.setheader(args, tabdata.title, tabdata.subtitle);
                        self.setlisteners(tabdata.on_close);
                        
                        //! Trigger on_load and listener callback for tabs
                        if (tabdata && tabdata.on_load && typeof tabdata.on_load == "function") tabdata.on_load({...getreturndata(tabui, tabdata)});
                        if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") setTimeout(() => { tabdata.listeners({...getreturndata(tabui, tabdata)}); }, 100);
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

            //! If tabs array is empty
            else {

                // Hide tabs list
                self.ui.find(".tabs").addClass("hidden");
            }

            //! On tab change
            self.ui.find(".tabs .list .tab-item").off("click").click(function() {
                
                var tabid = $(this).attr("data-tab-id");
                self.selectedtabid = tabid;
                var tabdata = grep(args.tabs, "selector", self.selectedtabid, true);
                var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + self.selectedtabid + "']");
                
                $(".popup-container[uuid='" + self.uuid + "'] .content").find(".tab-parent").removeClass("active");
                tabui.addClass("active");

                self.tabid = tabid;
                tabdata.recreate = tabdata.recreate == undefined ? true : tabdata.recreate;

                self.ui.find(".tabs .list .tab-item").css({
                    "background": self.themedata[self.args.theme]["tabs-item-inactive"]["background"]
                }).removeClass("active");

                $(this).css({
                    "background": self.themedata[self.args.theme]["tabs-item-active"]["background"]
                }).addClass("active");

                //! Recreate/refresh html content on tab change and on first load
                if (tabdata.recreate) {

                    var html = tabdata ? tabdata.html : "No HTML provided for " + tabid + " tab.";
                    $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + tabid + "']").remove();

                    $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".body").append(multiline(function () {/*
                        <div data-tab-ui-id="{{tab-id}}">{{html}}</div>
                    */}, {
                        "tab-id": tabid,
                        "html": html,
                    }));

                    var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + tabid + "']");
                }

                // Show tab's action buttons if requested
                if (tabdata.actionbuttons && tabdata.actionbuttons.length > 0) {
                    self.ui.find(".action-buttons-parent").html("").removeClass("hidden");
                    tabdata.actionbuttons.forEach(function (actionbuttonhtml, abhi) {
                        self.ui.find(".action-buttons-parent").append(multiline(function () {/* 
                            <div class="action-button-container" style="margin-left: 0px; margin-right: 8px; transform: scale(1);">
                                {{html}}
                            </div>
                        */}, {
                            "html": actionbuttonhtml
                        }));
                    });
                }
                else {
                    self.ui.find(".action-buttons-parent").html("").addClass("hidden");
                }
                
                // Trigger tab's tabchange callback
                if (tabdata.on_tab_change && typeof tabdata.on_tab_change == "function") setTimeout(() => { tabdata.on_tab_change({...getreturndata(tabui, tabdata)}); }, 100); 

                // Trigger listeners callback
                if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") setTimeout(() => { tabdata.listeners({...getreturndata(tabui, tabdata)}); }, 100); 

                // Trigger tab's on_load callback
                if (tabdata.on_load && typeof tabdata.on_load == "function") tabdata.on_load({...getreturndata(tabui, tabdata)});
                
                // Change tab
                self.changetab(tabid);

                // Set headers and listeners
                self.setheader(args, tabdata.title, tabdata.subtitle);
                self.setlisteners(tabdata.on_close);

                // Animate height
                setheight(self.args);

                console.log((tabdata.recreate ? "Recreating" : "Showing") + " tab: " + tabid);
            });
        }

        //! If no tabs are requested
        else {

            //! Hide tabs list
            self.ui.find(".tabs").addClass("hidden");

            //! Set html content
            $(".popup-container[uuid='" + self.uuid + "'] .content").find(".popup").find(".body").html(multiline(function () {/*
                {{html}}
            */}, {
                html: args.html
            }));

            //! These are basically callbacks when all content is loaded to signal time to bind listeners and custom ui actions
            if (args.on_load && typeof args.on_load == "function") args.on_load({...getreturndata()}); 
            if (args.listeners && typeof args.listeners == "function") setTimeout(() => { args.listeners({...getreturndata()}); }, 100);

            self.setheader(args, args.title, args.subtitle);
            self.setlisteners(args.on_close);
        }

        //! Change detector: Form/html change listener
        if (self.args["detect-changes"] && self.args.on_change_detected) {
            self.ogchecksum = null;

            var changedetected = self.detect_changes();
            timers.changedetector = setInterval(() => {
                changedetected = self.detect_changes();
            }, 500);

        }

        //! State monitor
        if (self.args["monitor-state"] && self.args.on_change_detected) {

            self.update_state();
            timers.changedetector = setInterval(() => {
                self.update_state();
            }, 500);

        }
        
        return {...getreturndata()};
    }

    /* 
        Redraw popup and content
    */
    self.redraw = function () {
        console.log("Redrawing popup");
        self.open(self.args);
    }

    /* 
        Set title of the popup
    */
    self.title = function(title) {
        if (!title) return;
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading .title").html(title);
    }

    /* 
        Set subtitle of the popup
    */
    self.subtitle = function(subtitle) {
        if (!subtitle) return;
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading .subtitle").html(subtitle);
    }

    self.updateactionbuttons = function (actionbuttons) {
        if (!actionbuttons || actionbuttons.length == 0) return;
        var tabdata = grep(self.args.tabs, "selector", self.selectedtabid, true);
        var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + self.selectedtabid + "']");

        self.ui.find(".action-buttons-parent").html("").removeClass("hidden");
        actionbuttons.forEach(function (actionbuttonhtml, abhi) {
            self.ui.find(".action-buttons-parent").append(multiline(function () {/* 
                <div class="action-button-container" style="margin-left: 0px; margin-right: 8px; transform: scale(1);">
                    {{html}}
                </div>
            */}, {
                "html": actionbuttonhtml
            }));
        });
        
        // Default listeners
        if (tabdata) self.setlisteners(tabdata.on_close);
                        
        // Trigger on_load and listener callback for tabs
        if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") setTimeout(() => { tabdata.listeners({...getreturndata(tabui, tabdata)}) }, 100);
    }

    /* 
        Close the popup
    */
    self.close = function (mode, callback) {

        // Close all popups
        if (mode == "all") {
            $(".popup-container").remove();
        }

        // Close current popup
        else {
            $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .body").html("");
            $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .heading .title").html("");
            $(".popup-container[uuid='" + self.uuid + "']").addClass("hidden").find(".popup .heading .subtitle").html("");
            $(".popup-container[uuid='" + self.uuid + "']").remove();
        }

        //! Enable body scroll
        self.setscroll("html", true);

        // Clear timers
        Object.keys(timers).forEach(function(key) {
            if (timers[key]) clearInterval(timers[key]);
        });

        if (callback && typeof callback =='function') callback({...getreturndata()});

    }

    /* 
        Set listeners
    */
    self.setlisteners = function (on_close) {

        setTimeout(() => {
            
            //! Close button click listener
            $(".popup-container[uuid='" + self.uuid + "'] .modal-close-button").off("click").click(function () {
                self.close();
                if (on_close && typeof on_close == "function") on_close(); 
            });

            //! Back button click listener
            $(".popup-container[uuid='" + self.uuid + "'] .modal-back-button").off("click").click(function () {
                var goto = $(this).attr("data-go-to");
                var from = $(this).attr("data-go-from");

                if (!goto || !from) return; 

                if (!self.args.tabs) {
                    $(".popup-container[uuid='" + self.uuid + "'] .body").find("div[data-step='" + from + "']").addClass("hidden");
                    $(".popup-container[uuid='" + self.uuid + "'] .body").find("div[data-step='" + goto + "']").removeClass("hidden");
                }
                else {
                    $(".popup-container[uuid='" + self.uuid + "'] .body").find(".tab-parent.active").find("div[data-step='" + from + "']").addClass("hidden");
                    $(".popup-container[uuid='" + self.uuid + "'] .body").find(".tab-parent.active").find("div[data-step='" + goto + "']").removeClass("hidden");
                }

                // Reset the actionbuttons
                if (getselectedtab().tabdata.actionbuttons) {
                    var tabdata = getselectedtab().tabdata;
                    var tabui = getselectedtab().tabui;
                    var actionbuttons = tabdata.actionbuttons;
                    
                    self.ui.find(".action-buttons-parent").html("").removeClass("hidden");
                    actionbuttons.forEach(function (actionbuttonhtml, abhi) {
                        self.ui.find(".action-buttons-parent").append(multiline(function () {/* 
                            <div class="action-button-container" style="margin-left: 0px; margin-right: 8px; transform: scale(1);">
                                {{html}}
                            </div>
                        */}, {
                            "html": actionbuttonhtml
                        }));
                    });
        
                    // Default listeners
                    if (tabdata) self.setlisteners(tabdata.on_close);
                                    
                    // Trigger on_load and listener callback for tabs
                    if (tabdata && tabdata.listeners && typeof tabdata.listeners == "function") setTimeout(() => { tabdata.listeners({...getreturndata(tabui, tabdata)}) }, 100);
                }
            });

            // //! Page back button click listener
            // $(".popup-container[uuid='" + self.uuid + "'] .page-back-button").off("click").click(function () {
            //     var goto = $(this).attr("data-go-to");
            //     var from = $(this).attr("data-go-from");

            //     if (!goto || !from) return; 

            //     $(".popup-container[uuid='" + self.uuid + "'] .body").find("div[data-step='" + from + "']").addClass("hidden");
            //     $(".popup-container[uuid='" + self.uuid + "'] .body").find("div[data-step='" + goto + "']").removeClass("hidden");
            // });
        }, 500);
    }

    /* 
        Set html
    */
    self.sethtml = function (html) {
        if (!html) return;
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .body").html(html);
    }

    /* 
        Set title, subtitle, and animate
    */
    self.setheader = function (args, title, subtitle) {

        //! Set title and subtitle
        self.title(title);
        self.subtitle(subtitle);

        //! Show all title and subtitle and after a delay truncate overflowing text
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading .ui-truncate").removeClass("ui-truncate").addClass("ui-truncate-revert");
        setheight();

        if (!(self.args.css && self.args.css.placeholder && self.args.css.placeholder.height)) {
            timers.heading_expand_timer = setTimeout(() => {
                var heading = $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading");
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
                        
                        setheight();
                    }, 400);
                }, 300);
            }, 5000);
        }

        //! Expand title/subtitle on click
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading .title").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
            setheight();
        });
        $(".popup-container[uuid='" + self.uuid + "']").find(".popup .heading .subtitle").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
            setheight();
        });

        //! Show/hide header
        if (args.header != undefined && args.header === false) $(".popup-container[uuid='" + self.uuid + "'] .heading").addClass("hidden");
        else $(".popup-container[uuid='" + self.uuid + "'] .heading").removeClass("hidden").css("display", "block");

        //! Heading width
        if (args.close_button) $(".popup-container[uuid='" + self.uuid + "'] .heading .content").width(($(".popup-container[uuid='" + self.uuid + "'] .body").width() - 40) + "px");
        else $(".popup-container[uuid='" + self.uuid + "'] .heading .modal-close-button").parent().addClass("hidden");
    }

    self.showdiv = function (divname) {
        if (!self.tabid) return;
        var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + self.tabid + "']");
        
        // Hide the visible div first
        tabui.find("[data-step]").each(function (ei, el) {
            if (!$(el).hasClass("hidden")) $(el).addClass("hidden");
        });
        
        // Show the requested div
        tabui.find("[data-step]").each(function (ei, el) {
            if ($(el).attr("data-step") == divname) $(el).removeClass("hidden");
        });
    }
    
    /* 
        Change the UI to a tab by tabid
    */
    self.changetab = function (tabid) {
        if (!self.tabid) return;
        
        // Hide all tab content divs
        $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id]").addClass("hidden");

        // Show selected tab
        $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + tabid + "']").removeClass("hidden");
    }

    /* 
        Set/toggle scroll
    */
    self.setscroll = function (selectorstring, state) {
        self.scrollstate = !self.scrollstate ? {} : self.scrollstate;
        self.scrollstate[selectorstring] = state;
        
        // Remove existing event listeners
        $(selectorstring).off('wheel touchmove');

        var element = document.querySelector(selectorstring);
        var scrollposition = $(element).scrollTop();
        if (element) {
            element.addEventListener('wheel', function(e) {
                if (!self.scrollstate[selectorstring]) {
                    e.preventDefault();
                }
            }, { passive: false });

            element.addEventListener('touchmove', function(e) {
                if (!self.scrollstate[selectorstring]) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        setTimeout(() => {
            var popupelement = $(".popup-container[uuid='" + self.uuid + "'] .body").get(0);
            if (popupelement) {
                popupelement.addEventListener('wheel', function(e) {
                    e.stopPropagation();
                });

                popupelement.addEventListener('touchmove', function(e) {
                    e.stopPropagation();
                }, { passive: false });
            }
        }, 500);

    }

    self.showloader = () => {
        $(".popup-container[uuid='" + self.uuid + "'] .loader").removeClass("hidden");
    }

    self.hideloader = () => {
        $(".popup-container[uuid='" + self.uuid + "'] .loader").addClass("hidden");
    }
    
    self.shownotification = (args) => {
        args.type = args.type || "";
        $(".popup-container[uuid='" + self.uuid + "'] .notification").removeClass("hidden");

        if (args.type == "success") {
            $(".popup-container[uuid='" + self.uuid + "'] .notification").addClass("success");
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".icon-container").html(geticon("check"));
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".message-container").html(args.message || "Action succeeded.");
        }

        else if (args.type == "error") {
            $(".popup-container[uuid='" + self.uuid + "'] .notification").addClass("error");
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".icon-container").html(geticon("danger"));
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".message-container").html(args.message || "Action failed.");
        }

        else if (args.type == "warning") {
            $(".popup-container[uuid='" + self.uuid + "'] .notification").addClass("warning");
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".icon-container").html(geticon("bell"));
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".message-container").html(args.message || "Action requires attention.");
        }

        else if (args.type == "info") {
            $(".popup-container[uuid='" + self.uuid + "'] .notification").addClass("info");
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".icon-container").html(geticon("bell"));
            $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".message-container").html(args.message || "Action requires attention.");
        }

        // Re-adjust the height
        setheight();

        if (!args.persistent) {
            
            // Disable action buttons
            $(".popup-container[uuid='" + self.uuid + "'] .action-buttons-parent").css("filter", "blur(1px)").css("pointer-events", "none");

            setTimeout(() => {
                self.hidenotification();
                if (args && args.onhide && typeof args.onhide == "function") args.onhide();  
            }, args && args.alive ? args.alive : 3000);
        }
    }

    self.hidenotification = (args) => {
        $(".popup-container[uuid='" + self.uuid + "'] .notification").addClass("hidden");
        $(".popup-container[uuid='" + self.uuid + "'] .notification").removeClass("info").removeClass("success").removeClass("warning").removeClass("error");
        $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".icon-container").html("");
        $(".popup-container[uuid='" + self.uuid + "'] .notification").find(".message-container").html("-");

        // Re-adjust the height
        setheight();
        
        // Enable action buttons
        $(".popup-container[uuid='" + self.uuid + "'] .action-buttons-parent").css("filter", "unset").css("pointer-events", "unset");
    }

    /* 
        Detect changes in the input/text/html/attributes
    */
    self.detect_changes = function () {

        if (!self.args["detect-changes"]) return;
        var sum = 0;

        $("[detect-change='input']").each(function (ei, el) {
            var value = $(el).val().trim();
            var valuelength = value.length;
            sum += checksum(valuelength + value);
        });

        $("[detect-change='text']").each(function (ei, el) {
            var value = $(el).text().trim();
            var valuelength = value.length;
            sum += checksum(valuelength + value);
        });

        $("[detect-change='list']").each(function (ei, el) {
            var children = $(el).children();

            children.each(function (ci, cld) {
                var value = $(cld).text().trim();
                var valuelength = value.length;
                sum += checksum(valuelength + value);
            });
        });

        $("[detect-change='class']").each(function (ei, el) {
            var classlist = $(el).attr('class').split(/\s+/).join(",");
            var valuelength = classlist.length;
            sum += checksum(valuelength + classlist);
        });

        $("[detect-change='attribute:style']").each(function (ei, el) {
            var attributes = ($(el).attr("detect-change").split(":")[1] || []).split(",");
            attributes.forEach(attribute => {
                var value = ($(el).attr(attribute) || "").trim();
                var valuelength = value.length;
                sum += checksum(valuelength + value);
            });
        });

        var changedetected = false;
        if (self.ogchecksum == null) {
            self.ogchecksum = sum;
            changedetected = false;
        }

        if (sum != self.ogchecksum) {
            changedetected = true;
        }
        else {
            changedetected = false;
        }

        // Call callback
        if (self.args.on_change_detected && typeof self.args.on_change_detected == "function") self.args.on_change_detected({ ... getreturndata(), change: changedetected });
        return changedetected;
    }

    var geticon = (icon, args) => {
        if (icon == "check") {
            return multiline (() => {/* 
                <svg width="{{size}}" height="{{size}}" viewBox="0 0 {{size}} {{size}}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5858 13.4142L7.75735 10.5858L6.34314 12L10.5858 16.2427L17.6568 9.1716L16.2426 7.75739L10.5858 13.4142Z" fill="currentColor"/>
                </svg>
            */}, {
                "size": args && args.size ? args.size : "24"
            })
        }
        else if (icon == "danger") {
            return multiline (() => {/* 
                <svg width="{{size}}" height="{{size}}" viewBox="0 0 {{size}} {{size}}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6C12.5523 6 13 6.44772 13 7V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V7C11 6.44772 11.4477 6 12 6Z" fill="currentColor" /><path d="M12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12Z" fill="currentColor" />
                </svg>
            */}, {
                "size": args && args.size ? args.size : "24"
            })
        }
        else if (icon == "bell") {
            return multiline (() => {/* 
                <svg width="{{size}}" height="{{size}}" viewBox="0 0 {{size}} {{size}}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14 3V3.28988C16.8915 4.15043 19 6.82898 19 10V17H20V19H4V17H5V10C5 6.82898 7.10851 4.15043 10 3.28988V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3ZM7 17H17V10C17 7.23858 14.7614 5 12 5C9.23858 5 7 7.23858 7 10V17ZM14 21V20H10V21C10 22.1046 10.8954 23 12 23C13.1046 23 14 22.1046 14 21Z" fill="currentColor"/>
                </svg>
            */}, {
                "size": args && args.size ? args.size : "24"
            })
        }
        else if (icon == "cloud") {
            return multiline (() => {/* 
                <svg width="{{size}}" height="{{size}}" viewBox="0 0 {{size}} {{size}}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.738 19.9964C14.8186 19.9988 14.8994 20 14.9806 20C19.3989 20 22.9806 16.4183 22.9806 12C22.9806 7.58172 19.3989 4 14.9806 4C12.4542 4 10.2013 5.17108 8.73522 7H7.51941C3.92956 7 1.01941 9.91015 1.01941 13.5C1.01941 17.0899 3.92956 20 7.51941 20H14.5194C14.5926 20 14.6654 19.9988 14.738 19.9964ZM16.6913 17.721C19.0415 16.9522 20.9806 14.6815 20.9806 12C20.9806 8.68629 18.2943 6 14.9806 6C11.6669 6 8.98059 8.68629 8.98059 12H6.98059C6.98059 10.9391 7.1871 9.92643 7.56211 9H7.51941C5.03413 9 3.01941 11.0147 3.01941 13.5C3.01941 15.9853 5.03413 18 7.51941 18H14.5194C15.0691 18 15.9041 17.9014 16.6913 17.721Z" fill="currentColor"/>
                </svg>
            */}, {
                "size": args && args.size ? args.size : "24"
            })
        }
        else if (icon == "info") {
            return multiline (() => {/* 
                <svg width="{{size}}" height="{{size}}" viewBox="0 0 {{size}} {{size}}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 10.9794C11 10.4271 11.4477 9.97937 12 9.97937C12.5523 9.97937 13 10.4271 13 10.9794V16.9794C13 17.5317 12.5523 17.9794 12 17.9794C11.4477 17.9794 11 17.5317 11 16.9794V10.9794Z" fill="currentColor" />
                    <path d="M12 6.05115C11.4477 6.05115 11 6.49886 11 7.05115C11 7.60343 11.4477 8.05115 12 8.05115C12.5523 8.05115 13 7.60343 13 7.05115C13 6.49886 12.5523 6.05115 12 6.05115Z" fill="currentColor"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12Z" fill="currentColor"/>
                </svg>
            */}, {
                "size": args && args.size ? args.size : "24"
            })
        }
    }

    var getreturndata = function (tabui, tabdata) {
        return { 
            ui: { 
                popup: self.ui,
                body: self.ui.find(".body"), 
                actionbuttons: self.ui.find(".action-buttons-parent"),
                tab: tabui
            }, 
            object: { 
                popup: self,
                tab: tabdata
            },
            event: {
                on_load: self.on_load,
                on_tab_change: self.on_tab_change,
                on_close: self.on_close,
                listeners: self.listeners
            },
            function: {
                updateactionbuttons: self.updateactionbuttons
            }
        }
    }

    var createskeleton = function (args) {

        if (true || !args.clearfirst) {
            $(".popup-container[uuid='" + self.uuid + "']").remove();
        }

        console.info("Creating new popup, ID: " + self.uuid);

        //! Prevent body scroll
        // $("body").css("overflow-y", "hidden");
        // $("body").css("overflow-x", "hidden");
        self.setscroll("html", false);
        
        if ($(".popup-container[uuid='" + self.uuid + "']").length == 0) {

            //! If tabs are requested
            if (args.tabs && args.tabs.length > 0) {
                $("body .popup-parent").append(multiline(function () {/* 
                    <div class="popup-container hidden" uuid="{{uuid}}" style="backdrop-filter: blur({{blur-value}}); -webkit-backdrop-filter: blur({{blur-value}});">
                        
                        <!-- Content -->
                        <div class="content" style="color: #FFFFFF99; padding: 10px; width: 98%; max-height: 95vh; overflow-y: hidden;">
                            <div class="popup shadow-heavy absolute-center" theme-item="popup-parent" style="background: #bbbbbb;border-radius: 8px;min-width: 150px;min-height: 100px; color: rgb(34, 34, 34);overflow: hidden;width: 90%;">
                                
                                <!-- Heading -->
                                <div class="heading shadow" theme-item="popup-heading" style="background: #f6f6f6;z-index: 1;padding: 8px 14px; animation: 1s all ease-in-out;">
                                    <p class="title ui-truncate" theme-item="popup-title"></p>
                                    <p class="subtitle ui-truncate" theme-item="popup-subtitle"></p>
                                </div>

                                <!-- Tabs -->
                                <div class="tabs hidden" style="z-index: 1;padding: 7px 12px 0;animation: 1s all ease-in-out; margin-bottom: 0px;">
                                    <div class="list scrollbar-style-hidden" style="display: inline-flex; overflow-x: auto; overflow-y: hidden; width: 100%;"></div>
                                </div>
                                
                                <!-- Body -->
                                <div class="body shadow scrollbar-style" theme-item="popup-body" style="overflow: hidden auto;padding: 10px;margin: 6px; margin-top: 0;min-height: 150px;background-color: #FFFFFF;border-radius: 4px;max-height: 98vh;"></div>

                                <!-- Overlay action buttons -->
                                <div class="overlay-action-buttons hidden" style="pointer-events: auto;position: absolute;bottom: 0px;background: rgba(255, 255, 255, 0.882);border-radius: 0px;width: 100%;height: 60px;color: rgb(34, 34, 34);overflow: hidden;backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);"></div>
                                
                                <!-- Action buttons -->
                                <div class="action-buttons-parent hidden scrollbar-style-hidden" theme-itemx="popup-heading" style="margin-top: -5px; width: 100%; padding: 8px; display: inline-flex; overflow-x: auto;"></div>
                            </div>
                        </div>
                        
                        <!-- Control buttons -->
                        <div style="transform: scale(0.8); cursor: pointer;position: absolute; top: 18px; right: 24px; background: rgba(246, 243, 243, 0.4); display: inline-flex; border-radius: 40px;padding: 4px;">
                            <div class="modal-close-button circle-button" style="cursor: pointer; height: 49px; width: 49px;">
                                <i class="fas fa-times" style="color: #EEE;font-size: 37px;margin-top: 8px;margin-left: 12px;"></i>
                            </div>
                        </div>
                    </div>
                */},
                {
                    "uuid": self.uuid,
                    "blur-value": $(".popup-container").length == 0 ? "3px" : "2px"
                }))
            }

            //! No tabs requested
            else {
                $("body .popup-parent").append(multiline(function () {/* 
                    <div class="popup-container hidden" uuid="{{uuid}}" style="pointer-events: all; height: 100%;width: 100%;margin: 0;padding: 20px;background: rgba(26, 26, 26, 0.6);backdrop-filter: blur({{blur-value}}); -webkit-backdrop-filter: blur({{blur-value}});top: 0;position: fixed; z-index: 1000000;">
                        
                        <!-- Content -->
                        <div class="content" style="color: #FFFFFF99; padding: 10px; width: 98%; height: 100%;">
                            <div class="popup shadow-heavy absolute-center" theme-item="popup-parent" style="background: rgba(255, 255, 255, 0.882); border-radius: 8px; min-width: 150px; min-height: 100px; color: rgb(34, 34, 34); overflow: hidden; width: 90%;">
                                
                                <!-- Heading -->
                                <div class="heading shadow" theme-item="popup-heading" style="background: rgb(246, 246, 246);z-index: 1;padding: 8px 14px;animation: 1s ease-in-out 0s 1 normal none running all;display: block;height: auto;margin: 5px;border-radius: 5px;">
                                    <p class="title ui-truncate" theme-item="popup-title"></p>
                                    <p class="subtitle ui-truncate" theme-item="popup-subtitle"></p>
                                </div>

                                <!-- Tabs -->
                                <div class="tabs hidden" style="z-index: 1;padding: 7px 6px;animation: 1s all ease-in-out;">
                                    <div class="list scrollbar-style-horizontal" style="display: inline-flex; overflow-x: auto; overflow-y: hidden; width: 100%;"></div>
                                </div>
                                
                                <!-- Body -->
                                <div class="body shadow scrollbar-style" theme-item="popup-body" style="overflow: hidden auto;background: #ffffffc7;padding: 10px;margin: 6px;min-height: 150px;border-radius: 4px;"></div>

                                <!-- Overlay action buttons -->
                                <div class="overlay-action-buttons hidden" style="pointer-events: auto;position: absolute;bottom: 0px;background: rgba(255, 255, 255, 0.882);border-radius: 0px;width: 100%;height: 60px;color: rgb(34, 34, 34);overflow: hidden;backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);"></div>
                                
                                <!-- Notification -->
                                <div class="notification hidden">
                                    <div class="icon-container"></div>
                                    <div class="message-container"></div>
                                </div>

                                <!-- Action buttons -->
                                <div class="action-buttons-parent hidden scrollbar-style-hidden" theme-itemx="popup-heading" style="margin-top: -5px; width: 100%; padding: 8px; display: inline-flex; overflow-x: auto;">
                                </div>

                                <!-- Loader -->
                                <div class="loader hidden">
                                    <div class="line"></div>
                                    <div class="line"></div>
                                    <div class="line"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Control buttons -->
                        <div style="transform: scale(0.8); cursor: pointer;position: absolute; top: 18px; right: 24px; background: rgba(246, 243, 243, 0.4); display: inline-flex; border-radius: 40px;padding: 4px;">
                            <div class="modal-close-button circle-button" style="cursor: pointer; height: 49px; width: 49px;">
                                <i class="fas fa-times" style="color: #EEE;font-size: 37px;margin-top: 8px;margin-left: 12px;"></i>
                            </div>
                        </div>
                    </div>
                */},
                {
                    "uuid": self.uuid,
                    "blur-value": $(".popup-container").length == 0 ? "3px" : "2px"
                }));
            }
        }
            
        self.parent = $(".popup-container[uuid='" + self.uuid + "']");
        self.ui = $(".popup-container[uuid='" + self.uuid + "'] .content .popup");

        // Set theme
        if (args.theme && args.theme  == "dark") {
            $("[theme-item]").each(function (ei, el) {
                    
                if (self.themedata[self.args.theme][$(el).attr("theme-item")]["background"]) $(el).css("background-color", self.themedata[self.args.theme][$(el).attr("theme-item")]["background"] + " !important");
                if (self.themedata[self.args.theme][$(el).attr("theme-item")]["text"]) $(el).css("color", self.themedata[self.args.theme][$(el).attr("theme-item")]["text"]);
            });
        }

        // Show popup's action buttons if requested
        if (args.actionbuttons && args.actionbuttons.length > 0) {
            self.ui.find(".action-buttons-parent").html("").removeClass("hidden");
            args.actionbuttons.forEach(function (actionbuttonhtml, abhi) {
                self.ui.find(".action-buttons-parent").append(multiline(function () {/* 
                    <div class="action-button-container" style="margin-left: 0px; margin-right: 8px; transform: scale(1);">
                        {{html}}
                    </div>
                */}, {
                    "html": actionbuttonhtml
                }));
            });
        }
        else if (!args.tabs) {
            self.ui.find(".action-buttons-parent").html("").addClass("hidden");
        }

        return self;
    }

    /* 
        Get the selected tab's data
    */
    var getselectedtab = function () {
        var tabdata = grep(self.args.tabs, "selector", self.selectedtabid, true);
        var tabui = $(".popup-container[uuid='" + self.uuid + "'] .content").find("[data-tab-ui-id='" + self.selectedtabid + "']");

        return {
            tabid: self.selectedtabid,
            tabdata: tabdata,
            tabui: tabui
        }
    }

    /* 
        Set height of the body of the popup
    */
    var setheight = function () {
        // if (self.args.css && self.args.css.placeholder && self.args.css.placeholder.height) return;

        setTimeout(() => {
            var viewheight = $(".popup-container[uuid='" + self.uuid + "']").height() - 50 - 10;
            if (viewheight < 0) return;

            var headingheight = self.args.header == false ? 0 : $(".popup-container[uuid='" + self.uuid + "'] .heading").height();
            var tabsheight = $(".popup-container[uuid='" + self.uuid + "'] .tabs").hasClass("hidden") ? 0 : $(".popup-container[uuid='" + self.uuid + "'] .tabs").height();
            var actionbuttonsheight = $(".popup-container[uuid='" + self.uuid + "'] .action-buttons-parent").height();
            actionbuttonsheight = actionbuttonsheight && actionbuttonsheight > 0 ? actionbuttonsheight + 30 : 0;
            var bodyheight = viewheight - tabsheight - headingheight - actionbuttonsheight + 7;
            $(".popup-container[uuid='" + self.uuid + "'] .body").css("max-height", bodyheight);

            $("body").append('<div class="temp-object"></div>');

            var tempobject = $("body .temp-object");
            tempobject.html($(".popup-container[uuid='" + self.uuid + "'] .content .popup").html());
            var height = tempobject.height() + 6;
            tempobject.remove();

            var animateheightflag = false;

            if (animateheightflag) {
                var animationduration = 100;
                $(".popup-container[uuid='" + self.uuid + "'] .content .popup").animate({height: height}, animationduration, function() {});

                setTimeout(() => {
                    $(".popup-container[uuid='" + self.uuid + "'] .content .popup").css("height", "auto");
                }, animationduration + 15);
                setTimeout(() => {
                    $(".popup-container[uuid='" + self.uuid + "'] .content .popup").css("height", "auto");
                }, animationduration + 25);
                setTimeout(() => {
                    $(".popup-container[uuid='" + self.uuid + "'] .content .popup").css("height", "auto");
                }, animationduration + 30);
            }
            
            $(".popup-container[uuid='" + self.uuid + "'] .content .popup").css("height", "auto");
        }, 50);
    }

    var applycss = (css) => {
        const styleElement = document.createElement('style');
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }
    
    var generateuuid = function (short) {
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return short ? uuid.split("-")[0] : uuid;
    }

    var grep = function (data, key, value, return_first_result_only) {
        var res = [];
        if (!value) return return_first_result_only ? {} : [];

        data.forEach(function (item) {
            if (item[key] && value && item[key].toLowerCase() == value.toLowerCase()) res.push(item);
        });
        return return_first_result_only ? (res[0] !== undefined ? res[0] : {}) : res;
    }
    
    var checksum = function (s) {
        if (typeof s == "object" && ((!Array.isArray && Object.keys(s).length > 0) || (!Array.isArray && Object.keys(s).length === 0))) s = JSON.stringify(s);
        else if (typeof f == "function") s = s.toString();
        if (!s) return 0;
        
        var chk = 0x12345678;
        var len = s.length;
        for (var i = 0; i < len; i++) {
            chk += (s.charCodeAt(i) * (i + 1));
        }
        return (chk & 0xffffffff).toString(16);
    }

    self.update_state = function () {
        if (!self.args["monitor-state"]) return;

        $("[monitor-state='input']").each(function (ei, el) {

            var eluuid = $(el).attr("state-monitor-identifier");
            if (!eluuid) {
                eluuid = generateuuid().split("-")[0];
                $(el).attr("state-monitor-identifier", eluuid);
            }

            if (!statedata[eluuid]) {
                statedata[eluuid] = {
                    "state": 0,
                    "states": [{
                        "timestamp": parseInt(new Date().getTime() / 1000),
                        "value": $(el).val()
                    }]
                }

                window.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key.toLowerCase() === 'z') {

                        // Get the focused input element
                        var el = $("[monitor-state='input']:focus");
                        var eluuid = el.attr("state-monitor-identifier");
                        if (!statedata || !statedata[eluuid]) return;
                        e.preventDefault();

                        var elstatedata = statedata[eluuid];
                        var elstate = statedata[eluuid].state;
                        var elstates = statedata[eluuid].states;

                        var prevstate = elstate - 1 > 0 ? elstate - 1 : 0;
                        var laststatedata = elstates[prevstate];

                        statedata[eluuid].state = prevstate;

                        el.val(laststatedata.value);
                    }
                });
            }

            var currentstate = {
                "timestamp": parseInt(new Date().getTime() / 1000),
                "value": $(el).val()
            };

            var lastknownstatechecksum = checksum(JSON.stringify(statedata[eluuid].states[statedata[eluuid].state].value));
            var currentstatechecksum = checksum(JSON.stringify(currentstate.value));

            if (lastknownstatechecksum != currentstatechecksum) {
                statedata[eluuid].state = statedata[eluuid].state + 1;
                statedata[eluuid].states.push({
                    "timestamp": parseInt(new Date().getTime() / 1000),
                    "value": $(el).val()
                });
            }
        });

        $("[monitor-state='list']").each(function (ei, el) {

            var eluuid = $(el).attr("state-monitor-identifier");
            if (!eluuid) {
                eluuid = generateuuid().split("-")[0];
                $(el).attr("state-monitor-identifier", eluuid);
            }

            if (!statedata[eluuid]) {
                statedata[eluuid] = {
                    "state": 0,
                    "states": [{
                        "timestamp": parseInt(new Date().getTime() / 1000),
                        "value": $(el).html()
                    }]
                }

                window.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key.toLowerCase() === 'z') {

                        // Get the focused input element
                        var el = $("[monitor-state='list']:focus");
                        var eluuid = el.attr("state-monitor-identifier");
                        if (!statedata || !statedata[eluuid]) return;
                        e.preventDefault();

                        var elstatedata = statedata[eluuid];
                        var elstate = statedata[eluuid].state;
                        var elstates = statedata[eluuid].states;

                        var prevstate = elstate - 1 > 0 ? elstate - 1 : 0;
                        var laststatedata = elstates[prevstate];

                        statedata[eluuid].state = prevstate;
                        console.log(laststatedata.value);

                        el.html(laststatedata.value);
                    }
                });
            }

            var currentstate = {
                "timestamp": parseInt(new Date().getTime() / 1000),
                "value": $(el).html()
            };

            var lastknownstatechecksum = checksum(JSON.stringify(statedata[eluuid].states[statedata[eluuid].state].value));
            var currentstatechecksum = checksum(JSON.stringify(currentstate.value));

            if (lastknownstatechecksum != currentstatechecksum) {
                statedata[eluuid].state = statedata[eluuid].state + 1;
                statedata[eluuid].states.push({
                    "timestamp": parseInt(new Date().getTime() / 1000),
                    "value": $(el).html()
                });
            }
        });
    } 
}

// Create a new instance of the Popup
var popup = function () {
    if ($(".popup-parent").length == 0) $("body").append('<div class="popup-parent" style="pointer-events: none; background: transparent; height: 100%;width: 100%;margin: 0;padding: 0px; top: 0; position: absolute; z-index: 1000000; overflow-y: hidden;">');
    return new popup_app().init();
}


// (function($){
//     $.fn.getStyleObject = function(){
//         var dom = this.get(0);
//         var style;
//         var returns = {};
//         if(window.getComputedStyle){
//             var camelize = function(a,b){
//                 return b.toUpperCase();
//             };

//             style = window.getComputedStyle(dom, null);
//             for(var i = 0, l = style.length; i < l; i++){
//                 var prop = style[i];
//                 var camel = prop.replace(/\-([a-z])/g, camelize);
//                 var val = style.getPropertyValue(prop);
//                 returns[prop] = val;
//             };
//             return returns;
//         };
//         if(style = dom.currentStyle){
//             for(var prop in style){
//                 returns[prop] = style[prop];
//             };
//             return returns;
//         };
//         return this.css();
//     }
// })(jQuery);