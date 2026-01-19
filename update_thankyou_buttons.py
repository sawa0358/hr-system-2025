
import os

path = '/Users/ohsawa/Desktop/MySystem.WebData/HR-system/app/evaluations/entry/[userId]/[date]/page.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# 1. Update Add Button specific part
# Finding the wrapper div
add_btn_start = -1
for i, line in enumerate(lines):
    if 'items-center gap-2' in line and 'justify-end' in line:
         # Double check context
         if i > 1000: 
            add_btn_start = i
            break

if add_btn_start != -1:
    # Find closing div
    # It might be 50 lines down because of the button definition
    end_idx = -1
    stack = 0
    # Simple logic: next line containing just </div> with indentation matches
    # But button content spans many lines.
    # Let's count indentation
    start_indent = len(lines[add_btn_start]) - len(lines[add_btn_start].lstrip())
    
    for j in range(add_btn_start + 1, len(lines)):
        curr_indent = len(lines[j]) - len(lines[j].lstrip())
        if lines[j].strip() == '</div>' and curr_indent == start_indent:
            end_idx = j
            break
            
    if end_idx != -1:
        new_content = """                                    <div className="flex justify-end items-center gap-2">
                                        <Button
                                            onClick={() => {
                                                if (!draftTyMessage.trim()) return;

                                                let toIds: string[] = []
                                                let type = draftTyRecipientType || 'individual'

                                                if (type === 'all') {
                                                    toIds = employees.filter((e: any) => e.id !== userId).map((e: any) => e.id)
                                                } else if (type === 'team') {
                                                    const teamEmpIds = employees.filter((e: any) => e.teamId === draftTyRecipient && e.id !== userId).map((e: any) => e.id)
                                                    if (teamEmpIds.length === 0) return;
                                                    toIds = teamEmpIds
                                                } else {
                                                    if (!draftTyRecipient) return;
                                                    toIds = [draftTyRecipient]
                                                }

                                                const newItem = {
                                                    id: crypto.randomUUID(),
                                                    to: toIds,
                                                    message: draftTyMessage,
                                                    recipientType: type
                                                }
                                                const newList = [...thankYouList, newItem]

                                                setThankYouList(newList)
                                                handleSave(newList, '送信しました')

                                                // Reset draft
                                                setDraftTyMessage("")
                                                setDraftTyRecipient("")
                                                setDraftTyRecipientType("individual")
                                            }}
                                            className="bg-pink-500 hover:bg-pink-600 text-white gap-2"
                                            disabled={!canEdit || !draftTyMessage.trim() || (draftTyRecipientType !== 'all' && (draftTyRecipientType === 'individual' || draftTyRecipientType === 'team') && !draftTyRecipient)}
                                        >
                                            <Send className="w-4 h-4 ml-0.5" />
                                            送信する
                                        </Button>
                                    </div>
"""
        lines[add_btn_start:end_idx+1] = [new_content]
        print("Updated Add Button to Send Button")
    else:
        print("Could not find closing div for Add Button")
else:
    print("Could not find Add Button start")

# 2. Update Delete Button logic
# Since valid lines array changed, we search again in list
delete_idx = -1
for i, line in enumerate(lines):
    if 'newList.splice(idx, 1)' in line:
        delete_idx = i
        break

if delete_idx != -1:
    # Next line is setThankYouList(newList)
    # Check if handleSave is already there
    if 'handleSave' not in lines[delete_idx+2]:
        indent = lines[delete_idx+1][:len(lines[delete_idx+1]) - len(lines[delete_idx+1].lstrip())]
        lines.insert(delete_idx+2, indent + "handleSave(newList, '削除しました')\n")
        print("Updated Delete Button logic")
    else:
        print("handleSave already present in Delete logic")
else:
    print("Could not find Delete Button logic")


with open(path, 'w') as f:
    f.writelines(lines)
