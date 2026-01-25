import os
import shutil
from pathlib import Path

# Define base paths
root = Path(r"E:\Development\aluminify")
components_dashboard = root / "components" / "dashboard"
app_shared_ui = root / "app" / "shared" / "components" / "ui"
dashboard_module = root / "app" / "[tenant]" / "(dashboard)" / "dashboard" / "components"
professor_module = root / "app" / "[tenant]" / "(dashboard)" / "professor" / "dashboard" / "components"

# Create destination directories
dashboard_module.mkdir(parents=True, exist_ok=True)
(dashboard_module / "institution").mkdir(parents=True, exist_ok=True)
professor_module.mkdir(parents=True, exist_ok=True)

print("Step 1: Moving UI components to shared...")
# Move shared UI components
shared_files = [
    ("shared/ranking-list.tsx", "ranking-list.tsx"),
    ("shared/stats-card.tsx", "stats-card.tsx"),
]
for src_rel, dest_name in shared_files:
    src = components_dashboard / src_rel
    dest = app_shared_ui / dest_name
    if src.exists():
        shutil.copy2(src, dest)
        print(f"  ✓ Copied {src_rel} to shared/ui")

print("\nStep 2: Moving institution components...")
# Move institution components
institution_src = components_dashboard / "institution"
institution_dest = dashboard_module / "institution"
if institution_src.exists():
    for item in institution_src.iterdir():
        if item.is_file():
            shutil.copy2(item, institution_dest / item.name)
            print(f"  ✓ Copied {item.name}")

print("\nStep 3: Moving professor components...")
# Move professor components
professor_src = components_dashboard / "professor"
if professor_src.exists():
    for item in professor_src.iterdir():
        if item.is_file():
            shutil.copy2(item, professor_module / item.name)
            print(f"  ✓ Copied {item.name}")

print("\nStep 4: Moving main dashboard components...")
# Move main dashboard components
main_files = [
    "dashboard-header.tsx",
    "dashboard-skeleton.tsx",
    "organization-switcher.tsx",
]
for filename in main_files:
    src = components_dashboard / filename
    dest = dashboard_module / filename
    if src.exists():
        shutil.copy2(src, dest)
        print(f"  ✓ Copied {filename}")

print("\n✅ All files copied successfully!")
print(f"\nNext step: Update imports and remove old components/dashboard directory")
