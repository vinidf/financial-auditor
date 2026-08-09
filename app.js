const STORAGE_KEY='financial_auditor_v6';

const PAIN_EXAMPLES=[
  'e.g. I keep guessing water temperature and want precise control without a separate thermometer.',
  'e.g. My current chair becomes uncomfortable during long work sessions.',
  'e.g. I waste time moving one charger between rooms every day.',
  'e.g. My current storage is crowded, so frequently used items are hard to reach.',
  'e.g. I cannot hear calls clearly in noisy places with my current headphones.',
  'e.g. Cleaning this area manually takes longer than I am willing to spend each week.',
  'e.g. My current bag does not safely fit everything I regularly carry.',
  'e.g. The room is too dark for reading comfortably at night.',
  'e.g. My current tool cannot perform a task I now need to do regularly.',
  'e.g. I keep using an inconvenient workaround every time I do this task.'
];

const QUESTIONS=[
  {id:'pain',type:'text',text:'What pain or problem would this purchase solve?',hint:'Describe the concrete friction, limitation or inconvenience in 140 characters or fewer.',maxLength:140},
  {id:'need',group:1,text:'Does this solve a real need right now?',hint:'If you did not buy this today, what would actually break or stop working?',options:[['Yes, needed',9],['Sort of',2],['Can wait',-6]]},
  {id:'own',group:1,text:'Compared with what you already own, what does this purchase add?',hint:'Consider whether it solves a real limitation or mostly repeats an existing function.',options:[['A genuinely new capability or solves a real limitation',8],['A meaningful upgrade, but mostly the same function',4],['Mostly duplicates something I already own',-9]]},
  {id:'replacement',group:1,text:'Will this purchase make something you already own unnecessary?',hint:'If so, decide what will happen to the old item before buying.',options:[['No, it will not replace anything',0],['Yes, and I already have a clear destination for the old item',0],['Yes, but I do not know what I will do with the old item',-6]]},
  {id:'pattern',group:1,text:'Have you bought similar items recently that remain unused?',hint:'Recent unused purchases are a strong warning sign.',options:[['None',0],['One',-5],['Several',-12]]},
  {id:'alternative',group:1,text:'Could you solve the same problem for less?',hint:'Think of at least one cheaper alternative before answering.',options:[['No, I compared options',5],['I have not checked seriously',-3],['Yes, there is a viable cheaper option',-11]]},
  {id:'lasting_use',group:2,text:'How likely are you to keep using this after the initial novelty wears off?',hint:'Think beyond the first few weeks and choose the most realistic pattern.',options:[['Regularly for many months',12],['Occasionally or uncertain',1],['Probably only for a short time',-12]]},
  {id:'price',group:2,text:'Is the price fair for your situation?',hint:'Consider both market price and your current budget.',options:[['Fair and reasonable',4],['Acceptable',1],['Too high',-9]]},
  {id:'habit',group:3,text:'Does this support a productive habit?',hint:'Does it support health, work or skill development?',options:[['Yes, directly',5],['Indirectly',2],['No',-3]]},
  {id:'consideration',group:3,text:'How long have you been considering this purchase?',hint:'Count from when you first seriously considered buying it.',options:[['More than a week',5],['1 to 7 days',0],['Less than 24 hours',-10]]},
  {id:'budget',group:3,text:'How comfortably does it fit this month?',hint:'Consider bills and financial goals competing for this money.',options:[['Comfortably',8],['It will be tight',-8],['It does not fit',-18]]}
];

const CATEGORY_LABEL={essential:'Essential',tool:'Tool / Productive Equipment',leisure:'Leisure / Aesthetics / Convenience',thirdparty:'Help / Loan to Third Party'};
let answers={};
let step=0;
let painExample='';
let lastPainExample=-1;

const $=id=>document.getElementById(id);
const escapeHtml=value=>{const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML};

function pickPainExample(){
  let index=Math.floor(Math.random()*PAIN_EXAMPLES.length);
  if(PAIN_EXAMPLES.length>1&&index===lastPainExample)index=(index+1)%PAIN_EXAMPLES.length;
  lastPainExample=index;
  return PAIN_EXAMPLES[index];
}

function quarantineFor(value){
  if(value<=50)return '2 hours';
  if(value<=100)return '6 hours';
  if(value<=150)return '1 day';
  if(value<=200)return '2 days';
  if(value<=300)return '3 days';
  if(value<=400)return '5 days';
  if(value<=500)return '7 days';
  if(value<=700)return '10 days';
  if(value<1000)return '15 days';
  return '30 days';
}

function loadHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]}}
function saveHistory(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}

function beginAudit(){
  const item=$('itemName').value.trim();
  const value=Number($('itemValue').value);
  if(!item||!Number.isFinite(value)||value<=0){alert('Fill in a valid item and amount.');return}
  answers={};
  step=0;
  painExample=pickPainExample();
  $('startBtn').style.display='none';
  $('resultEl').classList.remove('active');
  $('quizCard').style.display='block';
  renderQuestion();
}

function renderQuestion(){
  const q=QUESTIONS[step];
  $('quizStepLabel').textContent=`Question ${step+1} of ${QUESTIONS.length}`;
  $('quizFill').style.width=`${step/QUESTIONS.length*100}%`;
  $('quizBack').disabled=step===0;

  if(q.type==='text'){
    const current=answers[q.id]?.label||'';
    $('quizQuestion').innerHTML=`
      <div class="qtext">${escapeHtml(q.text)}</div>
      <div class="hint">${escapeHtml(q.hint)}</div>
      <textarea id="textAnswer" maxlength="${q.maxLength}" rows="4" style="width:100%;resize:vertical;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:500 15px var(--sans);padding:14px 15px;border-radius:12px;line-height:1.45" placeholder="${escapeHtml(painExample)}">${escapeHtml(current)}</textarea>
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:8px">
        <span id="charCount" style="font-size:12px;color:var(--muted)">${current.length}/${q.maxLength}</span>
        <button class="btn-ghost" type="button" id="textContinue">Continue</button>
      </div>`;
    const input=$('textAnswer');
    const count=$('charCount');
    input.addEventListener('input',()=>{count.textContent=`${input.value.length}/${q.maxLength}`});
    $('textContinue').addEventListener('click',()=>{
      const value=input.value.trim();
      if(!value){alert('Write the pain or problem this purchase would solve.');input.focus();return}
      answers[q.id]={label:value,weight:0,type:'text'};
      step++;
      renderQuestion();
    });
    input.focus();
    return;
  }

  $('quizQuestion').innerHTML=`
    <div class="qtext">${escapeHtml(q.text)}</div>
    <div class="hint">${escapeHtml(q.hint)}</div>
    <div class="opts">${q.options.map((option,index)=>`<button class="opt" type="button" data-answer="${index}">${escapeHtml(option[0])}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    const option=q.options[Number(button.dataset.answer)];
    answers[q.id]={label:option[0],weight:option[1],group:q.group};
    if(step<QUESTIONS.length-1){step++;renderQuestion()}else{finishAudit()}
  }));
}

function finishAudit(){
  $('quizCard').style.display='none';
  $('startBtn').style.display='block';
  $('startBtn').textContent='Audit Another Item';
  showResult();
}

function showResult(){
  const item=$('itemName').value.trim();
  const value=Number($('itemValue').value);
  const category=$('itemCategory').value;
  const pain=answers.pain?.label||'';
  let score=50;
  const groups={1:[],2:[],3:[]};

  QUESTIONS.forEach(q=>{
    if(q.type==='text')return;
    const answer=answers[q.id];
    if(!answer)return;
    score+=answer.weight;
    groups[q.group].push({label:`${q.text}: ${answer.label}`,weight:answer.weight});
  });
  score=Math.max(0,Math.min(100,score));

  let verdict='REJECTED',verdictClass='veto',status='REJECTED',color='var(--neg)';
  if(score>=80){verdict='STRONG BUY';verdictClass='strong';status='STRONG BUY';color='var(--pos)'}
  else if(score>=60){verdict='APPROVED';verdictClass='approved';status='APPROVED';color='var(--pos)'}
  else if(score>=40){verdict='PROCEED WITH CAUTION';verdictClass='caution';status='CAUTION ZONE';color='var(--warn)'}

  const negatives=QUESTIONS.filter(q=>q.type!=='text').map(q=>({q,answer:answers[q.id]})).filter(x=>x.answer&&x.answer.weight<0).sort((a,b)=>a.answer.weight-b.answer.weight);
  const quarantine=quarantineFor(value);
  const sectionTitles={1:'Technical Viability / Asset',2:'Cost-Benefit',3:'Behavior / Habit'};
  const sections=[1,2,3].map(group=>`<div class="section"><h3>${group}. ${sectionTitles[group]}</h3>${groups[group].map(f=>`<div class="factor"><span>${escapeHtml(f.label)}</span><span class="badge ${f.weight>0?'pos':f.weight<0?'neg':'zero'}">${f.weight>0?'+':''}${f.weight}</span></div>`).join('')}</div>`).join('');

  const rejectedDescription='This purchase is not sufficiently justified right now. Wait the recommended quarantine, then reassess whether the problem still matters and whether this is still the best solution.';
  const result=$('resultEl');
  result.innerHTML=`
    <div class="rhead">${escapeHtml(CATEGORY_LABEL[category])}</div>
    <div class="rtitle">${escapeHtml(item)}: R$ ${value.toFixed(2)}</div>
    <div class="score-row"><div class="score-bar"><div class="score-fill" id="scoreFill" style="background:${color}"></div></div><div class="score-meta"><span>Score <strong>${score}/100</strong></span><span>${status}</span></div></div>
    <div class="tips" style="margin-top:0;margin-bottom:20px"><h4>🎯 Pain / problem to solve</h4><p>${escapeHtml(pain)}</p></div>
    ${sections}
    <div class="verdict ${verdictClass}"><div class="vlabel">${verdict}</div><div class="vsub">Final score: ${score}/100 · Neutral baseline: 50</div><ol><li>${verdictClass==='veto'?escapeHtml(rejectedDescription):'Respect the quarantine before making the final decision.'}</li>${negatives[0]?`<li>Main concern: ${escapeHtml(negatives[0].q.text.toLowerCase())}</li>`:''}</ol></div>
    <div class="tips"><h4>💡 Smart Tips</h4><p>⏳ <strong>Purchase quarantine:</strong> Wait ${quarantine} before buying. If it still feels worthwhile afterward, reassess it calmly.</p>${negatives[0]?`<p>🧭 <strong>Main reflection:</strong> ${escapeHtml(negatives[0].q.hint)}</p>`:''}<p>💳 <strong>Friction is your friend:</strong> Remove saved cards from apps and browsers to interrupt impulse purchases.</p></div>
    <button class="btn result-redo" type="button" id="resultRedo">Audit Again</button>`;
  result.classList.add('active');
  setTimeout(()=>$('scoreFill').style.width=`${score}%`,40);
  $('resultRedo').addEventListener('click',()=>redo({item,value:value.toFixed(2),category,pain}));
  result.scrollIntoView({behavior:'smooth',block:'start'});

  const history=loadHistory();
  history.push({item,value:value.toFixed(2),category,pain,score,verdict,quarantine,date:new Date().toLocaleDateString('en-US')});
  saveHistory(history);
  renderHistory();
}

function redo(entry){
  $('itemName').value=entry.item||'';
  $('itemValue').value=entry.value||'';
  $('itemCategory').value=entry.category||'leisure';
  $('resultEl').classList.remove('active');
  answers={};
  if(entry.pain)answers.pain={label:entry.pain,weight:0,type:'text'};
  step=0;
  painExample=pickPainExample();
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{
    $('startBtn').style.display='none';
    $('quizCard').style.display='block';
    renderQuestion();
  },250);
}

function normalizeHistoryDate(date){
  const value=String(date||'');
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(value)){
    const [day,month,year]=value.split('/').map(Number);
    return `${month}/${day}/${year}`;
  }
  return value;
}

function historyCopyText(entry){
  return `${entry.item||''} - R$ ${entry.value||''} - ${entry.score}/100 - Quarantine: ${entry.quarantine||''} - ${normalizeHistoryDate(entry.date)} - Reason: ${entry.pain||''}`;
}

async function copyHistoryEntry(index,button){
  const entry=loadHistory()[index];
  if(!entry)return;
  const text=historyCopyText(entry);
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(text);
    }else{
      const area=document.createElement('textarea');
      area.value=text;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    const previous=button.textContent;
    button.textContent='Copied';
    setTimeout(()=>{button.textContent=previous},1200);
  }catch{
    alert('Could not copy this item.');
  }
}

function renderHistory(){
  const history=loadHistory(),list=$('historyList');
  if(!history.length){list.innerHTML='<div class="empty">No analysis recorded yet.</div>';return}
  list.innerHTML=history.slice().reverse().map((entry,reverseIndex)=>{
    const index=history.length-1-reverseIndex;
    const copyLine=historyCopyText(entry);
    return `<div class="history-item"><div style="min-width:0"><div class="history-title">${escapeHtml(copyLine)}</div><div class="history-meta">${escapeHtml(entry.verdict||'')}</div></div><div class="history-actions"><button class="history-redo" type="button" data-copy="${index}">Copy</button><button class="history-redo" type="button" data-redo="${index}">Audit Again</button><button class="history-delete" type="button" data-delete="${index}" aria-label="Delete">×</button></div></div>`;
  }).join('');
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',()=>copyHistoryEntry(Number(button.dataset.copy),button)));
  document.querySelectorAll('[data-redo]').forEach(button=>button.addEventListener('click',()=>redo(loadHistory()[Number(button.dataset.redo)])));
  document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{const current=loadHistory();current.splice(Number(button.dataset.delete),1);saveHistory(current);renderHistory()}));
}

$('startBtn').addEventListener('click',beginAudit);
$('quizBack').addEventListener('click',()=>{if(step>0){step--;renderQuestion()}});
$('clearHistory').addEventListener('click',()=>{if(confirm('Clear all history?')){saveHistory([]);renderHistory()}});
renderHistory();