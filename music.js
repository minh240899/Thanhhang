/* Birthday Music v6 - CHANGE YOUR MUSIC AT config.js: musicUrl.
   Supports direct HTTPS .mp3/.mp4/.m4a/.ogg/.wav links, local assets, and temporary upload.
   Browser autoplay policy may require a gesture: show clear play button instead of faking success. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const audio=$('birthday-background-music');if(!audio)return;
  const cfg=window.BIRTHDAY_CONFIG||{},play=$('music-toggle'),status=$('music-status'),panel=$('music-panel'),panelButton=$('music-settings-toggle');
  const musicSrc=$('music-url'),fileInput=$('music-file'),volume=$('music-volume'),intro=$('music-welcome');
  let temporaryUrl=null,explicitlyOff=false,wasPlayingBeforeVideo=false,pausedForHidden=false;const playingVideos=new Set();
  const URLKEY='birthday-music-url-v6';
  function validUrl(value){const str=String(value||'').trim();return /^https:\/\/[^\s<>"']+$/i.test(str)||/^assets\/[A-Za-z0-9._\/-]+$/.test(str)||/^\.\/assets\/[A-Za-z0-9._\/-]+$/.test(str);}
  const display=(msg)=>{status.textContent=msg;};
  function label(){const on=!audio.paused&&!!audio.currentSrc;play.innerHTML=on?'♫ Tắt nhạc':'♫ Bật nhạc';play.setAttribute('aria-pressed',String(on));}
  function setSource(source,remember=false){
    if(!validUrl(source)){display('Cần URL trực tiếp tới MP3/MP4 hoặc tệp trong assets.');return false;}
    audio.pause();audio.src=(window.BIRTHDAY_DEMO_ASSETS?.[source] || source);audio.load();musicSrc.value=source;label();
    if(remember){try{localStorage.setItem(URLKEY,source)}catch{/* private browser */}}
    display('Đã chọn bản nhạc. Nhấn Bật nhạc để phát.');return true;
  }
  async function begin(){
    if(!audio.getAttribute('src')){display('Chưa có nhạc. Chọn MP3/MP4 hoặc nhập URL.');panel.hidden=false;return false;}
    explicitlyOff=false;
    try{await audio.play();intro.hidden=true;display('Đang phát nhạc nền ♫');label();return true;}
    catch(error){label();display(error.name==='NotAllowedError'?'Trình duyệt yêu cầu bạn chạm “Bật nhạc” để nghe.':'Không phát được tệp này. Hãy kiểm tra link hoặc định dạng.');return false;}
  }
  function stop(){explicitlyOff=true;audio.pause();label();display('Nhạc đã tạm dừng.');intro.hidden=true;}
  play.addEventListener('click',()=>audio.paused?begin():stop());
  $('music-enter').addEventListener('click',()=>begin());
  $('music-skip').addEventListener('click',()=>{stop();display('Bạn có thể bật nhạc bất kỳ lúc nào.');});
  panelButton.addEventListener('click',()=>{panel.hidden=!panel.hidden;panelButton.setAttribute('aria-expanded',String(!panel.hidden));});
  $('music-apply').addEventListener('click',async()=>{if(setSource(musicSrc.value,true)){await begin();panel.hidden=true;panelButton.setAttribute('aria-expanded','false')}});
  fileInput.addEventListener('change',async()=>{
    const f=fileInput.files?.[0];if(!f)return;
    if(f.size>45*1024*1024){display('File nhạc quá 45 MB. Hãy nén hoặc dùng link trực tiếp.');return;}
    if(!/\.(mp3|mp4|m4a|ogg|wav|webm)$/i.test(f.name)||(!f.type.startsWith('audio/')&&!f.type.startsWith('video/'))){display('Chỉ hỗ trợ file âm thanh hoặc MP4/WebM có âm thanh.');return;}
    if(temporaryUrl)URL.revokeObjectURL(temporaryUrl);temporaryUrl=URL.createObjectURL(f);
    audio.pause();audio.src=temporaryUrl;audio.load();musicSrc.value=f.name+' (đang mở tạm)';
    // Upload in this UI only previews locally; for permanent use copy the file into assets + set config.js.
    display('Đã chọn '+f.name+'. Muốn lưu vĩnh viễn: chép vào assets/ và sửa musicUrl trong config.js.');
    await begin();
  });
  volume.addEventListener('input',()=>{audio.volume=+volume.value;});
  audio.addEventListener('play',label);audio.addEventListener('pause',label);
  audio.addEventListener('error',()=>{label();display('Lỗi phát nhạc. URL phải trỏ trực tiếp tới file và cho phép truy cập.')});
  audio.addEventListener('ended',()=>{if(audio.loop&& !explicitlyOff)begin()});
  // Pause music while the user watches a video that may already have audio.
  document.addEventListener('play',e=>{if(e.target instanceof HTMLVideoElement){playingVideos.add(e.target);if(!audio.paused){wasPlayingBeforeVideo=true;audio.pause();display('Nhạc nền tạm dừng khi bạn xem video.');}}},true);
  function videoStops(e){if(e.target instanceof HTMLVideoElement){playingVideos.delete(e.target);if(wasPlayingBeforeVideo&&playingVideos.size===0&&!explicitlyOff){wasPlayingBeforeVideo=false;begin();}}}
  document.addEventListener('pause',videoStops,true);document.addEventListener('ended',videoStops,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pausedForHidden=!audio.paused; if(pausedForHidden)audio.pause();}else if(pausedForHidden&&!explicitlyOff&&playingVideos.size===0){pausedForHidden=false;begin();}});
  audio.volume=.40;volume.value='.40';
  let stored='';try{stored=localStorage.getItem(URLKEY)||'';}catch{};
  let adminMusic='';try{adminMusic=localStorage.getItem('birthday-admin-music-url')||'';}catch{}
  const configured=stored||(cfg.remoteApi===true?(cfg.musicUrl||'assets/birthday_theme.mp3'):(adminMusic||cfg.musicUrl||'assets/birthday_theme.mp3'));
  if(validUrl(configured))setSource(configured);else display('Chưa cấu hình bài hát.');

  // Public site music must follow server settings, not just the Admin browser's localStorage.
  // Visitor-selected music (the widget's per-device override) is kept for that visitor.
  async function loadSharedMusic(){
    if(cfg.remoteApi!==true||stored)return;
    try{
      const response=await fetch('/api/content',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      const shared=String(data?.settings?.musicUrl||cfg.musicUrl||'assets/birthday_theme.mp3').trim();
      if(!validUrl(shared)||explicitlyOff||temporaryUrl||musicSrc.value===shared)return;
      try{if(localStorage.getItem(URLKEY))return;}catch{}
      setSource(shared);
      if(cfg.musicAutoplay!==false&&!document.hidden&&playingVideos.size===0)begin();
    }catch(error){
      console.warn('Không thể đọc nhạc chung, đang dùng bài mặc định.',error);
    }
  }
  void loadSharedMusic();
  // The welcome prompt is accessible when autoplay with audible sound gets blocked.
  if(cfg.musicAutoplay!==false){begin().then(ok=>{intro.hidden=ok;});}else intro.hidden=true;
  // Browser autoplay can be denied without a gesture; retry on the first normal interaction.
  if(cfg.musicAutoplay!==false){
    const resumeFromGesture=event=>{
      if(explicitlyOff||!audio.paused||playingVideos.size||document.hidden)return;
      const target=event.target;
      if(target instanceof Element&&target.closest('#music-skip, #music-toggle, #music-enter, #music-settings-toggle, #music-apply, #music-panel'))return;
      begin().then(ok=>{if(ok)['pointerdown','touchend','click','keydown'].forEach(name=>document.removeEventListener(name,resumeFromGesture,true));});
    };
    ['pointerdown','touchend','click','keydown'].forEach(name=>document.addEventListener(name,resumeFromGesture,true));
  }
  window.BIRTHDAY_MUSIC={get source(){return audio.src},begin,stop,setSource};
})();
