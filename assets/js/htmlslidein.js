window.globals.apps["htmlslidein"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        return self;
    }

    self.open = function (args) {
        if(!args.html || args.html.length == 0) return;

        // Show/hide circular close button
        if(!args.close_button) $(".html-slidein-ui .modal-close-button.circle-button").css("display", "none");
        else $(".html-slidein-ui .modal-close-button.circle-button").css("display", "inline-flex");

        // Set html content
        $(".html-slidein-ui").removeClass("hidden");
        $(".html-slidein-ui .content").find(".html-placeholder").html(args.html);

        // Set dimensions
        if(args.css) $(".html-slidein-ui .content").find(".html-placeholder").css(args.css);
        else {
            $(".html-slidein-ui .content").find(".html-placeholder").css({
                "height": "auto",
                "max-height": "100vh",
                "max-width": "450px"
            });
        }
        
        // Close button click listener
        $(".html-slidein-ui .modal-close-button").off("click").click(function () {
            $(".html-slidein-ui").addClass("hidden").find(".html-placeholder").html("");
        });

        // This are basically callbacks when all content is loaded to signal time to bind listeners and custom ui actions
        if (args.on_load && typeof args.on_load == "function") args.on_load(); 
        if (args.listeners && typeof args.listeners == "function") args.listeners(); 
    }
}