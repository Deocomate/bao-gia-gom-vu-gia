from common import *
_need = [os.path.join(FIX, "edge.csv"), os.path.join(FIX, "Bang_gia_mau_Gom_Vu_Gia.xls")]
if not all(os.path.exists(f) for f in _need):
    raise SystemExit("BỎ QUA: thiếu file mẫu trong tests/fixtures/ (edge.csv, Bang_gia_mau_Gom_Vu_Gia.xls)")
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p)  # dùng tiếp hồ sơ đã có 236 sản phẩm
    page.goto(URL); page.wait_for_timeout(800)
    page.click("#tab-prices"); page.wait_for_timeout(300)
    # CSV
    page.click("#view-prices [data-act=import] >> nth=0")
    page.set_input_files("#imp-file", os.path.join(FIX, "edge.csv"))
    page.wait_for_selector("#imp-hdr")
    page.click("#imp-next")
    print("ghép:", page.eval_on_selector_all("[data-map]", "els=>els.map(e=>e.dataset.map+'='+e.options[e.selectedIndex].text)"))
    page.click("#imp-next"); page.wait_for_selector("table.prev")
    rows = page.eval_on_selector_all("table.prev tbody tr", "els=>els.map(e=>(e.querySelector('input')&&e.querySelector('input').checked?'[x] ':'[ ] ')+(e.querySelector('input')&&e.querySelector('input').disabled?'(khóa) ':'')+e.innerText.replace(/\\s+/g,' '))")
    for r in rows: print(" ", r)
    page.screenshot(path=f"{SHOT}/06_csv_review.png", full_page=True)
    page.click("#imp-next"); page.wait_for_timeout(500)
    print("toasts:", toasts(page))
    print(page.evaluate("['X1','X2','X3','X4','BH01-D20-VV','BH01-D18-VV'].map(c=>c+':'+JSON.stringify(S.products.get(c)&&[S.products.get(c).name,S.products.get(c).price,S.products.get(c).unit]))"))
    print("không mã:", page.evaluate("[...S.products.values()].filter(p=>p.name==='Đĩa thử không mã').map(p=>p.code+':'+p.price)"))
    # XLS
    page.click("#view-prices [data-act=import] >> nth=0")
    page.set_input_files("#imp-file", os.path.join(FIX, "Bang_gia_mau_Gom_Vu_Gia.xls"))
    page.wait_for_selector("#imp-hdr")
    print("xls sheet:", page.eval_on_selector("#imp-sheet", "s=>s.options[s.selectedIndex].text"))
    page.click("#imp-next"); page.click("#imp-next"); page.wait_for_selector("table.prev")
    print("xls tóm tắt:", page.eval_on_selector_all(".wsteps ~ .sumrow .gchip", "els=>els.map(e=>e.textContent)"))
    page.click("[data-f=price]")
    print("xls đổi giá:", page.eval_on_selector_all("table.prev tbody tr", "els=>els.map(e=>e.innerText.replace(/\\s+/g,' ').slice(0,150))"))
    page.click("[data-close] >> nth=0")
    print("errs:", errs)
    ctx.close()
