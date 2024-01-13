/*
    Activity watcher
    Piyush Agade
    v 1.0.0
*/
var activity_watcher = function(activity_callback, inactivity_callback, userOptions){
    var self = this;
    var _secondsSinceLastActivity = 0;
    var _intervalTimer;
    var _first_activity_detected = false;
    var _options = {
        maxInactivitySeconds: 3 * 60,
        detectFirstActivity: true
    }

    self.active = false;
    self.elapsed = 0;

    self.run = function () {
        // Set options
        if(userOptions)
            Object.keys(userOptions).forEach(function (option, index) {
                if(_options.hasOwnProperty(option))  _options[option] = userOptions[option];
                else console.warn("Invalid option: " + option); 
            });

        _intervalTimer = setInterval(function(){
            _secondsSinceLastActivity++;
            self.elapsed = _secondsSinceLastActivity;
            if(_secondsSinceLastActivity > _options.maxInactivitySeconds){
                _on_inactivity_timeout();
            }
        }, 1000);

        if(_options.detectFirstActivity) _first_activity_detected = true;

        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(eventName) {
            document.addEventListener(eventName, _on_activity, true);
        });

        return self;
    }

    self.stop = function () {
        clearInterval(_intervalTimer);
        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(eventName) {
            document.removeEventListener(eventName);
        });
        
        return self;
    }
 
    var _on_activity = function (){
        _secondsSinceLastActivity = 0;
        if(activity_callback && typeof activity_callback == "function" && !self.active && _first_activity_detected) activity_callback();
        self.active = true;
        if(!_first_activity_detected) _first_activity_detected = true;
    }

    var _on_inactivity_timeout = function () {
        if(inactivity_callback && typeof inactivity_callback == "function" && self.active) inactivity_callback();
        self.active = false;
    }
 
}
 