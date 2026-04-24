/* ==============================================================================
   [현장 조사 : 안양의 기억 - Visual Novel Engine Ver 5.0 (Minigame Integration)]
   - 기능: 한/양 연구원 스토리 + 다중 미니게임 (스크래치, 짝맞추기, 퀴즈)
   ============================================================================== */

// [1] 사운드 매니저 (중복 방지)
if (typeof SoundManager === 'undefined') {
    window.SoundManager = {
        playSFX: function(fileName) {
            const audio = new Audio(`../sounds/${fileName}`);
            audio.volume = 0.6;
            audio.play().catch(() => {});
        }
    };
}

// [2] 마스터 데이터 (유물 및 스토리/미니게임)
const RELIC_DATA = [
    { id: 0, name: "안양사 귀부", location: "만안구 석수동", img: "relic_0_main.png", reward: "안양사 귀부 조각" },
    { id: 1, name: "중초사지 당간지주", location: "만안구 석수동", img: "relic_1_main.png", reward: "고대 깃발 조각" },
    { id: 2, name: "석수동 마애종", location: "만안구 석수동", img: "relic_2_main.png", reward: "마애종 탁본" },
    { id: 3, name: "만안교", location: "만안구 안양동", img: "relic_3_main.png", reward: "만안교 축조 기록" },
    { id: 4, name: "구 서이면 사무소", location: "만안구 안양1동", img: "relic_4_main.png", reward: "근대 행정 문서" },
    { id: 5, name: "석수동 석실분", location: "만안구 석수동", img: "relic_5_main.png", reward: "삼국시대 토기" },
    { id: 6, name: "관양동 선사유적", location: "동안구 관양동", img: "relic_6_main.png", reward: "반달 돌칼" },
    { id: 7, name: "평촌 지석묘", location: "동안구 평촌동", img: "relic_7_main.png", reward: "청동기 유물" }
];

const STORY_SCRIPT = [
    // 0. 안양사 귀부 (일반 퀴즈)
    {
        intro: [
            { char: "양", text: "분석관님, 여기 거북이 모양의 큰 돌이 있어요! 등 위에 비석은 없고 받침만 남았네요?" },
            { char: "한", text: "잘 봤어. 이건 '안양사 귀부'야. 고려 태조 왕건이 세운 안양사가 있던 곳이지." },
            { char: "한", text: "자세히 보면 머리는 용, 몸은 거북이야. 고려시대 귀부의 특징이지. 김부식이 쓴 비석이 있었을 걸로 추정돼." }
        ],
        gameType: "quiz",
        game: {
            q: "안양사 귀부에 대한 설명으로 옳은 것은?",
            a: [
                { txt: "통일신라 시대의 작품이다.", c: false },
                { txt: "머리는 용, 몸은 거북 모양인 고려시대 양식이다.", c: true },
                { txt: "등 위에 원래부터 아무것도 없었다.", c: false }
            ],
            clearMsg: "정답! 웅장한 모습에서 고려의 기상이 느껴지지?"
        }
    },
    // 1. 중초사지 당간지주 (짝맞추기)
    {
        intro: [
            { char: "양", text: "절 입구에 깃발을 걸던 기둥, 당간지주네요. 근데 서쪽 기둥에 글씨가 빼곡해요!" },
            { char: "한", text: "매우 중요한 발견이야. 저 명문 덕분에 이 당간지주가 827년에 만들어졌다는 걸 정확히 알 수 있어." },
            { char: "양", text: "제작 연도가 확실한 국내 유일의 당간지주라니, 관련 정보들을 짝맞춰서 기록해둘게요!" }
        ],
        gameType: "matching",
        game: {
            q: "연관된 단어 카드의 짝을 맞추세요!",
            pairs: [ {a: "당간지주", b: "깃발 기둥"}, {a: "제작 연도", b: "827년"}, {a: "후원자", b: "황룡사 승려"} ],
            clearMsg: "좋아! 827년이라는 정확한 기록을 모두 정리했어."
        }
    },
    // 2. 석수동 마애종 (스크래치)
    {
        intro: [
            { char: "양", text: "바위 절벽에 종이 그려져 있어요. 스님이 종을 치려는 것 같은데요?" },
            { char: "한", text: "'석수동 마애종'이야. 스님이 당목을 잡고 종을 치는 장면을 묘사한 것은 우리나라에서 이게 유일해." },
            { char: "한", text: "바위에 새겨진 문양을 더 선명하게 보기 위해 탁본을 떠보는 게 좋겠어. 도구를 사용해 줘!" }
        ],
        gameType: "scratch",
        game: {
            q: "화면을 문질러 마애종의 탁본을 완성하세요!",
            clearMsg: "완벽해! 스님이 종을 치는 모습이 선명하게 탁본으로 떠졌어."
        }
    },
    // 3. 만안교 (일반 퀴즈)
    {
        intro: [
            { char: "양", text: "아름다운 무지개 모양의 돌다리네요. 홍예가 7개나 있어요!" },
            { char: "한", text: "이건 '만안교'야. 정조대왕이 아버지 사도세자의 능을 참배하러 갈 때, 백성들의 편의를 위해 만들었어." },
            { char: "양", text: "그래서 이름이 '만안(萬安, 만년 편안함)'이군요. 효심과 애민 정신이 느껴져요." }
        ],
        gameType: "quiz",
        game: {
            q: "정조대왕이 만안교를 석조 다리로 건립한 목적은?",
            a: [
                { txt: "군사 훈련을 위해서", c: false },
                { txt: "백성들이 평상시에도 편하게 이용하도록", c: true },
                { txt: "통행료를 걷기 위해서", c: false }
            ],
            clearMsg: "훌륭해. 백성을 생각하는 왕의 마음이 담겨있어."
        }
    },
    // 4. 구 서이면 사무소 (짝맞추기)
    {
        intro: [
            { char: "양", text: "이 건물은 한옥 같은데 유리창이 있네요? 1914년에 지어졌다고요?" },
            { char: "한", text: "'구 서이면 사무소'야. 일제강점기에 행정 업무를 보던 곳이지. 하지만 아픈 역사도 기억해야 할 교훈이야." },
            { char: "양", text: "네, '부정적 유산'으로서 잊지 않도록 특징들을 짝맞춰 기록해 둘게요." }
        ],
        gameType: "matching",
        game: {
            q: "구 서이면 사무소의 특징들을 짝맞추세요!",
            pairs: [ {a: "건축 년도", b: "1914년"}, {a: "건축 양식", b: "한옥+유리창"}, {a: "역사적 의미", b: "부정적 유산"} ],
            clearMsg: "맞아. 잊지 말아야 할 우리의 근대 역사야."
        }
    },
    // 5. 석수동 석실분 (스크래치)
    {
        intro: [
            { char: "한", text: "삼성산 중턱에 있는 이 돌방무덤은 삼국시대의 것이야." },
            { char: "양", text: "입구가 흙으로 막혀있는 것 같아요. 파내볼까요?" },
            { char: "한", text: "맞아. '앞트기식 돌방무덤'의 입구를 막은 흙을 걷어내면 내부 구조를 확인할 수 있을 거야." }
        ],
        gameType: "scratch",
        game: {
            q: "화면을 문질러 무덤 입구를 막고 있는 흙을 파내세요!",
            clearMsg: "정확해. 한강 유역을 차지하기 위한 삼국시대의 무덤 구조가 드러났어."
        }
    },
    // 6. 관양동 선사유적 (스크래치)
    {
        intro: [
            { char: "양", text: "이 주변은 흙이 부드러워서 무언가 묻혀있을 것 같아요!" },
            { char: "한", text: "관양동 선사유적지야. 청동기 시대의 집터들이 대규모로 확인된 곳이지." },
            { char: "양", text: "제가 도구를 사용해서 지표면을 한 번 긁어내 볼게요." }
        ],
        gameType: "scratch",
        game: {
            q: "수풀과 흙을 문질러 땅속의 단서를 찾아내세요!",
            clearMsg: "맞아. 농경 생활을 했던 청동기 시대의 흔적이야."
        }
    },
    // 7. 평촌 지석묘 (퀴즈)
    {
        intro: [
            { char: "한", text: "도심 공원에 거대한 바위들이 모여있지? '평촌 지석묘'야." },
            { char: "양", text: "고인돌이네요! 덮개돌이 정말 커요. 이걸 어떻게 옮겼을까요?" },
            { char: "한", text: "그래서 고인돌은 '협동'의 상징이야. 발굴 당시 의식용 유물들이 나온 걸 보면 제사장의 무덤이었을 거야." }
        ],
        gameType: "quiz",
        game: {
            q: "평촌 지석묘 발굴 유물의 특징은?",
            a: [
                { txt: "전쟁에 사용된 날카로운 무기", c: false },
                { txt: "무덤에 묻기 위해 만든 의식용 유물", c: true },
                { txt: "농사에 쓰던 쇠기구", c: false }
            ],
            clearMsg: "정답! 마을의 안녕을 비는 의식용 도구들이었지."
        }
    }
];

// [3] 게임 상태 변수
let currentStage = 0;
let scriptQueue = [];
let isTyping = false;
let currentRelic = null;
let isStageClear = false; 
let correctCount = 0; 

// [4] 초기화
window.onload = function() {
    correctCount = 0; 
    loadStage(0);
};

// [5] 스테이지 로드 및 대화 진행
function loadStage(idx) {
    if (idx >= RELIC_DATA.length) {
        showEnding();
        return;
    }

    currentStage = idx;
    currentRelic = RELIC_DATA[idx];
    isStageClear = false;
    
    // UI 업데이트
    const titleEl = document.querySelector('.header-title');
    if(titleEl) titleEl.innerText = `현장 조사: ${currentRelic.name}`;

    // 배경 이미지 설정
    const bgEl = document.getElementById('scene-bg');
    if(bgEl) {
        bgEl.style.backgroundImage = `url('../images/${currentRelic.img.replace('_main', '_real')}')`;
        bgEl.style.opacity = 0;
        setTimeout(() => bgEl.style.opacity = 1, 100);
    }

    // 대화 큐 초기화
    scriptQueue = [...STORY_SCRIPT[idx].intro];
    
    document.getElementById('dialogue-portrait').classList.add('hidden');
    document.getElementById('minigame-overlay').classList.add('hidden');
    
    nextScript();
}

window.nextScript = function() {
    if (isStageClear || isTyping) return;

    if (scriptQueue.length === 0) {
        startMinigame();
        return;
    }

    const curr = scriptQueue.shift();
    SoundManager.playSFX('sfx_click.mp3');
    updateScene(curr.char, curr.text);
};

function updateScene(charName, text) {
    const portrait = document.getElementById('dialogue-portrait');
    const nameBadge = document.getElementById('char-name');

    if (charName === "한") {
        portrait.src = "../images/han_2.png";
        portrait.classList.remove('hidden');
        nameBadge.innerText = "한 (분석관)";
        nameBadge.style.backgroundColor = "#7c9a3d";
    } else if (charName === "양") {
        portrait.src = "../images/yang_2.png";
        portrait.classList.remove('hidden');
        nameBadge.innerText = "양 (연구원)";
        nameBadge.style.backgroundColor = "#d4af37";
    } else {
        portrait.classList.add('hidden');
        nameBadge.innerText = charName;
        nameBadge.style.backgroundColor = "#3e2723";
    }
    nameBadge.classList.remove('hidden');

    const textEl = document.getElementById('dialogue-text');
    textEl.innerHTML = "";
    isTyping = true;
    let i = 0;
    
    const timer = setInterval(() => {
        textEl.innerHTML += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(timer);
            isTyping = false;
        }
    }, 30);
}

// ==============================================================================
// [6] 미니게임 엔진 라우터
// ==============================================================================
function startMinigame() {
    const stageData = STORY_SCRIPT[currentStage];
    const gameData = stageData.game;
    
    const overlay = document.getElementById('minigame-overlay');
    const container = document.getElementById('minigame-container');
    const title = document.getElementById('minigame-q');
    
    title.innerText = gameData.q;
    container.innerHTML = ""; 
    container.className = "minigame-container"; // 리셋
    overlay.classList.remove('hidden');

    if (stageData.gameType === 'scratch') {
        initScratchGame(gameData, container);
    } else if (stageData.gameType === 'matching') {
        initMatchingGame(gameData, container);
    } else {
        initQuizGame(gameData, container);
    }
}

// [Type 1] 일반 퀴즈
function initQuizGame(gameData, container) {
    // 버튼들을 세로로 정렬
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    gameData.a.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.txt;
        // Tailwind 스타일 흉내 (인라인)
        btn.style.padding = '12px';
        btn.style.backgroundColor = '#fdfcf8';
        btn.style.border = '3px solid #3e2723';
        btn.style.borderRadius = '8px';
        btn.style.fontFamily = "'DungGeunMo', sans-serif";
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '15px';
        btn.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.3)';

        btn.onclick = () => {
            if (opt.c) {
                onMinigameClear(gameData);
            } else {
                SoundManager.playSFX('sfx_hit.mp3');
                btn.style.backgroundColor = '#ffcdd2';
                setTimeout(() => btn.style.backgroundColor = '#fdfcf8', 300);
            }
        };
        container.appendChild(btn);
    });
}

// [Type 2] 스크래치 (지표면/탁본)
function initScratchGame(gameData, container) {
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '200px';
    container.style.overflow = 'hidden';
    container.style.borderRadius = '8px';

    // 1. 단서 이미지 (아래쪽)
    const img = document.createElement('img');
    img.src = `../images/${currentRelic.img.replace('_main', '_real')}`;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    container.appendChild(img);

    // 2. 스크래치 캔버스 (위쪽 덮개)
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);

    setTimeout(() => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.fillStyle = currentStage === 2 ? '#222' : '#5d4037'; // 탁본은 검정, 발굴은 흙색
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let isDrawing = false;
        let lastSfx = 0;

        const scratch = (e) => {
            if(!isDrawing) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(clientX - rect.left, clientY - rect.top, 25, 0, Math.PI*2);
            ctx.fill();

            if (Date.now() - lastSfx > 200) {
                SoundManager.playSFX('sfx_dig.mp3');
                lastSfx = Date.now();
            }

            // 진행도 체크
            const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
            let count = 0;
            for(let i=3; i<data.length; i+=40) if(data[i]===0) count++;
            if(count / (data.length/40) > 0.55) { 
                isDrawing = false;
                canvas.onmousemove = null;
                canvas.ontouchmove = null;
                canvas.style.transition = 'opacity 0.5s';
                canvas.style.opacity = '0';
                setTimeout(() => onMinigameClear(gameData), 600);
            }
        };

        canvas.onmousedown = () => isDrawing = true;
        canvas.onmouseup = () => isDrawing = false;
        canvas.onmousemove = scratch;
        canvas.ontouchstart = (e) => { isDrawing = true; scratch(e); };
        canvas.ontouchend = () => isDrawing = false;
        canvas.ontouchmove = scratch;
    }, 50);
}

// [Type 3] 짝맞추기 게임
function initMatchingGame(gameData, container) {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gap = '10px';

    let cards = [];
    gameData.pairs.forEach((p, idx) => {
        cards.push({ id: idx, text: p.a });
        cards.push({ id: idx, text: p.b });
    });
    // 셔플
    cards.sort(() => Math.random() - 0.5);
    
    let flippedCards = [];
    let matchedCount = 0;

    cards.forEach(card => {
        const btn = document.createElement('div');
        // 스타일 적용
        btn.style.height = '60px';
        btn.style.backgroundColor = '#8d6e63';
        btn.style.border = '2px solid #3e2723';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontWeight = 'bold';
        btn.style.color = '#fdfcf8';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.3)';
        btn.style.transition = 'all 0.2s';
        btn.style.fontSize = '14px';
        
        btn.innerText = "❓";
        btn.dataset.id = card.id;
        
        btn.onclick = function() {
            if(flippedCards.length >= 2 || this.dataset.flipped === 'true') return;
            SoundManager.playSFX('sfx_click.mp3');
            
            this.innerText = card.text;
            this.style.backgroundColor = '#ffca28';
            this.style.color = '#3e2723';
            this.style.transform = 'scale(0.95)';
            this.style.boxShadow = 'none';
            this.dataset.flipped = 'true';
            
            flippedCards.push({ dom: this, id: card.id });

            if(flippedCards.length === 2) {
                setTimeout(() => {
                    if(flippedCards[0].id === flippedCards[1].id) {
                        SoundManager.playSFX('sfx_fix.mp3');
                        flippedCards.forEach(c => {
                            c.dom.style.visibility = 'hidden';
                            c.dom.style.pointerEvents = 'none';
                        });
                        matchedCount++;
                        if(matchedCount === gameData.pairs.length) setTimeout(() => onMinigameClear(gameData), 500);
                    } else {
                        SoundManager.playSFX('sfx_hit.mp3');
                        flippedCards.forEach(c => {
                            c.dom.dataset.flipped = 'false';
                            c.dom.innerText = "❓";
                            c.dom.style.backgroundColor = '#8d6e63';
                            c.dom.style.color = '#fdfcf8';
                            c.dom.style.transform = 'scale(1)';
                            c.dom.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.3)';
                        });
                    }
                    flippedCards = [];
                }, 800);
            }
        };
        container.appendChild(btn);
    });
}

// ==============================================================================
// [7] 클리어 및 엔딩 처리
// ==============================================================================
function onMinigameClear(gameData) {
    document.getElementById('minigame-overlay').classList.add('hidden');
    SoundManager.playSFX('sfx_clear.mp3');
    
    isStageClear = true;
    correctCount++; 
    
    // 성공 시 한(분석관)의 칭찬 대사
    scriptQueue = [ { char: "한", text: gameData.clearMsg } ];
    
    // 대화창 업데이트 로직 직접 호출 후, 클릭 시 결과창 띄우기 설정
    updateScene("한", gameData.clearMsg);
    
    // 다음 클릭 이벤트 오버라이드 (결과창 표시)
    const dialogueArea = document.querySelector('.dialogue-area');
    const oldClick = dialogueArea.onclick;
    dialogueArea.onclick = () => {
        dialogueArea.onclick = oldClick; // 리셋
        showResult();
    };
}

function showResult() {
    const overlay = document.getElementById('result-overlay');
    document.getElementById('result-img').src = `../images/${currentRelic.img.replace('_main', '_real')}`;
    document.getElementById('reward-item').innerText = currentRelic.reward;
    
    overlay.classList.remove('hidden');
    SoundManager.playSFX('sfx_fix.mp3');
}

// '다음 지역으로' 버튼 클릭 시
window.finishGame = function() {
    document.getElementById('result-overlay').classList.add('hidden');
    
    if (currentStage >= RELIC_DATA.length - 1) {
        showEnding();
    } else {
        loadStage(currentStage + 1);
    }
};

function showEnding() {
    // 1. 등급 산정
    const total = RELIC_DATA.length;
    let grade = "A";
    if (correctCount === total) grade = "SSS";
    else if (correctCount >= total - 1) grade = "SS";
    else if (correctCount >= total - 3) grade = "S";
    
    document.getElementById('cert-score').innerText = `${correctCount} / ${total}`;
    const gradeEl = document.getElementById('cert-grade');
    gradeEl.innerText = grade;
    if(grade === 'SSS') gradeEl.style.color = '#d32f2f'; 
    else if(grade === 'A') gradeEl.style.color = '#5d4037'; 

    document.getElementById('ending-overlay').classList.remove('hidden');
    SoundManager.playSFX('sfx_clear.mp3');
}

// 발굴 현장으로 이동 및 보상 지급
window.exitToMain = function() {
    localStorage.setItem('anyang_story_clear', 'true');
    
    let reward = 3000 + (correctCount * 200); 
    if (correctCount === RELIC_DATA.length) reward += 1000; 

    if (window.AHGold) {
        AHGold.add(reward);
    } else {
        let currentGold = parseInt(localStorage.getItem('anyang_gold') || "0");
        localStorage.setItem('anyang_gold', currentGold + reward);
    }

    alert(`[조사 완료] 연구비 ${reward}G가 지급되었습니다.`);
    location.href = '../index.html'; 
};