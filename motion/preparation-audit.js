/* Live PSB evidence stays in resource details; preparation status is shown once. */
function psbAuditRecord(category,name){const record=preparation(category,assetName(name,category));return record.audit20261123||record.audit20261120||null}
function psbAuditDate(){return (DATA.psbPreparationAudit20261123?.date||'2026-11-20').replaceAll('-','.')}
const PSB_OLD_SCREEN_AUDIT=renderScreenAudit;
renderScreenAudit=function(c){
 const box=PSB_OLD_SCREEN_AUDIT(c),records=new Map();
 for(const item of c.preparationAudit.items){if(preparation(item.category,item.name).excludeFromPreparation)continue;const a=psbAuditRecord(item.category,item.name);if(a)records.set(a.canonicalKey,{a,name:item.name})}
 if(!records.size)return box;
 const missing=[...records.values()].filter(x=>x.a.missingRequiredPrint||x.a.action==='추가 배치');
 box.querySelector('summary').textContent+=' · 추가 출력 '+missing.length;
 const first=box.querySelector('p');if(first)first.textContent=first.textContent.replace('2026.11.19',psbAuditDate());
 if(missing.length)box.append(node('p','추가 출력할 준비물: '+missing.map(x=>x.name).join(' · '),'psb-audit-missing'));
 return box;
};
const PSB_OLD_RESOURCE_DIALOG=showResourceFiles;
showResourceFiles=function(category,asset){
 PSB_OLD_RESOURCE_DIALOG(category,asset);
 const audit=psbAuditRecord(category,asset.name);if(!audit)return;
 const section=node('section',undefined,'psb-audit-dialog');section.append(node('h3','PSB 레이어'));
 if(audit.layerPaths.length){const list=node('ul');audit.layerPaths.forEach((path,i)=>list.append(node('li',path+' · 레이어 '+audit.layerIds[i])));section.append(list)}
 $('assetUseBody').append(section);
};
const PSB_OLD_CATALOG=renderCatalog;
renderCatalog=function(){
 PSB_OLD_CATALOG();let note=$('psbAuditCatalogSummary');
 if(version==='part1'){if(note)note.remove();return}
 if(!note){note=node('p',undefined,'psb-audit-catalog-summary');note.id='psbAuditCatalogSummary';$('catalogGroups').before(note)}
 note.replaceChildren();
 if(DATA.psbPreparationAudit20261123?.reportUrl){const link=node('a','PSB 대조표와 누락 검토');link.href=DATA.psbPreparationAudit20261123.reportUrl;note.append(link)}
};
if(view==='assets')renderCatalog();else render();
