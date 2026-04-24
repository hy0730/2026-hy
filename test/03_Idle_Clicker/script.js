// ==========================================
// [1] 게임 데이터 & 설정
// ==========================================
let game = {
    money: 0,
    clickPower: 5,   // 클릭 당 감소량
    autoPower: 0,    // 초당 자동 감소량
    
    // 유물 상태 (0: 깨끗 ~ 100: 오염됨)
    status: {
        dirt: 20,   // 먼지
        water: 0,   // 습기
        crack: 0    // 균열
    },
    
    selectedTool: 'brush', // 현재 도구
    
    // 업그레이드 상태
    upgrades: {
        auto_clean: { cost: 1000, level: 0, name: "자동 관리봇" },
        better_tools: { cost: 500, level: 0, name: "고급 도구" }
    }
};

// ==========================================
// [2] 초기화 & 저장 시스템
// ==========================================
window.onload = function() {
    loadGame();
    selectTool('brush'); // 기본 도구 선택
    updateUI();
    updateShopUI();
    startGameLoop();
};

function saveGame() {
    localStorage.setItem('anyang_tycoon_v1', JSON.stringify(game));
}

function loadGame() {
    const save = localStorage.getItem('anyang_tycoon_v1');
    if (save) {
        try {
            const loaded = JSON.parse(save);
            // 기존 데이터에 덮어쓰기 (구조가 다를 경우 대비해 assign 사용)
            game = Object.assign(game, loaded);

            // [방어] 세이브 데이터 무결성 검사 (깨진 데이터면 초기화)
            const hasValidStatus = game.status && typeof game.status === 'object'
                && Number.isFinite(game.status.dirt)
                && Number.isFinite(game.status.water)
                && Number.isFinite(game.status.crack);
            const hasValidUpgrades = game.upgrades && typeof game.upgrades === 'object'
                && game.upgrades.auto_clean && game.upgrades.better_tools;
            const hasValidNumbers = Number.isFinite(game.money)
                && Number.isFinite(game.clickPower)
                && Number.isFinite(game.autoPower);

            if (!hasValidStatus || !hasValidUpgrades || !hasValidNumbers) {
                throw new Error('Invalid save data');
            }

            // 값 범위 보정
            game.money = Math.max(0, game.money);
            game.clickPower = Math.max(1, game.clickPower);
            game.autoPower = Math.max(0, game.autoPower);
            game.status.dirt = Math.min(100, Math.max(0, game.status.dirt));
            game.status.water = Math.min(100, Math.max(0, game.status.water));
            game.status.crack = Math.min(100, Math.max(0, game.status.crack));

            // 선택 도구 보정
            const validTools = ['brush', 'towel', 'hammer'];
            if (!validTools.includes(game.selectedTool)) game.selectedTool = 'brush';
        } catch (e) {
            console.error("세이브 파일 로드 실패", e);
            // 깨진 데이터는 과감히 무시하고 새 게임 상태로 복구
            game = {
                money: 0,
                clickPower: 5,
                autoPower: 0,
                status: { dirt: 20, water: 0, crack: 0 },
                selectedTool: 'brush',
                upgrades: {
                    auto_clean: { cost: 1000, level: 0, name: "자동 관리봇" },
                    better_tools: { cost: 500, level: 0, name: "고급 도구" }
                }
            };
        }
    }
}

// ==========================================
// [3] 게임 루프 (자연 풍화 & 자동 관리)
// ==========================================
function startGameLoop() {
    setInterval(() => {
        // 1. 자연 풍화 (상태 악화)
        // 시간이 지날수록 먼지가 조금씩 쌓임
        game.status.dirt = Math.min(100, game.status.dirt + 1.5);
        
        // 랜덤 이벤트: 습기나 균열 발생
        if(Math.random() < 0.1) game.status.water = Math.min(100, game.status.water + 3);
        if(Math.random() < 0.05) game.status.crack = Math.min(100, game.status.crack + 2);
        
        // 2. 자동 관리 (오토봇 효과)
        if(game.autoPower > 0) {
            // 오토봇은 먼지와 습기를 자동으로 관리해줌
            if(game.status.dirt > 0) game.status.dirt = Math.max(0, game.status.dirt - game.autoPower);
            if(game.status.water > 0) game.status.water = Math.max(0, game.status.water - game.autoPower);
        }

        updateUI();
        saveGame(); // 1초마다 자동 저장
    }, 1000);
}

// ==========================================
// [4] 플레이어 상호작용 (터치/클릭)
// ==========================================
function interactRelic() {
    let earned = 0;
    const s = game.status;
    const power = game.clickPower;
    let msg = "";
    let color = "#fff";

    // 도구별 로직
    if(game.selectedTool === 'brush') {
        if(s.dirt > 0) {
            s.dirt = Math.max(0, s.dirt - power);
            earned = 15;
            msg = "먼지 제거!";
            color = "#f1c40f"; // 노랑
        } else {
            msg = "깨끗함";
            color = "#95a5a6";
        }
    } 
    else if(game.selectedTool === 'towel') {
        if(s.water > 0) {
            s.water = Math.max(0, s.water - power);
            earned = 20;
            msg = "습기 건조!";
            color = "#3498db"; // 파랑
        } else {
            msg = "뽀송함";
            color = "#95a5a6";
        }
    }
    else if(game.selectedTool === 'hammer') {
        if(s.crack > 0) {
            s.crack = Math.max(0, s.crack - power);
            earned = 30;
            msg = "보수 완료!";
            color = "#e74c3c"; // 빨강
        } else {
            msg = "튼튼함";
            color = "#95a5a6";
        }
    }

    // 결과 처리
    if(earned > 0) {
        game.money += earned;
        showEffect(`+${earned}원`, "#2ecc71"); // 돈 오르는 이펙트
    } else {
        showEffect(msg, color); // 상태 메시지 이펙트
    }
    
    // 클릭 시 유물이 살짝 눌리는 애니메이션 효과 (CSS active 활용 외 추가)
    const relic = document.getElementById('main-relic');
    relic.style.transform = "scale(0.95)";
    setTimeout(() => relic.style.transform = "scale(1)", 50);

    updateUI();
}

// 도구 선택
function selectTool(toolName) {
    game.selectedTool = toolName;
    
    // 모든 버튼 초기화
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('is-primary'); // 활성 상태 제거
        btn.style.opacity = "0.5";
        btn.style.border = "none";
    });

    // 선택된 버튼 강조
    const btn = document.getElementById('btn-' + toolName);
    if(btn) {
        btn.classList.add('is-primary');
        btn.style.opacity = "1";
        btn.style.border = "2px solid #f1c40f";
    }
}

// 업그레이드 구매
function buyUpgrade(type) {
    const item = game.upgrades[type];
    
    if(game.money >= item.cost) {
        game.money -= item.cost;
        item.level++;
        item.cost = Math.floor(item.cost * 1.5); // 가격 1.5배 증가
        
        // 효과 적용
        if(type === 'better_tools') {
            game.clickPower += 5;
            alert(`[${item.name}] 업그레이드 완료! (클릭 효율 +5)`);
        } else if(type === 'auto_clean') {
            game.autoPower += 2;
            alert(`[${item.name}] 설치 완료! (초당 관리 +2)`);
        }
        
        updateUI();
        updateShopUI();
        saveGame();
    } else {
        alert("예산이 부족합니다!");
    }
}

// ==========================================
// [5] UI 업데이트 (화면 그리기)
// ==========================================
function updateUI() {
    // 1. 돈 표시
    const moneyEl = document.getElementById('money-display');
    if (moneyEl) moneyEl.innerText = (Number.isFinite(game.money) ? game.money : 0).toLocaleString();
    
    // 2. 게이지바 업데이트
    const dirtBar = document.getElementById('bar-dirt');
    const waterBar = document.getElementById('bar-water');
    const crackBar = document.getElementById('bar-crack');
    if (dirtBar) dirtBar.value = game.status?.dirt ?? 0;
    if (waterBar) waterBar.value = game.status?.water ?? 0;
    if (crackBar) crackBar.value = game.status?.crack ?? 0;
    
    // 3. 시각 효과 (오염 레이어 투명도)
    // 수치가 높을수록(100) 불투명해져서(0.8) 유물이 더러워 보임
    const layerDirt = document.getElementById('layer-dirt');
    const layerWater = document.getElementById('layer-water');
    const layerCrack = document.getElementById('layer-crack');
    if (layerDirt) layerDirt.style.opacity = ((game.status?.dirt ?? 0) / 100) * 0.9;
    if (layerWater) layerWater.style.opacity = ((game.status?.water ?? 0) / 100) * 0.7;
    if (layerCrack) layerCrack.style.opacity = ((game.status?.crack ?? 0) / 100) * 0.8;
    
    // 4. 등급 판정
    const totalBad = (game.status?.dirt ?? 0) + (game.status?.water ?? 0) + (game.status?.crack ?? 0);
    const gradeEl = document.getElementById('grade-display');
    if (!gradeEl) return;
    
    if(totalBad < 30) { 
        gradeEl.innerText = "최상 (S)"; 
        gradeEl.style.color = "#2ecc71"; // 초록
    } else if(totalBad < 100) { 
        gradeEl.innerText = "양호 (B)"; 
        gradeEl.style.color = "#f1c40f"; // 노랑
    } else { 
        gradeEl.innerText = "위험 (F)"; 
        gradeEl.style.color = "#e74c3c"; // 빨강
    }
}

function updateShopUI() {
    // 상점 버튼 내 가격 텍스트 갱신
    // HTML 구조: .shop-btn -> div.cost
    const costs = document.querySelectorAll('.shop-btn .cost');
    if(costs.length >= 2) {
        costs[0].innerText = game.upgrades.auto_clean.cost.toLocaleString() + "원";
        costs[1].innerText = game.upgrades.better_tools.cost.toLocaleString() + "원";
    }
}

// ==========================================
// [6] 이펙트 유틸 (플로팅 텍스트)
// ==========================================
function showEffect(text, color) {
    const stage = document.querySelector('.relic-stage');
    if (!stage) return;
    const el = document.createElement('div');
    el.className = 'float-text'; // style.css에 정의된 클래스
    el.innerText = text;
    el.style.color = color;
    
    // 유물 구역 내 랜덤 위치에 등장
    const x = 30 + Math.random() * 40; // 30% ~ 70% 사이
    const y = 30 + Math.random() * 40;
    
    el.style.left = x + '%';
    el.style.top = y + '%';
    
    stage.appendChild(el);
    
    // 애니메이션 후 삭제
    setTimeout(() => el.remove(), 800);
}