"use strict";
/* Module original inspiré de principes d’apprentissage actif : une carte à la fois. */
const writingStorePrefix="nihongo-writing-v1:";
let selectedWritingId=null, writingRound=null;
function writingUserKey(){return writingStorePrefix+(currentUser?.id||"invité-local")}
function getWritingMemory(){try{return JSON.parse(localStorage.getItem(writingUserKey())||"{}")}catch{return {}}}
function saveWritingMemory(x){localStorage.setItem(writingUserKey(),JSON.stringify(x))}
const kanaH=[...hiragana],kanaK=[...katakana];
const entriesFor=mode=>mode==="kanji"?kanji.map((x,i)=>({id:"kanji-"+i,glyph:x[0],reading:x[1],meaning:x[2],explanation:"Ce kanji signifie « "+x[2]+" ». Ses lectures courantes sont "+x[1]+". Un kanji représente généralement une notion et peut avoir plusieurs lectures."})):([...mode==="hiragana"?kanaH:kanaK]).map((glyph,i)=>({id:mode+"-"+i,glyph,reading:rowset[i],meaning:rowset[i],explanation:mode==="hiragana"?"« "+glyph+" » est un hiragana : il représente le son « "+rowset[i]+" ». Les hiragana servent notamment aux terminaisons grammaticales et aux particules.":"« "+glyph+" » est un katakana : il représente le son « "+rowset[i]+" ». Les katakana servent notamment aux mots empruntés aux langues étrangères."}));
function writingDetails(id){return entriesFor(alphabetMode).find(x=>x.id===id)}
function writingSummary(m){let cards=entriesFor(alphabetMode),known=cards.filter(x=>m[x.id]?.mastered).length;return known+"/"+cards.length+" caractères maîtrisés"}
function writingPracticeOrder(){
 const m=getWritingMemory(),cards=entriesFor(alphabetMode),now=Date.now();
 const due=cards.filter(x=>m[x.id]&&!m[x.id].mastered&&(!m[x.id].due||m[x.id].due<=now));
 const newOnes=cards.filter(x=>!m[x.id]);
 const mastered=cards.filter(x=>m[x.id]?.mastered);
 const reviewMastered=mastered.filter(x=>m[x.id].due<=now);
 return [...due,...newOnes,...reviewMastered,...mastered].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i)
}
function showWriting(){
 const items=entriesFor(alphabetMode),m=getWritingMemory();
 root.innerHTML='<h2>Apprendre les caractères, un par un</h2><p class="muted">Observe le signe, écoute sa lecture, puis réponds à un QCM. Deux bonnes réponses à des séances différentes sont nécessaires pour confirmer une première maîtrise.</p><div class="actions"><button id="wh">Hiragana</button><button id="wk">Katakana</button><button id="wj">Kanji</button></div><section class="panel"><h3>'+writingSummary(m)+'</h3><div class="bar"><div class="fill" style="width:'+(100*items.filter(x=>m[x.id]?.mastered).length/items.length)+'%"></div></div><p><button class="primary" id="learnNext">Apprendre le prochain caractère</button> <button id="revise">Réviser les erreurs</button></p></section><div class="character-grid">'+items.map(x=>'<button class="character-card '+(m[x.id]?.mastered?"is-mastered":m[x.id]?.seen?"is-learning":"")+'" data-symbol="'+x.id+'" aria-label="'+escapeHTML(x.glyph)+" : "+escapeHTML(m[x.id]?.mastered?"maîtrisé":m[x.id]?.seen?"en apprentissage":"à découvrir")+'"><span>'+escapeHTML(x.glyph)+'</span><small>'+(m[x.id]?.mastered?"✓ Maîtrisé":m[x.id]?.seen?"À revoir":"À découvrir")+'</small></button>').join("")+'</div>';
 for(const [id,mode] of [["wh","hiragana"],["wk","katakana"],["wj","kanji"]])document.getElementById(id).onclick=()=>{alphabetMode=mode;showWriting()};
 root.querySelectorAll("[data-symbol]").forEach(b=>b.onclick=()=>showCharacter(b.dataset.symbol));
 document.getElementById("learnNext").onclick=()=>showCharacter(writingPracticeOrder()[0]?.id||items[0].id);
 document.getElementById("revise").onclick=()=>{const bad=items.filter(x=>m[x.id]?.mistakes>0&&!m[x.id]?.mastered);showCharacter((bad[0]||writingPracticeOrder()[0]||items[0]).id)};
}
function showCharacter(id){
 const entry=writingDetails(id);if(!entry)return showWriting();
 selectedWritingId=id;const m=getWritingMemory(),st=m[id]||{correct:0,mistakes:0,mastered:false,seen:false,streak:0};
 root.innerHTML='<button id="backList">← Tous les caractères</button><section class="panel character-focus"><span class="pill">'+(alphabetMode==="kanji"?"Kanji":alphabetMode==="hiragana"?"Hiragana":"Katakana")+'</span><h2>Découvre ce caractère</h2><div class="big-glyph" lang="ja">'+escapeHTML(entry.glyph)+'</div><p><strong>Lecture :</strong> '+escapeHTML(entry.reading)+'</p>'+(alphabetMode==="kanji"?'<p><strong>Sens :</strong> '+escapeHTML(entry.meaning)+'</p>':'')+'<p>'+escapeHTML(entry.explanation)+'</p><div class="actions"><button id="hear">🔊 Écouter</button><button class="primary" id="attempt">Je suis prêt(e) pour le QCM</button></div><p class="muted">Réponses correctes : '+(st.correct||0)+' · Erreurs : '+(st.mistakes||0)+'</p></section>';
 document.getElementById("backList").onclick=showWriting;
 document.getElementById("hear").onclick=()=>{if(!("speechSynthesis" in window))return alert("La synthèse vocale n’est pas disponible sur cet appareil.");const u=new SpeechSynthesisUtterance(entry.glyph);u.lang="ja-JP";u.rate=.8;speechSynthesis.cancel();speechSynthesis.speak(u)};
 document.getElementById("attempt").onclick=()=>showCharacterQcm(id);
}
function showCharacterQcm(id){
 const entry=writingDetails(id),pool=entriesFor(alphabetMode);
 const distractors=pool.filter(x=>x.id!==id&&x.meaning!==entry.meaning).sort(()=>Math.random()-.5).slice(0,3);
 const options=[entry,...distractors].sort(()=>Math.random()-.5);
 writingRound=id;
 root.innerHTML='<section class="panel character-focus"><span class="pill">🎯 QCM · Un caractère à la fois</span><h2>'+(alphabetMode==="kanji"?"Que signifie ce kanji ?":"Quel son représente ce caractère ?")+'</h2><div class="big-glyph" lang="ja">'+escapeHTML(entry.glyph)+'</div>'+options.map(o=>'<button class="choice" data-writing="'+o.id+'">'+escapeHTML(o.meaning)+'</button>').join("")+'<div id="writingFeedback" role="status"></div><button id="nextCharacter" class="primary" hidden>Continuer →</button></section>';
 let answered=false;
 root.querySelectorAll("[data-writing]").forEach(button=>button.onclick=()=>{
  if(answered)return;answered=true;const good=button.dataset.writing===id;
  root.querySelectorAll("[data-writing]").forEach(b=>{b.disabled=true;if(b.dataset.writing===id)b.classList.add("right");else if(b===button)b.classList.add("wrong")});
  const m=getWritingMemory(),prev=m[id]||{correct:0,mistakes:0,streak:0,mastered:false};
  const correct=(prev.correct||0)+(good?1:0),mistakes=(prev.mistakes||0)+(good?0:1),streak=good?(prev.streak||0)+1:0;
  const mastered=good&&correct>=2&&streak>=2;
  m[id]={correct,mistakes,streak,mastered,seen:true,due:Date.now()+(good?(mastered?3*86400000:60000):0)};
  saveWritingMemory(m);
  const fb=document.getElementById("writingFeedback");
  fb.innerHTML='<div class="correction '+(good?"positive":"")+'"><strong>'+(good?"✅ Bonne réponse !":"❌ Pas encore !")+'</strong><p>La bonne réponse est <strong>'+escapeHTML(entry.meaning)+'</strong>.</p><p>'+escapeHTML(entry.explanation)+'</p><p>'+(mastered?"⭐ Caractère maîtrisé !":good?"Bien joué ! Tu le reverras pour consolider ta mémoire.":"Ce caractère reviendra dans tes révisions pour mieux le mémoriser.")+'</p></div>';
  document.getElementById("nextCharacter").hidden=false;
 });
 document.getElementById("nextCharacter").onclick=()=>{const next=writingPracticeOrder().find(x=>x.id!==id)||entriesFor(alphabetMode)[0];showCharacter(next.id)};
}
