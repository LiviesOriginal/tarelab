(() => {
  const STORAGE_KEY = "biz-idea-gallery-v1";
  const partners = ["partnerA", "partnerB"];
  const seed = {
    ideas: [
      {id:"seed-1",title:"Build a signature experience",description:"Give customers a memorable moment they’ll want to share.",category:"Brand & Growth",author:"Partner A",art:"pink",votes:{},createdAt:1},
      {id:"seed-2",title:"Launch a monthly drop",description:"Create anticipation with a limited monthly release and a small launch ritual.",category:"Marketing",author:"Partner B",art:"blue",votes:{},createdAt:2},
      {id:"seed-3",title:"Partner with local makers",description:"Collaborate with complementary small businesses to reach new audiences.",category:"Growth",author:"Partner A",art:"cream",votes:{},createdAt:3},
      {id:"seed-4",title:"A behind-the-scenes series",description:"Show the people, process, and little decisions that make the business distinct.",category:"Content",author:"Partner B",art:"lilac",votes:{},createdAt:4},
      {id:"seed-5",title:"Create a customer thank-you ritual",description:"Make repeat customers feel recognized with a thoughtful, consistent gesture.",category:"Customer Experience",author:"Partner A",art:"green",votes:{},createdAt:5}
    ],
    shortlist: [
      {id:"curated-1",title:"Define the signature offer",description:"Keep the core offer clear, distinctive, and easy to explain.",category:"Strategy",source:"curated"},
      {id:"curated-2",title:"Build a consistent brand voice",description:"Use a recognizable tone across customer touchpoints.",category:"Brand",source:"curated"},
      {id:"curated-3",title:"Map the first 90 days",description:"Turn the big picture into a realistic first-quarter action plan.",category:"Operations",source:"curated"}
    ],
    activePartner:"partnerA", seen:{partnerA:[],partnerB:[]}
  };
  let state;
  try { const saved=localStorage.getItem(STORAGE_KEY); state=saved?{...seed,...JSON.parse(saved)}:structuredClone(seed); }
  catch (_) { state=structuredClone(seed); }
  if (!state.seen) state.seen={partnerA:[],partnerB:[]};
  if (!state.shortlist) state.shortlist=structuredClone(seed.shortlist);
  if (!state.ideas) state.ideas=structuredClone(seed.ideas);
  if (!state.activePartner) state.activePartner="partnerA";
  const $=selector=>document.querySelector(selector);
  const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}};
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const remaining=()=>state.ideas.filter(idea=>!state.seen[state.activePartner].includes(idea.id)&&!state.shortlist.some(item=>item.id===idea.id));
  const artClasses=["art-pink","art-blue","art-cream","art-lilac","art-green"];
  function renderGallery(){
    const items=remaining(); $("#gallery-count").textContent=String(items.length).padStart(2,"0");
    document.querySelectorAll(".partner-option").forEach(button=>{const active=button.dataset.partner===state.activePartner;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
    if(!items.length){$("#swipe-stage").innerHTML='<div class="empty-gallery"><strong>You’re all caught up.</strong><br>Switch partners or add a new idea to keep the conversation going.</div>';$("#pass-button").disabled=true;$("#like-button").disabled=true;$("#vote-note").textContent="Every idea in this session has been reviewed by this partner.";return;}
    $("#pass-button").disabled=false;$("#like-button").disabled=false;
    const idea=items[0], art=artClasses[Math.abs((idea.artIndex??idea.createdAt??0))%artClasses.length];
    $("#swipe-stage").innerHTML='<article class="idea-card"><div class="idea-art '+art+'"><span>IDEA<br>NO. '+String(idea.createdAt||1).padStart(2,"0")+'</span></div><div class="idea-copy"><p class="idea-category">'+esc(idea.category)+'</p><h2>'+esc(idea.title)+'</h2><p>'+esc(idea.description)+'</p></div></article>';
    $("#vote-note").textContent=(idea.author?"Submitted by "+idea.author+" · ":"")+"Reviewing as "+(state.activePartner==="partnerA"?"Partner A":"Partner B");
  }
  function renderShortlist(){
    $("#shortlist-count").textContent=String(state.shortlist.length).padStart(2,"0");
    if(!state.shortlist.length){$("#shortlist-items").innerHTML='<div class="shortlist-empty">Your shortlist is ready for its first idea.<br>When you both like an idea, it will appear here.</div>';return;}
    $("#shortlist-items").innerHTML=state.shortlist.map(item=>'<article class="shortlist-item"><div class="shortlist-thumb" aria-hidden="true">✳</div><div><h3>'+esc(item.title)+'</h3><p>'+esc(item.description)+'</p></div><span class="status">'+(item.source==="mutual"?"Mutual like":"Curated")+'</span></article>').join("");
  }
  function vote(liked){
    const idea=remaining()[0];if(!idea)return;idea.votes=idea.votes||{};state.seen[state.activePartner].push(idea.id);idea.votes[state.activePartner]=liked;
    if(partners.every(partner=>idea.votes[partner]===true)&&!state.shortlist.some(item=>item.id===idea.id)){state.shortlist.push({...idea,source:"mutual"});save();renderGallery();renderShortlist();$("#mutual-message").textContent="“"+idea.title+"” was liked by both partners and added to your Short List.";if(typeof $("#mutual-dialog").showModal==="function")$("#mutual-dialog").showModal();return;}
    save();renderGallery();renderShortlist();
  }
  $(".partner-switch").addEventListener("click",event=>{const button=event.target.closest("[data-partner]");if(!button)return;state.activePartner=button.dataset.partner;save();renderGallery();});
  $("#pass-button").addEventListener("click",()=>vote(false));$("#like-button").addEventListener("click",()=>vote(true));$("#close-dialog").addEventListener("click",()=>$("#mutual-dialog").close());
  $("#idea-form").addEventListener("submit",event=>{event.preventDefault();const data=new FormData(event.currentTarget),title=String(data.get("title")||"").trim(),description=String(data.get("description")||"").trim();if(!title||!description)return;const idea={id:"idea-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),title,description,category:String(data.get("category")||"Other"),author:state.activePartner==="partnerA"?"Partner A":"Partner B",votes:{},createdAt:state.ideas.length+1,artIndex:state.ideas.length};state.ideas.push(idea);save();renderGallery();renderShortlist();$("#form-feedback").textContent="Idea added to the gallery. Your partner can review it next.";event.currentTarget.reset();});
  renderGallery();renderShortlist();
})();