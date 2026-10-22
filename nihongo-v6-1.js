"use strict";
const endpoint="https://rbwqttglxmfqktptytjs.supabase.co",publicKey="sb_publishable_XGWTmxx0mK6sxfTr-lwtKg_Q90TDM9q";
const db=window.supabase?.createClient(endpoint,publicKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const root=document.getElementById("app"),nav=document.getElementById("nav");
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentUser=null,editor=false,courses=[],screen="home",activeCourse=null,quiz=[],qIndex=0,score=0;
const rowset="a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n".split(" ");
const hiragana="あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
const katakana="アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
const kanji=[["日","にち・ひ","jour, soleil"],["人","ひと・じん","personne"],["本","ほん","livre"],["山","やま","montagne"],["水","みず","eau"],["学","がく","études"],["生","せい","vie, naissance"]];
function navigate(next){screen=next;render();window.scrollTo(0,0)}
function drawNav(){nav.innerHTML=[["home","Accueil"],["courses","Cours"],["writing","Écriture"],["profile","Mon profil"],["leaderboard","Classement"]].map(([id,label])=>'<button class="'+(screen===id?"primary":"")+'" data-nav="'+id+'">'+label+'</button>').join("");nav.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>navigate(b.dataset.nav))}
function alertText(id,msg){const el=document.getElementById(id);if(el)el.textContent=msg}
async function getSession(){if(!db)return;const {data}=await db.auth.getUser();currentUser=data?.user||null;await reloadCourses()}
async function reloadCourses(){
 if(!currentUser||!db){courses=[];editor=false;return}
 const flag=await db.from("course_editors").select("user_id").eq("user_id",currentUser.id).maybeSingle();editor=!!flag.data;
 const res=await db.from("lessons").select("id,title,lesson_number,lesson_items(id,japanese,romaji,french,sort_order)").order("created_at");
 if(res.error){console.error(res.error);courses=[];return}
 courses=(res.data||[]).map(x=>({...x,items:(x.lesson_items||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
}
function showHome(){root.innerHTML='<section class="panel hero"><img class="mascot" src="mascotte_small.jpg" onerror="this.style.display=\'none\'" alt="Notre lézard souriant"><div><h2>Bonjour ! こんにちは</h2><p>Retrouve tes leçons et entraîne-toi avec des QCM.</p></div></section><section class="panel"><h2>Les cours de japonais</h2><p>Le même programme pour tous, avec une progression individuelle.</p><div class="actions"><button class="primary" id="goCourses">Voir les cours</button><button id="goWriting">Hiragana · Katakana · Kanji</button></div></section>';document.getElementById("goCourses").onclick=()=>navigate("courses");document.getElementById("goWriting").onclick=()=>navigate("writing")}
function showCourses(){
 root.innerHTML='<h2>Cours communs</h2>'+(currentUser?'<p class="muted">Connecté : '+escapeHTML(currentUser.email)+'</p>':'<section class="panel"><h3>Connexion nécessaire</h3><p>Chaque élève doit se connecter pour accéder aux cours et enregistrer sa progression.</p></section>')+
 '<button class="primary" id="accountButton">'+(currentUser?"Gérer mon compte":"Se connecter")+'</button> '+(editor?'<button id="addCourse">Ajouter un cours commun</button>':'')+
 (currentUser?courses.map((c,i)=>'<section class="panel"><span class="pill">Leçon '+(c.lesson_number||i+1)+'</span><h3>'+escapeHTML(c.title)+'</h3><p>'+c.items.length+' éléments</p><div class="actions"><button data-open="'+i+'">Consulter</button><button data-quiz="'+i+'">Faire un QCM</button></div></section>').join("")||'<p>Aucun cours enregistré pour le moment.</p>':'');
 document.getElementById("accountButton").onclick=()=>navigate("account");
 document.getElementById("addCourse")?.addEventListener("click",()=>navigate("edit"));
 root.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>showCourse(courses[Number(b.dataset.open)]));
 root.querySelectorAll("[data-quiz]").forEach(b=>b.onclick=()=>startQuiz(courses[Number(b.dataset.quiz)]))
}
function showCourse(c){root.innerHTML='<button id="return">← Cours communs</button><h2>'+escapeHTML(c.title)+'</h2>'+c.items.map(x=>'<section class="panel"><div class="jp" lang="ja">'+escapeHTML(x.japanese)+'</div><p>'+escapeHTML(x.romaji||"")+'</p><strong>'+escapeHTML(x.french)+'</strong></section>').join("");document.getElementById("return").onclick=()=>navigate("courses")}
function showAccount(){
 root.innerHTML='<h2>Mon compte</h2><section class="panel">'+(currentUser?'<p>Connecté avec <strong>'+escapeHTML(currentUser.email)+'</strong></p><button id="logout">Se déconnecter</button>':'<p>Connecte-toi avec Google pour retrouver tes cours et ton profil sur tous tes appareils.</p><button class="primary" id="googleLogin">Continuer avec Google</button><p class="muted">Ou recevoir un lien par e-mail :</p><label>Adresse e-mail<input class="field" type="email" id="email" placeholder="exemple@domaine.fr"></label><button id="login" class="primary">Recevoir un lien de connexion</button>')+'<p id="accountStatus" role="status"></p></section>';
 document.getElementById("googleLogin")?.addEventListener("click",async()=>{if(!db)return alertText("accountStatus","Connexion Supabase indisponible.");const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)alertText("accountStatus",error.message)});
 document.getElementById("login")?.addEventListener("click",async()=>{const email=document.getElementById("email").value.trim();if(!email.includes("@"))return alertText("accountStatus","Saisis une adresse e-mail valide.");if(!db)return alertText("accountStatus","Connexion Supabase indisponible.");const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});alertText("accountStatus",error?error.message:"Un lien de connexion a été envoyé. Consulte ta boîte mail.")});
 document.getElementById("logout")?.addEventListener("click",async()=>{await db.auth.signOut();currentUser=null;courses=[];editor=false;navigate("account")})
}
function showEditor(){
 if(!currentUser||!editor){root.innerHTML='<section class="panel"><p>Seuls les administrateurs peuvent ajouter des cours communs.</p><button id="back">Retour</button></section>';document.getElementById("back").onclick=()=>navigate("courses");return}
 root.innerHTML='<h2>Ajouter un cours commun</h2><section class="panel"><label>Titre de la leçon<input id="title" class="field" placeholder="Cours 3 — Au restaurant"></label><label>Numéro du cours<input id="number" class="field" type="number" min="1"></label><label>Vocabulaire ou phrases</label><p class="muted">Une ligne par entrée : japonais | romaji | traduction française.</p><textarea class="field" id="words" rows="9" placeholder="ねこ | neko | chat"></textarea><button id="save" class="primary">Enregistrer pour tous les élèves</button><p id="saveStatus" role="status"></p></section>';
 document.getElementById("save").onclick=async()=>{const title=document.getElementById("title").value.trim(),number=Number(document.getElementById("number").value)||null,items=document.getElementById("words").value.split("\n").map(x=>x.split("|").map(v=>v.trim())).filter(x=>x.length===3&&x.every(Boolean));if(!title||!items.length)return alertText("saveStatus","Indique un titre et au moins une ligne valide.");const btn=document.getElementById("save");btn.disabled=true;let inserted=null;try{const a=await db.from("lessons").insert({owner_id:currentUser.id,title,lesson_number:number}).select("id").single();if(a.error)throw a.error;inserted=a.data.id;const b=await db.from("lesson_items").insert(items.map(([japanese,romaji,french],sort_order)=>({owner_id:currentUser.id,lesson_id:inserted,japanese,romaji,french,sort_order})));if(b.error)throw b.error;await reloadCourses();navigate("courses")}catch(e){alertText("saveStatus","Échec de l’enregistrement : "+e.message)}finally{btn.disabled=false}};
}
function startQuiz(c){if(c.items.length<4){root.innerHTML='<section class="panel"><p>Il faut au moins quatre entrées pour créer un QCM.</p><button id="back">Retour</button></section>';document.getElementById("back").onclick=()=>navigate("courses");return}activeCourse=c;quiz=[...c.items].sort(()=>Math.random()-.5).slice(0,Math.min(10,c.items.length));qIndex=0;score=0;navigate("quiz")}
async function saveAnswer(item,ok){const r=await db.from("review_progress").select("attempts,correct").eq("owner_id",currentUser.id).eq("item_id",item.id).maybeSingle();if(r.error)throw r.error;const p=r.data||{attempts:0,correct:0};const w=await db.from("review_progress").upsert({owner_id:currentUser.id,item_id:item.id,attempts:p.attempts+1,correct:p.correct+(ok?1:0),updated_at:new Date().toISOString()},{onConflict:"owner_id,item_id"});if(w.error)throw w.error}
function showQuiz(){
 if(qIndex>=quiz.length){root.innerHTML='<section class="panel"><h2>Bravo !</h2><p class="jp">'+score+' / '+quiz.length+'</p><p>Tes réponses sont associées à ton profil.</p><button id="back" class="primary">Retour aux cours</button></section>';document.getElementById("back").onclick=()=>navigate("courses");return}
 const item=quiz[qIndex],options=[item,...activeCourse.items.filter(x=>x.id!==item.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
 root.innerHTML='<section class="panel"><span class="pill">'+escapeHTML(activeCourse.title)+'</span><h2>Question '+(qIndex+1)+' / '+quiz.length+'</h2><p>Que signifie ce mot ?</p><div class="jp" lang="ja">'+escapeHTML(item.japanese)+'</div>'+options.map(o=>'<button class="choice" data-choice="'+escapeHTML(o.id)+'">'+escapeHTML(o.french)+'</button>').join("")+'<p id="feedback" role="status"></p><button id="next" class="primary" hidden>Question suivante</button></section>';
 root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=async()=>{root.querySelectorAll("[data-choice]").forEach(x=>{x.disabled=true;if(x.dataset.choice===item.id)x.classList.add("right")});const ok=b.dataset.choice===item.id;if(ok)score++;else b.classList.add("wrong");alertText("feedback",ok?"Bravo !":"Bonne réponse : "+item.french);try{await saveAnswer(item,ok)}catch(e){alertText("feedback","La réponse est affichée, mais la sauvegarde a échoué : "+e.message)}document.getElementById("next").hidden=false});document.getElementById("next").onclick=()=>{qIndex++;render()}
}
async function showProfile(){
 if(!currentUser){root.innerHTML='<section class="panel"><h2>Mon profil</h2><p>Connecte-toi pour créer ton profil personnel.</p><button id="account">Se connecter</button></section>';document.getElementById("account").onclick=()=>navigate("account");return}
 const [p,r]=await Promise.all([db.from("student_profiles").select("nickname,leaderboard_opt_in").eq("user_id",currentUser.id).maybeSingle(),db.from("review_progress").select("attempts,correct").eq("owner_id",currentUser.id)]);
 const a=(r.data||[]).reduce((n,x)=>n+x.attempts,0),correct=(r.data||[]).reduce((n,x)=>n+x.correct,0);
 root.innerHTML='<h2>Mon profil</h2><section class="panel"><label>Pseudonyme public<input class="field" id="nickname" maxlength="30" value="'+escapeHTML(p.data?.nickname||"")+'"></label><p><label><input type="checkbox" id="optin" '+(p.data?.leaderboard_opt_in?"checked":"")+'> Participer au classement</label></p><button class="primary" id="saveProfile">Enregistrer mon profil</button><p id="profileStatus" role="status"></p></section><section class="panel"><h3>Ma progression</h3><p class="jp">'+(a?Math.round(100*correct/a):0)+' %</p><p>'+correct+' bonnes réponses sur '+a+' tentatives enregistrées.</p></section>';
 document.getElementById("saveProfile").onclick=async()=>{const nickname=document.getElementById("nickname").value.trim();if(nickname.length<2)return alertText("profileStatus","Le pseudonyme doit comporter au moins deux caractères.");const x=await db.from("student_profiles").upsert({user_id:currentUser.id,nickname,leaderboard_opt_in:document.getElementById("optin").checked},{onConflict:"user_id"});alertText("profileStatus",x.error?x.error.message:"Profil enregistré.")};
}
async function showLeaderboard(){if(!currentUser){root.innerHTML='<section class="panel"><h2>Classement</h2><p>Connecte-toi pour consulter le classement.</p></section>';return}const {data,error}=await db.rpc("get_learning_leaderboard");root.innerHTML='<h2>Classement des élèves</h2><p>Participation volontaire. Après au moins dix réponses, le taux de réussite est affiché sans adresse e-mail.</p>'+(error?'<p class="notice">'+escapeHTML(error.message)+'</p>':data?.length?data.map((x,i)=>'<section class="panel"><strong>'+(i+1)+'. '+escapeHTML(x.nickname)+'</strong><p>'+escapeHTML(x.accuracy_percent)+' % de réussite · '+x.attempts+' réponses</p></section>').join(""):'<section class="panel">Aucun élève n’apparaît encore dans le classement.</section>')}
let alphabetMode="hiragana";
function showWriting(){const entries=alphabetMode==="kanji"?kanji.map(x=>[x[0],x[2],x[1]]):[...(alphabetMode==="hiragana"?hiragana:katakana)].map((c,i)=>[c,rowset[i],""]);root.innerHTML='<h2>Écriture japonaise</h2><div class="actions"><button id="hira">Hiragana</button><button id="kata">Katakana</button><button id="kan">Kanji</button></div><section class="panel">'+entries.map(x=>'<div class="entry"><span class="jp">'+escapeHTML(x[0])+'</span> — '+escapeHTML(x[1])+' <small>'+escapeHTML(x[2])+'</small></div>').join("")+'</section><button id="practice" class="primary">Faire un QCM</button>';for(const [id,mode] of [["hira","hiragana"],["kata","katakana"],["kan","kanji"]])document.getElementById(id).onclick=()=>{alphabetMode=mode;showWriting()};document.getElementById("practice").onclick=()=>{screen="writingQuiz";showWritingQuiz()}}
function showWritingQuiz(){const items=alphabetMode==="kanji"?kanji.map(x=>[x[0],x[2]]):[...(alphabetMode==="hiragana"?hiragana:katakana)].map((x,i)=>[x,rowset[i]]);const item=items[Math.floor(Math.random()*items.length)],options=[item[1],...items.filter(x=>x[1]!==item[1]).sort(()=>Math.random()-.5).slice(0,3).map(x=>x[1])].sort(()=>Math.random()-.5);root.innerHTML='<section class="panel"><h2>Reconnais le caractère</h2><div class="jp">'+item[0]+'</div>'+options.map(x=>'<button class="choice" data-answer="'+escapeHTML(x)+'">'+escapeHTML(x)+'</button>').join("")+'<p id="feedback"></p><button id="next" class="primary" hidden>Suivant</button><button id="back">Retour</button></section>';root.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>{root.querySelectorAll("[data-answer]").forEach(x=>{x.disabled=true;if(x.dataset.answer===item[1])x.classList.add("right")});if(b.dataset.answer!==item[1])b.classList.add("wrong");alertText("feedback",b.dataset.answer===item[1]?"Bravo !":"Réponse : "+item[1]);document.getElementById("next").hidden=false});document.getElementById("next").onclick=showWritingQuiz;document.getElementById("back").onclick=()=>navigate("writing")}
function render(){drawNav();if(screen==="home")showHome();else if(screen==="courses")showCourses();else if(screen==="account")showAccount();else if(screen==="edit")showEditor();else if(screen==="profile")showProfile();else if(screen==="leaderboard")showLeaderboard();else if(screen==="writing")showWriting();else if(screen==="quiz")showQuiz();else if(screen==="writingQuiz")showWritingQuiz()}
async function init(){if(!db){root.innerHTML='<p>Impossible de charger Supabase. Vérifie ta connexion et actualise.</p>';return}db.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{currentUser=session?.user||null;await reloadCourses();if(screen!=="quiz"&&screen!=="writingQuiz")render()},0)});await getSession();render()}
init();

/* Parcours ludique : affichage pédagogique et mini-jeux. */
const pedagogicTitles=[
 [/cours\s*1.*salut|^salut/i,["Dire bonjour et prendre congé","Saluer et remercier au quotidien","👋"]],
 [/cours\s*1.*classe|en classe/i,["Comprendre les consignes en classe","Écouter, répondre et demander de l’aide","🎒"]],
 [/cours\s*1.*métier|profession/i,["Se présenter et parler de son métier","Dire son nom, sa profession et son pays","🙋"]],
 [/cours\s*1.*gramm|grammaire.*présent/i,["Construire ses premières phrases","Utiliser さん et も","🧩"]],
 [/cours\s*2.*objet|^objets/i,["Nommer les objets autour de soi","Reconnaître le vocabulaire du quotidien","✏️"]],
 [/cours\s*2.*famill|famille/i,["Présenter sa famille","Distinguer les termes pour sa famille et celle des autres","🏠"]],
 [/cours\s*2.*gramm|grammaire.*appartien/i,["Demander à qui appartient un objet","Poser des questions avec だれ et の","🔎"]],
 [/cours\s*3.*gramm/i,["Demander ce que c’est et combien ça coûte","Construire des questions simples","🧠"]],
 [/cours\s*3/i,["Commander au restaurant et demander le prix","Nourriture, boissons et addition","🍣"]]
];
function courseInfo(c){const raw=c.title||"";const match=pedagogicTitles.find(([re])=>re.test(raw));return match?match.slice(1):[raw,"Vocabulaire et expressions du cours","📚"]}
function showCourses(){
 root.innerHTML='<h2>Mon parcours japonais</h2><p class="muted">Des défis courts et variés pour apprendre à ton rythme.</p>'+
 (currentUser?'<p class="muted">Connecté : '+escapeHTML(currentUser.email)+'</p>':'<section class="panel"><h3>Connexion nécessaire</h3><p>Connecte-toi pour retrouver tes cours et tes résultats.</p></section>')+
 '<div class="actions"><button class="primary" id="accountButton">'+(currentUser?"Mon compte":"Se connecter")+'</button>'+(editor?'<button id="addCourse">Ajouter un cours commun</button>':'')+'</div>'+
 (currentUser?courses.map((c,i)=>{const [name,desc,emoji]=courseInfo(c);return '<section class="panel"><div style="display:flex;gap:12px;align-items:start"><span style="font-size:2rem" aria-hidden="true">'+emoji+'</span><div><span class="pill">'+(c.lesson_number?"Cours "+c.lesson_number:"Leçon")+'</span><h3 style="margin:10px 0 4px">'+escapeHTML(name)+'</h3><p class="muted">'+escapeHTML(desc)+'</p><p>'+c.items.length+' mots et expressions</p></div></div><div class="actions"><button data-open="'+i+'">Découvrir</button><button class="primary" data-quiz="'+i+'">Jouer ▶</button></div></section>'}).join("")||'<section class="panel">Aucun cours disponible pour le moment.</section>':'');
 document.getElementById("accountButton").onclick=()=>navigate("account");
 document.getElementById("addCourse")?.addEventListener("click",()=>navigate("edit"));
 root.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>showCourse(courses[Number(b.dataset.open)]));
 root.querySelectorAll("[data-quiz]").forEach(b=>b.onclick=()=>startQuiz(courses[Number(b.dataset.quiz)]));
}
let playMode=0;
function startQuiz(c){
 if(c.items.length<4){root.innerHTML='<section class="panel"><p>Il faut au moins quatre mots pour jouer.</p><button id="back">Retour</button></section>';document.getElementById("back").onclick=()=>navigate("courses");return}
 activeCourse=c;quiz=[...c.items].sort(()=>Math.random()-.5).slice(0,Math.min(10,c.items.length));qIndex=0;score=0;navigate("quiz")
}
function normAnswer(x){return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr").replace(/[’']/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
function showQuiz(){
 if(qIndex>=quiz.length){root.innerHTML='<section class="panel" style="text-align:center"><div style="font-size:3rem">🎉</div><h2>Défi terminé !</h2><p class="jp">'+score+' / '+quiz.length+'</p><p>'+ (score>=8?"Formidable !":score>=5?"Bien joué ! Continue de t’entraîner.":"Chaque erreur est une occasion d’apprendre !") +'</p><div class="actions" style="justify-content:center"><button class="primary" id="retry">Rejouer</button><button id="back">Mes cours</button></div></section>';document.getElementById("retry").onclick=()=>startQuiz(activeCourse);document.getElementById("back").onclick=()=>navigate("courses");return}
 const item=quiz[qIndex],mode=qIndex%3,options=[item,...activeCourse.items.filter(x=>x.id!==item.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
 const common='<div class="bar"><div class="fill" style="width:'+(100*qIndex/quiz.length)+'%"></div></div><p class="muted">Défi '+(qIndex+1)+' sur '+quiz.length+'</p>';
 let content='';
 if(mode===0)content='<span class="pill">🎯 Choisis la traduction</span><h2>Que signifie ce mot ?</h2><div class="jp" lang="ja">'+escapeHTML(item.japanese)+'</div>'+options.map(o=>'<button class="choice" data-choice="'+escapeHTML(o.id)+'">'+escapeHTML(o.french)+'</button>').join("");
 if(mode===1)content='<span class="pill">🔄 Traduction inversée</span><h2>Quel mot japonais signifie :</h2><h3>'+escapeHTML(item.french)+'</h3>'+options.map(o=>'<button class="choice" data-choice="'+escapeHTML(o.id)+'" lang="ja">'+escapeHTML(o.japanese)+'</button>').join("");
 if(mode===2)content='<span class="pill">✍️ Réponse libre</span><h2>Écris la traduction en français</h2><div class="jp" lang="ja">'+escapeHTML(item.japanese)+'</div><input class="field" id="freeAnswer" autocomplete="off" placeholder="Ta réponse"><button class="primary" id="validate">Vérifier</button><p class="muted">Les variantes proches peuvent être refusées : la correction exacte est affichée après ta réponse.</p>';
 root.innerHTML='<section class="panel">'+common+content+'<p id="feedback" role="status"></p><button class="primary" id="next" hidden>Continuer →</button></section>';
 let locked=false;
 async function conclude(ok,chosen){
  if(locked)return;locked=true;if(ok)score++;
  root.querySelectorAll("[data-choice]").forEach(b=>{b.disabled=true;if(b.dataset.choice===item.id)b.classList.add("right");else if(b===chosen)b.classList.add("wrong")});
  document.getElementById("validate")?.setAttribute("disabled","disabled");
  document.getElementById("freeAnswer")?.setAttribute("disabled","disabled");
  const feedback=document.getElementById("feedback");feedback.textContent=(ok?"✅ Bravo !":"💡 Bonne réponse : "+item.french+" — "+item.japanese);
  try{await saveAnswer(item,ok)}catch(err){feedback.textContent+=" · Enregistrement impossible : "+err.message}
  document.getElementById("next").hidden=false;
 }
 root.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>conclude(b.dataset.choice===item.id,b));
 document.getElementById("validate")?.addEventListener("click",()=>{const ans=document.getElementById("freeAnswer").value;conclude(normAnswer(ans)===normAnswer(item.french),null)});
 document.getElementById("freeAnswer")?.addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("validate").click()});
 document.getElementById("next").onclick=()=>{qIndex++;render()};
}


/* Parcours ludique V4 — étoiles calculées à partir des réponses enregistrées. */
const oldCourseView=showCourses;
showCourses=function(){
 oldCourseView();
 if(!currentUser)return;
 const panels=[...root.querySelectorAll("section.panel")].filter(x=>x.querySelector("[data-quiz]"));
 panels.forEach((panel,i)=>{
   const course=courses[i];if(!course)return;
   panel.classList.add("level-node");
   const h=panel.querySelector("h3");
   if(h){const no=document.createElement("span");no.className="level-number";no.textContent="Niveau "+(i+1)+" · ";h.prepend(no)}
   const target=document.createElement("div");target.className="level-stars";target.textContent="☆☆☆ · Commence un défi pour gagner des étoiles";panel.append(target);
   panel.querySelector("[data-quiz]")?.setAttribute("aria-label","Jouer au niveau "+(i+1));
 });
 let visited=0;
 const profileItems=courses.flatMap(c=>c.items.map(x=>x.id));
 if(!profileItems.length)return;
 db.from("review_progress").select("item_id,attempts,correct").eq("owner_id",currentUser.id).then(({data,error})=>{
   if(error||screen!=="courses")return;
   const history=new Map((data||[]).map(x=>[x.item_id,x]));
   panels.forEach((panel,i)=>{
     const c=courses[i],dest=panel.querySelector(".level-stars");if(!c||!dest)return;
     const seen=c.items.map(x=>history.get(x.id)).filter(Boolean);
     const attempted=seen.reduce((n,x)=>n+x.attempts,0),correct=seen.reduce((n,x)=>n+x.correct,0);
     const percentage=attempted?Math.round(100*correct/attempted):0;
     // Étoiles pour un minimum de quatre réponses, puis seuils de maîtrise.
     const stars=attempted>=4?(percentage>=90?3:percentage>=70?2:percentage>=50?1:0):0;
     if(attempted)visited++;
     dest.textContent="★".repeat(stars)+"☆".repeat(3-stars)+" · "+(attempted?percentage+" % de réussite ("+attempted+" réponses)":"Nouveau défi");
     dest.setAttribute("aria-label",stars+" étoiles sur 3");
   });
   const headline=root.querySelector("h2");
   if(headline){const info=document.createElement("p");info.className="journey-progress";info.textContent=visited+" niveau"+(visited>1?"x":"")+" commencé"+(visited>1?"s":"")+" sur "+courses.length;headline.after(info)}
 });
};
const oldChallengeView=showQuiz;
showQuiz=function(){
 oldChallengeView();
 const panel=root.querySelector("section.panel");if(!panel)return;
 const existing=panel.querySelector(".journey-mascot");if(existing)existing.remove();
 const mascot=document.createElement("div");mascot.className="journey-mascot";
 const face=document.createElement("span");face.className="mascot-face";face.setAttribute("role","img");face.setAttribute("aria-label","Une petite mascotte souriante");face.textContent=qIndex>=quiz.length?"🦎🎉":"🦎";
 const saying=document.createElement("span");saying.className="mascot-saying";saying.textContent=qIndex>=quiz.length?"Félicitations ! Tu as gagné "+(score>=8?"3 étoiles ! ⭐⭐⭐":score>=5?"2 étoiles ! ⭐⭐":"1 étoile pour tes efforts ! ⭐"):"Tu peux le faire ! がんばって !";
 mascot.append(face,saying);panel.prepend(mascot);
 const feedback=panel.querySelector("#feedback");
 if(feedback){
  const obs=new MutationObserver(()=>{const txt=feedback.textContent||"";if(txt.startsWith("✅")){face.textContent="🦎✨";saying.textContent="Excellent ! Continue !"}else if(txt.startsWith("💡")){face.textContent="🦎💚";saying.textContent="Essaie encore, tu progresses !"}});
  obs.observe(feedback,{childList:true,characterData:true,subtree:true});
  panel.querySelector("#next")?.addEventListener("click",()=>obs.disconnect(),{once:true});
 }
};

"use strict";
/* Module original inspiré de principes d’apprentissage actif : une carte à la fois. */
const writingStorePrefix="nihongo-writing-v1:";
let selectedWritingId=null, writingRound=null;
function writingUserKey(){return writingStorePrefix+(currentUser?.id||"invité-local")}
function getWritingMemory(){try{return JSON.parse(localStorage.getItem(writingUserKey())||"{}")}catch{return {}}}
function saveWritingMemory(x){localStorage.setItem(writingUserKey(),JSON.stringify(x))}
const kanaH=[...hiragana],kanaK=[...katakana];
const entriesFor=mode=>mode==="kanji"?kanji.map((x,i)=>({id:"kanji-"+i,glyph:x[0],reading:x[1],meaning:x[2],explanation:"Ce kanji signifie « "+x[2]+" ». Ses lectures courantes sont "+x[1]+". Un kanji représente généralement une notion et peut avoir plusieurs lectures."})):(mode==="hiragana"?kanaH:kanaK).map((glyph,i)=>({id:mode+"-"+i,glyph,reading:rowset[i],meaning:rowset[i],explanation:mode==="hiragana"?"« "+glyph+" » est un hiragana : il représente le son « "+rowset[i]+" ». Les hiragana servent notamment aux terminaisons grammaticales et aux particules.":"« "+glyph+" » est un katakana : il représente le son « "+rowset[i]+" ». Les katakana servent notamment aux mots empruntés aux langues étrangères."}));
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
 root.innerHTML='<h2>Apprendre les caractères, un par un</h2><p class="muted">Observe le signe, écoute sa lecture, puis réponds à un QCM. Deux bonnes réponses consécutives sont nécessaires pour confirmer une première maîtrise.</p><div class="actions"><button id="wh">Hiragana</button><button id="wk">Katakana</button><button id="wj">Kanji</button></div><section class="panel"><h3>'+writingSummary(m)+'</h3><div class="bar"><div class="fill" style="width:'+(100*items.filter(x=>m[x.id]?.mastered).length/items.length)+'%"></div></div><p><button class="primary" id="learnNext">Apprendre le prochain caractère</button> <button id="revise">Réviser les erreurs</button></p></section><div class="character-grid">'+items.map(x=>'<button class="character-card '+(m[x.id]?.mastered?"is-mastered":m[x.id]?.seen?"is-learning":"")+'" data-symbol="'+x.id+'" aria-label="'+escapeHTML(x.glyph)+" : "+escapeHTML(m[x.id]?.mastered?"maîtrisé":m[x.id]?.seen?"en apprentissage":"à découvrir")+'"><span>'+escapeHTML(x.glyph)+'</span><small>'+(m[x.id]?.mastered?"✓ Maîtrisé":m[x.id]?.seen?"À revoir":"À découvrir")+'</small></button>').join("")+'</div>';
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


const previousHomeV6=showHome;
showHome=function(){
 previousHomeV6();
 const banner=document.createElement("section");
 banner.className="panel";
 banner.innerHTML='<span class="pill">NOUVEAU · VERSION 6.1</span><h2>✍️ Apprends les caractères un par un</h2><p>Hiragana, katakana et kanji : une fiche par caractère, un QCM et une explication pour chaque erreur.</p><button class="primary" id="startCharacters">Commencer les caractères →</button>';
 root.prepend(banner);
 banner.querySelector("#startCharacters").onclick=()=>navigate("writing");
};
