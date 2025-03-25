from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
import csv
from .models import NH,MH,PKKH, KH,Bill,Bill_Line
from django.db.models import F, ExpressionWrapper, FloatField
import json
from django.db import transaction
from django.utils.timezone import make_aware
import datetime
from .forms import UploadFileForm, CustomerForm, NHForm, MHForm
from django.core.paginator import Paginator
from django.db.models import Sum, F, ExpressionWrapper, FloatField
from django.db import transaction
from django.utils.timezone import now
# xử lý đơn hàng
# list đơn hàng
from django.core.paginator import Paginator

def order_list(request):
    # Lấy 50 đơn hàng mới nhất
    orders = Bill.objects.select_related('Ma_KH').order_by('-Thoi_gian')[:50]

    # Gộp tất cả các bill_lines của 50 đơn hàng
    all_bill_lines = Bill_Line.objects.filter(Bill_id__in=orders).select_related('Ma_MH', 'Bill_id')
    # Tính tổng tiền cho từng bill_line trước khi gửi đến template
    for line in all_bill_lines:
        line.total_price = line.SL * line.Ma_MH.Don_Gia  # Tính thành tiền
    # Phân trang bill_lines (10 sản phẩm mỗi trang)
    paginator = Paginator(all_bill_lines, 10)
    page_number = request.GET.get('page')
    page_bill_lines = paginator.get_page(page_number)

    return render(request, 'order_list.html', {
        'orders': orders,  # Chỉ để lấy thông tin khách hàng
        'bill_lines': page_bill_lines  # Phân trang theo bill_lines
    })

# chi tiết đơn hàng
def order_detail(request, bill_id):
    bill = get_object_or_404(Bill, Bill_id=bill_id)
    bill_lines = Bill_Line.objects.filter(Bill_id=bill)
    
    # Tính tổng tiền cho từng dòng sản phẩm
    for line in bill_lines:
        line.total_price = line.SL * line.Ma_MH.Don_Gia

    total_amount = sum(line.total_price for line in bill_lines)

    return render(request, 'order_detail.html', {
        'bill': bill, 
        'bill_lines': bill_lines,
        'total_amount': total_amount
    })



def get_products(request):
    ma_nh = request.GET.get('ma_nh')  # ✅ Lấy mã nhóm hàng từ request

    if ma_nh:
        products = MH.objects.filter(Ma_NH__Ma_NH=ma_nh).values('Ma_MH', 'Ten_MH', 'Don_Gia')  # ✅ Lọc theo chuỗi Ma_NH
        return JsonResponse(list(products), safe=False)

    return JsonResponse([], safe=False)  # ✅ Trả về danh sách rỗng nếu không có nhóm hàng nào


# thêm đơn hàng
@transaction.atomic
def add_order(request):
    if request.method == 'POST':
        ten_kh = request.POST.get('ten_kh')
        ma_pkkh = request.POST.get('ma_pkkh')
        
        # Tạo khách hàng nếu chưa tồn tại
        pkkh, _ = PKKH.objects.get_or_create(Ma_PKKH=ma_pkkh, defaults={'Mo_Ta': ma_pkkh})
        khach_hang, _ = KH.objects.get_or_create(Ten_KH=ten_kh, Ma_PKKH=pkkh)

        # Tạo đơn hàng mới
        bill = Bill.objects.create(Ma_KH=khach_hang)

        total_amount = 0
        products = request.POST.getlist('ma_mh[]')
        quantities = request.POST.getlist('sl[]')

        for ma_mh, sl in zip(products, quantities):
            mat_hang = MH.objects.get(Ma_MH=ma_mh)
            sl = int(sl)
            total_amount += sl * mat_hang.Don_Gia
            Bill_Line.objects.create(Bill_id=bill, Ma_MH=mat_hang, SL=sl)

        return redirect('order_list')

    nhom_hangs = NH.objects.all()
    pkkh_list = PKKH.objects.all()
    
    return render(request, 'add_order.html', {'nhom_hangs': nhom_hangs, 'pkkh_list': pkkh_list})
# Create khách hàng
# Danh sách khách hàng (có phân trang)
def list_customers(request):
    customers = KH.objects.all().order_by('id')[:50]
    paginator = Paginator(customers, 10)  # Mỗi trang 10 khách hàng
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'customer_list.html', {'page_obj': page_obj})
# Thêm khách hàng
def add_customer(request):
    if request.method == 'POST':
        form = CustomerForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('list_customers')
    else:
        form = CustomerForm()
    
    return render(request, 'customer_form.html', {'form': form})
# Xóa khách hàng
def delete_customer(request, Ma_KH):
    customer = get_object_or_404(KH, Ma_KH=Ma_KH)
    customer.delete()
    return redirect('list_customers')
# Chi tiết khách hàng
def customer_detail(request, Ma_KH):
    customer = get_object_or_404(KH, Ma_KH=Ma_KH)
    
    # Lấy thông tin phân khúc khách hàng
    pkkh_mo_ta = customer.Ma_PKKH.Mo_Ta  

    # Tính tổng số lần mua hàng
    bills = Bill.objects.filter(Ma_KH=customer)
    # Tính tổng số đơn hàng đã đặt
    total_orders = bills.count()

    # Tính tổng số tiền đã chi tiêu
    # Tính tổng số tiền đã chi tiêu
    total_spent = Bill_Line.objects.filter(Bill_id__in=bills).aggregate(
        total_spent=Sum(ExpressionWrapper(F('SL') * F('Ma_MH__Don_Gia'), output_field=FloatField()))
    )['total_spent'] or 0  # Nếu `None`, thay bằng `0`

    # Danh sách các Bill_Line đã mua
    bill_lines = Bill_Line.objects.filter(Bill_id__in=bills).select_related('Ma_MH')
    for line in bill_lines:
        line.total_price = line.SL * line.Ma_MH.Don_Gia  # Tính tổng tiền của mỗi dòng

    context = {
        'customer': customer,
        'pkkh_mo_ta': pkkh_mo_ta,
        'total_orders': total_orders,
        'total_spent': total_spent,
        'bill_lines': bill_lines,
    }
    return render(request, 'customer_detail.html', context)
def home(request):
    return render(request, 'home.html') 

# upload file

def upload_csv(request):
    success_count = 0
    error_count = 0
    error_details = []
    form = UploadFileForm()  # Luôn khởi tạo form

    if request.method == "POST":  
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            file = request.FILES['file']
            try:
                decoded_file = file.read().decode('utf-8').splitlines()
            except UnicodeDecodeError:
                return HttpResponse("File không đúng định dạng UTF-8.")

            reader = csv.DictReader(decoded_file)
            try:
                for row in reader:
                    # Nếu bất kỳ giá trị nào trong dòng là None hoặc rỗng, bỏ qua dòng đó
                    # if any(value == "" for value in row.values()):
                    #     print(f"Bỏ qua dòng: {row}")  # Debug xem dòng nào bị bỏ qua
                    #     continue
                    try:
                        tg = make_aware(datetime.datetime.strptime(row['Thời gian tạo đơn'], "%Y-%m-%d %H:%M:%S"))
                    except ValueError as e:
                        print('Lỗi xử lý ngày:', e)
                        continue
                    # quan trọng phải cho giá trị vào biến trước khi thêm để tránh nhậm dữ liệu
                    ten_kh = row['Tên khách hàng'] 
                    ma_pkkh = row['Mã PKKH']
                    mo_ta = row['Mô tả Phân Khúc Khách hàng']
                    ma_mh = row['Mã mặt hàng']
                    ten_mh = row['Tên mặt hàng']
                    ten_nh = row['Tên nhóm hàng']
                    ma_nh = row['Mã nhóm hàng']
                    sl = row['SL']
                    don_gia = row['Đơn giá']
                    ma_kh = row['Mã khách hàng']
                    ma_dh = row['Mã đơn hàng']

                    try:
                        sl = int(sl) if sl else 0
                        don_gia = float(don_gia) if don_gia else 0.0
                    except ValueError as e:
                        print(f"Lỗi chuyển đổi dữ liệu: {e}")
                        continue

                    # Xử lý dữ liệu
                    pkkh, _ = PKKH.objects.get_or_create(
                        Ma_PKKH=ma_pkkh,
                        defaults={"Mo_Ta": mo_ta}
                    )
                    # last_kh = KH.objects.order_by('-id').first()
                    # new_kh_id = f"CUZ{int(last_kh.Ma_KH[3:]) + 1:05d}" if last_kh else "CUZ00001"

                    kh, _ = KH.objects.get_or_create(
                        Ma_KH=ma_kh,
                        defaults={"Ten_KH": ten_kh, "Ma_PKKH": pkkh}
                    )

                    nh, _ = NH.objects.get_or_create(
                        Ma_NH=ma_nh,
                        defaults={"Ten_NH": ten_nh}
                    )

                    mh, _ = MH.objects.get_or_create(
                        Ma_MH=ma_mh,
                        defaults={"Ten_MH": ten_mh, "Don_Gia": don_gia, "Ma_NH": nh}
                    )

                    # last_bill = Bill.objects.order_by('-id').first()
                    # new_bill_id = f"ORD{int(last_bill.Bill_id[3:]) + 1:07d}" if last_bill else "ORD0000001"

                    bill, _ = Bill.objects.get_or_create(
                        Bill_id=ma_dh,
                        defaults={"Thoi_gian": tg, "Ma_KH": kh}
                    )

                    last_line = Bill_Line.objects.order_by('-id').first()
                    new_line_id = f"LN{int(last_line.Line_id[2:]) + 1:05d}" if last_line else "LN00001"

                    Bill_Line.objects.create(
                        Line_id=new_line_id,
                        SL=sl,
                        Bill_id=bill,
                        Ma_MH=mh
                    )

                    success_count += 1
                    print('Đã thêm: ', success_count)

            except Exception as e:
                error_count += 1
                error_details.append(str(e))
                print('Lỗi xử lý hàng:', e)

            return render(request, "upload_file.html", {
                "success_count": success_count,
                "error_count": error_count,
                "error_details": error_details,
                "form": form  # Đảm bảo form luôn được truyền vào
            })

    return render(request, "upload_file.html", {"form": form})

# tạo data dữ liệu
def join_data(request):
    # Truy vấn dữ liệu 
    bill = Bill.objects.select_related(
        'Ma_KH', 'Ma_KH__Ma_PKKH' # nối từ bill -> KH -> PKKH
    ).prefetch_related(
        'bill_line_set__Ma_MH__Ma_NH' # nối từ bill->bill_line->MH->NH
    ).annotate(
        ma_KH = F('Ma_KH__Ma_KH'),
        ten_KH= F('Ma_KH__Ten_KH'),
        mo_Ta = F('Ma_KH__Ma_PKKH__Mo_Ta'),
        line_id = F('bill_lines__Line_id'),
        sL = F('bill_lines__SL'),
        ma_MH = F('bill_lines__Ma_MH__Ma_MH'),
        ten_MH = F('bill_lines__Ma_MH__Ten_MH'),
        don_Gia = F('bill_lines__Ma_MH__Don_Gia'),
        total = ExpressionWrapper(F('bill_lines__SL') * F('bill_lines__Ma_MH__Don_Gia'), output_field=FloatField()),
        ma_NH = F('bill_lines__Ma_MH__Ma_NH__Ma_NH'),
        ten_NH = F('bill_lines__Ma_MH__Ma_NH__Ten_NH')
    ).values(
        'Bill_id', 'Thoi_gian', 
        'ma_KH', 'ten_KH', 'mo_Ta',
        'line_id', 'sL', 'ma_MH', 'ten_MH',
        'don_Gia', 'total', 'ma_NH', 'ten_NH'
    )

    # TRuyền context cho template
    # Chuyển QuerySet thành JSON
    bill_list = list(bill)  # Chuyển QuerySet thành danh sách
    for b in bill_list:
        b['Thoi_gian'] = b['Thoi_gian'].isoformat() if b['Thoi_gian'] else None
    context = {'data': json.dumps(bill_list)}  # JSON hóa dữ liệu
    
    return render(request, 'main.html', context)

def list_NH(request):
    nhom_hang = NH.objects.all()
    return render(request, 'list_NH.html', {'nhom_hang': nhom_hang})

def add_NH(request):
    if request.method == "POST":
        form = NHForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('list_NH')
    else:
        form = NHForm()
    return render(request, 'add_NH.html', {'form': form})

def update_NH(request, nh_id):
    nh = get_object_or_404(NH, id=nh_id)
    if request.method == 'POST':
        form = NHForm(request.POST, request.FILES, instance=nh)
        if form.is_valid():
            form.save()
            return redirect('list_NH')  # Quay lại danh sách NH sau khi cập nhật
    else:
        form = NHForm(instance=nh)
    return render(request, 'update_nh.html', {'form': form, 'nh': nh})


def list_MH(request, nh_id):
    nhom_hang = get_object_or_404(NH, id=nh_id)
    mat_hang = MH.objects.filter(Ma_NH=nhom_hang)
    return render(request, 'list_MH.html', {'nhom_hang': nhom_hang, 'mat_hang': mat_hang})

def add_MH(request, nh_id):
    nhom_hang = get_object_or_404(NH, id=nh_id)
    if request.method == "POST":
        form = MHForm(request.POST, request.FILES)
        if form.is_valid():
            mat_hang = form.save(commit=False)
            mat_hang.Ma_NH = nhom_hang
            mat_hang.save()
            return redirect('list_MH', nh_id=nh_id)
    else:
        form = MHForm()
    return render(request, 'add_MH.html', {'form': form, 'nhom_hang': nhom_hang})
def update_MH(request, mh_id):
    mh = get_object_or_404(MH, id=mh_id)  # Lấy đối tượng MH theo ID
    if request.method == 'POST':
        form = MHForm(request.POST, request.FILES, instance=mh)
        if form.is_valid():
            form.save()
            return redirect('list_MH', nh_id=mh.Ma_NH.id)  # Quay lại danh sách MH của NH tương ứng
    else:
        form = MHForm(instance=mh)
    return render(request, 'update_mh.html', {'form': form, 'mh': mh})