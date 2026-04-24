/* ==============================================================================
   [한양문화유산연구원 : 통합 데이터 센터 Ver 11.0]
   - 테마: Retro Pixel & Alive
   ============================================================================== */

const GAME_CONFIG = {
    version: "11.0",
    storageKey: "anyang_heritage_user",
    // 레트로 테마 컬러
    theme: {
        primary: "#7c9a3d",    // 쑥색
        secondary: "#8d6e63",  // 갈색
        uiBlue: "#30346d",     // 대화창 파랑
        uiBorder: "#ffffff",   // 흰색 테두리
        gold: "#f1c40f",       // 강조
        red: "#ff3e3e"         // 튜토리얼 강조색
    },
    imagePath: "images/",
    soundPath: "sounds/"
};

// [1] 사운드 매니저
const SoundManager = {
    playSFX: function(fileName) {
        const audio = new Audio(GAME_CONFIG.soundPath + fileName);
        audio.volume = 0.6;
        audio.play().catch(() => console.log("SFX blocked"));
    },
    playBGM: function(fileName) {
        const audio = new Audio(GAME_CONFIG.soundPath + fileName);
        audio.volume = 0.3;
        audio.loop = true;
        audio.play().catch(() => console.log("BGM blocked"));
        return audio;
    }
};

// [2] 유저 데이터 관리자
const DataManager = {
    getUser: function() {
        const data = localStorage.getItem(GAME_CONFIG.storageKey);
        return data ? JSON.parse(data) : null;
    },

    saveUser: function(nickname) {
        let currentData = this.getUser() || {
            nickname: nickname,
            regDate: new Date().toISOString(),
            progress: { story: 0, battle: 0, clicker: 0 },
            collection: [],
            tutorialDone: false // 튜토리얼 완료 여부
        };
        // 닉네임만 업데이트하고 기존 데이터 유지
        currentData.nickname = nickname;
        localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(currentData));
        return currentData;
    },

    // 튜토리얼 완료 처리
    finishTutorial: function() {
        let user = this.getUser();
        if(user) {
            user.tutorialDone = true;
            localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(user));
        }
    },

    resetData: function() {
        if(confirm("모든 데이터를 삭제하고 처음으로 돌아갑니다.")) {
            localStorage.removeItem(GAME_CONFIG.storageKey);
            try { localStorage.removeItem('anyang_gold'); } catch(e) {}
            // [Fix] 카드배틀/서브게임 데이터도 함께 초기화
            try { localStorage.removeItem('anyang_excavation_user'); } catch(e) {}
            try { localStorage.removeItem('anyang_battle_clear'); } catch(e) {}
            try { localStorage.removeItem('anyang_restoration_v2'); } catch(e) {}
            try { localStorage.removeItem('anyang_inventory'); } catch(e) {}
            location.reload();
        }
    }
};

// [3] 통합 골드 매니저 (AHGold)
// - 모든 게임에서 공용 골드를 공유/저장/사용
// - localStorage 키: 'anyang_gold'
// - 전역 배지(UI) 자동 삽입 및 변경 시 갱신
window.AHGold = (function(){
    const KEY = 'anyang_gold';
    const EVT = 'ahgoldchange';

    function parse(v){
        const n = parseInt(v, 10);
        return isNaN(n) ? 0 : Math.max(0, n);
    }

    function get(){
        return parse(localStorage.getItem(KEY));
    }

    function set(amount){
        const n = parse(amount);
        localStorage.setItem(KEY, String(n));
        try {
            window.dispatchEvent(new CustomEvent(EVT, { detail: { gold: n } }));
        } catch(e) {}
        updateBadge();
        return n;
    }

    function add(delta){
        return set(get() + (parseInt(delta,10)||0));
    }

    function spend(cost){
        const c = parseInt(cost,10)||0;
        if (get() < c) return false;
        set(get() - c);
        return true;
    }

    function format(n){
        return (parseInt(n,10)||0).toLocaleString();
    }

    // 고정 배지 UI
    let badgeEl = null;
    function ensureBadge(){
        if (badgeEl && document.body.contains(badgeEl)) { updateBadge(); return badgeEl; }
        badgeEl = document.createElement('div');
        badgeEl.id = 'ah-gold-badge';
        badgeEl.style.cssText = `
            position: fixed; top: 8px; right: 8px; z-index: 99999;
            background: rgba(0,0,0,0.75); color: ${GAME_CONFIG?.theme?.gold || '#f1c40f'};
            border: 3px solid ${GAME_CONFIG?.theme?.uiBorder || '#fff'}; border-radius: 10px;
            font-family: monospace; font-size: 16px; font-weight: 700;
            padding: 8px 12px; box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex; align-items: center; gap: 8px; cursor: default; backdrop-filter: blur(3px);
        `;
        badgeEl.innerHTML = `<span>💰</span><span id="ah-gold-text">0</span>`;
        document.body.appendChild(badgeEl);
        updateBadge();
        return badgeEl;
    }

    function updateBadge(){
        const txt = document.getElementById('ah-gold-text');
        if (txt) txt.textContent = format(get());
    }

    // storage 이벤트로 다른 탭/페이지 변경 동기화
    window.addEventListener('storage', (e)=>{
        if(e.key === KEY) updateBadge();
    });
    window.addEventListener(EVT, updateBadge);
    document.addEventListener('DOMContentLoaded', ensureBadge);

    return { get, set, add, spend, format, ensureBadge };
})();