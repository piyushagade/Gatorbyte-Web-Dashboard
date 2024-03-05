
// Q = 25.94 * d ^ 2.4
var global = {
    DEVICE_ID: null,
    DEVICE_TYPE: "gatorbyte",
    host: location.protocol + "//" + "sapi.ezbean-lab.com",
    server: location.protocol + "//" + "sapi.ezbean-lab.com/v3",
    timezone_shift: null,
    polling_frequency: null,
    distance_from_sensor_to_culver_bottom: 150.41, // Calibrated on July 23rd 16:07:07 (1595534827),
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

$(document).ready(function () {

    var $devicesBtn = $(".project-device-selector-button");
    var $deviceMenu = $(".project-device-selector-menu");

    // Toggle the menu on button click
    $devicesBtn.click(function (event) {
        event.stopPropagation(); // Prevent the event from reaching the document body
        $deviceMenu.toggle();

        if ($deviceMenu.css("display") != "none") {
            $(".section-heading").css("filter", "blur(8px)").css("pointer-events", "none");
            $(".section-parent").css("filter", "blur(8px)").css("pointer-events", "none");
        }
    });

    // Close the menu when clicking outside of it
    $(document).on("click", function (event) {
        if (!$devicesBtn.is(event.target) && !$deviceMenu.has(event.target).length) {
            $deviceMenu.hide();
            $(".section-heading").css("filter", "blur(0px)").css("pointer-events", "auto");
            $(".section-parent").css("filter", "blur(0px)").css("pointer-events", "auto");
        }
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
    
    window.globals.accessors["socket"] = new window.globals.apps["socket"]().init(function () {
        
        // Create a room on server for this web client
        window.globals.accessors["socket"].publish({
            action: "room/createorjoin",
            payload: window.globals.accessors["socket"].id
        });
    });
    window.globals.accessors["users"] = new window.globals.apps["users"]().init(function () {
        
        // Create data-fields
        window.globals.accessors["readings"].process_data_fields(function () {
            
            // Create charts/maps
            
            if (!window.globals.accessors["charts"]) window.globals.accessors["charts"] = new window.globals.apps["charts"]().init();
            if (!window.globals.accessors["maps"]) window.globals.accessors["maps"] = new window.globals.apps["maps"]().init();

            // Create datatable
            window.globals.accessors["datatable"] = new window.globals.apps["datatable"]().init();

            // Initialize calibration tool
            window.globals.accessors["calibration"].get_calibratable_datafields();

        });
        
    });
    window.globals.accessors["console"] = new window.globals.apps["console"]().init();

    var activity = new activity_watcher(
        function () {
            // Show new data on resumed activity
            console.log("User is active");
            get_new_data_from_server();
        },
        function () {
            console.log("User is inactive");
        },{
            maxInactivitySeconds: 3 * 60,
            detectFirstActivity: true
        }
    ).run();

    // Set timezone offset in view
    $("#timezone-hr-shift-text-box").val(parseInt(-1 * (new Date().getTimezoneOffset()) / 60));
    $("#timezone-min-shift-text-box").val((new Date().getTimezoneOffset()) / 60 % 1 * 60);

    window.globals.variables["tz-offset"] = (parseInt($("#timezone-hr-shift-text-box").val()) * 60 + parseInt($("#timezone-min-shift-text-box").val())) * 60;
    window.globals.variables["poll-frequency"] = $("#refresh-interval-dropdown-selector").val() * 1000;

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
    
    $("#timezone-hr-shift-text-box").change(function(){
        let chart = $("#chart-container").highcharts();
        while(chart && chart.series.length > 0) chart.series[0].remove(true);
        window.globals.variables["tz-offset"] = (parseInt($("#timezone-hr-shift-text-box").val()) * 60 + parseInt($("#timezone-min-shift-text-box").val())) * 60;
        // create_chart();
    });
    $("#timezone-min-shift-text-box").change(function(){
        let chart = $("#chart-container").highcharts();
        while(chart && chart.series.length > 0) chart.series[0].remove(true);
        window.globals.variables["tz-offset"] = (parseInt($("#timezone-hr-shift-text-box").val()) * 60 + parseInt($("#timezone-min-shift-text-box").val())) * 60;
        // create_chart();
    });

    $("#y-axis-max-value").change(function(){
        let max_value = $(this).val();
        let chart = $("#chart-container").highcharts();

        chart.yAxis[0].update({
            max: max_value
        });
    });

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

        console.log(steps);

        const driverObj = driver.js.driver({
            showProgress: true,
            stagePadding: 5,
            disableActiveInteraction: true, 
            steps: steps
        });
        driverObj.drive();
    });
});

// Get new data from the server using a GET request
function get_new_data_from_server () {

    return;

    if(!window.globals.constants["device"]["id"]) return;

    $.ajax({
        type: 'GET',
        url: window.globals.constants["api"] + "/" + window.globals.constants["device"]["type"] + "/data/get?device_id=" + window.globals.constants["device"]["id"] + "&last_data_point_timestamp=" + global.last_data_point_timestamp,
        success: function(data, textStatus, request){
            // data = data.replace(/^\s*[\n]/gm, '');
            // data = Papa.parse(data, {header: true}).data;
            
            // if(data.length > 0) draw_new_data_points_on_chart(data);
        },
        error: function (request, textStatus, errorThrown) { }
    });
}

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