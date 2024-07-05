
// Q = 25.94 * d ^ 2.4
var global = {
    DEVICE_ID: null,
    DEVICE_TYPE: "gatorbyte",
    host: location.protocol + "//" + "sapi.ezbean-lab.com",
    server: location.protocol + "//" + "sapi.ezbean-lab.com/v3",
    timezone_shift: null,
    polling_frequency: null,
    data: {},
    socket: null
}

window.globals = {
    states: {
        "admin-mode": false,
        "dev-mode": false,
        "is-mobile-device": false
    },
    constants: {
        "fingerprint": null,
        "server": "https://sapi.ezbean-lab.com/",
        "api": "https://sapi.ezbean-lab.com/v3",
        "hostname": location.hostname,
        "socket": null,
        "device": {}
    },
    data: {
        "events": [],
        "blogs": [],
        "announcements": [],
        "pictures": [],
        "user": {},
        "url-params": new URLSearchParams(window.location.search)
    },
    variables: {
        "ls": window.sls,
        "tz-offset": null
    },
    accessors: {
        "functions": new functions_subapp().init(),
        "users": null,
    },
    apps: {}
}

var open_device_menu = function (event) {
    close_device_menu();
    close_expanded_menu();

    var $deviceMenu = $(".project-device-selector-menu");
    $deviceMenu.toggle();
    $(".project-device-selector-button").removeClass("an-flash");

    if ($deviceMenu.css("display") != "none") {
        $(".section-heading").css("filter", "blur(8px)").css("pointer-events", "none");
        $(".section-parent").css("filter", "blur(8px)").css("pointer-events", "none");
    }
}

var close_device_menu = function (event) {
    var $devicesBtn = $(".project-device-selector-button");
    var $deviceMenu = $(".project-device-selector-menu");
    if (!event) {
        if ($deviceMenu) $deviceMenu.hide();
        $(".section-heading").css("filter", "blur(0px)").css("pointer-events", "auto");
        $(".section-parent").css("filter", "blur(0px)").css("pointer-events", "auto");
        return; 
    }
    if ($deviceMenu && !$devicesBtn.is(event.target) && !$deviceMenu.has(event.target).length) {
        $deviceMenu.hide();
        $(".section-heading").css("filter", "blur(0px)").css("pointer-events", "auto");
        $(".section-parent").css("filter", "blur(0px)").css("pointer-events", "auto");
    }
}

var close_expanded_menu = function (event) {
    if (!event) return $('.hover-menu-button').find('.expanded-menu').addClass('hidden');
    var $clickedElement = $(event.target);
    if (!$clickedElement.closest('.hover-menu-button').length) {
        $('.hover-menu-button').find('.expanded-menu').addClass('hidden');
    }
}

$(document).ready(function () {

    // Toggle the menu on button click
    $(".project-device-selector-button").click(function (event) {
        event.stopPropagation();
        open_device_menu(event);
    });

    // Toggle the expanded menu visibility on click
    $('.hover-menu-button').click(function(event) {
        event.stopPropagation();
        
        close_device_menu();
        close_expanded_menu();
        
        $(this).find('.expanded-menu').removeClass('hidden');

        $(".section-heading").css("filter", "blur(8px)").css("pointer-events", "none");
        $(".section-parent").css("filter", "blur(8px)").css("pointer-events", "none");
    });

    // Close the menu when clicking outside of it
    $(document).on("click", function (event) {
        close_device_menu(event);
        close_expanded_menu(event);
    });

    // Set device config items
    window.globals.constants["device"]["type"] = "gatorbyte";

    // Init subapp modals
    window.globals.accessors["htmlslidein"] = new window.globals.apps["htmlslidein"]().init();
    window.globals.accessors["projects"] = new window.globals.apps["projects"]().init();
    window.globals.accessors["sites"] = new window.globals.apps["sites"]().init();
    window.globals.accessors["calibration"] = new window.globals.apps["calibration"]().init();
    window.globals.accessors["readings"] = new window.globals.apps["readings"]().init();
    window.globals.accessors["control"] = new window.globals.apps["control"]().init();
    window.globals.accessors["state"] = new window.globals.apps["state"]().init();
    window.globals.accessors["notes"] = new window.globals.apps["notes"]().init();
    window.globals.accessors["log"] = new window.globals.apps["log"]().init();
    window.globals.accessors["log"] = new window.globals.apps["log"]().init();
    window.globals.accessors["themes"] = new window.globals.apps["themes"]().init();

    // Set theme
    window.globals.accessors["themes"].settheme();

    // Logo screen
    setTimeout(() => {
        $(".loading-ui").fadeOut(300).addClass("hidden");
        setTimeout(() => {
            $(".dashboard-parent-ui").removeClass("hidden").fadeOut(0).fadeIn(400).css("overflow-y", "auto");
            
        }, 200);
    }, 3000);
    
    // Create a room on server for this web client
    window.globals.accessors["socket"] = new window.globals.apps["socket"]().init(function () {
        window.globals.accessors["socket"].publish({
            action: "room/createorjoin",
            payload: window.globals.accessors["socket"].id
        });
    });

    // Init user app
    window.globals.accessors["users"] = new window.globals.apps["users"]().init(function () {
        
        // Create data-fields
        window.globals.accessors["readings"].process_data_fields(function () {
            
            // Create charts/maps
            if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
            if (!window.globals.accessors["maps"]) window.globals.accessors["maps"] = new window.globals.apps["maps"]().init();

            // // Create datatable
            // window.globals.accessors["datatable"] = new window.globals.apps["datatable"]().init();

            // Initialize calibration tool
            window.globals.accessors["calibration"].get_calibratable_datafields();
        });
    });

    // Initialize command console
    window.globals.accessors["console"] = new window.globals.apps["console"]().init();

    // User activity monitor
    var activity = new activity_watcher(
        function () {
            // Show new data on resumed activity
            console.log("User is active");
        },
        function () {
            console.log("User is inactive");
        },{
            maxInactivitySeconds: 3 * 60,
            detectFirstActivity: true
        }
    ).run();

    // Set TZ offset
    window.globals.variables["tz-offset"] = (parseInt(-1 * (new Date().getTimezoneOffset()) / 60) * 60 + (new Date().getTimezoneOffset()) / 60 % 1 * 60) * 60;

    // //! Station activity monitor
    // setInterval(function(){
    //     if(global.last_data_point_timestamp && (new Date().getTime() / 1000 - global.last_data_point_timestamp >= 2 * 3600)){
    //         if($("#station-not-responding-notification").hasClass("hidden") && $("#user-inactive-notification").hasClass("hidden")){
    //             $("#station-not-responding-notification").removeClass("hidden");
    //             $("#station-not-responding-notification .date-area").text(moment(parseInt(global.last_data_point_timestamp * 1000)).format("LLL") + ".");
    //         }
    //         else if(!$("#user-inactive-notification").hasClass("hidden")) $("#station-not-responding-notification").addClass("hidden");
    //     }
    //     else if(!$("#station-not-responding-notification").hasClass("hidden")) $("#station-not-responding-notification").addClass("hidden");
    // }, 2000);
    
    // Theme selection button listener
    $(".theme-select-button").off("click").click(function () {
        var currstate = $(".theme-select-button").attr("state") || "dark"
        var newstate;

        if (currstate == "dark") {
            newstate = "light";
        }
        else if (currstate == "light") {
            newstate = "dark";
        }

        window.globals.accessors["themes"].settheme({
            theme: newstate,
            charts: $(".chart-container").toArray().map(function (d) { return $(d).highcharts(); })
        });

        $(".theme-select-button").attr("state", newstate);
        globals.variables.ls.setItem("/settings/theme", newstate);
    });

    // Walkthrough button listener
    $(".start-walkthrough-button").off("click").click(function () {
        let steps = [];

        var elements = [
            { element: '.project-device-selector-button', popover: { title: 'Device selection', description: 'Click here to see all the projects and devices you have access to view.', side: "left", align: 'start' } },
            { element: '.show-hide-config-button', popover: { title: 'Dashboard configuration', description: 'To change the dashboard configuration for the selected device, click here. You can change the way the charts are displayed, format the raw data, and more.', side: "bottom", align: 'start' } },
            { element: '.theme-select-button', popover: { title: 'Change theme', description: 'Switch between the dark and light modes.', side: "bottom", align: 'start' } },
            { element: '.logout-button', popover: { title: 'Dashboard access', description: 'Login or logout using this button.', side: "bottom", align: 'start' } },
            { element: '.data-summary-fields-list', popover: { title: 'Summary list', description: 'This section shows the snapshot of the latest readings.', side: "bottom", align: 'start' } },
            { element: '.data-fields-list .row', popover: { title: 'Data fields', description: 'Here lies the charts and the maps.', side: "bottom", align: 'start' } },
            { element: '.datatable-row .datatable', popover: { title: 'Datatable', description: 'If you want to see or download the data in tabular form, this is where you need to be.', side: "bottom", align: 'start' } },
            { element: '.datatable-row .tabs', popover: { title: 'Datatable tabs', description: 'The data is organized by tabs.', side: "bottom", align: 'start' } },
            { element: '.events-monitor-row', popover: { title: 'Event log', description: 'If your GatorByte is configured to send log messages, this is where you will see them.', side: "bottom", align: 'start' } },
            { element: '.state-data-row', popover: { title: 'Last known state', description: 'If your GatorByte is configured to send state data, you will see that information.', side: "bottom", align: 'start' } },
            { element: '.control-variables-row', popover: { title: 'Control variables', description: 'You can see and update control variables on your GatorByte using this section.', side: "bottom", align: 'start' } },
            { popover: { title: 'Thank you for using GatorByte!', description: 'And that is all, you can restart the tour by clicking on the ? icon.' } }
        ];

        elements.forEach(function (element, ei) {
            if (!element.element) return;

            if ($(element.element).hasClass("hidden") || $(element.elements).hasClass("disabled")) return;
            if (element.element.indexOf(".data-fields-list") == 0 && $('.data-fields-list').hasClass("hidden")) return;
            if (element.element.indexOf(".datatable-row") == 0 && $('.datatable-row').hasClass("hidden")) return;
            steps.push(element);
        });

        const driverObj = driver.js.driver({
            showProgress: true,
            stagePadding: 5,
            disableActiveInteraction: true, 
            steps: steps
        });
        driverObj.drive();
    });
});

function filter_outliers(arr) {  
    var values = arr.concat();
    values.sort( function(a, b) { return a - b; });
    var q1 = values[Math.floor((values.length / 4))];
    var q3 = values[Math.ceil((values.length * (3 / 4)))];
    var iqr = q3 - q1;
    var upperlimit = q3 + iqr * 1.5;
    var lowerlimit = q1 - iqr * 1.5;
    var filteredValues = values.filter(function(x) { return (x <= upperlimit) && (x >= lowerlimit); });
    return filteredValues;
}

function draw() {
    var r = Raphael("holder", 620, 420), discattr = { fill: "#fff", stroke: "none" };
    r.rect(0, 0, 619, 419, 10).attr({ stroke: "#666" });
    r.text(310, 20, "Drag the points to change the curves").attr({ fill: "#fff", "font-size": 16 });

    function curve(x, y, ax, ay, bx, by, zx, zy, color) {
        var path = [["M", x, y], ["C", ax, ay, bx, by, zx, zy]],
            path2 = [["M", x, y], ["L", ax, ay], ["M", bx, by], ["L", zx, zy]],
            curve = r.path(path).attr({ stroke: color || Raphael.getColor(), "stroke-width": 4, "stroke-linecap": "round" }),
            controls = r.set(
                r.path(path2).attr({ stroke: "#ccc", "stroke-dasharray": ". " }),
                r.circle(x, y, 5).attr(discattr),
                r.circle(ax, ay, 5).attr(discattr),
                r.circle(bx, by, 5).attr(discattr),
                r.circle(zx, zy, 5).attr(discattr)
            );
        controls[1].update = function (x, y) {
            var X = this.attr("cx") + x,
                Y = this.attr("cy") + y;
            this.attr({ cx: X, cy: Y });
            path[0][1] = X;
            path[0][2] = Y;
            path2[0][1] = X;
            path2[0][2] = Y;
            controls[2].update(x, y);
        };
        controls[2].update = function (x, y) {
            var X = this.attr("cx") + x,
                Y = this.attr("cy") + y;
            this.attr({ cx: X, cy: Y });
            path[1][1] = X;
            path[1][2] = Y;
            path2[1][1] = X;
            path2[1][2] = Y;
            curve.attr({ path: path });
            controls[0].attr({ path: path2 });
        };
        controls[3].update = function (x, y) {
            var X = this.attr("cx") + x,
                Y = this.attr("cy") + y;
            this.attr({ cx: X, cy: Y });
            path[1][3] = X;
            path[1][4] = Y;
            path2[2][1] = X;
            path2[2][2] = Y;
            curve.attr({ path: path });
            controls[0].attr({ path: path2 });
        };
        controls[4].update = function (x, y) {
            var X = this.attr("cx") + x,
                Y = this.attr("cy") + y;
            this.attr({ cx: X, cy: Y });
            path[1][5] = X;
            path[1][6] = Y;
            path2[3][1] = X;
            path2[3][2] = Y;
            controls[3].update(x, y);
        };
        controls.drag(move, up);
    }
    function move(dx, dy) {
        this.update(dx - (this.dx || 0), dy - (this.dy || 0));
        this.dx = dx;
        this.dy = dy;
    }
    function up() {
        this.dx = this.dy = 0;
    }

    curve(70, 100, 110, 100, 130, 200, 170, 200, "hsb(0, .75, .75)");
    curve(170, 100, 210, 100, 230, 200, 270, 200, "hsb(.8, .75, .75)");
    curve(270, 100, 310, 100, 330, 200, 370, 200, "hsb(.3, .75, .75)");
    curve(370, 100, 410, 100, 430, 200, 470, 200, "hsb(.6, .75, .75)");
    curve(470, 100, 510, 100, 530, 200, 570, 200, "hsb(.1, .75, .75)");
}

draw();