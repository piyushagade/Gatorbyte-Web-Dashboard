window.globals.apps["socket"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.obj = null;
    self.id = "WC" + self.f.uuid().split("-")[0];

    self.init = function (callback) {
        
        // Initialize socket
        self.connect(callback);
        window.socket = self;

        return self;
    }

    // Connect to server
    self.connect = function (callback) {
        
        window.globals.constants["socket"] = io(window.globals.constants["server"]);
        self.obj = window.globals.constants["socket"];
        
        self.obj.on("connect", () => {
            self.subscriptions();
            
            // Call callback function
            if(callback && typeof callback == "function") callback();
        });
    }
    
    self.subscriptions = function () {

        console.log("Setting up SocketIO subscriptions");
        
        // SocketIO subscriptions
        window.globals.constants["socket"].on("room/join/response", function(data) {
            console.log("Joined room: " + data.room);
        });

        window.globals.constants["socket"].on("room/leave/response", function(data) {
            console.log("Left room: " + data.room); 
        });
        window.globals.constants["socket"].on("safe-mode", function(data) {
            if(data == 1) $("#station-safe-mode-notification").removeClass("hidden");
            else $("#station-safe-mode-notification").addClass("hidden");
        });
        
        // On new log message from server
        window.globals.constants["socket"].on("log/message", function(data) {
            
            console.log("New log message\n----------------------------\n" + data);
            globals.accessors["log"].show_log_data(data);
        });

        // Log the response of a command execution
        window.globals.constants["socket"].on("command/response", function(data) {

            // Log to console
            console.log(data);

            var success = !data.toLowerCase().startsWith("invalid");
            
            // Show the reponse div
            $(".console-row .response").addClass(success ? "success" : "error").removeClass("hidden");

            // Set the response
            $(".console-row .response .text").html(data);
        });
        
        // On new data from device
        window.globals.constants["socket"].on("data/new", function(data) {

            try {
                data = JSON.parse(data);
                console.log("New data point available\n------------------------\n" + JSON.stringify(data));
            }
            catch (e) {
                data = self.f.c2j(data);
                console.log("New data point available\n------------------------\n" + data);
            }
            if (data.length > 0) {
                if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
                if (!window.globals.accessors["maps"]) window.globals.accessors["maps"] = new window.globals.apps["maps"]().init();

                // Draw new point on each chart
                window.globals.accessors["charts"].draw_new_data(data);

                // Draw new point on each map
                window.globals.accessors["maps"].draw_new_data(data);
            }
        });
        
        // On control variables report received
        window.globals.constants["socket"].on("control/report", function(data) {
            console.log("Control variables updated\n----------------------------\n" + data);
            
            window.globals.accessors["control"].show_control_variables(data);
        });
    }

    self.subscribe = function (topic, callback) {
        self.obj.on(topic, callback);
    }

    self.publish = function (args) {
        /* 
            ! Topic format
            [sender-id]::[adapter-id]::[target-id/site-id (optional)]:::[action-string]

            ! Message format
            [payload-string]

            args should have following keys:
                a. "action"
                b. "payload"
        */

        var sender_id = self.id;
        var adapter_id = "gb-server";
        var target_device_id = self.ls.getItem("state/device/sn");

        var topic = sender_id + "::" + adapter_id + "::" + target_device_id + ":::" + args["action"];
        var message = typeof args["payload"] == "object" ? JSON.stringify(args["payload"]) : args["payload"];

        console.log("Publishing to SocketIO\n----------------------\nTopic:\n" + topic + "\n\nMessage:\n" + message);

        if (topic && message) self.obj.emit(topic, message);
    }
}