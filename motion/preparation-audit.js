/* 2026-11-20 material inventory and live PSB comparison. */
function psbAuditRecord(category,name){const record=preparation(category,assetName(name,category));return record.audit20261123||record.audit20261120||null}
function psbAuditDate(){return (DATA.psbPreparationAudit20261123?.date||'2026-11-20').replaceAll('-','.')}
function psbAuditTag(audit){const tag=node('span',audit.label,'psb-audit-tag');tag.dataset.action=audit.action;tag.title=[audit.psbStatus,...audit.layerPaths,audit.sizeReview].filter(Boolean).join('\n');return tag}
const PSB_OLD_PREPARATION_CELL=preparationCell;
preparationCell=function(category,asset){
 const select=PSB_OLD_PREPARATION_CELL(category,asset),audit=psbAuditRecord(category,asset.name);
 if(!audit)return select;
 const wrap=node('div',undefined,'psb-preparation-cell');wrap.append(select,psbAuditTag(audit));return wrap;
};
const PSB_OLD_CARDS=renderScreenPreparationCards;
renderScreenPreparationCards=function(c){
 const result=PSB_OLD_CARDS(c);
 for(const card of result[0].querySelectorAll('[data-preparation-key]')){
  const item=c.preparationAudit.items.find(x=>x.key===card.dataset.preparationKey);if(!item)continue;
  const audit=psbAuditRecord(item.category,item.name);if(audit)card.querySelector('.screen-preparation-badges').append(psbAuditTag(audit));
 }
 return result;
};
const PSB_OLD_SCREEN_AUDIT=renderScreenAudit;
renderScreenAudit=function(c){
 const box=PSB_OLD_SCREEN_AUDIT(c),records=new Map();
 for(const item of c.preparationAudit.items){const a=psbAuditRecord(item.category,item.name);if(a)records.set(a.canonicalKey,{a,name:item.name})}
 if(!records.size)return box;
 const missing=[...records.values()].filter(x=>x.a.missingRequiredPrint||x.a.action==='추가 배치');
 box.querySelector('summary').textContent+=' · PSB 추가 출력 '+missing.length;
 const first=box.querySelector('p');if(first)first.textContent=first.textContent.replace('2026.11.19',psbAuditDate());
 box.append(node('p','PSB 대조 · 1부 출력물은 재활용하고, 배치 확인은 인쇄 완료와 구분합니다.','psb-audit-explanation'));
 if(missing.length)box.append(node('p','PSB에 추가할 준비물: '+missing.map(x=>x.name).join(' · '),'psb-audit-missing'));
 return box;
};
const PSB_OLD_RESOURCE_DIALOG=showResourceFiles;
showResourceFiles=function(category,asset){
 PSB_OLD_RESOURCE_DIALOG(category,asset);
 const audit=psbAuditRecord(category,asset.name);if(!audit)return;
 const section=node('section',undefined,'psb-audit-dialog');section.append(node('h3','PSB 확인 결과'),psbAuditTag(audit));
 section.append(node('p',audit.evidence));
 if(audit.layerPaths.length){const list=node('ul');audit.layerPaths.forEach((path,i)=>list.append(node('li',path+' · 레이어 '+audit.layerIds[i])));section.append(list)}
 if(audit.psbPreview){const r=DATA.storyboardImages[audit.psbPreview];if(r){const img=node('img');img.src=r.data;img.alt='PSB에 실제 들어 있는 '+asset.name;section.append(node('p','PSB 실제 그림'),img)}}
 $('assetUseBody').append(section);
};
const PSB_OLD_CATALOG=renderCatalog;
renderCatalog=function(){
 PSB_OLD_CATALOG();let note=$('psbAuditCatalogSummary');
 if(version==='part1'){if(note)note.remove();return}
 const counts=new Map();
 for(const section of document.querySelectorAll('#catalogGroups .cataloggroup')){
  const category=storageCategory(section.dataset.category);
  for(const row of section.querySelectorAll('tbody tr')){const a=psbAuditRecord(category,row.dataset.asset);if(a)counts.set(a.action,(counts.get(a.action)||0)+1)}
 }
 if(!note){note=node('p',undefined,'psb-audit-catalog-summary');note.id='psbAuditCatalogSummary';$('catalogGroups').before(note)}
 note.textContent=psbAuditDate()+' PSB 대조 · '+[...counts].map(([label,count])=>label+' '+count+'종').join(' · ');
 if(DATA.psbPreparationAudit20261123?.reportUrl){const link=node('a','대조표·누락 검토 보기');link.href=DATA.psbPreparationAudit20261123.reportUrl;link.style.marginLeft='1em';note.append(link)}
};
if(view==='assets')renderCatalog();else render();
