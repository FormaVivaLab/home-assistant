const sections = [
  ['home','HOME','⌂'],['overview','Panoramica','◫'],['all','Tutti','●'],['rooms','Stanze','▦'],['light','Luci','☼'],['climate','Clima','♨'],
  ['switch','Prese','⌁'],['cover','Tapparelle','▤'],['vacuum','Pulizia','◉'],['security','Sicurezza','◇'],['media','Media','▷'],['energy','Energia','ϟ'],['sensor','Sensori','◎']
];
const domainMap = {overview:null,all:null,rooms:null,light:['light'],climate:['climate','fan'],switch:['switch','input_boolean'],cover:['cover'],vacuum:['vacuum'],security:['alarm_control_panel','binary_sensor','lock','camera'],media:['media_player','remote'],energy:['sensor'],sensor:['sensor','binary_sensor']};
const icons = {light:'☼',climate:'♨',fan:'✣',switch:'⌁',input_boolean:'⌁',cover:'▤',vacuum:'◉',lock:'◇',binary_sensor:'◎',camera:'▣',alarm_control_panel:'◇',sensor:'◎',media_player:'▷',remote:'⌁',weather:'☁',device_tracker:'⌖',number:'#',select:'≡'};
const stateLabels = {on:'Acceso',off:'Spento',unavailable:'Non disponibile',unknown:'Sconosciuto',cleaning:'In pulizia',docked:'In base',locked:'Bloccata',unlocked:'Sbloccata',home:'In casa',not_home:'Fuori casa'};
let entities = [], homeEntityIds = new Set(), active = 'home', query = '';

const $ = id => document.getElementById(id);
const domain = entity => entity.entity_id.split('.')[0];
const friendly = entity => entity.attributes.friendly_name || entity.entity_id.split('.')[1].replaceAll('_',' ');
const isOn = entity => ['on','cleaning','heat','cool','home','open','unlocked'].includes(entity.state);

function relativeRoot(){
  const path = location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/\/[^/]*$/,'/');
  return path;
}
async function api(endpoint, options){
  const response = await fetch(`${relativeRoot()}api/${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Errore di comunicazione');
  return data;
}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}

function renderNav(){
  $('nav').innerHTML = sections.map(([id,label,icon])=>`<button class="nav-button ${active===id?'active':''}" data-id="${id}"><span>${icon}</span>${label}</button>`).join('');
  document.querySelectorAll('.nav-button').forEach(b=>b.onclick=()=>{active=b.dataset.id;renderNav();render()});
}
function relevant(){
  let list = entities.filter(e=>!['automation','script','scene','update','zone','sun','event','button'].includes(domain(e)));
  if(active==='home') list=list.filter(e=>homeEntityIds.has(e.entity_id));
  else if(active==='rooms') list=list.filter(e=>e.attributes.area_id||e.attributes.device_class==='temperature'||e.attributes.device_class==='humidity');
  else if(active==='energy') list=list.filter(e=>domain(e)==='sensor' && ['power','energy','battery'].includes(e.attributes.device_class));
  else if(active==='all') list=list;
  else if(active!=='overview') list=list.filter(e=>(domainMap[active]||[]).includes(domain(e)));
  else list=list.filter(e=>['light','climate','fan','switch','input_boolean','cover','vacuum','lock','alarm_control_panel','media_player'].includes(domain(e)));
  if(query) list=list.filter(e=>(friendly(e)+' '+e.entity_id).toLowerCase().includes(query));
  return list;
}
function renderSummary(){
  const lights=entities.filter(e=>domain(e)==='light'&&e.state==='on').length;
  const temp=entities.find(e=>e.attributes.device_class==='temperature'&&!['unknown','unavailable'].includes(e.state));
  const security=entities.filter(e=>['lock','alarm_control_panel','binary_sensor'].includes(domain(e))&&isOn(e)).length;
  const power=entities.find(e=>e.attributes.device_class==='power'&&!['unknown','unavailable'].includes(e.state));
  const items=[['Luci accese',lights,'in questo momento'],['Temperatura',temp?`${temp.state} ${temp.attributes.unit_of_measurement||'°C'}`:'—',temp?friendly(temp):'nessun sensore'],['Avvisi',security,security?'da controllare':'tutto tranquillo'],['Potenza',power?`${power.state} ${power.attributes.unit_of_measurement||'W'}`:'—',power?friendly(power):'nessun sensore']];
  $('summary').innerHTML=items.map(([name,value,note],i)=>`<article class="summary-card"><div class="top"><span>${name}</span><span>${['☼','♨','◇','ϟ'][i]}</span></div><b>${value}</b><em>${note}</em></article>`).join('');
}
function card(entity){
  const d=domain(entity), controllable=['light','switch','input_boolean','vacuum','lock','cover','media_player','fan'].includes(d), on=isOn(entity);
  const unit=entity.attributes.unit_of_measurement||'';
  return `<article class="device-card ${on?'on':''}" data-entity="${entity.entity_id}"><div class="device-top"><div class="device-icon">${icons[d]||'·'}</div>${controllable?'<button class="toggle" aria-label="Cambia stato"></button>':''}</div><div class="device-name">${friendly(entity)}</div><div class="device-state">${stateLabels[entity.state]||entity.state} ${unit}</div></article>`;
}
function render(){
  const meta=sections.find(x=>x[0]===active); $('pageTitle').textContent=meta[1]; $('sectionTitle').textContent=active==='overview'?'Stato della casa':meta[1];
  renderSummary(); const list=relevant(); $('cards').innerHTML=list.length?list.map(card).join(''):'<div class="empty">Nessun dispositivo trovato in questa sezione.</div>';
  document.querySelectorAll('.toggle').forEach(btn=>btn.onclick=()=>toggle(btn.closest('.device-card').dataset.entity));
}
async function toggle(id){
  const entity=entities.find(e=>e.entity_id===id), d=domain(entity); let service=isOn(entity)?'turn_off':'turn_on';
  if(d==='vacuum') service=isOn(entity)?'return_to_base':'start';
  if(d==='lock') service=entity.state==='locked'?'unlock':'lock';
  if(d==='cover') service=entity.state==='open'?'close_cover':'open_cover';
  if(d==='media_player') service=isOn(entity)?'turn_off':'turn_on';
  try{await api('service',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({domain:d,service,data:{entity_id:id}})});showToast(`Comando inviato a ${friendly(entity)}`);setTimeout(load,700)}catch(e){showToast(e.message)}
}
async function load(){
  try{entities=await api('states');try{const imported=await api('lovelace?dashboard=dashboard-alessandro&view=home');homeEntityIds=new Set(imported.entity_ids||[])}catch(e){console.warn('Importazione HOME:',e.message)}$('connection').textContent=`Home Assistant connesso · ${homeEntityIds.size} da HOME`;$('connection').classList.add('online');$('updated').textContent=`Aggiornato ${new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}`;render()}
  catch(e){$('connection').textContent='Modalità anteprima';$('connection').classList.remove('online');if(!entities.length)entities=demo;render();}
}
const demo=[
  {entity_id:'light.soggiorno',state:'on',attributes:{friendly_name:'Luce soggiorno'}},{entity_id:'light.cucina',state:'off',attributes:{friendly_name:'Luce cucina'}},
  {entity_id:'climate.casa',state:'heat',attributes:{friendly_name:'Clima principale',temperature:21}},{entity_id:'vacuum.dreame_x50_ultra',state:'docked',attributes:{friendly_name:'Dreame X50 Ultra'}},
  {entity_id:'switch.macchina_caffe',state:'off',attributes:{friendly_name:'Macchina del caffè'}},{entity_id:'lock.porta_ingresso',state:'locked',attributes:{friendly_name:'Porta ingresso'}},
  {entity_id:'sensor.temperatura_soggiorno',state:'22.4',attributes:{friendly_name:'Temperatura soggiorno',device_class:'temperature',unit_of_measurement:'°C'}},{entity_id:'sensor.potenza_casa',state:'780',attributes:{friendly_name:'Consumo casa',device_class:'power',unit_of_measurement:'W'}}
];
$('search').oninput=e=>{query=e.target.value.toLowerCase();render()}; $('refresh').onclick=load;
$('themeButton').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';localStorage.setItem('fvh-theme',dark?'light':'dark')};
document.documentElement.dataset.theme=localStorage.getItem('fvh-theme')||'light';renderNav();load();setInterval(load,15000);
