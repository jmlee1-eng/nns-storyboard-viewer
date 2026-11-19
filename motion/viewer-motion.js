'use strict';

// Physical paper dimensions stay fixed. This player changes poses and the camera only.
const MP_CACHE = new WeakMap();
let MP_PLAYER = null;
let MP_CAMERA = true;
let MP_AUTOPLAY = true;
try { MP_CAMERA = localStorage.getItem('nns-motion-camera-v1') !== 'off'; } catch (_) {}

function mpEase(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }
function mpSource(c, q) { return c.storyboard.elements.find(e => e.id === q.target); }
function mpOutside(e, side, current) {
  const p = {x: current.x, y: current.y};
  if (side === 'left') p.x = -e.w / 2 - 3;
  else if (side === 'right') p.x = 103 + e.w / 2;
  else if (side === 'top') p.y = -e.h / 2 - 3;
  else p.y = 103 + e.h / 2;
  return p;
}
function mpCompiled(c) {
  if (MP_CACHE.has(c)) return MP_CACHE.get(c);
  const poses = new Map(c.storyboard.elements.map(e => [e.id, {
    x:e.x, y:e.y, opacity:e.initialOpacity ?? 1, angle:e.initialAngle || 0,
    flipped:false, squash:1, mirrored:e.mirrorX || false
  }]));
  const events = [];
  for (const q of c.motionPlan.events) {
    const e = mpSource(c,q); if (!e) continue;
    const from = {...poses.get(e.id)}, to = {...from};
    if (q.op === 'enter') { to.opacity=1; Object.assign(from,mpOutside(e,q.side,from),{opacity:1}); }
    if (q.op === 'out') { Object.assign(to,mpOutside(e,q.side,from),{opacity:0}); }
    if (q.op === 'move') { to.x += q.dx || 0; to.y += q.dy || 0; }
    if (q.op === 'flip') to.flipped = !from.flipped;
    poses.set(e.id,{...to});
    events.push({...q, from, to});
  }
  const value = {events}; MP_CACHE.set(c,value); return value;
}
function mpPoseAt(c, time) {
  const states = new Map(c.storyboard.elements.map(e => [e.id, {
    x:e.x, y:e.y, opacity:e.initialOpacity ?? 1, angle:e.initialAngle || 0,
    flipped:false, squash:1, mirrored:e.mirrorX || false
  }]));
  let active = null, count = 0;
  for (const q of mpCompiled(c).events) {
    if (time < q.start) continue;
    if (time >= q.end) { states.set(q.target,{...q.to}); continue; }
    active = q;
    const p = (time-q.start)/q.duration, eased = mpEase(p), pose = {...q.from};
    if (q.op === 'enter' || q.op === 'out' || q.op === 'move') {
      pose.x=q.from.x+(q.to.x-q.from.x)*eased;
      pose.y=q.from.y+(q.to.y-q.from.y)*eased;
      pose.opacity=1;
    } else if (q.op === 'bump') pose.y -= Math.sin(Math.PI*p)*1.65;
    else if (q.op === 'shake') pose.x += Math.sin(Math.PI*4*p)*1.05*Math.sin(Math.PI*p);
    else if (q.op === 'flip') { pose.squash=Math.max(.018,Math.abs(1-2*eased));pose.flipped=p>=.5?q.to.flipped:q.from.flipped; }
    states.set(q.target,pose);
    if(q.op!=='hold') count++;
  }
  // A loose printed page travels with its book as one assembled prop (at most two papers).
  for (const e of c.storyboard.elements) {
    if (!e.attachedTo) continue;
    const parent=c.storyboard.elements.find(p=>p.id===e.attachedTo), p=states.get(e.attachedTo), s=states.get(e.id);
    if (!parent || !p || !s) continue;
    s.x += p.x-parent.x; s.y += p.y-parent.y; s.opacity *= p.opacity;
    if (active?.target===parent.id && active.op!=='hold' && s.opacity>0) count++;
  }
  return {states,active,actionCount:count};
}
function mpCameraAt(c, time, enabled=true) {
  if (!enabled) return {zoom:1,x:480,y:270,moving:false};
  let occupied=0, total=0, active=false;
  for(const q of c.motionPlan.events) {
    if(q.op==='hold') continue;
    total += q.duration;
    occupied += Math.max(0,Math.min(q.duration,time-q.start));
    if(time>=q.start && time<q.end) active=true;
  }
  const p=mpEase(Math.max(0,time-occupied)/Math.max(1,c.motionPlan.duration-total));
  const a=c.motionPlan.camera.from,b=c.motionPlan.camera.to;
  return {zoom:a.zoom+(b.zoom-a.zoom)*p,x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,moving:!active};
}
function mpCaptionAt(c,time,active) {
  if(active) return {quote:active.anchor,action:active.label,index:active.index};
  const s=[...c.motionPlan.segments].reverse().find(s=>time>=s.start) || c.motionPlan.segments[0];
  return {quote:s.quote,action:'종이는 멈춤',index:0};
}
function mpSet(g,name,value) { const s=String(value);if(g.getAttribute(name)!==s)g.setAttribute(name,s); }
function mpClock(t) { return clock(Math.max(0,t)); }

const MP_LEGACY_RENDER = renderStoryboard;
renderStoryboard = function(c) {
  MP_PLAYER?.destroy(); MP_PLAYER=null;
  if(!c.motionPlan) return MP_LEGACY_RENDER(c);
  const host=$('storyboard');host.replaceChildren();host.hidden=false;
  const signature=JSON.stringify([c.script,c.background,c.people,c.props,c.layout,c.actions]);
  if(signature!==c.storyboard.signature)host.append(node('p','대본이나 준비물이 바뀌어 연출 포인트를 다시 확인해야 합니다.','board-stale'));
  if(c.preparationAudit)host.append(renderScreenAudit(c));

  const controls=node('div',undefined,'motion-controls');
  const play=node('button',MP_AUTOPLAY?'일시정지':'자동 반복 재생','motion-play');play.type='button';
  const camera=node('button',MP_CAMERA?'카메라 적용':'고정 프레임','motion-camera');camera.type='button';camera.setAttribute('aria-pressed',String(MP_CAMERA));
  camera.title='느린 카메라 움직임과 원래 촬영 프레임을 전환합니다.';
  const wide=node('button',$('panels').classList.contains('boardexpanded')?'크기 복원':'크게 보기','boardwide');wide.type='button';
  wide.onclick=()=>{const opened=$('panels').classList.toggle('boardexpanded');wide.textContent=opened?'크기 복원':'크게 보기';wide.setAttribute('aria-pressed',String(opened));};
  const safe=node('button','안전영역','boardsafe');safe.type='button';safe.setAttribute('aria-pressed',String(SB_SAFE_VISIBLE));
  controls.append(play,camera,wide,safe);host.append(controls);

  const timeline=node('div',undefined,'motion-timeline'),label=node('label','연출 진행','motion-slider-label');
  const slider=node('input');slider.type='range';slider.min='0';slider.max=String(c.motionPlan.duration);slider.step='.05';slider.value='0';
  slider.id='motionSlider';slider.setAttribute('aria-label','연출 진행 슬라이더');
  const readout=node('output','0:00 / '+mpClock(c.motionPlan.duration),'motion-readout');readout.htmlFor=slider.id;
  label.htmlFor=slider.id;timeline.append(label,readout,slider);
  const ends=node('div',undefined,'motion-timeline-ends');ends.append(node('span','시작 배치'),node('span','끝에서 자동 반복'));timeline.append(ends);host.append(timeline);

  const figure=node('figure',undefined,'boardfigure motion-figure');
  const svg=sbDiagram(c,0);svg.setAttribute('aria-label',c.title+' · 자동 반복 연출');svg.setAttribute('data-motion-cut',c.id);
  const scene=sbSvg('g',{'class':'motion-camera-scene'});
  const frame=svg.lastElementChild;
  for(const child of [...svg.children]) {
    if(child.tagName.toLowerCase()==='defs'||child.classList.contains('safe-guide')||child===frame)continue;
    scene.append(child);
  }
  svg.insertBefore(scene,svg.querySelector('.safe-guide')||frame);
  figure.append(svg,node('figcaption','풀샷 기준 · 종이 동작 중 카메라 정지 · 같은 준비물은 같은 크기','boardlegend'));host.append(figure);
  const current=node('div',undefined,'motion-current'),quote=node('p','','motion-quote'),action=node('p','','motion-action');
  current.append(quote,action);host.append(current);
  host.append(node('p','나레이션 포인트 기준 연출 미리보기입니다. 슬라이더를 움직이면 재생이 멈추며 해당 프레임을 확인할 수 있습니다.','motion-help'));

  const specs=node('details',undefined,'motion-specs');
  const used=[...new Set(c.storyboard.elements.map(e=>e.printSpecId))];
  specs.append(node('summary','이 컷의 출력 규격 · '+used.length+'종'));
  specs.append(node('p','동일 규격은 모든 2부 컷에서 같은 크기로 재사용합니다. 가공 시안의 치수는 A3 촬영판 기준 제안값입니다.'));
  const specList=node('ul');
  for(const id of used) {
    const s=DATA.part2PrintSpecs[id];if(!s)continue;
    specList.append(node('li',(s.assetId||'공용 파츠')+' · '+s.name+' · '+s.widthMm+' × '+s.heightMm+' mm · '+(s.confirmed?'출력 실측':'출력 제안')));
  }
  specs.append(specList);host.append(specs);
  const directing=node('details',undefined,'motion-directing');directing.append(node('summary','나레이션·대사 연출 포인트 '+c.motionPlan.events.length+'개'));
  const rows=[];const list=node('ol',undefined,'motion-cues');
  for(const q of c.motionPlan.events){const li=node('li');li.append(node('span',mpClock(q.start),'motion-cue-time'),node('span',q.anchor,'cuequote'),node('span',q.label,'cueaction'));li.dataset.motionEvent=String(q.index);rows.push(li);list.append(li)}
  directing.append(list);host.append(directing);

  const groups=new Map([...svg.querySelectorAll('[data-board-element]')].map(g=>[g.dataset.boardElement,g]));
  const imageNodes=new Map([...groups].map(([id,g])=>[id,[...g.querySelectorAll('image')]]));
  let time=0,playing=MP_AUTOPLAY,last=null,raf=0,disposed=false,painted=-1,lastText=-1;
  function draw(force=false) {
    const p=mpPoseAt(c,time),cam=mpCameraAt(c,time,MP_CAMERA),caption=mpCaptionAt(c,time,p.active);
    for(const e of c.storyboard.elements) {
      const g=groups.get(e.id),s=p.states.get(e.id);if(!g||!s)continue;
      const cx=e.x*9.6,cy=e.y*5.4,dx=(s.x-e.x)*9.6,dy=(s.y-e.y)*5.4;
      mpSet(g,'transform',`translate(${dx.toFixed(3)} ${dy.toFixed(3)}) translate(${cx} ${cy}) rotate(${s.angle}) scale(${(s.mirrored?-1:1)*s.squash} 1) translate(${-cx} ${-cy})`);
      mpSet(g,'opacity',s.opacity);g.dataset.poseX=s.x.toFixed(4);g.dataset.poseY=s.y.toFixed(4);
      g.dataset.printSpec=e.printSpecId;g.dataset.moving=String(p.active?.target===e.id&&p.active.op!=='hold');
      const id=s.flipped&&e.reverseImage?e.reverseImage:e.image,resource=DATA.storyboardImages[id];
      if(resource?.data)for(const im of imageNodes.get(e.id)||[])mpSet(im,'href',resource.data);
    }
    mpSet(scene,'transform',`translate(480 270) scale(${cam.zoom.toFixed(6)}) translate(${-cam.x.toFixed(6)} ${-cam.y.toFixed(6)})`);
    svg.dataset.motionTime=time.toFixed(3);svg.dataset.actionCount=String(p.actionCount);svg.dataset.cameraMoving=String(cam.moving&&playing);svg.dataset.cameraEnabled=String(MP_CAMERA);
    for(const g of svg.querySelectorAll('.safe-guide'))g.style.display=SB_SAFE_VISIBLE?'':'none';
    // Brief neutral loop boundary keeps reset positions from looking like paper jumps.
    const fade=Math.min(1,time/.35,(c.motionPlan.duration-time)/.35);scene.style.opacity=String(Math.max(0,fade));
    if(force||Math.abs(time-lastText)>.12){
      slider.value=String(time);readout.textContent=mpClock(time)+' / '+mpClock(c.motionPlan.duration);
      slider.setAttribute('aria-valuetext',mpClock(time)+' / '+mpClock(c.motionPlan.duration)+' · '+caption.action);
      quote.textContent='대본 포인트 · '+caption.quote;action.textContent=caption.action+(MP_CAMERA&&cam.moving?' · '+c.motionPlan.camera.label:!MP_CAMERA?' · 고정 프레임':'');
      for(const row of rows)row.classList.toggle('active',Number(row.dataset.motionEvent)===caption.index);
      lastText=time;
    }
    play.textContent=playing?'일시정지':'자동 반복 재생';play.setAttribute('aria-pressed',String(playing));
    camera.textContent=MP_CAMERA?'카메라 적용':'고정 프레임';camera.setAttribute('aria-pressed',String(MP_CAMERA));
    host.dataset.playing=String(playing);host.dataset.motionDuration=String(c.motionPlan.duration);
  }
  function frameTick(now) {
    if(disposed||!host.isConnected)return;
    if(last===null)last=now;
    if(playing&&!document.hidden&&view==='cuts')time=(time+Math.min(.1,(now-last)/1000))%c.motionPlan.duration;
    last=now;
    if(now-painted>32){draw();painted=now}
    raf=requestAnimationFrame(frameTick);
  }
  play.onclick=()=>{playing=!playing;MP_AUTOPLAY=playing;last=null;draw(true)};
  camera.onclick=()=>{MP_CAMERA=!MP_CAMERA;try{localStorage.setItem('nns-motion-camera-v1',MP_CAMERA?'on':'off')}catch(_){}draw(true)};
  safe.onclick=()=>{SB_SAFE_VISIBLE=!SB_SAFE_VISIBLE;safe.setAttribute('aria-pressed',String(SB_SAFE_VISIBLE));draw(true)};
  slider.addEventListener('input',()=>{playing=false;MP_AUTOPLAY=false;time=Number(slider.value);last=null;draw(true)});
  slider.addEventListener('pointerdown',()=>{playing=false;MP_AUTOPLAY=false;draw(true)});
  draw(true);raf=requestAnimationFrame(frameTick);
  MP_PLAYER={destroy(){disposed=true;cancelAnimationFrame(raf)}};
};

// Add the fixed print dimensions to the existing preparation cards.
const MP_LEGACY_CARDS=renderScreenPreparationCards;
renderScreenPreparationCards=function(c){
  const result=MP_LEGACY_CARDS(c);if(!c.motionPlan)return result;
  for(const card of result[0].querySelectorAll('[data-preparation-key]')){
    const item=c.preparationAudit.items.find(i=>i.key===card.dataset.preparationKey);
    const ids=item?.printSpecIds||[];
    if(!ids.length)continue;
    const s=DATA.part2PrintSpecs[ids[0]];
    const text=ids.length===1?`${s.widthMm} × ${s.heightMm} mm · 크기 고정`:`낱장 ${ids.length}규격 · 크기 고정`;
    card.querySelector('.screen-preparation-copy').append(node('span',text,'motion-card-size'));
  }
  return result;
};

// The application exposes pure plan math for its local render-validation page.
function mpFrameAt(c,time,enabled=true){
  const svg=sbDiagram(c,0),p=mpPoseAt(c,time),cam=mpCameraAt(c,time,enabled),scene=sbSvg('g',{'class':'motion-camera-scene'}),frame=svg.lastElementChild;
  for(const child of [...svg.children])if(child.tagName.toLowerCase()!=='defs'&&!child.classList.contains('safe-guide')&&child!==frame)scene.append(child);
  svg.insertBefore(scene,svg.querySelector('.safe-guide')||frame);
  for(const e of c.storyboard.elements){const g=svg.querySelector(`[data-board-element="${e.id}"]`),s=p.states.get(e.id);if(!g)continue;
    const cx=e.x*9.6,cy=e.y*5.4;g.setAttribute('transform',`translate(${(s.x-e.x)*9.6} ${(s.y-e.y)*5.4}) translate(${cx} ${cy}) rotate(${s.angle}) scale(${(s.mirrored?-1:1)*s.squash} 1) translate(${-cx} ${-cy})`);g.setAttribute('opacity',s.opacity);
    const resource=DATA.storyboardImages[s.flipped&&e.reverseImage?e.reverseImage:e.image];if(resource?.data)for(const im of g.querySelectorAll('image'))im.setAttribute('href',resource.data);
  }
  scene.setAttribute('transform',`translate(480 270) scale(${cam.zoom}) translate(${-cam.x} ${-cam.y})`);
  return svg;
}
window.NNSMotion=Object.freeze({poseAt:mpPoseAt,cameraAt:mpCameraAt,compiled:mpCompiled,frameAt:mpFrameAt});
render();
