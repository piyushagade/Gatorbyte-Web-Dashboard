window.globals.apps["log"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.max_items_to_show = 20;

    self.init = function () {
        
        return self;
    }

    self.get_log_history = function () {
        
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
            url: window.globals.constants["api"] + "/" + window.globals.constants["device"]["type"] + "/log/get",
            success: function(response){
                
                window.globals.data["log"] = response.payload;
                self.show_log_data(response.payload);
            },
            error: function (response, textStatus, errorThrown) {
                console.log(response);
            }
        });
    }

    self.show_log_data = function (data) {

        if (!Array.isArray(data)) {
            data = [{
                "message": data,
                "timestamp": moment.now()
            }];
        }

        if (data.length > 0) {
            data.forEach(function (log, li) {
                $(".events-monitor-row .list .log-sentence").css("color", "#999").css("text-decoration", "none").css("font-size", "14px").css("margin-left", "8px");
                $(".events-monitor-row .list .log-sentence .caret").css("color", "#555");
                
                if($(".events-monitor-row .list p").length >= self.max_items_to_show) $(".events-monitor-row .list p").last().remove();
                $(".events-monitor-row .list").removeClass("hidden");
                $(".events-monitor-row .empty-notification").addClass("hidden");

                var html = multiline(function () {/*
                    <p class="log-sentence" style="margin-bottom: 6px; font-size: 20px;text-decoration: none;margin-left: 8px;padding: 8px 8px 4px 8px;">
                        <span class="caret" style="color: rgb(248, 112, 112); margin-right: 8px;"><i class="fa-solid {{icon-class}}"></i></span>
                        {{message}}
                        <span style="font-size: 12px; color: #BBB; margin-left: 8px;">({{timestamp}})</span>
                    </p>
                */},
                {
                    "message": log.message,
                    "timestamp": moment(parseInt(log.timestamp)).format("LLL"),
                    "icon-class": li == data.length - 1 ? "fa-angle-right" : "fa-clock-rotate-left"
                });

                if($(".events-monitor-row .list p").length == 0) {
                    $(".events-monitor-row .list").append(html);
                }
                else {
                    $(html).insertBefore(".events-monitor-row .list p:first");
                }
                
                $(".log-sentence").removeClass("highlighted");
                $(".log-sentence").first().addClass("highlighted");
            });
        }
        else {
            $(".events-monitor-row .empty-notification").removeClass("hidden");
        }

        // Repaint log sentences
        $(".events-monitor-row .list .log-sentence").each(function (ei, el) {
            $(el).css("background", ei % 2 == 0 ? "transparent" : "#AAAAAA20");
        });
        
    }

    self.timers = function () {
        
    }

}