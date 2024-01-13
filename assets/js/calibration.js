window.globals.apps["calibration"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;
    self.socket = window.socket;

    self.show = function (sensor) {
        self.init(sensor);
        $(".control-buttons-list .calibration-button").click();
        $(".calibration-wizard-ui div[data-step='1'] .next-step-button").removeClass("ui-disabled").click();
    }

    self.init = function (sensor) {

        /*
            ! Listeners
        */
        $(".control-buttons-list .calibration-button").off("click").click(function () {
            var html = multiline(function () {/* 
                <div class="calibration-wizard-ui">

                    <!-- Step 0 -->
                    <div class="row" data-step="0">
                        <div class="col-12">
                            <h2>Calibration wizard</h2>
                            <hr>
                        </div>
                    </div>

                    <!-- Step 1 -->
                    <div class="row" data-step="1">
                        <div class="col-auto" style="font-size: 54px;color: cadetblue; margin-top: 20px;">
                            1
                        </div>
                        <div class="col">
                            <p>
                                Hello {{email}},<br>
                                To start the calibration process, please select the sensor you want to calibrate.
                            </p>

                            <div style="background: #EEE;border: 1px solid #DDD;padding: 8px;width: fit-content; margin-bottom: 10px;">
                                <div style="margin-bottom: 6px; color: #AAA; font-size: 14px;">Select a sensor:</div>
                                <select class="sensor-selector" style="font-size: 22px; min-width: 90px;  max-width: 230px; outline: 0; border: 0; border-bottom: 1px solid #BBB; background: transparent;">
                                    <option value="" selected></option>
                                </select>
                            </div>

                            <!-- Next button -->
                            <div class="next-step-button col-auto shadow ui-disabled" style="display: inline-block; cursor: pointer; background: #e33887; border: 0px solid #EEE; color: #FFFFFFEE; padding: 6px 12px; margin-right: 10px; margin-top: 10px;">
                                Next
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2 -->
                    <div class="row ui-disabled" data-step="2">
                        <div class="col-auto step-number" style="font-size: 54px;color: cadetblue; margin-top: 20px;">
                            2
                        </div>
                        <div class="col">
                            <hr>
                            <p style="margin-bottom: 0px;">
                                Click on the 'Begin' button below to start the calibration. The wizard will show the response messages from the device for every calibration step. If the step fails, you can retry the action.
                            </p>

                            <!-- Next button -->
                            <div class="next-step-button col-auto shadow" style="display: inline-block; cursor: pointer; background: #e33887; border: 0px solid #EEE; color: #FFFFFFEE; padding: 6px 12px; margin-right: 10px; margin-top: 10px;">
                                Begin
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 3 -->
                    <div class="row ui-disabled" data-step="3">
                        <div class="col-auto step-number" style="font-size: 54px;color: cadetblue; margin-top: 20px;">
                            3
                        </div>
                        <div class="col">
                            <hr>
                            <p style="margin-bottom: 0px;">Connection status</p>
                            <div style="padding: 8px 16px;">

                                <!-- Connection status -->
                                <p style="margin-bottom: 0px;">
                                    <i class="fas fa-signal" style="font-size: 12px; color: #F6840D; margin-right: 10px;"></i> <span class="connection-status-text">-</span>
                                </p>

                            </div>

                            <!-- Next button -->
                            <div class="next-step-button col-auto shadow" style="display: inline-block; cursor: pointer; background: #e33887; border: 0px solid #EEE; color: #FFFFFFEE; padding: 6px 12px; margin-right: 10px; margin-top: 10px;">
                                Proceed
                            </div>
                        </div>
                    </div>
                </div>
            */},
                {
                    email: self.ls.getItem("login/email")
                }
            )

            window.globals.accessors["htmlslidein"].open({
                html: html,
                css: {
                    "height": "90vh",
                    "max-width": "90vw"
                },
                on_load: function () {

                    // Set the calibratable sensors
                    window.globals.data["data-fields-calibratable"].forEach(function (df, di) {
                        $(".calibration-wizard-ui .sensor-selector").append(multiline(function () {/*
                            <option value="{{id}}" style="font-size: 18px;" {{selected}}>{{id}}</option>'
                        */},
                            {
                                id: df["ID"],
                                selected: sensor && df["ID"] == sensor ? "selected" : ""
                            }
                        ));
                    });

                },
                listeners: function () {
                    $(".calibration-wizard-ui .sensor-selector").off("change").change(function () {
                        var value = $(this).val();

                        if (value.length == 0) {
                            $(".calibration-wizard-ui").find("div[data-step='1']").find(".next-step-button").addClass("ui-disabled");
                        }
                        else {
                            $(".calibration-wizard-ui").find("div[data-step='1']").find(".next-step-button").removeClass("ui-disabled");
                        }
                    });

                    // Next step
                    $(".calibration-wizard-ui .next-step-button").off("click").click(function () {
                        var step = parseInt($(this).parent().parent().attr("data-step"));

                        $(".calibration-wizard-ui").find("div[data-step='" + (step) + "']").addClass("ui-disabled");
                        $(".calibration-wizard-ui").find("div[data-step='" + (step + 1) + "']").removeClass("ui-disabled");

                        if (step + 1 == 2) {
                            
                            self.socket.publish({
                                topic: "gb-aws-server/calibration/perform",
                                payload: $(".calibration-wizard-ui .sensor-selector").val().toLowerCase() + ":0"
                            });
                        }
                    });

                    // Previous step
                    $(".calibration-wizard-ui .prev-step-button").off("click").click(function () {
                        var step = parseInt($(this).parent().parent().attr("data-step"));

                        $(".calibration-wizard-ui").find("div[data-step='" + (step) + "']").addClass("ui-disabled");
                        $(".calibration-wizard-ui").find("div[data-step='" + (step - 1) + "']").removeClass("ui-disabled");
                    });
                }
            });
        })

        return self;
    }

    self.get_calibratable_datafields = function () {
        window.globals.data["data-fields-calibratable"] = [];

        window.globals.data["data-fields"].forEach(function (df, di) {
            if (!df["CALIBRATION"] || !df["CALIBRATION"]["REQUIRED"]) return;
            window.globals.data["data-fields-calibratable"].push(df)
        });
    }

}