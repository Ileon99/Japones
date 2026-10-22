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
 cloudLessons=(data||[]).map(x=>({...x,items:(x.lesson_items||[]).sort((a,b)=>a.sort_order-b.sort_order).map(a=>[a.japanese,a.romaji||"",a.french])}));
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
 app.innerHTML='<button id="returnCourse">← Retour</button><h2>'+esc(course.title)+'</h2>'+course.items.map(x=>'<section class="panel"><div class="jp" lang="ja">'+esc(x[0])+'</div><p>'+esc(x[1])+' · '+esc(x[2])+'</p></section>').join("");
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
 '<h3>Cours communs</h3>'+cloudLessons.map((x,i)=>'<section class="panel"><strong>'+esc(x.title)+'</strong><p>'+x.items.length+' mots</p><button data-cloud="'+i+'">Voir</button></section>').join("")+
 (!cloudLessons.length?'<p class="muted">Aucun cours en ligne pour le moment.</p>':'')+
 '<p class="muted">Tes cours créés auparavant en local ne sont pas encore importés automatiquement. L’import photo et PDF sera ajouté dans une prochaine version.</p>';
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
 app.querySelectorAll("[data-cloud]").forEach(b=>b.onclick=()=>showCourse(cloudLessons[Number(b.dataset.cloud)],showEditor));
}
window.courseEditor=showEditor;
if(!startClient()){console.warn("Supabase n'a pas été chargé");}
})();