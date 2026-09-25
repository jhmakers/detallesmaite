
function actualizarManifestDesdeFirebase(){
 let logo=localStorage.getItem("logoPWA");
 if(!logo) return;

 let manifest={
   name:"Tienda Artesanal",
   short_name:"Tienda",
   start_url:"inicio.html",
   display:"standalone",
   background_color:"#fff7fb",
   theme_color:"#d96c9d",
   icons:[
    {src:logo,sizes:"512x512",type:"image/png"},
    {src:logo,sizes:"192x192",type:"image/png"}
   ]
 };

 let blob=new Blob([JSON.stringify(manifest)],{type:"application/manifest+json"});
 let url=URL.createObjectURL(blob);
 let link=document.querySelector('link[rel="manifest"]');
 if(link) link.href=url;

 let apple=document.getElementById("iconoTiendaApple");
 if(apple) apple.href=logo;
}


// Firebase Cloud Sync - V15
// Mantiene el funcionamiento actual y agrega copia a Firestore

const firebaseConfig = {
 apiKey: "AIzaSyAQ14rrHZzTqEr9Dhg9rK8cx17MlKupSNI",
 authDomain: "detallesmaite-a4ca6.firebaseapp.com",
 projectId: "detallesmaite-a4ca6",
 storageBucket: "detallesmaite-a4ca6.firebasestorage.app",
 messagingSenderId: "999993778073",
 appId: "1:999993778073:web:03f764bd709da484a17d08"
};

firebase.initializeApp(firebaseConfig);
const cloudDB = firebase.firestore();
const cloudStorage = firebase.storage();

async function sincronizarProductoFirebase(producto){
 try{
   await cloudDB.collection("productos").doc(String(producto.id)).set(producto);
 }catch(e){ console.error("Firebase producto ERROR:",e.code,e.message,e); }
}

async function sincronizarProductosFirebase(){
 try{
   let productos=JSON.parse(localStorage.getItem("productos")||"[]");
   for(const p of productos){
     await sincronizarProductoFirebase(p);
   }
   localStorage.setItem("firebaseProductosMigrados","true");
   console.log("Productos sincronizados");
 }catch(e){console.error("Migracion productos ERROR:",e.code,e.message,e);}
}

async function sincronizarTiendaFirebase(){
 try{
   const datosTienda={
    nombreTienda: localStorage.getItem("nombreTienda")||"",
    contactoTienda: localStorage.getItem("contactoTienda")||"",
    mensajeTienda: localStorage.getItem("mensajeTienda")||"",
    mensajeTicket: localStorage.getItem("mensajeTicket")||"",
    claveAdmin: localStorage.getItem("claveAdmin")||"1234",
    logo: localStorage.getItem("logoTienda") || "",
    logoURL: localStorage.getItem("logoTiendaURL") || localStorage.getItem("logoURL") || "",
    // No borrar el logo PWA existente si este dispositivo no lo tiene cargado
    logoPWA: localStorage.getItem("logoPWA") || null,
    actualizado: Date.now()
   };
   console.log("Enviando tienda a Firebase:", datosTienda);
   Object.keys(datosTienda).forEach(k=>{
      if(datosTienda[k]===undefined || datosTienda[k]==="" || datosTienda[k]===null){
         delete datosTienda[k];
      }
    });
   await cloudDB.collection("configuracion").doc("tienda").set(datosTienda,{merge:true});
   console.log("Tienda guardada en Firebase correctamente");
   return true;
 }catch(e){console.error("Firebase tienda:",e); throw e;}
}


// Cargar configuracion de tienda desde Firebase al iniciar
async function cargarTiendaDesdeFirebase(){
 try{
   const doc = await cloudDB.collection("configuracion").doc("tienda").get();
   if(doc.exists){
     const t = doc.data();

     if(t.nombreTienda!==undefined) localStorage.setItem("nombreTienda", t.nombreTienda);
     if(t.contactoTienda!==undefined) localStorage.setItem("contactoTienda", t.contactoTienda);
     if(t.mensajeTienda!==undefined) localStorage.setItem("mensajeTienda", t.mensajeTienda);
     if(t.mensajeTicket!==undefined) localStorage.setItem("mensajeTicket", t.mensajeTicket);
     if(t.claveAdmin!==undefined) localStorage.setItem("claveAdmin", t.claveAdmin);
     if(t.logo!==undefined) { localStorage.setItem("logoTienda", t.logo); }
     if(t.logoURL!==undefined) { 
        localStorage.setItem("logoTiendaURL", t.logoURL); 
        localStorage.setItem("logoURL", t.logoURL); 
     }
     if(t.logoPWA!==undefined) {
        localStorage.setItem("logoPWA", t.logoPWA);
        actualizarManifestDesdeFirebase();
     }

     console.log("Tienda cargada desde Firebase");
   }
 }catch(e){
   console.error("Firebase cargar tienda ERROR:", e);
 }
}

window.addEventListener("load",()=>{
 setTimeout(()=>{ cargarTiendaDesdeFirebase(); },300);
 setTimeout(()=>{
   sincronizarTiendaFirebase();
   sincronizarProductosFirebase();
 },1000);
});





async function actualizarProductoFirebase(producto){
 try{
   await cloudDB.collection("productos").doc(String(producto.id)).set(producto,{merge:true});
   console.log("Producto actualizado en Firebase:", producto.id);
 }catch(e){
   console.error("Firebase actualizar producto ERROR:", e.code, e.message, e);
   throw e;
 }
}

async function eliminarProductoFirebase(id){
 try{
   await cloudDB.collection("productos").doc(String(id)).delete();
   console.log("Producto eliminado de Firebase:", id);
 }catch(e){
   console.error("Firebase eliminar producto ERROR:", e.code, e.message, e);
   throw e;
 }
}

// ---------------- PEDIDOS FIREBASE V16 ----------------

async function sincronizarPedidoFirebase(pedido){
 try{
   await cloudDB.collection("pedidos").doc(pedido.numero).set(pedido);
   console.log("Pedido guardado en Firebase");
 }catch(e){
   console.log("Firebase pedido:",e);
 }
}

async function cargarPedidosFirebase(){
 try{
   let snap=await cloudDB.collection("pedidos").get();
   let pedidos=[];
   snap.forEach(doc=>pedidos.push(doc.data()));
   if(pedidos.length){
      localStorage.setItem("pedidos",JSON.stringify(pedidos));
   }
 }catch(e){
   console.log("Cargar pedidos Firebase:",e);
 }
}

async function actualizarEstadoPedidoFirebase(pedido){
 try{
   await cloudDB.collection("pedidos").doc(pedido.numero).set(pedido);
 }catch(e){
   console.log("Actualizar pedido:",e);
 }
}


// ---------------- LOGO FIREBASE STORAGE V23 ----------------
async function subirLogoFirebase(dataURL){
 try{
   if(!dataURL) return "";
   localStorage.setItem("logoTienda", dataURL);
   await cloudDB.collection("configuracion").doc("tienda").set({
      logo: dataURL,
      actualizado: Date.now()
   }, {merge:true});
   console.log("Logo guardado en Firestore");
   return dataURL;
 }catch(e){
   console.error("Logo Firebase ERROR:",e);
   return "";
 }
}


// ---------------- SINCRONIZACION MULTIDISPOSITIVO V32 ----------------
async function cargarProductosDesdeFirebase(){
 try{
   const snap = await cloudDB.collection("productos").get();
   let productos=[];
   let eliminados = JSON.parse(localStorage.getItem("productosEliminados") || "[]");

   snap.forEach(doc=>{
      const producto = doc.data();
      if(!eliminados.includes(producto.id)){
         productos.push(producto);
      }
   });

   localStorage.setItem("productos", JSON.stringify(productos));
   console.log("Productos descargados desde Firebase:", productos.length);
   if(typeof cargarProductos === "function") cargarProductos();
   if(typeof cargarInicio === "function" && !cargandoInicioFirebase) cargarInicio();
 }catch(e){
   console.error("Error cargando productos Firebase:", e);
 }
}

async function cargarTiendaDesdeFirebase(){
 try{
   const doc = await cloudDB.collection("configuracion").doc("tienda").get();
   if(doc.exists){
      const t=doc.data();
      Object.keys(t).forEach(k=>{
        if(t[k]!==undefined) localStorage.setItem(k,t[k]);
      });
      if(t.logoURL){
        localStorage.setItem("logoURL", t.logoURL);
        localStorage.setItem("logoTienda", t.logoURL);
      }
      console.log("Tienda descargada desde Firebase");
      if(typeof cargarInicio === "function") cargarInicio();
   }
 }catch(e){
   console.error("Error cargando tienda Firebase:",e);
 }
}


// Cargar configuracion de tienda desde Firebase al iniciar
async function cargarTiendaDesdeFirebase(){
 try{
   const doc = await cloudDB.collection("configuracion").doc("tienda").get();
   if(doc.exists){
     const t = doc.data();

     if(t.nombreTienda!==undefined) localStorage.setItem("nombreTienda", t.nombreTienda);
     if(t.contactoTienda!==undefined) localStorage.setItem("contactoTienda", t.contactoTienda);
     if(t.mensajeTienda!==undefined) localStorage.setItem("mensajeTienda", t.mensajeTienda);
     if(t.mensajeTicket!==undefined) localStorage.setItem("mensajeTicket", t.mensajeTicket);
     if(t.claveAdmin!==undefined) localStorage.setItem("claveAdmin", t.claveAdmin);
     if(t.logo!==undefined) { localStorage.setItem("logoTienda", t.logo); }
     if(t.logoURL!==undefined) { 
        localStorage.setItem("logoTiendaURL", t.logoURL); 
        localStorage.setItem("logoURL", t.logoURL); 
     }
     if(t.logoPWA!==undefined) {
        localStorage.setItem("logoPWA", t.logoPWA);
        actualizarManifestDesdeFirebase();
     }

     console.log("Tienda cargada desde Firebase");
   }
 }catch(e){
   console.error("Firebase cargar tienda ERROR:", e);
 }
}

window.addEventListener("load",()=>{
 setTimeout(()=>{ cargarTiendaDesdeFirebase(); },300);
 setTimeout(()=>{
   cargarProductosDesdeFirebase();
   cargarTiendaDesdeFirebase();
 },1500);
});


async function subirLogoPWAFirebase(file){
 try{
   const ref = cloudStorage.ref("tienda/logoPWA_"+Date.now()+"_"+file.name);
   await ref.put(file);
   const url = await ref.getDownloadURL();
   localStorage.setItem("logoPWA", url);

   await cloudDB.collection("configuracion").doc("tienda").set({
      logoPWA:url,
      logoURLPWA:url,
      actualizado:Date.now()
   },{merge:true});

   // mantener sincronizada la configuración local y el manifest
   localStorage.setItem("logoPWA", url);
   actualizarManifestDesdeFirebase();

   return url;
 }catch(e){
   console.error("Logo PWA Firebase:",e);
   throw e;
 }
}
