(() => {
'use strict';
const pt=()=>localStorage.getItem('raftt-lang')==='pt',locale=()=>pt()?'pt-BR':'en-US';
const money=(value,currency='USD')=>new Intl.NumberFormat(locale(),{style:'currency',currency}).format(Number(value));
const ids=new Set(['raised-to-date','target-raise','amount','income','netWorth']);
function parse(el){if(el.value.trim()==='')return NaN;let s=el.value.replace(/[^\d.,+-]/g,'');const decimal=pt()?',':'.',group=pt()?'.':',';s=s.split(group).join('').replace(decimal,'.');return /^[+]?\d+(\.\d*)?$/.test(s)?Number(s):NaN;}
const currency=el=>['income','netWorth'].includes(el.id)?document.getElementById('currency')?.value||'USD':'USD';
function validate(el){const n=parse(el),min=Number(el.dataset.moneyMin||0),max=el.dataset.moneyMax?Number(el.dataset.moneyMax):Infinity;el.setCustomValidity(el.value.trim()===''?'':!Number.isFinite(n)?(pt()?'Informe um valor válido.':'Enter a valid amount.'):n<min||n>max?(pt()?`Informe um valor entre ${money(min,currency(el))} e ${Number.isFinite(max)?money(max,currency(el)):'o máximo permitido'}.`:`Enter an amount between ${money(min,currency(el))} and ${Number.isFinite(max)?money(max,currency(el)):'the allowed maximum'}.`):'');}
function attach(el){if(el.dataset.moneyReady)return;el.dataset.moneyReady='true';el.dataset.moneyMin=el.min;el.dataset.moneyMax=el.max;const initial=el.value;el.type='text';el.inputMode='decimal';el.removeAttribute('min');el.removeAttribute('max');el.removeAttribute('step');el.value=initial!==''&&Number.isFinite(Number(initial))?money(initial,currency(el)):'';validate(el);
el.addEventListener('focus',()=>{const n=parse(el);if(Number.isFinite(n))el.value=new Intl.NumberFormat(locale(),{useGrouping:false,maximumFractionDigits:2}).format(n);el.select();});
el.addEventListener('input',()=>validate(el),true);
el.addEventListener('blur',()=>{validate(el);const n=parse(el);if(Number.isFinite(n)&&el.checkValidity())el.value=money(n,currency(el));});}
function init(){document.querySelectorAll('input').forEach(el=>{if(ids.has(el.id))attach(el);});document.getElementById('currency')?.addEventListener('change',()=>{['income','netWorth'].forEach(id=>{const el=document.getElementById(id),n=el&&parse(el);if(el&&Number.isFinite(n)){el.value=money(n,currency(el));validate(el);}});});}
window.RafttNumbers={money,attach,value:el=>el.dataset.moneyReady?parse(el):Number(el.value),isMoney:el=>ids.has(el.id)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
