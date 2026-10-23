import os
import shutil
import time

src = r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (ZAG DIGITAL INDONESIA).docx"
targets = [
    r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP.docx",
    r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL_PENGEMBANGAN_APLIKASI_FITNESS_MEMBERSHIP_KAISAR_GYM.docx",
    r"c:\Users\shive\Documents\work\kaisar gym\PROPOSAL PENGEMBANGAN APLIKASI FITNESS MEMBERSHIP (KAISAR GYM).docx"
]

def try_sync():
    all_done = True
    for t in targets:
        try:
            shutil.copyfile(src, t)
            print(f"[OK] Synced to: {os.path.basename(t)}")
        except PermissionError:
            print(f"[LOCKED] {os.path.basename(t)} is still open in Word.")
            all_done = False
        except Exception as e:
            print(f"[ERROR] {os.path.basename(t)}: {e}")
            all_done = False
    return all_done

if __name__ == "__main__":
    try_sync()
