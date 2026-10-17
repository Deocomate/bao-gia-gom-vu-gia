"""Chạy lần lượt các kịch bản kiểm thử (chúng dùng chung hồ sơ trình duyệt nên phải chạy đúng thứ tự).

    python tools/build.py
    python tests/run_all.py            # tất cả
    python tests/run_all.py t1 t3      # chỉ một số file
"""
import glob, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
files = sorted(glob.glob(os.path.join(HERE, "t[0-9]*.py")), key=lambda f: int(re.match(r"t(\d+)", os.path.basename(f)).group(1)))
if len(sys.argv) > 1:
    files = [f for f in files if re.match(r"t\d+", os.path.basename(f)).group(0) in sys.argv[1:]]

env = dict(os.environ, PYTHONIOENCODING="utf-8")
failed = []
for f in files:
    name = os.path.basename(f)
    print(f"\n=== {name} ===", flush=True)
    r = subprocess.run([sys.executable, name], cwd=HERE, env=env)
    if r.returncode != 0:
        failed.append(name)

print("\nLỗi:" if failed else "\nXong, không có file nào lỗi.", " ".join(failed))
sys.exit(1 if failed else 0)
