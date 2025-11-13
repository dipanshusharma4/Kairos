#!/usr/bin/env python
"""Test script to verify imports work from app directory"""
import sys
from pathlib import Path

# Simulate running from app directory
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir.parent))

print("Testing imports from app directory...")
try:
    # This simulates what uvicorn does: import main
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", app_dir / "main.py")
    main_module = importlib.util.module_from_spec(spec)
    sys.modules["main"] = main_module
    spec.loader.exec_module(main_module)
    print("✓ Successfully imported main module")
    print(f"✓ App created: {main_module.app}")
    print("✓ All imports working correctly!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

