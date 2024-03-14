function functions_subapp(){
    var self;
    self = this;
    self.version = 1.0;
    self.ls = window.sls;

    self.init = function() {
        return self;
    }

    self.respond = {
        "json": {
            "ok": function (obj) {
                res.status(200).type("json").send(obj.data);
            }
        }    
    }
        
    self.set_state = function(state) {
        if(!state || (state && state.length == 0)) state = "";
        window.history.replaceState(null, null, (window.globals.states["dev-mode"]? "/dev/" : "/") + (location.pathname.replace("/", "")) + state);
    }
    
    /**
     * Convert JSON to CSV
     * @param {any} json_array
     * @returns {string}
     */
     self.j2c = function (json_array) {
        if (json_array.length == 0) return "";
        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(json_array[0])
        var csv = json_array.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        csv.unshift(header.join(','))
        csv = csv.join('\r\n')
        return csv;
    }

    self.show_loading_ui = function() {
        // $(".main-container").removeClass("hidden");
        // $(".loading-ui").removeClass("hidden");
    }
    
    self.hide_loading_ui = function() {
        // $(".main-container").addClass("hidden");
        // $(".loading-ui").addClass("hidden");
    }

    self.to_title_case = function(str) {
        str = str.toLowerCase().split(/[\s]+/)
        for (var i = 0; i < str.length; i++) str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        str = str.join(' ').split(/[\-]+/)
        for (var i = 0; i < str.length; i++) str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
        return str.join('-');
    }

    self.open_in_new_tab = function (url, win) {
        window.open(url, win || '_blank');
    }

    // Copy an object
    self.copy = function (obj) {
        if(!obj.length) return Object.assign({}, obj)
        else return [...obj];
    }

    self.copy_to_clipboard = str => {
        const el = document.createElement('textarea');  // Create a <textarea> element
        el.value = str;                                 // Set its value to the string that you want copied
        el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
        el.style.position = 'absolute';                 
        el.style.left = '-9999px';                      // Move outside the screen to make it invisible
        document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
        const selected =            
          document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
            el.select();                                    // Select the <textarea> content
        document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
        document.body.removeChild(el);                  // Remove the <textarea> element
        if (selected) {                                 // If a selection existed before copying
            document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
          document.getSelection().addRange(selected);   // Restore the original selection
        }
    }
    
    self.change_button_status = function (args) {
        if(!args.selector || !args.status) return;
        if(!$(args.selector).attr("reset-text")) $(args.selector).attr("reset-text", $(args.selector).text());
        var reset_text = args.reset_text || $(args.selector).attr("reset-text") || $(args.selector).text();
        var waiting_text = args.waiting_text;
        var reset_background = args.reset_background || $(args.selector).attr("background-color");
        var reset_color = args.reset_color || $(args.selector).attr("color") || "#FFF";

        if(args.status == "success"){
            $(args.selector).css({
                color: '#FFF',
                background: '#0078D7',
            }).text("Success");
            setTimeout(() => {
                $(args.selector).css({
                    color: reset_color || '#000',
                    background: reset_background || '#329E5E',
                    "pointer-events": 'auto'
                }).text(reset_text || "Sign in");
            }, 3000);
        }
        else if(args.status == "fail"){
            $(args.selector).css({
                color: '#FFF',
                background: '#EB3941'
            }).text("Error");
            setTimeout(() => {
                $(args.selector).css({
                    color: reset_color || '#000',
                    background: reset_background || '#329E5E',
                    "pointer-events": 'auto'
                }).text(reset_text || "Sign in");
            }, 3000);
        }
        else if(args.status == "waiting"){
            $(args.selector).css({
                "color": '#FFF',
                "background": '#3f444d',
                "pointer-events": 'none'
            }).text(waiting_text || "Please wait");
        }
        else if(args.status == "sending"){
            $(args.selector).css({
                "color": '#FFF',
                "background": '#3f444d',
                "pointer-events": 'none'
            }).text("Request sent");
            setTimeout(() => {
                $(args.selector).css({
                    "color": reset_color || '#000',
                    "background": reset_background || '#329E5E',
                    "pointer-events": 'auto'
                }).text(reset_text || "Sign in");
            }, 3000);
        }
    }

    self.compress_image = function(args) {
        var file = args.file;
        var quality = args.quality || 0.7;
        var height = args.height;
        var callback = args.callback;
        var reader = new FileReader();
        new Compressor(file, {
            quality: quality,
            height: height,
            success(blob) {
                reader.readAsDataURL(blob);
                setTimeout(() => {
                    if(callback && typeof callback == "function") callback(reader.result, blob);
                }, 100);
            }
        }, 100);
    }

    self.generate_ics = function(subject, description, location, begin, end) {
        var cal = ics();
        cal.addEvent(subject, description, location, parseInt(begin), parseInt(end));
        cal.download("ufkb_" + subject.trim().toLowerCase().replace(/ /g, "_"));
    }
    
    self.generate_link = function(type, str) {
        str = str || window.location.search.substring(1);
        return "https://" + location.hostname + "/?" + type + "=" + encodeURIComponent(str)
    }
    
    self.encrypt = function (str) {
        return CryptoJS.AES.encrypt(str, "UFKB rocks!!").toString()
    }
    
    self.decrypt = function (cry) {
        return CryptoJS.AES.decrypt(decodeURIComponent(cry.toString()), "UFKB rocks!!").toString(CryptoJS.enc.Utf8);
    }

    self.set_to_storage = function(key, value) {
        return self.ls.setItem(key, value);
    }

    self.get_from_storage = function(key) {
        return self.ls.getItem(key);
    }
    
    self.grep = function (data, key, value, return_first_result_only, search_fuzzy) {
        if (!data) return null;
        
        var res = $.grep(data, function (element, index) {
            if (element[key])
                return (search_fuzzy == undefined ? false : search_fuzzy) ? element[key].toLowerCase().indexOf(value.toString().toLowerCase()) > -1 : element[key].toLowerCase() == value.toString().toLowerCase();
            else
                return false;
        });
        return (return_first_result_only == undefined ? false : return_first_result_only) ? res[0] : res;
    }

    self.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    self.create_notification = function (type, message, theme) {
        window.notification = new Noty({
            type: type,
            text: message,
            theme: theme || 'mint',
            timeout: 4000,
            closeWith: ['click', 'button']
        }).show();

        // Close notification on mouse over
        $(".noty_layout").off("mouseenter").mouseenter(function () {
            window.notification.close();
        });
    }
    
    self.create_popup = function (message, blocking, success, failure) {
        $(".popup-ui").removeClass("hidden");
        $(".popup-ui .popup-text").html(message);

        if (blocking) {
            $(".popup-ui").css({
                "background": "rgba(40, 40, 40, 0.98)",
                "pointer-events": "auto"
            });
        }
        else {
            $(".popup-ui").css({
                "background": "transparent",
                "pointer-events": "none"
            });
        }

        $(".popup-action-buttons").css("pointer-events", "auto");

        // Click listener
        $(".popup-ui .popup-okay-button").off("click").click(function () {
            $(".popup-ui").addClass("hidden");
            $(".popup-ui .popup-text").html("");
            $(".popup-ui .popup-okay-button").off("click");

            if(success && typeof success == "function") success();
        });

        if(failure){
            $(".popup-ui .popup-cancel-button").removeClass("hidden");
            $(".popup-ui .popup-cancel-button").off("click").click(function () {
                $(".popup-ui").addClass("hidden");
                $(".popup-ui .popup-text").html("");
                $(".popup-ui .popup-cancel-button").off("click");

                if(failure && typeof failure == "function") failure();
            });
        }
        else {
            $(".popup-ui .popup-cancel-button").addClass("hidden");
        }
    }

    self.open_image = function() {
      
      if (this.files && this.files[0]) {
        
        var FR= new FileReader();
        
        FR.addEventListener("load", function(e) {
          document.getElementById("img").src       = e.target.result;
          document.getElementById("b64").innerHTML = e.target.result;
        }); 
        
        FR.readAsDataURL( this.files[0] );
      }
      
    }

    self.sort_json = function (field_1, field_2, reverse_field_1, reverse_field_2) {
        reverse_field_1 = reverse_field_1 == true ? -1 : 1;
        reverse_field_2 = reverse_field_2 == true ? -1 : 1;
        return function (a, b) {
            var a_1 = isNaN(parseFloat(a[field_1])) ? a[field_1] : parseFloat(a[field_1]);
            var b_1 = isNaN(parseFloat(b[field_1])) ? b[field_1] : parseFloat(b[field_1]);
            var a_2 = isNaN(parseFloat(a[field_2])) ? a[field_2] : parseFloat(a[field_2]);
            var b_2 = isNaN(parseFloat(b[field_2])) ? b[field_2] : parseFloat(b[field_2]);

            if (a_1 < b_1) return -1 * reverse_field_1;
            else if (a_1 > b_1) return 1 * reverse_field_1;
            if (!field_2) return 0;
            if (a_2 < b_2) return -1 * reverse_field_2;
            else if (a_2 > b_2) return 1 * reverse_field_2;
            return 0;
        };
    }

    //TODO: Finish this function
    self.sort_json_plus = function (args) {
        if (!args.one) args.one = {};
        if (!args.two) args.two = {};

        var field_1 = args.one.field;
        var field_2 = args.two.field;
        var field_1_type = args.one.type;
        var field_2_type = args.two.type;
        var reverse_field_1 = args.one.reverse;
        var reverse_field_2 = args.two.reverse;

        // if(field_1_type.toLowerCase().indexOf("int") > -1) 
        
        if (!reverse_field_1 || reverse_field_1 == 1) reverse_field_1 = 1;
        if (!reverse_field_2 || reverse_field_2 == 1) reverse_field_2 = 1;
        return function (a, b) {
            var a_1 = isNaN(parseFloat(a[field_1])) ? a[field_1] : parseFloat(a[field_1]);
            var b_1 = isNaN(parseFloat(b[field_1])) ? b[field_1] : parseFloat(b[field_1]);
            var a_2 = isNaN(parseFloat(a[field_2])) ? a[field_2] : parseFloat(a[field_2]);
            var b_2 = isNaN(parseFloat(b[field_2])) ? b[field_2] : parseFloat(b[field_2]);

            if (a_1 < b_1) return -1 * reverse_field_1;
            else if (a_1 > b_1) return 1 * reverse_field_1;
            if (!field_2) return 0;
            if (a_2 < b_2) return -1 * reverse_field_2;
            else if (a_2 > b_2) return 1 * reverse_field_2;
            return 0;
        };
    }

    self.get_current_semester = function() {
        var month = parseInt(new Date().getMonth()) + 1;
        var semester;
        if(month >= 1 && month <=4) semester = "spring";
        else if(month >= 5 && month <=7) semester = "summer";
        else if(month >= 8 && month <=12) semester = "fall";
        SEMESTER = semester;
        return semester;
    };

    // Gets academic year
    self.get_current_year = function() {
        var month = parseInt(new Date().getMonth()) + 1;
        var semester;
        if(month >= 1 && month <=4) semester = "spring";
        else if(month >= 5 && month <=7) semester = "summer";
        else if(month >= 8 && month <=12) semester = "fall";

        var year = parseInt((new Date().getFullYear()).toString().substr(2,4));
        if (semester == "spring") year--;
        YEAR = year;
        return year;
    }

    self.validate_email = function (string) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(string).toLowerCase());
    }

    self.validate_phone = function (string) {
        var re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return re.test(String(string));
    }

    self.uuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    self.open_in_new_tab = function(url, tab) {
        if (!url) return;
        window.open(url, tab || '_blank');
    }

    self.json_to_b64 = function (json) {
        if(typeof json == "object") json = JSON.stringify(json);
        return Base64.encode(json);
    }

    self.b64_to_json = function (b64) {
        return JSON.parse(Base64.decode(b64));
    }

    self.str_to_b64 = function (str) {
        return Base64.encode(str);
    }

    self.b64_to_str = function (b64) {
        return Base64.decode(b64);
    }

    self.validate_b64 = function (str) {
        if (!str || str ==='' || str.trim() ===''){ return false; }
        try {
            return btoa(atob(str)) == str;
        } catch (err) {
            return false;
        }
    }

    self.c2j = function (str) {
        if (typeof str == "object") return;
        else {
            return Papa.parse(str, {
                header: true
            }).data;
        }
    }

    self.wait = function (delay) {
        delay = delay || 100;

        return new Promise(function (resolve, reject) {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }
    
    self.generate_download = function (args) {
        if (!args.data) new Error("Can't generate download file. No data provided");

        var downloadLink = document.createElement("a");
        var blob = new Blob(["\ufeff", args.data]);
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = args.filename || "data.csv";
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    self.applyformula = function (df, formula, row) {
        var evalstr = formula;

        var valuesregex = /({{[a-zA-Z0-9\-]+}})/g;
        var variablesregex = /(\[[a-zA-Z0-9\-]+\])/g;
        
        // Apply value substitutions
        if (formula.match(valuesregex) != null) {
            for (var substitution of formula.match(valuesregex)) {
                substitution = substitution.replace(/{{/g, "").replace(/}}/g, "");

                var subvalue = df && substitution == "DATUM" ? df["CALIBRATION"]["VALUE"] : row[substitution];
                evalstr = evalstr.replace(new RegExp("{{" + substitution + "}}",'g'), subvalue);
            }
        }

        // Apply variable substitutions
        if (formula.match(variablesregex) != null) {
            for (var substitution of formula.match(variablesregex)) {
                substitution = substitution.replace(/\[/g, "").replace(/\]/g, "");

                var subvalue = df && substitution == "DATUM" ? df["CALIBRATION"]["VALUE"] : window.globals.data.site["VARIABLES"][substitution];
                evalstr = evalstr.replace(new RegExp("\\[" + substitution + "\\]", "g"), subvalue);
            }
        }

        // console.log(evalstr);

        return eval(evalstr);
    }

    self.applyvarsubstitution = function (string) {
        var evalstr = string;
        var variablesregex = /(\[[a-zA-Z0-9\-]+\])/g;

        // Apply variable substitutions
        if (string.match(variablesregex) != null) {
            for (var substitution of string.match(variablesregex)) {
                substitution = substitution.replace(/\[/g, "").replace(/\]/g, "");

                var subvalue = window.globals.data.site["VARIABLES"][substitution];
                evalstr = evalstr.replace(new RegExp("\\[" + substitution + "\\]", "g"), subvalue);
            }
        }

        return evalstr;
    }

    self.volttolevel = function (x) {
        var data = [{ "x": 3.27, "y": 0 }, { "x": 3.61, "y": 5 }, { "x": 3.69, "y": 10 }, { "x": 3.71, "y": 15 }, { "x": 3.73, "y": 20 }, { "x": 3.75, "y": 25 }, { "x": 3.77, "y": 30 }, { "x": 3.79, "y": 35 }, { "x": 3.8, "y": 40 }, { "x": 3.82, "y": 45 }, { "x": 3.84, "y": 50 }, { "x": 3.85, "y": 55 }, { "x": 3.87, "y": 60 }, { "x": 3.91, "y": 65 }, { "x": 3.95, "y": 70 }, { "x": 3.98, "y": 75 }, { "x": 4.02, "y": 80 }, { "x": 4.08, "y": 85 }, { "x": 4.11, "y": 90 }, { "x": 4.15, "y": 95 }, { "x": 4.2, "y": 100 }];

        // Ensure x is within the range of the data
        if (x < data[0].x || x > data[data.length - 1].x) {
            console.error("x is outside the range of available data");
            return null;
        }

        // Find the two data points surrounding x
        let i = 0;
        while (data[i + 1].x < x) {
            i++;
        }

        // Perform linear interpolation
        const x0 = data[i].x;
        const y0 = data[i].y;
        const x1 = data[i + 1].x;
        const y1 = data[i + 1].y;

        const y = y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);

        return y;
    }

    self.url = function (args) {
        var url = window.globals.constants["api"] + "/gatorbyte" + args.path + "?device_id=" + window.globals.constants["device"]["id"] + "&device_type=" + window.globals.constants["device"]["type"];

        Object.keys(args).forEach(function (arg, ai) {
            if (arg == "path") return;
            url += "&" + arg + "=" + args[arg];
        })

        return url;
    }

    self.is_mobile_device = function () {
        window.globals.states["is-mobile-device"] = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4));

        return window.globals.states["is-mobile-device"];
    }

    self.adj_noun_generate = function() {
        var adj = ["able","abnormal","above","absent","absolute","abstract","absurd","academic","acceptable","accessible","accounting","accurate","accused","active","actual","acute","added","additional","adequate","adjacent","administrative","adult","advanced","adverse","advisory","aesthetic","afraid","aggregate","aggressive","agreed","agricultural","alert","alien","alive","alleged","allied","alone","alright","alternative","amateur","amazing","ambiguous","ambitious","ample","ancient","angry","annual","anonymous","anxious","appalling","apparent","applicable","applied","appointed","appropriate","approved","arbitrary","archaeological","architectural","armed","artificial","artistic","ashamed","asleep","assistant","associated","astonishing","atomic","attempted","attractive","automatic","autonomous","available","average","awake","aware","awful","awkward","back","bad","balanced","bare","basic","beautiful","beneficial","big","binding","biological","bitter","bizarre","black","blank","bleak","blind","blonde","bloody","blue","bodily","bold","bored","boring","bottom","bourgeois","brave","brief","bright","brilliant","broad","broken","brown","bureaucratic","burning","busy","calm","capable","capital","careful","casual","causal","cautious","central","certain","changing","characteristic","charming","cheap","cheerful","chemical","chief","chosen","chronic","circular","civic","civil","civilian","classic","classical","clean","clear","clerical","clever","clinical","close","closed","cooperative","coastal","cognitive","coherent","cold","collective","colonial","color-blind","colorful","combined","comfortable","coming","commercial","common","communist","comparable","comparative","compatible","competent","competitive","complementary","complete","complex","complicated","comprehensive","compulsory","conceptual","concerned","concrete","confident","confidential","conscious","conservative","considerable","consistent","constant","constitutional","constructive","contemporary","content","continental","continued","continuing","continuous","contractual","contrary","controlled","controversial","convenient","conventional","convincing","cool","corporate","correct","corresponding","costly","crazy","creative","criminal","critical","crucial","crude","cruel","cultural","curious","current","daily","damaging","damp","dangerous","dark","dead","deadly","deaf","dear","decent","decisive","decorative","deep","defensive","definite","deliberate","delicate","delicious","delighted","delightful","democratic","dense","departmental","dependent","depending","depressed","desirable","desired","desperate","detailed","determined","developed","developing","devoted","different","differential","difficult","digital","diplomatic","direct","dirty","disabled","disastrous","disciplinary","distant","distinct","distinctive","distinguished","distributed","diverse","divine","domestic","dominant","double","doubtful","dramatic","dreadful","driving","drunk","dry","dual","due","dull","dynamic","eager","early","eastern","easy","economic","educational","effective","efficient","elaborate","elderly","elected","electoral","electric","electrical","electronic","elegant","eligible","embarrassed","embarrassing","emotional","empirical","empty","encouraging","endless","enhanced","enjoyable","enormous","enthusiastic","entire","environmental","equal","equivalent","essential","established","estimated","eternal","ethical","ethnic","eventual","everyday","evident","evil","evolutionary","exact","excellent","exceptional","excess","excessive","excited","exciting","exclusive","executive","existing","exotic","expected","expensive","experienced","experimental","expert","explicit","express","extended","extensive","external","extra","extraordinary","extreme","faint","fair","faithful","false","familiar","famous","fantastic","far","fascinating","fashionable","fast","fat","fatal","favorable","favorite","feasible","federal","fellow","female","feminine","fierce","final","financial","fine","finished","firm","first","fiscal","fit","fixed","flat","flexible","following","fond","foolish","foreign","formal","formidable","forthcoming","fortunate","forward","fragile","free","frequent","fresh","friendly","frightened","front","frozen","futile","full","full-time","fun","functional","fundamental","funny","furious","future","gastric","gay","general","generous","genetic","gentle","genuine","geographical","geological","giant","given","glad","global","glorious","gold","golden","good","gothic","gradual","grammatical","grand","grateful","grave","great","green","gray","grim","gross","growing","guilty","handicapped","handsome","handy","happy","hard","harmful","harsh","head","healthy","heavy","helpful","helpless","hidden","high","historic","historical","holy","homeless","homogenous","honest","honorable","horizontal","horrible","hostile","hot","huge","human","humble","hungry","ideal","identical","ideological","ill","illegal","imaginative","immediate","immense","imminent","immune","imperial","implicit","important","impossible","impressive","improved","inadequate","inappropriate","incapable","inclined","increased","increasing","incredible","independent","indigenous","indirect","individual","indoor","industrial","inevitable","infinite","influential","informal","inherent","initial","injured","inland","inner","innocent","innovative","instant","institutional","instrumental","insufficient","intact","integral","integrated","intellectual","intelligent","intense","intensive","intent","interactive","interested","interesting","interim","interior","intermediate","internal","international","intimate","invaluable","invisible","involved","irrelevant","irrespective","isolated","jealous","joint","judicial","junior","just","justified","keen","key","kind","known","labor","lacking","large","large-scale","last","late","Latin","lay","lazy","leading","left","legal","legislative","legitimate","lengthy","lesser","level","lexical","liable","liberal","light","like","likely","limited","linear","linguistic","liquid","literary","little","live","lively","living","local","logical","lone","lonely","long","long-term","loose","lost","loud","lovely","low","loyal","lucky","luxury","mad","magic","magical","magnetic","magnificent","main","major","male","managerial","managing","mandatory","manual","manufacturing","marginal","marine","marked","married","marvelous","mass","massive","material","mathematical","mature","maximum","mean","meaningful","mechanical","medical","medieval","medium","memorable","mental","mere","metropolitan","mid","middle","middle-class","mighty","mild","military","minimal","minimum","ministerial","minor","minute","miserable","misleading","missing","mixed","mobile","moderate","modern","modest","molecular","monetary","monthly","moral","moving","multiple","municipal","musical","mutual","mysterious","naked","narrow","nasty","national","native","natural","naval","near","nearby","neat","necessary","negative","neighboring","nervous","net","neutral","new","nice","noble","noisy","nominal","normal","northern","notable","noticeable","notorious","novel","nuclear","numerous","nursing","objective","obscure","obvious","occasional","occupational","odd","offensive","official","okay","old","old-fashioned","only","open","operational","opposed","opposite","optical","optimistic","optional","oral","orange","ordinary","organic","organizational","organizational","original","orthodox","other","outdoor","outer","outside","outstanding","overall","overseas","overwhelming","paid","painful","pale","papal","parallel","parental","parliamentary","part-time","partial","particular","passionate","passive","past","patient","payable","peaceful","peculiar","perceived","perfect","permanent","persistent","personal","petty","philosophical","photographic","physical","pink","plain","planned","plausible","pleasant","pleased","polish","polite","political","poor","popular","portable","positive","possible","post-war","potential","powerful","practical","precious","precise","predictable","preferred","pregnant","preliminary","premature","premier","present","presidential","pretty","previous","primary","prime","primitive","principal","printed","prior","private","privileged","probable","productive","professional","profitable","profound","progressive","prolonged","prominent","prone","proper","proportional","proposed","prospective","protective","proud","provincial","provisional","psychiatric","psychological","public","pure","purple","qualified","quantitative","quick","quiet","racial","radical","raised","random","rapid","rare","rational","raw","ready","real","realistic","rear","reasonable","recent","red","reduced","redundant","regional","regular","regulatory","related","relative","relevant","reliable","religious","reluctant","remaining","remarkable","remote","renewed","repeated","representative","required","resident","residential","respectable","respective","responsible","restricted","restrictive","resulting","retail","retired","revised","revolutionary","rich","ridiculous","right","rigid","rising","rival","romantic","rotten","rough","round","royal","rubber","rude","ruling","running","rural","sacred","sad","safe","satisfactory","satisfied","scared","scientific","seasonal","secondary","secret","secular","secure","select","selected","selective","semantic","senior","sensible","sensitive","separate","serious","severe","sensational","shallow","shared","sharp","sheer","shocked","short","short-term","shy","sick","significant","silent","silly","silver","similar","simple","single","skilled","sleeping","slight","slim","slow","small","smart","smooth","so-called","social","socialist","sociological","soft","solar","sole","solid","sophisticated","sore","sorry","sound","southern","spare","spatial","special","specialist","specific","specified","spectacular","spiritual","splendid","spoken","spontaneous","square","stable","standard","static","statistical","statutory","steady","steep","sterling","sticky","stiff","still","stolen","straight","straightforward","strange","strategic","strict","striking","strong","structural","stunning","subject","subjective","subsequent","substantial","substantive","subtle","successful","successive","sudden","sufficient","suitable","sunny","super","superb","superior","supplementary","supporting","supposed","supreme","sure","surplus","surprised","surprising","surrounding","suspicious","sweet","swift","symbolic","sympathetic","syntactic","systematic","talented","tall","technical","technological","teenage","temporary","tender","tense","terminal","terrible","territorial","theoretical","thick","thin","thinking","thorough","tight","tiny","tired","top","total","tough","toxic","trading","traditional","tragic","trained","tremendous","trivial","tropical","true","typical","ugly","ultimate","unable","unacceptable","unaware","uncertain","unchanged","unclear","uncomfortable","unconscious","underground","underlying","understandable","uneasy","unemployed","unexpected","unfair","unfamiliar","unfortunate","unhappy","uniform","unique","united","universal","unknown","unlawful","unlike","unlikely","unnecessary","unpleasant","unprecedented","unreasonable","unsuccessful","unusual","unwanted","unwilling","up-to-date","upper","upset","urban","urgent","used","useful","useless","usual","vacant","vague","valid","valuable","variable","varied","various","varying","vast","verbal","vertical","very","viable","vicious","video-taped","vigorous","violent","virtual","visible","visual","vital","vivid","vocational","voluntary","vulnerable","waiting","walking","warm","wary","waste","weak","wealthy","wee","weekly","weird","welcome","well","well-known","western","wet","white","whole","wicked","wide","widespread","wild","willing","winning","wise","wonderful","wooden","working","working-class","worldwide","worried","worrying","worthwhile","worthy","written","wrong","yellow","young"];

        var noun = ["abbey","ability","abolition","abrasion","absence","absorption","abuse","academic","academy","accent","acceptance","access","accident","accommodation","accord","accordance","account","accountability","accountant","accumulation","accuracy","accusation","achievement","acid","acquaintance","acquisition","acre","act","action","activist","activity","actor","actress","adaptation","addition","address","adjective","adjustment","administration","administrator","admiration","admission","adoption","adult","advance","advantage","adventure","advertisement","advertising","advice","adviser","advocate","affair","affection","affinity","afternoon","age","agency","agenda","agent","aggression","agony","agreement","agriculture","aid","aids","aim","air","aircraft","airline","airport","alarm","album","alcohol","allegation","alliance","allocation","allowance","ally","altar","alteration","alternative","aluminum","amateur","ambassador","ambiguity","ambition","ambulance","amendment","amount","amp","amusement","analogy","analysis","analyst","ancestor","angel","anger","angle","animal","ankle","anniversary","announcement","answer","ant","antibody","anticipation","anxiety","apartment","apology","apparatus","appeal","appearance","appendix","appetite","apple","applicant","application","appointment","appraisal","appreciation","approach","approval","aquarium","arc","arch","archbishop","architect","architecture","archive","area","arena","argument","arm","armchair","army","arrangement","array","arrest","arrival","arrow","art","article","artist","ash","aspect","aspiration","assault","assembly","assertion","assessment","asset","assignment","assistance","assistant","associate","association","assumption","assurance","asylum","athlete","atmosphere","atom","attachment","attack","attacker","attainment","attempt","attendance","attention","attitude","attraction","attribute","auction","audience","audit","auditor","aunt","author","authority","autonomy","autumn","availability","avenue","average","aviation","award","awareness","axis","baby","back","background","backing","bacon","bacteria","bag","bail","balance","balcony","ball","ballet","balloon","ballot","ban","banana","band","bang","bank","banker","banking","bankruptcy","banner","bar","bargain","barn","barrel","barrier","base","basement","basin","basis","basket","bass","bastion","bat","batch","bath","bathroom","battery","battle","bay","beach","beam","bean","bear","beard","bearing","beast","beat","beauty","bed","bedroom","bee","beef","beer","beginning","behalf","behavior","being","belief","bell","belly","belt","bench","bend","beneficiary","benefit","bet","bias","bible","bicycle","bid","bike","bile","bill","bin","biography","biology","bird","birth","birthday","biscuit","bishop","bit","bit","bite","black","blade","blame","blanket","blast","blessing","block","blocker","blood","blow","blue","board","boat","body","boiler","bolt","bomb","bomber","bond","bone","bonus","book","booking","booklet","boom","boost","boot","border","borough","boss","bottle","bottom","boundary","bow","bowel","bowl","bowler","box","boxing","boy","boyfriend","bracket","brain","brake","branch","brand","brandy","brass","breach","bread","break","breakdown","breakfast","breast","breath","breed","breeding","breeze","brewery","brick","bride","bridge","brigade","broadcast","brochure","broker","bronze","brother","brow","brush","bubble","bucket","budget","builder","building","bulb","bulk","bull","bullet","bulletin","bunch","bundle","burden","bureau","bureaucracy","burial","burn","burst","bus","bush","business","businessman","butter","butterfly","button","buyer","cab","cabin","cabinet","cable","cafe","cage","cake","calcium","calculation","calendar","calf","call","calm","calorie","camera","camp","campaign","can","canal","cancer","candidate","candle","canvas","cap","capability","capacity","capital","capitalism","capitalist","captain","car","caravan","carbon","card","care","career","caregiver","cargo","carpet","carriage","carrier","carrot","cart","case","cash","cassette","cast","castle","casualty","cat","catalogue","catch","category","cathedral","cattle","cause","caution","cave","ceiling","celebration","cell","cellar","cemetery","census","center","century","cereal","ceremony","certainty","certificate","chain","chair","chairman","chalk","challenge","chamber","champagne","champion","championship","chance","chancellor","change","channel","chaos","chap","chapel","chapter","character","characteristic","charge","charity","charm","chart","charter","chase","chat","check","cheek","cheese","chemical","chemist","chemistry","check","chest","chicken","chief","child","childhood","chimney","chin","chip","chocolate","choice","choir","chord","chorus","church","cigarette","cinema","circle","circuit","circular","circulation","circumstance","citizen","citizenship","city","civilian","civilization","claim","clarity","clash","class","classic","classification","classroom","clause","clay","cleaner","clearance","clearing","clergy","clerk","client","cliff","climate","climb","climber","clinic","clock","closure","cloth","clothes","clothing","cloud","club","clue","cluster","cooperation","coach","coal","coalition","coast","coat","code","coffee","coffin","coin","coincidence","cold","collaboration","collapse","collar","colleague","collection","collector","college","colon","colonel","colony","color","column","combination","comedy","comfort","command","commander","comment","commentary","commentator","commerce","commission","commissioner","commitment","committee","commodity","commons","commonwealth","communication","communism","communist","community","compact","companion","company","comparison","compartment","compensation","competence","competition","competitor","complaint","completion","complex","complexity","compliance","complication","component","composer","composition","compound","compromise","computer","computing","concentration","concept","conception","concern","concert","concession","conclusion","concrete","condition","conduct","conductor","conference","confession","confidence","configuration","confirmation","conflict","confrontation","confusion","congregation","congress","conjunction","connection","conscience","consciousness","consensus","consent","consequence","conservation","conservative","consideration","consistency","consortium","conspiracy","constable","constituency","constituent","constitution","constraint","construction","consultant","consultation","consumer","consumption","contact","container","contemporary","contempt","content","contest","context","continent","continuation","continuity","contract","contraction","contractor","contradiction","contrary","contrast","contribution","control","controller","controversy","convenience","convention","conversation","conversion","conviction","cook","cooking","cooperation","copper","copy","copyright","cord","core","corn","corner","corps","corpse","correction","correlation","correspondence","correspondent","corridor","corruption","cost","costume","cottage","cotton","council","councilor","counsel","counseling","counselor","count","counter","counterpart","country","countryside","county","coup","couple","courage","course","court","courtesy","courtyard","cousin","covenant","cover","coverage","cow","crack","craft","craftsman","crash","cream","creation","creature","credibility","credit","creditor","creed","crew","cricket","crime","criminal","crisis","criterion","critic","criticism","critique","crop","cross","crossing","crowd","crown","cruelty","cry","crystal","cult","culture","cup","cupboard","cure","curiosity","curl","currency","current","curriculum","curtain","curve","cushion","custody","custom","customer","cut","cutting","cycle","cylinder","dairy","damage","dance","dancer","dancing","danger","dark","darkness","darling","data","database","date","daughter","dawn","day","daylight","deadline","deal","dealer","dealing","dear","death","debate","debt","debtor","debut","decade","decay","decision","decision-making","deck","declaration","decline","decoration","decrease","decree","deed","deer","default","defeat","defect","defense","defendant","defender","deficiency","deficit","definition","degree","delay","delegate","delegation","delight","delivery","demand","democracy","democrat","demonstration","demonstrator","denial","density","dentist","department","departure","dependence","dependency","deposit","depot","depression","deprivation","depth","deputy","descent","description","desert","design","designer","desire","desk","desktop","despair","destination","destiny","destruction","detail","detection","detective","detector","detention","determination","developer","development","deviation","device","devil","diagnosis","diagram","dialogue","diameter","diamond","diary","dictionary","diet","difference","differentiation","difficulty","dignity","dilemma","dimension","dining","dinner","dioxide","diplomat","direction","directive","director","directory","dirt","disability","disadvantage","disagreement","disappointment","disaster","disc","discharge","discipline","disclosure","disco","discount","discourse","discovery","discretion","discrimination","discussion","disease","dish","disk","dismissal","disorder","display","disposal","disposition","dispute","disruption","distance","distinction","distortion","distress","distribution","distributor","district","disturbance","diversity","dividend","division","divorce","dock","doctor","doctrine","document","documentation","dog","doing","doll","dollar","dolphin","domain","dome","dominance","domination","donation","donor","door","doorway","dose","dot","double","doubt","dozen","draft","dragon","drain","drainage","drama","draw","drawer","drawing","dream","dress","dressing","drift","drill","drink","drive","driver","drop","drug","drum","duck","duke","duration","dust","duty","dwelling","eagle","ear","earl","earning","earth","ease","east","echo","economics","economist","economy","edge","edition","editor","education","effect","effectiveness","efficiency","effort","egg","ego","elbow","elder","election","electorate","electricity","electron","electronics","element","elephant","elite","embarrassment","embassy","embryo","emergence","emergency","emission","emotion","emperor","emphasis","empire","employee","employer","employment","encounter","encouragement","end","ending","enemy","energy","enforcement","engagement","engine","engineer","engineering","enjoyment","enquiry","enterprise","entertainment","enthusiasm","enthusiast","entitlement","entity","entrance","entry","envelope","environment","enzyme","episode","equality","equation","equilibrium","equipment","equity","equivalent","era","erosion","error","escape","essay","essence","establishment","estate","estimate","ethics","evaluation","evening","event","evidence","evil","evolution","exam","examination","example","excavation","exception","excess","exchange","excitement","exclusion","excuse","execution","executive","exemption","exercise","exhibition","exile","existence","exit","expansion","expectation","expedition","expenditure","expense","experience","experiment","expert","expertise","explanation","exploitation","exploration","explosion","export","exposure","expression","extension","extent","extract","extreme","eye","eyebrow","fabric","facade","face","facility","fact","faction","factor","factory","faculty","failure","fair","fairy","faith","fall","fame","family","fan","fantasy","fare","farm","farmer","farming","fashion","fat","fate","father","fault","favor","favorite","fax","fear","feast","feather","feature","federation","fee","feed","feedback","feel","feeling","fellow","female","feminist","fence","ferry","fertility","festival","fever","few","fiber","fiction","field","fig","fight","fighter","figure","file","film","filter","final","finance","finding","fine","finger","finish","fire","firm","fish","fisherman","fishing","fist","fit","fitness","fitting","fixture","flag","flame","flash","flat","flavor","fleet","flesh","flexibility","flight","flock","flood","floor","flour","flow","flower","fluctuation","fluid","fly","focus","fog","fold","folk","follower","food","fool","foot","football","footstep","force","forecast","forehead","foreigner","forest","forestry","fork","form","format","formation","formula","formulation","fortnight","fortune","forum","fossil","foundation","founder","fountain","fox","fraction","fragment","frame","framework","franchise","fraud","freedom","freight","frequency","freezer","friend","friendship","fringe","frog","front","frontier","fruit","frustration","fuel","fun","function","fund","funding","funeral","fur","furniture","fury","fusion","fuss","future","gain","galaxy","gall","gallery","gallon","game","gang","gap","garage","garden","gardener","garlic","garment","gas","gate","gathering","gaze","gear","gender","gene","general","generation","genius","gentleman","geography","gesture","ghost","giant","gift","gig","girl","girlfriend","glance","glass","glimpse","gloom","glory","glove","glow","go","goal","goalkeeper","goat","god","gold","golf","good","goodness","gospel","gossip","government","governor","gown","grace","grade","graduate","grain","grammar","grandfather","grandmother","grant","graph","graphics","grasp","grass","grave","gravel","gravity","green","greenhouse","greeting","grid","grief","grin","grip","ground","group","grouping","growth","guarantee","guard","guardian","guerrilla","guess","guest","guidance","guide","guideline","guild","guilt","guitar","gun","gut","guy","habit","habitat","hair","half","hall","halt","ham","hammer","hand","handful","handicap","handle","handling","happiness","harbor","hardship","hardware","harm","harmony","harvest","hat","hatred","hay","hazard","head","heading","headline","headmaster","headquarters","health","heap","hearing","heart","heat","heating","heaven","hectare","hedge","heel","height","heir","helicopter","hell","helmet","help","hemisphere","hen","herb","herd","heritage","hero","heroin","hierarchy","highlight","highway","hill","hint","hip","hire","historian","history","hit","hobby","hold","holder","holding","hole","holiday","holly","home","homework","honey","honor","hook","hope","horizon","horn","horror","horse","hospital","hospitality","host","hostage","hostility","hotel","hour","house","household","housewife","housing","human","humanity","humor","hunger","hunt","hunter","hunting","hurry","husband","hut","hydrogen","hypothesis","ice","idea","ideal","identification","identity","ideology","ignorance","illness","illusion","illustration","image","imagination","immigrant","immigration","impact","implementation","implication","import","importance","impression","imprisonment","improvement","impulse","inability","incentive","inch","incidence","incident","inclusion","income","increase","independence","index","indication","indicator","individual","industry","inequality","infant","infection","inflation","influence","information","infrastructure","ingredient","inhabitant","inheritance","inhibition","initial","initiative","injection","injunction","injury","inn","innocence","innovation","input","inquest","inquiry","insect","inside","insider","insight","insistence","inspection","inspector","inspiration","installation","instance","instant","instinct","institute","institution","instruction","instructor","instrument","insurance","intake","integration","integrity","intellectual","intelligence","intensity","intent","intention","interaction","internet","interest","interface","interference","interior","interpretation","interval","intervention","interview","introduction","invasion","invention","investigation","investigator","investment","investor","invitation","involvement","ion","iron","irony","island","isolation","issue","item","ivory","jacket","jail","jam","jar","jaw","jazz","jeans","jet","jewel","jewelry","job","jockey","joint","joke","journal","journalist","journey","joy","judge","judgment","judgment","juice","jump","junction","jungle","jurisdiction","jury","justice","justification","keeper","kettle","key","keyboard","kick","kid","kidney","killer","killing","kilometer","kind","king","kingdom","kiss","kit","kitchen","kite","knee","knife","knight","knitting","knock","knot","knowledge","lab","label","laboratory","labor","laborer","lace","lack","lad","ladder","lady","lake","lamb","lamp","land","landing","landlord","landowner","landscape","lane","language","lap","laser","laugh","laughter","launch","law","lawn","lawyer","layer","layout","lead","leader","leadership","leaf","leaflet","league","learner","learning","lease","leather","leave","lecture","lecturer","left","leg","legacy","legend","legislation","legislature","leisure","lemon","lender","length","lesson","letter","level","liability","liaison","liberal","liberation","liberty","librarian","library","license","lid","lie","life","lifespan","lifestyle","lifetime","lift","light","lighting","like","likelihood","limb","limestone","limit","limitation","line","linen","link","lion","lip","liquid","list","listener","literacy","literature","litigation","liter","liver","living","load","loan","lobby","local","locality","location","lock","locomotive","log","logic","look","loop","lord","lordship","lorry","loss","lot","lounge","love","lover","loyalty","luck","lump","lunch","lunchtime","lung","luxury","machine","machinery","magazine","magic","magistrate","magnitude","maid","mail","mainframe","mainland","mains","mainstream","maintenance","majesty","majority","make","make-up","maker","making","male","mammal","man","management","manager","manifestation","manipulation","mankind","manner","manor","manpower","manual","manufacture","manufacturer","manufacturing","manuscript","map","marathon","marble","march","margin","mark","marker","market","marketing","marriage","marsh","mask","mass","master","match","mate","material","mathematics","matrix","matter","maturity","maximum","mayor","meadow","meal","meaning","means","meantime","measure","measurement","meat","mechanism","medal","media","medicine","medium","meeting","member","membership","membrane","memorandum","memorial","memory","mention","menu","merchant","mercy","merger","merit","mess","message","metal","metaphor","method","methodology","meter","microphone","middle","midfield","midnight","migration","mile","milk","mill","mind","mine","miner","mineral","minimum","mining","minister","ministry","minority","minute","miracle","mirror","misery","missile","mission","mist","mistake","mistress","mix","mixture","mobility","mode","model","modification","module","mole","molecule","moment","momentum","monarch","monarchy","monastery","money","monitor","monitoring","monk","monkey","monopoly","monster","month","monument","mood","moon","moor","moral","morale","morality","morning","mortality","mortgage","mosaic","mother","motif","motion","motivation","motive","motor","motorist","motorway","mold","mountain","mouse","mouth","move","movement","movie","mud","mug","multimedia","murder","murderer","muscle","museum","mushroom","music","musician","mutation","mystery","myth","nail","name","narrative","nation","nationalism","nationalist","nationality","native","nature","navy","necessity","neck","need","needle","neglect","negligence","negotiation","neighbor","neighborhood","nephew","nerve","nest","net","network","newcomer","news","newspaper","night","nightmare","nitrogen","node","noise","nomination","nonsense","norm","north","nose","note","notebook","notice","notion","noun","novel","novelist","nucleus","nuisance","number","nun","nurse","nursery","nursing","nut","oak","object","objection","objective","obligation","observation","observer","obstacle","occasion","occupation","occurrence","ocean","odd","odor","offense","offender","offer","offering","office","officer","official","offspring","oil","omission","onion","opening","opera","operating","operation","operator","opinion","opponent","opportunity","opposite","opposition","optimism","option","orange","orbit","orchestra","order","organ","organization","organizer","organism","organization","orientation","origin","original","other","outbreak","outcome","outfit","outlet","outline","outlook","output","outset","outside","outsider","oven","over","overall","overview","owl","owner","ownership","oxygen","ozone","pace","pack","package","packet","pad","page","pain","paint","painter","painting","pair","pal","palace","palm","pan","panel","panic","paper","par","parade","paragraph","parallel","parameter","parcel","pardon","parent","parish","park","parking","parliament","part","participant","participation","particle","particular","partner","partnership","party","pass","passage","passenger","passion","passport","past","pasture","patch","patent","path","patience","patient","patrol","patron","pattern","pause","pavement","pay","payment","peace","peak","peasant","pedestrian","peer","pen","penalty","pencil","penny","pension","pensioner","people","pepper","percent","percentage","perception","performance","performer","period","permission","person","personality","personnel","perspective","pest","pet","petition","petrol","phase","phenomenon","philosopher","philosophy","phone","photo","photograph","photographer","photography","phrase","physician","physics","piano","picture","pie","piece","pier","pig","pigeon","pile","pill","pillar","pillow","pilot","pin","pine","pint","pioneer","pipe","pit","pitch","pity","place","placement","plain","plaintiff","plan","plane","planet","planner","planning","plant","plasma","plaster","plastic","plate","platform","play","player","plea","pleasure","plot","pocket","poem","poet","poetry","point","poison","pole","police","policeman","policy","politician","politics","poll","pollution","polymer","polytechnic","pond","pony","pool","pop","pope","popularity","population","port","porter","portfolio","portion","portrait","position","possession","possibility","post","postcard","poster","pot","potato","potential","pottery","pound","poverty","powder","power","practice","practitioner","praise","prayer","precaution","precedent","precision","predator","predecessor","prediction","preference","pregnancy","prejudice","premise","premium","preoccupation","preparation","prescription","presence","present","presentation","preservation","presidency","president","press","pressure","prestige","prevalence","prevention","prey","price","pride","priest","primary","prince","princess","principal","principle","print","printer","printing","priority","prison","prisoner","privacy","privatization","privatization","privilege","prize","probability","probe","problem","procedure","proceed","proceeding","process","processing","procession","processor","produce","producer","product","production","productivity","profession","professional","professor","profile","profit","profitability","program","program","programming","progress","project","projection","promise","promoter","promotion","proof","propaganda","property","proportion","proposal","proposition","proprietor","prosecution","prospect","prosperity","protection","protein","protest","protocol","provider","province","provision","psychologist","psychology","pub","public","publication","publicity","publisher","publishing","pudding","pulse","pump","punch","punishment","pupil","purchase","purchaser","purpose","pursuit","push","qualification","quality","quantity","quantum","quarry","quarter","queen","query","quest","question","questionnaire","queue","quiz","quota","quotation","rabbit","race","racism","rack","radiation","radical","radio","rage","raid","rail","railway","rain","rally","ram","range","rank","rake","rat","rate","rating","ratio","ray","reach","reaction","reactor","reader","reading","realism","reality","realm","rear","reason","reasoning","rebel","rebellion","receipt","receiver","reception","receptor","recession","recipe","recipient","recognition","recommendation","reconstruction","record","recorder","recording","recovery","recreation","recruit","recruitment","red","reduction","redundancy","referee","reference","referendum","referral","reflection","reform","reformer","refuge","refugee","refusal","regard","regime","regiment","region","register","registration","regret","regulation","rehabilitation","rehearsal","reign","rejection","relate","relation","relationship","relative","relaxation","release","relevance","reliance","relief","religion","reluctance","remain","remainder","remark","remedy","reminder","removal","renaissance","renewal","rent","repair","repayment","repetition","replacement","reply","report","reporter","representation","representative","reproduction","republic","republican","reputation","request","requirement","rescue","research","researcher","resentment","reservation","reserve","reservoir","residence","resident","residue","resignation","resistance","resolution","resort","resource","respect","respondent","response","responsibility","rest","restaurant","restoration","restraint","restriction","result","retailer","retention","retirement","retreat","return","revelation","revenge","revenue","reverse","review","revision","revival","revolution","reward","rhetoric","rhythm","rib","ribbon","rice","ride","rider","ridge","rifle","right","ring","riot","rise","risk","ritual","rival","river","road","robbery","rock","rocket","rod","role","roll","romance","roof","room","root","rope","rose","rotation","round","route","routine","row","royalty","rubbish","rug","rugby","ruin","rule","ruler","ruling","rumor","run","runner","rush","sack","sacrifice","safety","sail","sailor","saint","sake","salad","salary","sale","salmon","salon","salt","salvation","sample","sanction","sanctuary","sand","sandwich","satellite","satisfaction","sauce","sausage","saving","saying","scale","scandal","scenario","scene","scent","schedule","scheme","scholar","scholarship","school","science","scientist","scope","score","scrap","scream","screen","screening","screw","script","scrutiny","sculpture","sea","seal","search","season","seat","second","secret","secretary","secretion","section","sector","security","sediment","seed","segment","selection","self","seller","semi-final","seminar","senate","senior","sensation","sense","sensitivity","sentence","sentiment","separation","sequence","sergeant","series","serum","servant","server","service","session","set","setting","settlement","settler","sex","shade","shadow","shaft","shame","shape","share","shareholder","shed","sheep","sheet","shelf","shell","shelter","shield","shift","shilling","ship","shirt","shit","shock","shoe","shop","shopping","shore","short","shortage","shot","shoulder","shout","show","shower","shrub","sick","sickness","side","siege","sigh","sight","sign","signal","signature","significance","silence","silk","silver","similarity","simplicity","sin","singer","single","sink","sir","sister","site","situation","size","skeleton","sketch","ski","skill","skin","skipper","skirt","skull","sky","slab","slave","sleep","sleeve","slice","slide","slip","slogan","slope","slot","smell","smile","smoke","snake","snow","soap","soccer","socialism","socialist","society","sociology","sock","socket","sodium","sofa","software","soil","soldier","solicitor","solidarity","solo","solution","solvent","son","song","sort","soul","sound","soup","source","south","sovereignty","space","speaker","specialist","species","specification","specimen","spectacle","spectator","spectrum","speculation","speech","speed","spell","spelling","spending","sphere","spider","spine","spirit","spite","split","spokesman","sponsor","sponsorship","spoon","sport","spot","spouse","spray","spread","spring","spy","squad","squadron","square","stability","stable","stadium","staff","stage","stair","staircase","stake","stall","stamp","stance","stand","standard","standing","star","start","state","statement","station","statistics","statue","status","statute","stay","steam","steel","stem","step","steward","stick","stimulation","stimulus","stitch","stock","stocking","stomach","stone","stool","stop","storage","store","storm","story","strain","strand","stranger","strap","strategy","straw","stream","street","strength","stress","stretch","strike","striker","string","strip","stroke","structure","struggle","student","studio","study","stuff","style","subject","submission","subscription","subsidiary","subsidy","substance","substitute","suburb","success","succession","successor","sufferer","suffering","sugar","suggestion","suicide","suit","suitcase","suite","sulfur","sum","summary","summer","summit","sun","sunlight","sunshine","superintendent","supermarket","supervision","supervisor","supper","supplement","supplier","supply","support","supporter","surface","surgeon","surgery","surplus","surprise","surrounding","survey","surveyor","survival","survivor","suspect","suspension","suspicion","sweat","sweet","swimming","swing","switch","sword","syllable","symbol","symmetry","sympathy","symptom","syndrome","synthesis","system","t-shirt","table","tablet","tactic","tail","takeover","tale","talent","talk","talking","tank","tap","tape","target","tariff","task","taste","tax","taxation","taxi","taxpayer","tea","teacher","teaching","team","tear","technique","technology","teenager","telecommunication","telephone","television","temper","temperature","temple","temptation","tenant","tendency","tennis","tension","tent","term","terminal","terms","terrace","territory","terror","terrorist","test","testament","testing","text","textbook","textile","texture","thanks","theater","theft","theme","theology","theorist","theory","therapist","therapy","thesis","thief","thigh","thing","thinking","thought","thread","threat","threshold","throat","throne","thrust","thumb","ticket","tide","tie","tiger","tile","timber","time","timetable","timing","tin","tip","tissue","title","toast","tobacco","toe","toilet","toll","tomato","ton","tone","tongue","ton","tool","tooth","top","topic","torch","total","touch","tour","tourism","tourist","tournament","towel","tower","town","toy","trace","track","tract","trade","trader","trading","tradition","traffic","tragedy","trail","train","trainee","trainer","training","trait","transaction","transcription","transfer","transformation","transition","translation","transmission","transport","trap","travel","traveler","tray","treasure","treasurer","treasury","treat","treatment","treaty","tree","trench","trend","trial","triangle","tribe","tribunal","tribute","trick","trip","triumph","trolley","troop","trophy","trouble","trouser","truck","trunk","trust","trustee","truth","try","tube","tumor","tune","tunnel","turkey","turn","turnover","tutor","twin","twist","type","tire","ulcer","umbrella","uncertainty","uncle","understanding","undertaking","unemployment","uniform","union","unionist","unit","unity","universe","university","unrest","upstairs","urge","urgency","urine","usage","use","user","utility","utterance","vacuum","validity","valley","valuation","value","valve","van","variable","variant","variation","variety","vat","vector","vegetable","vegetation","vehicle","vein","velocity","velvet","vendor","venture","venue","verb","verdict","verse","version","vessel","veteran","vicar","vice-president","victim","victory","video","view","viewer","viewpoint","villa","village","villager","violation","violence","virgin","virtue","virus","vision","visit","visitor","vitamin","vocabulary","voice","voltage","volume","volunteer","vote","voter","voucher","voyage","wage","wagon","waist","waiter","waiting","wake","walk","walker","wall","want","war","ward","wardrobe","warehouse","warmth","warning","warrant","warranty","warrior","wartime","wash","washing","waste","watch","water","wave","way","weakness","wealth","weapon","weather","wedding","weed","week","weekend","weight","welcome","welfare","well","west","whale","wheat","wheel","while","whip","whisky","whisper","white","whole","wicket","widow","width","wife","wildlife","will","willingness","win","wind","window","wine","wing","winner","winter","wire","wisdom","wish","wit","witch","withdrawal","witness","wolf","woman","wonder","wood","woodland","wool","word","wording","work","worker","workforce","working","workplace","works","workshop","workstation","world","worm","worry","worship","worth","wound","wrist","writer","writing","wrong","x-ray","yacht","yard","yarn","year","yield","youngster","youth","zone"];
        
        var targetAdj = Math.round(Math.random() * adj.length);
        var targetNoun = Math.round(Math.random() * noun.length);
        return adj[targetAdj] + "-" + noun[targetNoun];
    }
}

function isScrolledIntoView(elem){
    var $elem = $(elem);
    var $window = $(window);

    var docViewTop = $window.scrollTop();
    var docViewBottom = docViewTop + $window.height();

    var elemTop = $elem.offset().top;
    var elemBottom = elemTop + $elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}


// Define your custom moment function
const originalMoment = moment;
function xmoment() {
    if  (arguments && arguments[0] && !isNaN(parseInt(arguments[0]))) {
        var argument = parseInt(arguments[0]);

        // Convert to milliseconds
        if (typeof argument === 'number' && argument < 1e12) {
            argument = argument * 1000;
        }
        arguments[0] = argument;
    }
  const result = originalMoment.apply(this, arguments);
  return result;
}