import shutil
from pathlib import Path

# Define paths
root = Path(r"E:\Development\aluminify")
src = root / "backend" / "services" / "dashboard-analytics"
dest = root / "app" / "[tenant]" / "(dashboard)" / "dashboard" / "services"

# Create destination if it doesn't exist
dest.mkdir(parents=True, exist_ok=True)

# Copy all files from dashboard-analytics to dashboard/services
if src.exists():
    for item in src.iterdir():
        if item.is_file():
            shutil.copy2(item, dest / item.name)
            print(f"✓ Copied {item.name}")
    print(f"\n✅ All dashboard-analytics files moved to dashboard/services")
else:
    print(f"❌ Source directory not found: {src}")
