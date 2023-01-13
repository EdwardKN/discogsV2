var columns = {
    row:[
        {
            name:"Skivomslag",
            type:"img",
            path:"basic_information.cover_image"
        },{
            name:"Betyg",
            type:"text",
            path:"rating"
        },{
            name:"Titel",
            type:"text",
            path:"basic_information.title"
        },{  
            name:"Artist",
            type:"object",
            path:"basic_information.artists",
            objectPath:"name"
        },{
            name:"År",
            type:"text",
            path:"basic_information.year"
        },{
            name:"Mapp",
            type:"text",
            path:"folder_id"
        },{
            name:"Genre",
            type:"text",
            path:"basic_information.genres"
        },{
            name:"Label",
            type:"object",
            path:"basic_information.labels",
            objectPath:"name"
        },{
            name:"Datum tillagd",
            type:"text",
            path:"date_added"
        }
    ]
}

var table;

var customNotes;
var value;
var folders;
var collection = [];

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

function authorize(){
    httpRequest("https://api.discogs.com/oauth/request_token",function(){

    },[
        {
            key:"Content-Type",
            value:"application/x-www-form-urlencoded"
    },{
        key:"Authorization",
        value:`
            OAuth oauth_consumer_key="QHYffSaRuYbMcIdfOIuD",
            oauth_nonce="random_string_or_timestamp",
            oauth_signature="BHSDreyNedgpZJfCOWEixuFxHboWFhzY",
            oauth_signature_method="PLAINTEXT",
            oauth_timestamp="${Date.now()}",
            oauth_callback="your_callback"
        `
    },{
        key:"User-Agent",
        value: "some_user_agent"
    }
])
}

function reload(){
    requestHttp(function(){
        reloadTable();
    });
}
function reloadTable(){
    if(table !== undefined){
        document.getElementsByTagName('body')[0].removeChild(table);
        table = undefined;

        customNotes = undefined;
        value = undefined;
        folders = undefined;
        collection = [];
    }
    table = document.createElement("table");

    createFirstRows();
    createAllRows();

    document.getElementsByTagName('body')[0].appendChild(table);
    table.style="width:100%;table-layout: auto;"
}

function createFirstRows(){
    columns.rows = [];
    columns.rows.push(document.createElement("tr"));

    columns.row.forEach(column => {
        column.rows = [];
        let thisThing = document.createElement("td");
        column.rows.push(thisThing);
        thisThing.innerText = column.name;
        columns.rows[0].appendChild(thisThing)
    })
    customNotes.fields.forEach(column => {
        let thisThing = document.createElement("td");
        thisThing.innerText = column.name;
        columns.rows[0].appendChild(thisThing)
    })
    

    table.appendChild(columns.rows[0]);
}

function createAllRows(){
    for(i = 0; i < collection.length;i++){
        columns.rows.push(document.createElement("tr"));
        columns.row.forEach(column => {
            let thisThing = document.createElement("td");
            column.rows.push(thisThing);
            if(column.type === "text"){
                thisThing.innerText = deep_value(collection[i],column.path);
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
            columns.rows[i+1].appendChild(thisThing)
            table.appendChild(columns.rows[i+1]);
            
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
            }catch(e){            
                
            }

            columns.rows[i+1].appendChild(thisThing)
            table.appendChild(columns.rows[i+1]);
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