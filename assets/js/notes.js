window.globals.apps["notes"] = function () {
    var self = this;
    self.f = window.globals.accessors["functions"];
    self.ls = window.sls;

    self.init = function () {
        
        /*
            ! Listeners
        */
        $(".notes-text-box").off("keyup").keyup(self.f.debounce(function (e) {
            e.preventDefault();
            var value = $(".notes-text-box").val();

            //! Publish the command to SocketIO room
            window.globals.accessors["socket"].publish({
                action: "notes/update",
                payload: value
            });
        }, 1000));
    
        // Console input placeholder
        superplaceholder({
            el: $(".notes-text-box")[0],
            sentences: ['Site-specific notes', 'Tasks', 'Issues'],
            options: {
                loop: true,
                letterDelay: 150,
                sentenceDelay: 2000,
            }
        });

        return self;
    }

}