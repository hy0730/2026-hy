/* ==============================================================================
   [현장 조사 : 안양의 기억 - Visual Novel Engine Ver 3.3 (Critical Fix)]
   - Fix: SoundManager 중복 선언 방지 (게임 멈춤 현상 해결)
   - 기능: 조사대원증 발급 및 등급제(SSS~A) 엔딩 시스템
   ============================================================================== */

// [1] 사운드 매니저 (안전한 선언: 중복 방지)
if (typeof SoundManager === 'undefined') {
    window.SoundManager = {
        playSFX: function(fileName) {
            const audio = new Audio(`../sounds/${fileName}`);
            audio.volume = 0.6;
            audio.play().catch(() => {});
        }
    };
}

// [2] 데이터 베이스 (유물 및 시나리오)
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
    // 0. 안양사 귀부
    {
        intro: [
            { char: "양", text: "분석관님, 여기 거북이 모양의 큰 돌이 있어요! 등 위에 비석은 없고 받침만 남았네요?" },
            { char: "한", text: "잘 봤어. 이건 '안양사 귀부'야. 고려 태조 왕건이 세운 안양사가 있던 곳이지." },
            { char: "한", text: "자세히 보면 머리는 용, 몸은 거북이야. 고려시대 귀부의 특징이지. 김부식이 쓴 비석이 있었을 걸로 추정돼." },
            { char: "양", text: "아하, 우리 도시 이름 '안양(安養)'도 이 절에서 유래된 거군요?" }
        ],
        quiz: {
            q: "안양사 귀부에 대한 설명으로 옳은 것은?",
            a: [
                { txt: "통일신라 시대의 작품이다.", correct: false },
                { txt: "머리는 용, 몸은 거북 모양인 고려시대 양식이다.", correct: true },
                { txt: "등 위에 원래부터 아무것도 없었다.", correct: false }
            ],
            msg_ok: "정답! 웅장한 모습에서 고려의 기상이 느껴지지?",
            msg_no: "다시 봐. 통일신라와 달리 역동적인 용머리를 하고 있어."
        }
    },
    // 1. 중초사지 당간지주
    {
        intro: [
            { char: "양", text: "절 입구에 깃발을 걸던 기둥, 당간지주네요. 근데 서쪽 기둥에 글씨가 빼곡해요!" },
            { char: "한", text: "매우 중요한 발견이야. 저 명문 덕분에 이 당간지주가 827년에 만들어졌다는 걸 정확히 알 수 있어." },
            { char: "한", text: "황룡사 승려들이 후원했다는 기록도 있어 당시 중초사의 위상이 높았음을 보여주지." },
            { char: "양", text: "제작 연도가 확실한 국내 유일의 당간지주라니, 정말 귀하네요." }
        ],
        quiz: {
            q: "중초사지 당간지주가 보물로 지정된 가장 큰 이유는?",
            a: [
                { txt: "돌의 재질이 특이해서", correct: false },
                { txt: "만든 연도를 알 수 있는 기록(명문)이 있어서", correct: true },
                { txt: "가장 높아서", correct: false }
            ],
            msg_ok: "맞아. 827년이라는 정확한 기록은 역사적 가치가 매우 커.",
            msg_no: "힌트는 기둥에 새겨진 '글자'야."
        }
    },
    // 2. 석수동 마애종
    {
        intro: [
            { char: "양", text: "바위 절벽에 종이 그려져 있어요. 스님이 종을 치려는 것 같은데요?" },
            { char: "한", text: "'석수동 마애종'이야. 스님이 당목을 잡고 종을 치는 장면을 묘사한 것은 우리나라에서 이게 유일해." },
            { char: "한", text: "쇠사슬로 연결된 종, 유곽과 유두의 디테일까지... 당시 종을 어떻게 쳤는지 알 수 있는 귀한 자료야." }
        ],
        quiz: {
            q: "석수동 마애종이 특별한 이유는?",
            a: [
                { txt: "스님이 종을 치는 모습이 묘사된 유일한 마애종이라서", correct: true },
                { txt: "바위에서 종소리가 나서", correct: false },
                { txt: "가장 큰 종 그림이라서", correct: false }
            ],
            msg_ok: "정확해! 실제 타종 모습을 보여주는 유일한 사례지.",
            msg_no: "우리나라에 '유일'한 특징을 생각해봐."
        }
    },
    // 3. 만안교
    {
        intro: [
            { char: "양", text: "아름다운 무지개 모양의 돌다리네요. 홍예가 7개나 있어요!" },
            { char: "한", text: "이건 '만안교'야. 정조대왕이 아버지 사도세자의 능을 참배하러 갈 때, 백성들의 편의를 위해 만들었어." },
            { char: "한", text: "원래 왕이 지나가면 나무다리를 놓고 헐었는데, 백성들이 맘 편히 쓰라고 튼튼한 돌다리를 놓아준 거야." },
            { char: "양", text: "그래서 이름이 '만안(萬安, 만년 편안함)'이군요. 효심과 애민 정신이 느껴져요." }
        ],
        quiz: {
            q: "정조대왕이 만안교를 석조 다리로 건립한 목적은?",
            a: [
                { txt: "군사 훈련을 위해서", correct: false },
                { txt: "백성들이 평상시에도 편하게 이용하도록", correct: true },
                { txt: "통행료를 걷기 위해서", correct: false }
            ],
            msg_ok: "훌륭해. 백성을 생각하는 왕의 마음이 담겨있어.",
            msg_no: "왕만 쓰고 마는 다리가 아니었어. 백성을 생각했지."
        }
    },
    // 4. 구 서이면 사무소
    {
        intro: [
            { char: "양", text: "이 건물은 한옥 같은데 유리창이 있네요? 1914년에 지어졌다고요?" },
            { char: "한", text: "'구 서이면 사무소'야. 일제강점기에 행정 업무를 보던 곳이지. 전통과 근대 양식이 섞여 있어." },
            { char: "한", text: "하지만 상량문에는 일제 통치를 찬양하는 글귀가 남아있어. 아픈 역사도 기억해야 할 교훈이지." },
            { char: "양", text: "네, '부정적 유산(Negative Heritage)'으로서 역사를 잊지 말아야겠네요." }
        ],
        quiz: {
            q: "구 서이면 사무소의 역사적 의의로 적절한 것은?",
            a: [
                { txt: "고려시대 관청의 모습을 보여준다.", correct: false },
                { txt: "식민지 행정의 증거이자 교훈을 주는 근대유산이다.", correct: true },
                { txt: "순수 전통 한옥의 아름다움을 대표한다.", correct: false }
            ],
            msg_ok: "맞아. 잊지 말아야 할 우리의 근대 역사야.",
            msg_no: "단순한 옛날 건물이 아니야. 식민지 시대의 흔적이지."
        }
    },
    // 5. 석수동 석실분
    {
        intro: [
            { char: "한", text: "삼성산 중턱에 있는 이 돌방무덤은 삼국시대의 것이야." },
            { char: "양", text: "입구가 남쪽으로 트여 있네요? 추가로 시신을 모실 수 있는 구조 같아요." },
            { char: "한", text: "맞아. '앞트기식 돌방무덤'이지. 인근 호암산성이나 유물로 볼 때 신라와 관련된 무덤으로 추정돼." },
            { char: "한", text: "안양이 삼국시대에도 전략적으로 중요한 요충지였다는 증거란다." }
        ],
        quiz: {
            q: "석수동 석실분을 통해 알 수 있는 사실은?",
            a: [
                { txt: "안양은 삼국시대에 전략적 요충지였다.", correct: true },
                { txt: "고려시대 왕실 무덤이다.", correct: false },
                { txt: "선사시대 고인돌이다.", correct: false }
            ],
            msg_ok: "정확해. 한강 유역을 차지하기 위한 역사가 담겨있지.",
            msg_no: "돌방무덤은 삼국시대의 특징적인 무덤 양식이야."
        }
    },
    // 6. 관양동 선사유적
    {
        intro: [
            { char: "양", text: "땅에서 반달 돌칼과 빗살무늬 토기 조각이 발견됐어요!" },
            { char: "한", text: "관양동 선사유적지야. 청동기 시대의 집터들이 대규모로 확인된 곳이지." },
            { char: "한", text: "아주 오래전부터 안양천 주변은 사람들이 모여 살기 좋은 비옥한 땅이었다는 뜻이야." },
            { char: "양", text: "수천 년 전 사람들의 생활 터전이었다니 신기해요." }
        ],
        quiz: {
            q: "관양동 선사유적에서 발견된 유물과 시대가 바르게 연결된 것은?",
            a: [
                { txt: "고려청자 - 고려시대", correct: false },
                { txt: "반달 돌칼 - 청동기 시대", correct: true },
                { txt: "금동불상 - 조선시대", correct: false }
            ],
            msg_ok: "맞아. 농경 생활을 했던 청동기 시대의 흔적이야.",
            msg_no: "반달 돌칼은 청동기 시대의 대표적인 농기구야."
        }
    },
    // 7. 평촌 지석묘
    {
        intro: [
            { char: "한", text: "도심 공원에 거대한 바위들이 모여있지? '평촌 지석묘'야." },
            { char: "양", text: "고인돌이네요! 덮개돌이 정말 커요. 이걸 어떻게 옮겼을까요?" },
            { char: "한", text: "그래서 고인돌은 '협동'의 상징이야. 많은 사람이 힘을 합쳐야만 만들 수 있었으니까." },
            { char: "한", text: "발굴 당시 실제 무기가 아닌 의식용 유물들이 나온 걸 보면 제사장의 무덤이었을 거야." }
        ],
        quiz: {
            q: "평촌 지석묘 발굴 유물의 특징은?",
            a: [
                { txt: "전쟁에 사용된 날카로운 무기", correct: false },
                { txt: "무덤에 묻기 위해 만든 의식용 유물", correct: true },
                { txt: "농사에 쓰던 쇠기구", correct: false }
            ],
            msg_ok: "정답! 마을의 안녕을 비는 의식용 도구들이었지.",
            msg_no: "실제 사용 흔적이 없는, 의례를 위한 물건들이었어."
        }
    }
];

// [3] 게임 상태 관리
let currentStage = 0;
let scriptQueue = [];
let isTyping = false;
let currentRelic = null;
let isStageClear = false; // 퀴즈 무한 루프 방지용
let correctCount = 0; // [NEW] 정답 개수 추적

// [4] 초기화
window.onload = function() {
    if (window.AHGold && AHGold.ensureBadge) AHGold.ensureBadge();
    initGame();
};

function initGame() {
    correctCount = 0; // 점수 초기화
    loadStage(0);
}

// 스테이지 로드
function loadStage(stageIdx) {
    if (stageIdx >= RELIC_DATA.length) {
        showEnding();
        return;
    }

    // 상태 초기화
    currentStage = stageIdx;
    currentRelic = RELIC_DATA[stageIdx];
    isStageClear = false;
    const scriptInfo = STORY_SCRIPT[stageIdx];

    // HUD 업데이트
    document.querySelector('.header-title').innerText = `현장 조사: ${currentRelic.name}`;

    // 배경 변경
    const bgEl = document.getElementById('scene-bg');
    bgEl.style.backgroundImage = `url('../images/${currentRelic.img}')`;
    bgEl.style.opacity = 0;
    setTimeout(() => bgEl.style.opacity = 1, 100);

    // 스크립트 큐 설정
    scriptQueue = [...scriptInfo.intro];
    
    // 캐릭터 초상화 숨김
    const portrait = document.getElementById('dialogue-portrait');
    if (portrait) portrait.classList.add('hidden');
    
    // 첫 대사 실행
    nextScript();
}

// 다음 대사 진행
function nextScript() {
    if (isStageClear) return; // 클리어 대기 상태면 클릭 무시

    if (isTyping) return;

    if (scriptQueue.length === 0) {
        showChoice();
        return;
    }

    const curr = scriptQueue.shift();
    
    if (curr.action === "retry") {
        showChoice();
        return;
    }

    SoundManager.playSFX('sfx_click.mp3');
    updateScene(curr.char, curr.text);
}

// 씬 업데이트
function updateScene(charName, text) {
    const portrait = document.getElementById('dialogue-portrait');
    const portraitBox = document.querySelector('.portrait-box');

    if (charName === "한") {
        portrait.src = "../images/han_2.png";
        portrait.classList.remove('hidden');
        if(portraitBox) portraitBox.style.borderColor = "#7c9a3d";
        updateNameBadge("한 (분석관)", "#7c9a3d");
    } else if (charName === "양") {
        portrait.src = "../images/yang_2.png";
        portrait.classList.remove('hidden');
        if(portraitBox) portraitBox.style.borderColor = "#d4af37";
        updateNameBadge("양 (연구원)", "#d4af37");
    } else {
        portrait.classList.add('hidden');
        if(portraitBox) portraitBox.style.borderColor = "#3e2723";
        updateNameBadge("시스템", "#3e2723");
    }

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

function updateNameBadge(name, color) {
    const badge = document.getElementById('char-name');
    if (badge) {
        badge.innerText = name;
        badge.style.backgroundColor = color;
        badge.style.borderColor = color;
    }
}

// [선택지 / 퀴즈]
function showChoice() {
    const quizData = STORY_SCRIPT[currentStage].quiz;
    const overlay = document.getElementById('choice-overlay');
    const container = document.getElementById('choice-container');
    
    overlay.querySelector('h3').innerText = quizData.q;
    container.innerHTML = ""; 

    quizData.a.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btn-choice';
        btn.innerText = item.txt;
        btn.onclick = () => checkAnswer(item.correct, quizData);
        container.appendChild(btn);
    });

    overlay.classList.remove('hidden');
}

function checkAnswer(isCorrect, quizData) {
    document.getElementById('choice-overlay').classList.add('hidden');

    if (isCorrect) {
        correctCount++; // [NEW] 정답 시 점수 증가
        SoundManager.playSFX('sfx_clear.mp3');
        isStageClear = true; 
        scriptQueue = []; 
        
        updateScene("한", quizData.msg_ok);
        setTimeout(() => showResult(), 2000);
    } else {
        SoundManager.playSFX('sfx_hit.mp3');
        updateScene("양", quizData.msg_no);
        scriptQueue = [{ char: "시스템", text: "다시 한 번 생각해보자.", action: "retry" }];
    }
}

// [결과창]
function showResult() {
    const overlay = document.getElementById('result-overlay');
    
    document.getElementById('result-title').innerText = "조사 완료!";
    document.getElementById('result-img').src = `../images/${currentRelic.img.replace('_main', '_real')}`;
    document.getElementById('result-desc').innerText = `${currentRelic.name}에 대한 기록을 확보했습니다.`;
    document.getElementById('reward-item').innerText = `${currentRelic.reward}`;

    overlay.classList.remove('hidden');
    SoundManager.playSFX('sfx_fix.mp3');
}

// 다음 스테이지 또는 종료
function finishGame() {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('hidden');

    if (currentStage >= RELIC_DATA.length - 1) {
        showEnding(); // 모든 스테이지 완료 시 엔딩
    } else {
        loadStage(currentStage + 1);
    }
}

// [NEW] 엔딩: 조사대원증 발급
function showEnding() {
    // 1. 등급 산정 (총 8문제)
    const total = RELIC_DATA.length;
    let grade = "A";
    if (correctCount === total) grade = "SSS";
    else if (correctCount >= total - 1) grade = "SS"; // 7개
    else if (correctCount >= total - 3) grade = "S";  // 5~6개
    
    // 2. UI 업데이트
    // 저장된 닉네임 불러오기 (없으면 기본값)
    let userName = "연구원";
    try {
        const userData = JSON.parse(localStorage.getItem('anyang_heritage_user'));
        if(userData && userData.nickname) userName = userData.nickname;
    } catch(e) {}

    document.getElementById('cert-name').innerText = userName;
    document.getElementById('cert-score').innerText = `${correctCount} / ${total}`;
    
    const gradeEl = document.getElementById('cert-grade');
    gradeEl.innerText = grade;
    
    // 등급별 색상 포인트 (선택 사항)
    if(grade === 'SSS') gradeEl.style.color = '#d32f2f'; // Red
    else if(grade === 'A') gradeEl.style.color = '#5d4037'; // Brown

    // 3. 화면 표시
    document.getElementById('ending-overlay').classList.remove('hidden');
    SoundManager.playSFX('sfx_clear.mp3');
}

// [NEW] 메인으로 복귀 (보상 지급)
window.exitToMain = function() {
    localStorage.setItem('anyang_story_clear', 'true');
    
    // 성과에 따른 차등 보상
    let reward = 3000 + (correctCount * 200); // 기본 3000 + 문제당 200
    if (correctCount === RELIC_DATA.length) reward += 1000; // 만점 보너스

    if (window.AHGold) {
        AHGold.add(reward);
    } else {
        let currentGold = parseInt(localStorage.getItem('anyang_gold') || "0");
        localStorage.setItem('anyang_gold', currentGold + reward);
    }

    alert(`[조사 완료] 연구비 ${reward}G가 지급되었습니다.`);
    location.href = '../index.html'; 
};