from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    
    # URL upload
    path('upload/', views.upload_csv, name='upload_csv'),
    
    # URL trực quan
    path('viz/', views.join_data, name='viz'),
    
    # URL nhóm hàng (NH)
    path('nh/', views.list_NH, name='list_NH'),
    path('nh/add/', views.add_NH, name='add_NH'),
    path('nh/update/<int:nh_id>/', views.update_NH, name='update_NH'),

    
    # URL mặt hàng (MH)
    path('nh/<int:nh_id>/mh/', views.list_MH, name='list_MH'),
    path('nh/<int:nh_id>/mh/add/', views.add_MH, name='add_MH'),
    path('mh/update/<int:mh_id>/', views.update_MH, name='update_MH'),

    # URL đơn hàng
    path('orders/', views.order_list, name='order_list'),
    path('order/<str:bill_id>/', views.order_detail, name='order_detail'),
    path('add-order/', views.add_order, name='add_order'),
    path('get-products/', views.get_products, name='get_products'),
    

    # URL khách hàng
    path('list/', views.list_customers, name='list_customers'),
    path('add/', views.add_customer, name='add_customer'),
    path('delete/<str:Ma_KH>/', views.delete_customer, name='delete_customer'),
    path('<str:Ma_KH>/', views.customer_detail, name='customer_detail'),

    
    
]

# Phục vụ file media (hình ảnh sản phẩm, nhóm hàng)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
