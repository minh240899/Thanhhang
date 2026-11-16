/* Our Little World Admin v15 - Authenticated Vercel API; no client secrets. */
(()=>{
 'use strict';
 const cfg=window.BIRTHDAY_CONFIG||{};
 const cloud=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey);
 const $=(q,s=document)=>s.querySelector(q), $$=(q,s=document)=>[...s.querySelectorAll(q)];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
 const today=()=>new Date().toISOString();
 const empty=()=>({posts:[],trips:[],wishes:[],comments:[],wishComments:[],likes:{},wishLikes:{},liked:[],wishLiked:[]});
 const sample=window.BIRTHDAY_DEMO_SEED||{posts:[],trips:[],wishes:[]};
 const defaults={recipientName:cfg.recipientName||'Thanh Hằng',senderName:cfg.senderName||'Anh',heroMessage:cfg.heroMessage||'',storyTitle:'Những ngày bình thường, trở nên thật đẹp từ khi có em.',storyText1:'Không cần điều gì quá lớn lao. Chỉ là những lần cùng nhau dạo phố, chụp vài bức ảnh, đi qua những nơi mới, rồi lại có thêm thật nhiều chuyện để kể.',storyText2:'Trang web nhỏ này là một chiếc hộp ký ức: mỗi lần mở ra đều có thể tìm thấy một nụ cười.',journeyHeading:'Đi đâu cũng đẹp, miễn là cùng nhau.',journeySubtitle:'Những chuyến đi, điểm đến và câu chuyện muốn kể mãi.',letterTitle:'Chúc em một tuổi mới ngập tràn những điều dịu dàng.',letterText:'Hãy cứ cười thật nhiều, làm những điều mình thích và tận hưởng từng khoảnh khắc. Mong rằng sau này nhìn lại, chúng mình sẽ có thêm thật nhiều câu chuyện đẹp để kể.',musicUrl:cfg.musicUrl||'assets/birthday_theme.mp3'};
 let state=empty(),settings={...defaults},db=null,section='dashboard',editType=null,editId=null,pendingFile=null;
 const safeUrl=v=>{v=String(v||'').trim();return /^(assets\/[\w./-]+|https:\/\/[^\s"'<>]+|data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+|localvideo:\/\/[\w-]+)$/.test(v)?v:''};
 const safeCover=v=>{const u=safeUrl(v);return u&&!u.startsWith('localvideo:')?(window.BIRTHDAY_DEMO_ASSETS?.[u]||u):(window.BIRTHDAY_DEMO_ASSETS?.['assets/flowers.svg']||'assets/flowers.svg')};
 const mediaFor=x=>Array.isArray(x?.media_items)&&x.media_items.length?x.media_items:(x?.image_urls||[]).map(url=>({type:'image',url}));
 const approved=x=>x.approved!==false;
 const published=x=>x.published!==false;
 const sortedTrips=()=>[...state.trips].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
 function notify(text,error=false){const a=$('#alert');a.textContent=text;a.classList.toggle('error',error);a.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>a.hidden=true,5200);}
 function confirmDelete(label){return window.confirm(`Xóa vĩnh viễn “${label}” khỏi bản demo này?`);}
 function noCloud(){if(cloud){notify('Không thể sửa Supabase từ Admin demo. Cần triển khai xác thực và phân quyền backend.',true);return false;}return true;}
 let serverVersion=0,serverCache=null;
 async function callServer(url,options={}){const resp=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await resp.json().catch(()=>({}));if(!resp.ok)throw new Error(data.error||`HTTP ${resp.status}`);return data;}
 async function openDB(){return true;}
 async function read(key){if(!serverCache){serverCache=await callServer('/api/admin/data');serverVersion=serverCache.revision;}return key==='site-state'?(serverCache.revision?serverCache.state:null):key==='site-settings'?serverCache.settings:null;}
 async function write(key,value){const output=await callServer('/api/admin/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,value,revision:serverVersion})});serverVersion=output.revision;if(!serverCache)serverCache={};serverCache[key==='site-state'?'state':'settings']=value;serverCache.revision=serverVersion;}
 async function persist(){await write('site-state',state);}
 function imageFor(x){return safeCover(x?.image_url || mediaFor(x)[0]?.url || 'assets/flowers.svg')}
 function makeCard({image,title,description,meta,pill,extra='',actions=[],id}){
  const card=document.createElement('article');card.className='entry'+(!image?' no-img':'');card.dataset.id=id;
  const thumb=image?`<img class="entry-img" src="${esc(safeCover(image))}" alt="" loading="lazy">`:'';
  card.innerHTML=thumb+`<div class="entry-content"><h3>${esc(title)}</h3><p>${esc(description||'')}</p><div class="entry-meta">${esc(meta||'')} ${pill?`<span class="pill ${esc(pill[1])}">${esc(pill[0])}</span>`:''}</div></div><div class="entry-actions">${actions.map(a=>`<button type="button" class="btn tiny ${a.variant||'light'}" data-action="${esc(a.action)}" ${a.disabled?'disabled':''}>${esc(a.label)}</button>`).join('')}${extra}</div>`;
  return card;
 }
 function setupEntry(container,item,handlers){for(const [action,fn] of Object.entries(handlers))$(`[data-action="${action}"]`,item)?.addEventListener('click',fn);container.append(item);}
 function renderDashboard(){const n=(key)=>state[key].length, pending=state.wishes.filter(x=>!approved(x)).length+state.posts.filter(x=>!approved(x)).length+state.comments.filter(x=>!approved(x)).length+state.wishComments.filter(x=>!approved(x)).length;
  $('#stats').innerHTML=[['Hành trình',n('trips')],['Album ảnh & video',n('posts')],['Lời chúc',n('wishes')],['Đang ẩn',pending]].map(([label,num])=>`<div class="stat-card"><strong>${num}</strong><span>${esc(label)}</span></div>`).join('');
  $('#pending-summary').textContent=`Tự đăng công khai; hiện có ${pending} mục đang ẩn. Có thể quản lý hoặc xóa nội dung bất kỳ lúc nào.`;
 }
 function renderJourneys(){const root=$('#trips-list');root.replaceChildren();const items=sortedTrips();$('#trips-total').textContent=`${items.length} chuyến đi · ${items.filter(published).length} đang hiển thị`;
  if(!items.length){root.innerHTML='<p class="empty">Chưa có hành trình. Nhấn “Thêm chuyến đi” để tạo.</p>';return;}
  items.forEach((t,i)=>{const entry=makeCard({id:t.id,image:t.image_url,title:t.title,description:t.description,meta:t.label||'CHUYẾN ĐI',pill:published(t)?['Hiển thị','published']:['Đang ẩn','pending'],actions:[{action:'edit',label:'Sửa'},{action:'toggle',label:published(t)?'Ẩn':'Hiện'},{action:'up',label:'↑',disabled:i===0},{action:'down',label:'↓',disabled:i===items.length-1},{action:'delete',label:'Xóa',variant:'danger'}]});
   setupEntry(root,entry,{edit:()=>openEditor('trip',t.id),toggle:()=>mutate(()=>{t.published=!published(t)}),up:()=>reorder(t.id,-1),down:()=>reorder(t.id,1),delete:()=>remove('trip',t)});
  });
 }
 function renderMemories(){const root=$('#memories-list');root.replaceChildren();const filter=$('#memory-status').value;const items=state.posts.filter(p=>filter==='all'||(filter==='published'?approved(p):!approved(p))).slice().reverse();
  if(!items.length){root.innerHTML='<p class="empty">Không có album nào trong mục này.</p>';return;}
  items.forEach(p=>{const n=mediaFor(p).length,item=makeCard({id:p.id,image:imageFor(p),title:p.title,description:p.body,meta:`${p.category||'Đời thường'} · ${n} ảnh/video · ${p.author||''}`,pill:approved(p)?['Đang hiển thị','published']:['Đang ẩn','pending'],actions:[{action:'edit',label:'Sửa'},{action:'toggle',label:approved(p)?'Ẩn':'Hiện'},{action:'delete',label:'Xóa',variant:'danger'}]});
   setupEntry(root,item,{edit:()=>openEditor('post',p.id),toggle:()=>mutate(()=>{p.approved=!approved(p)}),delete:()=>remove('post',p)});
  });
 }
 function renderWishes(){const root=$('#wishes-list');root.replaceChildren();const filter=$('#wishes-filter').value;const items=[...state.wishes].reverse().filter(w=>filter==='all'||(filter==='pending'?!approved(w):filter==='published'?approved(w):w.group_type===filter));
  if(!items.length){root.innerHTML='<p class="empty">Chưa có lời chúc trong nhóm này.</p>';return;}
  items.forEach(w=>{const item=makeCard({id:w.id,image:mediaFor(w).length?imageFor(w):null,title:w.author,description:w.message,meta:w.group_type||'Bạn bè & đồng nghiệp',pill:approved(w)?['Đang hiển thị','published']:['Đang ẩn','pending'],actions:[{action:'edit',label:'Sửa'},{action:'toggle',label:approved(w)?'Ẩn':'Hiện'},{action:'delete',label:'Xóa',variant:'danger'}]});
   setupEntry(root,item,{edit:()=>openEditor('wish',w.id),toggle:()=>mutate(()=>{w.approved=!approved(w)}),delete:()=>remove('wish',w)});
  });
 }
 function renderComments(){const root=$('#comments-list');root.replaceChildren();const filter=$('#comments-filter').value;const all=[...state.comments.map(x=>({...x,_type:'comment'})),...state.wishComments.map(x=>({...x,_type:'wishComment'}))].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));const items=all.filter(x=>filter==='all'||(filter==='pending'?!approved(x):approved(x)));
  if(!items.length){root.innerHTML='<p class="empty">Không có bình luận trong nhóm này.</p>';return;}
  items.forEach(c=>{const parent=c._type==='comment'?state.posts.find(p=>p.id===c.memory_id):state.wishes.find(w=>w.id===c.wish_id),source=c._type==='comment'?`Album: ${parent?.title||'(đã xóa)'}`:`Lời chúc: ${parent?.author||'(đã xóa)'}`;const item=makeCard({id:c.id,title:c.author,description:c.message,meta:source,pill:approved(c)?['Đang hiển thị','published']:['Đang ẩn','pending'],actions:[{action:'toggle',label:approved(c)?'Ẩn':'Hiện'},{action:'delete',label:'Xóa',variant:'danger'}]});
   setupEntry(root,item,{toggle:()=>mutate(()=>{const source=(c._type==='comment'?state.comments:state.wishComments).find(x=>x.id===c.id);if(source)source.approved=!approved(source)}),delete:()=>remove(c._type,c)});
  });
 }
 function fillSettings(){const form=$('#settings-form');for(const [k,v] of Object.entries(settings)){const el=form.elements.namedItem(k);if(el)el.value=String(v??'')}}
 function render(){renderDashboard();renderJourneys();renderMemories();renderWishes();renderComments();fillSettings();}
 async function mutate(fn){if(!noCloud())return;try{fn();await persist();render();notify('Đã lưu thay đổi. Tải lại trang sinh nhật để xem kết quả.')}catch(e){notify(e.message,true);if(/dữ liệu đã thay đổi|xung đột/i.test(e.message))serverCache=null}}
 function reorder(id,offset){const sorted=sortedTrips(),index=sorted.findIndex(x=>x.id===id),next=index+offset;if(index<0||next<0||next>=sorted.length)return;[sorted[index],sorted[next]]=[sorted[next],sorted[index]];mutate(()=>sorted.forEach((x,i)=>x.sort_order=i));}
 async function remove(type,item){if(!noCloud()||!confirmDelete(item.title||item.author||item.message))return;await mutate(()=>{
  if(type==='trip')state.trips=state.trips.filter(x=>x.id!==item.id);
  if(type==='post'){state.posts=state.posts.filter(x=>x.id!==item.id);state.comments=state.comments.filter(x=>x.memory_id!==item.id);delete state.likes[item.id];state.liked=state.liked.filter(x=>x!==item.id)}
  if(type==='wish'){state.wishes=state.wishes.filter(x=>x.id!==item.id);state.wishComments=state.wishComments.filter(x=>x.wish_id!==item.id);delete state.wishLikes[item.id];state.wishLiked=state.wishLiked.filter(x=>x!==item.id)}
  if(type==='comment')state.comments=state.comments.filter(x=>x.id!==item.id);
  if(type==='wishComment')state.wishComments=state.wishComments.filter(x=>x.id!==item.id);
 })}
 function navTo(next){section=next;$$('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===next));$$('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===next));const active=$(`[data-section="${next}"]`);$('#section-label').textContent=active?.textContent.trim()||next;$('#sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'instant'});}
 const input=(key,label,value='',required=false,more='')=>`<label>${esc(label)}<input name="${esc(key)}" value="${esc(value)}" ${required?'required':''} ${more}></label>`;
 const textarea=(key,label,value='',rows=3)=>`<label>${esc(label)}<textarea name="${esc(key)}" rows="${rows}">${esc(value)}</textarea></label>`;
 const select=(key,label,value,arr)=>`<label>${esc(label)}<select name="${esc(key)}">${arr.map(x=>`<option ${x===value?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
 const check=(key,label,value)=>`<label class="checkrow"><input type="checkbox" name="${esc(key)}" ${value?'checked':''}> <span>${esc(label)}</span></label>`;
 function openEditor(type,id=null){if(!noCloud())return;editType=type;editId=id;pendingFile=null;const coll={trip:state.trips,post:state.posts,wish:state.wishes}[type];const entry=coll.find(x=>x.id===id)||{};$('#editor-title').textContent=({trip:'Hành trình',post:'Album ảnh / video',wish:'Lời chúc'})[type];$('#editor-kicker').textContent=id?'CHỈNH SỬA':'THÊM MỚI';$('#editor-error').hidden=true;
  let fields='';
  if(type==='trip')fields=input('title','Tên chuyến đi',entry.title||'',true,'maxlength="100"')+input('date','Ngày đi (nếu có)',entry.date||'',false,'type="date"')+input('location','Địa điểm (nếu có)',entry.location||'',false,'maxlength="100"')+input('label','Nhãn hiển thị (ví dụ: CHUYẾN ĐI #04)',entry.label||`CHUYẾN ĐI #${String(state.trips.length+1).padStart(2,'0')}`)+textarea('description','Câu chuyện chuyến đi',entry.description||'',4)+input('image_url','Ảnh đại diện (URL hoặc assets/)',entry.image_url||'assets/coast.svg')+textarea('image_urls','Danh sách ảnh chuyến đi (mỗi dòng một URL)',(Array.isArray(entry.image_urls)&&entry.image_urls.length?entry.image_urls:(entry.image_url?[entry.image_url]:[])).join('\n'),4)+`<label>Chọn nhiều ảnh chuyến đi<input name="image_files" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>Chọn tối đa 12 ảnh JPG/PNG/WebP. Ảnh được nén và lưu trên Vercel Blob.</small></label>`+`<label>Liên kết đến album đã đăng<select name="linked_album_id"><option value="">Không liên kết</option>${state.posts.map(p=>`<option value="${esc(p.id)}" ${entry.linked_album_id===p.id?'selected':''}>${esc(p.title)}</option>`).join('')}</select></label>`+check('published','Hiển thị trên trang sinh nhật',published(entry));
  if(type==='post')fields=input('title','Tên album',entry.title||'',true,'maxlength="90"')+input('author','Người đăng',entry.author||'Admin',true,'maxlength="40"')+textarea('body','Nội dung bài viết',entry.body||'',4)+select('category','Danh mục',entry.category||'Du lịch',['Du lịch','Hẹn hò','Đời thường','Bạn bè & đồng nghiệp','Gia đình'])+textarea('media_urls','Các đường dẫn ảnh/video hiện có (mỗi dòng một URL)',mediaFor(entry).map(m=>m.url).join('\n'),4)+`<label>Tải thêm ảnh/video<input type="file" name="media_files" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple><small>Video tối đa 3,5 MB/tệp, ảnh đầu vào tối đa 8 MB (tự nén), 10 tệp trong album.</small></label>`+check('approved','Công khai trên website',approved(entry));
  if(type==='wish')fields=input('author','Người gửi',entry.author||'',true,'maxlength="40"')+select('group_type','Nhóm',entry.group_type||'Bạn bè & đồng nghiệp',['Gia đình','Bạn bè & đồng nghiệp','Người thương'])+textarea('message','Lời chúc',entry.message||'',5)+textarea('media_urls','Đường dẫn ảnh/video hiện có (mỗi dòng một URL)',mediaFor(entry).map(m=>m.url).join('\n'),3)+`<label>Thêm ảnh/video<input name="media_files" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple><small>Tối đa 5 tệp, 1 video (3,5 MB/tệp; ảnh được nén).</small></label>`+check('approved','Hiển thị công khai',approved(entry));
  $('#editor-fields').innerHTML=fields;$('#editor').showModal();
 }
 async function uploadBlob(file){if(!file||file.size>3500000)throw new Error('Tệp tải lên tối đa 3,5 MB. Video lớn hơn: dán URL HTTPS trực tiếp.');const r=await callServer('/api/admin/upload',{method:'POST',headers:{'Content-Type':file.type},body:file});return r.url;}
 async function compressImage(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Chỉ hỗ trợ JPG/PNG/WebP tối đa 8 MB.');const u=URL.createObjectURL(file);try{const img=new Image();await new Promise((ok,bad)=>{img.onload=ok;img.onerror=bad;img.src=u;});const c=document.createElement('canvas'),factor=Math.min(1,1100/Math.max(img.width,img.height));c.width=Math.round(img.width*factor);c.height=Math.round(img.height*factor);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.7));return uploadBlob(new File([blob],'optimized.jpg',{type:'image/jpeg'}));}finally{URL.revokeObjectURL(u);}}
 async function saveVideo(file){if(!['video/mp4','video/webm'].includes(file.type))throw new Error('Chỉ hỗ trợ MP4/WebM');return uploadBlob(file);}
 async function uploadFiles(files){const result=[];for(const f of files){if(['video/mp4','video/webm'].includes(f.type))result.push({type:'video',url:await saveVideo(f)});else result.push({type:'image',url:await compressImage(f)});}return result;}
 async function saveEditor(event){event.preventDefault();if(!noCloud())return;const button=$('#save-editor'),err=$('#editor-error');err.hidden=true;button.disabled=true;
  try{const f=new FormData($('#editor-form')),get=x=>String(f.get(x)||'').trim();const collection={trip:state.trips,post:state.posts,wish:state.wishes}[editType];const existing=collection.find(x=>x.id===editId);const entry=existing?{...existing}:{id:uid(),created_at:today()};
   if(editType==='trip'){
    if(!get('title'))throw new Error('Cần nhập tên chuyến đi');
    Object.assign(entry,{title:get('title'),description:get('description'),label:get('label')||'CHUYẾN ĐI',date:get('date'),location:get('location'),linked_album_id:get('linked_album_id'),image_url:get('image_url')||'assets/coast.svg',published:f.has('published')});
    const files=f.getAll('image_files').filter(file=>file instanceof File&&file.size);
    let typedUrls=get('image_urls').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const originalCover=entry.image_url;
    if(!existing&&files.length&&originalCover==='assets/coast.svg')typedUrls=typedUrls.filter(url=>url!=='assets/coast.svg');
    const oldCover=(files.length&&originalCover==='assets/coast.svg')?'':originalCover;
    if(new Set([oldCover,...typedUrls].filter(Boolean)).size+files.length>12)throw new Error('Tối đa 12 ảnh trong mỗi chuyến đi.');
    const uploaded=[];for(const file of files)uploaded.push(await compressImage(file));
    if(files.length&&(!existing||originalCover==='assets/coast.svg'))entry.image_url=uploaded[0];
    const images=[...new Set([entry.image_url,...typedUrls,...uploaded].filter(Boolean))];
    if(images.length>12)throw new Error('Tối đa 12 ảnh trong mỗi chuyến đi.');
    if(images.some(url=>!safeUrl(url)||url.startsWith('localvideo:')))throw new Error('URL ảnh phải là HTTPS, assets/ hoặc ảnh đã tải lên.');
    entry.image_urls=images;
    if(!existing)entry.sort_order=state.trips.length;
   } else {
    const fields=editType==='post'?{title:get('title'),author:get('author'),body:get('body'),category:get('category')}:{author:get('author'),message:get('message'),group_type:get('group_type')};
    if(!fields.author||editType==='post'&&!fields.title||editType==='wish'&&!fields.message)throw new Error('Vui lòng nhập đủ trường bắt buộc');
    Object.assign(entry,fields,{approved:f.has('approved')});
    const urls=get('media_urls').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    let previous=mediaFor(existing||{});const oldMap=new Map(previous.map(m=>[m.url,m.type]));
    const medias=urls.map(url=>{if(!safeUrl(url))throw new Error('Có URL ảnh/video không hợp lệ');return{type:oldMap.get(url)||(url.startsWith('localvideo://')||/\.(mp4|webm)(\?|$)/i.test(url)?'video':'image'),url}});
    const files=[...(f.getAll('media_files').filter(x=>x instanceof File&&x.size))];
    const max=editType==='post'?10:5,maxVideo=editType==='post'?2:1;
    if(medias.length+files.length>max || medias.filter(m=>m.type==='video').length + files.filter(f=>f.type.startsWith('video/')).length>maxVideo)throw new Error(`Tối đa ${max} tệp, ${maxVideo} video.`);
    medias.push(...await uploadFiles(files));
    Object.assign(entry,{media_items:medias,image_urls:medias.filter(x=>x.type==='image').map(m=>m.url),image_url:medias.find(x=>x.type==='image')?.url||null});
    if(editType==='post'&&!medias.length)throw new Error('Album cần ít nhất một ảnh hoặc video.');
   }
   if(existing)Object.assign(existing,entry);else collection.unshift(entry);
   await persist();$('#editor').close();render();notify('Đã lưu nội dung. Tải lại trang công khai để xem.')
  }catch(e){err.textContent=e.message||'Không thể lưu';err.hidden=false}finally{button.disabled=false}
 }
 function validateImported(d){if(!d||typeof d!=='object'||!d.state||typeof d.state!=='object')throw new Error('Không phải tệp sao lưu của website');for(const key of ['trips','posts','wishes','comments','wishComments'])if(!Array.isArray(d.state[key]))throw new Error(`Tệp thiếu ${key}`);return true}
 function exportJSON(){if(!noCloud())return;const blob=new Blob([JSON.stringify({format:'birthday-admin-v14',exportedAt:today(),state,settings,notice:'Video lưu trong IndexedDB không nằm trong JSON'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`birthday-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Đã tạo bản sao lưu JSON.');}
 async function importJSON(file){if(!noCloud())return;if(file.size>25*1024*1024)throw new Error('Tệp JSON vượt 25 MB.');const data=JSON.parse(await file.text());validateImported(data);if(!window.confirm('Nhập file sẽ ghi đè toàn bộ dữ liệu và cấu hình trong trình duyệt này. Tiếp tục?'))return;
  state={...empty(),...data.state};settings={...defaults,...(data.settings||{})};await write('site-state',state);await write('site-settings',settings);try{localStorage.removeItem('birthday-music-url-v6');if(settings.musicUrl)localStorage.setItem('birthday-admin-music-url',settings.musicUrl)}catch{}render();navTo('dashboard');notify('Đã khôi phục dữ liệu. Hãy tải lại trang công khai.');}
 async function init(){db=await openDB();if(!db){notify('Không mở được IndexedDB. Hãy dùng Chromium/Firefox và chạy qua http://localhost.',true);return;}
  if(cloud){$('#cloud-notice').hidden=false;document.body.classList.add('cloud-disabled')}
  const saved=await read('site-state');state=saved?{...empty(),...saved}:{...empty(),posts:structuredClone(sample.posts),trips:structuredClone(sample.trips).map((t,i)=>({...t,sort_order:i,published:true})),wishes:structuredClone(sample.wishes)};
  settings={...defaults,...(await read('site-settings')||{})};if(!saved&&!cloud)await persist();
  $$('[data-section]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.section)));
  $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.jump;navTo(s);if(b.dataset.new)openEditor(s==='journeys'?'trip':'post')}));
  $('#nav-open').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#add-trip').addEventListener('click',()=>openEditor('trip'));$('#add-memory').addEventListener('click',()=>openEditor('post'));$('#add-wish').addEventListener('click',()=>openEditor('wish'));
  $('#editor-form').addEventListener('submit',saveEditor);$('#close-editor').addEventListener('click',()=>$('#editor').close());$('#cancel-editor').addEventListener('click',()=>$('#editor').close());
  ['memory-status','wishes-filter','comments-filter'].forEach(id=>$('#'+id).addEventListener('change',render));
  $('#settings-form').addEventListener('submit',async ev=>{ev.preventDefault();if(!noCloud())return;const fd=new FormData(ev.currentTarget),s={};for(const key of Object.keys(defaults))s[key]=String(fd.get(key)||'').trim();if(s.musicUrl&&!/^https:\/\/[^\s"'<>]+$|^assets\/[\w./-]+$/.test(s.musicUrl)){notify('Nhạc cần là link HTTPS trực tiếp hoặc đường dẫn assets/',true);return;}try{settings={...settings,...s};await write('site-settings',settings);try{localStorage.removeItem('birthday-music-url-v6');if(s.musicUrl)localStorage.setItem('birthday-admin-music-url',s.musicUrl)}catch{}notify('Đã lưu cấu hình. Hãy mở lại website để xem.')}catch(e){notify(e.message,true)}});
  $('#export-data').addEventListener('click',exportJSON);$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{await importJSON(file)}catch(x){notify('Nhập thất bại: '+x.message,true)}e.target.value='';});
  $('#reset-data').addEventListener('click',async()=>{if(!noCloud()||!window.confirm('Bạn chắc chắn muốn xóa tất cả thay đổi và khôi phục dữ liệu mẫu?'))return;state={...empty(),posts:structuredClone(sample.posts),trips:structuredClone(sample.trips).map((t,i)=>({...t,sort_order:i,published:true})),wishes:structuredClone(sample.wishes)};settings={...defaults};await persist();await write('site-settings',settings);render();notify('Đã khôi phục dữ liệu mẫu.');});
  window.addEventListener('storage',e=>{if(e.key==='birthday-admin-refresh')read('site-state').then(s=>{if(s){state={...empty(),...s};render()}})});
  navTo('dashboard');
  window.BIRTHDAY_ADMIN_DEBUG={get state(){return state},get settings(){return settings},navigate:navTo};
 }
 document.addEventListener('DOMContentLoaded',async()=>{
  const wall=document.getElementById('login-wall'),login=document.getElementById('login-form'),error=document.getElementById('login-error');let initialized=false;
  async function boot(){if(initialized)return;initialized=true;document.body.classList.remove('admin-locked');wall.hidden=true;wall.style.display='none';try{await init()}catch(e){initialized=false;document.body.classList.add('admin-locked');wall.hidden=false;wall.style.display='grid';error.textContent=e.message;error.hidden=false;}}
  login.addEventListener('submit',async ev=>{ev.preventDefault();error.hidden=true;const button=login.querySelector('button');button.disabled=true;try{await callServer('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('login-username').value.trim(),password:document.getElementById('login-password').value})});document.getElementById('login-password').value='';serverCache=null;await boot()}catch(e){error.textContent=e.message;error.hidden=false}finally{button.disabled=false;}});
  document.getElementById('logout-admin').addEventListener('click',async()=>{try{await callServer('/api/admin/logout',{method:'POST'})}catch{}location.reload()});
  try{await callServer('/api/admin/session');await boot()}catch{document.body.classList.add('admin-locked');wall.hidden=false;}
});
})();
