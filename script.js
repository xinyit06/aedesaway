/* Aedes Together: local-only weekly activity ledger. */
(() => {
'use strict';
// Retain the legacy storage key so existing residents keep their progress.
const KEY='jiran-challenge-v1', $=id=>document.getElementById(id);
const tasks=[['🪴','Empty flowerpots & saucers','Empty stagnant water from flowerpots and saucers. Small pools can become breeding sites.'],['💧','Check & clear clogged drains','Remove leaves and debris so water flows freely through drains.'],['🪣','Cover water storage containers','Keep containers tightly covered to prevent mosquitoes laying eggs.'],['♻️','Dispose of unused containers','Dispose of unused bottles, cans and plastic containers that collect rainwater.'],['🌿','Freshen up outdoor spaces','Clean outdoor areas and remove standing water from hidden corners.'],['🏡','Check gutters & roof drainage','Check only where safely accessible. Never climb or risk a fall.'],['🌷','Refresh your flower vases','Replace water and scrub containers to remove mosquito eggs.']];
const badges=[{id:'first',name:'First Step',icon:'🌱',color:'#bcdc9c',description:'A healthier neighbourhood starts with one small action.',requirement:'Complete your first prevention task.'},{id:'sweep',name:'Clean Sweep',icon:'✨',color:'#f1d482',description:'Seven small actions. A whole week of care.',requirement:'Complete all seven tasks in a week.'},{id:'star',name:'Consistency Star',icon:'⭐',color:'#c7bee9',description:'Your weekly habit is starting to shine.',requirement:'Complete two consecutive weeks.'},{id:'defender',name:'Dengue Defender',icon:'🛡️',color:'#a4d9d3',description:'A month of showing up for a safer neighbourhood.',requirement:'Complete four consecutive weeks.'},{id:'hero',name:'Community Hero',icon:'🏅',color:'#e9bd95',description:'Your care for your community really adds up.',requirement:'Reach 500 total points.'},{id:'champion',name:'Prevention Champion',icon:'👑',color:'#eace77',description:'An extraordinary milestone built on simple habits.',requirement:'Reach 1,000 total points.'}];
const samples=[['Aisyah Rahman','Taman Melati',1280,12],['Daniel Tan','Taman Desa',1140,10],['Priya Kumar','Taman Bukit Indah',980,9],['Amir Hakim','Taman Melati',860,8],['Mei Ling','Taman Desa',750,7],['Siti Nurhaliza','Taman Setia',620,6],['Ravi Chandran','Taman Bukit Indah',490,5],['Nur Farah','Taman Setia',340,4],['Jason Lim','Taman Melati',210,3],['Hana Abdullah','Taman Desa',90,1]];
// Monday-based local calendar dates; UTC arithmetic avoids DST week-length errors.
function weekKey(date=new Date()){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
function previous(key){const d=new Date(key+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-7);return d.toISOString().slice(0,10);}
const fresh=()=>({version:1,weeks:{},badges:[]});let state;
try{state=JSON.parse(localStorage.getItem(KEY));if(!state||state.version!==1||!state.weeks||typeof state.weeks!=='object'||Array.isArray(state.weeks)||!Array.isArray(state.badges))state=fresh();}catch{state=fresh();}
for(const [key,w] of Object.entries(state.weeks)){if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!w||!Array.isArray(w.tasks)){delete state.weeks[key];continue;}w.tasks=Array.from({length:7},(_,i)=>['completed','approved'].includes(w.tasks[i])?'completed':'todo');}
state.badges=state.badges.filter(id=>badges.some(b=>b.id===id));
let current='',mode='individual',timer,warned=false;
function ensureWeek(){current=weekKey();if(!state.weeks[current])state.weeks[current]={tasks:Array(7).fill('todo')};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{if(!warned){toast('Storage unavailable: progress lasts only for this session.');warned=true;}}}
function complete(w){return w.tasks.every(s=>s==='completed');}
// Recompute rewards from the ledger, so undo/recheck never duplicates points.
function metrics(){let points=0,run=0,best=0,last=null,total=0,weeks=0;const runs={};Object.keys(state.weeks).sort().filter(k=>k<=current).forEach(k=>{const w=state.weeks[k],count=w.tasks.filter(s=>s==='completed').length;total+=count;points+=count*10;if(complete(w)){run=last===previous(k)?run+1:1;last=k;runs[k]=run;best=Math.max(best,run);weeks++;points+=30+(run===2?20:run%4===0?40:0);}else{run=0;last=null;}});return{points,best,streak:runs[current]||runs[previous(current)]||0,total,weeks,count:state.weeks[current].tasks.filter(s=>s==='completed').length};}
function unlock(m){const conditions=[m.total>0,m.weeks>0,m.best>=2,m.best>=4,m.points>=500,m.points>=1000],earned=[];badges.forEach((b,i)=>{if(conditions[i]&&!state.badges.includes(b.id)){state.badges.push(b.id);earned.push(b.id);}});return earned;}
function toast(text){clearTimeout(timer);$('toast').textContent=text;$('toast').classList.add('show');timer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<30;i++){const c=document.createElement('i');c.className='confetti';c.style.left=Math.random()*100+'%';c.style.background=['#70ad8d','#f3d071','#b8d9b2','#dfb498'][i%4];c.style.animationDelay=Math.random()*.4+'s';$('confetti').append(c);setTimeout(()=>c.remove(),2400);}}
function renderTasks(){$('tasks').innerHTML=tasks.map(([icon,title,description],i)=>{const s=state.weeks[current].tasks[i];return `<div class="task ${s==='completed'?'done':''}"><input type="checkbox" id="task-${i}" data-task="${i}" ${s==='completed'?'checked':''} aria-describedby="desc-${i}"><span class="task-icon" aria-hidden="true">${icon}</span><div class="task-copy"><label for="task-${i}">${title}</label><p id="desc-${i}">${description}</p>${s==='completed'?'<span class="status">✓ Completed · uncheck to undo</span>':''}</div><span class="task-points">+10 pts</span></div>`;}).join('');}
function renderBadges(earned=[]){$('badgeCount').textContent=`${state.badges.length} / 6`;$('badges').innerHTML=badges.map(b=>{const yes=state.badges.includes(b.id);return `<button class="badge ${yes?'':'locked'} ${earned.includes(b.id)?'earned':''}" data-badge="${b.id}" aria-label="${b.name}, ${yes?'unlocked':'locked'}: view requirements"><span class="badge-art" style="--color:${b.color}">${b.icon}</span><b>${b.name}</b><small>${yes?'✓ Unlocked':'♧ Locked'}</small></button>`;}).join('');}
function renderLeaderboard(m){let entries;if(mode==='individual'){entries=samples.map(([name,area,points,streak])=>({name,area,points,streak}));entries.push({name:'You',area:'Your local community',points:m.points,streak:m.streak,you:true});}else entries=['Taman Melati','Taman Desa','Taman Bukit Indah','Taman Setia','Taman Harmoni','Taman Mutiara','Taman Ria','Taman Damai','Taman Aman','Taman Indah'].map((name,i)=>({name,area:`${42-i*3} demo neighbours`,points:[5360,4820,4170,3280,2840,2310,1970,1620,1280,940][i],streak:Math.max(1,12-i)}));entries.sort((a,b)=>b.points-a.points);entries.forEach((e,i)=>e.rank=i+1);const avatar=e=>`<span class="avatar" style="background:${['#e9dcb8','#d6e7d9','#eed5be','#dbe6ee','#e6dcef'][(e.rank-1)%5]}">${e.you?'Y':e.name.split(' ').slice(0,2).map(s=>s[0]).join('')}</span>`;
$('podium').innerHTML=[1,0,2].map(i=>{const e=entries[i];return `<article class="podium-card ${i===0?'gold':i===2?'bronze':'silver'}">${i===0?'<span class="crown" aria-hidden="true">♛</span>':''}<div class="podium-avatar">${avatar(e)}<span class="medal">${e.rank}</span></div><h3>${e.name}${e.you?' (you)':''}</h3><p>${e.area}</p><div class="podium-points">${e.points.toLocaleString()} <small>pts</small></div><small>🔥 ${e.streak}-week ${mode==='individual'?'streak':'team best'}</small></article>`;}).join('');
const you=entries.find(e=>e.you),shown=entries.slice(0,10);if(you&&you.rank>10)shown.push(you);
function achievement(e){if(mode!=='individual')return '🌿 Community care';if(e.you){const b=[...badges].reverse().find(b=>state.badges.includes(b.id));return b?b.icon+' '+b.name:'New neighbour';}return e.points>=1000?'👑 Champion':e.points>=500?'🏅 Hero':e.streak>=4?'🛡 Defender':e.streak>=2?'⭐ Consistency':'✨ Clean Sweep';}
$('rows').innerHTML=shown.map(e=>`<tr class="${e.you?'you':''}"><td>${e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:String(e.rank).padStart(2,'0')}</td><td><div class="resident">${avatar(e)}<div>${e.name}${e.you?'<span class="you-label">YOU</span>':''}<small>${e.area}</small></div></div></td><td><span class="tag">${achievement(e)}</span></td><td class="streak-cell">🔥 ${e.streak} weeks</td><td>${e.points.toLocaleString()}</td></tr>`).join('');$('nameHeading').textContent=mode==='individual'?'NEIGHBOUR':'NEIGHBOURHOOD';$('rank').textContent=you?`You're #${you.rank} of ${entries.length}. Top 10 + your position. Ties follow demo residents.`:'Fictional aggregate points · streak = best member · your points are not assigned to a team.';}
function render(earned=[]){ensureWeek();const m=metrics(),percent=Math.round(m.count/7*100);$('points').textContent=m.points.toLocaleString();$('summary').textContent=`${m.count} / 7 tasks`;$('streak').textContent=`${m.streak} ${m.streak===1?'week':'weeks'}`;$('best').textContent=`Personal best: ${m.best} weeks`;$('progressText').textContent=`${m.count} of 7 completed`;$('percent').textContent=percent+'%';$('fill').style.width=percent+'%';$('message').textContent=m.count===7?'Beautiful work! All tasks completed. +30 weekly bonus earned.':m.count===0?'A fresh week, a fresh chance to make a difference.':`${7-m.count} more small actions to your +30 point weekly bonus.`;$('encouragement').textContent=m.streak>=4?`${m.streak} weeks strong! Dengue Defender energy.`:m.streak>=2?`${m.streak} weeks strong. Your consistency makes a difference.`:m.streak===1?'One complete week! Come back next week to keep growing.':'Your next good habit starts with one small action.';const start=new Date(current+'T12:00:00'),end=new Date(start);end.setDate(end.getDate()+6);const format=d=>d.toLocaleDateString('en-MY',{day:'numeric',month:'short'});$('week').textContent=format(start)+' – '+format(end);renderTasks();renderBadges(earned);renderLeaderboard(m);}
function checkWeek(){if(weekKey()!==current){ensureWeek();save();render();toast('A new week is here. Your historical points and badges are saved.');return true;}return false;}
// Checkbox state is the source of truth; repeated events cannot add duplicate rewards.
$('tasks').addEventListener('change', e => {
  const input = e.target;
  if (!input.matches('[data-task]')) return;
  const index = Number(input.dataset.task);
  if (checkWeek()) return;
  if (!Number.isInteger(index) || index < 0 || index >= tasks.length) return;
  const next = input.checked ? 'completed' : 'todo';
  if (state.weeks[current].tasks[index] === next) return;
  const before = metrics().points;
  state.weeks[current].tasks[index] = next;
  const earned = unlock(metrics());
  save();
  render(earned);
  // Rendering replaces task inputs. Keep keyboard focus on the toggled task.
  $('task-' + index).focus({preventScroll:true});
  const difference = metrics().points - before;
  if (next === 'completed') {
    toast(`Task completed · +${difference} points${earned.length ? ' · Unlocked: ' + earned.map(id => badges.find(b => b.id === id).name).join(', ') : ''}`);
    celebrate();
  } else {
    toast(`Task undone · ${-difference} points removed, including any affected bonuses. Earned badges stay.`);
  }
});
document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));
$('badges').addEventListener('click',e=>{const button=e.target.closest('[data-badge]');if(!button)return;const b=badges.find(b=>b.id===button.dataset.badge),earned=state.badges.includes(b.id);$('badgeDetail').innerHTML=`<span class="badge-art" style="--color:${earned?b.color:'#dce1d7'}">${b.icon}</span><p class="eyebrow">${earned?'ACHIEVEMENT UNLOCKED':'YOUR NEXT LITTLE WIN'}</p><h2>${b.name}</h2><p>${b.description}</p><p class="notice">${b.requirement}</p><p>${earned?'Earned forever. Your badge stays even if you undo a task.':'Keep going — this badge is waiting for you.'}</p>`;$('badgeModal').showModal();});
['individual','neighbourhood'].forEach(id=>$(id).addEventListener('click',()=>{mode=id;['individual','neighbourhood'].forEach(key=>$(key).setAttribute('aria-pressed',String(key===mode)));checkWeek();renderLeaderboard(metrics());}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkWeek();});window.addEventListener('focus',checkWeek);setInterval(checkWeek,60000);
// Avoid silently overwriting a newer ledger from another open tab.
window.addEventListener('storage',e=>{if(e.key===KEY)location.reload();});
ensureWeek();unlock(metrics());render();save();
})();

