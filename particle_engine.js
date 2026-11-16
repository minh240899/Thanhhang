
/* Birthday Particle Engine v12 | More SMALL twinkling particles, clear raster-sampled 25 candles and real 3D projection.
   Same particle set morphs through cake -> heart -> text with gentle spin and breathing motion. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), canvas=$('art');
  if (!canvas) return;
  const g=canvas.getContext('2d',{alpha:true}); if(!g)return;
  const PI=Math.PI,TAU=2*PI,rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const embedded=document.body.classList.contains('embedded');
  let W=innerWidth,H=innerHeight,DPR=1,scale=160,clock=0,startScene=0,lastFrame=0,elapsedFrames=0,frameNumber=0,slowDuration=0,measuredFps=60;
  let particles=[],targets={cake:[],heart:[],text:[]},sprites=[],rockets=[],sparks=[],stars=[];
  let density=innerWidth<500?5100:innerWidth<900?8800:11400,stage='cake',automatic=true,paused=reduce.matches||document.hidden,hidden=document.hidden,stageVisible=true,speed=1,twinkle=.65;
  let mouse={x:0,y:0,active:false};
  const COLOR_THEMES=[
    {name:'Xanh lam',rgb:[71,138,215]},
    {name:'Tím lavender',rgb:[153,117,197]},
    {name:'Hồng phấn',rgb:[205,129,164]}
  ];
  const COLOR_HOLD_SECONDS=3.0, COLOR_TRANSITION_SECONDS=1.25, COLOR_FRAMES=24;
  const FIREWORK_COLORS=[[255,108,176],[105,211,255],[255,199,87],[179,130,255],[122,245,190],[255,146,115]];
  const stageDuration={cake:5,heart:4,text:3};
  const labels={cake:'Bánh kem 3D · Nến số 25',heart:'Trái tim 3D bằng hạt sáng',text:'Thanh Hằng 2011 bằng hạt sáng'};
  function heartEquation(t){return {x:16*Math.sin(t)**3/17.2,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17.2};}
  const lerp=(a,b,u)=>a+(b-a)*u;
  const mixRGB=(a,b,u)=>a.map((v,j)=>Math.round(lerp(v,b[j],u)));
  function particleSprite(rgb){
    const c=document.createElement('canvas');c.width=c.height=44;
    const q=c.getContext('2d');const gr=q.createRadialGradient(22,22,.6,22,22,22);
    const tint=(alpha)=>`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    gr.addColorStop(0,'rgba(255,255,255,.98)');
    gr.addColorStop(.08,tint(.94));gr.addColorStop(.24,tint(.72));
    gr.addColorStop(.56,tint(.18));gr.addColorStop(1,tint(0));
    q.fillStyle=gr;q.fillRect(0,0,44,44);return c;
  }
  sprites=COLOR_THEMES.map((theme,i)=>Array.from({length:COLOR_FRAMES+1},(_,step)=>particleSprite(mixRGB(theme.rgb,COLOR_THEMES[(i+1)%COLOR_THEMES.length].rgb,step/COLOR_FRAMES))));
  // Hạt số 25 có tông đậm đồng bộ, tránh bị lẫn với bánh nền sáng (không dùng chữ đổ màu phẳng).
  const DIGIT_THEMES=[[25,86,163],[85,48,145],[146,44,91]];
  const digitSprites=DIGIT_THEMES.map((color,i)=>Array.from({length:COLOR_FRAMES+1},(_,k)=>
    particleSprite(mixRGB(color,DIGIT_THEMES[(i+1)%DIGIT_THEMES.length],k/COLOR_FRAMES))));
  const flameSprite=particleSprite([239,141,46]);
  function colorAt(t){
    const slot=COLOR_HOLD_SECONDS+COLOR_TRANSITION_SECONDS;
    const index=Math.floor(t/slot)%COLOR_THEMES.length;
    const elapsed=t%slot;
    const linear=clamp((elapsed-COLOR_HOLD_SECONDS)/COLOR_TRANSITION_SECONDS,0,1);
    const blend=linear*linear*(3-2*linear);
    const step=Math.round(blend*COLOR_FRAMES);
    return {index,step,name:COLOR_THEMES[index].name,rgb:mixRGB(COLOR_THEMES[index].rgb,COLOR_THEMES[(index+1)%COLOR_THEMES.length].rgb,blend),holding:elapsed<COLOR_HOLD_SECONDS};
  }
  function target(x,y,z,kind='fill',c=0){return {x,y,z,kind,c};}
  // --- SỐ 25 RÕ NÉT: lấy mẫu glyph dày, mỗi pixel -> một điểm ĐÍCH 3D.
  // Không vẽ text trực tiếp vào canvas chính: số 25 vẫn được tạo HOÀN TOÀN bằng particle.
  function buildNumber25(){
    const off=document.createElement('canvas'); off.width=560;off.height=360;
    const c=off.getContext('2d',{willReadFrequently:true});
    c.fillStyle='#fff';c.textBaseline='middle';c.textAlign='center';
    c.font='900 270px Arial, "DejaVu Sans", sans-serif';
    c.fillText('25',280,184);
    const raw=c.getImageData(0,0,560,360).data, pts=[];
    const hit=(x,y)=>raw[(y*560+x)*4+3]>140;
    let loX=560,hiX=0,loY=360,hiY=0;
    for(let y=10;y<350;y+=2)for(let x=10;x<550;x+=2){
      if(!hit(x,y)) continue;
      const border=!hit(Math.max(0,x-3),y)||!hit(Math.min(559,x+3),y)||
        !hit(x,Math.max(0,y-3))||!hit(x,Math.min(359,y+3));
      pts.push({x,y,border});
      loX=Math.min(loX,x);hiX=Math.max(hiX,x);loY=Math.min(loY,y);hiY=Math.max(hiY,y);
    }
    if(!pts.length)return [{x:0,y:-.95,border:true}];
    const midX=(loX+hiX)/2;
    return pts.map(p=>({
      x:(p.x-midX)/Math.max(1,hiX-loX)*.91,
      y:-1.39+(p.y-loY)/Math.max(1,hiY-loY)*.67,
      border:p.border
    }));
  }
  const numberPoints=buildNumber25();

  function glyphPoints(){
    const c=document.createElement('canvas');c.width=700;c.height=340;const q=c.getContext('2d',{willReadFrequently:true});
    q.fillStyle='#fff';q.textAlign='center';q.textBaseline='middle';
    q.font='700 84px "Noto Serif", "DejaVu Sans", "Segoe UI", sans-serif';q.fillText('Thanh Hằng',350,120);
    q.font='700 98px "Noto Serif", "DejaVu Sans", "Segoe UI", sans-serif';q.fillText('2011',350,238);
    const raw=q.getImageData(0,0,700,340).data, pts=[],border=[];
    function on(x,y){return x>=0&&y>=0&&x<700&&y<340&&raw[(y*700+x)*4+3]>130;}
    for(let y=26;y<312;y+=3){for(let x=14;x<686;x+=3){if(!on(x,y))continue;
      const v={x:(x-350)/350*1.15,y:(y-170)/175*.88-.03};pts.push(v);
      if(!on(x-3,y)||!on(x+3,y)||!on(x,y-3)||!on(x,y+3))border.push(v);
    }}
    return {pts,border};
  }
  function cakeTarget(i,n){
    const u=(i+.5)/n,theta=rnd(0,TAU),s=Math.sqrt(Math.random());
    if(u<.095){const r=.83+.23*Math.random();return target(r*Math.cos(theta),.69+rnd(-.032,.032),r*.54*Math.sin(theta),'base',7);}
    if(u<.398){
      // Roughly 30% of the cake particles are devoted to the legible 25.
      // Rear and front surfaces make the numerals extruded rather than flat.
      const point=numberPoints[(Math.floor(i*179)+Math.floor(i/7)*23)%numberPoints.length];
      const layer=i%9;
      const z=layer<7?.36:rnd(.07,.15);
      return target(point.x+rnd(-.0025,.0025),point.y+rnd(-.0025,.0025),z,
        point.border?'number-edge':'number',12);
    }
    if(u<.414){const x=Math.random()<.5?-.23:.23;
      return target(x+rnd(-.018,.018),-1.49+rnd(-.035,.065),rnd(.20,.33),'flame',15);
    }
    const upper=u>.72,rx=upper?.58:.85,rz=upper?.45:.59,top=upper?-.51:-.02,bot=upper?-.04:.62;
    const t=Math.random();
    if(t<.18)return target(rx*s*Math.cos(theta),top,rz*s*Math.sin(theta),'icing',upper?0:2);
    if(t<.29)return target(rx*s*Math.cos(theta),bot,rz*s*Math.sin(theta),'icing',upper?0:2);
    if(t<.40)return target(rx*Math.cos(theta),top+rnd(-.03,.03),rz*Math.sin(theta),'trim',1);
    return target(rx*Math.cos(theta),rnd(top,bot),rz*Math.sin(theta),'cake',upper?2:0);
  }
  const heartPolygon=Array.from({length:176},(_,i)=>{const h=heartEquation(i*TAU/176);return {x:h.x*.97,y:h.y*.98-.11}});
  function inHeart(x,y){let inside=false;
    for(let i=0,j=heartPolygon.length-1;i<heartPolygon.length;j=i++){
      const a=heartPolygon[i],b=heartPolygon[j];
      if(((a.y>y)!==(b.y>y)) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }return inside;
  }
  function heartTarget(i,n){
    const u=(i+.4)/n;
    if(u<.035){let a=rnd(0,TAU);return target(Math.cos(a)*.79,1.03+rnd(-.035,.035),Math.sin(a)*.27,'orbit',9);}
    const onEdge=Math.random()<.34;
    if(onEdge){const a=rnd(0,TAU),v=heartEquation(a);
      return target(v.x*.97+rnd(-.016,.016),v.y*.98-.11+rnd(-.016,.016),rnd(-.36,.34),'rim',9);
    }
    // Uniform rejection sampling in the heart silhouette prevents center clumping.
    let x=0,y=0;
    for(let k=0;k<100;k++){x=rnd(-.97,.97);y=rnd(-.87,.99);if(inHeart(x,y))break;}
    const surface=Math.random()<.50?1:-1;
    const z=surface*(.18+.34*Math.max(0,1-Math.abs(x)*.8-Math.abs(y)*.3))+rnd(-.05,.05);
    return target(x,y,z,'heart',3);
  }
  function textTargets(n){
    const glyph=glyphPoints(); const pts=glyph.pts;
    // The lettering is composed only of particles; do not draw flat outline lines.
    if(!pts.length)return Array.from({length:n},()=>target(0,0,0,'text',1));
    // Two readable face layers and sparsely sampled depth between them.
    return Array.from({length:n},(_,i)=>{const v=pts[Math.floor((i+Math.random()*.34)*pts.length/n)%pts.length];
      const z=i%5===0?rnd(-.10,.10):(i%2===0?.10:-.10);
      return target(v.x+rnd(-.006,.006),v.y+rnd(-.006,.006),z,'text',i%7===0?8:1);
    });
  }
  function setViewport(){
    W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.round(W*DPR));canvas.height=Math.max(1,Math.round(H*DPR));g.setTransform(DPR,0,0,DPR,0,0);
    scale=Math.min(W*.42,H*.292,226);
    targets.cake=Array.from({length:density},(_,i)=>cakeTarget(i,density));
    targets.heart=Array.from({length:density},(_,i)=>heartTarget(i,density));
    targets.text=textTargets(density);
    // Không dựng line-frame: viền cũng được tạo bằng các hạt có cùng target shape.
    const older=particles;particles=Array.from({length:density},(_,i)=>{
      const old=older[i],t=targets[stage][i];return old?{...old,tx:t.x,ty:t.y,tz:t.z,kind:t.kind}:
        {x:rnd(-2.7,2.7),y:rnd(-2.2,2.2),z:rnd(-1.8,1.8),vx:rnd(-1.2,1.2),vy:rnd(-1.2,1.2),vz:rnd(-1.2,1.2),tx:t.x,ty:t.y,tz:t.z,kind:t.kind,r:rnd(.48,.91),seed:rnd(0,TAU),blinkRate:rnd(.72,2.40)};
    });
    stars=Array.from({length:Math.min(85,Math.floor(W*H/6200))},()=>({x:rnd(5,W-5),y:rnd(10,H-10),phase:rnd(0,TAU),r:rnd(.3,1.1)}));
    if($('density-value')) $('density-value').textContent=density.toLocaleString('vi-VN');
    if($('density')) $('density').value=density;
  }
  function newStage(s,withScatter=true){
    stage=s;startScene=clock;
    particles.forEach((p,i)=>{const t=targets[s][i];p.tx=t.x;p.ty=t.y;p.tz=t.z;p.kind=t.kind;
      if(withScatter){
        const swirl=rnd(.40,1.10),a=Math.atan2(p.y,p.x),lift=s==='heart' ? .20 : .13;
        p.vx+=Math.cos(a+PI/2)*swirl;
        p.vz+=Math.sin(a+PI/2)*swirl;
        p.vy+=rnd(-.25,.25)-lift;
      }
    });
    if($('phase')) $('phase').textContent=labels[s];
    if(embedded) parent.postMessage({type:'birthday-particle-phase',label:labels[s]},'*');
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===(automatic?'all':s))));
  }
  function switchMode(s){automatic=s==='all';if($('auto')) $('auto').checked=automatic;newStage(automatic?'cake':s);clock=0;startScene=0;}
  function projection(x,y,z,t){
    const sceneBend = stage==='text' ? .28 : stage==='heart' ? 1.18 : .95;
    const yaw=sceneBend*.36*Math.sin(t*.19)+(stage==='text'?.045:.22)+(mouse.active?mouse.x*.24:0);
    const pitch=(stage==='text'?.018:-.18)+(stage==='text'?.028:.20)*Math.sin(t*.17)+(mouse.active?mouse.y*.12:0);
    const roll=(stage==='text'?.008:.05)*Math.sin(t*.15 + (stage==='heart' ? 1.4 : .2));
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const x1=x*cy+z*sy,z1=z*cy-x*sy;
    const y1=y*cx-z1*sx,z2=y*sx+z1*cx;
    const x2=x1*cr-y1*sr,y2=x1*sr+y1*cr;
    const perspective=4.1/(4.1-z2);
    return {x:W*.5+x2*scale*perspective,y:H*.50+y2*scale*perspective,k:perspective,depth:z2};
  }
  function move(p,dt,t){
    const beat=stage==='heart'?1+.034*Math.sin(t*1.32):1;
    const float=stage==='cake'?.006:stage==='text'?.008:.010;
    const tx=p.tx*beat+float*Math.sin(t*.78+p.seed), ty=p.ty*beat+float*Math.cos(t*.68+p.seed), tz=p.tz*beat + .015*Math.sin(t*.52+p.seed);
    const k=stage==='text'?12.2:stage==='heart'?10.8:13.0, friction=stage==='cake'?5.2:4.8;
    p.vx+=((tx-p.x)*k-p.vx*friction)*dt; p.vy+=((ty-p.y)*k-p.vy*friction)*dt; p.vz+=((tz-p.z)*k-p.vz*friction)*dt;
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
  }
  function drawStageBase(tint,t){
    const cx=W*.5, baseY=H*.67;
    g.save();
    if(stage==='cake'){
      const w=Math.min(W*.34,260), h=Math.min(H*.06,34);
      const glow=g.createRadialGradient(cx,baseY,4,cx,baseY,w*.5);
      glow.addColorStop(0,`rgba(${tint.rgb[0]},${tint.rgb[1]},${tint.rgb[2]},0.40)`);
      glow.addColorStop(.55,`rgba(${tint.rgb[0]},${tint.rgb[1]},${tint.rgb[2]},0.15)`);
      glow.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=glow; g.beginPath(); g.ellipse(cx,baseY,w*.52,h*.92,0,0,TAU); g.fill();
      g.fillStyle='rgba(144,112,122,.11)'; g.beginPath(); g.ellipse(cx,baseY+6,w*.40,h*.40,0,0,TAU); g.fill();
    } else if(stage==='heart'){
      const w=Math.min(W*.26,185), h=Math.min(H*.038,20), bob=3*Math.sin(t*1.25);
      const glow=g.createRadialGradient(cx,baseY+bob,2,cx,baseY+bob,w*.45);
      glow.addColorStop(0,`rgba(${tint.rgb[0]},${tint.rgb[1]},${tint.rgb[2]},0.34)`);
      glow.addColorStop(.72,`rgba(${tint.rgb[0]},${tint.rgb[1]},${tint.rgb[2]},0.10)`);
      glow.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=glow; g.beginPath(); g.ellipse(cx,baseY+bob,w*.5,h,0,0,TAU); g.fill();
    } else {
      const w=Math.min(W*.28,220), h=Math.min(H*.034,18);
      g.fillStyle=`rgba(${tint.rgb[0]},${tint.rgb[1]},${tint.rgb[2]},0.15)`;
      g.beginPath(); g.ellipse(cx,baseY+2,w*.45,h,0,0,TAU); g.fill();
    }
    g.restore();
  }
  function drawHeartDot(x,y,size,color,alpha){
    g.save();
    g.translate(x,y);
    const s=size;
    g.scale(s,s);
    g.fillStyle=`rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    g.beginPath();
    g.moveTo(0,0.35);
    g.bezierCurveTo(0.55,-0.18,0.92,-0.55,0.74,-0.92);
    g.bezierCurveTo(0.56,-1.22,0.16,-1.08,0,-0.78);
    g.bezierCurveTo(-0.16,-1.08,-0.56,-1.22,-0.74,-0.92);
    g.bezierCurveTo(-0.92,-0.55,-0.55,-0.18,0,0.35);
    g.fill();
    g.restore();
  }
  function drawRearFireworks(dt,t,tint){
    // Random, independent multi-color mini-heart fireworks, rendered BEHIND the 3D model.
    drawFireworks(dt,t);
  }
  function particleVisibility(kind,sceneAge,seed){
    let base=0.0;
    if(stage==='cake'){
      if(kind==='number'||kind==='number-edge'||kind==='flame') base=0.02;
      else if(kind==='trim'||kind==='icing'||kind==='base') base=0.10;
      else base=0.60;
    } else if(stage==='heart'){
      if(kind==='rim'||kind==='orbit') base=0.08;
      else base=0.68;
    } else {
      // text: first reveal a sparse outer structure, then the full point cloud
      base=(seed%1<0.28)?0.18:0.74;
    }
    const u=clamp((sceneAge-base)/2.2,0,1);
    return u*u*(3-2*u);
  }
  function drawOne(p,t,i,activeSprite,sceneAge,tint){
    const vis=particleVisibility(p.kind,sceneAge,p.seed);
    if(vis<=0)return;
    const pos=projection(p.x,p.y,p.z,t),kind=p.kind;
    const number=kind==='number'||kind==='number-edge';
    // Điểm nhỏ, không dày hoặc phóng lớn so với V11. Số lượng hạt mới tạo độ phong phú.
    const baseR=kind==='flame'?2.05:number?1.40:kind==='text'?1.40:
      kind==='rim'?1.56:kind==='orbit'?1.62:1.56;
    const r=clamp(baseR*p.r*pos.k*(1+.07*Math.sin(t*.94+p.seed)),.45,3.75);
    // Twinkle độc lập: hạt giữ nguyên màu chủ đạo, chỉ điều biến ánh sáng theo pha.
    const phase=t*(1.2+(p.blinkRate||1.4))+(p.seed*4.17);
    const wave=.5+.5*Math.sin(phase),glint=Math.pow(.5+.5*Math.sin(phase*1.73+p.seed*2.9),15);
    const shimmer=number ? .75+.16*wave+.09*glint : .34+.39*wave+.27*glint;
    const depthLight=clamp(.74+pos.depth*.14,.45,1.15);
    const alpha=clamp(shimmer*depthLight, .15,1)*vis;
    g.globalAlpha=alpha;
    let sprite=activeSprite;
    if(number)sprite=digitSprites[tint.index][tint.step];
    else if(kind==='flame')sprite=flameSprite;
    g.drawImage(sprite,pos.x-r*1.58,pos.y-r*1.58,r*3.16,r*3.16);
    // Rare star-shaped glints are made from tiny light strokes; never a solid glyph outline.
    if((i%47===0||number&&i%79===0) && glint>.87){
      g.globalAlpha=clamp((glint-.83)*3.2,0,.48)*vis;
      g.fillStyle=number?'#fff1cb':'#ffffff';
      g.fillRect(pos.x-1.3,pos.y-.35,2.6,.7);
      g.fillRect(pos.x-.35,pos.y-1.3,.7,2.6);
    }
  }
  const HERO_FIREWORK_MAX=()=>W<480?550:1000;
  const HERO_BURST_COUNT=()=>W<480?112:178;
  function burst(x,y,color=null){
    const palette=color||FIREWORK_COLORS[Math.floor(Math.random()*FIREWORK_COLORS.length)];
    const count=HERO_BURST_COUNT(),room=Math.max(0,HERO_FIREWORK_MAX()-sparks.length);
    for(let i=0;i<Math.min(count,room);i++){
      const a=TAU*i/count+rnd(-.08,.08),radius=rnd(18,74);
      sparks.push({x,y,vx:Math.cos(a)*radius,vy:Math.sin(a)*radius,age:0,
        life:rnd(1.5,2.3),r:rnd(.63,1.18),color:i%7===0?FIREWORK_COLORS[(i+2)%FIREWORK_COLORS.length]:palette});
    }
  }
  function launch(x=W*.5,y=H*.86,tx=rnd(W*.08,W*.92),ty=rnd(H*.12,H*.68),color=null){
    if(rockets.length>=5)return;
    rockets.push({sx:x,sy:y,tx,ty,age:0,life:rnd(.58,.96),color:color||FIREWORK_COLORS[Math.floor(Math.random()*FIREWORK_COLORS.length)]});
  }
  function fireworks(){
    const n=W<480?1:(Math.random()<.5?2:3);
    for(let k=0;k<n;k++){
      let tx=rnd(W*.07,W*.93),ty=rnd(H*.12,H*.68);
      if(k===1)tx=tx<W*.5?rnd(W*.62,W*.94):rnd(W*.06,W*.38);
      launch(rnd(W*.06,W*.94),H+rnd(0,H*.07),tx,ty);
    }
  }
  function drawFireworks(dt,t){
    for(let i=rockets.length-1;i>=0;i--){
      const r=rockets[i];r.age+=dt;
      const u=clamp(r.age/r.life,0,1),ease=1-(1-u)**2;
      const x=r.sx+(r.tx-r.sx)*ease,y=r.sy+(r.ty-r.sy)*ease;
      drawHeartDot(x,y,1.55,r.color,.42);
      if(u>=1){burst(r.tx,r.ty,r.color);rockets.splice(i,1);}
    }
    for(let i=sparks.length-1;i>=0;i--){
      const p=sparks[i];p.age+=dt;const u=p.age/p.life;
      if(u>=1){sparks.splice(i,1);continue;}
      const x=p.x+p.vx*u*.85,y=p.y+p.vy*u*.85+u*u*18;
      drawHeartDot(x,y,p.r*(1-u*.22),p.color,clamp((1-u)*.59,0,.65));
    }
  }
  function drawAmbient(t){
    for(const s of stars){ g.globalAlpha=.10+.08*Math.sin(t*.55+s.phase)**2; g.fillStyle='#d89ab6'; g.fillRect(s.x,s.y,s.r,s.r); }
  }
  let nextRocket=0,lastBroadcastColor='';
  function draw(ms){
    requestAnimationFrame(draw);
    if(hidden||paused||!stageVisible){lastFrame=ms;return;}
    if(!lastFrame){lastFrame=ms;return;}
    if(ms-lastFrame<1000/32)return; // approximately 30 fps, conserve mobile CPU
    let dt=Math.min((ms-lastFrame)/1000,.042); lastFrame=ms; if(dt<=0) return; dt*=speed; clock+=dt;
    elapsedFrames+=dt; frameNumber++;
    if(elapsedFrames>1.5){
      measuredFps=frameNumber/elapsedFrames; frameNumber=0; elapsedFrames=0;
      if($('fps')) $('fps').textContent=`${particles.length.toLocaleString('vi-VN')} hạt 3D · ${Math.round(measuredFps)} FPS`;
      if($('adaptive')?.checked && measuredFps<23 && density>1100){ slowDuration+=1.5; if(slowDuration>4.5){ density=Math.max(1100,Math.round(density*.82/100)*100); setViewport(); slowDuration=0; } }
      else slowDuration=0;
    }
    if(automatic && clock-startScene>=stageDuration[stage]){ newStage(stage==='cake'?'heart':stage==='heart'?'text':'cake'); fireworks(); nextRocket=clock+rnd(.8,1.6); }
    if(clock>nextRocket){ fireworks(); nextRocket=clock+rnd(W<480?1.35:.9,W<480?2.4:1.75); }
    g.clearRect(0,0,W,H); drawAmbient(clock);
    const tint=colorAt(clock), activeSprite=sprites[tint.index][tint.step];
    if(embedded){
      const hex='#'+tint.rgb.map(n=>n.toString(16).padStart(2,'0')).join('');
      if(hex!==lastBroadcastColor){ lastBroadcastColor=hex; parent.postMessage({type:'birthday-particle-palette',color:hex},'*'); }
    }
    if($('color-mode')) $('color-mode').textContent=tint.holding?`${tint.name} · 3 giây`:`${tint.name} → ${COLOR_THEMES[(tint.index+1)%COLOR_THEMES.length].name}`;
    drawRearFireworks(dt,clock,tint);
    drawStageBase(tint,clock);
    const sceneAge=clock-startScene;
    for(let i=0;i<particles.length;i++){ const p=particles[i]; move(p,dt,clock); drawOne(p,clock,i,activeSprite,sceneAge,tint); }
    g.globalAlpha=1; g.globalCompositeOperation='source-over';
  }
  function resume(b){ paused=!b; if($('pause')){$('pause').textContent=b?'Ⅱ Tạm dừng':'▶ Tiếp tục';$('pause').setAttribute('aria-pressed',String(!b));} lastFrame=performance.now(); }
  let statusTimer; function notify(msg){ if(!$('status')) return; $('status').textContent=msg; $('status').classList.add('visible'); clearTimeout(statusTimer); statusTimer=setTimeout(()=>$('status').classList.remove('visible'),2300); }
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{ switchMode(b.dataset.scene); if(!reduce.matches)resume(true);}));
  $('restart')?.addEventListener('click',()=>{switchMode('all');fireworks();if(!reduce.matches)resume(true)});
  $('pause')?.addEventListener('click',()=>resume(paused));
  $('configure')?.addEventListener('click',()=>{$('settings').hidden=!$('settings').hidden; $('configure').setAttribute('aria-expanded',String(!$('settings').hidden));});
  $('density')?.addEventListener('input',e=>$('density-value').textContent=(+e.target.value).toLocaleString('vi-VN'));
  $('density')?.addEventListener('change',e=>{density=+e.target.value; setViewport();});
  $('speed')?.addEventListener('input',e=>{speed=+e.target.value; if($('speed-value'))$('speed-value').textContent=speed.toFixed(1)+'×'});
  $('twinkle')?.addEventListener('input',e=>{twinkle=+e.target.value; if($('twinkle-value'))$('twinkle-value').textContent=twinkle.toFixed(1)+'×'});
  $('auto')?.addEventListener('change',e=>switchMode(e.target.checked?'all':stage));
  canvas.addEventListener('pointermove',e=>{mouse.active=true;mouse.x=(e.clientX/W-.5)*2;mouse.y=(e.clientY/H-.5)*2;},{passive:true});
  canvas.addEventListener('pointerleave',()=>mouse.active=false,{passive:true});
  canvas.addEventListener('pointerdown',e=>{launch(W*.5,H*.6,e.clientX,e.clientY)},{passive:true});
  let resizeTimer; window.addEventListener('resize',()=>{clearTimeout(resizeTimer); resizeTimer=setTimeout(setViewport,150)},{passive:true});
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden; lastFrame=performance.now()});
  reduce.addEventListener?.('change',e=>{ if(e.matches){ resume(false); notify('Đã giảm chuyển động theo cài đặt thiết bị'); }});
  window.addEventListener('message',event=>{ if(event.source!==parent||event.data?.type!=='birthday-particle-command') return;
    if(event.data.action==='pause')resume(false); else if(event.data.action==='play')resume(true); else if(event.data.action==='suspend')stageVisible=false; else if(event.data.action==='resume'){ stageVisible=true; lastFrame=performance.now(); }
  });
  setViewport(); newStage('cake',false); if($('phase')) $('phase').textContent=labels.cake;
  window.BIRTHDAY_PARTICLE_DEBUG={get count(){return particles.length},get scene(){return stage},get fps(){return measuredFps},get color(){return colorAt(clock)},get frameCount(){return particles.length},get numeralParticleCount(){return targets.cake.filter(p=>p.kind==='number'||p.kind==='number-edge').length},get numberBounds(){const a=targets.cake.filter(p=>p.kind==='number'||p.kind==='number-edge');return {x:[Math.min(...a.map(p=>p.x)),Math.max(...a.map(p=>p.x))],y:[Math.min(...a.map(p=>p.y)),Math.max(...a.map(p=>p.y))]}},get age(){return clock-startScene},get fireworkInfo(){return {rockets:rockets.length,heartSparks:sparks.length,cap:HERO_FIREWORK_MAX(),perBurst:HERO_BURST_COUNT()}},get depthRange(){const a=targets[stage];return [Math.min(...a.map(p=>p.z)),Math.max(...a.map(p=>p.z))]},switchMode,fireworks};
  requestAnimationFrame(draw);
})();
