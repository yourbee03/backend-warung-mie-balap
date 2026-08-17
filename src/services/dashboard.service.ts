import dashboardRepository from '../repositories/dashboard.repository';

export class DashboardService {
  async getStats() {
    return dashboardRepository.getStats();
  }

  async getRecentOrders(limit?: number) {
    return dashboardRepository.getRecentOrders(limit);
  }

  async getTopProducts(limit?: number) {
    return dashboardRepository.getTopProducts(limit);
  }

  async getSalesChart(days?: number) {
    return dashboardRepository.getSalesChart(days);
  }
}

export default new DashboardService();
