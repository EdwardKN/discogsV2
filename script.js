document.width = window.innerWidth;
var columns = {
    row:[
        {
            name:"Skivomslag",
            type:"img",
            path:"basic_information.cover_image",
            filterType:"none",
        },{
            name:"Betyg",
            type:"number",
            path:"rating",
            filterType:"select",
            lastSearch:"",
            input:"",
        },{
            name:"Titel",
            type:"string",
            path:"basic_information.title",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"StartsWith"
        },{  
            name:"Artist",
            type:"object",
            path:"basic_information.artists",
            objectPath:"name",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"Includes"
        },{
            name:"År",
            type:"number",
            path:"basic_information.year",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"StartsWith"
        },{
            name:"Mapp",
            type:"number",
            path:"folder_id",
            filterType:"select",
            lastSearch:"",
            input:"",
        },{
            name:"Genre",
            type:"string",
            path:"basic_information.genres",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"Includes"
        },{
            name:"Label",
            type:"object",
            path:"basic_information.labels",
            objectPath:"name",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"Includes"
        },{
            name:"Datum tillagd",
            type:"string",
            path:"date_added",
            filterType:"text",
            lastSearch:"",
            input:"",
            filterAlgorithm:"Includes"
        }
    ]
}

var table;

var customNotes = {fields:[]};;
var value;
var folders;
var collection = [];


window.addEventListener("load",function(){
    if(localStorage.getItem("collection") == 'undefined'){
        load();
    }else{
        loadSave();
    }
});

function save(){
    localStorage.setItem("collection", JSON.stringify(collection));
    localStorage.setItem("folders", JSON.stringify(folders));
    localStorage.setItem("username",JSON.stringify(document.getElementById("username").value))
    localStorage.setItem("token",JSON.stringify(document.getElementById("token").value))
    localStorage.setItem("notes",JSON.stringify(customNotes))
    localStorage.setItem("worth",JSON.stringify(value))
}
function loadSave(){

    collection = JSON.parse(localStorage.getItem("collection"));
    folders = JSON.parse(localStorage.getItem("folders"));
    document.getElementById("username").value = JSON.parse(localStorage.getItem("username"));
    document.getElementById("token").value = JSON.parse(localStorage.getItem("token"));
    customNotes = JSON.parse(localStorage.getItem("notes"));

    if(collection === null){
        collection = [];
        customNotes = {fields:[]};
        folders = [];
    }


    reloadTable();

}

function httpRequest(url, callback, headers){

    const http = new XMLHttpRequest();   
    http.open("GET", url);

    /*headers.forEach(header => {
        http.setRequestHeader(header.key, header.value);
    })*/

    http.send();
    http.onreadystatechange=(e)=>{

        if(http.readyState=== 4){

            if(e.currentTarget.status !== 200){
                alert("Username, token eller nåt annat skit är fel?!")
                //window.location.reload(true)
            }else{
                callback(JSON.parse(http.responseText))
            }
        }
        
    }
    
}
function requestHttp(httpCallback){
    httpRequest("https://api.discogs.com/users/"+document.getElementById('username').value+"/collection/fields?token="+document.getElementById('token').value,function(c){
        customNotes = c;  
        customNotes.fields.forEach(note =>{
            note.lastSearch = "";
        })
        httpRequest("https://api.discogs.com/users/"+document.getElementById('username').value+"/collection/value?token="+document.getElementById('token').value,function(c){
            value = c;
            httpRequest("https://api.discogs.com/users/"+document.getElementById('username').value+"/collection/folders?token="+document.getElementById('token').value,function(callbackThing){
                folders = callbackThing.folders;

                let tmp = 0;
                for(i = 0; i<  Math.ceil(folders[0].count/100);i++){

                    httpRequest("https://api.discogs.com/users/"+document.getElementById('username').value+`/collection/folders/0/releases?page=${i+1}&per_page=100&token=`+document.getElementById('token').value,function(callback){
                        tmp++;
                        let newColection = collection.concat(callback.releases);
                        collection = newColection;

                        if(tmp === Math.ceil(folders[0].count/100)){
                            httpCallback();
                            
                        }
                    })
                }
            })
        })
    })

}

function reload(){
    customNotes = {fields:[]};
    value = undefined;
    folders = undefined;
    collection = [];
    requestHttp(function(){
        collection.forEach(release => {
            release.basic_information.labels = reduce(release.basic_information.labels,"name")
            
        })


        reloadTable();
    });
}
function reloadTable(){
    columns.row.forEach(column => {
        try{column.lastSearch = document.getElementById(column.name).value}catch{};
    })
    customNotes.fields.forEach(note => {
        try{note.lastSearch = document.getElementById(note.name).value}catch{};
    })
    if(table !== undefined){
        document.getElementsByTagName('body')[0].removeChild(table);
        table = undefined;
    }
    
    table = document.createElement("table");

    createFirstRows();
    createAllRows();

    document.getElementsByTagName('body')[0].appendChild(table);
    table.id = "table"
    table.style.width = window.innerWidth;

    save()
}

function createFirstRows(){
    columns.rows = [];
    columns.rows.push(document.createElement("tr"));
    columns.rows.push(document.createElement("tr"));

    columns.row.forEach(column => {
        column.rows = [];
        let thisThing = document.createElement("td");
        thisThing.setAttribute("onclick",`sortCollection('${column.path}','${column.type}','${column.objectPath}')`)

        column.rows.push(thisThing);
        thisThing.innerText = column.name;
        columns.rows[0].appendChild(thisThing)

        let thisThing2 = document.createElement("td");
        column.rows.push(thisThing2);
        if(column.filterType !== "none"){
            if(column.filterType === "text"){
                column.input = document.createElement("input");
                column.input.setAttribute("type","text")
            }else{
                column.input = document.createElement("select");
                if(column.name === "Mapp"){
                    if(column.lastSearch === ''){
                        column.lastSearch = '0'
                    }
                    folders.forEach(folder => {
                        folder.option = document.createElement("option");
                        folder.option.value = folder.id;
                        folder.option.text = folder.name + "(" + folder.count + ")";
                        column.input.appendChild(folder.option);
                    })

                }else if(column.name === "Betyg"){
                    for(i=0;i<7;i++){
                        let ranking = document.createElement("option")
                        ranking.value = i-1;
                        let sting = "";

                        for(let y = 1;y< i;y++){
                            sting += "★"; 
                        }
                        ranking.text = sting;

                        if(ranking.value == -1){ranking.value = '';ranking.text = "Alla"}
                        column.input.appendChild(ranking);
    }
                }
            }
            column.input.setAttribute("id",column.name)
            column.input.setAttribute("onchange","reloadTable()")
            column.input.value = column.lastSearch;
            thisThing2.appendChild(column.input);
        }
        columns.rows[1].appendChild(thisThing2)

    })
    for(let i = 0; i< customNotes.fields.length; i++){

        let thisThing = document.createElement("td");
        thisThing.innerText = customNotes.fields[i].name;
        thisThing.setAttribute("onclick",`sortCollection('notes[${i}].value','string','')`)

        let thisThing2 = document.createElement("td");
        customNotes.fields[i].input = document.createElement("input");
        customNotes.fields[i].input.setAttribute("type","text")
        customNotes.fields[i].input.setAttribute("id",customNotes.fields[i].name)
        customNotes.fields[i].input.setAttribute("onchange","reloadTable()")
        customNotes.fields[i].input.value = customNotes.fields[i].lastSearch;
        thisThing2.appendChild(customNotes.fields[i].input);

        columns.rows[1].appendChild(thisThing2)

        columns.rows[0].appendChild(thisThing)
    }

    
    

    table.appendChild(columns.rows[0]);
    table.appendChild(columns.rows[1]);
}

function createAllRows(){
    for(i = 0; i < collection.length;i++){
        collection[i].notOk = false;
        try{
        columns.row.forEach(column => {
            if(column.filterType === "text"){
                if(column.filterAlgorithm == "Includes"){
                    if(JSON.stringify(deep_value(collection[i],column.path)).toLowerCase().includes(column.input.value.toLowerCase())){
                    }else{
                        collection[i].notOk = true;
                    }
                }else{
                    if(JSON.stringify(deep_value(collection[i],column.path)).toLowerCase().startsWith(column.input.value.toLowerCase())){
                    }else{
                        collection[i].notOk = true;
                    }
                }
                
            }else if(column.filterType === "select"){
                if(column.input.value == deep_value(collection[i],column.path)){ 

                }else{
                    if(column.name === "Betyg" && column.input.value == ''){
                    }else{
                        if(column.name === "Mapp" && column.input.value == '0'){
                            
                        }else{
                            collection[i].notOk = true;

                        }
                    }
                }
            }
        })
        customNotes.fields.forEach(note => {
            if((collection[i].notes[note.id-1].value.toLowerCase().startsWith(note.input.value.toLowerCase()))){
            }else{
                collection[i].notOk = true;
            }
        })
        }catch(e){console.log(e)};   
        if(collection[i].notOk != true){
            columns.rows.push(document.createElement("tr"));
            columns.row.forEach(column => {

                
                let thisThing = document.createElement("td");
                column.rows.push(thisThing);
                if(column.type === "string" || column.type === "number"){
                    if(column.name === "Betyg"){
                        for(let y=0; y<collection[i].rating;y++){
                            thisThing.innerText += "★"; 
                        }
                    }else{
                        thisThing.innerText = deep_value(collection[i],column.path);
                    }
                }
                if(column.type === "img"){
                    let image = document.createElement("img")
                    image.src = deep_value(collection[i],column.path);
                    image.style.height = '100px';
                    image.style.width = '100px';
                    thisThing.appendChild(image);
                }
                if(column.type === "object"){
                    let tmpText = "";
                    deep_value(collection[i],column.path).forEach(text => {
                        tmpText += text.name + ",";
                    })

                    thisThing.innerText = tmpText;
                }
                columns.rows[columns.rows.length-1].appendChild(thisThing)
                table.appendChild(columns.rows[columns.rows.length-1]);
                
            })
            for(let g = 0; g<customNotes.fields.length;g++){

                try{
                    if(collection[i].notes[g].field_id-1 == g){
                    }else{
                        collection[i].notes.insert(g,{value:"-",field_id:g+1})
                    }
                }catch{}
                
                let thisThing = document.createElement("td");
                try{
                    if(collection[i].notes[g].field_id - 1 === g){
                        thisThing.innerText = collection[i].notes[g].value;
                    }else{
                    }
                }catch(e){}
                

                columns.rows[columns.rows.length-1].appendChild(thisThing)
                table.appendChild(columns.rows[columns.rows.length-1]);
            }
        }
    }
}

function deep_value(obj, path){
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
};

Array.prototype.insert = function ( index, ...items ) {
    this.splice( index, 0, ...items );
};

function compareValues(order, type, path) {

    return function innerSort(a, b) {
        
        
        let comparison = 0;
        if(type === "string" || type === "object"){
            var bandA;
            var bandB;

                bandA =  Object.byString(a, path).toUpperCase();
                bandB = Object.byString(b, path).toUpperCase();
            
            
            if (bandA > bandB) {
            comparison = 1;
            } else if (bandA < bandB) {
            comparison = -1;
            }
        }else{
            const bandA =  Object.byString(a, path)
            const bandB = Object.byString(b, path)
            
            if (bandA > bandB) {
            comparison = 1;
            } else if (bandA < bandB) {
            comparison = -1;
            }
        }

        return comparison * order;
    }
    }

  var lastPath = "";
  var sortOrder = 1;
  function sortCollection(path,type,objectpath){
    
    if(lastPath === path){
        sortOrder *= -1;
    }else{
        lastPath = path;
        if(type === "string"){
            sortOrder = 1;
        }else{
            sortOrder = -1;
        }
    }
    if(type === "object"){
        path = path+"[0]."+objectpath;
    }

    if(path === "basic_information.genres"){
        path =  "basic_information.genres[0]"
    }

    collection.sort(compareValues(sortOrder,type,path,objectpath));
    reloadTable()
  }
  Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1');
    s = s.replace(/^\./, '');           
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

var reduce = function(arr, prop) {
    var result = [],
        filterVal,
        filters,
        filterByVal = function(n) {
            if (n[prop] === filterVal) return true;
        };
    for (var i = 0; i < arr.length; i++) {
        filterVal = arr[i][prop];
        filters   = result.filter(filterByVal);
        if (filters.length === 0) result.push(arr[i]);
    }
    console.log(result)

    return result;

    
  };