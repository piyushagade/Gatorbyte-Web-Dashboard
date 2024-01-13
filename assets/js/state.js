window.globals.apps["state"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        
        return self;
    }

    self.get_state_data = function () {
        
        // Get control variables from the server
        $.ajax({
            type: 'POST',
            data: JSON.stringify({
                "device-sn": self.ls.getItem("state/device/sn"),
                "device-id": self.ls.getItem("state/device/id"),
                "project-id": self.ls.getItem("state/project/id"),
                "timestamp": moment.now(),
            }),
            dataType: "json",
            url: window.globals.constants["api"] + "/" + window.globals.constants["device"]["type"] + "/state/get",
            success: function(response){
                
                window.globals.data["state"] = response.payload;
                self.show_state_data(response.payload);

                // Show the last update timestamp
                $(".state-data-row-heading .last-update-timestamp").html(moment((moment.now())).format("LLL"));
            },
            error: function (response, textStatus, errorThrown) {
                console.log(response);
            }
        });
    }

    self.show_state_data = function (data) {
        
        if (!window.globals.data["state"]) {
            console.log("State data not found on the server.");

            $(".state-data-row .list .no-data-notification").removeClass("hidden");
            return;
        }

        try {
            data = typeof data == "string" ? JSON.parse(data) : data;
            var keys = Object.keys(data);

            // // Remove old items
            // $(".state-data-row").find(".state-data-item").remove();

            if (keys.length > 0) {
                
                $(".state-data-row .list .no-data-notification").addClass("hidden");

                keys.forEach (function (key, ki) {

                    $(".state-data-row .list").find(".empty-notification").remove();
                    $(".state-data-row-heading").removeClass("hidden");
                    $(".state-data-row").removeClass("hidden");

                    // If the item NOT on the list
                    if ($(".state-data-row .list").find(".state-data-item[variable='" + key + "']").length == 0) {

                        $(".state-data-row .list").append(multiline (function () {/* 
                            <div class="col-auto state-data-item" variable="{{name.raw}}" style="margin: 6px 6px; height: 66px; position: relative;">
                                <i class="show-information-button hidden fa-regular fa-circle-question" variable="{{name.raw}}" title="More information" style="cursor: pointer;position: absolute;top: 10px;right: 10px;color: #958080;"></i>
                                <p class="formatted-div-heading" style="font-size: 11px;font-weight: bold; margin-bottom: -2px;margin-top: 10px;margin-right: 20px;">{{name.formatted}}</p>
                                <div class="formatted-div scrollbar-style-horizontal" style="outline: 0;height: 33px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;text-align: left; padding: 2px 4px; max-width: 200px; overflow-x: auto;" title="{{value.formatted}}">{{value.formatted}}</div>
                                <input class="editable-div hidden" value="{{value.raw}}" input-value="{{value.raw}}" type="text" style="outline: 0;height: 30px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;border: 0;text-align: left;border-bottom: 3px solid #DDD;padding-left: 6px;padding-right: 6px;" placeholder="Variable value">
                            </div>
                        */}, {
                            "name": {
                                "formatted": key,
                                "raw": key
                            },
                            "value": {
                                "formatted": data[key],
                                "raw": data[key]
                            }
                        }));
                    }

                    // If the item is already on the list
                    else {

                        var valuechanged = $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find("input").val() != data[key].toString();
                        $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find(".editable-div").val(data[key]).attr("input-value", data[key]);

                        if (valuechanged) {
                            $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find(".formatted-div, .editable-div").css("border-bottom", "3px solid seagreen");
                            $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find(".formatted-div, .editable-div").css("border-bottom", "3px solid seagreen");
                            setTimeout(() => {
                                $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find(".formatted-div, .editable-div").css("border-bottom", "3px solid #DDD");
                            }, 5000);
                        }
                        else {
                            $(".state-data-row .list").find(".state-data-item[variable='" + key + "']").find(".formatted-div, .editable-div").css("border-bottom", "3px solid #DDD");
                        }
                    }
                });
            }

            else {
                $(".state-data-row .list").append(multiline (function () {/* 
                    <div class="empty-notification absolute-center" style="color: #999; font-size: 13px;">No state data</div>
                */}));

                // Remove items if the user switched the site
                $(".state-data-row .list").find(".state-data-item").remove();
                
                $(".state-data-row").find(".update-state-data-button").parent().addClass("hidden");
            }

            // Set theme
            window.globals.accessors["themes"].settheme();

            // Start timers
            self.timers();

            $(".state-data-row .update-state-data-button").off("click").click(function () {
                self.updatepending = false;

                var object = {};
                $(".state-data-row .list").find(".state-data-item").each(function (ei, el) {
                    object[$(el).attr("variable")] = $(el).find("input").attr("input-value");
                });

                //! Publish the update to SocketIO room
                window.globals.accessors["socket"].publish({
                    action: "control/update",
                    payload: object
                });

                self.f.create_notification("success", "Update request sent successfully.", "mint");
            });
        }
        catch (e) {
            console.log(e);
        }

    }

    self.timers = function () {
        
        if (self.updatebuttoninterval) clearInterval(self.updatebuttoninterval);
        self.updatebuttoninterval = setInterval(() => {
            if (!self.updatepending) return;
            $(".state-data-row .update-state-data-button").removeClass("ui-disabled");
        }, 250);
    }

}