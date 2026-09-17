#!/usr/bin/env node
var wt=Object.defineProperty;var F=(t,e,r)=>()=>{if(r)throw r[0];try{return t&&(e=t(t=0)),e}catch(n){throw r=[n],n}};var Ne=(t,e)=>{for(var r in e)wt(t,r,{get:e[r],enumerable:!0})};var T,me=F(()=>{"use strict";T={DEVICES:["devices","-l"],SCREENCAP:["exec-out","screencap","-p"],TCP_IP:t=>["tcpip",t.toString()],CONNECT:(t,e)=>["connect",`${t}:${e}`],PAIR:(t,e,r)=>["pair",`${t}:${e}`,r],WLAN_IP:["shell","ip","-f","inet","addr","show","wlan0"],FOREGROUND_APP:["shell","dumpsys","window"],FORCE_STOP:t=>["shell","am","force-stop",t],CLEAR_APP:t=>["shell","pm","clear",t],LAUNCH_APP:t=>["shell","monkey","-p",t,"-c","android.intent.category.LAUNCHER","1"],UIAUTOMATOR_DUMP:["exec-out","uiautomator","dump","/dev/tty"],INPUT_TAP:(t,e)=>["shell","input","tap",t.toString(),e.toString()],INPUT_TEXT:t=>["shell","input","text",t],INPUT_KEY:t=>["shell","input","keyevent",t.toString()],INPUT_SWIPE:(t,e,r,n,o=300)=>["shell","input","swipe",t.toString(),e.toString(),r.toString(),n.toString(),o.toString()]}});var N,be=F(()=>{"use strict";N={DEFAULT_PORT:5555,DEFAULT_OUTPUT_DIR:"./output",DEFAULT_TIMEOUT_MS:1e4,DEFAULT_DEVICE_FRAME:"minimal",ADB_DEFAULT_HOST:"127.0.0.1"}});var ke={};Ne(ke,{AndroidDriver:()=>ce,androidDriver:()=>x,resolveAdbPath:()=>we});import{execFile as Me}from"node:child_process";import V from"node:fs";import X from"node:path";import ae from"node:os";function we(){if(I)return I;if(process.env.ADB_PATH&&V.existsSync(process.env.ADB_PATH))return I=process.env.ADB_PATH,I;let t=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;if(t){let e=process.platform==="win32"?"adb.exe":"adb",r=X.join(t,"platform-tools",e);if(V.existsSync(r))return I=r,I}if(process.platform==="win32"){let e=process.env.LOCALAPPDATA||X.join(ae.homedir(),"AppData","Local"),r=X.join(e,"Android","Sdk","platform-tools","adb.exe");if(V.existsSync(r))return I=r,I}else if(process.platform==="darwin"){let e=X.join(ae.homedir(),"Library","Android","sdk","platform-tools","adb");if(V.existsSync(e))return I=e,I}else{let e=X.join(ae.homedir(),"Android","Sdk","platform-tools","adb");if(V.existsSync(e))return I=e,I}return I="adb",I}var I,ce,x,J=F(()=>{"use strict";me();be();I=null;ce=class{platform="android";async exec(e,r=N.DEFAULT_TIMEOUT_MS){let n=we();return new Promise((o,s)=>{Me(n,e,{timeout:r,maxBuffer:10*1024*1024},(i,a,g)=>{i?s(new Error(`ADB command "${n} ${e.join(" ")}" failed: ${g||i.message}`)):o(a.trim())})})}async listDevices(){let r=(await this.exec(T.DEVICES)).split(/\r?\n/).map(o=>o.trim()).filter(Boolean),n=[];for(let o of r){if(o.startsWith("List of devices attached")||o.startsWith("* daemon"))continue;let s=o.split(/\s+/);if(s.length<2)continue;let i=s[0],a=s[1],g=a==="device",b=i,h="generic";for(let c=2;c<s.length;c++){let u=s[c];u.startsWith("model:")?b=u.replace("model:","").replace(/_/g," "):u.startsWith("product:")&&(h=u.replace("product:",""))}let l="usb";i.includes(":")||i.includes("._tcp")||i.includes("_adb-tls-")||i.includes("._adb.")||i.includes("tls-connect")?l="wifi":i.startsWith("emulator-")&&(l="emulator"),n.push({id:i,platform:"android",type:l,model:b,product:h,isAuthorized:g,rawStatus:a})}return n.sort((o,s)=>{if(o.isAuthorized!==s.isAuthorized)return o.isAuthorized?-1:1;let i=a=>a==="usb"?0:a==="wifi"?1:a==="emulator"?2:3;return i(o.type)-i(s.type)}),n}async captureScreenshot(e){let r=e;if(!r)try{let i=(await this.listDevices()).find(a=>a.isAuthorized);i&&(r=i.id)}catch{}let n=r?["-s",r,...T.SCREENCAP]:T.SCREENCAP,o=we();return new Promise((s,i)=>{Me(o,n,{encoding:"buffer",maxBuffer:50*1024*1024,timeout:N.DEFAULT_TIMEOUT_MS},(a,g,b)=>{if(a)i(new Error(`Screenshot capture failed: ${b?b.toString():a.message}`));else{if(!g||g.length===0){i(new Error("Received empty screenshot buffer from ADB."));return}s(g)}})})}async getDeviceIp(e){try{let n=(await this.exec(["-s",e,...T.WLAN_IP])).match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);if(n&&n[1]&&!n[1].startsWith("127."))return n[1]}catch{}try{let n=(await this.exec(["-s",e,"shell","ip","route"])).match(/src\s+(\d+\.\d+\.\d+\.\d+)/);if(n&&n[1]&&!n[1].startsWith("127."))return n[1]}catch{}try{let n=(await this.exec(["-s",e,"shell","ip","-f","inet","addr"])).split(`
`);for(let o of n){let s=o.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);if(s&&s[1]&&!s[1].startsWith("127."))return s[1]}}catch{}try{let n=(await this.exec(["-s",e,"shell","getprop","dhcp.wlan0.ipaddress"])).trim();if(/^\d+\.\d+\.\d+\.\d+$/.test(n))return n}catch{}throw new Error(`Unable to determine Wi-Fi IP address for device ${e}. Please verify that your phone is connected to your Wi-Fi network.`)}async enableWireless(e,r=N.DEFAULT_PORT){let n=await this.getDeviceIp(e);await this.exec(["-s",e,...T.TCP_IP(r)]),await new Promise(s=>setTimeout(s,800));let o=await this.exec(T.CONNECT(n,r));if(!o.includes("connected to")&&!o.includes("already connected"))throw new Error(`Failed to connect over Wi-Fi to ${n}:${r}: ${o}`);return`${n}:${r}`}async disableWireless(e){if(e&&(e.includes(":")||e.includes("._tcp")||e.includes("_adb-tls-")||e.includes("tls-connect")))try{return await this.exec(["disconnect",e])}catch{return"disconnected"}let n=e?["-s",e]:[];return await this.exec([...n,"usb"])}async connectWifi(e,r=N.DEFAULT_PORT){try{let n=await this.exec(T.CONNECT(e,r));return n.includes("connected to")||n.includes("already connected")?{success:!0,message:n}:{success:!1,message:n||"Failed to connect"}}catch(n){return{success:!1,message:n instanceof Error?n.message:String(n)}}}async pairWifi(e,r,n){try{let o=await this.exec(T.PAIR(e,r,n));return o.includes("Successfully paired")||o.includes("already paired")?{success:!0,message:o}:{success:!1,message:o||"Pairing failed"}}catch(o){return{success:!1,message:o instanceof Error?o.message:String(o)}}}async getForegroundApp(e){let r=e?["-s",e]:[],n=await this.exec([...r,...T.FOREGROUND_APP]),o=n.match(/mCurrentFocus[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//)||n.match(/mFocusedApp[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//)||n.match(/topResumedActivity[^\n]*\s([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)\//);return o?o[1]:null}async resetAppData(e,r){let n=r?["-s",r]:[];await this.exec([...n,...T.CLEAR_APP(e)])}async launchApp(e,r){let n=r?["-s",r]:[];await this.exec([...n,...T.LAUNCH_APP(e)])}async killApp(e,r){let n=r?["-s",r]:[];await this.exec([...n,...T.FORCE_STOP(e)])}async setDemoMode(e,r){let n=r?["-s",r]:[];e?(await this.exec([...n,"shell","settings","put","global","sysui_demo_allowed","1"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","enter"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","clock","-e","hhmm","0941"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","battery","-e","level","100","-e","plugged","false"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","network","-e","wifi","show","-e","level","4","-e","fully","true"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","network","-e","mobile","show","-e","datatype","false","-e","level","4"]),await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","notifications","-e","visible","false"])):await this.exec([...n,"shell","am","broadcast","-a","com.android.systemui.demo","-e","command","exit"])}async recordVideo(e=5,r){let n=r?["-s",r]:[],o="/sdcard/adbsnap_temp_rec.mp4",s=X.join(ae.tmpdir(),`adbsnap-rec-${Date.now()}.mp4`);try{await this.exec([...n,"shell","rm","-f",o])}catch{}let i=Math.min(Math.max(e,1),30);await this.exec([...n,"shell","screenrecord","--time-limit",String(i),o],(i+10)*1e3),await this.exec([...n,"pull",o,s],3e4);let a=V.readFileSync(s);try{V.unlinkSync(s)}catch{}try{await this.exec([...n,"shell","rm","-f",o])}catch{}return a}},x=new ce});var K,q,Q,le,Fe,ye=F(()=>{"use strict";K={none:{id:"none",name:"Pure Floating Screen (No Bezel)",category:"frameless",width:864,height:1844,isFrameless:!0,screen:{x:0,y:0,width:864,height:1844,radius:28}},"iphone-16-pro":{id:"iphone-16-pro",name:"iPhone 16 Pro Max",category:"apple",width:920,height:1950,screen:{x:28,y:28,width:864,height:1894,radius:52},island:{x:360,y:44,width:200,height:48,radius:24}},"iphone-16":{id:"iphone-16",name:"iPhone 16",category:"apple",width:900,height:1880,screen:{x:26,y:26,width:848,height:1828,radius:48},island:{x:350,y:42,width:200,height:48,radius:24}},"iphone-15-pro":{id:"iphone-15-pro",name:"iPhone 15 Pro",category:"apple",width:910,height:1910,screen:{x:27,y:27,width:856,height:1856,radius:50},island:{x:355,y:43,width:200,height:48,radius:24}},"iphone-14":{id:"iphone-14",name:"iPhone 14 (Classic Notch)",category:"apple",width:900,height:1870,screen:{x:26,y:26,width:848,height:1818,radius:44},notch:{width:230,height:40,radius:18}},"pixel-9-pro":{id:"pixel-9-pro",name:"Google Pixel 9 Pro",category:"android",width:910,height:1910,screen:{x:24,y:24,width:862,height:1862,radius:46},punchHole:{cx:455,cy:50,r:15}},"pixel-8":{id:"pixel-8",name:"Google Pixel 8",category:"android",width:900,height:1870,screen:{x:25,y:25,width:850,height:1820,radius:42},punchHole:{cx:450,cy:52,r:15}},"galaxy-s24-ultra":{id:"galaxy-s24-ultra",name:"Samsung Galaxy S24 Ultra",category:"android",width:920,height:1920,screen:{x:20,y:20,width:880,height:1880,radius:16},punchHole:{cx:460,cy:46,r:14}},"galaxy-s24":{id:"galaxy-s24",name:"Samsung Galaxy S24",category:"android",width:890,height:1870,screen:{x:24,y:24,width:842,height:1822,radius:40},punchHole:{cx:445,cy:48,r:14}},"ipad-pro-13":{id:"ipad-pro-13",name:'Apple iPad Pro 13" M4',category:"tablet",width:1400,height:1860,screen:{x:35,y:35,width:1330,height:1790,radius:30}},"android-tablet-10":{id:"android-tablet-10",name:'Android Tablet 10"',category:"tablet",width:1380,height:1940,screen:{x:32,y:32,width:1316,height:1876,radius:24}},minimal:{id:"minimal",name:"Modern Minimalist",category:"frameless",width:900,height:1850,screen:{x:26,y:26,width:848,height:1798,radius:46}}},q={none:{name:"None (Raw Screenshot)",colors:["transparent","transparent"],angle:0,isDark:!0,isNone:!0},aurora:{name:"Electric Aurora",colors:["#4f46e5","#06b6d4","#10b981"],angle:135,isDark:!0},studioLight:{name:"Apple Studio Light",colors:["#f8fafc","#f1f5f9","#e2e8f0"],angle:180,isDark:!1},freshMint:{name:"Fresh Mint",colors:["#0f766e","#059669","#10b981"],angle:135,isDark:!0},sunset:{name:"Warm Sunset",colors:["#f43f5e","#fb923c","#fbbf24"],angle:135,isDark:!0},midnight:{name:"Deep Midnight",colors:["#090d16","#1e1b4b","#312e81"],angle:160,isDark:!0},royal:{name:"Royal Orchid",colors:["#7c3aed","#c026d3","#f43f5e"],angle:120,isDark:!0},cleanDark:{name:"Titanium Dark",colors:["#18181b","#27272a","#09090b"],angle:180,isDark:!0}},Q={appstore:{name:"App Store Bottom Bleed",phoneTop:(t,e)=>Math.round(t-e+120)},social:{name:"Social Floating Showcase",phoneTop:(t,e)=>Math.round((t-e)/2+100)}},le={modern:{name:"Modern Sans (Clean Tech)",family:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"},rounded:{name:"Friendly Rounded",family:"'Segoe UI Variable Display', 'SF Pro Rounded', 'Arial Rounded MT Bold', sans-serif"},editorial:{name:"Editorial Serif (Luxury & Elegance)",family:"'Georgia', 'Times New Roman', serif"},mono:{name:"Developer Monospace",family:"'Consolas', 'Fira Code', 'SF Mono', monospace"}},Fe={"apple-6.9":{id:"apple-6.9",store:"apple",name:'Apple App Store 6.9" (iPhone 16 Pro Max)',width:1320,height:2868,folder:"appstore/iphone-6.9"},"apple-6.7":{id:"apple-6.7",store:"apple",name:'Apple App Store 6.7" (iPhone 15 Pro Max)',width:1290,height:2796,folder:"appstore/iphone-6.7"},"apple-ipad-13":{id:"apple-ipad-13",store:"apple",name:'Apple App Store 13" iPad Pro',width:2064,height:2752,folder:"appstore/ipad-13"},"google-phone":{id:"google-phone",store:"google",name:"Google Play Phone Display",width:1080,height:1920,folder:"googleplay/phone"},"google-tablet-10":{id:"google-tablet-10",store:"google",name:'Google Play 10" Tablet Display',width:1600,height:2560,folder:"googleplay/tablet-10"},"google-feature":{id:"google-feature",store:"google",name:"Google Play Feature Graphic (Mandatory 1024x500)",width:1024,height:500,folder:"googleplay/feature-graphic"}}});function _e(t){let{spec:e}=t,r=t.finishColor||"#1c1c1e",n=t.borderColor||"#3a3a3c",o="";if(e.island&&(o+=`
      <rect x="${e.island.x}" y="${e.island.y}" 
            width="${e.island.width}" height="${e.island.height}" 
            rx="${e.island.radius}" fill="#000000" />
      <circle cx="${e.island.x+e.island.width-24}" cy="${e.island.y+e.island.height/2}" r="6" fill="#111111" />
    `),e.notch){let u=(e.width-e.notch.width)/2;o+=`
      <path d="M ${u} 0 
               L ${u+e.notch.width} 0 
               L ${u+e.notch.width-6} ${e.notch.height} 
               Q ${u+e.notch.width-14} ${e.notch.height+4} ${u+e.notch.width-20} ${e.notch.height+4}
               L ${u+20} ${e.notch.height+4}
               Q ${u+14} ${e.notch.height+4} ${u+6} ${e.notch.height}
               Z" fill="#000000" />
      <circle cx="${e.width/2+45}" cy="${e.notch.height/2}" r="5" fill="#111111" />
      <rect x="${e.width/2-25}" y="10" width="50" height="4" rx="2" fill="#222222" />
    `}e.punchHole&&(o+=`
      <circle cx="${e.punchHole.cx}" cy="${e.punchHole.cy}" r="${e.punchHole.r}" fill="#000000" />
      <circle cx="${e.punchHole.cx}" cy="${e.punchHole.cy}" r="${e.punchHole.r-4}" fill="#0a0a0a" />
    `);let s=e.category==="tablet",i=e.width/2-36,h=s?"":`<rect x="${i}" y="12" width="72" height="4" rx="2" fill="#2a2a2c" />`,c=e.id.includes("ultra")?e.screen.radius+4:e.screen.radius+12;return`<svg xmlns="http://www.w3.org/2000/svg" width="${e.width}" height="${e.height}" viewBox="0 0 ${e.width} ${e.height}">
    <defs>
      <!-- Titanium edge gradient -->
      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${n}" />
        <stop offset="50%" stop-color="#555558" />
        <stop offset="100%" stop-color="${n}" />
      </linearGradient>

      <!-- Screen Cutout Mask -->
      <mask id="screenCutout">
        <!-- White reveals, black cuts out -->
        <rect width="${e.width}" height="${e.height}" fill="#ffffff" />
        <rect x="${e.screen.x}" y="${e.screen.y}" 
              width="${e.screen.width}" height="${e.screen.height}" 
              rx="${e.screen.radius}" fill="#000000" />
      </mask>
    </defs>

    <!-- Outer Bezel Chassis with Screen Cutout -->
    <rect x="0" y="0" width="${e.width}" height="${e.height}" 
          rx="${c}" fill="${r}" 
          stroke="url(#edgeGrad)" stroke-width="6" 
          mask="url(#screenCutout)" />

    <!-- Speaker Slit -->
    ${h}

    <!-- Hardware Camera / Island -->
    ${o}
  </svg>`}function Le(t,e,r){return`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${e}">
    <rect x="0" y="0" width="${t}" height="${e}" rx="${r}" fill="#ffffff" />
  </svg>`}function Ue(t,e,r){return`<svg xmlns="http://www.w3.org/2000/svg" width="${t+120}" height="${e+120}" viewBox="0 0 ${t+120} ${e+120}">
    <defs>
      <filter id="studioShadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000000" flood-opacity="0.55" />
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
      </filter>
    </defs>
    <rect x="60" y="56" width="${t}" height="${e}" rx="${r}" fill="#000000" filter="url(#studioShadow)" />
  </svg>`}var ze=F(()=>{"use strict"});function We(t){let{canvasWidth:e,canvasHeight:r,colors:n,angle:o=135}=t,s=o*Math.PI/180,i=Math.round(50-Math.cos(s)*50),a=Math.round(50-Math.sin(s)*50),g=Math.round(50+Math.cos(s)*50),b=Math.round(50+Math.sin(s)*50),h=n.map((l,c)=>`<stop offset="${Math.round(c/(n.length-1)*100)}%" stop-color="${l}" />`).join(`
`);return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${r}">
    <defs>
      <linearGradient id="bgGrad" x1="${i}%" y1="${a}%" x2="${g}%" y2="${b}%">
        ${h}
      </linearGradient>
    </defs>
    <rect width="${e}" height="${r}" fill="url(#bgGrad)" />
  </svg>`}function He(t){let{canvasWidth:e,canvasHeight:r,title:n,subtitle:o,showStarBadge:s,position:i="top",isDarkTheme:a=!0,fontFamily:g}=t;if(!n&&!o&&!s)return"";let b=g||"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif",h=Math.min(e/1290,r/2796),l=Math.round(i==="top"?140*h:(r-340)*h),c="",u=l,d=a?"#ffffff":"#0f172a",f=a?"rgba(255,255,255,0.85)":"#334155",y=a?"rgba(255,255,255,0.15)":"rgba(15,23,42,0.06)",S=a?"rgba(255,255,255,0.25)":"rgba(15,23,42,0.12)",D=a?"#facc15":"#d97706",z=a?"#ffffff":"#0f172a";if(s){let w=Math.round(280*h),B=Math.round(48*h),R=Math.round(24*h),k=Math.max(14,Math.round(20*h)),G=Math.round(31*h),Y=(e-w)/2;c+=`
      <g transform="translate(${Y}, ${u})">
        <rect width="${w}" height="${B}" rx="${R}" fill="${y}" stroke="${S}" stroke-width="2" />
        <text x="${w/2}" y="${G}" text-anchor="middle" font-family="${b}" font-size="${k}" font-weight="bold" fill="${D}">
          \u2605\u2605\u2605\u2605\u2605 <tspan fill="${z}" font-weight="600">5.0 RATED</tspan>
        </text>
      </g>
    `,u+=Math.round(70*h)}if(n){let w=Math.max(34,Math.round(62*h)),B=Math.max(18,Math.round(22*(e/1290))),R=Ge(n,B),k=Math.round(w*1.15),G="";R.forEach((Y,ee)=>{G+=`<tspan x="${e/2}" ${ee>0?`dy="${k}"`:""}>${je(Y)}</tspan>`}),c+=`
      <text x="${e/2}" y="${u+Math.round(45*h)}" text-anchor="middle" 
            font-family="${b}" 
            font-size="${w}" font-weight="800" fill="${d}" letter-spacing="-1">
        ${G}
      </text>
    `,u+=Math.round(45*h)+(R.length-1)*k+Math.round(25*h)}if(o){let w=Math.max(18,Math.round(28*h)),B=Math.max(28,Math.round(36*(e/1290))),R=Ge(o,B),k=Math.round(w*1.25),G="";R.forEach((Y,ee)=>{G+=`<tspan x="${e/2}" ${ee>0?`dy="${k}"`:""}>${je(Y)}</tspan>`}),c+=`
      <text x="${e/2}" y="${u+Math.round(20*h)}" text-anchor="middle" 
            font-family="${b}" 
            font-size="${w}" font-weight="500" fill="${f}">
        ${G}
      </text>
    `}return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${r}">
    <defs>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="${a?"0.3":"0.08"}" />
      </filter>
    </defs>
    <g filter="url(#dropShadow)">
      ${c}
    </g>
  </svg>`}function Ge(t,e=24){let r=t.trim().split(/\s+/),n=[],o="";for(let s of r)(o+" "+s).trim().length<=e?o=(o+" "+s).trim():(o&&n.push(o),o=s);return o&&n.push(o),n.length>0?n:[t]}function je(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}var Ve=F(()=>{"use strict"});import W from"sharp";async function L(t){let e=performance.now(),r=t.canvasWidth||1290,n=t.canvasHeight||2796,o=t.typographyPosition||"top",s=t.bezelId||"iphone-16-pro",i=K[s]||K["iphone-16-pro"],a=["#4f46e5","#06b6d4","#10b981"],g=t.gradientAngle??135,b=!0;if(t.customColors&&t.customColors.length>=2)a=t.customColors;else if(t.gradientPreset&&q[t.gradientPreset]){let j=q[t.gradientPreset];a=[...j.colors],g=t.gradientAngle??j.angle,b=j.isDark??!0}let h=t.fit||"cover",l=await W(t.screenshotBuffer).resize(i.screen.width,i.screen.height,{fit:h,position:"top",background:{r:0,g:0,b:0,alpha:1}}).png().toBuffer(),c=Le(i.screen.width,i.screen.height,i.screen.radius),u=Buffer.from(c),d=await W(l).composite([{input:u,blend:"dest-in"}]).png().toBuffer(),f,y=i.width,S=i.height;if(i.isFrameless||i.id==="none"){y=i.screen.width+120,S=i.screen.height+120;let Z=Ue(i.screen.width,i.screen.height,i.screen.radius),se=Buffer.from(Z);f=await W({create:{width:y,height:S,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:se,left:0,top:0},{input:d,left:60,top:56}]).png().toBuffer()}else{let j=_e({spec:i}),Z=Buffer.from(j);f=await W({create:{width:i.width,height:i.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:d,left:i.screen.x,top:i.screen.y},{input:Z,left:0,top:0}]).png().toBuffer()}if(t.gradientPreset==="none"){if(i.isFrameless||i.id==="none"){let Z=await W(t.screenshotBuffer).png().toBuffer(),se=await W(Z).metadata();return{buffer:Z,width:se.width||i.screen.width,height:se.height||i.screen.height,elapsedMs:Math.round(performance.now()-e)}}let j=await W(f).metadata();return{buffer:f,width:j.width||i.width,height:j.height||i.height,elapsedMs:Math.round(performance.now()-e)}}let D=t.layout||"appstore",O=Math.round(n*(D==="appstore"?.74:.66)),w=Math.round(r*.88);O/S*y>w&&(O=Math.round(w/y*S));let B=O/S,R=Math.round(y*B),k=await W(f).resize(R,O).png().toBuffer(),G=Math.round((r-R)/2),ee=(Q[D]||Q.appstore).phoneTop(n,O),ft=t.phoneTopOffset??ee,gt=We({canvasWidth:r,canvasHeight:n,colors:a,angle:g}),ht=Buffer.from(gt),he=le.modern.family;t.font&&(le[t.font]?he=le[t.font].family:he=t.font);let Ie=He({canvasWidth:r,canvasHeight:n,title:t.title,subtitle:t.subtitle,showStarBadge:t.showStarBadge,position:o,isDarkTheme:b,fontFamily:he}),Re=[{input:k,left:G,top:ft}];Ie&&Re.push({input:Buffer.from(Ie),left:0,top:0});let mt=await W(ht).composite(Re).flatten({background:{r:10,g:11,b:14}}).toColorspace("srgb").png({quality:95,compressionLevel:8}).toBuffer(),bt=Math.round(performance.now()-e);return{buffer:mt,width:r,height:n,elapsedMs:bt}}async function de(t){let e=t.storeFilter||"all",r=Object.values(Fe).filter(o=>t.targetIds&&t.targetIds.length>0?t.targetIds.includes(o.id):e==="all"?!0:o.store===e),n=[];for(let o of r){let s=await L({...t,canvasWidth:o.width,canvasHeight:o.height});n.push({target:o,buffer:s.buffer,width:s.width,height:s.height,elapsedMs:s.elapsedMs})}return n}var ue=F(()=>{"use strict";ye();ze();Ve()});import{ZipArchive as yt}from"archiver";import{PassThrough as xt}from"node:stream";import xe from"node:fs";import St from"node:path";async function Se(t){return new Promise((e,r)=>{let n=new yt({zlib:{level:9}}),o=new xt,s=[];o.on("data",i=>s.push(i)),o.on("end",()=>e(Buffer.concat(s))),o.on("error",r),n.on("error",r),n.pipe(o);for(let i of t)n.append(i.buffer,{name:i.path});n.finalize()})}async function te(t,e){let r=St.dirname(e);xe.existsSync(r)||xe.mkdirSync(r,{recursive:!0});let n=await Se(t);return xe.writeFileSync(e,n),n.length}var ve=F(()=>{"use strict"});var $,Oe,Be=F(()=>{"use strict";$={NAME:"ADBSnap",VERSION:"1.2.0",TAGLINE:"Automated Mobile Showcase & App Store Asset Studio",DESCRIPTION:"CLI tool to capture, frame, and export mobile screenshots directly via ADB."},Oe=`
ADBSnap / Snapshot \u2014 Automated Mobile Showcase Studio v${$.VERSION}

USAGE:
  adbsnap [command] [options]
  snapshot [command] [options]

COMMANDS:
  snap                 Capture live screenshot and frame into showcase graphic (default)
  explore [package]    Autonomous hands-free screen discovery & tab crawler
  crawl [package]      Tab crawler (auto-detects & captures all bottom tabs)
  run [config]         Execute automated scripted journey from JSON (launch, type, tap, snap)
  export               Auto-export across App Store & Google Play resolutions
  journey              Interactive multi-screen capture wizard (guided carousel)
  devices              List all connected USB, Wi-Fi, and emulator devices
  wifi [ip|off]        Switch device to wireless ADB mode or turn off (adbsnap wifi off)
  usb                  Reset ADB connection back to USB mode (turn off wireless)
  doctor               Verify ADB installation, device health, and permissions
  studio               Launch the desktop interactive web dashboard (http://adbsnap.localhost:3000)
  help                 Display this guide


SNAP & EXPORT OPTIONS:
  --frame <bezel>      Phone bezel chassis (default: iphone-16-pro)
                       Available: iphone-16-pro, pixel-9-pro, minimal
  --theme <preset>     Backdrop color gradient (default: aurora)
                       Available: aurora, studioLight, freshMint, sunset, midnight, royal, cleanDark
  --layout <mode>      Layout positioning mode (default: appstore)
                       Available: appstore (bottom bleed), social (floating centered)
  --fit <mode>         Screenshot aspect ratio scaling (default: cover)
                       Available: cover (safe aspect ratio), contain, fill
  --font <preset|name> Typography font family (default: modern)
                       Available: modern, rounded, editorial, mono, or custom font name
  --title <text>       Headline text on canvas (auto-wraps long titles)
  --subtitle <text>    Subtitle description under headline
  --stars              Display 5-star rating chip (\u2605\u2605\u2605\u2605\u2605 5.0 RATED)
  --zip                Package outputs into a single .zip archive for instant store upload
  --config <path>      Load project settings & screens from JSON (e.g. adbsnap.config.json)
  --device <id>        Target specific device ID (defaults to first ready device)
  --out <path>         Custom output file path
  --raw                Skip device framing and export raw mobile screenshot

EXAMPLES:
  adbsnap snap
  adbsnap snap --theme studioLight --title "Minimal Productivity"
  adbsnap explore com.example.app --theme aurora --zip
  adbsnap export --theme studioLight --zip
  adbsnap doctor
  adbsnap devices
  adbsnap wifi 192.168.1.100
`});function at(t="1.2.0"){return`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio</title>
  <style>
    :root {
      --bg: #090b10;
      --card: #121620;
      --border: #1e2638;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    
    header {
      height: 60px;
      border-bottom: 1px solid var(--border);
      background: rgba(18, 22, 32, 0.85);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.1rem; }
    .brand-badge {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: white;
      font-weight: 600;
    }
    .header-device { display: flex; align-items: center; gap: 10px; }
    select, input, button {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    select:focus, input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
    button {
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:hover { background: #1c2333; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
      font-weight: 600;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-success {
      background: #059669;
      border-color: #059669;
      color: white;
      font-weight: 600;
    }
    .btn-success:hover { background: #047857; }

    main {
      display: grid;
      grid-template-columns: 400px 1fr;
      flex: 1;
      height: calc(100vh - 60px);
      overflow: hidden;
    }
    
    .sidebar {
      border-right: 1px solid var(--border);
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: #0c0f17;
    }
    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 700;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

    .color-chip {
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.15s, border-color 0.15s;
    }
    .color-chip:hover { transform: scale(1.05); }
    .color-chip.active { border-color: #fff; box-shadow: 0 0 10px rgba(255,255,255,0.3); }

    .preview-area {
      background: radial-gradient(circle at center, #171d2b 0%, #090b10 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      position: relative;
      overflow: hidden;
    }
    .preview-card {
      max-height: 80vh;
      max-width: 90%;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      object-fit: contain;
      transition: opacity 0.2s;
    }
    .preview-card.loading { opacity: 0.5; }

    .status-bar {
      position: absolute;
      bottom: 16px;
      background: rgba(18, 22, 32, 0.8);
      border: 1px solid var(--border);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
    
    .spinner {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
      </svg>
      ADBSnap Studio
      <span class="brand-badge">v${t}</span>
    </div>
    <div class="header-device">
      <select id="deviceSelect">
        <option value="">Detecting devices...</option>
      </select>
      <button id="refreshDevicesBtn" title="Refresh Devices">
        Refresh
      </button>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <div>
        <div class="section-title">Screen Capture</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="captureBtn" class="btn-primary" style="justify-content: center; height: 42px;">
            Capture Live Device
          </button>
          <div>
            <input type="file" id="fileInput" accept="image/*" style="display: none;">
            <button id="uploadBtn" style="width: 100%; justify-content: center;">
              Upload Local Image
            </button>
          </div>
        </div>
      </div>

      <div>
        <div class="section-title">Device Bezel Chassis</div>
        <select id="bezelSelect" style="width: 100%;">
          <option value="iphone-16-pro">iPhone 16 Pro Max (Titanium)</option>
          <option value="iphone-16">iPhone 16 (Dynamic Island)</option>
          <option value="pixel-9-pro">Google Pixel 9 Pro (Punch Hole)</option>
          <option value="galaxy-s24-ultra">Samsung Galaxy S24 Ultra</option>
          <option value="ipad-pro-13">Apple iPad Pro 13" M4</option>
          <option value="minimal">Clean Minimalist</option>
          <option value="none">No Bezel (Raw Screen)</option>
        </select>
      </div>

      <div>
        <div class="section-title">Color Gradient Theme</div>
        <div class="grid-4" id="themeGrid">
          <div class="color-chip active" data-theme="aurora" style="background: linear-gradient(135deg, #0f172a, #4c1d95, #1e1b4b);" title="Aurora Borealis"></div>
          <div class="color-chip" data-theme="studioLight" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid #ddd;" title="Studio Light"></div>
          <div class="color-chip" data-theme="freshMint" style="background: linear-gradient(135deg, #0f172a, #064e3b, #022c22);" title="Fresh Mint"></div>
          <div class="color-chip" data-theme="sunset" style="background: linear-gradient(135deg, #450a0a, #7f1d1d, #18181b);" title="Sunset Crimson"></div>
          <div class="color-chip" data-theme="midnight" style="background: linear-gradient(135deg, #090d16, #111827, #030712);" title="Midnight Obsidian"></div>
          <div class="color-chip" data-theme="royal" style="background: linear-gradient(135deg, #172554, #1e1b4b, #0f172a);" title="Royal Indigo"></div>
          <div class="color-chip" data-theme="cleanDark" style="background: linear-gradient(135deg, #18181b, #09090b);" title="Clean Dark"></div>
          <div class="color-chip" data-theme="none" style="background: repeating-conic-gradient(#222 0% 25%, #111 0% 50%) 50% / 10px 10px;" title="Transparent / None"></div>
        </div>
      </div>

      <div>
        <div class="section-title">Layout Mode</div>
        <div class="grid-2">
          <button id="layoutAppStore" class="btn-primary" style="justify-content: center;">App Store</button>
          <button id="layoutSocial" style="justify-content: center;">Social Post</button>
        </div>
      </div>

      <div>
        <div class="section-title">Marketing Typography</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="titleInput" placeholder="Headline text" value="Seamless Experience">
          <input type="text" id="subtitleInput" placeholder="Subtitle text" value="Engineered for mobile excellence">
          <div class="grid-2">
            <select id="fontSelect">
              <option value="modern">Modern Sans</option>
              <option value="rounded">Rounded Casual</option>
              <option value="editorial">Editorial Serif</option>
              <option value="mono">Technical Mono</option>
            </select>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
              <input type="checkbox" id="starsCheck" checked style="cursor: pointer;">
              \u2605\u2605\u2605\u2605\u2605 5.0
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border);">
        <button id="downloadBtn" style="justify-content: center; height: 38px;">
          Download PNG Preview
        </button>
        <button id="exportZipBtn" class="btn-success" style="justify-content: center; height: 42px;">
          Export Store Bundle (.ZIP)
        </button>
      </div>
    </div>

    <div class="preview-area">
      <div class="spinner" id="spinner"></div>
      <img id="previewImg" class="preview-card" alt="Composite Preview" style="display: none;">
      <div id="emptyState" style="text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text);">Ready for Screenshot</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">Click "Capture Live Device" or upload an image to begin</div>
      </div>
      <div class="status-bar">
        <div class="status-dot"></div>
        <span id="statusText">Studio Engine Active (0ms)</span>
      </div>
    </div>
  </main>

  <script>
    const state = {
      deviceId: '',
      screenshotBase64: '',
      bezelId: 'iphone-16-pro',
      theme: 'aurora',
      layout: 'appstore',
      title: 'Seamless Experience',
      subtitle: 'Engineered for mobile excellence',
      font: 'modern',
      showStars: true,
    };

    const previewImg = document.getElementById('previewImg');
    const emptyState = document.getElementById('emptyState');
    const spinner = document.getElementById('spinner');
    const statusText = document.getElementById('statusText');
    const deviceSelect = document.getElementById('deviceSelect');

    function showLoading(isLoading) {
      spinner.style.display = isLoading ? 'block' : 'none';
      if (isLoading) previewImg.classList.add('loading');
      else previewImg.classList.remove('loading');
    }

    async function loadDevices() {
      try {
        const res = await fetch('/api/devices');
        const data = await res.json();
        deviceSelect.innerHTML = '';
        if (data.devices && data.devices.length > 0) {
          data.devices.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = (d.model || d.id) + ' (' + d.type.toUpperCase() + ')';
            deviceSelect.appendChild(opt);
          });
          state.deviceId = data.devices[0].id;
          statusText.textContent = 'Device ready: ' + (data.devices[0].model || data.devices[0].id);
        } else {
          deviceSelect.innerHTML = '<option value="">No devices connected</option>';
          statusText.textContent = 'No ADB devices detected';
        }
      } catch (err) {
        statusText.textContent = 'Failed to query ADB devices';
      }
    }

    async function updatePreview() {
      if (!state.screenshotBase64) return;
      showLoading(true);
      const start = performance.now();
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'preview',
            screenshotBase64: state.screenshotBase64,
            bezelId: state.bezelId,
            gradientPreset: state.theme,
            layout: state.layout,
            title: state.title,
            subtitle: state.subtitle,
            font: state.font,
            showStarBadge: state.showStars,
          })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          previewImg.src = 'data:image/png;base64,' + data.base64;
          previewImg.style.display = 'block';
          emptyState.style.display = 'none';
          const elapsed = Math.round(performance.now() - start);
          statusText.textContent = 'Rendered in ' + elapsed + 'ms (' + data.width + 'x' + data.height + 'px)';
        }
      } catch (err) {
        statusText.textContent = 'Preview rendering error';
      } finally {
        showLoading(false);
      }
    }

    async function captureScreen() {
      showLoading(true);
      statusText.textContent = 'Capturing frame from ADB...';
      try {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: state.deviceId })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          state.screenshotBase64 = data.base64;
          await updatePreview();
        } else {
          alert('Capture failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to trigger capture from device');
      } finally {
        showLoading(false);
      }
    }

    document.getElementById('captureBtn').addEventListener('click', captureScreen);
    document.getElementById('refreshDevicesBtn').addEventListener('click', loadDevices);
    deviceSelect.addEventListener('change', (e) => state.deviceId = e.target.value);

    document.getElementById('bezelSelect').addEventListener('change', (e) => {
      state.bezelId = e.target.value;
      updatePreview();
    });

    document.querySelectorAll('.color-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.theme = chip.dataset.theme;
        updatePreview();
      });
    });

    const appStoreBtn = document.getElementById('layoutAppStore');
    const socialBtn = document.getElementById('layoutSocial');
    appStoreBtn.addEventListener('click', () => {
      appStoreBtn.classList.add('btn-primary');
      socialBtn.classList.remove('btn-primary');
      state.layout = 'appstore';
      updatePreview();
    });
    socialBtn.addEventListener('click', () => {
      socialBtn.classList.add('btn-primary');
      appStoreBtn.classList.remove('btn-primary');
      state.layout = 'social';
      updatePreview();
    });

    let debounceTimer;
    function debouncedUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, 300);
    }

    document.getElementById('titleInput').addEventListener('input', (e) => {
      state.title = e.target.value;
      debouncedUpdate();
    });
    document.getElementById('subtitleInput').addEventListener('input', (e) => {
      state.subtitle = e.target.value;
      debouncedUpdate();
    });
    document.getElementById('fontSelect').addEventListener('change', (e) => {
      state.font = e.target.value;
      updatePreview();
    });
    document.getElementById('starsCheck').addEventListener('change', (e) => {
      state.showStars = e.target.checked;
      updatePreview();
    });

    document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.screenshotBase64 = evt.target.result.split(',')[1];
        updatePreview();
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
      if (!previewImg.src) return alert('Capture or upload a screen first!');
      const a = document.createElement('a');
      a.href = previewImg.src;
      a.download = 'adbsnap-' + state.bezelId + '-' + state.theme + '.png';
      a.click();
    });

    document.getElementById('exportZipBtn').addEventListener('click', async () => {
      if (!state.screenshotBase64) return alert('Capture or upload a screen first!');
      showLoading(true);
      statusText.textContent = 'Generating App Store & Google Play assets into ZIP...';
      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'zip',
            screenshotBase64: state.screenshotBase64,
            bezelId: state.bezelId,
            gradientPreset: state.theme,
            layout: state.layout,
            title: state.title,
            subtitle: state.subtitle,
            font: state.font,
            showStarBadge: state.showStars,
          })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adbsnap-export-' + Date.now() + '.zip';
        a.click();
        window.URL.revokeObjectURL(url);
        statusText.textContent = 'ZIP bundle successfully exported!';
      } catch (err) {
        alert('Failed to export ZIP package');
      } finally {
        showLoading(false);
      }
    });

    loadDevices();
  </script>
</body>
</html>`}var ct=F(()=>{"use strict"});var lt={};Ne(lt,{startStudioServer:()=>Vt});import Ht from"node:http";function Vt(t){let e=t.port||3e3;return new Promise((r,n)=>{let o=Ht.createServer(async(s,i)=>{if(i.setHeader("Access-Control-Allow-Origin","*"),i.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS"),i.setHeader("Access-Control-Allow-Headers","Content-Type"),s.method==="OPTIONS")return i.writeHead(204),i.end();let a=s.headers.host||"localhost",b=new URL(s.url||"/",`http://${a}`).pathname;if(s.method==="GET"&&(b==="/"||b==="/index.html"))return i.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}),i.end(at($.VERSION));async function h(){return new Promise((c,u)=>{let d=[];s.on("data",f=>d.push(f)),s.on("end",()=>{try{let f=Buffer.concat(d).toString("utf8");c(f?JSON.parse(f):{})}catch(f){u(f)}}),s.on("error",u)})}function l(c,u=200){i.writeHead(u,{"Content-Type":"application/json"}),i.end(JSON.stringify(c))}if(s.method==="GET"&&b==="/api/devices")try{let c=await x.listDevices(),u=null;if(c.some(d=>d.isAuthorized))try{u=await x.getForegroundApp()}catch{}return l({success:!0,devices:c,activeApp:u})}catch(c){return l({success:!1,error:String(c)},500)}if(s.method==="POST"&&b==="/api/capture")try{let c=await h(),u=performance.now(),d=await x.captureScreenshot(c.deviceId),f=Math.round(performance.now()-u);return l({success:!0,base64:d.toString("base64"),sizeBytes:d.length,latencyMs:f})}catch(c){return l({success:!1,error:String(c)},500)}if(s.method==="POST"&&b==="/api/export")try{let c=await h(),u=Buffer.from(c.screenshotBase64,"base64");if(c.mode==="zip"){let f=(await de({screenshotBuffer:u,bezelId:c.bezelId,gradientPreset:c.gradientPreset,layout:c.layout,title:c.title,subtitle:c.subtitle,font:c.font,showStarBadge:c.showStarBadge})).map(S=>({path:S.path,buffer:S.buffer})),y=await Se(f);return i.writeHead(200,{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="adbsnap-export-${Date.now()}.zip"`,"Content-Length":y.length}),i.end(y)}else{let d=await L({screenshotBuffer:u,bezelId:c.bezelId,gradientPreset:c.gradientPreset,layout:c.layout,title:c.title,subtitle:c.subtitle,font:c.font,showStarBadge:c.showStarBadge,canvasWidth:1290,canvasHeight:2796});return l({success:!0,base64:d.buffer.toString("base64"),width:d.width,height:d.height,elapsedMs:d.elapsedMs})}}catch(c){return l({success:!1,error:String(c)},500)}i.writeHead(404,{"Content-Type":"text/plain"}),i.end("Not Found")});o.listen(e,"0.0.0.0",()=>{r(o)}),o.on("error",n)})}var dt=F(()=>{"use strict";J();ue();ve();ct();Be()});J();ue();ve();import E from"node:fs";import C from"node:path";import Yt from"node:readline/promises";import{stdin as Zt,stdout as Xt}from"node:process";import{parseArgs as Jt}from"node:util";J();me();function vt(t){return t.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/'/g,"\\'").replace(/ /g,"%s").replace(/&/g,"\\&").replace(/</g,"\\<").replace(/>/g,"\\>").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/;/g,"\\;").replace(/\|/g,"\\|").replace(/\$/g,"\\$")}function Et(t){let e=t.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);if(!e)return{x1:0,y1:0,x2:0,y2:0,width:0,height:0,centerX:0,centerY:0};let r=parseInt(e[1],10),n=parseInt(e[2],10),o=parseInt(e[3],10),s=parseInt(e[4],10);return{x1:r,y1:n,x2:o,y2:s,width:o-r,height:s-n,centerX:Math.round((r+o)/2),centerY:Math.round((n+s)/2)}}function At(t){let e=t.match(/<hierarchy[^>]*>([\s\S]*?)<\/hierarchy>/i);if(!e)throw new Error("No valid <hierarchy> tag found in UI automator output.");let r=e[1],n=/<node\b([^>]*?)(\/?)>|<\/node>/gi,o=/([a-zA-Z0-9_-]+)="([^"]*)"/g,s=[],i=[],a=[],g;for(;(g=n.exec(r))!==null;){let b=g[0],h=g[1],l=g[2]==="/";if(b.startsWith("</")){a.pop();continue}let c={},u;for(;(u=o.exec(h))!==null;)c[u[1]]=u[2];let d=Et(c.bounds||""),f={index:parseInt(c.index||"0",10),text:c.text||"",resourceId:c["resource-id"]||"",className:c.class||"",packageName:c.package||"",contentDesc:c["content-desc"]||"",bounds:d,clickable:c.clickable==="true",enabled:c.enabled==="true",focused:c.focused==="true",scrollable:c.scrollable==="true",password:c.password==="true",selected:c.selected==="true",children:[]};a.length>0?a[a.length-1].children.push(f):s.push(f),i.push(f),l||a.push(f)}return{root:s,flat:i}}function Tt(t,e){return t.filter(r=>{if(e.clickable!==void 0&&r.clickable!==e.clickable||e.className&&r.className!==e.className)return!1;if(e.text!==void 0){if(typeof e.text=="string"){let n=e.text.toLowerCase();if(!r.text.toLowerCase().includes(n))return!1}else if(!e.text.test(r.text))return!1}if(e.resourceId!==void 0){if(typeof e.resourceId=="string"){let n=e.resourceId.toLowerCase();if(!r.resourceId.toLowerCase().includes(n))return!1}else if(!e.resourceId.test(r.resourceId))return!1}if(e.contentDesc!==void 0){if(typeof e.contentDesc=="string"){let n=e.contentDesc.toLowerCase();if(!r.contentDesc.toLowerCase().includes(n))return!1}else if(!e.contentDesc.test(r.contentDesc))return!1}return!0})}function Ct(t,e){return Tt(t,e)[0]}function Pt(t){if(t.length===0)return[];let r=Math.max(...t.map(a=>a.bounds.y2))*.72,n=t.filter(a=>{let g=a.bounds.centerY>=r,b=!!(a.text.trim()||a.contentDesc.trim());return g&&b});if(n.length===0)return[];let o=new Map;for(let a of n){let g=null;for(let b of o.keys())if(Math.abs(b-a.bounds.centerY)<=50){g=b;break}g!==null?o.get(g).push(a):o.set(a.bounds.centerY,[a])}let s=[];for(let a of o.values())a.length>=2&&a.length<=8&&a.length>s.length&&(s=a);if(s.length===0)return[];s.sort((a,g)=>a.bounds.centerX-g.bounds.centerX);let i=[];for(let a of s){let g=(a.text||a.contentDesc||`Tab ${i.length+1}`).trim();i.some(h=>Math.abs(h.bounds.centerX-a.bounds.centerX)<60||h.title.toLowerCase()===g.toLowerCase())||i.push({title:g,bounds:a.bounds,node:a})}return i}var Ee=class{async dumpHierarchy(e){let r=e?["-s",e]:[],n=await x.exec([...r,...T.UIAUTOMATOR_DUMP]);return At(n)}async tap(e,r,n){let o=n?["-s",n]:[];await x.exec([...o,...T.INPUT_TAP(e,r)])}async typeText(e,r){let n=r?["-s",r]:[],o=vt(e);await x.exec([...n,...T.INPUT_TEXT(o)])}async pressKey(e,r){let n=r?["-s",r]:[];await x.exec([...n,...T.INPUT_KEY(e)])}async swipe(e,r,n,o,s=300,i){let a=i?["-s",i]:[];await x.exec([...a,...T.INPUT_SWIPE(e,r,n,o,s)])}async tapElement(e,r){let{flat:n}=await this.dumpHierarchy(r),o=Ct(n,e);if(!o){let s=n.filter(i=>i.text||i.contentDesc||i.resourceId).slice(0,10).map(i=>`"${i.text||i.contentDesc||i.resourceId}"`).join(", ");throw new Error(`Element matching ${JSON.stringify(e)} not found. Sample elements on screen: [${s}]`)}return await this.tap(o.bounds.centerX,o.bounds.centerY,r),o}async tapAndType(e,r,n,o=300){let s=await this.tapElement(e,n);return o>0&&await new Promise(i=>setTimeout(i,o)),await this.typeText(r,n),s}async waitForLayoutSettle(e=4e3,r=400,n){let o=performance.now(),s=-1;for(;performance.now()-o<e;){try{let{flat:i}=await this.dumpHierarchy(n);if(i.length===s&&i.length>5)return;s=i.length}catch{}await new Promise(i=>setTimeout(i,r))}}async crawlTabs(e,r){let{flat:n}=await this.dumpHierarchy(e),o=Pt(n);if(o.length===0)throw new Error("No bottom navigation tab bar detected on the active screen.");let s=[];for(let i=0;i<o.length;i++){let a=o[i];r&&r(a,i,o.length);let g=performance.now();await this.tap(a.bounds.centerX,a.bounds.centerY,e),await new Promise(l=>setTimeout(l,600));let b=await x.captureScreenshot(e),h=Math.round(performance.now()-g);s.push({tabIndex:i+1,title:a.title,screenshotBuffer:b,elapsedMs:h})}return s}async autoLogin(e,r){if(!e.username&&!e.password)return!1;let{flat:n}=await this.dumpHierarchy(r),o=n.find(a=>(a.className.includes("EditText")||a.clickable)&&!a.password&&(a.text.toLowerCase().includes("email")||a.text.toLowerCase().includes("user")||a.resourceId.toLowerCase().includes("email")||a.resourceId.toLowerCase().includes("user"))),s=n.find(a=>a.password||a.className.includes("EditText")&&(a.text.toLowerCase().includes("pass")||a.resourceId.toLowerCase().includes("pass"))),i=!1;if(o&&e.username&&(await this.tap(o.bounds.centerX,o.bounds.centerY,r),await new Promise(a=>setTimeout(a,200)),await this.typeText(e.username,r),i=!0),s&&e.password&&(await this.tap(s.bounds.centerX,s.bounds.centerY,r),await new Promise(a=>setTimeout(a,200)),await this.typeText(e.password,r),i=!0),i){let a=n.find(g=>g.clickable&&(g.text.toLowerCase().includes("sign in")||g.text.toLowerCase().includes("log in")||g.text.toLowerCase().includes("login")||g.text.toLowerCase().includes("continue")));a&&(await new Promise(g=>setTimeout(g,300)),await this.tap(a.bounds.centerX,a.bounds.centerY,r),await new Promise(g=>setTimeout(g,1200)))}return i}},H=new Ee;J();async function Ye(t,e,r){t.killApp&&await t.killApp(e,r),t.resetAppData&&await t.resetAppData(e,r),t.launchApp&&await t.launchApp(e,r)}ue();var Ae=class{resolveValue(e,r){if(!r)return e;let n=e;return r.username&&(n=n.replace(/\$auth\.username/g,r.username)),r.password&&(n=n.replace(/\$auth\.password/g,r.password)),n}async runFlow(e,r){let n=r?.deviceId,o=e.flow,s=[],i=e.theme||"studioLight",a=e.frame||"iphone-16-pro",g=e.layout||"appstore",b=e.font||"modern";for(let h=0;h<o.length;h++){let l=o[h],c=h+1;switch(l.type){case"reset":{r?.onProgress&&r.onProgress(c,o.length,l,`Wiping cache & tokens for ${l.package}`),await x.resetAppData(l.package,n);break}case"kill":{r?.onProgress&&r.onProgress(c,o.length,l,`Killing app process ${l.package}`),await x.killApp(l.package,n);break}case"launch":{r?.onProgress&&r.onProgress(c,o.length,l,`${l.fresh?"Fresh restarting":"Launching"} ${l.package}`),l.fresh?await Ye(x,l.package,n):await x.launchApp(l.package,n),await new Promise(u=>setTimeout(u,1200));break}case"tap":{let u=typeof l.target=="string"?{text:l.target}:l.target,d=typeof l.target=="string"?l.target:JSON.stringify(l.target);r?.onProgress&&r.onProgress(c,o.length,l,`Tapping element: "${d}"`),await H.tapElement(u,n),await new Promise(f=>setTimeout(f,l.waitMs??500));break}case"type":{let u=this.resolveValue(l.value,e.auth);if(l.target){let d=typeof l.target=="string"?{text:l.target}:l.target,f=typeof l.target=="string"?l.target:JSON.stringify(l.target);r?.onProgress&&r.onProgress(c,o.length,l,`Typing into "${f}"`),await H.tapAndType(d,u,n)}else r?.onProgress&&r.onProgress(c,o.length,l,`Typing text: "${u}"`),await H.typeText(u,n);await new Promise(d=>setTimeout(d,l.waitMs??400));break}case"wait":{r?.onProgress&&r.onProgress(c,o.length,l,`Waiting for ${l.durationMs}ms...`),await new Promise(u=>setTimeout(u,l.durationMs));break}case"waitForText":{r?.onProgress&&r.onProgress(c,o.length,l,`Waiting for "${l.text}" to appear on screen...`);let u=l.timeoutMs??5e3,d=performance.now(),f=!1;for(;performance.now()-d<u;){try{let{flat:y}=await H.dumpHierarchy(n);if(y.some(S=>S.text.toLowerCase().includes(l.text.toLowerCase()))){f=!0;break}}catch{}await new Promise(y=>setTimeout(y,400))}if(!f)throw new Error(`Timeout after ${u}ms waiting for text: "${l.text}"`);break}case"key":{r?.onProgress&&r.onProgress(c,o.length,l,`Dispatching key event: ${l.code}`),await H.pressKey(l.code,n),await new Promise(u=>setTimeout(u,300));break}case"snap":{r?.onProgress&&r.onProgress(c,o.length,l,`Capturing screen: "${l.title}"`);let u=performance.now(),d=await x.captureScreenshot(n),f=await L({screenshotBuffer:d,bezelId:a,gradientPreset:i,layout:g,font:b,title:l.title,subtitle:l.subtitle,showStarBadge:l.stars??!0}),y=Math.round(performance.now()-u);s.push({name:l.name,title:l.title,subtitle:l.subtitle,rawBuffer:d,compositedBuffer:f.buffer,elapsedMs:y});break}}}return s}},Ze=new Ae;function Xe(t,e,r){let n=t.indexOf(e);if(n===-1)return t;let o=e.length,s=0,i="";do i+=t.slice(s,n)+e+r,s=n+o,n=t.indexOf(e,s);while(n!==-1);return i+=t.slice(s),i}function Je(t,e,r,n){let o=0,s="";do{let i=t[n-1]==="\r";s+=t.slice(o,i?n-1:n)+e+(i?`\r
`:`
`)+r,o=n+1,n=t.indexOf(`
`,o)}while(n!==-1);return s+=t.slice(o),s}var Ke=(t=0)=>e=>`\x1B[${e+t}m`,Te=(t=0)=>e=>`\x1B[${38+t};5;${e}m`,Ce=(t=0)=>(e,r,n)=>`\x1B[${38+t};2;${e};${r};${n}m`,$t=t=>`\x1B[58;5;${t<90?t-30:t-90+8}m`,v={modifier:{reset:[0,0],bold:[1,22],dim:[2,22],italic:[3,23],underline:[4,24],underlineDouble:["4:2",24],underlineCurly:["4:3",24],underlineDotted:["4:4",24],underlineDashed:["4:5",24],overline:[53,55],inverse:[7,27],hidden:[8,28],strikethrough:[9,29]},color:{black:[30,39],red:[31,39],green:[32,39],yellow:[33,39],blue:[34,39],magenta:[35,39],cyan:[36,39],white:[37,39],blackBright:[90,39],gray:[90,39],grey:[90,39],redBright:[91,39],greenBright:[92,39],yellowBright:[93,39],blueBright:[94,39],magentaBright:[95,39],cyanBright:[96,39],whiteBright:[97,39]},bgColor:{bgBlack:[40,49],bgRed:[41,49],bgGreen:[42,49],bgYellow:[43,49],bgBlue:[44,49],bgMagenta:[45,49],bgCyan:[46,49],bgWhite:[47,49],bgBlackBright:[100,49],bgGray:[100,49],bgGrey:[100,49],bgRedBright:[101,49],bgGreenBright:[102,49],bgYellowBright:[103,49],bgBlueBright:[104,49],bgMagentaBright:[105,49],bgCyanBright:[106,49],bgWhiteBright:[107,49]},underlineColor:{underlineBlack:["58;5;0",59],underlineRed:["58;5;1",59],underlineGreen:["58;5;2",59],underlineYellow:["58;5;3",59],underlineBlue:["58;5;4",59],underlineMagenta:["58;5;5",59],underlineCyan:["58;5;6",59],underlineWhite:["58;5;7",59],underlineBlackBright:["58;5;8",59],underlineGray:["58;5;8",59],underlineGrey:["58;5;8",59],underlineRedBright:["58;5;9",59],underlineGreenBright:["58;5;10",59],underlineYellowBright:["58;5;11",59],underlineBlueBright:["58;5;12",59],underlineMagentaBright:["58;5;13",59],underlineCyanBright:["58;5;14",59],underlineWhiteBright:["58;5;15",59]}},Ur=Object.keys(v.modifier),Dt=Object.keys(v.color),Ot=Object.keys(v.bgColor),zr=Object.keys(v.underlineColor),Gr=[...Dt,...Ot];function Bt(){let t=new Map;for(let[e,r]of Object.entries(v)){for(let[n,o]of Object.entries(r))v[n]={open:`\x1B[${o[0]}m`,close:`\x1B[${o[1]}m`},r[n]=v[n],t.set(Number.parseInt(o[0],10),o[1]);Object.defineProperty(v,e,{value:r,enumerable:!1})}return Object.defineProperty(v,"codes",{value:t,enumerable:!1}),v.color.close="\x1B[39m",v.bgColor.close="\x1B[49m",v.underlineColor.close="\x1B[59m",v.color.ansi=Ke(),v.color.ansi256=Te(),v.color.ansi16m=Ce(),v.bgColor.ansi=Ke(10),v.bgColor.ansi256=Te(10),v.bgColor.ansi16m=Ce(10),v.underlineColor.ansi=$t,v.underlineColor.ansi256=Te(20),v.underlineColor.ansi16m=Ce(20),Object.defineProperties(v,{rgbToAnsi256:{value(e,r,n){return e===r&&r===n?e<8?16:e>248?231:Math.round((e-8)/247*24)+232:16+36*Math.round(e/255*5)+6*Math.round(r/255*5)+Math.round(n/255*5)},enumerable:!1},hexToRgb:{value(e){let r=/[\da-f]{6}|[\da-f]{3}/i.exec(e.toString(16));if(!r)return[0,0,0];let[n]=r;n.length===3&&(n=[...n].map(s=>s+s).join(""));let o=Number.parseInt(n,16);return[o>>16&255,o>>8&255,o&255]},enumerable:!1},hexToAnsi256:{value:e=>v.rgbToAnsi256(...v.hexToRgb(e)),enumerable:!1},ansi256ToAnsi:{value(e){if(e<8)return 30+e;if(e<16)return 90+(e-8);let r,n,o;if(e>=232)r=((e-232)*10+8)/255,n=r,o=r;else{e-=16;let a=e%36;r=Math.floor(e/36)/5,n=Math.floor(a/6)/5,o=a%6/5}let s=Math.max(r,n,o)*2;if(s===0)return 30;let i=30+(Math.round(o)<<2|Math.round(n)<<1|Math.round(r));return s===2&&(i+=60),i},enumerable:!1},rgbToAnsi:{value:(e,r,n)=>v.ansi256ToAnsi(v.rgbToAnsi256(e,r,n)),enumerable:!1},hexToAnsi:{value:e=>v.ansi256ToAnsi(v.hexToAnsi256(e)),enumerable:!1}}),v}var It=Bt(),U=It;import Pe from"node:process";import Rt from"node:os";import qe from"node:tty";function M(t,e=globalThis.Deno?globalThis.Deno.args:Pe.argv){let r=t.startsWith("-")?"":t.length===1?"-":"--",n=e.indexOf(r+t),o=e.indexOf("--");return n!==-1&&(o===-1||n<o)}var{env:A}=Pe,pe;M("no-color")||M("no-colors")||M("color=false")||M("color=never")?pe=0:(M("color")||M("colors")||M("color=true")||M("color=always"))&&(pe=1);function et(){return/^\d+$/.test(A.FORCE_COLOR)}function Nt(){if("FORCE_COLOR"in A){if(A.FORCE_COLOR==="false")return 0;if(A.FORCE_COLOR==="true"||A.FORCE_COLOR.length===0)return 1;if(et())return Math.min(Number.parseInt(A.FORCE_COLOR,10),3)}}function Mt(t){return t===0?!1:{level:t,hasBasic:!0,has256:t>=2,has16m:t>=3}}function kt(t,{streamIsTTY:e,sniffFlags:r=!0}={}){let n=Nt();n!==void 0&&(pe=n);let o=r?pe:n;if(o===0)return 0;if(r){if(M("color=16m")||M("color=full")||M("color=truecolor"))return 3;if(M("color=256"))return 2}if(o!==void 0&&et())return o;if("TF_BUILD"in A&&"AGENT_NAME"in A)return 1;if(t&&!e&&o===void 0)return 0;let s=o||0;if(A.TERM==="dumb")return s;if(Pe.platform==="win32"){let i=Rt.release().split(".");return Number(i[0])>=10&&Number(i[2])>=10586?Number(i[2])>=14931?3:2:1}if("CI"in A)return["GITHUB_ACTIONS","GITEA_ACTIONS","CIRCLECI"].some(i=>i in A)?3:["TRAVIS","APPVEYOR","GITLAB_CI","BUILDKITE","DRONE"].some(i=>i in A)||A.CI_NAME==="codeship"?1:s;if("TEAMCITY_VERSION"in A)return/^(?:9\.0*[1-9]\d*\.|\d{2,}\.)/.test(A.TEAMCITY_VERSION)?1:0;if(A.COLORTERM==="truecolor"||A.TERM==="xterm-kitty"||A.TERM==="xterm-ghostty"||A.TERM==="wezterm")return 3;if("TERM_PROGRAM"in A){let i=Number.parseInt((A.TERM_PROGRAM_VERSION||"").split(".",1)[0],10);switch(A.TERM_PROGRAM){case"iTerm.app":return i>=3?3:2;case"Apple_Terminal":return 2}}return/-256(?:color)?$/i.test(A.TERM)?2:/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(A.TERM)||"COLORTERM"in A?1:s}function Qe(t,e={}){let r=kt(t,{streamIsTTY:t&&t.isTTY,...e});return Mt(r)}var Ft={stdout:Qe({isTTY:qe.isatty(1)}),stderr:Qe({isTTY:qe.isatty(2)})},tt=Ft;var{stdout:rt,stderr:nt}=tt,re=Symbol("GENERATOR"),ne=Symbol("STYLER"),ge=Symbol("IS_EMPTY"),fe=Symbol("LEVEL"),oe=Object.create(null),ot=t=>{if(!Number.isSafeInteger(t)||t<0||t>3)throw new Error("The `level` should be an integer from 0 to 3")},_t={enumerable:!0,get(){return this[fe]},set(t){ot(t),this[fe]=t}},Lt=(t,e={})=>{e.level!==void 0&&ot(e.level);let r=rt?rt.level:0;t[fe]=e.level===void 0?r:e.level};var Ut=t=>{let e=(...r)=>r.join(" ");return Lt(e,t),Object.setPrototypeOf(e,ie.prototype),e};function ie(t){return Ut(t)}Object.setPrototypeOf(ie.prototype,Function.prototype);for(let[t,e]of Object.entries(U))oe[t]={get(){let r=De(this,it(e.open,e.close,this[ne]),this[ge]);return Object.defineProperty(this,t,{value:r}),r}};oe.visible={get(){let t=De(this,this[ne],!0);return Object.defineProperty(this,"visible",{value:t}),t}};var zt=(t,e)=>{let r=U[e];if(t==="rgb"){let o=(i,a,g)=>r.ansi(U.rgbToAnsi(i,a,g));return[o,o,(i,a,g)=>r.ansi256(U.rgbToAnsi256(i,a,g)),r.ansi16m]}if(t==="hex"){let o=i=>r.ansi(U.hexToAnsi(i));return[o,o,i=>r.ansi256(U.hexToAnsi256(i)),i=>r.ansi16m(...U.hexToRgb(i))]}let n=o=>r.ansi(U.ansi256ToAnsi(o));return[n,n,r.ansi256,r.ansi256]},Gt=["rgb","hex","ansi256"];for(let t of Gt){let e=t[0].toUpperCase()+t.slice(1);for(let[r,n]of[[t,"color"],["bg"+e,"bgColor"],["underline"+e,"underlineColor"]]){let{close:o}=U[n],s=zt(t,n);oe[r]={get(){let i=function(a,g,b){let h=s[this.level](a,g,b);return De(this,it(h,o,this[ne]),this[ge])};return Object.defineProperty(this,r,{value:i}),i}}}}var jt=Object.defineProperties(()=>{},{...oe,level:{enumerable:!0,get(){return this[re].level},set(t){this[re].level=t}}}),it=(t,e,r)=>{let n,o;return r===void 0?(n=t,o=e):(n=r.openAll+t,o=e+r.closeAll),{open:t,close:e,openAll:n,closeAll:o,parent:r}},De=(t,e,r)=>{let n=(...o)=>o.length===1?$e(n,""+o[0]):o.length===2?$e(n,o[0]+" "+o[1]):$e(n,o.join(" "));return Object.setPrototypeOf(n,jt),n[re]=t[re]??t,n[ne]=e,n[ge]=r,n},$e=(t,e)=>{if(t[re][fe]<=0||!e)return t[ge]?"":e;let r=t[ne];if(r===void 0)return e;let{openAll:n,closeAll:o}=r;if(e.includes("\x1B"))for(;r!==void 0;)e=Xe(e,r.close,r.open),r=r.parent;let s=e.indexOf(`
`);return s!==-1&&(e=Je(e,o,n,s)),n+e+o};Object.defineProperties(ie.prototype,{...oe,level:_t});var Wt=ie(),Kr=ie({level:nt?nt.level:0});var _=Wt;var m={banner:t=>_.bold.cyan(t),success:t=>_.bold.green(t),warning:t=>_.bold.yellow(t),error:t=>_.bold.red(t),info:t=>_.cyan(t),dim:t=>_.dim(t),bold:t=>_.bold(t),badgeUsb:()=>_.bgBlue.white.bold(" USB \u{1F50C} "),badgeWifi:()=>_.bgGreen.black.bold(" WI-FI \u{1F4F6} "),badgeEmulator:()=>_.bgMagenta.white.bold(" EMULATOR \u{1F4BB} ")};var st={DEVICE_NOT_FOUND:{message:"No Android device detected.",tip:"Please plug in your phone via USB with USB Debugging enabled, or run adbsnap wifi <ip>."},DEVICE_UNAUTHORIZED:{message:"Device is connected but unauthorized.",tip:'Unlock your phone screen and tap "Always allow from this computer" on the USB Debugging prompt.'},ADB_NOT_FOUND:{message:"ADB executable not found in system PATH.",tip:"Install Android Platform Tools and ensure adb.exe is accessible in PATH."},CAPTURE_FAILED:{message:"Failed to capture screenshot stream from device.",tip:"Ensure your phone screen is unlocked and not in deep sleep."},WIFI_CONNECT_FAILED:{message:"Failed to establish wireless ADB connection.",tip:"Check that both your computer and phone are connected to the exact same Wi-Fi network."},COMPOSITE_FAILED:{message:"Failed to composite screenshot frame.",tip:"Check that Sharp has valid input image buffers and SVG templates."},INVALID_COMMAND:{message:"Unknown or unrecognized command specified.",tip:'Run "adbsnap help" to view all available commands and flags.'},CRITICAL_ERROR:{message:"An unexpected critical error occurred.",tip:"Check terminal logs and device connection state."}};var p={banner:(t,e)=>{console.log(`
`+m.banner(`  === ${t} ===`)),e&&console.log(m.dim(`  ${e}`)),console.log("")},info:t=>{console.log(m.info(`\u2139  ${t}`))},success:t=>{console.log(m.success(`\u2714  ${t}`))},warn:t=>{console.log(m.warning(`\u26A0  ${t}`))},error:(t,e)=>{let r=st[t];console.log(`
`+m.error(`\u2716  Error [${t}]: ${r?.message||t}`)),e&&console.log(m.dim(`   Details: ${e}`)),r?.tip&&console.log(m.warning(`   \u{1F4A1} Tip: ${r.tip}
`))},device:(t,e,r)=>{let n=r==="wifi"?m.badgeWifi():r==="emulator"?m.badgeEmulator():m.badgeUsb();console.log(`  ${n} ${m.bold(e)} ${m.dim(`(${t})`)}`)}};var P={STARTUP_BANNER:"ADBSnap \u2014 Automated Mobile Showcase Studio",SCANNING_DEVICES:"Scanning for connected Android devices (USB & Wi-Fi)...",DEVICE_CONNECTED:(t,e)=>`Connected to ${t} (${e.toUpperCase()})`,CAPTURE_START:"Capturing in-memory screenshot stream...",CAPTURE_SUCCESS:(t,e)=>`Captured in ${t}ms (${e} KB in RAM)`,WIFI_SWITCHING:"Switching device to wireless mode on port 5555...",WIFI_SUCCESS:t=>`Wireless mode ready at ${t}:5555. You can now disconnect the USB cable!`,COMPOSITE_START:"Compositing screenshot into device frame and backdrop...",COMPOSITE_SUCCESS:(t,e,r)=>`Composited in ${t}ms (${e}x${r} px)`,SAVED_TO:t=>`Showcase asset saved to ${t}`,RAW_SAVED:t=>`Raw mobile capture saved to ${t}`,NO_DEVICES_FOUND:"No authorized Android devices detected. Connect via USB or Wi-Fi.",EXPORT_START:t=>`Generating ${t} App Store & Google Play assets...`,EXPORT_COMPLETE:(t,e)=>`Multi-store export complete: ${t} assets generated in ${e}ms`};Be();be();ye();async function Kt(){let{values:t,positionals:e}=Jt({allowPositionals:!0,options:{frame:{type:"string",default:"iphone-16-pro"},theme:{type:"string",default:"aurora"},layout:{type:"string",default:"appstore"},font:{type:"string",default:"modern"},fit:{type:"string",default:"cover"},store:{type:"string",default:"all"},title:{type:"string"},subtitle:{type:"string"},stars:{type:"boolean",default:!1},zip:{type:"boolean",default:!1},auto:{type:"boolean",default:!1},config:{type:"string"},device:{type:"string"},out:{type:"string"},port:{type:"string",default:"3000"},browser:{type:"boolean",default:!1},"no-open":{type:"boolean",default:!1},raw:{type:"boolean",default:!1},off:{type:"boolean",default:!1},help:{type:"boolean",short:"h",default:!1},version:{type:"boolean",short:"v",default:!1}}});if(t.version){console.log(`${$.NAME} v${$.VERSION}`);return}if(t.help||e[0]==="help"){console.log(Oe);return}let r=e[0]||"snap";switch(r){case"devices":await qt();break;case"doctor":await Qt();break;case"wifi":await ut(e[1],t);break;case"usb":await ut("off",t);break;case"snap":await er(t);break;case"export":await tr(t);break;case"journey":await rr(t);break;case"explore":await nr(e[1],t);break;case"crawl":await pt(e[1],t);break;case"run":await or(e[1],t);break;case"studio":await ar(t);break;default:p.error("INVALID_COMMAND",`Unknown command "${r}". Run "adbsnap help" for guide.`),console.log(Oe),process.exit(1)}}async function qt(){p.banner($.NAME,"Connected Device Discovery"),p.info(P.SCANNING_DEVICES);let t=await x.listDevices();if(t.length===0){p.warn(P.NO_DEVICES_FOUND);return}p.success(`Found ${t.length} connected device(s):
`);for(let e of t){let r=m.badgeUsb();e.type==="wifi"&&(r=m.badgeWifi()),e.type==="emulator"&&(r=m.badgeEmulator());let n=e.isAuthorized?m.success("READY"):m.error("UNAUTHORIZED");console.log(`  ${r} ${m.bold(e.model)} (${m.dim(e.id)})`),console.log(`     \u2514\u2500 Status: ${n} | Product: ${e.product||"generic"}
`)}}async function Qt(){p.banner($.NAME,"Environment Diagnostics & Device Health");let{resolveAdbPath:t}=await Promise.resolve().then(()=>(J(),ke)),e=t();console.log(`  \u2022 Node.js Version : ${m.bold(process.version)} (Target: v18+)`),console.log(`  \u2022 Operating System: ${m.bold(process.platform)} (${process.arch})`),console.log(`  \u2022 ADB Executable  : ${m.bold(e)}`);try{let r=await x.listDevices();if(r.length===0)console.log(""),p.warn("No Android devices or emulators connected right now."),p.info("\u{1F4A1} Connect your phone via USB with USB Debugging enabled, or run: adbsnap wifi <ip>");else{console.log(""),p.success(`Detected ${r.length} connected device(s):`);for(let n of r){let o=m.badgeUsb();n.type==="wifi"&&(o=m.badgeWifi()),n.type==="emulator"&&(o=m.badgeEmulator());let s=n.isAuthorized?m.success("READY"):m.error("UNAUTHORIZED (Check screen unlock prompt)");console.log(`     ${o} ${m.bold(n.model)} (${m.dim(n.id)}) -> ${s}`)}}}catch(r){p.error("ADB_NOT_FOUND",r instanceof Error?r.message:String(r))}console.log("")}async function ut(t,e){if(t==="off"||t==="stop"||t==="disable"||e?.off){p.banner($.NAME,"Wireless ADB \u2014 Revert to USB"),p.info("Disconnecting wireless sessions and resetting to USB mode...");try{x.disableWireless&&await x.disableWireless(),p.success("Wireless mode disabled. Device connection reset to USB mode.")}catch(i){p.error("WIFI_CONNECT_FAILED",i instanceof Error?i.message:String(i))}return}p.banner($.NAME,"Wireless ADB Setup");let o=(await x.listDevices()).filter(i=>i.isAuthorized);if(o.length===0){p.error("DEVICE_NOT_FOUND","Connect your Android device via USB first to enable wireless mode.");return}let s=o[0];p.info(P.WIFI_SWITCHING);try{let i=await x.enableWireless(s.id,N.DEFAULT_PORT);p.success(P.WIFI_SUCCESS(t||i))}catch(i){p.error("WIFI_CONNECT_FAILED",i instanceof Error?i.message:String(i))}}async function er(t){p.banner($.NAME,"Automated Mobile Capture & Showcase");let r=(await x.listDevices()).filter(y=>y.isAuthorized);if(r.length===0){p.error("DEVICE_NOT_FOUND",P.NO_DEVICES_FOUND);return}let n=t.device&&r.find(y=>y.id===t.device)||r[0];p.info(`Target: ${m.bold(n.model)} (${n.id}) [${n.type.toUpperCase()}]`),p.info(P.CAPTURE_START);let o=performance.now(),s=await x.captureScreenshot(n.id),i=Math.round(performance.now()-o);p.success(`Screen captured in ${i}ms (RAM stream)`);let a=N.DEFAULT_OUTPUT_DIR;E.existsSync(a)||E.mkdirSync(a,{recursive:!0});let g=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);if(t.raw){let y=t.out||C.join(a,`raw-${g}.png`);E.writeFileSync(y,s),p.success(P.RAW_SAVED(y));return}let b=t.frame||"iphone-16-pro",h=t.theme||"aurora",l=t.layout||"appstore",c=t.font||"modern",u=t.fit||"cover";K[b]||p.warn(`Unknown frame "${b}", falling back to "iphone-16-pro". Available: ${Object.keys(K).join(", ")}`),q[h]||p.warn(`Unknown theme "${h}", falling back to "aurora". Available: ${Object.keys(q).join(", ")}`),Q[l]||p.warn(`Unknown layout "${l}", falling back to "appstore". Available: ${Object.keys(Q).join(", ")}`),p.info(P.COMPOSITE_START);let d=await L({screenshotBuffer:s,bezelId:b,gradientPreset:h,layout:l,font:c,fit:u,title:t.title,subtitle:t.subtitle,showStarBadge:t.stars,typographyPosition:"top"});p.success(P.COMPOSITE_SUCCESS(d.elapsedMs,d.width,d.height));let f=t.out||C.join(a,`snap-${h}-${g}.png`);E.writeFileSync(f,d.buffer),console.log(`
`+"\u2500".repeat(50)),p.success(`Showcase Asset Ready: ${m.bold(f)}`),p.info(`Specs: ${d.width}x${d.height} px | Frame: ${b} | Theme: ${h} | Layout: ${l} | Fit: ${u} | Font: ${c}`),console.log("\u2500".repeat(50)+`
`)}async function tr(t){p.banner($.NAME,"Multi-Store Auto-Export (App Store & Google Play)");let e=t.frame||"iphone-16-pro",r=t.theme||"aurora",n=t.layout||"appstore",o=t.font||"modern",s=t.title,i=t.subtitle,a=t.stars??!1;if(t.config&&E.existsSync(t.config))try{let w=JSON.parse(E.readFileSync(t.config,"utf8"));w.theme&&(r=w.theme),w.frame&&(e=w.frame),w.layout&&(n=w.layout),w.font&&(o=w.font),w.stars!==void 0&&(a=w.stars),w.screens&&w.screens[0]&&(s||(s=w.screens[0].title),i||(i=w.screens[0].subtitle)),p.info(`Loaded configuration from: ${t.config}`)}catch{p.warn(`Failed to parse config file: ${t.config}`)}let b=(await x.listDevices()).filter(w=>w.isAuthorized);if(b.length===0){p.error("DEVICE_NOT_FOUND",P.NO_DEVICES_FOUND);return}let h=t.device&&b.find(w=>w.id===t.device)||b[0];p.info(`Target: ${m.bold(h.model)} (${h.id})`),p.info(P.CAPTURE_START);let l=performance.now(),c=await x.captureScreenshot(h.id),u=Math.round(performance.now()-l);p.success(`Screen captured in ${u}ms (RAM stream)`);let d=t.store||"all",f=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),y=t.out||C.join(N.DEFAULT_OUTPUT_DIR,`export-${r}-${f}`);p.info(P.EXPORT_START(d==="all"?4:d==="apple"?3:1));let S=performance.now(),D=await de({screenshotBuffer:c,bezelId:e,gradientPreset:r,layout:n,font:o,title:s,subtitle:i,showStarBadge:a,typographyPosition:"top",storeFilter:d}),z=Math.round(performance.now()-S),O=[];console.log(`
`+"\u2500".repeat(60));for(let w of D){let B=C.join(w.target.folder,"showcase.png"),R=C.join(y,B),k=C.dirname(R);E.existsSync(k)||E.mkdirSync(k,{recursive:!0}),E.writeFileSync(R,w.buffer),O.push({path:B,buffer:w.buffer}),p.success(`${w.target.name}`),console.log(`   \u2514\u2500 Size: ${w.width}x${w.height} px | Saved: ${m.dim(R)} (${w.elapsedMs}ms)`)}if(console.log("\u2500".repeat(60)),t.zip){let w=C.join(y,"adbsnap-store-assets.zip"),B=await te(O,w);p.success(`ZIP Archive Created: ${m.bold(w)} (${(B/1024).toFixed(1)} KB)`)}p.success(P.EXPORT_COMPLETE(D.length,z)),p.info(`Output Folder: ${m.bold(y)}
`)}async function rr(t){p.banner($.NAME,"Interactive Multi-Screen Journey Wizard");let r=(await x.listDevices()).filter(d=>d.isAuthorized);if(r.length===0){p.error("DEVICE_NOT_FOUND",P.NO_DEVICES_FOUND);return}let n=t.device&&r.find(d=>d.id===t.device)||r[0];p.info(`Device Connected: ${m.bold(n.model)} (${n.id})`);let o=[],s=t.config||(E.existsSync("adbsnap.config.json")?"adbsnap.config.json":void 0);if(s&&E.existsSync(s))try{let d=JSON.parse(E.readFileSync(s,"utf8"));d.screens&&Array.isArray(d.screens)&&(o=d.screens,p.info(`Loaded ${o.length} screens from config: ${s}`))}catch{p.warn(`Could not parse config file ${s}, using manual mode.`)}let i=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),a=t.theme||"studioLight",g=t.frame||"iphone-16-pro",b=t.layout||"appstore",h=t.font||"modern",l=t.out||C.join(N.DEFAULT_OUTPUT_DIR,`journey-${a}-${i}`);E.existsSync(l)||E.mkdirSync(l,{recursive:!0});let c=[],u=Yt.createInterface({input:Zt,output:Xt});try{if(o.length>0)for(let d=0;d<o.length;d++){let f=o[d];if(console.log(`
${m.bold(`[Step ${d+1}/${o.length}]`)} Target Screen: ${m.info(f.title)}`),t.auto)p.info("Auto mode: capturing in 1s..."),await new Promise(O=>setTimeout(O,1e3));else try{await u.question(`Press ${m.bold("[ENTER]")} when ready to capture... `)}catch{}p.info("Capturing screen...");let y=await x.captureScreenshot(n.id),S=await L({screenshotBuffer:y,bezelId:g,gradientPreset:a,layout:b,font:h,title:f.title,subtitle:f.subtitle,showStarBadge:t.stars??!0,typographyPosition:"top"}),D=`${String(d+1).padStart(2,"0")}-${f.name||"screen"}.png`,z=C.join(l,D);E.writeFileSync(z,S.buffer),c.push({path:D,buffer:S.buffer}),p.success(`Saved: ${D} (${S.elapsedMs}ms)`)}else{let d=1,f=!0;for(;f;){console.log(`
${m.bold(`[Screen ${d}]`)} Open screen #${d} on your phone.`),await u.question(`Press ${m.bold("[ENTER]")} to capture screen... `),p.info("Capturing screen...");let y=await x.captureScreenshot(n.id),S=(await u.question("Enter headline for this screen (or press [Enter] to skip): ")).trim(),D=S?(await u.question("Enter subtitle (or press [Enter] to skip): ")).trim():"",z=await L({screenshotBuffer:y,bezelId:g,gradientPreset:a,layout:b,font:h,title:S||void 0,subtitle:D||void 0,showStarBadge:t.stars??!0,typographyPosition:"top"}),O=`${String(d).padStart(2,"0")}-showcase.png`,w=C.join(l,O);E.writeFileSync(w,z.buffer),c.push({path:O,buffer:z.buffer}),p.success(`Saved screen #${d}: ${O}`);let B=(await u.question(`
Capture another screen? (y/n, default: y): `)).trim().toLowerCase();B==="n"||B==="no"?f=!1:d++}}if(t.zip!==!1&&c.length>0){let d=C.join(l,"journey-assets.zip"),f=await te(c,d);p.success(`
ZIP Bundle Created: ${m.bold(d)} (${(f/1024).toFixed(1)} KB)`)}console.log(`
`+"\u2550".repeat(60)),p.success("Journey Complete! All marketing assets saved to:"),p.info(`${m.bold(l)}`),console.log("\u2550".repeat(60)+`
`)}finally{u.close()}}async function nr(t,e={}){return pt(t,e)}async function pt(t,e={}){p.banner($.NAME,"Autonomous Bottom-Tab Crawler");let n=(await x.listDevices()).filter(u=>u.isAuthorized);if(n.length===0){p.error("DEVICE_NOT_FOUND",P.NO_DEVICES_FOUND);return}let o=e.device&&n.find(u=>u.id===e.device)||n[0];if(p.info(`Target Device: ${m.bold(o.model)} (${o.id})`),t)p.info(`Launching target application: ${m.bold(t)}...`),await x.launchApp(t,o.id),await new Promise(u=>setTimeout(u,1500));else{let u=await x.getForegroundApp(o.id);p.info(`Active App on Screen: ${m.bold(u||"unknown")}`)}p.info("Scanning active screen for bottom navigation tab bar...");let s=performance.now(),i=e.theme||"studioLight",a=e.frame||"iphone-16-pro",g=e.layout||"appstore",b=e.font||"modern",h=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),l=e.out||C.join(N.DEFAULT_OUTPUT_DIR,`crawl-${i}-${h}`);E.existsSync(l)||E.mkdirSync(l,{recursive:!0});let c=[];try{let u=await H.crawlTabs(o.id,(d,f,y)=>{console.log(`
${m.bold(`[Tab ${f+1}/${y}]`)} Navigating to: ${m.info(d.title)} (Center: ${d.bounds.centerX}, ${d.bounds.centerY})`)});p.success(`
Discovered and captured ${u.length} tabs hands-free in ${Math.round(performance.now()-s)}ms!
`);for(let d=0;d<u.length;d++){let f=u[d];p.info(`Compositing Tab [${d+1}/${u.length}]: "${f.title}"...`);let y=await L({screenshotBuffer:f.screenshotBuffer,bezelId:a,gradientPreset:i,layout:g,font:b,title:f.title,subtitle:`Automated view captured from ${t||"active app"}`,showStarBadge:e.stars!==!1}),S=`${String(d+1).padStart(2,"0")}-${f.title.toLowerCase().replace(/[^a-z0-9]/g,"-")}.png`,D=C.join(l,S);E.writeFileSync(D,y.buffer),c.push({path:S,buffer:y.buffer}),p.success(`Saved: ${S} (${y.elapsedMs}ms)`)}if(e.zip!==!1&&c.length>0){let d=C.join(l,"crawled-assets.zip"),f=await te(c,d);p.success(`
ZIP Bundle Created: ${m.bold(d)} (${(f/1024).toFixed(1)} KB)`)}console.log(`
`+"\u2550".repeat(60)),p.success("Autonomous Crawl Complete! All assets saved to:"),p.info(`${m.bold(l)}`),console.log("\u2550".repeat(60)+`
`)}catch(u){p.error("CRITICAL_ERROR",`Autonomous crawl failed: ${u instanceof Error?u.message:String(u)}`)}}async function or(t,e={}){p.banner($.NAME,"Declarative Automation Flow Runner");let r=t||e.config||"adbsnap.config.json";if(!E.existsSync(r)){p.error("CRITICAL_ERROR",`Configuration file not found: ${r}`);return}let n;try{n=JSON.parse(E.readFileSync(r,"utf8"))}catch(c){p.error("CRITICAL_ERROR",`Failed to parse config ${r}: ${c instanceof Error?c.message:String(c)}`);return}if(!n.flow||!Array.isArray(n.flow)||n.flow.length===0){p.error("CRITICAL_ERROR",'Config file does not contain a "flow" action array.');return}let s=(await x.listDevices()).filter(c=>c.isAuthorized);if(s.length===0){p.error("DEVICE_NOT_FOUND",P.NO_DEVICES_FOUND);return}let i=e.device&&s.find(c=>c.id===e.device)||s[0];p.info(`Target Device: ${m.bold(i.model)} (${i.id})`),p.info(`Loaded flow with ${n.flow.length} actions from: ${r}
`);let a=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),g=n.theme||e.theme||"studioLight",b=e.out||C.join(N.DEFAULT_OUTPUT_DIR,`run-${g}-${a}`);E.existsSync(b)||E.mkdirSync(b,{recursive:!0});let h=[],l=performance.now();try{let c=await Ze.runFlow(n,{deviceId:i.id,onProgress:(d,f,y,S)=>{console.log(`${m.bold(`[Step ${d}/${f}]`)} ${m.dim(y.type.toUpperCase().padEnd(7))} ${S}`)}});for(let d=0;d<c.length;d++){let f=c[d],y=`${String(d+1).padStart(2,"0")}-${f.name}.png`,S=C.join(b,y);E.writeFileSync(S,f.compositedBuffer),h.push({path:y,buffer:f.compositedBuffer})}if(e.zip!==!1&&h.length>0){let d=C.join(b,"run-assets.zip"),f=await te(h,d);p.success(`
ZIP Bundle Created: ${m.bold(d)} (${(f/1024).toFixed(1)} KB)`)}let u=Math.round(performance.now()-l);console.log(`
`+"\u2550".repeat(60)),p.success(`Flow Execution Complete! ${c.length} screens captured in ${u}ms.`),p.info(`Assets Directory: ${m.bold(b)}`),console.log("\u2550".repeat(60)+`
`)}catch(c){p.error("CRITICAL_ERROR",`Flow execution failed: ${c instanceof Error?c.message:String(c)}`)}}function ir(){if(process.platform==="win32"){let t=["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",C.join(process.env.LOCALAPPDATA||"","Google\\Chrome\\Application\\chrome.exe"),"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",C.join(process.env.LOCALAPPDATA||"","Microsoft\\Edge\\Application\\msedge.exe")];for(let e of t)if(E.existsSync(e))return e}else if(process.platform==="darwin"){let t=["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge","/Applications/Brave Browser.app/Contents/MacOS/Brave Browser","/Applications/Arc.app/Contents/MacOS/Arc"];for(let e of t)if(E.existsSync(e))return e}return null}async function sr(t,e=!1){let{spawn:r,exec:n}=await import("node:child_process");if(e){process.platform==="win32"?n(`start "" "${t}"`):process.platform==="darwin"?n(`open "${t}"`):n(`xdg-open "${t}"`);return}let o=ir();o?r(o,[`--app=${t}`,"--window-size=1440,920"],{detached:!0,stdio:"ignore"}).unref():process.platform==="win32"?n(`start msedge --app="${t}" || start chrome --app="${t}" || start "" "${t}"`):process.platform==="darwin"?n(`open -na "Google Chrome" --args --app="${t}" || open "${t}"`):n(`google-chrome --app="${t}" || chromium-browser --app="${t}" || xdg-open "${t}"`)}async function ar(t){let e=typeof t.port=="string"?Number(t.port):3e3,r=!!t.browser,n=!!t["no-open"];p.banner($.NAME,"Visual Web Studio"),p.info(`Starting ADBSnap Studio on port ${e}...`);try{let{startStudioServer:o}=await Promise.resolve().then(()=>(dt(),lt));await o({port:e});let s=`http://adbsnap.localhost:${e}`;p.success(`\u{1F680} Server active! Running at ${m.info(s)}`),n||sr(s,r)}catch(o){p.error("CRITICAL_ERROR",`Failed to start Studio: ${o instanceof Error?o.message:String(o)}`)}}Kt().catch(t=>{p.error("CRITICAL_ERROR",t instanceof Error?t.message:String(t)),process.exit(1)});
