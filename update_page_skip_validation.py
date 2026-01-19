
import os

path = '/Users/ohsawa/Desktop/MySystem.WebData/HR-system/app/evaluations/entry/[userId]/[date]/page.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# 1. Update handleSave signature
updated_sig = False
for i, line in enumerate(lines[:500]):
    if 'const handleSave = async (tempThankYous?:' in line:
        lines[i] = "    const handleSave = async (tempThankYous?: any[], successMessage: string = '保存しました', skipValidation: boolean = false) => {\n"
        updated_sig = True
        print("Updated handleSave signature")
        break

if not updated_sig:
    print("Could not find handleSave signature used in previous step")

# 2. Update skipValidation check condition
updated_cond = False
for i, line in enumerate(lines[:500]):
    if 'if (missingMandatory) {' in line:
        lines[i] = line.replace('if (missingMandatory) {', 'if (missingMandatory && !skipValidation) {')
        updated_cond = True
        print("Updated mandatory check condition")
        break

if not updated_cond:
    print("Could not find missingMandatory check condition")

# 3. Update Send Button call
updated_send = False
for i, line in enumerate(lines):
    if "handleSave(newList, '送信しました')" in line:
        lines[i] = line.replace("handleSave(newList, '送信しました')", "handleSave(newList, '送信しました', true)")
        updated_send = True
        print("Updated Send Button call")

if not updated_send:
    print("Could not find Send Button call")

# 4. Update Delete Button call
updated_delete = False
for i, line in enumerate(lines):
    if "handleSave(newList, '削除しました')" in line:
        lines[i] = line.replace("handleSave(newList, '削除しました')", "handleSave(newList, '削除しました', true)")
        updated_delete = True
        print("Updated Delete Button call")

if not updated_delete:
        print("Could not find Delete Button call")

with open(path, 'w') as f:
    f.writelines(lines)
