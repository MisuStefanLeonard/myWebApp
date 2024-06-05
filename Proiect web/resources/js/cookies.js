

//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare){//timpExpirare in milisecunde
    d=new Date();
    d.setTime(d.getTime()+timpExpirare)
    document.cookie=`${nume}=${val}; expires=${d.toUTCString()}`;
}

function getProductCookie() {
    const productCookie = getCookie("last_product");
    if (productCookie) {
        return JSON.parse(productCookie);
    }
    return null;
}

function setProductCookie(productDetails){
    const productJSON = JSON.stringify(productDetails);
    setCookie("last_product" , productJSON, 6000000)
}

function getCookie(nume){
    vectorParametri=document.cookie.split(";") // ["a=10","b=ceva"]
    for(let param of vectorParametri){
        if (param.trim().startsWith(nume+"="))
            return param.split("=")[1]
    }
    return null;
}

function deleteCookie(nume){
    console.log(`${nume}; expires=${(new Date()).toUTCString()}`)
    document.cookie=`${nume}=0; expires=${(new Date()).toUTCString()}`;
}


window.addEventListener("load", function(){
    if (getCookie("acceptat_banner")){
        document.getElementById("banner").style.display="none";
    }

    this.document.getElementById("ok_cookies").onclick=function(){
        setCookie("acceptat_banner",true,6000000);
        document.getElementById("banner").style.display="none"
    }

    const banner = document.getElementById("banner");
    
    banner.classList.add('show');
    
    
    document.getElementById("ok_cookies").onclick=function(){
        
        banner.style.display = "none";
    }

    const lastProduct = getProductCookie()

    if (lastProduct) {
       
        document.getElementById("inp-nume").value = lastProduct.name;
        document.getElementById("inp-pret").value = lastProduct.price;
        document.getElementById("inp-categorie").value = lastProduct.category;
       
    }

    document.getElementById("filtrare").onclick = function () {
    
        const productName = document.getElementById("inp-nume").value;
        const productPrice = document.getElementById("inp-pret").value;
        const productCategory = document.getElementById("inp-categorie").value;
     
        setProductCookie({ name: productName, price: productPrice, category: productCategory });
    };
})
