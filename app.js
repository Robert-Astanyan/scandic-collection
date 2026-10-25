'use strict';
const STORE_KEY = 'scandic-vault-state-v1';
const DEFAULT_REPO = 'Robert-Astanyan/scandic-collection';
const PLACEHOLDER = 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="180" viewBox="0 0 280 180"><rect width="280" height="180" rx="32" fill="#c6d7ca"/><rect x="20" y="25" width="240" height="130" rx="25" fill="#faf8ee" stroke="#8c9e90" stroke-width="5"/><text x="140" y="99" text-anchor="middle" font-size="36" font-weight="bold" font-family="Georgia" fill="#24443c">SCANDIC</text></svg>');
const OPTIONS = [
  ['','— Դեռ չեմ նշել —'],
  ['missing','Չունեմ'],
  ['sealed','Ունեմ · փակ տուփ'],
  ['open','Ունեմ · բաց տուփ'],
  ['both','Ունեմ · բաց և փակ']
];
const app = {
  products:[],meta:{},records:{},custom:[],filter:'all',series:'all',query:'',
  githubRepo: DEFAULT_REPO,
  token: '',
  busy:false
};
const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(url){try{const u=new URL(String(url));return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function normalize(s){return String(s??'').toLocaleLowerCase('hy-AM').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function labelStatus(s){return OPTIONS.find(x=>x[0]===s)?.[1]||OPTIONS[0][1]}
function toast(message){const e=$('#toast');e.textContent=message;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),3400)}
function saveLocal(){try{localStorage.setItem(STORE_KEY,JSON.stringify({version:1,records:app.records,custom:app.custom,repo:app.githubRepo}));return true}catch{toast('Չհաջողվեց պահպանել այս սարքում');return false}}
function loadLocal(){try{const s=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');app.records=s.records||{};app.custom=s.custom||[];app.githubRepo=s.repo||DEFAULT_REPO}catch{app.records={};app.custom=[]}try{app.token=sessionStorage.getItem('scandic-github-token')||''}catch{}}
function allProducts(){const ids=new Set;return [...app.products,...app.custom].filter(p=>{if(ids.has(p.id))return false;ids.add(p.id);return true})}
function owned(s){return ['open','sealed','both'].includes(s)}
function stats(){const arr=allProducts();const values=arr.map(p=>app.records[p.id]?.status||'');const ownedCount=values.filter(owned).length;$('#total-count').textContent=arr.length;$('#owned-count').textContent=ownedCount;$('#sealed-count').textContent=values.filter(x=>x==='sealed'||x==='both').length;$('#open-count').textContent=values.filter(x=>x==='open'||x==='both').length}
function updateSeries(){const sel=$('#series-filter');const current=sel.value;sel.innerHTML='<option value="all">Բոլոր շարքերը</option>';[...new Set(allProducts().map(p=>p.series))].sort().forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o)});sel.value=[...sel.options].some(o=>o.value===current)?current:'all'}
function filtered(){return allProducts().filter(p=>{
 const s=app.records[p.id]?.status||'';
 if(app.series==='__collection'&&p.series==='Original')return false;
 if(app.series!=='all'&&app.series!=='__collection'&&p.series!==app.series)return false;
 if(app.filter==='owned'&&!owned(s))return false;
 if(app.filter==='sealed'&&!['sealed','both'].includes(s))return false;
 if(app.filter==='open'&&!['open','both'].includes(s))return false;
 if(app.filter==='favorite'&&!app.records[p.id]?.favorite)return false;
 if(app.filter==='missing'&&s!=='missing')return false;
 if(app.filter==='unmarked'&&s!=='')return false;
 if(app.query&&!normalize([p.series,p.flavor,p.design,p.id].join(' ')).includes(normalize(app.query)))return false;
 return true;
})}

function makePlaceholder(p){const box=document.createElement('div');box.className='image-fallback';box.innerHTML='<div class="placeholder-tin"><span class="placeholder-deer">♞</span><strong>SCANDIC</strong><small>COLLECTION</small></div>';return box}
const REGION={tl:['0%','0%'],tm:['50%','0%'],tr:['100%','0%'],bl:['0%','100%'],bm:['50%','100%'],br:['100%','100%']};
function palette(p){
 const n=normalize([p.flavor,p.series,p.design].join(' '));
 if(n.includes('cherry')||n.includes('բալ'))return ['#ffe5e9','#ffdce3','🍒'];
 if(n.includes('berry')||n.includes('berries')||n.includes('հատապտուղ'))return ['#e8e2ff','#e0dafe','🫐'];
 if(n.includes('citrus')||n.includes('ցիտրուս'))return ['#fff2cb','#dbf1ed','🍋'];
 if(n.includes('mango')||n.includes('մանգո'))return ['#fff2d4','#ffe1b9','🥭'];
 if(n.includes('apple')||n.includes('խնձոր'))return ['#ffe9df','#ffe1e4','🍎'];
 if(n.includes('cola')||n.includes('կոլա'))return ['#e9ddcd','#ebc8b5','✦'];
 if(n.includes('arctic'))return ['#e5f2fa','#e8edff','❄'];
 if(n.includes('vandal'))return ['#eee2f1','#e8d4e6','✦'];
 if(n.includes('gzhel'))return ['#e0eeff','#e5f5fe','❄'];
 if(n.includes('khokhloma'))return ['#fff0dc','#f9e6d8','✿'];
 if(n.includes('vangogh'))return ['#f3ecff','#dceeff','✦'];
 return ['#f4eee9','#f2e8e8','✧'];
}
function previewCrop(p){return !!p.position && (p.imageType==='group'||(p.series!=='Original'&&allProducts().filter(x=>x.image===p.image).length>1));}
function makePhoto(p,detail=false){
 const wrap=document.createElement('div');
 wrap.className=detail?'detail-art':'product-photo';
 const [a,b,fruit]=palette(p);wrap.style.setProperty('--shade-a',a);wrap.style.setProperty('--shade-b',b);
 const deco=document.createElement('span');deco.className='photo-decor';deco.textContent=fruit;deco.setAttribute('aria-hidden','true');wrap.append(deco);
 const url=safeUrl(p.image),cropped=url&&previewCrop(p)&&REGION[p.position];
 if(cropped){
   const sprite=document.createElement('div');sprite.className='individual-preview';sprite.setAttribute('role','img');sprite.setAttribute('aria-label',p.flavor+' · '+p.design+' (խմբային լուսանկարից առանձնացված նախադիտում)');
   sprite.style.backgroundImage='url("'+url.replace(/"/g,'%22')+'")';
   sprite.style.backgroundPosition=REGION[p.position].join(' ');
   wrap.append(sprite);wrap.classList.add('is-cropped');
   // In case a remote image is missing, keep a graceful individual placeholder.
   const loader=new Image();loader.onload=()=>{};loader.onerror=()=>{sprite.remove();wrap.append(makePlaceholder(p));wrap.classList.add('missing-photo')};loader.src=url;
 }else if(url){
   const img=document.createElement('img');img.className='product-tin';img.src=url;
   img.alt=p.flavor+' · '+p.design;img.loading=detail?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   img.onerror=()=>{img.remove();wrap.append(makePlaceholder(p));wrap.classList.add('missing-photo')};wrap.append(img);
 }else{wrap.append(makePlaceholder(p));wrap.classList.add('missing-photo')}
 if(!detail){
   if(cropped||p.imageType==='group'){const badge=document.createElement('span');badge.className='preview-badge';badge.textContent='◈ Նախադիտում';wrap.append(badge)}
   const code=document.createElement('span');code.className='product-code';code.textContent=p.id;wrap.append(code);
 }
 return wrap
}
function toggleFavorite(id){
 const was=app.records[id]||{};
 app.records[id]={...was,status:was.status||'',favorite:!was.favorite,updatedAt:new Date().toISOString()};
 saveLocal();render();toast(app.records[id].favorite?'Ավելացվեց սիրելիների մեջ ♡':'Հեռացվեց սիրելիներից');
}
function card(p){
 const el=document.createElement('article');el.className='product';
 const photo=makePhoto(p);const s=app.records[p.id]?.status||'';photo.classList.add('state-'+(s||'unmarked'));
 const badge=document.createElement('span');badge.className='state-badge '+(s||'unmarked');
 badge.textContent=s==='sealed'?'✦ Փակ տուփ':s==='open'?'◉ Բաց տուփ':s==='both'?'✓ Բաց և փակ':s==='missing'?'○ Չունեմ': '✓ Դեռ չեմ նշել';
 photo.append(badge);
 const fav=document.createElement('button');fav.type='button';fav.className='favorite-btn'+(app.records[p.id]?.favorite?' selected':'');fav.textContent=app.records[p.id]?.favorite?'♥':'♡';fav.setAttribute('aria-label',(app.records[p.id]?.favorite?'Հեռացնել սիրելիներից՝ ':'Ավելացնել սիրելիներին՝ ')+p.flavor);fav.onclick=()=>toggleFavorite(p.id);photo.append(fav);
 photo.addEventListener('click',e=>{if(!e.target.closest('button'))openDetail(p)});photo.tabIndex=0;photo.setAttribute('role','button');photo.setAttribute('aria-label',p.flavor+'՝ բացել մանրամասները');photo.addEventListener('keydown',e=>{if(e.key==='Enter')openDetail(p)});
 el.appendChild(photo);
 const body=document.createElement('div');body.className='product-body';
 body.innerHTML='<div class="product-series">'+esc(p.series)+'</div><h3>'+esc(p.flavor)+'</h3><div class="product-design">'+esc(p.design)+'</div>';
 const foot=document.createElement('div');foot.className='product-footer';
 const sel=document.createElement('select');sel.className='product-status';
 sel.setAttribute('aria-label',p.flavor+'՝ հավաքածուի վիճակ');
 for(const [value,label] of OPTIONS)sel.add(new Option(label,value));
 sel.value=s;sel.classList.add(s?'status-'+s:'status-unmarked');
 sel.addEventListener('change',()=>setStatus(p.id,sel.value));
 const more=document.createElement('button');more.type='button';more.className='detail-btn';more.textContent='↗';more.setAttribute('aria-label',p.flavor+'՝ մանրամասներ');more.onclick=()=>openDetail(p);
 foot.append(sel,more);body.append(foot);el.append(body);return el;
}

function render(){
 const arr=filtered(),host=$('#cards-grid');host.replaceChildren();
 $('#empty-state').hidden=arr.length>0;
 $('#result-count').textContent=arr.length+' / '+allProducts().length+' տուփ';
 if(arr.length){
  const sections=[{name:'Original համեր',list:arr.filter(p=>p.series==='Original'),sub:'Դասական SCANDIC համերը'},{name:'Հատուկ հավաքածուներ',list:arr.filter(p=>p.series!=='Original'),sub:'Յուրաքանչյուր դիզայնն՝ առանձին'}];
  for(const section of sections){
   if(!section.list.length)continue;
   const heading=document.createElement('div');heading.className='grid-section-title';
   heading.innerHTML='<div><span class="grid-section-dot"></span><strong>'+esc(section.name)+'</strong><small>'+esc(section.sub)+'</small></div><span class="grid-section-count">'+section.list.length+' տեսակ</span>';
   host.append(heading);
   for(const p of section.list)host.append(card(p));
  }
 }
 stats();
}
function setStatus(id,status,note){if(!OPTIONS.some(([x])=>x===status))return;const was=app.records[id]||{};app.records[id]={...was,status,note:note??was.note??'',updatedAt:new Date().toISOString()};saveLocal();render();toast(status?`Պահպանվեց՝ ${labelStatus(status)}`:'Նշումը մաքրվեց')}
function modal(title){$('#modal-title').textContent=title;$('#modal-body').replaceChildren();$('#modal-backdrop').hidden=false;document.body.style.overflow='hidden';$('#close-modal').focus()}
function closeModal(){$('#modal-backdrop').hidden=true;document.body.style.overflow=''}
function actions(parent,save){const row=document.createElement('div');row.className='modal-actions';const cancel=document.createElement('button');cancel.type='button';cancel.className='plain-button';cancel.textContent='Չեղարկել';cancel.onclick=closeModal;const ok=document.createElement('button');ok.type='button';ok.className='primary-button';ok.textContent='Պահպանել';ok.onclick=save;row.append(cancel,ok);parent.append(row)}
function field(parent,label,type='text',value='',placeholder=''){const l=document.createElement('label');l.className='modal-label';l.textContent=label;const input=document.createElement(type==='textarea'?'textarea':'input');if(type==='textarea')input.className='modal-textarea';else{input.className='modal-input';input.type=type}input.value=value||'';input.placeholder=placeholder;parent.append(l,input);return input}
function openDetail(p){modal('Տուփի մանրամասներ');const b=$('#modal-body');b.append(makePhoto(p,true));const title=document.createElement('h3');title.className='modal-detail-title';title.textContent=p.flavor;b.append(title);const sub=document.createElement('p');sub.className='modal-subhead';sub.textContent=`${p.series} · ${p.design} · ${p.id}`;b.append(sub);const l=document.createElement('label');l.className='modal-label';l.textContent='Իմ հավաքածուի վիճակը';b.append(l);const sel=document.createElement('select');sel.className='modal-select';OPTIONS.forEach(([value,label])=>sel.add(new Option(label,value)));sel.value=app.records[p.id]?.status||'';b.append(sel);const notes=field(b,'Նշում (ըստ ցանկության)','textarea',app.records[p.id]?.note||'','Օրինակ՝ նվեր է, կրկնօրինակ եմ փնտրում…');if(p.imageType==='group'){const info=document.createElement('p');info.className='hint';info.textContent='Այս դիզայնի համար առայժմ օգտագործվում է շարքի ընդհանուր լուսանկարը. անհատական նկարը դեռ պետք է հաստատվի։';b.append(info)}if(safeUrl(p.source)){const a=document.createElement('a');a.className='note-link';a.href=p.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Դիտել աղբյուրը ↗';b.append(a)}actions(b,()=>{setStatus(p.id,sel.value,notes.value);closeModal()})}
function openAdd(){modal('Ավելացնել SCANDIC');const b=$('#modal-body');const series=field(b,'Հավաքածու / շարք','text','','օրինակ՝ Collection · New Edition');const flavor=field(b,'Համի անունը','text','','օրինակ՝ Strawberry Mix');const design=field(b,'Դիզայն / տուփի նկարագրություն','text','','օրինակ՝ սպիտակ և կապույտ');const image=field(b,'Նկարի հղում (ցանկալի է)','url','','https://...');const source=field(b,'Աղբյուր (ըստ ցանկության)','url','','https://...');const info=document.createElement('p');info.className='hint';info.textContent='Այս պահին նոր տուփը պահպանվում է քո սարքում։ GitHub-ի համաժամեցումը միացնելուց հետո այն կարող է փոխանցվել նաև մյուս սարքերին։';b.append(info);actions(b,()=>{const f=flavor.value.trim();if(!f||!series.value.trim()){toast('Լրացրու առնվազն շարքն ու համը');return}const duplicate=allProducts().find(p=>normalize(p.series)===normalize(series.value)&&normalize(p.flavor)===normalize(f)&&normalize(p.design)===normalize(design.value));if(duplicate){toast('Այսպիսի տարբերակ արդեն կա');return}const id='USER-'+Date.now();app.custom.push({id,series:series.value.trim(),flavor:f,design:design.value.trim()||'Սեփական լրացում',image:safeUrl(image.value),source:safeUrl(source.value),imageType:'single',verified:false,accent:'#cde1c6',updatedAt:new Date().toISOString()});saveLocal();updateSeries();app.filter='all';app.series='all';app.query='';$('#search').value='';$('#series-filter').value='all';$$('.chip').forEach(x=>{x.classList.toggle('active',x.dataset.filter==='all');x.setAttribute('aria-pressed',x.dataset.filter==='all'?'true':'false')});render();closeModal();toast('Նոր տուփն ավելացվեց ♡')})}
function downloadBackup(){const blob=new Blob([JSON.stringify({format:'scandic-vault-backup',version:1,exportedAt:new Date().toISOString(),records:app.records,custom:app.custom},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='scandic-vault-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Պահուստային պատճենը պատրաստ է')}
function importBackup(file){if(!file)return;file.text().then(raw=>{const payload=JSON.parse(raw);if(payload.format!=='scandic-vault-backup'&&!payload.records)throw Error('Սխալ ձևաչափ');if(!confirm('Միավորե՞լ ներմուծված նշումները այս սարքի նշումների հետ։'))return;app.records=mergeRecords(app.records,payload.records||{});app.custom=mergeCustom(app.custom,payload.custom||[]);saveLocal();updateSeries();render();closeModal();toast('Ներմուծումը հաջողվեց')}).catch(()=>toast('Չհաջողվեց կարդալ ֆայլը'))}
function mergeRecords(a,b){const obj={...a};for(const [k,v]of Object.entries(b||{})){if(!v||typeof v!=='object'||!OPTIONS.some(([s])=>s===v.status))continue;const older=obj[k]?.updatedAt||'';if((v.updatedAt||'')>=older)obj[k]=v}return obj}
function mergeCustom(a,b){const map=new Map;for(const p of [...a,...b]){if(!p||typeof p!=='object'||!/^USER-\d+$/.test(p.id||''))continue;const old=map.get(p.id);if(!old||(p.updatedAt||'')>=(old.updatedAt||''))map.set(p.id,p)}return [...map.values()]}
function githubApi(repo,path){return 'https://api.github.com/repos/'+repo+'/contents/'+path}
function githubHeaders(token){return {'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}}
function utf8ToBase64(s){const bytes=new TextEncoder().encode(s);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(binary)}
function base64ToUtf8(s){const bin=atob(s.replace(/\s/g,''));const b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return new TextDecoder().decode(b)}
async function syncGithub(statusNode,saveButton){if(app.busy)return;const input=$('#github-token'),repoInput=$('#github-repo');const token=input.value.trim();const repo=repoInput.value.trim();if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token){statusNode.textContent='Նշիր repository-ն ու GitHub token-ը։';return}app.busy=true;saveButton.disabled=true;statusNode.textContent='Կապվում եմ GitHub-ին…';try{
 app.githubRepo=repo;app.token=token;try{sessionStorage.setItem('scandic-github-token',token)}catch{}
 const u=githubApi(repo,'data/collection-state.json');const response=await fetch(u,{headers:githubHeaders(token),cache:'no-store'});
 let remote={},sha=null;
 if(response.status===404){remote={records:{},custom:[]}}else if(response.ok){const obj=await response.json();sha=obj.sha;remote=JSON.parse(base64ToUtf8(obj.content||''))}else throw Error(response.status===401?'Token-ը սխալ է կամ ժամկետանց':response.status===403?'Դու չունես այս repository-ում գրել/կարդալու իրավունք':'Կարդալու սխալ՝ HTTP '+response.status);
 const mergedRecords=mergeRecords(app.records,remote.records||{});const mergedCustom=mergeCustom(app.custom,remote.custom||[]);
 const data=JSON.stringify({version:1,updatedAt:new Date().toISOString(),records:mergedRecords,custom:mergedCustom},null,2);
 statusNode.textContent='Պահպանում եմ համատեղ տվյալները…';const put=await fetch(u,{method:'PUT',headers:githubHeaders(token),body:JSON.stringify({message:'Sync collection progress',content:utf8ToBase64(data),...(sha?{sha}:{})})});
 if(!put.ok)throw Error(put.status===409?'Տվյալները փոխվել են. կրկին սեղմիր Համաժամեցնել':'Պահպանելու սխալ՝ HTTP '+put.status);
 app.records=mergedRecords;app.custom=mergedCustom;saveLocal();updateSeries();render();statusNode.textContent='✓ Համաժամեցված է GitHub-ի հետ։ Այժմ մյուս սարքում նույնպես սեղմիր «Համաժամեցնել»։';toast('GitHub համաժամեցումը հաջողվեց ✳');
 }catch(err){statusNode.textContent='✕ '+(err?.message||'Չհաջողվեց համաժամեցնել');}finally{app.busy=false;saveButton.disabled=false}}
function openSettings(){modal('Պահպանում և համաժամեցում');const b=$('#modal-body');const backup=document.createElement('div');backup.className='settings-block';backup.innerHTML='<h3>Պահուստային պատճեն</h3><p>Քո նշումները պահվում են այս սարքի բրաուզերում։ Կարող ես արտահանել JSON ֆայլ և ներմուծել ուրիշ սարք։</p>';
 const buttonRow=document.createElement('div');buttonRow.className='settings-button-row';const exp=document.createElement('button');exp.className='plain-button';exp.textContent='↓ Ներբեռնել նշումները';exp.onclick=downloadBackup;const imp=document.createElement('button');imp.className='plain-button';imp.textContent='↑ Ներմուծել նշումները';const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.addEventListener('change',()=>importBackup(file.files?.[0]));imp.onclick=()=>file.click();buttonRow.append(exp,imp,file);backup.append(buttonRow);b.append(backup);
 const sync=document.createElement('div');sync.className='settings-block';sync.innerHTML='<h3>GitHub համաժամեցում · երկու սարքի համար</h3><p>Երբ ստեղծես <strong>scandic-collection</strong> repository-ն և GitHub Pages-ը, կարող ես fine-grained token-ով համաժամեցնել քո նշումները։ Token-ը պահվում է միայն ընթացիկ բրաուզերի սեսիայում, չի ավելացվում կայքի կոդի մեջ։</p>';b.append(sync);
 const repo=field(sync,'Repository (owner/name)','text',app.githubRepo);repo.id='github-repo';const token=field(sync,'GitHub fine-grained personal access token','password',app.token,'github_pat_…');token.id='github-token';const note=document.createElement('div');note.className='privacy-note';note.textContent='🔒 Token-ի թույլտվությունը սահմանափակիր միայն այս repository-ով, Contents: Read and write։ Եթե repository-ն public է, այնտեղ պահված հավաքածուի վիճակներն էլ կարող են տեսանելի լինել։';sync.append(note);const syncBtn=document.createElement('button');syncBtn.className='primary-button';syncBtn.style.marginTop='13px';syncBtn.textContent='↻ Համաժամեցնել GitHub-ի հետ';const stat=document.createElement('div');stat.className='sync-status';syncBtn.onclick=()=>syncGithub(stat,syncBtn);sync.append(syncBtn,stat);
 const guidance=document.createElement('div');guidance.className='settings-block';guidance.innerHTML='<h3>Նոր համեր և նկարներ</h3><p>Կատալոգը բեռնվում է <code>data/catalog.json</code> ֆայլից։ Այդ ֆայլը GitHub-ում թարմացնելիս կայքում նոր տարբերակները կհայտնվեն՝ առանց քո գրանցումները կորցնելու։</p><p>Առանձին տուփ կարող ես ավելացնել նաև վերևի «+» կոճակով։</p>';b.append(guidance);
}
async function init(){loadLocal();try{let data;const embedded=$('#embedded-catalog');if(embedded){data=JSON.parse(embedded.textContent)}else{const res=await fetch('data/catalog.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);data=await res.json()}app.products=data.products||[];app.meta=data;$('#catalog-date').textContent=data.edition||'2026';updateSeries();render()}catch(err){$('#cards-grid').innerHTML='<div class="loading">Կատալոգը չի բեռնվում։ Կայքը բացիր GitHub Pages-ի հասցեով կամ տեղական սերվերով։</div>';console.error(err)}
 $('#search').addEventListener('input',e=>{app.query=e.target.value;render()});$('#series-filter').addEventListener('change',e=>{app.series=e.target.value;render()});$$('.chip').forEach(btn=>btn.addEventListener('click',()=>{app.filter=btn.dataset.filter;$$('.chip').forEach(ch=>{ch.classList.toggle('active',ch===btn);ch.setAttribute('aria-pressed',ch===btn?'true':'false')});render()}));$('#explore-btn').onclick=()=>$('#collection').scrollIntoView({behavior:'smooth'});$('#favorites-top').onclick=()=>{app.filter='favorite';$('.chip').forEach(b=>{b.classList.toggle('active',b.dataset.filter==='favorite');b.setAttribute('aria-pressed',b.dataset.filter==='favorite'?'true':'false')});$('#collection').scrollIntoView({behavior:'smooth'});render()};$('[data-series-quick]').forEach(b=>b.onclick=()=>{app.series=b.dataset.seriesQuick;$('#series-filter').value=app.series==='__collection'?'all':app.series;$('#collection').scrollIntoView({behavior:'smooth'});render()});$('#add-btn').onclick=openAdd;$('#settings-btn').onclick=openSettings;$('#footer-settings').onclick=openSettings;$('#close-modal').onclick=closeModal;$('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal-backdrop').hidden)closeModal()});$('#clear-filters').onclick=()=>{app.filter='all';app.series='all';app.query='';$('#series-filter').value='all';$('#search').value='';$$('.chip').forEach(ch=>{ch.classList.toggle('active',ch.dataset.filter==='all');ch.setAttribute('aria-pressed',ch.dataset.filter==='all'?'true':'false')});render()};window.addEventListener('storage',e=>{if(e.key===STORE_KEY){loadLocal();updateSeries();render()}});
 if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
document.addEventListener('DOMContentLoaded',init);
