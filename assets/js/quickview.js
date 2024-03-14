window.globals.apps["quickview"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {

        // // Draw the data on init
        // self.draw_all_data();

        return self;
    }

    // Make charts for all datafields
    self.draw_all_data = function () {

        window.globals.data["data-fields"].forEach(function (df, di) {
            if (df.CHART) {

                console.log(df.ID);
                
                if (df["CHART"]["TYPE"] == "stocks") make_stock(df, df.ID, df.NAME);
                else if (df["CHART"]["TYPE"] == "line") make_chart(df, df.ID, df.NAME);
            }
        });

        function make_chart(df, chart_name, series_name) {

            // Get min and max chart limits from LocalStorage
            var min = parseInt(self.ls.getConfig({ category: chart_name + "-" + "chart", key: "y-min"}));
            var max = parseInt(self.ls.getConfig({ category: chart_name + "-" + "chart", key: "y-max"}));

            //! Add GatorByte data
            var seriesdata = [{
                    name: series_name,
                    data: window.globals.data["data-fields-readings-formatted"][chart_name]
                }];
            
            //! Add reference data if available
            if (
                window.globals.data["data-fields-readings-reference-formatted"] && 
                window.globals.data["data-fields-readings-reference-formatted"][chart_name]
            )
                seriesdata.push({
                    name: "Reference " + series_name,
                    data: window.globals.data["data-fields-readings-reference-formatted"][chart_name],
                    color: 'orange'
                });

            //! Generate chart
            Highcharts.chart(chart_name + "-line-chart", {
                chart: {
                    marginTop: 10,
                    type: 'spline',
                    // animation: Highcharts.svg, 
                },
                title: {
                    text: null
                },
                yAxis: {
                    title: {
                        text: null
                    },
                    min: min && !isNaN(min) ? min : null,
                    max: max && !isNaN(max) ? max : null
                },
                xAxis: {
                    type: 'datetime'
                },
                legend: {
                    enabled: false,
                    layout: "vertical",
                    align: "right",
                    verticalAlign: "middle"
                },
                plotOptions: {
                },
                series: seriesdata,
                credits: {
                    enabled: false
                }
            });

        }

        function make_stock(df, chart_name, series_name) {

            // Create data arrays
            var timestamp_array = [];
            var data_array = [];
            window.globals.data["data-fields-readings-formatted"][chart_name].forEach(function (d) {
                let timestamp = (parseInt(d[0]) + parseInt(-4 * 60 * 60)) * 1000;
                timestamp_array.push(timestamp);

                var value = d[1];
                
                data_array.push([timestamp, parseFloat(value)]);
            });

            Highcharts.stockChart(chart_name + "-line-chart", {
                chart: {
                    marginTop: 0,
                    height: 400,
                    backgroundColor: "transparent",
                    zoomType: 'x',
                    panning: true,
                    panKey: 'shift',
                },
                title: {
                    title: {
                        text: null
                    },
                },
                subtitle: {
                    text: null
                },
                navigator: {
                    enabled: true,
                },
                rangeSelector: {
                    buttonPosition: {
                        y: 6
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
                scrollbar: {
                    enabled: true
                },
                xAxis: {
                    type: "datetime",
                    categories: timestamp_array,
                    dateTimeLabelFormats: {
                        day: '%b %e',
                        minute: '%I:%M %p',
                        hour: '%I:%M'
                    },
                },
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
                        animation: false
                    },
                    column: {
                        stacking: "normal"
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: series_name,
                    data: data_array
                }],
                legend: {
                    enabled: true
                }
            });
        }
    }

    self.draw_new_data = function (data) {

        console.log("Drawing new data point on the charts");

        /* 
            gb-server::data/set

            mqttfx:::RTD,PH,EC,DO,TIMESTAMP
            26,6.54,500,13,1642437980
        */
        
        window.globals.data["data-fields"].forEach(function (df, di) {
            if (df.CHART) {
                if (df["CHART"]["TYPE"] == "stocks") update_chart(df, df.ID, df.NAME);
                else if (df["CHART"]["TYPE"] == "line") update_chart(df, df.ID, df.NAME);
            }
        });


        function update_chart(df, chart_name, series_name) {
            var chart = $("#" + chart_name + "-line-chart").highcharts();
            var series = chart.series[0];

            if (!window.globals.data["data-fields-readings-formatted"]) {
                /*
                    ! Construct data
                */
                window.globals.apps["readings"].process_data_fields();
            };

            data.forEach(function (d) {

                let timestamp = (parseInt(d.TIMESTAMP)) * 1000;

                if (window.globals.data["data-fields-readings-formatted"][chart_name]) {
                    window.globals.data["data-fields-readings-formatted"][chart_name].push([timestamp, parseFloat(d[chart_name])]);
                }

                // global.last_data_point_timestamp = parseInt(d.TIMESTAMP);
                series.addPoint({
                    x: timestamp,
                    y: parseFloat(d[chart_name]),
                    color: "orange",
                    marker: {
                        enabled: true,
                        symbol: 'diamond',
                        radius: 4,
                    },
                }, true);

                // Set the data summary field with the latest data
                $(".data-summary-fields-list .data-summary-field[data-series-id='" + chart_name + "']").find(".value").html(!isNaN(parseFloat(d[chart_name])) ? parseFloat(d[chart_name]).toFixed(2) : "-");
                $(".data-summary-fields-list .last-update-timestamp").html(moment(timestamp - parseInt(window.globals.variables["tz-offset"]) * 1000).format("LLL"));
            });
        }
    }
}

// TODO: Redo this function
function select_marker_highlight_charts(timestamp) {
    ["rtd", "ph", "ec", "do"].forEach(function (chart, i) {
        var chart = $("#" + chart.toLowerCase() + "-line-chart").highcharts();
        chart.xAxis[0].update({
            plotLines: [{
                id: "select-" + timestamp,
                color: '#F00',
                dashStyle: 'Solid',
                width: 1,
                value: timestamp * 1000,
                zIndex: 0
            }]
        });
    })
}

function highlight_charts(timestamp) {
    ["rtd", "ph", "ec", "do"].forEach(function (chart, i) {
        var chart = $("#" + chart.toLowerCase() + "-line-chart").highcharts();
        chart.xAxis[0].addPlotLine({
            id: "highlight-" + timestamp,
            color: '#F00',
            dashStyle: 'LongDashDot',
            width: 1,
            value: timestamp * 1000,
            zIndex: 0
        });
    })
}

function unhighlight_charts(timestamp) {
    ["rtd", "ph", "ec", "do"].forEach(function (chart, i) {
        var chart = $("#" + chart.toLowerCase() + "-line-chart").highcharts();
        chart.xAxis[0].removePlotLine("highlight-" + timestamp);
    });
}