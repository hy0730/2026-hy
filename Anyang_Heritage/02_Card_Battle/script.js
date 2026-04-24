/* ==============================================================================
   [유물 발굴 작전 : 택티컬 (Tactical Excavation) - Ver 3.0 Final Integration]
   - 업데이트: 연구소 25종 확장, 덱 무한 순환, UI/UX 최종 보정
   ============================================================================== */

// =============================================================================
// [1] 데이터베이스 (DB)
// =============================================================================

// =============================================================================
// [Sound Safety] 사운드 로딩 실패가 게임 진행을 막지 않도록 보장
// =============================================================================
(function initSoundSafety() {
    const SOUND_BASE = '../sounds/';

    const normalizeSfxFile = (name) => {
        if (!name) return null;
        let s = String(name).trim();

        // 잘못된 상대경로(현재 폴더 sounds/) 입력을 ../sounds 기준으로 보정
        s = s.replace(/^\.\/sounds\//i, '');
        s = s.replace(/^sounds\//i, '');
        s = s.replace(/^\.\\sounds\\/i, '');
        s = s.replace(/^sounds\\/i, '');

        // 이미 ../sounds/를 포함한 완전 경로면 그대로 사용
        if (/^\.\.\/[sS]ounds\//.test(s) || /^\.\.\\[sS]ounds\\/.test(s)) return s;

        // 그 외 경로 입력은 그대로 두되(예: 다른 폴더 참조), 확장자만 보정
        const hasPath = s.includes('/') || s.includes('\\');
        if (hasPath) {
            if (!s.toLowerCase().endsWith('.mp3')) s = s + '.mp3';
            return s;
        }

        // 키만 들어온 경우(click 등): sfx_ 접두 + .mp3 보장
        if (!s.toLowerCase().endsWith('.mp3')) {
            s = `sfx_${s}.mp3`;
        }
        return s;
    };

    const buildCandidates = (file) => {
        if (!file) return [];
        if (file.includes('/') || file.includes('\\')) return [file];
        return [SOUND_BASE + file];
    };

    const makeSafeAudio = (candidates, volume = 0.5) => {
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = volume;

            let i = 0;
            const setSrc = () => {
                if (i >= candidates.length) {
                    audio.src = '';
                    return;
                }
                audio.src = candidates[i++];
            };

            audio.onerror = () => {
                setSrc();
            };

            setSrc();
            return audio;
        } catch (e) {
            return null;
        }
    };

    const cache = new Map();

    window.SoundManager = {
        playSFX: (nameOrFile) => {
            try {
                const file = normalizeSfxFile(nameOrFile);
                if (!file) return;

                let audio = cache.get(file);
                if (!audio) {
                    const candidates = buildCandidates(file);
                    audio = makeSafeAudio(candidates, 0.5);
                    cache.set(file, audio);
                }
                if (!audio || !audio.play) return;

                try {
                    audio.currentTime = 0;
                } catch (e) {}

                const p = audio.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (e) {
                return;
            }
        }
    };

    window.safePlaySFX = function(nameOrKey) {
        try {
            if (window.SoundManager && typeof window.SoundManager.playSFX === 'function') {
                window.SoundManager.playSFX(nameOrKey);
            }
        } catch (e) {
            return;
        }
    };
})();

// 카드 키워드 정의
const KEYWORDS = {
    analysis: { name: "분석", desc: "타일에 표식을 남깁니다. 다음 [타격] 피해가 2배가 됩니다." },
    crack: { name: "균열", desc: "암반(방어력)을 무시하고 피해를 줍니다." },
    overload: { name: "과부하", desc: "사용 시 다음 턴 행동력(AP)이 1 감소합니다." },
    flood: { name: "침수", desc: "제거하지 않으면 매 턴 주변 타일로 번집니다." }
};

function updateQuestBoard() {
    const el = document.getElementById('quest-board');
    if (!el) return;
    let inv = [];
    try {
        inv = JSON.parse(localStorage.getItem('anyang_inventory')) || [];
        if (!Array.isArray(inv)) inv = [];
    } catch (e) {
        inv = [];
    }
    const cnt = inv.length;
    el.innerHTML = `의뢰 현황판: 미복원 유물 <b>${cnt}</b>건`;
}

// 카드 목록
const CARD_DB = [
    // [도구]
    { id: 't01', type: 'tool', name: '정밀 붓', icon: '', cost: 1, power: 1, risk: 0, tags: [], img: '../images/tool_brush.png', target: 'sand', desc: '1칸을 안전하게 정밀 발굴합니다.' },
    { id: 't02', type: 'tool', name: '호미', icon: '', cost: 1, power: 2, risk: 5, tags: [], img: '../images/tool_hoe.png', target: 'soil', desc: '단단한 흙을 파냅니다.' },
    { id: 't03', type: 'tool', name: '음파 탐지기', icon: '', cost: 1, power: 0, risk: 0, tags: ['analysis'], img: '../images/tool_scanner.png', target: 'all', desc: '선택한 타일에 [분석] 표식을 남깁니다.' },
    { id: 't04', type: 'tool', name: '정밀 타격', icon: '', cost: 2, power: 3, risk: 0, tags: [], img: '../images/tool_pick.png', target: 'rock', desc: '[분석]된 타일에 사용 시 피해량 2배.' },
    { id: 't05', type: 'tool', name: '암석 드릴', icon: '', cost: 3, power: 5, risk: 10, tags: ['crack', 'overload'], img: '../images/tool_drill.png', target: 'rock', desc: '[균열] 바위를 관통합니다. (다음 턴 AP -1)' },
    { id: 't06', type: 'tool', name: '다이너마이트', icon: '', cost: 4, power: 10, risk: 40, tags: ['overload'], img: '../images/tool_dynamite.png', target: 'rock', desc: '강력한 폭발. 주변 타일에도 피해를 줍니다.' },
    { id: 't07', type: 'tool', name: '배수 펌프', icon: '', cost: 2, power: 99, risk: 0, tags: ['flood'], img: '../images/tool_pump.png', target: 'water', desc: '[침수] 상태인 타일의 물을 모두 퍼냅니다.' },
    { id: 't08', type: 'tool', name: '발굴 망치', icon: '', cost: 2, power: 2, risk: 30, tags: ['aoe'], img: '../images/tool_hammer.png', target: 'rock', desc: '3x3 범위를 타격합니다. (유물 손상 위험↑)' },
    
    // [스킬]
    { id: 's01', type: 'skill', name: '모닝 커피', icon: '', cost: 0, effect: 'ap', val: 2, tags: [], img: '../images/tool_coffee.png', desc: '행동력을 2 회복합니다.' },
    { id: 's02', type: 'skill', name: '지반 보강', icon: '', cost: 2, effect: 'heal_stab', val: 20, tags: [], img: '../images/tool_repair.png', desc: '안정도를 20% 회복합니다.' },
    { id: 's03', type: 'skill', name: '긴급 복원', icon: '', cost: 3, effect: 'heal_dmg', val: -15, tags: [], img: '../images/tool_bandage.png', desc: '유물 손상도를 15% 복구합니다.' },
    { id: 's04', type: 'skill', name: '현장 지휘', icon: '', cost: 1, effect: 'draw', val: 2, tags: [], img: '../images/tool_megaphone.png', desc: '카드 2장을 추가로 뽑습니다.' }
];

// [기술 트리 확장: 5 Tier x 5개 = 25개]
const TECH_TREE = [
    // --- Tier 1 (기초) ---
    { id: 't1_ap', tier: 1, name: '기초 체력', icon: '⚡', maxLv: 5, cost: [200, 400, 600, 800, 1000], desc: '최대 행동력(AP)이 레벨당 1 증가합니다.', req: null },
    { id: 't1_draw', tier: 1, name: '보급로 확보', icon: '📦', maxLv: 3, cost: [300, 600, 900], desc: '매 턴 시작 시 카드를 추가로 뽑습니다.', req: null },
    { id: 't1_gold', tier: 1, name: '예산 관리', icon: '💰', maxLv: 5, cost: [200, 400, 600, 800, 1000], desc: '탐사 종료 시 획득 골드가 증가합니다.', req: null },
    { id: 't1_hp', tier: 1, name: '안전 장비', icon: '⛑️', maxLv: 5, cost: [200, 400, 600, 800, 1000], desc: '최대 안정도가 증가합니다.', req: null },
    { id: 't1_hand', tier: 1, name: '주머니 확장', icon: '🎒', maxLv: 3, cost: [300, 600, 900], desc: '최대 핸드 매수가 증가합니다.', req: null },

    // --- Tier 2 (효율) ---
    { id: 't2_cost', tier: 2, name: '경량화', icon: '🪶', maxLv: 3, cost: [500, 1000, 1500], desc: '도구 카드 비용이 1 감소할 확률이 생깁니다.', req: ['t1_ap'] },
    { id: 't2_power', tier: 2, name: '강화 부품', icon: '🦾', maxLv: 3, cost: [500, 1000, 1500], desc: '도구 카드의 위력이 증가합니다.', req: ['t1_ap'] },
    { id: 't2_risk', tier: 2, name: '정밀 제어', icon: '🕹️', maxLv: 3, cost: [500, 1000, 1500], desc: '리스크(유물 손상 확률)가 감소합니다.', req: ['t1_hp'] },
    { id: 't2_analy', tier: 2, name: '데이터 분석', icon: '📊', maxLv: 1, cost: [1000], desc: '[분석]된 타일의 방어력을 무시합니다.', req: ['t1_draw'] },
    { id: 't2_shop', tier: 2, name: '단골 우대', icon: '🏷️', maxLv: 1, cost: [1000], desc: '상점 아이템 가격이 20% 할인됩니다.', req: ['t1_gold'] },

    // --- Tier 3 (전술) ---
    { id: 't3_skill', tier: 3, name: '전술 마스터', icon: '📜', maxLv: 3, cost: [800, 1600, 2400], desc: '스킬 카드의 효율이 증가합니다.', req: ['t2_cost'] },
    { id: 't3_recycle', tier: 3, name: '재활용', icon: '♻️', maxLv: 1, cost: [1500], desc: '카드를 버릴 때 일정 확률로 AP를 회복합니다.', req: ['t2_cost'] },
    { id: 't3_def', tier: 3, name: '구조 보강', icon: '🏗️', maxLv: 3, cost: [800, 1600, 2400], desc: '안정도 감소량이 대폭 줄어듭니다.', req: ['t2_risk'] },
    { id: 't3_start', tier: 3, name: '선발대', icon: '🚩', maxLv: 1, cost: [1500], desc: '첫 턴에 AP를 추가로 얻습니다.', req: ['t2_analy'] },
    { id: 't3_peek', tier: 3, name: '지층 투시', icon: '👁️', maxLv: 1, cost: [2000], desc: '타일 아래 숨겨진 지층을 미리 확인합니다.', req: ['t2_risk'] },

    // --- Tier 4 (환경) ---
    { id: 't4_rock', tier: 4, name: '암석 파쇄', icon: '🔨', maxLv: 1, cost: [3000], desc: '암석 타일에 대한 피해량이 증가합니다.', req: ['t3_skill'] },
    { id: 't4_water', tier: 4, name: '방수 처리', icon: '☔', maxLv: 1, cost: [3000], desc: '침수 피해를 입지 않습니다.', req: ['t3_def'] },
    { id: 't4_trap', tier: 4, name: '함정 감지', icon: '📡', maxLv: 1, cost: [3000], desc: '함정 타일을 미리 표시합니다.', req: ['t3_peek'] },
    { id: 't4_gas', tier: 4, name: '환기 시스템', icon: '🌀', maxLv: 1, cost: [3000], desc: '가스(AP감소) 함정을 무효화합니다.', req: ['t3_def'] },
    { id: 't4_auto', tier: 4, name: '자동화 드론', icon: '🛸', maxLv: 1, cost: [4000], desc: '매 턴 HP가 1인 타일 하나를 자동으로 제거합니다.', req: ['t3_start'] },

    // --- Tier 5 (궁극) ---
    { id: 't5_ult_ap', tier: 5, name: '무한 동력', icon: '⚛️', maxLv: 1, cost: [10000], desc: '모든 카드의 비용이 1 감소합니다.', req: ['t4_rock'] },
    { id: 't5_ult_hp', tier: 5, name: '유물 보호막', icon: '🛡️', maxLv: 1, cost: [10000], desc: '유물이 손상될 때 1번 막아줍니다.', req: ['t4_trap'] },
    { id: 't5_ult_gold', tier: 5, name: '전설의 도굴꾼', icon: '👑', maxLv: 1, cost: [10000], desc: '모든 보상이 3배가 됩니다.', req: ['t4_auto'] },
    { id: 't5_ult_kill', tier: 5, name: '궤도 폭격', icon: '🛰️', maxLv: 1, cost: [15000], desc: '5턴마다 모든 타일에 피해를 줍니다.', req: ['t4_auto'] },
    { id: 't5_ult_time', tier: 5, name: '시간 역행', icon: '⏳', maxLv: 1, cost: [20000], desc: '턴 제한이 사라집니다.', req: ['t4_gas'] }
];

const STAGE_CONFIG = [
    { id: 0, name: "탐색 구역 A (Easy)", size: 3, turn: 20, img_main: "../images/relic_1_main.png", img_real: "../images/relic_1_real.png", reward: 100, rarity: 'common', tile_ratio: { sand: 80, soil: 20, stone: 0 }, desc: "모래 속에 파묻힌 당간지주입니다." },
    { id: 1, name: "탐색 구역 B (Normal)", size: 4, turn: 25, img_main: "../images/relic_2_main.png", img_real: "../images/relic_2_real.png", reward: 250, rarity: 'rare', tile_ratio: { sand: 40, soil: 40, stone: 20 }, desc: "암벽에 새겨진 마애종입니다." },
    { id: 2, name: "탐색 구역 C (Hard)", size: 5, turn: 30, img_main: "../images/relic_3_main.png", img_real: "../images/relic_3_real.png", reward: 500, rarity: 'epic', tile_ratio: { sand: 20, soil: 30, stone: 50 }, desc: "하천 바닥의 만안교입니다." }
];

// 튜토리얼 전용 스테이지 설정
const TUTORIAL_STAGE_CONFIG = {
    id: -1,
    name: "훈련 구역 (Tutorial)",
    size: 3,
    turn: 99,
    img_main: "../images/relic_1_main.png",
    img_real: "../images/relic_1_real.png",
    reward: 0,
    tile_ratio: { sand: 50, soil: 50, stone: 0 },
    desc: "기본 장비 사용법을 익히는 훈련 구역입니다."
};

// 튜토리얼 전용 덱 (음파 탐지기와 정밀 타격 포함)
const TUTORIAL_DECK = ['t03', 't04', 't03', 't04', 't01', 't01'];

const TUTORIAL_SCRIPTS = [
    { text: "이곳은 발굴 현장입니다.", action: "next" },
    { text: "모래 타일을 확인하세요.", action: "highlight_sand" },
    { text: "손패에서 <b>[정밀 붓]</b> 카드를 선택���세요.\n모래에는 붓이 효과적입니다!", action: "wait_select_brush" },
    { text: "하이라이트된 모래 타일에 붓을 사용하세요.", action: "wait_use_brush" },
    { text: "팁) 잘못된 상성을 사용하면 피해가 <b>반감</b>됩니다.\n튜토리얼을 종료합니다.", action: "end" }
];

const SFX = {
    play: (name) => {
        if (typeof window.safePlaySFX === 'function') {
            window.safePlaySFX(name);
        }
    }
};

// =============================================================================
// [2] 전역 상태
// =============================================================================
let user = {
    gold: 500,
    clearedStage: -1,
    deck: ['t01','t01','t01','t03','t04','t02','s01','s01'], 
    tech: {},
    tutorialDone: false // 튜토리얼 완료 플래그
};

let gameState = {
    level: 0,
    turn: 0,
    energy: 0, maxEnergy: 5,
    stability: 100, relicDamage: 0,
    durability: 100,
    gridData: [],
    hand: [], drawPile: [], discardPile: [],
    shopItems: [], 
    selectedCardIdx: -1,
    pendingAction: null,
    isTutorial: false, tutoStep: -1,
    clearedCount: 0, maxTiles: 0,
    nextTurnDebuff: 0,
    isPlayerTurn: true
};

let isProcessing = false;

function bindHandDelegation() {
    const area = document.getElementById('hand-area');
    if (!area) return;
    if (area.dataset.boundHandClick) return;

    area.addEventListener('click', (e) => {
        const cardEl = e && e.target && e.target.closest ? e.target.closest('.card') : null;
        if (!cardEl || !area.contains(cardEl)) return;
        e.stopPropagation();
        e.preventDefault();

        const idx = parseInt(cardEl.dataset.index || '-1', 10);
        if (!Number.isFinite(idx) || idx < 0) return;
        handleHandClick(idx);
    });

    area.dataset.boundHandClick = '1';
}

function endTutorialFlow() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.pointerEvents = 'none';
    }
    gameState.isTutorial = false;
    gameState.tutoStep = -1;
    user.tutorialDone = true;
    saveUserData();
}

let selectedTechId = null;

// =============================================================================
// [3] 초기화 및 로비
// =============================================================================
window.addEventListener('load', () => {
    if (window.AHGold && AHGold.ensureBadge) AHGold.ensureBadge();
    updateSharedGold();
    loadUserData();
    refreshShopList();
    initLobby();
    createMenuModal();
    
    // [수정] 카드 상세 모달을 body로 이동하여 stacking context 문제 해결
    const cardModal = document.getElementById('universal-card-modal');
    if (cardModal && cardModal.parentElement !== document.body) {
        document.body.appendChild(cardModal);
    }
});

function getRestorationGold() {
    try {
        const saved = localStorage.getItem('anyang_restoration_v2');
        if (!saved) return 0;
        const parsed = JSON.parse(saved);
        const n = parseInt(parsed?.gold, 10);
        return isNaN(n) ? 0 : Math.max(0, n);
    } catch (e) {
        return 0;
    }
}

function setRestorationGold(amount) {
    const n = Math.max(0, parseInt(amount, 10) || 0);
    try {
        localStorage.setItem('anyang_restoration_v2', JSON.stringify({ gold: n }));
    } catch (e) {}
}

function updateSharedGold() {
    if (!window.AHGold) return;
    const g1 = AHGold.get();
    const g2 = getRestorationGold();
    const g = Math.max(g1, g2);
    if (g !== g1) AHGold.set(g);
    if (g !== g2) setRestorationGold(g);
}

window.addEventListener('storage', (e) => {
    if (e && (e.key === 'anyang_restoration_v2' || e.key === 'anyang_gold')) {
        if (e.key === 'anyang_restoration_v2' && window.AHGold) {
            const g2 = getRestorationGold();
            const g1 = AHGold.get();
            if (g2 !== g1) AHGold.set(g2);
        }
        if (e.key === 'anyang_gold') {
            setRestorationGold(window.AHGold ? AHGold.get() : getRestorationGold());
        }
        initLobby();
    }
});

window.addEventListener('ahgoldchange', () => {
    setRestorationGold(window.AHGold ? AHGold.get() : getRestorationGold());
    initLobby();
});

function loadUserData() {
    // [Fix: 초기화 연동] 메인 데이터가 삭제(초기화)되었으면 카드배틀 데이터도 날림
    if (!localStorage.getItem("anyang_heritage_user")) {
        localStorage.removeItem("anyang_excavation_user");
    }

    try {
        const saved = localStorage.getItem("anyang_excavation_user");
        if (saved) {
            const parsed = JSON.parse(saved);
            user = { ...user, ...parsed };
            if (!user.tech || Array.isArray(user.tech)) user.tech = {}; 
            if (user.tutorialDone === undefined) user.tutorialDone = false; // 기본값 설정
        }
    } catch(e) { console.log("New User"); }
}

function saveUserData() {
    localStorage.setItem("anyang_excavation_user", JSON.stringify(user));
    initLobby();
}

function resetGameData() {
    user = {
        gold: 500,
        clearedStage: -1,
        deck: ['t01','t01','t01','t03','t04','t02','s01','s01'], 
        tech: {},
        tutorialDone: false
    };
    selectedTechId = null;
    gameState.maxEnergy = 5;
    gameState.energy = 0;
    saveUserData();
    if (document.getElementById('tech-tree')) renderTechTree();
    showToast('게임 데이터가 초기화되었습니다.');
}

function initLobby() {
    const goldEl = document.getElementById('lobby-gold');
    if (goldEl) goldEl.innerText = (window.AHGold ? AHGold.get() : user.gold);

    updateQuestBoard();

    if (user.clearedStage >= 0) unlockStage('stage-normal');
    if (user.clearedStage >= 1) unlockStage('stage-hard');
}

function unlockStage(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('locked');
        const lock = el.querySelector('.lock-screen');
        if(lock) lock.style.display = 'none';
        el.style.pointerEvents = 'auto';
    }
}

function refreshShopList() {
    gameState.shopItems = [];
    const pool = [...CARD_DB];
    shuffle(pool);
    
    for(let i=0; i<5; i++) {
        if(i < pool.length) {
            const basePrice = getBasePrice(pool[i].id);
            const variation = (Math.random() * 0.2) + 0.9; 
            gameState.shopItems.push({ 
                ...pool[i], 
                price: Math.floor(basePrice * variation) 
            });
        }
    }
}

function getBasePrice(id) {
    if(id.startsWith('t')) return 200 + (parseInt(id.substr(1)) * 50);
    return 300;
}

// =============================================================================
// [4] 게임 시작
// =============================================================================
window.startGame = function(mode) {
    let level = 0;
    if (mode === 'easy') level = 0;
    else if (mode === 'normal') level = 1;
    else if (mode === 'hard') level = 2;

    if (level > 0 && user.clearedStage < level - 1) {
        alert("이전 난이도를 먼저 클리어하십시오.");
        return;
    }

    SFX.play('click');
    gameState.level = level;
    // 튜토리얼 조건: 명시적 튜토리얼 모드면 강제 적용
    gameState.isTutorial = (mode === 'tutorial' || (level === 0 && !user.tutorialDone));
    if (mode === 'tutorial') {
        user.tutorialDone = false;
        gameState.isTutorial = true;
    }
    
    document.getElementById('view-lobby').style.display = 'none';
    document.getElementById('view-game').style.display = 'flex';
    document.getElementById('view-intro').style.display = 'none';

    // [연구 효과] 기초 체력 (AP)
    const bonusAp = (user.tech['t1_ap'] || 0); 
    gameState.maxEnergy = 5 + bonusAp;
    gameState.nextTurnDebuff = 0;

    setTimeout(() => setupStage(level), 100);
    if (window.AHGold && AHGold.ensureBadge) AHGold.ensureBadge();
};

function setupStage(level) {
    // 튜토리얼 모드일 때는 튜토리얼 전용 설정 사용
    const config = gameState.isTutorial ? TUTORIAL_STAGE_CONFIG : STAGE_CONFIG[level];
    
    gameState.turn = config.turn;
    gameState.clearedCount = 0;
    gameState.relicDamage = 0;
    gameState.durability = 100;
    gameState.stability = 100; 
    
    // [연구 효과] 안전 장비 (최대 안정도 증가) - 튜토리얼에서는 적용 안 함
    if(!gameState.isTutorial && user.tech['t1_hp']) gameState.stability += (user.tech['t1_hp'] * 10);

    gameState.maxTiles = config.size * config.size;
    gameState.selectedCardIdx = -1;
    gameState.gridData = [];
    gameState.energy = gameState.maxEnergy;
    
    updateHUD();
    document.getElementById('ingame-stage-name').innerText = config.name;
    showToast(gameState.isTutorial ? "훈련 구역 진입!" : "작전 구역 진입!");

    createGrid(config);
    buildDeck();
    gameState.isPlayerTurn = true;
    bindHandDelegation();
    startTurn(); 

    // 튜토리얼 시작 (DOM이 준비된 후)
    if (gameState.isTutorial) {
        setTimeout(() => {
            startTutorialFlow();
        }, 300);
    }
}

function createGrid(config) {
    const board = document.getElementById('grid-board');
    board.className = 'grid-board';
    board.classList.add(`size-${config.size}`);
    board.innerHTML = '';
    board.style.backgroundImage = `url('${config.img_main}')`;

    for(let i=0; i<gameState.maxTiles; i++) {
        let layer = [];
        let r = Math.random() * 100;
        
        if (gameState.isTutorial) {
            layer = ['sand'];
        } else {
            if (r < config.tile_ratio.sand) layer = ['sand'];
            else if (r < config.tile_ratio.sand + config.tile_ratio.soil) layer = ['soil', 'stone']; 
            else layer = ['stone'];
        }

        let type = layer[0];
        let hp = getTileHp(type);
        
        gameState.gridData.push({ 
            id: i, type: type, hp: hp, maxHp: hp, 
            status: [], layers: layer.slice(1), cleared: false 
        });

        const tile = document.createElement('div');
        tile.className = `tile ${type}`;
        tile.dataset.id = i;
        
        // [NEW] 타일 타입에 따른 배경 이미지 적용
        const tileImageMap = {
            'sand': '../images/tile_sand.png',
            'soil': '../images/tile_soil.png', 
            'stone': '../images/tile_stone.png',
            'water': '../images/tile_water.png'
        };
        if (tileImageMap[type]) {
            setTileBackgroundImage(tile, tileImageMap[type]);
        }

        tile.onclick = (e) => handleTileClick(i, e);
        
        tile.innerHTML = `
            <div class="tile-status-icons"></div> 
            <div class="tile-hp-text">${hp}/${hp}</div>
            <div class="tile-hp-bar"><div class="tile-hp-fill" style="width:100%"></div></div>
        `;
        board.appendChild(tile);
    }
}

function getTileHp(type) {
    if(type==='sand') return 1;
    if(type==='soil') return 3;
    if(type==='stone') return 5;
    if(type==='water') return 2;
    return 1;
}

function getTileIcon(type) {
    if(type==='soil') return '🌿';
    if(type==='stone') return '🪨';
    if(type==='water') return '💧';
    return '';
}

// [유틸] 지형 정규화 및 라벨
const normalizeTerrain = (t) => (t === 'stone' ? 'rock' : t);
const TERRAIN_LABEL = { sand: '모래', soil: '흙', rock: '바위', water: '물', plant: '수풀', all: '전체' };

function applyDurabilityLoss(loss) {
    const n = Math.max(0, parseInt(loss, 10) || 0);
    if (n <= 0) return;
    gameState.durability = Math.max(0, gameState.durability - n);
    showFeedback(null, `훼손 -${n}%`, 'dmg');
}

function safeLoadImage(src, onOk, onFail) {
    try {
        const img = new Image();
        img.onload = () => { try { onOk && onOk(); } catch (e) {} };
        img.onerror = () => { try { onFail && onFail(); } catch (e) {} };
        img.src = src;
        return img;
    } catch (e) {
        try { onFail && onFail(); } catch (e2) {}
        return null;
    }
}

function setTileBackgroundImage(tileEl, src) {
    if (!tileEl) return;
    if (!src) {
        tileEl.style.backgroundImage = '';
        return;
    }
    safeLoadImage(src,
        () => { tileEl.style.backgroundImage = `url('${src}')`; },
        () => {
            tileEl.style.backgroundImage = '';
            tileEl.style.backgroundColor = '';
        }
    );
}

function getAoETiles(centerIdx, radius = 1) {
    const config = gameState.isTutorial ? TUTORIAL_STAGE_CONFIG : STAGE_CONFIG[gameState.level];
    const size = config.size;
    const r0 = Math.floor(centerIdx / size);
    const c0 = centerIdx % size;
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            const rr = r0 + dr;
            const cc = c0 + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            out.push(rr * size + cc);
        }
    }
    return out;
}

// =============================================================================
// [5] 덱 & 턴 (덱 순환 로직 개선)
// =============================================================================
function buildDeck() {
    // 튜토리얼 모드일 때는 튜토리얼 전용 덱 사용
    const deckToUse = gameState.isTutorial ? TUTORIAL_DECK : user.deck;
    gameState.drawPile = [...deckToUse];
    shuffle(gameState.drawPile);
    gameState.discardPile = [];
    gameState.hand = [];
}

function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }

function startTurn() {
    gameState.isPlayerTurn = true;
    gameState.energy = gameState.maxEnergy - gameState.nextTurnDebuff;
    if(gameState.nextTurnDebuff > 0) {
        showFeedback(null, "과부하: AP 감소", "dmg");
        gameState.nextTurnDebuff = 0;
    }
    
    while(gameState.hand.length > 0) gameState.discardPile.push(gameState.hand.pop().id);
    
    playShuffleAnimation();

    setTimeout(() => {
        // [연구 효과] 보급로 확보 (추가 드로우) - 튜토리얼에서는 적용 안 함
        const bonusDraw = gameState.isTutorial ? 0 : (user.tech['t1_draw'] || 0);
        drawCards(5 + bonusDraw);
        
        // 튜토리얼 모드일 때 손패에 음파 탐지기가 없으면 추가
        if (gameState.isTutorial && gameState.tutoStep < 2) {
            const hasT03 = gameState.hand.some(card => card.id === 't03');
            if (!hasT03) {
                // 음파 탐지기를 덱에서 찾아서 손패로 이동
                const t03Index = gameState.drawPile.findIndex(id => id === 't03');
                if (t03Index !== -1) {
                    gameState.drawPile.splice(t03Index, 1);
                    const t03Card = CARD_DB.find(c => c.id === 't03');
                    if (t03Card) {
                        gameState.hand.push({ ...t03Card, idx: gameState.hand.length });
                    }
                } else {
                    // 덱에 없으면 버린 카드에서 찾기
                    const discardIndex = gameState.discardPile.findIndex(id => id === 't03');
                    if (discardIndex !== -1) {
                        gameState.discardPile.splice(discardIndex, 1);
                        const t03Card = CARD_DB.find(c => c.id === 't03');
                        if (t03Card) {
                            gameState.hand.push({ ...t03Card, idx: gameState.hand.length });
                        }
                    }
                }
            }
        }
        
        spreadFlood();
        updateHUD();
        renderHand();
        gameState.isPlayerTurn = true;
        showToast(`턴 시작!`);
    }, 800);
}

function spreadFlood() {
    // 침수 확산 로직 (Phase 3)
}

// [Fix: Hand Draw] 덱 고갈 시 버린 카드 셔플 로직 강화
function drawCards(n) {
    for(let i=0; i<n; i++) {
        if(gameState.drawPile.length === 0) {
            if(gameState.discardPile.length === 0) break; // 뽑을 카드가 아예 없음
            
            // 버린 카드를 덱으로 다시 섞어 넣음
            gameState.drawPile = [...gameState.discardPile];
            gameState.discardPile = [];
            shuffle(gameState.drawPile);
            showToast("🔁 덱 재충전!");
        }
        
        const cardId = gameState.drawPile.pop();
        // ID로 카드 정보 조회하여 핸드에 추가
        const cardData = CARD_DB.find(c => c.id === cardId);
        if(cardData) {
            gameState.hand.push({ ...cardData }); // 객체 복사해서 넣음 (안전)
        }
    }
    renderHand(); // 드로우 후 반드시 렌더링
}

function playShuffleAnimation() {
    const overlay = document.getElementById('shuffle-overlay');
    if(!overlay) return;
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; }, 1200);
}

function ensureUIInteractive() {
    const uni = document.getElementById('universal-card-modal');
    if (uni) {
        const visible = uni.style.display && uni.style.display !== 'none';
        uni.style.pointerEvents = visible ? 'auto' : 'none';
    }
    const menu = document.getElementById('menu-modal-wrapper');
    if (menu) {
        const visible = menu.style.display && menu.style.display !== 'none';
        menu.style.pointerEvents = visible ? 'auto' : 'none';
    }
}

// =============================================================================
// [6] 카드 액션 & 전투 시스템
// =============================================================================
function openUniversalModal(mode, data) {
    const modal = document.getElementById('universal-card-modal');
    const btn = document.getElementById('btn-modal-action');
    if (!modal || !btn) return;
    
    // [수정] 모달을 body로 이동하여 stacking context 문제 해결
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const iconEl = document.getElementById('u-card-icon');
    const nameEl = document.getElementById('u-card-name');
    const descEl = document.getElementById('u-card-desc');
    const costEl = document.getElementById('u-card-cost');
    const powerEl = document.getElementById('u-card-power');
    const riskEl = document.getElementById('u-card-risk');

    // 필수 DOM이 누락된 경우 (템플릿 변경/로드 타이밍 문제)에는 크래시 대신 조용히 중단
    if (!nameEl || !descEl || !costEl || !powerEl || !riskEl) return;

    if (iconEl) iconEl.innerText = '';
    nameEl.innerText = data.name;
    descEl.innerText = data.desc;
    costEl.innerText = data.cost;
    powerEl.innerText = data.power || '-';
    riskEl.innerText = data.risk || '0';

    const tagsContainer = document.getElementById('u-card-tags');
    const descBox = document.getElementById('u-keyword-desc-box');
    if (tagsContainer) tagsContainer.innerHTML = '';
    if (descBox) {
        descBox.innerHTML = '';
        descBox.style.display = 'none';
    }

    if (data.tags && data.tags.length > 0 && tagsContainer && descBox) {
        data.tags.forEach(tagKey => {
            const kw = KEYWORDS[tagKey];
            if(kw) {
                tagsContainer.innerHTML += `<span class="tag ${tagKey}">${kw.name}</span>`;
                descBox.style.display = 'block';
                descBox.innerHTML += `<div><b>[${kw.name}]</b>: ${kw.desc}</div>`;
            }
        });
    }

    gameState.pendingAction = { mode: mode, data: data };
    
    if (mode === 'hand') {
        btn.innerText = "사용하기";
        btn.onclick = () => confirmHandUse(data.idx);
    } else if (mode === 'shop') {
        // [연구 효과] 단골 우대 (할인)
        let price = data.price;
        if (user.tech['t2_shop']) price = Math.floor(price * 0.8);
        
        btn.innerText = `구매하기 (${price} G)`;
        btn.onclick = () => confirmShopBuy(data.id, price);
    } else {
        btn.innerText = "확인";
        btn.onclick = closeUniversalModal;
    }

    const previewEl = document.querySelector('.card-preview.large');
    if (previewEl) {
        previewEl.innerHTML = `<img class="card-img large-preview" src="${data.img||''}" alt="${data.name}" onerror="this.remove()">`;
    }
    modal.style.display = 'flex';
    modal.style.pointerEvents = 'auto';
    ensureUIInteractive();
}

function closeUniversalModal() {
    const modal = document.getElementById('universal-card-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.pointerEvents = 'none';
    }
    gameState.pendingAction = null;
    ensureUIInteractive();
}

function handleHandClick(idx) {
    if (!gameState.hand[idx]) return;
    if (gameState.isPlayerTurn === false) return;
    if (isProcessing) return;
    isProcessing = true;
    try {
        SFX.play('click');
        if (!gameState.isTutorial && gameState.tutoStep >= 0) {
            gameState.tutoStep = -1;
        }

        // [튜토리얼] 브러시 선택 유도 (Step 2)
        if (gameState.isTutorial && gameState.tutoStep === 2) {
            if (gameState.hand[idx].id !== 't01') {
                showToast('정밀 붓 카드를 선택하세요.');
                return; // 잘못된 카드 선택 막기
            }
            nextTutorialStep(); // 올바른 카드 선택 시 다음 단계로
        }
        const card = gameState.hand[idx];
        openUniversalModal('hand', { ...card, idx: idx });
    } catch (err) {
        console.error('handleHandClick error:', err);
    } finally {
        isProcessing = false;
    }
}

function confirmHandUse(idx) {
    SFX.play('click');
    closeUniversalModal();

    // [튜토리얼] 카드 장착 후 모래 사용 단계로 진��
    if (gameState.isTutorial && gameState.tutoStep === 2) nextTutorialStep();

    const card = gameState.hand[idx];
    if (card.type === 'skill') {
        useSkill(idx);
    } else {
        gameState.selectedCardIdx = idx;
        renderHand();
        showToast(`${card.name} 장착됨! 타일을 선택하세요.`);
    }
    ensureUIInteractive();
}

function handleTileClick(tileIdx, ev) {
    if (isProcessing) return;
    isProcessing = true;
    try {
        const tileData = gameState.gridData[tileIdx];
        if(!tileData || tileData.cleared) return;

        // 튜토리얼 진행 규칙: 정해진 단계 외엔 조작 불가
        if (gameState.isTutorial) {
            // 3단계에서만 모래 타일 클릭 허용
            if (gameState.tutoStep < 3) return;
            if (gameState.tutoStep === 3) {
                // 붓 장착 + 모래 타일 조건 확인
                const tutoCard = gameState.hand[gameState.selectedCardIdx];
                const isBrushTuto = tutoCard && tutoCard.id === 't01';
                if (!isBrushTuto || tileData.type !== 'sand') {
                    showToast('모래 타일에 붓을 사용하세요.');
                    return;
                }
            }
        }
        
        if(gameState.selectedCardIdx === -1) {
            showToast("카드를 먼저 선택(장착)하십시오.");
            return;
        }

        const card = gameState.hand[gameState.selectedCardIdx];
        const isBrush = card && card.id === 't01';
        const isHammer = card && card.id === 't08';

        // [지형 상성] ��드 타겟과 타일 타입 비교
        if (card.type === 'tool') {
            const target = card.target || null; // 'sand' | 'soil' | 'rock' | 'water' | 'plant' | 'all'
            if (target && target !== 'all') {
                const tileKind = normalizeTerrain(tileData.type);
                if (target === 'plant') {
                    // 보드에는 plant 타입이 없으므로 패널티 없음
                } else if (tileKind !== target) {
                    showFeedback(tileIdx, 'Bad...', 'dmg');
                    card.__mismatch = true; // 이후 피해 반감 적용
                    applyDurabilityLoss(isHammer ? 15 : (isBrush ? 10 : 5));
                    if (gameState.isTutorial && gameState.tutoStep === 3) {
                        nextTutorialStep(); // 오사용 팁 단계로 이동
                    }
                } else {
                    showFeedback(tileIdx, 'Effect!', 'crit');
                    if (gameState.isTutorial && gameState.tutoStep === 3) {
                        showToast('효과적(Effective)!');
                        nextTutorialStep();
                    }
                }
            }
        }

        // [연구 효과] 경량화 (비용 감소)
        let cost = card.cost;
        const costLv = user.tech['t2_cost'] || user.tech['t2_eng'] || 0;
        if (card.type === 'tool' && costLv > 0 && Math.random() < (costLv * 0.1)) {
            cost = Math.max(0, cost - 1);
            showFeedback(null, "비용 절감!", "crit");
        }
        // [연구 효과] 무한 동력 (궁극기)
        if (user.tech['t5_ult_ap']) cost = Math.max(0, cost - 1);

        if(gameState.energy < cost) {
            showToast("행동력(AP)이 부족합니다!");
            return;
        }

        gameState.energy -= cost;
        useCardInHand(gameState.selectedCardIdx);

        let dmg = card.power;
        if (card.__mismatch) {
            dmg = Math.floor(dmg * 0.5);
            delete card.__mismatch;
        }
        let isCrit = false;

        // [연구 효과] 강화 부품 (파워 증가)
        if(card.type === 'tool' && user.tech['t2_power']) dmg += user.tech['t2_power'];

        if (tileData.status.includes('analysis') && card.power > 0) {
            dmg *= 2;
            isCrit = true;
            if(user.tech['t2_analy']) isCrit = true; 
            tileData.status = tileData.status.filter(s => s !== 'analysis');
            updateTileVisual(tileIdx);
        }

        if (tileData.type === 'stone' && !card.tags.includes('crack') && card.power < 3) {
            if (!user.tech['t4_rock']) {
                dmg = 0; 
                showFeedback(tileIdx, "너무 단단함!", "dmg");
            } else {
                dmg *= 2; 
                isCrit = true;
            }
        }

        if (dmg > 0) {
            // 이펙트(진동/파편)와 사운드를 같은 타이밍에 맞춤
            SFX.play('dig');

            const targets = isHammer ? getAoETiles(tileIdx, 1) : [tileIdx];
            const centerIdx = tileIdx;

            targets.forEach((tIdx) => {
                const td = gameState.gridData[tIdx];
                if (!td || td.cleared) return;

                const preHp = td.hp;
                const thisDmg = (isHammer && tIdx !== centerIdx) ? Math.max(1, Math.floor(dmg * 0.5)) : dmg;
                td.hp -= thisDmg;

                if (tIdx === centerIdx) {
                    if (isCrit) showFeedback(tIdx, `CRITICAL! -${thisDmg}`, "crit");
                    else showFeedback(tIdx, `-${thisDmg}`, "dmg");
                }

                updateTileVisual(tIdx);

                const over = Math.max(0, thisDmg - preHp);
                if (over >= 3) {
                    applyDurabilityLoss(Math.min(25, 5 + over * (isHammer ? 3 : 2)));
                    gameState.relicDamage = Math.min(100, gameState.relicDamage + Math.min(15, 2 + over * 2));
                }

                const el = document.querySelector(`.tile[data-id="${tIdx}"]`);
                if (el) {
                    el.classList.remove('hit-anim');
                    void el.offsetWidth;
                    el.classList.add('hit-anim');

                    // 파편/진동: 클릭한 타일 중심(또는 클릭 좌표)에서 발생
                    const isCenter = (tIdx === centerIdx);
                    const cx = isCenter ? (ev && ev.clientX) : null;
                    const cy = isCenter ? (ev && ev.clientY) : null;
                    applyTileImpactEffect(el, td.type, cx, cy);
                }

                if(td.hp <= 0) {
                    if (td.layers && td.layers.length > 0) {
                        const nextType = td.layers.shift();
                        td.type = nextType;
                        td.hp = getTileHp(nextType);
                        td.maxHp = td.hp;
                        if (tIdx === centerIdx) showFeedback(tIdx, "지층 발견!", "crit");
                        updateTileVisual(tIdx, true);
                    } else {
                        td.cleared = true;
                        gameState.clearedCount++;
                        if (el) { el.classList.add('cleared'); el.innerHTML = ''; }

                        if(card.risk > 0) {
                            let riskChance = card.risk;
                            if (isHammer) riskChance += 15;
                            if(user.tech['t2_risk']) riskChance = Math.max(0, riskChance - (user.tech['t2_risk']*5));

                            if (Math.random() * 100 < riskChance) {
                                if(user.tech['t5_ult_hp']) {
                                    showFeedback(null, "보호막 방어!", "crit");
                                } else {
                                    gameState.relicDamage = Math.min(100, gameState.relicDamage + 10);
                                    applyDurabilityLoss(10);
                                    showFeedback(null, "유물 손상!", "dmg");
                                    showToast("⚠️ 충격으로 유물 손상!");
                                }
                            }
                        }
                    }
                }
            });
        } else if (card.power === 0) {
            SFX.play('scan');
        }

        if (card.tags.includes('analysis')) {
            if (!tileData.status.includes('analysis')) {
                tileData.status.push('analysis');
                showFeedback(tileIdx, "분석 완료", "crit");
                updateTileVisual(tileIdx);
            }
        }
        
        if (card.tags.includes('overload')) {
            gameState.nextTurnDebuff += 1;
            showToast("과부하: 다음 턴 AP 감소");
        }

        if(card.power >= 5) {
            let stabLoss = 5;
            const stabLv = user.tech['t2_stab'] || user.tech['t3_def'] || 0;
            if (stabLv > 0) stabLoss -= stabLv; 
            gameState.stability -= Math.max(1, stabLoss);
        }

        // [튜토리얼] 스텝 확인 (타일 타격 완료)
        if(gameState.isTutorial && gameState.tutoStep === 3) nextTutorialStep();
        
        checkGameStatus();
    } catch (err) {
        console.error('handleTileClick error:', err);
    } finally {
        isProcessing = false;
        // 항상 UI 동기화
        updateHUD();
        renderHand();
        ensureUIInteractive();
    }
}

function updateTileVisual(idx, typeChanged = false) {
    const data = gameState.gridData[idx];
    const el = document.querySelector(`.tile[data-id="${idx}"]`);
    
    if (typeChanged) {
        el.className = `tile ${data.type}`;
        
        // 타일 타입 변경 시 배경 이미지 업데이트
        const tileImageMap = {
            'sand': '../images/tile_sand.png',
            'soil': '../images/tile_soil.png', 
            'stone': '../images/tile_stone.png',
            'water': '../images/tile_water.png'
        };
        if (tileImageMap[data.type]) {
            setTileBackgroundImage(el, tileImageMap[data.type]);
        }
    }

    // [Dynamic Crack] HP 비율에 따라 어두워짐 + 붉은 틴트 적용
    if (el) {
        const hp = Math.max(0, data.hp);
        const ratio = (data.maxHp > 0) ? (hp / data.maxHp) : 0;
        const dmgRatio = 1 - Math.max(0, Math.min(1, ratio));
        const brightness = 1 - (0.35 * dmgRatio);
        el.style.filter = `brightness(${brightness.toFixed(3)})`;
        el.style.setProperty('--tile-tint', String(Math.min(0.45, dmgRatio * 0.5)));
    }

    const elBar = el.querySelector('.tile-hp-fill');
    const elText = el.querySelector('.tile-hp-text');
    const elStatus = el.querySelector('.tile-status-icons');

    if(elBar && elText) {
        const hp = Math.max(0, data.hp);
        const pct = (hp / data.maxHp) * 100;
        elBar.style.width = `${pct}%`;
        elText.innerText = `${hp}/${data.maxHp}`;
    }

    if (elStatus) {
        elStatus.innerHTML = '';
        if (data.status.includes('analysis')) elStatus.innerHTML += '👁️';
    }
}

function showFeedback(tileIdx, text, type) {
    const layer = document.getElementById('battle-feedback-layer');
    const el = document.createElement('div');
    el.className = `feedback-text ${type}`;
    el.innerText = text;
    
    if (tileIdx !== null) {
        const tileEl = document.querySelector(`.tile[data-id="${tileIdx}"]`);
        const rect = tileEl.getBoundingClientRect();
        const containerRect = document.querySelector('.viewport-area').getBoundingClientRect();
        el.style.left = (rect.left - containerRect.left + rect.width/2 - 20) + 'px';
        el.style.top = (rect.top - containerRect.top) + 'px';
    } else {
        el.style.left = '50%';
        el.style.top = '40%';
        el.style.transform = 'translate(-50%, -50%)';
    }

    layer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function getTileParticleColor(tileType) {
    // 타일 색상에 맞춘 파편 컬러(가벼운 톤)
    if (tileType === 'sand') return '#d6c36a';
    if (tileType === 'soil') return '#6b4b3a';
    if (tileType === 'stone') return '#8a94a0';
    if (tileType === 'water') return '#4fc3f7';
    if (tileType === 'root') return '#5d4037';
    return '#888';
}

function createParticles(x, y, color) {
    const count = 5 + Math.floor(Math.random() * 4); // 5~8개
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'tile-particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = color;

        const dx = (Math.random() - 0.5) * 70;
        const dy = (Math.random() - 0.7) * 70;
        p.style.setProperty('--dx', `${dx.toFixed(1)}px`);
        p.style.setProperty('--dy', `${dy.toFixed(1)}px`);

        // 약간의 랜덤 크기/회전
        const size = 4 + Math.floor(Math.random() * 4);
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = Math.random() < 0.3 ? '1px' : '0px';

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 550);
    }
}

function applyTileImpactEffect(tileEl, tileType, clientX, clientY) {
    if (!tileEl) return;

    tileEl.classList.remove('shake-anim');
    void tileEl.offsetWidth;
    tileEl.classList.add('shake-anim');
    setTimeout(() => tileEl.classList.remove('shake-anim'), 320);

    const rect = tileEl.getBoundingClientRect();
    const x = (typeof clientX === 'number') ? clientX : (rect.left + rect.width / 2);
    const y = (typeof clientY === 'number') ? clientY : (rect.top + rect.height / 2);
    createParticles(x, y, getTileParticleColor(tileType));
}

function useSkill(idx) {
    const card = gameState.hand[idx];
    if(gameState.energy < card.cost) { showToast("행동력 부족!"); return; }
    
    gameState.energy -= card.cost;
    useCardInHand(idx);

    if(card.effect === 'ap') gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + card.val);
    if(card.effect === 'heal_stab') {
        let val = card.val;
        if ((user.tech['t2_stab']||0) > 0) val = Math.floor(val * 1.2);
        gameState.stability = Math.min(100, gameState.stability + val);
    }
    if(card.effect === 'heal_dmg') gameState.relicDamage = Math.max(0, gameState.relicDamage + card.val);
    if(card.effect === 'draw') drawCards(card.val);

    showToast(`${card.name} 사용!`);
    updateHUD();
    renderHand();
}

function useCardInHand(idx) {
    const card = gameState.hand.splice(idx, 1)[0];
    gameState.discardPile.push(card.id);
    gameState.selectedCardIdx = -1;
    renderHand();
}

// =============================================================================
// [7] 결과 및 종료
// =============================================================================
window.endTurn = function() {
    if(gameState.isTutorial) return;
    gameState.turn--;
    if(gameState.turn <= 0) gameOver("작전 시간 종료 (턴 소진)");
    else startTurn();
}

function checkGameStatus() {
    if(gameState.stability <= 0) { gameOver("지반 붕괴로 매몰되었습니다."); return; }
    if(gameState.relicDamage >= 100) { gameOver("유물이 심각하게 파손되었습니다."); return; }
    if(gameState.durability <= 0) { gameOver("유물이 훼손되어 발굴에 실패했습니다."); return; }
    if(gameState.clearedCount >= gameState.maxTiles) setTimeout(gameClear, 500);
}

function gameClear() {
    SFX.play('clrear');
    
    // 튜토리얼 모드일 때는 게임 클리어 화면 대신 튜토리얼 완료 처리
    if (gameState.isTutorial) {
        endTutorialFlow();
        alert("훈련 완료! 이제 실제 작전에 나설 수 있습니다.");
        goLobby();
        return;
    }
    
    const config = STAGE_CONFIG[gameState.level];
    
    let score = gameState.stability * 2 - gameState.relicDamage * 3;
    let rank = score >= 150 ? 'S' : (score >= 100 ? 'A' : 'B');
    if(gameState.relicDamage > 0 && rank === 'S') rank = 'A';

    const rarityMul = (config.rarity === 'epic') ? 2 : (config.rarity === 'rare' ? 1.5 : 1);
    let reward = Math.floor((config.reward + (rank==='S'?100:(rank==='A'?50:0))) * rarityMul);
    
    // [연구 효과] 전설의 도굴꾼 (보상 증가)
    if(user.tech['t5_ult_gold']) reward *= 3;
    else if(user.tech['t1_gold']) reward += (user.tech['t1_gold'] * 50);

    if (window.AHGold) {
        AHGold.add(reward);
        updateSharedGold();
    } else {
        user.gold += reward;
    }

    // [유물 전송] 복원실 보관함(anyang_inventory)에 즉시 반영
    try {
        const invKey = 'anyang_inventory';
        const raw = localStorage.getItem(invKey);
        const inv = raw ? (JSON.parse(raw) || []) : [];
        const relicId = (config.img_real || '').split('/').pop().replace(/\.png$/i, '');
        if (relicId) {
            inv.push(relicId);
            localStorage.setItem(invKey, JSON.stringify(inv));
        }
    } catch (e) {}
    if(gameState.level >= user.clearedStage) user.clearedStage = gameState.level + 1;
    
    localStorage.setItem('anyang_battle_clear', 'true');
    saveUserData();
    refreshShopList();

    updateQuestBoard();

    document.getElementById('res-title').innerText = "발굴 성공!";
    document.getElementById('res-content').innerText = config.desc;
    document.getElementById('score-stability').innerText = gameState.stability;
    document.getElementById('score-damage').innerText = gameState.relicDamage;
    document.getElementById('res-gold').innerText = reward;
    document.getElementById('res-grade-badge').innerText = rank;
    document.getElementById('res-grade-badge').className = `grade-badge ${rank.toLowerCase()}`;
    
    const img = document.getElementById('res-image');
    img.src = config.img_real;
    img.style.display = 'block';
    document.getElementById('res-unknown').style.display = 'none';

    document.getElementById('result-overlay').style.display = 'flex';
}

function gameOver(msg) {
    alert(msg);
    goLobby();
}

window.quitGame = function() {
    if(confirm("작전을 중단하고 본부로 복귀하시겠습니까?")) goLobby();
}

window.goLobby = function() {
    document.getElementById('result-overlay').style.display = 'none';
    document.getElementById('view-game').style.display = 'none';
    document.getElementById('view-lobby').style.display = 'flex';
    initLobby();
}

function updateHUD() {
    document.getElementById('ap-current').innerText = gameState.energy;
    document.getElementById('ap-max').innerText = gameState.maxEnergy;
    document.getElementById('turn-count').innerText = gameState.turn;
    
    const apPct = Math.min(100, (gameState.energy / gameState.maxEnergy) * 100);
    document.getElementById('ap-fill-bar').style.width = `${apPct}%`;

    document.getElementById('val-stability').innerText = gameState.stability + '%';
    document.getElementById('bar-stability').style.width = gameState.stability + '%';
    document.getElementById('val-damage').innerText = gameState.relicDamage + '%';
    document.getElementById('bar-damage').style.width = gameState.relicDamage + '%';
    document.getElementById('val-durability').innerText = gameState.durability + '%';
    document.getElementById('bar-durability').style.width = gameState.durability + '%';
    document.getElementById('draw-pile-count').innerText = gameState.drawPile.length;
}

function renderHand() {
    const area = document.getElementById('hand-area');
    if(!area) return;
    const html = gameState.hand.map((card, idx) => {
        let color = card.risk > 0 ? '#d32f2f' : '#7c9a3d';
        if(card.type === 'skill') color = '#29b6f6';

        const targetLabel = card.type === 'tool'
            ? (card.target === 'all' ? `타겟: ${TERRAIN_LABEL.all}` : `타겟: ${TERRAIN_LABEL[card.target]||card.target||'-'}`)
            : '보조';
        const tagHtml = (card.tags && card.tags.length)
            ? `<div class="card-tags">${card.tags.map(t => `<span class=\"tag ${t}\">${KEYWORDS[t]?KEYWORDS[t].name:t}</span>`).join('')}</div>`
            : '';

        const selectedClass = (idx === gameState.selectedCardIdx) ? 'selected' : '';
        return `
            <div class="card hand-card ${selectedClass}" data-card-id="${card.id}" data-index="${idx}" style="z-index:${2000 + idx};" onclick="event.stopPropagation(); event.preventDefault(); handleHandClick(${idx});">
                <div class="card-cost-badge">${card.cost}</div>
                <img class="card-img" src="${card.img||''}" alt="${card.name}" onerror="this.style.display='none'" />
                <div class="card-name">${card.name}</div>
                ${tagHtml}
                <div class="card-target" style="background:${color}">${targetLabel}</div>
            </div>
        `;
    }).join('');
    area.innerHTML = html;
}

function showToast(msg) {
    const t = document.getElementById('message-toast');
    t.innerText = msg;
    t.className = 'toast-show';
    setTimeout(() => t.className = 'toast-hidden', 1500);
}

// =============================================================================
// [8] 메뉴 (상점 / 장비 / 연구소)
// =============================================================================
function createMenuModal() {
    let div = document.getElementById('menu-modal-wrapper');
    if (!div) {
        div = document.createElement('div');
        div.id = 'menu-modal-wrapper';
        document.body.appendChild(div);
    }

    if (div.className !== 'modal-overlay') div.className = 'modal-overlay';
    div.style.zIndex = 3000;
    if (!div.style.display) div.style.display = 'none';
    if (div.parentElement !== document.body) document.body.appendChild(div);

    div.onclick = (e) => { if(e.target === div) closeMenuModal(); };
    ensureUIInteractive();
}

function closeMenuModal() {
    const wrapper = document.getElementById('menu-modal-wrapper');
    if(wrapper) {
        wrapper.style.display = 'none';
        wrapper.style.pointerEvents = 'none';
        wrapper.innerHTML = '';
    }
    ensureUIInteractive();
};

// [상점]
window.openShopMenu = function() {
    createMenuModal(); // 상점/장비/연구 메뉴 클릭 버그를 방지하기 위해 createMenuModal()을 선호출
    const wrapper = document.getElementById('menu-modal-wrapper');
    if (!wrapper) return;
    const wallet = (window.AHGold?AHGold.get():user.gold);
    let html = `
        <div class="modal-box">
            <div class="modal-title shop-title">🏛️ 문화유산협회 보급소 (보유: ${wallet} G)</div>
            <div class="shop-item" data-action="reportTip" style="border-color:#1565c0;">
                <div class="item-info">
                    <div class="item-name" style="color:#1565c0;">📢 매장문화재 신고 제보</div>
                    <div class="item-desc">시민 제보를 접수하고 사례금을 지급하여 유물을 안전하게 이관합니다.</div>
                </div>
            </div>
            <div style="max-height:300px; overflow-y:auto;">
    `;
    gameState.shopItems.forEach(item => {
        html += `
            <div class="shop-item" data-shop-id="${item.id}" data-shop-price="${item.price}">
                <img class="item-thumb" src="${item.img||''}" alt="${item.name}" onerror="this.style.visibility='hidden'" />
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc" style="color:var(--retro-gold); font-weight:bold;">${item.price} G</div>
                </div>
            </div>
        `;
    });
    html += `</div><button onclick="closeMenuModal()" style="width:100%; padding:10px; margin-top:10px;">닫기</button></div>`;
    wrapper.innerHTML = html;
    wrapper.style.display = 'flex';
    ensureUIInteractive();

    if (!wrapper.dataset.boundShopClick) {
        wrapper.addEventListener('click', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('.shop-item') : null;
            if (!target || !wrapper.contains(target)) return;
            e.stopPropagation();
            e.preventDefault();

            const action = target.dataset.action;
            if (action === 'reportTip') {
                openReportTipEvent();
                return;
            }
            const id = target.dataset.shopId;
            const price = parseInt(target.dataset.shopPrice || '0', 10);
            if (!id) return;
            openShopItemPopup(id, price);
        });
        wrapper.dataset.boundShopClick = '1';
    }
};

window.openReportTipEvent = function() {
    const reward = 50 + Math.floor(Math.random() * 101);
    const pick = STAGE_CONFIG[Math.floor(Math.random() * STAGE_CONFIG.length)];
    const relicId = (pick?.img_real || '').split('/').pop().replace(/\.png$/i, '');

    if (window.AHGold) {
        AHGold.add(reward);
        updateSharedGold();
    } else {
        user.gold += reward;
    }

    if (relicId) {
        try {
            const invKey = 'anyang_inventory';
            const raw = localStorage.getItem(invKey);
            const inv = raw ? (JSON.parse(raw) || []) : [];
            inv.push(relicId);
            localStorage.setItem(invKey, JSON.stringify(inv));
        } catch (e) {}
    }

    updateQuestBoard();
    showToast(`제보 접수 완료! 사례금 +${reward} G`);
    openShopMenu();
};

window.openShopItemPopup = function(id, price) {
    const card = CARD_DB.find(c => c.id === id);
    openUniversalModal('shop', { ...card, price: price });
};

window.confirmShopBuy = function(id, price) {
    if (window.AHGold) {
        if (!AHGold.spend(price)) { alert("골드가 부족합니다."); return; }
    } else {
        if(user.gold < price) { alert("골드가 부족합니다."); return; }
        user.gold -= price;
    }
    user.deck.push(id);
    saveUserData();
    alert("구매 완료!");
    closeUniversalModal();
    openShopMenu();
};

// [장비]
window.openDeckMenu = function() {
    createMenuModal();
    const wrapper = document.getElementById('menu-modal-wrapper');
    if (!wrapper) return;
    let html = `
        <div class="modal-box">
            <div class="modal-title">🎒 보유 장비 (${user.deck.length}장)</div>
            <div style="max-height:300px; overflow-y:auto;">
    `;
    const counts = {};
    user.deck.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    
    Object.keys(counts).forEach(id => {
        const card = CARD_DB.find(c => c.id === id);
        html += `
            <div class="deck-item" data-card-id="${id}" style="padding:8px;">
                <img class="item-thumb" src="${card.img||''}" alt="${card.name}" onerror="this.style.visibility='hidden'" />
                <div class="item-info">
                    <div class="item-name" style="font-size:14px;">${card.name}</div>
                    <div class="item-desc">보유: ${counts[id]}장</div>
                </div>
            </div>
        `;
    });
    html += `</div><button onclick="closeMenuModal()" style="width:100%; padding:10px; margin-top:10px;">닫기</button></div>`;
    wrapper.innerHTML = html;
    wrapper.style.display = 'flex';
    ensureUIInteractive();

    if (!wrapper.dataset.boundDeckClick) {
        wrapper.addEventListener('click', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('.deck-item') : null;
            if (!target || !wrapper.contains(target)) return;
            e.stopPropagation();
            e.preventDefault();

            const id = target.dataset.cardId;
            if (!id) return;
            const card = CARD_DB.find(c => c.id === id);
            if (!card) return;
            openUniversalModal('view', card);
        });
        wrapper.dataset.boundDeckClick = '1';
    }
};

// [연구소 (스킬 트리)]
window.openLabMenu = function() {
    createMenuModal();
    const wrapper = document.getElementById('menu-modal-wrapper');
    if (!wrapper) return;
    wrapper.style.display = 'flex';
    renderTechTree();
    ensureUIInteractive();
};

function renderTechTree() {
    const wrapper = document.getElementById('menu-modal-wrapper');
    const tiers = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    TECH_TREE.forEach(t => { if(tiers[t.tier]) tiers[t.tier].push(t); });

    let html = `
        <div class="modal-box lab">
            <div class="modal-title no-border">🧬 기술 연구소</div>
            <div style=\"text-align:right; font-size:14px; color:#fbc02d; margin-bottom:10px;\">
                보유 예산: <b>${(window.AHGold?AHGold.get():user.gold)} G</b>
            </div>
            
            <div class=\"tech-tree-container\">
                <div class="tech-connector"></div>
                ${[1, 2, 3, 4, 5].map(tierNum => `
                    <div class="tech-tier" data-tier="Tier ${tierNum}">
                        ${tiers[tierNum].map(tech => renderTechNode(tech)).join('')}
                    </div>
                `).join('')}
            </div>

            <div id="tech-detail-panel" class="tech-info-panel">
                <div style="color:#777; text-align:center; padding-top:20px;">
                    연구 아이콘을 클릭하여 상세 정보를 확인하세요.
                </div>
            </div>

            <button onclick="closeMenuModal()" style="width:100%; padding:10px; margin-top:10px; background:#444; color:#fff; border:none; cursor:pointer;">나가기</button>
        </div>
    `;
    wrapper.innerHTML = html;
}

function renderTechNode(tech) {
    const currentLv = user.tech[tech.id] || 0;
    const isMax = currentLv >= tech.maxLv;
    
    let isLocked = false;
    // 해금 조건: Tier > 1은 이전 티어의 특정 기술 요구
    if (tech.tier > 1) {
        if (tech.req) {
            // 편의상 OR 조건 (req 중 하나라도 1렙 이상이면 해금)
            const parentId = tech.req[0];
            const parentTech = TECH_TREE.find(t => t.id === parentId);
            if (!user.tech[parentId] || user.tech[parentId] < 1) isLocked = true;
        }
    }

    let statusClass = isLocked ? 'locked' : (isMax ? 'maxed' : 'available');
    
    return `
        <div class="tech-node ${statusClass}" 
             onclick="selectTech('${tech.id}', ${isLocked}, ${isMax})">
            <div class="icon">${tech.icon}</div>
            <div class="level">${isMax ? 'MAX' : `Lv.${currentLv}`}</div>
        </div>
    `;
}

window.selectTech = function(id, isLocked, isMax) {
    if (isLocked) {
        alert("🔒 선행 연구가 필요합니다.");
        return;
    }

    selectedTechId = id;
    const tech = TECH_TREE.find(t => t.id === id);
    const currentLv = user.tech[id] || 0;
    const nextCost = isMax ? 0 : tech.cost[currentLv];
    
    const panel = document.getElementById('tech-detail-panel');
    
    let btnHtml = '';
    if (isMax) {
        btnHtml = `<button class="btn-research" disabled>연구 완료 (MAX)</button>`;
    } else {
        const wallet = (window.AHGold?AHGold.get():user.gold);
        const canAfford = wallet >= nextCost;
        btnHtml = `<button class="btn-research" ${canAfford ? '' : 'disabled'} 
                    onclick="processUpgrade('${id}')">
                    연구 개시 (-${nextCost} G)
                   </button>`;
    }

    panel.innerHTML = `
        <div class="tech-info-name">${tech.name} <span style="font-size:12px; color:#aaa;">(Tier ${tech.tier})</span></div>
        <div class="tech-info-desc">${tech.desc}</div>
        <div class="tech-info-cost">
            현재 레벨: <span style="color:#fff">${currentLv}</span> / ${tech.maxLv}
        </div>
        ${btnHtml}
    `;
};

window.processUpgrade = function(id) {
    const tech = TECH_TREE.find(t => t.id === id);
    const currentLv = user.tech[id] || 0;
    const cost = tech.cost[currentLv];

    const useAH = !!window.AHGold;
    if (useAH) {
        if (!AHGold.spend(cost)) return;
    } else {
        if (user.gold < cost) return;
        user.gold -= cost;
    }
    if(!user.tech[id]) user.tech[id] = 0;
    user.tech[id]++;
    saveUserData();
    SFX.play('fix'); 

    renderTechTree();
    
    const newLv = user.tech[id];
    const isMax = newLv >= tech.maxLv;
    selectTech(id, false, isMax);
};

window.finishIntro = function() {
    document.getElementById('view-intro').style.display = 'none';
    document.getElementById('view-lobby').style.display = 'flex';
};

// =============================================================================
// [9] 튜토리얼 (추가된 기능)
// =============================================================================
window.startTutorialFlow = function() {
    // 튜토리얼을 첫 대사부터 확실히 표기
    gameState.tutoStep = 0; // 첫 단계 인덱스
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'block';
    // DOM 렌더 후 안전하게 표기
    setTimeout(() => {
        const textEl = document.getElementById('tuto-msg');
        const btn = document.getElementById('tuto-next-btn');
        const focusArea = document.getElementById('tuto-focus-area');
        if (textEl) textEl.innerHTML = (TUTORIAL_SCRIPTS[0]?.text || '이곳은 발굴 현장입니다.');
        if (btn) btn.style.display = 'block';
        if (focusArea) focusArea.style.display = 'none';
    }, 50);
};

window.nextTutorialStep = function() {
    gameState.tutoStep++;
    const step = gameState.tutoStep;
    const textEl = document.getElementById('tuto-msg');
    const btn = document.getElementById('tuto-next-btn');
    const focusArea = document.getElementById('tuto-focus-area');

    const show = (msg) => { textEl.innerHTML = msg; };
    const showBtn = (v) => { btn.style.display = v ? 'block' : 'none'; };
    const moveHighlightToEl = (el) => {
        if (!el) { focusArea.style.display = 'none'; return; }
        const rect = el.getBoundingClientRect();
        focusArea.style.display = 'block';
        focusArea.style.left = rect.left + 'px';
        focusArea.style.top = rect.top + 'px';
        focusArea.style.width = rect.width + 'px';
        focusArea.style.height = rect.height + 'px';
    };

    if (step === 0) {
        show(TUTORIAL_SCRIPTS[0].text);
        moveHighlightToEl(null);
        showBtn(true);
        return;
    }
    if (step === 1) {
        show(TUTORIAL_SCRIPTS[1].text);
        const sand = document.querySelector('.tile.sand:not(.cleared)') || document.querySelector('.tile');
        moveHighlightToEl(sand);
        showBtn(true);
        return;
    }
    if (step === 2) {
        show(TUTORIAL_SCRIPTS[2].text);
        // 손패에 붓이 없으면 보장
        const hasBrush = gameState.hand.some(c => c.id === 't01');
        if (!hasBrush) {
            const idx = gameState.drawPile.indexOf('t01');
            if (idx !== -1) gameState.drawPile.splice(idx,1);
            const card = CARD_DB.find(c=>c.id==='t01');
            if (card) gameState.hand.push({ ...card });
            renderHand();
        }
        const brushEl = document.querySelector('#hand-area .card[data-card-id="t01"]');
        if (brushEl) { brushEl.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); }
        moveHighlightToEl(brushEl);
        showBtn(false); // 선택 기다림
        return;
    }
    if (step === 3) {
        show(TUTORIAL_SCRIPTS[3].text);
        const sand = document.querySelector('.tile.sand:not(.cleared)') || document.querySelector('.tile');
        moveHighlightToEl(sand);
        showBtn(false); // 사용 기다림
        return;
    }
    if (step === 4) {
        show(TUTORIAL_SCRIPTS[4].text);
        moveHighlightToEl(null);
        showBtn(true);
        return;
    }

    endTutorialFlow();
    showToast('튜토리얼 완료!');
};

function positionHighlight(selector) {
    const focusArea = document.getElementById('tuto-focus-area');
    const highlight = document.getElementById('tuto-highlight');
    
    if (!selector) {
        focusArea.style.display = 'none';
        return;
    }

    const targetEl = document.querySelector(selector);
    if (!targetEl) {
        focusArea.style.display = 'none';
        return;
    }

    const rect = targetEl.getBoundingClientRect();
    focusArea.style.display = 'block';
    focusArea.style.left = rect.left + 'px';
    focusArea.style.top = rect.top + 'px';
    focusArea.style.width = rect.width + 'px';
    focusArea.style.height = rect.height + 'px';
    highlight.style.width = '100%';
    highlight.style.height = '100%';
}