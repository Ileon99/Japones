(function(){
"use strict";
const URL="https://rbwqttglxmfqktptytjs.supabase.co";
const KEY="sb_publishable_XGWTmxx0mK6sxfTr-lwtKg_Q90TDM9q";
let client=null,user=null,cloudLessons=[],busy=false,isEditor=false;
function startClient(){
 if(!window.supabase?.createClient){return false}
 client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 client.auth.onAuthStateChange((event,session)=>{user=session?.user||null;setTimeout(async()=>{if(user){await checkEditor();await loadLessons()}else{cloudLessons=[];isEditor=false;}if(typeof view!=="undefined"&&view==="editor")courseEditor()},0)});
 client.auth.getUser().then(async({data,error})=>{if(!error){user=data.user;if(user){await checkEditor();await loadLessons()}if(typeof view!=="undefined"&&view==="editor")courseEditor()}});return true;
}
async function checkEditor(){const {data}=await client.from("course_editors").select("user_id").eq("user_id",user.id).maybeSingle();isEditor=!!data;}
async function loadLessons(){
 if(!client||!user)return;
 const {data,error}=await client.from("lessons").select("id,title,lesson_number,lesson_items(id,japanese,romaji,french,sort_order)").order("created_at",{ascending:true});
 if(error){console.error("Chargement impossible:",error.message);return}
 cloudLessons=(data||[]).map(x=>({...x,items:(x.lesson_items||[]).sort((a,b)=>a.sort_order-b.sort_order).map(a=>({id:a.id,japanese:a.japanese,romaji:a.romaji||"",french:a.french}))}));
}
async function saveCloud(title,items){
 if(!user||!client||!isEditor)throw new Error("Seul un éditeur autorisé peut ajouter des cours communs.");
 const {data,error}=await client.from("lessons").insert({owner_id:user.id,title}).select("id").single();
 if(error)throw error;
 const {error:itemErr}=await client.from("lesson_items").insert(items.map(([japanese,romaji,french],i)=>({lesson_id:data.id,owner_id:user.id,japanese,romaji,french,sort_order:i})));
 if(itemErr)throw itemErr;
 await loadLessons();
}
function showCourse(course,returnFn){
 app.innerHTML='<button id="returnCourse">← Retour</button><h2>'+esc(course.title)+'</h2>'+course.items.map(x=>'<section class="panel"><div class="jp" lang="ja">'+esc(x.japanese)+'</div><p>'+esc(x.romaji)+' · '+esc(x.french)+'</p></section>').join("");
 document.querySelector("#returnCourse").onclick=returnFn;
}
function showEditor(){
 const ready=!!client;
 app.innerHTML='<h2>Ajouter un cours</h2><p class="muted">'+(user?"☁️ Connecté : "+esc(user.email||"compte actif"):"Connecte-toi pour enregistrer tes cours sur Supabase et les retrouver sur tes appareils.")+'</p>'+
 '<section class="panel"><h3>Mon compte</h3>'+
 (user?'<button id="disconnect">Se déconnecter</button><button id="reloadCloud">Actualiser mes cours</button>':
 '<label>Adresse e-mail<input id="authMail" type="email" autocomplete="email" style="display:block;width:100%;padding:12px;margin:8px 0" placeholder="ton@email.fr"></label><button class="primary" id="loginMail">Recevoir un lien de connexion</button>')+
 '<p id="authStatus" role="status"></p></section>'+
 (isEditor?'<section class="panel"><h3>Nouveau cours</h3><label>Nom du cours<input id="cloudTitle" style="display:block;width:100%;padding:12px;margin:8px 0" placeholder="Cours 3 — Ma journée"></label><p>Une ligne par mot : japonais | romaji | traduction française</p><textarea id="cloudWords" rows="7" style="width:100%;padding:12px" placeholder="ねこ | neko | chat"></textarea><p><button class="primary" id="cloudSave">Enregistrer le cours</button></p><p id="courseStatus" role="status"></p></section>'+
 '<p><button id="sharedStats">Ma progression en ligne</button></p><h3>Cours communs</h3>'+cloudLessons.map((x,i)=>'<section class="panel"><strong>'+esc(x.title)+'</strong><p>'+x.items.length+' mots</p><button data-cloud="'+i+'">Voir</button> <button data-shared="'+i+'">QCM</button></section>').join("")+
 (!cloudLessons.length?'<p class="muted">Aucun cours en ligne pour le moment.</p>':'')+
 '<p class="muted">Tes cours créés auparavant en local ne sont pas encore importés automatiquement. L’import photo et PDF sera ajouté dans une prochaine version.</p>';
 document.getElementById("sharedStats").onclick=sharedStats;
 const status=(id,t)=>document.getElementById(id).textContent=t;
 if(user){document.getElementById("disconnect").onclick=async()=>{const{error}=await client.auth.signOut();if(error)status("authStatus",error.message)};
 document.getElementById("reloadCloud").onclick=async()=>{await loadLessons();showEditor()}}
 else document.getElementById("loginMail").onclick=async()=>{
 if(!ready){status("authStatus","Bibliothèque Supabase indisponible. Vérifie ta connexion Internet.");return}
 const email=document.getElementById("authMail").value.trim();
 if(!email.includes("@")){status("authStatus","Saisis une adresse e-mail valide.");return}
 const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
 status("authStatus",error?error.message:"Consulte ta boîte mail et ouvre le lien de connexion.")}
 if(isEditor)document.getElementById("cloudSave").onclick=async()=>{
 if(busy)return;
 const title=document.getElementById("cloudTitle").value.trim();
 const items=document.getElementById("cloudWords").value.trim().split("\n").map(l=>l.split("|").map(x=>x.trim())).filter(a=>a.length===3&&a.every(Boolean));
 if(!title||!items.length){status("courseStatus","Ajoute un titre et au moins un mot valide.");return}
 busy=true;status("courseStatus","Enregistrement…");
 try{await saveCloud(title,items);showEditor()}catch(e){status("courseStatus","Erreur : "+(e.message||"enregistrement impossible"))}finally{busy=false}
 };
 app.querySelectorAll("[data-shared]").forEach(b=>b.onclick=()=>startShared(Number(b.dataset.shared)));
 app.querySelectorAll("[data-cloud]").forEach(b=>b.onclick=()=>showCourse(cloudLessons[Number(b.dataset.cloud)],showEditor));
}

let activeCourse,activeQuiz=[],activeIndex=0,activeCorrect=0;
async function recordShared(item,good){
 const {data,error}=await client.from("review_progress").select("attempts,correct").eq("owner_id",user.id).eq("item_id",item.id).maybeSingle();
 if(error)throw error;
 const {error:e}=await client.from("review_progress").upsert({owner_id:user.id,item_id:item.id,attempts:(data?.attempts||0)+1,correct:(data?.correct||0)+(good?1:0),updated_at:new Date().toISOString()},{onConflict:"owner_id,item_id"});
 if(e)throw e;
}
function startShared(index){
 if(!user){alert("Connecte-toi pour sauvegarder ta progression.");return}
 activeCourse=cloudLessons[index];
 if(activeCourse.items.length<4){alert("Il faut au moins quatre mots.");return}
 activeQuiz=[...activeCourse.items].sort(()=>Math.random()-.5).slice(0,10);
 activeIndex=0;activeCorrect=0;drawShared();
}
function drawShared(){
 if(activeIndex===activeQuiz.length){
  app.innerHTML='<section class="panel"><h2>Bravo !</h2><p>'+activeCorrect+' / '+activeQuiz.length+' bonnes réponses</p><button id="goBack">Retour aux cours</button></section>';
  document.getElementById("goBack").onclick=showEditor;return;
 }
 const item=activeQuiz[activeIndex];
 const opts=[item,...activeCourse.items.filter(x=>x.id!==item.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
 app.innerHTML='<section class="panel"><h2>Question '+(activeIndex+1)+' / '+activeQuiz.length+'</h2><div class="jp" lang="ja">'+esc(item.japanese)+'</div>'+opts.map(x=>'<button class="choice" data-choice="'+esc(x.id)+'">'+esc(x.french)+'</button>').join("")+'<p id="message" role="status"></p><button id="following" class="primary" hidden>Suivant</button></section>';
 app.querySelectorAll("[data-choice]").forEach(b=>b.onclick=async()=>{
  app.querySelectorAll("[data-choice]").forEach(x=>{x.disabled=true;if(x.dataset.choice===item.id)x.classList.add("right")});
  const good=b.dataset.choice===item.id;
  if(good)activeCorrect++;else b.classList.add("wrong");
  const label=document.getElementById("message");label.textContent=good?"Bravo !":"Réponse : "+item.french;
  try{await recordShared(item,good)}catch(e){label.textContent+=" · Enregistrement impossible : "+e.message}
  document.getElementById("following").hidden=false;
 });
 document.getElementById("following").onclick=()=>{activeIndex++;drawShared()};
}
async function sharedStats(){
 if(!user){alert("Connecte-toi d’abord.");return}
 const {data,error}=await client.from("review_progress").select("attempts,correct").eq("owner_id",user.id);
 if(error){alert(error.message);return}
 const attempts=(data||[]).reduce((n,x)=>n+x.attempts,0),correct=(data||[]).reduce((n,x)=>n+x.correct,0);
 app.innerHTML='<section class="panel"><h2>Ma progression en ligne</h2><p class="jp">'+(attempts?Math.round(correct*100/attempts):0)+' %</p><p>'+correct+' bonnes réponses sur '+attempts+' tentatives.</p><button id="returnToLessons">Retour</button></section>';
 document.getElementById("returnToLessons").onclick=showEditor;
}

window.courseEditor=showEditor;
if(!startClient()){console.warn("Supabase n'a pas été chargé");}
})();