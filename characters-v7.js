"use strict";
const characterStore="nihongo-characters-v7:";
function cKey(){return characterStore+(currentUser?.id||"invité")}
function cRead(){try{return JSON.parse(localStorage.getItem(cKey())||"{}")}catch{return {}}}
function cWrite(m){localStorage.setItem(cKey(),JSON.stringify(m))}
function cItems(){return alphabetMode==="kanji"?kanji.map((x,i)=>({id:"kanji-"+i,glyph:x[0],answer:x[2],reading:x[1]})):(alphabetMode==="hiragana"?hiragana:katakana).map((x,i)=>({id:alphabetMode+"-"+i,glyph:x,answer:rowset[i],reading:rowset[i]}))}
const cModeTitle=()=>alphabetMode==="hiragana"?"Hiragana":alphabetMode==="katakana"?"Katakana":"Kanji";
function cStage(m){return Math.min(Math.max(0,Number(m["_stage_"+alphabetMode]||0)),Math.ceil(cItems().length/5)-1)}
function cGroup(m){const all=cItems(),start=cStage(m)*5;return all.slice(start,start+5).filter(x=>!m[x.id]?.mastered)}
function cRemedial(m){const all=cItems(),end=(cStage(m)+1)*5;return all.slice(0,end).filter(x=>m[x.id]?.seen&&!m[x.id]?.mastered&&!cGroup(m).some(y=>x.id===y.id)).slice(0,2)}
function cSpeak(s){if(!("speechSynthesis" in window))return;const u=new SpeechSynthesisUtterance(s);u.lang="ja-JP";u.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(u)}
function showWriting(){
 const mem=cRead(),all=cItems(),group=cGroup(mem),review=cRemedial(mem),known=all.filter(x=>mem[x.id]?.mastered).length;
 root.innerHTML='<h2>Écriture japonaise</h2><p class="muted">Apprends cinq caractères, passe un défi, puis débloque les suivants. Les caractères acquis quittent les exercices habituels.</p><div class="actions"><button id="hira">Hiragana</button><button id="kata">Katakana</button><button id="kan">Kanji</button></div><section class="panel"><span class="pill">Groupe '+(cStage(mem)+1)+' · '+cModeTitle()+'</span><h3>'+known+' / '+all.length+' caractères acquis</h3><div class="bar"><div class="fill" style="width:'+(100*known/all.length)+'%"></div></div><p><strong>À apprendre maintenant</strong></p><div class="character-grid">'+group.map(x=>'<button class="character-card" data-card="'+x.id+'"><span>'+escapeHTML(x.glyph)+'</span><small>'+escapeHTML(x.answer)+'</small></button>').join("")+'</div>'+(review.length?'<p><strong>À revoir :</strong> '+review.map(x=>escapeHTML(x.glyph)).join(" · ")+'</p>':'')+'<div class="actions"><button class="primary" id="groupTest">Valider ce groupe →</button></div></section><section class="panel"><h3>Mes caractères acquis</h3><p>'+(known?all.filter(x=>mem[x.id]?.mastered).map(x=>'<span class="pill">'+escapeHTML(x.glyph)+'</span>').join(" "):'Aucun pour le moment : commence ton premier groupe !')+'</p></section>';
 for(const [button,mode] of [["hira","hiragana"],["kata","katakana"],["kan","kanji"]])document.getElementById(button).onclick=()=>{alphabetMode=mode;showWriting()};
 root.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>showCharacter(b.dataset.card));
 document.getElementById("groupTest").onclick=()=>cStart();
}
function showCharacter(id){
 const x=cItems().find(y=>y.id===id);if(!x)return showWriting();
 root.innerHTML='<button id="backLetters">← Mon groupe</button><section class="panel character-focus"><span class="pill">'+cModeTitle()+'</span><h2>Découvre ce caractère</h2><div class="big-glyph" lang="ja">'+escapeHTML(x.glyph)+'</div><h3>'+escapeHTML(x.answer)+'</h3>'+(alphabetMode==="kanji"?'<p>Lecture : '+escapeHTML(x.reading)+'</p>':'')+'<div class="actions"><button id="hearLetter">🔊 Écouter</button><button id="backToGroup" class="primary">Continuer →</button></div></section>';
 document.getElementById("backLetters").onclick=showWriting;
 document.getElementById("backToGroup").onclick=showWriting;
 document.getElementById("hearLetter").onclick=()=>cSpeak(x.glyph);
}
let cTest=null;
function cStart(){
 const mem=cRead(),items=[...cGroup(mem),...cRemedial(mem)];if(!items.length)return showWriting();
 cTest={items:items.sort(()=>Math.random()-.5),pos:0,correct:0,outcomes:{}};cQuestion();
}
function cQuestion(){
 if(!cTest)return showWriting();
 if(cTest.pos>=cTest.items.length)return cFinish();
 const x=cTest.items[cTest.pos],pool=cItems();
 const wrong=pool.filter(y=>y.id!==x.id&&y.answer!==x.answer).sort(()=>Math.random()-.5).slice(0,3);
 const options=[x,...wrong].sort(()=>Math.random()-.5);
 root.innerHTML='<section class="panel character-focus"><span class="pill">Défi · '+(cTest.pos+1)+' / '+cTest.items.length+'</span><div class="bar"><div class="fill" style="width:'+(100*cTest.pos/cTest.items.length)+'%"></div></div><h2>'+(alphabetMode==="kanji"?"Que signifie ce kanji ?":"Quel est le son de ce caractère ?")+'</h2><div class="big-glyph" lang="ja">'+escapeHTML(x.glyph)+'</div>'+options.map(y=>'<button class="choice" data-option="'+y.id+'">'+escapeHTML(y.answer)+'</button>').join("")+'<div id="answerFeedback" role="status"></div><button class="primary" id="questionNext" hidden>Continuer →</button></section>';
 let done=false;
 root.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{
  if(done)return;done=true;const ok=b.dataset.option===x.id;
  cTest.outcomes[x.id]=ok;if(ok)cTest.correct++;
  root.querySelectorAll("[data-option]").forEach(z=>{z.disabled=true;if(z.dataset.option===x.id)z.classList.add("right");else if(z===b)z.classList.add("wrong")});
  document.getElementById("answerFeedback").textContent=ok?"✅ Bonne réponse !":"❌ Bonne réponse : "+x.answer;
  document.getElementById("questionNext").hidden=false;
 });
 document.getElementById("questionNext").onclick=()=>{cTest.pos++;cQuestion()};
}
function cFinish(){
 const test=cTest,rate=test.correct/test.items.length,passed=rate>=.8,mem=cRead();
 for(const x of test.items){
  const prev=mem[x.id]||{};const correct=!!test.outcomes[x.id];
  mem[x.id]={...prev,seen:true,attempts:(prev.attempts||0)+1,correct:(prev.correct||0)+(correct?1:0),mastered:passed&&correct};
 }
 if(passed&&cStage(mem)<Math.ceil(cItems().length/5)-1)mem["_stage_"+alphabetMode]=cStage(mem)+1;
 cWrite(mem);cTest=null;
 const isLast=passed&&cStage(mem)===Math.ceil(cItems().length/5)-1;
 root.innerHTML='<section class="panel character-focus"><h2>'+(passed?"🎉 Groupe validé !":"💪 Encore un essai !")+'</h2><div class="big-glyph">'+test.correct+' / '+test.items.length+'</div><p>'+(passed?"Les caractères reconnus sont acquis. "+(isLast?"Tu peux continuer à consolider ce dernier groupe.":"Un nouveau groupe est débloqué !"):"Il faut au moins 80 % de bonnes réponses pour débloquer le groupe suivant.")+'</p><p>Les caractères manqués resteront à revoir.</p><button id="groupHome" class="primary">Retour au parcours →</button>'+(passed?'':' <button id="retryGroup">Réessayer</button>')+'</section>';
 document.getElementById("groupHome").onclick=showWriting;
 document.getElementById("retryGroup")?.addEventListener("click",cStart);
}
