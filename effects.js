/* Birthday overlay v13 — multi-origin fireworks composed entirely of tiny colored hearts.
   Uses capped particles, 30fps, stops when hidden/overlay open, honors reduced motion. */
(() => {
 'use strict';
 const canvas=document.getElementById('celebration-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const colors=['#c45694','#399bd0','#d79a30','#865fc0','#45b290','#db7376','#bb62ab'];
 const sprites=colors.map(color=>{
   const c=document.createElement('canvas');c.width=c.height=36;
   const g=c.getContext('2d');
   g.save();g.translate(18,18);g.scale(1.12,1.12);
   g.shadowColor=color;g.shadowBlur=5.5;g.fillStyle=color;
   g.beginPath();g.moveTo(0,10);
   g.bezierCurveTo(-2,8,-12,-1,-10,-6);
   g.bezierCurveTo(-8,-12,-2,-12,0,-7);
   g.bezierCurveTo(2,-12,8,-12,10,-6);
   g.bezierCurveTo(12,-1,2,8,0,10);g.fill();
   g.shadowBlur=0;g.globalAlpha=.60;g.fillStyle='#ffffff';
   g.beginPath();g.ellipse(-4,-5,2.1,1.1,-.50,0,Math.PI*2);g.fill();g.restore();
   return c;
 });
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 let W=0,H=0,dpr=1,enabled=!motion.matches,hidden=document.hidden,overlayOpen=false;
 let run=false,raf=0,last=0,nextLaunch=0,nextFloat=0;
 let launches=0, bursts=0, maxObserved=0;
 const rockets=[],hearts=[],recent=[];
 const maxHearts=()=>W<620?330:W<1050?480:730;
 const burstCount=()=>W<620?62:W<1050?82:108;
 function resize(){W=window.innerWidth;H=window.innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
   canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);}
 function heart(x,y,diameter,idx,alpha){
   const sprite=sprites[idx%colors.length];ctx.globalAlpha=alpha;
   ctx.drawImage(sprite,x-diameter*.5,y-diameter*.5,diameter,diameter);
 }
 function launchAt(x,y){
   if(rockets.length>=5)return;
   const col=Math.floor(rnd(0,colors.length));
   const ox=clamp(x+rnd(-W*.10,W*.10),12,W-12);
   rockets.push({sx:ox,sy:H+rnd(5,55),x:ox,y:H,tx:x,ty:y,age:0,flight:rnd(.53,.94),color:col});
   launches++;
 }
 function randomLaunch(){
   const x=rnd(W*.07,W*.93),y=rnd(H*.13,H*.65);
   launchAt(x,y);
   // Separate second burst in a distinct zone, never duplicate the same spot.
   if(W>720&&Math.random()<.47){
     const otherX=x<W*.5?rnd(W*.60,W*.93):rnd(W*.07,W*.40);
     launchAt(otherX,rnd(H*.14,H*.57));
   }
 }
 function explode(x,y,base){
   bursts++;recent.push({x:Math.round(x),y:Math.round(y),time:Math.round(performance.now()),color:base});
   if(recent.length>18)recent.shift();
   const count=burstCount(),remaining=Math.max(0,maxHearts()-hearts.length);
   for(let i=0;i<Math.min(count,remaining);i++){
     const a=i/count*Math.PI*2+rnd(-.07,.07),spd=rnd(38,128);
     hearts.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,age:0,life:rnd(1.2,2.1),
       size:rnd(W<620?3.0:3.2,W<620?5.7:6.5), color:(base+(i%7===0?2:i%5===0?1:0))%colors.length,
       phase:rnd(0,6.28),spin:rnd(-3,3)});
   }
   maxObserved=Math.max(maxObserved,hearts.length);
 }
 function update(dt){
   for(let i=rockets.length-1;i>=0;i--){const p=rockets[i];p.age+=dt;
     const u=clamp(p.age/p.flight,0,1),ease=1-(1-u)*(1-u);
     p.x=p.sx+(p.tx-p.sx)*ease;p.y=p.sy+(p.ty-p.sy)*ease;
     if(u>=1){explode(p.tx,p.ty,p.color);rockets.splice(i,1);}
   }
   for(let i=hearts.length-1;i>=0;i--){const h=hearts[i];h.age+=dt;
     if(h.age>=h.life){hearts.splice(i,1);continue;}
     h.x+=h.vx*dt;h.y+=h.vy*dt;h.vx*=Math.pow(.93,dt*30);
     h.vy+=20*dt;
   }
 }
 function render(t){
   ctx.clearRect(0,0,W,H);
   for(const p of rockets){
     // Tiny colored hearts along the ascending trail — no circular sparks.
     heart(p.x,p.y,5.0,p.color,.80);
     heart(p.x+(p.sx-p.x)*.06,p.y+(p.sy-p.y)*.07,3.6,(p.color+1)%colors.length,.25);
   }
   for(const h of hearts){const u=h.age/h.life;
     const a=clamp(Math.min(u*7,(1-u)*2.0)*(.77+.17*Math.sin(t*.003*2+h.phase)),0,.88);
     if(a>0){const size=h.size*(.85+.12*Math.sin(t*.003*2.6+h.phase));heart(h.x,h.y,size,h.color,a);}
   }
   ctx.globalAlpha=1;
 }
 function tick(ms){if(!run)return;raf=requestAnimationFrame(tick);
   if(ms-last<32)return;
   const dt=clamp((ms-last)/1000,0,.05);last=ms;
   if(!enabled||hidden||overlayOpen)return;
   if(ms>=nextLaunch){randomLaunch();nextLaunch=ms+rnd(W<620?780:570,W<620?1330:1050);}
   if(ms>=nextFloat){
     const count=Math.max(0,Math.min(2,maxHearts()-hearts.length));
     for(let i=0;i<count;i++)hearts.push({x:rnd(0,W),y:H+8,vx:rnd(-10,10),vy:rnd(-36,-21),age:0,life:rnd(4.5,7),size:rnd(3,5.5),color:Math.floor(rnd(0,colors.length)),phase:rnd(0,6.28)});
     nextFloat=ms+rnd(850,1800);
   }
   update(dt);render(ms);
 }
 function start(){if(run||!enabled||hidden||overlayOpen)return;run=true;last=performance.now();nextLaunch=last+170;nextFloat=last+500;raf=requestAnimationFrame(tick);}
 function stop(){run=false;cancelAnimationFrame(raf);ctx.clearRect(0,0,W,H);rockets.length=0;hearts.length=0;}
 function toggleUI(){const b=document.getElementById('effect-toggle');if(b){b.setAttribute('aria-pressed',String(enabled));b.textContent=motion.matches?'✦ Giảm chuyển động':`✦ Hiệu ứng: ${enabled?'Bật':'Tắt'}`;}}
 document.getElementById('effect-toggle')?.addEventListener('click',()=>{
   if(motion.matches)return;enabled=!enabled;toggleUI();if(enabled)start();else stop();
 });
 document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden)stop();else start();});
 window.addEventListener('resize',resize,{passive:true});
 motion.addEventListener?.('change',()=>{enabled=!motion.matches;toggleUI();if(enabled)start();else stop();});
 function manualBurst(x,y){if(!enabled||hidden||overlayOpen)return;explode(x,y,Math.floor(rnd(0,colors.length)));start();}
 resize();toggleUI();start();
 window.BIRTHDAY_EFFECTS={heartBurst(x,y){manualBurst(x,y);},celebrate(){for(let i=0;i<3;i++)randomLaunch();},
   setColor(){},get color(){return '#db85be'},
   setOverlayOpen(value){overlayOpen=Boolean(value);if(overlayOpen)stop();else start();},
   getDebug(){return {launches,bursts,rocketCount:rockets.length,heartCount:hearts.length,maxObserved,recent:[...recent],maxHeartPx:W<620?5.7:6.5,cap:maxHearts()};}
 };
})();
