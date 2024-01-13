window.globals.apps["control"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        
        return self;
    }

    self.get_control_variables = function () {
        
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
            url: window.globals.constants["api"] + "/" + window.globals.constants["device"]["type"] + "/control/get",
            success: function(response){
                window.globals.data["control"] = response.payload;
                self.show_control_variables(response.payload);

                // Show the last update timestamp
                $(".control-variables-row-heading .last-update-timestamp").html(moment((moment.now())).format("LLL"));
            },
            error: function (response, textStatus, errorThrown) {
                console.log(response);
            }
        });
    }

    self.show_control_variables = function (data) {

        if (!window.globals.data["control"]) {
            console.log("Control variables not found on the server.");

            $(".control-variables-row .list .no-data-notification").removeClass("hidden");
            return;
        }

        try {
            data = typeof data == "string" ? JSON.parse(data) : data;
            var keys = Object.keys(data);

            // // Remove old items
            // $(".control-variables-row").find(".control-variable-item").remove();

            if (keys.length > 0) {
                
                $(".control-variables-row .list .no-data-notification").addClass("hidden");

                keys.forEach (function (key, ki) {
                    
                    $(".control-variables-row .list").find(".empty-notification").remove();
                    $(".control-variables-row").find(".update-control-variables-button").parent().removeClass("hidden");

                    // If the item NOT on the list
                    if ($(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").length == 0) {

                        var isnumber = parseInt(data[key]) == data[key] && !isNaN(parseInt(data[key]));
                        var isfloat = parseFloat(data[key]) == data[key] && !isNaN(parseFloat(data[key]));
                        var isbool = data[key].toString() == "true" || data[key].toString() == "false";
                        var isstring = !isnumber && !isbool;

                        var type = isnumber ? "number" : isbool ? "bool" : isfloat ? "float" : "string";

                        var variable = key;
                        var metadata = self.f.grep(window.globals.data["site"]["CONTROL"], "key", variable, true);

                        if (!metadata) return;

                        var name = metadata.name && metadata.name.length > 0 ? metadata.name : key;
                        var value = metadata.format && metadata.format.formula.length > 0 ? eval(metadata.format.formula.replace("{{VALUE}}", data[key])) : data[key];
                        var unit = metadata.format && metadata.format.unit.length > 0 ? metadata.format.unit : null;

                        if (isstring || isnumber) {
                            $(".control-variables-row .list").append(multiline (function () {/* 
                                <div class="col-auto control-variable-item" type="{{type}}" variable="{{name.raw}}" style="margin: 6px 6px;height: 66px; position: relative;">
                                    <i class="show-information-button fa-regular fa-circle-question" variable="{{name.raw}}" title="More information" style="cursor: pointer;position: absolute;top: 10px;right: 10px; "></i>
                                    <p class="formatted-div-heading" style="font-size: 11px;font-weight: bold; margin-bottom: -2px;margin-top: 10px;margin-right: 20px;">{{name.formatted}}</p>
                                    <div class="formatted-div" style="outline: 0;height: 30px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;text-align: left;padding: 2px 4px; ">{{value.formatted}} {{unit}}</div>
                                    <input class="editable-div hidden" value="{{value.raw}}" input-value="{{value.raw}}" type="text" style="outline: 0;height: 30px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;text-align: left;padding-left: 6px;padding-right: 6px;" placeholder="Variable value">
                                </div>
                            */}, {
                                "name": {
                                    "formatted": name,
                                    "raw": key
                                },
                                "unit": unit ? unit : "",
                                "value": {
                                    "formatted": value,
                                    "raw": data[key]
                                },
                                "type": type
                            }));
                        }

                        else if (isbool) {
                            $(".control-variables-row .list").append(multiline (function () {/* 
                                <div class="col-auto control-variable-item" type="{{type}}" variable="{{name.raw}}" style="margin: 6px 6px;height: 66px; position: relative;">
                                    <i class="show-information-button fa-regular fa-circle-question" variable="{{name.raw}}" title="More information" style="cursor: pointer;position: absolute;top: 10px;right: 10px; "></i>
                                    <p class="formatted-div-heading" style="font-size: 11px;font-weight: bold; margin-bottom: -2px;margin-top: 10px;margin-right: 20px;">{{name.formatted}}</p>
                                    <div class="formatted-div" style="outline: 0;height: 30px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;text-align: left;padding: 2px 4px;">{{value.formatted}} {{unit}}</div>
                                    <input class="editable-div hidden" readonly value="{{value.raw}}" input-value="{{value.raw}}" type="text" style="cursor: pointer; outline: 0;height: 30px;font-size: 16px;margin-top: 0px;margin-bottom: 10px;width:100%;background: transparent;text-align: left; padding-left: 6px;padding-right: 6px;" placeholder="Variable value">
                                </div>
                            */}, {
                                "name": {
                                    "formatted": name,
                                    "raw": key
                                },
                                "unit": unit ? unit : "",
                                "value": {
                                    "formatted": value,
                                    "raw": data[key]
                                },
                                "type": type
                            }));
                        }
                    }

                    // If the item is already on the list
                    else {

                        var valuechanged = $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find("input").val() != data[key].toString();
                        $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find(".editable-div").val(data[key]).attr("input-value", data[key]);

                        if (valuechanged) {
                            $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find(".formatted-div, .editable-div").addClass("pending");
                            $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find(".formatted-div, .editable-div").addClass("pending");
                            setTimeout(() => {
                                $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find(".formatted-div, .editable-div").removeClass("pending");
                            }, 5000);
                        }
                        else {
                            $(".control-variables-row .list").find(".control-variable-item[variable='" + key + "']").find(".formatted-div, .editable-div").removeClass("pending");
                        }
                    }
                    
                    // Set theme
                    window.globals.accessors["themes"].settheme();

                    $(".control-variable-item input").off("keyup").keyup(function () {
                        self.updatepending = true;
                        $(this).css("border-bottom", "3px solid coral");
                        $(this).parent().find(".formatted-div").css("border-bottom", "3px solid coral");
                        var value = $(this).val();
                        $(this).attr("input-value", value);

                        var variable = $(this).parent().attr("variable");
                        var metadata = self.f.grep(window.globals.data["site"]["CONTROL"], "key", variable, true);
                        var unit = metadata.format && metadata.format.unit.length > 0 ? metadata.format.unit : null;
                        var formattedvalue = metadata.format && metadata.format.formula.length > 0 ? eval(metadata.format.formula.replace("{{VALUE}}", value)) : value;
                        
                        $(this).parent().find(".formatted-div").html(formattedvalue + (unit ? " " + unit : ""));
                    });

                    $(".control-variable-item[type='bool'] input").off("click").click(function () {
                        self.updatepending = true;
                        $(this).css("border-bottom", "3px solid coral");
                        $(this).parent().find(".formatted-div").css("border-bottom", "3px solid coral");

                        var value = $(this).val();
                        if (value.toLowerCase() == "true") {
                            $(this).val("false");
                            $(this).attr("input-value", "false");
                            $(this).parent().find(".formatted-div").html("false");
                        }
                        else {
                            $(this).val("true");
                            $(this).attr("input-value", "true");
                            $(this).parent().find(".formatted-div").html("true");
                        }
                    });

                    $(".control-variables-row .list").find(".formatted-div").off("click").click(function () {
                        $(this).addClass("hidden");
                        $(this).parent().find(".editable-div").removeClass("hidden").focus();
                        $(this).parent().addClass("shadow-medium");

                        if ($(this).parent().attr("type") == "bool") {
                            $(this).parent().find(".editable-div").click();
                        }
                    });

                    $(".control-variables-row .list").find(".editable-div").off("blur").blur(function () {
                        $(this).addClass("hidden");
                        $(this).parent().find(".formatted-div").removeClass("hidden");
                        $(this).parent().removeClass("shadow-medium");
                    });

                    $(".control-variable-item .show-information-button").off("click").click(function () {

                        if (!window.globals.data["site"]["CONTROL"]) return;

                        var variable = $(this).attr("variable");
                        var data = self.f.grep(window.globals.data["site"]["CONTROL"], "key", variable, true);
                        if (!data) return;
                        
                        var html = multiline(function () {/*
                            <div class="control-information-div">
                                <div step="page-one"> 

                                    <div class="row" style="margin: 0;">
                                        <div class="col" style="padding: 12px 16px;">
                                            
                                            <div class="row" style="margin-bottom: 2px; padding: 0 10px;">
                                                <div class="col-auto shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px; margin-bottom: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Variable</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">{{variable}}</p>
                                                </div>

                                                <div class="col-auto shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px; margin-bottom: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Name</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">{{name}}</p>
                                                </div>

                                                <div class="col-auto shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px; margin-bottom: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Unit</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">{{unit}}</p>
                                                </div>

                                                <div class="col-auto shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px; margin-bottom: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Type</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">{{type}}</p>
                                                </div>
                                            </div>
                                            
                                            <div class="row" style="margin-bottom: 10px; padding: 0 10px;">
                                                <div class="col shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Description</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">{{description}}</p>
                                                </div>
                                            </div>

                                            <div class="row" style="margin-bottom: 10px; padding: 0 10px;">
                                                <div class="col shadow-light" style="background: #ffffffde;padding: 6px 10px; margin-right: 8px;">
                                                    <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #b93a3a;">Format</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">The original value of the variable will be formatted using the formula <span style="font-weight: bold;">{{format.formula}}</span>.</p>
                                                    <p style="margin-bottom: 2px; font-size: 15px;">The formatted value will be displayed in the units of '<span style="font-weight: bold;">{{format.unit}}</span>'.</p>
                                                    <p class="formatting-example" style="margin-bottom: 2px; font-size: 15px;"></p>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                
                                    <!-- Buttons -->
                                    <div class="row" style="margin: 0 4px; width: 100%;">
                                        <div class="col-auto" style="padding: 0;">
                                            <button type="clear" class="ui-btn-1 shadow modal-close-button" style="margin: -4px 6px 6px 6px;background: #329E5E;border-radius: 2px;font-size: 14px;padding: 8px 10px 3px;">Close</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        */},
                        {
                            "variable": variable,
                            "description": data.description && data.description.length > 0 ? data.description : "-",
                            "unit": data.unit && data.unit.length > 0 ? data.unit : "-",
                            "type": data.type && data.type.length > 0 ? data.type : "-",
                            "format": {
                                "formula": data.format && data.format.formula && data.format.formula.length > 0 ? data.format.formula : "-",
                                "unit": data.format && data.format.unit && data.format.unit.length > 0 ? data.format.unit : "-"
                            },
                            "name": data.name && data.name.length > 0 ? data.name : "-"
                        });

                        popup().open({
                            html: html,
                            title: "Variable information",
                            subtitle: "Information below shows metadata about the selected variable.",
                            on_load: function (ui, popup) {
                                var controldata = self.f.grep(window.globals.data["site"]["CONTROL"], "key", variable, true);
                                var unit = controldata.unit;
                                var formatunit = data.format && data.format.unit && data.format.unit.length > 0 ? " " + data.format.unit : "";
                                
                                if (controldata.format && controldata.format.formula && controldata.format.formula.length > 0) {
                                    
                                    var min = 5; var max = 99;
                                    var random = Math.floor(Math.random() * (max - min + 1)) + min;

                                    var examplenumber = eval(controldata.format.formula.replace("{{VALUE}}", random).replace(/[^/*+-\d()]/g, '').replace(/\//g, "MUL").replace(/\*/g, "DIV").replace(/\+/g, "SUB").replace(/-/g, "ADD").replace(/MUL/g, "*").replace(/DIV/g, "/").replace(/ADD/g, "+").replace(/SUB/g, "-"));
                                    var numberformatted = eval(controldata.format.formula.replace("{{VALUE}}", examplenumber));
                                    var reverseformula = controldata.format.formula.replace("{{VALUE}}", "X").replace(/[^X/*+-\d()]/g, '');

                                    ui.find(".formatting-example").html(multiline(function () {/* 
                                        For example, let's consider that {{variable}} = {{examplenumber}}{{unit}}. 
                                        The formatting formula will convert the value of the variable as such<br>
                                        <span style="font-weight: bold;">{{formula}}</span> = {{numberformatted}}{{formatunit}}</span>.<br><br>
                                        To reverse the conversion from a formatted value X to the variable's value in original units, use the following formula. <span style="font-weight: bold;">Input the value of Y and solve for X</span>.<br>  
                                        <span style="font-weight: bold;">Y = {{reverse-conversion-formula}}</span><br>
                                        In the example above, Y = {{numberformatted}}{{formatunit}} and X = {{examplenumber}}{{unit}}. 
                                    */},
                                    {
                                        "variable": variable,
                                        "examplenumber": examplenumber,
                                        "unit": unit && unit.length > 0 ? " " + unit : "",
                                        "numberformatted": numberformatted,
                                        "formatunit": formatunit,
                                        "formula": controldata.format.formula.replace("{{VALUE}}", examplenumber),
                                        "reverse-conversion-formula": reverseformula
                                    }));

                                }
                            },
                            listeners: function (ui, popup) {
                                
                            }
                        });

                    });
                });
            }

            else {
                $(".control-variables-row .list").append(multiline (function () {/* 
                    <div class="empty-notification absolute-center" style="color: #999; font-size: 13px;">No control variables</div>
                */}));

                // Remove items if the user switched the site
                $(".control-variables-row .list").find(".control-variable-item").remove();
                
                $(".control-variables-row").find(".update-control-variables-button").parent().addClass("hidden");
            }

            // Start timers
            self.timers();

            $(".control-variables-row .update-control-variables-button").off("click").click(function () {
                self.updatepending = false;

                var object = {};
                $(".control-variables-row .list").find(".control-variable-item").each(function (ei, el) {
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
            $(".control-variables-row .update-control-variables-button").removeClass("ui-disabled");
        }, 250);
    }

}