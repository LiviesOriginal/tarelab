const OWNER = "LiviesOriginal";
const REPOSITORY = "tarelab";
const BASE_BRANCH = "main";
const BOOKS_PATH = "bcbuild/content/books.md";
const FLIX_PATH = "flix.md";
const MAX_BODY_BYTES = 20_000;
const MAX_TEXT = { title: 160, author: 120, isbn: 20, reflection: 1600, quote: 1200 };

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

function invalid(message) {
  return json({ error: message }, 400);
}

function cleanText(value, field, maxLength, required = false) {
  if (typeof value !== "string") return { error: `${field} must be text.` };
  const text = value.trim();
  if (required && !text) return { error: `${field} is required.` };
  if (text.length > maxLength) return { error: `${field} is too long.` };
  if (/[|\r\n]/.test(text) && ["title", "author", "isbn"].includes(field)) {
    return { error: `${field} cannot contain a pipe or line break.` };
  }
  if (text.includes("|")) return { error: `${field} cannot contain a pipe.` };
  return { value: text };
}

function normalizeISBN(value) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function parseRating(value, field) {
  if (value === null || value === undefined || value === "") return { value: "" };
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5 || Math.round(rating * 2) !== rating * 2) {
    return { error: `${field} must be between 0 and 5 in half-star increments.` };
  }
  return { value: String(rating) };
}

function validateSubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Submission must be a JSON object." };
  if (typeof body.website === "string" && body.website.trim()) return { error: "Invalid submission." };
  const target = body.target === "flix" ? "flix" : "book";
  const specs = target === "flix" ? [["title","title",true,160],["year","year",true,4],["section","section",true,40],["imdb","imdb",true,20],["reflection","reflection",false,1600]] : [["title","title",true,160],["author","author",true,120],["section","section",true,120],["isbn","isbn",false,20],["reflection","reflection",false,1600],["quote","quote",false,1200]];
  const fields = {};
  for (const [field,key,required,maxLength] of specs) { const result=cleanText(body[key] ?? "",field,maxLength,required); if(result.error)return result; fields[field]=result.value; }
  if(target==="flix"){ if(!/^\d{4}$/.test(fields.year))return {error:"Year must be a four-digit year."}; if(!/^tt\d+$/i.test(fields.imdb))return {error:"Enter a valid IMDb ID."}; if(!["Currently Watching","To Watch","Watched"].includes(fields.section))return {error:"Choose a valid Flix status."}; }
  else if(fields.isbn && !normalizeISBN(fields.isbn)) return {error:"Enter a valid ISBN."};
  const ratingXY=parseRating(body.rating_xy,"XY rating"), ratingZZ=parseRating(body.rating_zz,"ZZ rating");
  if(ratingXY.error)return ratingXY; if(ratingZZ.error)return ratingZZ;
  const hasRating=(body.rating_xy!==null&&body.rating_xy!==undefined&&body.rating_xy!=="")||(body.rating_zz!==null&&body.rating_zz!==undefined&&body.rating_zz!=="");
  if(target==="book"&&fields.section.toLowerCase()!=="read"&&hasRating)return {error:"Ratings can only be submitted for the Read section."};
  if(target==="flix"&&fields.section!=="Watched"&&hasRating)return {error:"Ratings can only be submitted for Watched titles."};
  return {value:{target,...fields,isbn:target==="book"?normalizeISBN(fields.isbn):"",ratingXY:ratingXY.value,ratingZZ:ratingZZ.value}};
}
function decodeBase64UTF8(value) {
  const bytes = Uint8Array.from(atob(value.replace(/\s/g, "")), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64UTF8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function findSection(lines, title) {
  const matches = [];
  lines.forEach((line, index) => {
    if (line.startsWith("# ") && line.slice(2).trim() === title) matches.push(index);
  });
  if (matches.length !== 1) throw new Error("That section no longer exists or is ambiguous in books.md.");
  const start = matches[0];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("# ")) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function isBookLine(line, isRead) {
  return isRead
    ? line.startsWith("## ")
    : line.includes("|") && !line.startsWith("- ");
}

function parseBookLine(line, isRead) {
  const text = isRead ? line.slice(3).trim() : line.trim();
  const parts = text.split("|").map((part) => part.trim());
  if (parts.length < 2) return null;
  const rawTitle = parts[0];
  const priority = /\*+\s*$/.test(rawTitle);
  const title = rawTitle.replace(/\*+\s*$/, "").trim();
  if (isRead) {
    return {
      title,
      author: parts[1],
      ratingXY: parts.length >= 5 ? parts[2] : "",
      ratingZZ: parts.length >= 5 ? parts[3] : "",
      isbn: parts.length >= 5 ? parts[4] : parts[2] || "",
      priority
    };
  }
  return { title, author: parts[1], isbn: parts[2] || "", priority };
}

function makeBookLine(book, isRead) {
  const title = `${book.title}${book.priority ? " **" : ""}`;
  if (isRead) {
    return `## ${title} | ${book.author} | ${book.ratingXY} | ${book.ratingZZ} | ${book.isbn}`;
  }
  return `${title} | ${book.author} | ${book.isbn}`;
}

function makeBookNotes(submission) {
  const notes = [];
  if (submission.reflection.trim()) {
    notes.push(...submission.reflection.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => `- ${line}`));
  }
  if (submission.quote.trim()) {
    notes.push(...submission.quote.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => `- “${line}”`));
  }
  return notes;
}

function updateMarkdown(markdown, submission) {
  let lines=markdown.replace(/\r\n/g,"\n").split("\n");
  let section=findSection(lines,submission.section), start=section.start, end=section.end;
  const isFlix=submission.target==="flix", isBookRead=!isFlix&&submission.section.toLowerCase()==="read";
  const itemLine=line=>isFlix?line.startsWith("## "):isBookLine(line,isBookRead);
  const parse=line=>{ if(!isFlix)return parseBookLine(line,isBookRead); const p=line.slice(3).trim().split("|").map(x=>x.trim()); return p.length>=3?{title:p[0],year:p[1],imdb:p[2],ratingXY:p[3]||"",ratingZZ:p[4]||""}:null; };
  const make=item=>isFlix?"## "+item.title+" | "+item.year+" | "+item.imdb+" | "+item.ratingXY+" | "+item.ratingZZ:makeBookLine(item,isBookRead);
  const noteLines=()=>submission.reflection.trim()?submission.reflection.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>"- "+x):[];
  const item=isFlix?{title:submission.title,year:submission.year,imdb:submission.imdb,ratingXY:submission.ratingXY,ratingZZ:submission.ratingZZ}:{title:submission.title,author:submission.author,isbn:submission.isbn,ratingXY:submission.ratingXY,ratingZZ:submission.ratingZZ,priority:false};
  const key=isFlix?item.imdb.toLowerCase():normalizeISBN(item.isbn);
  const name=isFlix?(item.title+" "+item.year).toLowerCase().replace(/\s+/g," ").trim():(item.title+" "+item.author).toLowerCase().replace(/\s+/g," ").trim();
  let sourceNotes=[];
  if(isFlix){
    let sourceStart=-1,sourceEnd=-1;
    for(let i=0;i<lines.length;i++){
      if(!lines[i].startsWith("## "))continue;
      const parsed=parse(lines[i]); if(!parsed||parsed.imdb.toLowerCase()!==key)continue;
      const sourceSection=findSection(lines,lines.slice(0,i+1).reverse().find(x=>x.startsWith("# "))?.slice(2).trim()||"");
      if(sourceSection.start===start)continue;
      sourceStart=i; sourceEnd=i+1;
      while(sourceEnd<lines.length&&!lines[sourceEnd].startsWith("## ")&&!lines[sourceEnd].startsWith("# "))sourceEnd++;
      sourceNotes=lines.slice(i+1,sourceEnd).map(x=>x.trim()).filter(Boolean);
      break;
    }
    if(sourceStart>=0){ lines.splice(sourceStart,sourceEnd-sourceStart); section=findSection(lines,submission.section); start=section.start; end=section.end; }
  }
  if(sourceNotes.length&&!submission.reflection.trim()) submission.reflection=sourceNotes.join("\n");
  let matchStart=-1,matchEnd=-1,existing=null;
  for(let i=start+1;i<end;i++){
    if(!itemLine(lines[i]))continue;
    const parsed=parse(lines[i]); if(!parsed)continue;
    const parsedKey=isFlix?parsed.imdb.toLowerCase():normalizeISBN(parsed.isbn);
    const sameKey=key&&parsedKey===key;
    const parsedName=(isFlix?(parsed.title+" "+parsed.year):(parsed.title+" "+parsed.author)).toLowerCase().replace(/\s+/g," ").trim();
    if(!sameKey&&!(parsedName===name&&(!key||!parsedKey)))continue;
    matchStart=i;existing=parsed;matchEnd=i+1;while(matchEnd<end&&!itemLine(lines[matchEnd]))matchEnd++;break;
  }
  if(existing){
    if(isFlix){item.ratingXY ||= existing.ratingXY; item.ratingZZ ||= existing.ratingZZ;}
    else {item.isbn ||= existing.isbn; item.priority=existing.priority; if(isBookRead){item.ratingXY ||= existing.ratingXY; item.ratingZZ ||= existing.ratingZZ;}}
    lines[matchStart]=make(item);
    const seen=new Set(lines.slice(matchStart+1,matchEnd).map(x=>x.trim().toLowerCase()));
    lines.splice(matchEnd,0,...noteLines().filter(x=>!seen.has(x.toLowerCase())));
  } else {
    const block=[make(item),...noteLines()],before=lines.slice(0,end),after=lines.slice(end);
    while(before.length&&!before[before.length-1].trim())before.pop(); while(after.length&&!after[0].trim())after.shift();
    lines.splice(0,lines.length,...before,"",...block,"",...after);
  }
  const result=lines.join("\n").replace(/\n*$/,"\n");
  if(result===markdown)throw new Error("This submission does not change the file.");
  return result;
}
function derLength(length) {
  if (length < 128) return Uint8Array.of(length);
  const bytes = [];
  let remainder = length;
  while (remainder > 0) {
    bytes.unshift(remainder & 0xff);
    remainder >>>= 8;
  }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function der(tag, content) {
  return Uint8Array.of(tag, ...derLength(content.length), ...content);
}

function wrapPKCS1asPKCS8(pkcs1) {
  const algorithm = Uint8Array.of(
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00
  );
  return der(0x30, Uint8Array.of(
    ...der(0x02, Uint8Array.of(0x00)),
    ...algorithm,
    ...der(0x04, pkcs1)
  ));
}

function pemBytes(pem) {
  const label = pem.match(/-----BEGIN ([^-]+)-----/);
  if (!label) throw new Error("The GitHub App private key is not valid PEM.");
  const base64 = pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g, "");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return label[1] === "RSA PRIVATE KEY" ? wrapPKCS1asPKCS8(bytes) : bytes;
}

function base64URL(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64URLText(text) {
  return base64URL(new TextEncoder().encode(text));
}

async function createAppJWT(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64URLText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64URLText(JSON.stringify({
    iat: now - 30,
    exp: now + 8 * 60,
    iss: env.GITHUB_APP_ID
  }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(env.GITHUB_APP_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64URL(new Uint8Array(signature))}`;
}

async function githubRequest(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tarelab-book-updates",
      ...(options.headers || {})
    }
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = result?.message || `GitHub API returned HTTP ${response.status}.`;
    throw new Error(detail);
  }
  return result;
}

async function getInstallationToken(env) {
  const jwt = await createAppJWT(env);
  const result = await githubRequest(
    jwt,
    `/app/installations/${encodeURIComponent(env.GITHUB_INSTALLATION_ID)}/access_tokens`,
    { method: "POST" }
  );
  if (!result?.token) throw new Error("GitHub did not issue an installation token.");
  return result.token;
}

async function verifyTurnstile(request, token, env) {
  if (!token) return false;
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token
  });
  const remoteIP = request.headers.get("CF-Connecting-IP");
  if (remoteIP) body.set("remoteip", remoteIP);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Turnstile siteverify failed", {
      status: response.status,
      errorCodes: Array.isArray(result?.["error-codes"]) ? result["error-codes"] : []
    });
    throw new Error("Could not verify the anti-spam check.");
  }
  const hostname = new URL(request.url).hostname;
  return result?.success === true && result.hostname === hostname;
}

async function createPullRequest(submission, env) {
  const token = await getInstallationToken(env);
  const repository = env.GITHUB_REPOSITORY || `${OWNER}/${REPOSITORY}`;
  const targetPath = submission.target === "flix" ? FLIX_PATH : BOOKS_PATH;
  const [owner, repo] = repository.split("/");
  if (!owner || !repo || repository.split("/").length !== 2) {
    throw new Error("GITHUB_REPOSITORY must be in owner/repo format.");
  }
  const baseBranch = env.GITHUB_BASE_BRANCH || BASE_BRANCH;
  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const encodedBooksPath = targetPath.split("/").map(encodeURIComponent).join("/");

  const branch = await githubRequest(
    token,
    `${repoPath}/git/ref/heads/${encodeURIComponent(baseBranch)}`
  );
  const baseSHA = branch?.object?.sha;
  if (!baseSHA) throw new Error("Could not find the configured GitHub base branch.");

  const file = await githubRequest(
    token,
    `${repoPath}/contents/${encodedBooksPath}?ref=${encodeURIComponent(baseSHA)}`
  );
  if (!file?.sha || typeof file.content !== "string") {
    throw new Error("Could not load books.md from the configured repository.");
  }
  const currentMarkdown = decodeBase64UTF8(file.content);
  const updatedMarkdown = updateMarkdown(currentMarkdown, submission);
  const branchName = `book-submission/${crypto.randomUUID()}`;

  await githubRequest(token, `${repoPath}/git/refs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSHA })
  });
  await githubRequest(token, `${repoPath}/contents/${encodedBooksPath}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update ${submission.target === "flix" ? "flix" : "books"}: ${submission.title}`,
      content: encodeBase64UTF8(updatedMarkdown),
      sha: file.sha,
      branch: branchName
    })
  });
  return githubRequest(token, `${repoPath}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `${submission.target === "flix" ? "Flix" : "Book"} update: ${submission.title}`,
      head: branchName,
      base: baseBranch,
      body: `Mobile ${submission.target === "flix" ? "Flix" : "book"} update submission for **${submission.section}**.\n\nReview the details and changes to \`${targetPath}\` before merging.`
    })
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return json({ error: "Requests must come from this site." }, 403);
  }
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY_BYTES) {
    return json({ error: "Submission is too large." }, 413);
  }

  const missing = [
    "TURNSTILE_SECRET_KEY",
    "GITHUB_APP_ID",
    "GITHUB_INSTALLATION_ID",
    "GITHUB_APP_PRIVATE_KEY"
  ].filter((key) => !env[key]);
  if (missing.length) {
    console.error("Book submissions are missing required environment configuration:", missing.join(", "));
    return json({ error: "Book submissions are not configured yet." }, 503);
  }

  let body;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return json({ error: "Submission is too large." }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return invalid("Request body must be valid JSON.");
  }
  const validation = validateSubmission(body);
  if (validation.error) return invalid(validation.error);

  try {
    if (!await verifyTurnstile(request, body.turnstile_token, env)) {
      return json({ error: "The anti-spam check expired or could not be verified. Please try again." }, 403);
    }
    const pullRequest = await createPullRequest(validation.value, env);
    return json({ html_url: pullRequest.html_url, number: pullRequest.number }, 201);
  } catch (error) {
    console.error("Book update PR creation failed", error);
    return json({ error: "The update could not be submitted. Please try again later." }, 502);
  }
}
