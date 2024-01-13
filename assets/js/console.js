window.globals.apps["console"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        
        /*
            ! Listeners
        */
        $(".console-input-submit-button").off("click").click(function (e) {
            e.preventDefault();
            var command = $("#console-input-text-box").val();

            // Hide the response div
            $(".console-row .response").removeClass("hidden");

            //! Publish the command to SocketIO room
            if (self.ls.getItem("state/device/sn")) {
                window.globals.accessors["socket"].publish({
                    action: "command/execute",
                    payload: command
                });
            }
            else {

                // Get control variables from the server
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify({
                        "device-id": self.ls.getItem("state/device/id"),
                        "project-id": self.ls.getItem("state/project/id"),
                        "command": command,
                        "timestamp": moment.now(),
                    }),
                    dataType: "json",
                    url: window.globals.constants["api"] + "/" + window.globals.constants["device"]["type"] + "/command/execute",
                    success: function(response){

                        if (response.status == "success") {
                            var response = response.payload;
                            
                            // Show the reponse div
                            $(".console-row .response").addClass("success").removeClass("error").removeClass("hidden");

                            console.log(response);
                            
                            // Set the response
                            $(".console-row .response .text").html(response);
                        }
                        else {
                            
                            // Show the reponse div
                            $(".console-row .response").addClass("error").removeClass("success").removeClass("hidden");

                            // Set the response
                            $(".console-row .response .text").html(response.payload || "There was an error processing the command.");
                        }
                    },
                    error: function (response, textStatus, errorThrown) {
                        console.log(response);
                        
                        // Show the reponse div
                        $(".console-row .response").addClass("error").removeClass("success").removeClass("hidden");

                        // Set the response
                        $(".console-row .response .text").html("There was an error processing the command.");
                    }
                });
            }
        });
    
        // Console input placeholder
        superplaceholder({
            el: document.getElementById("console-input-text-box"),
            sentences: ['set key=value', 'unset key', 'server restart', 'help'],
            options: {
                loop: true,
                letterDelay: 150,
                sentenceDelay: 2000,
            }
        });

        return self;
    }

}