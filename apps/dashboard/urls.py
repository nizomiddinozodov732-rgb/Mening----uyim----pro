from django.urls import path
from .views import (
    DashboardStatsView, ServerStatusView, TopUsersView,
    AdminUsersListView, AdminPropertiesView, AdminComplaintsView,
    AdminPaymentsView, HomeStatsView,
)
from .views_extra import (
    CommandCenterView, AIMonitoringView, RegionStatsView,
    BusinessAnalyticsView, RevenueCenterView, VerifiedCenterView,
    MarketingCenterView, MassNotificationView, AuditLogView,
    ConstructionProjectsView, SecurityCenterView, BlockIPView,
    AdminPasswordChangeView, SiteSettingView, NewsView, OnlineUsersView,
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('home-stats/', HomeStatsView.as_view(), name='home_stats'),
    path('server-status/', ServerStatusView.as_view(), name='server_status'),
    path('top-users/', TopUsersView.as_view(), name='top_users'),
    path('users/', AdminUsersListView.as_view(), name='admin_users'),
    path('properties/', AdminPropertiesView.as_view(), name='admin_properties'),
    path('complaints/', AdminComplaintsView.as_view(), name='admin_complaints'),
    path('payments/', AdminPaymentsView.as_view(), name='admin_payments'),
    # New Super Admin endpoints
    path('command-center/', CommandCenterView.as_view(), name='command_center'),
    path('ai-monitoring/', AIMonitoringView.as_view(), name='ai_monitoring'),
    path('region-stats/', RegionStatsView.as_view(), name='region_stats'),
    path('business-analytics/', BusinessAnalyticsView.as_view(), name='business_analytics'),
    path('revenue-center/', RevenueCenterView.as_view(), name='revenue_center'),
    path('verified-center/', VerifiedCenterView.as_view(), name='verified_center'),
    path('marketing/', MarketingCenterView.as_view(), name='marketing'),
    path('notifications/', MassNotificationView.as_view(), name='notifications'),
    path('audit-logs/', AuditLogView.as_view(), name='audit_logs'),
    path('projects/', ConstructionProjectsView.as_view(), name='projects'),
    path('security/', SecurityCenterView.as_view(), name='security'),
    path('security/block-ip/', BlockIPView.as_view(), name='block_ip'),
    path('change-password/', AdminPasswordChangeView.as_view(), name='change_password'),
    path('settings/', SiteSettingView.as_view(), name='site_settings'),
    path('news/', NewsView.as_view(), name='news'),
    path('online-users/', OnlineUsersView.as_view(), name='online_users'),
]
