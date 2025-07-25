document.width = window.innerWidth;
var columns = {
    row: [
        {
            name: "Skivomslag",
            type: "img",
            path: "basic_information.thumb",
            filterType: "none",
        }, {
            name: "Betyg",
            type: "number",
            path: "rating",
            filterType: "select",
            lastSearch: "",
            input: "",
        }, {
            name: "Artist",
            type: "object",
            path: "basic_information.artists",
            objectPath: "name",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "Includes"
        }, {
            name: "Titel",
            type: "string",
            path: "basic_information.title",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "StartsWith"
        }, {
            name: "Pressningsår",
            type: "number",
            path: "basic_information.year",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "StartsWith"
        }, {
            name: "Mapp",
            type: "number",
            path: "folder_id",
            filterType: "select",
            lastSearch: "",
            input: "",
        }, {
            name: "Genre",
            type: "array",
            path: "basic_information.genres",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "Includes"
        }, {
            name: "Stil",
            type: "array",
            path: "basic_information.styles",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "Includes"
        }, {
            name: "Label",
            type: "object",
            path: "basic_information.labels",
            objectPath: "name",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "Includes"
        }, {
            name: "Datum tillagd",
            type: "string",
            path: "date_added",
            filterType: "array",
            lastSearch: "",
            input: "",
            filterAlgorithm: "Includes"
        }
    ]
};

var table;

var customNotes = { fields: [] };;
var value;
var folders;
var collection = [];

var username;
var token;


window.addEventListener("load", function () {
    loadSave();
});

function save() {
    localStorage.setItem("collection", JSON.stringify(collection));
    localStorage.setItem("folders", JSON.stringify(folders));
    localStorage.setItem("notes", JSON.stringify(customNotes));
    localStorage.setItem("worth", JSON.stringify(value));
};
function loadSave() {

    if (JSON.parse(localStorage.getItem("load"))) {
        localStorage.setItem("load", "false");
        username = (localStorage.getItem("username"));
        token = (localStorage.getItem("token"));
        reload();
    } else {
        collection = JSON.parse(localStorage.getItem("collection"));
        folders = JSON.parse(localStorage.getItem("folders"));
        customNotes = JSON.parse(localStorage.getItem("notes"));
        value = JSON.parse(localStorage.getItem("worth"));

        if (collection === null || folders === null || customNotes === null || value === null) {
            location.href = './login.html';
            collection = [];
            customNotes = { fields: [] };
            folders = [];
        } else {
            reloadTable();
        };
    }
};

function httpRequest(url, callback) {

    const http = new XMLHttpRequest();
    http.open("GET", url);

    http.send();
    http.onreadystatechange = (e) => {
        if (http.readyState === 4) {
            if (e.currentTarget.status !== 200) {
                alert("Username, token eller nåt annat skit är fel?!");
                location.href = './login.html';
            } else {
                callback(JSON.parse(http.responseText));
            };
        };

    };

};

function requestHttp(httpCallback) {
    httpRequest("https://api.discogs.com/users/" + username + "/collection/fields?token=" + token, function (c) {
        customNotes = c;
        customNotes.fields.forEach(note => {
            note.lastSearch = "";
        });
        httpRequest("https://api.discogs.com/users/" + username + "/collection/value?token=" + token, function (c) {
            value = c;

            value.avg = value.median.replace('SEK', '');
            value.avg = value.avg.split(".")[0].replace(",", ".");
            value.avg = value.avg.replace('.', '');
            value.avg = JSON.parse(value.avg);
            httpRequest("https://api.discogs.com/users/" + username + "/collection/folders?token=" + token, function (callbackThing) {
                folders = callbackThing.folders;

                let tmp = 0;
                for (i = 0; i < Math.ceil(folders[0].count / 100); i++) {

                    httpRequest("https://api.discogs.com/users/" + username + `/collection/folders/0/releases?page=${i + 1}&per_page=100&token=` + token, function (callback) {
                        tmp++;
                        let newColection = collection.concat(callback.releases);
                        collection = newColection;

                        if (tmp === Math.ceil(folders[0].count / 100)) {
                            httpCallback();

                        };
                    });
                };
            });
        });
    });
};

function startLoading() {
    document.getElementById("loading").style.width = "50%";
    columns.row.forEach(column => {
        try { column.lastSearch = document.getElementById(column.name).value } catch { };
    });
    customNotes.fields.forEach(note => {
        try { note.lastSearch = document.getElementById(note.name).value } catch { };
    });
    if (table !== undefined) {
        document.getElementsByTagName('body')[0].removeChild(table);
        table = undefined;
    };
};

function stopLoading() {
    document.getElementById("loading").style.width = "0%";
};

function reload() {
    startLoading();
    customNotes = { fields: [] };
    value = undefined;
    folders = undefined;
    collection = [];
    requestHttp(function () {
        value.avg = value.avg / collection.length;
        collection.forEach(release => {
            release.basic_information.labels = reduce(release.basic_information.labels, "name");
            collection.forEach(release => {
                if (release.notes == undefined) {
                    release.notes = [{ value: 0 }];
                };
            });
        });
        reloadTable();
    });
};

function reloadTable() {
    columns.row.forEach(column => {
        try { column.lastSearch = document.getElementById(column.name).value } catch { };
    });
    customNotes.fields.forEach(note => {
        try { note.lastSearch = document.getElementById(note.name).value } catch { };
    });
    if (table !== undefined) {
        document.getElementsByTagName('body')[0].removeChild(table);
        table = undefined;
    };

    table = document.createElement("table");

    createFirstRows();
    createAllRows();

    document.getElementsByTagName('body')[0].appendChild(table);
    table.id = "table";
    table.style.width = window.innerWidth;


    document.getElementById("loaded").innerText = table.rows.length - 2 + " / " + collection.length + '\u00a0'.repeat(10) + "Min:" + value.minimum.split(".")[0] + '\u00a0'.repeat(10) + "Med:" + value.median.split(".")[0] + '\u00a0'.repeat(10) + "Max:" + value.maximum.split(".")[0] + '\u00a0'.repeat(10) + "Avg:SEK" + value.avg.toFixed(3);

    save();
    stopLoading();
}

function createFirstRows() {
    columns.rows = [];
    columns.rows.push(document.createElement("tr"));
    columns.rows.push(document.createElement("tr"));
    columns.rows[0].id = "firstrows";
    columns.rows[1].id = "firstrows";

    columns.row.forEach(column => {
        column.rows = [];
        let thisThing3 = document.createElement("td");
        let thisThing = document.createElement("a");
        if (column.filterType !== "none") {
            thisThing.setAttribute("onclick", `sortCollection('${column.path}','${column.type}','${column.objectPath}')`);
        }
        if (column.name == "Skivomslag") {
            let tmpbutton = document.createElement("button")
            tmpbutton.innerText = "Ladda om"
            tmpbutton.setAttribute("onclick", `location.href = './login.html';`);

            thisThing.appendChild(tmpbutton);
        } else {
            column.rows.push(thisThing);
            thisThing.innerText = column.name;
        }

        thisThing.setAttribute("href", "#");
        thisThing3.appendChild(thisThing);
        columns.rows[0].appendChild(thisThing3);


        let thisThing2 = document.createElement("td");
        column.rows.push(thisThing2);
        if (column.filterType !== "none") {
            if (column.filterType === "text" || column.filterType === "array") {
                column.input = document.createElement("input");
                column.input.setAttribute("type", "text");

            } else {
                column.input = document.createElement("select");
                if (column.name === "Mapp") {
                    if (column.lastSearch === '') {
                        column.lastSearch = '0';
                    };
                    folders.forEach(folder => {
                        folder.option = document.createElement("option");
                        folder.option.value = folder.id;
                        folder.option.text = folder.name + "(" + folder.count + ")";
                        column.input.appendChild(folder.option);
                    });
                } else if (column.name === "Betyg") {
                    for (i = 0; i < 7; i++) {
                        let ranking = document.createElement("option");
                        ranking.value = i - 1;
                        let sting = "";

                        for (let y = 1; y < i; y++) {
                            sting += "★";
                        }
                        ranking.text = sting;

                        if (ranking.value == -1) { ranking.value = ''; ranking.text = "Alla" };
                        column.input.appendChild(ranking);
                    };
                };
            };
            column.input.setAttribute("id", column.name);
            column.input.setAttribute("onchange", "reloadTable()");
            column.input.value = column.lastSearch;
            thisThing2.appendChild(column.input);
        } else {
            column.input = document.createElement("button");
            column.input.innerText = "Rensa filter";
            column.input.setAttribute("onclick", "resetFilters()");

            thisThing2.appendChild(column.input);
        };
        columns.rows[1].appendChild(thisThing2);

    });
    for (let i = 0; i < customNotes.fields.length; i++) {
        let thisThing3 = document.createElement("td");
        let thisThing = document.createElement("a");
        thisThing.innerText = customNotes.fields[i].name;
        thisThing.setAttribute("href", "#");
        thisThing.setAttribute("onclick", `sortCollection('notes[${i}].value','string','')`);
        thisThing3.appendChild(thisThing)

        let thisThing2 = document.createElement("td");
        customNotes.fields[i].input = document.createElement("input");
        customNotes.fields[i].input.setAttribute("type", "text");
        customNotes.fields[i].input.setAttribute("id", customNotes.fields[i].name);
        customNotes.fields[i].input.setAttribute("onchange", "reloadTable()");
        customNotes.fields[i].input.value = customNotes.fields[i].lastSearch;
        thisThing2.appendChild(customNotes.fields[i].input);

        columns.rows[1].appendChild(thisThing2);

        columns.rows[0].appendChild(thisThing3);
    };
    table.appendChild(columns.rows[0]);
    table.appendChild(columns.rows[1]);
};

function createAllRows() {
    for (i = 0; i < collection.length; i++) {
        collection[i].notOk = false;
        try {
            columns.row.forEach(column => {
                if (column.filterType === "text") {
                    if (column.filterAlgorithm == "Includes") {
                        if (JSON.stringify(deep_value(collection[i], column.path)).toLowerCase().includes(column.input.value.toLowerCase())) {
                        } else {
                            collection[i].notOk = true;
                        };
                    } else {
                        deep_value(collection[i], column.path);
                        if (JSON.stringify(deep_value(collection[i], column.path)).replace(/['"]+/g, '').toLowerCase().startsWith(column.input.value.toLowerCase()) === true) {
                        } else {
                            collection[i].notOk = true;
                        };
                    };
                } else if (column.filterType === "select") {
                    if (column.input.value == deep_value(collection[i], column.path)) { } else {
                        if (column.name === "Betyg" && column.input.value == '') { } else {
                            if (column.name === "Mapp" && column.input.value == '0') { } else {
                                collection[i].notOk = true;
                            };
                        };
                    };
                } else if (column.filterType === "array") {
                    let tmp = true
                    column.input.value.split(",").forEach(input1 => {
                        if (JSON.stringify(deep_value(collection[i], column.path)).toLowerCase().includes(input1.toLowerCase()) && input1.toLowerCase() !== "") {
                            tmp = false;
                        }
                    })
                    if (column.input.value == "") {
                        tmp = false;
                    }
                    if (tmp == true) {
                        collection[i].notOk = true;
                    }
                };
            });
            customNotes.fields.forEach(note => {
                let tmp = true
                note.input.value.split(",").forEach(input1 => {
                    if (collection[i].notes[note.id - 1].value.toLowerCase().includes(input1.toLowerCase()) && input1.toLowerCase() !== "") {
                        tmp = false;
                    }
                })
                if (note.input.value == "") {
                    tmp = false;
                }
                if (tmp == true) {
                    collection[i].notOk = true;
                }

            });
        } catch (e) { };
        if (collection[i].notOk != true) {
            columns.rows.push(document.createElement("tr"));
            columns.rows[columns.rows.length - 1].id = i;
            columns.row.forEach(column => {

                let thisThing = document.createElement("a");
                let thisThing2 = document.createElement("td");
                column.rows.push(thisThing);
                if (column.type === "string" || column.type === "number" || column.type === "img") {
                    if (column.name === "Betyg") {
                        for (let y = 0; y < collection[i].rating; y++) {
                            thisThing.innerText += "★";
                        };
                    } else if (column.name === "Datum tillagd") {
                        thisThing.innerText = deep_value(collection[i], column.path).split("T")[0];
                        thisThing.setAttribute("href", "#");
                        thisThing.setAttribute("onclick", 'document.getElementById("' + column.name + '").value = this.innerText;reloadTable()');

                    } else if (column.name === "Mapp") {
                        folders.forEach(folder => {
                            if (folder.id === deep_value(collection[i], column.path)) {
                                thisThing.innerText = folder.name;
                            };
                        });
                        thisThing.setAttribute("href", "#");
                        thisThing.setAttribute("onclick", 'document.getElementById("' + column.name + '").value = ' + deep_value(collection[i], column.path) + ';reloadTable()');

                    } else if (column.name === "Skivomslag") {
                        let image = document.createElement("img");
                        image.src = "../images/loading.gif"

                        image.style.height = '100px';
                        image.style.width = '100px';
                        image.id = "img";
                        image.className = "image";
                        image.setAttribute("onclick", `window.open("https://www.discogs.com/master/${collection[i].basic_information.master_id}", '_blank')`);

                        thisThing.appendChild(image);
                    } else if (column.name === "Titel") {
                        thisThing.innerText = deep_value(collection[i], column.path);
                        thisThing.setAttribute("href", "https://www.discogs.com/release/" + collection[i].basic_information.id);
                        thisThing.setAttribute("target", "_blank");
                    } else {
                        thisThing.setAttribute("href", "#");
                        thisThing.setAttribute("onclick", 'document.getElementById("' + column.name + '").value = this.innerText;reloadTable()');
                        thisThing.innerText = deep_value(collection[i], column.path);
                    };
                };
                if (column.type === "array") {
                    deep_value(collection[i], column.path).forEach(function (text, idx) {
                        thisThing2.innerHTML += text.link("#");

                        thisThing2.childNodes.forEach(links => {
                            if (links.nodeName === "A") {
                                links.setAttribute("onclick", 'document.getElementById("' + column.name + '").value += "," + this.innerText;reloadTable()');
                            };
                        });

                        if (idx !== deep_value(collection[i], column.path).length - 1) {
                            thisThing2.innerHTML += ", ";
                        };
                    });
                };
                if (column.type === "object") {
                    deep_value(collection[i], column.path).forEach(function (text, idx) {
                        if (column.name === "Artist") {
                            thisThing2.innerHTML += text.name.link("https://www.discogs.com/artist/" + text.id);
                            thisThing2.childNodes.forEach(links => {
                                if (links.nodeName === "A") {
                                    links.setAttribute("target", "_blank");
                                };
                            });
                        } else {
                            thisThing2.innerHTML += text.name.link("#");
                            thisThing2.childNodes.forEach(links => {
                                if (links.nodeName === "A") {
                                    links.setAttribute("onclick", 'document.getElementById("' + column.name + '").value = this.innerText;reloadTable()');
                                };
                            });
                        }
                        if (idx !== deep_value(collection[i], column.path).length - 1) {
                            thisThing2.innerHTML += ", ";
                        };
                    });
                };
                thisThing2.appendChild(thisThing);
                columns.rows[columns.rows.length - 1].appendChild(thisThing2);
                table.appendChild(columns.rows[columns.rows.length - 1]);
            });
            for (let g = 0; g < customNotes.fields.length; g++) {
                try {
                    if (collection[i].notes[g].field_id - 1 == g) {
                    } else {
                        collection[i].notes.insert(g, { value: "-", field_id: g + 1 });
                    }
                } catch { };
                let thisThing = document.createElement("td");
                try {
                    if (collection[i].notes[g].field_id - 1 === g) {
                        thisThing.innerText = collection[i].notes[g].value;
                    };
                } catch (e) { };

                columns.rows[columns.rows.length - 1].appendChild(thisThing);
                table.appendChild(columns.rows[columns.rows.length - 1]);
            };
        };
    };
    latestLoadId++;
    //loadImage();


    setInterval(() => {
        Array.from(document.getElementsByClassName("image")).forEach((element, index) => {
            if (isElementInViewport(element) && element.src.endsWith("loading.gif")) {
                loadImage(index + 1, latestLoadId);
            }
        })
    }, 100)


};

function isElementInViewport(el) {

    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= -window.innerHeight / 10 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight * 1.1 || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}


function resetFilters() {
    startLoading();
    columns.row.forEach(column => {
        try {
            column.lastSearch = "";
            column.input.value = "";
            reloadTable();
        } catch { };
    });
};

function deep_value(obj, path) {
    for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
        obj = obj[path[i]];
    };
    return obj;
};

Array.prototype.insert = function (index, ...items) {
    this.splice(index, 0, ...items);
};

function compareValues(order, type, path) {

    return function innerSort(a, b) {


        let comparison = 0;
        if (type === "string" || type === "object") {
            var bandA;
            var bandB;
            try {
                bandA = (Object.byString(a, path)).toUpperCase();
                bandB = (Object.byString(b, path)).toUpperCase();
            } catch {
                bandA = (Object.byString(a, path))
                bandB = (Object.byString(b, path))
            }



            if (bandA > bandB) {
                comparison = 1;
            } else if (bandA < bandB) {
                comparison = -1;
            };
        } else {
            const bandA = Object.byString(a, path);
            const bandB = Object.byString(b, path);
            if (bandA > bandB) {
                comparison = 1;
            } else if (bandA < bandB) {
                comparison = -1;
            };
        };

        return comparison * order;
    };
};

var lastPath = "";
var sortOrder = 1;
function sortCollection(path, type, objectpath) {

    sortOrder *= -1;

    collection.sort(compareValues(sortOrder, type, path, objectpath));
    reloadTable();
};

Object.byString = function (o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1');
    s = s.replace(/^\./, '');
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        };
    };
    return o;
};

var reduce = function (arr, prop) {
    var result = [],
        filterVal,
        filters,
        filterByVal = function (n) {
            if (n[prop] === filterVal) return true;
        };
    for (var i = 0; i < arr.length; i++) {
        filterVal = arr[i][prop];
        filters = result.filter(filterByVal);
        if (filters.length === 0) result.push(arr[i]);
    }

    return result;
};

var latestLoadId = 0;

function loadImage(row = 1, loadId = latestLoadId) {
    if (row >= columns.rows.length - 1 || loadId !== latestLoadId) return;
    let column = columns.row[0];

    let img = column.rows[row].children[0];

    let id = columns.rows[row + 1].id;
    let path = deep_value(collection[JSON.parse(id)], column.path) + "?token=" + token;

    img.src = path;
    /*img.onload = () => {
        setTimeout(() => {
            loadImage(row + 1, loadId);
        }, 10);
    }*/
    img.onerror = () => {
        img.src = "../images/loading.gif"
        setTimeout(() => {
            loadImage(row, loadId);
        }, 1000);
    }
}   