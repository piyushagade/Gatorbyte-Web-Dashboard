window.globals.apps["htmlpopup.bc"] = function () {
    var self = this;
    self.f = window.globals.accessors.f;
    self.ui;

    self.init = function () {
        return self;
    }

    self.open = function (args) {
        if(!args.html || args.html.length == 0) return;
        self.ui = $(".html-popup-ui .content .html-placeholder");

        // Show/hide circular close button
        if(!args.close_button) $(".html-popup-ui .modal-close-button.circle-button").parent().css("display", "none");
        else $(".html-popup-ui .modal-close-button.circle-button").parent().css("display", "inline-flex");

        // Set html content
        $(".html-popup-ui .content").find(".html-placeholder").find(".body").html(multiline(function () {/*
            {{html}}
        */}, {
            html: args.html
        }));

        var fontsize = 1.375;
        self.ui.off("scroll").scroll(function(e) {
            var top = $(this).scrollTop();

            if (top > 10) {
                if (fontsize < 1) return;

                self.ui.find(".heading .title").css({
                    "font-size": (1.375 * 0.75) + "rem",
                });
                self.ui.find(".heading .subtitle").css({
                    "font-size": (0.875 * 0.85) + "rem",
                });
            }
            else {

                self.ui.find(".heading .title").css({
                    "font-size": (1.375 * 1) + "rem",
                });
                self.ui.find(".heading .subtitle").css({
                    "font-size": (0.875 * 1) + "rem",
                });
            }
        });

        // Set dimensions
        if(args.css) $(".html-popup-ui .content").find(".html-placeholder").css(args.css);
        else {
            $(".html-popup-ui .content").find(".html-placeholder").css({
                "max-height": "100vh",
                "max-width": "450px"
            });
        }

        // Scroll to top everytime new popup is opened
        $(".html-placeholder .body").animate({
            scrollTop: $(window).scrollTop(0)
        });

        // Close popup by clicking outside of the popup
        if (args.finicky == undefined || args.finicky == true) {
            if (!args.close_on_click || args.close_button == false) {
                $(".html-popup-ui").off("click").click(function () {
                    $(".html-popup-ui").addClass("hidden").find(".html-placeholder .body").html("");
                    $(".html-popup-ui").addClass("hidden").find(".html-placeholder .heading .title").html("");
                    $(".html-popup-ui").addClass("hidden").find(".html-placeholder .heading .subtitle").html("");
                    if (args.on_close && typeof args.on_close == "function") args.on_close(self.ui, self); 
                });

                $(".html-popup-ui .html-placeholder").off("click").click(function(e){
                    e.stopPropagation();
                });
            }
        }

        // Prevent closing popup if clicked outside of the popup
        else {
            $(".html-popup-ui").off("click");
            $(".html-popup-ui .html-placeholder").off("click");
        }
        
        // Close button click listener
        $(".html-popup-ui .modal-close-button").off("click").click(function () {
            self.close();
            
            if (args.on_close && typeof args.on_close == "function") args.on_close(); 
        });

        // Set title and subtitle
        if (args.title) $(".html-popup-ui").find(".html-placeholder .heading .title").html(args.title);
        if (args.subtitle) $(".html-popup-ui").find(".html-placeholder .heading .subtitle").html(args.subtitle);

        // Show all title and subtitle and after a delay truncate overflowing text
        $(".html-popup-ui").find(".html-placeholder .heading .ui-truncate").removeClass("ui-truncate").addClass("ui-truncate-revert");
        self.heading_expand_timer = setTimeout(() => {
            var heading = $(".html-popup-ui").find(".html-placeholder .heading");
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
                }, 400);
            }, 300);
        }, 5000);

        // This are basically callbacks when all content is loaded to signal time to bind listeners and custom ui actions
        if (args.on_load && typeof args.on_load == "function") args.on_load(self.ui, self); 
        if (args.listeners && typeof args.listeners == "function") args.listeners(self.ui, self); 

        // Expand title/subtitle on click
        $(".html-popup-ui").find(".html-placeholder .heading .title").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
        });
        $(".html-popup-ui").find(".html-placeholder .heading .subtitle").off("click").click(function(e){
            $(this).toggleClass("ui-truncate");
        });
        
        $(".html-popup-ui").removeClass("hidden");

        return self.ui, self;
    }

    self.title = function(title) {
        $(".html-popup-ui").find(".html-placeholder .heading .title").html(title || "No title");
    }

    self.subtitle = function(subtitle) {
        $(".html-popup-ui").find(".html-placeholder .heading .subtitle").html(subtitle || "No subtitle");
    }

    self.close = function (callback) {
        
        $(".html-popup-ui").addClass("hidden").find(".html-placeholder .body").html("");
        $(".html-popup-ui").addClass("hidden").find(".html-placeholder .heading .title").html("");
        $(".html-popup-ui").addClass("hidden").find(".html-placeholder .heading .subtitle").html("");

        if (self.heading_expand_timer) clearTimeout(self.heading_expand_timer);
        if (callback && typeof callback =='function') callback(self.ui, self);
    }
}