/**
 * [안양의 시간] 9대 스테이지 데이터 베이스 (시대순)
 * 각 스테이지는 시대순 흐름과 고유한 미니게임 로직을 포함합니다.
 */

const STAGES_DATA = {
    // STAGE 1: 선사 시대
    GWANYANG: {
        title: "01. 관양동 선사유적지 (선사 시대)",
        scripts: [
            { char: "한", text: "여기가 바로 관양동 선사유적지예요. 수만 년 전 안양에 살던 분들의 흔적이 잠들어 있죠." },
            { char: "양", text: "흙 속에 무언가 딱딱한 게 걸리는 것 같아요! 분석관님, 조심스럽게 흙을 걷어내 볼까요?" }
        ],
        minigame: {
            type: "SCRATCH_BRUSH",
            instruction: "브러시로 흙을 살살 걷어내어 유물을 발굴하세요!",
            targetImg: "relic_gwanyang_real.png",
            quiz: {
                question: "방금 발굴한 이 도구(슴베찌르개)는 주로 어떤 용도로 쓰였을까요?",
                options: ["곡식을 가공할 때", "창의 끝에 달아 사냥할 때", "가죽에 구멍을 뚫을 때", "물고기를 잡을 때"],
                answer: 1
            }
        },
        educationalFact: "관양동 선사유적에서는 구석기 시대의 슴베찌르개와 신석기 시대의 빗살무늬토기 등이 발견되었습니다. 이는 안양에 아주 오래전부터 사람이 살았음을 증명하는 소중한 증거입니다."
    },

    // STAGE 2: 청동기 시대
    PYEONGCHON: {
        title: "02. 평촌동 지석묘 (청동기 시대)",
        scripts: [
            { char: "한", text: "와, 정말 거대한 돌이에요! 이게 바로 청동기 시대의 무덤인 고인돌(지석묘)이랍니다." },
            { char: "양", text: "이 엄청난 무게의 덮개돌을 옛날 사람들은 어떻게 옮겼을까요? 우리 함께 방법을 찾아봐요!" }
        ],
        minigame: {
            type: "STONE_TRANSPORT",
            instruction: "덮개돌을 옮길 방법을 선택하세요. 여러 번 시도해 볼 수 있습니다.",
            options: [
                { id: "logs", label: "통나무 굴림", desc: "통나무를 바닥에 깔아 마찰을 줄여 옮깁니다. 가장 효율적인 방법이에요!" },
                { id: "rope", label: "밧줄로 끌기", desc: "수많은 사람이 한꺼번에 밧줄을 당겨 힘을 모읍니다. 협동심이 중요하죠." },
                { id: "lift", label: "직접 들기", desc: "엄청난 인원이 필요하고 위험하지만, 공동체의 힘을 보여주는 방식입니다." }
            ],
            quizzes: [
                {
                    type: "CHOICE",
                    question: "Q1. 고인돌은 어느 시대의 대표적인 무덤 양식일까요?",
                    options: ["구석기 시대", "신석기 시대", "청동기 시대", "철기 시대"],
                    answer: 2
                },
                {
                    type: "OX_DESC",
                    question: "Q2. 이 거대한 돌을 혼자서 옮길 수 있을까요? 활동을 통해 느낀 점을 적어보세요.",
                    placeholder: "예: 많은 사람의 협동이 필요했을 것 같아요.",
                    answer: "X"
                }
            ]
        },
        educationalFact: "고인돌 하나를 만드는데는 수백 명의 인력이 필요했습니다. 이는 당시 많은 사람을 지휘할 수 있는 강력한 '권력(족장)'이 등장했음을 의미하며, 안양 평촌 지역이 당시 중요한 생활 터전이었음을 보여줍니다."
    },

    // STAGE 3: 삼국 시대
    SEOKSILBUN: {
        title: "03. 석수동 석실분 (삼국 시대)",
        scripts: [
            { char: "한", text: "이곳은 돌을 쌓아 방처럼 만든 '석실분'이에요. 삼국시대 안양을 지키던 주인공이 잠들어 계시죠." },
            { char: "양", text: "무덤이 무너지기 전에 주인공이 다음 세상에서 사용할 물건들을 어서 배치해야 해요! 시간이 없어요!" }
        ],
        minigame: {
            type: "BURIAL_PLACEMENT",
            instruction: "60초 안에 원하는 부장품을 드래그하여 무덤 안에 배치하세요.",
            timer: 60,
            items: [
                { id: "pottery", name: "굽다리 접시", img: "relic_gwanyang_real2.png" },
                { id: "sword", name: "환두대도", img: "tool_pick.png" }, // 임시 이미지 매칭
                { id: "beads", name: "유리구슬", img: "relic_b_1.png" },
                { id: "iron", name: "철제 화살촉", img: "tool_drill.png" }
            ],
            quiz: {
                question: "Q. 삼국시대 사람들은 왜 무덤에 귀한 물건들을 함께 묻었을까요? 당신의 생각을 적어주세요.",
                placeholder: "예: 죽은 뒤에도 풍족하게 살기를 바라서"
            }
        },
        educationalFact: "석수동 석실분은 고구려, 백제, 신라가 안양천 유역을 차지하기 위해 치열하게 경쟁하던 삼국시대의 흔적입니다. 무덤 안의 부장품은 죽은 뒤에도 삶이 이어진다는 당시 사람들의 사후 세계관을 잘 보여줍니다."
    },

    // STAGE 4: 통일신라 시대
    JUNGCHO: {
        title: "04. 중초사지 당간지주 (통일신라)",
        scripts: [
            { char: "한", text: "지주 옆면에 빼곡하게 새겨진 글씨들이 보이시나요? 826년에 쓰인 아주 귀한 기록이에요." },
            { char: "양", text: "이 기록에 따르면 하나의 커다란 돌이 저절로 둘로 갈라졌대요! 공사 순서를 맞춰 기록을 해독해 봐요!" }
        ],
        minigame: {
            type: "TIMELINE_ORDER",
            instruction: "명문에 기록된 공사 순서대로 카드를 배치하여 기록을 복원하세요.",
            cards: [
                { id: 0, text: "① 승악에서 거대한 돌을 발견함" },
                { id: 1, text: "② 돌이 갑자기 둘로 갈라짐" },
                { id: 2, text: "③ 두 무리의 사람들이 각기 돌을 운반함" },
                { id: 3, text: "④ 중초사에 무사히 도착함" },
                { id: 4, text: "⑤ 정해진 날에 지주를 세워 완료함" }
            ],
            quiz: {
                question: "Q. 당간지주의 재료가 되는 돌을 처음 발견한 곳은 어느 산일까요?",
                answer: "승악"
            }
        },
        educationalFact: "보물 제4호 중초사지 당간지주는 제작 시기(826~827년)와 과정이 정확히 새겨져 있어 한국 역사 연구에 매우 중요한 사료입니다. 하나의 돌이 둘로 나뉘어 한 쌍이 되었다는 기록이 특징입니다."
    },

    // STAGE 5: 통일신라~고려 시대
    MAAEJONG: {
        title: "05. 석수동 마애종 (통일신라~고려)",
        scripts: [
            { char: "한", text: "바위에 새겨진 종이라니, 정말 신기하죠? 우리나라에 하나뿐인 아주 특별한 보물이에요." },
            { char: "양", text: "세월이 흘러 문양이 많이 흐려졌어요. 한지를 대고 먹으로 문질러서 종의 모습을 되살려 봐요!" }
        ],
        minigame: {
            type: "RUBBING_TAKBON",
            instruction: "먹방망이로 한지 위를 골고루 문질러 종의 문양을 복원하세요!",
            targetImg: "relic_bell_real.png",
            quizzes: [
                {
                    type: "CHOICE",
                    question: "Q1. 왜 옛날 사람들은 진짜 종을 만들지 않고 바위에 종 모양을 새겼을까요?",
                    options: ["돈이 없어서", "종소리보다 오래 남기고 싶어서", "장식을 위해", "만들기 쉬워서"],
                    answer: 1
                },
                {
                    type: "SHORT",
                    question: "Q2. 이 유물처럼 바위 벽면에 불교 유산을 새긴 것을 무엇이라고 부를까요?",
                    answer: "조각"
                }
            ]
        },
        educationalFact: "석수동 마애종은 바위에 새겨진 종으로는 국내에서 유일한 사례입니다. 스님이 종을 치는 모습까지 정교하게 묘사되어 있어 당시 사찰의 모습과 범종의 형태를 연구하는 데 소중한 자료입니다."
    },

    // STAGE 6: 고려 시대 (지명 유래)
    ANYANGSA_GVIBU: {
        title: "06. 안양사 귀부 (고려 시대)",
        scripts: [
            { char: "한", text: "이 거대한 거북이 모양 받침대는 '귀부'라고 해요. 그런데 사실 이건 진짜 거북이가 아니랍니다." },
            { char: "양", text: "무거운 걸 지기 좋아하는 용의 아들 '비희'예요! 비석이 쓰러지기 전에 어서 비희를 찾아주세요!" }
        ],
        minigame: {
            type: "FIND_BIHUI",
            instruction: "45초 안에 용의 아홉 아들 중 '무거운 것을 지는 것'을 좋아하는 아들을 찾으세요!",
            timer: 45,
            sons: [
                { id: "bihi", name: "비희(贔屭)", desc: "무거운 것을 짊어지는 것을 좋아해요.", isCorrect: true },
                { id: "chiwen", name: "치문(螭吻)", desc: "먼 곳을 바라보는 것을 좋아해요.", isCorrect: false },
                { id: "pulao", name: "포뢰(蒲牢)", desc: "울음소리가 커서 종에 새겨져요.", isCorrect: false },
                { id: "yazi", name: "애자(睚眦)", desc: "싸움을 좋아해 칼자루에 새겨져요.", isCorrect: false },
                { id: "suanni", name: "산예(狻猊)", desc: "불과 연기를 좋아해요.", isCorrect: false },
                { id: "bashia", name: "공복(蚣蝮)", desc: "물을 좋아해 다리에 새겨져요.", isCorrect: false },
                { id: "bian", name: "폐안(狴犴)", desc: "정의로워 감옥 입구에 새겨져요.", isCorrect: false },
                { id: "fuxi", name: "부희(負屭)", desc: "문학을 사랑해 비석 옆에 새겨져요.", isCorrect: false },
                { id: "jiaotu", name: "초도(椒圖)", desc: "입을 닫는 걸 좋아해요.", isCorrect: false }
            ],
            quiz: {
                question: "Q. 만약 당신이 이 귀부 위에 비석을 세운다면 어떤 내용을 새기고 싶나요?",
                placeholder: "예: 안양의 모든 사람들이 행복하기를..."
            }
        },
        educationalFact: "안양사 귀부는 고려 시대의 유물로, 안양(安養)이라는 지명이 이곳 '안양사'에서 유래되었습니다. 귀부는 사실 용의 아들 중 비석을 영원히 짊어지는 '비희'를 형상화한 것입니다."
    },

    // STAGE 7: 고려 시대 (수공업)
    BISANDONG: {
        title: "07. 비산동 도요지 (고려 시대)",
        scripts: [
            { char: "한", text: "여기는 고려 시대에 도자기를 굽던 '도요지'예요. 안양천 주변의 좋은 흙으로 그릇을 만들었죠." },
            { char: "양", text: "가마에 불이 붙었어요! 불꽃이 꺼지기 전에 온도를 잘 맞춰서 멋진 고려백자를 완성해 주세요!" }
        ],
        minigame: {
            type: "POTTERY_MAKING",
            instruction: "제작 단계를 선택하고, 가마의 온도를 적정 범위(1200~1300도)로 맞추세요!",
            timer: 30,
            steps: [
                { id: "shape", label: "형태 고르기", options: ["완형(대접)", "병형(병)", "발형(사발)"] },
                { id: "pattern", label: "문양 고르기", options: ["연꽃무늬", "구름무늬", "무늬없음"] }
            ],
            quizzes: [
                {
                    type: "SHORT",
                    question: "Q1. 도자기를 굽는 가마가 있던 자리를 무엇이라고 부를까요?",
                    answer: "도요지"
                },
                {
                    type: "SHORT",
                    question: "Q2. 비산동에서 발견된 고려 시대의 특별한 흰색 도자기는 무엇일까요?",
                    answer: "고려백자"
                }
            ]
        },
        educationalFact: "비산동 도요지는 고려 시대 안양이 도자기 생산의 중심지였음을 보여줍니다. 특히 이곳에서는 청자가 유행하던 시기에 드물게 '고려백자'가 생산되어 학술적 가치가 매우 높습니다."
    },

    // STAGE 8: 조선 시대
    MANANGYO: {
        title: "08. 만안교 (조선 시대)",
        scripts: [
            { char: "한", text: "정조 임금이 아버지의 묘소를 참배하러 가기 위해 세운 다리, 만안교에 도착했어요." },
            { char: "양", text: "아치형 돌다리는 매우 튼튼하지만 마지막 '이맛돌'을 잘못 끼우면 무너질 수 있어요. 다리를 완성해 봐요!" }
        ],
        minigame: {
            type: "ARCH_PUZZLE",
            instruction: "돌 블록을 옮겨 아치교를 완성하세요. 마지막에 이맛돌을 끼워야 튼튼해집니다!",
            blocks: [
                { id: "base_l", name: "왼쪽 기초" },
                { id: "base_r", name: "오른쪽 기초" },
                { id: "side_l", name: "왼쪽 홍예" },
                { id: "side_r", name: "오른쪽 홍예" },
                { id: "keystone", name: "이맛돌" }
            ],
            quiz: {
                question: "Q. 만안교를 만든 임금은 누구이며, 왜 이 다리를 만들었을까요?",
                options: [
                    "세종대왕 - 백성을 위해",
                    "정조 - 아버지 참배 길을 편하게 하려고",
                    "태조 이성계 - 도읍 이전을 위해",
                    "영조 - 홍수를 막으려고"
                ],
                answer: 1
            }
        },
        educationalFact: "만안교는 정조가 사도세자의 묘소인 현륭원을 참배하러 갈 때 건너기 위해 만든 다리입니다. 하중을 분산시키는 정교한 아치(홍예) 공법이 적용된 조선 후기 토목 기술의 정수입니다."
    },

    // STAGE 9: 근대
    SEOIMYEON: {
        title: "09. 구 서이면사무소 (근대)",
        scripts: [
            { char: "한", text: "드디어 마지막 장소예요. 100여 년 전 안양의 행정을 담당했던 서이면 사무소죠." },
            { char: "양", text: "여기 있는 도구들은 그 당시의 '최신 가젯'들이었대요! 지금 물건들과 어떻게 다른지 비교해 볼까요?" }
        ],
        minigame: {
            type: "THEN_VS_NOW",
            instruction: "근대 행정 도구의 용도를 맞히고, 오늘날의 도구와 비교해 보세요.",
            items: [
                { id: "mimeograph", name: "등사기", question: "이 기계는 어디에 쓰는 물건일까요?", options: ["전화용", "문서 복사용", "커피용", "난로용"], answer: 1, compareText: "등사기 ↔ 프린터/복사기" },
                { id: "seal", name: "직인과 인주", question: "서류 끝에 이것을 찍는 이유는?", options: ["장식용", "확인 증표", "지우개", "종이 고정"], answer: 1, compareText: "직인 ↔ 전자결재" },
                { id: "brush", name: "벼루와 붓", question: "사무소에서 이것으로 무엇을 했을까요?", options: ["청소", "그림", "문서 기록", "연주"], answer: 2, compareText: "벼루·붓 ↔ 키보드" },
                { id: "cauldron", name: "가마솥", question: "마당에 가마솥이 있는 이유는?", options: ["서류 소각", "식사/물 끓이기", "유물 보관", "빨래"], answer: 1, compareText: "가마솥 ↔ 탕비실" },
                { id: "map", name: "시흥군 관내지도", question: "이 지도는 어떤 용도였을까요?", options: ["경계 확인", "보물 찾기", "벽지", "종이접기"], answer: 0, compareText: "종이지도 ↔ 스마트폰 지도" }
            ],
            quiz: {
                question: "Q. 만약 당신이 이 사무소의 직원이라면, 어떤 도구로 어떤 일을 하고 싶나요?",
                placeholder: "예: 붓을 써서 안양의 인구수를 장부에 기록했을 것 같다."
            }
        },
        educationalFact: "구 서이면사무소는 1917년에 건립된 근대 행정 건물입니다. 이곳의 도구들은 오늘날 우리가 사용하는 사무용품들의 '조상'이며, 근대 안양의 생활상과 행정 변화를 보여주는 소중한 유산입니다."
    }
};