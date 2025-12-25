#!/bin/bash

# ダミーデータ作成スクリプト
# 業務A, B, C, D の4名に対して、2025/12のうち5日分のチェックリスト提出データを作成

API_URL="http://localhost:3000/api/workclock/checklist/submissions"
EMPLOYEE_ID="cmhawbiwd00028zu09znbrma6"

# ワーカーID
declare -A WORKERS
WORKERS[業務A]="cmi8cdlp4002p8zo42n81kead"
WORKERS[業務B]="cmi8ce0dy002r8zo4o71hyhkc"
WORKERS[業務C]="cmi8ceczr002t8zo4im3i6iq6"
WORKERS[業務D]="cmi8cf2ig002v8zo436xax6rg"

# 日付 (2025年12月の5日間)
DATES=("2025-12-20" "2025-12-21" "2025-12-22" "2025-12-23" "2025-12-24")

# ダミーテキスト
DUMMY_TEXTS=(
  "本日の作業は問題なく完了しました。備品は十分あります。"
  "フィルター交換を行いました。次回は2週間後です。"
  "ロビーの電球交換が必要です。発注依頼を出しました。"
  "窓ガラス清掃完了。特に問題ありません。"
  "トイレの清掃用具が不足しています。補充をお願いします。"
  "エアコンのフィルターが汚れていたため念入りに清掃しました。"
  "本日は特に問題なく作業を完了しました。"
  "休憩室のゴミ箱が壊れていました。報告します。"
  "床のワックスがけを行いました。乾燥に2時間必要です。"
  "入口付近の植物に水やりを行いました。"
)

# 各ワーカーに対して5日分のデータを作成
for WORKER_NAME in "${!WORKERS[@]}"; do
  WORKER_ID=${WORKERS[$WORKER_NAME]}
  echo "Creating data for $WORKER_NAME ($WORKER_ID)..."
  
  for i in "${!DATES[@]}"; do
    DATE=${DATES[$i]}
    TEXT_INDEX=$(( ($i + ${#WORKER_NAME}) % ${#DUMMY_TEXTS[@]} ))
    DUMMY_TEXT=${DUMMY_TEXTS[$TEXT_INDEX]}
    
    # ランダムな報酬 (0, 30, 50, 70のいずれか)
    REWARDS=(0 30 50 70)
    REWARD1=${REWARDS[$(( RANDOM % 4 ))]}
    REWARD2=${REWARDS[$(( RANDOM % 4 ))]}
    REWARD3=${REWARDS[$(( RANDOM % 4 ))]}
    
    # ランダムなチェック状態
    CHECKED1=$(( RANDOM % 2 ))
    CHECKED2=$(( RANDOM % 2 ))
    CHECKED3=$(( RANDOM % 2 ))
    
    # ヒヤリハットは10%の確率
    SAFETY_ALERT="false"
    if [ $(( RANDOM % 10 )) -eq 0 ]; then
      SAFETY_ALERT="true"
    fi
    
    # リクエストボディを作成
    BODY=$(cat <<EOF
{
  "workerId": "$WORKER_ID",
  "date": "$DATE",
  "memo": "$DUMMY_TEXT",
  "hasPhoto": false,
  "isSafetyAlert": $SAFETY_ALERT,
  "items": [
    {
      "title": "清掃完了確認",
      "reward": $REWARD1,
      "isMandatory": true,
      "isChecked": true,
      "isFreeText": false,
      "category": "清掃"
    },
    {
      "title": "備品チェック",
      "reward": $REWARD2,
      "isMandatory": true,
      "isChecked": $([ $CHECKED1 -eq 1 ] && echo "true" || echo "false"),
      "isFreeText": false,
      "category": "備品"
    },
    {
      "title": "特記事項",
      "reward": $REWARD3,
      "isMandatory": false,
      "isChecked": false,
      "isFreeText": true,
      "freeTextValue": "$DUMMY_TEXT",
      "category": "報告"
    }
  ]
}
EOF
)
    
    # API呼び出し
    RESULT=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-employee-id: $EMPLOYEE_ID" \
      -d "$BODY")
    
    if echo "$RESULT" | grep -q "error"; then
      echo "  ❌ Error for $WORKER_NAME on $DATE: $RESULT"
    else
      echo "  ✅ Created submission for $WORKER_NAME on $DATE"
    fi
  done
done

echo ""
echo "Done! Created checklist submissions for 4 workers x 5 days = 20 records."
