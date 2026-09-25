
async function cargarLogoPWADesdeFirebase(){
 try{
   if(typeof cloudDB==="undefined") return;

   const doc = await cloudDB.collection("configuracion").doc("tienda").get();

   if(doc.exists && doc.data().logoPWA){
      const img=document.getElementById("logoPWAVista");
      if(img){
        img.src=doc.data().logoPWA;
        img.style.display="block";
      }
   }
 }catch(e){
   console.log("Logo PWA Firebase:",e);
 }
}


async function cargarLogoPWAFirebase(){
 try{
   const doc = await cloudDB.collection("configuracion").doc("tienda").get();
   if(doc.exists){
     const datos=doc.data();
     const vista=document.getElementById("logoPWAVista");
     if(datos.logoPWA && vista){
        vista.src=datos.logoPWA;
        vista.style.display="block";
        localStorage.setItem("logoPWA", datos.logoPWA);
     }
   }
 }catch(e){
   console.error("Error leyendo logo PWA Firebase",e);
 }
}
window.addEventListener("load",()=>{
 setTimeout(cargarLogoPWAFirebase,800);
});
// Logo específico para instalación PWA
let logoPWA="";
window.addEventListener("load",()=>{
 const input=document.getElementById("logoPWAInput");
 const vista=document.getElementById("logoPWAVista");

 if(input){
   input.addEventListener("change",function(){
     const file=this.files[0];
     if(!file) return;

     const reader=new FileReader();
     reader.onload=function(e){
       logoPWA=e.target.result;
       if(vista){
          vista.src=logoPWA;
          vista.style.display="block";
       }
       localStorage.setItem("logoPWA",logoPWA);
       actualizarManifestPWA(logoPWA);
     };
     reader.readAsDataURL(file);

     if(typeof subirLogoPWAFirebase === "function"){
        subirLogoPWAFirebase(file).then(url=>{
          if(vista){
            vista.src=url;
          }
        });
     }
   });
 }

 const guardado=localStorage.getItem("logoPWA");
 if(guardado && vista){
    vista.src=guardado;
    vista.style.display="block";
 }
});

function actualizarManifestPWA(icon){
 localStorage.setItem("iconoPWA",icon);
}

// Actualiza el icono usado al instalar la tienda en el celular
function actualizarIconoTienda(){
 let logo = localStorage.getItem("logoTienda") || localStorage.getItem("logoTiendaURL");
 let icon = document.getElementById("iconoTiendaApple");
 if(logo && icon) icon.href = logo;
}
window.addEventListener("load", actualizarIconoTienda);


let logoTienda="";
let imagenProducto="";
let productoEditando=null;

window.addEventListener("load",()=>{
 const c=document.getElementById("codigoProducto");
 const esc=localStorage.getItem("codigoEscaneadoProducto");
 if(c && esc){
   c.value=esc;
   localStorage.removeItem("codigoEscaneadoProducto");
 }
});

/* Comprime imágenes antes de guardarlas para evitar que LocalStorage se llene */
function leerImagen(input, callback){

 let archivo=input.files[0];
 if(!archivo) return;

 let lector=new FileReader();

 lector.onload=function(e){

   let img=new Image();

   img.onload=function(){

     let canvas=document.createElement("canvas");

     let max=700;

     let escala=Math.min(max/img.width,max/img.height,1);

     canvas.width=img.width*escala;
     canvas.height=img.height*escala;

     let ctx=canvas.getContext("2d");

     // Mantiene transparencia (sin fondo negro)
     ctx.clearRect(0,0,canvas.width,canvas.height);

     ctx.drawImage(
       img,
       0,
       0,
       canvas.width,
       canvas.height
     );

     // Mantener transparencia para logos PNG/SVG y optimizar JPG normales
     const formatoSalida = /png|svg/i.test(archivo.type || "") ? "image/png" : "image/jpeg";
     callback(
       formatoSalida === "image/png"
         ? canvas.toDataURL("image/png")
         : canvas.toDataURL("image/jpeg",0.85)
     );

   };

   img.src=e.target.result;

 };

 lector.readAsDataURL(archivo);
}

if(document.getElementById("logoInput")){
logoInput.onchange=function(){
 leerImagen(this,function(img){
  logoTienda=img;
  logoVista.src=img;
 });
};
}


if(document.getElementById("productoInput")){
productoInput.onchange=function(){
 leerImagen(this,function(img){
  imagenProducto=img;
  productoVista.src=img;
 });
};
}


async function guardarTienda(){
actualizarIconoTienda();
if(!confirm("¿Está seguro de guardar los cambios de la tienda?")){
 return;
}
if(document.getElementById('claveAdmin')) localStorage.setItem('claveAdmin', claveAdmin.value || '1234');

try{

 localStorage.setItem("nombreTienda", nombreTienda.value);
if(document.getElementById("mensajeTicket")) localStorage.setItem("mensajeTicket", mensajeTicket.value);

 // Mantener logo anterior si no se selecciona una nueva imagen
 if(logoTienda){
   localStorage.setItem("logoTienda", logoTienda);
 }

 localStorage.setItem("contactoTienda", contactoTienda.value);
 if(document.getElementById("mensajeTienda")) localStorage.setItem("mensajeTienda", document.getElementById("mensajeTienda").value);
// Primero subir logo para obtener la URL antes de guardar la tienda
if(logoTienda && typeof subirLogoFirebase==="function"){
   const logoURL = await subirLogoFirebase(logoTienda);
   if(logoURL) {
      localStorage.setItem("logoURL", logoURL);
      localStorage.setItem("logoTiendaURL", logoURL);
   }
}
// Mantener logo PWA actual antes de sincronizar
if(localStorage.getItem("logoPWA")){
   console.log("Logo PWA preparado para Firebase");
}

if(typeof sincronizarTiendaFirebase==="function"){
   await sincronizarTiendaFirebase();
}

 alert("Tienda guardada correctamente en Firebase");

}catch(e){

 alert("Error guardando logo en Firebase Storage: " + e.message);
 console.error("Logo Storage:", e);

}

}


function generarCodigo(){
 let productos=JSON.parse(localStorage.getItem("productos")||"[]");
 let max=0;
 productos.forEach(p=>{
   let m=String(p.codigo||"").match(/^DM-(\d+)$/);
   if(m) max=Math.max(max,parseInt(m[1]));
 });
 return "DM-"+String(max+1).padStart(4,"0");
}




function abrirEscanerProducto(){
 localStorage.setItem("modoEscaneoProducto","1");
 window.location.href="scanner.html";
}

function crearProducto(){

if(productoEditando){ guardarEdicionProducto(); return; }

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

let codigoIngresado=(document.getElementById("codigoProducto")?.value.trim() || "");
let codigoFinal=codigoIngresado || generarCodigo();

// Evita códigos repetidos
if(productos.some(p=>p.codigo===codigoFinal)){
 alert("Este código ya existe. Use otro código.");
 return;
}

let nuevo={
 id:Date.now(),
 codigo:codigoFinal,
 nombre:nombreProducto.value,
 precio:precioProducto.value,
 imagen:imagenProducto
};

try{

productos.push(nuevo);
localStorage.setItem("productos",JSON.stringify(productos));
if(typeof sincronizarProductoFirebase==="function") sincronizarProductoFirebase(nuevo);

alert("Producto creado "+nuevo.codigo);

cargarProductos();

}catch(e){

alert("La imagen es demasiado grande");

}

}


async function cargarAdmin(){

// Primero sincroniza desde Firebase para evitar sobrescribir datos con caché local
if(typeof cargarTiendaDesdeFirebase==="function"){
 await cargarTiendaDesdeFirebase();
}

if(document.getElementById("nombreTienda"))
nombreTienda.value=localStorage.getItem("nombreTienda")||"";
if(document.getElementById("mensajeTicket")) mensajeTicket.value=localStorage.getItem("mensajeTicket")||"";

if(document.getElementById("contactoTienda"))
contactoTienda.value=localStorage.getItem("contactoTienda")||"";

if(document.getElementById("claveAdmin"))
claveAdmin.value=localStorage.getItem("claveAdmin")||"1234";
 if(document.getElementById("mensajeTienda"))
 mensajeTienda.value=localStorage.getItem("mensajeTienda")||"";

if(localStorage.getItem("logoTienda") && document.getElementById("logoVista"))
logoVista.src=localStorage.getItem("logoTienda");

cargarProductos();

}


function cargarProductos(){

let div=document.getElementById("listaProductos");

if(!div)return;

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

div.innerHTML="";

productos.forEach(p=>{

div.innerHTML+=`

<div class="producto">

<img src="${p.imagen}">

<h3>${p.nombre}</h3>

<p>Código: ${p.codigo}</p>

<p>Precio: S/. ${p.precio}</p>

<button onclick="editarProducto(${p.id})">
✏️ Editar
</button>

<button onclick="eliminarProducto(${p.id})">
🗑 Eliminar
</button>

</div>`;

});

}



function editarProducto(id){
 let productos=JSON.parse(localStorage.getItem("productos")||"[]");
 let p=productos.find(x=>x.id==id);
 if(!p) return;

 productoEditando=id;

 nombreProducto.value=p.nombre;
 precioProducto.value=p.precio;
 imagenProducto=p.imagen || "";

 let boton=document.querySelector('button[onclick="crearProducto()"]');
 if(boton) boton.innerHTML="GUARDAR CAMBIOS";
 if(boton) boton.setAttribute("onclick","guardarEdicionProducto()");

 window.scrollTo({top:0, behavior:"smooth"});
}


async function guardarEdicionProducto(){
 let productos=JSON.parse(localStorage.getItem("productos")||"[]");
 let p=productos.find(x=>x.id==productoEditando);
 if(!p) return;

 p.nombre=nombreProducto.value;
 p.precio=precioProducto.value;

 if(imagenProducto){
   p.imagen=imagenProducto;
 }

 localStorage.setItem("productos",JSON.stringify(productos));

 if(typeof actualizarProductoFirebase==="function"){
   await actualizarProductoFirebase(p);
 }

 productoEditando=null;

 let boton=document.querySelector('button[onclick="guardarEdicionProducto()"]');
 if(boton) boton.innerHTML="CREAR PRODUCTO";
 if(boton) boton.setAttribute("onclick","crearProducto()");

 cargarProductos();

 alert("Producto actualizado correctamente");
}


async function eliminarProducto(id){

let productos=JSON.parse(localStorage.getItem("productos")||"[]");
let producto=productos.find(p=>p.id==id);

if(!producto) return;

let confirmar=confirm("⚠️ ¿Está seguro de eliminar este producto?\n\nProducto: "+producto.nombre+"\nCódigo: "+producto.codigo+"\n\nEsta acción no se puede deshacer.");

if(!confirmar) return;

// Eliminar en Firebase para sincronizar todos los dispositivos
if(typeof eliminarProductoFirebase === "function") {
    await eliminarProductoFirebase(id);
}

// Eliminar copia local
productos=productos.filter(p=>p.id!=id);

localStorage.setItem("productos",JSON.stringify(productos));

cargarProductos();

}



function renderizarInicioCache(){
 let nombre=localStorage.getItem("nombreTienda");
 let logo=localStorage.getItem("logoTienda");

 if(nombre && document.getElementById("titulo"))
   document.getElementById("titulo").innerHTML=nombre;

 if(logo && document.getElementById("logoTienda"))
   document.getElementById("logoTienda").src=logo;

 let div=document.getElementById("productosInicio");
 if(!div)return;

 let productos=JSON.parse(localStorage.getItem("productos")||"[]");

 div.innerHTML="";

 productos.forEach(p=>{
   div.innerHTML += `
   <div class="producto">
     <img src="${p.imagen||''}" class="imagen">
     <h3>${p.nombre||''}</h3>
     <p>S/. ${p.precio||0}</p>
     <button onclick="seleccionarProducto('${p.id}')">🛒 PEDIR</button>
   </div>`;
 });
}

let cargandoInicioFirebase = false;

async function cargarInicio(){

// Primero mostrar datos locales para apertura rápida
renderizarInicioCache();


// Firebase actualiza en segundo plano sin bloquear la pantalla
setTimeout(async ()=>{
 try{
   if(typeof cargarTiendaDesdeFirebase==="function"){
      await cargarTiendaDesdeFirebase();
   }

   if(!cargandoInicioFirebase && typeof cargarProductosDesdeFirebase==="function"){
      cargandoInicioFirebase = true;
      await cargarProductosDesdeFirebase();
      cargandoInicioFirebase = false;
   }

   renderizarInicioCache();

 }catch(e){
   console.log("Actualización Firebase en segundo plano:",e);
 }
},300);

let nombre=localStorage.getItem("nombreTienda");
let logo=localStorage.getItem("logoTienda");

if(nombre && document.getElementById("titulo"))
document.getElementById("titulo").innerHTML=nombre;

if(logo && document.getElementById("logoTienda"))
document.getElementById("logoTienda").src=logo;

let div=document.getElementById("productosInicio");

if(!div)return;

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

div.innerHTML="";

productos.forEach(p=>{

div.innerHTML+=`

<div class="producto">

<img src="${p.imagen}">

<h3>${p.nombre}</h3>

<p>Código: ${p.codigo}</p>

<p>Precio: S/. ${p.precio}</p>

<button onclick="seleccionarProducto('${p.id}')">🛒 PEDIR</button>

</div>`;

});

}


function mostrarProductosInicio(lista){

let div=document.getElementById("productosInicio");
if(!div)return;

div.innerHTML="";

lista.forEach(p=>{
div.innerHTML+=`
<div class="producto">
<img src="${p.imagen}">
<h3>${p.nombre}</h3>
<p>Código: ${p.codigo}</p>
<p>Precio: S/. ${p.precio}</p>
<button onclick="seleccionarProducto('${p.id}')">🛒 PEDIR</button>
</div>`;
});
}


function buscarInicio(){

let texto=document.getElementById("buscadorInicio").value.toLowerCase();

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

let filtrados=productos.filter(p=>
p.nombre.toLowerCase().includes(texto) ||
p.codigo.toLowerCase().includes(texto)
);

mostrarProductosInicio(filtrados);

}


function buscarAdmin(){

let texto=document.getElementById("buscadorAdmin").value.toLowerCase();

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

let div=document.getElementById("listaProductos");

let filtrados=productos.filter(p=>
p.nombre.toLowerCase().includes(texto) ||
p.codigo.toLowerCase().includes(texto)
);

div.innerHTML="";

filtrados.forEach(p=>{
div.innerHTML+=`
<div class="producto">
<img src="${p.imagen}">
<h3>${p.nombre}</h3>
<p>Código: ${p.codigo}</p>
<p>Precio: S/. ${p.precio}</p>
<button onclick="eliminarProducto(${p.id})">🗑 Eliminar</button>
</div>`;
});

}


function seleccionarProducto(id){
localStorage.setItem("productoPedido",id);
window.location.href="pedidos.html";
}


function cargarPedido(){

let id=localStorage.getItem("productoPedido");

let productos=JSON.parse(localStorage.getItem("productos")||"[]");

let p=productos.find(x=>x.id==id);

if(!p)return;

localStorage.setItem("productoActualPedido",JSON.stringify(p));

document.getElementById("productoPedido").innerHTML=`

<img src="${p.imagen}" style="width:120px;height:120px;object-fit:contain">

<h3>${p.nombre}</h3>

<p>Código: ${p.codigo}</p>

<p>Precio: S/. ${p.precio}</p>

`;

}


function fechaActual(){

let hoy=new Date();

return hoy.toLocaleDateString("es-PE");

}




function obtenerCantidadPedido(){
 let c=document.getElementById("cantidadPedido");
 return Math.max(1, Number(c ? c.value : 1));
}

function cambiarCantidad(valor){
 let c=document.getElementById("cantidadPedido");
 if(!c) return;
 c.value=Math.max(1, Number(c.value||1)+valor);
 actualizarSubtotalPedido();
}

function actualizarSubtotalPedido(){
 let p=JSON.parse(localStorage.getItem("productoActualPedido")||"{}");
 let cantidad=obtenerCantidadPedido();
 let subtotal=Number(p.precio||0)*cantidad;
 let s=document.getElementById("subtotalPedido");
 let t=document.getElementById("totalPedido");
 if(s) s.innerHTML="Subtotal: S/. "+subtotal.toFixed(2);
 if(t) t.innerHTML="Total: S/. "+subtotal.toFixed(2);
}


function generarPedido(){

let p=JSON.parse(localStorage.getItem("productoActualPedido"));

let pedido={
fechaCreacion: Date.now(),

numero:"PED-"+String(Math.floor(Math.random()*10000)).padStart(4,"0"),

producto:p.nombre,

codigo:p.codigo,

precio:p.precio,

cantidad:obtenerCantidadPedido(),

total:Number(p.precio || 0) * obtenerCantidadPedido(),

subtotal:Number(p.precio || 0) * obtenerCantidadPedido(),

fechaPedido:fechaActual(),

anticipo:Number(document.getElementById("anticipo").value || 0),

saldo:(Number(p.precio || 0) * obtenerCantidadPedido()) - Number(document.getElementById("anticipo").value || 0),

fechaEntrega:document.getElementById("fechaEntrega").value,

cliente:document.getElementById("cliente").value,

mensajePedido:document.getElementById("mensajePedido") ? document.getElementById("mensajePedido").value : "",
estado:"Pendiente"

};


let pedidos=JSON.parse(localStorage.getItem("pedidos")||"[]");

pedidos.push(pedido);

localStorage.setItem("pedidos",JSON.stringify(pedidos));

// Guardar el ultimo pedido para la impresión del ticket
localStorage.setItem("ultimoPedido", JSON.stringify(pedido));

// Guardar pedido en Firebase
if(typeof sincronizarPedidoFirebase==="function"){
  sincronizarPedidoFirebase(pedido);
}


document.getElementById("ticket").innerHTML=`

<h2>${localStorage.getItem("nombreTienda")||"Tienda"}</h2>

PEDIDO: ${pedido.numero}<br>

Cliente: ${pedido.cliente}<br>

Producto: ${pedido.producto}<br>

Código: ${pedido.codigo}<br>

Fecha pedido: ${pedido.fechaPedido}<br>

Entrega: ${pedido.fechaEntrega}<br>

Anticipo: S/. ${pedido.anticipo}

`;

alert("Pedido generado correctamente");

}



function asegurarPedido(){

let ticket=document.getElementById("ticket");

if(ticket.innerHTML.trim()==""){
 generarPedido();
}

}


function imprimirTicket(){

asegurarPedido();

if(typeof imprimirTicketCanvas === "function"){
    imprimirTicketCanvas();
}else{
    alert("No se encontró el módulo de impresión");
}

}

function guardarPDF(){

asegurarPedido();

window.print();

}



function generarTicket80(){

let producto = JSON.parse(localStorage.getItem("productoActual") || "{}");

let nombreTienda = localStorage.getItem("nombreTienda") || "TIENDA";
let logo = localStorage.getItem("logoTienda") || "";

let anticipo = document.getElementById("anticipo") ? document.getElementById("anticipo").value : "0";
let entrega = document.getElementById("fechaEntrega") ? document.getElementById("fechaEntrega").value : "";

let fecha = new Date().toLocaleDateString();

let ticket = `
<div class="ticket">

<div class="centro">
${logo ? `<img src="${logo}" class="ticketLogo">`:""}
<h2>${nombreTienda}</h2>
<p>BOLETA DE PEDIDO</p>
</div>

--------------------------------

Pedido: ${Date.now()}

Fecha pedido:
${fecha}

Producto:
${producto.nombre || ""}

Código:
${producto.codigo || ""}

Precio final:
S/. ${producto.precio || "0"}

Anticipo:
S/. ${anticipo}

Fecha entrega:
${entrega}

--------------------------------

Gracias por su compra

</div>
`;

let ventana=window.open("","","width=320,height=600");

ventana.document.write(`
<html>
<head>
<style>
@page{size:80mm auto;margin:5mm}
body{transform:translateX(0);transform-origin:top left;overflow-x:hidden;print-color-adjust:exact;-webkit-print-color-adjust:exact;font-family:monospace;width:302px; max-width:302px; min-width:302px; margin:0;font-size:13px}
.ticket{text-align:left}
.centro{text-align:center}
.ticketLogo{max-width:60px;max-height:60px}
</style>
</head>
<body>${ticket}</body>
</html>
`);

ventana.document.close();


// Esperar que el logo termine de cargar antes de imprimir
let imagenes = ventana.document.images;

if(imagenes.length > 0){
    let img = imagenes[0];

    img.onload = function(){
        ventana.print();
    };

    // Si ya estaba cargado
    if(img.complete){
        ventana.print();
    }

}else{
    ventana.print();
}

}



function imprimirTicketOrdenado(){

let pedido = JSON.parse(localStorage.getItem("ultimoPedido") || "{}");

let tienda = localStorage.getItem("nombreTienda") || "TIENDA";
let logo = localStorage.getItem("logoTienda") || "";
let contacto = localStorage.getItem("contactoTienda") || "";
let mensaje = localStorage.getItem("mensajeTicket") || "";

let ventana = window.open("", "", "width=320,height=700");

ventana.document.write(`
<html>
<head>
<style>
@page{size:80mm auto;margin:0;padding:0}
body{transform:translateX(0);transform-origin:top left;overflow-x:hidden;print-color-adjust:exact;-webkit-print-color-adjust:exact;
 width:302px; max-width:302px; min-width:302px; margin:0;
 font-family:monospace;
 font-size:15px;
 text-align:left; margin:0;
}
.cabecera{text-align:center;}.logo{
 max-width:70px;
 max-height:70px;
 object-fit:contain;
}
.linea{
border-top:1px dashed #000;
margin:4px 0;
}
.dato{text-align:left; margin:0;}
</style>
</head>
<body>

${logo ? `<img class="logo" id="logoTicket" src="${logo}">` : ""}

<h2>${tienda}</h2>

<div class="linea"></div>
<h3>BOLETA DE PEDIDO</h3>

<div class="dato">
N° PEDIDO:<br>${pedido.numero || ""}<br><br>
CLIENTE:<br>${pedido.cliente || ""}<br><br>
PRODUCTO:<br>${pedido.producto || ""}<br><br>
CODIGO:<br>${pedido.codigo || ""}<br><br>
PRECIO:<br>S/. ${pedido.precio || "0"}<br><br>
ANTICIPO:<br>S/. ${pedido.anticipo || "0"}<br><br>
FECHA PEDIDO:<br>${pedido.fechaPedido || ""}<br><br>
FECHA ENTREGA:<br>${pedido.fechaEntrega || ""}
</div>

<div class="linea"></div>

${pedido.mensajePedido ? `<b>${pedido.mensajePedido}</b><br><br>` : ""}
${mensaje ? `<b>${mensaje}</b><br><br>` : ""}

CONTACTO:<br>${contacto}

<br><br>
<b>GRACIAS POR SU COMPRA</b><br>
<b>VUELVA PRONTO</b>

</body>
</html>
`);

ventana.document.close();

let imagenes = Array.from(ventana.document.images);

function imprimirCuandoEsteListo(){

    ventana.focus();
    ventana.print();

}

if(imagenes.length){

    let pendientes = imagenes.length;

    imagenes.forEach(img=>{

        const lista = () => {
            pendientes--;
            if(pendientes <= 0){
                setTimeout(imprimirCuandoEsteListo, 300);
            }
        };

        if(img.complete && img.naturalWidth > 0){
            lista();
        }else{
            img.onload = lista;
            img.onerror = lista;
        }

    });

}else{

    setTimeout(imprimirCuandoEsteListo,300);

}

}

function obtenerMensajePedido(){
 let campo=document.getElementById("mensajePedido");
 return campo ? campo.value : "";
}

function guardarMensajeEnPedido(){
 let pedido=JSON.parse(localStorage.getItem("ultimoPedido") || "{}");
 pedido.mensajePedido=obtenerMensajePedido();
 localStorage.setItem("ultimoPedido", JSON.stringify(pedido));
}


// Campo disponible para el ticket:
function mostrarMensajePedidoTicket(){
 let pedido=JSON.parse(localStorage.getItem("ultimoPedido") || "{}");
 return pedido.mensajePedido || "";
}


async function cargarControlPedidos(filtro=""){
if(typeof cargarPedidosFirebase==="function"){
 await cargarPedidosFirebase();
}
let div=document.getElementById("listaPedidos");
if(!div)return;

let pedidos=JSON.parse(localStorage.getItem("pedidos")||"[]");

// Mostrar siempre el último pedido creado arriba
pedidos = pedidos.map((p,i)=>({ ...p, _indice:i }));

pedidos.sort((a,b)=>{
 let fa = Number(a.fechaCreacion || 0);
 let fb = Number(b.fechaCreacion || 0);
 return fb - fa;
});

pedidos=pedidos.filter(p=>String(p.numero||"").includes(filtro));

div.innerHTML="";

if(pedidos.length===0){
div.innerHTML="<p>No hay pedidos registrados</p>";
return;
}

pedidos.forEach((p)=>{
 let indice=p._indice;

 div.innerHTML+=`
 <div class="card">
 <h3>📋 Pedido N° ${p.numero||""}</h3>
 <p><b>👤 Cliente:</b> ${p.cliente||"No registrado"}</p>
 <p><b>🕒 Fecha de creación:</b> ${p.fechaCreacion ? new Date(Number(p.fechaCreacion)).toLocaleString() : (p.fechaPedido||"")}</p>
 <p><b>📦 Producto:</b> ${p.producto||""}</p>
 <p><b>🏷️ Código:</b> ${p.codigoProducto||p.codigo||""}</p>
 <p><b>💵 Precio del producto:</b> S/. ${p.precioProducto||p.precio||"0"}</p>
 <p><b>🔢 Cantidad:</b> ${p.cantidad||"1"}</p>
 <p><b>🧮 Subtotal:</b> S/. ${p.subtotal||p.precioProducto||p.precio||"0"}</p>
 <p><b>💰 Anticipo recibido:</b> S/. ${p.anticipo||"0"}</p>
 <p><b>💳 Saldo pendiente:</b> S/. ${((Number(p.precioProducto||p.precio||0)*Number(p.cantidad||1))-Number(p.anticipo||0)).toFixed(2)}</p>
 <p><b>📅 Fecha de entrega:</b> ${p.fechaEntrega||""}</p>
 <p><b>📝 Mensaje:</b> ${p.mensajePedido||""}</p>
 <p><b>Estado:</b> ${p.estado||"Pendiente"}</p>
 ${p.estado!=="Entregado" && p.estado!=="Cancelado"?`
 <button onclick="marcarEntregado(${indice})">✅ Marcar entregado</button>
 <button onclick="cancelarPedido(${indice})">❌ Cancelar pedido</button>
 `:
 p.estado==="Cancelado"?`<strong>❌ Cancelado</strong>`:`<strong>✅ Entregado</strong>`}
 </div>`;
 });
}

function filtrarPedidos(){
let campo=document.getElementById("buscadorPedidos");
cargarControlPedidos(campo.value.trim());
}


async function cancelarPedido(i){
let pedidos=JSON.parse(localStorage.getItem("pedidos")||"[]");
if(pedidos[i]){
 pedidos[i].estado="Cancelado";
 localStorage.setItem("pedidos",JSON.stringify(pedidos));

 if(typeof actualizarEstadoPedidoFirebase==="function"){
    await actualizarEstadoPedidoFirebase(pedidos[i]);
 }

 cargarControlPedidos();
}
}

async function marcarEntregado(i){
let pedidos=JSON.parse(localStorage.getItem("pedidos")||"[]");
if(pedidos[i]){
 pedidos[i].estado="Entregado";
 localStorage.setItem("pedidos",JSON.stringify(pedidos));

 if(typeof actualizarEstadoPedidoFirebase==="function"){
    await actualizarEstadoPedidoFirebase(pedidos[i]);
 }

 cargarControlPedidos();
}
}


// ESCANER DE PRODUCTOS
function buscarCodigo(codigo){

 let productos=JSON.parse(localStorage.getItem("productos")||"[]");

 let producto=productos.find(p=>p.codigo.toLowerCase()===codigo.toLowerCase());

 let div=document.getElementById("resultado");

 if(!div)return;

 if(producto){

   div.innerHTML=`
   <h2>✅ Producto encontrado</h2>
   <img class="preview" src="${producto.imagen||''}">
   <h3>${producto.nombre}</h3>
   <p>Código: ${producto.codigo}</p>
   <p>Precio: S/. ${producto.precio}</p>
   <button onclick="seleccionarProducto('${producto.id}')">
   🛒 Crear pedido
   </button>
   `;

 }else{

   div.innerHTML=`
   <h2>❌ Producto no encontrado</h2>
   <p>Código escaneado:</p>
   <strong>${codigo}</strong>
   `;
 }

}


async function entrarAdmin(){
 if(typeof cargarTiendaDesdeFirebase==='function'){
   await cargarTiendaDesdeFirebase();
 }
 let clave=localStorage.getItem("claveAdmin")||"1234";
 let ingreso=prompt("🔐 Ingrese contraseña de administrador:");
 if(ingreso===clave){
   sessionStorage.setItem("adminOK","1");
   location="administracion.html";
 }else{
   alert("Contraseña incorrecta");
 }
}

async function verificarAccesoAdmin(){
 if(typeof cargarTiendaDesdeFirebase==="function"){
   await cargarTiendaDesdeFirebase();
 }

 let clave=localStorage.getItem("claveAdmin");
 if(!clave){
   localStorage.setItem("claveAdmin","1234");
   clave="1234";
 }
 if(sessionStorage.getItem("adminOK")!=="1"){
   let ingreso=prompt("🔐 Ingrese contraseña de administrador:");
   if(ingreso!==clave){
     alert("Acceso denegado");
     location="inicio.html";
   }else{
     sessionStorage.setItem("adminOK","1");
   }
 }
}

window.addEventListener('load',()=>{ setTimeout(cargarLogoPWADesdeFirebase,500); });
