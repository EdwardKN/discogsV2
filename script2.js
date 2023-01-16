document.getElementById("username").value = localStorage.getItem("username");
document.getElementById("token").value = localStorage.getItem("token");
if(localStorage.getItem("token") == undefined){
    document.getElementById("back").style.visibility = "hidden";
}else{
    document.getElementById("back").style.visibility = "visible";
}
function load(){
    localStorage.setItem("username",document.getElementById("username").value);
    localStorage.setItem("token",document.getElementById("token").value);
    localStorage.setItem("load","true");
    
    setTimeout(() => {
        location.href = './index.html';
    }, 100);
}
myFunction = function(e) {
    e.preventDefault();
}