async function l(r,t,e,n){var a,s;const o=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:t||"gpt-4o-mini",messages:[{role:"system",content:"You are a concise summarizer. Output clear bullets. Preserve key facts, numbers, and names. Avoid fluff."},{role:"user",content:e}],temperature:n||.3,max_tokens:1e3})});if(!o.ok){const c=await o.text();throw new Error(`OpenAI API error: ${o.status} - ${c}`)}return((s=(a=(await o.json()).choices[0])==null?void 0:a.message)==null?void 0:s.content)||"No response generated"}async function p(r,t,e,n){var a,s,c;const o=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${t||"gemini-1.5-flash"}:generateContent?key=${r}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"You are a concise summarizer. Output clear bullets. Preserve key facts, numbers, and names. Avoid fluff."},{text:e}]}],generationConfig:{temperature:n||.3,maxOutputTokens:1e3}})});if(!o.ok){const u=await o.text();throw new Error(`Gemini API error: ${o.status} - ${u}`)}return((c=(s=(a=(await o.json()).candidates[0])==null?void 0:a.content)==null?void 0:s.parts[0])==null?void 0:c.text)||"No response generated"}function d(r,t,e,n){const o=r==="page"?`Title: ${e||"Unknown"}
URL: ${n||"Unknown"}

Content:
${t}`:`Selected Text:
${t}`;return`You are a concise summarizer. Output clear bullets. Preserve key facts, numbers, and names. Avoid fluff.

Please provide a summary of the following ${r==="page"?"web page":"selected text"}:

${o}

Please provide:
1. A 1-line TL;DR at the top in **bold**
2. 5-8 bullet points with key information
3. Focus on the most important facts, figures, and insights

Keep the summary concise but comprehensive.`}chrome.runtime.onInstalled.addListener(()=>{chrome.contextMenus.create({id:"summarize-selection",title:"Summarize selection with SummarizeIt",contexts:["selection"]})});chrome.contextMenus.onClicked.addListener(async(r,t)=>{var e;if(r.menuItemId==="summarize-selection"&&(t!=null&&t.id)){const n=(e=r.selectionText)==null?void 0:e.trim();if(!n||n.length<50)return;const o=await chrome.storage.sync.get(["provider","apiKey","model","temperature"]);if(!o.apiKey)return;const i=await m({mode:"selection",text:n,title:t.title,url:t.url},o);chrome.tabs.sendMessage(t.id,{type:"SUMMARY_RESULT",...i})}});chrome.runtime.onMessage.addListener((r,t,e)=>{var n;if(r.type==="RUN_SUMMARY")return f(r,(n=t.tab)==null?void 0:n.id).then(e),!0});async function f(r,t){try{const e=await chrome.storage.sync.get(["provider","apiKey","model","temperature"]);if(!e.apiKey)return{ok:!1,error:"API key not configured. Please set it in the options page."};const n=await m(r,e);return t&&chrome.tabs.sendMessage(t,{type:"SUMMARY_RESULT",...n}),n}catch(e){return console.error("Summary request failed:",e),{ok:!1,error:e instanceof Error?e.message:"Unknown error occurred"}}}async function m(r,t){const{provider:e,apiKey:n,model:o,temperature:i}=t,a=d(r.mode,r.text,r.title,r.url);try{let s;if(e==="openai")s=await l(n,o,a,i);else if(e==="gemini")s=await p(n,o,a,i);else throw new Error("Invalid provider");return{ok:!0,summary:s}}catch(s){return console.error(`${e} API error:`,s),{ok:!1,error:s instanceof Error?s.message:`${e} API error`}}}
