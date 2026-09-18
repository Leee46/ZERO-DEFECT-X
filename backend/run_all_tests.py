import os
import sys
import time
import subprocess

def main():
    print("=" * 60)
    print("  ZERO-DEFECT X — AUTOMATED END-TO-END SUITE RUNNER")
    print("=" * 60)

    # 1. Start Laptop 2 Virtual Factory Simulator Server on port 8000
    sim_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "simulator.virtual_factory_server:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    # 2. Start Laptop 1 Backend Server on port 8001
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    time.sleep(3)

    try:
        print("\n--- RUNNING PHASE 4 TESTS ---")
        p4 = subprocess.run([sys.executable, "run_phase4_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)))

        print("\n--- RUNNING PHASE 5 TESTS ---")
        p5 = subprocess.run([sys.executable, "run_phase5_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)))

        print("\n--- RUNNING PHASE 6 TESTS ---")
        p6 = subprocess.run([sys.executable, "run_phase6_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)))

        if p4.returncode == 0 and p5.returncode == 0 and p6.returncode == 0:
            print("\n" + "=" * 60)
            print("  ALL SUITES (PHASE 4, PHASE 5, PHASE 6) PASSED 100%!")
            print("=" * 60)
        else:
            print(f"\nTest exit codes: P4={p4.returncode}, P5={p5.returncode}, P6={p6.returncode}")
    finally:
        sim_proc.terminate()
        backend_proc.terminate()

if __name__ == "__main__":
    main()
