document.getElementById("username").value = localStorage.getItem("username");
document.getElementById("token").value = localStorage.getItem("token");

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