const API_URL = "http://localhost:3000/api/workclock/checklist/submissions";
const EMPLOYEE_ID = "cmhawbiwd00028zu09znbrma6";

const WORKERS = [
    { id: "cmi8cdlp4002p8zo42n81kead", name: "業務A" },
    { id: "cmi8ce0dy002r8zo4o71hyhkc", name: "業務B" },
    { id: "cmi8ceczr002t8zo4im3i6iq6", name: "業務C" },
    { id: "cmi8cf2ig002v8zo436xax6rg", name: "業務D" },
];

const DATES = ["2025-12-20", "2025-12-21", "2025-12-22", "2025-12-23", "2025-12-24"];

// 入札パターン1のチェックリスト項目
const CHECKLIST_ITEMS = [
    { title: "締切日の確認と対処をした", reward: 5, isMandatory: true, isFreeText: false },
    { title: "案件の同等品を3件申請した", reward: 10, isMandatory: false, isFreeText: false },
    { title: "入札ステップへ3件まわした", reward: 10, isMandatory: false, isFreeText: false },
    { title: "入札ステップへ5件まわした", reward: 10, isMandatory: false, isFreeText: false },
    { title: "test", reward: 100, isMandatory: false, isFreeText: false },
    { title: "test111", reward: 200, isMandatory: false, isFreeText: true }, // 自由項目欄
];

// 自由項目欄のダミーテキスト
const DUMMY_TEXTS = [
    "本日の作業は問題なく完了しました。備品は十分あります。",
    "フィルター交換を行いました。次回は2週間後です。",
    "ロビーの電球交換が必要です。発注依頼を出しました。",
    "窓ガラス清掃完了。特に問題ありません。",
    "トイレの清掃用具が不足しています。補充をお願いします。",
    "エアコンのフィルターが汚れていたため念入りに清掃しました。",
    "本日は特に問題なく作業を完了しました。",
    "休憩室のゴミ箱が壊れていました。報告します。",
    "床のワックスがけを行いました。乾燥に2時間必要です。",
    "入口付近の植物に水やりを行いました。",
    "会議室の清掃を重点的に行いました。次回の会議に備えます。",
    "エレベーター周辺の清掃完了。指紋汚れを拭き取りました。",
    "給湯室の排水口のつまりを解消しました。",
    "窓際のブラインドを清掃しました。埃が溜まっていました。",
    "トイレットペーパーを3ロール補充しました。",
    "非常口付近の障害物を移動しました。安全確保のため。",
    "コピー機のトナーが残り少なくなっています。発注をお願いします。",
    "天井の蛍光灯がチカチカしています。交換が必要です。",
    "応接室のソファーにシミがありました。クリーニング推奨。",
    "廊下のワックス剥がれが目立ちます。補修をお勧めします。",
];

async function createDummyData() {
    console.log("Creating dummy checklist data with correct pattern...\n");

    let textIndex = 0;

    for (const worker of WORKERS) {
        console.log(`Creating data for ${worker.name}...`);

        for (let i = 0; i < DATES.length; i++) {
            const date = DATES[i];
            const dummyText = DUMMY_TEXTS[textIndex % DUMMY_TEXTS.length];
            textIndex++;

            // 各項目のチェック状態をランダムに決定
            const items = CHECKLIST_ITEMS.map(item => {
                const isChecked = item.isFreeText ? false : (Math.random() > 0.2); // 80%でチェック
                return {
                    title: item.title,
                    reward: item.reward,
                    isMandatory: item.isMandatory,
                    isChecked: isChecked,
                    isFreeText: item.isFreeText,
                    freeTextValue: item.isFreeText ? dummyText : null,
                    category: null
                };
            });

            const isSafetyAlert = Math.random() < 0.1; // 10%の確率でヒヤリハット

            const body = {
                workerId: worker.id,
                date: date,
                memo: "",
                hasPhoto: false,
                isSafetyAlert: isSafetyAlert,
                items: items
            };

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-employee-id": EMPLOYEE_ID
                    },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    console.log(`  ✅ Created for ${worker.name} on ${date} (自由欄: "${dummyText.substring(0, 20)}...")`);
                } else {
                    const error = await response.json();
                    console.log(`  ❌ Error for ${worker.name} on ${date}:`, error);
                }
            } catch (error) {
                console.log(`  ❌ Network error for ${worker.name} on ${date}:`, error);
            }
        }
    }

    console.log("\n✅ Done! Created checklist submissions for 4 workers x 5 days = 20 records.");
    console.log("Each record has the 'test111' free text field filled with dummy text.");
}

createDummyData();
