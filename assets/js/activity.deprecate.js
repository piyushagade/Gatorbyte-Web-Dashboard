var activity_watcher = function(activity_callback, inactivity_callback){
    var self = this;
    var maxInactivitySeconds = 5;
    var secondsSinceLastActivity = 0;
    var intervalTimer;
    self.active = false;
    self.elapsed = 0;
 
    self.run = function () {
        intervalTimer = setInterval(function(){
            secondsSinceLastActivity++;
            self.elapsed = secondsSinceLastActivity;
            if(secondsSinceLastActivity > maxInactivitySeconds){
                self.on_inactivity_timeout();
            }
        }, 1000);

        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(eventName) {
            document.addEventListener(eventName, self.on_activity, true);
        });

        return self;
    }

    self.stop = function () {
        clearInterval(intervalTimer);
        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(eventName) {
            document.removeEventListener(eventName);
        });
        
        return self;
    }
 
    self.on_activity = function (){
        secondsSinceLastActivity = 0;
        if(activity_callback && typeof activity_callback == "function" && self.active != true) activity_callback();
        self.active = true;
    }

    self.on_inactivity_timeout = function () {
        if(inactivity_callback && typeof inactivity_callback == "function" && self.active != false) inactivity_callback();
        self.active = false;
    }
 
}
 