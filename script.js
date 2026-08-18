(async function(){
await (window.SURAH_DATA_READY || Promise.resolve(window.SURAH_LIBRARY || {}));


const STATIONS = [
  {id:"listen", title:"أستمع وأقرأ", icon:"🔊", note:"السورة كاملة وآية آية"},
  {id:"repeat", title:"أردد", icon:"🗣️", note:"تكرار وتدريب"},
  {id:"understand", title:"أفهم", icon:"💡", note:"معانٍ مبسطة"},
  {id:"match", title:"أطابق", icon:"🧩", note:"نشاط تفاعلي"},
  {id:"order", title:"أرتب", icon:"🔢", note:"ترتيب الآيات"},
  {id:"practice", title:"أتدرب", icon:"🎯", note:"تحديات قصيرة"},
  {id:"quiz", title:"أختبر نفسي", icon:"✅", note:"تقويم ممتع"},
  {id:"certificate", title:"شهادتي", icon:"📜", note:"إنجاز وطباعة"}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function shuffledChoices(items, correctIndex){
  const packed = items.map((text,i)=>({text, correct:i===correctIndex}));
  for(let i=packed.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [packed[i],packed[j]]=[packed[j],packed[i]];
  }
  return packed;
}
function shuffledArray(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
const choiceOrderCache = {};
function getStableShuffled(key, items, correctIndex){
  if(!choiceOrderCache[key]) choiceOrderCache[key]=shuffledChoices(items,correctIndex);
  return choiceOrderCache[key];
}

/* ===== الحالة العامة + ترحيل بيانات النسخ السابقة ===== */
const state = JSON.parse(localStorage.getItem("rihlatiState") || "{}");
state.studentName ??= "";
state.activeSurahId ??= "an-nas";
state.surahs ??= {};

function blankSurahProgress(){
  return {
    stars:0,
    completedStations:[],
    masteredAyat:[],
    playedAyat:[],
    repeatedAyat:[],
    understoodAyat:[],
    matchedItems:[],
    orderCompleted:false,
    practiceCompleted:[],
    quizPassed:false,
    quizBestScore:0,
    completed:false,
    badge:false
  };
}
function ensureSurahProgress(id){
  if(!state.surahs[id]) state.surahs[id]=blankSurahProgress();
  return state.surahs[id];
}

/* ترحيل بيانات سورة الناس القديمة مرة واحدة */
if(!state.migratedToMultiSurah){
  const p=ensureSurahProgress("an-nas");
  if(Array.isArray(state.completedStations)) p.completedStations=[...state.completedStations];
  if(Array.isArray(state.masteredAyat)) p.masteredAyat=[...state.masteredAyat];
  if(Array.isArray(state.playedAyat)) p.playedAyat=[...state.playedAyat];
  if(Array.isArray(state.repeatedAyat)) p.repeatedAyat=[...state.repeatedAyat];
  if(Array.isArray(state.understoodAyat)) p.understoodAyat=[...state.understoodAyat];
  if(Array.isArray(state.matchedItems)) p.matchedItems=[...state.matchedItems];
  if(Array.isArray(state.practiceCompleted)) p.practiceCompleted=[...state.practiceCompleted];
  if(typeof state.orderCompleted==="boolean") p.orderCompleted=state.orderCompleted;
  if(typeof state.quizPassed==="boolean") p.quizPassed=state.quizPassed;
  if(typeof state.quizBestScore==="number") p.quizBestScore=state.quizBestScore;
  if(typeof state.stars==="number") p.stars=state.stars;
  if((state.completedSurahs||0)>0) p.completed=true;
  if((state.badges||0)>0) p.badge=true;
  state.migratedToMultiSurah=true;
}

function saveState(){
  localStorage.setItem("rihlatiState",JSON.stringify(state));
}
function activeSurah(){
  return window.SURAH_LIBRARY[state.activeSurahId] || window.SURAH_LIBRARY["an-nas"];
}
function progress(){
  return ensureSurahProgress(state.activeSurahId);
}
function audioPath(file){
  const s=activeSurah();
  return `audio/${s.audioFolder}/${file}`;
}
function totalStars(){
  return Object.values(state.surahs).reduce((sum,p)=>sum+(p.stars||0),0);
}
function completedSurahCount(){
  return Object.values(state.surahs).filter(p=>p.completed).length;
}
function badgeCount(){
  return Object.values(state.surahs).filter(p=>p.badge).length;
}
function setActiveSurah(id){
  const s=window.SURAH_LIBRARY[id];
  if(!s || !s.unlocked || !s.ayat.length) return false;
  state.activeSurahId=id;
  ensureSurahProgress(id);
  saveState();
  updateDynamicSurahLabels();
  renderAll();
  return true;
}

/* ===== تحديث النصوص الديناميكية ===== */
function updateDynamicSurahLabels(){
  const s=activeSurah();
  const heroTitle=document.querySelector(".hero-copy h2");
  if(heroTitle) heroTitle.innerHTML=`رحلتي مع <span>${s.fullTitle}</span>`;

  const surahName=document.querySelector(".surah-name");
  if(surahName) surahName.textContent=s.fullTitle;

  document.querySelectorAll(".dialog-head h2").forEach(h=>{
    const t=h.textContent;
    if(t.includes("أستمع وأقرأ")) h.textContent=`أستمع وأقرأ — ${s.fullTitle}`;
    else if(t.includes("أردد")) h.textContent=`أردد — ${s.fullTitle}`;
    else if(t.includes("أفهم")) h.textContent=`أفهم — ${s.fullTitle}`;
    else if(t.includes("أطابق")) h.textContent=`أطابق — ${s.fullTitle}`;
    else if(t.includes("أرتب")) h.textContent=`أرتب — ${s.fullTitle}`;
    else if(t.includes("أتدرب")) h.textContent=`أتدرب — ${s.fullTitle}`;
    else if(t.includes("أختبر نفسي")) h.textContent=`أختبر نفسي — ${s.fullTitle}`;
  });

  const previewTitle=document.querySelector(".journey-preview .section-head h3");
  if(previewTitle) previewTitle.textContent=`محطات رحلة ${s.fullTitle}`;

  const certMsg=document.querySelector(".cert-message");
  if(certMsg) certMsg.innerHTML=`تقديرًا لإتمامه رحلة <strong>${s.fullTitle}</strong> واجتيازه محطات التعلم والأنشطة بنجاح.`;
}

function renderStats(){
  const p=progress();
  if($("#heroNameHeader")) $("#heroNameHeader").textContent=state.studentName?.trim() || "بطل الرحلة";
  if($("#starsCount")) $("#starsCount").textContent=totalStars();
  if($("#badgesCount")) $("#badgesCount").textContent=badgeCount();
  if($("#completedCount")) $("#completedCount").textContent=completedSurahCount();
  ["dialogStars","repeatDialogStars","understandDialogStars","matchDialogStars","orderDialogStars","practiceDialogStars","quizDialogStars"]
    .forEach(id=>{ if($("#"+id)) $("#"+id).textContent=p.stars; });

  const done=p.completedStations.length;
  const percent=Math.round(done/STATIONS.length*100);
  if($("#progressFill")) $("#progressFill").style.width=percent+"%";
  if($("#progressText")) $("#progressText").textContent=percent+"%";
  if($("#progressDetail")) $("#progressDetail").textContent=`${done} من ${STATIONS.length} محطات مكتملة`;

  const reward=Math.min(5,Math.floor((p.stars%25)/5));
  if($("#rewardStars")) $("#rewardStars").textContent="★★★★★".slice(0,reward)+"☆☆☆☆☆".slice(reward);

  const ayahCount=activeSurah().ayat.length;

  if($("#masteryText")){
    const n=p.masteredAyat.length;
    $("#masteryText").textContent=`${n} من ${ayahCount} آيات`;
    $("#masteryStars").textContent="★".repeat(n)+"☆".repeat(Math.max(0,ayahCount-n));
    const all=n===ayahCount;
    $("#stationCompleteCard").hidden=!all;
    $("#markStationDone").disabled=!all || p.completedStations.includes("listen");
    if(p.completedStations.includes("listen")) $("#markStationDone").textContent="✅ تم إكمال محطة الاستماع";
  }
  if($("#repeatProgressText")){
    const n=p.repeatedAyat.length;
    $("#repeatProgressText").textContent=`${n} من ${ayahCount} آيات`;
    $("#repeatMasteryStars").textContent="★".repeat(n)+"☆".repeat(Math.max(0,ayahCount-n));
    const all=n===ayahCount;
    $("#repeatStationCompleteCard").hidden=!all;
    $("#finishRepeatStation").disabled=!all || p.completedStations.includes("repeat");
    if(p.completedStations.includes("repeat")) $("#finishRepeatStation").textContent="✅ تم إكمال محطة «أردد»";
  }
  if($("#understandProgressText")){
    const n=p.understoodAyat.length, total=activeSurah().understand.length;
    $("#understandProgressText").textContent=`${n} من ${total} آيات`;
    $("#understandStars").textContent="★".repeat(n)+"☆".repeat(Math.max(0,total-n));
    $("#understandCompleteCard").hidden=n!==total;
    $("#finishUnderstand").disabled=n!==total || p.completedStations.includes("understand");
    if(p.completedStations.includes("understand")) $("#finishUnderstand").textContent="✅ تم إكمال محطة «أفهم»";
  }
  if($("#matchProgressText")){
    const n=p.matchedItems.length,total=activeSurah().matching.length;
    $("#matchProgressText").textContent=`${n} من ${total}`;
    $("#matchStars").textContent="★".repeat(n)+"☆".repeat(Math.max(0,total-n));
    $("#matchCompleteCard").hidden=n!==total;
    $("#finishMatch").disabled=n!==total || p.completedStations.includes("match");
    if(p.completedStations.includes("match")) $("#finishMatch").textContent="✅ تم إكمال محطة «أطابق»";
  }
  if($("#orderProgressText")){
    const total=ayahCount,n=p.orderCompleted?total:0;
    $("#orderProgressText").textContent=`${n} من ${total} آيات`;
    $("#orderStars").textContent=p.orderCompleted?"★".repeat(total):"☆".repeat(total);
    $("#orderCompleteCard").hidden=!p.orderCompleted;
    $("#finishOrder").disabled=!p.orderCompleted || p.completedStations.includes("order");
    if(p.completedStations.includes("order")) $("#finishOrder").textContent="✅ تم إكمال محطة «أرتب»";
  }
  if($("#practiceProgressText")){
    const n=p.practiceCompleted.length,total=activeSurah().practice.length;
    $("#practiceProgressText").textContent=`${n} من ${total} تحديات`;
    $("#practiceStars").textContent="★".repeat(n)+"☆".repeat(Math.max(0,total-n));
    $("#practiceCompleteCard").hidden=n!==total;
    $("#finishPractice").disabled=n!==total || p.completedStations.includes("practice");
    if(p.completedStations.includes("practice")) $("#finishPractice").textContent="✅ تم إكمال محطة «أتدرب»";
  }
  if($("#finishQuiz")){
    $("#finishQuiz").disabled=!p.quizPassed || p.completedStations.includes("quiz");
    if(p.completedStations.includes("quiz")) $("#finishQuiz").textContent="✅ تم إكمال محطة «أختبر نفسي»";
  }
}


/* ===== V14: التحكم في شريط بطاقات السور ===== */
let surahCarouselStart=0;

function surahVisibleCount(){
  if(window.matchMedia("(max-width:700px)").matches) return 2;
  if(window.matchMedia("(max-width:1100px)").matches) return 3;
  return 5;
}
function updateSurahCarouselButtons(){
  const cards=$$("#surahGrid .surah-card");
  const visible=surahVisibleCount();
  const max=Math.max(0,cards.length-visible);
  surahCarouselStart=Math.min(Math.max(0,surahCarouselStart),max);
  if($("#surahPrev")) $("#surahPrev").disabled=surahCarouselStart<=0;
  if($("#surahNext")) $("#surahNext").disabled=surahCarouselStart>=max;
}
function goToSurahCarouselIndex(index){
  const grid=$("#surahGrid"), cards=$$("#surahGrid .surah-card");
  if(!grid || !cards.length) return;
  const visible=surahVisibleCount();
  const max=Math.max(0,cards.length-visible);
  surahCarouselStart=Math.min(Math.max(0,index),max);
  cards[surahCarouselStart]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
  window.setTimeout(updateSurahCarouselButtons,260);
}
function setupSurahCarousel(){
  updateSurahCarouselButtons();
  if($("#surahPrev") && !$("#surahPrev").dataset.bound){
    $("#surahPrev").dataset.bound="1";
    $("#surahPrev").addEventListener("click",()=>goToSurahCarouselIndex(surahCarouselStart-surahVisibleCount()));
  }
  if($("#surahNext") && !$("#surahNext").dataset.bound){
    $("#surahNext").dataset.bound="1";
    $("#surahNext").addEventListener("click",()=>goToSurahCarouselIndex(surahCarouselStart+surahVisibleCount()));
  }
}
window.addEventListener("resize",()=>{updateSurahCarouselButtons();});

function renderSurahs(){
  const cards=Object.values(window.SURAH_LIBRARY);
  $("#surahGrid").innerHTML=cards.map(s=>{
    const p=ensureSurahProgress(s.id);
    const percent=Math.round((p.completedStations.length/STATIONS.length)*100);
    const available=s.unlocked && s.ayat.length>0;
    return `
      <article class="surah-card ${state.activeSurahId===s.id?"active":""}" data-surah="${s.id}">
        ${available?`<span class="badge">${state.activeSurahId===s.id?"الرحلة الحالية":"متاحة"}</span>`:`<span class="lock">🔒</span>`}
        <div class="surah-cover" style="background:${s.color}">${s.icon}</div>
        <div class="body">
          <small>سورة</small><h4>${s.title}</h4>
          <p>${available?`التقدم ${percent}%`:"ستُضاف قريبًا"}</p>
          <div class="mini-stars">${p.completed?"★★★★★":p.completedStations.length?"★★☆☆☆":"☆☆☆☆☆"}</div>
        </div>
      </article>`;
  }).join("");

  $$(".surah-card").forEach(card=>{
    card.addEventListener("click",()=>{
      const s=window.SURAH_LIBRARY[card.dataset.surah];
      if(s.unlocked && s.ayat.length){
        setActiveSurah(s.id);
        openJourney();
      }else{
        showInfo("هذه الرحلة غير متاحة بعد",`سيتم إضافة محتوى ${s.fullTitle} وملفاتها الصوتية في المرحلة التالية.`);
      }
    });
  });
  setupSurahCarousel();
}

function renderStations(){
  const p=progress();
  $("#stationsGrid").innerHTML=STATIONS.map(st=>`
    <button class="station ${p.completedStations.includes(st.id)?"done":""}" data-station="${st.id}">
      <span class="ico">${p.completedStations.includes(st.id)?"✅":st.icon}</span>
      <span><strong>${st.title}</strong><small>${st.note}</small></span>
    </button>`).join("");

  $$(".station").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.dataset.station;
      if(id==="listen") openJourney();
      else if(id==="repeat") openRepeatStation();
      else if(id==="understand") openUnderstandStation();
      else if(id==="match") openMatchStation();
      else if(id==="order") openOrderStation();
      else if(id==="practice") openPracticeStation();
      else if(id==="quiz") openQuizStation();
      else if(id==="certificate") openCertificate();
    });
  });
}
function renderAll(){
  updateDynamicSurahLabels();
  renderStats();renderSurahs();renderStations();
}
function save(){
  saveState();renderAll();
}

/* ===== معلومات / التنقل ===== */
function showInfo(title,text){
  $("#infoTitle").textContent=title;
  $("#infoText").textContent=text;
  $("#infoDialog").showModal();
}
$("#rewardsBtn").addEventListener("click",()=>showInfo("المكافآت","سيتم تطوير لوحة المكافآت والشارات في مرحلة لاحقة."));
$("#menuBtn").addEventListener("click",()=>showInfo("القائمة","سيتم ربط القائمة بالحساب والإعدادات وولي الأمر في مرحلة لاحقة."));
$$(".bottom-nav button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(btn.dataset.view==="home") return;
    if(btn.dataset.view==="certificate"){openCertificate();return;}
    showInfo(btn.querySelector("span").textContent,"هذا القسم ضمن الهيكل الأساسي وسيتم تطويره لاحقًا.");
  });
});

/* ===== المحطة 1: أستمع وأقرأ ===== */
const player=$("#audioPlayer");
let currentAyah=null,fullMode=false,fullIndex=0;
function renderAyat(){
  const s=activeSurah(),p=progress();
  $("#ayahsList").innerHTML=s.ayat.map(a=>{
    const played=p.playedAyat.includes(a.n),mastered=p.masteredAyat.includes(a.n);
    return `<div class="ayah ${played?"played":""} ${mastered?"mastered":""}" data-ayah="${a.n}">
      <span class="ayah-number">${a.n}</span>
      <div><div class="ayah-text">${a.text}</div>
      <div class="audio-note">${mastered?"⭐ أحسنت، أتممت هذه الآية":played?"🎙️ الآن دورك… ردد الآية":"استمع أولًا ثم ردد خلف الشيخ"}</div></div>
      <div class="ayah-actions">
        <button type="button" class="play-ayah" data-n="${a.n}">🔊 استمع</button>
        <button type="button" class="master-ayah ${mastered?"done":""}" data-n="${a.n}" ${played?"":"disabled"}>${mastered?"✅ أتممت الآية":"⭐ أتممت الآية"}</button>
      </div></div>`;
  }).join("");
  $$(".play-ayah").forEach(b=>b.addEventListener("click",()=>playSingleAyah(Number(b.dataset.n))));
  $$(".master-ayah").forEach(b=>b.addEventListener("click",()=>{
    const n=Number(b.dataset.n),p=progress();
    if(!p.playedAyat.includes(n))return;
    if(!p.masteredAyat.includes(n)){p.masteredAyat.push(n);p.stars++;save();}
    renderAyat();renderStats();
  }));
}
function setNowPlaying(title,detail){$("#nowPlaying").innerHTML=`<span>🎧</span><div><strong>${title}</strong><p>${detail}</p></div>`;}
function markPlayed(n){const p=progress();if(!p.playedAyat.includes(n)){p.playedAyat.push(n);saveState();}}
function playFile(src){
  player.src=src;
  player.play().then(()=>$("#pauseResumeAudio").textContent="⏸ إيقاف مؤقت")
  .catch(()=>showInfo("تعذر تشغيل الصوت",`تأكد أن ملفات ${activeSurah().fullTitle} داخل المجلد audio/${activeSurah().audioFolder}/`));
}
function playSingleAyah(n){
  fullMode=false;currentAyah=n;
  $$(".ayah").forEach(x=>x.classList.remove("playing"));
  const a=activeSurah().ayat.find(x=>x.n===n);
  $(`.ayah[data-ayah="${n}"]`)?.classList.add("playing");
  setNowPlaying(`الآية ${n}`,a.text);markPlayed(n);playFile(audioPath(a.audio));renderAyat();
  $(`.ayah[data-ayah="${n}"]`)?.classList.add("playing");
}
function playFullCurrent(){
  const arr=activeSurah().ayat,a=arr[fullIndex];
  if(!a){fullMode=false;currentAyah=null;setNowPlaying("تمت التلاوة",`أحسنت! استمعت إلى ${activeSurah().fullTitle} كاملة.`);return;}
  currentAyah=a.n;markPlayed(a.n);renderAyat();
  $$(".ayah").forEach(x=>x.classList.remove("playing"));
  $(`.ayah[data-ayah="${a.n}"]`)?.classList.add("playing");
  setNowPlaying(`السورة كاملة — الآية ${a.n} من ${arr.length}`,a.text);
  playFile(audioPath(a.audio));
}
function playFullSurah(){fullMode=true;fullIndex=0;playFullCurrent();}
player.addEventListener("ended",()=>{
  if($("#repeatAyah").checked && currentAyah && !fullMode){player.currentTime=0;player.play();return;}
  if(fullMode){fullIndex++;playFullCurrent();}
  else setNowPlaying("الآن دورك… ردد الآية","ثم اضغط «أتممت الآية» لتحصل على نجمة.");
});
function stopAudio(){player.pause();player.currentTime=0;fullMode=false;currentAyah=null;$("#pauseResumeAudio").textContent="⏸ إيقاف مؤقت";setNowPlaying("توقف الاستماع","يمكنك اختيار آية أخرى أو تشغيل السورة كاملة.");}
function togglePause(){if(!player.src)return;if(player.paused){player.play();$("#pauseResumeAudio").textContent="⏸ إيقاف مؤقت";}else{player.pause();$("#pauseResumeAudio").textContent="▶️ متابعة";}}
function openJourney(){renderAyat();renderStats();$("#journeyDialog").showModal();}
$("#startJourneyBtn").addEventListener("click",openJourney);$("#continueBtn").addEventListener("click",openJourney);
$("#playFullSurah").addEventListener("click",playFullSurah);$("#pauseResumeAudio").addEventListener("click",togglePause);$("#stopAudio").addEventListener("click",stopAudio);
$("#markStationDone").addEventListener("click",()=>{
  const p=progress(),total=activeSurah().ayat.length;
  if(p.masteredAyat.length<total){showInfo("أكمل الآيات أولًا","استمع إلى كل آية ثم أتممها.");return;}
  if(!p.completedStations.includes("listen")){p.completedStations.push("listen");p.stars+=5;save();}
  showInfo("أحسنت يا بطل!",`أتممت محطة «أستمع وأقرأ» في ${activeSurah().fullTitle}.`);
});
$("#journeyDialog").addEventListener("close",stopAudio);

/* ===== المحطة 2: أردد ===== */
const repeatPlayer=$("#repeatAudioPlayer");
let repeatAyahIndex=0,repeatCountdownTimer=null,repeatReadyToMark=false;
function currentRepeatAyah(){return activeSurah().ayat[repeatAyahIndex];}
function clearRepeatCountdown(){if(repeatCountdownTimer){clearInterval(repeatCountdownTimer);repeatCountdownTimer=null;}$("#countdownBox").hidden=true;}
function renderRepeatAyah(){
  clearRepeatCountdown();repeatPlayer.pause();repeatReadyToMark=false;
  const arr=activeSurah().ayat,a=currentRepeatAyah(),p=progress(),done=p.repeatedAyat.includes(a.n);
  $("#repeatStepBadge").textContent=`الآية ${a.n} من ${arr.length}`;$("#repeatAyahNumber").textContent=a.n;$("#repeatAyahText").textContent=a.text;
  $("#yourTurnBox").hidden=true;$("#repeatInstruction").hidden=false;
  $("#markRepeatedBtn").disabled=true;$("#markRepeatedBtn").textContent=done?"✅ رددت الآية":"⭐ رددت الآية";
  $("#prevRepeatAyah").disabled=repeatAyahIndex===0;$("#nextRepeatAyah").disabled=repeatAyahIndex===arr.length-1;renderStats();
}
function playRepeatAyah(){
  clearRepeatCountdown();$("#yourTurnBox").hidden=true;$("#markRepeatedBtn").disabled=true;
  const a=currentRepeatAyah();repeatPlayer.src=audioPath(a.audio);
  repeatPlayer.play().catch(()=>showInfo("تعذر تشغيل الصوت",`تأكد من ملفات الصوت داخل audio/${activeSurah().audioFolder}/`));
}
function startRepeatCountdown(){
  let count=3;$("#repeatInstruction").hidden=true;$("#countdownBox").hidden=false;$("#countdownNumber").textContent=count;
  repeatCountdownTimer=setInterval(()=>{count--;if(count>0)$("#countdownNumber").textContent=count;else{clearInterval(repeatCountdownTimer);repeatCountdownTimer=null;$("#countdownBox").hidden=true;$("#yourTurnBox").hidden=false;repeatReadyToMark=true;$("#markRepeatedBtn").disabled=false;}},850);
}
repeatPlayer.addEventListener("ended",startRepeatCountdown);
function markCurrentAyahRepeated(){
  const a=currentRepeatAyah(),p=progress();
  if(!repeatReadyToMark && !p.repeatedAyat.includes(a.n))return;
  if(!p.repeatedAyat.includes(a.n)){p.repeatedAyat.push(a.n);p.stars++;save();}
  if(repeatAyahIndex<activeSurah().ayat.length-1){setTimeout(()=>{repeatAyahIndex++;renderRepeatAyah();},700);}else renderStats();
}
function openRepeatStation(){const arr=activeSurah().ayat,p=progress();const first=arr.findIndex(a=>!p.repeatedAyat.includes(a.n));repeatAyahIndex=first>=0?first:0;renderRepeatAyah();$("#repeatDialog").showModal();}
$("#repeatListenBtn").addEventListener("click",playRepeatAyah);$("#repeatAgainBtn").addEventListener("click",playRepeatAyah);$("#markRepeatedBtn").addEventListener("click",markCurrentAyahRepeated);
$("#prevRepeatAyah").addEventListener("click",()=>{if(repeatAyahIndex>0){repeatAyahIndex--;renderRepeatAyah();}});
$("#nextRepeatAyah").addEventListener("click",()=>{if(repeatAyahIndex<activeSurah().ayat.length-1){repeatAyahIndex++;renderRepeatAyah();}});
$("#finishRepeatStation").addEventListener("click",()=>{const p=progress(),total=activeSurah().ayat.length;if(p.repeatedAyat.length<total)return;if(!p.completedStations.includes("repeat")){p.completedStations.push("repeat");p.stars+=5;save();}showInfo("ممتاز!",`أتممت محطة «أردد» في ${activeSurah().fullTitle}.`);});
$("#repeatDialog").addEventListener("close",()=>{repeatPlayer.pause();clearRepeatCountdown();});

/* ===== المحطة 3: أفهم ===== */
let understandIndex=0;
function renderUnderstand(){
  const data=activeSurah().understand,d=data[understandIndex],a=activeSurah().ayat[understandIndex],p=progress(),done=p.understoodAyat.includes(d.n);
  const shuffled=getStableShuffled(`${state.activeSurahId}-understand-${d.n}`,d.choices,d.correct);
  $("#understandAyahNumber").textContent=d.n;$("#understandStep").textContent=`الآية ${d.n} من ${data.length}`;$("#understandAyahText").textContent=a.text;
  $("#meaningIcon").textContent=d.icon;$("#meaningText").textContent=d.meaning;$("#understandQuestion").textContent=d.q;$("#understandFeedback").hidden=true;
  $("#understandChoices").innerHTML=shuffled.map((c,i)=>`<button type="button" class="choice-btn ${done&&c.correct?"correct":""}" data-i="${i}" ${done?"disabled":""}>${c.text}</button>`).join("");
  $$("#understandChoices .choice-btn").forEach(b=>b.addEventListener("click",()=>answerUnderstand(Number(b.dataset.i))));
  $("#prevUnderstand").disabled=understandIndex===0;$("#nextUnderstand").disabled=understandIndex===data.length-1;renderStats();
}
function answerUnderstand(i){
  const d=activeSurah().understand[understandIndex],sh=getStableShuffled(`${state.activeSurahId}-understand-${d.n}`,d.choices,d.correct),p=progress(),fb=$("#understandFeedback");fb.hidden=false;
  if(sh[i].correct){if(!p.understoodAyat.includes(d.n)){p.understoodAyat.push(d.n);p.stars++;save();}renderUnderstand();fb.hidden=false;fb.className="answer-feedback good";fb.textContent="🌟 أحسنت! فهمت معنى الآية.";}
  else{fb.className="answer-feedback try";fb.textContent="💡 حاول مرة أخرى.";$$("#understandChoices .choice-btn")[i]?.classList.add("wrong");}
}
function openUnderstandStation(){const data=activeSurah().understand,p=progress();const first=data.findIndex(x=>!p.understoodAyat.includes(x.n));understandIndex=first>=0?first:0;renderUnderstand();$("#understandDialog").showModal();}
$("#prevUnderstand").addEventListener("click",()=>{if(understandIndex>0){understandIndex--;renderUnderstand();}});
$("#nextUnderstand").addEventListener("click",()=>{if(understandIndex<activeSurah().understand.length-1){understandIndex++;renderUnderstand();}});
$("#finishUnderstand").addEventListener("click",()=>{const p=progress(),total=activeSurah().understand.length;if(p.understoodAyat.length<total)return;if(!p.completedStations.includes("understand")){p.completedStations.push("understand");p.stars+=5;save();}showInfo("رائع!",`أتممت محطة «أفهم» في ${activeSurah().fullTitle}.`);});

/* ===== المحطة 4: أطابق ===== */
let matchIndex=0,matchAnswered=false;
function renderMatch(){
  const data=activeSurah().matching,d=data[matchIndex],p=progress(),done=p.matchedItems.includes(d.id),sh=getStableShuffled(`${state.activeSurahId}-match-${d.id}`,d.options,d.correct);
  matchAnswered=done;$("#matchRound").textContent=`الجولة ${matchIndex+1} من ${data.length}`;$("#matchPromptIcon").textContent=d.icon;$("#matchPrompt").textContent=d.prompt;$("#matchFeedback").hidden=true;
  $("#nextMatch").hidden=!done || matchIndex===data.length-1;
  $("#matchOptions").innerHTML=sh.map((o,i)=>`<button type="button" class="match-option ${done&&o.correct?"correct":""}" data-i="${i}" ${done?"disabled":""}>${o.text}</button>`).join("");
  $$("#matchOptions .match-option").forEach(b=>b.addEventListener("click",()=>answerMatch(Number(b.dataset.i))));renderStats();
}
function answerMatch(i){
  if(matchAnswered)return;const d=activeSurah().matching[matchIndex],sh=getStableShuffled(`${state.activeSurahId}-match-${d.id}`,d.options,d.correct),p=progress(),fb=$("#matchFeedback");fb.hidden=false;
  if(sh[i].correct){matchAnswered=true;if(!p.matchedItems.includes(d.id)){p.matchedItems.push(d.id);p.stars++;save();}$$("#matchOptions .match-option").forEach(b=>b.disabled=true);$$("#matchOptions .match-option")[i].classList.add("correct");fb.className="answer-feedback good";fb.textContent="✅ مطابقة صحيحة!";$("#nextMatch").hidden=matchIndex===activeSurah().matching.length-1;renderStats();}
  else{fb.className="answer-feedback try";fb.textContent="🧩 جرّب بطاقة أخرى.";$$("#matchOptions .match-option")[i]?.classList.add("wrong");}
}
function openMatchStation(){const data=activeSurah().matching,p=progress();const first=data.findIndex(x=>!p.matchedItems.includes(x.id));matchIndex=first>=0?first:0;renderMatch();$("#matchDialog").showModal();}
$("#nextMatch").addEventListener("click",()=>{if(matchIndex<activeSurah().matching.length-1){matchIndex++;renderMatch();}});
$("#finishMatch").addEventListener("click",()=>{const p=progress(),total=activeSurah().matching.length;if(p.matchedItems.length<total)return;if(!p.completedStations.includes("match")){p.completedStations.push("match");p.stars+=5;save();}showInfo("أحسنت!",`أتممت محطة «أطابق» في ${activeSurah().fullTitle}.`);});

/* ===== المحطة 5: أرتب ===== */
let orderSequence=[],orderPoolData=[];
function resetOrderGame(){orderSequence=[];orderPoolData=shuffledArray(activeSurah().ayat.map(a=>({...a})));$("#orderFeedback").hidden=true;$("#checkOrder").disabled=true;renderOrderGame();}
function renderOrderGame(){
  const arr=activeSurah().ayat;
  $("#orderTargets").innerHTML=arr.map((a,i)=>{const chosen=orderSequence[i];return `<div class="order-slot ${chosen?"filled":""}" data-slot="${i}">${chosen?chosen.text:i+1}</div>`;}).join("");
  $("#orderPool").innerHTML=orderPoolData.map(a=>`<button type="button" class="order-card ${orderSequence.some(x=>x.n===a.n)?"selected":""}" data-n="${a.n}">${a.text}</button>`).join("");
  $$("#orderPool .order-card").forEach(b=>b.addEventListener("click",()=>{const n=Number(b.dataset.n);if(orderSequence.some(x=>x.n===n))return;orderSequence.push(activeSurah().ayat.find(x=>x.n===n));$("#checkOrder").disabled=orderSequence.length!==arr.length;renderOrderGame();}));
  $$("#orderTargets .order-slot.filled").forEach(s=>s.addEventListener("click",()=>{orderSequence.splice(Number(s.dataset.slot),1);$("#checkOrder").disabled=true;renderOrderGame();}));
}
function checkOrderGame(){const arr=activeSurah().ayat,p=progress(),ok=orderSequence.length===arr.length&&orderSequence.every((a,i)=>a.n===arr[i].n),fb=$("#orderFeedback");fb.hidden=false;if(ok){fb.className="answer-feedback good";fb.textContent="🌟 ممتاز! الترتيب صحيح.";if(!p.orderCompleted){p.orderCompleted=true;p.stars+=arr.length;save();}}else{fb.className="answer-feedback try";fb.textContent="💡 راجع الترتيب وحاول مرة أخرى.";}}
function openOrderStation(){resetOrderGame();$("#orderDialog").showModal();}
$("#resetOrder").addEventListener("click",resetOrderGame);$("#checkOrder").addEventListener("click",checkOrderGame);
$("#finishOrder").addEventListener("click",()=>{const p=progress();if(!p.orderCompleted)return;if(!p.completedStations.includes("order")){p.completedStations.push("order");p.stars+=5;save();}showInfo("أحسنت!",`أتممت محطة «أرتب» في ${activeSurah().fullTitle}.`);});

/* ===== المحطة 6: أتدرب ===== */
let practiceIndex=0,practiceAnswered=false;
function renderPractice(){
  const data=activeSurah().practice,d=data[practiceIndex],p=progress(),done=p.practiceCompleted.includes(d.id),sh=getStableShuffled(`${state.activeSurahId}-practice-${d.id}`,d.choices,d.correct);
  practiceAnswered=done;$("#practiceType").textContent=d.type;$("#practiceRound").textContent=`التحدي ${practiceIndex+1} من ${data.length}`;$("#practiceIcon").textContent=d.icon;$("#practiceQuestion").textContent=d.q;$("#practiceFeedback").hidden=true;$("#nextPractice").hidden=!done||practiceIndex===data.length-1;
  $("#practiceChoices").innerHTML=sh.map((c,i)=>`<button type="button" class="choice-btn ${done&&c.correct?"correct":""}" data-i="${i}" ${done?"disabled":""}>${c.text}</button>`).join("");
  $$("#practiceChoices .choice-btn").forEach(b=>b.addEventListener("click",()=>answerPractice(Number(b.dataset.i))));renderStats();
}
function answerPractice(i){if(practiceAnswered)return;const d=activeSurah().practice[practiceIndex],sh=getStableShuffled(`${state.activeSurahId}-practice-${d.id}`,d.choices,d.correct),p=progress(),fb=$("#practiceFeedback");fb.hidden=false;if(sh[i].correct){practiceAnswered=true;if(!p.practiceCompleted.includes(d.id)){p.practiceCompleted.push(d.id);p.stars++;save();}$$("#practiceChoices .choice-btn").forEach(b=>b.disabled=true);$$("#practiceChoices .choice-btn")[i]?.classList.add("correct");fb.className="answer-feedback good";fb.textContent="🌟 أحسنت!";$("#nextPractice").hidden=practiceIndex===activeSurah().practice.length-1;renderStats();}else{fb.className="answer-feedback try";fb.textContent="💡 فكر مرة أخرى.";$$("#practiceChoices .choice-btn")[i]?.classList.add("wrong");}}
function openPracticeStation(){const data=activeSurah().practice,p=progress();const first=data.findIndex(x=>!p.practiceCompleted.includes(x.id));practiceIndex=first>=0?first:0;renderPractice();$("#practiceDialog").showModal();}
$("#nextPractice").addEventListener("click",()=>{if(practiceIndex<activeSurah().practice.length-1){practiceIndex++;renderPractice();}});
$("#finishPractice").addEventListener("click",()=>{const p=progress(),total=activeSurah().practice.length;if(p.practiceCompleted.length<total)return;if(!p.completedStations.includes("practice")){p.completedStations.push("practice");p.stars+=5;save();}showInfo("ممتاز!",`أتممت محطة «أتدرب» في ${activeSurah().fullTitle}.`);});

/* ===== المحطة 7: أختبر نفسي ===== */
let quizIndex=0,quizScore=0,quizAnswered=false,quizSessionOrder={};
function quizChoicesFor(d){const k=`${state.activeSurahId}-quiz-${d.id}`;if(!quizSessionOrder[k])quizSessionOrder[k]=shuffledChoices(d.choices,d.correct);return quizSessionOrder[k];}
function resetQuiz(){quizIndex=0;quizScore=0;quizAnswered=false;quizSessionOrder={};$("#quizResult").hidden=true;$("#quizCard").hidden=false;renderQuiz();}
function renderQuiz(){const data=activeSurah().quiz,d=data[quizIndex],sh=quizChoicesFor(d);quizAnswered=false;$("#quizRound").textContent=`السؤال ${quizIndex+1} من ${data.length}`;$("#quizScoreLive").textContent=`النتيجة: ${quizScore}`;$("#quizProgressFill").style.width=`${((quizIndex+1)/data.length)*100}%`;$("#quizIcon").textContent=d.icon;$("#quizType").textContent=d.type;$("#quizQuestion").textContent=d.q;$("#quizFeedback").hidden=true;$("#nextQuiz").hidden=true;$("#quizChoices").innerHTML=sh.map((c,i)=>`<button type="button" class="choice-btn" data-i="${i}">${c.text}</button>`).join("");$$("#quizChoices .choice-btn").forEach(b=>b.addEventListener("click",()=>answerQuiz(Number(b.dataset.i))));renderStats();}
function answerQuiz(i){if(quizAnswered)return;quizAnswered=true;const d=activeSurah().quiz[quizIndex],sh=quizChoicesFor(d),fb=$("#quizFeedback"),btns=$$("#quizChoices .choice-btn");btns.forEach(b=>b.disabled=true);fb.hidden=false;if(sh[i].correct){quizScore++;btns[i].classList.add("correct");fb.className="answer-feedback good";fb.textContent="✅ أحسنت!";}else{btns[i].classList.add("wrong");btns[sh.findIndex(x=>x.correct)]?.classList.add("correct");fb.className="answer-feedback try";fb.textContent="💡 تعلّم من الإجابة الصحيحة.";}$("#quizScoreLive").textContent=`النتيجة: ${quizScore}`;$("#nextQuiz").hidden=false;$("#nextQuiz").textContent=quizIndex===activeSurah().quiz.length-1?"عرض النتيجة 🏆":"السؤال التالي ←";}
function finishQuizQuestions(){const p=progress(),total=activeSurah().quiz.length,passMark=Math.ceil(total*.75),passed=quizScore>=passMark;p.quizBestScore=Math.max(p.quizBestScore,quizScore);if(passed&&!p.quizPassed){p.quizPassed=true;p.stars+=10;}save();$("#quizCard").hidden=true;$("#quizResult").hidden=false;$("#quizFinalScore").textContent=`${quizScore}/${total}`;$("#quizResultMedal").textContent=passed?"🏆":"🌱";$("#quizResultTitle").textContent=passed?"ممتاز يا بطل!":"محاولة جميلة!";$("#quizResultText").textContent=passed?"اجتزت الاختبار بنجاح.":"راجع المحطات ثم حاول مرة أخرى.";renderStats();}
function openQuizStation(){resetQuiz();$("#quizDialog").showModal();}
$("#nextQuiz").addEventListener("click",()=>{if(quizIndex<activeSurah().quiz.length-1){quizIndex++;renderQuiz();}else finishQuizQuestions();});
$("#retryQuiz").addEventListener("click",resetQuiz);
$("#finishQuiz").addEventListener("click",()=>{const p=progress();if(!p.quizPassed)return;if(!p.completedStations.includes("quiz")){p.completedStations.push("quiz");save();}showInfo("نجحت!",`أتممت اختبار ${activeSurah().fullTitle}. افتح الآن شهادتك.`);});

/* ===== المحطة 8: الشهادة ===== */
function formatArabicDate(){try{return new Intl.DateTimeFormat("ar-EG",{year:"numeric",month:"long",day:"numeric"}).format(new Date());}catch(e){return new Date().toLocaleDateString();}}
function refreshCertificate(){const p=progress(),name=($("#studentNameInput").value||state.studentName||"بطل الرحلة").trim();state.studentName=name;saveState();$("#certificateStudentName").textContent=name;$("#certificateStars").textContent=p.stars;$("#certificateQuizScore").textContent=`${p.quizBestScore}/${activeSurah().quiz.length}`;$("#certificateDate").textContent=formatArabicDate();updateDynamicSurahLabels();}
function openCertificate(){const p=progress();if(!p.quizPassed||!p.completedStations.includes("quiz")){showInfo("الشهادة لم تُفتح بعد","أكمل الاختبار أولًا.");return;}$("#studentNameInput").value=state.studentName||"";refreshCertificate();$("#certificateDialog").showModal();}
$("#updateCertificate").addEventListener("click",refreshCertificate);$("#studentNameInput").addEventListener("input",()=>{state.studentName=$("#studentNameInput").value;saveState();});
$("#printCertificate").addEventListener("click",()=>{refreshCertificate();window.print();});
$("#finishCertificate").addEventListener("click",()=>{const p=progress();refreshCertificate();if(!p.completedStations.includes("certificate")){p.completedStations.push("certificate");p.completed=true;p.badge=true;p.stars+=5;save();}showInfo("مبارك! 🌟",`أتممت رحلة ${activeSurah().fullTitle} بالكامل.`);});

/* ===== ملف البطل ===== */
function showHeroChoice(){const has=!!(state.studentName&&state.studentName.trim());$("#heroChoiceView").hidden=false;$("#heroNameView").hidden=true;$("#welcomeError").hidden=true;if(has){$("#savedHeroName").textContent=state.studentName.trim();$("#savedHeroCard").hidden=false;$("#continueSavedHero").hidden=false;}else{$("#savedHeroCard").hidden=true;$("#continueSavedHero").hidden=true;}}
function openHeroWelcome(){showHeroChoice();if(!$("#welcomeDialog").open)$("#welcomeDialog").showModal();}
function openHeroNameEditor(){$("#heroChoiceView").hidden=true;$("#heroNameView").hidden=false;$("#heroNameStart").value=state.studentName||"";setTimeout(()=>$("#heroNameStart").focus(),100);}
function enterWithSavedHero(){if(!state.studentName?.trim()){openHeroNameEditor();return;}$("#welcomeDialog").close();renderStats();}
function saveHeroNameFromWelcome(){const name=$("#heroNameStart").value.trim();if(name.length<2){$("#welcomeError").hidden=false;return;}state.studentName=name;saveState();renderStats();$("#welcomeDialog").close();showInfo(`أهلًا يا ${name} 🌟`,`استعد لرحلتك مع ${activeSurah().fullTitle}.`);}
$("#continueSavedHero").addEventListener("click",enterWithSavedHero);$("#chooseNewHero").addEventListener("click",openHeroNameEditor);$("#backToHeroChoice").addEventListener("click",showHeroChoice);$("#startHeroJourney").addEventListener("click",saveHeroNameFromWelcome);
$("#heroNameStart").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveHeroNameFromWelcome();}});
$("#changeHeroName").addEventListener("click",()=>{$("#certificateDialog").close();openHeroWelcome();setTimeout(openHeroNameEditor,80);});

ensureSurahProgress(state.activeSurahId);
updateDynamicSurahLabels();
renderAll();
saveState();
setTimeout(openHeroWelcome,180);

})();
