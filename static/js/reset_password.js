const eye=document.querySelector(".toggle");
const pass=document.getElementById("password");

eye.onclick=function(){

if(pass.type==="password"){

pass.type="text";

eye.classList.replace("fa-eye","fa-eye-slash");

}else{

pass.type="password";

eye.classList.replace("fa-eye-slash","fa-eye");

}

}

const eye2=document.querySelector(".toggle2");
const pass2=document.getElementById("confirmPassword");

eye2.onclick=function(){

if(pass2.type==="password"){

pass2.type="text";

eye2.classList.replace("fa-eye","fa-eye-slash");

}else{

pass2.type="password";

eye2.classList.replace("fa-eye-slash","fa-eye");

}

}

setTimeout(()=>{

const flash=document.querySelector(".flash-container");

if(flash){

flash.style.display="none";

}

},3000);

