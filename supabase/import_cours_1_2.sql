-- À exécuter après v3_shared_courses.sql. Importe une seule fois les cours 1 et 2.
DO $seed$
DECLARE owner_uuid uuid; course_uuid uuid;
BEGIN
 SELECT user_id INTO owner_uuid FROM public.course_editors LIMIT 1;
 IF owner_uuid IS NULL THEN RAISE EXCEPTION 'Aucun éditeur autorisé : configurez course_editors.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 1 — Salutations') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 1 — Salutations',1) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'vocabulary','おはようございます','ohayō gozaimasu','Bonjour (le matin)',0),
 (owner_uuid,course_uuid,'vocabulary','こんにちは','konnichiwa','Bonjour',1),
 (owner_uuid,course_uuid,'vocabulary','こんばんは','konbanwa','Bonsoir',2),
 (owner_uuid,course_uuid,'vocabulary','おやすみなさい','oyasuminasai','Bonne nuit',3),
 (owner_uuid,course_uuid,'vocabulary','はじめまして','hajimemashite','Enchanté(e)',4),
 (owner_uuid,course_uuid,'vocabulary','よろしくおねがいします','yoroshiku onegaishimasu','Ravi(e) de faire votre connaissance',5),
 (owner_uuid,course_uuid,'vocabulary','ありがとう','arigatō','Merci',6),
 (owner_uuid,course_uuid,'vocabulary','ありがとうございます','arigatō gozaimasu','Merci beaucoup',7),
 (owner_uuid,course_uuid,'vocabulary','すみません','sumimasen','Excusez-moi / pardon',8),
 (owner_uuid,course_uuid,'vocabulary','さようなら','sayōnara','Au revoir',9),
 (owner_uuid,course_uuid,'vocabulary','じゃあ、また','jā mata','À bientôt',10),
 (owner_uuid,course_uuid,'vocabulary','いってきます','ittekimasu','Je pars (de la maison)',11),
 (owner_uuid,course_uuid,'vocabulary','いってらっしゃい','itterasshai','Bonne journée (réponse au départ)',12),
 (owner_uuid,course_uuid,'vocabulary','ただいま','tadaima','Je suis rentré(e)',13),
 (owner_uuid,course_uuid,'vocabulary','おかえりなさい','okaerinasai','Bon retour à la maison',14),
 (owner_uuid,course_uuid,'vocabulary','いただきます','itadakimasu','Formule avant le repas',15),
 (owner_uuid,course_uuid,'vocabulary','ごちそうさま','gochisōsama','Formule après le repas',16);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 1 — En classe') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 1 — En classe',1) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'vocabulary','はじめましょう','hajimemashō','Commençons',0),
 (owner_uuid,course_uuid,'vocabulary','おわりましょう','owarimashō','Terminons',1),
 (owner_uuid,course_uuid,'vocabulary','やすみましょう','yasumimashō','Faisons une pause',2),
 (owner_uuid,course_uuid,'vocabulary','しつもん','shitsumon','Question',3),
 (owner_uuid,course_uuid,'vocabulary','れい','rei','Exemple',4),
 (owner_uuid,course_uuid,'vocabulary','こたえ','kotae','Réponse',5),
 (owner_uuid,course_uuid,'vocabulary','しゅくだい','shukudai','Devoirs',6),
 (owner_uuid,course_uuid,'vocabulary','しけん','shiken','Examen',7),
 (owner_uuid,course_uuid,'vocabulary','わかりますか','wakarimasu ka','Comprends-tu ?',8),
 (owner_uuid,course_uuid,'vocabulary','わかりません','wakarimasen','Je ne comprends pas',9),
 (owner_uuid,course_uuid,'vocabulary','よんでください','yonde kudasai','Lisez, s’il vous plaît',10),
 (owner_uuid,course_uuid,'vocabulary','かいてください','kaite kudasai','Écrivez, s’il vous plaît',11),
 (owner_uuid,course_uuid,'vocabulary','きいてください','kiite kudasai','Écoutez, s’il vous plaît',12),
 (owner_uuid,course_uuid,'vocabulary','くりかえしてください','kurikaeshite kudasai','Répétez, s’il vous plaît',13);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 1 — Métiers et présentations') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 1 — Métiers et présentations',1) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'vocabulary','わたし','watashi','Moi / je',0),
 (owner_uuid,course_uuid,'vocabulary','なまえ','namae','Nom',1),
 (owner_uuid,course_uuid,'vocabulary','しごと','shigoto','Travail',2),
 (owner_uuid,course_uuid,'vocabulary','がくせい','gakusei','Étudiant(e)',3),
 (owner_uuid,course_uuid,'vocabulary','せんせい','sensei','Professeur (titre)',4),
 (owner_uuid,course_uuid,'vocabulary','きょうし','kyōshi','Enseignant(e) (son propre métier)',5),
 (owner_uuid,course_uuid,'vocabulary','いしゃ','isha','Médecin',6),
 (owner_uuid,course_uuid,'vocabulary','かんごし','kangoshi','Infirmier / infirmière',7),
 (owner_uuid,course_uuid,'vocabulary','エンジニア','enjinia','Ingénieur(e)',8),
 (owner_uuid,course_uuid,'vocabulary','かいしゃいん','kaishain','Employé(e) d’entreprise',9),
 (owner_uuid,course_uuid,'vocabulary','ぎんこういん','ginkōin','Employé(e) de banque',10),
 (owner_uuid,course_uuid,'vocabulary','こうむいん','kōmuin','Fonctionnaire',11),
 (owner_uuid,course_uuid,'vocabulary','てんいん','ten''in','Vendeur / vendeuse',12),
 (owner_uuid,course_uuid,'vocabulary','かいしゃ','kaisha','Entreprise',13),
 (owner_uuid,course_uuid,'vocabulary','がっこう','gakkō','École',14),
 (owner_uuid,course_uuid,'vocabulary','くに','kuni','Pays',15),
 (owner_uuid,course_uuid,'vocabulary','びょういん','byōin','Hôpital',16);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 1 — Grammaire : se présenter') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 1 — Grammaire : se présenter',1) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'grammar','～さん','-san','Suffixe de politesse après le nom',0),
 (owner_uuid,course_uuid,'grammar','も','mo','Aussi (particule)',1),
 (owner_uuid,course_uuid,'grammar','わたしも がくせいです','watashi mo gakusei desu','Je suis aussi étudiant(e)',2);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 2 — Objets') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 2 — Objets',2) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'vocabulary','えんぴつ','enpitsu','Crayon',0),
 (owner_uuid,course_uuid,'vocabulary','かぎ','kagi','Clé',1),
 (owner_uuid,course_uuid,'vocabulary','かさ','kasa','Parapluie',2),
 (owner_uuid,course_uuid,'vocabulary','かばん','kaban','Sac',3),
 (owner_uuid,course_uuid,'vocabulary','カメラ','kamera','Appareil photo',4),
 (owner_uuid,course_uuid,'vocabulary','くるま','kuruma','Voiture',5),
 (owner_uuid,course_uuid,'vocabulary','けいたいでんわ','keitai denwa','Téléphone portable',6),
 (owner_uuid,course_uuid,'vocabulary','さいふ','saifu','Portefeuille',7),
 (owner_uuid,course_uuid,'vocabulary','ざっし','zasshi','Magazine',8),
 (owner_uuid,course_uuid,'vocabulary','じしょ','jisho','Dictionnaire',9),
 (owner_uuid,course_uuid,'vocabulary','しゃしん','shashin','Photographie',10),
 (owner_uuid,course_uuid,'vocabulary','しんぶん','shinbun','Journal',11),
 (owner_uuid,course_uuid,'vocabulary','テレビ','terebi','Télévision',12),
 (owner_uuid,course_uuid,'vocabulary','とけい','tokei','Montre / horloge',13),
 (owner_uuid,course_uuid,'vocabulary','ノート','nōto','Cahier',14),
 (owner_uuid,course_uuid,'vocabulary','パスポート','pasupōto','Passeport',15),
 (owner_uuid,course_uuid,'vocabulary','ペン','pen','Stylo',16),
 (owner_uuid,course_uuid,'vocabulary','ぼうし','bōshi','Chapeau',17),
 (owner_uuid,course_uuid,'vocabulary','ほん','hon','Livre',18);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 2 — La famille') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 2 — La famille',2) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'vocabulary','だれ','dare','Qui',0),
 (owner_uuid,course_uuid,'vocabulary','おとうさん','otōsan','Père (d’autrui / appellation familiale)',1),
 (owner_uuid,course_uuid,'vocabulary','ちち','chichi','Mon père (en parlant à autrui)',2),
 (owner_uuid,course_uuid,'vocabulary','おかあさん','okāsan','Mère (d’autrui / appellation familiale)',3),
 (owner_uuid,course_uuid,'vocabulary','はは','haha','Ma mère (en parlant à autrui)',4),
 (owner_uuid,course_uuid,'vocabulary','おにいさん','onīsan','Grand frère (d’autrui / appellation familiale)',5),
 (owner_uuid,course_uuid,'vocabulary','あに','ani','Mon grand frère',6),
 (owner_uuid,course_uuid,'vocabulary','おとうと','otōto','Mon petit frère',7),
 (owner_uuid,course_uuid,'vocabulary','おねえさん','onēsan','Grande sœur (d’autrui / appellation familiale)',8),
 (owner_uuid,course_uuid,'vocabulary','あね','ane','Ma grande sœur',9),
 (owner_uuid,course_uuid,'vocabulary','いもうと','imōto','Ma petite sœur',10),
 (owner_uuid,course_uuid,'vocabulary','おじいさん','ojīsan','Grand-père (d’autrui / appellation familiale)',11),
 (owner_uuid,course_uuid,'vocabulary','そふ','sofu','Mon grand-père',12),
 (owner_uuid,course_uuid,'vocabulary','おばあさん','obāsan','Grand-mère (d’autrui / appellation familiale)',13),
 (owner_uuid,course_uuid,'vocabulary','そぼ','sobo','Ma grand-mère',14),
 (owner_uuid,course_uuid,'vocabulary','ごしゅじん','goshujin','Époux (d’autrui)',15),
 (owner_uuid,course_uuid,'vocabulary','しゅじん','shujin','Mon mari (formulation traditionnelle)',16),
 (owner_uuid,course_uuid,'vocabulary','おくさん','okusan','Épouse (d’autrui)',17),
 (owner_uuid,course_uuid,'vocabulary','つま','tsuma','Ma femme',18);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE title='Cours 2 — Grammaire : à qui appartient l''objet ?') THEN
 INSERT INTO public.lessons(owner_id,title,lesson_number) VALUES(owner_uuid,'Cours 2 — Grammaire : à qui appartient l''objet ?',2) RETURNING id INTO course_uuid;
 INSERT INTO public.lesson_items(owner_id,lesson_id,item_type,japanese,romaji,french,sort_order) VALUES
 (owner_uuid,course_uuid,'grammar','このひとは だれ ですか','kono hito wa dare desu ka','Qui est cette personne ?',0),
 (owner_uuid,course_uuid,'grammar','これは だれの ペンですか','kore wa dare no pen desu ka','À qui appartient ce stylo ?',1),
 (owner_uuid,course_uuid,'grammar','これは わたしの ペンです','kore wa watashi no pen desu','C’est mon stylo',2),
 (owner_uuid,course_uuid,'grammar','いいえ、わたしのじゃありません','iie watashi no ja arimasen','Non, ce n’est pas le mien',3);
 END IF;
END $seed$;
