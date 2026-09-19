import os
import sys
import time
import subprocess

def main():
    print("=" * 60)
    print("  ZERO-DEFECT X — AUTOMATED END-TO-END SUITE RUNNER")
    print("=" * 60)

    env = os.environ.copy()
    env["LAPTOP2_URL"] = "http://127.0.0.1:8001"

    # 1. Start Virtual Factory Simulator on port 8001
    sim_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "simulator.virtual_factory_server:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    # 2. Start ZERO-DEFECT X Backend on port 8000
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        env=env
    )

    time.sleep(3)

    try:
        print("\n--- RUNNING PHASE 4 TESTS ---")
        p4 = subprocess.run([sys.executable, "run_phase4_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)), env=env)

        print("\n--- RUNNING PHASE 5 TESTS ---")
        p5 = subprocess.run([sys.executable, "run_phase5_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)), env=env)

        print("\n--- RUNNING PHASE 6 TESTS ---")
        p6 = subprocess.run([sys.executable, "run_phase6_tests.py"], cwd=os.path.dirname(os.path.abspath(__file__)), env=env)

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
