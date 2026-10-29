from common import *
# Trang Mẫu ban thờ: tích chọn nhiều mẫu rồi xuất một file PDF gộp, mỗi mẫu bắt đầu ở trang mới
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile18"), fresh=True)
    page.goto(URL); page.wait_for_timeout(800)
    # Thêm hai mẫu: một mẫu ngắn và một mẫu dài (nhiều trang) để kiểm tra số trang của file gộp
    page.evaluate("""(async()=>{const base=[...S.records.values()].find(r=>r.kind==='template');
      const ps=sortProducts([...S.products.values()].filter(p=>p.price!=null)).slice(0,45);
      const mk=(name,items)=>{const c=clone(base); c.id=uid('tpl'); c.name=name; c.items=items; c.updatedAt=new Date().toISOString(); return c;};
      const line=(p,i)=>({lid:uid('l'),code:p.code,name:p.name,pattern:p.pattern,size:p.size,glaze:p.glaze,unit:p.unit,price:p.price,qty:(i%3)+1});
      for (const r of [mk('Mẫu ngắn GVGV-A', ps.slice(0,5).map(line)), mk('Mẫu dài GVGV-B', ps.map(line))]) {
        await DB.run(['records'],'readwrite',t=>t.objectStore('records').put(r)); S.records.set(r.id,r);
      }})()""")
    page.click("#tab-templates"); page.wait_for_timeout(400)
    print("số mẫu:", page.locator(".tcard").count(), "nút gộp tắt:", page.is_disabled("[data-act=pdf-sel]"))
    assert page.is_disabled("[data-act=pdf-sel]")

    # Chọn tất cả rồi bỏ một mẫu → ô “chọn tất cả” ở trạng thái lưng chừng
    page.check("#tpl-all"); page.wait_for_timeout(150)
    n_all = page.locator(".tcard.sel").count()
    page.locator(".tcard [data-sel]").first.uncheck(); page.wait_for_timeout(150)
    print("chọn tất cả:", n_all, "sau khi bỏ 1:", page.locator(".tcard.sel").count(), "lưng chừng:", page.evaluate("document.querySelector('#tpl-all').indeterminate"))
    assert n_all == page.locator(".tcard").count() and page.evaluate("document.querySelector('#tpl-all').indeterminate")

    # Bỏ chọn hết, rồi chọn theo thứ tự: mẫu dài trước, mẫu ngắn sau
    page.click("[data-act=sel-clear]"); page.wait_for_timeout(150)
    assert page.locator(".tcard.sel").count() == 0
    ids = page.evaluate("['Mẫu dài GVGV-B','Mẫu ngắn GVGV-A'].map(n=>[...S.records.values()].find(r=>r.name===n).id)")
    for i in ids:
        page.check(f"[data-sel='{i}']"); page.wait_for_timeout(150)
    print("nút:", page.text_content("[data-act=pdf-sel]"))
    assert page.evaluate("selectedTemplates().map(r=>r.name)") == ["Mẫu dài GVGV-B", "Mẫu ngắn GVGV-A"]
    page.screenshot(path=f"{SHOT}/18_templates_select.png")

    pages_long = page.evaluate(f"(async()=>{{const n=(await buildExport(S.records.get('{ids[0]}'),false)).length; document.querySelector('#xp-stage').innerHTML=''; return n;}})()")
    with page.expect_download(timeout=120000) as dl:
        page.click("[data-act=pdf-sel]")
    out = os.path.join(OUT, "merged.pdf")
    dl.value.save_as(out)
    print("tên file:", dl.value.suggested_filename)
    import fitz
    doc = fitz.open(out)
    print("trang mẫu dài:", pages_long, "trang file gộp:", len(doc))
    assert len(doc) == pages_long + 1 and all(abs(pg.rect.width - 595.28) < 1 for pg in doc)

    # Mẫu còn sản phẩm chưa có giá → chặn xuất gộp và nêu tên mẫu
    page.evaluate(f"S.records.get('{ids[1]}').items[0].price=null")
    page.click("[data-act=pdf-sel]"); page.wait_for_timeout(300)
    msg = page.inner_text(".modal-b")
    print("chặn:", msg[:120])
    assert "Mẫu ngắn GVGV-A" in msg
    page.click(".modal [data-close] >> nth=0")

    # Mobile: thanh chọn không tràn ngang
    page.set_viewport_size({"width": 375, "height": 812}); page.wait_for_timeout(200)
    print("tràn ngang:", page.evaluate("document.documentElement.scrollWidth > innerWidth"))
    page.screenshot(path=f"{SHOT}/18_templates_mobile.png")
    print("errs:", errs)
    assert not errs
    ctx.close()
