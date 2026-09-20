const $ = (s, root=document) => root.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast = (msg) => { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2200); };
const inlineText = (v='') => esc(String(v).replace(/\s+/g,' ').trim());
let content;

async function loadContent(){
  try{
    const r=await fetch('/api/content',{cache:'no-store'});
    if(r.ok){ const d=await r.json(); if(d?.content) return d.content; }
  }catch(e){}
  const r=await fetch('/data/default.json',{cache:'no-store'});
  return r.json();
}

function img(url, alt, cls='', zoom=true){
  return url ? `<img class="${cls}" src="${esc(url)}" alt="${esc(alt)}" loading="lazy" decoding="async"${zoom?' data-zoom="true" tabindex="0" role="button"':''}>` : `<div class="media-placeholder ${cls}">이미지를 등록해주세요</div>`;
}
function sectionHead(eyebrow,title,desc=''){return `<div class="section-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h2 class="section-title">${esc(title)}</h2>${desc?`<p class="section-desc">${esc(desc)}</p>`:''}</div></div>`}

function renderSite(c){
  const s=c.site||{};
  document.documentElement.style.setProperty('--accent',s.accent||'#9389DE');
  document.documentElement.style.setProperty('--cream',s.cream||'#FFFDE5');
  document.title=`${s.artistName||'Artist'} · 작업 안내`;
  const app=$('#app');
  app.innerHTML=`
    <section class="artist-card card">
      ${s.profileImage ? `<img class="artist-photo" src="${esc(s.profileImage)}" alt="${esc(s.artistName||'작가')} 프로필">` : `<div class="artist-photo placeholder">✦</div>`}
      <div class="artist-copy"><div class="eyebrow">ARTIST PROFILE</div><h1 class="artist-name">${esc(s.artistName||'작가명')}</h1><p class="artist-subtitle">${esc(s.subtitle||'')}</p><p class="artist-programs">${esc(s.programs||'')}</p><p class="artist-description">${inlineText(s.description||'')}</p></div>
    </section>
    <section class="schedule-card card"><div class="schedule-icon">↗</div><div><strong>작업 일정 안내</strong><p>${esc(s.scheduleText||'')}</p></div></section>
    ${renderNotices(c.notices||[])}
    ${renderWorkflow(c.workflow||[])}
    ${renderAvatars(c.avatars||[])}
    ${renderPremades(c.premades||[])}
    ${renderPortfolio(c.portfolioCategories||[])}
    ${renderCollaborators(c.collaborators||{})}
    ${renderInquiry(c.inquiry||{})}
  `;
  bindTabs(); bindPremadeTabs(); bindPortfolioSlider(); bindLightbox(); bindInquiry();
}

function renderNotices(list){return `<section class="section">${sectionHead('NOTICE','안내 및 유의사항','필요한 항목을 눌러 자세한 내용을 확인해주세요.')}<div class="accordion-list">${list.map((n,i)=>`<details class="notice card" ${i===0?'open':''}><summary>${esc(n.title)}</summary><div class="notice-body"><ul>${(n.items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')||'<div class="empty">등록된 안내사항이 없습니다.</div>'}</div></section>`}
function renderWorkflow(list){return `<section class="section">${sectionHead('PROCESS','작업 진행 순서')}<div class="workflow">${list.map((x,i)=>`<article class="workflow-item card"><div class="workflow-num">${i+1}</div><h3>${esc(x.title)}</h3>${x.description?`<p>${esc(x.description)}</p>`:''}</article>`).join('')||'<div class="empty">등록된 작업 순서가 없습니다.</div>'}</div></section>`}
function renderAvatars(list){
  const photos=[];
  (list||[]).forEach(a=>(a.images||[]).filter(Boolean).forEach((u,i)=>photos.push({url:u,alt:`${a.name||'아바타'} ${i+1}`})));
  return `<section class="section">${sectionHead('AVATAR LIST','보유 아바타 목록')}<div class="avatar-wall">${photos.map(x=>`<button type="button" class="avatar-tile" aria-label="${esc(x.alt)} 크게 보기"><img src="${esc(x.url)}" alt="${esc(x.alt)}" loading="lazy" decoding="async" data-zoom="true"></button>`).join('')||'<div class="empty">등록된 아바타가 없습니다.</div>'}</div></section>`;
}
function premadeCard(p){
  return `<article class="premade-card card"><div class="premade-top"><div class="premade-media">${img(p.faceImage,`${p.name} 얼굴`)}</div><div class="premade-media">${img(p.motionGif,`${p.name} 움직임`)}</div></div><div class="premade-meta"><div class="premade-name-row"><div><h3 class="premade-name">${esc(p.name)}</h3><div class="premade-base">${esc(p.baseModel||'')}</div></div><div class="price">${esc(p.price||'')}</div></div><p class="premade-desc">${esc(p.description||'')}</p><div class="chips">${(p.included||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div></article>`;
}
function renderPremades(list){
  const items=(list||[]);
  const head=sectionHead('READY-MADE','현재 판매중인 개인작','빠르게 아바타를 받고 싶은 분들을 위한 1인 한정 개인작입니다.');
  if(!items.length)return `<section class="section">${head}<div class="empty">현재 판매중인 개인작이 없습니다.</div></section>`;
  if(items.length<3)return `<section class="section">${head}<div class="premade-grid">${items.map(premadeCard).join('')}</div></section>`;
  return `<section class="section">${head}<div class="tabs premade-tabs" data-tabs="premade">${items.map((p,i)=>`<button class="tab-btn ${i===0?'active':''}" data-premade-tab="${i}">${esc(p.name||`개인작 ${String.fromCharCode(65+i)}`)}</button>`).join('')}</div><div id="premadePanel" class="premade-tab-panel">${premadeCard(items[0])}</div></section>`;
}
function renderPortfolio(list){const first=list[0];return `<section class="section">${sectionHead('PORTFOLIO','포트폴리오','카테고리를 선택한 뒤 아래 슬라이드 바를 움직여 더 많은 작업물을 확인할 수 있습니다.')}<div class="tabs" data-tabs="portfolio">${list.map((a,i)=>`<button class="tab-btn ${i===0?'active':''}" data-tab="${i}">${esc(a.name)}</button>`).join('')}</div><div id="portfolioPanel" class="portfolio-wrap">${first?portfolioPanel(first):'<div class="empty">등록된 포트폴리오가 없습니다.</div>'}</div></section>`}
function newestPortfolioItems(cat){
  return (cat.items||[]).map((item,index)=>({item,index,stamp:Number(item.updatedAt||item.createdAt||0)})).sort((a,b)=>{
    if(a.stamp||b.stamp){if(a.stamp!==b.stamp)return b.stamp-a.stamp;}
    return b.index-a.index;
  }).map(x=>x.item);
}
function portfolioPanel(cat){
  const items=newestPortfolioItems(cat);
  if(!items.length) return '<div class="empty">이 카테고리에 등록된 작업물이 없습니다.</div>';
  const kind=cat.layout==='compare'?'compare':cat.layout==='wide'?'wide':cat.layout==='gif'?'compact':'grid';
  const cards=cat.layout==='compare'
    ? items.map((it,i)=>`<article class="portfolio-item compare-card"><div class="compare-pair"><div class="compare-media"><span class="compare-label">BEFORE</span>${img(it.before,`${cat.name} before ${i+1}`,'portfolio-zoom')}</div><div class="compare-media"><span class="compare-label">AFTER</span>${img(it.after,`${cat.name} after ${i+1}`,'portfolio-zoom')}</div></div>${it.caption?`<div class="portfolio-caption">${esc(it.caption)}</div>`:''}</article>`).join('')
    : items.map((it,i)=>`<article class="portfolio-item"><div class="portfolio-media ${kind==='wide'?'portfolio-media-wide':''}" style="aspect-ratio:${esc(cat.ratio||(kind==='wide'?'16 / 9':'1 / 1'))}">${img(it.media,`${cat.name} ${i+1}`,'portfolio-zoom')}</div>${it.caption?`<div class="portfolio-caption">${esc(it.caption)}</div>`:''}</article>`).join('');
  return `<div class="portfolio-slider-shell"><div class="portfolio-slider portfolio-slider--${kind}" data-portfolio-rail>${cards}</div><div class="portfolio-range-wrap"><input class="portfolio-range" data-portfolio-range type="range" min="0" max="0" value="0" step="1" aria-label="포트폴리오 좌우 이동"></div></div>`;
}
function renderCollaborators(c){if(!c.enabled)return'';const list=c.items||[];return `<section class="section">${sectionHead('COLLABORATION','협업 작가')}<div class="collab-grid">${list.map(x=>`<article class="collab-card card">${x.image?`<div class="collab-media"><img src="${esc(x.image)}" alt="${esc(x.name)}" loading="lazy" decoding="async" data-zoom="true" tabindex="0" role="button"></div>`:'<div class="media-placeholder collab-media"></div>'}<div><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p>${x.url?`<a class="link-btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">작가 페이지 바로가기</a>`:''}</div><div class="collab-price">${esc(x.price||'')}</div></article>`).join('')||'<div class="empty">등록된 협업 작가가 없습니다.</div>'}</div></section>`}
function renderInquiry(q){
  const options=(q.items||[]).filter(x=>x.enabled!==false);
  return `<section class="section" id="inquiry">${sectionHead('APPLICATION','신청 양식',q.intro||'')}<div class="inquiry-card card"><form id="inquiryForm" class="form-grid"><div class="field full"><label for="applicationType">신청항목</label><select id="applicationType" name="신청항목">${options.map(x=>`<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('')}</select></div><div id="dynamicInquiry" class="field full"></div></form><div class="copy-row"><button type="button" class="btn primary" id="copyInquiry">문의 양식 복사하기</button></div></div></section>`
}
function bindPremadeTabs(){
  const tabs=document.querySelector('[data-tabs="premade"]');
  if(!tabs)return;
  tabs.addEventListener('click',e=>{
    const b=e.target.closest('[data-premade-tab]');
    if(!b)return;
    [...tabs.children].forEach(x=>x.classList.toggle('active',x===b));
    const item=(content.premades||[])[Number(b.dataset.premadeTab)];
    const panel=document.querySelector('#premadePanel');
    if(panel&&item)panel.innerHTML=premadeCard(item);
  });
}
function bindTabs(){
  $('[data-tabs="portfolio"]')?.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return; [...b.parentNode.children].forEach(x=>x.classList.toggle('active',x===b)); $('#portfolioPanel').innerHTML=portfolioPanel(content.portfolioCategories[+b.dataset.tab]);bindPortfolioSlider();bindLightbox();});
}
function bindPortfolioSlider(){
  document.querySelectorAll('.portfolio-slider-shell').forEach(shell=>{
    const rail=shell.querySelector('[data-portfolio-rail]');
    const range=shell.querySelector('[data-portfolio-range]');
    if(!rail||!range)return;
    let syncing=false;
    const updateRange=()=>{
      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      const trackWidth=Math.max(1,range.clientWidth||shell.clientWidth);
      const visibleRatio=rail.scrollWidth>0?Math.min(1,rail.clientWidth/rail.scrollWidth):1;
      const thumb=Math.max(64,Math.min(trackWidth,Math.round(trackWidth*visibleRatio)));
      range.style.setProperty('--portfolio-thumb-size',`${thumb}px`);
      range.max=String(Math.max(1,Math.round(max)));
      range.value=String(Math.min(max,rail.scrollLeft));
      range.parentElement.hidden=max<=1;
    };
    range.addEventListener('input',()=>{
      syncing=true;
      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      const rangeMax=Math.max(1,Number(range.max)||1);
      rail.scrollLeft=(Number(range.value)||0)/rangeMax*max;
      requestAnimationFrame(()=>{syncing=false;});
    });
    rail.addEventListener('scroll',()=>{
      if(syncing)return;
      const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
      const rangeMax=Math.max(1,Number(range.max)||1);
      range.value=String(max>0?(rail.scrollLeft/max)*rangeMax:0);
    },{passive:true});
    if('ResizeObserver' in window){
      const ro=new ResizeObserver(updateRange);
      ro.observe(rail);
      ro.observe(range);
      Array.from(rail.children).forEach(el=>ro.observe(el));
    }else{
      window.addEventListener('resize',updateRange,{passive:true});
    }
    requestAnimationFrame(updateRange);
  });
}
function bindLightbox(){
  let box=$('#imageLightbox');
  if(!box){box=document.createElement('div');box.id='imageLightbox';box.className='image-lightbox';box.innerHTML='<button type="button" class="lightbox-close" aria-label="닫기">×</button><img alt="확대 이미지">';document.body.append(box);}
  const close=()=>{box.classList.remove('open');document.body.style.overflow='';};
  const open=(el)=>{const target=box.querySelector('img');target.src=el.currentSrc||el.src;target.alt=el.alt||'확대 이미지';box.classList.add('open');document.body.style.overflow='hidden';};
  document.querySelectorAll('[data-zoom="true"]').forEach(el=>{el.onclick=()=>open(el);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(el);}}});
  box.onclick=e=>{if(e.target===box||e.target.closest('.lightbox-close'))close();};
  document.onkeydown=e=>{if(e.key==='Escape'&&box.classList.contains('open'))close();};
}
const field=(label,name,ph='',type='text',full=false)=>`<div class="field ${full?'full':''}"><label>${esc(label)}<input type="${type}" name="${esc(name)}" placeholder="${esc(ph)}"></label></div>`;
const textArea=(label,name,ph='',full=true)=>`<div class="field ${full?'full':''}"><label>${esc(label)}<textarea name="${esc(name)}" placeholder="${esc(ph)}"></textarea></label></div>`;
function bindInquiry(){
 const sel=$('#applicationType'); if(!sel)return; const render=()=>renderInquiryFields(sel.value); sel.addEventListener('change',render); render(); $('#copyInquiry').addEventListener('click',copyInquiry);
}
function renderInquiryFields(id){
 const q=content.inquiry||{}, p=q.placeholders||{}, item=(q.items||[]).find(x=>x.id===id), preset=item?.preset||'custom'; let html='';
 if(preset==='premade') html=`<div class="form-grid">${field('방송 닉네임','방송 닉네임',p.nickname)}${field('플랫폼','플랫폼',p.platform)}<div class="field full"><label>개인작 선택<select name="개인작">${(q.premadeOptions||[]).map(x=>`<option>${esc(x)}</option>`).join('')}</select></label></div>${textArea('추가 문의사항','추가 문의사항',p.extra)}</div>`;
 else if(preset==='sculpt') html=`<div class="form-grid">${field('베이스 아바타','베이스 아바타',p.baseAvatar)}${field('방송 닉네임','방송 닉네임',p.nickname)}${field('플랫폼','플랫폼',p.platform)}${field('공개일자','공개일자',p.releaseDate)}${textArea('아바타 외형','아바타 외형',p.appearance)}${field('베이스 아바타 BOOTH 링크','베이스 BOOTH 링크',p.booth,'url',true)}<div class="field full"><span class="field-label">파츠 추가</span><div class="counter-row">${counter('헤어','hair')}${counter('의상','outfit')}${counter('악세사리','accessory')}</div><div id="partsFields"></div></div><div class="field full"><span class="field-label">파일 옵션</span><p class="form-note">${esc(q.fileOptionDescription||'')}</p><label class="inline-check"><input type="checkbox" name="유니티패키지 구매 여부" value="구매함"> 유니티패키지 구매 완료</label></div>${textArea('추가옵션 및 그 외 문의사항','추가옵션 및 그 외 문의사항',p.extra)}</div>`;
 else if(preset==='nilotoon') html=`<div class="form-grid">${field('방송 닉네임','방송 닉네임',p.nickname)}${field('플랫폼','플랫폼',p.platform)}<div class="field full"><label>최초 세팅 여부<select name="최초 세팅 여부"><option>최초 세팅</option><option>기존 세팅 수정</option></select></label></div>${field('BOOTH 링크','BOOTH 링크',p.booth,'url',true)}${textArea('추가 문의사항','추가 문의사항',p.extra)}</div>`;
 else html=`<div class="form-grid">${field('방송 닉네임','방송 닉네임',p.nickname)}${field('플랫폼','플랫폼',p.platform)}${textArea('원하는 디자인 컨셉 및 색상','디자인 컨셉 및 색상',p.request)}${textArea('추가 문의사항','추가 문의사항',p.extra)}</div>`;
 $('#dynamicInquiry').innerHTML=html; bindCounters();
}
function counter(label,key){return `<div><div class="field-label" style="margin-bottom:6px">추가 ${label}</div><div class="counter" data-counter="${key}" data-label="${label}"><button type="button" data-delta="-1" aria-label="${label} 감소">−</button><span>0</span><button type="button" data-delta="1" aria-label="${label} 증가">＋</button></div></div>`}
const partState={hair:0,outfit:0,accessory:0};
function bindCounters(){partState.hair=partState.outfit=partState.accessory=0; document.querySelectorAll('[data-counter]').forEach(c=>c.addEventListener('click',e=>{const b=e.target.closest('[data-delta]');if(!b)return; const k=c.dataset.counter; partState[k]=Math.max(0,Math.min(20,partState[k]+Number(b.dataset.delta))); $('span',c).textContent=partState[k]; renderParts();}));renderParts();}
function renderParts(){const root=$('#partsFields'); if(!root)return; const p=content.inquiry?.placeholders||{}; const groups=[['hair','헤어'],['outfit','의상'],['accessory','악세사리']]; root.innerHTML=groups.flatMap(([k,label])=>Array.from({length:partState[k]},(_,i)=>`<div class="counter-block"><h4>${label} ${i+1}</h4><div class="form-grid">${field('BOOTH 링크',`${label}${i+1} BOOTH 링크`,p.booth,'url')}${field('색상',`${label}${i+1} 색상`,p.color)}${textArea('요청사항',`${label}${i+1} 요청사항`,p.request)}</div></div>`)).join('');}
function copyInquiry(){
 const form=$('#inquiryForm'), type=$('#applicationType'), selected=type.options[type.selectedIndex]?.text||''; const lines=[`[신청항목] ${selected}`];
 const fd=new FormData(form); const seen=new Set(); for(const [k,v] of fd.entries()){if(k==='신청항목'||seen.has(k))continue;seen.add(k);lines.push(`[${k}] ${String(v).trim()||'-'}`)}
 document.querySelectorAll('[data-counter]').forEach(c=>lines.push(`[추가 ${c.dataset.label}] ${$('span',c).textContent}개`));
 const text=lines.join('\n'); navigator.clipboard?.writeText(text).then(()=>toast('문의 양식을 복사했습니다.')).catch(()=>fallbackCopy(text));
}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove();toast('문의 양식을 복사했습니다.');}

content=await loadContent(); renderSite(content);
