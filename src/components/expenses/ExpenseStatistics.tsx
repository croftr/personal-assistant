import { Receipt, FileText, Utensils, Car, Hotel, Package } from "lucide-react";

interface ExpenseStatisticsProps {
  statistics: {
    total_reports: number;
    total_expenses: number;
    total_amount: number;
    categories: {
      meals: { count: number; amount: number };
      travel: { count: number; amount: number };
      accommodation: { count: number; amount: number };
      other: { count: number; amount: number };
    };
  };
}

export function ExpenseStatistics({ statistics }: ExpenseStatisticsProps) {
  return (
    <div className="space-y-3">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">Total Reports</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{statistics.total_reports}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-600/20 border border-green-500/30">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Total Expenses</p>
          </div>
          <p className="text-xl font-bold text-green-400">{statistics.total_expenses}</p>
        </div>
      </div>

      {/* Total Amount */}
      <div className="p-4 rounded-lg bg-purple-600/20 border border-purple-500/30">
        <p className="text-xs text-gray-400 mb-1">Total Amount Claimed</p>
        <p className="text-2xl font-bold text-purple-400">£{statistics.total_amount.toFixed(2)}</p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Category Breakdown</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-orange-600/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-3 h-3 text-orange-400" />
              <p className="text-xs text-gray-400">Meals</p>
            </div>
            <p className="text-sm font-bold text-orange-400">
              {statistics.categories.meals.count} • £{statistics.categories.meals.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-cyan-600/10 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-gray-400">Travel</p>
            </div>
            <p className="text-sm font-bold text-cyan-400">
              {statistics.categories.travel.count} • £{statistics.categories.travel.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-pink-600/10 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Hotel className="w-3 h-3 text-pink-400" />
              <p className="text-xs text-gray-400">Accommodation</p>
            </div>
            <p className="text-sm font-bold text-pink-400">
              {statistics.categories.accommodation.count} • £{statistics.categories.accommodation.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-gray-600/10 border border-gray-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400">Other</p>
            </div>
            <p className="text-sm font-bold text-gray-300">
              {statistics.categories.other.count} • £{statistics.categories.other.amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
