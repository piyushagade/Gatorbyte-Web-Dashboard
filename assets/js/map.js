window.globals.apps["maps"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.coords = [];
    self.points = [];
    self.map = null;

    self.init = function () {

        // TODO: Make this better

        if ($("#map-container").length > 0) {
            
            if(!window.globals.variables["gpsmap"]) window.globals.variables["gpsmap"] = L.map("map-container", { attributionControl: false, gestureHandling: true });
            self.map = window.globals.variables["gpsmap"];
            self.map.setView(new L.LatLng(29.5627032,-82.2923514), 11);

            // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            //     maxZoom: 18,
            //     id: 'mapbox.streets',
            //     accessToken: "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
            // }).addTo(map);

            var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            // var osmAttribution = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' + ' <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            osmLayer = new L.TileLayer(osmUrl, {maxZoom: 19});
            self.map.setView(new L.LatLng(29.5627032,-82.2923514), 11);
            self.map.addLayer(osmLayer);

            self.map.zoomControl.setPosition('topright');
            global.markersLayer = L.layerGroup().addTo(self.map);
            setInterval(function () {
                try { self.map.invalidateSize(); } catch (e) {}
            }, 1000);
        }

        return self;
    }

    self.draw_recent_data = function () {
        if (!window.globals.data["data-fields-readings-formatted"] || window.globals.data["data-fields-readings-formatted"].length == 0) return;
        self.map = window.globals.variables["gpsmap"];

        window.globals.data["data-fields"].forEach(function (df, di) {
            
            // If the config doesn't have a map field
            if(!df.MAP) return;

            // If the data doesn't have any rows
            if (!window.globals.data["data-fields-readings-formatted"][df.ID]) return;

            // Show user's location on the map
            getlocation()
                .then(function (position) {
                    self.add_map_marker(position.coords.latitude, position.coords.longitude, "marker-red-solid ");
                });

            self.points = [];
            self.coords = [];

            //! Add markers to the map
            window.globals.data["data-fields-readings-formatted"][df.ID].forEach((row, ri ) => {

                // // Add the last 10 markers to the map
                // if (ri <= window.globals.data["data-fields-readings-formatted"][df.ID].length - 10) self.add_map_marker(row[1], row[2]);

                // Add all
                self.add_map_marker(row[1], row[2]);
            });

            //! Add hotline to the map
            self.add_map_hotline();

            //! Fit to bounds
            setTimeout(() => {
                try {
                    self.map.fitBounds(global.hotlineLayer.getBounds(),  {
                        padding: [20, 20]
                    });
                } 
                catch (e) {
                    console.log(e);
                }
            }, 1000);

            self.map.setZoom(self.map.getZoom() - 1);
        });
    }

    self.draw_all_data = function () {
        if (!window.globals.data["data-fields-readings-formatted"] || window.globals.data["data-fields-readings-formatted"].length == 0) return;
        self.map = window.globals.variables["gpsmap"];
        if (!self.map) return;

        var numberofdatatoshow = parseInt($(".map-filter-parent .map-filter-div .map-filter-number").val());
        if (!numberofdatatoshow || $(".map-filter-parent .map-filter-div .map-filter-number").val().trim().toLowerCase() == "all") numberofdatatoshow = 0;
        if (!numberofdatatoshow || isNaN(numberofdatatoshow)) {
            numberofdatatoshow = 15; // 0 indicates inactive filter (shows all data points)
            $(".map-filter-parent .map-filter-div .map-filter-number").val(numberofdatatoshow);
        }

        // Remove old markers layer
        if(self.map.hasLayer(global.markersLayer)) self.map.removeLayer(global.markersLayer);

        // Add a new markers layer
        global.markersLayer = L.layerGroup().addTo(self.map);

        window.globals.data["data-fields"].forEach(function (df, di) {

            // If the config doesn't have a map field
            if(!df.MAP) return;

            // If the data doesn't have any rows
            if (!window.globals.data["data-fields-readings-formatted"][df.ID]) return;

            // Show user's location on the map
            getlocation()
                .then(function (position) {

                    var marker = L.marker([position.coords.latitude, position.coords.longitude], {
                        icon: L.divIcon({
                            className: "marker-red-solid",
                            html: "",
                            iconSize: [12, 12]
                        })
                    });

                    marker.addTo(global.markersLayer);
                });

            self.points = [];
            self.coords = [];

            //! Add markers to the map
            window.globals.data["data-fields-readings-formatted"][df.ID].forEach((row, ri ) => {

                // Apply filter
                if (numberofdatatoshow > 0 && window.globals.data["data-fields-readings-formatted"][df.ID].length - ri > numberofdatatoshow) return;
                
                // Add all
                self.add_map_marker(row[1], row[2]);
            });

            //! Add hotline to the map
            self.add_map_hotline();

            //! Fit to bounds
            setTimeout(() => {
                try {
                    self.map.fitBounds(global.hotlineLayer.getBounds(),  {
                        padding: [20, 20]
                    });
                } 
                catch (e) {
                    console.log(e);
                }
            }, 1000);

            self.map.setZoom(self.map.getZoom() - 1);
        });
    }

    self.draw_new_data = function (data) {

        console.log("Drawing new data point on the map");
        
        window.globals.data["data-fields"].forEach(function (df, di) {
            if (df.MAP) {
            
                //! Update markers layer in the map
                if (data && data.length > 0) data.forEach(function (point) {
                    self.add_map_marker(point["LAT"], point["LNG"]);
                });
                
                //! Update hotline layer in the map
                self.add_map_hotline();
            }
        });


        function update_map(df, chart_name, series_name) {
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

                window.globals.data["data-fields-readings-formatted"][chart_name].push([timestamp, parseFloat(d[chart_name])]);

                // global.last_data_point_timestamp = parseInt(d.TIMESTAMP);
                series.addPoint([timestamp, parseFloat(d[chart_name])], true);

                // Set the data summary field with the latest data
                $(".data-summary-fields-list .data-summary-field[data-series-id='" + chart_name + "']").find(".value").html(parseFloat(d[chart_name]).toFixed(2));
                $(".data-summary-fields-list .last-update-timestamp").html(moment(timestamp - parseInt(window.globals.variables["tz-offset"]) * 1000).format("LLL"));
            });
        }
    }

    self.add_map_hotline = function () {

        // Remove old hotline layer
        if(self.map.hasLayer(global.hotlineLayer)) self.map.removeLayer(global.hotlineLayer);

        // Add a Hotline layer
        global.hotlineLayer = L.hotline(self.coords, {
            min: 1,
            max: self.coords.length,
            palette: {
                0.0: '#444444',
                0.5: '#444444',
                1.0: '#FF0000'
            },
            weight: 2,
            outlineColor: '#888888',
            outlineWidth: 0
        }).addTo(self.map);  
    }

    self.add_map_marker = function (lat, lng, colorclass) {

        if (lat == 12.34 && lng == -56.78) {
            lat = 29.6713604 + Math.random() / 100;
            lng = -82.3343366 + Math.random() / 100;
        }
        else if (
            lat == 0 || lng == 0 ||
            isNaN(lat) || isNaN(lng) ||
            lat == undefined || lng == undefined
        ) {
            return;
        }
        
        try {
            self.points.push(new L.LatLng(lat, lng));
            self.coords.push([lat, lng, self.coords.length]);

            var marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: colorclass ? colorclass : "marker-black-hollow",
                    html: "",
                    iconSize: [12, 12]
                })
            });

            // When a marker is clicked
            marker.on("click", function (ev) {
                $("<a class='temp-url'>").prop({
                    target: "_map",
                    href: "https://www.google.com/maps/place/" + ev.latlng.lat + "," + ev.latlng.lng
                })[0].click().remove();
            });

            // When a marker is clicked
            marker.on("dblclick", function (ev) {
                // select_marker_highlight_charts(row.timestamp);
                
                console.log(ev.latlng.lat + "," + ev.latlng.lng);
                console.log("https://www.google.com/maps/place/" + ev.latlng.lat + "," + ev.latlng.lng);
            });
            
            // marker.on("mouseover", function (ev) {

            //     $("#charts-container").fadeOut(80);

            //     var row = grep(grep(data, "lat", ev.latlng.lat, null, true), "lon", ev.latlng.lng, true, true);
            //     var timestamp = parseInt(row.TIMESTAMP) + window.globals.variables["tz-offset"];
            //     var date_obj = new Date(TIMESTAMP * 1000);
            //     var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            //     highlight_charts(row.TIMESTAMP);

            //     $("#marker-information-container").removeClass("hidden");

            //     $("#marker-information-div").html(`
            //         <div class="row" style="margin: 1px; text-align: center;">
                    
            //             <div class="col-auto">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">Latitude</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.lat).toFixed(4) + `&deg;</p>
            //             </div>
            //             <div class="col-auto">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">Longitude</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.lon).toFixed(4) + `&deg;</p>
            //             </div>
            //             <div class="col-auto">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">Date</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + months[date_obj.getMonth()] + " " +  date_obj.getDate() + ", " + date_obj.getFullYear() + " " + date_obj.getHours() + ":" + date_obj.getMinutes() + `</p>
            //             </div>

            //             <!-- Seperator -->
            //             <div class="col-auto" style="padding: 0 8px;"> <div style="margin: 2px 0 2px 0; border-left: 1px solid #BBB; height: 88%; min-width: 2px; color: transparent;">!</div> </div>

            //             <div class="col-auto">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">RTD</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.rtd).toFixed(2) + ` &deg;C</p>
            //             </div>
            //             <div class="col-auto hidden">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">pH</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.ph).toFixed(2) + `</p>
            //             </div>
            //             <div class="col-auto">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">EC</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.ec).toFixed(2) + ` uS/cm</p>
            //             </div>
            //             <div class="col-auto hidden">
            //                 <p style="margin-bottom: 2px; color: rgba(248, 112, 112, 1);">DO</p>
            //                 <p style="margin-bottom: 2px; font-size: 13px;">` + parseFloat(row.do).toFixed(2) + ` mg/L</p>
            //             </div>

            //         </div>
            //     `);
            // });

            // marker.on("mouseout", function (ev) {
                
            //     unhighlight_charts(row.timestamp);

            //     $("#charts-container").fadeIn(20);
                
            //     $("#marker-information-container").addClass("hidden");
            // });

            // // When a marker is clicked
            // marker.on("click", function (ev) {
            //     select_marker_highlight_charts(row.timestamp);
                
            //     console.log(ev.latlng.lat + "," + ev.latlng.lng);
            //     console.log("https://www.google.com/maps/place/" + ev.latlng.lat + "," + ev.latlng.lng);
            // });
            
            // // When a marker is clicked
            // marker.on("click", function (ev) {
            //     select_marker_highlight_charts(row.timestamp);
                
            //     console.log(ev.latlng.lat + "," + ev.latlng.lng);
            //     console.log("https://www.google.com/maps/place/" + ev.latlng.lat + "," + ev.latlng.lng);
            // });
        
            marker.addTo(global.markersLayer);
        }
        catch (e) {
            console.error("Problem with coordinates " + lat, lng);
            console.log(e);
        }
    }
}

function grep(data, key, value, return_first_result_only, search_fuzzy) {
    var res = $.grep(data, function (element, index) {
        if (element[key])
            return (search_fuzzy == undefined ? false : search_fuzzy) ? element[key].indexOf(value.toString()) > -1 : element[key] == value.toString();
        else
            return false;
    });
    return (return_first_result_only == undefined ? false : return_first_result_only) ? res[0] : res;
}

function getlocation() {
    return new Promise(function (resolve, reject) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                resolve(position);
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
            reject();
        }
    });
}