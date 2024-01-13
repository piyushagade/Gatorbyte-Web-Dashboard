window.globals.apps["datatable"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {

        // Show datatable row
        $(".datatable-row-heading").removeClass("hidden");
        $(".datatable-row").removeClass("hidden");
        
        // Make tabs for the table
        self.make_datatable_tabs();

        return self;
    }

    self.make_datatable_tabs = function () {
        
        /*
            ! Make datatable tabs
        */
        window.globals.data["data-fields-groups"] = [];

        // Reformat datatable and group them data-fields
        window.globals.data["data-fields"].forEach(function (df, di) {
            if (!df["TABLE"]) return;
            if (window.globals.data["data-fields-groups"].indexOf(df["TABLE"]["GROUP-NAME"]) == -1) window.globals.data["data-fields-groups"].push(df["TABLE"]["GROUP-NAME"]);
        });

        window.globals.data["data-fields-groups"].forEach(function (group, gi) {
            $(".datatable-row .tabs").append('<div class="col-auto datatable-tab" tab="' + group + '" style="padding: 4px 10px; border-bottom: 0; cursor: pointer;">' + group + '</div>');
        });

        // Set theme
        window.globals.accessors["themes"].settheme();
        
        /*
            ! Listeners
        */
        $(".datatable-row .tabs .datatable-tab").off("click").click(function () {
            var group = $(this).attr("tab");
            var title = $(this).text();
            $(".datatable-row .tabs .datatable-tab").removeClass("active");
            $(this).addClass("active");
            $(".datatable-row .no-tab-selected-notification").addClass("hidden");
    
            // Populate datatable
            self.show_all_data_in_the_group(group);

            // Set theme
            window.globals.accessors["themes"].settheme();
        });
    }
    
    self.show_all_data_in_the_group = function (group) {
    
        /*
            ! Pick data than belongs to the group
        */
        var readings = Object.assign([], window.globals.data["data-fields-readings"]);

        // If no data is available
        if (readings.length == 0) {
            $(".datatable-row .no-data-notification").text("No data available for this device.").css("color", "crimson");
            return;
        }

        var data_fields_in_the_group = [];
        window.globals.data["data-fields"].forEach(function (df, di) {
            if (!df["TABLE"]) return;
            if (df["TABLE"]["GROUP-NAME"] == group) {
                data_fields_in_the_group.push(df)
            }
        });

        var data_field_readings_in_the_group = [];
        readings.forEach(function (reading, ri) {

            var rowobj = {};
            data_fields_in_the_group.forEach(function (df, di) {
                rowobj["TIMESTAMP"] = parseInt(reading["TIMESTAMP"]);
                rowobj[df["ID"]] = reading[df["ID"]];
            });
            
            if (Object.keys(rowobj).length > 0) data_field_readings_in_the_group.push(rowobj);
        });

        // Create headers for the table
        var headers = Papa.unparse(data_field_readings_in_the_group).trim().split("\n")[0].trim().split(",");

        if (data_field_readings_in_the_group.length == 0) {
            $(".datatable-row .no-data-notification").removeClass("hidden");
            $(".datatable-row .table .col").html("");
            $(".datatable-row .download-button").addClass("hidden").attr("type", null);
        }
        else {
            $(".datatable-row .no-data-notification").addClass("hidden");
            $(".datatable-row .download-button").removeClass("hidden").attr("type", group);
            
            // Header
            $(".datatable-row .table .col").html('<table style="width: 100%;"></table>')
            $(".datatable-row .table .col table").html(multiline(function () {/*
                <tr class="header-row" style="position: sticky;top: 0px;backdrop-filter: blur(4px);box-shadow: #00000082 0px 0px 32px !important;"></tr>
            */}));
            
            // Next add other headers
            headers.forEach(function (header, hi) {
                var df = self.f.grep(data_fields_in_the_group, "ID", header, true);
                var units = df && (df.UNITS || df.CHART.UNITS);

                $(".datatable-row .table table tr.header-row").append(multiline(function () {/* 
                    <th style="font-size: 12px; text-align: center; font-weight: bold;">{{header}}</th>
                */},
                    {
                        header: header + (units && units.length > 0 ? " (" + units + ")" : ""),
                    }
                ));

                // Add calculated battery level
                if (header == "BVOLT") {
                    $(".datatable-row .table table tr.header-row").append(multiline(function () {/* 
                        <th style="font-size: 12px; text-align: center; font-weight: bolder;">BLEV* (%)</th>
                    */}));
                }

                // Add converted timestamp
                if (header == "TIMESTAMP") {
                    $(".datatable-row .table table tr.header-row").append(multiline(function () {/* 
                        <th style="font-size: 12px; text-align: center; font-weight: bolder;">DATE</th>
                        <th style="font-size: 12px; text-align: center; font-weight: bolder;">TIME</th>
                    */}));
                }
            });
            
            // Data (show last 200 items)
            var numberofrows = 200;

            // Show notification about onlyy displaying 200 rows
            if (data_field_readings_in_the_group.length > 200) {
                $(".datatable-row").find(".row-count-notification").fadeIn(400).html(multiline (function () {/*
                    Showing the latest {{rowstoshow}} rows.
                */}, {
                    "rowstoshow": numberofrows
                }));
                setTimeout(() => {
                    $(".datatable-row").find(".row-count-notification").fadeOut(400);
                }, 4000);
            }

            data_field_readings_in_the_group.splice(-1 * parseInt(numberofrows)).forEach(function (row, ri) {

                $(".datatable-row .table .col table").append('<tr class="datatable-row-' + ri + '"></tr>');

                // Next add other values
                headers.forEach(function (header, hi) {
                    
                    // if (header == "BLEV") console.log(row[header]);

                    $(".datatable-row .table table tr.datatable-row-" + ri).append(multiline(function () {/* 
                        <td class="{{classname}}" style="font-size: 12px; width: {{width}}; min-width: 100px; text-align: center;">{{value}}</td>
                    */},
                        {
                            value: row[header] ? parseFloat(row[header]).toFixed(2) : "-",
                            width: header == "TIMESTAMP" ? "100px" : "auto",
                            classname: header == "TIMESTAMP" ? "highlighted" : ""
                        }
                    ));
                        
                    // Add calculated BLEV
                    if (header == "BVOLT") {
                        var level = self.f.volttolevel(row[header]);

                        $(".datatable-row .table table tr.datatable-row-" + ri).append(multiline(function () {/* 
                            <td class="{{classname}}" style="font-size: 12px; width: {{width}}; min-width: 100px; text-align: center;">{{value}}</td>
                        */},
                            {
                                value: level ? parseFloat(level).toFixed(2) : "-",
                                width: "auto",
                                classname: ""
                            }
                        ));
                    }

                    // Add converted timestamp
                    if (header == "TIMESTAMP") {

                        // Add to view
                        $(".datatable-row .table table tr.datatable-row-" + ri).append(multiline(function () {/* 
                            <td class="{{classname}}" style="font-size: 12px; width: 100px; text-align: center;">{{date}}</td>
                            <td class="{{classname}}" style="font-size: 12px; width: 100px; text-align: center;">{{time}}</td>
                        */},
                        {
                            "date": moment(parseInt(row[header]) * 1000).format("MM/DD/YYYY"),
                            "time": moment(parseInt(row[header]) * 1000).format("hh:mm:ss a"),
                            classname: header == "TIMESTAMP" ? "highlighted" : ""
                        }));

                        // Add to data
                        row["DATE"] = moment(parseInt(row[header]) * 1000).format("MM/DD/YYYY");
                        row["TIME"] = moment(parseInt(row[header]) * 1000).format("hh:mm:ss a");
                    }
                });
            });

            // Scroll to bottom
            var scrollableDiv = $('.datatable.table');
            var height = scrollableDiv[0].scrollHeight;
            scrollableDiv.animate({ scrollTop: height }, 300);

            $(".datatable-row .download-button").off("click").click(function () {
                self.f.generate_download({
                    data: self.f.j2c(data_field_readings_in_the_group), 
                    filename: $(this).attr("type").toLowerCase() + "_" + globals.data.site["SITE-ID"].replace(/-/g, "_").toLowerCase() + "_export"
                });
            });
        }
    }
}