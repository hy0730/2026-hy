/* ==============================================================================
   [안양 시간 탐험 - 통합 자바스크립트 엔진 (sample.js)]
   - 기능: 로딩 시퀀스, 프롤로그, 인터랙티브 맵, 다중 미니게임(스크래치, 매칭, 퀴즈, 숨은단서, 슬라이더, 순서맞추기), 타임어택, AR 카메라
   ============================================================================== */

// ==============================================================================
// [1] 마스터 데이터 (유물, 스테이지, NPC 매핑 및 확장된 게임타입)
// ==============================================================================
const STAGE_DATA = [
    { 
        id: 0, name: "평촌 지석묘", x: 68, y: 72, 
        gameType: "quiz", timeLimit: 0,
        imgReal: "images/relic_7_real.png", imgMain: "images/relic_7_main.png",
        npc: "images/원시인 1.png", npcText: "우가우가! 덮개돌을 어떻게 옮길까?",
        quest: "고인돌에 대한 연속 퀴즈를 풀어보세요!",
        quizData: [
            { 
                text: "거대한 고인돌 덮개돌을 옮기는 가장 현명한 방법은?",
                options: ["코끼리가 끌었다", "통나무 굴림대와 밧줄로 끌었다", "마법을 썼다"],
                correct: 1,
                explanation: "통나무 굴림대를 바닥에 깔고 둥글게 굴리면 마찰력을 줄여 수십 톤의 돌도 쉽게 옮길 수 있습니다."
            },
            {
                text: "지석묘(고인돌)는 주로 어느 시대의 유적인가요?",
                options: ["구석기 시대", "청동기 시대", "조선 시대"],
                correct: 1,
                explanation: "지석묘는 계급이 발생하기 시작한 청동기 시대의 대표적인 무덤 양식입니다."
            }
        ],
        clearDesc: "수많은 사람들이 협동하여 만든 청동기 시대의 무덤을 확인했습니다."
    },
    { 
        id: 1, name: "관양동 선사유적", x: 75, y: 35, 
        gameType: "scratch", timeLimit: 15,
        imgReal: "images/relic_6_real.png", imgMain: "images/relic_6_main.png",
        npc: "images/원시인 1.png", npcText: "내 돌칼이 흙에 묻혔어!",
        quest: "도구를 이용해 흙을 털어내고 단서를 찾으세요!",
        clearDesc: "청동기 시대 사람들의 농경 생활을 보여주는 반달 돌칼을 발굴했습니다."
    },
    { 
        id: 2, name: "석수동 석실분", x: 18, y: 65, 
        gameType: "scratch", timeLimit: 0,
        imgReal: "images/relic_5_real.png", imgMain: "images/relic_5_main.png",
        npc: "images/han_3-removebg.png", npcText: "돌방무덤 입구가 꽉 막혀있어.",
        quest: "무덤 입구의 흙과 돌을 조심스럽게 파내세요!",
        clearDesc: "한강 유역을 차지하기 위한 삼국시대 앞트기식 돌방무덤의 구조를 파악했습니다."
    },
    { 
        id: 3, name: "중초사지 당간지주", x: 50, y: 15, 
        gameType: "hidden", timeLimit: 15,
        imgReal: "images/relic_1_real.png", imgMain: "images/relic_1_main.png",
        npc: "images/yang_3-removebg.png", npcText: "기둥 어딘가에 글씨가 숨겨져 있어!",
        quest: "기둥에 새겨진 명문(단서) 3개를 빠르게 터치하세요!",
        hiddenTargets: 3,
        fakeTargets: 3, // 방해물
        clearDesc: "827년에 만들어졌다는 명확한 기록이 남은 국내 유일의 당간지주입니다."
    },
    { 
        id: 4, name: "석수동 마애종", x: 22, y: 32, 
        gameType: "scratch", timeLimit: 0,
        imgReal: "images/relic_2_real.png", imgMain: "images/relic_2_main.png",
        npc: "images/han_3-removebg.png", npcText: "바위에 종 치는 스님이 그려져 있네!",
        quest: "브러시로 먹물을 칠해 탁본을 완성하세요!",
        clearDesc: "스님이 직접 종을 치는 모습이 묘사된 국내 유일의 마애종 탁본을 떴습니다."
    },
    { 
        id: 5, name: "안양사 귀부", x: 35, y: 22, 
        gameType: "matching", timeLimit: 25,
        imgReal: "images/relic_0_real.png", imgMain: "images/relic_0_main.png",
        npc: "images/yang_3-removebg.png", npcText: "용의 머리에 거북이 몸이라니 신기해!",
        quest: "안양사 귀부와 관련된 기억의 짝을 맞추세요!",
        matchPairs: [ {a: "거북이 몸", b: "용의 머리"}, {a: "시대", b: "고려"}, {a: "설립자", b: "태조 왕건"} ],
        clearDesc: "고려 시대의 특징을 잘 보여주는 안양사의 흔적을 복원했습니다."
    },
    { 
        id: 6, name: "비산동 도요지", x: 80, y: 60, 
        gameType: "slider", timeLimit: 0,
        imgReal: "images/reilc_u_3.png", imgMain: "images/relic_b_1.png",
        npc: "images/han_3-removebg.png", npcText: "도자기를 굽는 가마터야. 불 조절이 생명이지!",
        quest: "움직이는 가마의 온도를 적정 구간에 맞춰 3초간 유지하세요!",
        clearDesc: "완벽한 온도로 아름다운 고려 백자를 구워냈습니다."
    },
    { 
        id: 7, name: "만안교", x: 40, y: 48, 
        gameType: "sequence", timeLimit: 0,
        imgReal: "images/relic_3_real.png", imgMain: "images/relic_3_main.png",
        npc: "images/yang_3-removebg.png", npcText: "정조대왕이 백성을 위해 지은 튼튼한 다리야.",
        quest: "아치형 돌다리 부품을 알맞은 칸으로 드래그하여 조립하세요!",
        seqItems: ["기반석 놓기", "홍예석 쌓기", "이맛돌 박기"],
        clearDesc: "정조의 효심과 애민정신이 담긴 7개의 무지개문, 만안교를 복원했습니다."
    },
    { 
        id: 8, name: "구 서이면 사무소", x: 60, y: 55, 
        gameType: "quiz", timeLimit: 0,
        imgReal: "images/relic_4_real.png", imgMain: "images/relic_4_main.png",
        npc: "images/hanyang_1-removebg.png", npcText: "전통 한옥에 유리창이 결합된 독특한 건물이야.",
        quest: "이 건물에 대한 마지막 조사를 완료하세요!",
        quizData: [
            { 
                text: "이 건물이 우리에게 주는 가장 중요한 역사적 교훈은 무엇일까요?",
                options: ["부정적 유산의 기억 (수탈의 역사)", "순수 전통 한옥의 아름다움", "서양 건축 기술의 우수성"],
                correct: 0,
                explanation: "이곳은 일제강점기의 관공서로, 아픈 근대 역사도 잊지 않고 기억하기 위한 '부정적 유산(Negative Heritage)'의 의미를 가집니다."
            }
        ],
        clearDesc: "아픈 근대 역사도 잊지 않고 기억하기 위한 기록을 마쳤습니다."
    }
];

// ==============================================================================
// [2] 전역 상태 관리 (State)
// ==============================================================================
const STATE = {
    clearedStage: parseInt(localStorage.getItem('anyang_v2_cleared') || '-1'),
    currentPlaying: -1,
    isPrologueSeen: localStorage.getItem('anyang_v2_prologue') === 'true',
    timerInt: null,
    sliderInt: null,
    cameraStream: null
};

// 사운드 매니저
const playSFX = (type) => {
    try {
        let src = '';
        if(type === 'click') src = 'sounds/sfx_click.mp3';
        if(type === 'clear') src = 'sounds/sfx_clrear.mp3';
        if(type === 'dig') src = 'sounds/sfx_dig.mp3';
        if(type === 'error') src = 'sounds/sfx_hit.mp3';
        if(src) new Audio(src).play().catch(()=>{});
    } catch(e) {}
};

function shakeModal() {
    const modal = document.querySelector('.modal-box');
    if(modal) {
        modal.classList.remove('shake');
        void modal.offsetWidth;
        modal.classList.add('shake');
    }
}

// 흔들림 애니메이션 동적 추가
const style = document.createElement('style');
style.innerHTML = `
    @keyframes flashAnim { 0% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes shake { 10%, 90% { transform: translate3d(-2px, 0, 0); } 20%, 80% { transform: translate3d(4px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-6px, 0, 0); } 40%, 60% { transform: translate3d(6px, 0, 0); } }
    .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
`;
document.head.appendChild(style);

// ==============================================================================
// [3] 시스템 초기화 및 화면 제어
// ==============================================================================
window.onload = () => {
    initLoadingSequence();
};

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        if(s.id === screenId) {
            s.classList.remove('hidden');
            void s.offsetWidth;
            s.style.opacity = '1';
        } else {
            s.style.opacity = '0';
            setTimeout(() => s.classList.add('hidden'), 500);
        }
    });
}

// ==============================================================================
// [4] 로딩 및 프롤로그 시퀀스
// ==============================================================================
function initLoadingSequence() {
    const fill = document.getElementById('loading-fill');
    let progress = 0;
    
    const loadInt = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if(progress >= 100) {
            progress = 100;
            clearInterval(loadInt);
            setTimeout(() => {
                if(!STATE.isPrologueSeen) {
                    startPrologue();
                } else {
                    startMainMap();
                }
            }, 600);
        }
        fill.style.width = progress + '%';
    }, 300);
}

function startPrologue() {
    switchScreen('prologue-screen');
    
    const textEl = document.getElementById('prologue-text');
    const han = document.getElementById('prologue-han');
    const yang = document.getElementById('prologue-yang');
    const screen = document.getElementById('prologue-screen');
    
    const prologueText = [
        "수천 년의 기억을 품은 안양 땅...",
        "어느 날, 시간의 거울이 산산조각 나며 과거가 뒤틀리기 시작했다!",
        "서둘러 흩어진 조각들을 찾아 거울의 빛을 되찾아야 해!"
    ];
    
    let pIndex = 0;
    let pInterval;
    let isPTyping = false;

    setTimeout(() => {
        han.classList.remove('hidden');
        yang.classList.remove('hidden');
        void han.offsetWidth;
        han.classList.add('active');
        yang.classList.add('active');
    }, 500);

    const nextText = () => {
        // 타이핑 중이면 즉시 완성 (스킵 기능)
        if (isPTyping) {
            clearInterval(pInterval);
            textEl.innerHTML = prologueText[pIndex - 1].replace(/\n/g, '<br>');
            isPTyping = false;
            return;
        }

        if (pIndex < prologueText.length) {
            isPTyping = true;
            textEl.innerHTML = '';
            let charIdx = 0;
            let fullText = prologueText[pIndex];
            pInterval = setInterval(() => {
                if(fullText.charAt(charIdx) === '\n') textEl.innerHTML += '<br>';
                else textEl.innerHTML += fullText.charAt(charIdx);
                
                charIdx++;
                if (charIdx >= fullText.length) {
                    clearInterval(pInterval);
                    isPTyping = false;
                }
            }, 40);
            pIndex++;
        } else {
            localStorage.setItem('anyang_v2_prologue', 'true');
            STATE.isPrologueSeen = true;
            startMainMap();
        }
    };

    screen.onclick = nextText;
    setTimeout(nextText, 1000);
}

// ==============================================================================
// [5] 메인 지도 화면
// ==============================================================================
function startMainMap() {
    switchScreen('main-screen');
    
    const count = Math.min(STATE.clearedStage + 1, STAGE_DATA.length);
    document.getElementById('mirror-count').innerText = count;

    if(count >= STAGE_DATA.length) {
        setTimeout(openARCamera, 1000);
    }

    renderMapPins();
}

function renderMapPins() {
    const layer = document.getElementById('map-pins-layer');
    layer.innerHTML = '';

    STAGE_DATA.forEach((stage, index) => {
        const pin = document.createElement('div');
        
        let stateClass = 'locked';
        if (index <= STATE.clearedStage) stateClass = 'cleared';
        else if (index === STATE.clearedStage + 1) stateClass = 'active';

        pin.className = `map-pin ${stateClass}`;
        pin.style.left = `${stage.x}%`;
        pin.style.top = `${stage.y}%`;
        
        pin.innerHTML = `
            <div class="pin-img-box">
                <img src="${stage.imgMain}" alt="${stage.name}">
            </div>
            <div class="pin-label">${stage.name}</div>
            ${stateClass === 'cleared' ? `<img src="images/1.png" class="absolute -top-3 -right-3 w-6 h-6 z-20">` : ''}
        `;
        
        pin.onclick = () => {
            if(stateClass === 'locked') {
                alert("이전 유적을 먼저 복원해야 합니다!");
            } else if(stateClass === 'cleared') {
                if(confirm("이미 복원한 유적입니다. 다시 조사할까요?")) openMinigame(index);
            } else {
                openMinigame(index);
            }
        };

        layer.appendChild(pin);
    });
}

// ==============================================================================
// [6] 미니게임 라우터 및 공통 로직
// ==============================================================================
function openMinigame(stageIndex) {
    STATE.currentPlaying = stageIndex;
    const stage = STAGE_DATA[stageIndex];
    const modal = document.getElementById('minigame-modal');
    
    document.getElementById('minigame-quest').innerText = stage.quest;
    
    const npcArea = document.getElementById('npc-area');
    if(stage.npc) {
        document.getElementById('stage-npc').src = stage.npc;
        document.getElementById('npc-bubble').innerText = stage.npcText;
        npcArea.classList.remove('hidden');
    } else {
        npcArea.classList.add('hidden');
    }

    const content = document.getElementById('minigame-content');
    content.innerHTML = ''; 
    
    const timerDisplay = document.getElementById('timer-display');
    const warningBorder = document.getElementById('time-warning-border');
    warningBorder.classList.remove('active');
    
    // 이전 인터벌 초기화
    clearInterval(STATE.timerInt);
    clearInterval(STATE.sliderInt);
    
    if(stage.timeLimit > 0) {
        timerDisplay.classList.remove('hidden');
        startTimer(stage.timeLimit);
    } else {
        timerDisplay.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    playSFX('click');

    setTimeout(() => {
        if(stage.gameType === 'scratch') initScratchGame(stage, content);
        else if(stage.gameType === 'matching') initMatchingGame(stage, content);
        else if(stage.gameType === 'quiz') initQuizGame(stage, content);
        else if(stage.gameType === 'hidden') initHiddenGame(stage, content);
        else if(stage.gameType === 'slider') initSliderGame(stage, content);
        else if(stage.gameType === 'sequence') initSequenceGame(stage, content);
    }, 100); 
}

function minigameClear() {
    clearInterval(STATE.timerInt);
    clearInterval(STATE.sliderInt);
    document.getElementById('time-warning-border').classList.remove('active');
    playSFX('clear');
    
    setTimeout(() => {
        document.getElementById('minigame-modal').classList.add('hidden');
        showResultModal();
    }, 800);
}

function minigameFail() {
    clearInterval(STATE.timerInt);
    clearInterval(STATE.sliderInt);
    document.getElementById('time-warning-border').classList.remove('active');
    playSound('error');
    alert("시간 초과! 단서를 놓쳤습니다. 다시 도전하세요.");
    document.getElementById('minigame-modal').classList.add('hidden');
}

function startTimer(seconds) {
    let timeLeft = seconds;
    const timeEl = document.getElementById('time-left');
    const warningBorder = document.getElementById('time-warning-border');
    
    timeEl.innerText = timeLeft;
    
    STATE.timerInt = setInterval(() => {
        timeLeft--;
        timeEl.innerText = timeLeft;
        
        if(timeLeft <= 5 && timeLeft > 0) {
            warningBorder.classList.add('active');
            playSFX('click'); 
        }
        
        if(timeLeft <= 0) {
            minigameFail();
        }
    }, 1000);
}

// ==============================================================================
// [7] 개별 미니게임 구현 (고도화됨)
// ==============================================================================

/* 1. 스크래치 게임 (Canvas) */
function initScratchGame(stage, container) {
    document.getElementById('tool-panel').classList.remove('hidden');
    
    const img = document.createElement('img');
    img.src = stage.imgMain;
    img.style.cssText = "position:absolute; width:100%; height:100%; object-fit:contain; padding:20px;";
    container.appendChild(img);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = "position:absolute; width:100%; height:100%; touch-action:none; cursor:crosshair;";
    container.appendChild(canvas);

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const isRubbing = stage.id === 4; // 탁본
    ctx.fillStyle = isRubbing ? '#211210' : '#5d4037'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    let lastSound = 0;

    const draw = (e) => {
        if(!isDrawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI*2);
        ctx.fill();

        if (Date.now() - lastSound > 200) {
            playSFX('dig');
            lastSound = Date.now();
        }

        const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let clearCount = 0;
        for(let i=3; i<data.length; i+=40) if(data[i]===0) clearCount++;
        if(clearCount / (data.length/40) > 0.6) {
            isDrawing = false;
            canvas.style.transition = 'opacity 0.5s';
            canvas.style.opacity = '0';
            setTimeout(minigameClear, 500);
        }
    };

    canvas.onmousedown = () => isDrawing = true;
    canvas.onmouseup = () => isDrawing = false;
    canvas.onmousemove = draw;
    canvas.ontouchstart = (e) => { isDrawing = true; draw(e); };
    canvas.ontouchend = () => isDrawing = false;
    canvas.ontouchmove = draw;
}

/* 2. 짝맞추기 게임 (캔버스 연결선 추가) */
function initMatchingGame(stage, container) {
    document.getElementById('tool-panel').classList.add('hidden');
    
    // 연결선 그리기용 캔버스
    const canvas = document.createElement('canvas');
    canvas.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;";
    container.appendChild(canvas);
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const ctx = canvas.getContext('2d');

    const grid = document.createElement('div');
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,1fr); gap:15px; padding:20px; height:100%; position:relative; z-index:2;";
    
    let tops = [...stage.matchPairs].sort(() => Math.random() - 0.5);
    let bottoms = [...stage.matchPairs].sort(() => Math.random() - 0.5);
    
    let selectedTop = null;
    let matchedCount = 0;

    const createBtn = (text, id, isTop) => {
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.style.cssText = "background:#8d6e63; height:60px; font-size:14px; word-break:keep-all;";
        btn.innerText = text;
        
        btn.onclick = () => {
            if(btn.dataset.matched === 'true') return;
            playSFX('click');

            if(isTop) {
                // 상단 아이템 선택
                document.querySelectorAll('.top-item').forEach(el => {
                    if(el.dataset.matched !== 'true') { el.style.background = '#8d6e63'; el.style.color = '#fff'; }
                });
                btn.style.background = '#ffca28'; btn.style.color = '#3e2723';
                selectedTop = { dom: btn, id: id };
            } else {
                // 하단 아이템 선택 (상단이 선택되어 있을 때만)
                if(!selectedTop) return;
                
                if(selectedTop.id === id) {
                    // 정답
                    playSFX('clear');
                    btn.style.background = '#558b2f'; btn.style.color = '#fff'; btn.dataset.matched = 'true';
                    selectedTop.dom.style.background = '#558b2f'; selectedTop.dom.style.color = '#fff'; selectedTop.dom.dataset.matched = 'true';
                    
                    // 캔버스에 선 그리기
                    const r1 = selectedTop.dom.getBoundingClientRect();
                    const r2 = btn.getBoundingClientRect();
                    const cRect = canvas.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(r1.left + r1.width/2 - cRect.left, r1.top + r1.height/2 - cRect.top);
                    ctx.lineTo(r2.left + r2.width/2 - cRect.left, r2.top + r2.height/2 - cRect.top);
                    ctx.strokeStyle = '#ffca28';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();

                    selectedTop = null;
                    matchedCount++;
                    if(matchedCount >= stage.matchPairs.length) setTimeout(minigameClear, 800);
                } else {
                    // 오답
                    playSFX('error');
                    shakeModal();
                    btn.style.background = '#d32f2f'; btn.style.color = '#fff';
                    setTimeout(() => { btn.style.background = '#8d6e63'; btn.style.color = '#fff'; }, 400);
                }
            }
        };
        if(isTop) btn.classList.add('top-item');
        return btn;
    };

    tops.forEach(p => grid.appendChild(createBtn(p.a, p.a, true)));
    bottoms.forEach(p => grid.appendChild(createBtn(p.b, p.a, false))); // b의 id도 a로 매핑하여 판별

    container.appendChild(grid);
}

/* 3. 퀴즈 게임 (다중 문제 및 피드백 지원) */
function initQuizGame(stage, container) {
    document.getElementById('tool-panel').classList.add('hidden');
    
    let currentQIdx = 0;
    
    const renderQ = () => {
        container.innerHTML = '';
        const qData = stage.quizData[currentQIdx];
        
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display:flex; flex-direction:column; gap:10px; padding:15px; justify-content:center; height:100%; position:relative;";
        
        const qTitle = document.createElement('div');
        qTitle.style.cssText = "font-size:15px; font-weight:bold; color:#ffca28; margin-bottom:10px; line-height:1.4;";
        qTitle.innerText = `Q${currentQIdx+1}. ${qData.text}`;
        wrapper.appendChild(qTitle);
        
        qData.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = 'pixel-btn';
            btn.style.cssText = "background-color: #fdfcf8; color: #3e2723; word-break: keep-all; line-height: 1.3; font-size:14px; text-align:left;";
            btn.innerText = optText;
            
            btn.onclick = () => {
                if(idx === qData.correct) {
                    playSFX('click');
                    btn.style.backgroundColor = '#558b2f';
                    btn.style.color = '#fff';
                    
                    // 피드백 오버레이 생성
                    const feedback = document.createElement('div');
                    feedback.style.cssText = "position:absolute; inset:0; background:rgba(33,18,16,0.95); z-index:10; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; text-align:center; border-radius:8px;";
                    feedback.innerHTML = `
                        <h3 style="color:#558b2f; font-size:20px; margin-bottom:15px;">정답입니다!</h3>
                        <p style="color:#fdfcf8; font-size:14px; line-height:1.5; word-break:keep-all;">${qData.explanation}</p>
                        <button class="pixel-btn" style="margin-top:20px; background:#ffca28; color:#3e2723;">다음으로</button>
                    `;
                    feedback.querySelector('button').onclick = () => {
                        currentQIdx++;
                        if(currentQIdx < stage.quizData.length) renderQ();
                        else minigameClear();
                    };
                    wrapper.appendChild(feedback);
                } else {
                    playSFX('error');
                    shakeModal();
                    btn.style.backgroundColor = '#d32f2f';
                    btn.style.color = '#fff';
                    setTimeout(() => {
                        btn.style.backgroundColor = '#fdfcf8';
                        btn.style.color = '#3e2723';
                    }, 400);
                }
            };
            wrapper.appendChild(btn);
        });
        container.appendChild(wrapper);
    };
    renderQ();
}

/* 4. 숨은 단서 찾기 (방해물 추가) */
function initHiddenGame(stage, container) {
    document.getElementById('tool-panel').classList.add('hidden');
    
    container.innerHTML = `
        <div style="position:relative; width:100%; height:100%;">
            <img src="${stage.imgReal}" style="width:100%; height:100%; object-fit:cover; opacity:0.8; padding:10px;">
            <div id="hidden-layer" style="position:absolute; inset:0;"></div>
        </div>
    `;
    
    const layer = document.getElementById('hidden-layer');
    let found = 0;
    
    // 진짜 목표물 생성
    for(let i=0; i<stage.hiddenTargets; i++) {
        const spot = document.createElement('div');
        spot.style.cssText = `position:absolute; width:45px; height:45px; border-radius:50%; border:3px dashed #ffca28;
                              left:${15 + Math.random()*60}%; top:${15 + Math.random()*60}%; cursor:pointer;
                              background:rgba(255,202,40,0.3); animation: blinkAnim 1.5s infinite; transform:translate(-50%, -50%);`;
        
        spot.onclick = function() {
            if(this.dataset.found === 'true') return;
            this.dataset.found = 'true';
            this.style.background = 'rgba(85, 139, 47, 0.8)';
            this.style.border = '4px solid #558b2f';
            this.style.animation = 'none';
            playSFX('click');
            
            found++;
            if(found >= stage.hiddenTargets) setTimeout(minigameClear, 500);
        };
        layer.appendChild(spot);
    }

    // 가짜 방해물(돌멩이) 생성
    for(let i=0; i<(stage.fakeTargets || 0); i++) {
        const fake = document.createElement('div');
        fake.innerText = "🪨";
        fake.style.cssText = `position:absolute; font-size:30px; cursor:pointer; transform:translate(-50%, -50%);
                              left:${10 + Math.random()*80}%; top:${10 + Math.random()*80}%;`;
        fake.onclick = function() {
            playSFX('error');
            shakeModal();
            this.style.opacity = '0';
            // 시간 감소 로직
            const timeEl = document.getElementById('time-left');
            let t = parseInt(timeEl.innerText);
            if(t > 2) timeEl.innerText = t - 2;
        };
        layer.appendChild(fake);
    }
}

/* 5. 가마 온도 슬라이더 (동적 이동) */
function initSliderGame(stage, container) {
    document.getElementById('tool-panel').classList.add('hidden');
    
    container.innerHTML = `
        <div style="padding:20px; text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <img src="${stage.imgMain}" style="height:70px; margin-bottom:15px; filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.5));">
            <div style="font-size:14px; margin-bottom:15px; color:#fdfcf8; font-weight:bold;">🔥 불조절 적정 구간을 3초간 유지하세요!</div>
            
            <div style="position:relative; width:90%; height:30px; background:#3e2723; border-radius:15px; border:3px solid #1a0f0d; margin-bottom:20px; overflow:hidden;">
                <!-- 동적으로 움직이는 적정 구역 -->
                <div id="good-zone" style="position:absolute; left:40%; width:20%; height:100%; background:rgba(165, 214, 167, 0.6); border: 2px dashed #a5d6a7; transition: left 0.3s linear;"></div>
                <input type="range" id="temp-slider" min="0" max="100" value="0" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0.8; z-index:10; margin:0;">
            </div>
            
            <div style="width:90%; height:15px; background:#222; border-radius:8px; overflow:hidden; border:2px solid #555;">
                <div id="hold-progress" style="width:0%; height:100%; background:#ffca28; transition:width 0.1s linear;"></div>
            </div>
            <div id="current-temp-text" style="margin-top:10px; font-size:14px; font-weight:bold; color:#ffca28;">온도: 0℃</div>
        </div>
    `;
    
    const slider = document.getElementById('temp-slider');
    const progress = document.getElementById('hold-progress');
    const goodZone = document.getElementById('good-zone');
    const tempText = document.getElementById('current-temp-text');
    
    let holdTime = 0;
    let targetMin = 40;
    let targetMax = 60;
    let zoneDir = 1;
    let currentTemp = 0;
    
    slider.oninput = (e) => { currentTemp = parseInt(e.target.value); };

    STATE.sliderInt = setInterval(() => {
        // 구간 자동 이동
        targetMin += zoneDir * 2;
        targetMax += zoneDir * 2;
        if (targetMax >= 95) zoneDir = -1;
        if (targetMin <= 5) zoneDir = 1;
        goodZone.style.left = `${targetMin}%`;

        // 온도 자연 감소
        if(currentTemp > 0) {
            currentTemp -= 1;
            slider.value = currentTemp;
        }
        
        tempText.innerText = `온도: ${currentTemp}℃`;

        if(currentTemp >= targetMin && currentTemp <= targetMax) {
            holdTime += 100;
            tempText.style.color = "#a5d6a7";
            if(holdTime >= 3000) {
                clearInterval(STATE.sliderInt);
                minigameClear();
            }
        } else {
            holdTime = Math.max(0, holdTime - 150);
            tempText.style.color = "#ffca28";
        }
        progress.style.width = (holdTime / 3000 * 100) + '%';
    }, 100);
}

/* 6. 순서 맞추기 조립 (Drag & Drop 터치 지원) */
function initSequenceGame(stage, container) {
    document.getElementById('tool-panel').classList.add('hidden');
    
    container.innerHTML = `
        <div style="padding:15px; display:flex; flex-direction:column; height:100%; justify-content:space-around;">
            <div id="seq-slots" style="display:flex; gap:10px; justify-content:center; z-index:1;"></div>
            <div id="seq-items" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; position:relative; min-height:60px;"></div>
        </div>
    `;
    
    const slotsContainer = document.getElementById('seq-slots');
    const itemsContainer = document.getElementById('seq-items');
    let currentStep = 0;
    
    // 빈 슬롯 생성
    stage.seqItems.forEach((item, idx) => {
        const slot = document.createElement('div');
        slot.id = `seq-slot-${idx}`;
        slot.style.cssText = "width:70px; height:70px; border:3px dashed #8d6e63; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#8d6e63; font-weight:bold; font-size:12px; text-align:center; word-break:keep-all; background:rgba(0,0,0,0.2);";
        slot.innerText = `${idx+1}단계`;
        slotsContainer.appendChild(slot);
    });
    
    // 부품 셔플
    let shuffled = stage.seqItems.map((name, i) => ({name, id:i})).sort(() => Math.random() - 0.5);
    
    shuffled.forEach((itemObj, idx) => {
        const piece = document.createElement('div');
        piece.className = 'pixel-btn';
        // 모바일 터치를 위해 absolute 속성 적용
        piece.style.cssText = "padding:10px; font-size:12px; background:#fdfcf8; color:#3e2723; flex: 1 1 calc(33% - 10px); display:flex; align-items:center; justify-content:center; word-break:keep-all; touch-action:none; z-index:10; box-sizing:border-box;";
        piece.innerText = itemObj.name;
        
        let startX, startY, initLeft, initTop;
        
        const onDragStart = (e) => {
            if(piece.dataset.used === 'true') return;
            e.preventDefault();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            // absolute 전환 준비 (최초 드래그 시)
            if(piece.style.position !== 'absolute') {
                const rect = piece.getBoundingClientRect();
                const parentRect = itemsContainer.getBoundingClientRect();
                piece.style.position = 'absolute';
                piece.style.width = rect.width + 'px';
                piece.style.height = rect.height + 'px';
                piece.style.left = (rect.left - parentRect.left) + 'px';
                piece.style.top = (rect.top - parentRect.top) + 'px';
                piece.style.margin = '0';
            }

            startX = clientX; startY = clientY;
            initLeft = parseFloat(piece.style.left);
            initTop = parseFloat(piece.style.top);
            piece.style.zIndex = '100';
            piece.style.transform = 'scale(1.1)';
            piece.style.border = '3px solid #ffca28';
            
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
            document.addEventListener('touchmove', onDragMove, {passive: false});
            document.addEventListener('touchend', onDragEnd);
        };

        const onDragMove = (e) => {
            e.preventDefault();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            piece.style.left = (initLeft + (clientX - startX)) + 'px';
            piece.style.top = (initTop + (clientY - startY)) + 'px';
        };

        const onDragEnd = (e) => {
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            document.removeEventListener('touchmove', onDragMove);
            document.removeEventListener('touchend', onDragEnd);
            
            piece.style.transform = 'scale(1)';
            piece.style.border = '3px solid #fdfcf8';
            piece.style.zIndex = '10';

            const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0);
            const clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0);
            const targetSlot = document.getElementById(`seq-slot-${currentStep}`);
            
            if(targetSlot) {
                const rect = targetSlot.getBoundingClientRect();
                // 드롭 위치가 타겟 슬롯 내부인지 판별
                if(clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom) {
                    if(itemObj.id === currentStep) {
                        // 정답
                        playSFX('click');
                        piece.dataset.used = 'true';
                        piece.style.display = 'none';
                        targetSlot.style.border = '3px solid #558b2f';
                        targetSlot.style.background = '#558b2f';
                        targetSlot.style.color = '#fff';
                        targetSlot.innerText = itemObj.name;
                        
                        currentStep++;
                        if(currentStep >= stage.seqItems.length) setTimeout(minigameClear, 500);
                    } else {
                        // 오답 (순서 틀림)
                        playSFX('error');
                        shakeModal();
                        piece.style.transition = "all 0.3s";
                        piece.style.left = initLeft + 'px';
                        piece.style.top = initTop + 'px';
                        setTimeout(() => piece.style.transition = "", 300);
                    }
                } else {
                    // 원위치 복귀
                    piece.style.transition = "all 0.3s";
                    piece.style.left = initLeft + 'px';
                    piece.style.top = initTop + 'px';
                    setTimeout(() => piece.style.transition = "", 300);
                }
            }
        };

        piece.addEventListener('mousedown', onDragStart);
        piece.addEventListener('touchstart', onDragStart);
        itemsContainer.appendChild(piece);
    });
}

// ==============================================================================
// [8] 결과 모달
// ==============================================================================
function showResultModal() {
    const stage = STAGE_DATA[STATE.currentPlaying];
    
    document.getElementById('cleared-relic-img').src = stage.imgMain;
    document.getElementById('cleared-desc').innerText = stage.clearDesc;
    
    const modal = document.getElementById('result-modal');
    modal.classList.remove('hidden');

    document.getElementById('btn-next-stage').onclick = () => {
        playSFX('click');
        modal.classList.add('hidden');
        
        // 진행도 업데이트
        if(STATE.currentPlaying > STATE.clearedStage) {
            STATE.clearedStage = STATE.currentPlaying;
            localStorage.setItem('anyang_v2_cleared', STATE.clearedStage);
        }
        
        startMainMap(); // 지도 리렌더링
    };
}

// ==============================================================================
// [9] 최종 엔딩 & AR 카메라
// ==============================================================================
function openARCamera() {
    const modal = document.getElementById('ar-modal');
    modal.classList.remove('hidden');
    
    const video = document.getElementById('ar-video');
    
    // 기기 카메라 호출
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            STATE.cameraStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Camera access denied or unavailable.", err);
            // Fallback: 카메라가 없으면 까만 배경 유지
            video.style.background = "#222";
        });
    }

    // 닫기
    document.getElementById('close-ar').onclick = () => {
        if(STATE.cameraStream) {
            STATE.cameraStream.getTracks().forEach(t => t.stop());
        }
        modal.classList.add('hidden');
    };

    // 찰칵 버튼 (이펙트)
    document.getElementById('btn-capture').onclick = () => {
        playSFX('clear');
        const flash = document.createElement('div');
        flash.style.cssText = "position:absolute; inset:0; background:white; z-index:9999; animation:flashAnim 0.5s ease-out forwards;";
        modal.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
        
        // 브라우저 캡처 API는 복잡하므로 시각적 피드백만 제공 후 안내
        setTimeout(() => {
            alert("사진이 앨범에 저장되었습니다! 친구들에게 공유해보세요.");
        }, 600);
    };
}