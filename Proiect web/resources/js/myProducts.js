window.addEventListener("load", function () {
    document.getElementById("inp-pret").onchange = function () {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
    }
    document.getElementById("inp-dimensiune").onchange = function () {
        document.getElementById("infoRange2").innerHTML = `(${this.value})`;
    }

    
    function saveFilters() {
        const filters = {
            "inp-nume": document.getElementById("inp-nume").value,
            "inp-pret": document.getElementById("inp-pret").value,
            "inp-categorie": document.getElementById("inp-categorie").value,
            "gr_rad": Array.from(document.getElementsByName("gr_rad")).find(radio => radio.checked)?.value,
            "gr_rad_masa": Array.from(document.getElementsByName("gr_rad_masa")).find(radio => radio.checked)?.value
        };
        localStorage.setItem("filters", JSON.stringify(filters));
    }

    // Function to load filters from localStorage
    function loadFilters() {
        const filters = JSON.parse(localStorage.getItem("filters"));
        if (filters) {
            document.getElementById("inp-nume").value = filters["inp-nume"];
            document.getElementById("inp-pret").value = filters["inp-pret"];
            document.getElementById("inp-categorie").value = filters["inp-categorie"];
            document.getElementById("infoRange").innerHTML = `(${filters["inp-pret"]})`;

            const gr_rad = filters["gr_rad"];
            if (gr_rad) {
                const radio = Array.from(document.getElementsByName("gr_rad")).find(radio => radio.value === gr_rad);
                if (radio) radio.checked = true;
            }

            const gr_rad_masa = filters["gr_rad_masa"];
            if (gr_rad_masa) {
                const radio = Array.from(document.getElementsByName("gr_rad_masa")).find(radio => radio.value === gr_rad_masa);
                if (radio) radio.checked = true;
            }
        }
    }

  
    function clearFilters() {
        localStorage.removeItem("filters");
    }

    document.getElementById("filtrare").onclick = function () {
        saveFilters(); 

        var input_nume = document.getElementById("inp-nume").value.toLowerCase().trim();
        var radio_masa = document.getElementsByName("gr_rad");
        var radio_uz = document.getElementsByName("gr_rad_masa");

        let val_uz_multiplu;

        for (let rad_uz of radio_uz) {
            if (rad_uz.checked) {
                val_uz_multiplu = rad_uz.value;
                break;
            }
        }

        let minMasa, maxMasa;

        for (let rad of radio_masa) {
            if (rad.checked) {
                let vMasa = rad.value.split(":");
                minMasa = parseInt(vMasa[0]);
                maxMasa = parseInt(vMasa[1]);
                break;
            }
        }

        var inp_pret = parseInt(document.getElementById("inp-pret").value);
        var inp_categorie = document.getElementById("inp-categorie").value;
        var produse = document.getElementsByClassName("produs");

        for (let produs of produse) {
            let val_nume = produs.querySelector('.val-nume').textContent.toLowerCase().trim();
            let val_masa = parseInt(produs.querySelector('.val-masa').textContent);
            let val_pret = parseFloat(produs.querySelector('.val-pret').textContent);
            let val_categorie = produs.getElementsByClassName("val-categorie")[0].innerHTML
                .toLowerCase()
                .trim();
            let VAL_uz_multiplu = produs.getElementsByClassName("val-uz_multiplu")[0].innerHTML.trim();

            let cond1 = val_nume.startsWith(input_nume);
            let cond2 = (isNaN(minMasa) || isNaN(maxMasa) || (val_masa >= minMasa && val_masa < maxMasa));
            let cond3 = (val_pret >= inp_pret);
            let cond4 = val_categorie === inp_categorie || inp_categorie === "toate";
            let cond5 = val_uz_multiplu === "toate" || VAL_uz_multiplu.toLowerCase() === val_uz_multiplu.toLowerCase();

            if (cond1 && cond2 && cond3 && cond4 && cond5) {
                produs.style.display = "block";
            } else {
                produs.style.display = "none";
                let p = document.createElement("p");
                p.innerHTML = "Nu s-a gasit niciun produs";
                p.id = "none";
                let container = document.getElementById("dummy");
                container.insertBefore(p, container.children[0]);
                setTimeout(function () {
                    var pgf = document.getElementById("none");
                    if (pgf) {
                        pgf.remove();
                    }
                }, 2000);
            }
        }
    }

    document.getElementById("resetare").onclick = function () {
        if (confirm("Are you sure you want to reset the filters?")) {
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-pret").value = document.getElementById("inp-pret").min;
            document.getElementById("inp-categorie").value = "toate";
            document.getElementById("i_rad4").checked = true;
            var produse = document.getElementsByClassName("produs");
            document.getElementById("infoRange").innerHTML = "(0)";
            clearFilters(); // Clear filters from localStorage

            for (let prod of produse) {
                prod.style.display = "block";
            }
        }
    }

    function sorteaza(semn) {
        var produse = document.getElementsByClassName("produs");

        // Convert HTMLCollection to an array
        var produseArray = Array.from(produse);

        produseArray.sort((a, b) => {

            let dimensiuneA = parseInt(a.getElementsByClassName("val-dimensiune")[0].innerHTML);
            let dimensiuneB = parseInt(b.getElementsByClassName("val-dimensiune")[0].innerHTML);

            if (dimensiuneA == dimensiuneB) {

                let numeA = a.getElementsByClassName("val-nume")[0].innerHTML;
                let numeB = b.getElementsByClassName("val-nume")[0].innerHTML;

                return semn * numeA.localeCompare(numeB);
            }
            return semn * dimensiuneA - dimensiuneB;
        });

        for (let prod of produseArray) {
            prod.parentNode.append(prod);
        }

    }

    document.getElementById("sortCrescNume").onclick = function () {
        sorteaza(1);
    };

    document.getElementById("sortDescrescNume").onclick = function () {
        sorteaza(-1);
    };

    document.getElementById("calcul-cost").onclick = function (e) {
        var suma = 0;
        var produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            var stil = getComputedStyle(prod);
            if (stil.display !== "none") {
                suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
            }
        }
        if (!document.getElementById("par_suma")) {
            let p = document.createElement("p");
            p.innerHTML = suma;
            p.id = "par_suma";
            let container = document.getElementById("produse");
            container.insertBefore(p, container.children[0]);
            setTimeout(function () {
                var pgf = document.getElementById("par_suma");
                if (pgf) {
                    pgf.remove();
                }
            }, 2000);
        }
    };

    loadFilters(); 
    document.getElementById("filtrare").click(); 

    var modal = document.getElementById("myModal");

    
    var btns = document.querySelectorAll(".produs");

    
    var span = document.getElementsByClassName("close")[0];

   
    btns.forEach(btn => {
        btn.onclick = function() {
            modal.style.display = "block";
           
            var productDetails =  "<h2> " + btn.querySelector(".val-nume").textContent + "</h2>"; // Example: Get product name
            productDetails +=  "<p> " + btn.querySelector(".val-masa").textContent + "</p>"
            productDetails +=   "<p> " + btn.querySelector(".val-dimensiune").textContent + "</p>"
            productDetails +=  "<p> " + btn.querySelector(".val-uz_multiplu").textContent + "</p>"
            productDetails +=   "<p> " + btn.querySelector(".val-categorie").textContent + "</p>"

            document.getElementById("productDetails").innerHTML = productDetails;
        }
    });

   
    span.onclick = function() {
        modal.style.display = "none";
    }

    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }



    // CEL MAI IEFTIN 

    // Get all product containers
    var products = document.querySelectorAll(".produs");

    // Initialize variables to store the cheapest product from each category
    var cheapestProducts = {};

    // Iterate through each product to find the cheapest one from each category
    products.forEach(function(product) {
        // Get the category, price, and name of the current product
        var category = product.querySelector(".val-categorie").textContent;
        var price = parseFloat(product.querySelector(".val-pret").textContent);
        var productName = product.querySelector(".val-nume").textContent;

        // Check if the category is already in the cheapestProducts object
        if (!(category in cheapestProducts) || price < cheapestProducts[category].price) {
            // Update the cheapest product for this category
            cheapestProducts[category] = { price: price, productName: productName };
        }
    });

    // Add a "SALE" tag to the cheapest product from each category
    Object.keys(cheapestProducts).forEach(function(category) {
        var cheapestProduct = cheapestProducts[category];
        // Find the product container by looping through all product containers and comparing their names
        var productContainer = Array.from(products).find(function(product) {
            return product.querySelector(".val-nume").textContent === cheapestProduct.productName;
        });
        if (productContainer) {
            var saleTag = document.createElement("span");
            saleTag.classList.add("sale-tag");
            saleTag.textContent = "SALE";
            productContainer.appendChild(saleTag);
        }
    });
});


// filtrare la tastare
//--------------

// window.addEventListener("load", function () {
//     const filterInputs = [
//         document.getElementById("inp-nume"),
//         document.getElementsByName("gr_rad"),
//         document.getElementsByName("gr_rad_masa"),
//         document.getElementById("inp-pret"),
//         document.getElementById("inp-dimensiune"),
//         document.getElementById("inp-categorie")
//     ];

//     filterInputs.forEach(input => {
//         if (input instanceof NodeList) {
//             input.forEach(radio => radio.onchange = filterProducts);
//         } else {
//             input.onchange = filterProducts;
//         }
//     });

//     document.getElementById("inp-pret").oninput = function () {
//         document.getElementById("infoRange").innerHTML = `(${this.value})`;
//     };
//     document.getElementById("inp-dimensiune").oninput = function () {
//         document.getElementById("infoRange2").innerHTML = `(${this.value})`;
//     };

//     function filterProducts() {
//         var input_nume = document.getElementById("inp-nume").value.toLowerCase().trim();
//         var radio_masa = document.getElementsByName("gr_rad");
//         var radio_uz = document.getElementsByName("gr_rad_masa");

//         let val_uz_multiplu;
//         for(let rad_uz of radio_uz){
//             if(rad_uz.checked){
//                 val_uz_multiplu = rad_uz.value;
//                 break;
//             }
//         }

//         let minMasa, maxMasa;
//         for (let rad of radio_masa) {
//             if (rad.checked) {
//                 let vMasa = rad.value.split(":");
//                 minMasa = parseInt(vMasa[0]);
//                 maxMasa = parseInt(vMasa[1]);
//                 break;
//             }
//         }

//         var inp_pret = parseInt(document.getElementById("inp-pret").value);
//         var inp_categorie = document.getElementById("inp-categorie").value;
//         var produse = document.getElementsByClassName("produs");

//         for (let produs of produse) {
//             let val_nume = produs.querySelector('.val-nume').textContent.toLowerCase().trim();
//             let val_masa = parseInt(produs.querySelector('.val-masa').textContent);
//             let val_pret = parseFloat(produs.querySelector('.val-pret').textContent);
//             let val_categorie = produs.getElementsByClassName("val-categorie")[0].innerHTML.toLowerCase().trim();
//             let VAL_uz_multiplu = produs.getElementsByClassName("val-uz_multiplu")[0].innerHTML.trim();

//             let cond1 = val_nume.startsWith(input_nume);
//             let cond2 = (isNaN(minMasa) || isNaN(maxMasa) || (val_masa >= minMasa && val_masa < maxMasa));
//             let cond3 = (val_pret >= inp_pret);
//             let cond4 = val_categorie === inp_categorie || inp_categorie === "toate";
//             let cond5 = val_uz_multiplu === "toate" || VAL_uz_multiplu.toLowerCase() === val_uz_multiplu.toLowerCase();

//             if (cond1 && cond2 && cond3 && cond4 && cond5) {
//                 produs.style.display = "block";
//             } else {
//                 produs.style.display = "none";
//             }
//         }
//     }

//     document.getElementById("resetare").onclick = function () {
//         if(confirm("Are you sure you want to reset the filters?")){
//             document.getElementById("inp-nume").value = "";
//             document.getElementById("inp-pret").value = document.getElementById("inp-pret").min;
//             document.getElementById("inp-categorie").value = "toate";
//             document.getElementById("i_rad4").checked = true;
//             document.getElementById("infoRange").innerHTML = "(0)";
//             document.getElementById("infoRange2").innerHTML = "(0)";
//             filterProducts(); // Apply the reset filters
//         }
//     };

//     function sorteaza(semn){
//         var produse = document.getElementsByClassName("produs");
        
//         // Convert HTMLCollection to an array
//         var produseArray = Array.from(produse);
        
//         produseArray.sort((a, b) => {
        
//             let dimensiuneA = parseInt(a.getElementsByClassName("val-dimensiune")[0].innerHTML);
//             let dimensiuneB = parseInt(b.getElementsByClassName("val-dimensiune")[0].innerHTML);

//             if(dimensiuneA === dimensiuneB){
//                 let numeA = a.getElementsByClassName("val-nume")[0].innerHTML;
//                 let numeB = b.getElementsByClassName("val-nume")[0].innerHTML;
//                 return semn * numeA.localeCompare(numeB);
//             }
//             return semn * (dimensiuneA - dimensiuneB);
//         });
        
//         for(let prod of produseArray){
//             prod.parentNode.appendChild(prod);
//         }
//     }

//     document.getElementById("sortCrescNume").onclick = function () {
//         sorteaza(1);
//     };

//     document.getElementById("sortDescrescNume").onclick = function () {
//         sorteaza(-1);
//     };

//     document.getElementById("calcul-cost").onclick = function(e) {
//         var suma = 0;
//         var produse = document.getElementsByClassName("produs");
//         for (let prod of produse) {
//             var stil = getComputedStyle(prod);
//             if (stil.display !== "none") {
//                 suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
//             }
//         }
//         if (!document.getElementById("par_suma")) {
//             let p = document.createElement("p");
//             p.innerHTML = `Total cost: ${suma} lei`;
//             p.id = "par_suma";
//             let container = document.getElementById("produse");
//             container.insertBefore(p, container.children[0]);
//             setTimeout(function(){
//                 var pgf = document.getElementById("par_suma");
//                 if(pgf){
//                     pgf.remove();
//                 }
//             }, 2000);
//         }
//     };
// });
