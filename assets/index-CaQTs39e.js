var f=Object.defineProperty;var u=(h,t,e)=>t in h?f(h,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):h[t]=e;var r=(h,t,e)=>u(h,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();class c{constructor(t,e){r(this,"x",0);r(this,"y",0);this.x=t,this.y=e}}class g{constructor(t,e){r(this,"x",0);r(this,"y",0);r(this,"w",0);r(this,"h",0);r(this,"r",0);r(this,"color","");r(this,"name","H");r(this,"mergedName","H2");r(this,"isMergedFlag",!1);r(this,"vx",0);r(this,"vy",0);this.sw=t,this.sh=e}initializeDrawingProperties(t){const s=document.createElement("canvas").getContext("2d");if(!s)throw new Error("Failed to get canvas 2D context");const i=24*this.getScale();s.font=`${i}px sans-serif`;const n=s.measureText(this.getName()).width;this.x=t.x,this.y=t.y,this.w=n,this.h=n,this.r=n/2,this.color=this.getColor()}getName(){return this.isMergedFlag?this.mergedName:this.name}getX(){return this.x}getY(){return this.y}getRadius(){return this.r}render(t){t.textAlign="center",t.textBaseline="middle",t.fillStyle=this.color,t.shadowColor="#888",t.shadowOffsetX=1,t.shadowOffsetY=1,t.shadowBlur=1;const e=24*this.getScale();if(t.font=`${e}px sans-serif`,this.isMergedFlag){t.fillText("H",this.x-this.w/2,this.y);const s=18*this.getScale();t.font=`${s}px sans-serif`,t.fillText("2",this.x,this.y+2);return}t.fillText(this.getName(),this.x,this.y)}updatePosition(){const t=2*Math.PI*Math.random(),e=.075;this.vx+=e*Math.cos(t),this.vy+=e*Math.sin(t);const s=1.05,i=Math.sqrt(this.vx**2+this.vy**2);i>s&&(this.vx=this.vx/i*s,this.vy=this.vy/i*s),this.x+=this.vx,this.y+=this.vy,this.x>this.sw+this.w/2&&(this.x=-(this.w/2)),this.x+this.w<0&&(this.x=this.sw+this.w/2),this.y>this.sh+this.h/2&&(this.y=-(this.h/2)),this.y+this.h<0&&(this.y=this.sh+this.h/2)}isHit(t){if(t.isMerged())return!1;const e=t.getX()-this.x,s=t.getY()-this.y,i=Math.sqrt(e*e+s*s),n=this.r+t.getRadius();return i<n}isMerged(){return this.isMergedFlag}mergeAndRender(t,e){this.isMergedFlag=!0,this.initializeDrawingProperties(e),this.render(t)}getColor(){return this.isMergedFlag?this.color:`#${Math.random().toString(16).slice(-6)}`}getScale(){return this.sw<768?1:1.2}}class m{constructor(t,e){r(this,"x",0);r(this,"y",0);r(this,"w",0);r(this,"isDeletedFlag",!1);this.sw=t,this.sh=e}initializeDrawingProperties(t){const e=(Math.random()*10+18)*this.getScale();this.x=t.x,this.y=t.y,this.w=e}getX(){return this.x}getY(){return this.y}updatePosition(){const t=Math.random()*5;this.x+=Math.cos((this.y+t)/100),this.y+=this.w*.1,this.y>=this.sh&&(this.isDeletedFlag=!0)}render(t){const e=this.w*.4,s=this.x-e,i=this.y-e,n=this.w/2+e,o=t.createRadialGradient(s,i,0,s,i,n);o.addColorStop(0,"rgba(255, 255, 255, 0.6)"),o.addColorStop(1,"rgba(0, 127, 255, 1)"),t.beginPath(),t.arc(this.x,this.y,this.w/2,0,Math.PI*2,!0),t.shadowColor="#007fff",t.shadowOffsetX=1,t.shadowOffsetY=1,t.fillStyle=o,t.fill(),t.closePath()}isDeleted(){return this.isDeletedFlag}getScale(){return this.sw<768?1:1.2}}class w{constructor(t,e){r(this,"x",0);r(this,"y",0);r(this,"w",0);r(this,"h",0);r(this,"r",0);r(this,"color","");r(this,"name","O");r(this,"vx",0);r(this,"vy",0);this.sw=t,this.sh=e}initializeDrawingProperties(t){const s=document.createElement("canvas").getContext("2d");if(!s)throw new Error("Failed to get canvas 2D context");const i=24*this.getScale();s.font=`${i}px sans-serif`;const n=s.measureText(this.getName()).width;this.x=t.x,this.y=t.y,this.w=n,this.h=n,this.r=n/2,this.color=this.getColor()}getName(){return this.name}getX(){return this.x}getY(){return this.y}getRadius(){return this.r}updatePosition(){const t=2*Math.PI*Math.random(),e=.075;this.vx+=e*Math.cos(t),this.vy+=e*Math.sin(t);const s=1.05,i=Math.sqrt(this.vx**2+this.vy**2);i>s&&(this.vx=this.vx/i*s,this.vy=this.vy/i*s),this.x+=this.vx,this.y+=this.vy,this.x>this.sw+this.w/2&&(this.x=-(this.w/2)),this.x+this.w<0&&(this.x=this.sw+this.w/2),this.y>this.sh+this.h/2&&(this.y=-(this.h/2)),this.y+this.h<0&&(this.y=this.sh+this.h/2)}render(t){t.textAlign="center",t.textBaseline="middle";const e=24*this.getScale();t.font=`${e}px sans-serif`,t.fillStyle=this.color,t.shadowColor="#888",t.shadowOffsetX=1,t.shadowOffsetY=1,t.shadowBlur=1,t.fillText(this.getName(),this.x,this.y)}isHit(t){if(!t.isMerged())return!1;const e=t.getX()-this.x,s=t.getY()-this.y,i=Math.sqrt(e*e+s*s),n=this.r+t.getRadius();return i<n}getColor(){return`#${Math.random().toString(16).slice(-6)}`}getScale(){return this.sw<768?1:1.2}}class y{constructor(){r(this,"h",[]);r(this,"o",[]);r(this,"h2o",[]);r(this,"cw");r(this,"ch");r(this,"ctx");r(this,"bufferCanvas");r(this,"bufferCtx");const t=document.querySelector("#myCanvas");if(!t)throw new Error("Canvas element not found");t.width=window.innerWidth,t.height=window.innerHeight,this.cw=t.width,this.ch=t.height;const e=t.getContext("2d");if(!e)throw new Error("Canvas context not available");this.ctx=e,this.bufferCanvas=document.createElement("canvas"),this.bufferCanvas.width=this.cw,this.bufferCanvas.height=this.ch;const s=this.bufferCanvas.getContext("2d");if(!s)throw new Error("Buffer canvas context not available");this.bufferCtx=s}init(t,e){for(let s=0;s<t;s++)this.h.push(this.createHAtom());for(let s=0;s<e;s++)this.o.push(this.createOAtom())}renderFrame(){this.bufferCtx.fillStyle="#fff",this.bufferCtx.fillRect(0,0,this.cw,this.ch),this.renderH(this.h),this.renderO(this.o,this.h,this.h2o),this.renderH2o(this.h2o),this.ctx.drawImage(this.bufferCanvas,0,0)}getScale(){return this.cw<768?1:this.cw>=768&&this.cw<1280?1.2:1.5}getHLength(){return this.h.length}getOLength(){return this.o.length}getH2oLength(){return this.h2o.length}createHAtom(){const t=this.cw*Math.random(),e=this.ch*Math.random(),s=new g(this.cw,this.ch);return s.initializeDrawingProperties(new c(t,e)),s}createOAtom(){const t=this.cw*Math.random(),e=this.ch*Math.random(),s=new w(this.cw,this.ch);return s.initializeDrawingProperties(new c(t,e)),s}createH2oAtom(t){const e=new m(this.cw,this.ch);return e.initializeDrawingProperties(t),e}renderH(t){for(let e=0;e<t.length;e++){const s=t[e];if(s.updatePosition(),s.render(this.bufferCtx),!s.isMerged())for(let i=e+1;i<t.length;i++){const n=t[i];if(s.isHit(n)){s.mergeAndRender(this.bufferCtx,new c(s.getX(),s.getY())),t[i]=this.createHAtom();break}}}}renderO(t,e,s){for(const i of t){i.updatePosition(),i.render(this.bufferCtx);for(const n of e){if(!i.isHit(n))continue;const o=t.indexOf(i);o>=0&&(t[o]=this.createOAtom());const d=e.indexOf(n);d>=0&&(e[d]=this.createHAtom()),s.push(this.createH2oAtom(new c(i.getX(),i.getY())))}}}renderH2o(t){for(let e=t.length-1;e>=0;e--){const s=t[e];if(s.updatePosition(),s.isDeleted()){t.splice(e,1);continue}s.render(this.bufferCtx)}}}const a=class a{constructor(){r(this,"measurement");r(this,"values",[]);r(this,"frameCnt",1);r(this,"elapsedTime",0);r(this,"timeStr","");this.measurement=document.createElement("div"),this.measurement.style.position="absolute",this.measurement.style.top="0px",this.measurement.style.color="aqua",this.measurement.style.backgroundColor="rgba(0, 0, 0, 0.5)",this.measurement.style.padding="3px 5px",document.body.appendChild(this.measurement)}static factory(){return a.instance||(a.instance=new a),a.instance}measure(t,e=""){const s=performance.now();t();const i=performance.now();return this.elapsedTime+=Math.floor(i)-Math.floor(s),this.frameCnt===1||this.frameCnt%60===0?(this.timeStr=(this.elapsedTime/this.frameCnt).toPrecision(4),this.add(`${this.timeStr}ms`)):this.add(`${e}${this.timeStr}ms`),this.frameCnt++,this}add(t){return this.values.push(t),this}render(){this.measurement.innerText=this.values.join(`
`),this.values.length=0}};r(a,"instance",null);let l=a;const x=window.location.search,p=new URLSearchParams(x),v=p.get("m")==="1";window.addEventListener("DOMContentLoaded",()=>{const h=new y,t=h.getScale();h.init(30*t,50*t);const e=()=>{v?l.factory().measure(()=>h.renderFrame()).add(`H: ${h.getHLength()}`).add(`O: ${h.getOLength()}`).add(`H2o: ${h.getH2oLength()}`).render():h.renderFrame(),requestAnimationFrame(e)};e()});
