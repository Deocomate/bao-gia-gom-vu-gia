# Dữ liệu chép từ hai PDF "Bảng giá GVG - Men rạn.pdf" và "Bảng giá GVG - Men hoàng thổ & Hoàng thổ vẽ vàng.pdf" (11/2026).
# Mã sản phẩm giữ đúng cột "Mã SP" của PDF. Các dòng cùng tên (khác kích thước) gộp thành một sản phẩm nhiều quy cách.
# Men rạn – mỗi sản phẩm: (mục PDF, nhóm, tên, họa tiết, ĐVT, [(mã, quy cách, giá, ghi chú[, ĐVT riêng])])
# Hoàng thổ – mỗi sản phẩm: (mục PDF, nhóm, tên, họa tiết, ĐVT, [(mã HT, mã HT vẽ vàng, quy cách, giá HT, giá HT vẽ vàng, ghi chú[, ĐVT riêng])])
# Giá None = PDF ghi giá nghi sai: để trống và ngừng dùng cho tới khi xác nhận.
MR = "Men rạn"
HT = "Men hoàng thổ"
HV = "Men hoàng thổ vẽ vàng"


def h(code, cm, price, note="", unit=None):
    """Quy cách theo chiều cao: H60, ghi chú H:60cm."""
    return (code, f"H{cm}", price, "; ".join(x for x in [f"H:{cm}cm", note] if x), unit)


def d(code, cm, price, note="", unit=None):
    """Quy cách theo đường kính: Ø30."""
    return (code, f"Ø{cm}", price, note, unit)


def lit(code, liters, price, cm=None, note=""):
    """Chóe theo dung tích: 25L, ghi chú H:62cm - 25L."""
    return (code, f"{liters}L", price, "; ".join(x for x in [f"H:{cm}cm - {liters}L" if cm else "", note] if x), None)


def s(code, size, price, note="", unit=None):
    return (code, size, price, note, unit)


def pdf(name):
    return f"PDF ghi “{name}”"


LB = "Lọ lộc bình"
PT = "Đồ phong thủy"

MEN_RAN = [
 ("Bộ đỉnh hạc", "Đỉnh hạc", "Bộ đỉnh hạc số 1", "", "bộ", [
   h("MR059", 75, 16250000, "đế cao"), h("MR060", 68, 15750000)]),
 ("Bộ đỉnh hạc", "Đỉnh hạc", "Bộ đỉnh hạc số 2", "", "bộ", [
   h("MR061", 70, 14500000, "đế cao"), h("MR062", 63, 13750000)]),
 ("Bát hương", "Bát hương", "Bát hương", "", "chiếc", [
   d("MR001", 30, 2250000), d("MR002", 27, 1750000), d("MR003", 25, 1375000), d("MR004", 22, 1075000),
   d("MR005", 20, 875000), d("MR006", 18, 775000), d("MR007", 16, 600000), d("MR008", 14, 450000)]),
 ("Đế sứ bát hương", "Đế sứ bát hương", "Đế bát hương", "", "chiếc", [
   d("MR009", 30, 750000), d("MR010", 27, 675000), d("MR011", 25, 625000), d("MR012", 22, 500000),
   d("MR013", 20, 450000), d("MR014", 18, 400000), d("MR015", 16, 325000), d("MR016", 14, 300000)]),
 # IV Lộc bình (PDF viết lẫn "Lộc bình" / "Lục bình", ở đây thống nhất "Lộc bình")
 ("Lộc bình", LB, "Lọ lộc bình Công Đào", "Công đào", "đôi", [
   h("MR075", 70, 6250000), h("MR081", 60, 4500000), h("MR085", 50, 3000000), h("MR088", 46, 2500000),
   h("MR091", 38, 1750000), h("MR094", 35, 1500000), h("MR097", 32, 1250000), h("MR099", 26, 1000000),
   h("MR100", 24, 875000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào viền lá", "Công đào", "đôi", [
   h("MR078", 60, 5000000), h("MR084", 50, 3500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào viền lá hoa kênh", "Công đào", "đôi", [
   h("MR077", 60, 5500000), h("MR083", 50, 4000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào viền lá kỹ kênh đuôi 3D", "Công đào", "đôi", [
   h("MR076", 60, 8750000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào viền lá kênh đuôi 3D", "Công đào", "đôi", [
   h("MR082", 50, 5500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào kỹ kênh đuôi 3D", "Công đào", "đôi", [
   h("MR079", 60, 7500000), h("MR089", 46, 5000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào kênh đuôi 3D", "Công đào", "đôi", [
   h("MR086", 50, 5000000), h("MR092", 38, 3750000, pdf("Lọ Lục Bình Công Kênh Đuôi 3D - 38p")), h("MR095", 35, 3000000),
   h("MR139", 125, 37500000), h("MR141", 140, 45000000), h("MR140", 160, 55000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào hoa kênh", "Công đào", "đôi", [
   h("MR080", 60, 5000000), h("MR087", 50, 3500000), h("MR090", 46, 3000000),
   h("MR093", 38, 2250000, pdf("Lọ Lục Bình Công Hoa Kênh - 38p")), h("MR096", 35, 2000000), h("MR098", 32, 1750000),
   h("MR137", 140, 35000000), h("MR138", 160, 42500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Rồng", "Rồng", "đôi", [
   h("MR101", 60, 5000000), h("MR102", 50, 3000000), h("MR103", 46, 3000000), h("MR104", 38, 1750000),
   h("MR105", 35, 1500000), h("MR106", 32, 1250000), h("MR107", 26, 1000000), h("MR108", 24, 875000)]),
 ("Lộc bình", LB, "Lọ lộc bình Sen", "Sen", "đôi", [
   h("MR115", 50, 2500000), h("MR114", 46, 2250000), h("MR113", 38, 1625000), h("MR112", 35, 1500000),
   h("MR111", 32, 1250000), h("MR110", 26, 900000), h("MR109", 24, 750000)]),
 ("Lộc bình", LB, "Lọ lượn Công Đào/Rồng", "", "đôi", [
   h("MR123", 35, 1500000), h("MR122", 30, 1250000), h("MR121", 26, 1000000), h("MR120", 24, 875000)]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ/Phúc Đức", "", "đôi", [
   h("MR124", 60, 6250000), h("MR127", 55, 5000000), h("MR132", 46, 3750000),
   h("MR152", 120, 35000000), h("MR153", 140, 50000000), h("MR154", 165, 65000000, "bụng 60cm")]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ kênh đuôi 3D", "", "đôi", [
   h("MR125", 60, 8750000), h("MR128", 55, 7500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ/Phúc Đức kênh đuôi", "", "đôi", [
   h("MR130", 46, 6250000)]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ hoa kênh", "", "đôi", [
   h("MR126", 60, 7000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ/Phúc Đức hoa kênh", "", "đôi", [
   h("MR129", 55, 6250000), h("MR131", 46, 4500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Tứ Quý kênh đuôi", "", "đôi", [
   h("MR133", 140, 32500000), h("MR134", 160, 40000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Tứ Quý công thường", "", "đôi", [
   h("MR135", 140, 30000000), h("MR136", 160, 37500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Tứ Cảnh kỹ", "", "đôi", [
   h("MR142", 120, 30000000), h("MR144", 140, 47500000), h("MR143", 160, 62500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Tứ Cảnh kênh đuôi cổ Phúc Đức", "", "đôi", [
   h("MR145", 140, 40000000), h("MR146", 160, 45000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Tứ Cảnh đuôi thường cổ Phúc Đức", "", "đôi", [
   h("MR147", 140, 32500000), h("MR148", 160, 40000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Lộc Thọ/Phúc Đức uyên ương", "", "đôi", [
   h("MR149", 120, 50000000), h("MR150", 140, 60000000), h("MR151", 165, 75000000, "bụng 60cm")]),
 ("Lộc bình", LB, "Lọ lộc bình Phúc Đức cửu ngư hoa kênh", "", "đôi", [
   h("MR155", 140, 40000000), h("MR156", 160, 45000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào/Tứ Cảnh nâu thường (Xóm 4)", "", "đôi", [
   h("MR157", 90, 10000000), h("MR158", 120, 17500000), h("MR159", 140, 22500000), h("MR160", 160, 27500000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào thường bổ khung chân (Xóm 4)", "Công đào", "đôi", [
   h("MR161", 120, 20000000), h("MR162", 140, 25000000), h("MR163", 160, 30000000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào/Tứ Cảnh vàng thường (Xóm 4)", "", "đôi", [
   h("MR164", 90, 8750000), h("MR165", 120, 12500000), h("MR166", 140, 15000000), h("MR167", 160, 17500000)]),
 ("Lộc bình", "Đế sứ lộc bình", "Đế sứ lộc bình", "", "chiếc", [
   d("MR275", 23, 625000), d("MR274", 20, 450000), d("MR273", 18, 400000), d("MR272", 16, 375000),
   d("MR271", 14, 350000), d("MR270", 12, 300000), d("MR269", 10, 225000)]),
 ("Lọ hoa", LB, "Lọ lượn sen", "Sen", "đôi", [
   h("MR119", 35, 1500000), h("MR118", 30, 1250000), h("MR117", 26, 900000), h("MR116", 24, 750000)]),
 ("Chóe thờ", "Chóe", "Chóe rồng", "Rồng", "chiếc", [
   s("MR024", "S1", 500000, "H:26cm"), s("MR025", "S2", 375000, "H:19cm"), s("MR026", "S3", 325000, "H:16cm")]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào kỹ kênh đuôi 3D", "Công đào", "đôi", [
   lit("MR237", 30, 18750000), lit("MR234", 25, 16250000)]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào kỹ", "Công đào", "đôi", [
   lit("MR243", 50, 20000000), lit("MR240", 40, 17500000), lit("MR236", 30, 15000000), lit("MR235", 25, 13750000)]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào kênh đuôi 3D", "Công đào", "đôi", [
   lit("MR242", 50, 25000000), lit("MR241", 40, 21250000)]),
 ("Chóe thờ", "Chóe", "Chóe Tứ Cảnh kỹ", "", "đôi", [
   lit("MR238", 50, 20000000), lit("MR239", 30, 15000000)]),
 ("Chóe thờ", "Chóe", "Chóe Phúc Đức/Phúc Lộc Thọ", "", "đôi", [
   lit("MR246", 90, 30000000), lit("MR244", 50, 22500000)]),
 ("Chóe thờ", "Chóe", "Chóe Phúc Đức/Phúc Lộc Thọ kênh đuôi 3D", "", "đôi", [
   lit("MR247", 90, 37500000), lit("MR245", 50, 25000000)]),
 ("Chóe thờ", "Chóe", "Chóe sen cá", "Sen", "đôi", [
   lit("MR255", 25, 6250000, 62), lit("MR254", 20, 5500000, 56), lit("MR253", 15, 5000000, 53),
   lit("MR252", 10, 4500000, 50), lit("MR251", 7, 3500000, 42), lit("MR250", 5, 2750000, 38)]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào sen hoa kênh (núm đào)", "Công đào", "đôi", [
   lit("MR261", 25, 8750000, 62), lit("MR260", 20, 7500000, 56), lit("MR259", 15, 6750000, 53),
   lit("MR258", 10, 5750000, 50), lit("MR257", 7, 4250000, 42), lit("MR256", 5, 3750000, 38)]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào sen kênh đuôi (núm đào)", "Công đào", "đôi", [
   lit("MR265", 25, 11250000, 62), lit("MR264", 20, 10000000, 56), lit("MR263", 15, 9250000, 53),
   lit("MR262", 10, 8250000, 50)]),
 ("Chóe thờ", "Chóe", "Chóe Công Đào sen kênh đuôi (núm nghê)", "Công đào", "đôi", [
   lit("MR268", 25, 13750000, 62), lit("MR267", 20, 12500000, 56), lit("MR266", 15, 11750000, 53)]),
 ("Mâm bồng – Đĩa sen", "Mâm bồng", "Mâm bồng rồng/sen", "Rồng/Sen", "chiếc", [
   d("MR017", 38, 1050000), d("MR018", 32, 875000), d("MR019", 30, 750000), d("MR020", 28, 625000),
   d("MR021", 25, 550000), d("MR022", 23, 500000), d("MR023", 19, 450000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ 3 ngai rồng/sen", "Rồng/Sen", "bộ", [s("MR034", "", 400000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ 5 ngai rồng/sen", "Rồng/Sen", "bộ", [s("MR035", "", 450000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ cong 3 rồng/sen", "Rồng/Sen", "bộ", [s("MR036", "", 325000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ cong 5 rồng/sen", "Rồng/Sen", "bộ", [s("MR037", "", 400000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Chén thờ", "", "chiếc", [s("MR057", "", 37500)]),
 ("Bát sâm", "Bát trà sâm", "Bát sâm", "", "chiếc", [s("MR042", "S1", 250000), s("MR043", "S2", 175000)]),
 ("Nậm rượu – Bộ rượu cúng", "Nậm rượu", "Nậm 1 bầu", "", "chiếc", [
   s("MR027", "S1", 450000, "H:24cm"), s("MR028", "S2", 425000, "H:22cm"), s("MR029", "S3", 350000, "H:18cm")]),
 ("Ống hương", "Ống hương", "Ống hương", "", "chiếc", [
   s("MR030", "S1", 450000, "H:24cm"), s("MR031", "S2", 400000, "H:20cm")]),
 ("Hũ phật thủ", "Hũ phật thủ", "Ly phật thủ", "", "chiếc", [s("MR067", "S1", 375000), s("MR068", "S2", 250000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn váy tròn rồng/sen", "Rồng/Sen", "chiếc", [
   s("MR044", "S1", 400000), s("MR045", "S2", 325000), s("MR046", "S3", 250000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn váy vuông sen/rồng", "Rồng/Sen", "chiếc", [
   s("MR047", "S1", 400000), s("MR048", "S2", 325000), s("MR049", "S3", 250000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn nến rồng/sen", "Rồng/Sen", "chiếc", [s("MR050", "S1", 800000), s("MR051", "S2", 675000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn chân đồng", "", "chiếc", [s("MR052", "", 725000)]),
 ("Bộ trà thờ", "Bộ trà", "Bộ ấm chén 5", "", "bộ", [s("MR038", "", 500000)]),
 ("Bộ trà thờ", "Bộ trà", "Bộ ấm chén 3", "", "bộ", [s("MR039", "", 425000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Chân nến", "", "chiếc", [s("MR040", "S1", 200000), s("MR041", "S2", 100000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Đế cau chân cao", "", "chiếc", [d("MR053", 16, 250000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Đĩa trầu", "", "chiếc", [d("MR054", 16, 250000), d("MR055", 14, 200000), d("MR056", 12, 175000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Chân nến ngũ sự", "", "đôi", [
   h("MR063", 50, 3750000), h("MR064", 45, 3250000), h("MR065", 40, 2500000), h("MR066", 32, 2000000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát cúng sen", "Sen", "chiếc", [s("MR032", "", 87500)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát cúng rồng", "Rồng", "chiếc", [s("MR033", "", 137500)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Đũa cúng", "", "bộ", [s("MR058", "", 250000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bộ mâm cúng hoa mặt trời", "", "bộ", [
   d("MR072", 55, 3750000), d("MR073", 45, 2750000, "PDF ghi ĐVT chiếc", "chiếc")]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát đựng gà", "", "chiếc", [s("MR074", "", 875000)]),
 ("Đài thờ", "Đài thờ", "Đài thờ sen (bộ 3)", "Sen", "bộ", [h("MR069", 26, 3750000)]),
 ("Bát thả hoa", "Bát thả hoa", "Bát thả hoa Minh Đường", "", "chiếc", [d("MR070", 25, 625000), d("MR071", 20, 500000)]),
 # XIX Đồ phong thủy: nhóm theo tiểu mục của PDF
 (PT, "Bình hút lộc", "Bình hút lộc Công Đào kênh đuôi 3D", "Công đào", "chiếc", [
   s("MR168", "S1 (H38)", 6500000, "H:38cm"), s("MR169", "S2 (H35)", 5250000, "H:35cm"),
   s("MR170", "S3 (H30)", 4750000, "H:30cm"), s("MR171", "S4 (H26)", 3000000, "H:26cm")]),
 (PT, "Bình hút lộc", "Bình hút lộc (Bát Mã/Thuận Buồm/Công Đào)", "", "chiếc", [
   s("MR172", "S1 (H38)", 4750000, "H:38cm"), s("MR173", "S2 (H35)", 3750000, "H:35cm"),
   s("MR174", "S3 (H30)", 2750000, "H:30cm; " + pdf("Bình Hút Lộc 30p ( Bát Mã / Thuận Buồm / Công Đào/Sen Cá ) - Số 3")),
   s("MR175", "S4 (H26)", 1625000, "H:26cm"), s("MR176", "S5 (H24)", 1125000, "H:24cm"),
   s("MR177", "S6 (H20)", 875000, "H:20cm"), s("MR178", "S7 (H18)", 625000, "H:18cm")]),
 (PT, "Bình hút lộc", "Bình hút lộc men màu (Bát Mã/Thuận Buồm/Công Đào)", "", "chiếc", [
   s("MR179", "S1 (H38)", 4875000, "H:38cm"), s("MR180", "S2 (H35)", 3875000, "H:35cm"),
   s("MR181", "S3 (H30)", 2875000, "H:30cm"), s("MR182", "S4 (H26)", 1750000, "H:26cm"),
   s("MR183", "S5 (H24)", 1250000, "H:24cm"), s("MR184", "S6 (H18)", 1000000, "H:18cm"),
   s("MR185", "S7 (H20)", 750000, "H:20cm")]),
 (PT, "Bình mai", "Bình mai Thuận Buồm", "", "chiếc", [h("MR186", 74, 10000000), h("MR190", 56, 4000000)]),
 (PT, "Bình mai", "Bình mai Công Đào vẽ vàng kênh đuôi", "Công đào", "chiếc", [h("MR187", 62, 8750000)]),
 (PT, "Bình mai", "Bình mai Công Đào", "Công đào", "chiếc", [h("MR188", 64, 6250000)]),
 (PT, "Bình mai", "Bình mai Bát Mã", "", "chiếc", [h("MR189", 58, 4500000)]),
 (PT, "Bình mai", "Bình mai Diên Niên Tùng Hạc", "", "chiếc", [h("MR191", 50, 3500000)]),
 (PT, "Bình mai", "Bình mai Thuận Buồm/Công Đào/Bát Mã", "", "chiếc", [
   h("MR192", 50, 3750000), h("MR193", 45, 3250000), h("MR194", 40, 2750000), h("MR195", 33, 2000000), h("MR196", 31, 1500000)]),
 (PT, "Bình mai", "Bình mai Công Đào kênh đuôi 3D", "Công đào", "chiếc", [
   h("MR197", 50, 5000000), h("MR198", 45, 4500000), h("MR199", 40, 3750000), h("MR200", 35, 3250000), h("MR201", 31, 2500000)]),
 (PT, "Bình tỏi", "Tỏi Tứ Cảnh", "", "chiếc", [
   s("MR202", "S1 (H62)", 5500000, "H:62cm"), s("MR203", "S2 (H52)", 3750000, "H:52cm"), s("MR204", "S3 (H48)", 3250000, "H:48cm")]),
 (PT, "Bình tỏi", "Tỏi cổ thẳng Tứ Cảnh kỹ", "", "chiếc", [h("MR205", 70, 10000000)]),
 (PT, "Bình tỏi", "Tỏi Công Đào kênh đuôi 3D", "Công đào", "chiếc", [
   s("MR217", "H80", 16250000, "H:80cm"), s("MR206", "S1 (H60)", 7500000, "H:60cm"),
   s("MR209", "S2 (H52)", 6250000, "H:52cm"), s("MR212", "S3 (H45)", 4500000, "H:45cm")]),
 (PT, "Bình tỏi", "Tỏi Công Đào", "Công đào", "chiếc", [
   s("MR207", "S1 (H60)", 4500000, "H:60cm"), s("MR210", "S2 (H52)", 3250000, "H:52cm"), s("MR213", "S3 (H45)", 2000000, "H:45cm")]),
 (PT, "Bình tỏi", "Tỏi Công Đào hoa kênh", "Công đào", "chiếc", [
   s("MR218", "H80", 13750000, "H:80cm"), s("MR208", "S1 (H60)", 5500000, "H:60cm"),
   s("MR211", "S2 (H52)", 4000000, "H:52cm"), s("MR214", "S3 (H45)", 2500000, "H:45cm")]),
 (PT, "Bình tỏi", "Tỏi cổ thẳng Công Đào kênh đuôi 3D", "Công đào", "chiếc", [h("MR215", 70, 10000000)]),
 (PT, "Bình tỏi", "Tỏi cổ thẳng Công Đào", "Công đào", "chiếc", [h("MR216", 70, 7500000)]),
 (PT, "Bình tỳ bà", "Tỳ bà nhỏ Công Đào kênh đuôi 3D", "Công đào", "chiếc", [h("MR219", 38, 3000000)]),
 (PT, "Bình tỳ bà", "Tỳ bà nhỏ Công Đào hoa kênh", "Công đào", "chiếc", [h("MR220", 38, 2000000)]),
 (PT, "Bình tỳ bà", "Tỳ bà nhỏ Công Đào", "Công đào", "chiếc", [h("MR221", 38, 1500000)]),
 (PT, "Bình tỳ bà", "Tỳ bà Công Đào hoa kênh", "Công đào", "chiếc", [h("MR225", 54, 3750000), h("MR222", 45, 2500000)]),
 (PT, "Bình tỳ bà", "Tỳ bà Công Đào kênh đuôi 3D", "Công đào", "chiếc", [h("MR224", 54, 6250000), h("MR223", 45, 4500000)]),
 (PT, "Bình tỳ bà", "Tỳ bà Công Đào kênh đuôi", "Công đào", "chiếc", [h("MR226", 68, 10000000)]),
 (PT, "Bình tỳ bà", "Tỳ bà Công Đào", "Công đào", "chiếc", [h("MR227", 68, 7500000)]),
 (PT, "Hồ lô", "Hồ lô (Thuận Buồm/Bát Mã/Công Đào)", "", "chiếc", [s("MR228", "H33 - 2L", 1500000, "H:33cm - 2L")]),
 (PT, "Bảo bình", "Bảo bình Diên Niên Tùng Hạc", "", "chiếc", [h("MR229", 90, 11250000)]),
 (PT, "Bảo bình", "Bảo bình Công Đào Phú Quý kênh đuôi 3D", "Công đào", "chiếc", [h("MR230", 90, 15000000)]),
 (PT, "Bảo bình", "Bảo bình Công Đào Phú Quý hoa kênh", "Công đào", "chiếc", [h("MR231", 90, 11250000)]),
 (PT, "Bảo bình", "Bảo bình Phúc Lộc Thọ kênh đuôi 3D", "", "chiếc", [h("MR232", 90, 16250000)]),
 (PT, "Bảo bình", "Bảo bình Phúc Lộc Thọ hoa kênh", "", "chiếc", [h("MR233", 90, 12500000)]),
 (PT, "Thống", "Thống sen cá", "Sen", "đôi", [d("MR248", 50, 15000000), d("MR249", 45, 12500000)]),
]


def t(ht, hv, size, p_ht, p_hv, note="", unit=None):
    return (ht, hv, size, p_ht, p_hv, note, unit)


def th(ht, hv, cm, p_ht, p_hv, note="", unit=None):
    return t(ht, hv, f"H{cm}", p_ht, p_hv, "; ".join(x for x in [f"H:{cm}cm", note] if x), unit)


def td(ht, hv, cm, p_ht, p_hv, note="", unit=None):
    return t(ht, hv, f"Ø{cm}", p_ht, p_hv, note, unit)


RONG = "chỉ có họa tiết rồng"

HOANG_THO = [
 ("Bộ đỉnh hạc", "Đỉnh hạc", "Đỉnh hạc tai mây", "Mây", "bộ", [
   t("HT067", "HT068", "S1 (H65)", 20500000, 38220000, "H:65cm"), t("HT069", "HT070", "S2 (H52)", 17000000, 31920000, "H:52cm")]),
 ("Bát hương", "Bát hương", "Bát hương rồng/sen", "Rồng/Sen", "cái", [
   td("HT017", "HT018", 30, 2950000, 7665000, RONG), td("HT015", "HT016", 28, 2450000, 6405000, RONG),
   td("HT013", "HT014", 25, 1950000, 5145000), td("HT011", "HT012", 22, 1450000, 4200000),
   td("HT009", "HT010", 20, 1200000, 3570000), td("HT007", "HT008", 18, 950000, 3150000),
   td("HT005", "HT006", 16, 750000, 2730000, "có thêm họa tiết thần tài"), td("HT003", "HT004", 14, 625000, 2415000),
   td("HT001", "HT002", 12, 550000, 1995000, RONG)]),
 ("Đế sứ bát hương", "Đế sứ bát hương", "Chân bát hương rồng/sen", "Rồng/Sen", "cái", [
   td("HT035", "HT036", 30, 875000, 2310000, RONG), td("HT033", "HT034", 28, 800000, 2100000, RONG),
   td("HT031", "HT032", 25, 675000, 1785000), td("HT029", "HT030", 22, 600000, 1638000),
   td("HT027", "HT028", 20, 550000, 1470000), td("HT025", "HT026", 18, 500000, 1323000),
   td("HT023", "HT024", 16, 425000, 1218000), td("HT021", "HT022", 14, 375000, 1050000),
   td("HT019", "HT020", 12, 325000, 840000, RONG)]),
 ("Lộc bình", LB, "Lọ lượn/lọ lộc bình rồng/sen", "Rồng/Sen", "đôi", [
   th("HT047", "HT048", 35, 1887500, 4830000), th("HT045", "HT046", 32, 1750000, 4515000),
   th("HT043", "HT044", 28, 1450000, 4032000), th("HT041", "HT042", 24, 1250000, 3255000, pdf("Lọ lộc bình rồng/sen H24"))]),
 ("Lộc bình", LB, "Lọ lượn/lọ lộc bình công đào", "Công đào", "đôi", [
   th("HT053", "HT054", 35, 2137500, 5145000), th("HT051", "HT052", 32, 2000000, 4725000), th("HT049", "HT050", 28, 1700000, 4305000)]),
 ("Lộc bình", LB, "Lọ lộc bình sen", "Sen", "đôi", [th("HT055", "HT056", 42, 3875000, 8925000)]),
 ("Lộc bình", LB, "Lọ lộc bình công đào", "Công đào", "đôi", [th("HT057", "HT058", 42, 4625000, 9870000)]),
 ("Lộc bình", LB, "Lọ lộc bình béo công đào", "Công đào", "đôi", [
   th("HT063", "HT064", 60, 10000000, 23205000), th("HT059", "HT060", 50, 6500000, 15540000)]),
 ("Lộc bình", LB, "Lọ lộc bình béo Phúc Đức", "", "đôi", [
   th("HT065", "HT066", 60, None, 25305000, "PDF ghi giá hoàng thổ 107.500.000 (cao hơn giá vẽ vàng) – để trống, cần kiểm tra"),
   th("HT061", "HT062", 50, 7250000, 15855000)]),
 ("Lộc bình", LB, "Lọ lộc bình Công Đào/Phúc Đức/PLT kênh hoa", "", "đôi", [
   th("HT161", "HT162", 160, 62500000, 143850000), th("HT159", "HT160", 140, 45000000, 101850000)]),
 ("Lọ hoa", LB, "Lọ huệ rồng/sen", "Rồng/Sen", "đôi", [
   th("HT039", "HT040", 25, 1250000, 3255000), th("HT037", "HT038", 20, 1050000, 2625000)]),
 ("Chóe thờ", "Chóe", "Chóe công đào", "Công đào", "đôi", [th("HT089", "HT090", 25, 1750000, 3465000)]),
 ("Chóe thờ", "Chóe", "Chóe rồng/sen", "Rồng/Sen", "cái", [
   th("HT091", "HT092", 25, 1625000, 3150000, "", "đôi"),
   t("HT093", "HT094", "S1", 562500, 1323000), t("HT095", "HT096", "S2", 462500, 1155000), t("HT097", "HT098", "S3", 387500, 987000)]),
 ("Chóe thờ", "Chóe", "Chóe bày công đào", "Công đào", "đôi", [
   t("HT157", "HT158", "50L", 31250000, 53550000, "H:75cm - 50L"), t("HT153", "HT154", "30L", 22500000, 37800000, "H:65cm - 30L")]),
 ("Chóe thờ", "Chóe", "Chóe bày Phúc Đức/PLT", "", "đôi", [t("HT155", "HT156", "30L", 22500000, 39900000, "H:65cm - 30L")]),
 ("Mâm bồng – Đĩa sen", "Mâm bồng", "Mâm bồng", "", "cái", [
   td("HT081", "HT082", 35, 1375000, 3570000), td("HT079", "HT080", 32, 1175000, 2940000), td("HT077", "HT078", 29, 1050000, 2415000),
   td("HT075", "HT076", 26, 912500, 2100000), td("HT073", "HT074", 23, 787500, 1953000), td("HT071", "HT072", 20, 650000, 1743000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ ngai 3 chén", "", "bộ", [t("HT121", "HT122", "", 475000, 1260000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ ngai 5 chén", "", "bộ", [t("HT123", "HT124", "", 600000, 1617000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ cong 3 chén sen", "Sen", "bộ", [t("HT125", "HT126", "", 475000, 1260000)]),
 ("Kỉ – Chén kỉ", "Kỷ chén", "Kỷ cong 5 chén sen", "Sen", "bộ", [t("HT127", "HT128", "", 600000, 1617000)]),
 ("Bát sâm", "Bát trà sâm", "Bát sâm", "", "bộ", [t("HT147", "HT148", "", 412500, 1260000)]),
 ("Nậm rượu – Bộ rượu cúng", "Nậm rượu", "Nậm rượu rồng/sen", "Rồng/Sen", "cái", [
   t("HT083", "HT084", "S1", 562500, 1323000), t("HT085", "HT086", "S2", 462500, 1155000), t("HT087", "HT088", "S3", 387500, 987000)]),
 ("Ống hương", "Ống hương", "Ống hương", "", "cái", [
   t("HT099", "HT100", "S1", 625000, 1575000, "H:24cm"), t("HT101", "HT102", "S2", 525000, 1365000, "H:20cm"),
   t("HT103", "HT104", "S3", 450000, 1197000, "H:17cm")]),
 ("Hũ phật thủ", "Hũ phật thủ", "Ly phật thủ", "", "cái", [t("HT137", "HT138", "S1", 500000, 1470000), t("HT139", "HT140", "S2", 375000, 1260000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn dầu rồng/sen", "Rồng/Sen", "cái", [
   t("HT105", "HT106", "S1", 712500, 1890000), t("HT107", "HT108", "S2", 600000, 1554000), t("HT109", "HT110", "S3", 525000, 1155000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn dầu chân đồng sen", "Sen", "cái", [t("HT111", "HT112", "", 950000, 1890000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn dầu chân đồng đào thọ", "", "cái", [
   t("HT113", "HT114", "S1", 1050000, 2205000), t("HT115", "HT116", "S2", 950000, 1890000)]),
 ("Đèn thờ", "Đèn dầu", "Đèn dầu dáng chân nến rồng/sen bọc đồng", "Rồng/Sen", "cái", [t("HT117", "HT118", "", 1000000, 1890000)]),
 ("Bộ trà thờ", "Bộ trà", "Bộ trà 3 chén", "", "bộ", [t("HT129", "HT130", "", 600000, 1953000)]),
 ("Bộ trà thờ", "Bộ trà", "Bộ trà 5 chén", "", "bộ", [t("HT131", "HT132", "", 737500, 2100000)]),
 ("Bộ trà thờ", "Bộ trà", "Đĩa bộ trà 3 (lẻ)", "", "cái", [t("HT133", "HT134", "", 237500, 630000)]),
 ("Bộ trà thờ", "Bộ trà", "Đĩa bộ trà 5 (lẻ)", "", "cái", [t("HT135", "HT136", "", 312500, 735000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Chân nến thấp", "", "cái", [t("HT119", "HT120", "", 225000, 693000)]),
 ("Khay trầu – Chân nến", "Chân nến", "Đĩa trầu cao", "", "cái", [t("HT141", "HT142", "", 312500, 861000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát cúng sen", "Sen", "cái", [t("HT143", "HT144", "", 112500, 483000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát cúng rồng", "Rồng", "cái", [t("HT145", "HT146", "", 150000, 525000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bát gà", "", "cái", [t("HT149", "HT150", "", 1000000, 2415000)]),
 ("Bộ đồ ăn cúng", "Bộ đồ ăn cúng", "Bộ mặt trời sen", "Sen", "bộ", [td("HT151", "HT152", 45, 3450000, 7980000)]),
]


def rows():
    """Các biến thể men rạn rồi hoàng thổ: (mã, nhóm, tên, họa tiết, quy cách, dòng men, ĐVT, giá, ghi chú)."""
    for _sec, grp, name, pat, unit, sizes in MEN_RAN:
        for code, size, price, note, u in sizes:
            yield code, grp, name, pat, size, MR, u or unit, price, note
    for _sec, grp, name, pat, unit, sizes in HOANG_THO:
        for c1, c2, size, p1, p2, note, u in sizes:
            yield c1, grp, name, pat, size, HT, u or unit, p1, note
            yield c2, grp, name, pat, size, HV, u or unit, p2, note
