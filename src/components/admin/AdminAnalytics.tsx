import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Eye, Globe, Smartphone, Monitor, Tablet } from "lucide-react";

interface VisitStats {
  today: number;
  week: number;
  month: number;
  total: number;
  topPages: { page: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  devices: { mobile: number; tablet: number; desktop: number };
  dailyVisits: { date: string; count: number }[];
}

const AdminAnalytics = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ total: 0, revenue: 0, avgOrder: 0, pending: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [todayRes, weekRes, monthRes, allRes, ordersRes] = await Promise.all([
      supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      supabase.from("page_visits").select("*").gte("created_at", monthStart).order("created_at", { ascending: false }).limit(1000),
      supabase.from("orders").select("*"),
    ]);

    const visits = allRes.data || [];

    // Top pages
    const pageCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    let mobile = 0, tablet = 0, desktop = 0;
    const dailyMap: Record<string, number> = {};

    for (const v of visits) {
      pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
      if (v.referrer) referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;

      const ua = (v.user_agent || "").toLowerCase();
      if (/mobile|android|iphone/.test(ua) && !/tablet|ipad/.test(ua)) mobile++;
      else if (/tablet|ipad/.test(ua)) tablet++;
      else desktop++;

      const day = new Date(v.created_at).toISOString().split("T")[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer: referrer || "Directo", count }));

    const dailyVisits = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    setStats({
      today: todayRes.count || 0,
      week: weekRes.count || 0,
      month: monthRes.count || 0,
      total: visits.length,
      topPages,
      topReferrers,
      devices: { mobile, tablet, desktop },
      dailyVisits,
    });

    // Order stats
    const orders = ordersRes.data || [];
    const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
    setOrderStats({
      total: orders.length,
      revenue,
      avgOrder: orders.length > 0 ? revenue / orders.length : 0,
      pending: pendingOrders,
    });

    setLoading(false);
  };

  if (loading) return <p className="font-sans text-sm text-muted-foreground">Cargando analíticas...</p>;
  if (!stats) return <p className="font-sans text-sm text-muted-foreground">Sin datos disponibles.</p>;

  const statCards = [
    { label: "Visitas hoy", value: stats.today, icon: Eye },
    { label: "Últimos 7 días", value: stats.week, icon: TrendingUp },
    { label: "Últimos 30 días", value: stats.month, icon: Globe },
    { label: "Pedidos totales", value: orderStats.total, icon: Eye },
    { label: "Ingresos totales", value: `$${orderStats.revenue.toLocaleString()}`, icon: TrendingUp },
    { label: "Ticket promedio", value: `$${Math.round(orderStats.avgOrder).toLocaleString()}`, icon: TrendingUp },
    { label: "Pedidos pendientes", value: orderStats.pending, icon: Eye },
  ];

  const maxDaily = Math.max(...stats.dailyVisits.map(d => d.count), 1);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <div key={i} className="p-4 border border-foreground/[0.08] bg-secondary/20 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
            <p className="font-mono text-xl md:text-2xl text-foreground tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily visits chart (simple bar) */}
      {stats.dailyVisits.length > 0 && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Visitas diarias (30 días)</p>
          <div className="border border-foreground/[0.08] p-4">
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {stats.dailyVisits.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1 min-w-[20px] flex-1">
                  <span className="font-mono text-[8px] text-muted-foreground tabular-nums">{d.count}</span>
                  <div
                    className="w-full bg-accent/60 min-h-[2px]"
                    style={{ height: `${(d.count / maxDaily) * 100}%` }}
                  />
                  <span className="font-mono text-[7px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top pages */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Páginas más visitadas</p>
          <div className="border border-foreground/[0.08]">
            {stats.topPages.length === 0 ? (
              <p className="p-4 font-sans text-sm text-muted-foreground">Sin datos</p>
            ) : stats.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                <span className="font-mono text-xs text-foreground truncate">{p.page}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground ml-2">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referrers */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Fuentes de tráfico</p>
          <div className="border border-foreground/[0.08]">
            {stats.topReferrers.length === 0 ? (
              <p className="p-4 font-sans text-sm text-muted-foreground">Sin datos (tráfico directo)</p>
            ) : stats.topReferrers.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                <span className="font-mono text-xs text-foreground truncate">{r.referrer}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground ml-2">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dispositivos</p>
          <div className="border border-foreground/[0.08]">
            {[
              { icon: Smartphone, label: "Móvil", count: stats.devices.mobile },
              { icon: Tablet, label: "Tablet", count: stats.devices.tablet },
              { icon: Monitor, label: "Desktop", count: stats.devices.desktop },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                <d.icon size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="font-sans text-sm text-foreground flex-1">{d.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{d.count}</span>
                <span className="font-mono text-[10px] tabular-nums text-accent">
                  {stats.month > 0 ? `${Math.round((d.count / stats.month) * 100)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
