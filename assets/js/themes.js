window.globals.apps["themes"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {

        return self;
    }

    self.settheme = function (args) {
        var theme = args && args.theme ? args.theme : null;
        if (!theme) {
            theme = globals.variables.ls.getItem("/settings/theme") || "dark";
        };
        var charts = args && args.charts;

        if (theme == "dark") {
            $("body").addClass("dark").removeClass("light");
        }

        else if (theme == "light") {
            $("body").addClass("light").removeClass("dark");
        }


        if (theme == "dark") {
            $(".theme-select-button i").removeClass("fa-moon").addClass("fa-sun").parent().attr("state", "dark");;

            if (charts) {
                charts.forEach(chart => {
                    chart.update({
                        chart: {
                            backgroundColor: '#2A2A2A',
                            style: {
                                color: '#E0E0E3'
                            }
                        },

                        navigator: {
                            maskFill: '#2caffe33',
                        },

                        rangeSelector: {
                            buttonTheme: {
                                fill: '#505050',
                                stroke: '#505050',
                                style: {
                                    color: '#CCCCCC' // Button text color
                                },
                                r: 10,
                                states: {
                                    select: {
                                        fill: '#cd8989',
                                        stroke: '#cd8989',
                                        style: {
                                            color: '#333333'
                                        }
                                    },
                                    hover: {
                                        fill: '#777777',
                                        stroke: '#666666',
                                        style: {
                                            color: '#FFFFFF'
                                        }
                                    }
                                    
                                }
                            },
                            labelStyle: {
                                visibility: 'hidden',
                                "color": "#888888"
                            },
                            buttonPosition: {
                                x: -19,
                                y: 0
                            },
                            buttonSpacing: 7
                        },

                        xAxis: {
                            gridLineColor: '#707073',
                            labels: {
                                style: {
                                    color: '#E0E0E3'
                                }
                            }
                        },

                        yAxis: {
                            gridLineColor: '#707073',
                            labels: {
                                style: {
                                    color: '#E0E0E3'
                                }
                            }
                        },

                        legend: {
                            itemStyle: {
                                color: "#AAAAAA"
                            }
                        }
                    });
                    
                    const plotLine = chart.yAxis[0].plotLinesAndBands.filter(line => line.id === 'averageLine')[0];
                    if (plotLine) plotLine.color = '#0000FF';
                    chart.redraw();
                });

            }
        }

        else if (theme == "light") {
            $(".theme-select-button i").addClass("fa-moon").removeClass("fa-sun").parent().attr("state", "light");

            if (charts) {
                charts.forEach(chart => {
                    chart.update({
                        chart: {
                            backgroundColor: '#FFF',
                            style: {
                                color: '#222222'
                            }
                        },

                        navigator: {
                            "maskInside": true,
                            "maskFill": "#2caffe33",
                            "outlineColor": "#999999",
                        },

                        navigator: {
                            maskFill: '#2caffe33',
                        },


                        rangeSelector: {
                            "buttonTheme": {
                                "fill": "#DDDDDD",
                                "stroke": "#DDDDDD",
                                "style": {
                                    color: '#444444'
                                },
                                "r": 10,
                                "stroke-width": 1,
                                "states": {
                                    "select": {
                                        "fill": "#c92e2e",
                                        "style": {
                                            "color": "white"
                                        }
                                    },
                                    "hover": {
                                        "fill": '#EEEEEE',
                                        "stroke": '#DDDDDD',
                                        "style": {
                                            "color": '#444444'
                                        }
                                    }
                                }
                            },
                            "x": 0,
                            "y": 0,
                            "buttonPosition": {
                                x: -19,
                                y: 0
                            },
                            "labelStyle": {
                            },
                            "labelStyle": {
                                "visibility": 'hidden',
                                "color": "#666666"
                            },
                            "buttonSpacing": 7
                        },

                        xAxis: [
                            {
                                "labels": {
                                    "style": {
                                        "color": "#333333",
                                    }
                                },
                                "gridLineColor": "#e6e6e6",
                                "tickColor": "#333333",
                            }
                        ],

                        yAxis: {
                            "labels": {
                                "style": {
                                    "color": "#333333",
                                }
                            },
                            "gridLineColor": "#e6e6e6",
                            "tickColor": "#333333",
                        },

                        legend: {
                            itemStyle: {
                                color: "#333333"
                            }
                        }
                    });
                });
            }
        }
    }
}