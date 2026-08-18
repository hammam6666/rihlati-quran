/* محمّل بيانات السور:
   - على الاستضافة http/https يقرأ JSON مباشرة.
   - عند فتح index.html مباشرة file:// يستخدم generated-bundle.js المحمّل مسبقًا. */
window.SURAH_DATA_READY = (async function(){
  if(location.protocol === "file:"){
    return window.SURAH_LIBRARY || {};
  }

  try{
    const catalog = await fetch("data/index.json", {cache:"no-store"}).then(r=>{
      if(!r.ok) throw new Error("index.json");
      return r.json();
    });

    const entries = await Promise.all(catalog.surahs.map(async meta=>{
      try{
        const payload = await fetch("data/" + meta.file, {cache:"no-store"}).then(r=>{
          if(!r.ok) throw new Error(meta.file);
          return r.json();
        });
        return [meta.id, {...meta, ...payload}];
      }catch(e){
        return [meta.id, {...meta, ayat:[], understand:[], matching:[], practice:[], quiz:[]}];
      }
    }));

    window.SURAH_CATALOG = catalog;
    window.SURAH_LIBRARY = Object.fromEntries(entries);
    return window.SURAH_LIBRARY;
  }catch(e){
    console.warn("تعذر تحميل JSON، تم استخدام الحزمة المحلية.", e);
    return window.SURAH_LIBRARY || {};
  }
})();