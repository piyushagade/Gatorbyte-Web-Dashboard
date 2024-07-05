window.globals.apps["readings"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        return self;
    }
    
    self.process_data_fields = function (callback) {

        if (!window.globals.data["data-fields"]) {
            console.error("No data-fields detected.");
            return;
        }

        // TODO: Fix this: Sorting based on the 'order' in the configuration file.
        window.globals.data["data-fields"] = window.globals.data["data-fields"].sort(self.f.sort_json("order"));

        window.globals.data["data-fields-readings-formatted"] = {};
        window.globals.data["data-fields-readings-reference-formatted"] = {};
        
        //! Apply formula to data and process BVOLT
        window.globals.data["data-fields"].forEach(function (df, di) {

            if (df.FORMULA) {
                window.globals.data["data-fields-readings"].forEach(function (row, ri) {
                    var value = row[df.ID];
                    if(!value) row[df.ID] = 0;

                    row[df.ID] = self.f.applyformula(df, df.FORMULA, row);
                });

                if (window.globals.data["data-fields-readings-reference"]) {
                    window.globals.data["data-fields-readings-reference"].forEach(function (row, ri) {
                        var value = row[df.ID];
                        if(!value) row[df.ID] = 0;

                        row[df.ID] = self.f.applyformula(df, df.FORMULA, row);
                    });
                }
            }

            // Estimate battery life runtime
            if (df["ID"] == "BVOLT") {

                // Find the timestamp when the voltage will reach 3.5 V
                let targetTimestamp = null;

                window.globals.data["data-fields-readings"].forEach((entry, index, array) => {
                    
                    const voltage = parseFloat(entry.BVOLT);
                    const timestamp = parseInt(entry.TIMESTAMP, 10);
                    
                });

                if (window.globals.data["data-fields-readings"].length > 0) {
                    const voltage = parseFloat(window.globals.data["data-fields-readings"].slice(-1)[0].BVOLT);
                    var percentage = self.f.volttolevel(voltage) || 0;
                    console.log("Last known battery level for " + voltage + "V: " + percentage.toFixed(2) + "%");
                }
            }
        });

        // For each data point, create a data-field (map or chart)
        $(".data-summary-fields-list .list").html("");

        // Order the data fields
        window.globals.data["data-fields"] = window.globals.data["data-fields"].sort(function (a, b) { return a["ORDER"] < b["ORDER"] ? - 1 : 1; });

        var invalidtimestamprows = [];
        var datapointscount = {};
        
        window.globals.data["data-fields"].forEach(function (df, di) {
            
            var datasource = df["SOURCE"] && df["SOURCE"]["TYPE"] ? df["SOURCE"]["TYPE"] : "gatorbyte"; 

            /*
                ! Construct data sourced from an external API service
            */
            if (datasource == "api") {
                var baseurlstring = df["SOURCE"]["URL"] && df["SOURCE"]["URL"]["BASE"] ? df["SOURCE"]["URL"]["BASE"] : "";
                var onurl = eval(df["SOURCE"]["FUNCTIONS"] && df["SOURCE"]["FUNCTIONS"]["ONURL"] ? df["SOURCE"]["FUNCTIONS"]["ONURL"] : "(url) { return url; }");
                baseurlstring = onurl(baseurlstring);

                var apiurl = self.f.applyvarsubstitution(baseurlstring);
                var ondata = eval(df["SOURCE"]["FUNCTIONS"] && df["SOURCE"]["FUNCTIONS"]["ONDATA"] ? df["SOURCE"]["FUNCTIONS"]["ONDATA"] : "(data) { return []; }");

                $.ajax({
                    type: 'GET',
                    url: apiurl,
                    success: function(data) {

                        var parseddata = ondata(data);

                        parseddata.forEach(function (row, ri) {
                            if (!window.globals.data["data-fields-readings-formatted"][df.ID]) window.globals.data["data-fields-readings-formatted"][df.ID] = [];

                            if (df.CHART) {

                                var value = parseFloat(row["VALUE"]);
                                window.globals.data["data-fields-readings-formatted"][df.ID].push([parseInt(row["TIMESTAMP"]) * 1000 - parseInt(window.globals.variables["tz-offset"]) * 0, value]);
                            }
                            else if (df.MAP) {
                                window.globals.data["data-fields-readings-formatted"][df.ID].push([parseInt(row["TIMESTAMP"]), parseFloat(row["LAT"]), parseFloat(row["LNG"])]);
                            }
                        });

                        // Draw chart
                        if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
                        window.globals.accessors["charts"].draw_all_data(df.ID);

                    },
                    error: function (request, textStatus, errorThrown) { }
                });
            }

            /*
                ! Construct data sourced from the GatorByte device
            */
            if (datasource == "gatorbyte") {

                window.globals.data["data-fields-readings"].forEach(function (row, ri) {
                    if (!window.globals.data["data-fields-readings-formatted"][df.ID]) window.globals.data["data-fields-readings-formatted"][df.ID] = [];

                    // Filter invalid timestamp rows
                    if (row.TIMESTAMP < 1000000000) {
                        invalidtimestamprows.push(row);
                    }

                    else {
                        if (df.CHART) {

                            if (!datapointscount[df.ID]) datapointscount[df.ID] = 0;
                            datapointscount[df.ID] += 1;

                            var value = parseFloat(row[df.ID]);
                            window.globals.data["data-fields-readings-formatted"][df.ID].push([parseInt(row.TIMESTAMP) * 1000 - parseInt(window.globals.variables["tz-offset"]) * 0, value]);
                            
                            // Is hvalue reference value?
                            var hvalue = parseFloat("H" + row[df.ID]);
                            if (!isNaN(hvalue)) window.globals.data["data-fields-readings-formatted"]["H" + df.ID].push([parseInt(row.TIMESTAMP) - parseInt(window.globals.variables["tz-offset"]) * 0, hvalue]);

                        }
                        else if (df.MAP) {
                            window.globals.data["data-fields-readings-formatted"][df.ID].push([parseInt(row.TIMESTAMP), parseFloat(row["LAT"]), parseFloat(row["LNG"])]);
                        }
                        if (df.QUICKVIEW) { 

                            if (df.ID == "GPS") {
                                // Set the data summary field with the latest data
                                if (ri >= window.globals.data["data-fields-readings"].length - 1 - 20) {

                                    setTimeout(() => {
                                        if (row["LAT"] == 0 || row["LNG"] == 0) return;
                                        $(".data-summary-fields-list .data-summary-field[data-series-id='" + df.ID + "']").find(".value").html(row["LAT"] + "," + row["LNG"]).css("cursor", "pointer").off("click").click(function () {

                                            $("<a class='temp-url'>").prop({
                                                target: "_map",
                                                // href: 'https://www.latlong.net/c/?lat=' + row["LAT"] + '&long=' + row["LNG"]
                                                // href: 'https://latitude.to/lat/' + row["LAT"] + '/lng/' + row["LNG"]
                                                href: "https://www.google.com/maps/place/" + row["LAT"] + "," + row["LNG"]
                                            })[0].click().remove();
                                        });
                                    }, 100);
                                }
                            }

                            else {

                                var value = parseFloat(row[df.ID]);
                                window.globals.data["data-fields-readings-formatted"][df.ID].push([(parseInt(row.TIMESTAMP) - parseInt(window.globals.variables["tz-offset"]) * 0) * 1000, value]);
                                
                                // Set the data summary field with the latest data
                                if (ri == window.globals.data["data-fields-readings"].length - 1) {
                                    setTimeout(() => {

                                        var formattedvalue = value.toFixed(2);
                                        var format = df.QUICKVIEW && df.QUICKVIEW["TYPE"] ? df.QUICKVIEW["TYPE"] : "float";

                                        if (df.QUICKVIEW && df.QUICKVIEW["TYPE"] == "integer") {
                                            formattedvalue = parseInt(value);
                                        }
                                        else if (df.QUICKVIEW && df.QUICKVIEW["TYPE"] == "float") {
                                            formattedvalue = value.toFixed(df.QUICKVIEW["PRECISION"] ? df.QUICKVIEW["PRECISION"] : 2);
                                        }

                                        $(".data-summary-fields-list").removeClass("hidden");
                                        $(".data-summary-fields-list .data-summary-field[data-series-id='" + df.ID + "']").find(".value").html(value && !isNaN(formattedvalue) ? formattedvalue : "-");
                                        $(".data-summary-fields-list .last-update-timestamp").attr("title", moment(row.TIMESTAMP * 1000).format("LLL")).html(multiline (function () {/* 
                                            <div class="status-circle {{colorclass}}"></div>
                                            <div>{{timestamp}}</div>
                                        */}, {
                                            "timestamp": moment(row.TIMESTAMP * 1000).fromNow(),
                                            "colorclass": moment.now() - row.TIMESTAMP * 1000 < 2 * 3600 * 1000 ? "active" : (moment.now() - row.TIMESTAMP * 1000 < 12 * 3600 * 1000 ? "warning" : "error")
                                        }));
                                    }, 100);
                                }
                            }
                        }
                    }

                });

                /*
                    ! Construct reference data
                */
                if (window.globals.data["data-fields-readings-reference"]) {
                    window.globals.data["data-fields-readings-reference"].forEach(function (row, ri) {
                        if (!window.globals.data["data-fields-readings-reference-formatted"][df.ID]) window.globals.data["data-fields-readings-reference-formatted"][df.ID] = [];
                        
                        if (df.CHART) {
                            var value = parseFloat(row[df.ID]);
                            if (value && !isNaN(value)) window.globals.data["data-fields-readings-reference-formatted"][df.ID].push([(parseInt(row.TIMESTAMP) - parseInt(window.globals.variables["tz-offset"]) * 0) * 1000, value]);
                        }
                        else if (df.MAP) {
                            window.globals.data["data-fields-readings-reference-formatted"][df.ID].push([parseInt(row.TIMESTAMP), parseFloat(row["LAT"]), parseFloat(row["LNG"])]);
                        }
                    });
                }

            }

            //! Add map ui
            if (df.MAP) {

                $(".data-fields-list-heading").removeClass("hidden");
                $(".data-fields-list").removeClass("hidden");

                // Add html
                $(".data-fields-list").find(df["HIGHLIGHT"] ? ".highlights-list" : ".non-highlights-list").append(multiline(function () {/* 
                    
                
                    <!-- Map container parent-->
                    <div class="col-{{size}} shadow-light data-field {{id}}-map-container-parent" style="padding: 8px 8px; min-height: 100px; border-radius: 16px; margin: 5px 10px 5px 0px;">
                        
                        <!-- Filter -->
                        <div class="map-filter-parent">
                            <div class="row">
                                <div class="col-12">
                                    <div class="map-filter-div">
                                        <i class="fas fa-filter" style="margin-right: 8px; margin-top: 3px;"></i>
                                        <span style="margin-right: 8px;">Showing the last</span>
                                        <input class="map-filter-number" style="margin-right: 8px;"/>
                                        <span>map markers.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Map container -->
                        <div id="map-container" class="map-container {{id}}-map-container" style="height: 550px;"></div>
                    </div>
                */},
                    {
                        id: df.ID,
                        size: df["HIGHLIGHT"] ? "12" : "auto"
                    }
                ));

                // Filter listener
                $("." + df.ID + "-map-container-parent .map-filter-div .map-filter-number").off("keyup").keyup(self.f.debounce(function () {
                    var value = $(this).val();
                    if (isNaN(parseInt(value))) return;
                    window.globals.accessors["maps"].draw_all_data();
                }, 1000));
            }

            //! Add chart ui
            if (df.CHART) {
                
                $(".data-fields-list-heading").removeClass("hidden");
                $(".data-fields-list").removeClass("hidden");

                var units = df.UNITS || df.CHART.UNITS;

                // Add html for chart container
                $(".data-fields-list").find(df["HIGHLIGHT"] ? ".highlights-list" : ".non-highlights-list").append(multiline(function () {/* 
                    
                    <div class="col-{{size}} shadow-light data-field" data-series-name={{name}} data-series-id={{id}} style="position: relative; padding: 6px 8px; min-height: 100px; margin: 5px 10px 5px 0px; max-width: {{chartparent-maxwidth}}; height: fit-content; border-radius: 16px;">
                    
                        <!-- Header row -->    
                        <div class="row" style="margin: 0; margin-top: 6px; margin-bottom: 6px;">
                            <div class="col" style="padding: 0 10px;">
                                <p class="chart-heading" style="margin-bottom: 0px; font-size: 14px; margin-left: 0px; ">{{id}} readings {{units}}</p>
                            </div>
                            <div class="col-auto" style="padding: 0 12px;">
                                <i class="fas fa-window-maximize toggle-moving-average-button chart-action-button" style="cursor: pointer;" title="Toggle moving average filter"></i>
                            </div>
                            <div class="col-auto" style="padding: 0 12px;">
                                <i class="fas fa-bezier-curve toggle-sg-filter-button chart-action-button" style="cursor: pointer;" title="Toggle Savitzky-Golay filter"></i>
                            </div>
                            <div class="col-auto" style="padding: 0 12px;">
                                <i class="fas fa-expand expand-data-field-button chart-action-button" style="cursor: pointer;" title="Expand"></i>
                            </div>
                            <div class="col-auto" style="padding: 0 12px;">
                                <i class="fas fa-plus show-data-field-options-button chart-action-button" style="cursor: pointer;" title="More info"></i>
                            </div>
                        </div>

                        <!-- Data stats -->    
                        <div class="row hidden {{id}}-chart-stats-div chart-stats-div" style="margin: 0 0 2px 0;">
                            <div class="col" style=" padding: 0 10px; ">
                                <div class="scrollbar-style-horizontal" style="display: inline-flex; width: 100%; overflow-x: auto;  padding-bottom: 4px;">
                                    <div class="mean-value stat-item hidden" name="mean" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Mean</p>
                                        <p class="value" style="margin: 0; font-size: 18px;"></p>
                                    </div>
                                    
                                    <div class="min-value stat-item hidden" name="min" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Min.</p>
                                        <p class="value" style="margin: 0; font-size: 18px;"></p>
                                    </div>

                                    <div class="max-value stat-item hidden" name="max" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Max.</p>
                                        <p class="value" style="margin: 0; font-size: 18px;"></p>
                                    </div>

                                    <div class="std-deviation stat-item hidden" name="std" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Std.</p>
                                        <p class="value" style="margin: 0; font-size: 18px;"></p>
                                    </div>

                                    <div class="variance stat-item hidden" name="var" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Variance</p>
                                        <p class="value" style="margin: 0; font-size: 18px;"></p>
                                    </div>

                                    <div class="histogram stat-item hidden" name="histogram" style="margin-right: 6px;padding: 5px 10px 3px;border-radius: 10px;">
                                        <p class="heading" style="font-size: 12px; margin-bottom: 2px; font-size: 12px; margin-bottom: -2px;">Histogram</p>
                                        <div id="{{id}}-stat-histogram-chart" class="histogram-chart" style="margin: 0;"></div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        
                        <!-- Chart row -->    
                        <div class="row" style="margin: 0;">
                            <div class="col" style="padding: 0;">
                                <div class="{{id}}-chart-div chart-div" style="height: {{height}}; width: {{width}}; max-width: {{chartdiv-maxwidth}};">
                                    <div class="empty-notification absolute-center" style="color: #999; font-size: 13px; z-index: 1;"><i class="fa-solid fa-chart-line" style="margin-right: 6px;"></i>No data yet</div>
                                    <div id="{{id}}-line-chart" class="chart-container" style="width: 100%; height: {{height}};"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Chart options curtain -->    
                        <div class="row data-field-options-div scrollbar-style shadow-medium hidden" style="padding: 0;margin: 0;position: absolute;top: 0;left: 0;right: 0;bottom: 0;backdrop-filter: blur(6px);overflow-y: auto;overflow-x: hidden;">
                            <div class="col" style="padding: 12px 16px; background-color: #14302db8; color: #EEE; font-size: 13px;">
                                
                                <div class="row" style="margin-bottom: 10px;">
                                    <div class="col">
                                        <p style="color: #BBB; margin-bottom: 0;">Chart options</p>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-times hide-data-field-options-button" style="color: #CCCCCC;cursor: pointer;font-size: 20px;" title="Close"></i>
                                    </div>
                                </div>
                                
                                <div class="row" style="margin-bottom: 10px; padding: 0 10px;">
                                    <div class="col-auto shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px; max-width: 115px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Y-axis min. value</p>
                                        <input class="y-axis-range-input" type="min" chart-id="{{id}}" style="width:100%; background: transparent; border: 0; outline: 0; color: white; text-align: center; border-bottom: 1px solid #BBB;"/>
                                    </div>
                                    <div class="col-auto shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px; max-width: 115px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Y-axis max. value</p>
                                        <input class="y-axis-range-input" type="max" chart-id="{{id}}" style="width:100%; background: transparent; border: 0; outline: 0; color: white; text-align: center; border-bottom: 1px solid #BBB;"/>
                                    </div>
                                </div>

                                <div class="row" style="margin-bottom: 10px; margin-top: 24px;">
                                    <div class="col">
                                        <p style="color: #BBB; margin-bottom: 0;">Sensor information</p>
                                    </div>
                                </div>
                            
                                <div class="row" style="margin-bottom: 10px; padding: 0 10px;">
                                    <div class="col-auto shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Name</p>
                                        <p style="margin-bottom: 2px; font-size: 15px;">{{name}}</p>
                                    </div>

                                    <div class="col-auto shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Brand</p>
                                        <p style="margin-bottom: 2px; font-size: 15px;">{{brand}}</p>
                                    </div>
                                </div>
                                <div class="row" style="margin-bottom: 10px; padding: 0 10px;">
                                    <div class="col shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Description</p>
                                        <p style="margin-bottom: 2px; font-size: 15px;">{{description}}</p>
                                    </div>
                                </div>
                                <div class="row {{calibration.visible}}" style="margin-bottom: 10px; padding: 0 10px;">
                                    <div class="col shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Calibration</p>
                                        <p style="margin-bottom: 2px; font-size: 15px;">This sensor can be calibrated.</p>
                                        <div class="ui-btn-1 green calibration-button col-auto shadow" style="cursor: pointer; font-size: 14px;" sensor-id="{{id}}">
                                            Calibrate
                                        </div>
                                        <p style="margin-bottom: 2px; font-size: 13px; color: #BBB; margin-top: 6px;">{{calibration.lastcalibrated}}</p>
                                    </div>
                                </div>
                                <div class="row {{table.visible}}" style="margin-bottom: 10px; padding: 0 10px;">
                                    <div class="col shadow" style="background: #aaaaaa2e;padding: 6px 10px; margin-right: 8px;">
                                        <p style="margin-bottom: 2px; font-size: 12px; font-weight: bold; color: #ffc107;">Group</p>
                                        <p style="margin-bottom: 2px; font-size: 15px;">The data is populated in datatable in "<span style="color: #f7db11;">{{table.group}}</span>" tab.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                */},
                    {
                        size: df["HIGHLIGHT"] ? "12" : "auto",
                        height: df["HIGHLIGHT"] ? "400px" : "200px",
                        width: df["HIGHLIGHT"] ? "100%" : "400px",
                        "chartparent-maxwidth": df["HIGHLIGHT"] ? "100%" : "100%",
                        "chartdiv-maxwidth": "100%",
                        id: df.ID,
                        units: units && units.length > 0 ? "(" + units + ")" : "",
                        name: df.NAME,
                        brand: df.BRAND,
                        description: df.DESCRIPTION,
                        calibration: {
                            visible: df.CALIBRATION ? "" : "hidden",
                            lastcalibrated: df.CALIBRATION && df.CALIBRATION["LAST-CALIBRATED"] ?  "This sensor was last calibrated on " + moment(parseInt(df.CALIBRATION["LAST-CALIBRATED"])).format("LLL") : "This sensor has never been calibrated."
                        },
                        table: {
                            visible: df.TABLE ? "" : "hidden",
                            group: df.TABLE && df.TABLE["GROUP-NAME"] ?  df.TABLE["GROUP-NAME"] : ""
                        }
                    }
                ));


                // Draw chart
                if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
                window.globals.accessors["charts"].draw_all_data(df.ID);

            }

            //! Add quickview base ui
            if (df.QUICKVIEW) {

                $(".data-fields-list .list").removeClass("hidden");

                // Add html for data summary/quickview field
                $(".data-summary-fields-list .list").append(multiline(function () {/* 
                    
                    <div class="col-{{size}} shadow-light data-summary-field" data-series-name={{name}} data-series-id={{id}} style="position: relative; padding: 0; margin: 5px 10px 5px 0px; border-radius: 16px; min-width: 75px;">
                    
                        <!-- Header row -->    
                        <div class="row" style="margin: 0; margin-top: 10px; margin-bottom: -4px;">
                            <div class="col">
                                <p class="heading" style="margin-bottom: 0px; font-size: 12px; color: rgb(248, 112, 112);">{{id}}</p>
                            </div>
                        </div>
                        
                        <!-- Value row -->    
                        <div class="row" style="margin: 0 0 6px 0;">
                            <div class="col value" style="font-size: 26px;">
                                -
                            </div>
                        </div>
                        
                    </div>
                */},
                    {
                        size: "auto",
                        height: df["HIGHLIGHT"] ? "400px" : "200px",
                        width: df["HIGHLIGHT"] ? "100%" : "400px",
                        id: df.ID,
                        name: df.NAME,
                        brand: df.BRAND,
                        description: df.DESCRIPTION
                    }
                ));
            }

            /*
                ! Listeners
            */
            $(".data-fields-list .show-data-field-options-button").off("click").click(function () {
                var root = $(this).parent().parent().parent();

                root.find(".data-field-options-div").removeClass("hidden");

                var chart = $(root).attr("data-series-id");
                var min = self.ls.getConfig({ category: chart + "-" + "chart", key: "y-min"});
                var max = self.ls.getConfig({ category: chart + "-" + "chart", key: "y-max"});

                if (min) root.find(".y-axis-range-input[type='min']").val(min);
                if (max) root.find(".y-axis-range-input[type='max']").val(max);
            });

            $(".data-fields-list .hide-data-field-options-button").off("click").click(function () {
                var root = $(this).parent().parent().parent().parent().parent();

                root.find(".data-field-options-div").addClass("hidden");
            });

            $(".data-fields-list .calibration-button").off("click").click(function () {
                window.globals.accessors["calibration"].show($(this).attr("sensor-id"));
            });

            $(".y-axis-range-input").off("keyup").keyup(self.f.debounce(function () {
                var chart = $(this).attr("chart-id");

                var min = $(".y-axis-range-input[chart-id='" + chart + "'][type='min']").val();
                var max = $(".y-axis-range-input[chart-id='" + chart + "'][type='max']").val();

                if (min && min.length > 0 && !isNaN(parseInt(min)) && max && max.length > 0 && !isNaN(parseInt(max))) {
                    $("#" + chart + "-line-chart").highcharts().yAxis[0].update({
                        min: min,
                        max: max,
                        tickInterval: 1
                    });

                    // Save data in local storage
                    self.ls.setConfig({
                        category: chart + "-" + "chart",
                        key: "y-min",
                        data: min
                    });
                    self.ls.setConfig({
                        category: chart + "-" + "chart",
                        key: "y-max",
                        data: max
                    });
                }
            }, 300));

            //! Popup chart
            $(".data-fields-list .expand-data-field-button").off("click").click(function () {
                var root = $(this).parent().parent().parent();

                var series_name = root.attr("data-series-name");
                var series_id = root.attr("data-series-id");

                popup().open({
                    html: multiline(function () {/* 
                        <div>
                            <div class="row">
                                <div class="col">
                                    <div id="expanded-chart-div" series-name="{{series-name}}"" style="width: 100%;">
                                    </div>
        
                                </div>
                            </div>
                        </div>
                    */},
                        {
                            "series-name": series_name
                        }
                    ),
                    close_button: true,
                    title: series_name + " chart",
                    subtitle: "The chart shows the readings since the sensor/device started collecting data. You can add other sensor's/device's readings that belong to the same \"chart group\" from the chart's legend.",
                    css: {
                        "max-height": "90vh",
                        "max-width": "90vw"
                    },
                    theme: self.ls.getItem("/settings/theme") || "dark",
                    on_load: function () {

                        /*
                            ! Prepare data
                        */
                        
                        var timestamp_data = {}, series_data = {};
                        window.globals.data["data-fields-readings-formatted"][series_id].forEach(function(d, i) {

                            if (!timestamp_data[series_id]) timestamp_data[series_id] = [];
                            if (!series_data[series_id]) series_data[series_id] = [];

                            var value = parseFloat(d[1]);

                            timestamp_data[series_id].push(d[0] / 1000 - moment(moment.now()).utcOffset() * 60 * 0);
                            series_data[series_id].push([d[0] / 1000 - moment(moment.now()).utcOffset() * 60 * 0, parseFloat(value)]);
                        });

                        // Add the series for the selected data-field to the chart
                        var yaxisindex = 0;
                        var serieses = [
                            {
                                name: series_name,
                                data: series_data[series_id],
                                // type: (self.f.grep(window.globals.data["data-fields"], "ID", series_id, true))["CHART"]["TYPE"],
                                yAxis: yaxisindex++,
                            }
                        ]

                        var yaxises = [
                            {
                                minTickInterval: 2,
                                // min: 0
                            }
                        ];

                        // Get group name of the data-field being shown
                        var groupname;
                        window.globals.data["data-fields"].forEach(function (df, di) {
                            if (!df.CHART) return;
                            
                            // Get group name of the data-field being shown
                            if (df["ID"] == series_id) groupname = df["CHART"]["GROUP-NAME"];
                        });
                        
                        // Get other data-fields in same group, and add to the chart as a series
                        window.globals.data["data-fields"].forEach(function (df, di) {
                            if (!df.CHART) return;

                            // If the group name is same as the data-field's group name
                            if (df["ID"] != series_id && df["CHART"]["GROUP-NAME"] == groupname) {
                                window.globals.data["data-fields-readings-formatted"][df.ID].forEach(function(d, i) {
                                    if (!timestamp_data[df.ID]) timestamp_data[df.ID] = [];
                                    if (!series_data[df.ID]) series_data[df.ID] = [];
        
                                    timestamp_data[df.ID].push(d[0] / 1000 - moment(moment.now()).utcOffset() * 60 * 0);
                                    series_data[df.ID].push([d[0] / 1000 - moment(moment.now()).utcOffset() * 60 * 0, parseFloat(d[1])]);
                                });

                                // Push to serieses data
                                serieses.push({
                                    name: df.ID,
                                    data: series_data[df.ID],
                                    visible: false,
                                    yAxis: yaxisindex++,
                                });

                                // Add to yaxises
                                yaxises.push({
                                    minTickInterval: 2,
                                    // min: 0
                                });
                            }
                        });

                        // Make a popup highstocks chart
                        var chart = Highcharts.stockChart(
                            "expanded-chart-div",
                            {
                                chart: {
                                    height: 600,
                                    marginRight: 30,
                                    marginTop: 0,
                                    backgroundColor: "transparent",
                                    zoomType: 'x',
                                    panning: true,
                                    panKey: 'shift',
                                },
                                title: {
                                    text: ".",
                                    style: {
                                        color: "transparent"
                                    }
                                },
                                subtitle: {
                                    text: null
                                },
                                rangeSelector: {
                                    buttonPosition: {
                                        y: -20
                                    },
                                    inputPosition: {
                                        y: -10
                                    },
                                    inputEnabled: false,
                                    buttons: [
                                        {
                                            type: "hour",
                                            count: 1,
                                            text: "Hour"
                                        },
                                        {
                                            type: "hour",
                                            count: 6,
                                            text: "6 hrs"
                                        },
                                        {
                                            type: "day",
                                            count: 1,
                                            text: "Day"
                                        },
                                        {
                                            type: "all",
                                            text: "All"
                                        }
                                    ],
                                    buttonTheme: {
                                        width: 40,
                                        r: 0,
                                        fill: "#EEE",
                                        stroke: "#DDD",
                                        'stroke-width': 1,
                                        states: {
                                            select: {
                                                fill: "#E95D5D",
                                                style: {
                                                    color: "white",
                                                }
                                            }
                                        }
                                    },
                                    selected: 2,
                                },
                                navigator: {
                                },
                                scrollbar: {
                                    enabled: true
                                },
                                xAxis: {
                                    type: "datetime",
                                    categories: timestamp_data[series_id],
                                    dateTimeLabelFormats: {
                                        day: '%b %e',
                                        minute:  '%I:%M %p',
                                        hour: '%I:%M'
                                    },
                                },
                                yAxis: yaxises,
                                plotOptions: {
                                    series: {
                                        dataGrouping: {
                                            enabled: false
                                        },
                                        stickyTracking: false,
                                        showInNavigator: true,
                                        marker: {
                                            enabled: false
                                        },
                                        animation: false,
                                        point: {
                                            events: {
                                                click: function (e) {
                                                    console.log(this.x + ", " + xmoment(parseInt(this.x)).format("LLLL") + ', ' + this.y);
                                                    window.globals.accessors["charts"].addSynchronizedPlotLine(this.x);
                
                                                    var xval = this.x;
                                                    var yval = this.y;
                                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", series_id, true);
                                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                                    var name = datafieldinfo.NAME;
                                                    var color = this.color;
                                                    var time = xmoment(parseInt(xval)).format("LLLL");
                                                    if (time == "Invalid date") time = xval;
                
                                                    var html = multiline(function () {/* 
                                                        <div style="border-left: 4px solid {{color}}; padding-left: 4px;"><b>{{name}}</b></div>
                                                        <div style="margin: 4px 2px 0 0; padding-left: 6px;"><span style="color: #888;">y:</span> {{yval}} {{units}}</div>
                                                        <div style="margin: 2px 2px 0 0; padding-left: 6px;"><span style="color: #888;">x:</span> {{time}}</div>
                                                    */}, {
                                                        color: color,
                                                        name: name,
                                                        yval: yval.toFixed(2),
                                                        units: units ? units : "",
                                                        time: time
                                                    }).trim();
                
                                                    window.globals.accessors["charts"].showexternaltooltip({
                                                        html: html
                                                    });
                                                    
                                                },
                                                mouseOver: function (e) {

                                                    var xval = this.x;
                                                    var yval = this.y;
                                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", series_id, true);
                                                    
                                                    var series = e.target.series.chart.get(datafieldinfo.ID);

                                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                                    var name = datafieldinfo.NAME;
                                                    var color = this.color;
                                                    var time = xmoment(parseInt(xval)).format("LLLL");
                                                    if (time == "Invalid date") time = xval;
                
                                                    var html = multiline(function () {/* 
                                                        <div style="border-left: 4px solid {{color}}; padding-left: 4px;"><b>{{name}}</b></div>
                                                        <div style="margin: 4px 2px 0 0; padding-left: 6px;"><span style="color: #888;">y:</span> {{yval}} {{units}}</div>
                                                        <div style="margin: 2px 2px 0 0; padding-left: 6px;"><span style="color: #888;">x:</span> {{time}}</div>
                                                    */}, {
                                                        color: color,
                                                        name: name,
                                                        yval: yval.toFixed(2),
                                                        units: units ? units : "",
                                                        time: time
                                                    }).trim();
                
                                                    window.globals.accessors["charts"].showexternaltooltip({
                                                        html: html
                                                    });
                                                },
                                                mouseOut: function (e) {
                                                    
                                                    // Hide external tooltip
                                                    $("body").find(".external-chart-tooltip-parent").remove();
                                                }
                                            }
                                        }
                                    },
                                    column: {
                                        stacking: "normal"
                                    }
                                },
                                tooltip: {
                                    valueDecimals: 2,
                                    split: false,
                                    shared: true,
                                    enabled: false,
                                },
                                credits: {
                                    enabled: false
                                },
                                series: serieses,
                                legend: {
                                    enabled: true
                                }
                            }
                        );

                        // Chart-level mouseout event
                        $(chart.container).parent().parent().parent().parent().parent().parent().off("mouseleave").mouseleave(function (e) {
                            
                            // Hide external tooltip
                            $("body").find(".external-chart-tooltip-parent").remove();
                        });

                        Highcharts.addEvent(chart.container, 'mousemove', function (e) {
                            
                            var xval = chart.xAxis[0].toValue(e.chartX);
                            triggerMousemoveAtX(e, chart, xval);
                        });

                        function triggerMousemoveAtX(e, chart, xValue) {
                            // Find the nearest point to the specified x-value
                            var point = chart.series[0].points.find(function (p) {
                                return Math.abs(p.x - xValue) === Math.min.apply(null, chart.series[0].points.map(function (point) {
                                    return Math.abs(point.x - xValue);
                                }));
                            });

                            if (!point) return;
                            // Get the mouse event coordinates for the found point
                            var coordinates = Highcharts.extend({
                                chartX: point.plotX + chart.plotLeft,
                                chartY: point.plotY + chart.plotTop
                            }, point);

                            var xval = point.x;
                            var yval = point.y;
                            var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", series_id, true);
                            var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                            var name = point.series.name;
                            var color = point.color;
                            var time = xmoment(parseInt(xval)).format("LLLL");
                            if (time == "Invalid date") time = xval;

                            var html = multiline(function () {/* 
                                <div style="border-left: 4px solid {{color}}; padding-left: 4px;"><b>{{name}}</b></div>
                                <div style="margin: 4px 2px 0 0; padding-left: 6px;"><span style="color: #888;">y:</span> {{yval}} {{units}}</div>
                                <div style="margin: 2px 2px 0 0; padding-left: 6px;"><span style="color: #888;">x:</span> {{time}}</div>
                            */}, {
                                color: color,
                                name: name,
                                yval: yval.toFixed(2),
                                units: units ? units : "",
                                time: time
                            }).trim();

                            window.globals.accessors["charts"].showexternaltooltip({
                                html: html
                            });

                            chart.xAxis[0].drawCrosshair(e, chart.series[0]);
                        }

                        window.globals.accessors["themes"].settheme({ charts: [chart] });
                    },
                    listeners: function () {
                    }
                });
            });

        });

        console.log("Data point count:");
        console.log(datapointscount);
        
        if (invalidtimestamprows.length > 0) {
            console.log("Invalid timestamp rows detected");
            console.log(invalidtimestamprows);
        }

        // Initialize map
        if (!window.globals.accessors["maps"]) window.globals.accessors["maps"] = new window.globals.apps["maps"]().init();
        window.globals.accessors["maps"].draw_all_data();
                
        // // Initialize charts
        // if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
        // window.globals.accessors["charts"].draw_all_data();
                
        // // Initialize quickview
        // if (!window.globals.accessors["quickview"]) window.globals.accessors["quickview"] = new window.globals.apps["quickview"]().init();
        // window.globals.accessors["quickview"].draw_all_data();

        // Call callback if available
        if (callback && typeof callback == "function") callback();

    }

}