window.globals.apps["charts"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {

        self.listeners();

        Highcharts.AST.allowedTags.push('div');
        Highcharts.AST.allowedAttributes.push('style');
        Highcharts.AST.allowedReferences.push('tel:');

        return self;
    }

    // Make charts for all datafields
    self.draw_all_data = function (targetchartname) {

        // Draw all charts
        if (!targetchartname) {
            window.globals.data["data-fields"].forEach(function (df, di) {
                if (df && df.CHART) {

                    if (df["CHART"]["TYPE"] == "stocks") make_stock(df, df.ID, df.NAME);
                    else if (df["CHART"]["TYPE"] == "line") make_chart(df, df.ID, df.NAME);
                }
            });
        }

        // Draw the requested chart only
        else {

            var df = self.f.grep(window.globals.data["data-fields"], "ID", targetchartname, true);
            if (df && df.CHART) {

                if (df["CHART"]["TYPE"] == "stocks") make_stock(df, df.ID, df.NAME);
                else if (df["CHART"]["TYPE"] == "line") make_chart(df, df.ID, df.NAME);
            }
        }

        // Draw plot lines
        if (df.CHART.PLOTLINES && df.CHART.PLOTLINES.HORIZONTAL) {
            var chart = $("#" + df.ID + "-line-chart").highcharts();
            const xAxis = chart.xAxis[0];

            df.CHART.PLOTLINES.HORIZONTAL.forEach(function (pl, pli) {

                xAxis.chart.yAxis[0].addPlotLine({
                    value: pl.VALUE,
                    color: pl.COLOR || '#AAAAAA', // You can customize the color
                    width: pl.WIDTH || 1,
                    id: pl.ID || pl.TITLE.toLowerCase().replace(/\s/g, "-"),
                    label: {
                        text: pl.TITLE || null,
                        align: pl.ALIGN || 'left',
                        style: {
                            color: pl.TITLECOLOR || 'red' // You can customize the label color
                        }
                    }
                });
            })
        }
        
        if (df.CHART.PLOTLINES && df.CHART.PLOTLINES.VERTICAL) {
            var chart = $("#" + df.ID + "-line-chart").highcharts();
            const xAxis = chart.xAxis[0];

            df.CHART.PLOTLINES.VERTICAL.forEach(function (pl, pli) {

                xAxis.addPlotLine({
                    value: pl.VALUE,
                    color: pl.COLOR || '#AAAAAA', // You can customize the color
                    width: pl.WIDTH || 1,
                    id: pl.ID || pl.TITLE.toLowerCase().replace(/\s/g, "-"),
                    label: {
                        text: pl.TITLE || null,
                        align: pl.ALIGN || 'left',
                        style: {
                            color: pl.TITLECOLOR || 'red' // You can customize the label color
                        }
                    }
                });
            })
        }

        function make_chart(df, chart_name, series_name) {

            // Check if no data yet
            if (!window.globals.data["data-fields-readings-formatted"][chart_name]) {
                console.log("No data found for: " + chart_name);
                $("." + chart_name + "-chart-div").find(".empty-notification").removeClass("hidden");
                $("#" + chart_name + "-line-chart").addClass("ui-disabled");
            }
            else {
                $("." + chart_name + "-chart-div").find(".empty-notification").addClass("hidden");
                $("#" + chart_name + "-line-chart").removeClass("ui-disabled");
            }

            // Get min and max chart limits from LocalStorage
            var min = parseInt(self.ls.getConfig({ category: chart_name + "-" + "chart", key: "y-min" }));
            var max = parseInt(self.ls.getConfig({ category: chart_name + "-" + "chart", key: "y-max" }));

            // Get style data
            var color = df.CHART.STYLE && df.CHART.STYLE.COLOR ? df.CHART.STYLE.COLOR : null;

            // if (df.FUNCTIONS && df.FUNCTIONS.ONDATA) {

            //     var ondata = eval (df.FUNCTIONS.ONDATA);
            //     window.globals.data["data-fields-readings-formatted"][chart_name].forEach(function (row, ri) {
            //         ondata(row);
            //     });
            // }

            //! Add GatorByte data
            var seriesdata = [{
                name: series_name,
                data: window.globals.data["data-fields-readings-formatted"][chart_name] || [],
                yAxis: 0,
                color: color,
                gapSize: df.CHART.GAPSIZE || 3600000, // 1 hour gap
                gapUnit: "value",
                // zones: df.CHART.ZONES || null
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

            var containerWidth = $('#' + chart_name + "-line-chart").width();

            //! Generate chart
            var chart = Highcharts.chart(chart_name + "-line-chart", {
                chart: {
                    marginTop: 10,
                    type: 'spline',
                    width: containerWidth,
                    events: {
                        load: function (e) {

                            const xAxis = this.xAxis[0];
                            var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                            var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;

                            var data = [];
                            if (window.globals.data["data-fields-readings-formatted"][chart_name]) {
                                window.globals.data["data-fields-readings-formatted"][chart_name].forEach(function (row) {
                                    var timestamp = parseInt(row[0]);
                                    data.push(row[1]);
                                });
                            }

                            // Calculate standard deviation
                            data = data.filter(value => !isNaN(value));
                            const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
                            const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
                            const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / data.length;
                            const standardDeviation = Math.sqrt(variance);

                            const bins = 10; // Number of bins
                            const histogramData = [];
                            const min = Math.min(...data);
                            const max = Math.max(...data);
                            const binWidth = (max - min) / bins;

                            for (let i = 0; i < bins; i++) {
                                const binStart = min + i * binWidth;
                                const binEnd = binStart + binWidth;
                                const binFrequency = data.filter(level => level >= binStart && level < binEnd).length;
                                histogramData.push([binStart, binFrequency]);
                            }

                            xAxis.chart.yAxis[0].addPlotLine({
                                value: min,
                                color: '#AAAAAA', // You can customize the color
                                width: 1,
                                id: 'minLine',
                                label: {
                                    text: 'Minimum: ' + min.toFixed(2) + " " + units,
                                    align: 'left',
                                    style: {
                                        color: 'gray' // You can customize the label color
                                    }
                                }
                            });

                            xAxis.chart.yAxis[0].addPlotLine({
                                value: max,
                                color: '#AAAAAA', // You can customize the color
                                width: 1,
                                id: 'maxLine',
                                label: {
                                    text: 'Maximum: ' + max.toFixed(2) + " " + units,
                                    align: 'left',
                                    style: {
                                        color: 'gray' // You can customize the label color
                                    }
                                }
                            });

                            if (df.CHART.STATS && df.CHART.STATS.VISIBLE) {
                                if (df.CHART.STATS.METRICS && df.CHART.STATS.METRICS.length > 0) {
                                    $("." + chart_name + "-chart-stats-div").removeClass("hidden");
                                    $("." + chart_name + "-chart-stats-div").find(".stat-item").addClass("hidden");

                                    df.CHART.STATS.METRICS.forEach(function (metric, mi) {
                                        $("." + chart_name + "-chart-stats-div").find(".stat-item[name='" + metric + "']").removeClass("hidden");
                                    });
                                }
                                else {

                                    // Hide all stats if not METRICS key found
                                    $("." + chart_name + "-chart-stats-div").addClass("hidden");
                                    $("." + chart_name + "-chart-stats-div").find(".stat-item").addClass("hidden");
                                }
                                $("." + chart_name + "-chart-stats-div").find(".mean-value .value").text(mean.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".min-value .value").text(min.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".max-value .value").text(max.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".std-deviation .value").text(standardDeviation.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".variance .value").text(variance.toFixed(2));
                            }

                            Highcharts.chart(chart_name + "-stat-histogram-chart", {
                                chart: {
                                    type: 'column',
                                    backgroundColor: "transparent",
                                    width: 150,
                                    height: 25,
                                    margin: [0, 0, 0, 0],
                                    spacing: [0, 0, 0, 0]
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    labels: {
                                        enabled: false
                                    },
                                    title: {
                                        text: ''
                                    },
                                    tickLength: 0,
                                    gridLineWidth: 0,
                                    minorGridLineWidth: 0
                                },
                                yAxis: {
                                    labels: {
                                        enabled: false
                                    },
                                    title: {
                                        text: ''
                                    },
                                    tickLength: 0,
                                    gridLineWidth: 0,
                                    minorGridLineWidth: 0
                                },
                                legend: {
                                    enabled: false
                                },
                                tooltip: {
                                    useHTML: true,
                                    enabled: true,
                                    formatter: function () {
                                        return this.x.toFixed(2) + ": " + this.y + " times.";
                                    },
                                    outside: true
                                },
                                plotOptions: {
                                    series: {
                                        borderWidth: 0,
                                        pointWidth: 10,
                                        groupPadding: 0,
                                        pointPadding: 0,
                                        pointPlacement: 'between'
                                    }
                                },
                                credits: {
                                    enabled: false
                                },
                                series: [{
                                    name: 'Histogram',
                                    data: histogramData
                                }]
                            });
                        }
                    }
                },
                title: {
                    text: null
                },
                yAxis: {
                    title: {
                        text: null
                    },
                    crosshair: true,
                    min: min && !isNaN(min) ? min : null,
                    max: max && !isNaN(max) ? max : null
                },
                xAxis: {
                    type: 'datetime',
                    crosshair: true
                },
                tooltip: {
                    useHTML: true,
                    outside: true,
                    enabled: false,
                    formatter: function () {
                        return null;
                    },
                },
                legend: {
                    enabled: false,
                    layout: "vertical",
                    align: "right",
                    verticalAlign: "middle"
                },
                plotOptions: {
                    series: {
                        point: {
                            events: {
                                click: function (e) {
                                    console.log(this.x + ", " + moment(parseInt(this.x)).format("LLLL") + ', ' + this.y);
                                    self.addSynchronizedPlotLine(this.x);

                                    var xval = this.x;
                                    var yval = this.y;
                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                    var name = datafieldinfo.NAME;
                                    var color = this.color;
                                    var time = moment(parseInt(xval)).format("LLLL");
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

                                    self.showexternaltooltip({
                                        html: html
                                    });

                                },
                                mouseOver: function (e) {

                                    var xval = this.x;
                                    var yval = this.y;
                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                    var name = datafieldinfo.NAME;
                                    var color = this.color;
                                    var time = moment(parseInt(xval)).format("LLLL");
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

                                    self.showexternaltooltip({
                                        html: html
                                    });
                                },
                                mouseOut: function (e) {

                                    // Hide external tooltip
                                    $("body").find(".external-chart-tooltip-parent").remove();
                                }
                            }
                        }
                    }
                },
                series: seriesdata,
                credits: {
                    enabled: false
                }
            });

            // Chart-level mouseout event
            $(chart.container).parent().parent().parent().parent().off("mouseleave").mouseleave(function () {

                // Hide external tooltip
                $("body").find(".external-chart-tooltip-parent").remove();
            });

            window.globals.accessors["themes"].settheme({ charts: [chart] });

        }

        function make_stock(df, chart_name, series_name) {

            // Check if no data yet
            if (!window.globals.data["data-fields-readings-formatted"][chart_name]) {
                console.log("No data found for: " + chart_name);
                $("." + chart_name + "-chart-div").find(".empty-notification").removeClass("hidden");
                $("#" + chart_name + "-line-chart").addClass("ui-disabled");
            }
            else {
                $("." + chart_name + "-chart-div").find(".empty-notification").addClass("hidden");
                $("#" + chart_name + "-line-chart").removeClass("ui-disabled");
            }

            // Create data arrays
            var timestamp_array = [];
            var data_array = [];
            if (window.globals.data["data-fields-readings-formatted"][chart_name]) {
                window.globals.data["data-fields-readings-formatted"][chart_name].forEach(function (d) {

                    // Highstocks need seconds; While highcharts require milliseconds
                    let timestamp = parseInt(d[0]) - parseInt(window.globals.variables["tz-offset"]) * 0;

                    timestamp_array.push(timestamp);
                    var value = d[1];
                    data_array.push([timestamp, parseFloat(value)]);
                });
            }

            // Get style data
            var color = df.CHART.STYLE && df.CHART.STYLE.COLOR ? df.CHART.STYLE.COLOR : null;

            //! Add GatorByte data
            var seriesdata = [{
                name: series_name,
                data: data_array,
                yAxis: 0,
                gapSize: df.CHART.GAPSIZE || 3600000, // 1 hour gap
                gapUnit: "value",
                color: color
            }];

            //! Add reference data if available
            if (
                window.globals.data["data-fields-readings-reference-formatted"] &&
                window.globals.data["data-fields-readings-reference-formatted"][chart_name]
            )
                seriesdata.push({
                    name: "Reference " + series_name,
                    data: window.globals.data["data-fields-readings-reference-formatted"][chart_name],
                    color: 'orange',
                    yAxis: 0
                });

            var chart = Highcharts.stockChart(chart_name + "-line-chart", {
                chart: {
                    marginTop: 0,
                    height: 400,
                    backgroundColor: "transparent",
                    zoomType: 'x',
                    panning: true,
                    panKey: 'shift',
                    events: {
                        load: function () {
                            var chart = this;
                            var rangeSelector = chart.rangeSelector;
                        }
                    }
                    
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
                    labelStyle: {
                        visibility: 'hidden'
                    },labelStyle: {
                        visibility: 'hidden'
                    },
                    buttonSpacing: 7,
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
                yAxis: {
                    gridLineWidth: 0,
                    crosshair: true
                },
                xAxis: {
                    type: "datetime",
                    crosshair: true,
                    categories: timestamp_array,
                    dateTimeLabelFormats: {
                        day: '%b %e',
                        minute: '%I:%M %p',
                        hour: '%I:%M'
                    },
                    events: {
                        setExtremes: function (e) {
                            var xAxis = this;
                            var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                            var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;

                            // Calculate the average within the selected range
                            var series = xAxis.series[0]; // Assuming you have one series in your chart
                            var data = [];
                            window.globals.data["data-fields-readings-formatted"][chart_name].forEach(function (row) {
                                var timestamp = parseInt(row[0]);
                                if (e.min <= timestamp && timestamp <= e.max) {
                                    data.push(row[1])
                                }
                            })
                            var sum = data.reduce(function (acc, val) {
                                return acc + val;
                            }, 0);
                            var average = sum / data.length;

                            // Calculate standard deviation
                            data = data.filter(value => !isNaN(value));
                            const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
                            const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
                            const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / data.length;
                            const standardDeviation = Math.sqrt(variance);

                            const bins = 10; // Number of bins
                            const histogramData = [];
                            const min = Math.min(...data);
                            const max = Math.max(...data);
                            const binWidth = (max - min) / bins;

                            for (let i = 0; i < bins; i++) {
                                const binStart = min + i * binWidth;
                                const binEnd = binStart + binWidth;
                                const binFrequency = data.filter(level => level >= binStart && level < binEnd).length;
                                histogramData.push([binStart, binFrequency]);
                            }

                            // Remove the existing plot line (if any)
                            xAxis.chart.yAxis[0].removePlotLine('averageLine');

                            // Add a new plot line for the average
                            xAxis.chart.yAxis[0].addPlotLine({
                                value: average,
                                color: '#ff6868',
                                width: 1,
                                id: 'averageLine',
                                label: {
                                    text: 'Average: ' + average.toFixed(2) + " " + units,
                                    align: 'left',
                                    style: {
                                        color: 'gray'
                                    }
                                }
                            });

                            xAxis.chart.yAxis[0].removePlotLine('minLine');
                            xAxis.chart.yAxis[0].removePlotLine('maxLine');

                            var dataInSelectedRange = series.xData.filter(function (x, index) {
                                return x >= e.min && x <= e.max;
                            });

                            // Find the highest and lowest values in the selected range
                            var highestdata = Math.max.apply(null, dataInSelectedRange.map(function (x) {
                                return series.yData[series.xData.indexOf(x)];
                            }));
                            var highestindex = Math.max.apply(null, dataInSelectedRange.map(function (x) {
                                return series.xData.indexOf(x);
                            }));

                            var lowestdata = Math.min.apply(null, dataInSelectedRange.map(function (x) {
                                return series.yData[series.xData.indexOf(x)];
                            }));
                            var lowestindex = Math.min.apply(null, dataInSelectedRange.map(function (x) {
                                return series.xData.indexOf(x);
                            }));

                            xAxis.chart.yAxis[0].addPlotLine({
                                value: lowestdata,
                                color: '#AAAAAA', // You can customize the color
                                width: 1,
                                id: 'minLine',
                                label: {
                                    text: 'Minimum: ' + lowestdata.toFixed(2) + " " + units,
                                    align: 'left',
                                    style: {
                                        color: 'gray' // You can customize the label color
                                    }
                                }
                            });

                            xAxis.chart.yAxis[0].addPlotLine({
                                value: highestdata,
                                color: '#AAAAAA', // You can customize the color
                                width: 1,
                                id: 'maxLine',
                                label: {
                                    text: 'Maximum: ' + highestdata.toFixed(2) + " " + units,
                                    align: 'left',
                                    style: {
                                        color: 'gray' // You can customize the label color
                                    }
                                }
                            });

                            if (df.CHART.STATS && df.CHART.STATS.VISIBLE) {
                                if (df.CHART.STATS.METRICS && df.CHART.STATS.METRICS.length > 0) {
                                    $("." + chart_name + "-chart-stats-div").removeClass("hidden");
                                    $("." + chart_name + "-chart-stats-div").find(".stat-item").addClass("hidden");

                                    df.CHART.STATS.METRICS.forEach(function (metric, mi) {
                                        $("." + chart_name + "-chart-stats-div").find(".stat-item[name='" + metric + "']").removeClass("hidden");
                                    });
                                }
                                else {

                                    // Hide all stats if not METRICS key found
                                    $("." + chart_name + "-chart-stats-div").addClass("hidden");
                                    $("." + chart_name + "-chart-stats-div").find(".stat-item").addClass("hidden");
                                }
                                $("." + chart_name + "-chart-stats-div").find(".mean-value .value").text(mean.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".min-value .value").text(lowestdata.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".max-value .value").text(highestdata.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".std-deviation .value").text(standardDeviation.toFixed(2));
                                $("." + chart_name + "-chart-stats-div").find(".variance .value").text(variance.toFixed(2));
                            }

                            Highcharts.chart(chart_name + "-stat-histogram-chart", {
                                chart: {
                                    type: 'column',
                                    backgroundColor: "transparent",
                                    width: 150,
                                    height: 25,
                                    margin: [0, 0, 0, 0],
                                    spacing: [0, 0, 0, 0]
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    labels: {
                                        enabled: false
                                    },
                                    title: {
                                        text: ''
                                    },
                                    tickLength: 0,
                                    gridLineWidth: 0,
                                    minorGridLineWidth: 0
                                },
                                yAxis: {
                                    labels: {
                                        enabled: false
                                    },
                                    title: {
                                        text: ''
                                    },
                                    tickLength: 0,
                                    gridLineWidth: 0,
                                    minorGridLineWidth: 0
                                },
                                legend: {
                                    enabled: false
                                },
                                tooltip: {
                                    useHTML: true,
                                    enabled: true,
                                    formatter: function () {
                                        return this.x.toFixed(2) + ": " + this.y + " times.";
                                    },
                                    outside: true
                                },
                                plotOptions: {
                                    series: {
                                        borderWidth: 0,
                                        pointWidth: 10,
                                        groupPadding: 0,
                                        pointPadding: 0,
                                        pointPlacement: 'between'
                                    }
                                },
                                credits: {
                                    enabled: false
                                },
                                series: [{
                                    name: 'Histogram',
                                    data: histogramData
                                }]
                            });
                        }
                    }
                },
                tooltip: {
                    useHTML: true,
                    enabled: false,
                    formatter: function () {
                        return null;
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
                        animation: false,
                        point: {
                            events: {
                                click: function (e) {
                                    console.log(this.x + ", " + moment(parseInt(this.x)).format("LLLL") + ', ' + this.y);
                                    self.addSynchronizedPlotLine(this.x);

                                    var xval = this.x;
                                    var yval = this.y;
                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                    var name = datafieldinfo.NAME;
                                    var color = this.color;
                                    var time = moment(parseInt(xval)).format("LLLL");
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

                                    self.showexternaltooltip({
                                        html: html
                                    });

                                    self.showchartpointoptions({
                                        e: e,
                                        that: this,
                                        chart_name: chart_name
                                    })
                                },
                                mouseOver: function (e) {

                                    var xval = this.x;
                                    var yval = this.y;
                                    var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                                    var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                                    var name = datafieldinfo.NAME;
                                    var color = this.color;
                                    var time = moment(parseInt(xval)).format("LLLL");
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

                                    self.showexternaltooltip({
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
                credits: {
                    enabled: false
                },
                series: seriesdata,
                legend: {
                    enabled: true,
                    itemStyle: {
                        color: "#333"
                    }
                }
            });

            function onoverlaydata(overlaydata) {
                // Add a new y-axis for the dynamically added series
                chart.addAxis({
                    title: {
                        text: 'in.'
                    },
                    opposite: true, // Position the axis on the opposite side
                    showEmpty: false // Hide the axis if no series are associated with it
                }, false);

                chart.addSeries({
                    name: 'Precipitation',
                    data: overlaydata,
                    color: "orange",
                    yAxis: 1
                });
            }

            // Chart-level mouseout event
            $(chart.container).parent().parent().parent().parent().off("mouseleave").mouseleave(function (e) {

                // Hide external tooltip
                $("body").find(".external-chart-tooltip-parent").remove();
            });

            Highcharts.addEvent(chart.container, 'mousemove', function (e) {

                var xval = chart.xAxis[0].toValue(e.chartX);
                triggerMousemoveAtX(e, chart, xval);
            });

            function triggerMousemoveAtX(e, chart, xValue) {

                return;

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
                var datafieldinfo = self.f.grep(window.globals.data["data-fields"], "ID", chart_name, true);
                var units = datafieldinfo.UNITS || datafieldinfo.CHART.UNITS;
                var name = point.series.name;
                var color = point.color;
                var time = moment(parseInt(xval)).format("LLLL");
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

                self.showexternaltooltip({
                    html: html
                });

                chart.xAxis[0].drawCrosshair(e, chart.series[0]);
            }

            window.globals.accessors["themes"].settheme({ charts: [chart] });
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
            
            // Hide empty notification if visible
            $("." + chart_name + "-chart-div").find(".empty-notification").addClass("hidden");
            $("#" + chart_name + "-line-chart").removeClass("ui-disabled");

            var chart = $("#" + chart_name + "-line-chart").highcharts();

            // // Check if chart does not exist (if the incoming data point is the first data point)
            // if (!chart) {
            //     return;
            // }

            var series = chart.series[0];

            if (!window.globals.data["data-fields-readings-formatted"]) {
                /*
                    ! Construct data
                */
                window.globals.apps["readings"].process_data_fields();
            };

            data.forEach(function (d) {

                let timestamp = (parseInt(d.TIMESTAMP) - parseInt(window.globals.variables["tz-offset"]) * 0) * 1000;

                if (window.globals.data["data-fields-readings-formatted"][chart_name]) {
                    window.globals.data["data-fields-readings-formatted"][chart_name].push([timestamp, parseFloat(d[chart_name])]);
                }

                // // Prevent auto-adjustment of the time navigator
                // chart.update({
                //     navigator: {
                //         adaptToUpdatedData: false,
                //     },
                // });

                var value = parseFloat(d[chart_name]);

                // Apply formula
                if (df.FORMULA) {
                    value = self.f.applyformula(df, df.FORMULA, d);
                }

                series.addPoint({
                    x: timestamp,
                    y: value,
                    color: "orange",
                    marker: {
                        enabled: true,
                        symbol: 'diamond',
                        radius: 4,
                    },
                }, true);

                if (value) {
                    var formattedvalue = value.toFixed(2);
                    var format = df.QUICKVIEW && df.QUICKVIEW["TYPE"] ? df.QUICKVIEW["TYPE"] : "float";

                    if (df.QUICKVIEW && df.QUICKVIEW["TYPE"] == "integer") {
                        formattedvalue = parseInt(value);
                    }
                    else if (df.QUICKVIEW && df.QUICKVIEW["TYPE"] == "float") {
                        formattedvalue = value.toFixed(df.QUICKVIEW["PRECISION"] ? df.QUICKVIEW["PRECISION"] : 2);
                    }
                }

                // Set the data summary field with the latest data
                $(".data-summary-fields-list .data-summary-field[data-series-id='" + chart_name + "']").find(".value").html(!isNaN(formattedvalue) ? formattedvalue : "-");
                $(".data-summary-fields-list .last-update-timestamp").html(moment(timestamp - parseInt(window.globals.variables["tz-offset"]) * 0 * 1000).format("LLL"));
            });
        }
    }

    self.listeners = function () {

        $(".chart-action-button.toggle-sg-filter-button").off("click").click(function () {
            var chart_name = $(this).parent().parent().parent().attr("data-series-id");
            var chart = $("#" + chart_name + "-line-chart").highcharts();

            var seriesData = chart.series[0].data;

            // Define parameters for the filter
            var windowSize = 3; // Adjust as needed
            var polynomialOrder = 1; // Adjust as needed

            // Extract y values from the series data
            var yValues = seriesData.map(point => point.y);
            
            if (typeof yValues == "object") {
                yValues = Object.entries(yValues).map(([x, y]) => y);
            }

            // Apply Savitzky-Golay filter to y values
            var smoothedYValues = savitzkyGolay(yValues, windowSize, polynomialOrder);

            // Update chart series with smoothed data
            chart.series[0].setData(smoothedYValues.map((y, index) => [seriesData[index].x, y]));

        });

        $(".chart-action-button.toggle-moving-average-button").off("click").click(function () {
            var chart_name = $(this).parent().parent().parent().attr("data-series-id");
            var chart = $("#" + chart_name + "-line-chart").highcharts();

            var seriesData = chart.series[0].data;
            
            if (!seriesData[0]) {
                seriesData = Object.entries(seriesData).map(([x, y]) => y);
            }

            // Define parameters for the filter
            var windowSize = 3;

            // Extract y values from the series data
            var yValues = seriesData.map(point => point.y);

            if (typeof yValues == "object") {
                yValues = Object.entries(yValues).map(([x, y]) => y);
            }

            var smoothedYValues = calculateMovingAverage(yValues, windowSize); 

            // Update chart series with smoothed data
            chart.series[0].setData(smoothedYValues.map((y, index) => {
                if (!seriesData[index]) return;
                return [seriesData[index].x, y]
            }));

        });

        function calculateMovingAverage(data, windowSize) {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                var sum = 0;
                var count = 0;
                for (var j = i - Math.floor(windowSize / 2); j <= i + Math.floor(windowSize / 2); j++) {
                    if (j >= 0 && j < data.length) {
                        sum += data[j];
                        count++;
                    }
                }
                result.push(sum / count);
            }
            return result;
        }
    }

    // Function to add a synchronized plotline to both charts
    self.addSynchronizedPlotLine = function (xValue) {

        $(".chart-container").each(function (ei, el) {
            var chart = $(el).highcharts();

            // Remove existing plotlines
            chart.xAxis[0].removePlotLine('sync-plotline');

            // Add a new synchronized plotline
            chart.xAxis[0].addPlotLine({
                value: xValue,
                color: '#555',
                width: 2,
                id: 'sync-plotline',
                label: {
                    text: '',
                    x: -12,
                    style: {
                        color: 'grey',
                        fontSize: '13px'
                    }
                }
            });
        })
    }

    self.showexternaltooltip = function (args) {

        $("body").find(".external-chart-tooltip-parent").remove();
        $("body").append(multiline(function () {/* 
            <div class="external-chart-tooltip-parent shadow"></div>
        */}));
        $("body").find(".external-chart-tooltip-parent").html(args.html);
    }

    self.showchartpointoptions = function (args) {

        var e = args.e;
        var that = args.that;
        var chart_name = args.chart_name;

        // Get the cursor position
        var cursorX = e.chartX + 50
        var cursorY = e.chartY - 110;
        var pageX = e.pageX;
        var pageY = e.pageY;

        Mousetrap.unbind(['d']);
        Mousetrap.unbind(['r']);
        Mousetrap.unbind(['p']);
        $(".chart-point-popup").remove();

        var pointdata = {
            color: that.color,
            index: that.index,
            plotX: that.plotX,
            plotY: that.plotY,
            pageX: e.pageX,
            pageY: e.pageY,
            x: that.x,
            y: that.y,
            "chart-id": that.id,
            "chart-name": chart_name + "-line-chart"
        }

        // Create the popup
        var popup = $('<div/>', {
            class: 'chart-point-popup shadow-heavy',
            html: multiline(function () {/* 
                
                <div class="row" data-b64="{{data-b64}}"" style="margin: 0; padding: 5px;">
                    
                    <!-- Mark as an outlier -->
                    <div class="col-auto item add-outlier-button" title="Mark as outlier (Key: d)">
                        <i class="fas fa-chart-line" style=" font-size: 13px; margin-right: 4px;"></i>
                    </div>
                    
                    <!-- Add plot line -->
                    <div class="col-auto item add-plotline-button" title="Add plotline (Key: p)">
                        <i class="fas fa-minus" style=" font-size: 13px; margin-right: 4px; transform: rotate(90deg);"></i>
                    </div>
                    
                    <!-- Add plot line -->
                    <div class="col-auto item add-plotline-button" title="Replace with an interpolation (Key: r)">
                        <i class="fas fa-reply-all" style=" font-size: 13px; margin-right: 4px;"></i>
                    </div>
                </div>
            */}, {
                "data-b64": self.f.json_to_b64(pointdata)
            })
        });

        // Append the popup to the body and position it
        $("#" + chart_name + "-line-chart").append(popup);

        if (cursorX <= popup.width() + 50) cursorX += 50;
        if (cursorY <= popup.height() + 50) cursorY += 50;
        if (pageX - cursorX <= popup.width() + 50) cursorX -= popup.width() + 30;
        if (pageY - cursorY <= popup.height()) cursorY -= popup.height();
        
        popup.css({
            left: cursorX + 'px',
            top: cursorY + 'px'
        });

        self.registerchartpointoptionslistener();
    } 

    self.registerchartpointoptionslistener = function () {

        Mousetrap.bind(['d'], function (e) {
            e.preventDefault();
            $(".chart-point-popup").find(".add-outlier-button").click();
            return false;
        });

        $(".chart-point-popup").find(".add-outlier-button").off("click").click(function () {
            var data = self.f.b64_to_json($(this).parent().attr("data-b64"));

            removeoutlier();
            function removeoutlier () {
                var chartInstance = Highcharts.charts.find(chart => {
                    if (chart) return chart.renderTo.id === data["chart-name"];
                });
                
                if (chartInstance) {
                    var series = chartInstance.series[0];

                    // Original data array
                    var alldata = series.options.data;

                    // // Filter out the data point
                    // alldata.forEach(function(point, index) {
                    //     if (point[0] == data.x) {
                    //         point[1] = null;
                    //     }
                    // });

                    // // Update the series data
                    // series.update({data: alldata});

                    var points = series.data.filter(function(point) {
                        return point.x == data.x;
                    });

                    if (points) {

                        // Change the color of the data point
                        points[0].color = '#FF0000';
                        
                        series.chart.xAxis[0].addPlotLine({
                            id: "outlier-" + points[0].x,
                            value: points[0].x,
                            color: 'red',
                            lineWidth: 1,
                            zIndex: 0
                        });

                    } else {
                        console.log("Point not found");
                    }

                    // Hide the chart point popup
                    $(".chart-point-popup").remove();
                    Mousetrap.unbind(['r']);

                    // Update the data on the server
                    $.ajax({
                        type: 'POST',
                        data: JSON.stringify({
                            "device-sn": self.ls.getItem("state/device/sn"),
                            "device-id": self.ls.getItem("state/device/id"),
                            "project-id": self.ls.getItem("state/project/id"),
                            "timestamp": moment.now(),
                        }),
                        url: self.f.url({ path: "/data/outlier/new" }),
                        success: function(response) {
                            console.log(response);
                        },
                        error: function (request, textStatus, errorThrown) { }
                    });
                }
            }
        });
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

// https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=41.85&lon=-87.65&appid=8131ce09dcbaf436a7f5cd273086d766&dt=1643803200
function getnoaadata() {
    // Replace 'YOUR_API_KEY' and 'YOUR_LOCATION' with your actual API key and location
    var apiToken = 'WygSwEhcBHkCBvPEBSsMwuhJCVqPejMp'; //https://www.ncdc.noaa.gov/cdo-web/webservices/v2
    var location = {
        lat: 29.6425168,
        lon: -82.3448867
    };


    // Calculate timestamps for the past week
    var today = new Date();
    var oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    var stationId = 'USW00012816';

    // Set the date range for historical data
    var startDate = '1971-01-01';
    var endDate = '1971-12-21';

    // Make API request to fetch historical weather data
    $.ajax({
        url: `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=PRECIP_HLY&stationid=${stationId}&startdate=${startDate}&enddate=${endDate}&units=standard&limit=1000`,
        method: 'GET',
        headers: {
            'token': apiToken
        },
        success: function (data) {

            console.log(data);
            return;

            // Process historical precipitation data
            var historicalPrecipitation = data.hourly.map(function (hour) {
                return {
                    timestamp: hour.dt * 1000, // Convert timestamp to milliseconds
                    precipitation: hour.precipitation ? hour.precipitation : 0
                };
            });

            // Display historical precipitation data (you can format and display it as needed)
            $('#historicalData').text(JSON.stringify(historicalPrecipitation, null, 2));

            // onoverlaydata(historicalPrecipitation);
        },
        error: function (error) {
            console.error('Error fetching historical weather data:', error);
        }
    });
}

addedPoints = []