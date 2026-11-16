/* Our Little World v4 — local demo + optional Supabase REST backend.
   Demo names, images and memories are fictional placeholders. */
(() => {
  'use strict';
  const cfg = window.BIRTHDAY_CONFIG || {};
  const cloudMode = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const remoteMode = cfg.remoteApi === true;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const now = () => new Date().toISOString();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImg = value => {
    const src = String(value || '');
    return /^(assets\/[\w.\/-]+|https:\/\/[^\s"'<>]+|data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+)$/.test(src) ? (window.BIRTHDAY_DEMO_ASSETS?.[src] || src) : (window.BIRTHDAY_DEMO_ASSETS?.['assets/flowers.svg'] || 'assets/flowers.svg');
  };
  const shortDate = value => {const d=new Date(value);return value&&!Number.isNaN(d.getTime())?d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'Một ngày thật đẹp';};
  const videoURLs=new Map();
  const isVideo=file=>file.type==='video/mp4'||file.type==='video/webm';
  const getMediaItems=item=>Array.isArray(item.media_items)&&item.media_items.length
    ?item.media_items.filter(m=>m&&['image','video'].includes(m.type)&&typeof m.url==='string')
    :(Array.isArray(item.image_urls)&&item.image_urls.length?item.image_urls:item.image_url?[item.image_url]:[]).filter(Boolean).map(url=>({type:'image',url}));
  const getPhotos=item=>getMediaItems(item).filter(m=>m.type==='image').map(m=>m.url);
  const mediaSrc=m=>{if(m.url?.startsWith('localvideo://'))return videoURLs.get(m.url.slice(13))||'';
    if(m.type==='image')return safeImg(m.url);
    return /^(assets\/[\w./-]+|https:\/\/[^\s"'<>]+|blob:[^\s"'<>]+|data:video\/(?:mp4|webm);base64,[a-zA-Z0-9+/=]+)$/.test(m.url)?(window.BIRTHDAY_DEMO_ASSETS?.[m.url]||m.url):'';};
  const videoTile=(small=false)=>`<div class="video-tile"><div class="video-play-symbol"><b aria-hidden="true">▶</b>${small?'':'<span>Video kỷ niệm</span>'}</div></div>`;
  const mediaCover=(media,alt,extra='')=>!media?`<img ${extra} src="${esc(safeImg('assets/flowers.svg'))}" alt="${esc(alt)}">`:media.type==='video'?videoTile():`<img ${extra} src="${esc(mediaSrc(media))}" alt="${esc(alt)}">`;
  const getFirstPhoto=item=>getPhotos(item)[0]||'assets/flowers.svg';
  const samplePosts = [
    {id:'sample-1',title:'Một ngày bên biển',author:'Ký ức mẫu',body:'Nắng nhẹ, gió biển và những câu chuyện chẳng muốn kết thúc. Lật các ảnh để xem thêm khoảnh khắc trong chuyến đi.',category:'Du lịch',image_urls:['assets/coast.svg','assets/picnic.svg','assets/city.svg'],example:true},
    {id:'sample-video',title:'Một đoạn phim kỷ niệm',author:'Ký ức mẫu',body:'Video nhỏ lưu giữ những điều đáng yêu; bạn có thể đăng video MP4/WebM của riêng mình.',category:'Đời thường',media_items:[{type:'video',url:'assets/birthday_sample.mp4'},{type:'image',url:'assets/flowers.svg'}],example:true},
    {id:'sample-2',title:'Những bông hoa nhỏ',author:'Ký ức mẫu',body:'Có những niềm vui giản dị nhưng vẫn luôn khiến mình mỉm cười.',category:'Đời thường',image_urls:['assets/flowers.svg','assets/cafe.svg'],example:true},
    {id:'sample-3',title:'Một buổi hẹn cà phê',author:'Ký ức mẫu',body:'Cà phê thơm, nhạc nhẹ và một buổi chiều thật yên.',category:'Hẹn hò',image_urls:['assets/cafe.svg','assets/city.svg'],example:true},
    {id:'sample-4',title:'Chuyến đi lên núi',author:'Ký ức mẫu',body:'Đôi khi điều đẹp nhất là con đường chúng mình đã đi qua.',category:'Du lịch',image_urls:['assets/mountain.svg','assets/coast.svg'],example:true},
    {id:'sample-5',title:'Gia đình bên nhau',author:'Ký ức mẫu',body:'Có gia đình ở bên, sinh nhật nào cũng ấm áp hơn.',category:'Gia đình',image_urls:['assets/picnic.svg','assets/flowers.svg'],example:true},
    {id:'sample-6',title:'Một ngày thật vui cùng mọi người',author:'Ký ức mẫu',body:'Những người bạn và đồng nghiệp đã biến ngày bình thường thành kỷ niệm đẹp.',category:'Bạn bè & đồng nghiệp',image_urls:['assets/city.svg','assets/flowers.svg'],example:true}
  ];
  const sampleTrips = [
    {id:'trip-1',label:'CHUYẾN ĐI #01',title:'Một ngày bên biển',description:'Để gió kể chuyện và giữ lại một ngày thật nhiều tiếng cười.',image_url:'assets/coast.svg'},
    {id:'trip-2',label:'CHUYẾN ĐI #02',title:'Trốn lên núi một hôm',description:'Đi qua những con đường mới, ngắm hoàng hôn và tận hưởng bình yên.',image_url:'assets/mountain.svg'},
    {id:'trip-3',label:'CHUYẾN ĐI #03',title:'Một buổi picnic',description:'Không cần đi xa, chỉ cần một buổi chiều thật nhẹ nhàng.',image_url:'assets/picnic.svg'}
  ];
  const sampleWishes = [
    {id:'w-1',author:'Gia đình · mẫu',group_type:'Gia đình',message:'Chúc con một tuổi mới bình an, nhiều sức khỏe và luôn được yêu thương.',image_urls:['assets/flowers.svg','assets/picnic.svg'],example:true},
    {id:'w-2',author:'Đồng nghiệp · mẫu',group_type:'Bạn bè & đồng nghiệp',message:'Chúc bạn tuổi mới nhiều năng lượng, thành công và thật nhiều chuyến đi mới!',example:true},
    {id:'w-3',author:'Người thương · mẫu',group_type:'Người thương',message:'Mong những nụ cười và điều ước của em sẽ luôn được nâng niu. Chúc mừng sinh nhật ♡',example:true}
  ];
  const emptyState = () => ({posts:[],trips:[],wishes:[],comments:[],wishComments:[],likes:{},wishLikes:{},liked:[],wishLiked:[]});
  let state=emptyState();
  let activeTab='wish', postFilter='all', wishFilter='all', viewKind='post', viewId=null;
  let selectedFiles=[], previewURLs=[], carousel=null, toastTimer;
  const expandedWishes=new Set();
  let database;
  let ephemeralStorage=false;

  function localDatabase(){
    if(!('indexedDB' in globalThis))return Promise.resolve(null);
    if(database)return database;
    database=new Promise(resolve=>{let req;try{req=indexedDB.open('our-little-world-v1',2);}catch{resolve(null);return;}
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('kv'))req.result.createObjectStore('kv');if(!req.result.objectStoreNames.contains('videos'))req.result.createObjectStore('videos');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);req.onblocked=()=>resolve(null);
    });return database;
  }
  async function getLocalState(){const db=await localDatabase();if(db)return new Promise(resolve=>{try{const request=db.transaction('kv','readonly').objectStore('kv').get('site-state');request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);}catch{resolve(null);}});try{return JSON.parse(localStorage.getItem('birthday-demo-state'));}catch{return null;}}
  async function saveLocalState(){const db=await localDatabase();if(db)return new Promise((resolve,reject)=>{try{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(state,'site-state');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Không thể lưu ảnh. Bộ nhớ trình duyệt có thể đã đầy.'));}catch(e){reject(e);}});try{localStorage.setItem('birthday-demo-state',JSON.stringify(state));}catch{ephemeralStorage=true;}}
  async function storeLocalVideo(file){
    const db=await localDatabase();const id=uid();if(!db||!db.objectStoreNames.contains('videos')){ephemeralStorage=true;videoURLs.set(id,URL.createObjectURL(file));return `localvideo://${id}`;}await new Promise((resolve,reject)=>{try{const tx=db.transaction('videos','readwrite');tx.objectStore('videos').put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('Không đủ bộ nhớ để lưu video.'));}catch(e){reject(e);}});
    videoURLs.set(id,URL.createObjectURL(file));return `localvideo://${id}`;
  }
  async function hydrateLocalVideos(){const ids=new Set([...state.posts,...state.wishes].flatMap(x=>getMediaItems(x)).filter(x=>x.type==='video'&&x.url.startsWith('localvideo://')).map(x=>x.url.slice(13)));
    const db=await localDatabase();if(!db||!db.objectStoreNames.contains('videos'))return;
    for(const id of ids){if(videoURLs.has(id))continue;const blob=await new Promise(resolve=>{try{const req=db.transaction('videos','readonly').objectStore('videos').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);}catch{resolve(null);}});if(blob)videoURLs.set(id,URL.createObjectURL(blob));}
  }
  async function getAdminSettings(){
    const db=await localDatabase();
    if(!db)return null;
    return new Promise(resolve=>{try{const r=db.transaction('kv','readonly').objectStore('kv').get('site-settings');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}catch{resolve(null);}});
  }
  function applyAdminSettings(s){
    if(!s||typeof s!=='object')return;
    const bindings={'#hero-name':'recipientName','#hero-message':'heroMessage','#sender-name':'senderName',
      '#story-title':'storyTitle','#story-text-1':'storyText1','#story-text-2':'storyText2',
      '#journey-heading':'journeyHeading','#journey-subtitle':'journeySubtitle',
      '#letter-title':'letterTitle','#letter-text':'letterText'};
    for(const [sel,key] of Object.entries(bindings)){
      if(typeof s[key]==='string' && s[key].trim()){
        const el=$(sel);if(el)el.textContent=s[key]+(key==='senderName'?' ♡':'');
      }
    }
    if(s.recipientName)document.title=`Gửi ${s.recipientName} | Birthday Memories`;
    if(s.musicUrl && /^https:\/\/[^\s<>'"]+$|^assets\/[\w./-]+$/.test(s.musicUrl)){
      try{localStorage.setItem('birthday-admin-music-url',s.musicUrl)}catch{}
    }
  }
  const api = async (method,path,data,contentType='application/json')=>{
    const headers={apikey:cfg.supabaseAnonKey};
    if(!cfg.supabaseAnonKey.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${cfg.supabaseAnonKey}`;
    if(contentType)headers['Content-Type']=contentType;
    if(method==='POST' && path.startsWith('/rest/v1/') && !path.includes('/rpc/'))headers.Prefer='return=minimal';
    const response=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+path,{method,headers,body:data===undefined?undefined:(contentType==='application/json'?JSON.stringify(data):data)});
    if(!response.ok)throw new Error(`Lỗi kết nối dữ liệu (${response.status}). Kiểm tra SQL/RLS.`);
    if(response.status===204)return null;const text=await response.text();return text?JSON.parse(text):null;
  };
  function persistedVisitorId(){try{let id=localStorage.getItem('birthday-visitor');if(!id){id=uid();localStorage.setItem('birthday-visitor',id);}return id;}catch{return uid();}}
  function persistLiked(){try{localStorage.setItem('birthday-liked',JSON.stringify(state.liked));localStorage.setItem('birthday-wish-liked',JSON.stringify(state.wishLiked));}catch{/* private mode */}}
  async function fetchCloud(){
    const [posts,trips,wishes,comments,likes,wishComments,wishLikes]=await Promise.all([
      api('GET','/rest/v1/memories?select=*&approved=eq.true&order=created_at.desc'),
      api('GET','/rest/v1/trips?select=*&published=eq.true&order=sort_order.asc'),
      api('GET','/rest/v1/wishes?select=*&approved=eq.true&order=created_at.desc'),
      api('GET','/rest/v1/comments?select=*&approved=eq.true&order=created_at.asc'),
      api('POST','/rest/v1/rpc/like_counts',{}),
      api('GET','/rest/v1/wish_comments?select=*&approved=eq.true&order=created_at.asc'),
      api('POST','/rest/v1/rpc/wish_like_counts',{})
    ]);
    state={...emptyState(),posts:posts||[],trips:trips||[],wishes:wishes||[],comments:comments||[],wishComments:wishComments||[]};
    (likes||[]).forEach(x=>state.likes[x.memory_id]=Number(x.like_count));
    (wishLikes||[]).forEach(x=>state.wishLikes[x.wish_id]=Number(x.like_count));
    try{state.liked=JSON.parse(localStorage.getItem('birthday-liked')||'[]');state.wishLiked=JSON.parse(localStorage.getItem('birthday-wish-liked')||'[]');}catch{}
  }
  async function uploadCloudMedia(file){
    const video=isVideo(file);
    const extension=video?(file.type==='video/webm'?'webm':'mp4'):(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');
    const bucket=video?'birthday-videos':'birthday-photos';
    const objectName=`guest/${uid()}.${extension}`;
    const host=cfg.supabaseUrl.replace(/\/$/,'');
    const headers={apikey:cfg.supabaseAnonKey,'Content-Type':file.type,'x-upsert':'false'};
    if(!cfg.supabaseAnonKey.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${cfg.supabaseAnonKey}`;
    const response=await fetch(`${host}/storage/v1/object/${bucket}/${objectName}`,{method:'POST',headers,body:file});
    if(!response.ok)throw new Error(`Tải ${video?'video':'ảnh'} thất bại (${response.status}). Video lớn nên dùng resumable upload (TUS) khi triển khai thật.`);
    return `${host}/storage/v1/object/public/${bucket}/${objectName}`;
  }
  async function compactPhoto(file){return new Promise((resolve,reject)=>{
    const image=new Image(),url=URL.createObjectURL(file);
    image.onload=()=>{try{const ratio=Math.min(1,1400/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.77));}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Ảnh không hợp lệ hoặc trình duyệt không thể đọc ảnh.'));};image.src=url;
  });}
  async function processMedia(files){const items=[];for(const file of files){const type=isVideo(file)?'video':'image';const url=cloudMode?await uploadCloudMedia(file):type==='video'?await storeLocalVideo(file):await compactPhoto(file);items.push({type,url});}return items;}
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
  function renderCounts(){$('#stat-moments').textContent=String(state.posts.filter(x=>x.approved!==false).length).padStart(2,'0');$('#stat-journeys').textContent=String(state.trips.filter(x=>x.published!==false).length).padStart(2,'0');$('#stat-wishes').textContent=String(state.wishes.filter(x=>x.approved!==false).length).padStart(2,'0');}
  function renderTrips(){const root=$('#journey-list');root.replaceChildren();state.trips.filter(t=>t.published!==false).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).forEach(t=>{const item=document.createElement('article');item.className='journey-card';item.innerHTML=`<img class="journey-cover" loading="lazy" src="${esc(safeImg(t.image_url))}" alt="${esc(t.title)}"><div class="journey-info"><div class="journey-date">${esc(t.label)}${t.date?' · '+esc(shortDate(t.date)):''}</div><h3>${esc(t.title)}</h3>${t.location?`<div class="journey-location">⌖ ${esc(t.location)}</div>`:''}<p>${esc(t.description)}</p>${t.linked_album_id&&state.posts.some(p=>p.id===t.linked_album_id&&p.approved!==false)?`<button class="journey-album-btn" type="button">Xem album chuyến đi ↗</button>`:''}</div>`;if(t.linked_album_id){$('.journey-album-btn',item)?.addEventListener('click',()=>openViewer('post',t.linked_album_id));}root.append(item);});}
  function renderGallery(){const root=$('#gallery-grid');root.replaceChildren();const posts=state.posts.filter(p=>p.approved!==false).filter(p=>postFilter==='all'||(postFilter==='video'&&getMediaItems(p).some(m=>m.type==='video'))||p.category===postFilter);$('#gallery-empty').hidden=posts.length>0;
    posts.forEach(p=>{const media=getMediaItems(p),videos=media.filter(m=>m.type==='video').length,n=state.comments.filter(c=>c.memory_id===p.id&&c.approved!==false).length;
      const card=document.createElement('button');card.type='button';card.className='gallery-card';card.setAttribute('aria-label',`Xem album ${p.title}, ${media.length} ảnh/video`);
      const cover=mediaCover(media[0],p.title,'loading="lazy"');
      card.innerHTML=`<div class="gallery-image">${cover}${media.length>1||videos?`<span class="photo-stack">${videos?'▶ ': '▧ '}${media.length} tệp · ${videos} video</span>`:''}<div class="gallery-overlay"><span>${esc(p.category)}</span><span>↗ Xem album</span></div></div><div class="gallery-info"><div class="gallery-category">${p.example?'NỘI DUNG MINH HỌA':esc(p.category)}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="gallery-stats"><span>♡ ${state.likes[p.id]||0} thích</span><span>◉ ${n} bình luận</span></div></div>`;
      card.addEventListener('click',()=>openViewer('post',p.id));root.append(card);
    });
  }
  function commentListMarkup(items){if(!items.length)return '<p class="no-comments">Chưa có bình luận. Hãy để lại lời đầu tiên nhé!</p>';return items.map(c=>`<div class="comment"><div class="avatar">${esc([...c.author][0]?.toUpperCase()||'♥')}</div><div class="comment-content"><strong>${esc(c.author)}</strong><p>${esc(c.message)}</p><time>${shortDate(c.created_at)}</time></div></div>`).join('');}
  function renderWishes(){const root=$('#wishes-grid');root.replaceChildren();const items=state.wishes.filter(w=>w.approved!==false).filter(w=>wishFilter==='all'||(w.group_type||'Bạn bè & đồng nghiệp')===wishFilter);
    if(!items.length){root.innerHTML='<p class="no-comments">Chưa có lời chúc trong nhóm này.</p>';return;}
    items.forEach(w=>{
      const medias=getMediaItems(w),comments=state.wishComments.filter(x=>x.wish_id===w.id&&x.approved!==false),opened=expandedWishes.has(w.id);
      const card=document.createElement('article');card.className='wish-card';card.dataset.wishId=w.id;
      card.innerHTML=`<div class="wish-header"><span class="wish-tag">${esc(w.group_type||'Bạn bè & đồng nghiệp')}</span>${w.example?'<span class="example-tag">MINH HỌA</span>':''}</div><div class="wish-quote">“</div><p>${esc(w.message)}</p>${medias.length?`<button class="wish-photo-collage" type="button" data-view-wish aria-label="Xem ${medias.length} ảnh và video trong lời chúc">${mediaCover(medias[0],'Ảnh gửi kèm lời chúc','loading="lazy"')}${medias.length>1?`<span>+${medias.length-1} tệp</span>`:''}</button>`:''}<div class="wish-person"><div class="avatar">${esc([...w.author][0]?.toUpperCase()||'♥')}</div><span>${esc(w.author)}</span><time>${w.example?'Ví dụ':shortDate(w.created_at)}</time></div><div class="wish-actions"><button class="wish-action ${state.wishLiked.includes(w.id)?'liked':''}" data-like-wish type="button" aria-label="Thích lời chúc">♥ <span>${state.wishLikes[w.id]||0}</span> Thích</button><button class="wish-action" type="button" data-toggle-comments aria-expanded="${opened}">◉ ${comments.length} Bình luận</button></div><div class="wish-replies" ${opened?'':'hidden'}><div class="wish-reply-list">${commentListMarkup(comments)}</div><form class="wish-comment-form"><label class="visually-hidden" for="w-author-${esc(w.id)}">Tên người bình luận</label><input id="w-author-${esc(w.id)}" name="author" required maxlength="40" placeholder="Tên của bạn"><label class="visually-hidden" for="w-text-${esc(w.id)}">Nội dung bình luận</label><textarea id="w-text-${esc(w.id)}" name="message" required maxlength="600" rows="2" placeholder="Viết bình luận cho lời chúc..."></textarea><button class="btn btn-primary btn-small" type="submit">Gửi bình luận</button></form></div>`;
      $('[data-view-wish]',card)?.addEventListener('click',()=>openViewer('wish',w.id));
      $('[data-like-wish]',card).addEventListener('click',()=>likeContent('wish',w.id));
      $('[data-toggle-comments]',card).addEventListener('click',()=>{if(expandedWishes.has(w.id))expandedWishes.delete(w.id);else expandedWishes.add(w.id);renderWishes();});
      $('.wish-comment-form',card).addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form);button.disabled=true;try{const author=form.elements.author.value.trim(),message=form.elements.message.value.trim();if(!author||!message)throw new Error('Vui lòng nhập tên và nội dung.');await addComment('wish',w.id,author,message);form.reset();}catch(error){toast(error.message);}finally{button.disabled=false;}});
      root.append(card);
    });
  }
  function renderAll(){renderCounts();renderTrips();renderGallery();renderWishes();}
  function setTab(tab){activeTab=tab;$$('.form-tab').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));});$$('.memory-only').forEach(el=>el.hidden=tab!=='memory');$$('.wish-only').forEach(el=>el.hidden=tab!=='wish');$('#post-title').required=tab==='memory';$('#photo-input').required=false;$('#compose-title').textContent=tab==='wish'?'Để lại một lời thương':'Chia sẻ một kỷ niệm';$('#submit-compose').textContent=tab==='wish'?'Gửi lời chúc ♡':'Đăng album kỷ niệm ↗';$('#upload-tip').textContent=tab==='wish'?'5 tệp, tối đa 1 video 30 MB · 8 MB/ảnh':'10 tệp, tối đa 2 video 30 MB · 8 MB/ảnh';updatePhotoPreviews();}
  function openCompose(tab){setTab(tab);$('#compose-dialog').showModal();$('#form-error').hidden=true;}
  function closeDialogs(){$$('.dialog').forEach(dialog=>{if(dialog.open)dialog.close();});}
  function clearFiles(){previewURLs.forEach(url=>URL.revokeObjectURL(url));previewURLs=[];selectedFiles=[];$('#photo-input').value='';updatePhotoPreviews();}
  function updatePhotoPreviews(){const max=activeTab==='wish'?5:10,limitVideos=activeTab==='wish'?1:2;const root=$('#upload-preview-grid');root.replaceChildren();previewURLs.forEach(url=>URL.revokeObjectURL(url));previewURLs=[];
    selectedFiles.forEach((file,index)=>{const url=URL.createObjectURL(file);previewURLs.push(url);const box=document.createElement('div');box.className='upload-preview-item';
      if(isVideo(file)){const v=document.createElement('video');v.src=url;v.muted=true;v.playsInline=true;v.preload='metadata';box.append(v);const l=document.createElement('span');l.className='media-video-label';l.textContent='▶ VIDEO';box.append(l);}
      else {const img=document.createElement('img');img.src=url;img.alt=`Ảnh số ${index+1} đã chọn`;box.append(img);}
      const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label',`Bỏ tệp thứ ${index+1}`);remove.textContent='×';remove.addEventListener('click',()=>{selectedFiles.splice(index,1);updatePhotoPreviews();});box.append(remove);root.append(box);
    });
    const videos=selectedFiles.filter(isVideo).length;
    $('#photo-count').textContent=selectedFiles.length?`Đã chọn ${selectedFiles.length}/${max} tệp · ${videos}/${limitVideos} video. Nhấn × để bỏ tệp.`:'Chưa chọn tệp';
    $('#upload-label').textContent=selectedFiles.length?'Thêm ảnh/video vào album':'Chọn nhiều ảnh hoặc video';
  }
  function validateFiles(files){const max=activeTab==='wish'?5:10,limitVideos=activeTab==='wish'?1:2;
    if(files.length>max)throw new Error(`Tối đa ${max} tệp cho ${activeTab==='wish'?'lời chúc':'bài đăng'}.`);
    const videos=files.filter(isVideo);if(videos.length>limitVideos)throw new Error(`Chỉ cho phép tối đa ${limitVideos} video trong một lần đăng.`);
    const total=files.reduce((size,file)=>size+file.size,0);if(total>75*1024*1024)throw new Error('Tổng dung lượng tối đa 75 MB mỗi bài đăng.');
    for(const file of files){if(isVideo(file)){if(file.size>30*1024*1024)throw new Error(`${file.name}: video phải nhỏ hơn 30 MB.`);}
      else if(['image/jpeg','image/png','image/webp'].includes(file.type)){if(file.size>8*1024*1024)throw new Error(`${file.name}: ảnh phải nhỏ hơn 8 MB.`);}
      else throw new Error(`${file.name}: chỉ hỗ trợ ảnh JPG/PNG/WebP và video MP4/WebM.`);
    }
  }
  function getEntry(kind,id){return(kind==='post'?state.posts:state.wishes).find(x=>x.id===id);}
  function renderViewerComments(){const kind=viewKind,id=viewId,comments=(kind==='post'?state.comments:state.wishComments).filter(c=>c.approved!==false&&(kind==='post'?c.memory_id===id:c.wish_id===id));$('#comment-count').textContent=`(${comments.length})`;$('#comment-list').innerHTML=commentListMarkup(comments);}
  function updateViewerLike(){const isWish=viewKind==='wish';const count=(isWish?state.wishLikes:state.likes)[viewId]||0;$('#post-like-count').textContent=count;$('#post-like').classList.toggle('liked',(isWish?state.wishLiked:state.liked).includes(viewId));}
  function pauseCarouselVideos(){ $$('#post-carousel video').forEach(video=>{try{video.pause();}catch{}}); }
  function openViewer(kind,id){const entry=getEntry(kind,id);if(!entry)return;viewKind=kind;viewId=id;
    const medias=getMediaItems(entry),slides=medias.length?medias:[{type:'image',url:'assets/flowers.svg'}];
    const root=$('#post-carousel-inner');root.replaceChildren();const thumbs=$('#album-thumbs');thumbs.replaceChildren();
    slides.forEach((media,i)=>{const item=document.createElement('div');item.className=`carousel-item${i===0?' active':''}`;
      if(media.type==='video') {const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=mediaSrc(media);video.setAttribute('aria-label',`Video ${i+1} trong album`);item.append(video);}
      else {const image=document.createElement('img');image.src=mediaSrc(media);image.alt=`${kind==='post'?'Kỷ niệm':'Lời chúc'} ${entry.title||entry.author}, ảnh ${i+1}/${slides.length}`;image.loading=i===0?'eager':'lazy';item.append(image);}
      root.append(item);const thumb=document.createElement('button');thumb.type='button';thumb.className=`album-thumb${i===0?' current':''}`;thumb.setAttribute('aria-label',`Xem ${media.type==='video'?'video':'ảnh'} ${i+1}`);
      if(media.type==='video')thumb.innerHTML=videoTile(true);else thumb.innerHTML=`<img src="${esc(mediaSrc(media))}" alt="">`;
      thumb.addEventListener('click',()=>carousel?.to(i));thumbs.append(thumb);
    });
    $('#post-carousel').querySelectorAll('.carousel-control-next,.carousel-control-prev').forEach(b=>b.hidden=slides.length<2);thumbs.hidden=slides.length<2;
    $('#album-progress').textContent=`1 / ${slides.length}`;$('#post-photo-count').textContent=`${slides.filter(m=>m.type==='image').length} ảnh · ${slides.filter(m=>m.type==='video').length} video`;
    $('#post-modal-category').textContent=kind==='post'?entry.category:(entry.group_type||'Bạn bè & đồng nghiệp');
    $('#post-modal-title').textContent=kind==='post'?entry.title:`Lời chúc từ ${entry.author}`;
    $('#post-modal-meta').textContent=entry.example?'Nội dung minh họa':`Chia sẻ bởi ${entry.author} · ${shortDate(entry.created_at)}`;
    $('#post-modal-text').textContent=kind==='post'?entry.body:entry.message;
    updateViewerLike();renderViewerComments();$('#comment-error').hidden=true;
    if(carousel){carousel.dispose();carousel=null;}
    $('#post-dialog').showModal();
    if(window.bootstrap?.Carousel)carousel=new bootstrap.Carousel($('#post-carousel'),{interval:false,touch:true,keyboard:true,wrap:true});
    else toast('Không tải được thư viện Bootstrap Carousel.');
  }
  async function refreshRemoteContent(){
    const response=await fetch('/api/content',{cache:'no-store'});
    if(!response.ok)throw new Error('Không thể tải lại nội dung vừa gửi');
    const data=await response.json();
    if(data.state){const localLiked=state.liked||[],localWishLiked=state.wishLiked||[];
      state={...emptyState(),...data.state,liked:localLiked,wishLiked:localWishLiked};}
    renderAll();
    if($('#post-dialog').open&&viewId){renderViewerComments();updateViewerLike();}
  }
  async function sendGuest(input){const r=await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Không gửi được dữ liệu');return d;}
  async function saveWish(author,message,group,files){if(remoteMode){if(files.length)throw new Error('Ảnh/video từ khách sẽ được bật sau khi hoàn tất chống spam. Hiện hãy gửi lời chúc bằng chữ.');await sendGuest({type:'wish',author,message,group});await refreshRemoteContent();toast('Lời chúc đã đăng công khai ♡');return;}const media_items=await processMedia(files),image_urls=media_items.filter(m=>m.type==='image').map(m=>m.url);
    const item={id:uid(),author,message,group_type:group,media_items,image_urls,image_url:image_urls[0]||null,approved:!cloudMode?false:false,created_at:now()};
    if(cloudMode){await api('POST','/rest/v1/wishes',{author,message,group_type:group,image_url:item.image_url,image_urls,media_items,approved:false});toast('Lời chúc đang chờ chủ trang duyệt.');}
    else{state.wishes.unshift(item);await saveLocalState();renderAll();toast('Đã nhận lời chúc. Chủ trang sẽ duyệt trước khi hiển thị!');}
  }
  async function saveMemory(author,title,body,category,files){if(remoteMode)throw new Error('Tính năng tải album từ khách tạm khóa để bảo vệ website khỏi spam. Admin có thể thêm album trong trang quản trị.');if(!files.length)throw new Error('Vui lòng chọn ít nhất một ảnh hoặc video cho bài viết.');
    const media_items=await processMedia(files),image_urls=media_items.filter(m=>m.type==='image').map(m=>m.url);
    const item={id:uid(),author,title,body,category,media_items,image_urls,image_url:image_urls[0]||null,approved:false,created_at:now()};
    if(cloudMode){await api('POST','/rest/v1/memories',{author,title,body,category,image_url:item.image_url,image_urls,media_items,approved:false});toast('Album đang chờ chủ trang duyệt.');}
    else{state.posts.unshift(item);await saveLocalState();postFilter='all';$$('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));renderAll();toast(`Đã gửi ${media_items.length} ảnh/video, đang chờ duyệt!`);}
  }
  async function addComment(kind,id,author,message){if(remoteMode){await sendGuest({type:'comment',kind,id,author,message});if(kind==='wish')expandedWishes.add(id);await refreshRemoteContent();toast('Bình luận đã hiển thị ♡');return;}const item={id:uid(),author,message,created_at:now()};
    if(cloudMode){await api('POST',kind==='post'?'/rest/v1/comments':'/rest/v1/wish_comments',kind==='post'?{memory_id:id,author,message,approved:false}:{wish_id:id,author,message,approved:false});toast('Bình luận đang chờ chủ trang duyệt.');return;}
    if(kind==='post'){state.comments.push({...item,memory_id:id,approved:false});}else{state.wishComments.push({...item,wish_id:id,approved:false});expandedWishes.add(id);}await saveLocalState();if($('#post-dialog').open && viewId===id && viewKind===kind)renderViewerComments();renderWishes();renderGallery();toast('Đã gửi bình luận và đang chờ duyệt!');
  }
  async function likeContent(kind,id){const isWish=kind==='wish',liked=isWish?state.wishLiked:state.liked,counts=isWish?state.wishLikes:state.likes;
    if(liked.includes(id)){toast('Bạn đã thích nội dung này rồi ♡');return;}
    try{if(remoteMode)await sendGuest({type:'like',kind,id});
      if(cloudMode)await api('POST',isWish?'/rest/v1/wish_likes':'/rest/v1/likes',isWish?{wish_id:id,visitor_id:persistedVisitorId()}:{memory_id:id,visitor_id:persistedVisitorId()});
      liked.push(id);counts[id]=(counts[id]||0)+1;if(cloudMode)persistLiked();else await saveLocalState();
      if($('#post-dialog').open && viewId===id && viewKind===kind)updateViewerLike();renderWishes();renderGallery();
      window.BIRTHDAY_EFFECTS?.heartBurst?.(window.innerWidth*.5,window.innerHeight*.42);
    }catch(error){toast(error.message||'Không thể thả tim.');}
  }
  function handleShare(){if(location.protocol==='file:'){toast('Hãy đưa website lên hosting để chia sẻ liên kết cho bạn bè.');return;}const url=location.href.split('#')[0];navigator.clipboard?.writeText(url).then(()=>toast('Đã sao chép link!')).catch(()=>toast('Hãy sao chép URL trên thanh địa chỉ.'))||toast('Hãy sao chép URL trên thanh địa chỉ.');}
  async function init(){
    $('#hero-name').textContent=cfg.recipientName||'cô gái đặc biệt';$('#hero-message').textContent=cfg.heroMessage||'';$('#sender-name').textContent=(cfg.senderName||'Anh')+' ♡';document.title=`Gửi ${cfg.recipientName||'em'} | Birthday Memories`;
    try{if(remoteMode){const res=await fetch('/api/content',{cache:'no-store'});if(!res.ok)throw new Error('Không kết nối được dữ liệu');const data=await res.json();state=data.state?{...emptyState(),...data.state}:{...emptyState(),posts:samplePosts,trips:sampleTrips,wishes:sampleWishes};applyAdminSettings(data.settings);$('#storage-hint').textContent='Dữ liệu trực tuyến: lời chúc và bình luận tự hiển thị ngay sau khi gửi. Chủ trang có thể ẩn hoặc xóa khi cần.';}else if(cloudMode){await fetchCloud();$('#storage-hint').textContent='Chế độ chia sẻ: nội dung mới cần chủ trang duyệt trước khi hiển thị công khai.';}else{const saved=await getLocalState();state=saved?{...emptyState(),...saved}: {...emptyState(),posts:samplePosts,trips:sampleTrips,wishes:sampleWishes};await saveLocalState();await hydrateLocalVideos();if(ephemeralStorage)$('#storage-hint').textContent='Trình duyệt đang chặn lưu trữ: bài đăng/video chỉ còn trong phiên xem hiện tại. Dùng hosting để lưu ổn định.';}}catch(error){console.error('Lỗi tải dữ liệu:',error);state=emptyState();toast('Không tải được dữ liệu. Kiểm tra cấu hình kết nối hoặc bộ nhớ.');}
    if(!cloudMode&&!remoteMode){try{applyAdminSettings(await getAdminSettings());}catch(e){console.warn('Không đọc được cấu hình trang',e);}}
    renderAll();
    $$('[data-open]').forEach(el=>el.addEventListener('click',()=>openCompose(el.dataset.open)));
    $$('[data-close]').forEach(el=>el.addEventListener('click',closeDialogs));
    $$('.dialog').forEach(el=>el.addEventListener('click',event=>{if(event.target===el)el.close();}));
    $('#post-dialog').addEventListener('close',()=>{pauseCarouselVideos();carousel?.dispose();carousel=null;$('#post-carousel-inner').replaceChildren();});
    $('#post-carousel').addEventListener('slide.bs.carousel',pauseCarouselVideos);
    $('#post-carousel').addEventListener('slid.bs.carousel',event=>{$('#album-progress').textContent=`${event.to+1} / ${getMediaItems(getEntry(viewKind,viewId)||{}).length||1}`;$$('.album-thumb').forEach((b,i)=>b.classList.toggle('current',i===event.to));});
    $$('.form-tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
    $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{postFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderGallery();}));
    $$('[data-wish-filter]').forEach(b=>b.addEventListener('click',()=>{wishFilter=b.dataset.wishFilter;$$('[data-wish-filter]').forEach(x=>x.classList.toggle('active',x===b));renderWishes();}));
    $('#message').addEventListener('input',e=>$('#count-chars').textContent=`${e.target.value.length} / 1200`);
    $('#photo-input').addEventListener('change',e=>{try{const additions=[...(e.target.files||[])],proposed=[...selectedFiles,...additions];validateFiles(proposed);selectedFiles=proposed;updatePhotoPreviews();$('#form-error').hidden=true;}catch(error){$('#form-error').textContent=error.message;$('#form-error').hidden=false;}finally{e.target.value='';}});
    $('#compose-form').addEventListener('submit',async event=>{event.preventDefault();const submit=$('#submit-compose'),error=$('#form-error');submit.disabled=true;error.hidden=true;try{const author=$('#author').value.trim(),message=$('#message').value.trim();if(!author||!message)throw new Error('Vui lòng điền tên và nội dung.');validateFiles(selectedFiles);if(activeTab==='wish')await saveWish(author,message,$('#wish-group').value,selectedFiles);else{const title=$('#post-title').value.trim();if(!title)throw new Error('Vui lòng nhập tiêu đề bài viết.');await saveMemory(author,title,message,$('#post-category').value,selectedFiles);}$('#compose-form').reset();$('#count-chars').textContent='0 / 1200';clearFiles();$('#compose-dialog').close();}catch(e){error.textContent=e.message||'Không thể gửi nội dung.';error.hidden=false;}finally{submit.disabled=false;submit.textContent=activeTab==='wish'?'Gửi lời chúc ♡':'Đăng album kỷ niệm ↗';}});
    $('#comment-form').addEventListener('submit',async e=>{e.preventDefault();const button=$('#comment-form button[type=submit]'),error=$('#comment-error');button.disabled=true;error.hidden=true;try{const author=$('#comment-author').value.trim(),message=$('#comment-message').value.trim();if(!author||!message)throw new Error('Vui lòng nhập tên và bình luận.');await addComment(viewKind,viewId,author,message);$('#comment-message').value='';}catch(x){error.textContent=x.message;error.hidden=false;}finally{button.disabled=false;}});
    $('#post-like').addEventListener('click',()=>likeContent(viewKind,viewId));
    $('#share-link').addEventListener('click',handleShare);
    // Continuous generative art embedded in the hero – no popup or trigger button.
    const art=$('#hero-particle-frame'),toggle=$('#hero-particle-toggle');
    let artVisible=true,artPaused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sendArt=action=>art.contentWindow?.postMessage({type:'birthday-particle-command',action},'*');
    const updateArtToggle=()=>{$('.hero-particle-shell').classList.toggle('motion-user-enabled',!artPaused);toggle.textContent=artPaused?'▶ Tiếp tục':'Ⅱ Tạm dừng';toggle.setAttribute('aria-pressed',String(artPaused));toggle.setAttribute('aria-label',artPaused?'Tiếp tục hiệu ứng hạt':'Tạm dừng hiệu ứng hạt');};
    art.addEventListener('load',()=>{sendArt(artVisible?'resume':'suspend');if(artPaused)sendArt('pause');});
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{artVisible=Boolean(entries[0]?.isIntersecting);sendArt(artVisible?'resume':'suspend');},{threshold:.04});observer.observe(art);}
    toggle.addEventListener('click',()=>{artPaused=!artPaused;updateArtToggle();sendArt(artPaused?'pause':'play');});
    window.addEventListener('message',e=>{
      if(e.source!==art.contentWindow)return;
      if(e.data?.type==='birthday-particle-phase')$('#hero-particle-phase').textContent=e.data.label;
      if(e.data?.type==='birthday-particle-palette')window.BIRTHDAY_EFFECTS?.setColor(e.data.color);
    });
    updateArtToggle();
    if(window.BIRTHDAY_EMBEDDED_SHOW){art.srcdoc=window.BIRTHDAY_EMBEDDED_SHOW;}else{art.src=art.dataset.src;}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
