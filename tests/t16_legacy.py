"""Dữ liệu bản cũ còn trong trình duyệt (kho chính và kho “dữ liệu mẫu”): hiện thông báo và đưa lên máy chủ được."""
from common import *
OLD = """([name, demo]) => new Promise((res, rej) => {
  const r = indexedDB.open(name, 1);
  r.onupgradeneeded = () => ['kv:k','products:code','records:id','images:id'].forEach(x => { const [n,k] = x.split(':'); r.result.createObjectStore(n, {keyPath: k}); });
  r.onsuccess = () => { const t = r.result.transaction(['kv','products','records'], 'readwrite');
    t.objectStore('products').put({code: demo ? 'DEMO-1' : 'OLD-1', name: demo ? 'Lọ nhập ở bản demo' : 'Lọ bản cũ', group: 'Lọ', size: '', glaze: 'Men lam thường', unit: 'chiếc', price: 123000, demo, ord: 1});
    t.objectStore('records').put({id: demo ? 'tpl_demo_1' : 'tpl_old', kind: 'template', name: demo ? 'Bộ của tôi (MẪU)' : 'Mẫu bản cũ', items: [], demo});
    t.objectStore('records').put({id: demo ? 'q_demo_x' : 'q_old', kind: 'quote', name: 'Báo giá', items: [], customer: {name: 'Anh Nam'}, quoteCode: demo ? 'BG1' : 'BG2'});
    t.objectStore('kv').put({k: 'meta', v: {groups: [], counters: {}, demo}});
    t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); };
})"""
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile5"), fresh=True)
    page.goto(BASE + "/favicon.png"); page.wait_for_timeout(200)
    page.evaluate(OLD, ["gom_vu_gia", False]); page.evaluate(OLD, ["gom_vu_gia_du_lieu_mau", True])
    page.goto(URL); page.wait_for_timeout(1200)
    page.click("#tab-data"); page.wait_for_timeout(800)
    print("thông báo:", page.eval_on_selector_all("#legacy-box .banner", "els=>els.map(e=>e.innerText.replace(/\\s+/g,' '))"))
    page.screenshot(path=f"{SHOT}/96_legacy.png")
    page.click("#legacy-box [data-db=gom_vu_gia_du_lieu_mau]"); page.wait_for_timeout(300)
    page.click(".modal-f button:has-text('Gộp')"); page.wait_for_timeout(1500)
    print("sau khi đưa bản demo:", page.evaluate("[S.products.get('DEMO-1')?.name, S.products.get('DEMO-1')?.demo, S.records.get('tpl_demo_1')?.name, S.records.has('q_demo_x'), S.products.size]"),
          page.locator("#legacy-box .banner").count())
    page.reload(); page.wait_for_timeout(1000); page.click("#tab-data"); page.wait_for_timeout(800)
    print("sau tải lại còn thông báo:", page.locator("#legacy-box [data-db]").evaluate_all("els=>els.map(e=>e.dataset.db)"),
          "kho cũ vẫn còn:", page.evaluate("indexedDB.databases().then(l=>l.map(d=>d.name).sort())"))
    # Nút “Khôi phục dữ liệu mẫu”: dùng được cả khi đã đưa lên trước đó (đồng nghiệp đã quay về dữ liệu thật)
    page.evaluate("DB.run(['products'],'readwrite',t=>t.objectStore('products').delete('DEMO-1'))"); page.reload(); page.wait_for_timeout(1000)
    page.click("#tab-data"); page.wait_for_timeout(600)
    page.click("[data-act=legacy-scan]"); page.wait_for_timeout(500)
    print("chọn kho:", page.eval_on_selector_all(".modal-f button", "els=>els.map(e=>e.textContent)"))
    page.screenshot(path=f"{SHOT}/97_legacy_pick.png")
    page.click(".modal-f button:has-text('Kho dữ liệu mẫu')"); page.wait_for_timeout(400)
    page.click(".modal-f button:has-text('Gộp')"); page.wait_for_timeout(1500)
    print("khôi phục lại:", page.evaluate("S.products.has('DEMO-1')"), toasts(page)[-1:])
    ctx.close()
    # Trình duyệt không có dữ liệu cũ: báo rõ cần mở đúng trình duyệt / địa chỉ
    ctx, page, errs2 = new_ctx(p, user_dir=os.path.join(OUT, "profile6"), fresh=True)
    page.goto(URL); page.wait_for_timeout(1000); page.click("#tab-data"); page.wait_for_timeout(500)
    page.click("[data-act=legacy-scan]"); page.wait_for_timeout(500)
    print("không có dữ liệu cũ:", toasts(page)[-1:])
    errs += errs2
    print("errs:", errs)
    ctx.close()
