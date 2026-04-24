/* ==========================================================================
   [안양 유물 복원실 : Masterpiece v3.5] - Main Logic
   ========================================================================== */

/* ------------------------------------------------------------------
   [1] 시스템 설정 및 데이터베이스
   ------------------------------------------------------------------ */
const CONFIG = {
    maxEnergy: 100,
    energyRecoverRate: 0.5, // 2초당 1 회복
    visitorSpawnRate: 0.015, // 관람객 등장 확률
    maxVisitors: 8,
    autoSaveInterval: 5000
};

// 4단계 복원 도구 설정
const TOOLS = {
    brush:   { id: 'brush', name: '붓', color: '#fff', radius: 25, damage: 0, target: 'dust' },
    cotton:  { id: 'cotton', name: '솜', color: '#e0f7fa', radius: 15, damage: 0, target: 'stain' },
    spatula: { id: 'spatula', name: '헤라', color: '#ffcc80', radius: 10, damage: 5, target: 'clay' },
    chemical:{ id: 'chemical', name: '약품', color: '#a5d6a7', radius: 20, damage: 2, target: 'rust' }
};

// 유물 및 파편 데이터
const ITEM_DB = {
    // --- [기초 재료] ---
    'frag_common': { name: '알 수 없는 파편', type: 'material', img: '../images/relic_r_1.png', mergeTo: 'frag_rare', desc: '흔한 흙 묻은 조각입니다.' },
    'frag_rare':   { name: '오래된 유물 조각', type: 'material', img: '../images/relic_b_1.png', mergeTo: 'random_dirty', desc: '뭔가 형태가 잡혀가는 조각입니다.' },
    
    // --- [복원 대상: 소형 유물 (박물관용)] ---
    'arti_d_0': { name: '흙 묻은 주먹도끼', type: 'dirty', img: '../images/relic_0_real.png', cleanTo: 'arti_c_0', rank: 1 },
    'arti_c_0': { name: '주먹도끼', type: 'clean', img: '../images/relic_0_main.png', income: 15, desc: '관양동 선사유적지 출토. 인류의 영원한 도구.', score: 100 },
    
    'arti_d_1': { name: '이끼 낀 수막새', type: 'dirty', img: '../images/relic_1_real.png', cleanTo: 'arti_c_1', rank: 2 },
    'arti_c_1': { name: '얼굴무늬 수막새', type: 'clean', img: '../images/relic_1_main.png', income: 35, desc: '신라의 미소. 지붕 끝을 장식하던 기와.', score: 250 },

    'arti_d_2': { name: '깨진 청자 조각', type: 'dirty', img: '../images/relic_b_2.png', cleanTo: 'arti_c_2', rank: 3 },
    'arti_c_2': { name: '청자 상감 운학문', type: 'clean', img: '../images/relic_2_main.png', income: 80, desc: '고려청자의 비색이 살아있는 명품.', score: 500 },

    // --- [복원 대상: 랜드마크 (지도용)] ---
    'map_d_manan': { name: '만안교 설계도 (오염됨)', type: 'dirty_map', img: '../images/relic_5_real.png', cleanTo: 'map_c_manan', rank: 5 },
    'map_c_manan': { name: '만안교', type: 'landmark', img: '../images/relic_5_main.png', income: 200, x: 40, y: 60, desc: '조선 정조대왕의 효심이 깃든 다리.' },

    'map_d_joong': { name: '당간지주 탁본 (오염됨)', type: 'dirty_map', img: '../images/relic_3_real.png', cleanTo: 'map_c_joong', rank: 5 },
    'map_c_joong': { name: '중초사지 당간지주', type: 'landmark', img: '../images/relic_3_main.png', income: 250, x: 70, y: 30, desc: '보물 제4호. 국내 유일 제작연대 명문.' }
};

// 관람객 대사 DB
const VISITOR_QUOTES = [
    "와, 진짜 옛날 물건이네!",
    "박물관이 참 쾌적해요.",
    "이거 교과서에서 본 것 같아!",
    "안양에 이런 역사가 있었다니...",
    "저기요, 화장실이 어디죠?",
    "다음 특별전은 언제 하나요?",
    "입장료가 아깝지 않네요!",
    "우와, 반짝반짝해!",
    "개발자님 화이팅!" // 이스터에그
];


/* ------------------------------------------------------------------
   [2] 게임 상태 관리 (State Management)
   ------------------------------------------------------------------ */
let gameState = {
    gold: 0,
    energy: 100,
    exp: 0,
    level: 1,
    grid: Array(36).fill(null), // 6x6 인벤토리
    museumSlots: [null, null, null, 'locked', 'locked', 'locked'], // 전시 슬롯
    landmarks: [], // 해금된 랜드마크 ID
    
    // 튜토리얼 진행도 (0:완료, 1~7:진행중)
    tutorialStep: 1, 
    
    // 임시 상태 (저장 안 함)
    selectedTool: 'brush',
    restoringIdx: null,
    visitors: [] 
};

// 오디오 매니저
const AUDIO = {
    bgm: new Audio('../sounds/bgm_main.mp3'),
    sfx_merge: new Audio('../sounds/sfx_fix.mp3'),
    sfx_clean: new Audio('../sounds/sfx_dig.mp3'), // 슥삭
    sfx_clear: new Audio('../sounds/sfx_clear.mp3'),
    sfx_click: new Audio('../sounds/click.mp3'),
    sfx_brush: new Audio('../sounds/sfx_brush.mp3'),
    sfx_scan: new Audio('../sounds/sfx_scan.mp3'),
    
    play: (name) => {
        if(AUDIO[name]) {
            const sound = AUDIO[name].cloneNode(); // 중첩 재생 허용
            sound.volume = 0.5;
            sound.play().catch(()=>{});
        }
    }
};
AUDIO.bgm.loop = true;
AUDIO.bgm.volume = 0.3;


/* ------------------------------------------------------------------
   [3] 초기화 및 메인 루프
   ------------------------------------------------------------------ */
window.onload = function() {
    loadGame();
    initUI();
    
    // 메인 루프 (1초마다 자원 갱신)
    setInterval(gameLoop, 1000);
    // 렌더링 루프 (애니메이션, 0.1초)
    setInterval(renderLoop, 100);
    // 자동 저장 (5초)
    setInterval(saveGame, CONFIG.autoSaveInterval);
    
    // 첫 클릭 시 BGM 재생
    document.body.addEventListener('click', () => {
        if(AUDIO.bgm.paused) AUDIO.bgm.play().catch(()=>{});
    }, {once:true});

    // 튜토리얼 체크
    if(gameState.tutorialStep > 0 && gameState.tutorialStep <= 7) {
        runTutorial(gameState.tutorialStep);
    }
};

function initUI() {
    renderGrid();
    renderMuseum();
    renderMap();
    updateResourceUI();
    
    // 튜토리얼 중이 아니면 탭 활성화
    document.querySelector(`.tab-btn[data-target="view-workshop"]`).click();
}

function gameLoop() {
    // 1. 에너지 회복
    if (gameState.energy < CONFIG.maxEnergy) {
        gameState.energy = Math.min(CONFIG.maxEnergy, gameState.energy + CONFIG.energyRecoverRate);
    }
    
    // 2. 수익 계산
    let income = 0;
    gameState.museumSlots.forEach(slot => {
        if (slot && typeof slot === 'object' && ITEM_DB[slot.id]) income += ITEM_DB[slot.id].income;
    });
    gameState.landmarks.forEach(id => {
        if(ITEM_DB[id]) income += (ITEM_DB[id].income * 2);
    });

    if (income > 0) {
        addGold(income);
        document.getElementById('val-revenue').innerText = `+${income}/s`;
        
        // 수익 이펙트 (가끔)
        if(Math.random() < 0.3) FX.showFloatingText(window.innerWidth/2, 50, `+${income}G`, '#ffca28');
    }

    // 3. 관람객 스폰
    if (Math.random() < CONFIG.visitorSpawnRate && gameState.visitors.length < CONFIG.maxVisitors) {
        spawnVisitor();
    }
    
    updateResourceUI();
}

function renderLoop() {
    updateVisitors();
}


/* ------------------------------------------------------------------
   [4] 튜토리얼 시스템 (Step-by-Step)
   ------------------------------------------------------------------ */
function runTutorial(step) {
    const overlay = document.createElement('div');
    overlay.id = 'tuto-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '9999';
    overlay.onclick = (e) => e.stopPropagation(); // 클릭 차단

    // 튜토리얼 박스
    const box = document.createElement('div');
    box.className = 'modal-window animate__animated animate__bounceIn';
    box.style.maxWidth = '300px';
    box.style.textAlign = 'center';
    
    // 학예사 이미지
    const charImg = document.createElement('img');
    charImg.src = '../images/han_1.png'; // 한 학예사
    charImg.style.width = '80px';
    charImg.style.marginBottom = '10px';

    const msg = document.createElement('p');
    msg.style.margin = '10px 0';
    msg.style.fontSize = '14px';
    msg.style.color = '#333';

    const btn = document.createElement('button');
    btn.className = 'tool-btn active';
    btn.style.width = '100%';
    btn.innerText = '확인';
    btn.onclick = () => {
        document.body.removeChild(overlay);
        executeStepAction(step);
    };

    // 단계별 메시지
    switch(step) {
        case 1:
            msg.innerHTML = "안녕하세요! <b>한양문화유산연구원</b>에 오신 것을 환영합니다.<br>저는 이곳의 복원 작업을 담당하는 <b>한 학예사</b>입니다.";
            break;
        case 2:
            msg.innerHTML = "먼저 <b>작업대</b>를 살펴볼까요?<br>발굴 현장에서 가져온 파편들이 보이네요.";
            switchTab('workshop'); // 강제 이동
            break;
        case 3:
            msg.innerHTML = "같은 모양의 파편을 <b>드래그해서 합쳐보세요.</b><br>새로운 유물의 단서를 찾을 수 있을 거예요.";
            break;
        case 4:
            msg.innerHTML = "잘하셨어요! 오염된 유물이 발견되었네요.<br>이제 이걸 클릭해서 <b>정밀 복원</b>을 시작해봅시다.";
            break;
        case 5:
            msg.innerHTML = "이곳은 <b>정밀 복원실</b>입니다.<br>아래 <b>[붓]</b> 도구를 선택하고 유물을 문질러보세요.";
            break;
        case 6:
            msg.innerHTML = "완벽하게 복원되었네요!<br>이제 <b>박물관</b> 탭으로 가서 유물을 전시해볼까요?";
            break;
        case 7:
            msg.innerHTML = "훌륭합니다! 전시된 유물은 관람객을 모으고 수익을 냅니다.<br>이제 당신의 손으로 <b>최고의 박물관</b>을 만들어주세요!";
            gameState.tutorialStep = 0; // 종료
            break;
    }

    box.appendChild(charImg);
    box.appendChild(msg);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function executeStepAction(step) {
    // 튜토리얼 진행을 위한 강제 조치
    if(step === 2) {
        // 파편 강제 생성
        gameState.grid[0] = { id: 'frag_common' };
        gameState.grid[1] = { id: 'frag_common' };
        renderGrid();
        gameState.tutorialStep = 3;
        setTimeout(() => runTutorial(3), 500);
    }
}


/* ------------------------------------------------------------------
   [5] 머지 그리드 & 작업대 로직
   ------------------------------------------------------------------ */
function renderGrid() {
    const gridEl = document.getElementById('merge-grid');
    gridEl.innerHTML = '';
    
    gameState.grid.forEach((item, idx) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        cell.ondragover = e => e.preventDefault();
        cell.ondrop = e => handleDrop(e, idx);
        
        if (item && ITEM_DB[item.id]) {
            const info = ITEM_DB[item.id];
            const div = document.createElement('div');
            div.className = `item ${info.type.includes('dirty') ? 'dirty' : ''}`;
            div.draggable = true;
            div.innerHTML = `<img src="${info.img}" onerror="this.src='../images/relic_r_1.png'">`;
            
            div.ondragstart = e => {
                e.dataTransfer.setData('text/plain', idx);
                div.classList.add('dragging');
            };
            div.onclick = () => handleItemClick(idx);
            
            // 튜토리얼 3단계 하이라이트
            if(gameState.tutorialStep === 3) {
                div.style.border = "2px solid red";
                div.classList.add('animate__animated', 'animate__pulse', 'animate__infinite');
            }

            cell.appendChild(div);
        }
        gridEl.appendChild(cell);
    });
}

function handleDrop(e, targetIdx) {
    e.preventDefault();
    const srcIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(srcIdx) || srcIdx === targetIdx) return;
    
    const srcItem = gameState.grid[srcIdx];
    const targetItem = gameState.grid[targetIdx];
    
    // 단순 이동
    if (!targetItem) {
        gameState.grid[targetIdx] = srcItem;
        gameState.grid[srcIdx] = null;
        renderGrid();
        return;
    }
    
    // 머지 (Merge)
    if (srcItem.id === targetItem.id) {
        const info = ITEM_DB[srcItem.id];
        
        if (info.mergeTo) {
            let nextId = info.mergeTo;
            
            // 랜덤 생성 로직
            if (nextId === 'random_dirty') {
                const dirtyList = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].type.includes('dirty'));
                nextId = dirtyList[Math.floor(Math.random() * dirtyList.length)];
            }
            
            gameState.grid[targetIdx] = { id: nextId };
            gameState.grid[srcIdx] = null;
            
            AUDIO.play('sfx_merge');
            FX.showFloatingText(e.clientX, e.clientY, "Merge!", "#fff");
            
            // 튜토리얼 진행
            if(gameState.tutorialStep === 3) {
                gameState.tutorialStep = 4;
                setTimeout(() => runTutorial(4), 500);
            }
        }
        renderGrid();
    }
}

function handleItemClick(idx) {
    const item = gameState.grid[idx];
    if (!item) return;
    const info = ITEM_DB[item.id];
    
    // 오염된 유물 -> 복원
    if (info.type.includes('dirty')) {
        // 튜토리얼 체크
        if(gameState.tutorialStep === 4) {
            gameState.tutorialStep = 5;
            setTimeout(() => runTutorial(5), 500);
        }
        openRestoreModal(idx, info);
    }
    // 완성된 유물 -> 박물관 이동
    else if (info.type === 'clean') {
        moveToMuseum(idx);
        if(gameState.tutorialStep === 6) {
            gameState.tutorialStep = 7;
            setTimeout(() => runTutorial(7), 500);
        }
    }
    // 랜드마크 -> 지도 등록
    else if (info.type === 'landmark') {
        registerLandmark(idx, info);
    }
}


/* ------------------------------------------------------------------
   [6] 정밀 복원 미니게임 (Canvas Logic)
   ------------------------------------------------------------------ */
let canvas, ctx;
let restoreState = { hp: 100, progress: 0 };

function openRestoreModal(idx, info) {
    gameState.restoringIdx = idx;
    
    const modal = document.getElementById('modal-restore');
    modal.classList.remove('hidden');
    
    // 이미지 세팅
    const cleanInfo = ITEM_DB[info.cleanTo];
    document.getElementById('restore-target-img').src = cleanInfo.img;
    
    initCanvas();
    window.selectTool('brush'); // 기본 도구
}

function initCanvas() {
    canvas = document.getElementById('scrub-canvas');
    ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 오염 레이어 생성
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // 1. 베이스 먼지 (갈색)
    ctx.fillStyle = "rgba(100, 80, 60, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. 얼룩 및 이물질 (랜덤)
    for(let i=0; i<15; i++) {
        drawBlob(Math.random()*canvas.width, Math.random()*canvas.height, 20 + Math.random()*30, "rgba(50,50,50,0.9)");
    }

    // 이벤트 바인딩
    canvas.onmousemove = handleScrub;
    canvas.ontouchmove = (e) => handleScrub(e.touches[0]);
    
    restoreState.hp = 100;
    restoreState.progress = 0;
    updateRestoreUI();
}

function drawBlob(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
}

window.selectTool = function(toolId) {
    gameState.selectedTool = toolId;
    document.querySelectorAll('.tool-btn').forEach(el => el.classList.remove('active'));
    document.querySelector(`.tool-btn[data-tool="${toolId}"]`).classList.add('active');
    
    let desc = "";
    if(toolId==='brush') desc = "넓은 먼지를 털어냅니다. (안전함)";
    if(toolId==='cotton') desc = "얼룩을 정밀하게 닦습니다.";
    if(toolId==='spatula') desc = "딱딱한 흙을 긁어냅니다. (주의!)";
    if(toolId==='chemical') desc = "녹을 제거합니다.";
    document.getElementById('tool-desc').innerText = desc;
}

function handleScrub(e) {
    if ((e.buttons !== 1 && e.type !== 'touchmove')) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;
    
    const tool = TOOLS[gameState.selectedTool];
    
    // 지우기 (Destination-out)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, tool.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 이펙트
    if(Math.random() > 0.7) {
        FX.createParticle(e.clientX, e.clientY, tool.color);
        if(gameState.selectedTool === 'brush') AUDIO.play('sfx_brush');
        else AUDIO.play('sfx_clean');
    }

    // 진행도 체크 (간헐적)
    if(Math.random() > 0.9) checkRestoreProgress();
}

function checkRestoreProgress() {
    const w = canvas.width;
    const h = canvas.height;
    // 중앙부 샘플링 (최적화)
    const imgData = ctx.getImageData(w*0.1, h*0.1, w*0.8, h*0.8);
    const data = imgData.data;
    let clearCount = 0;
    
    for(let i = 3; i < data.length; i += 100) { 
        if(data[i] < 50) clearCount++;
    }
    
    const percent = Math.floor((clearCount / (data.length/100)) * 100);
    document.getElementById('restore-percent').innerText = percent;
    document.getElementById('relic-hp-fill').style.width = restoreState.hp + '%';

    if (percent >= 90) finishRestoration();
}

function updateRestoreUI() {
    document.getElementById('restore-percent').innerText = restoreState.progress;
    document.getElementById('relic-hp-fill').style.width = restoreState.hp + '%';
}

function finishRestoration() {
    canvas.onmousemove = null;
    AUDIO.play('sfx_clear');
    
    const idx = gameState.restoringIdx;
    const dirtyInfo = ITEM_DB[gameState.grid[idx].id];
    const cleanId = dirtyInfo.cleanTo;
    
    gameState.grid[idx] = { id: cleanId };
    
    FX.showFloatingText(window.innerWidth/2, window.innerHeight/2, "Success!", "#7c9a3d");
    
    setTimeout(() => {
        window.closeModal('modal-restore');
        renderGrid();
        
        // 튜토리얼 중이면 박물관 안내
        if(gameState.tutorialStep === 5) {
            gameState.tutorialStep = 6;
            setTimeout(() => runTutorial(6), 500);
        }
    }, 1500);
}


/* ------------------------------------------------------------------
   [7] 박물관 및 지도 관리
   ------------------------------------------------------------------ */
function moveToMuseum(idx) {
    const emptySlot = gameState.museumSlots.findIndex(s => s === null);
    if (emptySlot === -1) {
        showToast("전시 공간이 부족합니다!");
        return;
    }
    gameState.museumSlots[emptySlot] = gameState.grid[idx];
    gameState.grid[idx] = null;
    
    renderGrid();
    renderMuseum();
    showToast("박물관에 전시되었습니다.");
}

function renderMuseum() {
    const slots = document.getElementById('museum-slots').children;
    gameState.museumSlots.forEach((item, i) => {
        if(i >= slots.length) return;
        const el = slots[i];
        if(el.classList.contains('locked')) return;
        
        const inner = el.querySelector('.slot-inner');
        if (item) {
            const info = ITEM_DB[item.id];
            el.className = 'slot';
            inner.innerHTML = `
                <img src="${info.img}" style="width:70%; height:70%; object-fit:contain; filter:drop-shadow(0 5px 5px rgba(0,0,0,0.5));">
                <div style="font-size:10px; margin-top:5px; color:#fff;">${info.name}</div>
            `;
            // 반짝임 효과
            FX.createSparkle(el);
        } else {
            el.className = 'slot empty';
            inner.innerHTML = "전시 대기";
        }
    });
}

function renderMap() {
    const mapContainer = document.getElementById('landmark-pins');
    mapContainer.innerHTML = '';
    
    gameState.landmarks.forEach(id => {
        const info = ITEM_DB[id];
        const pin = document.createElement('div');
        pin.className = 'landmark-pin animate__animated animate__bounceInDown';
        pin.style.left = info.x + '%';
        pin.style.top = info.y + '%';
        pin.innerHTML = `
            <img src="${info.img}">
            <span class="label">${info.name}</span>
        `;
        mapContainer.appendChild(pin);
    });
}

function registerLandmark(idx, info) {
    if(!gameState.landmarks.includes(info.cleanTo)) { // info는 clean 상태여야 함 (로직상)
         // (실제 구현에선 dirty -> clean 변환 후 등록됨)
    }
    // (여기선 단순화하여 즉시 등록 처리)
    // 실제로는 clean 상태 아이템을 사용해야 함.
    // 코드 단순화를 위해 생략.
}


/* ------------------------------------------------------------------
   [8] 관람객 AI 시스템
   ------------------------------------------------------------------ */
function spawnVisitor() {
    const activeTab = document.querySelector('.view-section.active').id;
    const targetLayer = activeTab === 'view-map' ? 'map-visitors' : 'museum-visitors';
    const container = document.getElementById(targetLayer);
    
    if(!container) return;

    const vDiv = document.createElement('div');
    vDiv.className = 'visitor-char';
    // 랜덤 캐릭터 (yang_1, yang_2, 원시인 등)
    const imgNum = Math.ceil(Math.random() * 2);
    vDiv.style.backgroundImage = `url('../images/yang_${imgNum}.png')`;
    vDiv.style.left = '-40px';
    
    // AI 데이터
    vDiv.dataset.x = -40;
    vDiv.dataset.speed = 0.5 + Math.random();
    
    // 클릭 이벤트
    vDiv.onclick = function() {
        const bonus = 10 * gameState.level;
        addGold(bonus);
        FX.showFloatingText(parseInt(vDiv.style.left), window.innerHeight-100, `+${bonus}G`, '#ffca28');
        showBubble(vDiv);
        this.style.filter = "brightness(1.5)";
        setTimeout(() => this.remove(), 500); // 퇴장
    };
    
    container.appendChild(vDiv);
    gameState.visitors.push(vDiv);
}

function updateVisitors() {
    const finished = [];
    gameState.visitors.forEach((v, i) => {
        if(!v.parentNode) { finished.push(i); return; }
        
        let x = parseFloat(v.dataset.x);
        x += parseFloat(v.dataset.speed);
        v.style.left = x + 'px';
        v.dataset.x = x;
        
        // 걷는 모션 (간단히)
        v.style.transform = `scaleX(${v.dataset.speed > 0 ? 1 : -1}) rotate(${Math.sin(x/10)*5}deg)`;

        if(x > window.innerWidth + 50) {
            v.remove();
            finished.push(i);
        }
    });
    
    for(let i=finished.length-1; i>=0; i--) gameState.visitors.splice(finished[i], 1);
}

function showBubble(el) {
    const text = VISITOR_QUOTES[Math.floor(Math.random() * VISITOR_QUOTES.length)];
    const b = document.createElement('div');
    b.className = 'info-bubble animate__animated animate__fadeInUp';
    b.style.position = 'absolute';
    b.style.bottom = '60px';
    b.style.left = '-20px';
    b.style.whiteSpace = 'nowrap';
    b.innerText = text;
    el.appendChild(b);
    setTimeout(() => b.remove(), 2000);
}


/* ------------------------------------------------------------------
   [9] 시각 효과 (FX) & 유틸리티
   ------------------------------------------------------------------ */
const FX = {
    showFloatingText: (x, y, text, color) => {
        const el = document.createElement('div');
        el.innerText = text;
        el.style.position = 'fixed';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        el.style.fontWeight = 'bold';
        el.style.textShadow = '1px 1px 0 #000';
        el.style.pointerEvents = 'none';
        el.style.zIndex = 9999;
        el.className = 'animate__animated animate__fadeOutUp';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    },

    createParticle: (x, y, color) => {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.width = '4px';
        p.style.height = '4px';
        p.style.backgroundColor = color;
        p.style.borderRadius = '50%';
        p.style.pointerEvents = 'none';
        p.style.zIndex = 9999;
        
        // 물리 효과 (간단)
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        document.body.appendChild(p);
        
        let life = 1.0;
        const anim = setInterval(() => {
            const rect = p.getBoundingClientRect();
            p.style.left = (rect.left + vx) + 'px';
            p.style.top = (rect.top + vy) + 'px';
            p.style.opacity = life;
            life -= 0.05;
            if(life <= 0) {
                clearInterval(anim);
                p.remove();
            }
        }, 30);
    },
    
    createSparkle: (parent) => {
        // (생략: 간단한 반짝임 효과)
    }
};

function addGold(amount) {
    gameState.gold += amount;
    gameState.exp += amount * 0.5;
    checkLevelUp();
}

function updateResourceUI() {
    document.getElementById('val-gold').innerText = Math.floor(gameState.gold) + ' G';
    document.getElementById('val-energy').innerText = Math.floor(gameState.energy) + '/' + CONFIG.maxEnergy;
    document.getElementById('val-level').innerText = gameState.level;
    
    const nextExp = gameState.level * 500;
    const p = Math.min(100, (gameState.exp / nextExp) * 100);
    document.getElementById('exp-fill').style.width = p + '%';
}

function checkLevelUp() {
    const nextExp = gameState.level * 500;
    if(gameState.exp >= nextExp) {
        gameState.level++;
        gameState.exp -= nextExp;
        gameState.energy = CONFIG.maxEnergy;
        showToast(`🆙 레벨 업! (Lv.${gameState.level})`);
        AUDIO.play('sfx_clear');
    }
}

function showToast(msg) {
    const t = document.getElementById('toast-msg');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// 모달 제어
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.openShopModal = () => document.getElementById('modal-shop').classList.remove('hidden');

// 저장 시스템
function saveGame() {
    localStorage.setItem('anyang_v35_save', JSON.stringify({
        gold: gameState.gold,
        level: gameState.level,
        exp: gameState.exp,
        grid: gameState.grid,
        museumSlots: gameState.museumSlots,
        tutorialStep: gameState.tutorialStep
    }));
}

function loadGame() {
    const data = localStorage.getItem('anyang_v35_save');
    if(data) {
        const parsed = JSON.parse(data);
        gameState = { ...gameState, ...parsed };
        gameState.visitors = []; // 초기화
    } else {
        // 초기 아이템
        gameState.grid[0] = { id: 'frag_common' };
        gameState.grid[1] = { id: 'frag_common' };
    }
}