class WaterfallClass {
    
    constructor(options = {}) {
        this.tasks = [];
        this.options = options;
        this.variables = {};
    }

    setOptions = (options) => {
        this.options = options;
        return this;
    }

    setVariables = (variables) => {
        this.variables = variables;
        return this;
    }
    
    setTasks(tasks) {
        this.tasks = tasks.map((task, index) => {

            // Validate each task
            if (!this.validateTask(task)) {
                console.error('Invalid task at index: ' + index);
                return null;
            }
            else {
                return {
                    "id": this.generateUUID().split("-")[0],
                    "task": task 
                }
            }
        });
        
        // Delete null tasks
        this.tasks = this.tasks.filter(task => task !== null);

        return this.tasks;
    }

    addTask(task) {
        if (!this.validateTask(task)) {
            console.error('Invalid task. Please provide functions.');
            return false;
        }
        else {
            this.tasks.push({
                "id": this.generateUUID().split("-")[0],
                "task": task 
            });
            return true;
        }
    }

    deleteTask(id) {
        // Check if a task with the specified ID exists
        if (!this.tasks.some(task => task.id === id)) {
            console.log(`No task found with ID ${id}`);
            return false;
        }
        else {
            this.tasks = this.tasks.filter(task => task.id!== id);
            return true;
        }
    }

    executeTasks() {

        return new Promise ((resolve, reject) => {

            var that = this;
            const executeTask = async (index) => {
                if (!this.tasks[index]) return null;
                var returned = this.tasks[index].task(that.variables);
                if (returned && returned.then && typeof returned.then == "function") {
                    returned
                        .then (function (variables) {
                            executeTask(index + 1);
                            if (index + 1 == that.tasks.length) resolve (that.variables);
                        })
                        .catch (function (variables) {
                            executeTask(index + 1);
                            if (index + 1 == that.tasks.length) resolve (that.variables);
                        });
                }
                else {
                    executeTask(index + 1);
                    if (index + 1 == that.tasks.length) resolve (that.variables);
                }

                return that.variables;
            };

            // Start executing tasks from the first index
            executeTask(0);
        });
    }

    generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    validateTask = (task) => {
        return typeof task === 'function';
    }
}

function Waterfall(options) {
    return new WaterfallClass(options);
}


/*
    ! Usage example
    ----------------

    wf = Waterfall();
    wf.setVariables({"test": "Apple"});

    wf.setTasks([
        (variables) => {
            console.log("H 1");
            variables["stage-1"] = "executed";
        },
        (variables) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log("H 2");
                    variables["stage-2"] = "executed";
                    resolve();
                },  2000);
            });
        },
        (variables) => {
            console.log("H 3");
            variables["stage-3"] = "executed";
        },
    ]);

    wf.executeTasks().then((data) => {
        console.log("All tasks executed");
        console.log(data);
    });

*/