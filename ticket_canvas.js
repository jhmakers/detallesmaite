function imprimirTicketCanvas(){

const pedido = JSON.parse(localStorage.getItem("ultimoPedido") || "{}");
const tienda = localStorage.getItem("nombreTienda") || "TIENDA";
const logo = localStorage.getItem("logoTienda") || "";
const contacto = localStorage.getItem("contactoTienda") || "";
const mensajeTienda = localStorage.getItem("mensajeTicket") || "";

const ancho = 576;
let altura = 900;

const mensaje = String(pedido.mensajePedido || "");
const maxCaracteres = 32;

function dividirTexto(texto){
    let resultado=[];
    const limpio=String(texto||"").replace(/\r/g,"");
    const bloques=limpio.split("\n");
    bloques.forEach(bloque=>{
        let linea="";
        bloque.split(/\s+/).forEach(p=>{
            if(!p) return;
            const prueba=linea ? linea+" "+p : p;
            if(prueba.length > maxCaracteres){
                if(linea.trim()) resultado.push(linea.trim());
                linea=p;
            }else{
                linea=prueba;
            }
        });
        if(linea.trim()) resultado.push(linea.trim());
    });
    return resultado;
}

const lineasMensaje = dividirTexto("MENSAJE: " + mensaje);
altura += Math.max(0,lineasMensaje.length)*45 + 200;

const canvas=document.createElement("canvas");
canvas.width=ancho;
canvas.height=altura;

const ctx=canvas.getContext("2d");
ctx.fillStyle="#fff";
ctx.fillRect(0,0,ancho,altura);

let y=60;

function texto(t,size=28,bold=false){
    ctx.textAlign="center";
    ctx.fillStyle="#000";
    ctx.font=(bold?"bold ":"")+size+"px Arial";
    ctx.fillText(String(t||""),288,y);
    y+=size+18;
}

function linea(){
    ctx.textAlign="center";
    ctx.font="28px monospace";
    ctx.fillText("--------------------------------",288,y);
    y+=35;
}

function dato(nombre,valor){
    ctx.textAlign="left";
    ctx.font="26px monospace";
    ctx.fillText(nombre+": "+String(valor||""),30,y);
    y+=45;
}

function datoLargo(nombre,valor){
    const texto=String(valor||"");
    const lineas=dividirTexto(texto);
    ctx.textAlign="left";
    ctx.font="26px monospace";
    ctx.fillText(nombre+":",30,y);
    y+=40;
    lineas.forEach(l=>{
        ctx.fillText(l,55,y);
        y+=40;
    });
}

function generar(){

texto(tienda,34,true);
linea();
texto("BOLETA DE PEDIDO",28,true);
linea();

dato("N° PEDIDO",pedido.numero);
dato("CLIENTE",pedido.cliente);
dato("PRODUCTO",pedido.producto);
dato("CODIGO",pedido.codigo);
dato("PRECIO UNIT.","S/. "+pedido.precio);
dato("CANTIDAD",pedido.cantidad || 1);
dato("TOTAL","S/. "+(pedido.total || pedido.subtotal || pedido.precio));
dato("ANTICIPO","S/. "+pedido.anticipo);
dato("SALDO","S/. "+(pedido.saldo || 0));
dato("FECHA PEDIDO",pedido.fechaPedido);
dato("FECHA ENTREGA",pedido.fechaEntrega);

linea();

datoLargo("MENSAJE",pedido.mensajePedido);
dato("CONTACTO",contacto);

if(mensajeTienda) texto(mensajeTienda,24,false);

linea();
texto("GRACIAS POR SU COMPRA",28,true);
texto("VUELVA PRONTO",26,true);

canvas.toBlob(async blob=>{
 const archivo=new File([blob],"ticket-80mm.png",{type:"image/png"});
 try{
  if(navigator.share && navigator.canShare({files:[archivo]})){
    await navigator.share({files:[archivo]});
  }else{
    const a=document.createElement("a");
    a.href=canvas.toDataURL("image/png");
    a.download="ticket-80mm.png";
    a.click();
  }
 }catch(e){console.log(e);}
},"image/png",1);
}

if(logo){
 const img=new Image();
 img.onload=function(){
   ctx.drawImage(img,158,20,260,160);
   y=210;
   generar();
 };
 img.src=logo;
}else{
 generar();
}

}
