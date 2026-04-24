/**
 * [안양의 시간] 스테이지 통합 엔진 v3.0 (마스터 액션본)
 * 주요 개선: 
 * 1. 발굴/탁본: 실시간 진행률 게이지 및 파티클 효과 (손맛 강화)
 * 2. 고인돌 운반: 터치 연타(Mash) 줄다리기 게임 (도구의 효율성 체감)
 * 3. 도자기 가마: 홀드 앤 릴리즈(Hold & Release) 타이밍 게임 (긴장감 극대화)
 * 4. 근대 도구: 과거-현재 짝맞추기(Matching) 로직 (직관적 비교 학습)
 */

// ========== 1. 사운드 시스템 ==========
const SoundManager = {
    bgm: null,
    sfx: {},
    isMuted: localStorage.getItem('isMuted') === 'true',
    
    init() {
        this.bgm = new Audio('../assets/sounds/bgm_main.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.2;
        
        this.sfx = {
            click: new Audio('../assets/sounds/sfx_click.mp3'),
            brush: new Audio('../assets/sounds/sfx_brush.mp3'),
            clear: new Audio('../assets/sounds/sfx_clear.mp3'),
            hit: new Audio('../assets/sounds/sfx_hit.mp3'),
            dig: new Audio('../assets/sounds/sfx_dig.mp3'),
            scan: new Audio('../assets/sounds/sfx_scan.mp3')
        };
    },
    
    playBGM() { if (!this.isMuted) this.bgm?.play().catch(() => {}); },
    pauseBGM() { this.bgm?.pause(); },
    
    fadeOutBGM(callback) {
        if (!this.bgm || this.isMuted) return callback?.();
        let vol = this.bgm.volume;
        const fade = setInterval(() => {
            vol -= 0.02;
            if (vol <= 0) {
                this.bgm.pause();
                clearInterval(fade);
                callback?.();
            } else { this.bgm.volume = vol; }
        }, 30);
    },
    
    playSFX(name) {
        if (this.isMuted) return;
        const sound = this.sfx[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
};

// ========== 2. 메인 게임 엔진 ==========
const Engine = {
    stageId: null,
    stageData: null,
    scriptIndex: 0,
    isTyping: false,
    typingTimer: null,
    gameInterval: null,
    tempData: {}, 
    userAnswers: JSON.parse(localStorage.getItem('user_answers')) || {},
    
    init() {
        const params = new URLSearchParams(window.location.search);
        this.stageId = params.get('id');
        
        if (!this.stageId || !STAGES_DATA[this.stageId]) {
            location.href = '../index.html';
            return;
        }
        
        this.stageData = STAGES_DATA[this.stageId];
        SoundManager.init();
        SoundManager.playBGM();
        this.updateMuteUI(); 
        
        this.setBackground();
        this.showDialogue();
        this.initCursor();
    },

    toggleMute() {
        SoundManager.isMuted = !SoundManager.isMuted;
        localStorage.setItem('isMuted', SoundManager.isMuted);
        this.updateMuteUI();
        if (SoundManager.isMuted) SoundManager.pauseBGM();
        else SoundManager.playBGM();
    },

    updateMuteUI() {
        const btn = document.getElementById('mute-toggle');
        if (btn) {
            btn.innerText = SoundManager.isMuted ? "소리 끔" : "소리 켬";
            btn.style.color = SoundManager.isMuted ? "var(--red)" : "var(--gold)";
            btn.style.borderColor = SoundManager.isMuted ? "var(--red)" : "var(--gold)";
        }
    },

    setBackground() {
        const bgLayer = document.getElementById('bg-layer');
        const fileKeys = ["gwanyang", "pyeongchon", "seoksu", "jungcho", "bell", "turtle", "bisan", "bridge", "seoimyeon"];
        const keys = ["GWANYANG", "PYEONGCHON", "SEOKSILBUN", "JUNGCHO", "MAAEJONG", "ANYANGSA_GVIBU", "BISANDONG", "MANANGYO", "SEOIMYEON"];
        const idx = keys.indexOf(this.stageId);
        
        if (bgLayer && idx !== -1) {
            bgLayer.style.backgroundImage = `url('../assets/images/relic_${fileKeys[idx]}_real.png')`;
        }
    },

    showDialogue() {
        const scripts = this.stageData.scripts;
        if (this.scriptIndex >= scripts.length) {
            this.startMinigame();
            return;
        }

        const script = scripts[this.scriptIndex];
        const charName = document.getElementById('char-name');
        const dialogueText = document.getElementById('dialogue-text');
        const portraitImg = document.getElementById('portrait-img');
        const indicator = document.querySelector('.next-indicator');
        const skipHint = document.querySelector('.skip-hint');

        if (indicator) indicator.style.display = 'none';
        if (skipHint) skipHint.style.display = 'block';
        charName.innerText = script.char;
        
        if (portraitImg) {
            let imgName = 'logo_1.png';
            if (script.char === '한') imgName = 'han_1.png';
            else if (script.char === '양') imgName = 'yang_1.png';
            portraitImg.src = `../assets/images/${imgName}`;
        }

        this.isTyping = true;
        let charIdx = 0;
        dialogueText.textContent = '';
        if (this.typingTimer) clearInterval(this.typingTimer);

        this.typingTimer = setInterval(() => {
            dialogueText.textContent = script.text.substring(0, charIdx++);
            if (charIdx % 3 === 0) SoundManager.playSFX('click');
            if (charIdx > script.text.length) this.finishTyping();
        }, 40);
    },

    finishTyping() {
        clearInterval(this.typingTimer);
        document.getElementById('dialogue-text').textContent = this.stageData.scripts[this.scriptIndex].text;
        this.isTyping = false;
        
        const indicator = document.querySelector('.next-indicator');
        const skipHint = document.querySelector('.skip-hint');
        if (indicator) indicator.style.display = 'block';
        if (skipHint) skipHint.style.display = 'none';
    },

    next() {
        if (this.isTyping) this.finishTyping();
        else {
            this.scriptIndex++;
            this.showDialogue();
        }
    },

    bindPointerDrag(element, dropZoneClass, onDropCallback) {
        element.style.touchAction = 'none';
        let isDragging = false;

        element.onpointerdown = (e) => {
            e.preventDefault();
            isDragging = true;
            element.setPointerCapture(e.pointerId);
            element.style.position = 'absolute';
            element.style.zIndex = '1000';
            element.style.left = (e.pageX - element.offsetWidth / 2) + 'px';
            element.style.top = (e.pageY - element.offsetHeight / 2) + 'px';
        };

        element.onpointermove = (e) => {
            if (!isDragging) return;
            element.style.left = (e.pageX - element.offsetWidth / 2) + 'px';
            element.style.top = (e.pageY - element.offsetHeight / 2) + 'px';
        };

        element.onpointerup = (e) => {
            if (!isDragging) return;
            isDragging = false;
            element.releasePointerCapture(e.pointerId);

            element.style.visibility = 'hidden';
            const targetBelow = document.elementFromPoint(e.clientX, e.clientY);
            element.style.visibility = 'visible';

            const dropZone = targetBelow ? targetBelow.closest(`.${dropZoneClass}`) : null;
            if (dropZone) onDropCallback(element, dropZone);
            else element.style.position = 'static'; 
        };
    },

    // 파티클 생성기 (발굴, 탁본용)
    spawnDust(x, y, color) {
        const p = document.createElement('div');
        p.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:6px; height:6px; background:${color}; border-radius:50%; pointer-events:none; z-index:1001; opacity:1; transition:all 0.5s ease-out;`;
        document.getElementById('minigame-ui').appendChild(p);
        setTimeout(() => {
            p.style.transform = `translate(${(Math.random()-0.5)*50}px, ${Math.random()*30+20}px) scale(0.5)`;
            p.style.opacity = '0';
        }, 10);
        setTimeout(() => p.remove(), 500);
    },

    startMinigame() {
        document.getElementById('dialogue-box').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        
        const type = this.stageData.minigame.type;
        const ui = document.getElementById('minigame-ui');
        ui.innerHTML = `<h3 style="margin-bottom:10px;">${this.stageData.minigame.instruction}</h3>`;

        switch(type) {
            case 'SCRATCH_BRUSH': this.initScratchGame(); break;      
            case 'STONE_TRANSPORT': this.initTransportGame(); break; 
            case 'BURIAL_PLACEMENT': this.initBurialGame(); break;   
            case 'TIMELINE_ORDER': this.initTimelineGame(); break;   
            case 'RUBBING_TAKBON': this.initTakbonGame(); break;     
            case 'FIND_BIHUI': this.initBihuiGame(); break;         
            case 'POTTERY_MAKING': this.initPotteryGame(); break;   
            case 'ARCH_PUZZLE': this.initArchPuzzle(); break;       
            case 'THEN_VS_NOW': this.initComparisonGame(); break;   
            default: this.success();
        }
    },

    // ========== 개별 게임 로직 ==========

    // 1. 발굴 게임 (진행률 바 + 흙먼지 파티클)
    initScratchGame() {
        const ui = document.getElementById('minigame-ui');
        ui.innerHTML += `
            <div style="width:100%; height:12px; background:#222; border:1px solid #555; border-radius:6px; margin-bottom:15px; overflow:hidden;">
                <div id="pg-bar" style="width:0%; height:100%; background:var(--gold); transition:width 0.1s;"></div>
            </div>
        `;
        const canvas = document.createElement('canvas');
        canvas.width = 280; canvas.height = 180;
        ui.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0, 0, 280, 180);
        
        let cleaned = 0; const target = 250;
        this.setCustomCursor('tool_brush');
        
        const scratch = (e) => {
            if (e.buttons !== 1 && !e.isPrimary) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
            cleaned++;
            
            // 파티클 및 게이지 업데이트
            if (cleaned % 3 === 0) {
                this.spawnDust(e.clientX, e.clientY, '#8d6e63');
                SoundManager.playSFX('brush');
            }
            const pct = Math.min((cleaned / target) * 100, 100);
            document.getElementById('pg-bar').style.width = pct + '%';

            if (pct >= 100) {
                canvas.onpointermove = null;
                setTimeout(() => this.showQuiz(), 800);
            }
        };
        canvas.style.touchAction = 'none';
        canvas.onpointermove = scratch;
    },

    // 2. 운반 게임 (터치 연타 줄다리기)
    initTransportGame() {
        const ui = document.getElementById('minigame-ui');
        ui.innerHTML += `
            <div id="transport-options" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
                ${this.stageData.minigame.options.map(opt => `<button class="btn-home" style="font-size:0.75rem; padding:10px 2px;" onclick="Engine.startMash('${opt.id}')">${opt.label}</button>`).join('')}
            </div>
            <div id="mash-game-area" style="display:none; flex-direction:column; align-items:center;">
                <div style="width:100%; height:15px; background:#222; border:2px solid #555; border-radius:10px; margin:15px 0; overflow:hidden; position:relative;">
                    <div id="mash-bar" style="width:10%; height:100%; background:var(--blue); transition:width 0.1s;"></div>
                    <div style="position:absolute; right:5px; top:0; font-size:10px; color:#fff; line-height:15px;">도착점</div>
                </div>
                <div id="stone-sprite" style="font-size:3rem; transform:translateX(-100px); transition:transform 0.1s;">🪨</div>
                <button id="btn-mash" class="btn-action" style="width:100%; padding:20px; font-size:1.5rem; background:var(--red); color:#fff; box-shadow:0 6px 0 #900;">🔥 영 차! 🔥 (연타)</button>
            </div>
        `;
    },
    startMash(methodId) {
        document.getElementById('transport-options').style.display = 'none';
        document.getElementById('mash-game-area').style.display = 'flex';
        
        let power = 0, drain = 0;
        if (methodId === 'logs') { power = 8; drain = 2; } // 매우 쉬움
        else if (methodId === 'rope') { power = 5; drain = 3; } // 보통
        else if (methodId === 'lift') { power = 1; drain = 6; } // 불가능

        let progress = 10;
        document.getElementById('btn-mash').onpointerdown = (e) => {
            e.preventDefault();
            progress += power;
            SoundManager.playSFX('dig');
            updateUI();
        };

        const updateUI = () => {
            document.getElementById('mash-bar').style.width = Math.min(progress, 100) + '%';
            document.getElementById('stone-sprite').style.transform = `translateX(${progress*2 - 100}px)`;
            if (progress >= 100) {
                clearInterval(this.gameInterval);
                document.getElementById('btn-mash').innerText = "이동 완료!";
                setTimeout(() => this.showQuiz(), 1000);
            }
        };

        this.gameInterval = setInterval(() => {
            progress -= drain;
            if (progress < 0) progress = 0;
            updateUI();
            if (progress === 0 && methodId === 'lift') {
                clearInterval(this.gameInterval);
                alert("직접 드는 건 너무 무거워서 불가능합니다! 다른 도구를 써보세요.");
                this.initTransportGame();
            }
        }, 100);
    },

    // 3. 부장품 배치 (석실분)
    initBurialGame() {
        const ui = document.getElementById('minigame-ui');
        let timeLeft = this.stageData.minigame.timer;
        ui.innerHTML += `
            <div id="timer-display" style="color:var(--red); font-size:1.2rem; margin:10px 0;">남은 시간: ${timeLeft}초</div>
            <div class="tomb-dropzone" style="width:100%; height:150px; background:rgba(50,50,50,0.9); border:2px dashed #666; position:relative;"></div>
            <div id="item-dock" style="display:flex; gap:5px; padding:10px 0; overflow-x:auto;">
                ${this.stageData.minigame.items.map(item => `<div class="artifact-card" data-img="${item.img}" style="min-width:50px; height:60px; background:#222; border:1px solid var(--gold); font-size:0.6rem; padding:2px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <img src="../assets/images/${item.img}" style="width:100%; height:30px; object-fit:contain; pointer-events:none;">
                    <p style="margin:2px 0 0 0; pointer-events:none;">${item.name}</p>
                </div>`).join('')}
            </div>
            <button class="btn-ending-action" style="margin-top:10px; width:100%;" onclick="Engine.finishBurial()">배치 완료</button>
        `;

        document.querySelectorAll('.artifact-card').forEach(card => {
            this.bindPointerDrag(card, 'tomb-dropzone', (draggedEl, dropZone) => {
                const img = draggedEl.dataset.img;
                const icon = document.createElement('img');
                icon.src = `../assets/images/${img}`;
                const rect = dropZone.getBoundingClientRect();
                const dRect = draggedEl.getBoundingClientRect();
                icon.style.cssText = `position:absolute; left:${dRect.left - rect.left}px; top:${dRect.top - rect.top}px; width:40px;`;
                dropZone.appendChild(icon);
                draggedEl.style.display = 'none';
                SoundManager.playSFX('click');
            });
        });

        this.gameInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-display').innerText = `남은 시간: ${timeLeft}초`;
            if (timeLeft <= 0) { clearInterval(this.gameInterval); this.finishBurial(); }
        }, 1000);
    },
    finishBurial() { clearInterval(this.gameInterval); this.showQuiz(); },

    // 4. 타임라인 (중초사지)
    initTimelineGame() {
        const ui = document.getElementById('minigame-ui');
        ui.innerHTML += `
            <div id="timeline-slots" style="display:flex; flex-direction:column; gap:5px; margin-bottom:15px;">
                ${[0,1,2,3,4].map(i => `<div class="tl-slot" data-idx="${i}" style="height:35px; border:1px dashed #555; font-size:0.7rem; display:flex; align-items:center; justify-content:center;">단계 ${i+1}</div>`).join('')}
            </div>
            <div id="card-dock" style="display:flex; flex-direction:column; gap:5px;">
                ${[...this.stageData.minigame.cards].sort(()=>Math.random()-0.5).map(c => `<div class="timeline-card" data-id="${c.id}" style="background:#222; border:1px solid var(--gold); padding:5px; font-size:0.75rem;">${c.text}</div>`).join('')}
            </div>
            <button class="btn-ending-action" style="margin-top:15px; width:100%;" onclick="Engine.checkTimeline()">기록 복원</button>
        `;

        document.querySelectorAll('.timeline-card').forEach(card => {
            this.bindPointerDrag(card, 'tl-slot', (draggedEl, dropZone) => {
                const id = draggedEl.dataset.id;
                const cardData = this.stageData.minigame.cards.find(c => c.id == id);
                dropZone.innerHTML = `<div style="background:var(--gold); color:#000; width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:5px;">${cardData.text}</div>`;
                dropZone.dataset.filledId = id;
                draggedEl.style.display = 'none';
                SoundManager.playSFX('click');
            });
        });
    },
    checkTimeline() {
        const slots = document.querySelectorAll('.tl-slot');
        let correct = true;
        slots.forEach((s, i) => { if(s.dataset.filledId != i) correct = false; });
        if(correct) this.showQuiz(); else this.triggerErrorEffect('timeline-slots');
    },

    // 5. 탁본 (마애종 - 게이지 및 파티클)
    initTakbonGame() {
        const ui = document.getElementById('minigame-ui');
        ui.innerHTML += `
            <div style="width:100%; height:12px; background:#222; border:1px solid #555; border-radius:6px; margin-bottom:15px; overflow:hidden;">
                <div id="pg-bar" style="width:0%; height:100%; background:#444; transition:width 0.1s;"></div>
            </div>
        `;
        const canvas = document.createElement('canvas');
        canvas.width = 280; canvas.height = 180;
        ui.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#f5f5f5"; ctx.fillRect(0,0,280,180);
        
        let colored = 0; const target = 250;
        this.setCustomCursor('tool_ink');
        
        const rub = (e) => {
            if (e.buttons !== 1 && !e.isPrimary) return;
            const rect = canvas.getBoundingClientRect();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 20, 0, Math.PI*2); ctx.fill();
            colored++; 

            if (colored % 3 === 0) {
                this.spawnDust(e.clientX, e.clientY, '#111');
                SoundManager.playSFX('brush');
            }
            
            const pct = Math.min((colored / target) * 100, 100);
            document.getElementById('pg-bar').style.width = pct + '%';

            if(pct >= 100) { 
                canvas.onpointermove = null; 
                setTimeout(()=>this.showQuiz(), 800); 
            }
        };
        canvas.style.touchAction = 'none';
        canvas.onpointermove = rub;
    },

    // 6. 비희 찾기 (안양사)
    initBihuiGame() {
        const ui = document.getElementById('minigame-ui');
        let timeLeft = this.stageData.minigame.timer;
        ui.innerHTML += `
            <div id="timer-display" style="color:var(--red); font-size:1.2rem; margin-bottom:10px;">남은 시간: ${timeLeft}초</div>
            <div id="son-grid" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
                ${this.stageData.minigame.sons.map(s => `<div class="son-card" onclick="Engine.checkBihui('${s.id}', this)" style="background:#222; border:1px solid #444; padding:5px; font-size:0.6rem; height:70px; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer;"><b>${s.name}</b><span style="font-size:0.5rem; text-align:center; color:#aaa; margin-top:2px;">${s.desc}</span></div>`).join('')}
            </div>
        `;
        this.gameInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-display').innerText = `남은 시간: ${timeLeft}초`;
            if(timeLeft <= 0) { clearInterval(this.gameInterval); this.initBihuiGame(); }
        }, 1000);
    },
    checkBihui(id, el) {
        const son = this.stageData.minigame.sons.find(s => s.id === id);
        if(son.isCorrect) { 
            clearInterval(this.gameInterval); 
            el.style.background = "var(--success)"; 
            SoundManager.playSFX('clear');
            setTimeout(()=>this.showQuiz(), 800); 
        } else { 
            this.triggerErrorEffect('son-grid'); 
            el.style.background = "var(--error)"; 
        }
    },

    // 7. 가마 (홀드 앤 릴리즈 타이밍 게임)
    initPotteryGame() {
        this.tempData.pStep = 0;
        this.showPotteryStep();
    },
    showPotteryStep() {
        const ui = document.getElementById('minigame-ui');
        if(this.tempData.pStep < 2) {
            const step = this.stageData.minigame.steps[this.tempData.pStep];
            ui.innerHTML = `<h3>${step.label}</h3><div style="display:grid; gap:8px; margin-top:15px;">
                ${step.options.map(opt => `<button class="btn-home" onclick="Engine.tempData.pStep++; Engine.showPotteryStep()">${opt}</button>`).join('')}
            </div>`;
        } else {
            ui.innerHTML = `
                <h3 style="margin-bottom:5px;">가마 온도 조절</h3>
                <p style="font-size:0.75rem; color:#aaa; margin-bottom:15px;">버튼을 꾹 눌러 온도를 올리고, 1200~1300도 사이에서 손을 떼세요!</p>
                <div style="width:100%; height:30px; background:#222; border:2px solid #555; position:relative; margin-bottom:15px;">
                    <div style="position:absolute; left:80%; width:6.6%; height:100%; background:rgba(46, 204, 113, 0.4); border-left:1px solid #0f0; border-right:1px solid #0f0; z-index:2;"></div>
                    <div id="temp-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #e74c3c, #f1c40f, #fff); transition:width 0.1s; z-index:1;"></div>
                </div>
                <div id="temp-text" style="font-size:1.5rem; margin-bottom:20px; font-weight:bold;">0 ℃</div>
                <button id="btn-hold" class="btn-action" style="width:100%; padding:20px; background:var(--gold); color:#000; user-select:none; touch-action:none;">🔥 꾹 누르기 (Hold) 🔥</button>
            `;
            
            let temp = 0;
            let heating = null;
            const btn = document.getElementById('btn-hold');

            btn.onpointerdown = (e) => {
                e.preventDefault();
                SoundManager.playSFX('dig'); // 불타는 소리 대용
                btn.style.transform = 'scale(0.95)';
                heating = setInterval(() => {
                    temp += 15;
                    if(temp > 1500) temp = 1500;
                    document.getElementById('temp-bar').style.width = (temp/1500)*100 + '%';
                    document.getElementById('temp-text').innerText = temp + " ℃";
                    if(temp >= 1500) { clearInterval(heating); releaseHeat(); }
                }, 50);
            };

            const releaseHeat = () => {
                if(!heating) return;
                clearInterval(heating);
                heating = null;
                btn.style.transform = 'scale(1)';
                
                if (temp >= 1200 && temp <= 1300) {
                    SoundManager.playSFX('clear');
                    document.getElementById('temp-text').style.color = "var(--success)";
                    document.getElementById('temp-text').innerText += " (완벽함!)";
                    setTimeout(() => this.showQuiz(), 1200);
                } else if (temp < 1200) {
                    this.triggerErrorEffect('minigame-ui');
                    alert("온도가 너무 낮아 도자기가 덜 구워졌습니다!");
                    temp = 0; document.getElementById('temp-bar').style.width = '0%'; document.getElementById('temp-text').innerText = "0 ℃";
                } else {
                    this.triggerErrorEffect('minigame-ui');
                    alert("온도가 너무 높아 가마가 터졌습니다!");
                    temp = 0; document.getElementById('temp-bar').style.width = '0%'; document.getElementById('temp-text').innerText = "0 ℃";
                }
            };

            btn.onpointerup = releaseHeat;
            btn.onpointercancel = releaseHeat;
            btn.onpointerleave = releaseHeat;
        }
    },

    // 8. 아치 퍼즐 (만안교)
    initArchPuzzle() {
        const ui = document.getElementById('minigame-ui');
        this.tempData.placed = 0;
        ui.innerHTML += `
            <div id="bridge-area" style="height:120px; background:#87ceeb; position:relative; border-radius:10px; margin-bottom:10px;">
                <div class="arch-outline" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); width:120px; height:60px; border:2px dashed #fff; border-radius:60px 60px 0 0;"></div>
                <div id="slot-container">
                    ${this.stageData.minigame.blocks.map(b => `<div class="arch-slot" data-id="${b.id}" style="position:absolute; width:30px; height:20px; border:1px solid rgba(255,255,255,0.3);"></div>`).join('')}
                </div>
            </div>
            <div id="block-dock" style="display:flex; justify-content:center; gap:5px;">
                ${this.stageData.minigame.blocks.map(b => `<div class="arch-card" data-id="${b.id}" style="width:35px; height:35px; background:#999; border:1px solid #666; font-size:0.5rem; display:flex; align-items:center; justify-content:center;">${b.name.substring(0,2)}</div>`).join('')}
            </div>
        `;
        
        const slots = document.querySelectorAll('.arch-slot');
        if(slots.length === 5) {
            slots[0].style.cssText += "bottom:20px; left:calc(50% - 60px);"; 
            slots[1].style.cssText += "bottom:20px; left:calc(50% + 30px);";
            slots[2].style.cssText += "bottom:40px; left:calc(50% - 45px);";
            slots[3].style.cssText += "bottom:40px; left:calc(50% + 15px);";
            slots[4].style.cssText += "bottom:60px; left:calc(50% - 15px); border-color:var(--gold);";
        }

        document.querySelectorAll('.arch-card').forEach(card => {
            this.bindPointerDrag(card, 'arch-slot', (draggedEl, dropZone) => {
                const id = draggedEl.dataset.id;
                if(dropZone.dataset.id === id) {
                    if(id === 'keystone' && this.tempData.placed < 4) { 
                        alert("기초석부터 쌓으세요!"); 
                        draggedEl.style.position = 'static';
                        return; 
                    }
                    dropZone.innerHTML = `<div style="width:100%; height:100%; background:#777; border:1px solid #444;"></div>`;
                    dropZone.style.border = 'none';
                    draggedEl.style.display = 'none';
                    this.tempData.placed++;
                    SoundManager.playSFX('dig');
                    if(this.tempData.placed === 5) setTimeout(()=>this.showQuiz(), 1000);
                } else {
                    draggedEl.style.position = 'static'; 
                    this.triggerErrorEffect('bridge-area');
                }
            });
        });
    },

    // 9. 근대 도구 (과거-현재 짝맞추기)
    initComparisonGame() {
        const ui = document.getElementById('minigame-ui');
        const items = this.stageData.minigame.items;
        
        // 데이터 파싱: "등사기 ↔ 프린터/복사기" -> 좌측(과거), 우측(현재) 배열 생성
        const pastList = items.map((i, idx) => ({ idx: idx, text: i.compareText.split(' ↔ ')[0] }));
        const presentList = items.map((i, idx) => ({ idx: idx, text: i.compareText.split(' ↔ ')[1] })).sort(() => Math.random() - 0.5);

        ui.innerHTML = `
            <p style="font-size:0.8rem; margin-bottom:15px;">과거의 도구와 현재의 역할을 올바르게 짝지어 보세요!</p>
            <div style="display:flex; justify-content:space-between; gap:10px;">
                <div id="col-past" style="flex:1; display:flex; flex-direction:column; gap:8px;">
                    ${pastList.map(p => `<button class="btn-home match-past" data-idx="${p.idx}" style="padding:15px 5px; font-size:0.8rem;">${p.text}</button>`).join('')}
                </div>
                <div id="col-present" style="flex:1; display:flex; flex-direction:column; gap:8px;">
                    ${presentList.map(p => `<button class="btn-home match-present" data-idx="${p.idx}" style="padding:15px 5px; font-size:0.8rem;">${p.text}</button>`).join('')}
                </div>
            </div>
        `;

        this.tempData.selPast = null;
        this.tempData.selPresent = null;
        this.tempData.matchCount = 0;

        const checkMatch = () => {
            if (this.tempData.selPast !== null && this.tempData.selPresent !== null) {
                const pastBtn = document.querySelector(`.match-past[data-idx="${this.tempData.selPast}"]`);
                const presBtn = document.querySelector(`.match-present[data-idx="${this.tempData.selPresent}"]`);
                
                if (this.tempData.selPast === this.tempData.selPresent) {
                    // 정답
                    SoundManager.playSFX('clear');
                    pastBtn.style.background = "var(--success)"; presBtn.style.background = "var(--success)";
                    pastBtn.style.pointerEvents = "none"; presBtn.style.pointerEvents = "none";
                    this.tempData.matchCount++;
                    if(this.tempData.matchCount === items.length) setTimeout(() => this.showQuiz(), 1000);
                } else {
                    // 오답
                    this.triggerErrorEffect('minigame-ui');
                    pastBtn.style.borderColor = "var(--gold)"; presBtn.style.borderColor = "var(--gold)";
                }
                this.tempData.selPast = null; this.tempData.selPresent = null;
            }
        };

        document.querySelectorAll('.match-past').forEach(btn => {
            btn.onclick = () => {
                if(btn.style.pointerEvents === 'none') return;
                document.querySelectorAll('.match-past').forEach(b => { if(b.style.pointerEvents !== 'none') b.style.borderColor = 'var(--gold)'; });
                btn.style.borderColor = 'var(--blue)';
                this.tempData.selPast = btn.dataset.idx;
                checkMatch();
            };
        });

        document.querySelectorAll('.match-present').forEach(btn => {
            btn.onclick = () => {
                if(btn.style.pointerEvents === 'none') return;
                document.querySelectorAll('.match-present').forEach(b => { if(b.style.pointerEvents !== 'none') b.style.borderColor = 'var(--gold)'; });
                btn.style.borderColor = 'var(--blue)';
                this.tempData.selPresent = btn.dataset.idx;
                checkMatch();
            };
        });
    },

    // --- 공통 퀴즈 시스템 ---
    showQuiz() {
        const ui = document.getElementById('minigame-ui');
        this.setCustomCursor(null);
        
        if(this.tempData.quizIdx === undefined) this.tempData.quizIdx = 0;
        const quizzes = this.stageData.minigame.quiz ? [this.stageData.minigame.quiz] : this.stageData.minigame.quizzes;
        
        if(!quizzes || this.tempData.quizIdx >= quizzes.length) { this.success(); return; }
        
        const q = quizzes[this.tempData.quizIdx];
        ui.innerHTML = `<h3 style="color:var(--gold);">🔍 현장 확인 퀴즈</h3><p style="margin:15px 0; line-height:1.5;">${q.question}</p>`;

        if(q.options) { 
            ui.innerHTML += `<div id="q-opts" style="display:grid; gap:8px;">
                ${q.options.map((opt, i) => `<button class="btn-home" style="text-align:left; font-size:0.85rem;" onclick="Engine.checkQAnswer(${i})">${i+1}. ${opt}</button>`).join('')}
            </div>`;
        } else { 
            ui.innerHTML += `<textarea id="q-input" style="width:100%; height:80px; background:#111; color:#fff; border:1px solid var(--gold); padding:10px; font-family:'DungGeunMo';" placeholder="${q.placeholder || '정답을 입력하세요.'}"></textarea>
                <button class="btn-ending-action" style="margin-top:15px; width:100%;" onclick="Engine.checkQAnswer()">제출 완료</button>`;
        }
    },

    checkQAnswer(idx) {
        const quizzes = this.stageData.minigame.quiz ? [this.stageData.minigame.quiz] : this.stageData.minigame.quizzes;
        const q = quizzes[this.tempData.quizIdx];
        
        let correct = false;
        let textValue = "";

        if(q.options) {
            if(idx === q.answer) correct = true;
        } else {
            textValue = document.getElementById('q-input').value.trim();
            if(q.answer) { 
                if(textValue === q.answer || textValue.includes(q.answer)) correct = true; 
            }
            else { 
                if(textValue.length >= 5) correct = true; 
            } 
        }

        if(correct) {
            if (!q.options && !q.answer) {
                this.userAnswers[this.stageId] = textValue;
                localStorage.setItem('user_answers', JSON.stringify(this.userAnswers));
            }
            this.tempData.quizIdx++;
            this.showQuiz();
        } else {
            this.triggerErrorEffect('minigame-ui');
            alert(q.options ? "다시 한번 생각해 보세요!" : "내용을 조금 더 자세히 적거나 정답을 확인해 보세요.");
        }
    },

    // --- 공통 연출 및 종료 ---
    success() {
        SoundManager.playSFX('clear');
        this.createParticles();
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('fact-content').innerText = this.stageData.educationalFact;
        document.getElementById('fact-modal').style.display = 'flex';
    },

    triggerErrorEffect(id) {
        const el = document.getElementById(id);
        el?.classList.add('error-shake');
        SoundManager.playSFX('hit');
        setTimeout(() => el?.classList.remove('error-shake'), 400);
    },

    createParticles() {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.backgroundColor = ['#ffd700', '#fff', '#2ecc71'][Math.floor(Math.random()*3)];
            p.style.animation = `particleFall ${Math.random()*2+1}s linear forwards`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 2000);
        }
    },

    initCursor() {
        const cursor = document.getElementById('custom-cursor');
        document.addEventListener('pointermove', (e) => {
            if(cursor) { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
        });
    },

    setCustomCursor(tool) {
        const cursor = document.getElementById('custom-cursor');
        if (cursor) {
            if (tool) {
                cursor.style.display = 'block';
                cursor.style.backgroundImage = `url('../assets/images/${tool}.png')`;
            } else cursor.style.display = 'none';
        }
    },

    finish() {
        const cleared = JSON.parse(localStorage.getItem('cleared_stages')) || [];
        if (!cleared.includes(this.stageId)) {
            cleared.push(this.stageId);
            localStorage.setItem('cleared_stages', JSON.stringify(cleared));
        }
        SoundManager.fadeOutBGM(() => location.href = '../index.html');
    },

    goHome() { if(confirm("지도로 돌아가시겠습니까?")) location.href = '../index.html'; }
};

window.onload = () => Engine.init();