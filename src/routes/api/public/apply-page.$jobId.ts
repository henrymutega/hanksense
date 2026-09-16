import { createFileRoute } from "@tanstack/react-router";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Apply — Hanksense AI</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --line:#334155; --text:#e2e8f0; --muted:#94a3b8; --brand:#38bdf8; --ok:#34d399; --err:#f87171; }
  * { box-sizing:border-box; margin:0; }
  body { font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  .wrap { max-width:640px; margin:0 auto; padding:32px 16px 64px; }
  .brand { display:flex; align-items:center; gap:10px; margin-bottom:28px; }
  .brand-mark { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#38bdf8,#818cf8); display:flex; align-items:center; justify-content:center; font-weight:800; color:#0f172a; font-size:18px; }
  .brand span { font-weight:700; font-size:18px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:24px; margin-bottom:20px; }
  h1 { font-size:24px; margin-bottom:6px; }
  .meta { color:var(--muted); font-size:14px; margin-bottom:14px; line-height:1.6; }
  .section { margin-top:16px; }
  .section h3 { font-size:13px; text-transform:uppercase; letter-spacing:.06em; color:var(--brand); margin-bottom:8px; }
  .section p, .section li { font-size:14px; color:#cbd5e1; line-height:1.65; }
  .section ul { padding-left:18px; }
  label { display:block; font-size:13px; font-weight:600; margin:16px 0 6px; }
  input[type=text], input[type=email] { width:100%; background:#0f172a; border:1px solid var(--line); border-radius:10px; color:var(--text); padding:11px 12px; font-size:14px; outline:none; }
  input:focus { border-color:var(--brand); }
  .file-drop { margin-top:6px; border:1.5px dashed var(--line); border-radius:10px; padding:22px; text-align:center; color:var(--muted); font-size:14px; cursor:pointer; transition:border-color .15s; }
  .file-drop:hover, .file-drop.has { border-color:var(--brand); color:var(--text); }
  .btn { margin-top:22px; width:100%; background:linear-gradient(135deg,#38bdf8,#818cf8); color:#0f172a; border:0; border-radius:10px; padding:13px; font-size:15px; font-weight:700; cursor:pointer; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  .note { font-size:12px; color:var(--muted); margin-top:10px; text-align:center; }
  .msg { margin-top:14px; font-size:14px; text-align:center; padding:10px; border-radius:10px; display:none; }
  .msg.err { display:block; color:var(--err); background:rgba(248,113,113,.1); }
  .msg.ok { display:block; color:var(--ok); background:rgba(52,211,153,.1); }
  .success { text-align:center; padding:40px 20px; }
  .success .tick { font-size:52px; }
  .success h2 { font-size:22px; margin:12px 0 6px; }
  .success p { color:var(--muted); font-size:14px; }
  .hidden { display:none !important; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand"><div class="brand-mark">H</div><span>Hanksense AI</span></div>
  <div id="loading" style="text-align:center;color:var(--muted);padding:60px 0">Loading job details…</div>
  <div id="missing" class="hidden card"><h1>Job unavailable</h1><p class="meta">This job posting was not found or is no longer accepting applications.</p></div>
  <div id="job" class="hidden"></div>
  <div id="form-card" class="hidden card">
    <form id="apply-form">
      <label id="lbl-name">Full name</label>
      <input type="text" id="name" required minlength="2" maxlength="120" placeholder="Jane Doe" />
      <label id="lbl-email">Email address</label>
      <input type="email" id="email" required maxlength="160" placeholder="jane@example.com" />
      <label id="lbl-cv">Your CV / Résumé (PDF, DOCX or TXT)</label>
      <div class="file-drop" id="drop">Click to choose your CV file…</div>
      <input type="file" id="file" accept=".pdf,.docx,.txt" class="hidden" />
      <button class="btn" id="submit" disabled>Submit application</button>
      <div class="msg" id="msg"></div>
      <p class="note" id="privacy">Your application goes directly to the hiring team on Hanksense AI. No account needed.</p>
    </form>
  </div>
  <div id="done" class="hidden card success">
    <div class="tick">✅</div>
    <h2>Application received!</h2>
    <p>Thank you for applying. The hiring team will review your CV and be in touch.</p>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
<script>
var jobId = {{JOB_ID}};
var cvText = "";
var fileName = "";
function esc(s){ return String(s||"").replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]; }); }
function list(arr){ if(!Array.isArray(arr)||!arr.length) return ""; return "<ul>"+arr.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul>"; }

fetch("/api/public/job?jobId="+encodeURIComponent(jobId))
  .then(function(r){ return r.json(); })
  .then(function(data){
    document.getElementById("loading").classList.add("hidden");
    var j = data.job;
    if(!j || j.status !== "posted"){ document.getElementById("missing").classList.remove("hidden"); return; }
    var bits = [j.department, j.employment_type, j.location, j.work_mode, j.seniority].filter(Boolean);
    var sal = "";
    if(j.salary_min && j.salary_max) sal = (j.salary_currency||"")+" "+j.salary_min+" – "+j.salary_max;
    var html = '<div class="card"><h1>'+esc(j.title)+'</h1>';
    if(j.organisation) html += '<div class="meta">'+esc(j.organisation)+'</div>';
    if(bits.length) html += '<div class="meta">'+bits.map(esc).join(" · ")+'</div>';
    if(sal) html += '<div class="meta">'+esc(sal)+'</div>';
    if(j.summary) html += '<div class="section"><h3>About the role</h3><p>'+esc(j.summary)+'</p></div>';
    if(Array.isArray(j.responsibilities)&&j.responsibilities.length) html += '<div class="section"><h3>Responsibilities</h3>'+list(j.responsibilities)+'</div>';
    if(Array.isArray(j.required_skills)&&j.required_skills.length) html += '<div class="section"><h3>Required skills</h3>'+list(j.required_skills)+'</div>';
    if(Array.isArray(j.preferred_skills)&&j.preferred_skills.length) html += '<div class="section"><h3>Nice to have</h3>'+list(j.preferred_skills)+'</div>';
    if(j.education) html += '<div class="section"><h3>Education</h3><p>'+esc(j.education)+'</p></div>';
    if(j.experience) html += '<div class="section"><h3>Experience</h3><p>'+esc(j.experience)+'</p></div>';
    html += '</div>';
    document.getElementById("job").innerHTML = html;
    document.getElementById("job").classList.remove("hidden");
    document.getElementById("form-card").classList.remove("hidden");
  })
  .catch(function(){
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("missing").classList.remove("hidden");
  });

var drop = document.getElementById("drop");
var fileInput = document.getElementById("file");
var submitBtn = document.getElementById("submit");
drop.addEventListener("click", function(){ fileInput.click(); });

function extract(file){
  var ext = (file.name.split(".").pop()||"").toLowerCase();
  if(ext === "txt"){
    return file.text();
  }
  if(ext === "pdf"){
    if(!window.pdfjsLib) return Promise.reject(new Error("PDF reader unavailable"));
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return file.arrayBuffer().then(function(buf){
      return window.pdfjsLib.getDocument({ data: buf }).promise.then(function(pdf){
        var pages = [];
        for(var i=1;i<=pdf.numPages;i++){
          pages.push(pdf.getPage(i).then(function(p){
            return p.getTextContent().then(function(tc){
              return tc.items.map(function(it){ return it.str; }).join(" ");
            });
          }));
        }
        return Promise.all(pages).then(function(parts){ return parts.join("\\n"); });
      });
    });
  }
  if(ext === "docx"){
    if(!window.mammoth) return Promise.reject(new Error("DOCX reader unavailable"));
    return file.arrayBuffer().then(function(buf){
      return window.mammoth.extractRawText({ arrayBuffer: buf }).then(function(r){ return r.value; });
    });
  }
  return Promise.reject(new Error("Unsupported file type. Please use PDF, DOCX or TXT."));
}

fileInput.addEventListener("change", function(){
  var f = fileInput.files && fileInput.files[0];
  if(!f) return;
  drop.textContent = "Reading " + f.name + "…";
  extract(f).then(function(text){
    text = (text||"").replace(/\\s+/g," ").trim();
    if(text.length < 50) throw new Error("We couldn't read enough text from that file. Try a different format.");
    cvText = text.slice(0, 40000);
    fileName = f.name;
    drop.textContent = "✓ " + f.name;
    drop.classList.add("has");
    submitBtn.disabled = false;
  }).catch(function(e){
    drop.textContent = e.message || "Could not read that file.";
    submitBtn.disabled = true;
  });
});

document.getElementById("apply-form").addEventListener("submit", function(e){
  e.preventDefault();
  var msg = document.getElementById("msg");
  msg.className = "msg";
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";
  fetch("/api/public/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: jobId,
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      cvText: cvText,
      fileName: fileName
    })
  }).then(function(r){
    return r.json().then(function(body){ return { ok: r.ok, body: body }; });
  }).then(function(res){
    if(res.ok && res.body.ok){
      document.getElementById("form-card").classList.add("hidden");
      document.getElementById("done").classList.remove("hidden");
      window.scrollTo(0,0);
    } else {
      throw new Error(res.body.error || "Submission failed. Please try again.");
    }
  }).catch(function(err){
    msg.textContent = err.message;
    msg.className = "msg err";
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit application";
  });
});
</script>
</body>
</html>`;

/** Fully public standalone application page — bypasses all site auth. */
export const Route = createFileRoute("/api/public/apply-page/$jobId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const safeId = /^[0-9a-fA-F-]{36}$/.test(params.jobId) ? params.jobId : "";
        return new Response(html.replace("{{JOB_ID}}", JSON.stringify(safeId)), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
