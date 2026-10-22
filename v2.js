
const alphabet={hiragana:"あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",katakana:"アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"};
const sounds="a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n".split(" ");
const kanji=[["日","にち / ひ","jour, soleil","日本"],["人","ひと / じん","personne","日本人"],["本","ほん","livre, origine","本"],["山","やま","montagne","山"],["水","みず","eau","水"],["学","がく","études","学生"],["生","せい","vie, naissance","学生"]];
const trPairs=[["Mis cursos","Mes cours"],["Mi progreso","Ma progression"],["Cursos","Cours"],["Revisión","Révisions"],["Progreso","Progression"],["Vocabulario","Vocabulaire"],["Gramática","Grammaire"],["Expresiones","Expressions"],["Saludos","Salutations"],["En clase","En classe"],["Profesiones y presentación","Métiers et présentations"],["Objetos","Objets"],["La familia","La famille"],["Gramática: presentación","Grammaire : se présenter"],["Gramática: de quién","Grammaire : à qui ?"],["Empieza por el contenido que has visto en clase.","Commence par ce que tu as appris en cours."],["Practicar QCM","Faire un QCM"],["Volver","Retour"],["¿Qué significa?","Que signifie ce mot ?"],["Pregunta","Question"],["¡Correcto!","Bravo !"],["Respuesta:","Réponse :"],["Siguiente","Suivant"],["¡Terminado!","Terminé !"],["Repetir","Recommencer"],["Revisión de errores","Révision des erreurs"],["Practicar sección","S'entraîner"],["respuestas registradas","réponses enregistrées"],["Este progreso está guardado únicamente en este navegador.","La progression est enregistrée dans ce navigateur."],["Aún no hay errores guardados. ¡Prueba un QCM!","Aucune erreur enregistrée. Essaie un QCM !"],["elementos","éléments"],["Lápiz","Crayon"],["Llave","Clé"],["Paraguas","Parapluie"],["Bolso / mochila","Sac"],["Cámara","Appareil photo"],["Coche","Voiture"],["Teléfono móvil","Téléphone portable"],["Cartera","Portefeuille"],["Revista","Magazine"],["Diccionario","Dictionnaire"],["Fotografía","Photographie"],["Periódico","Journal"],["Televisión","Télévision"],["Reloj","Montre"],["Cuaderno","Cahier"],["Pasaporte","Passeport"],["Bolígrafo","Stylo"],["Sombrero","Chapeau"],["Libro","Livre"],["Gracias","Merci"],["Muchas gracias","Merci beaucoup"],["Adiós","Au revoir"],["Hasta luego","À bientôt"],["Encantado de conocerte","Enchanté(e)"],["Buenos días (por la mañana)","Bonjour (le matin)"],["Hola / buenas tardes","Bonjour"],["Buenas noches (saludo)","Bonsoir"],["Buenas noches (al dormir)","Bonne nuit"],["Médico/a","Médecin"],["Estudiante","Étudiant(e)"],["Empresa","Entreprise"],["Escuela","École"],["Hospital","Hôpital"],["País","Pays"],["Quién","Qui"]];
function localize(t){let result=t;for(const [a,b] of trPairs)result=result.split(a).join(b);return result}
for(const s of sections){s.title=localize(s.title);s.type=localize(s.type);s.items.forEach(item=>item[2]=localize(item[2]))}
let customLessons=[];try{customLessons=JSON.parse(localStorage.getItem("nihongo_custom")||"[]")}catch(e){}
let kanaMode="hiragana";
function showWriting(){
 const options='<div class="actions"><button id="hir">Hiragana</button><button id="kat">Katakana</button><button id="kan">Kanji</button></div>';
 const array=kanaMode==="kanji"?kanji.map(x=>[x[0],x[2],x[1]+" · "+x[3]]):[...alphabet[kanaMode]].map((c,i)=>[c,sounds[i],""]);
 app.innerHTML='<h2>Écriture japonaise</h2><p class="muted">Apprends les caractères, puis entraîne-toi.</p>'+options+'<section class="panel">'+array.map(x=>'<div class="item"><span class="jp" lang="ja">'+esc(x[0])+'</span> <strong>'+esc(x[1])+'</strong> <span class="muted">'+esc(x[2])+'</span></div>').join("")+'</section><button class="primary" id="quizAlphabet">Quiz de reconnaissance</button>';
 document.querySelector("#hir").onclick=()=>{kanaMode="hiragana";showWriting()};
 document.querySelector("#kat").onclick=()=>{kanaMode="katakana";showWriting()};
 document.querySelector("#kan").onclick=()=>{kanaMode="kanji";showWriting()};
 document.querySelector("#quizAlphabet").onclick=showWritingQuiz
}
function showWritingQuiz(){
 const all=kanaMode==="kanji"?kanji.map(x=>[x[0],x[2]]):[...alphabet[kanaMode]].map((c,i)=>[c,sounds[i]]);
 const current=all[Math.floor(Math.random()*all.length)], options=[current[1],...all.filter(x=>x[1]!==current[1]).sort(()=>Math.random()-.5).slice(0,3).map(x=>x[1])].sort(()=>Math.random()-.5);
 app.innerHTML='<section class="panel"><h2>Que signifie ce caractère ?</h2><div class="jp">'+esc(current[0])+'</div>'+options.map(o=>'<button class="choice" data-opt="'+esc(o)+'">'+esc(o)+'</button>').join("")+'<p id="result"></p><button id="again" class="primary" hidden>Suivant</button><button id="backAlphabet">Retour</button></section>';
 app.querySelectorAll("[data-opt]").forEach(b=>b.onclick=()=>{app.querySelectorAll("[data-opt]").forEach(x=>{x.disabled=true;if(x.dataset.opt===current[1])x.classList.add("right")});if(b.dataset.opt!==current[1])b.classList.add("wrong");document.querySelector("#result").textContent=b.dataset.opt===current[1]?"Bravo !":"Réponse : "+current[1];document.querySelector("#again").hidden=false});
 document.querySelector("#again").onclick=showWritingQuiz;document.querySelector("#backAlphabet").onclick=showWriting
}
function courseEditor(){
 app.innerHTML='<h2>Ajouter un cours</h2><p>Ajoute directement ton vocabulaire. Pour le moment, ces données restent sur ce téléphone ; la synchronisation Supabase sera activée ultérieurement.</p><section class="panel"><label>Nom du cours <input id="courseTitle" style="padding:12px;width:100%" placeholder="Cours 3"></label><p>Une ligne par mot : japonais | romaji | français</p><textarea id="courseWords" rows="7" style="padding:12px;width:100%" placeholder="ねこ | neko | chat"></textarea><div class="actions"><button class="primary" id="saveCourse">Enregistrer</button></div><p id="editorStatus"></p></section><h3>Cours personnels</h3>'+customLessons.map((s,i)=>'<section class="panel"><h3>'+esc(s.title)+'</h3><p>'+s.items.length+' termes</p><button data-own="'+i+'">Voir le cours</button></section>').join("");
 document.querySelector("#saveCourse").onclick=()=>{const title=document.querySelector("#courseTitle").value.trim();const items=document.querySelector("#courseWords").value.trim().split("\n").map(s=>s.split("|").map(x=>x.trim())).filter(x=>x.length===3&&x.every(Boolean));if(!title||!items.length){document.querySelector("#editorStatus").textContent="Il faut un titre et au moins un mot valide.";return}customLessons.push({title,items});localStorage.setItem("nihongo_custom",JSON.stringify(customLessons));courseEditor()};
 app.querySelectorAll("[data-own]").forEach(b=>b.onclick=()=>{const s=customLessons[Number(b.dataset.own)];app.innerHTML='<button id="backOwn">Retour</button><h2>'+esc(s.title)+'</h2>'+s.items.map(x=>'<section class="panel"><span class="jp">'+esc(x[0])+'</span><p>'+esc(x[1])+' · '+esc(x[2])+'</p></section>').join("");document.querySelector("#backOwn").onclick=courseEditor})
}
const renderBase=render;
render=function(){
 if(view==="writing"||view==="editor"){nav.innerHTML='<button id="backHome">← Mes cours</button>';document.querySelector("#backHome").onclick=()=>go("home");if(view==="writing")showWriting();else courseEditor();return}
 renderBase();
 // Translate interface after rendering, preserving Japanese text.
 const walker=document.createTreeWalker(app,NodeFilter.SHOW_TEXT);
 let node;while(node=walker.nextNode()){if(!node.parentElement?.closest(".jp"))node.textContent=localize(node.textContent)}
 nav.querySelectorAll("button").forEach(b=>b.textContent=localize(b.textContent));
 if(view==="home"){const tools=document.createElement("div");tools.className="actions";tools.innerHTML='<button id="writingBtn" class="primary">✍️ Hiragana · Katakana · Kanji</button><button id="editorBtn">＋ Ajouter un cours</button>';app.prepend(tools);tools.querySelector("#writingBtn").onclick=()=>go("writing");tools.querySelector("#editorBtn").onclick=()=>go("editor")}
};
render();
