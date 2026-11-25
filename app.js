/* ---------- helpers ---------- */
var $=function(i){return document.getElementById(i)};
function ls(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){if(!lsSet.w){lsSet.w=1;setTimeout(function(){alert('Could not save your data. Your phone storage may be full or blocked. Download a backup now.')},0)}return false}}
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v===null||v===undefined?d:v}catch(e){return d}}
function jset(k,v){lsSet(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return n.toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}
function pad(n){return String(n).padStart(2,'0')}
function cents(v){return Math.round((v+Number.EPSILON)*100)/100}
function dict(){return Object.create(null)}
function reserved(n){return n==='__new'||(n in {})}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function dstr(t){var d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function addDays(s,n){var p=s.split('-');return dstr(new Date(+p[0],+p[1]-1,+p[2]+n).getTime())}
function hm(){var d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())}
function monthName(m){var p=m.split('-');return new Date(+p[0],+p[1]-1,1).toLocaleString('en-GB',{month:'long',year:'numeric'})}
function monthEnd(m){var p=m.split('-');return m+'-'+pad(new Date(+p[0],+p[1],0).getDate())}
function dlab(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
function money(n){return (n<0?'-':'')+CUR+fmt(Math.abs(n))}
function ask(msg){return confirm(msg)&&confirm('Please confirm again. Are you sure? This cannot be undone.')}
function rnd(){try{var a=new Uint32Array(4);crypto.getRandomValues(a);return Array.prototype.join.call(a,'-')}catch(e){return Math.random().toString(36).slice(2)+Date.now()}}

/* ---------- profiles (each profile has its own storage keys) ---------- */
var PK='cedi-tracker-profiles-v1',PR=jget(PK,null);
if(!PR||!Array.isArray(PR.list)||!PR.list.length||!PR.list.some(function(p){return p.id===PR.active}))PR={list:[{id:'p1',name:'Personal'}],active:'p1'};
var PID=PR.active;
var AP=PR.list.filter(function(x){return x.id===PID})[0];
function PG(p){return p.own?p.id:'main'}
function sfxFor(id){return id==='p1'?'':'-'+id}
var SFX=sfxFor(PID);
function K(b){return b+SFX}
var KEY=K('cedi-tracker-v1'),CK=K('cedi-tracker-cats-v1'),BK=K('cedi-tracker-budgets-v1'),DK=K('cedi-tracker-debts-v1'),CUK=K('cedi-tracker-cur-v1'),FK=K('cedi-tracker-bflags-v1'),MK=K('cedi-tracker-mig2'),OPK=K('cedi-tracker-open-v1'),EK=K('cedi-tracker-expect-v1'),SK=K('cedi-tracker-setup-v1'),ATK=K('cedi-tracker-thr-v1'),PVK=K('cedi-tracker-preconv-v1'),RCK=K('cedi-tracker-recur-v1'),LBK=K('cedi-tracker-lastbk-v1');
var BASES=['cedi-tracker-v1','cedi-tracker-cats-v1','cedi-tracker-budgets-v1','cedi-tracker-debts-v1','cedi-tracker-cur-v1','cedi-tracker-bflags-v1','cedi-tracker-mig2','cedi-tracker-open-v1','cedi-tracker-expect-v1','cedi-tracker-setup-v1','cedi-tracker-thr-v1','cedi-tracker-preconv-v1','cedi-tracker-recur-v1','cedi-tracker-lastbk-v1'];
var NK='cedi-tracker-name-v1',HK='cedi-tracker-hide-v1',NSK='cedi-tracker-settings-v1',NLK='cedi-tracker-nlast-v1',LKM='cedi-tracker-lock-v1',LOM='cedi-tracker-lockout-v1',LKK=(AP.own?LKM+SFX:LKM),LOK=(AP.own?LOM+SFX:LOM),SWK='cedi-tracker-swflag-v1',TK='cedi-tracker-tour-v1',RK='cedi-tracker-rates-v1';

/* ---------- data ---------- */
var BACK=30;
var type='in',editId=null,viewM=today().slice(0,7);
var items=jget(KEY,[]),XC=jget(CK,{}),budgets=jget(BK,{}),debts=jget(DK,[]),flags=jget(FK,{});
if(!Array.isArray(items))items=[];
if(!XC||typeof XC!=='object'||Array.isArray(XC))XC={};
XC.out=Array.isArray(XC.out)?XC.out:[];XC.in=Array.isArray(XC.in)?XC.in:[];
if(!budgets||typeof budgets!=='object'||Array.isArray(budgets))budgets={};
budgets=Object.assign(dict(),budgets);
if(!Array.isArray(debts))debts=[];
if(!flags||typeof flags!=='object'||Array.isArray(flags))flags={};
var OPEN=jget(OPK,{}),expect=jget(EK,[]),REC=jget(RCK,[]);if(!Array.isArray(REC))REC=[];
if(!OPEN||typeof OPEN!=='object'||Array.isArray(OPEN))OPEN={};
if(!Array.isArray(expect))expect=[];
var AT=jget(ATK,[250,500,750]);
if(!Array.isArray(AT)||AT.length!==3||!(AT[0]>0&&AT[1]>AT[0]&&AT[2]>AT[1]))AT=[250,500,750];
var RATES=jget(RK,null),rateBusy=false,rateTry=0;
if(!RATES||typeof RATES.rates!=='object'||!(RATES.t>0))RATES=null;
function osave(){jset(OPK,OPEN)}
function rsave(){jset(RCK,REC)}
function esave(){jset(EK,expect)}
function save(){jset(KEY,items)}
function dsave(){jset(DK,debts)}
function bsaveB(){jset(BK,budgets)}
var mainName=ls(NK,''),uname=AP.owner||mainName;

/* ---------- currency ---------- */
var CURS=[['GH₵','Ghana cedi (GH₵)'],['$','US dollar ($)'],['€','Euro (€)'],['£','British pound (£)'],['₦','Nigerian naira (₦)'],['KSh','Kenyan shilling (KSh)'],['R','South African rand (R)'],['CFA','West African CFA franc (CFA)'],['C$','Canadian dollar (C$)'],['A$','Australian dollar (A$)'],['¥','Japanese yen (¥)'],['CN¥','Chinese yuan (CN¥)'],['₹','Indian rupee (₹)'],['AED','UAE dirham (AED)'],['CHF','Swiss franc (CHF)'],['E£','Egyptian pound (E£)'],['TSh','Tanzanian shilling (TSh)'],['USh','Ugandan shilling (USh)']];
var CODE={'GH₵':'GHS','$':'USD','€':'EUR','£':'GBP','₦':'NGN','KSh':'KES','R':'ZAR','CFA':'XOF','C$':'CAD','A$':'AUD','¥':'JPY','CN¥':'CNY','₹':'INR','AED':'AED','CHF':'CHF','E£':'EGP','TSh':'TZS','USh':'UGX'};
var CUR=ls(CUK,'GH₵');
function applyCur(){
 $('amt').placeholder='Amount ('+CUR+')';$('damt').placeholder='Amount ('+CUR+')';$('bamt').placeholder='Monthly budget ('+CUR+')';
 var h='',found=false,cov={};
 CURS.forEach(function(c){if(c[0]===CUR)found=true;cov[CODE[c[0]]]=1;h+='<option value="'+esc(c[0])+'"'+(c[0]===CUR?' selected':'')+'>'+esc(c[1])+'</option>'});
 var all='';
 if(RATES){
  var dn=null;try{dn=new Intl.DisplayNames(['en'],{type:'currency'})}catch(e){}
  Object.keys(RATES.rates).sort().forEach(function(k){
   if(cov[k])return;var nm='';try{nm=dn?dn.of(k):''}catch(e){}
   if(k===CUR)found=true;
   all+='<option value="'+k+'"'+(k===CUR?' selected':'')+'>'+k+(nm&&nm!==k?' - '+esc(nm):'')+'</option>';
  });
 }
 if(!found)h+='<option value="'+esc(CUR)+'" selected>Custom ('+esc(CUR)+')</option>';
 $('cursel').innerHTML=h+(all?'<optgroup label="All other currencies">'+all+'</optgroup>':'')+'<option value="__c">Other symbol (no conversion)...</option>';
 updConv();
}
function r2(n){return Math.round((n+Number.EPSILON)*100)/100}
function sig2(n){if(!(n>0))return n;var m=Math.pow(10,Math.floor(Math.log10(n))-1);return Number((Math.round(n/m)*m).toPrecision(12))}
function fmtT(n){return n.toLocaleString('en-GH',{maximumFractionDigits:2})}
function fetchJson(u){
 var c=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(c)c.abort()},9000);
 return fetch(u,{cache:'no-store',signal:c?c.signal:undefined}).then(function(r){clearTimeout(tm);if(!r.ok)throw new Error('http');return r.json()},function(e){clearTimeout(tm);throw e});
}
function codeOf(s){return CODE[s]||(RATES&&RATES.rates[s]>0?s:null)}
function rateFor(f,t){if(!RATES)return 0;var a=RATES.rates[f],b=RATES.rates[t];return a>0&&b>0?b/a:0}
function ratesAge(){return RATES?Date.now()-RATES.t:Infinity}
function updRates(){
 if($('rtStat'))$('rtStat').textContent=RATES?'Rates stored for '+Object.keys(RATES.rates).length+' currencies (from '+RATES.date+', '+RATES.src+'). They update by themselves whenever you are online.':'No exchange rates stored yet. They download by themselves the next time you are online.';
 applyCur();
}
function cleanRates(o){
 var r={},n=0;
 Object.keys(o||{}).forEach(function(k){var v=+o[k];if(/^[A-Z]{3}$/.test(k)&&v>0&&isFinite(v)){r[k]=v;n++}});
 return n>20&&r.GHS>0&&r.USD>0?r:null;
}
function refreshRates(force){
 if(rateBusy)return Promise.resolve(false);
 if(!force&&(ratesAge()<43200000||Date.now()-rateTry<600000))return Promise.resolve(false);
 if(navigator.onLine===false)return Promise.resolve(false);
 rateBusy=true;rateTry=Date.now();
 return fetchJson('https://open.er-api.com/v6/latest/USD').then(function(j){
  var r=j&&j.result==='success'?cleanRates(j.rates):null;if(!r)throw new Error('bad');
  return {rates:r,date:(j.time_last_update_utc||'').slice(0,16)||today(),src:'ExchangeRate-API'};
 }).catch(function(){
  return fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json').then(function(j){
   var o={};Object.keys((j&&j.usd)||{}).forEach(function(k){o[k.toUpperCase()]=j.usd[k]});
   var r=cleanRates(o);if(!r)throw new Error('bad');
   return {rates:r,date:j.date||today(),src:'currency-api (backup source)'};
  });
 }).then(function(r){
  RATES={base:'USD',rates:r.rates,date:r.date,src:r.src,t:Date.now()};jset(RK,RATES);rateBusy=false;updRates();return true;
 },function(){rateBusy=false;updRates();return false});
}
$('rtNow').onclick=function(){
 $('rtMsg').textContent='Updating...';
 refreshRates(true).then(function(k){$('rtMsg').textContent=k?'Rates updated.':'Could not update. Check your internet connection and try again.'});
};
window.addEventListener('online',function(){refreshRates()});
setInterval(function(){refreshRates()},1800000);
var CV=null;
function setSymbolOnly(v){CUR=v;lsSet(CUK,CUR);applyCur();renderAll()}
function updConv(){
 var p=jget(PVK,null);
 if(!$('cvUndo'))return;
 $('cvUndo').hidden=!p;
 $('cvLast').textContent=p?'Last conversion: '+p.cur+' to '+p.to+' on '+p.date+' at 1 '+p.cur+' = '+p.rate+' '+p.to+'.':'';
}
$('cursel').onchange=function(){
 var v=this.value;
 if(v==='__c'){v=(prompt('Type the currency symbol or code (up to 5 characters). Amounts will NOT be converted:','')||'').trim().slice(0,5);if(!v){applyCur();return}setSymbolOnly(v);return}
 if(v===CUR)return;
 startConvert(v);
};
function startConvert(ns){
 CV={to:ns,edited:false};var fc=codeOf(CUR),tc=codeOf(ns),usable=fc&&tc&&fc!==tc;
 $('cvmod').hidden=false;$('cvRate').value='';$('cvMsg').textContent='';$('cvPrev').textContent='';$('cvGo').disabled=true;
 $('cvInfo').textContent='Change this profile from '+CUR+' to '+ns+'. Every entry, debt, budget, saving, investment and expected amount in this profile will be converted.';
 $('cvLbl').textContent='Exchange rate: 1 '+CUR+' = ? '+ns;
 function fill(label){
  var r=rateFor(fc,tc);if(!r)return false;
  $('cvRate').value=String(+r.toPrecision(6));$('cvSrc').textContent=label+' rate from '+RATES.date+' ('+RATES.src+'). You can edit it.';cvPrev();return true;
 }
 if(!usable){$('cvSrc').textContent='Type the exchange rate you want to use.';return}
 var have=fill('Stored');
 if(!have)$('cvSrc').textContent='No stored rates yet. Trying to download them...';
 if(!have||ratesAge()>10800000){
  refreshRates(true).then(function(){
   if(!CV||CV.to!==ns)return;
   if(rateFor(fc,tc)){if(!CV.edited)fill('Updated')}
   else if(!have)$('cvSrc').textContent='Could not get the exchange rate. Check your internet connection and try again, or type the rate you want to use.';
  });
 }
}
function cvRead(){var r=parseFloat($('cvRate').value);return r>0&&isFinite(r)?r:0}
function cvPrev(){var r=cvRead();$('cvGo').disabled=!r;$('cvPrev').textContent=r&&CV?'Example: 100 '+CUR+' becomes '+fmtT(r2(100*r))+' '+CV.to:''}
$('cvRate').oninput=function(){if(CV)CV.edited=true;cvPrev()};
$('cvGo').onclick=function(){
 var r=cvRead();
 if(!r){$('cvMsg').textContent='Enter a valid rate.';return}
 if(r>1000000||r<0.000001){$('cvMsg').textContent='That rate looks wrong. Please check it.';return}
 convertAll(r,CV.to);
};
$('cvSym').onclick=function(){var v=CV&&CV.to;$('cvmod').hidden=true;CV=null;if(v)setSymbolOnly(v)};
$('cvNo').onclick=function(){$('cvmod').hidden=true;CV=null;applyCur()};
function convertAll(r,ns){
 var old=CUR;
 jset(PVK,{cur:old,to:ns,rate:+r.toPrecision(6),date:today(),items:items,debts:debts,budgets:budgets,open:OPEN,expect:expect,thr:AT,rec:REC});
 var mn=function(v){return Math.max(0.01,r2(v*r))};
 items.forEach(function(x){x.a=mn(x.a)});
 debts.forEach(function(d){
  d.a=mn(d.a);
  if(d.pays&&d.pays.length){
   d.pays.forEach(function(q){q.a=mn(q.a)});
   var diff=r2(d.a-paidOf(d)),L=d.pays[d.pays.length-1];
   if(d.p||diff<0)L.a=Math.max(0.01,r2(L.a+diff));
  }
 });
 Object.keys(budgets).forEach(function(k){budgets[k]=mn(budgets[k])});
 Object.keys(OPEN).forEach(function(k){OPEN[k]=mn(OPEN[k])});
 expect.forEach(function(e){e.a=mn(e.a)});
 REC.forEach(function(e){e.a=mn(e.a)});rsave();
 AT=[sig2(AT[0]*r),sig2(AT[1]*r),sig2(AT[2]*r)];
 if(!(AT[1]>AT[0]))AT[1]=sig2(AT[0]*2);
 if(!(AT[2]>AT[1]))AT[2]=sig2(AT[1]*1.5);
 ['Savings','Investment'].forEach(function(c){
  var tot=fundTotal(c);
  if(tot<0&&tot>-0.05){var w=items.filter(function(x){return x.c===c&&x.t==='in'}).sort(function(a,b){return b.a-a.a})[0];if(w)w.a=Math.max(0.01,r2(w.a+tot))}
 });
 CUR=ns;lsSet(CUK,CUR);
 save();dsave();bsaveB();osave();esave();jset(ATK,AT);
 $('cvmod').hidden=true;CV=null;applyCur();renderAll();
 toast('Currency changed','All amounts were converted from '+old+' to '+ns+' at 1 '+old+' = '+(+r.toPrecision(6))+' '+ns+'. You can undo this in Settings.');
}
$('cvUndo').onclick=function(){
 var p=jget(PVK,null);if(!p)return;
 if(!ask('Undo the last currency conversion ('+p.cur+' to '+p.to+')? Everything you added or changed in this profile since then will be lost.'))return;
 items=p.items;debts=p.debts;budgets=Object.assign(dict(),p.budgets);OPEN=p.open;expect=p.expect;AT=p.thr;CUR=p.cur;REC=p.rec||[];rsave();
 save();dsave();bsaveB();osave();esave();jset(ATK,AT);lsSet(CUK,CUR);
 try{localStorage.removeItem(PVK)}catch(e){}
 applyCur();renderAll();toast('Conversion undone','Your amounts are back in '+CUR+'.');
};

/* ---------- categories ---------- */
var DEF={in:['Salary','Savings','Investment','Gifts','Loan','Debt repayment'],out:['Food and water','Utility bills','Savings','Investment','Debt']};
var ST={out:['Fuel','Data & airtime','School','Church','Transport','Other'],in:['Bolt','Other']};
function migrate(starters){
 var RNo=dict(),RNi=dict();RNo.Food='Food and water';RNo.Bills='Utility bills';RNi.Gift='Gifts';
 items.forEach(function(x){if(x.t==='out'&&RNo[x.c])x.c=RNo[x.c];else if(x.t==='in'&&RNi[x.c])x.c=RNi[x.c]});
 Object.keys(RNo).forEach(function(k){if(budgets[k]!==undefined){if(budgets[RNo[k]]===undefined)budgets[RNo[k]]=budgets[k];delete budgets[k]}});
 var first=!ls(MK,'');
 ['out','in'].forEach(function(t){
  var seen=dict(),res=[];
  function add(c){var k=String(c).toLowerCase();if(DEF[t].some(function(d){return d.toLowerCase()===k})||seen[k])return;seen[k]=1;res.push(c)}
  XC[t].forEach(add);
  if(starters&&first)(PID==='p1'?ST[t]:['Other']).forEach(add);
  XC[t]=res;
 });
 lsSet(MK,'1');save();jset(CK,XC);bsaveB();
}
migrate(true);
function allCats(t){return DEF[t].concat(XC[t])}
function isDef(t,c){return DEF[t].indexOf(c)>=0}
function fillCats(sel){
 var l=allCats(type);if(sel&&l.indexOf(sel)<0)l.push(sel);
 $('cat').innerHTML=l.map(function(c){return '<option'+(c===sel?' selected':'')+'>'+esc(c)+'</option>'}).join('')+'<option value="__new">+ New category</option>';
 $('ncwrap').hidden=true;onCat();
}
function onCat(){
 var c=$('cat').value;
 $('cdel').hidden=!(c&&c!=='__new'&&XC[type].indexOf(c)>=0);
 $('loanbox').hidden=!(type==='in'&&c==='Loan');
 var d=(type==='out'&&c==='Debt')||(type==='in'&&c==='Debt repayment');$('debtbox').hidden=!d;if(d)fillDsel();
}
function findDebt(id){return debts.filter(function(d){return String(d.id)===String(id)})[0]}
function fillDsel(){
 var kind=type==='out'?'owe':'owed';
 var l=debts.filter(function(d){return d.k===kind&&!d.p&&d.a-paidAmt(d)>0.005}),old=$('dsel').value;
 $('dlbl').textContent=type==='out'?'Whose debt are you clearing? (required)':'Who is paying you back? (required)';
 $('dsel').innerHTML=l.length?l.map(function(d){return '<option value="'+d.id+'"'+(String(d.id)===old?' selected':'')+'>'+esc(d.w)+(d.n?' · '+esc(d.n):'')+' · '+CUR+fmt(d.a-paidAmt(d))+' left</option>'}).join(''):'<option value="">No debts to clear</option>';
 $('dinfo').textContent=l.length?(type==='out'?'This money out will be recorded as a payment on the chosen debt.':'This money in will be recorded as a repayment on the chosen debt.'):(type==='out'?'You have no open debts. Record a loan received, or add a debt on the Debts page.':'Nobody owes you right now. Add it on the Debts page or in Expecting.');
}
function setType(t){type=t;document.querySelectorAll('.seg button').forEach(function(x){x.classList.toggle('on',x.dataset.t===t)})}
document.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){setType(b.dataset.t);fillCats()}});
$('cat').onchange=function(){if(this.value==='__new'){$('ncwrap').hidden=false;$('ncat').focus()}else $('ncwrap').hidden=true;onCat()};
$('ncadd').onclick=function(){
 var v=$('ncat').value.trim().slice(0,40);if(!v){$('ncat').focus();return}
 if(reserved(v)){alert('That name is reserved. Please choose another category name.');return}
 var f=allCats(type).filter(function(c){return c.toLowerCase()===v.toLowerCase()})[0];
 if(!f){XC[type].push(v);jset(CK,XC);f=v}
 $('ncat').value='';fillCats(f);fillBCats();
};
$('cdel').onclick=function(){
 var c=$('cat').value;if(!c||isDef(type,c))return;
 var n=items.filter(function(x){return x.t===type&&x.c===c}).length;
 if(!ask('Delete the category "'+c+'"?'+(n?' Its '+n+' existing entr'+(n>1?'ies':'y')+' will keep this name.':'')))return;
 XC[type]=XC[type].filter(function(x){return x!==c});jset(CK,XC);fillCats();fillBCats();
};

/* ---------- notifications ---------- */
var S=Object.assign({style:'both',xr:true,bud:true,morn:true,mt:'07:00',eve:true,et:'21:00',inc:true,exp:true,bal:true},jget(NSK,{}));
function sysOK(){return 'Notification' in window&&Notification.permission==='granted'}
function toast(t,b){
 if(!$('tour').hidden)return;
 var d=document.createElement('div');d.className='toast';
 d.innerHTML='<b>'+esc(t)+'</b><span>'+esc(b)+'</span><button aria-label="Dismiss">×</button>';
 d.querySelector('button').onclick=function(){d.remove()};
 $('toasts').appendChild(d);setTimeout(function(){d.remove()},9000);
}
function notify(t,b,tag){
 if(S.style!=='sys'||!sysOK())toast(t,b);
 if(S.style!=='app'&&sysOK()){
  var o={body:b,icon:'icon-192.png',badge:'icon-192.png',tag:tag||'cedi'};
  if('serviceWorker' in navigator)navigator.serviceWorker.getRegistration().then(function(r){if(r)return r.showNotification(t,o);new Notification(t,o)}).catch(function(){try{new Notification(t,o)}catch(e){}});
  else{try{new Notification(t,o)}catch(e){}}
 }
}
var TH=[25,50,75,100];
function spentIn(m,c){return items.reduce(function(s,x){return s+(x.t==='out'&&x.c===c&&x.d.slice(0,7)===m?x.a:0)},0)}
function checkBudget(c,m,quiet){
 var b=budgets[c];if(!b)return;
 var sp=spentIn(m,c),r=sp/b*100,hit=0;
 TH.forEach(function(t){var k=m+'|'+c+'|'+t;if(r>=t){if(!flags[k]){flags[k]=1;hit=t}}else delete flags[k]});
 jset(FK,flags);
 if(hit&&!quiet&&S.bud)notify('Budget alert: '+c,hit>=100?'You have reached 100% of your '+c+' budget ('+CUR+fmt(sp)+' of '+CUR+fmt(b)+').':'You have used '+hit+'% of your '+c+' budget ('+CUR+fmt(sp)+' of '+CUR+fmt(b)+').','bud-'+c);
}
function dayTot(d){var i=0,o=0;items.forEach(function(x){if(x.d===d&&!x.ob){if(x.t==='in')i+=x.a;else o+=x.a}});return {i:i,o:o}}
function sumMsg(d,label){
 var t=dayTot(d),p=[];
 if(S.inc)p.push('In '+CUR+fmt(t.i));
 if(S.exp)p.push('Out '+CUR+fmt(t.o));
 if(S.bal){var m=today().slice(0,7),b=0;items.forEach(function(x){if(x.d.slice(0,7)===m)b+=x.t==='in'?x.a:-x.a});p.push(hideBal?'Balance hidden':'Balance this month '+money(b))}
 return label+' ('+d+'): '+(p.length?p.join(' · '):'no details selected');
}
function hasData(){return items.length>0||debts.length>0}
function runSummaries(){
 if(locked)return;runReminders();
 var L=jget(NLK,{}),t=today(),n=hm(),ch=false;
 if(S.morn&&n>=S.mt&&L.m!==t){L.m=t;ch=true;if(hasData()&&(!S.eve||n<S.et))notify('Good morning: yesterday',sumMsg(addDays(t,-1),'Yesterday'),'morn')}
 if(S.eve&&n>=S.et&&L.e!==t){L.e=t;ch=true;if(hasData())notify('Your day in review',sumMsg(t,'Today'),'eve')}
 if(ch)jset(NLK,L);
}
var lastDay=today();
function dayTick(){
 var t=today();if(t===lastDay)return;
 if(viewM===lastDay.slice(0,7))viewM=t.slice(0,7);
 lastDay=t;if(!editId)$('date').value=t;$('sdate').value=t;$('smonth').value=t.slice(0,7);renderAll();
}
setInterval(function(){dayTick();runSummaries()},30000);

/* ---------- lock ---------- */
var LK=jget(LKK,null),locked=true,hiddenAt=0;
if(LK&&(typeof LK.h!=='string'||typeof LK.s!=='string'))LK=null;
function hashPin(pin,salt){
 var s=salt+':'+pin;
 if(window.crypto&&crypto.subtle&&window.TextEncoder)return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return x.toString(16).padStart(2,'0')}).join('')});
 var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return Promise.resolve('f'+h);
}
function bioOK(){return !!(window.PublicKeyCredential&&navigator.credentials&&window.crypto&&crypto.getRandomValues)}
function b64(buf){var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)}
function unb64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function chal(){return crypto.getRandomValues(new Uint8Array(32))}
function showLock(){
 locked=true;document.body.classList.add('locked');closeMenu();
 $('lock').hidden=false;$('lkPin').value='';$('lkPin2').value='';$('lkMsg').textContent='';
 if(!LK){$('lkT').textContent='Set a PIN';$('lkS').textContent='Choose a 4 to 6 digit PIN to protect your records. You will enter it each time you open the app.';$('lkPin2').hidden=false;$('lkGo').textContent='Save PIN';$('lkBio').hidden=true;$('lkForgot').hidden=true}
 else{$('lkT').textContent='Enter your PIN';$('lkS').textContent='Your records are locked.';$('lkPin2').hidden=true;$('lkGo').textContent='Unlock';$('lkBio').hidden=!(LK.bio&&bioOK());$('lkForgot').hidden=false}
 var who=$('lkWho');
 if(LK&&PR.list.length>1){var pr=PR.list.filter(function(x){return x.id===PID})[0];who.textContent=(uname?uname+' · ':'')+pr.name+' profile';who.hidden=false}else who.hidden=true;
 $('lkPin').focus();
}
function unlock(){
 locked=false;document.body.classList.remove('locked');$('lock').hidden=true;$('lkPin').value='';$('lkPin2').value='';$('lkMsg').textContent='';
 updBio();runSummaries();afterUnlock();
}
$('lkGo').onclick=function(){
 var p=$('lkPin').value.trim(),m=$('lkMsg');
 if(!LK){
  if(!/^\d{4,6}$/.test(p)){m.textContent='Use 4 to 6 digits.';return}
  if($('lkPin2').value.trim()!==p){m.textContent='The two PINs do not match.';return}
  var salt=rnd();hashPin(p,salt).then(function(h){LK={s:salt,h:h,bio:''};jset(LKK,LK);unlock()});return;
 }
 var lo=jget(LOK,{f:0,u:0});
 if(Date.now()<lo.u){m.textContent='Too many attempts. Try again in '+Math.ceil((lo.u-Date.now())/1000)+' seconds.';return}
 hashPin(p,LK.s).then(function(h){
  if(h===LK.h){jset(LOK,{f:0,u:0});unlock()}
  else{lo.f++;if(lo.f>=5){lo.u=Date.now()+30000;lo.f=0}jset(LOK,lo);m.textContent=lo.u>Date.now()?'Too many wrong attempts. Wait 30 seconds.':'Wrong PIN.';$('lkPin').value='';$('lkPin').focus()}
 });
};
['lkPin','lkPin2'].forEach(function(id){$(id).onkeydown=function(e){if(e.key==='Enter')$('lkGo').click()}});
$('lkBio').onclick=function(){
 navigator.credentials.get({publicKey:{challenge:chal(),allowCredentials:[{type:'public-key',id:unb64(LK.bio)}],userVerification:'required',timeout:60000}}).then(unlock,function(){$('lkMsg').textContent='Fingerprint or face check did not work. Use your PIN.'});
};
function wipeProfile(id){
 BASES.forEach(function(k){try{localStorage.removeItem(k+sfxFor(id))}catch(e){}});
 if(id!=='p1'){try{localStorage.removeItem(LKM+sfxFor(id));localStorage.removeItem(LOM+sfxFor(id))}catch(e){}}
}
$('lkForgot').onclick=function(){
 if(AP.own){
  if(!ask('Forgot the PIN for "'+AP.name+'"? The only way back in is to erase everything in this profile and remove it. Your other profiles are not touched. Erase it?'))return;
  wipeProfile(AP.id);PR.list=PR.list.filter(function(x){return x.id!==AP.id});
  if(!PR.list.length)PR.list=[{id:'p1',name:'Personal'}];
  PR.active=PR.list[0].id;
 }else{
  if(!ask('Forgot your main PIN? The only way back in is to erase the data of every profile that uses the main PIN. Profiles with their own PIN are not touched. You can restore from a backup file afterwards if you have one. Erase?'))return;
  PR.list.filter(function(x){return !x.own}).forEach(function(x){wipeProfile(x.id)});
  PR.list=PR.list.filter(function(x){return x.own||x.id==='p1'});
  if(!PR.list.some(function(x){return x.id==='p1'}))PR.list.unshift({id:'p1',name:'Personal'});
  PR.active='p1';
  try{localStorage.removeItem(LKM);localStorage.removeItem(LOM);localStorage.removeItem(NK)}catch(e){}
 }
 jset(PK,PR);location.reload();
};
$('lockNow').onclick=function(){showLock()};
document.addEventListener('visibilitychange',function(){
 if(document.hidden){hiddenAt=Date.now();return}
 if(LK&&!locked&&hiddenAt&&Date.now()-hiddenAt>60000)showLock();
 dayTick();runSummaries();refreshRates();
});
function updBio(){
 var b=$('biobtn');b.hidden=!bioOK();
 b.textContent=LK&&LK.bio?'Turn off fingerprint / face unlock':'Turn on fingerprint / face unlock';
}
$('biobtn').onclick=function(){
 var m=$('secmsg');
 if(LK.bio){LK.bio='';jset(LKK,LK);updBio();m.textContent='Fingerprint / face unlock is off.';return}
 navigator.credentials.create({publicKey:{challenge:chal(),rp:{name:'Cedi Tracker'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'cedi-tracker-user',displayName:'Cedi Tracker'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},timeout:60000}})
 .then(function(c){LK.bio=b64(c.rawId);jset(LKK,LK);updBio();m.textContent='Fingerprint / face unlock is on. Your PIN still works.'},function(){m.textContent='Could not turn it on. Make sure a screen lock or fingerprint is set up on your phone.'});
};
$('chpin').onclick=function(){$('cpbox').hidden=!$('cpbox').hidden};
$('cpgo').onclick=function(){
 var o=$('cpo').value.trim(),n=$('cpn').value.trim(),n2=$('cpn2').value.trim(),m=$('secmsg');
 if(!/^\d{4,6}$/.test(n)){m.textContent='The new PIN must be 4 to 6 digits.';return}
 if(n!==n2){m.textContent='The new PINs do not match.';return}
 hashPin(o,LK.s).then(function(h){
  if(h!==LK.h){m.textContent='Your current PIN is wrong.';return}
  var s=rnd();return hashPin(n,s).then(function(h2){LK.s=s;LK.h=h2;jset(LKK,LK);m.textContent='PIN changed.';['cpo','cpn','cpn2'].forEach(function(i){$(i).value=''});$('cpbox').hidden=true});
 });
};

/* ---------- balance hide ---------- */
var hideBal=ls(HK,'0')==='1';
function applyHide(){document.body.classList.toggle('hid',hideBal);$('eye').textContent=hideBal?'Show':'Hide';$('eye').setAttribute('aria-pressed',hideBal?'true':'false');$('eye').setAttribute('aria-label',hideBal?'Show balance':'Hide balance')}
function togHide(){hideBal=!hideBal;lsSet(HK,hideBal?'1':'0');applyHide()}
$('eye').onclick=togHide;$('bal').onclick=togHide;

/* ---------- menu & pages ---------- */
var PAGES={home:'Home',sum:'Summary',sav:'Savings',inv:'Investment',debts:'Debts',exp:'Expecting',rec:'Recurring',set:'Settings',about:'About'};
function openMenu(){$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('scrim').hidden=false;$('menu').setAttribute('aria-expanded','true')}
function closeMenu(){$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');$('scrim').hidden=true;$('menu').setAttribute('aria-expanded','false')}
$('menu').onclick=openMenu;$('scrim').onclick=closeMenu;
function showPage(p){
 Object.keys(PAGES).forEach(function(k){$('pg-'+k).hidden=k!==p});
 $('pgt').textContent=PAGES[p];
 document.querySelectorAll('#drawer nav button').forEach(function(b){b.classList.toggle('on',b.dataset.pg===p)});
 closeMenu();window.scrollTo(0,0);renderAll();
}
document.querySelectorAll('#drawer nav button').forEach(function(b){b.onclick=function(){showPage(b.dataset.pg)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMenu();if(!$('pmod').hidden)$('pmod').hidden=true}});

/* profiles UI */
function setProfileUI(){
 var p=PR.list.filter(function(x){return x.id===PID})[0];
 $('pname').textContent=p.name;$('av').textContent=(p.name.trim()[0]||'P').toUpperCase();
}
function updPinKind(){
 var t='';
 if(AP.own)t="This profile has its own PIN. Changing the PIN here changes this profile's PIN only.";
 else if(PR.list.length>1)t='This profile uses your main PIN. Changing the PIN here changes it for every profile that does not have its own PIN.';
 $('pinKind').textContent=t;$('pinKind').hidden=!t;
}
function rp(){
 $('plist').innerHTML=PR.list.map(function(p){
  return '<div class="row"><span class="nm"><b>'+esc(p.name)+'</b>'+(p.id===PID?'<small>Active'+(p.own?' · Own PIN':'')+'</small>':(p.own?'<small>Own PIN</small>':''))+'</span><span>'+(p.id===PID?'':'<button class="pd" data-sw="'+p.id+'">Switch</button>')+'<button class="pd" data-pr="'+p.id+'">Rename</button>'+(p.id===PID?'':'<button aria-label="Delete profile" data-pdel="'+p.id+'">×</button>')+'</span></div>';
 }).join('');
 $('padd').hidden=PR.list.length>=3;$('pmax').hidden=PR.list.length<3;
 document.querySelectorAll('[data-sw]').forEach(function(b){b.onclick=function(){
  var tp=PR.list.filter(function(x){return x.id===b.dataset.sw})[0];if(!tp)return;
  try{if(PG(tp)===PG(AP))sessionStorage.setItem(SWK,JSON.stringify({g:PG(AP),t:Date.now()}))}catch(e){}
  PR.active=tp.id;jset(PK,PR);location.reload();
 }});
 document.querySelectorAll('[data-pr]').forEach(function(b){b.onclick=function(){
  var p=PR.list.filter(function(x){return x.id===b.dataset.pr})[0],v=(prompt('Profile name:',p.name)||'').trim().slice(0,30);
  if(!v)return;p.name=v;jset(PK,PR);setProfileUI();rp();showGreet();
 }});
 document.querySelectorAll('[data-pdel]').forEach(function(b){b.onclick=function(){
  var p=PR.list.filter(function(x){return x.id===b.dataset.pdel})[0];if(!p)return;
  function go(){
   if(!ask('Delete the profile "'+p.name+'" and ALL its entries, budgets and debts?'))return;
   wipeProfile(p.id);PR.list=PR.list.filter(function(x){return x.id!==p.id});jset(PK,PR);rp();updPinKind();rtr();updBk();
  }
  if(!p.own){go();return}
  var lk=jget(LKM+sfxFor(p.id),null),pin=prompt('This profile has its own PIN. Enter the PIN of "'+p.name+'" to delete it:');
  if(pin===null)return;
  if(!lk){go();return}
  hashPin(pin.trim(),lk.s).then(function(h){if(h!==lk.h){alert('Wrong PIN. The profile was not deleted.');return}go()});
 }});
}
$('profbtn').onclick=function(){closeMenu();rp();$('pmod').hidden=false};
$('pclose').onclick=function(){$('pmod').hidden=true};
function openNP(){
 $('npName').value='';$('npPin1').value='';$('npPin2').value='';$('npOwner').value='';$('npMsg').textContent='';
 document.querySelector('input[name=npPin][value=main]').checked=true;document.querySelector('input[name=npNm][value=keep]').checked=true;
 $('npPinBox').hidden=true;$('npNmBox').hidden=true;
 $('npKeepLbl').textContent='Keep the name "'+(uname||'my name')+'"';
 $('pmod').hidden=true;$('npmod').hidden=false;$('npName').focus();
}
function npClose(){$('npmod').hidden=true;rp();updPinKind();rtr();updBk();$('pmod').hidden=false}
$('pgo').onclick=function(){if(PR.list.length>=3)return;openNP()};
document.querySelectorAll('input[name=npPin]').forEach(function(r){r.onchange=function(){$('npPinBox').hidden=document.querySelector('input[name=npPin]:checked').value!=='own'}});
document.querySelectorAll('input[name=npNm]').forEach(function(r){r.onchange=function(){$('npNmBox').hidden=document.querySelector('input[name=npNm]:checked').value!=='new'}});
$('npCancel').onclick=npClose;
$('npGo').onclick=function(){
 var m=$('npMsg');m.textContent='';
 var nm=$('npName').value.trim().slice(0,30);
 if(!nm){m.textContent='Enter a profile name.';$('npName').focus();return}
 if(PR.list.some(function(p){return p.name.toLowerCase()===nm.toLowerCase()})){m.textContent='That profile name is already used.';return}
 if(PR.list.length>=3)return;
 var ownPin=document.querySelector('input[name=npPin]:checked').value==='own',newNm=document.querySelector('input[name=npNm]:checked').value==='new';
 var owner=newNm?$('npOwner').value.trim().slice(0,60):'';
 if(newNm&&!owner){m.textContent='Enter the name to show in this profile, or choose to keep your name.';$('npOwner').focus();return}
 var p1=$('npPin1').value.trim(),p2=$('npPin2').value.trim();
 if(ownPin){
  if(!/^\d{4,6}$/.test(p1)){m.textContent='The PIN must be 4 to 6 digits.';return}
  if(p1!==p2){m.textContent='The two PINs do not match.';return}
 }
 var id=(ownPin?['p2','p3']:['p1','p2','p3']).filter(function(i){return !PR.list.some(function(p){return p.id===i})})[0];
 if(!id){m.textContent='There is no free space for a profile with its own PIN. Delete a profile first.';return}
 function finish(rec){
  var p={id:id,name:nm};if(owner)p.owner=owner;if(rec){p.own=true;jset(LKM+sfxFor(id),rec)}
  PR.list.push(p);jset(PK,PR);npClose();
 }
 if(!ownPin){finish(null);return}
 var main=jget(LKM,null),salt=rnd();
 (main?hashPin(p1,main.s):Promise.resolve('')).then(function(hm){
  if(main&&hm===main.h){m.textContent='Choose a PIN different from your main PIN.';return}
  return hashPin(p1,salt).then(function(h){finish({s:salt,h:h,bio:''})});
 });
};

/* ---------- home: entry form ---------- */
function paidOf(x){return (x.pays||[]).reduce(function(s,p){return s+p.a},0)}
function paidAmt(x){return (x.p&&!(x.pays&&x.pays.length))?x.a:paidOf(x)}
function fundTotal(c,ex){var t=OPEN[c]||0;items.forEach(function(x){if(x.c!==c||(ex&&x.id===ex))return;t+=x.t==='out'?x.a:-x.a});return t}
function endEdit(){editId=null;$('save').textContent='Add entry';$('ecancel').hidden=true;$('amt').value='';$('note').value='';$('lwho').value='';$('ldue').value='';$('date').value=today();$('emsg').textContent='';dateLimits()}
function err(m){$('emsg').textContent=m}
$('date').value=today();
$('ecancel').onclick=function(){endEdit();fillCats()};
function unlink(x){
 if(x.dl)debts=debts.filter(function(d){return String(d.id)!==String(x.dl)});
 if(x.pl){var d=findDebt(x.pl);if(d&&d.pays){d.pays=d.pays.filter(function(p){return p.eid!==x.id});if(d.a-paidOf(d)>0.005){d.p=false;d.pd=''}}}
 dsave();
}
function dateLimits(){var t=today();$('date').max=t;$('date').min=editId?'':addDays(t,-BACK);$('xd').min=t}
function addEntry(t,a,c,n,d,extra){var e={id:Date.now()+Math.random(),t:t,a:a,c:c,n:n||'',d:d||today(),tm:hm()};if(extra)Object.keys(extra).forEach(function(k){e[k]=extra[k]});items.unshift(e);save();return e}
function fixed(x){return !!(x.dl||x.pl||x.ob||x.tr)}
function entryById(id){return items.filter(function(y){return String(y.id)===String(id)})[0]}
function delEntry(id){
 var x=entryById(id);if(!x)return;
 if(x.t==='out'&&(x.c==='Savings'||x.c==='Investment')&&fundTotal(x.c,x.id)<-0.005){alert('Deleting this would leave '+x.c.toLowerCase()+' below zero, because of withdrawals already recorded. Delete those withdrawals first.');return}
 var msg='Delete this entry ('+x.c+', '+CUR+fmt(x.a)+')?';
 if(x.dl)msg+=' The loan recorded in Debts will be removed too.';
 if(x.pl)msg+=' The payment recorded against the debt will be removed too.';
 if(x.tr)msg+=' The matching entry in the other profile is not removed. Delete it there too if needed.';
 if(!ask(msg))return;
 unlink(x);items=items.filter(function(y){return y!==x});
 if(editId&&editId===x.id){endEdit();fillCats()}
 save();if(x.t==='out')checkBudget(x.c,x.d.slice(0,7),true);renderAll();
}
function startEdit(id){
 var x=entryById(id);if(!x)return;
 if(fixed(x)){alert('This entry is linked to a debt, an opening balance or a transfer. To change it, delete it and add it again.');return}
 showPage('home');editId=x.id;dateLimits();setType(x.t);fillCats(x.c);
 $('amt').value=x.a;$('note').value=x.n||'';$('date').value=x.d;$('save').textContent='Save changes';$('ecancel').hidden=false;$('amt').focus();window.scrollTo({top:0,behavior:'smooth'});
}
$('save').onclick=function(){
 err('');
 var a=cents(parseFloat($('amt').value)),c=$('cat').value;
 if(!(a>=0.01)){$('amt').focus();$('amt').placeholder='Enter an amount of 0.01 or more';return}
 if(c==='__new'||!c){$('ncat').focus();return}
 var t0=today(),dv=$('date').value||t0,old=editId?entryById(editId):null;
 if(dv>t0){err('You cannot record an entry for a future date.');return}
 if(dv<addDays(t0,-BACK)&&!(old&&old.d===dv)){err('You can only record entries up to '+BACK+' days back.');return}
 var isLoan=type==='in'&&c==='Loan',isLink=(type==='out'&&c==='Debt')||(type==='in'&&c==='Debt repayment'),who='',ds=null;
 if(isLoan){who=$('lwho').value.trim();if(!who){err('Enter who gave you the loan.');$('lwho').focus();return}}
 if(isLink){
  ds=findDebt($('dsel').value);
  if(!ds){err(type==='out'?'Choose the debt you are clearing. Add the debt first if it is not listed.':'Choose who is paying you back. Add the debt first if it is not listed.');return}
  var left=ds.a-paidAmt(ds);if(a>left+0.005){err('That is more than the '+CUR+fmt(left)+' still '+(ds.k==='owe'?'owed to ':'owed by ')+ds.w+'.');return}
 }
 if(type==='in'&&(c==='Savings'||c==='Investment')){var tot=fundTotal(c,editId);if(a>tot+0.005){err('You only have '+CUR+fmt(Math.max(tot,0))+' in '+c.toLowerCase()+'.');return}}
 if(old&&old.t==='out'&&(old.c==='Savings'||old.c==='Investment')&&(c!==old.c||type!=='out'||a<old.a)&&fundTotal(old.c,old.id)+(type==='out'&&c===old.c?a:0)<-0.005){err('That would leave '+old.c.toLowerCase()+' below zero because of withdrawals already recorded.');return}
 var e={t:type,a:a,c:c,n:$('note').value.trim(),d:dv},x,oldC=null,oldM=null,back=!editId&&dv!==t0;
 if(editId){
  x=old;if(!x){endEdit();return}
  oldC=x.c;oldM=x.d.slice(0,7);x.t=e.t;x.a=e.a;x.c=e.c;x.n=e.n;x.d=e.d;
 }else{e.id=Date.now()+Math.random();e.tm=hm();items.unshift(e);x=e}
 if(isLoan){var debt={id:Date.now()+Math.random(),k:'owe',w:who,a:a,n:x.n||'Loan',d:$('ldue').value,p:false,eid:x.id};debts.unshift(debt);x.dl=debt.id}
 if(isLink){ds.pays=ds.pays||[];ds.pays.push({a:a,d:x.d,eid:x.id});x.pl=ds.id;if(ds.a-paidOf(ds)<=0.005){ds.p=true;ds.pd=x.d}}
 viewM=x.d.slice(0,7);
 if(editId){endEdit();fillCats()}else{$('amt').value='';$('note').value='';$('lwho').value='';$('ldue').value='';$('date').value=today()}
 save();dsave();renderAll();onCat();
 if(oldC&&(oldC!==x.c||oldM!==viewM))checkBudget(oldC,oldM,true);
 if(x.t==='out')checkBudget(x.c,viewM,false);
 if(back)toast('Saved','Added to '+x.d+'. You can find it in Summary.');
};
$('reset').onclick=function(){if(items.length&&ask('Delete ALL entries for this profile?')){items=[];save();flags={};jset(FK,flags);renderAll()}};

/* budgets */
function fillBCats(){
 var old=$('bcat').value,l=allCats('out');
 Object.keys(budgets).forEach(function(k){if(l.indexOf(k)<0)l.push(k)});
 $('bcat').innerHTML=l.map(function(c){return '<option'+(c===old?' selected':'')+'>'+esc(c)+'</option>'}).join('');
}
$('bsave').onclick=function(){
 var v=cents(parseFloat($('bamt').value));if(!(v>=0.01)){$('bamt').focus();return}
 var c=$('bcat').value;budgets[c]=v;bsaveB();checkBudget(c,today().slice(0,7),true);$('bamt').value='';renderAll();
};
function lvA(v){return v<=AT[0]?1:v<=AT[1]?2:v<=AT[2]?3:4}
function lvP(r){return r<=0.25?1:r<=0.5?2:r<=0.75?3:4}
function lgd(a){return a.map(function(s,i){return '<span class="dot" style="background:var(--c'+(i+1)+')"></span>'+s}).join(' &nbsp; ')}
function rb(by){
 fillBCats();
 var ks=Object.keys(budgets);
 $('lgb').innerHTML=lgd(['25% or less','up to 50%','up to 75%','above 75%']);
 $('blist').innerHTML=ks.length?ks.map(function(k){
  var b=budgets[k],sp=by[k]||0,r=sp/b,lv=lvP(r);
  return '<div class="row"><span><b>'+esc(k)+'</b><small>'+CUR+fmt(sp)+' of '+CUR+fmt(b)+' · '+(sp>b?CUR+fmt(sp-b)+' over':CUR+fmt(b-sp)+' left')+'</small></span><span style="color:var(--c'+lv+')"><b>'+Math.round(r*100)+'%</b><button aria-label="Remove budget" data-bd="'+esc(k)+'">×</button></span><div class="track"><i class="l'+lv+'" style="width:'+Math.min(100,Math.round(r*100))+'%"></i></div></div>';
 }).join(''):'<p class="empty">No budgets yet. Pick a category and set a limit above.</p>';
 document.querySelectorAll('[data-bd]').forEach(function(b){b.onclick=function(){var k=b.dataset.bd;if(!ask('Remove the budget for "'+k+'"?'))return;delete budgets[k];bsaveB();renderAll()}});
}

/* ---------- home: render ---------- */
function wkStart(s){var p=s.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function wkEnd(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+6)}
function wkLabel(d){var f=function(x){return x.toLocaleDateString('en-GB',{day:'numeric',month:'short'})};return f(d)+' to '+f(wkEnd(d))}
function wkGroup(arr){var g={};arr.forEach(function(x){var d=wkStart(x.d),k=dstr(d.getTime());if(!g[k])g[k]={d:d,inc:0,exp:0};if(x.t==='in')g[k].inc+=x.a;else g[k].exp+=x.a});return Object.keys(g).sort().map(function(k){return g[k]})}
function rh(){return '<div class="rw rh"><span></span><span>In ('+esc(CUR)+')</span><span>Out ('+esc(CUR)+')</span></div>'}
function rw(l,i,o){return '<div class="rw"><span>'+l+'</span><span class="in">+'+fmt(i)+'</span><span class="out">-'+fmt(o)+'</span></div>'}
function lname(x){var id=x.dl||x.pl;if(!id)return '';var d=findDebt(id);return d?d.w:''}
function dshort(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function eRow(x,btns){var ln=lname(x);return '<div class="row"><span>'+esc(x.c)+(ln?' · '+esc(ln):'')+(x.n?' · '+esc(x.n):'')+'<small>'+x.d+(x.tm?' · '+esc(x.tm):'')+'</small></span><span class="'+(x.t==='in'?'in':'out')+'"><b>'+(x.t==='in'?'+':'-')+fmt(x.a)+'</b>'+(btns?'<button class="pd" data-e="'+x.id+'">Edit</button><button aria-label="Delete entry" data-id="'+x.id+'">×</button>':'')+'</span></div>'}
function bindEntryBtns(root){
 document.querySelectorAll(root+' [data-id]').forEach(function(b){b.onclick=function(){delEntry(b.dataset.id)}});
 document.querySelectorAll(root+' [data-e]').forEach(function(b){b.onclick=function(){startEdit(b.dataset.e)}});
}
function render(){
 var t=today(),cm=t.slice(0,7),ms={};ms[cm]=1;items.forEach(function(x){ms[x.d.slice(0,7)]=1});
 if(!ms[viewM])viewM=cm;
 $('mon').innerHTML=Object.keys(ms).sort().reverse().map(function(k){return '<option value="'+k+'"'+(k===viewM?' selected':'')+'>'+monthName(k)+'</option>'}).join('');
 $('ttl').textContent='Balance for '+$('mon').options[$('mon').selectedIndex].text;
 var mi=items.filter(function(x){return x.d.slice(0,7)===viewM}),inc=0,exp=0,ob=0,by=dict();
 mi.forEach(function(x){if(x.ob)ob+=x.a;else if(x.t==='in')inc+=x.a;else{exp+=x.a;by[x.c]=(by[x.c]||0)+x.a}});
 $('inc').textContent=fmt(inc);$('exp').textContent=fmt(exp);
 var b=inc+ob-exp;$('bal').textContent=money(b);$('bal').className='bal '+(b<0?'out':'');
 var tb=0,tbe=monthEnd(viewM);
 items.forEach(function(x){if(x.d<=tbe)tb+=x.t==='in'?x.a:-x.a});
 tb=cents(tb);
 $('runbal').innerHTML=(viewM===cm?'Total balance, all months: ':'Total balance up to the end of '+esc(monthName(viewM))+': ')+'<b class="sb'+(tb<0?' out':'')+'">'+money(tb)+'</b>';
 $('lgm').innerHTML=lgd(['up to '+CUR+fmtT(AT[0]),'up to '+CUR+fmtT(AT[1]),'up to '+CUR+fmtT(AT[2]),'above '+CUR+fmtT(AT[2])]);
 var keys=Object.keys(by).sort(function(a,c){return by[c]-by[a]});
 $('bars').innerHTML=keys.length?keys.map(function(k){return '<div class="bar">'+esc(k)+' · '+CUR+fmt(by[k])+'<i class="l'+lvA(by[k])+'" style="width:'+Math.round(by[k]/exp*100)+'%"></i></div>'}).join(''):'<p class="empty">Add a spending entry to see your breakdown.</p>';
 rb(by);
 var pm=(function(){var p=viewM.split('-'),d=new Date(+p[0],+p[1]-2,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)})(),lim=viewM===cm?+t.slice(8):31,pe=0,lb=viewM===cm?'the same days last month':'the month before',cp=$('cmp');
 items.forEach(function(x){if(x.t==='out'&&x.d.slice(0,7)===pm&&+x.d.slice(8)<=lim)pe+=x.a});
 if(!pe&&!exp)cp.textContent='';
 else if(!pe)cp.textContent='No money out was recorded last month to compare with.';
 else if(Math.abs(exp-pe)<0.005)cp.textContent='Money out is the same as '+lb+'.';
 else cp.textContent='Money out is '+CUR+fmt(Math.abs(exp-pe))+' ('+Math.round(Math.abs(exp-pe)/pe*100)+'%) '+(exp<pe?'lower':'higher')+' than '+lb+'.';
 var tt=dayTot(t);
 $('days').innerHTML=rh()+rw(dlab(t),tt.i,tt.o)+'<p class="empty" style="margin-top:6px">Today only. Earlier days are in Summary.</p>';
 var cs=wkStart(cm+'-01'),me=monthEnd(cm),wh='';
 while(dstr(cs.getTime())<=me){
  var a0=dstr(cs.getTime()),a1=dstr(wkEnd(cs).getTime()),c0=a0<cm+'-01'?cm+'-01':a0,c1=a1>me?me:a1,wi=0,wo=0;
  items.forEach(function(x){if(x.d>=c0&&x.d<=c1&&!x.ob){if(x.t==='in')wi+=x.a;else wo+=x.a}});
  wh=rw(dshort(c0)+(c0!==c1?' to '+dshort(c1):''),wi,wo)+wh;cs=new Date(cs.getFullYear(),cs.getMonth(),cs.getDate()+7);
 }
 $('weeks').innerHTML=rh()+wh+'<p class="empty" style="margin-top:6px">Weeks run Monday to Sunday, cut to the days inside the current month.</p>';
 var ci=0,co=0,cob=0;items.forEach(function(x){if(x.d.slice(0,7)===cm){if(x.ob)cob+=x.a;else if(x.t==='in')ci+=x.a;else co+=x.a}});
 $('mtot').innerHTML=rh()+rw(monthName(cm),ci,co)+'<p class="empty" style="margin-top:6px">Balance: <b class="sb '+(ci+cob-co<0?'out':'')+'">'+money(ci+cob-co)+'</b></p>';
 var te=items.filter(function(x){return x.d===t});
 $('list').innerHTML=te.length?te.map(function(x){return eRow(x,true)}).join(''):'<p class="empty">No entries today.</p>';
 bindEntryBtns('#list');dateLimits();
}
$('mon').onchange=function(){viewM=this.value;render()};

/* ---------- summary page ---------- */
var sk='d';
function sumRange(){
 if(sk==='d'){var d=$('sdate').value||today();return [d,d,'Day: '+dlab(d)+' '+d.slice(0,4)]}
 if(sk==='w'){var s=wkStart($('sdate').value||today());return [dstr(s.getTime()),dstr(wkEnd(s).getTime()),'Week: '+wkLabel(s)]}
 var m=$('smonth').value||today().slice(0,7);return [m+'-01',monthEnd(m),'Month: '+monthName(m)];
}
function sumData(from,to){
 var mi=items.filter(function(x){return x.d>=from&&x.d<=to}).sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0}),inc=0,exp=0,ob=0,by=dict();
 mi.forEach(function(x){if(x.ob)ob+=x.a;else if(x.t==='in')inc+=x.a;else{exp+=x.a;by[x.c]=(by[x.c]||0)+x.a}});
 return {mi:mi,inc:inc,exp:exp,ob:ob,by:by};
}
function rsum(){
 var r=sumRange(),d=sumData(r[0],r[1]);
 $('srange').textContent=r[2];
 $('sin').textContent=fmt(d.inc);$('sout').textContent=fmt(d.exp);$('sbal').textContent=money(d.inc+d.ob-d.exp);
 var keys=Object.keys(d.by).sort(function(a,b){return d.by[b]-d.by[a]});
 $('sbars').innerHTML=keys.length?keys.map(function(k){return '<div class="bar">'+esc(k)+' · '+CUR+fmt(d.by[k])+'<i class="l'+lvA(d.by[k])+'" style="width:'+Math.round(d.by[k]/d.exp*100)+'%"></i></div>'}).join(''):'<p class="empty">No spending in this period.</p>';
 $('slist').innerHTML=d.mi.length?d.mi.map(function(x){return eRow(x,true)}).join(''):'<p class="empty">No entries in this period.</p>';
 bindEntryBtns('#slist');
}
function sumText(){
 var r=sumRange(),d=sumData(r[0],r[1]),L=['SUMMARY - '+r[2],'Exported: '+today(),'','Money in: '+CUR+fmt(d.inc),'Money out: '+CUR+fmt(d.exp)].concat(d.ob?['Opening balance: '+CUR+fmt(d.ob)]:[],['Balance: '+money(d.inc+d.ob-d.exp),'']);
 var keys=Object.keys(d.by).sort(function(a,b){return d.by[b]-d.by[a]});
 if(keys.length){L.push('Spending by category:');keys.forEach(function(k){L.push('- '+k+': '+CUR+fmt(d.by[k]))});L.push('')}
 if(d.mi.length){L.push('Entries:');d.mi.forEach(function(x){L.push(x.d+(x.tm?' '+x.tm:'')+' | '+(x.t==='in'?'Received':'Spent')+' | '+x.c+(x.n?' | '+x.n:'')+' | '+CUR+fmt(x.a))})}
 return L.join('\n');
}
document.querySelectorAll('#sk button').forEach(function(b){b.onclick=function(){
 sk=b.dataset.k;document.querySelectorAll('#sk button').forEach(function(x){x.classList.toggle('on',x===b)});
 $('sdate').hidden=sk==='m';$('smonth').hidden=sk!=='m';
 $('sdh').textContent=sk==='d'?'Pick the day.':sk==='w'?'Pick any date in the week you want.':'Pick the month.';
 rsum();
}});
$('sdate').value=today();$('smonth').value=today().slice(0,7);
$('sdate').onchange=rsum;$('smonth').onchange=rsum;
function copyText(t,el){
 function ok(){el.textContent='Copied.'}
 function fb(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){el.textContent='Could not copy. Try Share instead.'}a.remove()}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();
}
$('sucp').onclick=function(){copyText(sumText(),$('sumsg'))};
$('sush').onclick=function(){if(navigator.share)navigator.share({title:'Summary',text:sumText()}).catch(function(){});else $('sumsg').textContent='Sharing is not available here. Use Copy instead.'};
$('suxl').onclick=function(){var r=sumRange();expo(r[2],r[0],r[1],'summary-'+r[0]+(r[0]!==r[1]?'-to-'+r[1]:''),'sumsg')};
function fillYears(){
 var ys={},cy=today().slice(0,4);ys[cy]=1;
 items.forEach(function(x){ys[x.d.slice(0,4)]=1});
 debts.forEach(function(x){ys[dstr(x.id).slice(0,4)]=1;(x.pays||[]).forEach(function(p){if(p.d)ys[p.d.slice(0,4)]=1})});
 var sel=$('pyr'),old=sel.value||cy;
 sel.innerHTML=Object.keys(ys).sort().reverse().map(function(y){return '<option'+(y===old?' selected':'')+'>'+y+'</option>'}).join('');
}
$('pxl').onclick=function(){
 var y=$('pyr').value,p=$('pper').value;
 var r={q1:['01-01','03-31','Quarter 1'],q2:['04-01','06-30','Quarter 2'],q3:['07-01','09-30','Quarter 3'],q4:['10-01','12-31','Quarter 4'],h1:['01-01','06-30','First half'],h2:['07-01','12-31','Second half'],y:['01-01','12-31','Full year']}[p];
 expo(r[2]+' '+y,y+'-'+r[0],y+'-'+r[1],'statement-'+y+'-'+p,'pmsg');
};

/* ---------- savings & investment ---------- */
function fundPage(id,cat,title,noun){
 $('pg-'+id).innerHTML='<div class="card"><h2>'+title+'</h2><div class="bal" id="'+id+'T" style="cursor:default">0.00</div><div class="sub"><div><small>Added in total</small><b class="in" id="'+id+'I">0.00</b></div><div><small>Taken out in total</small><b class="out" id="'+id+'O">0.00</b></div></div><div class="pf"><button class="pd" id="'+id+'A">Add to '+noun+'</button><button class="pd" id="'+id+'W">Withdraw</button><button class="pd" id="'+id+'P">Opening amount</button></div><p class="empty" style="margin-top:8px">Linked to the '+cat+' category. Money out to '+cat+' adds to this, and money in from '+cat+' is taken off it. "Opening amount" is what you already had before using this app.</p></div><div class="card"><h2>History</h2><div id="'+id+'L"></div></div>';
 $(id+'A').onclick=function(){goAdd('out',cat)};
 $(id+'W').onclick=function(){goAdd('in',cat)};
 $(id+'P').onclick=function(){
  var v=prompt('How much '+noun+' did you already have before using Cedi Tracker? Enter 0 to clear it.',OPEN[cat]||'');
  if(v===null)return;v=cents(parseFloat(v));if(!(v>=0))return;
  var rest=fundTotal(cat)-(OPEN[cat]||0);
  if(rest+v<-0.005){alert('That would leave '+noun+' below zero because of withdrawals already recorded.');return}
  if(v>0)OPEN[cat]=v;else delete OPEN[cat];osave();renderAll();
 };
}
function goAdd(t,cat){showPage('home');if(editId)endEdit();setType(t);fillCats(cat);$('date').value=today();$('amt').focus()}
function rf(id,cat){
 var op=OPEN[cat]||0,ins=op,outs=0,rows=[];
 items.forEach(function(x){if(x.c!==cat)return;if(x.t==='out')ins+=x.a;else outs+=x.a;rows.push(x)});
 rows.sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});
 $(id+'T').textContent=money(ins-outs);$(id+'I').textContent=fmt(ins);$(id+'O').textContent=fmt(outs);
 var h=rows.map(function(x){var a=x.t==='out';return '<div class="row"><span>'+(a?'Added':'Withdrawn')+(x.n?' · '+esc(x.n):'')+'<small>'+x.d+(x.tm?' · '+esc(x.tm):'')+'</small></span><span class="'+(a?'in':'out')+'"><b>'+(a?'+':'-')+fmt(x.a)+'</b></span></div>'}).join('');
 if(op)h+='<div class="row"><span>Opening amount<small>Before using the app</small></span><span class="in"><b>+'+fmt(op)+'</b></span></div>';
 $(id+'L').innerHTML=h||'<p class="empty">Nothing recorded yet.</p>';
}
fundPage('sav','Savings','Savings','savings');
fundPage('inv','Investment','Investment','investment');

/* ---------- debts ---------- */
var dtype='owe',editDebt=null,sel={},cur=null;
document.querySelectorAll('#dseg button').forEach(function(b){b.onclick=function(){setDtype(b.dataset.d)}});
function setDtype(k){dtype=k;document.querySelectorAll('#dseg button').forEach(function(x){x.classList.toggle('on',x.dataset.d===k)})}
function endDebtEdit(){editDebt=null;$('dsave').textContent='Add debt';$('dcancel').hidden=true;$('dwho').value='';$('damt').value='';$('dnote').value='';$('ddue').value=''}
$('dcancel').onclick=endDebtEdit;
$('dsave').onclick=function(){
 var a=cents(parseFloat($('damt').value)),w=$('dwho').value.trim();
 if(!w){$('dwho').focus();$('dwho').placeholder='Enter a name';return}
 if(!(a>=0.01)){$('damt').focus();$('damt').placeholder='Enter an amount of 0.01 or more';return}
 if(editDebt){
  var ok=true;
  debts.forEach(function(x){if(x.id===editDebt){
   var pd=paidAmt(x);
   if(a<pd-0.005){ok=false;$('damt').value='';$('damt').placeholder='Cannot be less than paid so far ('+fmt(pd)+')';return}
   x.k=dtype;x.w=w;x.a=a;x.n=$('dnote').value.trim();x.d=$('ddue').value;
   if(pd>0&&a-pd<=0.005){x.p=true;x.pd=x.pd||today()}else if(a-pd>0.005){x.p=false;x.pd=''}
  }});
  if(!ok){$('damt').focus();return}
  endDebtEdit();
 }else debts.unshift({id:Date.now()+Math.random(),k:dtype,w:w,a:a,n:$('dnote').value.trim(),d:$('ddue').value,p:false});
 $('dwho').value='';$('damt').value='';$('dnote').value='';$('ddue').value='';dsave();rd();
};
function plist(x){
 return (x.pays&&x.pays.length)?'<div class="pl">'+x.pays.map(function(p,i){
  return '<div><span>'+(p.d||'')+' · '+(x.k==='owe'?'Paid':'Received')+' '+CUR+fmt(p.a)+'</span>'+(p.eid?'<span></span>':'<span><button class="pd" data-ep="'+x.id+'|'+i+'">Edit</button><button data-dp="'+x.id+'|'+i+'" aria-label="Remove payment">×</button></span>')+'</div>';
 }).join('')+'</div>':'';
}
function rd(){
 var list=debts.slice().sort(function(a,b){if(a.p!==b.p)return a.p?1:-1;if(a.d&&b.d)return a.d<b.d?-1:a.d>b.d?1:0;if(a.d)return -1;if(b.d)return 1;return 0});
 var o=0,m=0,ids={};
 debts.forEach(function(x){ids[x.id]=1;if(!x.p){var r=x.a-paidAmt(x);if(x.k==='owe')o+=r;else m+=r}});
 Object.keys(sel).forEach(function(k){if(!debts.some(function(x){return String(x.id)===k}))delete sel[k]});
 $('oweT').textContent=CUR+fmt(o);$('owedT').textContent=CUR+fmt(m);
 $('dlist').innerHTML=list.length?list.map(function(x){
  var rem=x.a-paidOf(x);
  return '<div class="row'+(x.p?' done':'')+'">'
   +'<span class="nm"><input type="checkbox" data-sel="'+x.id+'"'+(sel[x.id]?' checked':'')+' aria-label="Select for export">'+esc(x.w)+(x.n?' · '+esc(x.n):'')
   +'<small'+((!x.p&&x.d&&x.d<today())?' class="out"':'')+'>'
   +(x.p?(x.k==='owe'?'Paid off':'Paid back to me'):(x.k==='owe'?'I owe':'Owes me'))
   +(x.d&&!x.p?' · Due '+x.d+(x.d<today()?' (overdue)':''):'')
   +(paidOf(x)>0?' · Paid '+fmt(paidOf(x))+' of '+fmt(x.a):'')
   +(x.ask&&!x.p&&x.ask.n<7?' · Checking each morning':'')
   +'</small></span>'
   +'<span class="'+(x.k==='owe'?'out':'in')+'"><b>'+fmt(x.p?x.a:rem)+'</b>'
   +(x.p?'<button class="pd" data-p="'+x.id+'">Undo</button>':'<button class="pd" data-p="'+x.id+'">Pay in full</button><button class="pd" data-de="'+x.id+'">Edit</button>')
   +'<button aria-label="Delete debt" data-x="'+x.id+'">×</button></span>'
   +(x.p?'':'<div class="pf"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="'+(x.k==='owe'?'Amount you paid':'Amount received')+'" aria-label="Payment amount" id="pi'+x.id+'"><button class="pd" data-pay="'+x.id+'">Record payment</button></div>')
   +plist(x)+'</div>';
 }).join(''):'<p class="empty">No debts yet. Add money you owe or are owed above.</p>';
 document.querySelectorAll('[data-sel]').forEach(function(b){b.onchange=function(){sel[b.dataset.sel]=b.checked;rs()}});
 document.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){
  var x=findDebt(b.dataset.p);if(!x)return;
  x.pays=x.pays||[];
  if(!x.p){var r=x.a-paidOf(x);if(r>0)x.pays.push({a:r,d:today()});x.p=true;x.pd=today()}
  else{var lp=x.pays[x.pays.length-1];if(lp&&lp.eid){alert('The last payment was recorded from a money out entry. Delete that entry on Home to undo it.');return}x.pays.pop();x.p=false;x.pd=''}
  dsave();rd();
 }});
 document.querySelectorAll('[data-pay]').forEach(function(b){b.onclick=function(){
  var inp=$('pi'+b.dataset.pay),v=cents(parseFloat(inp.value));
  if(!(v>=0.01)){inp.focus();return}
  var x=findDebt(b.dataset.pay);if(!x)return;
  var left=x.a-paidOf(x);if(v>left)v=left;
  x.pays=x.pays||[];x.pays.push({a:v,d:today()});
  if(x.a-paidOf(x)<=0.005){x.p=true;x.pd=today()}
  dsave();rd();
 }});
 document.querySelectorAll('[data-ep]').forEach(function(b){b.onclick=function(){
  var q=b.dataset.ep.split('|'),x=findDebt(q[0]);if(!x)return;
  var pay=x.pays&&x.pays[+q[1]];if(!pay)return;
  var max=x.a-(paidOf(x)-pay.a),nv=cents(parseFloat(prompt('Edit payment amount (max '+CUR+fmt(max)+'):',pay.a)));
  if(!(nv>=0.01))return;if(nv>max)nv=max;pay.a=nv;
  if(x.a-paidOf(x)<=0.005){x.p=true;x.pd=x.pd||today()}else{x.p=false;x.pd=''}
  dsave();rd();
 }});
 document.querySelectorAll('[data-dp]').forEach(function(b){b.onclick=function(){
  var q=b.dataset.dp.split('|'),x=findDebt(q[0]);if(!x)return;
  if(!ask('Remove this payment record?'))return;
  x.pays.splice(+q[1],1);if(x.p&&x.a-paidOf(x)>0.005){x.p=false;x.pd=''}
  dsave();rd();
 }});
 document.querySelectorAll('[data-de]').forEach(function(b){b.onclick=function(){
  var x=findDebt(b.dataset.de);if(!x)return;
  editDebt=x.id;setDtype(x.k);$('dwho').value=x.w;$('damt').value=x.a;$('dnote').value=x.n||'';$('ddue').value=x.d||'';
  $('dsave').textContent='Save changes';$('dcancel').hidden=false;$('dwho').focus();$('dwho').scrollIntoView({behavior:'smooth',block:'center'});
 }});
 document.querySelectorAll('[data-x]').forEach(function(b){b.onclick=function(){
  var x=findDebt(b.dataset.x);if(!x)return;
  if(!ask('Delete the debt record for '+x.w+' ('+CUR+fmt(x.a)+')?'))return;
  debts=debts.filter(function(y){return y!==x});dsave();rd();
 }});
 rs();
}

/* statements */
function groupBy(kind,filter){
 var g={},o=[];
 debts.forEach(function(x){
  if(kind&&x.k!==kind)return;if(filter&&!filter(x))return;
  var k=x.k+'|'+x.w.trim().toLowerCase();
  if(!g[k]){g[k]={kind:x.k,name:x.w.trim(),items:[]};o.push(k)}
  g[k].items.push(x);
 });
 return o.map(function(k){return g[k]});
}
function balOf(it){return it.reduce(function(s,x){return s+x.a-paidAmt(x)},0)}
function oneStmt(g){
 var L=[],tot=0,paid=0,pays=[];
 L.push(g.kind==='owe'?'ACCOUNT STATEMENT: What I owe you':'ACCOUNT STATEMENT: What you owe me');
 L.push('Name: '+g.name,'Date: '+today(),'','Amounts:');
 g.items.forEach(function(x,i){
  tot+=x.a;paid+=paidAmt(x);
  L.push((i+1)+'. '+CUR+fmt(x.a)+' - '+(x.n||'No description')+' (added '+dstr(x.id)+(x.d?', due '+x.d:'')+')');
  if(x.pays&&x.pays.length)x.pays.forEach(function(p){pays.push({d:p.d,a:p.a,n:x.n})});
  else if(x.p)pays.push({d:x.pd||'',a:x.a,n:x.n});
 });
 L.push('','Total amount: '+CUR+fmt(tot));
 if(pays.length){L.push('','Payments:');pays.forEach(function(p){L.push('- '+(p.d||'date not recorded')+': '+CUR+fmt(p.a)+(p.n?' ('+p.n+')':''))});L.push('Total paid: '+CUR+fmt(paid))}
 L.push('','BALANCE DUE: '+CUR+fmt(tot-paid));
 return L.join('\n');
}
function showStmt(gs,title){
 var t;
 if(gs.length===1&&!title)t=oneStmt(gs[0]);
 else{
  var L=['SUMMARY: '+(title||'DEBTS'),'Date: '+today(),''],ow=0,od=0,hasO=false,hasD=false;
  gs.forEach(function(g){var b=balOf(g.items);if(g.kind==='owe'){ow+=b;hasO=true}else{od+=b;hasD=true}L.push(g.name+' ('+(g.kind==='owe'?'I owe':'Owes me')+'): '+CUR+fmt(b))});
  L.push('');if(hasO)L.push('TOTAL I OWE: '+CUR+fmt(ow));if(hasD)L.push('TOTAL OWED TO ME: '+CUR+fmt(od));
  L.push('','----------------','');
  t=L.join('\n')+gs.map(oneStmt).join('\n\n----------------\n\n');
 }
 cur={gs:gs,title:title||''};$('stxt').value=t;$('smsg').textContent='';$('stmt').hidden=false;$('stmt').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function rs(){
 [['owe','sOwe'],['owed','sOwed']].forEach(function(c){
  var gs=groupBy(c[0]),h='';
  gs.forEach(function(g,i){
   var b=balOf(g.items),all=g.items.every(function(x){return sel[x.id]});
   h+='<div class="row"><span class="nm"><input type="checkbox" data-g="'+c[0]+'|'+i+'"'+(all?' checked':'')+' aria-label="Select '+esc(g.name)+'">'+esc(g.name)+'<small>'+g.items.length+(g.items.length>1?' amounts':' amount')+(b<=0.005?' · Settled':'')+'</small></span><span><b>'+fmt(b)+'</b><button class="pd" data-s="'+c[0]+'|'+i+'">Export</button></span></div>';
  });
  if(gs.length)h+='<button class="pd" style="margin-top:10px" data-s="'+c[0]+'|all">Export all</button>';
  $(c[1]).innerHTML=h||'<p class="empty">No one yet.</p>';
 });
 var n=Object.keys(sel).filter(function(k){return sel[k]}).length;
 $('selN').textContent=n?n+' debt'+(n>1?'s':'')+' selected':'Nothing selected. Tick debts above to export specific ones.';
 document.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){
  var p=b.dataset.s.split('|'),gs=groupBy(p[0]);
  if(p[1]==='all')showStmt(gs,p[0]==='owe'?'PEOPLE I OWE':'PEOPLE WHO OWE ME');else showStmt([gs[+p[1]]]);
 }});
 document.querySelectorAll('[data-g]').forEach(function(b){b.onchange=function(){
  var p=b.dataset.g.split('|'),g=groupBy(p[0])[+p[1]];if(!g)return;
  g.items.forEach(function(x){sel[x.id]=b.checked});rd();
 }});
}
$('sxsel').onclick=function(){
 var gs=groupBy(null,function(x){return sel[x.id]});
 if(!gs.length){$('selN').textContent='Tick at least one debt first.';return}
 showStmt(gs,'SELECTED DEBTS');
};
$('sxall').onclick=function(){var gs=groupBy(null);if(!gs.length){$('selN').textContent='There are no debts to export.';return}showStmt(gs,'ALL DEBTS')};
$('sxclr').onclick=function(){sel={};rd()};
$('sclose').onclick=function(){$('stmt').hidden=true};
$('scopy').onclick=function(){copyText($('stxt').value,$('smsg'))};
$('sshare').onclick=function(){if(navigator.share)navigator.share({title:'Account statement',text:$('stxt').value}).catch(function(){});else $('smsg').textContent='Sharing is not available here. Use Copy instead.'};

/* ---------- excel ---------- */
var DL={save:function(o){return new Promise(function(res,rej){try{var b=new Blob([o.data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=o.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);res({status:'saved'})}catch(e){rej({code:'unavailable'})}})}};
function showXl(){if(typeof XLSX!=='undefined'){$('sxl').hidden=false;$('pxl').hidden=false;$('suxl').hidden=false}}
showXl();window.addEventListener('load',showXl);
function shRows(g){
 var C='('+CUR+')',R=[[g.kind==='owe'?'Account statement: what I owe you':'Account statement: what you owe me'],['Name',g.name],['Date',today()],[],['#','Description','Date added','Due date','Amount '+C]],tot=0,paid=0,pays=[];
 g.items.forEach(function(x,i){
  tot+=x.a;paid+=paidAmt(x);R.push([i+1,x.n||'No description',dstr(x.id),x.d||'',x.a]);
  if(x.pays&&x.pays.length)x.pays.forEach(function(p){pays.push([p.d,x.n||'No description',p.a])});
  else if(x.p)pays.push([x.pd||'',x.n||'No description',x.a]);
 });
 R.push(['','','','Total amount',tot],[]);
 if(pays.length){R.push(['Payments'],['Date','Description','Amount '+C]);pays.forEach(function(p){R.push(p)});R.push(['','Total paid',paid],[])}
 R.push(['','','','Balance due',tot-paid]);
 return R;
}
function xlsxBuild(){
 var wb=XLSX.utils.book_new(),used={},C='('+CUR+')';
 function nm(s){s=(s||'').split('').filter(function(c){return '/?*[]:'.indexOf(c)<0&&c!==String.fromCharCode(92)}).join('').trim().slice(0,27)||'Sheet';var b=s,n=2;while(used[s.toLowerCase()]){s=b+' '+n++}used[s.toLowerCase()]=1;return s}
 function add(rows,name,cols){var ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=cols;XLSX.utils.book_append_sheet(wb,ws,nm(name))}
 var cw=[{wch:6},{wch:30},{wch:14},{wch:14},{wch:16}];
 if(cur.gs.length>1||cur.title){
  var S2=[['Summary: '+(cur.title||'debts')],['Date',today()],[],['Name','Direction','Total amount '+C,'Paid '+C,'Balance '+C]];
  cur.gs.forEach(function(g){var t=g.items.reduce(function(s,x){return s+x.a},0),p=g.items.reduce(function(s,x){return s+paidAmt(x)},0);S2.push([g.name,g.kind==='owe'?'I owe':'Owes me',t,p,t-p])});
  add(S2,'Summary',[{wch:24},{wch:12},{wch:20},{wch:14},{wch:16}]);
  cur.gs.forEach(function(g){add(shRows(g),g.name,cw)});
 }else add(shRows(cur.gs[0]),cur.gs[0].name,cw);
 return wb;
}
$('sxl').onclick=function(){
 if(!cur)return;
 try{
  var out=XLSX.write(xlsxBuild(),{bookType:'xlsx',type:'array'});
  var fn=(cur.gs.length>1||cur.title)?'debt-statements-'+today():'statement-'+(cur.gs[0].name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'person');
  DL.save({filename:fn+'.xlsx',data:out}).then(function(){$('smsg').textContent='Excel file saved.'},function(){$('smsg').textContent='Could not download the file. Use Copy instead.'});
 }catch(e){$('smsg').textContent='Excel export is not available right now. Use Copy instead.'}
};
function expo(label,from,to,fname,msgId){
 var say=function(t){$(msgId).textContent=t},C='('+CUR+')';
 try{
  var all0=items.filter(function(x){return x.d>=from&&x.d<=to}),mi=all0.filter(function(x){return !x.ob}),obv=all0.reduce(function(a,x){return a+(x.ob?x.a:0)},0),inc=0,exp=0,by=dict(),o=0,w=0;
  mi.forEach(function(x){if(x.t==='in')inc+=x.a;else{exp+=x.a;by[x.c]=(by[x.c]||0)+x.a}});
  debts.forEach(function(x){if(!x.p){var r=x.a-paidAmt(x);if(x.k==='owe')o+=r;else w+=r}});
  var wb=XLSX.utils.book_new();
  var add=function(rows,name,cols){var ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=cols;XLSX.utils.book_append_sheet(wb,ws,name)};
  add([['Statement: '+label],['Period',from+' to '+to],['Exported',today()],[],['Money in '+C,inc],['Money out '+C,exp],['Opening balance '+C,obv],['Balance '+C,inc+obv-exp],['Number of entries',mi.length],[],['Debts, as of '+today()],['Still owed by me '+C,o],['Still owed to me '+C,w]],'Summary',[{wch:28},{wch:22}]);
  var D1=[['Date','Money in '+C,'Money out '+C,'Balance '+C]],dm={};
  mi.forEach(function(x){var g=dm[x.d]||(dm[x.d]={i:0,o:0});if(x.t==='in')g.i+=x.a;else g.o+=x.a});
  Object.keys(dm).sort().forEach(function(k){D1.push([k,dm[k].i,dm[k].o,dm[k].i-dm[k].o])});
  D1.push(['Total',inc,exp,inc-exp]);
  add(D1,'By day',[{wch:14},{wch:16},{wch:16},{wch:16}]);
  var W=[['Week (Monday to Sunday)','Money in '+C,'Money out '+C]];
  wkGroup(mi).forEach(function(g){W.push([dstr(g.d.getTime())+' to '+dstr(wkEnd(g.d).getTime()),g.inc,g.exp])});
  add(W,'By week',[{wch:26},{wch:16},{wch:16}]);
  var B=[['Month','Money in '+C,'Money out '+C,'Balance '+C]],yy=+from.slice(0,4),mm=+from.slice(5,7),y1=+to.slice(0,4),m1=+to.slice(5,7);
  while(yy<y1||(yy===y1&&mm<=m1)){
   var key=yy+'-'+pad(mm),a=0,b=0;
   mi.forEach(function(x){if(x.d.slice(0,7)===key){if(x.t==='in')a+=x.a;else b+=x.a}});
   B.push([monthName(key),a,b,a-b]);mm++;if(mm>12){mm=1;yy++}
  }
  B.push(['Total',inc,exp,inc-exp]);
  add(B,'By month',[{wch:20},{wch:16},{wch:16},{wch:16}]);
  var E=[['Date','Time','Type','Category','Note','Amount '+C]];
  mi.slice().sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:0}).forEach(function(x){E.push([x.d,x.tm||'',x.t==='in'?'Received':'Spent',x.c,x.n||'',x.a])});
  E.push([],['','','','','Total received',inc],['','','','','Total spent',exp]);
  add(E,'Entries',[{wch:12},{wch:8},{wch:10},{wch:16},{wch:28},{wch:16}]);
  var Ct=[['Category','Spent '+C,'Share','Monthly budget '+C]];
  Object.keys(by).sort(function(a,b){return by[b]-by[a]}).forEach(function(k){Ct.push([k,by[k],(exp?Math.round(by[k]/exp*100):0)+'%',budgets[k]||''])});
  Ct.push(['Total',exp,'']);
  add(Ct,'Spending by category',[{wch:20},{wch:14},{wch:10},{wch:22}]);
  var Dd=[['Person','Direction','Description','Amount '+C,'Date added','Due date','Paid '+C,'Balance '+C,'Status']];
  debts.forEach(function(x){var p=paidAmt(x);Dd.push([x.w,x.k==='owe'?'I owe':'Owes me',x.n||'',x.a,dstr(x.id),x.d||'',p,x.a-p,x.p?'Settled':(p>0?'Part paid':'Unpaid')])});
  add(Dd,'Debts',[{wch:20},{wch:10},{wch:26},{wch:14},{wch:12},{wch:12},{wch:12},{wch:14},{wch:11}]);
  var Pm=[['Date','Person','Direction','Description','Amount '+C]];
  debts.forEach(function(x){(x.pays||[]).forEach(function(p){if(p.d&&p.d>=from&&p.d<=to)Pm.push([p.d,x.w,x.k==='owe'?'I paid':'Received',x.n||'',p.a])})});
  add(Pm,'Debt payments',[{wch:12},{wch:20},{wch:10},{wch:26},{wch:14}]);
  var out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  DL.save({filename:fname+'.xlsx',data:out}).then(function(){say('Excel file saved.')},function(){say('Could not download the file.')});
 }catch(e){say('Excel export is not available right now.')}
}

/* ---------- expecting money ---------- */
function daysTo(a,b){var p=a.split('-'),q=b.split('-');return Math.round((new Date(+q[0],+q[1]-1,+q[2])-new Date(+p[0],+p[1]-1,+p[2]))/86400000)}
function findExp(id){return expect.filter(function(e){return String(e.id)===String(id)})[0]}
function addExpect(w,a,n,d){
 if(!d){debts.unshift({id:Date.now()+Math.random(),k:'owed',w:w,a:a,n:n||'Expected money',d:'',p:false});dsave();return 'debt'}
 expect.push({id:Date.now()+Math.random(),w:w,a:a,n:n||'',d:d,r:{},cn:''});esave();return 'list';
}
function receiveExpected(e){
 addEntry('in',e.a,'Expected money','From '+e.w+(e.n?' · '+e.n:''),today());
 expect=expect.filter(function(y){return y!==e});esave();renderAll();
}
function moveToDebt(e){
 debts.unshift({id:Date.now()+Math.random(),k:'owed',w:e.w,a:e.a,n:e.n||'Expected money',d:'',p:false,ask:{last:today(),n:0,pend:''}});
 expect=expect.filter(function(y){return y!==e});esave();dsave();
 notify('Moved to Owed to me',CUR+fmt(e.a)+' from '+e.w+' is now in Debts under "Owed to me". I will ask you each morning for a week whether it has arrived.','xmove');
 renderAll();
}
function receiveFollow(d){
 var rem=d.a-paidAmt(d),x=addEntry('in',rem,'Debt repayment','From '+d.w,today(),{pl:d.id});
 d.pays=d.pays||[];d.pays.push({a:rem,d:today(),eid:x.id});d.p=true;d.pd=today();if(d.ask)d.ask.pend='';
 dsave();renderAll();
}
function runReminders(){
 if(locked)return;
 var t=today(),n=hm(),ch=false,dd=false,rc=false;
 expect.forEach(function(e){
  var left=daysTo(t,e.d);e.r=e.r||{};
  if(left>0){
   var th=[1,3,7].filter(function(h){return h>=left})[0];
   if(th&&!e.r[th]){
    [1,3,7].forEach(function(h){if(h>=th)e.r[h]=1});ch=true;
    if(S.xr)notify('Money coming',"You are expecting "+CUR+fmt(e.a)+' from '+e.w+' in '+left+(left>1?' days':' day')+' ('+e.d+').','xr-'+e.id);
   }
  }else if(e.cn!==t){
   e.cn=t;ch=true;
   if(S.xr)notify('Did you receive it?','Did you receive '+CUR+fmt(e.a)+' from '+e.w+'? Open the app and confirm.','xc-'+e.id);
  }
 });
 debts.forEach(function(d){
  if(d.ask&&!d.p&&d.ask.n<7&&d.ask.last!==t&&n>=S.mt){
   d.ask.last=t;d.ask.n++;d.ask.pend=t;dd=true;
   if(S.xr)notify('Have you been paid?','Have you received '+CUR+fmt(d.a-paidAmt(d))+' from '+d.w+' yet? Open the app and confirm.','xf-'+d.id);
  }
 });
 REC.forEach(function(r){var d=recDue(r);if(d&&r.nt!==t){r.nt=t;rc=true;if(S.xr)notify('Recurring entry due',r.c+' '+CUR+fmt(r.a)+(r.n?' ('+r.n+')':'')+' is due. Open the app to add it.','rc-'+r.id)}});
 if(rc)rsave();if(ch)esave();if(dd)dsave();
 if(ch||dd||rc)rPrompts();
}
function rPrompts(){
 var t=today(),h='';
 expect.filter(function(e){return e.d<=t}).forEach(function(e){h+='<div class="card pc"><b>Did you receive '+CUR+fmt(e.a)+' from '+esc(e.w)+'?</b><small>Expected '+e.d+(e.n?' · '+esc(e.n):'')+'</small><div class="pf"><button class="pd" data-xy="'+e.id+'">Yes, received</button><button class="pd" data-xn="'+e.id+'">Not yet</button></div></div>'});
 debts.filter(function(d){return d.ask&&!d.p&&d.ask.pend===t}).forEach(function(d){h+='<div class="card pc"><b>Have you received '+CUR+fmt(d.a-paidAmt(d))+' from '+esc(d.w)+' yet?</b><small>Owed to you'+(d.n?' · '+esc(d.n):'')+'</small><div class="pf"><button class="pd" data-dy="'+d.id+'">Yes, received</button><button class="pd" data-dn="'+d.id+'">Not yet</button></div></div>'});
 REC.forEach(function(r){var d=recDue(r);if(!d)return;h+='<div class="card pc"><b>Time to add: '+esc(r.c)+' '+CUR+fmt(r.a)+'?</b><small>Recurring · due '+d+(r.n?' · '+esc(r.n):'')+'</small><div class="pf"><button class="pd" data-ry="'+r.id+'">Add entry</button><button class="pd" data-rs="'+r.id+'">Skip this time</button></div></div>'});
 if(bkDue()){var bk=jget(LBK,null);h+='<div class="card pc"><b>Time to back up your records</b><small>'+(bk&&bk.d?'Last backup: '+bk.d+'.':'You have not made a backup yet.')+' Phone storage can be cleared or lost.</small><div class="pf"><button class="pd" id="bkNow">Back up now</button><button class="pd" id="bkLater">Remind me in 3 days</button></div></div>'}
 $('prompts').innerHTML=h;
 document.querySelectorAll('[data-ry]').forEach(function(b){b.onclick=function(){var r=findRec(b.dataset.ry);if(r)recAdd(r)}});
 document.querySelectorAll('[data-rs]').forEach(function(b){b.onclick=function(){var r=findRec(b.dataset.rs),d=r&&recDue(r);if(d){r.l=d;rsave();renderAll()}}});
 if($('bkNow'))$('bkNow').onclick=function(){($('bkpAll').hidden?$('bkp'):$('bkpAll')).click();renderAll()};
 if($('bkLater'))$('bkLater').onclick=function(){var b=jget(LBK,null)||{};b.z=addDays(today(),3);jset(LBK,b);rPrompts()};
 document.querySelectorAll('[data-xy]').forEach(function(b){b.onclick=function(){var e=findExp(b.dataset.xy);if(e)receiveExpected(e)}});
 document.querySelectorAll('[data-xn]').forEach(function(b){b.onclick=function(){var e=findExp(b.dataset.xn);if(e)moveToDebt(e)}});
 document.querySelectorAll('[data-dy]').forEach(function(b){b.onclick=function(){var d=findDebt(b.dataset.dy);if(d)receiveFollow(d)}});
 document.querySelectorAll('[data-dn]').forEach(function(b){b.onclick=function(){var d=findDebt(b.dataset.dn);if(d&&d.ask){d.ask.pend='';dsave();rPrompts()}}});
}
function rx(){
 var l=expect.slice().sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:0}),t=today();
 $('xlist').innerHTML=l.length?l.map(function(e){
  var left=daysTo(t,e.d),st=left>0?'In '+left+(left>1?' days':' day'):(left===0?'Due today':'Was due '+(-left)+(left<-1?' days':' day')+' ago');
  return '<div class="row"><span><b>'+esc(e.w)+'</b>'+(e.n?' · '+esc(e.n):'')+'<small'+(left<=0?' class="out"':'')+'>Expected '+e.d+' · '+st+'</small></span><span class="in"><b>'+fmt(e.a)+'</b><button class="pd" data-xr="'+e.id+'">Received</button><button aria-label="Delete" data-xd="'+e.id+'">×</button></span></div>';
 }).join(''):'<p class="empty">Nothing expected right now.</p>';
 document.querySelectorAll('[data-xr]').forEach(function(b){b.onclick=function(){var e=findExp(b.dataset.xr);if(e)receiveExpected(e)}});
 document.querySelectorAll('[data-xd]').forEach(function(b){b.onclick=function(){
  var e=findExp(b.dataset.xd);if(!e)return;
  if(!ask('Delete the expected '+CUR+fmt(e.a)+' from '+e.w+'?'))return;
  expect=expect.filter(function(y){return y!==e});esave();renderAll();
 }});
}
$('xsave').onclick=function(){
 var w=$('xw').value.trim(),a=cents(parseFloat($('xa').value)),d=$('xd').value,m=$('xmsg');m.textContent='';
 if(!w){m.textContent='Enter who the money is from.';$('xw').focus();return}
 if(!(a>=0.01)){m.textContent='Enter an amount of 0.01 or more.';$('xa').focus();return}
 if(d&&d<today()){m.textContent='The expected date cannot be in the past.';return}
 var r=addExpect(w,a,$('xn').value.trim(),d);
 $('xw').value='';$('xa').value='';$('xn').value='';$('xd').value='';
 renderAll();
 toast(r==='debt'?'Added to Owed to me':'Expecting money',r==='debt'?'No date was given, so it is listed in Debts under "Owed to me".':CUR+fmt(a)+' from '+w+' on '+d+'. You will be reminded 7, 3 and 1 day before.');
 runReminders();
};

/* ---------- send money to another profile ---------- */
function rtr(){
 var l=PR.list.filter(function(p){return p.id!==PID&&PG(p)===PG(AP)});
 $('trcard').hidden=!l.length;
 var old=$('trto').value;
 $('trto').innerHTML=l.map(function(p){return '<option value="'+p.id+'"'+(p.id===old?' selected':'')+'>'+esc(p.name)+'</option>'}).join('');
}
$('trgo').onclick=function(){
 var m=$('trmsg');m.textContent='';
 var a=cents(parseFloat($('tra').value)),to=$('trto').value,tp=PR.list.filter(function(p){return p.id===to&&PG(p)===PG(AP)})[0],me=PR.list.filter(function(p){return p.id===PID})[0];
 if(!tp){m.textContent='Choose a profile to send to.';return}
 if(!(a>=0.01)){m.textContent='Enter an amount of 0.01 or more.';$('tra').focus();return}
 var cm=today().slice(0,7),bal=0;items.forEach(function(x){if(x.d.slice(0,7)===cm)bal+=x.t==='in'?x.a:-x.a});
 var c2=ls('cedi-tracker-cur-v1'+sfxFor(to),'GH₵');
 var msg='Send '+CUR+fmt(a)+' from "'+me.name+'" to "'+tp.name+'"?'+(c2!==CUR?' The two profiles use different currencies ('+CUR+' and '+c2+') and amounts are not converted.':'')+(a>bal?' This is more than your balance this month.':'');
 if(!confirm(msg))return;
 var k2=BASES[0]+sfxFor(to),arr=jget(k2,[]);if(!Array.isArray(arr))arr=[];
 var note=$('trn').value.trim(),t=today();
 arr.unshift({id:Date.now()+Math.random(),t:'in',a:a,c:'Transfer in',n:'From '+me.name+(note?' · '+note:''),d:t,tm:hm(),tr:1});
 try{localStorage.setItem(k2,JSON.stringify(arr))}catch(e){m.textContent='Could not save. Nothing was sent.';return}
 addEntry('out',a,'Transfer out','To '+tp.name+(note?' · '+note:''),t,{tr:1});
 $('tra').value='';$('trn').value='';renderAll();toast('Money sent',CUR+fmt(a)+' sent to '+tp.name+'.');
};

/* ---------- first-time setup guide ---------- */
var WZ=null,WSTEPS=[
 {t:'Your current balance',s:'How much money do you have right now (cash, mobile money, bank)? Skip it if you would rather start from zero.',f:'num',k:'bal'},
 {t:'Savings',s:'How much savings did you already have before using this app?',f:'num',k:'sav'},
 {t:'Investments',s:'How much do you already have invested?',f:'num',k:'inv'},
 {t:'Money you owe',s:'Add each person or company you owe, with the amount.',f:'list',k:'owe'},
 {t:'Money owed to you',s:'Add anyone who owes you money, with the amount.',f:'list',k:'owed'},
 {t:'Money you are expecting',s:'Add money you expect to receive. A date is optional; without one it goes to "Owed to me".',f:'exp',k:'exp'}
];
function startWizard(){WZ={i:0,bal:'',sav:'',inv:'',owe:[],owed:[],exp:[]};$('wz').hidden=false;wzShow()}
function maybeWizard(){
 if(locked||!uname||ls(SK,'')||!$('wz').hidden||!$('tour').hidden||!$('tkmod').hidden)return;
 if(items.length||debts.length){lsSet(SK,'1');return}
 startWizard();
}
function wzList(){
 var s=WSTEPS[WZ.i];if(s.f==='num'||!$('wzL'))return;
 $('wzL').innerHTML=WZ[s.k].map(function(r,i){return '<div class="row"><span>'+esc(r.w)+(r.d?'<small>Expected '+r.d+'</small>':'')+'</span><span><b>'+fmt(r.a)+'</b><button aria-label="Remove" data-wr="'+i+'">×</button></span></div>'}).join('');
 document.querySelectorAll('[data-wr]').forEach(function(b){b.onclick=function(){WZ[s.k].splice(+b.dataset.wr,1);wzList()}});
}
function wzShow(){
 var s=WSTEPS[WZ.i],h='';
 $('wzStep').textContent='Step '+(WZ.i+1)+' of '+WSTEPS.length;$('wzT').textContent=s.t;$('wzS').textContent=s.s;$('wzMsg').textContent='';
 if(s.f==='num')h='<input id="wzA" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Amount ('+esc(CUR)+')" value="'+esc(WZ[s.k]||'')+'">';
 else h='<input id="wzW" type="text" maxlength="60" placeholder="'+(s.f==='exp'?'Who is it from?':'Name')+'"><input id="wzA" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Amount ('+esc(CUR)+')">'+(s.f==='exp'?'<input id="wzD" type="date" min="'+today()+'" aria-label="Expected date (optional)">':'')+'<button class="pd" id="wzAdd">Add to list</button><div id="wzL" style="margin-top:8px"></div>';
 $('wzBody').innerHTML=h;
 if($('wzAdd'))$('wzAdd').onclick=function(){$('wzMsg').textContent=wzAdd()};
 wzList();
 $('wzBack').hidden=WZ.i===0;$('wzNext').textContent=WZ.i===WSTEPS.length-1?'Finish':'Next';
}
function wzAdd(){
 var s=WSTEPS[WZ.i],w=$('wzW').value.trim(),a=cents(parseFloat($('wzA').value)),d=$('wzD')?$('wzD').value:'';
 if(!w&&$('wzA').value==='')return '';
 if(!w)return 'Enter a name.';
 if(!(a>=0.01))return 'Enter an amount of 0.01 or more.';
 if(d&&d<today())return 'The date cannot be in the past.';
 WZ[s.k].push({w:w.slice(0,60),a:a,d:d});$('wzW').value='';$('wzA').value='';if($('wzD'))$('wzD').value='';wzList();return '';
}
function wzTake(){
 var s=WSTEPS[WZ.i];
 if(s.f==='num'){var v=$('wzA').value;if(v!==''&&!(parseFloat(v)>=0))return 'Enter a valid amount.';WZ[s.k]=v;return ''}
 return wzAdd();
}
function wzFinish(){
 var t=today(),bal=cents(parseFloat(WZ.bal)),sv=cents(parseFloat(WZ.sav)),iv=cents(parseFloat(WZ.inv));
 if(bal>=0.01)addEntry('in',bal,'Opening balance','Balance when I started',t,{ob:1});
 if(sv>=0.01)OPEN.Savings=sv;
 if(iv>=0.01)OPEN.Investment=iv;
 osave();
 WZ.owe.forEach(function(r){debts.push({id:Date.now()+Math.random(),k:'owe',w:r.w,a:r.a,n:'Opening balance',d:'',p:false})});
 WZ.owed.forEach(function(r){debts.push({id:Date.now()+Math.random(),k:'owed',w:r.w,a:r.a,n:'Opening balance',d:'',p:false})});
 dsave();
 WZ.exp.forEach(function(r){addExpect(r.w,r.a,'',r.d)});
 lsSet(SK,'1');$('wz').hidden=true;WZ=null;renderAll();
 toast('All set','Your starting details are saved. You can change anything later.');
}
$('wzNext').onclick=function(){var e=wzTake();if(e){$('wzMsg').textContent=e;return}if(WZ.i>=WSTEPS.length-1)wzFinish();else{WZ.i++;wzShow()}};
$('wzSkip').onclick=function(){if(WZ.i>=WSTEPS.length-1)wzFinish();else{WZ.i++;wzShow()}};
$('wzBack').onclick=function(){wzTake();if(WZ.i>0){WZ.i--;wzShow()}};
$('wzAll').onclick=function(){if(!confirm('Skip the setup? You can run it again later from Settings.'))return;lsSet(SK,'1');$('wz').hidden=true;WZ=null};
$('rsetup').onclick=function(){startWizard()};

/* ---------- name / greeting ---------- */
function showGreet(){
 if(uname){var p=PR.list.length>1?PR.list.filter(function(x){return x.id===PID})[0].name:'';$('greet').textContent='Hello '+uname+(p?' · '+p:'');$('greet').hidden=false;$('wmod').hidden=true}
 else{$('wtitle').textContent='Welcome to Cedi Tracker';$('wsub').textContent='Enter your name to personalize your tracker.';$('wgo').textContent='Continue';$('wcancel').hidden=true;$('wmod').hidden=false}
}
$('greet').onclick=function(){$('wtitle').textContent='Edit your name';$('wsub').textContent='Update the name shown at the top of your tracker.';$('wgo').textContent='Save name';$('wname').value=uname;$('wcancel').hidden=false;$('wmod').hidden=false;$('wname').focus()};
$('wcancel').onclick=function(){$('wmod').hidden=true};
$('wgo').onclick=function(){var v=$('wname').value.trim();if(!v){$('wname').focus();return}var nm=v.slice(0,60);if(AP.owner){AP.owner=nm;jset(PK,PR)}else{mainName=nm;lsSet(NK,nm)}uname=nm;showGreet();afterUnlock()};
$('wname').onkeydown=function(e){if(e.key==='Enter')$('wgo').click()};

/* ---------- settings: notifications ---------- */
function bindS(id,key,chk){
 var el=$(id);if(chk)el.checked=!!S[key];else el.value=S[key];
 el.onchange=function(){if(!chk&&!el.value)return;S[key]=chk?el.checked:el.value;jset(NSK,S)};
}
bindS('nstyle','style');bindS('nbud','bud',1);bindS('nxr','xr',1);bindS('nmorn','morn',1);bindS('nmt','mt');bindS('neve','eve',1);bindS('net','et');bindS('ninc','inc',1);bindS('nexp','exp',1);bindS('nbal','bal',1);
function updStat(){
 var t='Phone notifications are not supported here. Pop-ups inside the app still work.';
 if('Notification' in window){var p=Notification.permission;t=p==='granted'?'Phone notifications are allowed.':p==='denied'?'Phone notifications are blocked. Allow them for this app in your phone settings.':'Phone notifications are not allowed yet.'}
 $('nstat').textContent=t;
}
$('nperm').onclick=function(){
 if(!('Notification' in window)){updStat();return}
 try{var r=Notification.requestPermission(function(){updStat()});if(r&&r.then)r.then(updStat)}catch(e){updStat()}
};
$('ntest').onclick=function(){notify('Cedi Tracker','This is how your notifications will look.','test')};

/* ---------- backup & restore ---------- */
$('bkp').onclick=function(){
 try{
  var p=PR.list.filter(function(x){return x.id===PID})[0];
  var data={app:'Cedi Tracker',exported:today(),name:uname,profile:p.name,currency:CUR,items:items,cats:XC,budgets:budgets,debts:debts,open:OPEN,expect:expect,thr:AT,rec:REC};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='cedi-tracker-backup-'+p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(u)},4000);$('bmsg').textContent='Backup file saved.';markBk();updBk();
 }catch(e){$('bmsg').textContent='Could not create backup file.'}
};
$('rst').onclick=function(){$('rfile').value='';$('rfile').click()};
var DRE={test:function(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;var p=s.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);return d.getFullYear()===+p[0]&&d.getMonth()===+p[1]-1&&d.getDate()===+p[2]}};
function isNum(v){return typeof v==='number'&&isFinite(v)}
function str(v){return typeof v==='string'?v.slice(0,200):''}
function cleanBackup(d){
 if(!d||d.app!=='Cedi Tracker'||!Array.isArray(d.items))throw new Error('format');
 var out={items:[],debts:[],budgets:dict(),cats:{out:[],in:[]},name:'',cur:'',open:{},expect:[],rec:[],thr:null};
 d.items.forEach(function(x){
  if(!x||!isNum(x.a)||x.a<=0||!isNum(x.id)||!DRE.test(x.d)||(x.t!=='in'&&x.t!=='out'))throw new Error('entry');
  var e={id:x.id,t:x.t,a:x.a,c:str(x.c)||'Other',n:str(x.n),d:x.d};
  if(isNum(x.dl))e.dl=x.dl;if(isNum(x.pl))e.pl=x.pl;if(typeof x.tm==='string'&&/^\d{2}:\d{2}$/.test(x.tm))e.tm=x.tm;if(x.ob)e.ob=1;if(x.tr)e.tr=1;out.items.push(e);
 });
 (d.debts===undefined?[]:d.debts).forEach(function(x){
  if(!x||!isNum(x.a)||x.a<=0||!isNum(x.id)||(x.k!=='owe'&&x.k!=='owed')||(x.d&&!DRE.test(x.d))||(x.pd&&!DRE.test(x.pd)))throw new Error('debt');
  var pays=[];
  (x.pays===undefined?[]:x.pays).forEach(function(q){
   if(!q||!isNum(q.a)||q.a<=0||(q.d&&!DRE.test(q.d)))throw new Error('payment');
   var pp={a:q.a,d:q.d||''};if(isNum(q.eid))pp.eid=q.eid;pays.push(pp);
  });
  var dd={id:x.id,k:x.k,w:str(x.w),a:x.a,n:str(x.n),d:x.d||'',p:!!x.p,pd:x.pd||''};
  if(isNum(x.eid))dd.eid=x.eid;if(pays.length)dd.pays=pays;if(x.ask&&typeof x.ask==='object')dd.ask={last:str(x.ask.last),n:isNum(x.ask.n)?x.ask.n:0,pend:str(x.ask.pend)};out.debts.push(dd);
 });
 var bd=d.budgets;
 if(bd&&typeof bd==='object'&&!Array.isArray(bd))Object.keys(bd).forEach(function(k){if(isNum(bd[k])&&bd[k]>0)out.budgets[str(k)]=bd[k]});
 var ct=d.cats;
 if(ct&&typeof ct==='object')['out','in'].forEach(function(t){if(Array.isArray(ct[t]))ct[t].forEach(function(c){if(typeof c==='string'&&c.trim()&&!reserved(c.trim()))out.cats[t].push(c.trim().slice(0,60))})});
 if(d.open&&typeof d.open==='object')['Savings','Investment'].forEach(function(k){if(isNum(d.open[k])&&d.open[k]>0)out.open[k]=d.open[k]});
 (Array.isArray(d.expect)?d.expect:[]).forEach(function(q){if(q&&isNum(q.id)&&isNum(q.a)&&q.a>0&&DRE.test(q.d))out.expect.push({id:q.id,w:str(q.w),a:q.a,n:str(q.n),d:q.d,r:{},cn:str(q.cn)})});
 if(Array.isArray(d.thr)&&d.thr.length===3&&isNum(d.thr[0])&&d.thr[0]>0&&d.thr[1]>d.thr[0]&&d.thr[2]>d.thr[1])out.thr=d.thr;
 (Array.isArray(d.rec)?d.rec:[]).forEach(function(q){if(q&&isNum(q.id)&&isNum(q.a)&&q.a>0&&(q.t==='in'||q.t==='out')&&(q.f==='w'||q.f==='m')&&isNum(q.dy)&&DRE.test(q.s))out.rec.push({id:q.id,t:q.t,a:q.a,c:str(q.c)||'Other',n:str(q.n),f:q.f,dy:q.dy,s:q.s,l:DRE.test(q.l)?q.l:''})});
 out.name=typeof d.name==='string'?d.name.trim().slice(0,60):'';
 out.cur=typeof d.currency==='string'?d.currency.trim().slice(0,5):'';
 return out;
}
$('rfile').onchange=function(){
 var f=this.files&&this.files[0];if(!f)return;
 var reader=new FileReader();
 reader.onload=function(){
  var c,when='unknown date',ra=null;try{ra=JSON.parse(reader.result)}catch(e){}
  if(ra&&ra.app==='Cedi Tracker'&&Array.isArray(ra.profiles)){restoreAll(ra);return}
  try{var raw=JSON.parse(reader.result);c=cleanBackup(raw);if(raw.exported&&DRE.test(raw.exported))when=raw.exported}
  catch(e){$('bmsg').textContent='Could not use this file. Choose a valid Cedi Tracker backup. Your current data was not changed.';return}
  if(!ask('This will replace the current data of this profile with the backup from '+when+'.'))return;
  items=c.items;debts=c.debts;budgets=Object.assign(dict(),c.budgets);XC=c.cats;flags={};jset(FK,flags);OPEN=c.open;osave();expect=c.expect;esave();REC=c.rec;rsave();AT=c.thr||[250,500,750];jset(ATK,AT);
  if(c.cur){CUR=c.cur;lsSet(CUK,CUR)}
  migrate(false);dsave();
  if(c.name&&!mainName&&!AP.owner){mainName=c.name;lsSet(NK,mainName);uname=mainName;showGreet()}
  applyCur();fillCats();renderAll();
  markBk();renderAll();$('bmsg').textContent='Backup restored successfully.';
 };
 reader.readAsText(f);
};

/* ---------- guided tour ---------- */
var TSTEPS=[
 {t:'Welcome to Cedi Tracker',b:'Here is a quick look at what the app can do. It takes about a minute, and you can skip it at any time. You can replay it later from Settings or About.',pg:'home'},
 {t:'Your balance',b:'This is your balance for the month. The line under Money in and Money out is your total balance across all months. Tap the number or the Hide button to blur it, so nobody sees it by accident. It stays blurred until you show it again.',pg:'home',sel:'.balrow'},
 {t:'Record money',b:'Choose Received for money in or Spent for money out, type the amount, then tap Add entry. Forgot something? You can record entries up to 30 days back.',pg:'home',sel:'#pg-home .seg'},
 {t:'Categories',b:'Pick a category for each entry. Choose "+ New category" to add your own, and delete your own later. Some are special: Loan, Debt and Debt repayment update your Debts, and Savings and Investment feed their own pages.',pg:'home',sel:'#cat'},
 {t:'Where your money went',b:'These bars show how much you spent in each category. The colour moves from green to red as the amount grows, so big spending stands out.',pg:'home',sel:'#bars',up:1},
 {t:'Budgets',b:'Set a monthly limit for a spending category. The bar fills as you spend, and you get an alert at 25%, 50%, 75% and 100%.',pg:'home',sel:'#bcat',up:1},
 {t:'Day, week and month',b:'See today\'s totals, each week of this month, and the whole month at a glance.',pg:'home',sel:'#days',up:1},
 {t:'Today\'s entries',b:'Your entries for today appear here with Edit and delete buttons. Each entry also records the time. Older days are in Summary.',pg:'home',sel:'#list',up:1},
 {t:'The menu',b:'Tap the menu button at the top left to open this menu: Home, Summary, Savings, Investment, Debts, Expecting, Recurring, Settings and About.',pg:'home',menu:1,sel:'#drawer nav'},
 {t:'Profiles',b:'Tap your profile here to add up to 3 profiles, for example Personal and Church. A profile can share your PIN or have its own PIN and name. You can send money between profiles that share a PIN.',pg:'home',menu:1,sel:'#profbtn'},
 {t:'Summary',b:'Pick Daily, Weekly or Monthly to see totals and entries for any period. Export to Excel, or copy and share as text. You can edit or delete older entries here too.',pg:'sum',sel:'#sk'},
 {t:'Savings and Investment',b:'Money you spend into Savings or Investment is added here, and money you receive from them is taken off. "Opening amount" is what you already had before using the app.',pg:'sav',sel:'#savT'},
 {t:'Debts',b:'Track money you owe and money owed to you. Receiving a Loan, or paying a Debt from the Home page, updates this automatically. Tick debts to export a statement.',pg:'debts',sel:'.dsum'},
 {t:'Expecting money',b:'Add money you expect to receive, with a date. You get reminders 7, 3 and 1 day before, and a question on the day. If it did not arrive, it moves to Debts and the app asks each morning for a week.',pg:'exp',sel:'#xw'},
 {t:'Settings',b:'Change the currency (your amounts are converted at the current rate), set notifications and their times, change your PIN, turn on fingerprint unlock, and back up or restore your records.',pg:'set',sel:'#cursel'},
 {t:'You are ready',b:'Tip: download a backup from Settings regularly. To see this tour again, go to Settings or About and tap "Take the app tour".',pg:'home'}
];
var TI=0,THL=null;
function tourClear(){if(THL){THL.classList.remove('tour-hl','tour-sp');THL=null}}
function tourShow(){
 var s=TSTEPS[TI],last=TI===TSTEPS.length-1;
 tourClear();showPage(s.pg||'home');if(s.menu)openMenu();
 $('tourN').textContent='Step '+(TI+1)+' of '+TSTEPS.length;$('tourT').textContent=s.t;$('tourB').textContent=s.b;
 $('tourBar').style.width=Math.round((TI+1)/TSTEPS.length*100)+'%';
 $('tourBack').hidden=TI===0;$('tourSkip').hidden=last;$('tourNext').textContent=last?'Finish':'Next';
 var el=s.sel?document.querySelector(s.sel):null;
 if(el&&s.up)el=el.closest('.card')||el;
 var inDrawer=el&&el.closest('#drawer');
 if(el&&el.getClientRects().length){
  THL=el;el.classList.add('tour-hl');if(!inDrawer)el.classList.add('tour-sp');
  $('tour').classList.remove('dim');
  if(!inDrawer)setTimeout(function(){if(THL===el)el.scrollIntoView({behavior:'smooth',block:'start'})},80);
 }else $('tour').classList.add('dim');
 $('tourNext').focus();
}
function tourOpen(){TI=0;$('tour').hidden=false;tourShow()}
function tourClose(){tourClear();$('tour').hidden=true;$('tour').classList.remove('dim');closeMenu();showPage('home');maybeWizard()}
$('tourNext').onclick=function(){if(TI>=TSTEPS.length-1)tourClose();else{TI++;tourShow()}};
$('tourBack').onclick=function(){if(TI>0){TI--;tourShow()}};
$('tourSkip').onclick=tourClose;
function maybeTour(){
 if(locked||!uname||ls(TK,'')||!$('tkmod').hidden||!$('tour').hidden||!$('wmod').hidden)return false;
 $('tkmod').hidden=false;return true;
}
function afterUnlock(){if(!maybeTour())maybeWizard()}
$('tkYes').onclick=function(){lsSet(TK,'1');$('tkmod').hidden=true;tourOpen()};
$('tkNo').onclick=function(){lsSet(TK,'1');$('tkmod').hidden=true;maybeWizard()};
$('tourSet').onclick=tourOpen;
$('tourAbout').onclick=tourOpen;

/* ---------- keep several open windows in step ---------- */
function reloadData(){
 items=jget(KEY,[]);if(!Array.isArray(items))items=[];
 XC=jget(CK,{});if(!XC||typeof XC!=='object'||Array.isArray(XC))XC={};XC.out=Array.isArray(XC.out)?XC.out:[];XC.in=Array.isArray(XC.in)?XC.in:[];
 var bd=jget(BK,{});budgets=Object.assign(dict(),(bd&&typeof bd==='object'&&!Array.isArray(bd))?bd:{});
 debts=jget(DK,[]);if(!Array.isArray(debts))debts=[];
 REC=jget(RCK,[]);if(!Array.isArray(REC))REC=[];
 flags=jget(FK,{});if(!flags||typeof flags!=='object'||Array.isArray(flags))flags={};
 OPEN=jget(OPK,{});if(!OPEN||typeof OPEN!=='object'||Array.isArray(OPEN))OPEN={};
 expect=jget(EK,[]);if(!Array.isArray(expect))expect=[];
 var at=jget(ATK,[250,500,750]);AT=(Array.isArray(at)&&at.length===3&&at[0]>0&&at[1]>at[0]&&at[2]>at[1])?at:[250,500,750];
 CUR=ls(CUK,'GH₵');
 var keep=editId?entryById(editId):null;
 if(editId&&!keep)endEdit();
 fillCats(keep?keep.c:undefined);fillBCats();applyCur();renderAll();
}
window.addEventListener('storage',function(e){
 if(e.storageArea!==localStorage)return;
 var k=e.key;
 if(k===null){location.reload();return}
 if(k===KEY||k===DK||k===BK||k===CK||k===OPK||k===EK||k===RCK||k===ATK||k===CUK||k===FK)reloadData();
 else if(k===LKK){LK=jget(LKK,null)}
 else if(k===NK){mainName=ls(NK,'');if(!AP.owner){uname=mainName;showGreet()}}
 else if(k===NSK){S=Object.assign({style:'both',xr:true,bud:true,morn:true,mt:'07:00',eve:true,et:'21:00',inc:true,exp:true,bal:true},jget(NSK,{}))}
 else if(k===PK){var np=jget(PK,null);if(np&&Array.isArray(np.list)){PR.list=np.list;var ap=PR.list.filter(function(x){return x.id===PID})[0];if(!ap){location.reload();return}AP=ap;setProfileUI();rtr();updPinKind();if(!$('pmod').hidden)rp()}}
});

/* ---------- backups: reminder and all profiles ---------- */
function markBk(){jset(LBK,{d:today(),n:items.length,z:''})}
function shareable(){return PR.list.filter(function(p){return PG(p)===PG(AP)})}
function bkDue(){
 if(!items.length)return false;
 var b=jget(LBK,null),t=today();
 if(b&&b.z&&b.z>t)return false;
 if(!b||!b.d)return items.length>=10;
 var ch=items.length-(b.n||0);
 return ch>=50||(daysTo(b.d,t)>=14&&ch!==0);
}
function updBk(){
 if(!$('bklast'))return;
 var b=jget(LBK,null);
 $('bkpAll').hidden=shareable().length<2;
 $('bklast').textContent=b&&b.d?'Last backup of this profile: '+b.d+(items.length>b.n?' ('+(items.length-b.n)+' new entries since).':'.'):'No backup of this profile yet.';
}
function readProf(p){
 var s=sfxFor(p.id);
 return {id:p.id,name:p.name,currency:ls('cedi-tracker-cur-v1'+s,'GH₵'),items:jget('cedi-tracker-v1'+s,[]),cats:jget('cedi-tracker-cats-v1'+s,{}),budgets:jget('cedi-tracker-budgets-v1'+s,{}),debts:jget('cedi-tracker-debts-v1'+s,[]),open:jget('cedi-tracker-open-v1'+s,{}),expect:jget('cedi-tracker-expect-v1'+s,[]),rec:jget('cedi-tracker-recur-v1'+s,[]),thr:jget('cedi-tracker-thr-v1'+s,null)};
}
$('bkpAll').onclick=function(){
 try{
  var ps=shareable().map(readProf),data={app:'Cedi Tracker',all:1,exported:today(),name:uname,profiles:ps};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='cedi-tracker-backup-all-profiles-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(u)},4000);
  ps.forEach(function(p){lsSet('cedi-tracker-lastbk-v1'+sfxFor(p.id),JSON.stringify({d:today(),n:Array.isArray(p.items)?p.items.length:0,z:''}))});
  $('bmsg').textContent='Backup saved for '+ps.length+' profiles. Profiles with their own PIN are not included; back those up from inside each one.';updBk();
 }catch(e){$('bmsg').textContent='Could not create backup file.'}
};
function restoreAll(ra){
 var when=DRE.test(ra.exported)?ra.exported:'unknown date',list=[];
 try{ra.profiles.slice(0,3).forEach(function(q){list.push({q:q,c:cleanBackup(Object.assign({},q,{app:'Cedi Tracker'}))})})}
 catch(e){$('bmsg').textContent='Could not use this file. Choose a valid Cedi Tracker backup. Your current data was not changed.';return}
 if(!list.length){$('bmsg').textContent='This backup has no profiles.';return}
 if(!ask('This will replace the data of the matching profiles that share this PIN with the backup from '+when+' ('+list.length+' profile'+(list.length>1?'s':'')+'). Profiles with their own PIN are not touched.'))return;
 var done=0,skip=0;
 function nd(t){return function(x){return !DEF[t].some(function(d){return d.toLowerCase()===x.toLowerCase()})}}
 list.forEach(function(e){
  var nm=String(e.q.name||'Profile').trim().slice(0,30)||'Profile',c=e.c,t=shareable().filter(function(p){return p.name.toLowerCase()===nm.toLowerCase()})[0];
  if(!t){
   var id=['p1','p2','p3'].filter(function(i){return !PR.list.some(function(p){return p.id===i})})[0];
   if(!id||PR.list.length>=3){skip++;return}
   t={id:id,name:nm};PR.list.push(t);jset(PK,PR);
  }
  var s=sfxFor(t.id);
  jset('cedi-tracker-v1'+s,c.items);jset('cedi-tracker-cats-v1'+s,{out:c.cats.out.filter(nd('out')),in:c.cats.in.filter(nd('in'))});
  jset('cedi-tracker-budgets-v1'+s,c.budgets);jset('cedi-tracker-debts-v1'+s,c.debts);jset('cedi-tracker-open-v1'+s,c.open);
  jset('cedi-tracker-expect-v1'+s,c.expect);jset('cedi-tracker-recur-v1'+s,c.rec);jset('cedi-tracker-thr-v1'+s,c.thr||[250,500,750]);
  jset('cedi-tracker-bflags-v1'+s,{});if(c.cur)lsSet('cedi-tracker-cur-v1'+s,c.cur);
  jset('cedi-tracker-lastbk-v1'+s,{d:today(),n:c.items.length,z:''});done++;
 });
 if(typeof ra.name==='string'&&ra.name.trim()&&!mainName&&!AP.owner){mainName=ra.name.trim().slice(0,60);lsSet(NK,mainName);uname=mainName;showGreet()}
 reloadData();setProfileUI();rtr();updPinKind();
 $('bmsg').textContent='Restored '+done+' profile'+(done===1?'':'s')+'.'+(skip?' '+skip+' skipped because there was no room for another profile.':'');
}

/* ---------- quick add ---------- */
var QA=[];
function rqa(){
 var cut=addDays(today(),-60),ok=items.filter(function(x){return !fixed(x)&&x.d>=cut&&allCats(x.t).indexOf(x.c)>=0&&x.c!=='Loan'&&x.c!=='Debt'&&x.c!=='Debt repayment'}).sort(function(a,b){return b.id-a.id}),cnt=dict();
 function key(x){return x.t+'|'+x.c+'|'+x.a+'|'+(x.n||'')}
 ok.forEach(function(x){var k=key(x);if(!cnt[k])cnt[k]={x:x,n:0};cnt[k].n++});
 QA=[];
 if(ok[0])QA.push({x:ok[0],last:1});
 Object.keys(cnt).filter(function(k){return cnt[k].n>=2&&(!ok[0]||k!==key(ok[0]))}).sort(function(a,b){return cnt[b].n-cnt[a].n}).slice(0,4).forEach(function(k){QA.push({x:cnt[k].x})});
 $('qawrap').hidden=!QA.length;
 $('qa').innerHTML=QA.map(function(q,i){return '<button class="pd" data-q="'+i+'">'+(q.last?'Repeat last: ':'')+(q.x.t==='in'?'+':'-')+fmt(q.x.a)+' '+esc(q.x.c)+'</button>'}).join('');
 document.querySelectorAll('[data-q]').forEach(function(b){b.onclick=function(){
  var x=QA[+b.dataset.q].x;if(editId)endEdit();
  setType(x.t);fillCats(x.c);$('amt').value=x.a;$('note').value=x.n||'';$('date').value=today();$('amt').focus();
 }});
}

/* ---------- search entries ---------- */
function rq(){
 var q=$('qs').value.trim().toLowerCase(),t=$('qt').value;
 if(!q&&!t){$('qsum').textContent='Type something to search, or choose Received or Spent to list those entries.';$('qlist').innerHTML='';return}
 var r=items.filter(function(x){
  if(t&&x.t!==t)return false;
  if(!q)return true;
  return (x.c+' '+(x.n||'')+' '+lname(x)+' '+x.a+' '+fmt(x.a)+' '+x.d).toLowerCase().indexOf(q)>=0;
 }).sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0}),i=0,o=0;
 r.forEach(function(x){if(x.ob)return;if(x.t==='in')i+=x.a;else o+=x.a});
 $('qsum').textContent=r.length?r.length+' found · In '+CUR+fmt(i)+' · Out '+CUR+fmt(o)+(r.length>50?' · showing the newest 50':''):'No matching entries.';
 $('qlist').innerHTML=r.slice(0,50).map(function(x){return eRow(x,true)}).join('');
 bindEntryBtns('#qlist');
}
$('qs').oninput=rq;$('qt').onchange=rq;

/* ---------- recurring entries ---------- */
var RDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function findRec(id){return REC.filter(function(r){return String(r.id)===String(id)})[0]}
function recLatest(r,t){
 var p=t.split('-'),y=+p[0],m=+p[1]-1;
 if(r.f==='w')return addDays(t,-((new Date(y,m,+p[2]).getDay()-r.dy+7)%7));
 function at(yy,mm){return yy+'-'+pad(mm+1)+'-'+pad(Math.min(r.dy,new Date(yy,mm+1,0).getDate()))}
 var c=at(y,m);if(c<=t)return c;return m?at(y,m-1):at(y-1,11);
}
function recDue(r){var l=recLatest(r,today());return l>=r.s&&l>(r.l||'')?l:''}
function recAdd(r){
 var d=recDue(r);if(!d)return;
 if(r.t==='in'&&(r.c==='Savings'||r.c==='Investment')&&r.a>fundTotal(r.c)+0.005){toast('Not added','You only have '+CUR+fmt(Math.max(fundTotal(r.c),0))+' in '+r.c.toLowerCase()+'.');return}
 var dt=d<addDays(today(),-BACK)?today():d;
 addEntry(r.t,r.a,r.c,r.n,dt);r.l=d;rsave();
 if(r.t==='out')checkBudget(r.c,dt.slice(0,7),false);
 renderAll();
}
function recFill(){
 var t=$('rt').value,old=$('rc').value;
 var l=allCats(t).filter(function(c){return c!=='Loan'&&c!=='Debt'&&c!=='Debt repayment'&&!(t==='in'&&(c==='Savings'||c==='Investment'))});
 $('rc').innerHTML=l.map(function(c){return '<option'+(c===old?' selected':'')+'>'+esc(c)+'</option>'}).join('');
}
function recDays(){
 var h='';
 if($('rf').value==='w')[1,2,3,4,5,6,0].forEach(function(d){h+='<option value="'+d+'">'+RDAYS[(d+6)%7]+'</option>'});
 else for(var i=1;i<=31;i++)h+='<option value="'+i+'">Day '+i+' of the month'+(i>28?' (last day in shorter months)':'')+'</option>';
 $('rd').innerHTML=h;
}
function rrec(){
 recFill();
 $('rlist').innerHTML=REC.length?REC.map(function(r){return '<div class="row"><span><b>'+esc(r.c)+'</b>'+(r.n?' · '+esc(r.n):'')+'<small>'+(r.t==='in'?'Money in':'Money out')+' · '+(r.f==='w'?'Every '+RDAYS[(r.dy+6)%7]:'Day '+r.dy+' of each month')+'</small></span><span class="'+(r.t==='in'?'in':'out')+'"><b>'+fmt(r.a)+'</b><button aria-label="Delete recurring entry" data-rd="'+r.id+'">×</button></span></div>'}).join(''):'<p class="empty">Nothing recurring yet.</p>';
 document.querySelectorAll('[data-rd]').forEach(function(b){b.onclick=function(){
  var r=findRec(b.dataset.rd);if(!r||!ask('Delete the recurring entry "'+r.c+'" ('+CUR+fmt(r.a)+')? Entries already added stay.'))return;
  REC=REC.filter(function(y){return y!==r});rsave();renderAll();
 }});
}
$('rt').onchange=recFill;$('rf').onchange=recDays;
$('rsave').onclick=function(){
 var m=$('rmsg'),a=cents(parseFloat($('ra').value)),c=$('rc').value;m.textContent='';
 if(!c){m.textContent='Choose a category.';return}
 if(!(a>=0.01)){m.textContent='Enter an amount of 0.01 or more.';$('ra').focus();return}
 REC.push({id:Date.now()+Math.random(),t:$('rt').value,a:a,c:c,n:$('rn').value.trim(),f:$('rf').value,dy:+$('rd').value,s:today(),l:''});
 rsave();$('ra').value='';$('rn').value='';renderAll();
 toast('Recurring entry added','You will be asked on the due day. Nothing is added by itself.');
};

/* ---------- render all & start ---------- */
function resetPh(){$('amt').placeholder='Amount ('+CUR+')';$('damt').placeholder='Amount ('+CUR+')';$('dwho').placeholder="Person's name"}
function renderAll(){resetPh();render();rd();rsum();rf('sav','Savings');rf('inv','Investment');fillYears();rx();rrec();rqa();rq();updBk();rPrompts();rtr();if(!$('debtbox').hidden)fillDsel()}
applyCur();applyHide();fillCats();fillBCats();setProfileUI();updStat();updBio();recDays();
renderAll();showGreet();showPage('home');updPinKind();
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
var swf=null;try{swf=JSON.parse(sessionStorage.getItem(SWK));sessionStorage.removeItem(SWK)}catch(e){}
if(swf&&LK&&swf.g===PG(AP)&&Date.now()-swf.t<15000)unlock();else showLock();
refreshRates();try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
